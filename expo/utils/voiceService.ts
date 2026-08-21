// utils/voiceService.ts — HGRAND Neural Voice Engine
// Streaming TTS, silence detection, barge-in support, audio metering.
// ElevenLabs Flash v2.5 via Rork proxy for sub-400ms first-chunk latency.

import { Audio } from 'expo-av';
import { Platform } from 'react-native';

import { VOICE_PRESETS, VOICE_SPEED_SETTINGS, type VoiceSpeed } from '@/types/settings';
import { getAuthToken } from '@/utils/api';

// The ElevenLabs key is NOT held here any more. Anything prefixed with
// EXPO_PUBLIC_ is compiled into the app bundle, so shipping a secret that way
// means publishing it. TTS now goes through our own authenticated backend,
// which holds the key server-side. See functions/index.ts -> /api/tts.
const BACKEND_URL = process.env.EXPO_PUBLIC_RORK_FUNCTIONS_URL || '';

// ---------------------------------------------------------------------------
// Voice IDs
// ---------------------------------------------------------------------------

/** Sol's voice — warm, intimate, natural Spanish female (Matilda) */
const VOICE_ID_SOL = 'XrExE9yKIg1WjnnlVkGX';

/** Get voice ID from preset ID */
export function getVoiceIdFromPreset(presetId: string): string {
  const preset = VOICE_PRESETS.find((p) => p.id === presetId);
  return preset?.voiceId ?? VOICE_ID_SOL;
}

/** Get ElevenLabs voice settings from speed preference */
export function getVoiceSettingsFromSpeed(speed: VoiceSpeed) {
  return VOICE_SPEED_SETTINGS[speed] ?? VOICE_SPEED_SETTINGS.normal;
}

// ---------------------------------------------------------------------------
// TTS — streaming sentence-by-sentence via ElevenLabs Flash v2.5
// ---------------------------------------------------------------------------

let currentSound: Audio.Sound | null = null;
let isBargedIn = false;

/**
 * Split text into natural sentence-like chunks for streaming TTS.
 * Splits on sentence boundaries, keeping chunks under ~200 chars for low latency.
 */
export function chunkForStreamingTTS(text: string): string[] {
  const chunks: string[] = [];
  // Split on sentence endings: . ! ? \n  and also on ; — like natural pauses
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
  if (buffer.trim()) {
    chunks.push(buffer.trim());
  }

  // If still empty, return the whole text as one chunk
  if (chunks.length === 0 && text.trim()) {
    return [text.trim()];
  }

  return chunks;
}

/**
 * Synthesize a single chunk of text to speech.
 * Returns a base64 data URI to the MP3 audio.
 */
async function synthesizeChunk(text: string, voiceId: string = VOICE_ID_SOL, speed?: VoiceSpeed): Promise<string> {
  const voiceSettings = getVoiceSettingsFromSpeed(speed ?? 'normal');
  const token = getAuthToken();

  console.log('[VoiceService] Synthesizing chunk:', text.substring(0, 80), '| voice:', voiceId);

  if (!token) {
    throw new Error('TTS requires an authenticated session');
  }

  const response = await fetch(`${BACKEND_URL}/api/tts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, voiceId, voiceSettings }),
  });

  if (!response.ok) {
    // 401 means the session token expired mid-conversation; api.ts owns the
    // logout path, so just surface it rather than retrying blindly.
    console.log('[VoiceService] TTS error — status:', response.status);
    throw new Error(`TTS failed (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength === 0) {
    console.log('[VoiceService] TTS returned empty audio buffer');
    throw new Error('TTS returned empty audio');
  }
  console.log('[VoiceService] TTS audio buffer size:', arrayBuffer.byteLength, 'bytes');
  // Cross-platform base64 encoding — btoa() is web-only and crashes on native
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = globalThis.btoa?.(binary) ?? (() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let result = '', i = 0;
    for (; i < binary.length; i += 3) {
      const a = binary.charCodeAt(i);
      const b = i + 1 < binary.length ? binary.charCodeAt(i + 1) : 0;
      const c = i + 2 < binary.length ? binary.charCodeAt(i + 2) : 0;
      result += chars[a >> 2];
      result += chars[((a & 3) << 4) | (b >> 4)];
      result += i + 1 < binary.length ? chars[((b & 15) << 2) | (c >> 6)] : '=';
      result += i + 2 < binary.length ? chars[c & 63] : '=';
    }
    return result;
  })();
  return `data:audio/mp3;base64,${base64}`;
}

// ---------------------------------------------------------------------------
// Audio Playback with Barge-in
// ---------------------------------------------------------------------------

/**
 * Play a single TTS chunk. Returns a promise that resolves when playback finishes
 * OR rejects with 'barged-in' if interrupted.
 */
async function playChunk(audioUri: string): Promise<void> {
  if (isBargedIn) {
    throw new Error('barged-in');
  }

  // Unload previous sound
  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    } catch {
      // ignore
    }
    currentSound = null;
  }

  // Configure for playback
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });

  const { sound } = await Audio.Sound.createAsync(
    { uri: audioUri },
    { shouldPlay: true, volume: 1.0 },
  );
  currentSound = sound;

  return new Promise<void>((resolve, reject) => {
    let resolved = false;
    // Safety timeout: 30 seconds per chunk. Cleared as soon as playback
    // settles, so a long reply doesn't leave a pending timer per chunk.
    let safetyTimer: ReturnType<typeof setTimeout> | null = null;
    const settle = (fn: () => void) => {
      resolved = true;
      if (safetyTimer !== null) {
        clearTimeout(safetyTimer);
        safetyTimer = null;
      }
      fn();
    };

    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      if (isBargedIn && !resolved) {
        settle(() => {
          sound.stopAsync().catch(() => {});
          sound.unloadAsync().catch(() => {});
          currentSound = null;
          reject(new Error('barged-in'));
        });
        return;
      }
      if (status.didJustFinish && !resolved) {
        settle(() => {
          sound.unloadAsync().catch(() => {});
          currentSound = null;
          resolve();
        });
      }
    });

    safetyTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        safetyTimer = null;
        sound.unloadAsync().catch(() => {});
        currentSound = null;
        resolve();
      }
    }, 30000);
  });
}

/**
 * Stream-speak text — chunks it into sentences, synthesizes and plays each sequentially.
 * Calls onChunk callback for each sentence being spoken (for transcript sync).
 * Returns 'completed' or 'interrupted'.
 */
export async function speakStreaming(
  text: string,
  onChunk?: (chunkIndex: number, chunkText: string, totalChunks: number) => void,
  voiceId: string = VOICE_ID_SOL,
  speed?: VoiceSpeed,
): Promise<'completed' | 'interrupted'> {
  if (!text.trim()) return 'completed';

  isBargedIn = false;
  const chunks = chunkForStreamingTTS(text);

  for (let i = 0; i < chunks.length; i++) {
    if (isBargedIn) {
      return 'interrupted';
    }

    const chunk = chunks[i];
    onChunk?.(i, chunk, chunks.length);

    try {
      const audioUri = await synthesizeChunk(chunk, voiceId, speed);
      console.log('[VoiceService] Chunk ' + (i + 1) + '/' + chunks.length + ' synthesized, URI length:', audioUri.length);
      if (isBargedIn) return 'interrupted';
      await playChunk(audioUri);
      console.log('[VoiceService] Chunk ' + (i + 1) + '/' + chunks.length + ' played successfully');
    } catch (err) {
      if (err instanceof Error && err.message === 'barged-in') {
        console.log('[VoiceService] Barge-in detected during chunk ' + (i + 1));
        return 'interrupted';
      }
      console.log('[VoiceService] Chunk ' + (i + 1) + '/' + chunks.length + ' FAILED:', String(err).substring(0, 200));
      // Continue to next chunk on non-barge errors—don't block the whole response
    }
  }

  return 'completed';
}

/**
 * Stop any currently playing speech immediately (barge-in).
 */
export async function stopSpeech(): Promise<void> {
  isBargedIn = true;
  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    } catch {
      // ignore
    }
    currentSound = null;
  }
}

/**
 * Simple speak for non-streaming use cases (backward compat).
 */
export async function speak(text: string, voiceId?: string): Promise<void> {
  await speakStreaming(text, undefined, voiceId);
}

// ---------------------------------------------------------------------------
// Audio Metering & Silence Detection
// ---------------------------------------------------------------------------

export interface AudioLevels {
  /** RMS power in dBFS (-160 to 0). Higher = louder. */
  metering: number;
  /** Whether current levels indicate speech (above threshold). */
  isSpeaking: boolean;
  /** Normalized level 0-1 for UI animations. */
  normalizedLevel: number;
}

// Default silence threshold: -40 dBFS is a common threshold for speech
const SILENCE_THRESHOLD_DB = -40;
// How long silence must persist to be considered "done speaking" (ms)
const SILENCE_DURATION_MS = 1500;
// Minimum speaking duration before we allow silence detection (ms) — prevents false triggers
const MIN_SPEAKING_DURATION_MS = 800;

/**
 * Start audio metering on the active recording. Returns a cleanup function.
 * Calls the callback with audio level data at ~100ms intervals.
 */
export function startAudioMetering(
  recording: Audio.Recording,
  onLevels: (levels: AudioLevels) => void,
  intervalMs: number = 100,
): () => void {
  // Enable metering on the recording
  recording.setProgressUpdateInterval(intervalMs);
  recording.setOnRecordingStatusUpdate((status) => {
    if (!status.isRecording) return;
    // metering is in dBFS, range -160 to 0
    const metering = status.metering ?? -160;
    const isSpeaking = metering > SILENCE_THRESHOLD_DB;
    // Normalize: -60 dBFS → 0, 0 dBFS → 1
    const normalizedLevel = Math.max(0, Math.min(1, (metering + 60) / 60));

    onLevels({ metering, isSpeaking, normalizedLevel });
  });

  // Return cleanup
  return () => {
    recording.setOnRecordingStatusUpdate(null);
  };
}

/**
 * Create a silence detector that triggers after sustained silence.
 * Returns { start, stop, reset } controls.
 */
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
    lastLevels = levels;
  }

  function start(initialLevels?: AudioLevels) {
    if (isRunning) return;
    isRunning = true;
    hasTriggered = false;
    speakingStartTime = null;
    silenceStartTime = null;
    if (initialLevels) lastLevels = initialLevels;

    checkInterval = setInterval(() => {
      if (!isRunning || !lastLevels) return;

      const now = Date.now();

      if (lastLevels.isSpeaking) {
        // Currently speaking
        if (speakingStartTime === null) {
          speakingStartTime = now;
        }
        silenceStartTime = null; // Reset silence counter
      } else {
        // Currently silent
        if (
          speakingStartTime !== null &&
          (now - speakingStartTime) >= minSpeakingDuration
        ) {
          // Was speaking long enough, now track silence
          if (silenceStartTime === null) {
            silenceStartTime = now;
          }

          if (
            !hasTriggered &&
            silenceStartTime !== null &&
            (now - silenceStartTime) >= silenceDuration
          ) {
            hasTriggered = true;
            onSilenceDetected();
          }
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

// ---------------------------------------------------------------------------
// Barge-in Detection during TTS Playback
// ---------------------------------------------------------------------------

/**
 * Check if the given audio levels indicate the user is trying to interrupt.
 * Returns true if the coach is speaking loudly enough to barge in.
 */
export function shouldBargeIn(levels: AudioLevels): boolean {
  // More aggressive threshold for barge-in — coach needs to speak clearly
  const BARGE_IN_THRESHOLD = -32; // dBFS — louder than normal silence threshold
  return levels.metering > BARGE_IN_THRESHOLD && levels.isSpeaking;
}

// ---------------------------------------------------------------------------
// Athlete Context Detection
// ---------------------------------------------------------------------------

/**
 * Detect which athlete(s) are mentioned in a transcript.
 * Returns array of matched student IDs.
 */
export function detectAthleteContext(
  transcript: string,
  students: Array<{ id: string; name: string }>,
): string[] {
  // Plain substring matching over free-form speech produced false hits:
  // an athlete named "Sol" matched "solo"/"solamente", "Ana" matched "Anabel".
  // Match on whole words instead, and accept either the full name or any
  // single name part (first name / surname) as long as it is 3+ chars.
  const normalize = (t: string) =>
    t
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const words = new Set(normalize(transcript).split(/[^a-z0-9]+/).filter(Boolean));
  const normalizedTranscript = normalize(transcript);

  // A full multi-word name spoken verbatim is the strongest signal — when one
  // is present, prefer it outright. Otherwise two athletes sharing a first
  // name ("Ana Torres" / "Ana Maria Ruiz") would both light up.
  const fullNameHits = students.filter((s) => {
    const fullName = normalize(s.name).trim();
    return fullName.includes(' ') && normalizedTranscript.includes(fullName);
  });
  if (fullNameHits.length > 0) return fullNameHits.map((s) => s.id);

  return students
    .filter((s) => {
      const fullName = normalize(s.name).trim();
      if (!fullName) return false;
      return fullName
        .split(/\s+/)
        .filter((part) => part.length >= 3)
        .some((part) => words.has(part));
    })
    .map((s) => s.id);
}

// ---------------------------------------------------------------------------
// Audio Recording Setup
// ---------------------------------------------------------------------------

export interface RecordingSetup {
  recording: Audio.Recording;
  meteringCleanup: () => void;
}

/**
 * Set up a recording with metering enabled for continuous conversation.
 */
export async function setupContinuousRecording(): Promise<RecordingSetup> {
  console.log('[VoiceService] Requesting microphone permission...');
  const permission = await Audio.requestPermissionsAsync();
  console.log('[VoiceService] Permission status:', permission.status);
  if (permission.status !== 'granted') {
    throw new Error('Microphone permission denied');
  }

  console.log('[VoiceService] Setting audio mode for recording...');
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });

  console.log('[VoiceService] Creating recording instance...');
  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync({
    // REQUIRED: without this, status.metering is undefined and every
    // downstream consumer (silence detection, barge-in, mic level UI)
    // silently sees -160 dBFS forever.
    isMeteringEnabled: true,
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

  console.log('[VoiceService] Starting recording...');
  await recording.startAsync();
  console.log('[VoiceService] Recording started successfully');

  return { recording, meteringCleanup: () => {} };
}

/**
 * Stop recording, get the file URI, and transcribe the audio.
 * Handles native (iOS/Android) and web differently: native fetch/FormData
 * accepts a { uri, name, type } reference, but web needs a real Blob.
 */
export async function stopAndGetTranscript(
  recording: Audio.Recording,
  sttUrl: string,
): Promise<string | null> {
  try {
    await recording.stopAndUnloadAsync();
    console.log('[VoiceService] Recording stopped for transcription');
  } catch (e) {
    console.log('[VoiceService] Recording already stopped:', String(e).substring(0, 100));
  }

  const uri = recording.getURI();
  if (!uri) {
    console.log('[VoiceService] No recording URI — cannot transcribe');
    return null;
  }
  console.log('[VoiceService] Recording URI:', uri, '| Platform:', Platform.OS);

  const uriParts = uri.split('.');
  const fileType = uriParts[uriParts.length - 1]?.split('?')[0] || (Platform.OS === 'web' ? 'webm' : 'm4a');
  const mimeType = fileType === 'wav' ? 'audio/wav' : `audio/${fileType}`;

  const formData = new FormData();

  if (Platform.OS === 'web') {
    // Web: the URI is a blob: URL — fetch it into a real Blob/File before upload.
    try {
      const blobResponse = await fetch(uri);
      const blob = await blobResponse.blob();
      const file = new File([blob], `voice.${fileType}`, { type: blob.type || mimeType });
      formData.append('audio', file);
    } catch (e) {
      console.log('[VoiceService] Web blob conversion failed:', String(e).substring(0, 200));
      return null;
    }
  } else {
    // Native (iOS/Android): pass the file reference directly.
    formData.append('audio', {
      uri,
      name: `voice.${fileType}`,
      type: mimeType,
    } as unknown as Blob);
  }

  formData.append('language', 'es');

  console.log('[VoiceService] Sending STT request to:', sttUrl);
  try {
    const response = await fetch(sttUrl, { method: 'POST', body: formData });
    console.log('[VoiceService] STT response status:', response.status);
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.log('[VoiceService] STT error body:', errText.substring(0, 200));
      return null;
    }
    const data = await response.json();
    console.log('[VoiceService] STT result:', JSON.stringify(data).substring(0, 200));
    return data.text?.trim() || null;
  } catch (e) {
    console.log('[VoiceService] STT network error:', String(e).substring(0, 200));
    return null;
  }
}


// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

export function cleanupVoiceService(): void {
  isBargedIn = true;
  if (currentSound) {
    currentSound.unloadAsync().catch(() => {});
    currentSound = null;
  }
}
