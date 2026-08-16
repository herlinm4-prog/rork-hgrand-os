import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  Linking,
  Platform,
  ActionSheetIOS,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Camera,
  TrendingDown,
  TrendingUp,
  Minus,
  Flame,
  Droplets,
  Moon,
  Smile,
  Scale,
  Ruler,
  Target,
  Pill,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Calendar,
  Phone,
  Pencil,
  Mail,
  FolderOpen,
  Folder,
  FolderPlus,
  FileText,
  Plus,
  X,
  Dumbbell,
  Heart,
  Activity,
  Instagram,
  Facebook,
  Music2,
  Share2,
  Zap,
  Brain,
  Timer,
  MoreHorizontal,
  Download,
  Eye,
  Save,
  Upload,
  Image as ImageIcon,
  Paperclip,
  ArrowRight,
} from 'lucide-react-native';
import * as Print from 'expo-print';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { shareAsync } from 'expo-sharing';
import { openDocumentExternal } from '@/utils/documentService';
import Colors from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useStudents } from '@/contexts/StudentsContext';
import { useSettings } from '@/contexts/SettingsContext';
import { generateNutritionPlanPdfHtml, generateDocumentPdfHtml, generateTrainingPlanPdfHtml } from '@/utils/pdfGenerator';
import {
  GOAL_LABELS,
  ACTIVITY_LABELS,
  CheckIn,
  DocumentCategory,
  DOCUMENT_CATEGORY_LABELS,
  StudentDocument,
  StudentFolder,
  TRAINING_PHASE_LABELS,
  TrainingDay,
  Exercise,
} from '@/types';
import { formatDate, getWeightChange } from '@/utils/calculations';
import { getWeightProjection } from '@/utils/alerts';
import WeightChart from '@/components/WeightChart';

const { width: SCREEN_WIDTH } = Dimensions.get('window');



const CATEGORY_ICONS: Record<DocumentCategory, React.ReactNode> = {
  nutrition: <Flame size={16} color={Colors.light.orange} />,
  training: <Dumbbell size={16} color={Colors.light.cyan} />,
  medical: <Heart size={16} color={Colors.light.red} />,
  progress: <Activity size={16} color={Colors.light.tint} />,
  other: <FileText size={16} color={Colors.light.textSecondary} />,
};

const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  nutrition: Colors.light.orange,
  training: Colors.light.cyan,
  medical: Colors.light.red,
  progress: Colors.light.tint,
  other: Colors.light.textSecondary,
};

type TabType = 'overview' | 'checkins' | 'nutrition' | 'training' | 'timeline' | 'documents';
const TABS: TabType[] = ['overview', 'checkins', 'nutrition', 'training', 'timeline', 'documents'];
const TAB_LABELS: Record<TabType, string> = {
  overview: 'General',
  checkins: 'Check-ins',
  nutrition: 'Nutrición',
  training: 'Entreno',
  timeline: 'Timeline',
  documents: 'Archivos',
};

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getStudent, deleteStudent, updateStudent, addDocument, deleteDocument, updateDocument, addFolder, updateFolder, deleteFolder, moveDocument, duplicateDocument, moveFolder } = useStudents();
  const { colors } = useTheme();
  const { settings } = useSettings();
  const student = getStudent(id ?? '');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
  const [showNewDocModal, setShowNewDocModal] = useState<boolean>(false);
  const [newDocName, setNewDocName] = useState<string>('');
  const [newDocCategory, setNewDocCategory] = useState<DocumentCategory>('other');
  const [newDocNotes, setNewDocNotes] = useState<string>('');
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [showNewFolderModal, setShowNewFolderModal] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [showRenameModal, setShowRenameModal] = useState<boolean>(false);
  const [renameTarget, setRenameTarget] = useState<{ type: 'folder' | 'document'; id: string; currentName: string } | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');
  const [viewingDocument, setViewingDocument] = useState<StudentDocument | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [editingDocContent, setEditingDocContent] = useState<string>('');
  const [isEditingDoc, setIsEditingDoc] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showMoveModal, setShowMoveModal] = useState<boolean>(false);
  const [moveTargetItem, setMoveTargetItem] = useState<{ type: 'document' | 'folder'; id: string; name: string } | null>(null);
  const defaultFoldersCreated = useRef(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    const tabIndex = TABS.indexOf(activeTab);
    Animated.spring(tabIndicatorAnim, {
      toValue: tabIndex * (SCREEN_WIDTH - 40) / TABS.length,
      tension: 80,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [activeTab, tabIndicatorAnim]);

  const weightChange = useMemo(() => {
    if (!student) return null;
    return getWeightChange(student.checkIns);
  }, [student]);

  const sortedCheckIns = useMemo(() => {
    if (!student) return [];
    return [...student.checkIns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [student]);

  const weightProjections = useMemo(() => {
    if (!student || student.checkIns.length < 2) return [];
    return getWeightProjection(student.checkIns, 4);
  }, [student]);

  const currentFolders = useMemo(() => {
    if (!student?.folders) return [];
    return student.folders.filter((f) => (f.parentId || undefined) === currentFolderId);
  }, [student?.folders, currentFolderId]);

  const currentDocuments = useMemo(() => {
    if (!student?.documents) return [];
    return student.documents.filter((d) => (d.folderId || undefined) === currentFolderId);
  }, [student?.documents, currentFolderId]);

  const folderBreadcrumbs = useMemo(() => {
    if (!currentFolderId || !student?.folders) return [];
    const crumbs: StudentFolder[] = [];
    let fId: string | undefined = currentFolderId;
    while (fId) {
      const folder = student.folders.find((f) => f.id === fId);
      if (folder) {
        crumbs.unshift(folder);
        fId = folder.parentId;
      } else {
        break;
      }
    }
    return crumbs;
  }, [currentFolderId, student?.folders]);

  const nutritionFolderId = useMemo(() => {
    return (student?.folders || []).find(f => f.name === 'Nutrición' && !f.parentId)?.id;
  }, [student?.folders]);

  const trainingFolderId = useMemo(() => {
    return (student?.folders || []).find(f => f.name === 'Entreno' && !f.parentId)?.id;
  }, [student?.folders]);

  const nutritionFolderDocs = useMemo(() => {
    if (!student?.documents || !nutritionFolderId) return [];
    return student.documents.filter(d => d.folderId === nutritionFolderId);
  }, [student?.documents, nutritionFolderId]);

  const trainingFolderDocs = useMemo(() => {
    if (!student?.documents || !trainingFolderId) return [];
    return student.documents.filter(d => d.folderId === trainingFolderId);
  }, [student?.documents, trainingFolderId]);

  const allFoldersFlat = useMemo(() => {
    if (!student?.folders) return [];
    const getFolderPath = (fId: string): string => {
      const parts: string[] = [];
      let cId: string | undefined = fId;
      while (cId) {
        const f = (student.folders || []).find(x => x.id === cId);
        if (f) { parts.unshift(f.name); cId = f.parentId; } else break;
      }
      return parts.join(' / ');
    };
    return student.folders.map(f => ({ ...f, path: getFolderPath(f.id) }));
  }, [student?.folders]);

  useEffect(() => {
    if (!id || !student || defaultFoldersCreated.current) return;
    const rootFolders = (student.folders || []).filter(f => !f.parentId);
    const hasNutrition = rootFolders.some(f => f.name === 'Nutrición');
    const hasTraining = rootFolders.some(f => f.name === 'Entreno');
    defaultFoldersCreated.current = true;
    const createDefaults = async () => {
      if (!hasNutrition) {
        console.log('Creating default Nutrición folder');
        await addFolder(id, { name: 'Nutrición' });
      }
      if (!hasTraining) {
        console.log('Creating default Entreno folder');
        await addFolder(id, { name: 'Entreno' });
      }
    };
    if (!hasNutrition || !hasTraining) createDefaults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, student?.id]);

  const biomarkerSummary = useMemo(() => {
    if (!student || sortedCheckIns.length === 0) return null;
    const last = sortedCheckIns[0];
    return {
      mood: last.mood,
      sleep: last.sleepHours,
      energy: last.energyLevel,
      stress: last.stressLevel,
      performance: last.trainingPerformance,
      water: last.waterIntake,
    };
  }, [student, sortedCheckIns]);

  const handleChangeAvatar = useCallback(async () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Elegir de la biblioteca', 'Tomar foto'],
          cancelButtonIndex: 0,
          title: 'Cambiar foto de perfil',
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0] && id) {
              await updateStudent(id, { avatar: result.assets[0].uri });
            }
          } else if (buttonIndex === 2) {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0] && id) {
              await updateStudent(id, { avatar: result.assets[0].uri });
            }
          }
        }
      );
    } else {
      Alert.alert('Cambiar foto de perfil', 'Elige una opción', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Biblioteca',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0] && id) {
              await updateStudent(id, { avatar: result.assets[0].uri });
            }
          },
        },
        {
          text: 'Cámara',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0] && id) {
              await updateStudent(id, { avatar: result.assets[0].uri });
            }
          },
        },
      ]);
    }
  }, [id, updateStudent]);

  const handleDelete = () => {
    Alert.alert(
      'Eliminar alumno',
      `¿Estás seguro de eliminar a ${student?.name}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (id) {
              await deleteStudent(id);
              router.back();
            }
          },
        },
      ]
    );
  };

  const handlePhonePress = useCallback(() => {
    if (!student?.phone) return;
    const cleanPhone = student.phone.replace(/[\s\-()]/g, '');
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Llamar', 'WhatsApp', 'Mensaje de texto'],
          cancelButtonIndex: 0,
          title: student.phone,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) Linking.openURL(`tel:${cleanPhone}`);
          else if (buttonIndex === 2) Linking.openURL(`https://wa.me/${cleanPhone.replace('+', '')}`);
          else if (buttonIndex === 3) Linking.openURL(`sms:${cleanPhone}`);
        }
      );
    } else {
      Alert.alert(student.phone, 'Elegir acción', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Llamar', onPress: () => Linking.openURL(`tel:${cleanPhone}`) },
        { text: 'WhatsApp', onPress: () => Linking.openURL(`https://wa.me/${cleanPhone.replace('+', '')}`) },
        { text: 'SMS', onPress: () => Linking.openURL(`sms:${cleanPhone}`) },
      ]);
    }
  }, [student?.phone]);

  const handleEmailPress = useCallback(() => {
    if (!student?.email) return;
    Linking.openURL(`mailto:${student.email}`);
  }, [student?.email]);

  const handleInstagramPress = useCallback(() => {
    if (!student?.instagram) return;
    const username = student.instagram.replace('@', '');
    Linking.openURL(`https://instagram.com/${username}`);
  }, [student?.instagram]);

  const handleFacebookPress = useCallback(() => {
    if (!student?.facebook) return;
    Linking.openURL(`https://facebook.com/${student.facebook}`);
  }, [student?.facebook]);

  const handleTikTokPress = useCallback(() => {
    if (!student?.tiktok) return;
    const username = student.tiktok.replace('@', '');
    Linking.openURL(`https://tiktok.com/@${username}`);
  }, [student?.tiktok]);

  const generateNutritionPDF = useCallback(async () => {
    if (!student?.nutritionPlan) {
      Alert.alert('Sin plan', 'Este alumno no tiene un plan nutricional aún.');
      return;
    }
    try {
      const html = generateNutritionPlanPdfHtml(student, student.nutritionPlan, settings.documents);
      const { uri } = await Print.printToFileAsync({ html });
      console.log('PDF generated at:', uri);
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) {
      console.log('PDF generation error:', e);
      Alert.alert('Error', 'No se pudo generar el PDF. Intenta de nuevo.');
    }
  }, [student, settings.documents]);

  const handleAddDocument = useCallback(async () => {
    if (!newDocName.trim() || !id) return;
    await addDocument(id, {
      name: newDocName.trim(),
      category: newDocCategory,
      notes: newDocNotes.trim() || undefined,
      folderId: currentFolderId,
    });
    setNewDocName('');
    setNewDocCategory('other');
    setNewDocNotes('');
    setShowNewDocModal(false);
  }, [id, newDocName, newDocCategory, newDocNotes, addDocument, currentFolderId]);

  const getFileExtension = useCallback((fileName: string): string => {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }, []);

  const getFileCategoryFromType = useCallback((mimeType: string): DocumentCategory => {
    if (mimeType.startsWith('image/')) return 'progress';
    if (mimeType.includes('pdf')) return 'nutrition';
    return 'other';
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, []);

  const handleUploadFile = useCallback(async () => {
    if (!id) return;
    try {
      setIsUploading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });
      console.log('DocumentPicker result:', result);
      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('Document picking cancelled');
        setIsUploading(false);
        return;
      }
      const asset = result.assets[0];
      const fileName = asset.name || 'Archivo sin nombre';
      const fileUri = asset.uri;
      const fileType = asset.mimeType || 'application/octet-stream';
      const fileSize = asset.size || 0;
      const category = getFileCategoryFromType(fileType);
      await addDocument(id, {
        name: fileName,
        category,
        notes: `${formatFileSize(fileSize)} · ${getFileExtension(fileName).toUpperCase() || fileType}`,
        folderId: currentFolderId,
        fileUri,
        fileType,
        fileName,
        fileSize,
        isExternalFile: true,
      });
      console.log('External file added:', fileName, fileUri);
      Alert.alert('Archivo subido', `"${fileName}" se ha añadido correctamente.`);
    } catch (e) {
      console.log('File upload error:', e);
      Alert.alert('Error', 'No se pudo subir el archivo. Intenta de nuevo.');
    } finally {
      setIsUploading(false);
    }
  }, [id, addDocument, currentFolderId, getFileCategoryFromType, formatFileSize, getFileExtension]);

  const handleUploadImage = useCallback(async () => {
    if (!id) return;
    try {
      setIsUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: false,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsUploading(false);
        return;
      }
      const asset = result.assets[0];
      const fileName = asset.fileName || `Foto_${Date.now()}.jpg`;
      const fileUri = asset.uri;
      const fileType = asset.mimeType || 'image/jpeg';
      const fileSize = asset.fileSize || 0;
      await addDocument(id, {
        name: fileName,
        category: 'progress',
        notes: fileSize ? `${formatFileSize(fileSize)} · Imagen` : 'Imagen',
        folderId: currentFolderId,
        fileUri,
        fileType,
        fileName,
        fileSize,
        isExternalFile: true,
      });
      console.log('Image file added:', fileName, fileUri);
      Alert.alert('Imagen subida', `"${fileName}" se ha añadido correctamente.`);
    } catch (e) {
      console.log('Image upload error:', e);
      Alert.alert('Error', 'No se pudo subir la imagen. Intenta de nuevo.');
    } finally {
      setIsUploading(false);
    }
  }, [id, addDocument, currentFolderId, formatFileSize]);

  const handleUploadPress = useCallback(() => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Subir archivo (PDF, Doc...)', 'Subir foto'],
          cancelButtonIndex: 0,
          title: 'Subir archivo externo',
          message: 'Selecciona el tipo de archivo que deseas añadir',
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleUploadFile();
          else if (buttonIndex === 2) handleUploadImage();
        }
      );
    } else {
      Alert.alert('Subir archivo externo', 'Selecciona el tipo de archivo', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Archivo (PDF, Doc...)', onPress: handleUploadFile },
        { text: 'Foto', onPress: handleUploadImage },
      ]);
    }
  }, [handleUploadFile, handleUploadImage]);

  const handleViewDocument = useCallback((doc: StudentDocument) => {
    console.log('Navigating to document viewer:', doc.name, doc.id);
    router.push({ pathname: '/document-viewer', params: { studentId: id, documentId: doc.id } });
  }, [id]);

  const handleAddFolder = useCallback(async () => {
    if (!newFolderName.trim() || !id) return;
    await addFolder(id, {
      name: newFolderName.trim(),
      parentId: currentFolderId,
    });
    setNewFolderName('');
    setShowNewFolderModal(false);
  }, [id, newFolderName, addFolder, currentFolderId]);

  const handleRenameStart = useCallback((type: 'folder' | 'document', itemId: string, currentName: string) => {
    setRenameTarget({ type, id: itemId, currentName });
    setRenameValue(currentName);
    setShowRenameModal(true);
  }, []);

  const handleRenameConfirm = useCallback(async () => {
    if (!renameTarget || !renameValue.trim() || !id) return;
    if (renameTarget.type === 'folder') {
      await updateFolder(id, renameTarget.id, { name: renameValue.trim() });
    } else {
      await updateDocument(id, renameTarget.id, { name: renameValue.trim() });
    }
    setShowRenameModal(false);
    setRenameTarget(null);
    setRenameValue('');
  }, [renameTarget, renameValue, id, updateFolder, updateDocument]);

  const handleDeleteFolder = useCallback((folderId: string, folderName: string) => {
    Alert.alert('Eliminar carpeta', `¿Eliminar "${folderName}" y todo su contenido?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          if (id) deleteFolder(id, folderId);
        },
      },
    ]);
  }, [id, deleteFolder]);

  const navigateToFolder = useCallback((folderId: string) => {
    setCurrentFolderId(folderId);
  }, []);

  const navigateBack = useCallback(() => {
    if (!currentFolderId || !student?.folders) {
      setCurrentFolderId(undefined);
      return;
    }
    const current = student.folders.find((f) => f.id === currentFolderId);
    setCurrentFolderId(current?.parentId);
  }, [currentFolderId, student?.folders]);

  const handleDeleteDocument = useCallback((docId: string, docName: string) => {
    Alert.alert('Eliminar documento', `¿Eliminar "${docName}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => { if (id) deleteDocument(id, docId); } },
    ]);
  }, [id, deleteDocument]);

  const handleStartMove = useCallback((type: 'document' | 'folder', itemId: string, name: string) => {
    setMoveTargetItem({ type, id: itemId, name });
    setShowMoveModal(true);
  }, []);

  const handleMoveConfirm = useCallback(async (targetFolderId: string | undefined) => {
    if (!moveTargetItem || !id) return;
    try {
      if (moveTargetItem.type === 'document') {
        await moveDocument(id, moveTargetItem.id, targetFolderId);
      } else {
        await moveFolder(id, moveTargetItem.id, targetFolderId);
      }
      setShowMoveModal(false);
      setMoveTargetItem(null);
      Alert.alert('Movido', `"${moveTargetItem.name}" se ha movido correctamente.`);
    } catch (e) {
      console.log('Move error:', e);
      Alert.alert('Error', 'No se pudo mover el elemento.');
    }
  }, [moveTargetItem, id, moveDocument, moveFolder]);

  const handleDuplicateDoc = useCallback(async (docId: string, docName: string) => {
    if (!id) return;
    try {
      await duplicateDocument(id, docId);
      Alert.alert('Duplicado', `"${docName}" se ha duplicado correctamente.`);
    } catch (e) {
      console.log('Duplicate error:', e);
      Alert.alert('Error', 'No se pudo duplicar el documento.');
    }
  }, [id, duplicateDocument]);

  const handleSaveEditedDoc = useCallback(async () => {
    if (!viewingDocument || !id) return;
    await updateDocument(id, viewingDocument.id, { content: editingDocContent });
    setViewingDocument({ ...viewingDocument, content: editingDocContent });
    setIsEditingDoc(false);
    Alert.alert('Guardado', 'Documento actualizado correctamente.');
  }, [viewingDocument, id, editingDocContent, updateDocument]);

  const handleExportPdf = useCallback(async () => {
    if (!viewingDocument) return;
    setIsGeneratingPdf(true);
    try {
      const docToExport = { ...viewingDocument, content: editingDocContent || viewingDocument.content };
      const htmlToRender = generateDocumentPdfHtml(docToExport, settings.documents);
      const { uri } = await Print.printToFileAsync({ html: htmlToRender });
      console.log('PDF generated at:', uri);
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) {
      console.log('PDF export error:', e);
      Alert.alert('Error', 'No se pudo exportar el PDF. Intenta de nuevo.');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [viewingDocument, editingDocContent, settings.documents]);

  const handleViewPdf = useCallback(async () => {
    if (!viewingDocument) return;
    setIsGeneratingPdf(true);
    try {
      const docToExport = { ...viewingDocument, content: editingDocContent || viewingDocument.content };
      const htmlToRender = generateDocumentPdfHtml(docToExport, settings.documents);
      await Print.printAsync({ html: htmlToRender });
    } catch (e) {
      console.log('PDF view error:', e);
      Alert.alert('Error', 'No se pudo mostrar el documento.');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [viewingDocument, editingDocContent, settings.documents]);

  const generateTrainingPDF = useCallback(async () => {
    if (!student?.trainingPlan) {
      Alert.alert('Sin plan', 'Este alumno no tiene un plan de entrenamiento aún.');
      return;
    }
    try {
      const html = generateTrainingPlanPdfHtml(student, student.trainingPlan, settings.documents);
      const { uri } = await Print.printToFileAsync({ html });
      console.log('Training PDF generated at:', uri);
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) {
      console.log('Training PDF generation error:', e);
      Alert.alert('Error', 'No se pudo generar el PDF. Intenta de nuevo.');
    }
  }, [student, settings.documents]);

  if (!student) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Alumno' }} />
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Alumno no encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={[styles.backLinkText, { color: colors.tint }]}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: student.name,
          headerRight: () => (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
              <Trash2 size={18} color={colors.red} />
            </TouchableOpacity>
          ),
        }}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
            <View style={styles.profileTop}>
              <TouchableOpacity onPress={handleChangeAvatar} activeOpacity={0.8} style={styles.avatarTouchable}>
                {student.avatar ? (
                  <Image source={{ uri: student.avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.cardAlt }]}>
                    <Text style={[styles.avatarText, { color: colors.tint }]}>{student.name.charAt(0)}</Text>
                  </View>
                )}
                <View style={[styles.avatarEditBadge, { backgroundColor: colors.tint }]}>
                  <Camera size={12} color="#fff" />
                </View>
              </TouchableOpacity>
              <View style={styles.profileInfo}>
                <Text style={[styles.studentName, { color: colors.text }]}>{student.name}</Text>
                <Text style={[styles.studentMeta, { color: colors.textSecondary }]}>
                  {student.age} años · {student.height} cm · {student.gender === 'male' ? 'Masculino' : 'Femenino'}
                </Text>
                <View style={styles.goalBadge}>
                  <Target size={12} color={colors.tint} />
                  <Text style={[styles.goalText, { color: colors.tint }]}>{GOAL_LABELS[student.goal]}</Text>
                </View>
              </View>
            </View>

            <View style={styles.contactRow}>
              {student.phone ? (
                <TouchableOpacity style={[styles.contactBtn, { backgroundColor: colors.cardAlt }]} onPress={handlePhonePress} activeOpacity={0.7} testID="phone-button">
                  <View style={[styles.contactIconWrap, { backgroundColor: 'rgba(52, 211, 153, 0.12)' }]}>
                    <Phone size={15} color={colors.tint} />
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactLabel, { color: colors.textMuted }]}>Teléfono · Llamar · WhatsApp · SMS</Text>
                    <Text style={[styles.contactValue, { color: colors.text }]} numberOfLines={1}>{student.phone}</Text>
                  </View>
                  <ChevronRight size={14} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
              {student.email ? (
                <TouchableOpacity style={[styles.contactBtn, { backgroundColor: colors.cardAlt }]} onPress={handleEmailPress} activeOpacity={0.7} testID="email-button">
                  <View style={[styles.contactIconWrap, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
                    <Mail size={15} color={colors.cyan} />
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactLabel, { color: colors.textMuted }]}>Email</Text>
                    <Text style={[styles.contactValue, { color: colors.text }]} numberOfLines={1}>{student.email}</Text>
                  </View>
                  <ChevronRight size={14} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {(student.instagram || student.facebook || student.tiktok) && (
              <View style={styles.socialRow}>
                {student.instagram ? (
                  <TouchableOpacity style={styles.socialBtn} onPress={handleInstagramPress} activeOpacity={0.7}>
                    <Instagram size={16} color="#E4405F" />
                    <Text style={styles.socialText} numberOfLines={1}>{student.instagram}</Text>
                  </TouchableOpacity>
                ) : null}
                {student.facebook ? (
                  <TouchableOpacity style={styles.socialBtn} onPress={handleFacebookPress} activeOpacity={0.7}>
                    <Facebook size={16} color="#1877F2" />
                    <Text style={styles.socialText} numberOfLines={1}>{student.facebook}</Text>
                  </TouchableOpacity>
                ) : null}
                {student.tiktok ? (
                  <TouchableOpacity style={styles.socialBtn} onPress={handleTikTokPress} activeOpacity={0.7}>
                    <Music2 size={16} color="#FE2C55" />
                    <Text style={styles.socialText} numberOfLines={1}>{student.tiktok}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            <View style={styles.metricsRow}>
              <MetricPill label="Peso" value={`${student.weight} kg`} icon={<Scale size={14} color={Colors.light.tint} />} />
              {student.goalWeight && (
                <MetricPill label="Objetivo" value={`${student.goalWeight} kg`} icon={<Target size={14} color={Colors.light.orange} />} />
              )}
              {student.bmr && (
                <MetricPill label="TMB" value={`${student.bmr}`} icon={<Flame size={14} color={Colors.light.orange} />} />
              )}
              {student.tdee && (
                <MetricPill label="TDEE" value={`${student.tdee}`} icon={<Flame size={14} color={Colors.light.red} />} />
              )}
            </View>

            {weightChange !== null && (
              <View style={styles.changeIndicator}>
                {weightChange < 0 ? (
                  <TrendingDown size={14} color={Colors.light.green} />
                ) : weightChange > 0 ? (
                  <TrendingUp size={14} color={Colors.light.orange} />
                ) : (
                  <Minus size={14} color={Colors.light.textMuted} />
                )}
                <Text style={[
                  styles.changeText,
                  { color: weightChange < 0 ? Colors.light.green : weightChange > 0 ? Colors.light.orange : Colors.light.textMuted },
                ]}>
                  {weightChange > 0 ? '+' : ''}{weightChange} kg desde último check-in
                </Text>
              </View>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsScroll}
            contentContainerStyle={styles.tabsScrollContent}
          >
            <View style={styles.tabsContainer}>
              <Animated.View
                style={[
                  styles.tabIndicator,
                  { transform: [{ translateX: tabIndicatorAnim }] },
                ]}
              />
              {TABS.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={styles.tab}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                    {TAB_LABELS[tab]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {activeTab === 'overview' && (
            <View style={styles.tabContent}>
              {biomarkerSummary && (
                <View style={styles.infoCard}>
                  <Text style={styles.cardTitle}>Biomarcadores recientes</Text>
                  <View style={styles.bioGrid}>
                    {biomarkerSummary.mood != null && <BioItem label="Ánimo" value={biomarkerSummary.mood} icon={<Smile size={12} color={Colors.light.orange} />} />}
                    {biomarkerSummary.energy != null && <BioItem label="Energía" value={biomarkerSummary.energy} icon={<Zap size={12} color={Colors.light.orange} />} />}
                    {biomarkerSummary.stress != null && <BioItem label="Estrés" value={biomarkerSummary.stress} icon={<Brain size={12} color={Colors.light.red} />} inverted />}
                    {biomarkerSummary.performance != null && <BioItem label="Rendimiento" value={biomarkerSummary.performance} icon={<Dumbbell size={12} color={Colors.light.tint} />} />}
                    {biomarkerSummary.sleep != null && <BioItem label="Sueño" value={`${biomarkerSummary.sleep}h`} icon={<Moon size={12} color={Colors.light.indigo} />} />}
                    {biomarkerSummary.water != null && <BioItem label="Agua" value={`${biomarkerSummary.water}L`} icon={<Droplets size={12} color={Colors.light.cyan} />} />}
                  </View>
                </View>
              )}

              {student.checkIns.length >= 2 && (
                <View style={styles.chartSection}>
                  <Text style={styles.cardTitle}>Tendencia de peso</Text>
                  <WeightChart
                    checkIns={student.checkIns.map(c => ({ date: c.date, weight: c.weight }))}
                    projections={weightProjections}
                  />
                </View>
              )}

              <View style={styles.infoCard}>
                <Text style={styles.cardTitle}>Información</Text>
                <InfoRow label="Actividad" value={ACTIVITY_LABELS[student.activityLevel]} />
                <InfoRow label="Desde" value={formatDate(student.createdAt)} />
                <InfoRow label="Check-ins" value={student.checkIns.length.toString()} />
                <InfoRow label="Documentos" value={(student.documents?.length || 0).toString()} />
                {student.bodyFatPercentage != null && (
                  <InfoRow
                    label="% Grasa"
                    value={`${student.bodyFatPercentage}%${sortedCheckIns.length > 0 && sortedCheckIns[0].bodyFatMethod ? ` (${sortedCheckIns[0].bodyFatMethod === 'bia' ? 'BIA' : 'Parrillo'})` : ''}`}
                  />
                )}
                {student.trainingPlan && <InfoRow label="Plan entreno" value={student.trainingPlan.name} />}
              </View>

              {student.notes ? (
                <View style={styles.infoCard}>
                  <Text style={styles.cardTitle}>Notas del coach</Text>
                  <Text style={styles.notesText}>{student.notes}</Text>
                </View>
              ) : null}

              {sortedCheckIns.length > 0 && sortedCheckIns[0].photos.length > 0 && (
                <View style={styles.infoCard}>
                  <Text style={styles.cardTitle}>Última foto</Text>
                  <Image
                    source={{ uri: sortedCheckIns[0].photos[0].uri }}
                    style={styles.latestPhoto}
                    contentFit="cover"
                  />
                </View>
              )}
            </View>
          )}

          {activeTab === 'checkins' && (
            <View style={styles.tabContent}>
              {sortedCheckIns.length === 0 ? (
                <View style={styles.emptyState}>
                  <Camera size={40} color={Colors.light.textMuted} />
                  <Text style={styles.emptyTitle}>Sin check-ins</Text>
                  <Text style={styles.emptyText}>Agrega el primer check-in de este alumno</Text>
                </View>
              ) : (
                sortedCheckIns.map((checkIn, index) => (
                  <CheckInCard
                    key={checkIn.id}
                    checkIn={checkIn}
                    previousCheckIn={index < sortedCheckIns.length - 1 ? sortedCheckIns[index + 1] : undefined}
                  />
                ))
              )}

              {sortedCheckIns.length >= 2 && sortedCheckIns[0].photos.length > 0 && sortedCheckIns[sortedCheckIns.length - 1].photos.length > 0 && (
                <View style={styles.comparisonCard}>
                  <Text style={styles.cardTitle}>Comparación de progreso</Text>
                  <View style={styles.comparisonRow}>
                    <View style={styles.comparisonItem}>
                      <Image source={{ uri: sortedCheckIns[sortedCheckIns.length - 1].photos[0].uri }} style={styles.comparisonPhoto} contentFit="cover" />
                      <Text style={styles.comparisonLabel}>{formatDate(sortedCheckIns[sortedCheckIns.length - 1].date)}</Text>
                      <Text style={styles.comparisonWeight}>{sortedCheckIns[sortedCheckIns.length - 1].weight} kg</Text>
                    </View>
                    <View style={styles.comparisonArrow}>
                      <ChevronRight size={24} color={Colors.light.tint} />
                    </View>
                    <View style={styles.comparisonItem}>
                      <Image source={{ uri: sortedCheckIns[0].photos[0].uri }} style={styles.comparisonPhoto} contentFit="cover" />
                      <Text style={styles.comparisonLabel}>{formatDate(sortedCheckIns[0].date)}</Text>
                      <Text style={styles.comparisonWeight}>{sortedCheckIns[0].weight} kg</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          {activeTab === 'nutrition' && (
            <View style={styles.tabContent}>
              <View style={styles.nutritionActions}>
                <TouchableOpacity
                  style={[styles.editPlanBtn, { flex: 1 }]}
                  onPress={() => router.push(`/nutrition-plan/${student.id}`)}
                  activeOpacity={0.7}
                >
                  <Pencil size={14} color={Colors.light.tint} />
                  <Text style={styles.editPlanText}>{student.nutritionPlan ? 'Editar plan' : 'Crear plan'}</Text>
                </TouchableOpacity>
                {student.nutritionPlan && (
                  <TouchableOpacity
                    style={[styles.editPlanBtn, styles.sharePlanBtn]}
                    onPress={generateNutritionPDF}
                    activeOpacity={0.7}
                    testID="share-pdf-button"
                  >
                    <Share2 size={14} color={Colors.light.cyan} />
                    <Text style={[styles.editPlanText, { color: Colors.light.cyan }]}>PDF</Text>
                  </TouchableOpacity>
                )}
              </View>

              {student.nutritionPlan ? (
                <>
                  {student.nutritionPlan.title && (
                    <View style={styles.planTitleCard}>
                      <Text style={styles.planTitleText}>{student.nutritionPlan.title}</Text>
                      <Text style={styles.planDaysCount}>
                        {(student.nutritionPlan.days?.length || 1)} {(student.nutritionPlan.days?.length || 1) === 1 ? 'día' : 'días'} · Prom. {student.nutritionPlan.calories} kcal/día
                      </Text>
                    </View>
                  )}

                  {(student.nutritionPlan.days && student.nutritionPlan.days.length > 0) ? (
                    student.nutritionPlan.days.map((day, dayIdx) => (
                      <View key={day.id} style={styles.dayDisplayCard}>
                        <View style={styles.dayDisplayHeader}>
                          <View style={styles.dayDisplayBadge}>
                            <Text style={styles.dayDisplayBadgeText}>{day.dayNumber}</Text>
                          </View>
                          <View style={styles.dayDisplayTitleCol}>
                            <Text style={styles.dayDisplayTitle}>{day.title}</Text>
                            {day.subtitle ? <Text style={styles.dayDisplaySubtitle}>{day.subtitle}</Text> : null}
                          </View>
                        </View>

                        <View style={styles.dayMacrosRow}>
                          {day.objectives.calories ? (
                            <View style={[styles.dayMacroChip, { backgroundColor: 'rgba(48,209,88,0.1)' }]}>
                              <Text style={[styles.dayMacroValue, { color: Colors.light.green }]}>{day.objectives.calories}</Text>
                              <Text style={styles.dayMacroLabel}>kcal</Text>
                            </View>
                          ) : null}
                          <View style={styles.dayMacroChip}>
                            <Text style={styles.dayMacroValue}>{day.objectives.carbs}g</Text>
                            <Text style={styles.dayMacroLabel}>Carbos</Text>
                          </View>
                          <View style={styles.dayMacroChip}>
                            <Text style={styles.dayMacroValue}>{day.objectives.protein}g</Text>
                            <Text style={styles.dayMacroLabel}>Prot.</Text>
                          </View>
                          <View style={styles.dayMacroChip}>
                            <Text style={styles.dayMacroValue}>{day.objectives.fats}g</Text>
                            <Text style={styles.dayMacroLabel}>Grasas</Text>
                          </View>
                        </View>

                        {(day.hydration.waterLiters || day.hydration.salt) && (
                          <View style={styles.hydrationDisplayRow}>
                            {day.hydration.waterLiters ? <Text style={styles.hydrationDisplayText}>💧 {day.hydration.waterLiters}L agua</Text> : null}
                            {day.hydration.salt ? <Text style={styles.hydrationDisplayText}>🧂 {day.hydration.salt}</Text> : null}
                          </View>
                        )}

                        {day.meals.length > 0 && day.meals.map((meal, mi) => (
                          <View key={meal.id} style={styles.mealCard}>
                            <View style={styles.mealHeader}>
                              <Text style={styles.mealName}>Comida {mi + 1} – {meal.name}</Text>
                              {meal.time ? <Text style={styles.mealTime}>{meal.time}</Text> : null}
                            </View>
                            {meal.foods.map((food, fi) => (
                              <View key={fi} style={styles.foodRow}>
                                <Text style={styles.foodName}>{food.name}</Text>
                                <Text style={styles.foodQty}>{food.quantity} {food.unit}</Text>
                              </View>
                            ))}
                          </View>
                        ))}
                      </View>
                    ))
                  ) : (
                    <View style={styles.macrosCard}>
                      <Text style={styles.cardTitle}>Macros diarios</Text>
                      <Text style={styles.caloriesValue}>{student.nutritionPlan.calories} kcal</Text>
                      <View style={styles.macrosRow}>
                        <MacroPill label="Proteína" value={`${student.nutritionPlan.protein}g`} color={Colors.light.tint} />
                        <MacroPill label="Carbos" value={`${student.nutritionPlan.carbs}g`} color={Colors.light.cyan} />
                        <MacroPill label="Grasas" value={`${student.nutritionPlan.fats}g`} color={Colors.light.orange} />
                      </View>
                    </View>
                  )}

                  {student.nutritionPlan.supplements.length > 0 && (
                    <View style={styles.infoCard}>
                      <View style={styles.cardTitleRow}>
                        <Pill size={16} color={Colors.light.indigo} />
                        <Text style={styles.cardTitle}>Suplementación</Text>
                      </View>
                      {student.nutritionPlan.supplements.map((sup, i) => (
                        <View key={i} style={styles.supplementRow}>
                          <View style={styles.supDot} />
                          <View style={styles.supInfo}>
                            <Text style={styles.supName}>{sup.name}</Text>
                            <Text style={styles.supDetail}>{sup.dosage} · {sup.timing}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {student.nutritionPlan.notes ? (
                    <View style={styles.infoCard}>
                      <Text style={styles.cardTitle}>Notas del plan</Text>
                      <Text style={styles.notesText}>{student.nutritionPlan.notes}</Text>
                    </View>
                  ) : null}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Flame size={40} color={Colors.light.textMuted} />
                  <Text style={styles.emptyTitle}>Sin plan nutricional</Text>
                  <Text style={styles.emptyText}>Usa el Asistente IA para generar un plan</Text>
                </View>
              )}

              {nutritionFolderDocs.length > 0 && (
                <View style={styles.infoCard}>
                  <View style={styles.cardTitleRow}>
                    <FolderOpen size={16} color={Colors.light.orange} />
                    <Text style={styles.cardTitle}>Documentos de Nutrición</Text>
                  </View>
                  {nutritionFolderDocs.map((doc) => (
                    <TouchableOpacity
                      key={doc.id}
                      style={[folderStyles.docRow, { backgroundColor: colors.cardAlt, marginBottom: 6 }]}
                      onPress={() => handleViewDocument(doc)}
                      activeOpacity={0.7}
                    >
                      <View style={folderStyles.docLeft}>
                        <View style={[folderStyles.docIconWrap, { backgroundColor: doc.isExternalFile ? 'rgba(139,92,246,0.12)' : CATEGORY_COLORS[doc.category] + '14' }]}>
                          {doc.isExternalFile ? <Paperclip size={18} color="#8B5CF6" /> : <FileText size={18} color={CATEGORY_COLORS[doc.category]} />}
                        </View>
                        <View style={folderStyles.docInfo}>
                          <Text style={[folderStyles.docName, { color: colors.text }]} numberOfLines={1}>{doc.name}</Text>
                          <Text style={[folderStyles.docDate, { color: colors.textMuted }]}>{formatDate(doc.createdAt)}</Text>
                        </View>
                      </View>
                      <ChevronRight size={14} color={colors.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === 'training' && (
            <View style={styles.tabContent}>
              {student.trainingPlan ? (
                <>
                  <View style={styles.nutritionActions}>
                    <TouchableOpacity
                      style={[styles.editPlanBtn, { flex: 1, backgroundColor: 'rgba(56, 189, 248, 0.08)', borderColor: 'rgba(56, 189, 248, 0.2)' }]}
                      onPress={generateTrainingPDF}
                      activeOpacity={0.7}
                      testID="share-training-pdf-button"
                    >
                      <Share2 size={14} color={Colors.light.cyan} />
                      <Text style={[styles.editPlanText, { color: Colors.light.cyan }]}>Exportar PDF</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.trainingHeader}>
                    <View style={styles.trainingTitleRow}>
                      <Dumbbell size={18} color={Colors.light.cyan} />
                      <View style={styles.trainingTitleInfo}>
                        <Text style={styles.trainingTitle}>{student.trainingPlan.name}</Text>
                        <View style={styles.phaseBadge}>
                          <Text style={styles.phaseBadgeText}>
                            {TRAINING_PHASE_LABELS[student.trainingPlan.phase]}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {student.trainingPlan.notes ? (
                      <Text style={styles.trainingNotes}>{student.trainingPlan.notes}</Text>
                    ) : null}
                  </View>

                  {student.trainingPlan.weekDays.map((day) => (
                    <TrainingDayCard key={day.id} day={day} />
                  ))}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Dumbbell size={40} color={Colors.light.textMuted} />
                  <Text style={styles.emptyTitle}>Sin plan de entrenamiento</Text>
                  <Text style={styles.emptyText}>Crea un plan con ejercicios, series y RIR</Text>
                </View>
              )}

              {trainingFolderDocs.length > 0 && (
                <View style={styles.infoCard}>
                  <View style={styles.cardTitleRow}>
                    <FolderOpen size={16} color={Colors.light.cyan} />
                    <Text style={styles.cardTitle}>Documentos de Entreno</Text>
                  </View>
                  {trainingFolderDocs.map((doc) => (
                    <TouchableOpacity
                      key={doc.id}
                      style={[folderStyles.docRow, { backgroundColor: colors.cardAlt, marginBottom: 6 }]}
                      onPress={() => handleViewDocument(doc)}
                      activeOpacity={0.7}
                    >
                      <View style={folderStyles.docLeft}>
                        <View style={[folderStyles.docIconWrap, { backgroundColor: doc.isExternalFile ? 'rgba(139,92,246,0.12)' : CATEGORY_COLORS[doc.category] + '14' }]}>
                          {doc.isExternalFile ? <Paperclip size={18} color="#8B5CF6" /> : <FileText size={18} color={CATEGORY_COLORS[doc.category]} />}
                        </View>
                        <View style={folderStyles.docInfo}>
                          <Text style={[folderStyles.docName, { color: colors.text }]} numberOfLines={1}>{doc.name}</Text>
                          <Text style={[folderStyles.docDate, { color: colors.textMuted }]}>{formatDate(doc.createdAt)}</Text>
                        </View>
                      </View>
                      <ChevronRight size={14} color={colors.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === 'timeline' && (
            <View style={styles.tabContent}>
              <TimelineTab student={student} />
            </View>
          )}

          {activeTab === 'documents' && (
            <View style={styles.tabContent}>
              {currentFolderId && (
                <View style={[folderStyles.breadcrumbRow, { backgroundColor: colors.card }]}>
                  <TouchableOpacity onPress={navigateBack} style={folderStyles.backBtn} activeOpacity={0.7}>
                    <ChevronLeft size={18} color={colors.tint} />
                    <Text style={[folderStyles.backText, { color: colors.tint }]}>Atrás</Text>
                  </TouchableOpacity>
                  <View style={folderStyles.breadcrumbPath}>
                    <TouchableOpacity onPress={() => setCurrentFolderId(undefined)}>
                      <Text style={[folderStyles.breadcrumbItem, { color: colors.textMuted }]}>Raíz</Text>
                    </TouchableOpacity>
                    {folderBreadcrumbs.map((bc, i) => (
                      <View key={bc.id} style={folderStyles.breadcrumbSegment}>
                        <ChevronRight size={12} color={colors.textMuted} />
                        <TouchableOpacity onPress={() => setCurrentFolderId(bc.id)}>
                          <Text style={[folderStyles.breadcrumbItem, i === folderBreadcrumbs.length - 1 && { color: colors.text, fontWeight: '600' as const }]}>{bc.name}</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={folderStyles.actionRow}>
                <TouchableOpacity
                  style={[folderStyles.actionBtn, { backgroundColor: 'rgba(10,132,255,0.08)', borderColor: 'rgba(10,132,255,0.2)' }]}
                  onPress={() => setShowNewDocModal(true)}
                  activeOpacity={0.7}
                  testID="add-document-button"
                >
                  <Plus size={14} color={colors.tint} />
                  <Text style={[folderStyles.actionBtnText, { color: colors.tint }]}>Doc</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[folderStyles.actionBtn, { backgroundColor: 'rgba(255,159,10,0.08)', borderColor: 'rgba(255,159,10,0.2)' }]}
                  onPress={() => setShowNewFolderModal(true)}
                  activeOpacity={0.7}
                  testID="add-folder-button"
                >
                  <FolderPlus size={14} color={colors.orange} />
                  <Text style={[folderStyles.actionBtnText, { color: colors.orange }]}>Carpeta</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[folderStyles.actionBtn, { backgroundColor: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.2)' }]}
                  onPress={handleUploadPress}
                  activeOpacity={0.7}
                  disabled={isUploading}
                  testID="upload-file-button"
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color="#8B5CF6" />
                  ) : (
                    <>
                      <Upload size={14} color="#8B5CF6" />
                      <Text style={[folderStyles.actionBtnText, { color: '#8B5CF6' }]}>Subir</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {currentFolders.length === 0 && currentDocuments.length === 0 ? (
                <View style={styles.emptyState}>
                  <FolderOpen size={40} color={colors.textMuted} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>{currentFolderId ? 'Carpeta vacía' : 'Sin archivos'}</Text>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Agrega documentos o crea carpetas para organizar</Text>
                </View>
              ) : (
                <>
                  {currentFolders.map((folder) => (
                    <TouchableOpacity
                      key={folder.id}
                      style={[folderStyles.folderItem, { backgroundColor: colors.card }]}
                      onPress={() => navigateToFolder(folder.id)}
                      activeOpacity={0.7}
                    >
                      <View style={folderStyles.folderIconWrap}>
                        <Folder size={20} color={colors.orange} />
                      </View>
                      <View style={folderStyles.folderInfo}>
                        <Text style={[folderStyles.folderName, { color: colors.text }]}>{folder.name}</Text>
                        <Text style={[folderStyles.folderMeta, { color: colors.textMuted }]}>
                          {(student.folders || []).filter(f => f.parentId === folder.id).length} carpetas · {(student.documents || []).filter(d => d.folderId === folder.id).length} archivos
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert(folder.name, 'Elige una acción', [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Renombrar', onPress: () => handleRenameStart('folder', folder.id, folder.name) },
                            { text: 'Mover a carpeta', onPress: () => handleStartMove('folder', folder.id, folder.name) },
                            { text: 'Eliminar', style: 'destructive', onPress: () => handleDeleteFolder(folder.id, folder.name) },
                          ]);
                        }}
                        style={folderStyles.moreBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <MoreHorizontal size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                      <ChevronRight size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  ))}

                  {currentDocuments.map((doc) => (
                    <TouchableOpacity
                      key={doc.id}
                      style={[folderStyles.docRow, { backgroundColor: colors.card }]}
                      onPress={() => handleViewDocument(doc)}
                      activeOpacity={0.7}
                    >
                      <View style={folderStyles.docLeft}>
                        <View style={[folderStyles.docIconWrap, { backgroundColor: doc.isExternalFile ? 'rgba(139,92,246,0.12)' : CATEGORY_COLORS[doc.category] + '14' }]}>
                          {doc.isExternalFile && doc.fileType?.startsWith('image/') ? (
                            <ImageIcon size={18} color="#8B5CF6" />
                          ) : doc.isExternalFile ? (
                            <Paperclip size={18} color="#8B5CF6" />
                          ) : (
                            <FileText size={18} color={CATEGORY_COLORS[doc.category]} />
                          )}
                        </View>
                        <View style={folderStyles.docInfo}>
                          <Text style={[folderStyles.docName, { color: colors.text }]} numberOfLines={1}>{doc.name}</Text>
                          <View style={folderStyles.docMetaRow}>
                            {doc.isExternalFile ? (
                              <View style={[folderStyles.docCatBadge, { backgroundColor: 'rgba(139,92,246,0.12)' }]}>
                                <Text style={[folderStyles.docCatText, { color: '#8B5CF6' }]}>
                                  {doc.fileType?.startsWith('image/') ? 'Imagen' : doc.fileType?.includes('pdf') ? 'PDF' : 'Archivo'}
                                </Text>
                              </View>
                            ) : (
                              <View style={[folderStyles.docCatBadge, { backgroundColor: CATEGORY_COLORS[doc.category] + '18' }]}>
                                <Text style={[folderStyles.docCatText, { color: CATEGORY_COLORS[doc.category] }]}>{DOCUMENT_CATEGORY_LABELS[doc.category]}</Text>
                              </View>
                            )}
                            {!doc.isExternalFile && (doc.content || doc.htmlContent) ? (
                              <View style={[folderStyles.docCatBadge, { backgroundColor: 'rgba(10,132,255,0.1)' }]}>
                                <Text style={[folderStyles.docCatText, { color: colors.tint }]}>PDF</Text>
                              </View>
                            ) : null}
                            {doc.notes ? <Text style={[folderStyles.docNotes, { color: colors.textMuted }]} numberOfLines={1}>{doc.notes}</Text> : null}
                          </View>
                          <Text style={[folderStyles.docDate, { color: colors.textMuted }]}>{formatDate(doc.createdAt)}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          const options: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Renombrar', onPress: () => handleRenameStart('document', doc.id, doc.name) },
                            { text: 'Mover a carpeta', onPress: () => handleStartMove('document', doc.id, doc.name) },
                            { text: 'Duplicar', onPress: () => handleDuplicateDoc(doc.id, doc.name) },
                          ];
                          if (doc.isExternalFile && doc.fileUri) {
                            options.push({
                              text: 'Abrir con lector del teléfono',
                              onPress: async () => {
                                try {
                                  await openDocumentExternal(doc);
                                } catch (err) {
                                  console.log('Open external error:', err);
                                  Alert.alert('Error', 'No se pudo abrir el documento.');
                                }
                              },
                            });
                            options.push({
                              text: 'Compartir',
                              onPress: async () => {
                                try {
                                  await shareAsync(doc.fileUri!, { mimeType: doc.fileType || 'application/octet-stream' });
                                } catch (err) {
                                  console.log('Share error:', err);
                                }
                              },
                            });
                          }
                          options.push({ text: 'Eliminar', style: 'destructive', onPress: () => handleDeleteDocument(doc.id, doc.name) });
                          Alert.alert(doc.name, 'Elige una acción', options);
                        }}
                        style={folderStyles.moreBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <MoreHorizontal size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                      <ChevronRight size={14} color={colors.textMuted} />
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </View>
          )}

          <TouchableOpacity
            style={styles.newCheckInButton}
            onPress={() => router.push(`/checkin/${student.id}`)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.light.tint, Colors.light.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.newCheckInGradient}
            >
              <Camera size={18} color="#000" />
              <Text style={styles.newCheckInText}>Nuevo Check-in</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>

      <Modal visible={showNewDocModal} transparent animationType="slide" onRequestClose={() => setShowNewDocModal(false)}>
        <KeyboardAvoidingView style={modalStyles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[modalStyles.container, { backgroundColor: colors.card }]}>
            <View style={modalStyles.header}>
              <Text style={[modalStyles.title, { color: colors.text }]}>Nuevo documento</Text>
              <TouchableOpacity onPress={() => setShowNewDocModal(false)} style={modalStyles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {currentFolderId && folderBreadcrumbs.length > 0 && (
              <View style={[folderStyles.modalLocationRow, { backgroundColor: colors.cardAlt }]}>
                <Folder size={12} color={colors.orange} />
                <Text style={[folderStyles.modalLocationText, { color: colors.textSecondary }]}>En: {folderBreadcrumbs.map(b => b.name).join(' / ')}</Text>
              </View>
            )}
            <Text style={[modalStyles.label, { color: colors.textSecondary }]}>Nombre</Text>
            <TextInput style={[modalStyles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder="Ej: Plan de entrenamiento Marzo" placeholderTextColor={colors.textMuted} value={newDocName} onChangeText={setNewDocName} />
            <Text style={[modalStyles.label, { color: colors.textSecondary }]}>Categoría</Text>
            <View style={modalStyles.categoryGrid}>
              {(Object.keys(DOCUMENT_CATEGORY_LABELS) as DocumentCategory[]).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[modalStyles.categoryChip, { borderColor: colors.border, backgroundColor: colors.cardAlt }, newDocCategory === cat && { backgroundColor: CATEGORY_COLORS[cat] + '22', borderColor: CATEGORY_COLORS[cat] }]}
                  onPress={() => setNewDocCategory(cat)}
                  activeOpacity={0.7}
                >
                  {CATEGORY_ICONS[cat]}
                  <Text style={[modalStyles.categoryChipText, { color: colors.textSecondary }, newDocCategory === cat && { color: CATEGORY_COLORS[cat] }]}>{DOCUMENT_CATEGORY_LABELS[cat]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[modalStyles.label, { color: colors.textSecondary }]}>Notas (opcional)</Text>
            <TextInput style={[modalStyles.input, modalStyles.textArea, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} placeholder="Descripción o notas adicionales..." placeholderTextColor={colors.textMuted} value={newDocNotes} onChangeText={setNewDocNotes} multiline numberOfLines={3} />
            <TouchableOpacity style={[modalStyles.saveBtn, !newDocName.trim() && { opacity: 0.4 }]} onPress={handleAddDocument} activeOpacity={0.8} disabled={!newDocName.trim()}>
              <LinearGradient colors={[colors.tint, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={modalStyles.saveBtnGradient}>
                <Text style={modalStyles.saveBtnText}>Guardar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showNewFolderModal} transparent animationType="slide" onRequestClose={() => setShowNewFolderModal(false)}>
        <KeyboardAvoidingView style={modalStyles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[modalStyles.container, { backgroundColor: colors.card }]}>
            <View style={modalStyles.header}>
              <Text style={[modalStyles.title, { color: colors.text }]}>Nueva carpeta</Text>
              <TouchableOpacity onPress={() => setShowNewFolderModal(false)} style={modalStyles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {currentFolderId && folderBreadcrumbs.length > 0 && (
              <View style={[folderStyles.modalLocationRow, { backgroundColor: colors.cardAlt }]}>
                <Folder size={12} color={colors.orange} />
                <Text style={[folderStyles.modalLocationText, { color: colors.textSecondary }]}>En: {folderBreadcrumbs.map(b => b.name).join(' / ')}</Text>
              </View>
            )}
            <Text style={[modalStyles.label, { color: colors.textSecondary }]}>Nombre de la carpeta</Text>
            <TextInput
              style={[modalStyles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder="Ej: Planes Marzo 2025"
              placeholderTextColor={colors.textMuted}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
            />
            <TouchableOpacity style={[modalStyles.saveBtn, !newFolderName.trim() && { opacity: 0.4 }]} onPress={handleAddFolder} activeOpacity={0.8} disabled={!newFolderName.trim()}>
              <LinearGradient colors={[colors.orange, '#E08600']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={modalStyles.saveBtnGradient}>
                <Text style={modalStyles.saveBtnText}>Crear carpeta</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showRenameModal} transparent animationType="slide" onRequestClose={() => setShowRenameModal(false)}>
        <KeyboardAvoidingView style={modalStyles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[modalStyles.container, { backgroundColor: colors.card }]}>
            <View style={modalStyles.header}>
              <Text style={[modalStyles.title, { color: colors.text }]}>Renombrar</Text>
              <TouchableOpacity onPress={() => setShowRenameModal(false)} style={modalStyles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[modalStyles.label, { color: colors.textSecondary }]}>Nuevo nombre</Text>
            <TextInput
              style={[modalStyles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder="Nuevo nombre..."
              placeholderTextColor={colors.textMuted}
              value={renameValue}
              onChangeText={setRenameValue}
              autoFocus
            />
            <TouchableOpacity style={[modalStyles.saveBtn, !renameValue.trim() && { opacity: 0.4 }]} onPress={handleRenameConfirm} activeOpacity={0.8} disabled={!renameValue.trim()}>
              <LinearGradient colors={[colors.tint, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={modalStyles.saveBtnGradient}>
                <Text style={modalStyles.saveBtnText}>Renombrar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showMoveModal} transparent animationType="slide" onRequestClose={() => { setShowMoveModal(false); setMoveTargetItem(null); }}>
        <KeyboardAvoidingView style={modalStyles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[modalStyles.container, { backgroundColor: colors.card }]}>
            <View style={modalStyles.header}>
              <Text style={[modalStyles.title, { color: colors.text }]}>Mover {moveTargetItem?.name ?? ''}</Text>
              <TouchableOpacity onPress={() => { setShowMoveModal(false); setMoveTargetItem(null); }} style={modalStyles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              <TouchableOpacity
                style={[folderStyles.folderItem, { backgroundColor: colors.cardAlt }]}
                onPress={() => handleMoveConfirm(undefined)}
                activeOpacity={0.7}
              >
                <View style={folderStyles.folderIconWrap}>
                  <FolderOpen size={20} color={colors.textMuted} />
                </View>
                <View style={folderStyles.folderInfo}>
                  <Text style={[folderStyles.folderName, { color: colors.text }]}>Raíz (sin carpeta)</Text>
                </View>
              </TouchableOpacity>
              {allFoldersFlat
                .filter(f => {
                  if (!moveTargetItem) return true;
                  if (moveTargetItem.type === 'folder' && f.id === moveTargetItem.id) return false;
                  if (moveTargetItem.type === 'folder') {
                    let pId = f.parentId;
                    while (pId) {
                      if (pId === moveTargetItem.id) return false;
                      const parent = (student?.folders || []).find(x => x.id === pId);
                      pId = parent?.parentId;
                    }
                  }
                  return true;
                })
                .map((folder) => (
                <TouchableOpacity
                  key={folder.id}
                  style={[folderStyles.folderItem, { backgroundColor: colors.cardAlt }]}
                  onPress={() => handleMoveConfirm(folder.id)}
                  activeOpacity={0.7}
                >
                  <View style={folderStyles.folderIconWrap}>
                    <Folder size={20} color={colors.orange} />
                  </View>
                  <View style={folderStyles.folderInfo}>
                    <Text style={[folderStyles.folderName, { color: colors.text }]}>{folder.name}</Text>
                    <Text style={[folderStyles.folderMeta, { color: colors.textMuted }]}>{folder.path}</Text>
                  </View>
                  <ArrowRight size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!viewingDocument} transparent animationType="slide" onRequestClose={() => setViewingDocument(null)}>
        <KeyboardAvoidingView style={docViewerStyles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[docViewerStyles.container, { backgroundColor: colors.card }]}>
            <View style={docViewerStyles.header}>
              <View style={docViewerStyles.headerLeft}>
                <View style={[docViewerStyles.docTypeIcon, { backgroundColor: viewingDocument ? (CATEGORY_COLORS[viewingDocument.category] + '14') : 'transparent' }]}>
                  <FileText size={20} color={viewingDocument ? CATEGORY_COLORS[viewingDocument.category] : colors.text} />
                </View>
                <View style={docViewerStyles.headerInfo}>
                  <Text style={[docViewerStyles.headerTitle, { color: colors.text }]} numberOfLines={2}>{viewingDocument?.name}</Text>
                  <Text style={[docViewerStyles.headerMeta, { color: colors.textMuted }]}>
                    {viewingDocument ? DOCUMENT_CATEGORY_LABELS[viewingDocument.category] : ''} · {viewingDocument ? formatDate(viewingDocument.createdAt) : ''}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setViewingDocument(null)} style={docViewerStyles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={docViewerStyles.contentScroll} showsVerticalScrollIndicator={false}>
              {viewingDocument?.isExternalFile && viewingDocument?.fileType?.startsWith('image/') && viewingDocument?.fileUri ? (
                <View style={docViewerStyles.imagePreviewWrap}>
                  <Image source={{ uri: viewingDocument.fileUri }} style={docViewerStyles.imagePreview} contentFit="contain" />
                  {viewingDocument.notes ? (
                    <Text style={[docViewerStyles.imageNotes, { color: colors.textMuted }]}>{viewingDocument.notes}</Text>
                  ) : null}
                </View>
              ) : (
                <>
              {viewingDocument?.notes ? (
                <View style={[docViewerStyles.notesBox, { backgroundColor: colors.cardAlt }]}>
                  <Text style={[docViewerStyles.notesLabel, { color: colors.textMuted }]}>Notas</Text>
                  <Text style={[docViewerStyles.notesText, { color: colors.text }]}>{viewingDocument.notes}</Text>
                </View>
              ) : null}

              {(viewingDocument?.content || editingDocContent) ? (
                <View style={docViewerStyles.contentBox}>
                  <View style={docViewerStyles.contentLabelRow}>
                    <Text style={[docViewerStyles.contentLabel, { color: colors.textMuted }]}>Contenido del documento</Text>
                    <TouchableOpacity
                      onPress={() => {
                        if (isEditingDoc) {
                          handleSaveEditedDoc();
                        } else {
                          setIsEditingDoc(true);
                        }
                      }}
                      style={[docViewerStyles.editToggle, { backgroundColor: isEditingDoc ? 'rgba(52,211,153,0.12)' : 'rgba(10,132,255,0.1)' }]}
                      activeOpacity={0.7}
                    >
                      {isEditingDoc ? (
                        <><Save size={12} color={Colors.light.tint} /><Text style={[docViewerStyles.editToggleText, { color: Colors.light.tint }]}>Guardar</Text></>
                      ) : (
                        <><Pencil size={12} color={colors.tint} /><Text style={[docViewerStyles.editToggleText, { color: colors.tint }]}>Editar</Text></>
                      )}
                    </TouchableOpacity>
                  </View>
                  {isEditingDoc ? (
                    <TextInput
                      style={[docViewerStyles.contentEditInput, { backgroundColor: colors.cardAlt, borderColor: colors.border, color: colors.text }]}
                      value={editingDocContent}
                      onChangeText={setEditingDocContent}
                      multiline
                      textAlignVertical="top"
                      placeholder="Edita el contenido del documento..."
                      placeholderTextColor={colors.textMuted}
                    />
                  ) : (
                    <View style={[docViewerStyles.contentCard, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
                      <Text style={[docViewerStyles.contentText, { color: colors.text }]}>{editingDocContent || viewingDocument?.content}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={docViewerStyles.emptyContent}>
                  <FileText size={40} color={colors.textMuted} />
                  <Text style={[docViewerStyles.emptyText, { color: colors.textSecondary }]}>Este documento no tiene contenido de texto</Text>
                </View>
              )}
                </>
              )}
            </ScrollView>

            <View style={docViewerStyles.actions}>
              {(viewingDocument?.content || viewingDocument?.htmlContent) ? (
                <>
                  <TouchableOpacity
                    style={[docViewerStyles.actionBtn, { backgroundColor: 'rgba(10,132,255,0.1)', borderColor: 'rgba(10,132,255,0.2)' }]}
                    onPress={handleViewPdf}
                    activeOpacity={0.7}
                    disabled={isGeneratingPdf}
                  >
                    {isGeneratingPdf ? (
                      <ActivityIndicator size="small" color={colors.tint} />
                    ) : (
                      <>
                        <Eye size={16} color={colors.tint} />
                        <Text style={[docViewerStyles.actionBtnText, { color: colors.tint }]}>Ver PDF</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[docViewerStyles.actionBtn, { backgroundColor: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.2)' }]}
                    onPress={handleExportPdf}
                    activeOpacity={0.7}
                    disabled={isGeneratingPdf}
                  >
                    {isGeneratingPdf ? (
                      <ActivityIndicator size="small" color={colors.tint} />
                    ) : (
                      <>
                        <Download size={16} color={Colors.light.tint} />
                        <Text style={[docViewerStyles.actionBtnText, { color: Colors.light.tint }]}>Exportar PDF</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : null}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function BioItem({ label, value, icon, inverted }: { label: string; value: number | string; icon: React.ReactNode; inverted?: boolean }) {
  const numVal = typeof value === 'number' ? value : null;
  let color = Colors.light.textSecondary;
  if (numVal !== null) {
    if (inverted) {
      color = numVal <= 2 ? Colors.light.green : numVal >= 4 ? Colors.light.red : Colors.light.orange;
    } else {
      color = numVal >= 4 ? Colors.light.green : numVal <= 2 ? Colors.light.red : Colors.light.orange;
    }
  }

  return (
    <View style={bioStyles.item}>
      {icon}
      <Text style={[bioStyles.value, { color }]}>{typeof value === 'number' ? `${value}/5` : value}</Text>
      <Text style={bioStyles.label}>{label}</Text>
    </View>
  );
}

function TrainingDayCard({ day }: { day: TrainingDay }) {
  return (
    <View style={trainingStyles.dayCard}>
      <View style={trainingStyles.dayHeader}>
        <Text style={trainingStyles.dayName}>{day.dayName}</Text>
        <View style={trainingStyles.muscleGroupRow}>
          {day.muscleGroups.map((mg, i) => (
            <View key={i} style={trainingStyles.muscleChip}>
              <Text style={trainingStyles.muscleChipText}>{mg}</Text>
            </View>
          ))}
        </View>
      </View>
      {day.exercises.map((exercise) => (
        <ExerciseRow key={exercise.id} exercise={exercise} />
      ))}
    </View>
  );
}

function ExerciseRow({ exercise }: { exercise: Exercise }) {
  return (
    <View style={trainingStyles.exerciseRow}>
      <View style={trainingStyles.exerciseMain}>
        <Text style={trainingStyles.exerciseName}>{exercise.name}</Text>
        <View style={trainingStyles.exerciseDetails}>
          <Text style={trainingStyles.exerciseSets}>{exercise.sets}×{exercise.reps}</Text>
          {exercise.weight != null && <Text style={trainingStyles.exerciseWeight}>{exercise.weight} kg</Text>}
          {exercise.rir != null && (
            <View style={trainingStyles.rirBadge}>
              <Text style={trainingStyles.rirText}>RIR {exercise.rir}</Text>
            </View>
          )}
          {exercise.rpe != null && (
            <View style={[trainingStyles.rirBadge, { backgroundColor: 'rgba(255, 159, 10, 0.12)' }]}>
              <Text style={[trainingStyles.rirText, { color: Colors.light.orange }]}>RPE {exercise.rpe}</Text>
            </View>
          )}
          {exercise.restSeconds != null && (
            <View style={trainingStyles.restChip}>
              <Timer size={10} color={Colors.light.textMuted} />
              <Text style={trainingStyles.restText}>{exercise.restSeconds}s</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function MetricPill({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <View style={metricStyles.pill}>
      {icon}
      <Text style={metricStyles.value}>{value}</Text>
      <Text style={metricStyles.label}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

function MacroPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[macroStyles.pill, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <Text style={macroStyles.value}>{value}</Text>
      <Text style={macroStyles.label}>{label}</Text>
    </View>
  );
}

function TimelineTab({ student }: { student: { id: string; name: string; checkIns: CheckIn[]; nutritionPlan?: { createdAt: string; title?: string }; trainingPlan?: { createdAt: string; name: string }; documents?: { id: string; name: string; createdAt: string }[]; createdAt: string } }) {
  const [filter, setFilter] = useState<string>('all');

  const timelineEvents = useMemo(() => {
    const events: { id: string; type: string; icon: string; title: string; description: string; date: string; color: string }[] = [];

    student.checkIns.forEach((c) => {
      events.push({
        id: `ci_${c.id}`,
        type: 'checkin',
        icon: '\ud83d\udccb',
        title: 'Check-in enviado',
        description: `Peso: ${c.weight} kg${c.bodyFatPercentage ? ` \u00b7 ${c.bodyFatPercentage}% BF` : ''}`,
        date: c.date,
        color: '#3B82F6',
      });
      if (c.coachFeedback) {
        events.push({
          id: `fb_${c.id}`,
          type: 'message',
          icon: '\ud83d\udcac',
          title: 'Feedback del coach',
          description: c.coachFeedback.substring(0, 80),
          date: c.date,
          color: '#8B5CF6',
        });
      }
    });

    if (student.nutritionPlan) {
      events.push({
        id: `np_${student.nutritionPlan.createdAt}`,
        type: 'plan',
        icon: '\ud83e\udd57',
        title: 'Plan nutricional actualizado',
        description: student.nutritionPlan.title || 'Plan de nutrici\u00f3n',
        date: student.nutritionPlan.createdAt,
        color: '#F59E0B',
      });
    }

    if (student.trainingPlan) {
      events.push({
        id: `tp_${student.trainingPlan.createdAt}`,
        type: 'plan',
        icon: '\ud83c\udfcb\ufe0f',
        title: 'Plan de entrenamiento actualizado',
        description: student.trainingPlan.name,
        date: student.trainingPlan.createdAt,
        color: '#06B6D4',
      });
    }

    (student.documents || []).forEach((doc) => {
      events.push({
        id: `doc_${doc.id}`,
        type: 'alert',
        icon: '\ud83d\udcc4',
        title: 'Documento a\u00f1adido',
        description: doc.name,
        date: doc.createdAt,
        color: '#10B981',
      });
    });

    events.push({
      id: 'created',
      type: 'billing',
      icon: '\u2b50',
      title: 'Atleta registrado',
      description: `${student.name} se uni\u00f3 al programa`,
      date: student.createdAt,
      color: '#C7A34B',
    });

    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (filter !== 'all') {
      return events.filter((e) => e.type === filter);
    }
    return events;
  }, [student, filter]);

  const filterOptions = [
    { id: 'all', label: 'Todo' },
    { id: 'checkin', label: 'Check-ins' },
    { id: 'plan', label: 'Planes' },
    { id: 'message', label: 'Mensajes' },
    { id: 'alert', label: 'Docs' },
    { id: 'billing', label: 'Registro' },
  ];

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
        {filterOptions.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[
              timelineStyles.filterChip,
              filter === f.id && timelineStyles.filterChipActive,
            ]}
            onPress={() => setFilter(f.id)}
            activeOpacity={0.7}
          >
            <Text style={[
              timelineStyles.filterChipText,
              filter === f.id && timelineStyles.filterChipTextActive,
            ]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {timelineEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Sin eventos</Text>
          <Text style={styles.emptyText}>A\u00fan no hay actividad registrada</Text>
        </View>
      ) : (
        <View style={timelineStyles.container}>
          {timelineEvents.map((event, index) => (
            <View key={event.id} style={timelineStyles.eventRow}>
              <View style={timelineStyles.lineColumn}>
                <View style={[timelineStyles.dot, { backgroundColor: event.color }]}>
                  <Text style={timelineStyles.dotIcon}>{event.icon}</Text>
                </View>
                {index < timelineEvents.length - 1 && (
                  <View style={timelineStyles.line} />
                )}
              </View>
              <View style={timelineStyles.eventContent}>
                <View style={timelineStyles.eventCard}>
                  <Text style={timelineStyles.eventTitle}>{event.title}</Text>
                  <Text style={timelineStyles.eventDesc}>{event.description}</Text>
                  <Text style={timelineStyles.eventDate}>{formatDate(event.date)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function CheckInCard({ checkIn, previousCheckIn }: { checkIn: CheckIn; previousCheckIn?: CheckIn }) {
  const weightDiff = previousCheckIn ? Math.round((checkIn.weight - previousCheckIn.weight) * 10) / 10 : null;

  return (
    <View style={checkInStyles.card}>
      <View style={checkInStyles.header}>
        <View style={checkInStyles.dateRow}>
          <Calendar size={14} color={Colors.light.tint} />
          <Text style={checkInStyles.date}>{formatDate(checkIn.date)}</Text>
        </View>
        <Text style={checkInStyles.weight}>{checkIn.weight} kg</Text>
      </View>

      <View style={checkInStyles.metricsGrid}>
        {checkIn.bodyFatPercentage != null && (
          <View style={checkInStyles.metric}>
            <Ruler size={12} color={Colors.light.textSecondary} />
            <Text style={checkInStyles.metricText}>{checkIn.bodyFatPercentage}% BF</Text>
            {checkIn.bodyFatMethod && (
              <View style={checkInStyles.methodTag}>
                <Text style={checkInStyles.methodTagText}>
                  {checkIn.bodyFatMethod === 'bia' ? 'BIA' : 'Parrillo'}
                </Text>
              </View>
            )}
          </View>
        )}
        {checkIn.mood && (
          <View style={checkInStyles.metric}><Smile size={12} color={Colors.light.textSecondary} /><Text style={checkInStyles.metricText}>{checkIn.mood}/5</Text></View>
        )}
        {checkIn.sleepHours && (
          <View style={checkInStyles.metric}><Moon size={12} color={Colors.light.textSecondary} /><Text style={checkInStyles.metricText}>{checkIn.sleepHours}h</Text></View>
        )}
        {checkIn.waterIntake && (
          <View style={checkInStyles.metric}><Droplets size={12} color={Colors.light.textSecondary} /><Text style={checkInStyles.metricText}>{checkIn.waterIntake}L</Text></View>
        )}
        {checkIn.energyLevel && (
          <View style={checkInStyles.metric}><Zap size={12} color={Colors.light.orange} /><Text style={checkInStyles.metricText}>⚡{checkIn.energyLevel}/5</Text></View>
        )}
        {checkIn.stressLevel && (
          <View style={checkInStyles.metric}><Brain size={12} color={Colors.light.red} /><Text style={checkInStyles.metricText}>🧠{checkIn.stressLevel}/5</Text></View>
        )}
        {checkIn.trainingPerformance && (
          <View style={checkInStyles.metric}><Dumbbell size={12} color={Colors.light.tint} /><Text style={checkInStyles.metricText}>💪{checkIn.trainingPerformance}/5</Text></View>
        )}
      </View>

      {weightDiff !== null && (
        <View style={checkInStyles.diffRow}>
          {weightDiff < 0 ? <TrendingDown size={12} color={Colors.light.green} /> : weightDiff > 0 ? <TrendingUp size={12} color={Colors.light.orange} /> : <Minus size={12} color={Colors.light.textMuted} />}
          <Text style={[checkInStyles.diffText, { color: weightDiff < 0 ? Colors.light.green : weightDiff > 0 ? Colors.light.orange : Colors.light.textMuted }]}>
            {weightDiff > 0 ? '+' : ''}{weightDiff} kg vs anterior
          </Text>
        </View>
      )}

      {checkIn.photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={checkInStyles.photosScroll}>
          {checkIn.photos.map((photo) => (
            <Image key={photo.id} source={{ uri: photo.uri }} style={checkInStyles.photo} contentFit="cover" />
          ))}
        </ScrollView>
      )}

      {checkIn.notes ? <Text style={checkInStyles.notes}>{checkIn.notes}</Text> : null}
      {checkIn.coachFeedback ? (
        <View style={checkInStyles.feedbackBox}>
          <Text style={checkInStyles.feedbackLabel}>Feedback del coach:</Text>
          <Text style={checkInStyles.feedbackText}>{checkIn.coachFeedback}</Text>
        </View>
      ) : null}
    </View>
  );
}

const bioStyles = StyleSheet.create({
  item: {
    alignItems: 'center',
    gap: 3,
    minWidth: 60,
  },
  value: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  label: {
    fontSize: 10,
    color: Colors.light.textMuted,
  },
});

const trainingStyles = StyleSheet.create({
  dayCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  dayHeader: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  dayName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  muscleGroupRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
  },
  muscleChip: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  muscleChipText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.light.cyan,
  },
  exerciseRow: {
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  exerciseMain: {},
  exerciseName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  exerciseDetails: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    alignItems: 'center',
    gap: 8,
  },
  exerciseSets: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.light.tint,
  },
  exerciseWeight: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '500' as const,
  },
  rirBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rirText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.light.tint,
  },
  restChip: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 3,
  },
  restText: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.light.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  closeBtn: {
    padding: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: Colors.light.inputBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  categoryGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.cardAlt,
  },
  categoryChipText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '500' as const,
  },
  saveBtn: {
    marginTop: 24,
    borderRadius: 14,
    overflow: 'hidden' as const,
  },
  saveBtnGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
  },
});

const metricStyles = StyleSheet.create({
  pill: {
    backgroundColor: Colors.light.cardAlt,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 4,
    minWidth: 70,
  },
  value: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  label: {
    fontSize: 10,
    color: Colors.light.textMuted,
  },
});

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  label: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  value: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500' as const,
  },
});

const macroStyles = StyleSheet.create({
  pill: {
    flex: 1,
    backgroundColor: Colors.light.cardAlt,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  value: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  label: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
});

const checkInStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
  },
  date: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  weight: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.tint,
  },
  metricsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: 8,
  },
  metric: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  methodTag: {
    backgroundColor: 'rgba(199, 163, 75, 0.15)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 2,
  },
  methodTagText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.light.tint,
    letterSpacing: 0.3,
  },
  diffRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  diffText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  photosScroll: {
    marginVertical: 8,
  },
  photo: {
    width: 100,
    height: 130,
    borderRadius: 10,
    marginRight: 8,
  },
  notes: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 6,
    lineHeight: 19,
  },
  feedbackBox: {
    backgroundColor: 'rgba(0, 230, 118, 0.06)',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.tint,
  },
  feedbackLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.light.tint,
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 19,
  },
});

const timelineStyles = StyleSheet.create({
  container: {
    paddingLeft: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.light.cardAlt,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterChipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
  },
  filterChipTextActive: {
    color: '#000',
  },
  eventRow: {
    flexDirection: 'row' as const,
    minHeight: 80,
  },
  lineColumn: {
    width: 40,
    alignItems: 'center' as const,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  dotIcon: {
    fontSize: 14,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.light.border,
    marginTop: -2,
    marginBottom: -2,
  },
  eventContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  eventCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  eventDesc: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  eventDate: {
    fontSize: 11,
    color: Colors.light.textMuted,
    fontWeight: '500' as const,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  deleteBtn: {
    marginRight: 4,
    padding: 4,
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  backLink: {
    marginTop: 12,
  },
  backLinkText: {
    color: Colors.light.tint,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  profileCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 18,
    marginTop: 12,
  },
  profileTop: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarTouchable: {
    position: 'relative' as const,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: Colors.light.cardAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.tint,
  },
  avatarEditBadge: {
    position: 'absolute' as const,
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: Colors.light.card,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  studentName: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.light.text,
  },
  studentMeta: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  goalBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  goalText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.tint,
  },
  contactRow: {
    gap: 8,
    marginBottom: 10,
  },
  socialRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: 14,
  },
  socialBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.cardAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  socialText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '500' as const,
    maxWidth: 140,
  },
  metricsRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  changeIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: Colors.light.border,
  },
  changeText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  tabsScroll: {
    marginTop: 16,
  },
  tabsScrollContent: {
    flexGrow: 1,
  },
  tabsContainer: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 4,
    position: 'relative' as const,
    flex: 1,
  },
  tabIndicator: {
    position: 'absolute' as const,
    top: 4,
    left: 4,
    width: (SCREEN_WIDTH - 40 - 8) / TABS.length,
    height: '100%',
    backgroundColor: Colors.light.tint,
    borderRadius: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    zIndex: 1,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
  },
  tabTextActive: {
    color: '#000',
  },
  tabContent: {
    marginTop: 16,
  },
  bioGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
    justifyContent: 'space-around',
  },
  chartSection: {
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 10,
  },
  cardTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  notesText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 21,
  },
  latestPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center' as const,
  },
  comparisonCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  comparisonRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
  },
  comparisonItem: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonPhoto: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 6,
  },
  comparisonLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  comparisonWeight: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginTop: 2,
  },
  comparisonArrow: {
    paddingHorizontal: 8,
  },
  nutritionActions: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 14,
  },
  sharePlanBtn: {
    flex: 0,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  macrosCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  caloriesValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.light.tint,
    marginBottom: 14,
  },
  macrosRow: {
    flexDirection: 'row' as const,
    gap: 8,
    width: '100%',
  },
  extraTargets: {
    flexDirection: 'row' as const,
    gap: 16,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
    justifyContent: 'center',
  },
  extraTarget: {
    alignItems: 'center',
  },
  extraTargetValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
  },
  extraTargetLabel: {
    fontSize: 10,
    color: Colors.light.textMuted,
    marginTop: 1,
  },
  supplementRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  supDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.indigo,
    marginRight: 10,
  },
  supInfo: {
    flex: 1,
  },
  supName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  supDetail: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  mealCard: {
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  mealHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mealName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  mealTime: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  foodRow: {
    flexDirection: 'row' as const,
    paddingVertical: 3,
  },
  foodName: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  foodQty: {
    fontSize: 13,
    color: Colors.light.textMuted,
    width: 70,
    textAlign: 'right' as const,
  },
  foodCals: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '500' as const,
    width: 60,
    textAlign: 'right' as const,
  },
  trainingHeader: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  trainingTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 12,
  },
  trainingTitleInfo: {
    flex: 1,
  },
  trainingTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  phaseBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  phaseBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.light.cyan,
  },
  trainingNotes: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 10,
    lineHeight: 19,
  },
  newCheckInButton: {
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden' as const,
  },
  newCheckInGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    gap: 10,
  },
  newCheckInText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
  },
  editPlanBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.2)',
  },
  editPlanText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.tint,
  },
  contactBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    backgroundColor: Colors.light.cardAlt,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  contactIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 11,
    color: Colors.light.textMuted,
    fontWeight: '500' as const,
  },
  contactValue: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '600' as const,
    marginTop: 1,
  },
  docCategorySection: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  docCategoryHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  docCategoryDot: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  docCategoryTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.light.text,
    flex: 1,
  },
  docCountBadge: {
    backgroundColor: Colors.light.cardAlt,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  docCountText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
  },
  docItem: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  docItemLeft: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 10,
  },
  docItemInfo: {
    flex: 1,
  },
  docItemName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  docItemNotes: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  docItemDate: {
    fontSize: 11,
    color: Colors.light.textMuted,
    marginTop: 3,
  },
  docDeleteBtn: {
    padding: 6,
  },
  planTitleCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.green,
  },
  planTitleText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
    letterSpacing: 0.5,
    textAlign: 'center' as const,
  },
  planDaysCount: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 4,
  },
  dayDisplayCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  dayDisplayHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  dayDisplayBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayDisplayBadgeText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.light.tint,
  },
  dayDisplayTitleCol: {
    flex: 1,
  },
  dayDisplayTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  dayDisplaySubtitle: {
    fontSize: 12,
    color: Colors.light.cyan,
    fontWeight: '500' as const,
    marginTop: 1,
  },
  dayMacrosRow: {
    flexDirection: 'row' as const,
    gap: 6,
    marginBottom: 10,
  },
  dayMacroChip: {
    flex: 1,
    backgroundColor: Colors.light.elevated,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  dayMacroValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  dayMacroLabel: {
    fontSize: 9,
    color: Colors.light.textMuted,
    marginTop: 1,
    fontWeight: '500' as const,
  },
  hydrationDisplayRow: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(90, 200, 245, 0.06)',
    borderRadius: 8,
  },
  hydrationDisplayText: {
    fontSize: 12,
    color: Colors.light.cyan,
    fontWeight: '500' as const,
  },
});

const folderStyles = StyleSheet.create({
  breadcrumbRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    gap: 6,
  },
  backBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 2,
    marginRight: 8,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  breadcrumbPath: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    flex: 1,
    gap: 2,
  },
  breadcrumbSegment: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 2,
  },
  breadcrumbItem: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  actionRow: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  folderItem: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  folderIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,159,10,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  folderMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  moreBtn: {
    padding: 6,
  },
  docIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  docRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  docLeft: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 12,
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  docMetaRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  docCatBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  docCatText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  docNotes: {
    fontSize: 11,
    flex: 1,
  },
  docDate: {
    fontSize: 11,
    marginTop: 3,
  },
  modalLocationRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  modalLocationText: {
    fontSize: 12,
  },
});

const docViewerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  headerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  docTypeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
  },
  headerMeta: {
    fontSize: 12,
    marginTop: 3,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  },
  contentScroll: {
    paddingHorizontal: 20,
    maxHeight: 400,
  },
  notesBox: {
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    marginBottom: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  contentBox: {
    marginTop: 16,
  },
  contentLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  contentCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  contentLabelRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editToggle: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  editToggleText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  contentEditInput: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    fontSize: 13,
    lineHeight: 20,
    minHeight: 200,
  },
  contentText: {
    fontSize: 13,
    lineHeight: 20,
  },
  imagePreviewWrap: {
    alignItems: 'center' as const,
    paddingVertical: 16,
  },
  imagePreview: {
    width: '100%',
    height: 320,
    borderRadius: 12,
  },
  imageNotes: {
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center' as const,
  },
  emptyContent: {
    alignItems: 'center' as const,
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center' as const,
  },
  actions: {
    flexDirection: 'row' as const,
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
