// components/ai/VoiceOrb.tsx
// Premium Apple-style voice orb — glass morphism, organic fluid animations,
// refined ring system, and a deeply polished dark aesthetic.
//
// Design philosophy: Apple's Siri meets a luxury timepiece. Deep indigo-black
// core with frosted glass rings, warm ambient glow, and fluid waveform bars
// that breathe with organic rhythm.

import React, { useRef, useEffect, useMemo } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import type { VoicePhase } from './VoiceConversation';

interface VoiceOrbProps {
  phase: VoicePhase;
  micLevel: number; // 0-1
  size?: number;
}

// ── Premium Apple-inspired color system ─────────────────────────────
// Deep indigo-black core (not pure black — richer, with warm undertones)
const CORE_BG_START = '#14141A';
const CORE_BG_END = '#1A1A24';
const CORE_BORDER = 'rgba(255,255,255,0.07)';
const CORE_INNER_GLOW = 'rgba(99,102,241,0.04)';

// Waveform bar colors — warm white with subtle violet tint
const WAVEFORM_ACTIVE = 'rgba(245,245,255,0.92)';
const WAVEFORM_IDLE = 'rgba(255,255,255,0.25)';

// Phase ring colors — refined, lower opacity for sophistication
const PHASE_RING_COLORS: Record<VoicePhase, { outer: string; inner: string; glow: string }> = {
  idle: {
    outer: 'rgba(255,255,255,0.04)',
    inner: 'rgba(255,255,255,0.05)',
    glow: 'rgba(255,255,255,0.02)',
  },
  listening: {
    outer: 'rgba(99,102,241,0.2)',
    inner: 'rgba(99,102,241,0.3)',
    glow: 'rgba(99,102,241,0.12)',
  },
  thinking: {
    outer: 'rgba(245,158,11,0.18)',
    inner: 'rgba(245,158,11,0.25)',
    glow: 'rgba(245,158,11,0.1)',
  },
  speaking: {
    outer: 'rgba(239,68,68,0.16)',
    inner: 'rgba(239,68,68,0.22)',
    glow: 'rgba(239,68,68,0.08)',
  },
  interrupted: {
    outer: 'rgba(245,158,11,0.18)',
    inner: 'rgba(245,158,11,0.25)',
    glow: 'rgba(245,158,11,0.1)',
  },
};

export function VoiceOrb({ phase, micLevel, size = 180 }: VoiceOrbProps) {
  const ringColors = PHASE_RING_COLORS[phase] || PHASE_RING_COLORS.idle;

  // ── Animation values ─────────────────────────────────────────────
  const coreScale = useRef(new Animated.Value(1)).current;
  const coreOpacity = useRef(new Animated.Value(1)).current;

  // Outer ambient ring
  const ambientRingScale = useRef(new Animated.Value(1)).current;
  const ambientRingOpacity = useRef(new Animated.Value(0)).current;

  // Inner reactive ring
  const reactiveRingScale = useRef(new Animated.Value(1)).current;
  const reactiveRingOpacity = useRef(new Animated.Value(0)).current;
  const reactiveRingRotate = useRef(new Animated.Value(0)).current;

  // Glow
  const glowOpacity = useRef(new Animated.Value(0.02)).current;
  const glowScale = useRef(new Animated.Value(1)).current;

  // Waveform bars — 7 bars for richer visual (Apple uses odd numbers)
  const barAnims = useMemo(
    () => Array.from({ length: 7 }, () => new Animated.Value(8)),
    [],
  );

  // ── Mic-reactive core pulse (only runs during listening, follows mic) ──
  useEffect(() => {
    if (phase !== 'listening') return;
    const target = 1 + micLevel * 0.08;
    Animated.spring(coreScale, {
      toValue: target,
      friction: 12,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [micLevel, phase, coreScale]);

  // ── Phase-driven animation orchestration (only re-runs on phase change) ──
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    // Kill all running animations
    const cleanup = () => {
      [coreScale, coreOpacity, ambientRingScale, ambientRingOpacity,
       reactiveRingScale, reactiveRingOpacity, reactiveRingRotate, glowOpacity, glowScale]
        .forEach(a => a.stopAnimation());
      barAnims.forEach(a => a.stopAnimation());
    };
    cleanup();

    // Reset all to neutral
    coreScale.setValue(1);
    coreOpacity.setValue(1);
    ambientRingScale.setValue(1);
    ambientRingOpacity.setValue(0);
    reactiveRingScale.setValue(1);
    reactiveRingOpacity.setValue(0);
    reactiveRingRotate.setValue(0);
    glowOpacity.setValue(0.02);
    glowScale.setValue(1);
    barAnims.forEach(a => a.setValue(8));

    // ═══ IDLE: Gentle breathing, subtle glow, floating bars ═══
    if (phase === 'idle') {
      // Core gentle breathing
      Animated.loop(
        Animated.sequence([
          Animated.timing(coreScale, {
            toValue: 1.015,
            duration: 2800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(coreScale, {
            toValue: 1,
            duration: 2800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // Subtle glow breathing
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.04,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.02,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // Floating bars — gentle, organic
      barAnims.forEach((anim, i) => {
        const offset = i * 180;
        Animated.loop(
          Animated.sequence([
            Animated.spring(anim, {
              toValue: 5 + Math.sin(i * 0.8) * 4 + 4,
              friction: 16,
              tension: 22,
              useNativeDriver: false,
            }),
            Animated.spring(anim, {
              toValue: 7 + Math.cos(i * 0.8) * 4 + 4,
              friction: 16,
              tension: 22,
              useNativeDriver: false,
            }),
          ]),
        ).start();
      });
    }

    // ═══ LISTENING: Reactive rings, pulsing glow, active waveform ═══
    if (phase === 'listening') {
      // Glow pulses with mic
      const glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.12,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.06,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      );
      glowLoop.start();
      const glowScaleLoop = Animated.loop(
        Animated.spring(glowScale, {
          toValue: 1.04,
          friction: 16,
          tension: 30,
          useNativeDriver: true,
        }),
      );
      glowScaleLoop.start();

      // Ambient ring — slow expand/fade
      const ambientLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(ambientRingScale, {
              toValue: 1.18,
              duration: 800,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(ambientRingScale, {
              toValue: 1.0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(ambientRingOpacity, {
              toValue: 0.3,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(ambientRingOpacity, {
              toValue: 0,
              duration: 700,
              useNativeDriver: true,
            }),
          ]),
        ]),
      );
      ambientLoop.start();

      // Reactive ring — faster, tighter
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(reactiveRingScale, {
              toValue: 1.1,
              duration: 450,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(reactiveRingScale, {
              toValue: 1.0,
              duration: 250,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(reactiveRingOpacity, {
              toValue: 0.4,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(reactiveRingOpacity, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ).start();

      // Subtle rotation on the reactive ring
      Animated.loop(
        Animated.timing(reactiveRingRotate, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();

      // Waveform bars — responsive pulse pattern (amplitude driven by phase context)
      barAnims.forEach((anim, i) => {
        const amplitude = 18 + i * 2.5;
        const baseline = 5 + i;
        Animated.loop(
          Animated.sequence([
            Animated.spring(anim, {
              toValue: amplitude,
              friction: 10,
              tension: 30,
              useNativeDriver: false,
            }),
            Animated.spring(anim, {
              toValue: baseline,
              friction: 10,
              tension: 30,
              useNativeDriver: false,
            }),
          ]),
        ).start();
      });

      return () => { ambientLoop.stop(); glowLoop.stop(); glowScaleLoop.stop(); };
    }

    // ═══ THINKING: Slow breathing + subtle pulse ring ═══
    if (phase === 'thinking') {
      // Core slow breathing
      Animated.loop(
        Animated.sequence([
          Animated.timing(coreScale, {
            toValue: 1.03,
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(coreScale, {
            toValue: 0.98,
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // Glow breathing
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.08,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.03,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // Ambient ring — slow continuous pulse
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(ambientRingScale, {
              toValue: 1.1,
              duration: 1400,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(ambientRingScale, {
              toValue: 1.0,
              duration: 1400,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(ambientRingOpacity, {
              toValue: 0.25,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(ambientRingOpacity, {
              toValue: 0.05,
              duration: 1800,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ).start();

      // Subtle rotation
      Animated.loop(
        Animated.timing(reactiveRingRotate, {
          toValue: 1,
          duration: 6000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();

      reactiveRingOpacity.setValue(0.15);

      // Thinking bars — sequential wave
      barAnims.forEach((anim, i) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 14 + i * 2.5,
              duration: 600 + i * 100,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: 6,
              duration: 600 + i * 100,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: false,
            }),
          ]),
        ).start();
      });
    }

    // ═══ SPEAKING: Warm radiating rings, fluid waveform ═══
    if (phase === 'speaking') {
      // Core subtle pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(coreScale, {
            toValue: 1.025,
            duration: 550,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(coreScale, {
            toValue: 0.99,
            duration: 550,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // Warm glow
      glowOpacity.setValue(0.08);
      Animated.loop(
        Animated.spring(glowScale, {
          toValue: 1.03,
          friction: 18,
          tension: 25,
          useNativeDriver: true,
        }),
      ).start();

      // Ambient ring — warm, slow drift
      const speakAmbientLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(ambientRingScale, {
              toValue: 1.14,
              duration: 900,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(ambientRingScale, {
              toValue: 1.0,
              duration: 900,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(ambientRingOpacity, {
              toValue: 0.28,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(ambientRingOpacity, {
              toValue: 0.04,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
        ]),
      );
      speakAmbientLoop.start();

      // Reactive ring — steady pulse
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(reactiveRingScale, {
              toValue: 1.07,
              duration: 750,
              useNativeDriver: true,
            }),
            Animated.timing(reactiveRingScale, {
              toValue: 1.0,
              duration: 750,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(reactiveRingOpacity, {
              toValue: 0.25,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(reactiveRingOpacity, {
              toValue: 0.05,
              duration: 1100,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ).start();

      // Subtle rotation
      Animated.loop(
        Animated.timing(reactiveRingRotate, {
          toValue: 1,
          duration: 5000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();

      // Speaking bars — fluid, organic wave (deterministic pattern, no stale Math.random)
      barAnims.forEach((anim, i) => {
        const hi = 18 + ((i * 3 + 7) % 11) + i * 1.5;
        const lo = 8 + ((i * 2 + 3) % 7);
        Animated.loop(
          Animated.sequence([
            Animated.spring(anim, {
              toValue: hi,
              friction: 7,
              tension: 22,
              useNativeDriver: false,
            }),
            Animated.spring(anim, {
              toValue: lo,
              friction: 7,
              tension: 22,
              useNativeDriver: false,
            }),
          ]),
        ).start();
      });

      return () => { speakAmbientLoop.stop(); };
    }

    // ═══ INTERRUPTED: Quick deflate, then idle breathing ═══
    if (phase === 'interrupted') {
      // Quick deflate animation
      Animated.sequence([
        Animated.timing(coreScale, {
          toValue: 0.94,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(coreScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Then idle breathing
      setTimeout(() => {
        if (phase === 'interrupted') return;
        // breathing already handled above
      }, 250);

      // Bars reset to idle
      barAnims.forEach((anim, i) => {
        Animated.loop(
          Animated.sequence([
            Animated.spring(anim, {
              toValue: 5 + Math.sin(i * 0.8) * 4 + 4,
              friction: 16,
              tension: 22,
              useNativeDriver: false,
            }),
            Animated.spring(anim, {
              toValue: 7 + Math.cos(i * 0.8) * 4 + 4,
              friction: 16,
              tension: 22,
              useNativeDriver: false,
            }),
          ]),
        ).start();
      });
    }

    return () => { cleanup(); };
    // Only re-run when phase changes — micLevel handled by dedicated effect above
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Sizing derived from the main size prop ──────────────────────
  const coreDiameter = size * 0.48;
  const reactiveRingDiameter = size * 0.68;
  const ambientRingDiameter = size * 0.88;

  // Reactive ring rotation interpolation
  const rotateInterp = reactiveRingRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Glow color based on phase — extract rgb and apply correct alpha
  const glowColor = useMemo(() => {
    if (phase === 'listening') {
      const match = ringColors.glow.match(/rgba\(([^)]+)\)/);
      if (match) {
        const parts = match[1].split(',');
        return `rgba(${parts[0]},${parts[1]},${parts[2]},0.25)`;
      }
      return 'rgba(99,102,241,0.25)';
    }
    if (phase === 'speaking') return 'rgba(239,68,68,0.15)';
    if (phase === 'thinking') return 'rgba(245,158,11,0.15)';
    return 'rgba(255,255,255,0.06)';
  }, [phase, ringColors]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* ── Deep ambient glow behind everything ── */}
      <Animated.View
        style={[
          styles.ambientGlow,
          {
            width: size * 1.6,
            height: size * 1.6,
            borderRadius: size * 0.8,
            backgroundColor: glowColor,
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      {/* ── Ambient ring (outer) — slow, atmospheric ── */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: ambientRingDiameter,
            height: ambientRingDiameter,
            borderRadius: ambientRingDiameter / 2,
            borderColor: ringColors.outer,
            opacity: ambientRingOpacity,
            transform: [{ scale: ambientRingScale }],
          },
        ]}
      />

      {/* ── Reactive ring (inner) — faster, sharper ── */}
      <Animated.View
        style={[
          styles.ring,
          styles.ringReactive,
          {
            width: reactiveRingDiameter,
            height: reactiveRingDiameter,
            borderRadius: reactiveRingDiameter / 2,
            borderColor: ringColors.inner,
            opacity: reactiveRingOpacity,
            transform: [
              { scale: reactiveRingScale },
              { rotate: rotateInterp },
            ],
          },
        ]}
      />

      {/* ── Core — the dark glass orb ── */}
      <Animated.View
        style={[
          styles.core,
          {
            width: coreDiameter,
            height: coreDiameter,
            borderRadius: coreDiameter / 2,
            transform: [{ scale: coreScale }],
            opacity: coreOpacity,
          },
        ]}
      >
        {/* Inner glow overlay */}
        <View style={[styles.coreInnerGlow, { backgroundColor: CORE_INNER_GLOW }]} />

        {/* Core gradient overlay — subtle warmth */}
        <View style={styles.coreGradient}>
          {/* Waveform bars */}
          <View style={styles.waveformContainer}>
            {barAnims.map((anim, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.waveformBar,
                  {
                    height: anim,
                    backgroundColor:
                      phase === 'idle' ? WAVEFORM_IDLE : WAVEFORM_ACTIVE,
                    // Center bar slightly taller, outer bars shorter
                    opacity: 1 - Math.abs(i - 3) * 0.08,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </Animated.View>

      {/* ── Core edge highlight — top sliver of light for glass feel ── */}
      <View
        style={[
          styles.coreHighlight,
          {
            width: coreDiameter * 0.7,
            height: 1.5,
            top: (size - coreDiameter) / 2 + coreDiameter * 0.12,
            left: (size - coreDiameter * 0.7) / 2,
          },
        ]}
        pointerEvents="none"
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
  },

  // Ambient glow
  ambientGlow: {
    position: 'absolute' as const,
    // Soft radial feel via blur (visual-only, no actual blur on RN)
  },

  // Rings
  ring: {
    position: 'absolute' as const,
    borderWidth: 1,
    borderStyle: 'solid' as const,
    backgroundColor: 'transparent',
  },
  ringReactive: {
    borderWidth: 1.5,
  },

  // Core
  core: {
    zIndex: 10,
    backgroundColor: CORE_BG_START,
    borderWidth: 1,
    borderColor: CORE_BORDER,
    overflow: 'hidden',
    // Deep shadow for premium depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  coreInnerGlow: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  coreGradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Core top highlight — glass edge reflection
  coreHighlight: {
    position: 'absolute' as const,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 1,
    zIndex: 20,
  },

  // Waveform
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 3.5,
    height: 42,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
    minHeight: 3,
    // Smooth bar corners
  },
});
