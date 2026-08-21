import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Student, CheckIn, StudentDocument, StudentFolder, TrainingPlan, NutritionPlan, DietHistoryEntry } from '@/types';
import { mockStudents } from '@/mocks/students';
import * as api from '@/utils/api';

const STORAGE_KEY = 'coach_students';

export const [StudentsProvider, useStudents] = createContextHook(() => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSynced, setIsSynced] = useState<boolean>(false);
  // Mirror of `students` that is always current within the same tick.
  const studentsRef = useRef<Student[]>([]);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        // 1. Try to load from backend first
        const remote = await api.fetchStudents();
        if (remote && remote.length > 0) {
          studentsRef.current = remote;
          setStudents(remote);
          setIsSynced(true);
          // Cache locally for offline fallback
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
        } else {
          throw new Error('empty remote');
        }
      } catch (_err) {
        // 2. Fall back to AsyncStorage
        try {
          const stored = await AsyncStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored) as Student[];
            studentsRef.current = parsed;
            setStudents(parsed);
            // Try to migrate in background
            api.migrateStudents(parsed).then(() => setIsSynced(true)).catch(() => {});
          } else {
            // 3. Last resort: mock data, then migrate
            studentsRef.current = mockStudents;
            setStudents(mockStudents);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mockStudents));
            api.migrateStudents(mockStudents).then(() => setIsSynced(true)).catch(() => {});
          }
        } catch (e) {
          console.log('Error loading students:', e);
          studentsRef.current = mockStudents;
          setStudents(mockStudents);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mockStudents));
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadStudents();
  }, []);

  const saveStudents = useCallback(async (updated: Student[]) => {
    studentsRef.current = updated;
    setStudents(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  /**
   * Apply a mutation against the LATEST students state, not a stale closure copy.
   * Two mutations firing in the same tick (e.g. a check-in that also bumps weight,
   * or the AI writing a document while the profile is being edited) used to clobber
   * each other because both read `students` from their own closure.
   *
   * Uses a mirror ref rather than setStudents(prev => ...) because the functional
   * updater does not run synchronously — we need the resulting array immediately
   * in order to persist it.
   */
  const mutateStudents = useCallback(
    async (mutator: (prev: Student[]) => Student[]): Promise<Student[]> => {
      const next = mutator(studentsRef.current);
      studentsRef.current = next;
      setStudents(next);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    },
    []
  );

  const addStudent = useCallback(async (student: Omit<Student, 'id' | 'checkIns' | 'createdAt'>) => {
    try {
      const created = await api.createStudent(student);
      const updated = (prev: Student[]) => [...prev, created];
      await mutateStudents(updated);
      return created;
    } catch {
      // Fallback to local-only
      const newStudent: Student = {
        ...student,
        id: Date.now().toString(),
        checkIns: [],
        createdAt: new Date().toISOString().split('T')[0],
      };
      const updated = (prev: Student[]) => [...prev, newStudent];
      await mutateStudents(updated);
      return newStudent;
    }
  }, [mutateStudents]);

  const updateStudent = useCallback(async (id: string, data: Partial<Student>) => {
    const updated = (prev: Student[]) => prev.map((s) => (s.id === id ? { ...s, ...data } : s));
    await mutateStudents(updated);
    // Sync to backend in background
    api.updateStudent(id, data).catch(() => {});
  }, [mutateStudents]);

  const deleteStudent = useCallback(async (id: string) => {
    const updated = (prev: Student[]) => prev.filter((s) => s.id !== id);
    await mutateStudents(updated);
    api.deleteStudent(id).catch(() => {});
  }, [mutateStudents]);

  const addCheckIn = useCallback(async (studentId: string, checkIn: Omit<CheckIn, 'id'>) => {
    const newCheckIn: CheckIn = {
      ...checkIn,
      id: Date.now().toString(),
    };
    const updated = (prev: Student[]) => prev.map((s) => {
      if (s.id === studentId) {
        return {
          ...s,
          checkIns: [...s.checkIns, newCheckIn],
          weight: checkIn.weight,
          bodyFatPercentage: checkIn.bodyFatPercentage ?? s.bodyFatPercentage,
        };
      }
      return s;
    });
    await mutateStudents(updated);
    // Sync to backend
    api.addCheckIn(studentId, newCheckIn).catch(() => {});
    return newCheckIn;
  }, [mutateStudents]);

  const getStudent = useCallback((id: string): Student | undefined => {
    return students.find((s) => s.id === id);
  }, [students]);

  const addDocument = useCallback(async (studentId: string, doc: Omit<StudentDocument, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newDoc: StudentDocument = {
      ...doc,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now,
    };
    const updated = (prev: Student[]) => prev.map((s) => {
      if (s.id === studentId) {
        return { ...s, documents: [...(s.documents || []), newDoc] };
      }
      return s;
    });
    await mutateStudents(updated);
    api.addDocument(studentId, newDoc).catch(() => {});
    return newDoc;
  }, [mutateStudents]);

  const deleteDocument = useCallback(async (studentId: string, docId: string) => {
    const updated = (prev: Student[]) => prev.map((s) => {
      if (s.id === studentId) {
        return { ...s, documents: (s.documents || []).filter((d) => d.id !== docId) };
      }
      return s;
    });
    await mutateStudents(updated);
    api.deleteDocument(studentId, docId).catch(() => {});
  }, [mutateStudents]);

  const updateDocument = useCallback(async (studentId: string, docId: string, data: Partial<StudentDocument>) => {
    const updated = (prev: Student[]) => prev.map((s) => {
      if (s.id === studentId) {
        return {
          ...s,
          documents: (s.documents || []).map((d) =>
            d.id === docId ? { ...d, ...data, updatedAt: new Date().toISOString() } : d
          ),
        };
      }
      return s;
    });
    await mutateStudents(updated);
    api.updateDocument(studentId, docId, data).catch(() => {});
  }, [mutateStudents]);

  const addFolder = useCallback(async (studentId: string, folder: Omit<StudentFolder, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newFolder: StudentFolder = {
      ...folder,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now,
    };
    const updated = (prev: Student[]) => prev.map((s) => {
      if (s.id === studentId) {
        return { ...s, folders: [...(s.folders || []), newFolder] };
      }
      return s;
    });
    await mutateStudents(updated);
    api.addFolder(studentId, newFolder).catch(() => {});
    return newFolder;
  }, [mutateStudents]);

  const updateFolder = useCallback(async (studentId: string, folderId: string, data: Partial<StudentFolder>) => {
    const updated = (prev: Student[]) => prev.map((s) => {
      if (s.id === studentId) {
        return {
          ...s,
          folders: (s.folders || []).map((f) =>
            f.id === folderId ? { ...f, ...data, updatedAt: new Date().toISOString() } : f
          ),
        };
      }
      return s;
    });
    await mutateStudents(updated);
    api.updateFolder(studentId, folderId, data).catch(() => {});
  }, [mutateStudents]);

  const deleteFolder = useCallback(async (studentId: string, folderId: string) => {
    const collectFolderIds = (id: string, allFolders: StudentFolder[]): string[] => {
      const children = allFolders.filter((f) => f.parentId === id);
      return [id, ...children.flatMap((c) => collectFolderIds(c.id, allFolders))];
    };
    const updated = (prev: Student[]) => prev.map((s) => {
      if (s.id === studentId) {
        const allFolders = s.folders || [];
        const idsToDelete = collectFolderIds(folderId, allFolders);
        return {
          ...s,
          folders: allFolders.filter((f) => !idsToDelete.includes(f.id)),
          documents: (s.documents || []).filter((d) => !d.folderId || !idsToDelete.includes(d.folderId)),
        };
      }
      return s;
    });
    await mutateStudents(updated);
    api.deleteFolder(studentId, folderId).catch(() => {});
  }, [mutateStudents]);

  const updateTrainingPlan = useCallback(async (studentId: string, plan: TrainingPlan) => {
    const updated = (prev: Student[]) => prev.map((s) => {
      if (s.id === studentId) {
        return { ...s, trainingPlan: plan };
      }
      return s;
    });
    await mutateStudents(updated);
    api.upsertTrainingPlan(studentId, plan).catch(() => {});
  }, [mutateStudents]);

  const deleteTrainingPlan = useCallback(async (studentId: string) => {
    const updated = (prev: Student[]) => prev.map((s) => {
      if (s.id === studentId) {
        return { ...s, trainingPlan: undefined };
      }
      return s;
    });
    await mutateStudents(updated);
    api.deleteTrainingPlan(studentId).catch(() => {});
  }, [mutateStudents]);

  const updateNutritionPlan = useCallback(async (studentId: string, plan: NutritionPlan) => {
    const updated = (prev: Student[]) => prev.map((s) => {
      if (s.id === studentId) {
        return { ...s, nutritionPlan: plan };
      }
      return s;
    });
    await mutateStudents(updated);
    api.upsertNutritionPlan(studentId, plan).catch(() => {});
  }, [mutateStudents]);

  const deleteNutritionPlan = useCallback(async (studentId: string) => {
    const updated = (prev: Student[]) => prev.map((s) => {
      if (s.id === studentId) {
        return { ...s, nutritionPlan: undefined };
      }
      return s;
    });
    await mutateStudents(updated);
    api.deleteNutritionPlan(studentId).catch(() => {});
  }, [mutateStudents]);

  const addDietHistoryEntry = useCallback(async (studentId: string, entry: Omit<DietHistoryEntry, 'id'>) => {
    const newEntry: DietHistoryEntry = {
      ...entry,
      id: Date.now().toString(),
    };
    const updated = (prev: Student[]) => prev.map((s) => {
      if (s.id === studentId) {
        return { ...s, dietHistory: [...(s.dietHistory || []), newEntry] };
      }
      return s;
    });
    await mutateStudents(updated);
    api.addDietEntry(studentId, newEntry).catch(() => {});
    return newEntry;
  }, [mutateStudents]);

  const getDietHistory = useCallback((studentId: string): DietHistoryEntry[] => {
    const student = students.find((s) => s.id === studentId);
    return student?.dietHistory || [];
  }, [students]);

  const getStudentDocuments = useCallback((studentId: string, folderId?: string): StudentDocument[] => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return [];
    const docs = student.documents || [];
    if (folderId) return docs.filter((d) => d.folderId === folderId);
    return docs;
  }, [students]);

  const getStudentFolders = useCallback((studentId: string): StudentFolder[] => {
    const student = students.find((s) => s.id === studentId);
    return student?.folders || [];
  }, [students]);

  const moveDocument = useCallback(async (studentId: string, docId: string, targetFolderId: string | undefined) => {
    const updated = (prev: Student[]) => prev.map((s) => {
      if (s.id === studentId) {
        return {
          ...s,
          documents: (s.documents || []).map((d) =>
            d.id === docId ? { ...d, folderId: targetFolderId, updatedAt: new Date().toISOString() } : d
          ),
        };
      }
      return s;
    });
    await mutateStudents(updated);
    api.moveDocument(studentId, docId, targetFolderId).catch(() => {});
  }, [mutateStudents]);

  const duplicateDocument = useCallback(async (studentId: string, docId: string, targetFolderId?: string) => {
    const student = studentsRef.current.find(s => s.id === studentId);
    const doc = student?.documents?.find(d => d.id === docId);
    if (!doc) return;
    const now = new Date().toISOString();
    const newDoc: StudentDocument = {
      ...doc,
      id: Date.now().toString(),
      name: `${doc.name} (copia)`,
      folderId: targetFolderId ?? doc.folderId,
      createdAt: now,
      updatedAt: now,
    };
    const updated = (prev: Student[]) => prev.map((s) => {
      if (s.id === studentId) {
        return { ...s, documents: [...(s.documents || []), newDoc] };
      }
      return s;
    });
    await mutateStudents(updated);
    api.duplicateDocument(studentId, docId, targetFolderId, newDoc.id).catch(() => {});
    return newDoc;
  }, [mutateStudents]);

  const moveFolder = useCallback(async (studentId: string, folderId: string, targetParentId: string | undefined) => {
    const updated = (prev: Student[]) => prev.map((s) => {
      if (s.id === studentId) {
        return {
          ...s,
          folders: (s.folders || []).map((f) =>
            f.id === folderId ? { ...f, parentId: targetParentId, updatedAt: new Date().toISOString() } : f
          ),
        };
      }
      return s;
    });
    await mutateStudents(updated);
    api.moveFolder(studentId, folderId, targetParentId).catch(() => {});
  }, [mutateStudents]);

  const stats = useMemo(() => {
    const totalCheckIns = students.reduce((sum, s) => sum + s.checkIns.length, 0);
    const activeStudents = students.filter((s) => s.checkIns.length > 0).length;
    const pendingCheckIns = students.filter((s) => {
      if (s.checkIns.length === 0) return true;
      const lastCheckIn = s.checkIns[s.checkIns.length - 1];
      const daysSince = Math.floor(
        (Date.now() - new Date(lastCheckIn.date).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSince > 7;
    }).length;
    return {
      totalStudents: students.length,
      totalCheckIns,
      activeStudents,
      pendingCheckIns,
    };
  }, [students]);

  return {
    students,
    isLoading,
    isSynced,
    addStudent,
    updateStudent,
    deleteStudent,
    addCheckIn,
    getStudent,
    addDocument,
    deleteDocument,
    updateDocument,
    addFolder,
    updateFolder,
    deleteFolder,
    updateTrainingPlan,
    deleteTrainingPlan,
    updateNutritionPlan,
    deleteNutritionPlan,
    addDietHistoryEntry,
    getDietHistory,
    getStudentDocuments,
    getStudentFolders,
    moveDocument,
    duplicateDocument,
    moveFolder,
    stats,
  };
});

export function useFilteredStudents(search: string) {
  const { students } = useStudents();
  return useMemo(
    () =>
      students.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.email.toLowerCase().includes(search.toLowerCase())
      ),
    [students, search]
  );
}
