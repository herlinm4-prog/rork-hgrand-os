import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Image } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';

interface AnatomyBodyProps {
  width: number;
  height: number;
  accent: string;
}

/**
 * Single high-fidelity medical anatomy render presented with a subtle
 * 3D-feeling oscillation (gentle Y-axis tilt + breathing scale) rather than
 * cycling multiple frames — which produced inconsistent identities and a
 * cheap result. Keeps holographic scan rings, floor perspective and pulse.
 */
const BODY_IMAGE =
  'https://r2-pub.rork.com/generated-images/08b604f1-7422-4f18-adce-b79b03ad494b.png';

function AnatomyBodyBase({ width, height, accent }: AnatomyBodyProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.timing(ring, { toValue: 1, duration: 4200, easing: Easing.linear, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.timing(ring2, { toValue: 1, duration: 5600, easing: Easing.linear, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 5200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: 5200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 3400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: 3400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [pulse, ring, ring2, sway, breath]);

  const ringScale = ring.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.18] });
  const ringOpacity = ring.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });
  const ring2Scale = ring2.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.05] });
  const ring2Opacity = ring2.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.25] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 0.18] });

  // Subtle 3D oscillation — small Y-rotation + breathing scale.
  const rotateY = sway.interpolate({ inputRange: [0, 1], outputRange: ['-7deg', '7deg'] });
  const breathScale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.012] });

  const floorRX = width * 0.55;
  const floorRY = height * 0.045;

  return (
    <View style={{ width, height, alignItems: 'center', justifyContent: 'flex-end' }}>
      {/* Background radial glow */}
      <Svg
        width={width * 1.4}
        height={height * 1.05}
        style={[StyleSheet.absoluteFill, { left: -width * 0.2, top: 0 }]}
        pointerEvents="none"
      >
        <Defs>
          <RadialGradient id="bgGlow" cx="50%" cy="45%" r="55%">
            <Stop offset="0%" stopColor={accent} stopOpacity={0.08} />
            <Stop offset="60%" stopColor={accent} stopOpacity={0.02} />
            <Stop offset="100%" stopColor={accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse
          cx={(width * 1.4) / 2}
          cy={(height * 1.05) * 0.45}
          rx={width * 0.55}
          ry={height * 0.45}
          fill="url(#bgGlow)"
        />
      </Svg>

      {/* Concentric holographic scan circles */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Circle cx={width / 2} cy={height / 2} r={width * 0.55} stroke="#FFFFFF" strokeWidth={0.4} fill="none" opacity={0.08} />
          <Circle cx={width / 2} cy={height / 2} r={width * 0.45} stroke="#FFFFFF" strokeWidth={0.4} fill="none" opacity={0.06} />
          <Circle cx={width / 2} cy={height / 2} r={width * 0.32} stroke={accent} strokeWidth={0.4} fill="none" opacity={0.08} />
        </Svg>
      </View>

      {/* Animated expanding scan rings */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { alignItems: 'center', justifyContent: 'center', opacity: ringOpacity, transform: [{ scale: ringScale }] },
        ]}
        pointerEvents="none"
      >
        <Svg width={width} height={height}>
          <Circle cx={width / 2} cy={height / 2} r={width * 0.5} stroke={accent} strokeWidth={0.8} fill="none" />
        </Svg>
      </Animated.View>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { alignItems: 'center', justifyContent: 'center', opacity: ring2Opacity, transform: [{ scale: ring2Scale }] },
        ]}
        pointerEvents="none"
      >
        <Svg width={width} height={height}>
          <Circle cx={width / 2} cy={height / 2} r={width * 0.36} stroke={accent} strokeWidth={0.6} fill="none" />
        </Svg>
      </Animated.View>

      {/* Anatomy figure — subtle 3D sway + breath */}
      <Animated.View
        style={{
          width: width * 1.05,
          height: height * 0.96,
          transform: [
            { perspective: 900 },
            { rotateY },
            { scale: breathScale },
          ],
        }}
      >
        <Image source={{ uri: BODY_IMAGE }} style={styles.bodyImage} />
      </Animated.View>

      {/* Floor perspective rings */}
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'flex-end' }]} pointerEvents="none">
        <Svg width={width} height={floorRY * 6} style={{ marginBottom: -floorRY * 2 }}>
          <Ellipse cx={width / 2} cy={floorRY * 2} rx={floorRX} ry={floorRY} stroke={accent} strokeWidth={0.8} fill="none" opacity={0.5} />
          <Ellipse cx={width / 2} cy={floorRY * 3} rx={floorRX * 0.75} ry={floorRY * 0.75} stroke={accent} strokeWidth={0.6} fill="none" opacity={0.35} />
          <Ellipse cx={width / 2} cy={floorRY * 4} rx={floorRX * 0.5} ry={floorRY * 0.5} stroke={accent} strokeWidth={0.5} fill="none" opacity={0.22} />
        </Svg>
      </View>

      {/* Soft red pulse glow at center mass */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View
          style={{
            position: 'absolute',
            left: width / 2 - 14,
            top: height * 0.38,
            opacity: pulseOpacity,
            transform: [{ scale: pulseScale }],
          }}
        >
          <Svg width={28} height={28}>
            <Defs>
              <RadialGradient id="pulseG" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={accent} stopOpacity={0.5} />
                <Stop offset="100%" stopColor={accent} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={14} cy={14} r={14} fill="url(#pulseG)" />
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bodyImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});

export const AnatomyBody = React.memo(AnatomyBodyBase);
