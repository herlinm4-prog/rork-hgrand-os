// components/ai/VoiceConversation.tsx
// Premium Apple-style voice conversation — hardened turn lifecycle,
// deterministic transcript attribution, and progressive speech playback.

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
  setupContinuousRecording,
  stopAndGetTranscript,
  getVoiceIdFromPreset,
} from '@/utils/voiceService';
import { saveConversationTranscript } from '@/utils/api';
import { VoiceOrb } from './VoiceOrb';
import { VoiceTranscript } from './VoiceTranscript';
import type { VoiceSettings, VoiceSpeed } from '@/types/settings';

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

const BG = '#08080D';
const SURFACE_RAISED = 'rgba(255,255,255,0.05)';
const BORDER = 'rgba(255,255,255,0.06)';
const TEXT_PRIMARY = 'rgba(255,255,255,0.92)';
const TEXT_SECONDARY = 'rgba(255,255,255,0.55)';
const TEXT_TERTIARY = 'rgba(255,255,255,0.28)';
const TEXT_QUATERNARY = 'rgba(255,255,255,0.1)';
const DANGER = 'rgba(252,165,165,0.9)';
const DANGER_BG = 'rgba(239,68,68,0.08)';
const DANGER_BORDER = 'rgba(239,68,68,0.15)';

function createVoiceSessionId(): string {
  return `voice_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function VoiceConversation({
  visible,
  onClose,
  systemContext: _systemContext,
  students,
  onCoachMessage,
  voiceSettings,
  onOpenSettings,
}: VoiceConversationProps) {
  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [turns, setTurns] = useState<VoiceTurn[]>([]);
  const [streamingText, setStreamingText] = useState<string>('');
  const [isStreamingAI, setIsStreamingAI] = useState<boolean>(false);
  const [detectedAthletes, setDetectedAthletes] = useState<Array<{ id: string; name: string }>>([]);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [conversationStarted, setConversationStarted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pipelineStep, setPipelineStep] = useState<string>('');

  const recordingRef = useRef<Audio.Recording | null>(null);
  const isMountedRef = useRef(true);
  const phaseRef = useRef<VoicePhase>('idle');
  const silenceDetectorRef = useRef<ReturnType<typeof createSilenceDetector> | null>(null);
  const isRecordingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const processVoiceInputRef = useRef<() => Promise<void>>(async () => {});
  const studentsRef = useRef(students);
  studentsRef.current = students;
  const voiceSettingsRef = useRef(voiceSettings);
  voiceSettingsRef.current = voiceSettings;
  const sessionIdRef = useRef(createVoiceSessionId());

  const speechQueueRef = useRef<string[]>([]);
  const speechQueueActiveRef = useRef(false);
  const speechDoneRef = useRef(false);

  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const stopAllInternal = useCallback(async () => {
    silenceDetectorRef.current?.stop();
    silenceDetectorRef.current = null;
    if (recordingRef.current) {
      try { await recordingRef.current.stopAndUnloadAsync(); } catch {}
      recordingRef.current = null;
    }
    isRecordingRef.current = false;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanupVoiceService();
      void stopAllInternal();
    };
  }, [stopAllInternal]);

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

  const handleSilenceDetected = useCallback(() => {
    if (phaseRef.current === 'listening' && !isProcessingRef.current) {
      void processVoiceInputRef.current();
    }
  }, []);

  const runSpeechQueue = useCallback(async () => {
    if (speechQueueActiveRef.current) return;
    speechQueueActiveRef.current = true;
    try {
      while (true) {
        if (!isMountedRef.current) break;
        if (phaseRef.current === 'interrupted') {
          speechQueueRef.current = [];
          break;
        }
        if (speechQueueRef.current.length === 0) {
          if (speechDoneRef.current) break;
          await new Promise((resolve) => setTimeout(resolve, 60));
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

  const handleEndCall = useCallback(async () => {
    speechDoneRef.current = true;
    speechQueueRef.current = [];
    await stopSpeech();
    await stopAllInternal();
    cleanupVoiceService();
    onClose();
  }, [onClose, stopAllInternal]);

  const startListening = useCallback(async () => {
    if (isProcessingRef.current) return;

    try {
      setErrorMsg(null);
      setPipelineStep('Configurando micrófono...');
      await stopAllInternal();

      const { recording } = await setupContinuousRecording();
      if (!isMountedRef.current) {
        try { await recording.stopAndUnloadAsync(); } catch {}
        return;
      }

      recordingRef.current = recording;
      isRecordingRef.current = true;

      const detector = createSilenceDetector(handleSilenceDetected, {
        silenceThreshold: -38,
        silenceDuration: Math.max(700, voiceSettingsRef.current.silenceTimeout || 1500),
        minSpeakingDuration: 650,
      });
      silenceDetectorRef.current = detector;

      recording.setProgressUpdateInterval(100);
      recording.setOnRecordingStatusUpdate((status) => {
        if (!status.isRecording || recordingRef.current !== recording) return;
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
      console.log('[VoiceConv] Start listening error:', String(err).substring(0, 180));
      setErrorMsg('No pude acceder al micrófono. Verifica los permisos.');
      if (isMountedRef.current) setPhase('idle');
    }
  }, [handleSilenceDetected, stopAllInternal]);

  const processVoiceInput = useCallback(async () => {
    if (isProcessingRef.current) return;
    const recording = recordingRef.current;
    if (!recording) return;

    isProcessingRef.current = true;
    try {
      silenceDetectorRef.current?.stop();
      silenceDetectorRef.current = null;
      recordingRef.current = null;
      isRecordingRef.current = false;

      setPhase('thinking');
      setErrorMsg(null);
      setPipelineStep('Transcribiendo...');
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      recording.setOnRecordingStatusUpdate(null);
      const transcript = await stopAndGetTranscript(recording, STT_URL);

      if (!transcript || !transcript.trim()) {
        if (isMountedRef.current) {
          setErrorMsg('No entendí. Intenta de nuevo.');
          setPhase('idle');
        }
        return;
      }

      if (!isMountedRef.current) return;

      const latestStudents = studentsRef.current;
      const athleteIds = detectAthleteContext(transcript, latestStudents);
      const matchedAthletes = latestStudents.filter((student) => athleteIds.includes(student.id));
      setDetectedAthletes(matchedAthletes);

      const coachTurn: VoiceTurn = { role: 'coach', text: transcript, timestamp: Date.now() };
      setTurns((prev) => [...prev, coachTurn]);
      setErrorMsg(null);

      // The backend already creates athlete-memory events from detectedAthletes.
      // Do not also call recordMemoryEvent here: doing both produced duplicate
      // timeline entries for the same spoken turn.
      void saveConversationTranscript({
        studentId: matchedAthletes[0]?.id ?? null,
        role: 'coach',
        text: transcript,
        detectedAthletes: athleteIds.length > 0 ? athleteIds : null,
        date: new Date().toISOString(),
        metadata: {
          source: 'voice_conversation',
          sessionId: sessionIdRef.current,
          athleteCount: athleteIds.length,
        },
      }).catch(() => {});

      setPipelineStep('Sol está pensando...');
      setPhase('speaking');
      setIsStreamingAI(true);
      setPipelineStep('Reproduciendo respuesta...');

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
        if (!isMountedRef.current || phaseRef.current !== 'speaking') return;
        const cleanChunk = chunkText.trim();
        if (!cleanChunk) return;
        setStreamingText((prev) => (prev ? `${prev} ${cleanChunk}` : cleanChunk));
        speechQueueRef.current.push(cleanChunk);
        void runSpeechQueue();
      };

      let aiResponse = '';
      try {
        aiResponse = await onCoachMessage(transcript, handlePartial);
      } finally {
        speechDoneRef.current = true;
      }

      // If the coach tapped to interrupt, never restart queued TTS. We still
      // persist the completed model response so the conversation and memory
      // remain internally consistent.
      if (phaseRef.current !== 'interrupted') {
        while (
          isMountedRef.current &&
          (speechQueueActiveRef.current || speechQueueRef.current.length > 0)
        ) {
          await new Promise((resolve) => setTimeout(resolve, 80));
        }
      } else {
        speechQueueRef.current = [];
      }

      if (!isMountedRef.current) return;

      if (aiResponse.trim()) {
        const aiTurn: VoiceTurn = {
          role: 'assistant',
          text: aiResponse,
          timestamp: Date.now(),
        };
        setTurns((prev) => [...prev, aiTurn]);

        void saveConversationTranscript({
          studentId: matchedAthletes[0]?.id ?? null,
          role: 'assistant',
          text: aiResponse,
          detectedAthletes: athleteIds.length > 0 ? athleteIds : null,
          date: new Date().toISOString(),
          metadata: {
            source: 'voice_conversation',
            sessionId: sessionIdRef.current,
            athleteCount: athleteIds.length,
          },
        }).catch(() => {});
      }
    } catch (err) {
      console.log('[VoiceConv] Voice turn error:', String(err).substring(0, 220));
      speechDoneRef.current = true;
      speechQueueRef.current = [];
      if (isMountedRef.current) {
        setErrorMsg('No pude completar este turno de voz. Intenta de nuevo.');
      }
    } finally {
      isProcessingRef.current = false;
      setIsStreamingAI(false);

      if (isMountedRef.current) {
        setPhase('idle');
        setStreamingText('');
        setPipelineStep('');

        if (voiceSettingsRef.current.autoListen) {
          setTimeout(() => {
            if (
              isMountedRef.current &&
              phaseRef.current === 'idle' &&
              !isProcessingRef.current
            ) {
              void startListening();
            }
          }, 500);
        }
      }
    }
  }, [onCoachMessage, runSpeechQueue, startListening]);

  processVoiceInputRef.current = processVoiceInput;

  const handleTapOrb = useCallback(() => {
    if (phase === 'listening') {
      void processVoiceInput();
      return;
    }

    if (phase === 'idle') {
      void startListening();
      return;
    }

    if (phase === 'speaking') {
      speechQueueRef.current = [];
      speechDoneRef.current = true;
      void stopSpeech();
      setPhase('interrupted');
      setStreamingText('');
      setIsStreamingAI(false);
      setPipelineStep('Interrumpido. Cerrando respuesta...');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [phase, processVoiceInput, startListening]);

  const statusLabel = useMemo(() => {
    switch (phase) {
      case 'idle': return conversationStarted ? 'Lista' : 'Toca para hablar';
      case 'listening': return 'Escuchando...';
      case 'thinking': return 'Procesando...';
      case 'speaking': return 'Respondiendo...';
      case 'interrupted': return 'Interrumpida';
    }
  }, [phase, conversationStarted]);

  const hintText = useMemo(() => {
    if (pipelineStep) return pipelineStep;
    switch (phase) {
      case 'idle': return conversationStarted ? 'Habla cuando quieras' : 'Toca el círculo para empezar';
      case 'listening': return Platform.OS === 'web' ? 'Te escucho... toca cuando termines' : 'Te escucho...';
      case 'thinking': return 'Procesando...';
      case 'speaking': return 'Toca para cortar la voz';
      case 'interrupted': return 'Preparando el siguiente turno...';
    }
  }, [phase, conversationStarted, pipelineStep]);

  useEffect(() => {
    if (!visible) return;

    sessionIdRef.current = createVoiceSessionId();
    isProcessingRef.current = false;
    speechQueueRef.current = [];
    speechDoneRef.current = false;

    const timer = setTimeout(() => {
      if (!isMountedRef.current) return;
      setConversationStarted(false);
      setPhase('idle');
      setTurns([]);
      setStreamingText('');
      setDetectedAthletes([]);
      setErrorMsg(null);
      setPipelineStep('');
    }, 250);

    return () => clearTimeout(timer);
  }, [visible]);

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
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleEndCall}
            activeOpacity={0.5}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={20} color={TEXT_SECONDARY} />
          </TouchableOpacity>

          <View style={styles.topCenter}>
            <Text style={styles.topTitle}>Sol</Text>
          </View>

          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={onOpenSettings}
            activeOpacity={0.5}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Settings size={18} color={TEXT_TERTIARY} />
          </TouchableOpacity>
        </View>

        {detectedAthletes.length > 0 && (
          <View style={styles.athleteChip}>
            <User size={11} color={TEXT_SECONDARY} />
            <Text style={styles.athleteChipText} numberOfLines={1}>
              {detectedAthletes.map((athlete) => athlete.name).join(', ')}
            </Text>
          </View>
        )}

        <View style={styles.transcriptArea}>
          <VoiceTranscript
            turns={turns}
            currentStreamingText={streamingText}
            isStreaming={isStreamingAI}
            phase={phase}
            maxHeight={160}
          />
        </View>

        <View style={styles.orbSection}>
          <TouchableOpacity
            onPress={handleTapOrb}
            activeOpacity={0.92}
            style={styles.orbTouchable}
          >
            <VoiceOrb phase={phase} micLevel={micLevel} size={190} />
          </TouchableOpacity>
        </View>

        <View style={styles.statusSection}>
          <Text style={styles.statusLabel}>{statusLabel}</Text>
          <Text style={styles.hintText}>{hintText}</Text>
          {errorMsg && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}
        </View>

        <Text style={styles.footer}>HGRAND AI</Text>
      </Animated.View>
    </Modal>
  );
}

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
  transcriptArea: {
    flex: 1,
    width: '100%',
    marginTop: 16,
    marginBottom: 8,
  },
  orbSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  footer: {
    color: TEXT_QUATERNARY,
    fontSize: 10,
    fontWeight: '500' as const,
    letterSpacing: 1.8,
    textTransform: 'uppercase' as const,
  },
});
