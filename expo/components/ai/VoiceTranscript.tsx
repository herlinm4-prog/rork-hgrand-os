// components/ai/VoiceTranscript.tsx
// Streaming transcript overlay — frosted glass card showing live conversation.
// Typewriter cursor effect during AI streaming, auto-scroll, phase-aware styling.

import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  StyleSheet,
} from 'react-native';
import type { VoicePhase } from './VoiceConversation';
import { StreamingText } from './StreamingText';

interface TranscriptTurn {
  role: 'coach' | 'assistant';
  text: string;
  timestamp: number;
}

interface VoiceTranscriptProps {
  turns: TranscriptTurn[];
  currentStreamingText: string;
  isStreaming: boolean;
  phase: VoicePhase;
  maxHeight?: number;
}

export function VoiceTranscript({
  turns,
  currentStreamingText,
  isStreaming,
  phase,
  maxHeight = 220,
}: VoiceTranscriptProps) {
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Auto-scroll to bottom when new turns arrive or streaming text changes
  useEffect(() => {
    if (turns.length > 0 || currentStreamingText) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [turns.length, currentStreamingText]);

  // Fade in the panel
  useEffect(() => {
    if (turns.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [turns.length, fadeAnim]);

  // Phase accent color for the streaming cursor
  const accentColor = useMemo(() => {
    switch (phase) {
      case 'listening': return '#34C759';
      case 'thinking': return '#FF9F0A';
      case 'speaking': return '#E5484D';
      default: return '#E5484D';
    }
  }, [phase]);

  if (turns.length === 0 && !currentStreamingText) return null;

  const lastTurns = turns.slice(-8);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, maxHeight }]}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {lastTurns.map((turn, i) => (
          <View key={`${turn.timestamp}-${i}`} style={styles.turn}>
            <View style={styles.turnHeader}>
              <View style={[
                styles.roleDot,
                { backgroundColor: turn.role === 'coach' ? '#5E9EFF' : '#E5484D' },
              ]} />
              <Text style={styles.roleLabel}>
                {turn.role === 'coach' ? 'Tú' : 'Sol'}
              </Text>
            </View>
            <Text style={[styles.turnText, turn.role === 'assistant' && styles.assistantText]}>
              {turn.text}
            </Text>
          </View>
        ))}

        {/* Streaming AI response with cursor */}
        {currentStreamingText ? (
          <View style={styles.turn}>
            <View style={styles.turnHeader}>
              <View style={[styles.roleDot, { backgroundColor: '#E5484D' }]} />
              <Text style={styles.roleLabel}>Sol</Text>
            </View>
            <StreamingText
              text={currentStreamingText}
              isStreaming={isStreaming}
              baseStyle={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: 14,
                lineHeight: 21,
                fontWeight: '400' as const,
              }}
              boldColor="#fff"
              headerColor="#fff"
              accentColor={accentColor}
            />
          </View>
        ) : null}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 8,
  },
  turn: {
    marginBottom: 16,
  },
  turnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  roleLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  turnText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400' as const,
  },
  assistantText: {
    color: 'rgba(255,255,255,0.85)',
  },
});
