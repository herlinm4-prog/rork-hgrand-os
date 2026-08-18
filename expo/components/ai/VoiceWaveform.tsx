// components/ai/VoiceWaveform.tsx
// Neural waveform — dynamic bars that react to mic intensity and phase.

import React, { useEffect, useMemo } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import type { VoicePhase } from './VoiceConversation';

interface VoiceWaveformProps {
  phase: VoicePhase;
  micLevel: number;
  barCount?: number;
}

const PHASE_COLORS: Record<VoicePhase, string> = {
  idle: 'rgba(229,72,77,0.2)',
  listening: '#34C759',
  thinking: '#FF9F0A',
  speaking: '#E5484D',
  interrupted: '#FF9F0A',
};

const BASE_HEIGHTS = [0.6, 0.35, 0.8, 0.5, 0.9, 0.4, 0.7];

export function VoiceWaveform({ phase, micLevel, barCount = 7 }: VoiceWaveformProps) {
  const color = PHASE_COLORS[phase] || PHASE_COLORS.idle;

  // Animated.Value is not a hook. Creating the values inside useMemo keeps a
  // stable array for a given bar count while respecting the Rules of Hooks.
  const barAnims = useMemo(
    () => Array.from(
      { length: barCount },
      (_, index) => new Animated.Value((BASE_HEIGHTS[index % BASE_HEIGHTS.length] ?? 0.5) * 2),
    ),
    [barCount],
  );

  useEffect(() => {
    if (phase === 'listening') {
      const loops = barAnims.map((anim, i) => {
        const baseH = BASE_HEIGHTS[i % BASE_HEIGHTS.length] ?? 0.5;
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: baseH * 4 + micLevel * 32 + Math.random() * 12,
              duration: 120 + Math.random() * 200,
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: baseH * 4 + micLevel * 16 + Math.random() * 8,
              duration: 120 + Math.random() * 200,
              useNativeDriver: false,
            }),
          ]),
        );
      });

      loops.forEach((loop) => loop.start());
      return () => {
        loops.forEach((loop) => loop.stop());
        barAnims.forEach((anim) => anim.stopAnimation());
      };
    }

    if (phase === 'thinking') {
      barAnims.forEach((anim, i) => {
        const baseH = BASE_HEIGHTS[i % BASE_HEIGHTS.length] ?? 0.5;
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: baseH * 3 + 4,
              duration: 600 + i * 100,
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: baseH * 2 + 2,
              duration: 600 + i * 100,
              useNativeDriver: false,
            }),
          ]),
        ).start();
      });
    }

    if (phase === 'speaking') {
      barAnims.forEach((anim, i) => {
        const baseH = BASE_HEIGHTS[i % BASE_HEIGHTS.length] ?? 0.5;
        Animated.loop(
          Animated.sequence([
            Animated.spring(anim, {
              toValue: baseH * 3.5 + 6 + Math.random() * 4,
              friction: 10,
              tension: 20,
              useNativeDriver: false,
            }),
            Animated.spring(anim, {
              toValue: baseH * 2 + 2,
              friction: 10,
              tension: 20,
              useNativeDriver: false,
            }),
          ]),
        ).start();
      });
    }

    if (phase === 'idle' || phase === 'interrupted') {
      barAnims.forEach((anim, i) => {
        const baseH = BASE_HEIGHTS[i % BASE_HEIGHTS.length] ?? 0.5;
        Animated.spring(anim, {
          toValue: baseH * 2,
          friction: 12,
          tension: 30,
          useNativeDriver: false,
        }).start();
      });
    }

    return () => {
      barAnims.forEach((anim) => anim.stopAnimation());
    };
  }, [phase, micLevel, barAnims]);

  return (
    <View style={styles.container}>
      {barAnims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              height: anim,
              backgroundColor: color,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 48,
  },
  bar: {
    width: 3.5,
    borderRadius: 2,
    minHeight: 3,
    maxHeight: 48,
  },
});
