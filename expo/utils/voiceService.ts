// utils/voiceService.ts — HGRAND Neural Voice Engine
// Low-latency chunked TTS, silence detection, cancellation, audio metering,
// resilient STT upload, and athlete-context detection.

import { Audio } from 'expo-av';
import { Platform } from 'react-native';

import { VOICE_PRESETS, VOICE_SPEED_SETTINGS, type VoiceSpeed } from '@/types/settings';

const TOOLKIT_URL = process.env.EXPO_PUBLIC_TOOLKIT_URL || 'https://toolkit.rork.com';
const TOOLKIT_KEY = process.env.EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY || '';

const TTS_TIMEOUT_MS = 15000;
const STT_TIMEOUT_MS = 20000;

// ---------------------------------------------------------------------------
// Voice IDs
// ---------------------------------------------------------------------------

/** Sol's default voice. */
const VOICE_ID_SOL = 'XrExE9yKIg1WjnnlVkGX';

export function getVoiceIdFromPreset(presetId: string): string {
  const preset = VOICE_PRESETS.find((p) => p.id === presetId);
  return preset?.voiceId ?? VOICE_ID_SOL;
}

export function getVoiceSettingsFromSpeed(speed: VoiceSpeed) {
  return VOICE_SPEED_SETTINGS[speed] ?? VOICE_SPEED_SETTINGS.normal;
}

// ---------------------------------------------------------------------------
// TTS — sentence chunks with one-chunk-ahead prefetch
// ---------------------------------------------------------------------------

let currentSound: Audio.Sound | null = null;

/**
 * Monotonic cancellation token. stopSpeech() increments it, invalidating every
 * synth/play operation that started before the interruption. Unlike a global
 * boolean, a later speak call cannot accidentally "un-cancel" an older one.
 */
let speechGeneration = 0;

export function chunkForStreamingTTS(text: string): string[] {
  const chunks: string[] = [];
  const rawChunks = text.split(/(?<=[.!?\n;])\s+/);

  let buffer = '';
  for (const chunk of rawChunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;

    if (buffer.length + trimmed.length > 200 && buffer.length > 0) {
      chunks.push(buffer.trim());
      buffer = trimmed;
    } else {
      buffer += (buffer ? ' ' : '') + trimmed;
    }
  }

  if (buffer.trim()) chunks.push(buffer.trim());
  if (chunks.length === 0 && text.trim()) return [text.trim()];
  return chunks;
}

function arrayBufferToBase64(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer);
  const blockSize = 0x8000;
  let binary = '';

  for (let i = 0; i < bytes.length; i += blockSize) {
    const block = bytes.subarray(i, Math.min(i + blockSize, bytes.length));
    binary += String.fromCharCode(...Array.from(block));
  }

  if (globalThis.btoa) return globalThis.btoa(binary);

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let result = '';
  for (let i = 0; i < binary.length; i += 3) {
    const a = binary.charCodeAt(i);
    const b = i + 1 < binary.length ? binary.charCodeAt(i + 1) : 0;
    const c = i + 2 < binary.length ? binary.charCodeAt(i + 2) : 0;
    result += chars[a >> 2];
    result += chars[((a & 3) << 4) | (b >> 4)];
    result += i + 1 < binary.length ? chars[((b & 15) << 2) | (c >> 6)] : '=';
    result += i + 2 < binary.length ? chars[c & 63] : '=';
  }
  return result;
}

async function synthesizeChunk(
  text: string,
  voiceId: string = VOICE_ID_SOL,
  speed?: VoiceSpeed,
  generation: number = speechGeneration,
): Promise<string> {
  if (generation !== speechGeneration) throw new Error('barged-in');

  if (!TOOLKIT_KEY) {
    throw new Error('Voice toolkit key is not configured');
  }

  const url = `${TOOLKIT_URL}/v2/elevenlabs/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;
  const voiceSettings = getVoiceSettingsFromSpeed(speed ?? 'normal');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOOLKIT_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_flash_v2_5',
        voice_settings: {
          ...voiceSettings,
          use_speaker_boost: true,
        },
      }),
      signal: controller.signal,
    });

    if (generation !== speechGeneration) throw new Error('barged-in');

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error');
      throw new Error(`TTS failed (${response.status}): ${errText.substring(0, 300)}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    if (generation !== speechGeneration) throw new Error('barged-in');
    if (arrayBuffer.byteLength === 0) throw new Error('TTS returned empty audio');

    return `data:audio/mp3;base64,${arrayBufferToBase64(arrayBuffer)}`;
  } catch (err) {
    if (generation !== speechGeneration) throw new Error('barged-in');
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('TTS timeout');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function playChunk(audioUri: string, generation: number): Promise<void> {
  if (generation !== speechGeneration) throw new Error('barged-in');

  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    } catch {}
    currentSound = null;
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });

  if (generation !== speechGeneration) throw new Error('barged-in');

  const { sound } = await Audio.Sound.createAsync(
    { uri: audioUri },
    { shouldPlay: true, volume: 1.0 },
  );
  currentSound = sound;

  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const settle = (kind: 'resolve' | 'reject') => {
      if (settled) return;
      settled = true;
      clearTimeout(safetyTimer);
      sound.setOnPlaybackStatusUpdate(null);
      sound.unloadAsync().catch(() => {});
      if (currentSound === sound) currentSound = null;
      if (kind === 'reject') reject(new Error('barged-in'));
      else resolve();
    };

    const safetyTimer = setTimeout(() => settle('resolve'), 30000);

    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      if (generation !== speechGeneration) {
        sound.stopAsync().catch(() => {});
        settle('reject');
        return;
      }
      if (status.didJustFinish) settle('resolve');
    });
  });
}

/**
 * Chunked speech with cancellation and one-chunk-ahead synthesis. The next
 * sentence is synthesized while the current sentence is playing, reducing the
 * dead air between sentences without changing the existing provider.
 */
export async function speakStreaming(
  text: string,
  onChunk?: (chunkIndex: number, chunkText: string, totalChunks: number) => void,
  voiceId: string = VOICE_ID_SOL,
  speed?: VoiceSpeed,
): Promise<'completed' | 'interrupted'> {
  if (!text.trim()) return 'completed';

  const generation = speechGeneration;
  const chunks = chunkForStreamingTTS(text);
  let nextAudioPromise: Promise<string> | null = synthesizeChunk(
    chunks[0],
    voiceId,
    speed,
    generation,
  );

  for (let i = 0; i < chunks.length; i++) {
    if (generation !== speechGeneration) return 'interrupted';

    const chunk = chunks[i];
    onChunk?.(i, chunk, chunks.length);

    try {
      const audioUri = await nextAudioPromise!;
      if (generation !== speechGeneration) return 'interrupted';

      nextAudioPromise = i + 1 < chunks.length
        ? synthesizeChunk(chunks[i + 1], voiceId, speed, generation)
        : null;

      await playChunk(audioUri, generation);
    } catch (err) {
      if (
        generation !== speechGeneration ||
        (err instanceof Error && err.message === 'barged-in')
      ) {
        return 'interrupted';
      }

      console.log('[VoiceService] Speech chunk failed:', String(err).substring(0, 200));

      // If prefetch failed, rebuild the next promise for the next iteration.
      if (i + 1 < chunks.length && !nextAudioPromise) {
        nextAudioPromise = synthesizeChunk(chunks[i + 1], voiceId, speed, generation);
      }
    }
  }

  return generation === speechGeneration ? 'completed' : 'interrupted';
}

export async function stopSpeech(): Promise<void> {
  speechGeneration += 1;
  if (currentSound) {
    const sound = currentSound;
    currentSound = null;
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch {}
  }
}

export async function speak(text: string, voiceId?: string): Promise<void> {
  await speakStreaming(text, undefined, voiceId);
}

// ---------------------------------------------------------------------------
// Audio Metering & Silence Detection
// ---------------------------------------------------------------------------

export interface AudioLevels {
  metering: number;
  isSpeaking: boolean;
  normalizedLevel: number;
}

const SILENCE_THRESHOLD_DB = -40;
const SILENCE_DURATION_MS = 1500;
const MIN_SPEAKING_DURATION_MS = 800;

export function startAudioMetering(
  recording: Audio.Recording,
  onLevels: (levels: AudioLevels) => void,
  intervalMs: number = 100,
): () => void {
  recording.setProgressUpdateInterval(intervalMs);
  recording.setOnRecordingStatusUpdate((status) => {
    if (!status.isRecording) return;
    const metering = status.metering ?? -160;
    const isSpeaking = metering > SILENCE_THRESHOLD_DB;
    const normalizedLevel = Math.max(0, Math.min(1, (metering + 60) / 60));
    onLevels({ metering, isSpeaking, normalizedLevel });
  });

  return () => recording.setOnRecordingStatusUpdate(null);
}

export function createSilenceDetector(
  onSilenceDetected: () => void,
  options?: {
    silenceThreshold?: number;
    silenceDuration?: number;
    minSpeakingDuration?: number;
  },
) {
  const silenceThreshold = options?.silenceThreshold ?? SILENCE_THRESHOLD_DB;
  const silenceDuration = options?.silenceDuration ?? SILENCE_DURATION_MS;
  const minSpeakingDuration = options?.minSpeakingDuration ?? MIN_SPEAKING_DURATION_MS;

  let speakingStartTime: number | null = null;
  let silenceStartTime: number | null = null;
  let checkInterval: ReturnType<typeof setInterval> | null = null;
  let lastLevels: AudioLevels | null = null;
  let hasTriggered = false;
  let isRunning = false;

  function updateLevels(levels: AudioLevels) {
    lastLevels = {
      ...levels,
      isSpeaking: levels.metering > silenceThreshold,
    };
  }

  function start(initialLevels?: AudioLevels) {
    if (isRunning) return;
    isRunning = true;
    hasTriggered = false;
    speakingStartTime = null;
    silenceStartTime = null;
    if (initialLevels) updateLevels(initialLevels);

    checkInterval = setInterval(() => {
      if (!isRunning || !lastLevels) return;

      const now = Date.now();
      if (lastLevels.isSpeaking) {
        if (speakingStartTime === null) speakingStartTime = now;
        silenceStartTime = null;
        return;
      }

      if (
        speakingStartTime !== null &&
        now - speakingStartTime >= minSpeakingDuration
      ) {
        if (silenceStartTime === null) silenceStartTime = now;
        if (
          !hasTriggered &&
          now - silenceStartTime >= silenceDuration
        ) {
          hasTriggered = true;
          onSilenceDetected();
        }
      }
    }, 100);
  }

  function stop() {
    isRunning = false;
    if (checkInterval !== null) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
    speakingStartTime = null;
    silenceStartTime = null;
    hasTriggered = false;
  }

  function reset() {
    hasTriggered = false;
    speakingStartTime = null;
    silenceStartTime = null;
  }

  return { start, stop, reset, updateLevels };
}

export function shouldBargeIn(levels: AudioLevels): boolean {
  const BARGE_IN_THRESHOLD = -32;
  return levels.metering > BARGE_IN_THRESHOLD && levels.isSpeaking;
}

// ---------------------------------------------------------------------------
// Athlete Context Detection
// ---------------------------------------------------------------------------

function normalizeSpeechText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Match full names first. If no full-name match exists for a student, also
 * accept a first name only when that first name is unique in the roster. This
 * handles accents and natural speech while avoiding ambiguous first-name hits.
 */
export function detectAthleteContext(
  transcript: string,
  students: Array<{ id: string; name: string }>,
): string[] {
  const normalizedTranscript = ` ${normalizeSpeechText(transcript)} `;
  if (!normalizedTranscript.trim() || students.length === 0) return [];

  const normalizedStudents = students.map((student) => {
    const fullName = normalizeSpeechText(student.name);
    const firstName = fullName.split(' ')[0] || '';
    return { ...student, fullName, firstName };
  });

  const firstNameCounts = new Map<string, number>();
  for (const student of normalizedStudents) {
    if (!student.firstName) continue;
    firstNameCounts.set(student.firstName, (firstNameCounts.get(student.firstName) ?? 0) + 1);
  }

  return normalizedStudents
    .filter((student) => {
      if (!student.fullName) return false;
      if (normalizedTranscript.includes(` ${student.fullName} `)) return true;

      return (
        student.firstName.length >= 3 &&
        firstNameCounts.get(student.firstName) === 1 &&
        normalizedTranscript.includes(` ${student.firstName} `)
      );
    })
    .map((student) => student.id);
}

// ---------------------------------------------------------------------------
// Audio Recording Setup
// ---------------------------------------------------------------------------

export interface RecordingSetup {
  recording: Audio.Recording;
  meteringCleanup: () => void;
}

export async function setupContinuousRecording(): Promise<RecordingSetup> {
  const permission = await Audio.requestPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error('Microphone permission denied');
  }

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });

  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync({
    android: {
      extension: '.m4a',
      outputFormat: 2,
      audioEncoder: 3,
      sampleRate: 16000,
      numberOfChannels: 1,
      bitRate: 64000,
    },
    ios: {
      extension: '.wav',
      outputFormat: 'lpcm',
      audioQuality: 96,
      sampleRate: 16000,
      numberOfChannels: 1,
      bitRate: 64000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
    web: {},
  });

  await recording.startAsync();
  return { recording, meteringCleanup: () => {} };
}

export async function stopAndGetTranscript(
  recording: Audio.Recording,
  sttUrl: string,
): Promise<string | null> {
  try {
    await recording.stopAndUnloadAsync();
  } catch {}

  const uri = recording.getURI();
  if (!uri) return null;

  const uriParts = uri.split('.');
  const fileType = uriParts[uriParts.length - 1]?.split('?')[0] || (Platform.OS === 'web' ? 'webm' : 'm4a');
  const mimeType = fileType === 'wav' ? 'audio/wav' : `audio/${fileType}`;
  const formData = new FormData();

  if (Platform.OS === 'web') {
    try {
      const blobResponse = await fetch(uri);
      const blob = await blobResponse.blob();
      const file = new File([blob], `voice.${fileType}`, { type: blob.type || mimeType });
      formData.append('audio', file);
    } catch (err) {
      console.log('[VoiceService] Web audio conversion failed:', String(err).substring(0, 160));
      return null;
    }
  } else {
    formData.append('audio', {
      uri,
      name: `voice.${fileType}`,
      type: mimeType,
    } as unknown as Blob);
  }

  formData.append('language', 'es');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STT_TIMEOUT_MS);

  try {
    const response = await fetch(sttUrl, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.log('[VoiceService] STT failed:', response.status, errText.substring(0, 160));
      return null;
    }

    const data = await response.json();
    return typeof data.text === 'string' ? data.text.trim() || null : null;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.log('[VoiceService] STT timeout');
    } else {
      console.log('[VoiceService] STT network error:', String(err).substring(0, 160));
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

export function cleanupVoiceService(): void {
  speechGeneration += 1;
  if (currentSound) {
    currentSound.unloadAsync().catch(() => {});
    currentSound = null;
  }
}
