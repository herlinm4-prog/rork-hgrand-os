import { Platform, Linking } from 'react-native';
import { shareAsync } from 'expo-sharing';
import type { StudentDocument } from '@/types';

const MIME_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  txt: 'text/plain',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
};

const UTI_MAP: Record<string, string> = {
  'application/pdf': 'com.adobe.pdf',
  'image/jpeg': 'public.jpeg',
  'image/png': 'public.png',
  'image/gif': 'com.compuserve.gif',
  'image/webp': 'public.webp',
  'image/heic': 'public.heic',
  'text/plain': 'public.plain-text',
  'application/msword': 'com.microsoft.word.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'org.openxmlformats.wordprocessingml.document',
};

export type DocumentViewerType = 'image' | 'pdf' | 'text' | 'html' | 'native_only' | 'unknown';

export function getExtensionFromUri(uri: string): string {
  try {
    const cleanUri = uri.split('?')[0].split('#')[0];
    const parts = cleanUri.split('.');
    if (parts.length > 1) {
      return parts[parts.length - 1].toLowerCase();
    }
  } catch (e) {
    console.log('getExtensionFromUri error:', e);
  }
  return '';
}

export function getMimeType(doc: StudentDocument): string {
  if (doc.fileType) return doc.fileType;
  const ext = getExtensionFromUri(doc.fileUri || doc.fileName || doc.name || '');
  return MIME_MAP[ext] || 'application/octet-stream';
}

export function getViewerType(doc: StudentDocument): DocumentViewerType {
  if (!doc.isExternalFile && (doc.htmlContent || doc.content)) {
    if (doc.htmlContent) return 'html';
    return 'text';
  }

  const mime = getMimeType(doc);

  if (mime.startsWith('image/')) return 'image';
  if (mime.includes('pdf')) return 'pdf';
  if (mime.startsWith('text/')) return 'text';
  if (mime.includes('word') || mime.includes('document') || mime.includes('spreadsheet') || mime.includes('excel')) return 'native_only';

  if (doc.isExternalFile && doc.fileType?.startsWith('image/')) return 'image';
  if (doc.isExternalFile && doc.fileType?.includes('pdf')) return 'pdf';

  return 'unknown';
}

export async function downloadToCache(fileUri: string, documentId: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    console.log('downloadToCache: web platform, returning original URI');
    return fileUri;
  }

  try {
    const { File, Directory, Paths } = await import('expo-file-system');
    const ext = getExtensionFromUri(fileUri) || 'pdf';
    const fileName = `doc_${documentId}.${ext}`;

    const cacheDir = new Directory(Paths.cache, 'documents');
    if (!cacheDir.exists) {
      cacheDir.create({ intermediates: true });
    }

    const cachedFile = new File(cacheDir, fileName);

    if (cachedFile.exists && cachedFile.size > 0) {
      console.log('downloadToCache: using cached file:', cachedFile.uri);
      return cachedFile.uri;
    }

    console.log('downloadToCache: downloading from:', fileUri);
    const downloadedFile = await File.downloadFileAsync(fileUri, cachedFile, { idempotent: true });
    console.log('downloadToCache: downloaded to:', downloadedFile.uri, 'size:', downloadedFile.size);

    if (downloadedFile.exists && downloadedFile.size > 0) {
      return downloadedFile.uri;
    }

    console.log('downloadToCache: downloaded file is empty or does not exist');
    return null;
  } catch (e) {
    console.log('downloadToCache error:', e);
    return null;
  }
}

export async function validateLocalFile(localUri: string): Promise<{ valid: boolean; size: number; mimeType: string }> {
  if (Platform.OS === 'web') {
    return { valid: true, size: 0, mimeType: 'application/octet-stream' };
  }

  try {
    const { File } = await import('expo-file-system');
    const file = new File(localUri);
    if (file.exists && file.size > 0) {
      return { valid: true, size: file.size, mimeType: file.type || 'application/octet-stream' };
    }
    return { valid: false, size: 0, mimeType: '' };
  } catch (e) {
    console.log('validateLocalFile error:', e);
    return { valid: false, size: 0, mimeType: '' };
  }
}

export async function openWithNativeViewer(localUri: string, mimeType: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    try {
      await Linking.openURL(localUri);
      return true;
    } catch (e) {
      console.log('openWithNativeViewer web error:', e);
      return false;
    }
  }

  try {
    const uti = UTI_MAP[mimeType];
    await shareAsync(localUri, {
      mimeType: mimeType,
      UTI: uti,
      dialogTitle: 'Abrir documento',
    });
    console.log('openWithNativeViewer: opened successfully');
    return true;
  } catch (e) {
    console.log('openWithNativeViewer shareAsync error:', e);

    try {
      if (Platform.OS === 'android') {
        const IntentLauncher = await import('expo-intent-launcher');
        const { File } = await import('expo-file-system');
        const file = new File(localUri);
        if (file.exists) {
          const contentUri = localUri;
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            type: mimeType,
            flags: 1,
          });
          return true;
        }
      }
    } catch (intentError) {
      console.log('openWithNativeViewer intent error:', intentError);
    }

    return false;
  }
}

export async function openDocumentExternal(doc: StudentDocument): Promise<boolean> {
  const fileUri = doc.fileUri;
  if (!fileUri) {
    console.log('openDocumentExternal: no fileUri');
    return false;
  }

  if (Platform.OS === 'web') {
    try {
      await Linking.openURL(fileUri);
      return true;
    } catch (e) {
      console.log('openDocumentExternal web error:', e);
      return false;
    }
  }

  const localUri = await downloadToCache(fileUri, doc.id);
  if (!localUri) {
    console.log('openDocumentExternal: download failed, trying direct open');
    return openWithNativeViewer(fileUri, getMimeType(doc));
  }

  const validation = await validateLocalFile(localUri);
  if (!validation.valid) {
    console.log('openDocumentExternal: validation failed');
    return openWithNativeViewer(fileUri, getMimeType(doc));
  }

  return openWithNativeViewer(localUri, getMimeType(doc));
}

export async function clearDocumentCache(): Promise<boolean> {
  if (Platform.OS === 'web') {
    console.log('clearDocumentCache: web platform, nothing to clear');
    return true;
  }

  try {
    const { Directory, Paths } = await import('expo-file-system');
    const cacheDir = new Directory(Paths.cache, 'documents');
    if (cacheDir.exists) {
      cacheDir.delete();
      console.log('clearDocumentCache: cache cleared');
    }
    return true;
  } catch (e) {
    console.log('clearDocumentCache error:', e);
    return false;
  }
}

export function getGoogleDocsViewerUrl(fileUri: string): string {
  return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUri)}`;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Desconocido';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
