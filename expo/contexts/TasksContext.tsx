import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { CoachTask, CoachTaskCategory } from '@/types';
import { useStudents } from '@/contexts/StudentsContext';
import * as api from '@/utils/api';

const STORAGE_KEY = 'coach_tasks';

function generateTasksFromStudents(students: { id: string; name: string; avatar?: string; checkIns: { date: string; weight?: number }[]; goal: string; createdAt: string }[]): CoachTask[] {
  const tasks: CoachTask[] = [];
  const now = Date.now();

  students.forEach((s) => {
    if (s.checkIns.length === 0) {
      tasks.push({
        id: `task_pending_${s.id}`,
        studentId: s.id,
        studentName: s.name,
        studentAvatar: s.avatar,
        category: 'checkin',
        title: 'Check-in pendiente',
        description: `${s.name} no ha enviado ningún check-in aún.`,
        date: new Date().toISOString(),
        completed: false,
        priority: 'medium',
      });
      return;
    }

    const lastCheckIn = s.checkIns[s.checkIns.length - 1];
    const daysSince = Math.floor((now - new Date(lastCheckIn.date).getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince >= 7 && daysSince < 14) {
      tasks.push({
        id: `task_overdue_${s.id}_${lastCheckIn.date}`,
        studentId: s.id,
        studentName: s.name,
        studentAvatar: s.avatar,
        category: 'checkin',
        title: 'Check-in atrasado',
        description: `${s.name} no ha enviado check-in en ${daysSince} días.`,
        date: new Date().toISOString(),
        completed: false,
        priority: 'high',
      });
    } else if (daysSince >= 14) {
      tasks.push({
        id: `task_critical_${s.id}_${lastCheckIn.date}`,
        studentId: s.id,
        studentName: s.name,
        studentAvatar: s.avatar,
        category: 'alert',
        title: 'Atleta inactivo',
        description: `${s.name} lleva ${daysSince} días sin check-in.`,
        date: new Date().toISOString(),
        completed: false,
        priority: 'critical',
      });
    }

    if (s.checkIns.length >= 1) {
      const recent = s.checkIns[s.checkIns.length - 1];
      const recentDays = Math.floor((now - new Date(recent.date).getTime()) / (1000 * 60 * 60 * 24));
      if (recentDays <= 3) {
        tasks.push({
          id: `task_review_${s.id}_${recent.date}`,
          studentId: s.id,
          studentName: s.name,
          studentAvatar: s.avatar,
          category: 'checkin',
          title: 'Revisar check-in',
          description: `Nuevo check-in de ${s.name} pendiente de revisión.`,
          date: recent.date,
          completed: false,
          priority: 'medium',
        });
      }
    }

    if (s.checkIns.length >= 3) {
      const last3 = s.checkIns.slice(-3);
      const weights = last3.map((c) => (c as { date: string; weight?: number }).weight ?? 0).filter(Boolean);
      if (weights.length === 3) {
        const diff = Math.abs(weights[2] - weights[0]);
        if (diff < 0.5) {
          tasks.push({
            id: `task_plateau_${s.id}`,
            studentId: s.id,
            studentName: s.name,
            studentAvatar: s.avatar,
            category: 'plan_update',
            title: 'Estancamiento detectado',
            description: `${s.name} lleva 3 semanas sin cambio de peso. Considerar ajuste de plan.`,
            date: new Date().toISOString(),
            completed: false,
            priority: 'high',
          });
        }
      }
    }
  });

  return tasks;
}

export const [TasksProvider, useTasks] = createContextHook(() => {
  const { students } = useStudents();
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        // 1. Try backend first
        const remoteTasks = await api.fetchTasks();
        if (remoteTasks && remoteTasks.length > 0) {
          const completed = remoteTasks.filter((t) => t.completed).map((t) => t.id);
          setCompletedTaskIds(completed);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
        } else {
          throw new Error('empty remote');
        }
      } catch {
        // 2. Fall back to local
        try {
          const stored = await AsyncStorage.getItem(STORAGE_KEY);
          if (stored) {
            setCompletedTaskIds(JSON.parse(stored) as string[]);
          }
        } catch (e) {
          console.log('Error loading tasks:', e);
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Refetch from backend whenever students change (new data triggers new tasks)
  useEffect(() => {
    if (students.length === 0) return;
    api.fetchTasks().then((remoteTasks) => {
      const completed = remoteTasks.filter((t) => t.completed).map((t) => t.id);
      setCompletedTaskIds(completed);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
    }).catch(() => {});
  }, [students]);

  const generatedTasks = useMemo(() => {
    return generateTasksFromStudents(students as { id: string; name: string; avatar?: string; checkIns: { date: string; weight?: number }[]; goal: string; createdAt: string }[]);
  }, [students]);

  const tasks = useMemo(() => {
    return generatedTasks.map((t) => ({
      ...t,
      completed: completedTaskIds.includes(t.id),
    }));
  }, [generatedTasks, completedTaskIds]);

  const pendingTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.completed), [tasks]);

  const completeTask = useCallback(async (taskId: string) => {
    const updated = [...completedTaskIds, taskId];
    setCompletedTaskIds(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    api.completeTask(taskId).catch(() => {});
  }, [completedTaskIds]);

  const uncompleteTask = useCallback(async (taskId: string) => {
    const updated = completedTaskIds.filter((id) => id !== taskId);
    setCompletedTaskIds(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    api.uncompleteTask(taskId).catch(() => {});
  }, [completedTaskIds]);

  const tasksByCategory = useMemo(() => {
    const map: Record<CoachTaskCategory, CoachTask[]> = {
      checkin: [],
      plan_update: [],
      message: [],
      subscription: [],
      alert: [],
    };
    pendingTasks.forEach((t) => {
      map[t.category].push(t);
    });
    return map;
  }, [pendingTasks]);

  return {
    tasks,
    pendingTasks,
    completedTasks,
    tasksByCategory,
    completeTask,
    uncompleteTask,
    isLoading,
  };
});
