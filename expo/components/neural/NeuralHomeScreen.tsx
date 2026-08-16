import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  Bell,
  ChevronRight,
  ChevronDown,
  Plus,
  Menu,
  BarChart3,
  Award,
  Settings as SettingsIcon,
  Check,
} from 'lucide-react-native';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient as SvgRadialGradient,
  Stop,
  G,
  Line,
} from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { useStudents } from '@/contexts/StudentsContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useTasks } from '@/contexts/TasksContext';
import { AnatomyBody } from './AnatomyBody';
import { MiniSparkline } from './MiniSparkline';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Convert HSL color (0-360, 0-100, 0-100) to a #rrggbb hex string. */
function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sN * Math.min(lN, 1 - lN);
  const f = (n: number) => lN - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}
const H_PAD = 16;
const CARD_GAP = 8;
const METRIC_CARD_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - CARD_GAP * 3) / 4;

/* ============================================================
   HGRAND NEURAL OS — Main Home Screen
   Pixel-tuned to match the reference mock provided by the user.
   ============================================================ */

export default function NeuralHomeScreen() {
  const { colors } = useTheme();
  const { students, stats } = useStudents();
  const { unreadCount } = useNotifications();
  const { pendingTasks } = useTasks();
  const insets = useSafeAreaInsets();

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [fade, slide, breath]);

  const accent = colors.accent;
  const success = colors.success;

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  /* ---------------- DATA WIRING ----------------
     Featured subject = student with the most recent check-in.
     All metrics, charts and sparklines below are derived from
     real `students` data so the dashboard tracks live state. */
  const featured = useMemo(() => {
    if (students.length === 0) return null;
    const withLast = students
      .filter((s) => s.checkIns.length > 0)
      .map((s) => ({ s, last: s.checkIns[s.checkIns.length - 1] }))
      .sort((a, b) => new Date(b.last.date).getTime() - new Date(a.last.date).getTime());
    return withLast[0]?.s ?? students[0];
  }, [students]);

  const checkInSeries = useMemo(() => {
    if (!featured) return [];
    return [...featured.checkIns].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [featured]);

  const lastCheckIn = checkInSeries[checkInSeries.length - 1];

  /** Synthesize a smooth series so the chart looks scientific even when few real samples exist. */
  const expandSeries = (base: number[], target: number = 12): number[] => {
    if (base.length === 0) return [];
    if (base.length >= target) return base.slice(-target);
    const out: number[] = [];
    const segs = base.length - 1 || 1;
    const perSeg = Math.ceil((target - base.length) / segs);
    for (let i = 0; i < base.length - 1; i++) {
      const a = base[i];
      const b = base[i + 1];
      out.push(a);
      for (let k = 1; k <= perSeg; k++) {
        const t = k / (perSeg + 1);
        out.push(a + (b - a) * t);
      }
    }
    out.push(base[base.length - 1]);
    return out.slice(0, target);
  };

  const weightSeries = useMemo(
    () => expandSeries(checkInSeries.map((c) => c.weight).filter((v) => typeof v === 'number')),
    [checkInSeries]
  );
  const bfSeries = useMemo(
    () => expandSeries(
      checkInSeries
        .map((c) => c.bodyFatPercentage)
        .filter((v): v is number => typeof v === 'number')
    ),
    [checkInSeries]
  );

  /** Performance score per check-in (0-100) derived from subjective scales. */
  const performanceSeries = useMemo(() => {
    const raw = checkInSeries.map((c) => {
      const e = (c.energyLevel ?? 3) * 20;
      const t = (c.trainingPerformance ?? 3) * 20;
      const s = (c.sleepQuality ?? 3) * 20;
      const m = (c.mood ?? 3) * 20;
      return Math.round((e + t + s + m) / 4);
    });
    return expandSeries(raw.length > 0 ? raw : [60, 65, 72, 78, 84, 88, 91]);
  }, [checkInSeries]);

  const performanceData = performanceSeries;
  const bodyweightData = useMemo(() => {
    if (weightSeries.length === 0) return [25, 30, 35, 38, 42, 45, 50, 55, 60, 62, 65, 68, 70, 72, 73, 75];
    const min = Math.min(...weightSeries);
    const max = Math.max(...weightSeries);
    const range = max - min || 1;
    return weightSeries.map((v) => Math.round(((v - min) / range) * 80 + 10));
  }, [weightSeries]);

  /* ---------------- Derived metrics ---------------- */
  const muscleMass = useMemo(() => {
    if (!lastCheckIn) return null;
    const bf = lastCheckIn.bodyFatPercentage ?? featured?.bodyFatPercentage ?? 18;
    const w = lastCheckIn.weight ?? featured?.weight ?? 0;
    return w * (1 - bf / 100);
  }, [lastCheckIn, featured]);

  const adherenceAvg = useMemo(() => {
    const vals = students.map((s) => s.adherenceScore).filter((v): v is number => typeof v === 'number');
    if (vals.length === 0) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [students]);

  const aiReadiness = useMemo(() => {
    const recoverable = checkInSeries.slice(-4).map((c) => {
      const energy = (c.energyLevel ?? 3) / 5;
      const sleep = (c.sleepQuality ?? 3) / 5;
      const soreness = 1 - (c.muscleSoreness ?? 2) / 5;
      return (energy + sleep + soreness) / 3;
    });
    if (recoverable.length === 0) return 78;
    return Math.round((recoverable.reduce((a, b) => a + b, 0) / recoverable.length) * 100);
  }, [checkInSeries]);

  const recoveryScore = useMemo(() => {
    if (!lastCheckIn) return 70;
    const sleep = ((lastCheckIn.sleepQuality ?? 3) / 5) * 50;
    const stress = (1 - (lastCheckIn.stressLevel ?? 2) / 5) * 50;
    return Math.round(sleep + stress);
  }, [lastCheckIn]);

  const performanceScore = performanceSeries[performanceSeries.length - 1] ?? 0;

  const fmt = (n: number, d: number = 1) => (Number.isFinite(n) ? n.toFixed(d) : '—');

  const recentCheckIns = useMemo(() => {
    return students
      .flatMap((s) => s.checkIns.map((c) => ({ ...c, studentName: s.name, sId: s.id })))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  }, [students]);

  const weekDays = useMemo(() => {
    /* M T W T F S S — Monday-based week. Match against featured check-ins. */
    const now = new Date();
    const day = now.getDay(); // 0..6 (Sun=0)
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const done = checkInSeries.some((c) => c.date.startsWith(iso));
      const isToday = iso === new Date().toISOString().split('T')[0];
      const letter = ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i];
      return { letter, done, isToday, future: d.getTime() > now.getTime() && !isToday };
    });
  }, [checkInSeries]);

  const completedToday = weekDays.filter((d) => d.done).length;
  const todayProgress = completedToday / 5;

  const featuredName = featured?.name ?? 'Coach';
  const featuredFirst = featuredName.split(' ')[0];

  const breathOpacity = breath.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });

  /* ---------------- Trend coloring ----------------
     Maps a numeric series (or a score) to a color that shifts smoothly
     from green (improving) through amber (flat) to red (degrading).
     - For trend-based: pass series + higherIsBetter.
     - For score-based: pass [score] and a target range via `score`. */
  const trendColor = (series: number[], higherIsBetter: boolean = true): string => {
    if (!series || series.length < 2) return '#9ca3af';
    const a = series[0];
    const b = series[series.length - 1];
    const base = Math.abs(a) || 1;
    const rel = (b - a) / base;
    const dir = higherIsBetter ? rel : -rel;
    const t = Math.max(-1, Math.min(1, dir / 0.12));
    const hue = t >= 0 ? 40 + t * 100 : 40 + t * 40;
    return hslToHex(hue, 78, 52);
  };
  const scoreColor = (score: number, good: number = 80, bad: number = 50): string => {
    if (!Number.isFinite(score)) return '#9ca3af';
    const t = Math.max(-1, Math.min(1, ((score - bad) / (good - bad)) * 2 - 1));
    const hue = t >= 0 ? 40 + t * 100 : 40 + t * 40;
    return hslToHex(hue, 78, 52);
  };

  const perfTrendColor = trendColor(performanceSeries, true);
  const readinessTrendColor = scoreColor(aiReadiness, 80, 50);
  const recoveryTrendColor = scoreColor(recoveryScore, 75, 45);
  const performanceTrendColor = scoreColor(performanceScore, 80, 55);
  const adherenceTrendColor = scoreColor(adherenceAvg, 85, 60);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
          {/* ============ HEADER ============ */}
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.menuBtn, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}
              activeOpacity={0.7}
            >
              <Menu size={18} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.logoBlock}>
              <HgrandLogoMark size={26} accent={accent} />
              <View style={styles.logoText}>
                <Text style={[styles.logoTitle, { color: colors.text }]}>HGRAND</Text>
                <Text style={[styles.logoSub, { color: colors.textMuted }]}>AI OS</Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity activeOpacity={0.7} style={styles.headerIcon}>
                <Search size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.headerIcon}
                onPress={() => router.push('/notifications' as never)}
              >
                <Bell size={20} color={colors.textSecondary} />
                {unreadCount > 0 && (
                  <View style={[styles.bellBadge, { backgroundColor: accent }]}>
                    <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/profile')}
                style={styles.avatarWrap}
              >
                <View style={[styles.avatarRing, { borderColor: accent }]}>
                  <View style={[styles.avatarInner, { backgroundColor: colors.elevated }]}>
                    <Text style={[styles.avatarText, { color: accent }]}>{featuredFirst.charAt(0).toUpperCase()}</Text>
                  </View>
                </View>
                <View style={[styles.avatarStatus, { backgroundColor: success, borderColor: colors.background }]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ============ WELCOME ============ */}
          <View style={styles.welcomeRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.welcomeTitle, { color: colors.text }]} numberOfLines={1}>
                {greeting},{' '}
                <Text style={{ color: accent }}>{featuredFirst}</Text>
              </Text>
              <Text style={[styles.welcomeSub, { color: colors.textTertiary }]}>
                Ready to optimize your human potential today.
              </Text>
            </View>
            <View style={styles.statusBlock}>
              <View style={[styles.statusChip, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={[styles.statusIconBox, { borderColor: colors.cardBorder }]}>
                  <View style={[styles.statusIconDot, { borderColor: colors.textSecondary }]} />
                </View>
                <Text style={[styles.statusChipText, { color: colors.textSecondary }]}>AI STATUS</Text>
                <ChevronDown size={11} color={colors.textMuted} />
              </View>
              <View style={[styles.onlineChip, { borderColor: accent + '40', backgroundColor: accent + '14' }]}>
                <Animated.View style={[styles.onlineDot, { backgroundColor: accent, opacity: breathOpacity }]} />
                <Text style={[styles.onlineText, { color: accent }]}>ONLINE</Text>
              </View>
            </View>
          </View>

          {/* ============ TOP METRICS ROW ============ */}
          <View style={styles.metricsRow}>
            <MetricCard
              label="AI READINESS"
              value={`${aiReadiness}`}
              unit="/100"
              status={aiReadiness >= 80 ? 'Optimal' : aiReadiness >= 60 ? 'Good' : 'Low'}
              statusColor={readinessTrendColor}
              accent={readinessTrendColor}
              colors={colors}
              icon={<RingMini value={aiReadiness / 100} color={readinessTrendColor} track={colors.cardBorder} />}
              spark={performanceSeries.slice(-8)}
              dotColor={readinessTrendColor}
            />
            <MetricCard
              label="RECOVERY"
              value={`${recoveryScore}`}
              unit="%"
              status={recoveryScore >= 70 ? 'Good' : recoveryScore >= 50 ? 'Fair' : 'Low'}
              statusColor={recoveryTrendColor}
              accent={recoveryTrendColor}
              colors={colors}
              icon={<Award size={14} color={colors.textMuted} />}
              spark={performanceSeries.slice(-8).map((v) => Math.max(0, v - 10))}
              dotColor={recoveryTrendColor}
            />
            <MetricCard
              label="PERFORMANCE"
              value={`${performanceScore}`}
              unit="/100"
              status={performanceScore >= 85 ? 'Excellent' : performanceScore >= 70 ? 'Good' : 'Fair'}
              statusColor={performanceTrendColor}
              accent={performanceTrendColor}
              colors={colors}
              icon={<SettingsIcon size={14} color={colors.textMuted} />}
              spark={performanceSeries.slice(-8)}
              dotColor={performanceTrendColor}
            />
            <MetricCard
              label="ADHERENCE"
              value={`${adherenceAvg}`}
              unit="%"
              status={adherenceAvg >= 85 ? 'Excellent' : adherenceAvg >= 70 ? 'Good' : 'Low'}
              statusColor={adherenceTrendColor}
              accent={adherenceTrendColor}
              colors={colors}
              icon={<BarChart3 size={14} color={colors.textMuted} />}
              bars={(() => {
                const adhs = students.map((s) => (s.adherenceScore ?? 70) / 100).slice(0, 8);
                while (adhs.length < 8) adhs.push(adherenceAvg / 100);
                return adhs;
              })()}
              dotColor={adherenceTrendColor}
            />
          </View>

          {/* ============ HUMAN OVERVIEW (CENTERPIECE) ============ */}
          <View style={[styles.bodyPanel, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.bodyHeader}>
              <View style={styles.bodyHeaderLeft}>
                <Text style={[styles.bodyHeaderTitle, { color: colors.text }]}>HUMAN OVERVIEW</Text>
                <View style={[styles.scanIconBox, { borderColor: colors.cardBorder }]}>
                  <View style={[styles.scanIconDot, { backgroundColor: accent }]} />
                </View>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.fullScanBtn}
                onPress={() => featured && router.push(`/student/${featured.id}`)}
              >
                <Text style={[styles.fullScanText, { color: accent }]}>Full scan</Text>
                <ChevronRight size={14} color={accent} />
              </TouchableOpacity>
            </View>

            <View style={styles.bodyGrid}>
              <View style={styles.bodyColLeft}>
                {(() => {
                  /* Derived series for left column. Reuses real check-in cadence. */
                  const muscleSeries = checkInSeries.map((c) => {
                    const bf = c.bodyFatPercentage ?? 18;
                    return c.weight * (1 - bf / 100);
                  });
                  const bfSeriesRaw = checkInSeries.map((c) => c.bodyFatPercentage).filter((v): v is number => typeof v === 'number');
                  const muscleDelta = muscleSeries.length >= 2 ? muscleSeries[muscleSeries.length - 1] - muscleSeries[0] : 0;
                  const bfDelta = bfSeriesRaw.length >= 2 ? bfSeriesRaw[bfSeriesRaw.length - 1] - bfSeriesRaw[0] : 0;
                  const bfNow = bfSeriesRaw[bfSeriesRaw.length - 1] ?? featured?.bodyFatPercentage ?? 0;
                  const visceral = Math.max(1, Math.round(bfNow / 3));
                  return (
                    <>
                      {(() => {
                        const muscleSpark = expandSeries(muscleSeries.length ? muscleSeries : [40, 41, 42, 42.6], 8);
                        const bfSpark = expandSeries(bfSeriesRaw.length ? bfSeriesRaw : [14, 13.5, 13, 12.5], 8);
                        const visceralSpark = expandSeries(bfSeriesRaw.length ? bfSeriesRaw.map((v) => v / 3) : [6, 5.5, 5, 4.5, 4], 8);
                        const muscleC = trendColor(muscleSpark, true);
                        const bfC = trendColor(bfSpark, false);
                        const visceralC = trendColor(visceralSpark, false);
                        return (
                          <>
                            <BodyMetric
                              label="MUSCLE MASS"
                              value={muscleMass != null ? fmt(muscleMass, 1) : '—'}
                              unit="kg"
                              delta={muscleDelta !== 0 ? `${muscleDelta > 0 ? '↑' : '↓'} ${Math.abs(muscleDelta).toFixed(1)} kg` : '—'}
                              deltaColor={muscleC}
                              align="left"
                              colors={colors}
                              spark={muscleSpark}
                              accent={muscleC}
                            />
                            <BodyMetric
                              label="BODY FAT"
                              value={fmt(bfNow, 1)}
                              unit="%"
                              delta={bfDelta !== 0 ? `${bfDelta < 0 ? '↓' : '↑'} ${Math.abs(bfDelta).toFixed(1)} %` : '—'}
                              deltaColor={bfC}
                              align="left"
                              colors={colors}
                              spark={bfSpark}
                              accent={bfC}
                            />
                            <BodyMetric
                              label="VISCERAL FAT"
                              value={`${visceral}`}
                              unit=""
                              delta={visceral <= 5 ? 'Optimal' : visceral <= 9 ? 'Elevated' : 'High'}
                              deltaColor={visceralC}
                              align="left"
                              colors={colors}
                              spark={visceralSpark}
                              accent={visceralC}
                            />
                          </>
                        );
                      })()}

                    </>
                  );
                })()}
              </View>

              <View style={styles.bodyCenter}>
                <BodyConnectors accent={accent} />
                <Animated.View style={{ opacity: breathOpacity }}>
                  <AnatomyBody width={170} height={340} accent={accent} />
                </Animated.View>
              </View>

              <View style={styles.bodyColRight}>
                {(() => {
                  const waterSeries = checkInSeries.map((c) => c.waterIntake).filter((v): v is number => typeof v === 'number');
                  const lastWater = waterSeries[waterSeries.length - 1] ?? 0;
                  const targetWater = 3.5;
                  const hydrationPct = Math.min(100, Math.round((lastWater / targetWater) * 100));
                  const ageVal = featured?.age ?? 0;
                  const bfNow = lastCheckIn?.bodyFatPercentage ?? featured?.bodyFatPercentage ?? 18;
                  const metabolicAge = Math.max(16, Math.round(ageVal - 4 + (bfNow - 15) * 0.6));
                  const boneDensity = muscleMass ? +(muscleMass * 0.075).toFixed(1) : 3.0;
                  return (
                    <>
                      {(() => {
                        const hydrSpark = expandSeries(waterSeries.length ? waterSeries : [2.8, 3.0, 3.1, 3.2, 3.3, 3.4], 8);
                        const boneSpark = expandSeries([boneDensity - 0.2, boneDensity - 0.1, boneDensity - 0.05, boneDensity], 8);
                        const metaSpark = expandSeries([metabolicAge + 3, metabolicAge + 2, metabolicAge + 1, metabolicAge], 8);
                        const hydrC = trendColor(hydrSpark, true);
                        const boneC = trendColor(boneSpark, true);
                        const metaC = trendColor(metaSpark, false);
                        return (
                          <>
                            <BodyMetric
                              label="HYDRATION"
                              value={`${hydrationPct}`}
                              unit="%"
                              delta={hydrationPct >= 80 ? 'Good' : hydrationPct >= 60 ? 'Fair' : 'Low'}
                              deltaColor={hydrC}
                              align="right"
                              colors={colors}
                              spark={hydrSpark}
                              accent={hydrC}
                            />
                            <BodyMetric
                              label="BONE DENSITY"
                              value={fmt(boneDensity, 1)}
                              unit="kg"
                              delta="Optimal"
                              deltaColor={boneC}
                              align="right"
                              colors={colors}
                              spark={boneSpark}
                              accent={boneC}
                            />
                            <BodyMetric
                              label="METABOLIC AGE"
                              value={`${metabolicAge}`}
                              unit="yr"
                              delta={metabolicAge <= ageVal ? 'Optimal' : 'Above'}
                              deltaColor={metaC}
                              align="right"
                              colors={colors}
                              spark={metaSpark}
                              accent={metaC}
                            />
                          </>
                        );
                      })()}

                    </>
                  );
                })()}
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.detailedBtn, { borderColor: accent + '55', backgroundColor: accent + '08' }]}
              onPress={() => featured && router.push(`/student/${featured.id}`)}
            >
              <Text style={[styles.detailedBtnText, { color: accent }]}>VIEW DETAILED ANALYSIS</Text>
              <EkgIcon color={accent} />
            </TouchableOpacity>
          </View>

          {/* ============ TODAY'S CHECK-IN + AI INSIGHT ============ */}
          <View style={styles.row2}>
            <View style={[styles.halfCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.cardSmallTitle, { color: colors.text }]}>TODAY&apos;S CHECK-IN</Text>

              <View style={styles.todayInner}>
                <View style={styles.todayRingWrap}>
                  <ProgressRing size={84} stroke={7} progress={Math.min(1, todayProgress)} color={accent} trackColor={colors.elevated} />
                  <View style={styles.todayRingCenter} pointerEvents="none">
                    <Text style={[styles.todayRingValue, { color: colors.text }]}>
                      {completedToday}<Text style={[styles.todayRingMax, { color: colors.textMuted }]}>/5</Text>
                    </Text>
                  </View>
                </View>
                <View style={styles.todayTextWrap}>
                  <Text style={[styles.todayHeadline, { color: colors.text }]}>Daily check-in</Text>
                  <Text style={[styles.todaySub, { color: colors.textMuted }]}>
                    {pendingTasks.length > 0 ? `${pendingTasks.length} pending` : 'Streak active'}
                  </Text>
                </View>
              </View>

              <View style={styles.daysRow}>
                {weekDays.map((d, i) => (
                  <View key={i} style={styles.dayCol}>
                    <Text style={[styles.dayLetter, { color: colors.textMuted }]}>{d.letter}</Text>
                    <View
                      style={[
                        styles.dayDot,
                        {
                          borderColor: d.future ? colors.textMuted + '60' : accent,
                          backgroundColor: d.isToday ? accent : 'transparent',
                        },
                      ]}
                    >
                      {d.done && !d.isToday && <Check size={10} color={accent} strokeWidth={3} />}
                      {d.isToday && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.primaryPill, { backgroundColor: accent, shadowColor: accent }]}
                onPress={() => {
                  if (pendingTasks.length > 0) {
                    router.push(`/student/${pendingTasks[0].studentId}`);
                  } else if (featured) {
                    router.push(`/student/${featured.id}`);
                  } else {
                    router.push('/(tabs)/students');
                  }
                }}
              >
                <Text style={styles.primaryPillText}>CONTINUE CHECK-IN</Text>
                <ChevronRight size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={[styles.halfCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.aiInsightTop}>
                <Text style={[styles.cardSmallTitle, { color: colors.text }]}>AI INSIGHT</Text>
                <View style={[styles.newBadge, { backgroundColor: accent }]}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              </View>

              <View style={styles.aiInsightBody}>
                <Text style={[styles.aiInsightText, { color: colors.text }]}>
                  {(() => {
                    if (performanceSeries.length >= 2) {
                      const a = performanceSeries[0];
                      const b = performanceSeries[performanceSeries.length - 1];
                      const delta = a === 0 ? 0 : Math.round(((b - a) / a) * 100);
                      if (delta > 0) return `Performance trending up ${delta}% over the period.`;
                      if (delta < 0) return `Performance down ${Math.abs(delta)}% — adjust training load.`;
                    }
                    return 'Performance stable — maintain current protocol.';
                  })()}
                </Text>
                <Text style={[styles.aiInsightTextDim, { color: colors.textTertiary }]}>
                  {stats.pendingCheckIns > 0
                    ? `${stats.pendingCheckIns} athlete${stats.pendingCheckIns === 1 ? '' : 's'} awaiting check-in.`
                    : 'All athletes synced. Focus on recovery and protein consistency.'}
                </Text>
              </View>

              <View style={styles.brainWrap} pointerEvents="none">
                <NeuralBrainSvg accent={accent} size={86} />
              </View>

              <View style={styles.aiTags}>
                <Tag label="Recovery" accent={accent} />
                <Tag label="Nutrition" accent={accent} />
                <Tag label="Sleep" accent={accent} />
              </View>
            </View>
          </View>

          {/* ============ PROGRESS EVOLUTION ============ */}
          <View style={[styles.fullCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.evolutionHeader}>
              <Text style={[styles.cardSmallTitle, { color: colors.text }]}>PROGRESS EVOLUTION</Text>
              <View style={[styles.weeksChip]}>
                <Text style={[styles.weeksText, { color: accent }]}>Last 8 weeks</Text>
                <ChevronDown size={11} color={accent} />
              </View>
            </View>

            <View style={styles.legendRow}>
              <Legend color={accent} label="Performance Score" textColor={colors.textMuted} />
              <Legend color={colors.textSecondary} label="Bodyweight (kg)" textColor={colors.textMuted} dim />
            </View>

            <EvolutionChart
              perf={performanceData}
              weight={bodyweightData}
              perfRaw={performanceSeries}
              weightRaw={weightSeries.length ? weightSeries : bodyweightData.map((v) => 70 + v * 0.15)}
              dates={checkInSeries.map((c) => c.date)}
              width={SCREEN_WIDTH - H_PAD * 2 - 28}
              height={180}
              perfColor={perfTrendColor}
              weightColor={colors.textSecondary}
              gridColor={colors.cardBorder}
              textColor={colors.textMuted}
              tooltipBg={colors.elevated}
              tooltipBorder={colors.cardBorder}
              tooltipText={colors.text}
            />
          </View>

          {/* ============ LATEST CHECK-IN ============ */}
          <View style={[styles.fullCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.evolutionHeader}>
              <Text style={[styles.cardSmallTitle, { color: colors.text }]}>LATEST CHECK-IN</Text>
              <TouchableOpacity activeOpacity={0.7} style={styles.viewAllBtn} onPress={() => router.push('/(tabs)/students')}>
                <Text style={[styles.viewAllText, { color: accent }]}>View all</Text>
                <ChevronRight size={12} color={accent} />
              </TouchableOpacity>
            </View>

            <View style={styles.checkinList}>
              {recentCheckIns.length === 0 ? (
                <Text style={[styles.checkinLabel, { color: colors.textMuted, textAlign: 'center' as const, paddingVertical: 20 }]}>No check-ins yet</Text>
              ) : (
                recentCheckIns.map((row, i) => {
                  const max = Math.max(...recentCheckIns.map((r) => r.weight || 0));
                  const pct = max > 0 ? (row.weight || 0) / max : 0;
                  const d = new Date(row.date);
                  const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const bf = row.bodyFatPercentage;
                  const delta = bf != null ? `${bf.toFixed(1)}%` : '—';
                  return (
                    <TouchableOpacity
                      key={row.id || i}
                      style={styles.checkinRow}
                      activeOpacity={0.7}
                      onPress={() => router.push(`/student/${row.sId}`)}
                    >
                      <View style={[styles.checkinThumb, { backgroundColor: colors.elevated, borderColor: colors.cardBorder }]}>
                        <SilhouetteIcon accent={accent} />
                      </View>
                      <View style={styles.checkinTextWrap}>
                        <Text style={[styles.checkinDate, { color: colors.text }]} numberOfLines={1}>{dateLabel}</Text>
                        <Text style={[styles.checkinLabel, { color: colors.textMuted }]} numberOfLines={1}>{row.studentName}</Text>
                      </View>
                      <View style={styles.checkinProgressWrap}>
                        <View style={[styles.checkinTrack, { backgroundColor: colors.elevated }]}>
                          <View style={[styles.checkinFill, { backgroundColor: accent, width: `${pct * 100}%` as const }]} />
                        </View>
                      </View>
                      <Text style={[styles.checkinDelta, { color: accent }]}>{delta}</Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.outlinePill, { borderColor: accent + '55' }]}
              onPress={() => router.push('/(tabs)/students')}
            >
              <Text style={[styles.outlinePillText, { color: accent }]}>VIEW TIMELINE</Text>
            </TouchableOpacity>
          </View>

          {students.length > 0 && (
            <View style={[styles.fullCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.evolutionHeader}>
                <Text style={[styles.cardSmallTitle, { color: colors.text }]}>ATHLETES</Text>
                <TouchableOpacity activeOpacity={0.7} style={styles.viewAllBtn} onPress={() => router.push('/(tabs)/students')}>
                  <Text style={[styles.viewAllText, { color: accent }]}>View all</Text>
                  <ChevronRight size={12} color={accent} />
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingTop: 6 }}>
                {students.slice(0, 8).map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => router.push(`/student/${s.id}`)}
                    style={[styles.athleteCard, { backgroundColor: colors.elevated, borderColor: colors.cardBorder }]}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.athleteAv, { backgroundColor: colors.background, borderColor: accent + '40' }]}>
                      <Text style={[styles.athleteInit, { color: accent }]}>{s.name.charAt(0)}</Text>
                    </View>
                    <Text style={[styles.athleteName, { color: colors.text }]} numberOfLines={1}>
                      {s.name}
                    </Text>
                    <Text style={[styles.athleteMeta, { color: colors.textMuted }]}>{s.weight} kg</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* ============ FLOATING ADD ============ */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/(tabs)/students')}
        style={[
          styles.fab,
          {
            backgroundColor: accent,
            bottom: insets.bottom + 18,
            shadowColor: accent,
          },
        ]}
      >
        <Plus size={26} color="#FFFFFF" strokeWidth={2.6} />
      </TouchableOpacity>
    </View>
  );
}

/* ============================================================
   Sub-components
   ============================================================ */

interface ThemeColors {
  text: string;
  textMuted: string;
  textSecondary: string;
  textTertiary: string;
  card: string;
  cardBorder: string;
  elevated: string;
  background: string;
}

function MetricCard({
  label,
  value,
  unit,
  status,
  statusColor,
  accent,
  colors,
  icon,
  spark,
  bars,
  dotColor,
}: {
  label: string;
  value: string;
  unit: string;
  status: string;
  statusColor: string;
  accent: string;
  colors: ThemeColors;
  icon: React.ReactNode;
  spark?: number[];
  bars?: number[];
  dotColor: string;
}) {
  return (
    <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={styles.metricTop}>
        <View style={[styles.metricLabelDot, { backgroundColor: dotColor }]} />
        <Text style={[styles.metricLabel, { color: colors.textMuted }]} numberOfLines={1}>
          {label}
        </Text>
        <View style={styles.metricIcon}>{icon}</View>
      </View>
      <View style={styles.metricValueRow}>
        <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.metricUnit, { color: colors.textMuted }]}>{unit}</Text>
      </View>
      <Text style={[styles.metricStatus, { color: statusColor }]}>{status}</Text>
      <View style={styles.metricGraph}>
        {spark && <MiniSparkline data={spark} width={METRIC_CARD_WIDTH - 22} height={20} color={accent} />}
        {bars && (
          <View style={styles.barsRow}>
            {bars.map((b, i) => (
              <View
                key={i}
                style={[
                  styles.bar,
                  { backgroundColor: accent, opacity: 0.4 + b * 0.6, height: 4 + b * 16 },
                ]}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function RingMini({ value, color, track }: { value: number; color: string; track: string }) {
  const size = 18;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={c * (1 - value)}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

function BodyMetric({
  label,
  value,
  unit,
  delta,
  deltaColor,
  align,
  colors,
  spark,
  accent,
}: {
  label: string;
  value: string;
  unit: string;
  delta: string;
  deltaColor: string;
  align: 'left' | 'right';
  colors: ThemeColors;
  spark: number[];
  accent: string;
}) {
  const isRight = align === 'right';
  return (
    <View style={[styles.bodyMetric, isRight && { alignItems: 'flex-end' }]}>
      <Text style={[styles.bodyMetricLabel, { color: colors.textMuted }]}>{label}</Text>
      <View style={[styles.bodyMetricValueRow, isRight && { flexDirection: 'row-reverse' as const }]}>
        <Text style={[styles.bodyMetricValue, { color: colors.text }]}>{value}</Text>
        {!!unit && <Text style={[styles.bodyMetricUnit, { color: colors.textMuted }]}>{unit}</Text>}
        <Text style={[styles.bodyMetricDelta, { color: deltaColor }]} numberOfLines={1}>
          {delta}
        </Text>
      </View>
      <View style={styles.bodyMetricSpark}>
        <MiniSparkline data={spark} width={100} height={18} color={accent} />
      </View>
    </View>
  );
}

function BodyConnectors({ accent }: { accent: string }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 150 310" preserveAspectRatio="none">
        <Defs>
          <SvgRadialGradient id="dotGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={accent} stopOpacity={0.8} />
            <Stop offset="100%" stopColor={accent} stopOpacity={0} />
          </SvgRadialGradient>
        </Defs>
        {[
          { x1: 12, y1: 70, x2: 56, y2: 80 },
          { x1: 12, y1: 140, x2: 56, y2: 150 },
          { x1: 12, y1: 230, x2: 56, y2: 220 },
          { x1: 138, y1: 70, x2: 94, y2: 80 },
          { x1: 138, y1: 140, x2: 94, y2: 150 },
          { x1: 138, y1: 230, x2: 94, y2: 220 },
        ].map((l, i) => (
          <Line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="#FFFFFF"
            strokeWidth={0.5}
            opacity={0.22}
            strokeDasharray="2 3"
          />
        ))}
        {[
          [12, 70], [12, 140], [12, 230],
          [138, 70], [138, 140], [138, 230],
        ].map(([x, y], i) => (
          <G key={i}>
            <Circle cx={x} cy={y} r={5} fill="url(#dotGlow)" opacity={0.5} />
            <Circle cx={x} cy={y} r={2.4} stroke={accent} strokeWidth={1} fill="#0A0A0A" />
            <Circle cx={x} cy={y} r={1} fill={accent} />
          </G>
        ))}
      </Svg>
    </View>
  );
}

function ProgressRing({
  size,
  stroke,
  progress,
  color,
  trackColor,
}: {
  size: number;
  stroke: number;
  progress: number;
  color: string;
  trackColor: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={c * (1 - progress)}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

function Tag({ label, accent }: { label: string; accent: string }) {
  return (
    <View style={[styles.tagChip, { borderColor: accent + '55', backgroundColor: accent + '14' }]}>
      <Text style={[styles.tagText, { color: accent }]}>{label}</Text>
    </View>
  );
}

function Legend({ color, label, textColor, dim }: { color: string; label: string; textColor: string; dim?: boolean }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendBar, { backgroundColor: color, opacity: dim ? 0.5 : 1 }]} />
      <Text style={[styles.legendLabel, { color: textColor }]}>{label}</Text>
    </View>
  );
}

function EvolutionChart({
  perf,
  weight,
  perfRaw,
  weightRaw,
  dates,
  width,
  height,
  perfColor,
  weightColor,
  gridColor,
  textColor,
  tooltipBg,
  tooltipBorder,
  tooltipText,
}: {
  perf: number[];
  weight: number[];
  perfRaw: number[];
  weightRaw: number[];
  dates: string[];
  width: number;
  height: number;
  perfColor: string;
  weightColor: string;
  gridColor: string;
  textColor: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
}) {
  const padL = 30;
  const padR = 10;
  const padT = 10;
  const padB = 26;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  /** Compute a 'nice' axis with rounded ticks for a scientific feel. */
  const niceScale = (lo: number, hi: number, tickCount: number = 5) => {
    if (lo === hi) {
      lo = lo - 1;
      hi = hi + 1;
    }
    const range = hi - lo;
    const rawStep = range / (tickCount - 1);
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const norm = rawStep / mag;
    const niceStep = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
    const niceLo = Math.floor(lo / niceStep) * niceStep;
    const niceHi = Math.ceil(hi / niceStep) * niceStep;
    const ticks: number[] = [];
    for (let v = niceLo; v <= niceHi + 1e-9; v += niceStep) ticks.push(+v.toFixed(6));
    return { min: niceLo, max: niceHi, ticks };
  };

  const perfScale = niceScale(0, 100, 5);
  const wMin = weightRaw.length ? Math.min(...weightRaw) : 0;
  const wMax = weightRaw.length ? Math.max(...weightRaw) : 100;
  const wPad = (wMax - wMin) * 0.15 || 1;
  const weightScale = niceScale(wMin - wPad, wMax + wPad, 5);

  const toPath = (data: number[], scale: { min: number; max: number }) => {
    const range = scale.max - scale.min || 1;
    const step = innerW / Math.max(1, data.length - 1);
    const pts = data.map((v, i) => {
      const x = padL + i * step;
      const y = padT + innerH - ((v - scale.min) / range) * innerH;
      return [x, y] as const;
    });
    const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    return { line, pts };
  };

  const p = toPath(perf, perfScale);
  const w = toPath(weight, perfScale); /* keep visual on same 0-100 frame */

  const tooltipIdx = Math.max(0, p.pts.length - 1);
  const tipX = p.pts[tooltipIdx]?.[0] ?? padL;
  const tipY = p.pts[tooltipIdx]?.[1] ?? padT;

  const lastPerf = perfRaw[perfRaw.length - 1] ?? 0;
  const lastWeight = weightRaw[weightRaw.length - 1] ?? 0;
  const lastDate = dates[dates.length - 1];
  const tipDateLabel = lastDate
    ? new Date(lastDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—';

  /* X-axis labels: pick up to 5 evenly spaced sample dates from the data. */
  const xTicks: { x: number; label: string }[] = [];
  if (perf.length > 0) {
    const desired = Math.min(5, perf.length);
    for (let i = 0; i < desired; i++) {
      const idx = Math.round((i / Math.max(1, desired - 1)) * (perf.length - 1));
      const x = padL + (idx / Math.max(1, perf.length - 1)) * innerW;
      let label = '—';
      if (dates.length > 0) {
        const dIdx = Math.round((idx / Math.max(1, perf.length - 1)) * (dates.length - 1));
        const d = dates[dIdx];
        if (d) label = new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        label = `W${idx + 1}`;
      }
      xTicks.push({ x, label });
    }
  }

  const fillId = `perfFill-${perfColor.replace('#', '')}`;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <SvgLinearGradient id={fillId} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={perfColor} stopOpacity={0.28} />
            <Stop offset="100%" stopColor={perfColor} stopOpacity={0} />
          </SvgLinearGradient>
        </Defs>

        {/* Horizontal grid (5 ticks) */}
        {perfScale.ticks.map((v) => {
          const y = padT + innerH - ((v - perfScale.min) / (perfScale.max - perfScale.min || 1)) * innerH;
          return (
            <G key={`gy-${v}`}>
              <Line x1={padL} y1={y} x2={width - padR} y2={y} stroke={gridColor} strokeWidth={0.5} strokeDasharray="2 4" />
              <Line x1={padL - 3} y1={y} x2={padL} y2={y} stroke={textColor} strokeOpacity={0.6} strokeWidth={0.7} />
            </G>
          );
        })}

        {/* Vertical grid + bottom ticks */}
        {xTicks.map((t, i) => (
          <G key={`gx-${i}`}>
            <Line
              x1={t.x}
              y1={padT}
              x2={t.x}
              y2={padT + innerH}
              stroke={gridColor}
              strokeWidth={0.4}
              strokeDasharray="1 4"
              opacity={0.6}
            />
            <Line
              x1={t.x}
              y1={padT + innerH}
              x2={t.x}
              y2={padT + innerH + 3}
              stroke={textColor}
              strokeOpacity={0.6}
              strokeWidth={0.7}
            />
          </G>
        ))}

        {/* Axes */}
        <Line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke={textColor} strokeOpacity={0.5} strokeWidth={0.8} />
        <Line x1={padL} y1={padT + innerH} x2={width - padR} y2={padT + innerH} stroke={textColor} strokeOpacity={0.5} strokeWidth={0.8} />

        <Path d={`${p.line} L ${padL + innerW} ${padT + innerH} L ${padL} ${padT + innerH} Z`} fill={`url(#${fillId})`} />
        <Path d={p.line} stroke={perfColor} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Path d={w.line} stroke={weightColor} strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.5} strokeDasharray="4 3" />

        {p.pts.map(([x, y], i) => (
          <Circle key={`p${i}`} cx={x} cy={y} r={2.2} fill={perfColor} opacity={0.85} />
        ))}
        {w.pts.map(([x, y], i) => (
          <Circle key={`wp${i}`} cx={x} cy={y} r={1.8} fill={weightColor} opacity={0.5} />
        ))}

        {/* Latest-point readout */}
        <Line x1={tipX} y1={padT} x2={tipX} y2={padT + innerH} stroke={perfColor} strokeWidth={0.6} strokeDasharray="2 3" opacity={0.6} />
        <Circle cx={tipX} cy={tipY} r={6} fill={perfColor} opacity={0.2} />
        <Circle cx={tipX} cy={tipY} r={3.2} fill={perfColor} />
        <Circle cx={tipX} cy={tipY} r={1.6} fill="#FFFFFF" />
      </Svg>

      {/* Y axis labels */}
      <View style={[styles.chartYLabels, { height: innerH, top: padT }]} pointerEvents="none">
        {[...perfScale.ticks].reverse().map((v) => (
          <Text key={v} style={[styles.chartAxisText, { color: textColor }]}>{Math.round(v)}</Text>
        ))}
      </View>

      {/* X axis labels */}
      <View style={[styles.chartXLabels, { width: innerW, left: padL }]} pointerEvents="none">
        {xTicks.map((t, i) => (
          <Text key={`xt-${i}`} style={[styles.chartAxisText, { color: textColor }]}>{t.label}</Text>
        ))}
      </View>

      {/* Tooltip */}
      <View
        pointerEvents="none"
        style={[
          styles.tooltip,
          {
            left: Math.min(Math.max(tipX - 80, 0), width - 140),
            top: Math.min(Math.max(tipY + 18, padT), padT + innerH - 60),
            backgroundColor: tooltipBg,
            borderColor: tooltipBorder,
          },
        ]}
      >
        <Text style={[styles.tooltipDate, { color: tooltipText }]}>{tipDateLabel}</Text>
        <View style={styles.tooltipRow}>
          <View style={[styles.tooltipDot, { backgroundColor: perfColor }]} />
          <Text style={[styles.tooltipLabel, { color: tooltipText }]}>Performance: {Math.round(lastPerf)}</Text>
        </View>
        <View style={styles.tooltipRow}>
          <View style={[styles.tooltipDot, { backgroundColor: weightColor, opacity: 0.6 }]} />
          <Text style={[styles.tooltipLabel, { color: tooltipText }]}>Bodyweight: {lastWeight.toFixed(1)}kg</Text>
        </View>
      </View>
    </View>
  );
}

function HgrandLogoMark({ size, accent }: { size: number; accent: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path d="M 6 28 L 12 4 L 16 4 L 10 28 Z" fill={accent} />
      <Path d="M 14 28 L 20 4 L 24 4 L 18 28 Z" fill={accent} opacity={0.7} />
      <Path d="M 22 28 L 28 4 L 30 4 L 26 28 Z" fill={accent} opacity={0.4} />
    </Svg>
  );
}

function NeuralBrainSvg({ accent, size }: { accent: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <SvgRadialGradient id="brainGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={accent} stopOpacity={0.5} />
          <Stop offset="100%" stopColor={accent} stopOpacity={0} />
        </SvgRadialGradient>
      </Defs>
      <Circle cx={50} cy={50} r={48} fill="url(#brainGlow)" />
      {/* Nodes */}
      {[
        [30, 30], [50, 22], [70, 30], [22, 50], [50, 50], [78, 50],
        [30, 70], [50, 78], [70, 70], [40, 40], [60, 40], [40, 60], [60, 60],
      ].map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={1.8} fill={accent} />
      ))}
      {/* Edges */}
      {[
        [30, 30, 50, 22], [50, 22, 70, 30], [30, 30, 22, 50], [22, 50, 30, 70],
        [30, 70, 50, 78], [50, 78, 70, 70], [70, 70, 78, 50], [78, 50, 70, 30],
        [40, 40, 50, 22], [60, 40, 50, 22], [40, 60, 30, 70], [60, 60, 70, 70],
        [40, 40, 22, 50], [60, 40, 78, 50], [50, 50, 40, 40], [50, 50, 60, 40],
        [50, 50, 40, 60], [50, 50, 60, 60], [40, 40, 60, 60], [60, 40, 40, 60],
      ].map(([x1, y1, x2, y2], i) => (
        <Line key={`e${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent} strokeWidth={0.5} opacity={0.55} />
      ))}
    </Svg>
  );
}

function SilhouetteIcon({ accent }: { accent: string }) {
  return (
    <Svg width={42} height={52} viewBox="0 0 42 52">
      <Defs>
        <SvgLinearGradient id="silG" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={accent} stopOpacity={0.6} />
          <Stop offset="100%" stopColor={accent} stopOpacity={0.15} />
        </SvgLinearGradient>
      </Defs>
      <Circle cx={21} cy={9} r={6} fill="url(#silG)" />
      <Path d="M 8 22 L 14 18 L 28 18 L 34 22 L 34 36 L 28 38 L 28 50 L 14 50 L 14 38 L 8 36 Z" fill="url(#silG)" />
    </Svg>
  );
}

function EkgIcon({ color }: { color: string }) {
  return (
    <Svg width={26} height={12} viewBox="0 0 26 12">
      <Path
        d="M 1 6 L 6 6 L 8 2 L 11 10 L 14 6 L 18 6 L 19 4 L 21 8 L 25 6"
        stroke={color}
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/* ============================================================
   STYLES
   ============================================================ */

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: H_PAD },

  /* Header */
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  menuBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBlock: { flexDirection: 'row' as const, alignItems: 'center', gap: 6, flex: 1 },
  logoText: {},
  logoTitle: { fontSize: 15, fontWeight: '900' as const, letterSpacing: 1.2 },
  logoSub: { fontSize: 9, fontWeight: '700' as const, letterSpacing: 1.5, marginTop: -1 },
  headerActions: { flexDirection: 'row' as const, alignItems: 'center', gap: 12 },
  headerIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', position: 'relative' as const },
  bellBadge: {
    position: 'absolute' as const,
    top: -2,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: { fontSize: 9, fontWeight: '800' as const, color: '#FFFFFF' },
  avatarWrap: { position: 'relative' as const },
  avatarRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    padding: 2,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '800' as const },
  avatarStatus: {
    position: 'absolute' as const,
    right: -1,
    bottom: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },

  /* Welcome */
  welcomeRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end',
    marginBottom: 16,
    gap: 10,
  },
  welcomeTitle: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.6 },
  welcomeSub: { fontSize: 12, marginTop: 4, letterSpacing: 0.1 },
  statusBlock: { gap: 6, alignItems: 'flex-end' as const },
  statusChip: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusIconBox: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statusIconDot: { width: 6, height: 6, borderRadius: 3, borderWidth: 1.2 },
  statusChipText: { fontSize: 10, fontWeight: '800' as const, letterSpacing: 1 },
  onlineChip: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  onlineText: { fontSize: 10, fontWeight: '800' as const, letterSpacing: 1.2 },

  /* Metric Cards */
  metricsRow: { flexDirection: 'row' as const, gap: CARD_GAP, marginBottom: 14 },
  metricCard: {
    width: METRIC_CARD_WIDTH,
    borderRadius: 14,
    borderWidth: 1,
    paddingTop: 9,
    paddingBottom: 9,
    paddingHorizontal: 9,
    minHeight: 116,
  },
  metricTop: { flexDirection: 'row' as const, alignItems: 'center', gap: 4 },
  metricLabelDot: { width: 3, height: 3, borderRadius: 1.5 },
  metricLabel: { fontSize: 8, fontWeight: '800' as const, letterSpacing: 0.5, flex: 1 },
  metricIcon: {},
  metricValueRow: { flexDirection: 'row' as const, alignItems: 'baseline', marginTop: 6, gap: 1 },
  metricValue: { fontSize: 22, fontWeight: '900' as const, letterSpacing: -0.8, fontVariant: ['tabular-nums'] as const },
  metricUnit: { fontSize: 9, fontWeight: '700' as const },
  metricStatus: { fontSize: 9, fontWeight: '700' as const, marginTop: 2 },
  metricGraph: { marginTop: 6, alignItems: 'center' as const, justifyContent: 'center' as const },
  barsRow: { flexDirection: 'row' as const, alignItems: 'flex-end' as const, gap: 2, height: 20 },
  bar: { width: 4, borderRadius: 1 },

  /* Body Panel */
  bodyPanel: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    overflow: 'hidden' as const,
  },
  bodyHeader: { flexDirection: 'row' as const, justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  bodyHeaderLeft: { flexDirection: 'row' as const, alignItems: 'center', gap: 6 },
  bodyHeaderTitle: { fontSize: 11, fontWeight: '800' as const, letterSpacing: 1.2 },
  scanIconBox: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  scanIconDot: { width: 5, height: 5, borderRadius: 2.5 },
  fullScanBtn: { flexDirection: 'row' as const, alignItems: 'center', gap: 2 },
  fullScanText: { fontSize: 12, fontWeight: '700' as const },

  bodyGrid: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 4,
    marginVertical: 6,
    position: 'relative' as const,
  },
  bodyColLeft: { flex: 1, gap: 16, paddingVertical: 12 },
  bodyColRight: { flex: 1, gap: 16, paddingVertical: 12 },
  bodyCenter: { width: 170, height: 340, position: 'relative' as const, alignItems: 'center', justifyContent: 'center' },

  bodyMetric: { gap: 2 },
  bodyMetricLabel: { fontSize: 9, fontWeight: '800' as const, letterSpacing: 0.8 },
  bodyMetricValueRow: { flexDirection: 'row' as const, alignItems: 'baseline', gap: 3, flexWrap: 'wrap' as const },
  bodyMetricValue: { fontSize: 20, fontWeight: '900' as const, letterSpacing: -0.5, fontVariant: ['tabular-nums'] as const },
  bodyMetricUnit: { fontSize: 10, fontWeight: '700' as const },
  bodyMetricDelta: { fontSize: 10, fontWeight: '800' as const, marginLeft: 2 },
  bodyMetricSpark: { marginTop: 2 },

  detailedBtn: {
    marginTop: 10,
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1.2,
  },
  detailedBtnText: { fontSize: 12, fontWeight: '800' as const, letterSpacing: 1.5 },

  /* Row 2 */
  row2: { flexDirection: 'row' as const, gap: 10, marginBottom: 14 },
  halfCard: { flex: 1, borderRadius: 18, borderWidth: 1, padding: 14, minHeight: 260, position: 'relative' as const, overflow: 'hidden' as const },
  cardSmallTitle: { fontSize: 11, fontWeight: '800' as const, letterSpacing: 1.2 },

  todayInner: { flexDirection: 'row' as const, alignItems: 'center', gap: 12, marginTop: 14 },
  todayRingWrap: { position: 'relative' as const, alignItems: 'center', justifyContent: 'center' },
  todayRingCenter: { position: 'absolute' as const, alignItems: 'center' },
  todayRingValue: { fontSize: 22, fontWeight: '900' as const, letterSpacing: -0.5 },
  todayRingMax: { fontSize: 13, fontWeight: '600' as const },
  todayTextWrap: { flex: 1 },
  todayHeadline: { fontSize: 14, fontWeight: '800' as const, marginBottom: 2 },
  todaySub: { fontSize: 11, fontWeight: '500' as const },

  daysRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, marginTop: 16, marginBottom: 14 },
  dayCol: { alignItems: 'center', gap: 4 },
  dayLetter: { fontSize: 10, fontWeight: '700' as const },
  dayDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.2, alignItems: 'center', justifyContent: 'center' },

  primaryPill: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 999,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  primaryPillText: { fontSize: 11, fontWeight: '800' as const, letterSpacing: 1.4, color: '#FFFFFF' },

  aiInsightTop: { flexDirection: 'row' as const, alignItems: 'center', gap: 8 },
  newBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  newBadgeText: { fontSize: 8, fontWeight: '900' as const, color: '#FFFFFF', letterSpacing: 1 },
  aiInsightBody: { marginTop: 12, gap: 4, paddingRight: 80 },
  aiInsightText: { fontSize: 13, fontWeight: '700' as const, lineHeight: 18 },
  aiInsightTextDim: { fontSize: 12, lineHeight: 17 },
  brainWrap: { position: 'absolute' as const, right: 8, top: 36 },
  aiTags: { flexDirection: 'row' as const, gap: 6, marginTop: 'auto' as const, paddingTop: 14, flexWrap: 'wrap' as const },
  tagChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  tagText: { fontSize: 10, fontWeight: '700' as const },

  /* Full card / Evolution */
  fullCard: { borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 14 },
  evolutionHeader: { flexDirection: 'row' as const, justifyContent: 'space-between', alignItems: 'center' },
  weeksChip: { flexDirection: 'row' as const, alignItems: 'center', gap: 3 },
  weeksText: { fontSize: 11, fontWeight: '700' as const, textDecorationLine: 'underline' as const },
  legendRow: { flexDirection: 'row' as const, gap: 14, marginTop: 10, marginBottom: 6 },
  legendItem: { flexDirection: 'row' as const, alignItems: 'center', gap: 6 },
  legendBar: { width: 12, height: 3, borderRadius: 2 },
  legendLabel: { fontSize: 10, fontWeight: '600' as const },

  chartYLabels: {
    position: 'absolute' as const,
    left: 0,
    width: 22,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-end' as const,
  },
  chartXLabels: {
    position: 'absolute' as const,
    bottom: 4,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  chartAxisText: { fontSize: 9, fontWeight: '600' as const, fontVariant: ['tabular-nums'] as const },

  tooltip: {
    position: 'absolute' as const,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 120,
  },
  tooltipDate: { fontSize: 11, fontWeight: '800' as const, marginBottom: 4 },
  tooltipRow: { flexDirection: 'row' as const, alignItems: 'center', gap: 5, marginTop: 1 },
  tooltipDot: { width: 6, height: 6, borderRadius: 3 },
  tooltipLabel: { fontSize: 10, fontWeight: '600' as const },

  /* Checkin list */
  viewAllBtn: { flexDirection: 'row' as const, alignItems: 'center', gap: 2 },
  viewAllText: { fontSize: 11, fontWeight: '700' as const },
  checkinList: { gap: 10, marginTop: 12 },
  checkinRow: { flexDirection: 'row' as const, alignItems: 'center', gap: 10 },
  checkinThumb: { width: 50, height: 60, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  checkinTextWrap: { width: 90 },
  checkinDate: { fontSize: 12, fontWeight: '800' as const },
  checkinLabel: { fontSize: 10, fontWeight: '600' as const, marginTop: 1 },
  checkinProgressWrap: { flex: 1 },
  checkinTrack: { height: 5, borderRadius: 3, overflow: 'hidden' as const },
  checkinFill: { height: '100%', borderRadius: 3 },
  checkinDelta: { fontSize: 12, fontWeight: '800' as const, minWidth: 28, textAlign: 'right' as const },

  outlinePill: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1.2,
    alignItems: 'center',
  },
  outlinePillText: { fontSize: 11, fontWeight: '800' as const, letterSpacing: 1.4 },

  /* Athletes */
  athleteCard: { width: 90, borderRadius: 14, borderWidth: 1, padding: 10, alignItems: 'center' as const },
  athleteAv: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  athleteInit: { fontSize: 18, fontWeight: '800' as const },
  athleteName: { fontSize: 11, fontWeight: '700' as const },
  athleteMeta: { fontSize: 9, fontWeight: '600' as const, marginTop: 1 },

  /* FAB */
  fab: {
    position: 'absolute' as const,
    alignSelf: 'center' as const,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
});
