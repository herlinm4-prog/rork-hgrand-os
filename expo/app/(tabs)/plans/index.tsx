import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useStudents } from '@/contexts/StudentsContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  ChevronRight,
  Utensils,
  Dumbbell,
  ClipboardList,
} from 'lucide-react-native';

type PlanFilter = 'all' | 'nutrition' | 'training';

export default function PlansScreen() {
  const { colors } = useTheme();
  const { students } = useStudents();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<PlanFilter>('all');

  const plansData = useMemo(() => {
    return students.map((s) => ({
      id: s.id,
      name: s.name,
      avatar: s.avatar,
      hasNutrition: !!s.nutritionPlan,
      hasTraining: !!s.trainingPlan,
      nutritionCalories: s.nutritionPlan?.calories,
      nutritionProtein: s.nutritionPlan?.protein,
      nutritionCarbs: s.nutritionPlan?.carbs,
      nutritionFats: s.nutritionPlan?.fats,
      trainingName: s.trainingPlan?.name,
      trainingPhase: s.trainingPlan?.phase,
      trainingDays: s.trainingPlan?.weekDays?.length ?? 0,
    }));
  }, [students]);

  const filtered = useMemo(() => {
    if (filter === 'nutrition') return plansData.filter((p) => p.hasNutrition);
    if (filter === 'training') return plansData.filter((p) => p.hasTraining);
    return plansData;
  }, [plansData, filter]);

  const totalNutrition = plansData.filter((p) => p.hasNutrition).length;
  const totalTraining = plansData.filter((p) => p.hasTraining).length;

  const filters: { key: PlanFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'nutrition', label: 'Nutrición' },
    { key: 'training', label: 'Entreno' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>Planes</Text>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[styles.summaryIcon, { backgroundColor: '#10B98115' }]}>
              <Utensils size={18} color="#10B981" />
            </View>
            <Text style={[styles.summaryNumber, { color: colors.gold }]}>{totalNutrition}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Nutrición</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[styles.summaryIcon, { backgroundColor: '#3B82F615' }]}>
              <Dumbbell size={18} color="#3B82F6" />
            </View>
            <Text style={[styles.summaryNumber, { color: colors.gold }]}>{totalTraining}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Entrenamiento</Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterBtn,
                { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1 },
                filter === f.key && { backgroundColor: colors.gold, borderColor: colors.gold },
              ]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: colors.textMuted },
                  filter === f.key && { color: '#FFFFFF', fontWeight: '700' as const },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
              <ClipboardList size={36} color={colors.gold} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin planes</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Crea planes desde los perfiles de tus clientes
            </Text>
          </View>
        )}

        {filtered.map((client) => (
          <TouchableOpacity
            key={client.id}
            style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={() => router.push(`/student/${client.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.planLeft}>
              {client.avatar ? (
                <Image source={{ uri: client.avatar }} style={styles.planAvatar} contentFit="cover" />
              ) : (
                <View style={[styles.planAvatarFallback, { backgroundColor: colors.elevated }]}>
                  <Text style={[styles.planAvatarText, { color: colors.gold }]}>{client.name.charAt(0)}</Text>
                </View>
              )}
              <View style={styles.planInfo}>
                <Text style={[styles.planName, { color: colors.text }]} numberOfLines={1}>{client.name}</Text>
                <View style={styles.planBadges}>
                  {client.hasNutrition && (
                    <View style={[styles.planBadge, { backgroundColor: '#10B98115' }]}>
                      <Utensils size={10} color="#10B981" />
                      <Text style={[styles.planBadgeText, { color: '#10B981' }]}>
                        {client.nutritionCalories} kcal
                      </Text>
                    </View>
                  )}
                  {client.hasTraining && (
                    <View style={[styles.planBadge, { backgroundColor: '#3B82F615' }]}>
                      <Dumbbell size={10} color="#3B82F6" />
                      <Text style={[styles.planBadgeText, { color: '#3B82F6' }]}>
                        {client.trainingDays} días
                      </Text>
                    </View>
                  )}
                  {!client.hasNutrition && !client.hasTraining && (
                    <Text style={[styles.noPlanText, { color: colors.textMuted }]}>Sin plan</Text>
                  )}
                </View>
              </View>
            </View>
            <ChevronRight size={16} color={colors.textQuaternary} />
          </TouchableOpacity>
        ))}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'flex-start' as const,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: '800' as const,
    fontVariant: ['tabular-nums'] as const,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 20,
  },
  filterBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  emptyState: {
    alignItems: 'center' as const,
    marginTop: 60,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center' as const,
  },
  planCard: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  planLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    flex: 1,
  },
  planAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  planAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planAvatarText: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  planInfo: {
    flex: 1,
    marginLeft: 14,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  planBadges: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  planBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  noPlanText: {
    fontSize: 13,
  },
});
