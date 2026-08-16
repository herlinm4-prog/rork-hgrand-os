import React, { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Platform,
  RefreshControl,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import {
  Bell,
  ListChecks,
  Search,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Users,
  ClipboardCheck,
  AlertTriangle,
  DollarSign,
  UserPlus,
  Utensils,
  Megaphone,
  Brain,
  Wand2,
  FileDown,
  Flame,
  Gauge,
  Trophy,
  TrendingDown,
  TrendingUp,
  Activity,
  AudioLines,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useStudents } from '@/contexts/StudentsContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useTasks } from '@/contexts/TasksContext';
import { useAuth } from '@/contexts/AuthContext';
import type { ThemeColors } from '@/constants/colors';
import type { Student } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAD = 20;
const GAP = 12;

/** Monthly value assumed per active client when estimating recurring revenue. */
const ASSUMED_MONTHLY_PRICE = 75;
/** Healthy roster size before a coach starts losing service quality. */
const IDEAL_CAPACITY = 30;

const DAY_MS = 1000 * 60 * 60 * 24;

type Severity = 'critical' | 'warning' | 'info';

interface Intel {
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  severity: Severity;
  title: string;
  suggestion: string;
  route: string;
  tag: string;
}

function daysSince(date: string): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / DAY_MS);
}

function haptic(style: 'light' | 'medium' = 'light') {
  if (Platform.OS === 'web') return;
  try {
    Haptics.impactAsync(
      style === 'medium'
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light
    );
  } catch {
    // no-op
  }
}

function go(route: string, style: 'light' | 'medium' = 'light') {
  haptic(style);
  router.push(route as never);
}

/** Circular progress ring rendered with SVG. */
function Ring({
  size,
  stroke,
  progress,
  color,
  track,
  children,
}: {
  size: number;
  stroke: number;
  progress: number;
  color: string;
  track: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - clamped)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

function greetingFor(hour: number): string {
  if (hour < 6) return 'Madrugada';
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function CommandCenter() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { students, stats } = useStudents();
  const { unreadCount } = useNotifications();
  const { pendingTasks, completedTasks, tasks } = useTasks();
  const { coach } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptic('medium');
    await new Promise(r => setTimeout(r, 600));
    setRefreshing(false);
  }, []);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;
  const voicePulse = useRef(new Animated.Value(1)).current;
  const voiceGlow = useRef(new Animated.Value(0)).current;
  const voiceRing1 = useRef(new Animated.Value(1)).current;
  const voiceRing1Opacity = useRef(new Animated.Value(0)).current;
  const voiceRing2 = useRef(new Animated.Value(1)).current;
  const voiceRing2Opacity = useRef(new Animated.Value(0)).current;
  const voiceBars = useRef([
    new Animated.Value(4),
    new Animated.Value(4),
    new Animated.Value(4),
    new Animated.Value(4),
    new Animated.Value(4),
  ]).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 520, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, tension: 60, friction: 11, useNativeDriver: true }),
    ]).start();

    // ── Delicate core breathing ──
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(voicePulse, { toValue: 1.04, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(voicePulse, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    pulseAnim.start();

    // ── Subtle warm glow ──
    const glowAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(voiceGlow, { toValue: 0.5, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(voiceGlow, { toValue: 0.15, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    glowAnim.start();

    // ── Ring 1 — whisper-thin, slow expand/fade ──
    const ring1Anim = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(voiceRing1, { toValue: 1.12, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(voiceRing1, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(voiceRing1Opacity, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
          Animated.timing(voiceRing1Opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ]),
      ]),
    );
    ring1Anim.start();

    // ── Ring 2 — barely there, slower ──
    const ring2Anim = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(voiceRing2, { toValue: 1.08, duration: 3400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(voiceRing2, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(voiceRing2Opacity, { toValue: 0.15, duration: 2400, useNativeDriver: true }),
          Animated.timing(voiceRing2Opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ]),
      ]),
    );
    ring2Anim.start();

    // ── Waveform bars — gentle coordinated sine wave ──
    const barLoops: Animated.CompositeAnimation[] = [];
    voiceBars.forEach((anim, i) => {
      const amp = 5 + Math.sin(i * 1.2) * 3;
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 4 + amp,
            duration: 1600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 3,
            duration: 1600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ]),
      );
      loop.start();
      barLoops.push(loop);
    });

    // Cleanup on unmount — stop all loops to prevent memory leaks
    return () => {
      [pulseAnim, glowAnim, ring1Anim, ring2Anim, ...barLoops].forEach(a => a.stop());
      [voicePulse, voiceGlow, voiceRing1, voiceRing1Opacity, voiceRing2, voiceRing2Opacity, ...voiceBars]
        .forEach(a => a.stopAnimation());
    };
    // Only run on mount — animated refs are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstName = useMemo(() => (coach?.name ?? 'Coach').split(' ')[0], [coach]);
  const greeting = useMemo(() => greetingFor(new Date().getHours()), []);
  const dateLabel = useMemo(
    () =>
      new Date()
        .toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
        .replace(/^\w/, (c) => c.toUpperCase()),
    []
  );

  /** Derived coaching intelligence: alerts ranked by urgency. */
  const intel = useMemo<Intel[]>(() => {
    const out: Intel[] = [];
    students.forEach((s) => {
      const adherence = s.adherenceScore ?? 75;
      if (s.checkIns.length === 0) {
        out.push({
          studentId: s.id,
          studentName: s.name,
          studentAvatar: s.avatar,
          severity: daysSince(s.createdAt) > 7 ? 'critical' : 'warning',
          title: `${s.name} no ha enviado ningún check-in`,
          suggestion: 'Envíale un recordatorio o agenda su primera evaluación.',
          route: `/student/${s.id}`,
          tag: 'Sin check-in',
        });
        return;
      }
      const last = s.checkIns[s.checkIns.length - 1];
      const d = daysSince(last.date);
      if (d > 10) {
        out.push({
          studentId: s.id,
          studentName: s.name,
          studentAvatar: s.avatar,
          severity: 'critical',
          title: `${s.name} lleva ${d} días sin check-in`,
          suggestion: 'Alto riesgo de abandono. Contáctalo hoy mismo.',
          route: `/student/${s.id}`,
          tag: 'Riesgo de fuga',
        });
      } else if (d > 7) {
        out.push({
          studentId: s.id,
          studentName: s.name,
          studentAvatar: s.avatar,
          severity: 'warning',
          title: `Check-in atrasado de ${s.name}`,
          suggestion: 'Recuérdale que registre su semana.',
          route: `/student/${s.id}`,
          tag: 'Atrasado',
        });
      }
      if (s.checkIns.length >= 3) {
        const last3 = s.checkIns.slice(-3).map((c) => c.weight);
        if (Math.abs(last3[2] - last3[0]) < 0.5) {
          out.push({
            studentId: s.id,
            studentName: s.name,
            studentAvatar: s.avatar,
            severity: 'warning',
            title: `${s.name} está estancado hace 3 semanas`,
            suggestion: 'Ajusta calorías o varía el estímulo de entrenamiento.',
            route: `/student/${s.id}`,
            tag: 'Estancamiento',
          });
        }
      }
      if (adherence < 60) {
        out.push({
          studentId: s.id,
          studentName: s.name,
          studentAvatar: s.avatar,
          severity: 'warning',
          title: `Adherencia baja de ${s.name} (${adherence}%)`,
          suggestion: 'Simplifica su plan y refuerza la motivación.',
          route: `/student/${s.id}`,
          tag: 'Adherencia',
        });
      }
      if (s.goal === 'competition') {
        out.push({
          studentId: s.id,
          studentName: s.name,
          studentAvatar: s.avatar,
          severity: 'info',
          title: `${s.name} está en preparación de competición`,
          suggestion: 'Monitoreo diario recomendado en peak week.',
          route: `/student/${s.id}`,
          tag: 'Peak Week',
        });
      }
    });
    const order: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };
    return out.sort((a, b) => order[a.severity] - order[b.severity]);
  }, [students]);

  const todayCheckIns = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const list = students.map((s) => {
      const todayCI = s.checkIns.find((c) => c.date.startsWith(today));
      return { id: s.id, name: s.name, avatar: s.avatar, done: !!todayCI };
    });
    return {
      done: list.filter((l) => l.done).length,
      total: list.length,
      list,
    };
  }, [students]);

  const atRisk = useMemo(
    () => intel.filter((i) => i.severity === 'critical').length,
    [intel]
  );

  const mrr = useMemo(() => stats.activeStudents * ASSUMED_MONTHLY_PRICE, [stats.activeStudents]);

  const capacity = useMemo(
    () => Math.min(1, students.length / IDEAL_CAPACITY),
    [students.length]
  );

  const momentum = useMemo(() => {
    const total = tasks.length;
    if (total === 0) return 1;
    return completedTasks.length / total;
  }, [tasks.length, completedTasks.length]);

  /** Best recent transformation to celebrate. */
  const win = useMemo(() => {
    let best: { student: Student; delta: number; metric: string } | null = null;
    students.forEach((s) => {
      if (s.checkIns.length < 2) return;
      const first = s.checkIns[0];
      const last = s.checkIns[s.checkIns.length - 1];
      const goalDown = s.goal === 'lose_fat' || s.goal === 'competition';
      const weightDelta = last.weight - first.weight;
      const improvement = goalDown ? -weightDelta : weightDelta;
      if (improvement <= 0) return;
      if (!best || improvement > best.delta) {
        best = {
          student: s,
          delta: improvement,
          metric: `${improvement.toFixed(1)} kg ${goalDown ? 'perdidos' : 'ganados'}`,
        };
      }
    });
    return best as { student: Student; delta: number; metric: string } | null;
  }, [students]);

  const priority = intel[0];

  const sevColor = useCallback(
    (s: Severity) => (s === 'critical' ? colors.danger : s === 'warning' ? colors.warning : colors.info),
    [colors]
  );

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const kpis = useMemo(
    () => [
      {
        key: 'clients',
        label: 'Clientes activos',
        value: String(stats.activeStudents),
        icon: Users,
        tint: colors.info,
        route: '/(tabs)/students',
      },
      {
        key: 'checkins',
        label: 'Check-ins hoy',
        value: `${todayCheckIns.done}/${todayCheckIns.total}`,
        icon: ClipboardCheck,
        tint: colors.success,
        route: '/tasks',
      },
      {
        key: 'risk',
        label: 'En riesgo',
        value: String(atRisk),
        icon: AlertTriangle,
        tint: atRisk > 0 ? colors.danger : colors.textMuted,
        route: '/notifications',
      },
      {
        key: 'mrr',
        label: 'Ingreso mensual',
        value: `$${(mrr / 1000).toFixed(1)}k`,
        icon: DollarSign,
        tint: colors.tint,
        route: '/(tabs)/profile/account',
      },
    ],
    [stats.activeStudents, todayCheckIns, atRisk, mrr, colors]
  );

  const shortcuts = useMemo(
    () => [
      { key: 'new', label: 'Nuevo\ncliente', icon: UserPlus, route: '/(tabs)/students' },
      { key: 'meal', label: 'Plan de\ncomida', icon: Utensils, route: '/meal-plan-builder' },
      { key: 'broadcast', label: 'Mensaje\nmasivo', icon: Megaphone, route: '/(tabs)/profile/automation-center' },
      { key: 'ai', label: 'Asistente\nIA', icon: Brain, route: '/(tabs)/ai' },
      { key: 'tasks', label: 'Tareas', icon: ListChecks, route: '/tasks' },
      { key: 'auto', label: 'Auto-\nmatización', icon: Wand2, route: '/(tabs)/profile/automation-center' },
      { key: 'plans', label: 'Planes', icon: Activity, route: '/(tabs)/plans' },
      { key: 'export', label: 'Exportar', icon: FileDown, route: '/(tabs)/profile/export-studio' },
    ],
    []
  );

  const tileWidth = (SCREEN_WIDTH - PAD * 2 - GAP * 3) / 4;
  const kpiWidth = (SCREEN_WIDTH - PAD * 2 - GAP) / 2;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Ambient accent glow at the top */}
      <LinearGradient
        colors={[colors.tint + '22', 'transparent']}
        style={[styles.ambient, { height: insets.top + 200 }]}
        pointerEvents="none"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
            progressBackgroundColor={colors.card}
          />
        }
        contentContainerStyle={{ paddingHorizontal: PAD, paddingTop: insets.top + 14, paddingBottom: 48 }}
      >
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.osTag, { color: colors.tint }]}>HGRAND OS</Text>
              <Text style={[styles.greeting, { color: colors.text }]} numberOfLines={1}>
                {greeting}, {firstName}
              </Text>
              <Text style={[styles.date, { color: colors.textMuted }]}>{dateLabel}</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                onPress={() => go('/(tabs)/students')}
                activeOpacity={0.7}
              >
                <Search size={19} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                onPress={() => go('/notifications')}
                activeOpacity={0.7}
              >
                <Bell size={19} color={colors.text} />
                {unreadCount > 0 && (
                  <View style={[styles.dotBadge, { backgroundColor: colors.danger }]}>
                    <Text style={styles.dotBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.avatar, { borderColor: colors.tint }]}
                onPress={() => go('/(tabs)/profile')}
                activeOpacity={0.8}
              >
                {coach?.avatar ? (
                  <Image source={{ uri: coach.avatar }} style={styles.avatarImg} contentFit="cover" />
                ) : (
                  <Text style={[styles.avatarLetter, { color: colors.tint }]}>{firstName.charAt(0)}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Voice — Light Premium Orb ──────────────────────── */}
          <TouchableOpacity
            activeOpacity={0.96}
            onPress={() => go('/(tabs)/ai?voice=1', 'medium')}
            style={styles.voiceWrap}
          >
            <View style={[styles.voiceCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              {/* Subtle warm glow */}
              <Animated.View
                style={[
                  styles.voiceGlow,
                  {
                    backgroundColor: isDark ? colors.tint + '18' : colors.tint + '14',
                    opacity: voiceGlow,
                  },
                ]}
              />

              <View style={styles.voiceInner}>
                {/* ── Delicate orb with animated rings ── */}
                <View style={styles.voiceOrbContainer}>
                  {/* Ring 2 — whisper-thin outer */}
                  <Animated.View
                    style={[
                      styles.voiceRing,
                      styles.voiceRing2,
                      {
                        borderColor: colors.tint + (isDark ? '14' : '18'),
                        opacity: voiceRing2Opacity,
                        transform: [{ scale: voiceRing2 }],
                      },
                    ]}
                  />
                  {/* Ring 1 — delicate inner */}
                  <Animated.View
                    style={[
                      styles.voiceRing,
                      styles.voiceRing1,
                      {
                        borderColor: colors.tint + (isDark ? '1E' : '22'),
                        opacity: voiceRing1Opacity,
                        transform: [{ scale: voiceRing1 }],
                      },
                    ]}
                  />
                  {/* Core orb — frosted glass */}
                  <Animated.View
                    style={[
                      styles.voiceCore,
                      {
                        backgroundColor: isDark ? '#1A1A22' : '#F4F4F8',
                        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                        transform: [{ scale: voicePulse }],
                      },
                    ]}
                  >
                    {/* Thin waveform bars */}
                    <View style={styles.voiceWaveform}>
                      {voiceBars.map((anim, i) => (
                        <Animated.View
                          key={i}
                          style={[
                            styles.voiceWaveformBar,
                            {
                              height: anim,
                              backgroundColor: isDark ? 'rgba(255,255,255,0.65)' : colors.tint + '80',
                              opacity: (1 - Math.abs(i - 2) * 0.08) * 0.9,
                            },
                          ]}
                        />
                      ))}
                    </View>
                  </Animated.View>
                </View>

                {/* Text section — refined Apple typography */}
                <View style={styles.voiceTextBlock}>
                  <Text style={[styles.voiceLabel, { color: colors.text }]}>
                    Hablar con Sol
                  </Text>
                  <Text style={[styles.voiceHint, { color: colors.textMuted }]}>
                    Asistente de voz inteligente
                  </Text>
                </View>

                {/* AudioLines icon as a delicate button */}
                <View style={[styles.voiceArrow, { backgroundColor: colors.tint + '0F', borderColor: colors.tint + '14' }]}>
                  <AudioLines size={15} color={colors.tint} strokeWidth={2} />
                </View>
              </View>

              {/* Live indicator — minimal */}
              <View style={[styles.voiceLiveRow, { borderTopColor: colors.separator }]}>
                <View style={[styles.voiceLiveDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.voiceLiveText, { color: colors.success }]}>Activo</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Daily briefing — the "it suggests the solution" hero */}
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => go(priority ? priority.route : '/tasks', 'medium')}
            style={styles.heroWrap}
          >
            <LinearGradient
              colors={
                priority
                  ? [sevColor(priority.severity) + '26', colors.card]
                  : [colors.success + '22', colors.card]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.hero, { borderColor: colors.cardBorder }]}
            >
              <View style={styles.heroTop}>
                <View style={styles.heroBadge}>
                  <Sparkles size={13} color={colors.tint} />
                  <Text style={[styles.heroBadgeText, { color: colors.tint }]}>
                    {priority ? 'PRIORIDAD DE HOY' : 'TODO BAJO CONTROL'}
                  </Text>
                </View>
                {intel.length > 1 && (
                  <Text style={[styles.heroMore, { color: colors.textMuted }]}>
                    +{intel.length - 1} más
                  </Text>
                )}
              </View>

              {priority ? (
                <>
                  <Text style={[styles.heroTitle, { color: colors.text }]}>{priority.title}</Text>
                  <Text style={[styles.heroSub, { color: colors.textTertiary }]}>
                    {priority.suggestion}
                  </Text>
                  <View style={[styles.heroCta, { backgroundColor: colors.tint }]}>
                    <Text style={styles.heroCtaText}>Resolver ahora</Text>
                    <ArrowRight size={16} color="#FFF" />
                  </View>
                </>
              ) : (
                <>
                  <Text style={[styles.heroTitle, { color: colors.text }]}>
                    Sin pendientes críticos
                  </Text>
                  <Text style={[styles.heroSub, { color: colors.textTertiary }]}>
                    Buen momento para crear contenido o planificar la próxima semana.
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* KPI pulse grid */}
          <View style={styles.kpiGrid}>
            {kpis.map((k) => {
              const Icon = k.icon;
              return (
                <TouchableOpacity
                  key={k.key}
                  activeOpacity={0.85}
                  onPress={() => go(k.route)}
                  style={[styles.kpiCard, { width: kpiWidth, backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                >
                  <View style={[styles.kpiIcon, { backgroundColor: k.tint + '1A' }]}>
                    <Icon size={16} color={k.tint} />
                  </View>
                  <Text style={[styles.kpiValue, { color: colors.text }]}>{k.value}</Text>
                  <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>{k.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Control center shortcuts */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Centro de control</Text>
          <View style={styles.shortcutGrid}>
            {shortcuts.map((sc) => {
              const Icon = sc.icon;
              return (
                <TouchableOpacity
                  key={sc.key}
                  activeOpacity={0.8}
                  onPress={() => go(sc.route)}
                  style={[styles.shortcut, { width: tileWidth }]}
                >
                  <View style={[styles.shortcutIcon, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <Icon size={22} color={colors.tint} />
                  </View>
                  <Text style={[styles.shortcutLabel, { color: colors.textTertiary }]}>{sc.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Momentum + Capacity dual gauges */}
          <View style={styles.dualRow}>
            <View style={[styles.gaugeCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.gaugeHeader}>
                <Flame size={15} color={colors.tint} />
                <Text style={[styles.gaugeTitle, { color: colors.textTertiary }]}>Momentum</Text>
              </View>
              <Ring
                size={84}
                stroke={8}
                progress={momentum}
                color={colors.tint}
                track={colors.cardBorder}
              >
                <Text style={[styles.gaugeValue, { color: colors.text }]}>{Math.round(momentum * 100)}%</Text>
              </Ring>
              <Text style={[styles.gaugeFoot, { color: colors.textMuted }]}>
                {completedTasks.length}/{tasks.length || 0} tareas
              </Text>
            </View>

            <View style={[styles.gaugeCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.gaugeHeader}>
                <Gauge size={15} color={colors.info} />
                <Text style={[styles.gaugeTitle, { color: colors.textTertiary }]}>Capacidad</Text>
              </View>
              <Ring
                size={84}
                stroke={8}
                progress={capacity}
                color={capacity > 0.85 ? colors.danger : colors.info}
                track={colors.cardBorder}
              >
                <Text style={[styles.gaugeValue, { color: colors.text }]}>{Math.round(capacity * 100)}%</Text>
              </Ring>
              <Text style={[styles.gaugeFoot, { color: colors.textMuted }]}>
                {students.length}/{IDEAL_CAPACITY} cupos
              </Text>
            </View>
          </View>

          {/* Attention required */}
          {intel.length > 0 && (
            <>
              <View style={styles.sectionRow}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
                  Atención requerida
                </Text>
                <TouchableOpacity onPress={() => go('/notifications')} activeOpacity={0.6} style={styles.seeAll}>
                  <Text style={[styles.seeAllText, { color: colors.tint }]}>Ver todo</Text>
                  <ChevronRight size={14} color={colors.tint} />
                </TouchableOpacity>
              </View>
              <View style={{ gap: 8, marginBottom: 28 }}>
                {intel.slice(0, 4).map((item, i) => {
                  const c = sevColor(item.severity);
                  return (
                    <TouchableOpacity
                      key={item.studentId + i}
                      activeOpacity={0.85}
                      onPress={() => go(item.route)}
                      style={[styles.alertCard, { backgroundColor: colors.card, borderColor: colors.cardBorder, borderLeftColor: c }]}
                    >
                      <View style={styles.alertTop}>
                        {item.studentAvatar ? (
                          <Image source={{ uri: item.studentAvatar }} style={styles.alertAvatar} contentFit="cover" />
                        ) : (
                          <View style={[styles.alertAvatarFallback, { backgroundColor: colors.elevated }]}>
                            <Text style={[styles.alertAvatarLetter, { color: c }]}>
                              {item.studentName.charAt(0)}
                            </Text>
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.alertTitle, { color: colors.text }]} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={[styles.alertSuggestion, { color: colors.textTertiary }]} numberOfLines={1}>
                            {item.suggestion}
                          </Text>
                        </View>
                        <View style={[styles.alertTag, { backgroundColor: c + '1A' }]}>
                          <Text style={[styles.alertTagText, { color: c }]}>{item.tag}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Win of the week */}
          {win && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Logro de la semana</Text>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => go(`/student/${win.student.id}`)}
                style={styles.winWrap}
              >
                <LinearGradient
                  colors={[colors.success + '26', colors.card]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.win, { borderColor: colors.cardBorder }]}
                >
                  <View style={[styles.winTrophy, { backgroundColor: colors.success + '1F' }]}>
                    <Trophy size={22} color={colors.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.winName, { color: colors.text }]} numberOfLines={1}>
                      {win.student.name}
                    </Text>
                    <View style={styles.winMetricRow}>
                      {win.student.goal === 'lose_fat' || win.student.goal === 'competition' ? (
                        <TrendingDown size={14} color={colors.success} />
                      ) : (
                        <TrendingUp size={14} color={colors.success} />
                      )}
                      <Text style={[styles.winMetric, { color: colors.success }]}>{win.metric}</Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color={colors.textQuaternary} />
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {/* Today's check-ins strip */}
          {todayCheckIns.total > 0 && (
            <>
              <View style={styles.sectionRow}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
                  Check-ins de hoy
                </Text>
                <View style={[styles.countPill, { backgroundColor: colors.tint + '18' }]}>
                  <Text style={[styles.countPillText, { color: colors.tint }]}>
                    {todayCheckIns.done}/{todayCheckIns.total}
                  </Text>
                </View>
              </View>
              <View style={{ gap: 8 }}>
                {todayCheckIns.list.slice(0, 5).map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    activeOpacity={0.85}
                    onPress={() => go(`/student/${s.id}`)}
                    style={[styles.ciRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                  >
                    {s.avatar ? (
                      <Image source={{ uri: s.avatar }} style={styles.ciAvatar} contentFit="cover" />
                    ) : (
                      <View style={[styles.ciAvatarFallback, { backgroundColor: colors.elevated }]}>
                        <Text style={[styles.ciAvatarLetter, { color: colors.tint }]}>{s.name.charAt(0)}</Text>
                      </View>
                    )}
                    <Text style={[styles.ciName, { color: colors.text }]} numberOfLines={1}>
                      {s.name}
                    </Text>
                    <View
                      style={[
                        styles.ciStatus,
                        { backgroundColor: (s.done ? colors.success : colors.warning) + '18' },
                      ]}
                    >
                      <View
                        style={[styles.ciStatusDot, { backgroundColor: s.done ? colors.success : colors.warning }]}
                      />
                      <Text style={[styles.ciStatusText, { color: s.done ? colors.success : colors.warning }]}>
                        {s.done ? 'Enviado' : 'Pendiente'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    ambient: { position: 'absolute', top: 0, left: 0, right: 0 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    osTag: {
      fontSize: 11,
      fontWeight: '800' as const,
      letterSpacing: 2,
      marginBottom: 3,
    },
    greeting: {
      fontSize: 26,
      fontWeight: '800' as const,
      letterSpacing: -0.5,
    },
    date: {
      fontSize: 13,
      fontWeight: '500' as const,
      marginTop: 2,
    },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dotBadge: {
      position: 'absolute',
      top: -3,
      right: -3,
      minWidth: 17,
      height: 17,
      borderRadius: 9,
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dotBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' as const },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImg: { width: '100%', height: '100%' },
    avatarLetter: { fontSize: 18, fontWeight: '800' as const },

    // ── Voice gadget — Light premium Apple-style orb ──
    voiceWrap: { marginBottom: 22, borderRadius: 20 },
    voiceCard: {
      borderRadius: 20,
      borderWidth: 0.5,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    voiceGlow: {
      position: 'absolute',
      top: -40,
      left: '50%' as any,
      width: 100,
      height: 100,
      marginLeft: -50,
      borderRadius: 50,
    },
    voiceInner: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      paddingRight: 16,
      gap: 12,
    },
    voiceOrbContainer: {
      width: 52,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
    },
    voiceRing: {
      position: 'absolute',
      borderWidth: 1,
      borderRadius: 999,
    },
    voiceRing1: {
      width: 52,
      height: 52,
    },
    voiceRing2: {
      width: 52,
      height: 52,
      borderWidth: 0.5,
    },
    voiceCore: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 0.5,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 3,
    },
    voiceWaveform: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: 2,
      height: 18,
    },
    voiceWaveformBar: {
      width: 1.5,
      borderRadius: 1,
      minHeight: 2,
    },
    voiceTextBlock: {
      flex: 1,
    },
    voiceLabel: {
      fontSize: 15,
      fontWeight: '600' as const,
      letterSpacing: -0.2,
    },
    voiceHint: {
      fontSize: 12,
      fontWeight: '400' as const,
      marginTop: 1,
    },
    voiceArrow: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 0.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    voiceLiveRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingVertical: 7,
      borderTopWidth: 0.5,
    },
    voiceLiveDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
    },
    voiceLiveText: {
      fontSize: 10,
      fontWeight: '600' as const,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
    },

    heroWrap: { marginBottom: 22, borderRadius: 22, overflow: 'hidden' },
    hero: { borderRadius: 22, borderWidth: 1, padding: 18 },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    heroBadgeText: { fontSize: 11, fontWeight: '800' as const, letterSpacing: 1.2 },
    heroMore: { fontSize: 12, fontWeight: '600' as const },
    heroTitle: { fontSize: 20, fontWeight: '800' as const, letterSpacing: -0.4, lineHeight: 26 },
    heroSub: { fontSize: 14, lineHeight: 20, marginTop: 6 },
    heroCta: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 14,
      marginTop: 16,
    },
    heroCtaText: { color: '#FFF', fontSize: 14, fontWeight: '700' as const },

    kpiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: GAP,
      marginBottom: 28,
    },
    kpiCard: { borderRadius: 18, borderWidth: 1, padding: 14 },
    kpiIcon: {
      width: 32,
      height: 32,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    kpiValue: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.5, fontVariant: ['tabular-nums'] as const },
    kpiLabel: { fontSize: 12.5, fontWeight: '500' as const, marginTop: 2 },

    sectionTitle: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.3, marginBottom: 14 },
    sectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    seeAllText: { fontSize: 13, fontWeight: '600' as const },

    shortcutGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: GAP,
      marginBottom: 28,
    },
    shortcut: { alignItems: 'center', gap: 8 },
    shortcutIcon: {
      width: 56,
      height: 56,
      borderRadius: 18,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    shortcutLabel: { fontSize: 11, fontWeight: '600' as const, textAlign: 'center', lineHeight: 14 },

    dualRow: { flexDirection: 'row', gap: GAP, marginBottom: 28 },
    gaugeCard: {
      flex: 1,
      borderRadius: 20,
      borderWidth: 1,
      padding: 16,
      alignItems: 'center',
    },
    gaugeHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14, alignSelf: 'flex-start' },
    gaugeTitle: { fontSize: 13, fontWeight: '600' as const },
    gaugeValue: { fontSize: 19, fontWeight: '800' as const, fontVariant: ['tabular-nums'] as const },
    gaugeFoot: { fontSize: 12, fontWeight: '500' as const, marginTop: 12 },

    alertCard: { borderRadius: 16, borderWidth: 1, borderLeftWidth: 3, padding: 12 },
    alertTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    alertAvatar: { width: 40, height: 40, borderRadius: 20 },
    alertAvatarFallback: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    alertAvatarLetter: { fontSize: 16, fontWeight: '700' as const },
    alertTitle: { fontSize: 14, fontWeight: '600' as const },
    alertSuggestion: { fontSize: 12.5, marginTop: 2 },
    alertTag: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
    alertTagText: { fontSize: 10.5, fontWeight: '700' as const },

    winWrap: { borderRadius: 18, overflow: 'hidden', marginBottom: 28 },
    win: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18, borderWidth: 1 },
    winTrophy: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    winName: { fontSize: 16, fontWeight: '700' as const },
    winMetricRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
    winMetric: { fontSize: 13.5, fontWeight: '700' as const },

    countPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9 },
    countPillText: { fontSize: 13, fontWeight: '700' as const },
    ciRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderRadius: 14,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    ciAvatar: { width: 34, height: 34, borderRadius: 17 },
    ciAvatarFallback: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    ciAvatarLetter: { fontSize: 14, fontWeight: '700' as const },
    ciName: { flex: 1, fontSize: 14.5, fontWeight: '600' as const },
    ciStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    ciStatusDot: { width: 6, height: 6, borderRadius: 3 },
    ciStatusText: { fontSize: 11, fontWeight: '700' as const },
  });
}
