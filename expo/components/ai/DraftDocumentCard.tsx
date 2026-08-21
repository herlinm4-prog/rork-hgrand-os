// components/ai/DraftDocumentCard.tsx
// Live editable nutrition plan draft that renders inside the chat.
// The coach can add/remove foods, adjust grams, and refine the plan
// before saving it to a student or exporting as PDF.
//
// Design: Apple medical-tech — clean cards, fine borders, refined typography.

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  LayoutAnimation,
  Platform,
  ViewStyle,
} from 'react-native';
import {
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
  Save,
  FileDown,
  Utensils,
  Copy,
  Sparkles,
  Check,
  Minus,
  Send,
  Layers,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { MealPlanFood, MealPlanMeal, FoodDatabaseEntry, FOOD_CATEGORY_LABELS } from '@/types/ai';
import { searchFoods, entryToFood, FOOD_DATABASE } from '@/utils/foodDatabase';
import {
  MealObjective,
  MEAL_OBJECTIVE_LABELS,
  FoodWeightType,
  NutritionUnitSystem,
  CardioSection,
  Meal,
  FoodItem,
  NutritionPlan,
} from '@/types';
import { parseNum } from '@/utils/calculations';

// ── Types ─────────────────────────────────────────────────────

export interface DraftMeal {
  id: string;
  name: string;
  time: string;
  objective?: MealObjective;
  objectiveText?: string;
  foods: DraftFood[];
}

export interface DraftFood {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  weightType: FoodWeightType;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  // Per-unit macro density (stored once at creation so edits always recalc from the original base).
  perUnitCalories: number;
  perUnitProtein: number;
  perUnitCarbs: number;
  perUnitFats: number;
}

export interface DraftNutritionPlan {
  documentId: string;
  title: string;
  studentName?: string;
  currentWeight?: string;
  weeklyGoal?: string;
  metabolicStrategy?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  unitSystem: NutritionUnitSystem;
  meals: DraftMeal[];
  cardio?: CardioSection;
  supplements?: Array<{ name: string; dosage: string; timing: string }>;
  notes?: string;
}

interface DraftDocumentCardProps {
  draft: DraftNutritionPlan;
  colors: {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    separator: string;
    tint: string;
    elevated: string;
  };
  onRefine?: (instruction: string, updatedDraft: DraftNutritionPlan) => void;
  onSave?: (plan: DraftNutritionPlan) => void;
  onExport?: (plan: DraftNutritionPlan) => void;
  isStreaming?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function gramsToOz(g: number): number {
  return Math.round((g / 28.3495) * 10) / 10;
}

function ozToGrams(oz: number): number {
  return Math.round(oz * 28.3495);
}

const MEAL_OBJECTIVES: MealObjective[] = [
  'pre_entreno', 'post_entreno', 'recuperacion', 'sensibilidad_insulina',
  'estabilidad_glucemica', 'rendimiento', 'soporte_anabolico', 'saciedad',
  'control_inflamatorio', 'densidad_calorica', 'ayuno', 'recarga_glucogeno',
  'equilibrio_hormonal', 'sueno',
];

const OBJECTIVE_COLORS: Record<MealObjective, string> = {
  pre_entreno: '#F59E0B',
  post_entreno: '#10B981',
  recuperacion: '#06B6D4',
  sensibilidad_insulina: '#8B5CF6',
  estabilidad_glucemica: '#3B82F6',
  rendimiento: '#EF4444',
  soporte_anabolico: '#EC4899',
  saciedad: '#14B8A6',
  control_inflamatorio: '#0EA5E9',
  densidad_calorica: '#F97316',
  ayuno: '#64748B',
  recarga_glucogeno: '#A855F7',
  equilibrio_hormonal: '#D946EF',
  sueno: '#6366F1',
};

// ── Component ─────────────────────────────────────────────────

export function DraftDocumentCard({
  draft: initialDraft,
  colors,
  onRefine,
  onSave,
  onExport,
  isStreaming,
}: DraftDocumentCardProps) {
  const [draft, setDraft] = useState<DraftNutritionPlan>(initialDraft);
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(
    new Set(initialDraft.meals.map(m => m.id))
  );
  const [showFoodPicker, setShowFoodPicker] = useState(false);
  const [activeMealId, setActiveMealId] = useState<string | null>(null);
  const [foodSearch, setFoodSearch] = useState('');
  const [showObjectivePicker, setShowObjectivePicker] = useState(false);
  const [objectiveMealId, setObjectiveMealId] = useState<string | null>(null);
  const [refineText, setRefineText] = useState('');
  const [showRefine, setShowRefine] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const isImperial = draft.unitSystem === 'imperial';

  // ── Totals ──────────────────────────────────────────────────
  const totals = useMemo(() => {
    let cal = 0, pro = 0, carb = 0, fat = 0;
    draft.meals.forEach(m => m.foods.forEach(f => {
      cal += f.calories; pro += f.protein; carb += f.carbs; fat += f.fats;
    }));
    return {
      calories: Math.round(cal),
      protein: Math.round(pro * 10) / 10,
      carbs: Math.round(carb * 10) / 10,
      fats: Math.round(fat * 10) / 10,
    };
  }, [draft.meals]);

  const mealTotals = useCallback((meal: DraftMeal) => {
    let cal = 0, pro = 0, carb = 0, fat = 0;
    meal.foods.forEach(f => { cal += f.calories; pro += f.protein; carb += f.carbs; fat += f.fats; });
    return {
      calories: Math.round(cal),
      protein: Math.round(pro * 10) / 10,
      carbs: Math.round(carb * 10) / 10,
      fats: Math.round(fat * 10) / 10,
    };
  }, []);

  // ── Food search ─────────────────────────────────────────────
  const filteredFoods = useMemo<FoodDatabaseEntry[]>(() => {
    if (!foodSearch.trim()) return FOOD_DATABASE.slice(0, 30);
    return searchFoods(foodSearch, 30);
  }, [foodSearch]);

  // ── Actions ─────────────────────────────────────────────────
  const updateFoodName = useCallback((mealId: string, foodId: string, name: string) => {
    setDraft(prev => ({
      ...prev,
      meals: prev.meals.map(m => {
        if (m.id !== mealId) return m;
        return { ...m, foods: m.foods.map(f => f.id === foodId ? { ...f, name } : f) };
      }),
    }));
  }, []);

  const updateFoodQuantity = useCallback((mealId: string, foodId: string, rawQty: string) => {
    const num = parseNum(rawQty) || 0;
    setDraft(prev => ({
      ...prev,
      meals: prev.meals.map(m => {
        if (m.id !== mealId) return m;
        return {
          ...m,
          foods: m.foods.map(f => {
            if (f.id !== foodId) return f;
            // Recalculate from stored per-unit density — always accurate regardless of edit history.
            return {
              ...f,
              quantity: num,
              calories: Math.round(f.perUnitCalories * num),
              protein: Math.round(f.perUnitProtein * num * 10) / 10,
              carbs: Math.round(f.perUnitCarbs * num * 10) / 10,
              fats: Math.round(f.perUnitFats * num * 10) / 10,
            };
          }),
        };
      }),
    }));
  }, []);

  const toggleFoodWeightType = useCallback((mealId: string, foodId: string) => {
    setDraft(prev => ({
      ...prev,
      meals: prev.meals.map(m => {
        if (m.id !== mealId) return m;
        return {
          ...m,
          foods: m.foods.map(f => f.id === foodId ? { ...f, weightType: f.weightType === 'cooked' ? 'dry' : 'cooked' } : f),
        };
      }),
    }));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const removeFood = useCallback((mealId: string, foodId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDraft(prev => ({
      ...prev,
      meals: prev.meals.map(m => m.id === mealId ? { ...m, foods: m.foods.filter(f => f.id !== foodId) } : m),
    }));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const addFoodToMeal = useCallback((entry: FoodDatabaseEntry) => {
    if (!activeMealId) return;
    const converted = entryToFood(entry, entry.quantity, entry.unit);
    const newFood: DraftFood = {
      id: converted.id,
      name: converted.name,
      quantity: converted.quantity,
      unit: converted.unit,
      weightType: converted.weightType,
      calories: converted.calories,
      protein: converted.protein,
      carbs: converted.carbs,
      fats: converted.fats,
      perUnitCalories: converted.perUnitCalories ?? converted.calories / converted.quantity,
      perUnitProtein: converted.perUnitProtein ?? converted.protein / converted.quantity,
      perUnitCarbs: converted.perUnitCarbs ?? converted.carbs / converted.quantity,
      perUnitFats: converted.perUnitFats ?? converted.fats / converted.quantity,
    };
    setDraft(prev => ({
      ...prev,
      meals: prev.meals.map(m => m.id === activeMealId ? { ...m, foods: [...m.foods, newFood] } : m),
    }));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowFoodPicker(false);
    setFoodSearch('');
  }, [activeMealId]);

  const addMeal = useCallback(() => {
    const idx = draft.meals.length;
    const newMeal: DraftMeal = {
      id: generateId(),
      name: `Comida ${idx + 1}`,
      time: '12:00',
      foods: [],
    };
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDraft(prev => ({ ...prev, meals: [...prev.meals, newMeal] }));
    setExpandedMeals(prev => new Set([...prev, newMeal.id]));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [draft.meals.length]);

  const removeMeal = useCallback((mealId: string) => {
    if (draft.meals.length <= 3) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDraft(prev => ({ ...prev, meals: prev.meals.filter(m => m.id !== mealId) }));
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [draft.meals.length]);

  const toggleMeal = useCallback((mealId: string) => {
    setExpandedMeals(prev => {
      const next = new Set(prev);
      if (next.has(mealId)) next.delete(mealId); else next.add(mealId);
      return next;
    });
  }, []);

  const updateMealName = useCallback((mealId: string, name: string) => {
    setDraft(prev => ({ ...prev, meals: prev.meals.map(m => m.id === mealId ? { ...m, name } : m) }));
  }, []);

  const updateMealTime = useCallback((mealId: string, time: string) => {
    setDraft(prev => ({ ...prev, meals: prev.meals.map(m => m.id === mealId ? { ...m, time } : m) }));
  }, []);

  const setMealObjective = useCallback((mealId: string, objective: MealObjective | undefined) => {
    setDraft(prev => ({ ...prev, meals: prev.meals.map(m => m.id === mealId ? { ...m, objective } : m) }));
    setShowObjectivePicker(false);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const openFoodPicker = useCallback((mealId: string) => {
    setActiveMealId(mealId);
    setShowFoodPicker(true);
    setFoodSearch('');
  }, []);

  const openObjectivePicker = useCallback((mealId: string) => {
    setObjectiveMealId(mealId);
    setShowObjectivePicker(true);
  }, []);

  const handleRefine = useCallback(() => {
    if (!refineText.trim() || !onRefine) return;
    onRefine(refineText.trim(), draft);
    setRefineText('');
    setShowRefine(false);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [refineText, draft, onRefine]);

  const handleSave = useCallback(() => {
    onSave?.(draft);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [draft, onSave]);

  const handleExport = useCallback(() => {
    onExport?.(draft);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [draft, onExport]);

  // ── Macro delta vs target ───────────────────────────────────
  const macroDelta = useMemo(() => ({
    calories: totals.calories - draft.calories,
    protein: totals.protein - draft.protein,
    carbs: totals.carbs - draft.carbs,
    fats: totals.fats - draft.fats,
  }), [totals, draft]);

  // ── Render ──────────────────────────────────────────────────
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* ── Draft badge ───────────────────────────────────────── */}
      <View style={[styles.draftBadge, { backgroundColor: colors.tint + '12', borderColor: colors.tint + '30' }]}>
        <View style={[styles.draftBadgeDot, { backgroundColor: colors.tint }]} />
        <Text style={[styles.draftBadgeText, { color: colors.tint }]}>BORRADOR EDITABLE</Text>
        <Text style={[styles.draftBadgeHint, { color: colors.textMuted }]}>· Toca para editar</Text>
      </View>

      {/* ── Plan header ───────────────────────────────────────── */}
      <View style={[styles.planHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.planHeaderTop}>
          <View style={[styles.planHeaderIcon, { backgroundColor: colors.tint + '15' }]}>
            <Utensils size={14} color={colors.tint} />
          </View>
          <Text style={[styles.planHeaderLabel, { color: colors.textMuted }]}>PLAN NUTRICIONAL</Text>
        </View>
        <TextInput
          style={[styles.planTitle, { color: colors.text }]}
          value={draft.title}
          onChangeText={(t) => setDraft(prev => ({ ...prev, title: t }))}
          placeholder="Título del plan"
          placeholderTextColor={colors.textMuted}
        />
        {draft.studentName ? (
          <Text style={[styles.planStudent, { color: colors.tint }]}>{draft.studentName}</Text>
        ) : null}
        {(draft.currentWeight || draft.weeklyGoal || draft.metabolicStrategy) && (
          <View style={styles.planMetaRow}>
            {draft.currentWeight ? (
              <View style={[styles.planMetaChip, { backgroundColor: colors.background }]}>
                <Text style={[styles.planMetaChipLabel, { color: colors.textMuted }]}>Peso</Text>
                <Text style={[styles.planMetaChipValue, { color: colors.text }]}>{draft.currentWeight}kg</Text>
              </View>
            ) : null}
            {draft.weeklyGoal ? (
              <View style={[styles.planMetaChip, { backgroundColor: colors.background }]}>
                <Text style={[styles.planMetaChipLabel, { color: colors.textMuted }]}>Objetivo</Text>
                <Text style={[styles.planMetaChipValue, { color: colors.text }]}>{draft.weeklyGoal}</Text>
              </View>
            ) : null}
            {draft.metabolicStrategy ? (
              <View style={[styles.planMetaChip, { backgroundColor: colors.background }]}>
                <Text style={[styles.planMetaChipLabel, { color: colors.textMuted }]}>Estrategia</Text>
                <Text style={[styles.planMetaChipValue, { color: colors.text }]}>{draft.metabolicStrategy}</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>

      {/* ── Macro targets ─────────────────────────────────────── */}
      <View style={styles.macroRow}>
        <MacroPill label="kcal" target={draft.calories} actual={totals.calories} delta={macroDelta.calories} color="#F59E0B" colors={colors} />
        <MacroPill label="Prot" target={draft.protein} actual={totals.protein} delta={macroDelta.protein} unit="g" color="#3B82F6" colors={colors} />
        <MacroPill label="Carb" target={draft.carbs} actual={totals.carbs} delta={macroDelta.carbs} unit="g" color="#10B981" colors={colors} />
        <MacroPill label="Gras" target={draft.fats} actual={totals.fats} delta={macroDelta.fats} unit="g" color="#EC4899" colors={colors} />
      </View>

      {/* ── Meals ─────────────────────────────────────────────── */}
      <View style={styles.mealsContainer}>
        {draft.meals.map((meal, mealIdx) => {
          const isExpanded = expandedMeals.has(meal.id);
          const mTotals = mealTotals(meal);
          const objColor = meal.objective ? OBJECTIVE_COLORS[meal.objective] : colors.textMuted;
          return (
            <View key={meal.id} style={[styles.mealCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Meal header */}
              <TouchableOpacity
                style={styles.mealHeader}
                onPress={() => toggleMeal(meal.id)}
                activeOpacity={0.7}
              >
                <View style={styles.mealHeaderLeft}>
                  <View style={[styles.mealNumber, { backgroundColor: objColor + '15' }]}>
                    <Text style={[styles.mealNumberText, { color: objColor }]}>{mealIdx + 1}</Text>
                  </View>
                  <View style={styles.mealHeaderInfo}>
                    <TextInput
                      style={[styles.mealName, { color: colors.text }]}
                      value={meal.name}
                      onChangeText={(t) => updateMealName(meal.id, t)}
                      placeholder="Nombre comida"
                      placeholderTextColor={colors.textMuted}
                    />
                    <View style={styles.mealMetaRow}>
                      <TextInput
                        style={[styles.mealTime, { color: colors.textMuted }]}
                        value={meal.time}
                        onChangeText={(t) => updateMealTime(meal.id, t)}
                        placeholder="00:00"
                        placeholderTextColor={colors.textMuted}
                      />
                      <Text style={[styles.mealMacros, { color: colors.textSecondary }]}>
                        {mTotals.calories} kcal · {mTotals.protein}p · {mTotals.carbs}c · {mTotals.fats}g
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.mealHeaderRight}>
                  {isExpanded ? <ChevronUp size={16} color={colors.textMuted} /> : <ChevronDown size={16} color={colors.textMuted} />}
                </View>
              </TouchableOpacity>

              {/* Objective badge */}
              {isExpanded && (
                <View style={styles.mealObjectiveRow}>
                  <TouchableOpacity
                    style={[styles.objectiveBadge, { backgroundColor: objColor + '12', borderColor: objColor + '25' }]}
                    onPress={() => openObjectivePicker(meal.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.objectiveDot, { backgroundColor: objColor }]} />
                    <Text style={[styles.objectiveText, { color: objColor }]}>
                      {meal.objective ? MEAL_OBJECTIVE_LABELS[meal.objective] : 'Sin objetivo'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Foods list */}
              {isExpanded && (
                <View style={styles.foodsList}>
                  {meal.foods.length === 0 && (
                    <Text style={[styles.emptyFoods, { color: colors.textMuted }]}>Sin alimentos. Toca + para añadir.</Text>
                  )}
                  {meal.foods.map((food) => (
                    <FoodRow
                      key={food.id}
                      food={food}
                      isImperial={isImperial}
                      colors={colors}
                      onNameChange={(name) => updateFoodName(meal.id, food.id, name)}
                      onQuantityChange={(qty) => updateFoodQuantity(meal.id, food.id, qty)}
                      onToggleWeight={() => toggleFoodWeightType(meal.id, food.id)}
                      onRemove={() => removeFood(meal.id, food.id)}
                    />
                  ))}
                  {/* Add food button */}
                  <TouchableOpacity
                    style={[styles.addFoodBtn, { borderColor: colors.border }]}
                    onPress={() => openFoodPicker(meal.id)}
                    activeOpacity={0.7}
                  >
                    <Plus size={14} color={colors.tint} />
                    <Text style={[styles.addFoodText, { color: colors.tint }]}>Añadir alimento</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Remove meal (only if >3) */}
              {isExpanded && draft.meals.length > 3 && (
                <TouchableOpacity
                  style={styles.removeMealBtn}
                  onPress={() => removeMeal(meal.id)}
                  activeOpacity={0.7}
                >
                  <Trash2 size={11} color="#EF4444" />
                  <Text style={styles.removeMealText}>Eliminar comida</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Add meal button */}
        {draft.meals.length < 7 && (
          <TouchableOpacity
            style={[styles.addMealBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={addMeal}
            activeOpacity={0.7}
          >
            <Plus size={16} color={colors.tint} />
            <Text style={[styles.addMealText, { color: colors.tint }]}>Añadir comida ({draft.meals.length}/7)</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Cardio section ────────────────────────────────────── */}
      {draft.cardio?.enabled && (
        <View style={[styles.cardioSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardioHeader}>
            <View style={[styles.cardioIcon, { backgroundColor: '#EF444415' }]}>
              <Text style={styles.cardioIconText}>🏃</Text>
            </View>
            <Text style={[styles.cardioTitle, { color: colors.text }]}>CARDIO</Text>
          </View>
          <View style={styles.cardioContent}>
            <Text style={[styles.cardioLine, { color: colors.textSecondary }]}>
              • {draft.cardio.durationMinutes} min · {draft.cardio.heartRateMin}-{draft.cardio.heartRateMax} bpm
            </Text>
            <Text style={[styles.cardioLine, { color: colors.textSecondary }]}>
              • {draft.cardio.frequencyPerWeek}x/semana · {draft.cardio.timing === 'post_entreno' ? 'Post entreno' : draft.cardio.timing === 'ayunas' ? 'En ayunas' : 'Cualquier momento'}
            </Text>
            {draft.cardio.type ? (
              <Text style={[styles.cardioLine, { color: colors.textSecondary }]}>• {draft.cardio.type}</Text>
            ) : null}
          </View>
        </View>
      )}

      {/* ── Supplements ───────────────────────────────────────── */}
      {draft.supplements && draft.supplements.length > 0 && (
        <View style={[styles.supplementsSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.supplementsTitle, { color: colors.text }]}>SUPLEMENTACIÓN</Text>
          {draft.supplements.map((supp, i) => (
            <View key={i} style={styles.supplementRow}>
              <Text style={[styles.supplementName, { color: colors.text }]}>{supp.name}</Text>
              <Text style={[styles.supplementDose, { color: colors.textMuted }]}>{supp.dosage} · {supp.timing}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Actions bar ───────────────────────────────────────── */}
      {!isStreaming && (
        <View style={[styles.actionsBar, { borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowRefine(!showRefine)}
            activeOpacity={0.7}
          >
            <Sparkles size={14} color={colors.tint} />
            <Text style={[styles.actionBtnText, { color: colors.tint }]}>Refinar con Sol</Text>
          </TouchableOpacity>
          {onSave && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleSave}
              activeOpacity={0.7}
            >
              <Save size={14} color="#10B981" />
              <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Guardar</Text>
            </TouchableOpacity>
          )}
          {onExport && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleExport}
              activeOpacity={0.7}
            >
              <FileDown size={14} color="#3B82F6" />
              <Text style={[styles.actionBtnText, { color: '#3B82F6' }]}>PDF</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Refine input ──────────────────────────────────────── */}
      {showRefine && !isStreaming && (
        <View style={[styles.refineBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.refineLabel, { color: colors.textMuted }]}>Pide a Sol que ajuste el borrador:</Text>
          <View style={styles.refineInputRow}>
            <TextInput
              style={[styles.refineInput, { color: colors.text, backgroundColor: colors.background }]}
              value={refineText}
              onChangeText={setRefineText}
              placeholder="ej: sube los carbos de la comida 3 a 150g, añade 30g de almendras al desayuno..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.refineSendBtn, { backgroundColor: colors.tint }, !refineText.trim() && { opacity: 0.4 }]}
              onPress={handleRefine}
              disabled={!refineText.trim()}
              activeOpacity={0.7}
            >
              <Send size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Food Picker Modal ─────────────────────────────────── */}
      <Modal visible={showFoodPicker} animationType="slide" transparent={true} onRequestClose={() => setShowFoodPicker(false)}>
        <View style={styles.foodPickerOverlay}>
          <View style={[styles.foodPickerContent, { backgroundColor: colors.elevated }]}>
            <View style={[styles.foodPickerHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.foodPickerTitle, { color: colors.text }]}>Añadir alimento</Text>
              <TouchableOpacity onPress={() => setShowFoodPicker(false)} activeOpacity={0.7}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.foodSearchInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={foodSearch}
              onChangeText={setFoodSearch}
              placeholder="Buscar alimento..."
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <ScrollView style={styles.foodList} showsVerticalScrollIndicator={false}>
              {filteredFoods.map(food => (
                <TouchableOpacity
                  key={food.id}
                  style={[styles.foodPickerRow, { borderBottomColor: colors.separator }]}
                  onPress={() => addFoodToMeal(food)}
                  activeOpacity={0.7}
                >
                  <View style={styles.foodPickerInfo}>
                    <Text style={[styles.foodPickerName, { color: colors.text }]}>{food.name}</Text>
                    <Text style={[styles.foodPickerMeta, { color: colors.textMuted }]}>
                      {FOOD_CATEGORY_LABELS[food.category]} · {food.calories} kcal · P:{food.protein} · C:{food.carbs} · G:{food.fats} · {food.weightType === 'dry' ? 'seco' : 'cocido'}
                    </Text>
                  </View>
                  <Plus size={16} color={colors.tint} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Objective Picker Modal ────────────────────────────── */}
      <Modal visible={showObjectivePicker} animationType="slide" transparent={true} onRequestClose={() => setShowObjectivePicker(false)}>
        <View style={styles.foodPickerOverlay}>
          <View style={[styles.foodPickerContent, { backgroundColor: colors.elevated, maxHeight: '70%' }]}>
            <View style={[styles.foodPickerHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.foodPickerTitle, { color: colors.text }]}>Objetivo metabólico</Text>
              <TouchableOpacity onPress={() => setShowObjectivePicker(false)} activeOpacity={0.7}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.foodList} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.objectivePickerRow, { borderBottomColor: colors.separator }]}
                onPress={() => objectiveMealId && setMealObjective(objectiveMealId, undefined)}
                activeOpacity={0.7}
              >
                <Text style={[styles.objectivePickerText, { color: colors.textMuted }]}>Sin objetivo</Text>
              </TouchableOpacity>
              {MEAL_OBJECTIVES.map(obj => (
                <TouchableOpacity
                  key={obj}
                  style={[styles.objectivePickerRow, { borderBottomColor: colors.separator }]}
                  onPress={() => objectiveMealId && setMealObjective(objectiveMealId, obj)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.objectivePickerDot, { backgroundColor: OBJECTIVE_COLORS[obj] }]} />
                  <Text style={[styles.objectivePickerText, { color: colors.text }]}>{MEAL_OBJECTIVE_LABELS[obj]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

// ── MacroPill subcomponent ─────────────────────────────────────

function MacroPill({
  label, target, actual, delta, unit, color, colors,
}: {
  label: string;
  target: number;
  actual: number;
  delta: number;
  unit?: string;
  color: string;
  colors: DraftDocumentCardProps['colors'];
}) {
  const deltaColor = Math.abs(delta) < 5 ? '#10B981' : delta > 0 ? '#F59E0B' : '#EF4444';
  return (
    <View style={[styles.macroPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.macroPillLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.macroPillValue, { color: color }]}>{actual}{unit || ''}</Text>
      <Text style={[styles.macroPillTarget, { color: colors.textMuted }]}>/ {target}{unit || ''}</Text>
      <Text style={[styles.macroPillDelta, { color: deltaColor }]}>
        {delta > 0 ? '+' : ''}{Math.round(delta * 10) / 10}
      </Text>
    </View>
  );
}

// ── FoodRow subcomponent ───────────────────────────────────────

function FoodRow({
  food, isImperial, colors, onNameChange, onQuantityChange, onToggleWeight, onRemove,
}: {
  food: DraftFood;
  isImperial: boolean;
  colors: DraftDocumentCardProps['colors'];
  onNameChange: (name: string) => void;
  onQuantityChange: (qty: string) => void;
  onToggleWeight: () => void;
  onRemove: () => void;
}) {
  const [qtyText, setQtyText] = useState<string>(
    isImperial ? gramsToOz(food.quantity).toString() : food.quantity.toString()
  );

  React.useEffect(() => {
    setQtyText(isImperial ? gramsToOz(food.quantity).toString() : food.quantity.toString());
  }, [food.quantity, isImperial]);

  const displayUnit = isImperial ? 'oz' : 'g';

  return (
    <View style={styles.foodRow}>
      <View style={[styles.foodBullet, { backgroundColor: colors.tint + '20' }]} />
      <View style={styles.foodInfo}>
        <TextInput
          style={[styles.foodName, { color: colors.text }]}
          value={food.name}
          onChangeText={onNameChange}
          placeholder="Alimento"
          placeholderTextColor={colors.textMuted}
          selectTextOnFocus
        />
        <Text style={[styles.foodMeta, { color: colors.textMuted }]}>
          {food.calories} kcal · {food.protein}p · {food.carbs}c · {food.fats}g
        </Text>
      </View>
      <View style={styles.foodControls}>
        <View style={styles.foodEditRow}>
          <TextInput
            style={[styles.foodQtyInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            value={qtyText}
            onChangeText={(v) => {
              setQtyText(v);
              onQuantityChange(v);
            }}
            keyboardType="numeric"
            selectTextOnFocus
          />
          <Text style={[styles.foodQtyUnit, { color: colors.textMuted }]}>{displayUnit}</Text>
          <TouchableOpacity
            style={[styles.foodWeightToggle, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={onToggleWeight}
            activeOpacity={0.6}
          >
            <Text style={[styles.foodWeightText, { color: food.weightType === 'dry' ? '#F59E0B' : colors.textMuted }]}>
              {food.weightType === 'dry' ? 'SECO' : 'COCIDO'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.foodRemoveBtn} onPress={onRemove} activeOpacity={0.6}>
            <Trash2 size={12} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 12,
    marginVertical: 6,
  },

  // Draft badge
  draftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  } as ViewStyle,
  draftBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  draftBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
  },
  draftBadgeHint: {
    fontSize: 10,
    fontWeight: '400' as const,
  },

  // Plan header
  planHeader: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  planHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8,
  },
  planHeaderIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planHeaderLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.6,
  },
  planTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    padding: 0,
    marginBottom: 2,
  },
  planStudent: {
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  planMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  planMetaChip: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 2,
  },
  planMetaChipLabel: {
    fontSize: 9,
    fontWeight: '600' as const,
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
  },
  planMetaChipValue: {
    fontSize: 12,
    fontWeight: '600' as const,
  },

  // Macros
  macroRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  macroPill: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
  },
  macroPillLabel: {
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  macroPillValue: {
    fontSize: 15,
    fontWeight: '800' as const,
  },
  macroPillTarget: {
    fontSize: 9,
    fontWeight: '400' as const,
  },
  macroPillDelta: {
    fontSize: 9,
    fontWeight: '600' as const,
  },

  // Meals
  mealsContainer: {
    gap: 8,
    marginBottom: 8,
  },
  mealCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  mealHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  mealNumber: {
    width: 28,
    height: 28,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealNumberText: {
    fontSize: 13,
    fontWeight: '800' as const,
  },
  mealHeaderInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 14,
    fontWeight: '700' as const,
    padding: 0,
    marginBottom: 2,
  },
  mealMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealTime: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  mealMacros: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  mealHeaderRight: {
    padding: 4,
  },

  // Objective
  mealObjectiveRow: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  objectiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  objectiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  objectiveText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },

  // Foods
  foodsList: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 6,
  },
  emptyFoods: {
    fontSize: 12,
    fontStyle: 'italic' as const,
    paddingVertical: 6,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 4,
  },
  foodBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 7,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  foodMeta: {
    fontSize: 10,
    marginTop: 1,
  },
  foodControls: {
    alignItems: 'flex-end',
  },
  foodDisplayQty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  foodQtyValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    fontVariant: ['tabular-nums'] as const,
  },
  foodWeightTag: {
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  foodEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  foodQtyInput: {
    width: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 13,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  foodQtyUnit: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  foodWeightToggle: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  foodWeightText: {
    fontSize: 8,
    fontWeight: '700' as const,
    letterSpacing: 0.4,
  },
  foodRemoveBtn: {
    padding: 4,
  },

  // Add food / meal
  addFoodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed' as const,
    justifyContent: 'center' as const,
    marginTop: 4,
  },
  addFoodText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  addMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed' as const,
    justifyContent: 'center' as const,
  },
  addMealText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  removeMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'center' as const,
  },
  removeMealText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#EF4444',
  },

  // Cardio
  cardioSection: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  cardioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardioIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardioIconText: {
    fontSize: 14,
  },
  cardioTitle: {
    fontSize: 13,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },
  cardioContent: {
    gap: 4,
  },
  cardioLine: {
    fontSize: 12,
    lineHeight: 18,
  },

  // Supplements
  supplementsSection: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  supplementsTitle: {
    fontSize: 12,
    fontWeight: '800' as const,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  supplementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  supplementName: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  supplementDose: {
    fontSize: 12,
  },

  // Actions
  actionsBar: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center' as const,
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },

  // Refine
  refineBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 8,
  },
  refineLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  refineInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  refineInput: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    maxHeight: 80,
    minHeight: 40,
  },
  refineSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Food picker modal
  foodPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end' as const,
  },
  foodPickerContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  foodPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  foodPickerTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  foodSearchInput: {
    margin: 16,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  foodList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  foodPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  foodPickerInfo: {
    flex: 1,
  },
  foodPickerName: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  foodPickerMeta: {
    fontSize: 12,
    marginTop: 2,
  },

  // Objective picker
  objectivePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  objectivePickerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  objectivePickerText: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
});
