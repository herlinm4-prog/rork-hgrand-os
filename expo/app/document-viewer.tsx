import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  TextInput,
  StatusBar,
  Animated,
  Platform,
  Linking,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import {
  X,
  Share2,
  Download,
  Eye,
  Pencil,
  Save,
  FileText,
  Paperclip,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Info,
  Maximize2,
  ChevronDown,
  Printer,
  Copy,
  Clock,
  Tag,
  File,
  AlertCircle,
  Smartphone,
  RefreshCw,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/contexts/ThemeContext';
import { useStudents } from '@/contexts/StudentsContext';
import { useSettings } from '@/contexts/SettingsContext';
import { generateDocumentPdfHtml } from '@/utils/pdfGenerator';
import { DOCUMENT_CATEGORY_LABELS, type StudentDocument, type DocumentCategory } from '@/types';
import Colors from '@/constants/colors';
import { formatDate } from '@/utils/calculations';
import {
  getViewerType,
  getMimeType,
  downloadToCache,
  openWithNativeViewer,
  openDocumentExternal,
  getGoogleDocsViewerUrl,
  formatFileSize,
  type DocumentViewerType,
} from '@/utils/documentService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  nutrition: Colors.light.orange,
  training: Colors.light.cyan,
  medical: Colors.light.red,
  progress: Colors.light.tint,
  other: Colors.light.textSecondary,
};

export default function DocumentViewerScreen() {
  const { studentId, documentId } = useLocalSearchParams<{ studentId: string; documentId: string }>();
  const { getStudent, updateDocument } = useStudents();
  const { colors, isDark } = useTheme();
  const { settings } = useSettings();
  const insets = useSafeAreaInsets();

  const student = getStudent(studentId ?? '');
  const document = useMemo(() => {
    if (!student?.documents) return null;
    return student.documents.find(d => d.id === documentId) ?? null;
  }, [student, documentId]);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editContent, setEditContent] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [imageZoom, setImageZoom] = useState<number>(1);
  const [imageLoading, setImageLoading] = useState<boolean>(true);

  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [localFileUri, setLocalFileUri] = useState<string | null>(null);

  const [webViewLoading, setWebViewLoading] = useState<boolean>(true);
  const [webViewError, setWebViewError] = useState<boolean>(false);


  const scaleAnim = useRef(new Animated.Value(1)).current;

  const viewerType: DocumentViewerType = useMemo(() => {
    if (!document) return 'unknown';
    return getViewerType(document);
  }, [document]);

  const mimeType = useMemo(() => {
    if (!document) return 'application/octet-stream';
    return getMimeType(document);
  }, [document]);

  useEffect(() => {
    if (!document) return;
    if (viewerType === 'pdf' && document.fileUri && Platform.OS !== 'web') {
      handleDownloadFile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document?.id, viewerType]);

  const handleDownloadFile = useCallback(async () => {
    if (!document?.fileUri) return;
    setIsDownloading(true);
    console.log('handleDownloadFile: starting download for:', document.name);
    try {
      const uri = await downloadToCache(document.fileUri, document.id);
      if (uri) {
        setLocalFileUri(uri);
        console.log('handleDownloadFile: success, local uri:', uri);
      } else {
        console.log('handleDownloadFile: download returned null');
      }
    } catch (e) {
      console.log('handleDownloadFile error:', e);
    } finally {
      setIsDownloading(false);
    }
  }, [document]);

  const handleOpenNative = useCallback(async () => {
    if (!document) return;
    console.log('handleOpenNative: opening document externally');

    const uriToOpen = localFileUri || document.fileUri;
    if (!uriToOpen) {
      Alert.alert('Error', 'No hay archivo disponible para abrir.');
      return;
    }

    try {
      const success = await openWithNativeViewer(uriToOpen, mimeType);
      if (!success) {
        if (document.fileUri) {
          await openDocumentExternal(document);
        } else {
          Alert.alert('Error', 'No se pudo abrir el documento con una app externa.');
        }
      }
    } catch (e) {
      console.log('handleOpenNative error:', e);
      Alert.alert('Error', 'No se pudo abrir el documento.');
    }
  }, [document, localFileUri, mimeType]);

  const handleStartEdit = useCallback(() => {
    if (!document) return;
    setEditContent(document.content || '');
    setIsEditing(true);
    console.log('Started editing document:', document.name);
  }, [document]);

  const handleSaveEdit = useCallback(async () => {
    if (!document || !studentId) return;
    try {
      await updateDocument(studentId, document.id, { content: editContent });
      setIsEditing(false);
      console.log('Document saved:', document.name);
      Alert.alert('Guardado', 'Documento actualizado correctamente.');
    } catch (e) {
      console.log('Save error:', e);
      Alert.alert('Error', 'No se pudo guardar el documento.');
    }
  }, [document, studentId, editContent, updateDocument]);

  const handleCancelEdit = useCallback(() => {
    if (editContent !== (document?.content || '')) {
      Alert.alert('Descartar cambios', '¿Deseas descartar los cambios realizados?', [
        { text: 'Seguir editando', style: 'cancel' },
        { text: 'Descartar', style: 'destructive', onPress: () => setIsEditing(false) },
      ]);
    } else {
      setIsEditing(false);
    }
  }, [editContent, document?.content]);

  const handleViewPdf = useCallback(async () => {
    if (!document) return;
    setIsGeneratingPdf(true);
    try {
      const docToExport = { ...document, content: isEditing ? editContent : document.content };
      const htmlToRender = generateDocumentPdfHtml(docToExport, settings.documents);
      await Print.printAsync({ html: htmlToRender });
      console.log('PDF preview shown for:', document.name);
    } catch (e) {
      console.log('PDF view error:', e);
      Alert.alert('Error', 'No se pudo mostrar el documento.');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [document, isEditing, editContent, settings.documents]);

  const handleExportPdf = useCallback(async () => {
    if (!document) return;
    setIsGeneratingPdf(true);
    try {
      const docToExport = { ...document, content: isEditing ? editContent : document.content };
      const htmlToRender = generateDocumentPdfHtml(docToExport, settings.documents);
      const { uri } = await Print.printToFileAsync({ html: htmlToRender });
      console.log('PDF exported at:', uri);
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) {
      console.log('PDF export error:', e);
      Alert.alert('Error', 'No se pudo exportar el PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [document, isEditing, editContent, settings.documents]);

  const handleShareFile = useCallback(async () => {
    if (!document) return;
    const uriToShare = localFileUri || document.fileUri;
    if (!uriToShare) return;
    try {
      if (Platform.OS === 'web') {
        Linking.openURL(uriToShare);
        return;
      }
      await shareAsync(uriToShare, {
        mimeType: mimeType || 'application/octet-stream',
        UTI: mimeType?.includes('pdf') ? 'com.adobe.pdf' : undefined,
      });
      console.log('File shared:', document.name);
    } catch (e) {
      console.log('Share error:', e);
      Alert.alert('Error', 'No se pudo compartir el archivo.');
    }
  }, [document, localFileUri, mimeType]);

  const handleCopyContent = useCallback(async () => {
    if (!document?.content) return;
    try {
      await Clipboard.setStringAsync(document.content);
      Alert.alert('Copiado', 'Contenido copiado al portapapeles.');
    } catch (e) {
      console.log('Copy error:', e);
    }
  }, [document?.content]);

  const handlePrintDocument = useCallback(async () => {
    if (!document) return;
    setIsGeneratingPdf(true);
    try {
      if (document.htmlContent) {
        await Print.printAsync({ html: document.htmlContent });
      } else if (document.content) {
        const simpleHtml = `
          <html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>body{font-family:system-ui;padding:40px;line-height:1.8;font-size:14px;color:#1a1a1a;}
          h1{font-size:22px;margin-bottom:16px;}pre{white-space:pre-wrap;word-wrap:break-word;}</style></head>
          <body><h1>${document.name}</h1><pre>${document.content}</pre></body></html>`;
        await Print.printAsync({ html: simpleHtml });
      }
    } catch (e) {
      console.log('Print error:', e);
      Alert.alert('Error', 'No se pudo imprimir el documento.');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [document]);

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(imageZoom + 0.5, 4);
    setImageZoom(newZoom);
    Animated.spring(scaleAnim, { toValue: newZoom, useNativeDriver: true, tension: 100, friction: 8 }).start();
  }, [imageZoom, scaleAnim]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(imageZoom - 0.5, 0.5);
    setImageZoom(newZoom);
    Animated.spring(scaleAnim, { toValue: newZoom, useNativeDriver: true, tension: 100, friction: 8 }).start();
  }, [imageZoom, scaleAnim]);

  const handleResetZoom = useCallback(() => {
    setImageZoom(1);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }).start();
  }, [scaleAnim]);



  const getFileTypeLabel = useCallback((doc: StudentDocument): string => {
    if (doc.fileType?.startsWith('image/')) return 'Imagen';
    if (doc.fileType?.includes('pdf')) return 'PDF';
    if (doc.fileType?.includes('word') || doc.fileType?.includes('document')) return 'Word';
    if (doc.fileType?.includes('spreadsheet') || doc.fileType?.includes('excel')) return 'Excel';
    if (doc.fileType?.includes('text')) return 'Texto';
    if (doc.isExternalFile) return 'Archivo externo';
    if (doc.htmlContent) return 'Documento HTML';
    if (doc.content) return 'Documento de texto';
    return 'Documento';
  }, []);

  const isImage = viewerType === 'image';
  const isPdf = viewerType === 'pdf';
  const isNativeOnly = viewerType === 'native_only';
  const hasTextContent = viewerType === 'text' || viewerType === 'html';
  const isExternalNonImage = document?.isExternalFile && !isImage;

  const getHtmlContentViewer = useCallback((html: string, isDarkMode: boolean) => {
    const bg = isDarkMode ? '#1a1a2e' : '#FAFBFC';
    const textColor = isDarkMode ? '#e0e0e0' : '#1a1a1a';
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; background: ${bg}; color: ${textColor}; font-family: -apple-system, system-ui, 'Segoe UI', sans-serif; }
          body { padding: 20px; font-size: 15px; line-height: 1.7; }
          h1, h2, h3, h4, h5, h6 { margin: 16px 0 8px; font-weight: 700; }
          h1 { font-size: 22px; }
          h2 { font-size: 19px; }
          h3 { font-size: 17px; }
          p { margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
          th, td { border: 1px solid ${isDarkMode ? '#333' : '#ddd'}; padding: 8px 10px; text-align: left; }
          th { background: ${isDarkMode ? '#252540' : '#f0f0f0'}; font-weight: 600; }
          ul, ol { padding-left: 20px; }
          li { margin: 4px 0; }
          img { max-width: 100%; height: auto; border-radius: 8px; }
          pre { background: ${isDarkMode ? '#252540' : '#f5f5f5'}; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 13px; }
          code { background: ${isDarkMode ? '#252540' : '#f5f5f5'}; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
          a { color: #6C8EFF; }
          blockquote { border-left: 3px solid #6C8EFF; padding-left: 12px; margin: 12px 0; color: ${isDarkMode ? '#aaa' : '#666'}; }
        </style>
      </head>
      <body>${html}</body>
      </html>
    `;
  }, []);

  const getTextContentViewer = useCallback((text: string, title: string, isDarkMode: boolean) => {
    const bg = isDarkMode ? '#1a1a2e' : '#FAFBFC';
    const textColor = isDarkMode ? '#e0e0e0' : '#1a1a1a';
    const escapedText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; background: ${bg}; color: ${textColor}; font-family: -apple-system, system-ui, 'Segoe UI', sans-serif; }
          body { padding: 20px; font-size: 15px; line-height: 1.8; }
          .doc-title { font-size: 20px; font-weight: 700; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid ${isDarkMode ? '#333' : '#e0e0e0'}; }
          .doc-content { white-space: pre-wrap; word-wrap: break-word; }
        </style>
      </head>
      <body>
        <div class="doc-title">${title}</div>
        <div class="doc-content">${escapedText}</div>
      </body>
      </html>
    `;
  }, []);

  const renderPdfViewer = useCallback(() => {
    if (!document?.fileUri) return null;

    if (Platform.OS === 'web') {
      return (
        <View style={styles.webViewContainer}>
          <iframe
            src={document.fileUri}
            style={{ width: '100%', height: '100%', border: 'none' } as any}
            onLoad={() => setWebViewLoading(false)}
          />
          {webViewLoading && (
            <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
              <ActivityIndicator size="large" color={colors.tint} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Cargando PDF...</Text>
            </View>
          )}
        </View>
      );
    }

    if (isDownloading) {
      return (
        <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Descargando documento...</Text>
          <Text style={[styles.loadingSubtext, { color: colors.textMuted }]}>Preparando para visualizar</Text>
        </View>
      );
    }

    const googleDocsUrl = getGoogleDocsViewerUrl(document.fileUri);

    return (
      <View style={styles.webViewContainer}>
        {!webViewError ? (
          <>
            <WebView
              source={{ uri: googleDocsUrl }}
              style={styles.webView}
              onLoadStart={() => { setWebViewLoading(true); setWebViewError(false); }}
              onLoadEnd={() => setWebViewLoading(false)}
              onError={() => {
                setWebViewError(true);
                setWebViewLoading(false);
                console.log('WebView Google Docs viewer error');
              }}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState={false}
              scalesPageToFit
            />
            {webViewLoading && (
              <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.tint} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Cargando documento...</Text>
              </View>
            )}
          </>
        ) : (
          <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.errorIcon, { backgroundColor: colors.red + '12' }]}>
              <AlertCircle size={40} color={colors.red} />
            </View>
            <Text style={[styles.errorTitle, { color: colors.text }]}>No se pudo mostrar el PDF</Text>
            <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
              El visor integrado falló. Usa el botón de abajo para abrir con tu lector del teléfono.
            </Text>
          </View>
        )}

        <View style={[styles.nativeOpenBanner, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.nativeOpenBtn, { backgroundColor: '#007AFF' }]}
            onPress={handleOpenNative}
            activeOpacity={0.7}
            testID="open-native-btn"
          >
            <Smartphone size={18} color="#fff" />
            <Text style={styles.nativeOpenBtnText}>Abrir con lector del teléfono</Text>
          </TouchableOpacity>
          <View style={styles.nativeOpenRow}>
            <TouchableOpacity
              style={[styles.nativeOpenSecondaryBtn, { borderColor: colors.border }]}
              onPress={() => {
                setWebViewError(false);
                setWebViewLoading(true);
              }}
              activeOpacity={0.7}
            >
              <RefreshCw size={14} color={colors.tint} />
              <Text style={[styles.nativeOpenSecondaryText, { color: colors.tint }]}>Reintentar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.nativeOpenSecondaryBtn, { borderColor: colors.border }]}
              onPress={handleShareFile}
              activeOpacity={0.7}
            >
              <Share2 size={14} color={colors.tint} />
              <Text style={[styles.nativeOpenSecondaryText, { color: colors.tint }]}>Compartir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }, [document, isDownloading, webViewLoading, webViewError, colors, handleOpenNative, handleShareFile]);

  const renderExternalFileCard = useCallback(() => {
    if (!document) return null;
    return (
      <View style={styles.externalFileContainer}>
        <View style={[styles.externalFileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.externalFileIcon, { backgroundColor: colors.purple + '15' }]}>
            <Paperclip size={48} color={colors.purple} />
          </View>
          <Text style={[styles.externalFileName, { color: colors.text }]}>{document.fileName || document.name}</Text>
          <Text style={[styles.externalFileType, { color: colors.textMuted }]}>
            {getFileTypeLabel(document)} · {formatFileSize(document.fileSize)}
          </Text>
          {document.notes && (
            <View style={[styles.externalNotes, { backgroundColor: colors.cardAlt }]}>
              <Text style={[styles.externalNotesText, { color: colors.textSecondary }]}>{document.notes}</Text>
            </View>
          )}
          <View style={styles.externalActions}>
            <TouchableOpacity
              style={[styles.externalMainBtn, { backgroundColor: '#007AFF' }]}
              onPress={handleOpenNative}
              activeOpacity={0.7}
            >
              <Smartphone size={18} color="#fff" />
              <Text style={styles.externalMainBtnText}>Abrir con lector del teléfono</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.externalSecondaryBtn, { borderColor: colors.border }]}
              onPress={handleShareFile}
              activeOpacity={0.7}
            >
              <Share2 size={16} color={colors.tint} />
              <Text style={[styles.externalSecondaryBtnText, { color: colors.tint }]}>Compartir archivo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }, [document, colors, handleOpenNative, handleShareFile, getFileTypeLabel]);

  if (!document) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.errorContainer, { paddingTop: insets.top + 60 }]}>
          <FileText size={48} color={colors.textMuted} />
          <Text style={[styles.notFoundTitle, { color: colors.text }]}>Documento no encontrado</Text>
          <Text style={[styles.notFoundSubtitle, { color: colors.textSecondary }]}>
            El documento que buscas no existe o fue eliminado.
          </Text>
          <TouchableOpacity
            style={[styles.notFoundBackBtn, { backgroundColor: colors.tint }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.notFoundBackBtnText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isImage ? '#000' : colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={isImage || isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.topBar, { paddingTop: insets.top + 8, backgroundColor: isImage ? 'rgba(0,0,0,0.7)' : colors.card }]}>
        <TouchableOpacity
          style={[styles.topBarBtn, { backgroundColor: isImage ? 'rgba(255,255,255,0.15)' : colors.elevated }]}
          onPress={() => {
            if (isEditing) {
              handleCancelEdit();
            } else {
              router.back();
            }
          }}
          activeOpacity={0.7}
          testID="close-viewer"
        >
          {isEditing ? (
            <X size={20} color={isImage ? '#fff' : colors.text} />
          ) : (
            <ChevronDown size={20} color={isImage ? '#fff' : colors.text} />
          )}
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <Text
            style={[styles.topBarTitle, { color: isImage ? '#fff' : colors.text }]}
            numberOfLines={1}
          >
            {document.name}
          </Text>
          <Text style={[styles.topBarSubtitle, { color: isImage ? 'rgba(255,255,255,0.6)' : colors.textMuted }]}>
            {getFileTypeLabel(document)}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.topBarBtn, { backgroundColor: isImage ? 'rgba(255,255,255,0.15)' : colors.elevated }]}
          onPress={() => setShowInfo(!showInfo)}
          activeOpacity={0.7}
          testID="info-button"
        >
          <Info size={20} color={isImage ? '#fff' : colors.tint} />
        </TouchableOpacity>
      </View>

      {showInfo && (
        <View style={[styles.infoPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.infoPanelHeader}>
            <Text style={[styles.infoPanelTitle, { color: colors.text }]}>Detalles del documento</Text>
            <TouchableOpacity onPress={() => setShowInfo(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.infoIconWrap, { backgroundColor: CATEGORY_COLORS[document.category] + '15' }]}>
              <Tag size={14} color={CATEGORY_COLORS[document.category]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Categoría</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{DOCUMENT_CATEGORY_LABELS[document.category]}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.infoIconWrap, { backgroundColor: colors.blue + '15' }]}>
              <Clock size={14} color={colors.blue} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Creado</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{formatDate(document.createdAt)}</Text>
            </View>
          </View>

          {document.updatedAt && document.updatedAt !== document.createdAt && (
            <View style={styles.infoRow}>
              <View style={[styles.infoIconWrap, { backgroundColor: colors.green + '15' }]}>
                <RotateCw size={14} color={colors.green} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Actualizado</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{formatDate(document.updatedAt)}</Text>
              </View>
            </View>
          )}

          {document.isExternalFile && (
            <>
              <View style={styles.infoRow}>
                <View style={[styles.infoIconWrap, { backgroundColor: colors.purple + '15' }]}>
                  <File size={14} color={colors.purple} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Tipo de archivo</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{document.fileType || 'Desconocido'}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={[styles.infoIconWrap, { backgroundColor: colors.orange + '15' }]}>
                  <Maximize2 size={14} color={colors.orange} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Tamaño</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{formatFileSize(document.fileSize)}</Text>
                </View>
              </View>
            </>
          )}

          {document.notes && (
            <View style={[styles.infoNotesBox, { backgroundColor: colors.cardAlt }]}>
              <Text style={[styles.infoNotesLabel, { color: colors.textMuted }]}>Notas</Text>
              <Text style={[styles.infoNotesText, { color: colors.text }]}>{document.notes}</Text>
            </View>
          )}
        </View>
      )}

      {isImage && document.fileUri ? (
        <View style={styles.imageViewerContainer}>
          <ScrollView
            style={styles.imageScroll}
            contentContainerStyle={styles.imageScrollContent}
            maximumZoomScale={5}
            minimumZoomScale={0.5}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            bouncesZoom
            centerContent
          >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Image
                source={{ uri: document.fileUri }}
                style={[styles.fullImage, { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.65 }]}
                contentFit="contain"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
              />
            </Animated.View>
          </ScrollView>

          {imageLoading && (
            <View style={styles.imageLoadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}

          <View style={[styles.imageControls, { bottom: insets.bottom + 20 }]}>
            <TouchableOpacity style={styles.imageControlBtn} onPress={handleZoomOut} activeOpacity={0.7}>
              <ZoomOut size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageControlBtn} onPress={handleResetZoom} activeOpacity={0.7}>
              <Text style={styles.zoomText}>{Math.round(imageZoom * 100)}%</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageControlBtn} onPress={handleZoomIn} activeOpacity={0.7}>
              <ZoomIn size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      ) : isPdf ? (
        renderPdfViewer()
      ) : isNativeOnly ? (
        renderExternalFileCard()
      ) : isExternalNonImage && !hasTextContent ? (
        renderExternalFileCard()
      ) : (
        <View style={styles.contentScroll}>
          {document.notes && !isEditing && (
            <View style={[styles.notesCard, { backgroundColor: colors.cardAlt, borderColor: colors.border, marginHorizontal: 16, marginTop: 8 }]}>
              <Text style={[styles.notesLabel, { color: colors.textMuted }]}>NOTAS</Text>
              <Text style={[styles.notesText, { color: colors.text }]}>{document.notes}</Text>
            </View>
          )}

          {isEditing ? (
            <View style={styles.editorContainer}>
              <View style={styles.editorHeader}>
                <Text style={[styles.editorLabel, { color: colors.textMuted }]}>EDITANDO CONTENIDO</Text>
                <View style={styles.editorActions}>
                  <TouchableOpacity
                    style={[styles.editorBtn, { backgroundColor: colors.red + '12' }]}
                    onPress={handleCancelEdit}
                    activeOpacity={0.7}
                  >
                    <X size={14} color={colors.red} />
                    <Text style={[styles.editorBtnText, { color: colors.red }]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editorBtn, { backgroundColor: colors.green + '12' }]}
                    onPress={handleSaveEdit}
                    activeOpacity={0.7}
                  >
                    <Save size={14} color={colors.green} />
                    <Text style={[styles.editorBtnText, { color: colors.green }]}>Guardar</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TextInput
                style={[styles.editorInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                value={editContent}
                onChangeText={setEditContent}
                multiline
                textAlignVertical="top"
                placeholder="Escribe el contenido del documento..."
                placeholderTextColor={colors.textMuted}
                autoFocus
              />
              <Text style={[styles.charCount, { color: colors.textMuted }]}>
                {editContent.length} caracteres
              </Text>
            </View>
          ) : hasTextContent ? (
            <View style={styles.richContentContainer}>
              <View style={[styles.readerToolbar, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.readerHeaderActions}>
                  {document.content && (
                    <TouchableOpacity
                      style={[styles.readerHeaderBtn, { backgroundColor: colors.cyan + '12' }]}
                      onPress={handleCopyContent}
                      activeOpacity={0.7}
                    >
                      <Copy size={12} color={colors.cyan} />
                      <Text style={[styles.readerHeaderBtnText, { color: colors.cyan }]}>Copiar</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.readerHeaderBtn, { backgroundColor: colors.tint + '12' }]}
                    onPress={handleStartEdit}
                    activeOpacity={0.7}
                  >
                    <Pencil size={12} color={colors.tint} />
                    <Text style={[styles.readerHeaderBtnText, { color: colors.tint }]}>Editar</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {document.htmlContent ? (
                Platform.OS === 'web' ? (
                  <View style={styles.webViewInner}>
                    <iframe
                      srcDoc={getHtmlContentViewer(document.htmlContent, isDark)}
                      style={{ width: '100%', height: '100%', border: 'none' } as any}
                    />
                  </View>
                ) : (
                  <View style={styles.webViewInner}>
                    <WebView
                      source={{ html: getHtmlContentViewer(document.htmlContent, isDark) }}
                      style={styles.webView}
                      javaScriptEnabled
                      scalesPageToFit={false}
                      showsVerticalScrollIndicator
                    />
                  </View>
                )
              ) : document.content ? (
                Platform.OS === 'web' ? (
                  <View style={styles.webViewInner}>
                    <iframe
                      srcDoc={getTextContentViewer(document.content, document.name, isDark)}
                      style={{ width: '100%', height: '100%', border: 'none' } as any}
                    />
                  </View>
                ) : (
                  <View style={styles.webViewInner}>
                    <WebView
                      source={{ html: getTextContentViewer(document.content, document.name, isDark) }}
                      style={styles.webView}
                      javaScriptEnabled
                      scalesPageToFit={false}
                      showsVerticalScrollIndicator
                    />
                  </View>
                )
              ) : null}
            </View>
          ) : (
            <View style={styles.emptyContent}>
              <View style={[styles.emptyContentIcon, { backgroundColor: colors.elevated }]}>
                <FileText size={40} color={colors.textMuted} />
              </View>
              <Text style={[styles.emptyContentTitle, { color: colors.text }]}>Sin contenido</Text>
              <Text style={[styles.emptyContentText, { color: colors.textSecondary }]}>
                Este documento no tiene contenido de texto aún.
              </Text>
              <TouchableOpacity
                style={[styles.emptyContentBtn, { backgroundColor: colors.tint + '15', borderColor: colors.tint + '30' }]}
                onPress={handleStartEdit}
                activeOpacity={0.7}
              >
                <Pencil size={16} color={colors.tint} />
                <Text style={[styles.emptyContentBtnText, { color: colors.tint }]}>Agregar contenido</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {!isEditing && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12, backgroundColor: isImage ? 'rgba(0,0,0,0.7)' : colors.card, borderTopColor: isImage ? 'transparent' : colors.border }]}>
          {isImage ? (
            <View style={styles.bottomActions}>
              <TouchableOpacity style={styles.bottomActionBtn} onPress={handleShareFile} activeOpacity={0.7}>
                <Share2 size={20} color="#fff" />
                <Text style={[styles.bottomActionText, { color: '#fff' }]}>Compartir</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bottomActionBtn} onPress={handleOpenNative} activeOpacity={0.7}>
                <Smartphone size={20} color="#fff" />
                <Text style={[styles.bottomActionText, { color: '#fff' }]}>Abrir externo</Text>
              </TouchableOpacity>
            </View>
          ) : isPdf || isNativeOnly || (isExternalNonImage && !hasTextContent) ? (
            <View style={styles.bottomActions}>
              <TouchableOpacity style={styles.bottomActionBtn} onPress={handleOpenNative} activeOpacity={0.7}>
                <Smartphone size={20} color={'#007AFF'} />
                <Text style={[styles.bottomActionText, { color: '#007AFF' }]}>Lector</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bottomActionBtn} onPress={handleShareFile} activeOpacity={0.7}>
                <Share2 size={20} color={colors.tint} />
                <Text style={[styles.bottomActionText, { color: colors.tint }]}>Compartir</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.bottomActions}>
              {hasTextContent && (
                <>
                  <TouchableOpacity
                    style={styles.bottomActionBtn}
                    onPress={handleViewPdf}
                    activeOpacity={0.7}
                    disabled={isGeneratingPdf}
                  >
                    {isGeneratingPdf ? (
                      <ActivityIndicator size="small" color={colors.blue} />
                    ) : (
                      <Eye size={20} color={colors.blue} />
                    )}
                    <Text style={[styles.bottomActionText, { color: colors.blue }]}>Ver PDF</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.bottomActionBtn}
                    onPress={handleExportPdf}
                    activeOpacity={0.7}
                    disabled={isGeneratingPdf}
                  >
                    <Download size={20} color={colors.green} />
                    <Text style={[styles.bottomActionText, { color: colors.green }]}>Exportar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.bottomActionBtn}
                    onPress={handlePrintDocument}
                    activeOpacity={0.7}
                    disabled={isGeneratingPdf}
                  >
                    <Printer size={20} color={colors.orange} />
                    <Text style={[styles.bottomActionText, { color: colors.orange }]}>Imprimir</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={styles.bottomActionBtn}
                onPress={handleStartEdit}
                activeOpacity={0.7}
              >
                <Pencil size={20} color={colors.tint} />
                <Text style={[styles.bottomActionText, { color: colors.tint }]}>Editar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginTop: 8,
  },
  notFoundSubtitle: {
    fontSize: 14,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  notFoundBackBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  notFoundBackBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#000',
  },
  topBar: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
    zIndex: 10,
  },
  topBarBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  topBarCenter: {
    flex: 1,
    alignItems: 'center' as const,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  topBarSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  infoPanel: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    zIndex: 5,
    marginBottom: 8,
  },
  infoPanelHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  infoPanelTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  infoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginTop: 1,
  },
  infoNotesBox: {
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  infoNotesLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoNotesText: {
    fontSize: 13,
    lineHeight: 19,
  },
  imageViewerContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  imageScroll: {
    flex: 1,
  },
  imageScrollContent: {
    flexGrow: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  fullImage: {
    borderRadius: 0,
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  imageControls: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 16,
  },
  imageControlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  zoomText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fff',
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    zIndex: 10,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginTop: 4,
  },
  loadingSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 32,
    gap: 12,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  errorSubtitle: {
    fontSize: 14,
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: 8,
  },
  nativeOpenBanner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  nativeOpenBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
  },
  nativeOpenBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  nativeOpenRow: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  nativeOpenSecondaryBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  nativeOpenSecondaryText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  externalFileContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    paddingHorizontal: 24,
  },
  externalFileCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center' as const,
    borderWidth: 1,
  },
  externalFileIcon: {
    width: 100,
    height: 100,
    borderRadius: 24,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  externalFileName: {
    fontSize: 18,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
    marginBottom: 6,
  },
  externalFileType: {
    fontSize: 13,
    marginBottom: 20,
  },
  externalNotes: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    width: '100%',
  },
  externalNotesText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center' as const,
  },
  externalActions: {
    width: '100%',
    gap: 10,
  },
  externalMainBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
  },
  externalMainBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  externalSecondaryBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  externalSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  richContentContainer: {
    flex: 1,
  },
  readerToolbar: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  webViewInner: {
    flex: 1,
    minHeight: 400,
  },
  contentScroll: {
    flex: 1,
  },
  notesCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  editorContainer: {
    marginTop: 4,
    paddingHorizontal: 16,
  },
  editorHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  editorLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
  editorActions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  editorBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  editorBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  editorInput: {
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    fontSize: 15,
    lineHeight: 24,
    minHeight: 350,
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right' as const,
    marginTop: 6,
  },
  readerHeaderActions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  readerHeaderBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
  },
  readerHeaderBtnText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  emptyContent: {
    alignItems: 'center' as const,
    paddingVertical: 60,
    gap: 10,
  },
  emptyContentIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  emptyContentTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  emptyContentText: {
    fontSize: 14,
    textAlign: 'center' as const,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  emptyContentBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  emptyContentBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  bottomBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  bottomActions: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    alignItems: 'center' as const,
  },
  bottomActionBtn: {
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 64,
  },
  bottomActionText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
});
