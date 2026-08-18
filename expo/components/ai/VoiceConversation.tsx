// components/ai/VoiceConversation.tsx
// Premium Apple-style voice conversation — deep indigo-black backdrop,
// frosted glass top bar, refined orb centerpiece, elegant typography.
//
// Design philosophy: Apple's voice memo meets a luxury audio experience.
// Every element is intentional — generous whitespace, subtle borders,
// refined colors that breathe with the conversation.

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';
import { X, User, Settings } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  speakStreaming,
  stopSpeech,
  detectAthleteContext,
  cleanupVoiceService,
  createSilenceDetector,
  shouldBargeIn,
  setupContinuousRecording,
  stopAndGetTranscript,
  getVoiceIdFromPreset,
  type AudioLevels,
} from '@/utils/voiceService';
import { recordMemoryEvent, saveConversationTranscript } from '@/utils/api';
import { VoiceOrb } from './VoiceOrb';
import { VoiceTranscript } from './VoiceTranscript';
import type { VoiceSettings, VoiceSpeed } from '@/types/settings';

// ── Types ──────────────────────────────────────────────────────────────

export type VoicePhase =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'interrupted';

interface VoiceTurn {
  role: 'coach' | 'assistant';
  text: string;
  timestamp: number;
}

interface VoiceConversationProps {
  visible: boolean;
  onClose: () => void;
  systemContext: string;
  students: Array<{ id: string; name: string }>;
  onCoachMessage: (text: string, onPartial?: (chunkText: string) => void) => Promise<string>;
  voiceSettings: VoiceSettings;
  onOpenSettings: () => void;
}

const STT_URL = 'https://toolkit.rork.com/stt/transcribe/';

// ── Premium Apple dark palette ────────────────────────────────────────

const BG = '#08080D';
const SURFACE = 'rgba(255,255,255,0.03)';
const SURFACE_RAISED = 'rgba(255,255,255,0.05)';
const BORDER = 'rgba(255,255,255,0.06)';
const BORDER_ACTIVE = 'rgba(255,255,255,0.1)';
const TEXT_PRIMARY = 'rgba(255,255,255,0.92)';
const TEXT_SECONDARY = 'rgba(255,255,255,0.55)';
const TEXT_TERTIARY = 'rgba(255,255,255,0.28)';
const TEXT_QUATERNARY = 'rgba(255,255,255,0.1)';
const ACCENT = '#818CF8';
const SUCCESS = '#34C759';
const DANGER = 'rgba(252,165,165,0.9)';
const DANGER_BG = 'rgba(239,68,68,0.08)';
const DANGER_BORDER = 'rgba(239,68,68,0.15)';

// ── Component ──────────────────────────────────────────────────────────

export function VoiceConversation({
  visible,
  onClose,
  systemContext,
  students,
  onCoachMessage,
  voiceSettings,
  onOpenSettings,
}: VoiceConversationProps) {
  // ── State ────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [turns, setTurns] = useState<VoiceTurn[]>([]);
  const [streamingText, setStreamingText] = useState<string>('');
  const [isStreamingAI, setIsStreamingAI] = useState<boolean>(false);
  const [detectedAthletes, setDetectedAthletes] = useState<Array<{ id: string; name: string }>>([]);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [conversationStarted, setConversationStarted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pipelineStep, setPipelineStep] = useState<string>('');

  // ── Refs ─────────────────────────────────────────────────────────
  const recordingRef = useRef<Audio.Recording | null>(null);
  const isMountedRef = useRef(true);
  const phaseRef = useRef<VoicePhase>('idle');
  const silenceDetectorRef = useRef<ReturnType<typeof createSilenceDetector> | null>(null);
  const bargeMonitorRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRecordingRef = useRef(false);
  const processVoiceInputRef = useRef<() => Promise<void>>(async () => {});
  const studentsRef = useRef(students);
  studentsRef.current = students;
  const voiceSettingsRef = useRef(voiceSettings);
  voiceSettingsRef.current = voiceSettings;

  // ── Progressive speech queue ────────────────────────────────────────
  // Sentences arrive from onCoachMessage as soon as they're generated
  // (not after the whole reply is done) and are spoken in order here —
  // this is what gives Sol a fluid, "thinking out loud" feel instead of
  // a long silent pause followed by one big block of speech.
  const speechQueueRef = useRef<string[]>([]);
  const speechQueueActiveRef = useRef(false);
  const speechDoneRef = useRef(false);

  // Fade-in animation for the entire modal
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanupVoiceService();
      stopAllInternal();
    };
  }, []);

  // Fade-in on visible
  useEffect(() => {
    if (visible) {
      fadeIn.setValue(0);
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeIn]);

  const stopAllInternal = useCallback(async () => {
    silenceDetectorRef.current?.stop();
    silenceDetectorRef.current = null;
    if (bargeMonitorRef.current) {
      clearInterval(bargeMonitorRef.current);
      bargeMonitorRef.current = null;
    }
    if (recordingRef.current) {
      try { await recordingRef.current.stopAndUnloadAsync(); } catch {}
      recordingRef.current = null;
    }
    isRecordingRef.current = false;
  }, []);

  // ── Silence detection ────────────────────────────────────────────
  const handleSilenceDetected = useCallback(() => {
    if (phaseRef.current === 'listening') {
      processVoiceInputRef.current();
    }
  }, []);

  // ── Barge-in monitoring ──────────────────────────────────────────
  const startBargeMonitoring = useCallback(() => {
    if (bargeMonitorRef.current) clearInterval(bargeMonitorRef.current);
    bargeMonitorRef.current = setInterval(async () => {
      if (!recordingRef.current || !isRecordingRef.current) return;
      try {
        const status = await recordingRef.current.getStatusAsync();
        if (!status.isRecording) return;
        const metering = (status as any).metering ?? -160;
        const levels: AudioLevels = {
          metering,
          isSpeaking: metering > -32,
          normalizedLevel: Math.max(0, Math.min(1, (metering + 60) / 60)),
        };
        if (shouldBargeIn(levels) && phaseRef.current === 'speaking') {
          if (bargeMonitorRef.current) clearInterval(bargeMonitorRef.current);
          bargeMonitorRef.current = null;
          await stopSpeech();
          if (isMountedRef.current) {
            setPhase('interrupted');
            setStreamingText('');
            setIsStreamingAI(false);
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setTimeout(() => {
              if (isMountedRef.current && phaseRef.current === 'interrupted') {
                startListening();
              }
            }, 400);
          }
        }
      } catch {}
    }, 200);
  }, []);

  const stopBargeMonitoring = useCallback(() => {
    if (bargeMonitorRef.current) {
      clearInterval(bargeMonitorRef.current);
      bargeMonitorRef.current = null;
    }
  }, []);

  // ── Progressive speech queue runner ──────────────────────────────
  // Pulls sentences off the queue one at a time and speaks them in
  // order, as soon as they're available — while the AI may still be
  // generating the rest of the reply in the background.
  const runSpeechQueue = useCallback(async () => {
    if (speechQueueActiveRef.current) return;
    speechQueueActiveRef.current = true;
    try {
      while (true) {
        if (!isMountedRef.current) break;
        if (speechQueueRef.current.length === 0) {
          if (speechDoneRef.current) break;
          await new Promise((r) => setTimeout(r, 60));
          continue;
        }
        const chunk = speechQueueRef.current.shift()!;
        const vs = voiceSettingsRef.current;
        const voiceId = getVoiceIdFromPreset(vs.voicePresetId);
        const speed = vs.speed as VoiceSpeed;
        const result = await speakStreaming(chunk, undefined, voiceId, speed);
        if (result === 'interrupted') {
          speechQueueRef.current = [];
          break;
        }
      }
    } finally {
      speechQueueActiveRef.current = false;
    }
  }, []);

  // ── End call ─────────────────────────────────────────────────────
  const handleEndCall = useCallback(async () => {
    silenceDetectorRef.current?.stop();
    silenceDetectorRef.current = null;
    stopBargeMonitoring();
    await stopSpeech();
    await stopAllInternal();
    cleanupVoiceService();
    onClose();
  }, [onClose, stopAllInternal, stopBargeMonitoring]);

  // ── Start listening ──────────────────────────────────────────────
  const startListening = useCallback(async () => {
    try {
      setErrorMsg(null);
      setPipelineStep('Configurando micrófono...');
      await stopAllInternal();
      const { recording } = await setupContinuousRecording();
      recordingRef.current = recording;
      isRecordingRef.current = true;

      const detector = createSilenceDetector(handleSilenceDetected, {
        silenceThreshold: -38,
        silenceDuration: 1500,
        minSpeakingDuration: 800,
      });
      silenceDetectorRef.current = detector;

      let meteringActive = true;
      recording.setProgressUpdateInterval(100);
      recording.setOnRecordingStatusUpdate((status) => {
        if (!status.isRecording || !meteringActive) return;
        const metering = (status as any).metering ?? -160;
        const isSpeaking = metering > -38;
        const normalizedLevel = Math.max(0, Math.min(1, (metering + 60) / 60));
        setMicLevel(normalizedLevel);
        detector.updateLevels({ metering, isSpeaking, normalizedLevel });
      });

      detector.start();
      setPhase('listening');
      setStreamingText('');
      setIsStreamingAI(false);
      setConversationStarted(true);
      setPipelineStep('');
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.log('[VoiceConv] Start listening ERROR:', String(err));
      setErrorMsg('No pude acceder al micrófono. Verifica los permisos.');
      if (isMountedRef.current) setPhase('idle');
    }
  }, [handleSilenceDetected, stopAllInternal]);

  // ── Process voice → STT → AI → TTS ───────────────────────────────
  const processVoiceInput = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) return;

    silenceDetectorRef.current?.stop();
    silenceDetectorRef.current = null;
    setPhase('thinking');
    setErrorMsg(null);
    setPipelineStep('Transcribiendo...');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    recording.setOnRecordingStatusUpdate(null);
    const transcript = await stopAndGetTranscript(recording, STT_URL);
    recordingRef.current = null;
    isRecordingRef.current = false;

    if (!transcript || !transcript.trim()) {
      if (isMountedRef.current) {
        setErrorMsg('No entendí. Intenta de nuevo.');
        setPhase('idle');
        setTimeout(() => {
          if (isMountedRef.current && phaseRef.current === 'idle') startListening();
        }, 1200);
      }
      return;
    }

    if (!isMountedRef.current) return;

    // Save coach turn
    const coachTurn: VoiceTurn = { role: 'coach', text: transcript, timestamp: Date.now() };
    setTurns((prev) => [...prev, coachTurn]);
    setErrorMsg(null);

    saveConversationTranscript({
      studentId: null,
      role: 'coach',
      text: transcript,
      date: new Date().toISOString(),
      metadata: { source: 'voice_conversation' },
    }).catch(() => {});

    // Detect athlete context
    const latestStudents = studentsRef.current;
    const athleteIds = detectAthleteContext(transcript, latestStudents);
    const matchedAthletes = latestStudents.filter((s) => athleteIds.includes(s.id));
    setDetectedAthletes(matchedAthletes);

    // Save to athlete memory (non-blocking)
    if (matchedAthletes.length > 0) {
      for (const athlete of matchedAthletes) {
        try {
          await recordMemoryEvent(athlete.id, {
            type: 'coach_note',
            title: 'Conversación de voz',
            description: transcript.substring(0, 500),
            date: new Date().toISOString(),
            createdBy: 'ai',
            metadata: { source: 'voice_conversation' },
            studentId: athlete.id,
          });
        } catch {}
      }
    }

    // Get AI response — speak each sentence as soon as it's ready instead
    // of waiting for the full reply, so Sol feels like she's talking in
    // real time rather than pausing then dumping one long block of audio.
    setPipelineStep('Sol está pensando...');
    try {
      setPhase('speaking');
      setIsStreamingAI(true);
      setPipelineStep('Reproduciendo respuesta...');

      stopBargeMonitoring();
      await stopAllInternal();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      speechQueueRef.current = [];
      speechDoneRef.current = false;

      const handlePartial = (chunkText: string) => {
        if (!isMountedRef.current) return;
        setStreamingText((prev) => (prev ? prev + ' ' + chunkText : chunkText));
        speechQueueRef.current.push(chunkText);
        void runSpeechQueue();
      };

      const aiResponse = await onCoachMessage(transcript, handlePartial);
      speechDoneRef.current = true;

      // Let any queued sentences finish playing before moving on
      while (isMountedRef.current && (speechQueueActiveRef.current || speechQueueRef.current.length > 0)) {
        await new Promise((r) => setTimeout(r, 80));
      }

      if (!isMountedRef.current) return;

      const aiTurn: VoiceTurn = { role: 'assistant', text: aiResponse, timestamp: Date.now() };
      setTurns((prev) => [...prev, aiTurn]);

      saveConversationTranscript({
        studentId: matchedAthletes[0]?.id ?? null,
        role: 'assistant',
        text: aiResponse,
        date: new Date().toISOString(),
        metadata: { source: 'voice_conversation' },
      }).catch(() => {});

      if (matchedAthletes.length > 0) {
        for (const athlete of matchedAthletes) {
          try {
            await recordMemoryEvent(athlete.id, {
              type: 'ai_suggestion',
              title: 'Respuesta de Sol (voz)',
              description: aiResponse.substring(0, 500),
              date: new Date().toISOString(),
              createdBy: 'ai',
              metadata: { source: 'voice_conversation' },
              studentId: athlete.id,
            });
          } catch {}
        }
      }

      setIsStreamingAI(false);
    } catch (err) {
      console.log('[VoiceConv] AI/TTS error:', String(err));
      speechDoneRef.current = true;
      speechQueueRef.current = [];
      if (isMountedRef.current) {
        setErrorMsg('La voz no está disponible, pero puedes leer mi respuesta arriba.');
      }
    }

    if (!isMountedRef.current) return;

    setPhase('idle');
    setStreamingText('');
    setPipelineStep('');
    await stopAllInternal();

    if (voiceSettingsRef.current.autoListen) {
      setTimeout(() => {
        if (isMountedRef.current && phaseRef.current === 'idle') startListening();
      }, 600);
    }
  }, [onCoachMessage, startListening, stopAllInternal, startBargeMonitoring, stopBargeMonitoring, runSpeechQueue]);

  processVoiceInputRef.current = processVoiceInput;

  // ── Tap orb handler ──────────────────────────────────────────────
  const handleTapOrb = useCallback(() => {
    if (phase === 'listening') {
      processVoiceInput();
    } else if (phase === 'idle' || phase === 'interrupted') {
      startListening();
    } else if (phase === 'speaking') {
      stopSpeech();
      setPhase('interrupted');
      setStreamingText('');
      setIsStreamingAI(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setTimeout(() => {
        if (isMountedRef.current) startListening();
      }, 400);
    }
  }, [phase, processVoiceInput, startListening]);

  // ── Status label ─────────────────────────────────────────────────
  const statusLabel = useMemo(() => {
    switch (phase) {
      case 'idle': return conversationStarted ? 'Escuchando...' : 'Toca para hablar';
      case 'listening': return 'Escuchando...';
      case 'thinking': return 'Procesando...';
      case 'speaking': return 'Respondiendo...';
      case 'interrupted': return 'Escuchando...';
    }
  }, [phase, conversationStarted]);

  const hintText = useMemo(() => {
    if (pipelineStep) return pipelineStep;
    switch (phase) {
      case 'idle': return conversationStarted ? 'Habla cuando quieras' : 'Toca el círculo para empezar';
      case 'listening': return Platform.OS === 'web' ? 'Te escucho... toca cuando termines' : 'Te escucho...';
      case 'thinking': return 'Procesando...';
      case 'speaking': return 'Toca para interrumpir';
      case 'interrupted': return 'Adelante, te escucho...';
    }
  }, [phase, conversationStarted, pipelineStep]);

  // ── Auto-reset on mount ──────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => {
        if (isMountedRef.current) {
          setConversationStarted(false);
          setPhase('idle');
          setTurns([]);
          setStreamingText('');
          setDetectedAthletes([]);
        }
      }, 300);
      return () => clearTimeout(t);
    }
  }, [visible]);

  // ── Render ───────────────────────────────────────────────────────
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={handleEndCall}
      statusBarTranslucent
    >
      <StatusBar style="light" />
      <Animated.View style={[styles.root, { opacity: fadeIn }]}>
        {/* ── Glass top bar ─────────────────────────────────────── */}
        <View style={styles.topBar}>
          {/* Close */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleEndCall}
            activeOpacity={0.5}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={20} color={TEXT_SECONDARY} />
          </TouchableOpacity>

          {/* Center */}
          <View style={styles.topCenter}>
            <Text style={styles.topTitle}>Sol</Text>
          </View>

          {/* Settings */}
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={onOpenSettings}
            activeOpacity={0.5}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Settings size={18} color={TEXT_TERTIARY} />
          </TouchableOpacity>
        </View>

        {/* ── Athlete context chip ──────────────────────────────── */}
        {detectedAthletes.length > 0 && (
          <View style={styles.athleteChip}>
            <User size={11} color={TEXT_SECONDARY} />
            <Text style={styles.athleteChipText} numberOfLines={1}>
              {detectedAthletes.map((a) => a.name).join(', ')}
            </Text>
          </View>
        )}

        {/* ── Transcript ────────────────────────────────────────── */}
        <View style={styles.transcriptArea}>
          <VoiceTranscript
            turns={turns}
            currentStreamingText={streamingText}
            isStreaming={isStreamingAI}
            phase={phase}
            maxHeight={160}
          />
        </View>

        {/* ── Orb centerpiece ───────────────────────────────────── */}
        <View style={styles.orbSection}>
          <TouchableOpacity
            onPress={handleTapOrb}
            activeOpacity={0.92}
            style={styles.orbTouchable}
          >
            <VoiceOrb phase={phase} micLevel={micLevel} size={190} />
          </TouchableOpacity>
        </View>

        {/* ── Status ────────────────────────────────────────────── */}
        <View style={styles.statusSection}>
          <Text style={styles.statusLabel}>{statusLabel}</Text>
          <Text style={styles.hintText}>{hintText}</Text>
          {errorMsg && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}
        </View>

        {/* ── Footer ────────────────────────────────────────────── */}
        <Text style={styles.footer}>HGRAND AI</Text>
      </Animated.View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 36,
    paddingHorizontal: 24,
  },

  // ── Top bar — frosted glass feel via surface + border ───────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: SURFACE_RAISED,
    borderWidth: 0.5,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: SURFACE_RAISED,
    borderWidth: 0.5,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCenter: {
    alignItems: 'center',
  },
  topTitle: {
    color: TEXT_PRIMARY,
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: -0.25,
  },

  // ── Athlete chip ────────────────────────────────────────────────
  athleteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: SURFACE_RAISED,
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 5,
    marginTop: 10,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  athleteChipText: {
    color: TEXT_SECONDARY,
    fontSize: 11.5,
    fontWeight: '500' as const,
  },

  // ── Transcript ──────────────────────────────────────────────────
  transcriptArea: {
    flex: 1,
    width: '100%',
    marginTop: 16,
    marginBottom: 8,
  },

  // ── Orb ─────────────────────────────────────────────────────────
  orbSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Status ──────────────────────────────────────────────────────
  statusSection: {
    alignItems: 'center',
    marginTop: 22,
    gap: 5,
  },
  statusLabel: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  hintText: {
    color: TEXT_TERTIARY,
    fontSize: 13,
    fontWeight: '400' as const,
  },

  // ── Error ───────────────────────────────────────────────────────
  errorBanner: {
    marginTop: 10,
    backgroundColor: DANGER_BG,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: DANGER_BORDER,
  },
  errorText: {
    color: DANGER,
    fontSize: 12,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },

  // ── Footer ──────────────────────────────────────────────────────
  footer: {
    color: TEXT_QUATERNARY,
    fontSize: 10,
    fontWeight: '500' as const,
    letterSpacing: 1.8,
    textTransform: 'uppercase' as const,
  },
});
