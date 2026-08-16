import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  Tag,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/contexts/SettingsContext';
import type { RequiredTip, RequiredTipCategory, PlanTypeFilter } from '@/types/settings';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

const CATEGORY_LABELS: Record<RequiredTipCategory, string> = {
  general: 'General',
  peak_week: 'Peak Week',
  digestion: 'Digestión',
  training: 'Entrenamiento',
  compliance: 'Cumplimiento',
};

const CATEGORY_COLORS: Record<RequiredTipCategory, string> = {
  general: '#3B82F6',
  peak_week: '#EF4444',
  digestion: '#10B981',
  training: '#F59E0B',
  compliance: '#8B5CF6',
};

const PLAN_TYPE_LABELS: Record<PlanTypeFilter, string> = {
  all: 'Todos',
  cutting: 'Cutting',
  bulking: 'Bulking',
  peak_week: 'Peak Week',
  carb_load: 'Carga de Carbs',
  maintenance: 'Mantenimiento',
};

const ALL_CATEGORIES: RequiredTipCategory[] = ['general', 'peak_week', 'digestion', 'training', 'compliance'];
const ALL_PLAN_TYPES: PlanTypeFilter[] = ['all', 'cutting', 'bulking', 'peak_week', 'carb_load', 'maintenance'];

export default function RequiredTipsScreen() {
  const { colors } = useTheme();
  const { settings, updateDocuments } = useSettings();
  const tips = React.useMemo(() => settings.documents.requiredTips || [], [settings.documents.requiredTips]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<RequiredTipCategory | 'all'>('all');

  const saveTips = useCallback((updated: RequiredTip[]) => {
    updateDocuments({ requiredTips: updated });
  }, [updateDocuments]);

  const addTip = useCallback(() => {
    const newTip: RequiredTip = {
      id: generateId(),
      text: '',
      category: 'general',
      enabled: true,
      planTypes: ['all'],
      excludedStudentIds: [],
    };
    const updated = [...tips, newTip];
    saveTips(updated);
    setExpandedId(newTip.id);
  }, [tips, saveTips]);

  const removeTip = useCallback((id: string) => {
    Alert.alert('Eliminar consejo', '¿Deseas eliminar este consejo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          saveTips(tips.filter(t => t.id !== id));
          if (expandedId === id) setExpandedId(null);
        },
      },
    ]);
  }, [tips, saveTips, expandedId]);

  const updateTip = useCallback((id: string, patch: Partial<RequiredTip>) => {
    saveTips(tips.map(t => t.id === id ? { ...t, ...patch } : t));
  }, [tips, saveTips]);

  const toggleEnabled = useCallback((id: string) => {
    const tip = tips.find(t => t.id === id);
    if (tip) {
      updateTip(id, { enabled: !tip.enabled });
    }
  }, [tips, updateTip]);

  const togglePlanType = useCallback((tipId: string, planType: PlanTypeFilter) => {
    const tip = tips.find(t => t.id === tipId);
    if (!tip) return;

    let newTypes: PlanTypeFilter[];
    if (planType === 'all') {
      newTypes = ['all'];
    } else {
      const current = tip.planTypes.filter(pt => pt !== 'all');
      if (current.includes(planType)) {
        newTypes = current.filter(pt => pt !== planType);
        if (newTypes.length === 0) newTypes = ['all'];
      } else {
        newTypes = [...current, planType];
      }
    }
    updateTip(tipId, { planTypes: newTypes });
  }, [tips, updateTip]);

  const filteredTips = filterCategory === 'all'
    ? tips
    : tips.filter(t => t.category === filterCategory);

  const enabledCount = tips.filter(t => t.enabled).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Consejos Requeridos', headerTintColor: colors.gold }} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Total de consejos</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{tips.length}</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.separator }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Activos</Text>
            <Text style={[styles.summaryValue, { color: colors.green }]}>{enabledCount}</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.separator }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Desactivados</Text>
            <Text style={[styles.summaryValue, { color: colors.textMuted }]}>{tips.length - enabledCount}</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
          style={styles.filterContainer}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: filterCategory === 'all' ? colors.gold : colors.elevated },
            ]}
            onPress={() => setFilterCategory('all')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterChipText,
              { color: filterCategory === 'all' ? '#000' : colors.textMuted },
            ]}>Todos</Text>
          </TouchableOpacity>
          {ALL_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterChip,
                { backgroundColor: filterCategory === cat ? CATEGORY_COLORS[cat] + '30' : colors.elevated },
                filterCategory === cat && { borderColor: CATEGORY_COLORS[cat], borderWidth: 1 },
              ]}
              onPress={() => setFilterCategory(cat)}
              activeOpacity={0.7}
            >
              <View style={[styles.filterDot, { backgroundColor: CATEGORY_COLORS[cat] }]} />
              <Text style={[
                styles.filterChipText,
                { color: filterCategory === cat ? CATEGORY_COLORS[cat] : colors.textMuted },
              ]}>{CATEGORY_LABELS[cat]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filteredTips.length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Tag size={28} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>Sin consejos</Text>
            <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
              Agrega frases que se incluirán automáticamente en los planes nutricionales exportados.
            </Text>
          </View>
        )}

        {filteredTips.map((tip) => {
          const isExpanded = expandedId === tip.id;
          const catColor = CATEGORY_COLORS[tip.category];

          return (
            <View
              key={tip.id}
              style={[
                styles.tipCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  opacity: tip.enabled ? 1 : 0.6,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.tipHeader}
                onPress={() => setExpandedId(isExpanded ? null : tip.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.tipCategoryDot, { backgroundColor: catColor }]} />
                <View style={styles.tipHeaderContent}>
                  <Text
                    style={[styles.tipText, { color: colors.text }]}
                    numberOfLines={isExpanded ? undefined : 2}
                  >
                    {tip.text || 'Consejo sin texto...'}
                  </Text>
                  <View style={styles.tipMeta}>
                    <View style={[styles.tipCategoryBadge, { backgroundColor: catColor + '20' }]}>
                      <Text style={[styles.tipCategoryText, { color: catColor }]}>
                        {CATEGORY_LABELS[tip.category]}
                      </Text>
                    </View>
                    {tip.planTypes.includes('all') ? null : (
                      <Text style={[styles.tipPlanTypes, { color: colors.textMuted }]}>
                        {tip.planTypes.map(pt => PLAN_TYPE_LABELS[pt]).join(', ')}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.tipActions}>
                  <TouchableOpacity
                    onPress={() => toggleEnabled(tip.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {tip.enabled ? (
                      <ToggleRight size={22} color={colors.green} />
                    ) : (
                      <ToggleLeft size={22} color={colors.textMuted} />
                    )}
                  </TouchableOpacity>
                  {isExpanded ? (
                    <ChevronUp size={16} color={colors.textMuted} />
                  ) : (
                    <ChevronDown size={16} color={colors.textMuted} />
                  )}
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={[styles.tipBody, { borderTopColor: colors.separator }]}>
                  <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>TEXTO DEL CONSEJO</Text>
                  <TextInput
                    style={[styles.tipInput, { color: colors.text, backgroundColor: colors.elevated, borderColor: colors.border }]}
                    value={tip.text}
                    onChangeText={(v) => updateTip(tip.id, { text: v })}
                    placeholder="Escribe el consejo aquí..."
                    placeholderTextColor={colors.textQuaternary}
                    multiline
                    textAlignVertical="top"
                  />

                  <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 14 }]}>CATEGORÍA</Text>
                  <View style={styles.categoryGrid}>
                    {ALL_CATEGORIES.map(cat => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryOption,
                          { backgroundColor: colors.elevated, borderColor: 'transparent', borderWidth: 1.5 },
                          tip.category === cat && { borderColor: CATEGORY_COLORS[cat], backgroundColor: CATEGORY_COLORS[cat] + '15' },
                        ]}
                        onPress={() => updateTip(tip.id, { category: cat })}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.catDot, { backgroundColor: CATEGORY_COLORS[cat] }]} />
                        <Text style={[
                          styles.categoryOptionText,
                          { color: tip.category === cat ? CATEGORY_COLORS[cat] : colors.textSecondary },
                        ]}>
                          {CATEGORY_LABELS[cat]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 14 }]}>APLICAR A TIPOS DE PLAN</Text>
                  <View style={styles.planTypeGrid}>
                    {ALL_PLAN_TYPES.map(pt => {
                      const isActive = tip.planTypes.includes(pt);
                      return (
                        <TouchableOpacity
                          key={pt}
                          style={[
                            styles.planTypeChip,
                            { backgroundColor: isActive ? colors.gold + '20' : colors.elevated, borderColor: isActive ? colors.gold : 'transparent', borderWidth: 1 },
                          ]}
                          onPress={() => togglePlanType(tip.id, pt)}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.planTypeText,
                            { color: isActive ? colors.gold : colors.textMuted },
                          ]}>{PLAN_TYPE_LABELS[pt]}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    style={[styles.deleteBtn, { backgroundColor: colors.red + '12' }]}
                    onPress={() => removeTip(tip.id)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={14} color={colors.red} />
                    <Text style={[styles.deleteBtnText, { color: colors.red }]}>Eliminar consejo</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.gold }]}
          onPress={addTip}
          activeOpacity={0.8}
        >
          <Plus size={18} color="#000" />
          <Text style={styles.addButtonText}>Agregar Consejo</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },
  spacer: { height: 20 },
  summaryCard: {
    flexDirection: 'row' as const,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: '100%',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700' as const,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterScroll: {
    gap: 8,
    paddingRight: 20,
  },
  filterChip: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  filterDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  emptyState: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center' as const,
    lineHeight: 18,
  },
  tipCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden' as const,
  },
  tipHeader: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start',
    padding: 14,
    gap: 10,
  },
  tipCategoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  tipHeaderContent: {
    flex: 1,
  },
  tipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    marginBottom: 6,
  },
  tipMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  tipCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tipCategoryText: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  tipPlanTypes: {
    fontSize: 11,
  },
  tipActions: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 2,
  },
  tipBody: {
    padding: 14,
    borderTopWidth: 0.5,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1,
    marginBottom: 8,
  },
  tipInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    lineHeight: 20,
  },
  categoryGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  catDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryOptionText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  planTypeGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  planTypeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  planTypeText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  deleteBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  addButton: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
  },
});
