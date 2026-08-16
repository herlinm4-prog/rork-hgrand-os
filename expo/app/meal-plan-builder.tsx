import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Switch,
  Platform,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Trash2,
  Copy,
  Save,
  ArrowLeft,
  Utensils,
  Target,
  Clock,
  Heart,
  Dumbbell,
  FileText,
  Eye,
  Minus,
  ChefHat,
  Droplets,
  Pencil,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { useTheme } from '@/contexts/ThemeContext';
import { useStudents } from '@/contexts/StudentsContext';
import { useSettings } from '@/contexts/SettingsContext';
import {
  MealPlanFood,
  MealPlanMeal,
} from '@/types/ai';
import type {
  NutritionPlan,
  Meal,
  FoodItem,
  CardioSection,
  MealObjective,
  NutritionUnitSystem,
} from '@/types';
import { MEAL_OBJECTIVE_LABELS } from '@/types';
import { generateHgrandNutritionPdfHtml } from '@/utils/nutritionPdfGenerator';

// ── Helpers ─────────────────────────────────────────────────────
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function gramsToOz(g: number): number {
  return Math.round((g / 28.3495) * 10) / 10;
}

function ozToGrams(oz: number): number {
  return Math.round(oz * 28.3495);
}

const DEFAULT_MEAL_TIMES = ['07:00', '10:00', '13:00', '16:30', '20:00', '22:00', '23:00'];
const DEFAULT_MEAL_NAMES = [
  'Desayuno', 'Media mañana', 'Almuerzo', 'Merienda',
  'Cena', 'Pre-sueño', 'Comida adicional',
];

const MEAL_OBJECTIVES: MealObjective[] = [
  'pre_entreno', 'post_entreno', 'recuperacion', 'sensibilidad_insulina',
  'estabilidad_glucemica', 'rendimiento', 'soporte_anabolico', 'saciedad',
  'control_inflamatorio', 'densidad_calorica', 'ayuno', 'recarga_glucogeno',
  'equilibrio_hormonal', 'sueno',
];

// ── Component ───────────────────────────────────────────────────
export default function MealPlanBuilderScreen() {
  const { colors } = useTheme();
  const { studentId, studentName, planId } = useLocalSearchParams<{
    studentId?: string;
    studentName?: string;
    planId?: string;
  }>();
  const { students, addDocument, addDietHistoryEntry, updateNutritionPlan } = useStudents();
  const { settings } = useSettings();

  const student = students.find(s => s.id === studentId);
  const displayName = studentName || student?.name || 'Alumno';
  const existingPlan = planId ? student?.nutritionPlan : undefined;

  const nutritionUnit = settings.language.nutritionUnit === 'oz' ? 'imperial' : 'metric';
  const [unitSystem, setUnitSystem] = useState<NutritionUnitSystem>(
    (existingPlan?.unitSystem as NutritionUnitSystem) || nutritionUnit
  );
  const isImperial = unitSystem === 'imperial';

  // ── Plan metadata ──
  const [title, setTitle] = useState<string>(
    existingPlan?.title || `Plan nutricional — ${displayName}`
  );
  const [currentWeight, setCurrentWeight] = useState<string>(
    existingPlan?.currentWeight?.toString() || student?.weight?.toString() || ''
  );
  const [weeklyGoal, setWeeklyGoal] = useState<string>(existingPlan?.weeklyGoal || '');
  const [metabolicStrategy, setMetabolicStrategy] = useState<string>(
    existingPlan?.metabolicStrategy || ''
  );

  // ── Daily objectives ──
  const [targetCalories, setTargetCalories] = useState<string>(
    existingPlan?.calories?.toString() || student?.tdee?.toString() || '2500'
  );
  const [targetProtein, setTargetProtein] = useState<string>(
    existingPlan?.protein?.toString() || '180'
  );
  const [targetCarbs, setTargetCarbs] = useState<string>(
    existingPlan?.carbs?.toString() || '280'
  );
  const [targetFats, setTargetFats] = useState<string>(
    existingPlan?.fats?.toString() || '70'
  );

  const [waterTarget, setWaterTarget] = useState<string>(
    existingPlan?.waterTarget?.toString() || '3'
  );
  const [sodiumTarget, setSodiumTarget] = useState<string>(
    existingPlan?.sodiumTarget?.toString() || ''
  );

  // ── Cardio ──
  const [cardioEnabled, setCardioEnabled] = useState<boolean>(
    existingPlan?.cardio?.enabled || false
  );
  const [cardioType, setCardioType] = useState<string>(
    existingPlan?.cardio?.type || 'Caminata inclinada'
  );
  const [cardioDuration, setCardioDuration] = useState<string>(
    existingPlan?.cardio?.durationMinutes?.toString() || '30'
  );
  const [cardioHrMin, setCardioHrMin] = useState<string>(
    existingPlan?.cardio?.heartRateMin?.toString() || '120'
  );
  const [cardioHrMax, setCardioHrMax] = useState<string>(
    existingPlan?.cardio?.heartRateMax?.toString() || '135'
  );
  const [cardioFreq, setCardioFreq] = useState<string>(
    existingPlan?.cardio?.frequencyPerWeek?.toString() || '5'
  );
  const [cardioTiming, setCardioTiming] = useState<'post_entreno' | 'ayunas' | 'any'>(
    existingPlan?.cardio?.timing || 'post_entreno'
  );
  const [cardioNotes, setCardioNotes] = useState<string>(
    existingPlan?.cardio?.notes || ''
  );

  // ── Meals ──
  const [meals, setMeals] = useState<MealPlanMeal[]>(() => {
    if (existingPlan?.meals && existingPlan.meals.length > 0) {
      return existingPlan.meals.map(m => ({
        id: m.id,
        name: m.name,
        time: m.time,
        objective: m.objective,
        objectiveText: m.objectiveText || '',
        foods: m.foods.map(f => ({
          id: generateId(),
          name: f.name,
          quantity: f.quantity,
          unit: f.unit,
          weightType: f.weightType || 'cooked',
          calories: f.calories,
          protein: f.protein,
          carbs: f.carbs,
          fats: f.fats,
        })),
      }));
    }
    return Array.from({ length: 5 }, (_, i) => ({
      id: generateId(),
      name: DEFAULT_MEAL_NAMES[i],
      time: DEFAULT_MEAL_TIMES[i],
      foods: [],
    }));
  });

  // ── Notes ──
  const [notes, setNotes] = useState<string>(existingPlan?.notes || '');

  // ── UI state ──
  const [showFoodPicker, setShowFoodPicker] = useState<boolean>(false);
  const [activeMealId, setActiveMealId] = useState<string | null>(null);
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set(meals.map(m => m.id)));
  const [showObjectivePicker, setShowObjectivePicker] = useState<boolean>(false);
  const [objectiveMealId, setObjectiveMealId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);

  const [customFood, setCustomFood] = useState({
    name: '',
    quantity: '',
    unit: 'g',
    weightType: 'cooked' as 'cooked' | 'dry',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    notes: '',
  });

  // ── Totals ──
  const totals = useMemo(() => {
    let cal = 0, pro = 0, carb = 0, fat = 0;
    meals.forEach(m => m.foods.forEach(f => {
      cal += f.calories;
      pro += f.protein;
      carb += f.carbs;
      fat += f.fats;
    }));
    return {
      calories: Math.round(cal),
      protein: Math.round(pro * 10) / 10,
      carbs: Math.round(carb * 10) / 10,
      fats: Math.round(fat * 10) / 10,
    };
  }, [meals]);

  const mealTotals = useCallback((meal: MealPlanMeal) => {
    let cal = 0, pro = 0, carb = 0, fat = 0;
    meal.foods.forEach(f => { cal += f.calories; pro += f.protein; carb += f.carbs; fat += f.fats; });
    return {
      calories: Math.round(cal),
      protein: Math.round(pro * 10) / 10,
      carbs: Math.round(carb * 10) / 10,
      fats: Math.round(fat * 10) / 10,
    };
  }, []);

  // ── Actions ───────────────────────────────────────────────────
  const resetCustomFood = useCallback(() => {
    setCustomFood({
      name: '', quantity: '', unit: 'g', weightType: 'cooked',
      calories: '', protein: '', carbs: '', fats: '', notes: '',
    });
  }, []);

  const addCustomFoodToMeal = useCallback(() => {
    if (!activeMealId) return;
    if (!customFood.name.trim()) {
      Alert.alert('Falta el nombre', 'Escribe el nombre del alimento.');
      return;
    }
    if (!customFood.quantity || parseFloat(customFood.quantity) <= 0) {
      Alert.alert('Falta la cantidad', 'Indica la cantidad en gramos u onzas.');
      return;
    }
    const cq = parseFloat(customFood.quantity) || 0;
    const cc = parseFloat(customFood.calories) || 0;
    const cp = parseFloat(customFood.protein) || 0;
    const ccab = parseFloat(customFood.carbs) || 0;
    const cf = parseFloat(customFood.fats) || 0;
    const newFood: MealPlanFood = {
      id: generateId(),
      name: customFood.name.trim(),
      quantity: cq,
      unit: customFood.unit || 'g',
      weightType: customFood.weightType,
      calories: cc,
      protein: cp,
      carbs: ccab,
      fats: cf,
      perUnitCalories: cq > 0 ? cc / cq : 0,
      perUnitProtein: cq > 0 ? cp / cq : 0,
      perUnitCarbs: cq > 0 ? ccab / cq : 0,
      perUnitFats: cq > 0 ? cf / cq : 0,
    };
    setMeals(prev => prev.map(m =>
      m.id === activeMealId ? { ...m, foods: [...m.foods, newFood] } : m
    ));
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetCustomFood();
  }, [activeMealId, customFood, resetCustomFood]);

  const removeFoodFromMeal = useCallback((mealId: string, foodIdx: number) => {
    setMeals(prev => prev.map(m =>
      m.id === mealId ? { ...m, foods: m.foods.filter((_, i) => i !== foodIdx) } : m
    ));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const addMeal = useCallback(() => {
    const idx = meals.length;
    const newMeal: MealPlanMeal = {
      id: generateId(),
      name: idx < DEFAULT_MEAL_NAMES.length ? DEFAULT_MEAL_NAMES[idx] : `Comida ${idx + 1}`,
      time: idx < DEFAULT_MEAL_TIMES.length ? DEFAULT_MEAL_TIMES[idx] : '12:00',
      foods: [],
    };
    setMeals(prev => [...prev, newMeal]);
    setExpandedMeals(prev => new Set([...prev, newMeal.id]));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [meals.length]);

  const removeMeal = useCallback((mealId: string) => {
    if (meals.length <= 3) {
      Alert.alert('Mínimo 3 comidas', 'El plan debe tener al menos 3 comidas.');
      return;
    }
    Alert.alert('Eliminar comida', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: () => {
          setMeals(prev => prev.filter(m => m.id !== mealId));
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      },
    ]);
  }, [meals.length]);

  const duplicateMeal = useCallback((mealId: string) => {
    const source = meals.find(m => m.id === mealId);
    if (!source) return;
    const dup: MealPlanMeal = {
      ...source,
      id: generateId(),
      name: `${source.name} (copia)`,
      foods: source.foods.map(f => ({ ...f, id: generateId() })),
    };
    setMeals(prev => [...prev, dup]);
    setExpandedMeals(prev => new Set([...prev, dup.id]));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [meals]);

  const toggleMeal = useCallback((mealId: string) => {
    setExpandedMeals(prev => {
      const next = new Set(prev);
      if (next.has(mealId)) next.delete(mealId); else next.add(mealId);
      return next;
    });
  }, []);

  const updateMealName = useCallback((mealId: string, name: string) => {
    setMeals(prev => prev.map(m => m.id === mealId ? { ...m, name } : m));
  }, []);

  const updateMealTime = useCallback((mealId: string, time: string) => {
    setMeals(prev => prev.map(m => m.id === mealId ? { ...m, time } : m));
  }, []);

  const setMealObjective = useCallback((mealId: string, objective: MealObjective | undefined) => {
    setMeals(prev => prev.map(m => m.id === mealId ? { ...m, objective } : m));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const updateMealObjectiveText = useCallback((mealId: string, text: string) => {
    setMeals(prev => prev.map(m => m.id === mealId ? { ...m, objectiveText: text } : m));
  }, []);

  const updateFoodName = useCallback((mealId: string, foodIdx: number, name: string) => {
    setMeals(prev => prev.map(m => {
      if (m.id !== mealId) return m;
      return {
        ...m,
        foods: m.foods.map((f, i) => i === foodIdx ? { ...f, name } : f),
      };
    }));
  }, []);

  const updateFoodQuantity = useCallback((mealId: string, foodIdx: number, quantity: string) => {
    const num = parseFloat(quantity) || 0;
    setMeals(prev => prev.map(m => {
      if (m.id !== mealId) return m;
      return {
        ...m,
        foods: m.foods.map((f, i) => {
          if (i !== foodIdx) return f;
          const gramsQty = f.unit === 'oz' ? ozToGrams(num) : num;
          // Use stored per-unit density — works for both DB foods and custom foods.
          const puc = f.perUnitCalories ?? (f.quantity > 0 ? f.calories / f.quantity : 0);
          const pup = f.perUnitProtein ?? (f.quantity > 0 ? f.protein / f.quantity : 0);
          const pucb = f.perUnitCarbs ?? (f.quantity > 0 ? f.carbs / f.quantity : 0);
          const puf = f.perUnitFats ?? (f.quantity > 0 ? f.fats / f.quantity : 0);
          return {
            ...f,
            quantity: gramsQty,
            calories: Math.round(puc * gramsQty),
            protein: Math.round(pup * gramsQty * 10) / 10,
            carbs: Math.round(pucb * gramsQty * 10) / 10,
            fats: Math.round(puf * gramsQty * 10) / 10,
          };
        }),
      };
    }));
  }, []);

  const toggleFoodWeightType = useCallback((mealId: string, foodIdx: number) => {
    setMeals(prev => prev.map(m => {
      if (m.id !== mealId) return m;
      return {
        ...m,
        foods: m.foods.map((f, i) => {
          if (i !== foodIdx) return f;
          return { ...f, weightType: f.weightType === 'dry' ? 'cooked' as const : 'dry' as const };
        }),
      };
    }));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // ── Build plan data ──────────────────────────────────────────
  const buildNutritionPlan = useCallback((): NutritionPlan => ({
    id: existingPlan?.id || generateId(),
    studentId: studentId || '',
    title,
    currentWeight: parseFloat(currentWeight) || undefined,
    weeklyGoal: weeklyGoal || undefined,
    metabolicStrategy: metabolicStrategy || undefined,
    calories: parseInt(targetCalories) || 0,
    protein: parseInt(targetProtein) || 0,
    carbs: parseInt(targetCarbs) || 0,
    fats: parseInt(targetFats) || 0,
    unitSystem,
    meals: meals.map((m): Meal => ({
      id: m.id,
      name: m.name,
      time: m.time,
      objective: m.objective,
      objectiveText: m.objectiveText || undefined,
      foods: m.foods.map((f): FoodItem => ({
        name: f.name,
        quantity: f.quantity,
        unit: f.unit,
        weightType: f.weightType || 'cooked',
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fats: f.fats,
      })),
    })),
    supplements: existingPlan?.supplements || [],
    cardio: cardioEnabled ? {
      enabled: true,
      type: cardioType,
      durationMinutes: parseInt(cardioDuration) || 30,
      heartRateMin: parseInt(cardioHrMin) || undefined,
      heartRateMax: parseInt(cardioHrMax) || undefined,
      frequencyPerWeek: parseInt(cardioFreq) || 5,
      timing: cardioTiming,
      notes: cardioNotes || undefined,
    } : undefined,
    notes,
    createdAt: existingPlan?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    waterTarget: parseFloat(waterTarget) || undefined,
    sodiumTarget: parseFloat(sodiumTarget) || undefined,
  }), [
    existingPlan, studentId, title, currentWeight, weeklyGoal, metabolicStrategy,
    targetCalories, targetProtein, targetCarbs, targetFats, unitSystem,
    meals, cardioEnabled, cardioType, cardioDuration, cardioHrMin, cardioHrMax,
    cardioFreq, cardioTiming, cardioNotes, notes, waterTarget, sodiumTarget,
  ]);

  // ── Save ──────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!studentId) {
      Alert.alert('Error', 'No se ha seleccionado un alumno.');
      return;
    }
    const plan = buildNutritionPlan();

    try {
      // Save as nutrition plan on the student
      await updateNutritionPlan(studentId, plan);

      // Also save as document for document viewer
      const planPdfHtml = generateHgrandNutritionPdfHtml(
        { ...student!, nutritionPlan: plan },
        plan,
        settings.documents
      );
      await addDocument(studentId, {
        name: title,
        category: 'nutrition',
        htmlContent: planPdfHtml,
        notes: 'Plan nutricional HGRAND',
      });

      // Log diet history
      await addDietHistoryEntry(studentId, {
        studentId,
        date: new Date().toISOString(),
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fats: totals.fats,
        planTitle: title,
        changes: 'Plan actualizado desde el Meal Plan Builder',
        notes: `${meals.length} comidas${cardioEnabled ? ' + cardio' : ''}`,
        createdBy: 'coach',
      });

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Plan guardado',
        `Plan nutricional guardado para ${displayName}. Puedes verlo en su perfil.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      console.log('Error saving meal plan:', err);
      Alert.alert('Error', 'No se pudo guardar el plan.');
    }
  }, [
    studentId, buildNutritionPlan, updateNutritionPlan, addDocument, addDietHistoryEntry,
    title, totals, meals.length, cardioEnabled, displayName, student, settings.documents,
  ]);

  // ── Preview PDF ───────────────────────────────────────────────
  const handlePreview = useCallback(async () => {
    if (!student) return;
    const plan = buildNutritionPlan();
    const html = generateHgrandNutritionPdfHtml(
      { ...student, nutritionPlan: plan },
      plan,
      settings.documents
    );
    setShowPreview(true);
    try {
      const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 });
      if (Platform.OS === 'web') {
        await Print.printAsync({ uri });
      } else {
        await shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Previsualizar PDF' });
      }
    } catch (e) {
      console.log('Preview error:', e);
    } finally {
      setShowPreview(false);
    }
  }, [student, buildNutritionPlan, settings.documents]);

  // ── Progress bars ──
  const calPercent = parseInt(targetCalories) > 0
    ? Math.min(100, Math.round((totals.calories / parseInt(targetCalories)) * 100)) : 0;
  const proPercent = parseInt(targetProtein) > 0
    ? Math.min(100, Math.round((totals.protein / parseInt(targetProtein)) * 100)) : 0;
  const carbPercent = parseInt(targetCarbs) > 0
    ? Math.min(100, Math.round((totals.carbs / parseInt(targetCarbs)) * 100)) : 0;
  const fatPercent = parseInt(targetFats) > 0
    ? Math.min(100, Math.round((totals.fats / parseInt(targetFats)) * 100)) : 0;

  // ====================================================================
  // RENDER
  // ====================================================================
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{
        title: '',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn} activeOpacity={0.7}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handlePreview}
              activeOpacity={0.7}
            >
              <Eye size={18} color={colors.tint} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.tint }]}
              onPress={handleSave}
              activeOpacity={0.7}
            >
              <Save size={16} color="#fff" />
              <Text style={styles.saveBtnText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        ),
      }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── Title & Student ── */}
        <View style={[styles.titleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.titleInput, { color: colors.text }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Nombre del plan"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={[styles.studentLabel, { color: colors.tint }]}>{displayName}</Text>
        </View>

        {/* ── Unit toggle ── */}
        <View style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Unidad de pesaje</Text>
          <TouchableOpacity
            style={[styles.unitToggle, { backgroundColor: colors.secondaryFill }]}
            onPress={() => {
              setUnitSystem(prev => prev === 'metric' ? 'imperial' : 'metric');
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.unitOption, unitSystem === 'metric' && styles.unitActive, { color: unitSystem === 'metric' ? '#fff' : colors.textMuted }]}>
              Gramos
            </Text>
            <Text style={[styles.unitOption, unitSystem === 'imperial' && styles.unitActive, { color: unitSystem === 'imperial' ? '#fff' : colors.textMuted }]}>
              Onzas
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Athlete info ── */}
        <View style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Peso actual</Text>
            <TextInput
              style={[styles.infoInput, { color: colors.text, borderColor: colors.border }]}
              value={currentWeight}
              onChangeText={setCurrentWeight}
              keyboardType="numeric"
              placeholder={student?.weight?.toString() || '0'}
              placeholderTextColor={colors.textQuaternary}
            />
            <Text style={[styles.infoUnit, { color: colors.textMuted }]}>kg</Text>
          </View>
          <View style={[styles.infoRow, { marginTop: 10 }]}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Objetivo semanal</Text>
            <TextInput
              style={[styles.infoInputFull, { color: colors.text, borderColor: colors.border }]}
              value={weeklyGoal}
              onChangeText={setWeeklyGoal}
              placeholder="Ej: -0.5 kg/semana en definición"
              placeholderTextColor={colors.textQuaternary}
            />
          </View>
          <View style={[styles.infoRow, { marginTop: 10 }]}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Estrategia metabólica</Text>
            <TextInput
              style={[styles.infoInputFull, { color: colors.text, borderColor: colors.border }]}
              value={metabolicStrategy}
              onChangeText={setMetabolicStrategy}
              placeholder="Ej: Antiinflamatorio, déficit progresivo"
              placeholderTextColor={colors.textQuaternary}
            />
          </View>
        </View>

        {/* ── Daily objectives ── */}
        <View style={[styles.macroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.macroHeader}>
            <View style={styles.macroHeaderLeft}>
              <Target size={16} color="#1B5E38" />
              <Text style={[styles.macroTitle, { color: colors.text }]}>Objetivo diario</Text>
            </View>
          </View>
          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <Text style={[styles.macroItemLabel, { color: colors.textMuted }]}>Kcal</Text>
              <TextInput
                style={[styles.macroInput, { color: colors.text, borderColor: colors.border }]}
                value={targetCalories}
                onChangeText={setTargetCalories}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroItemLabel, { color: '#1B5E38' }]}>Prot</Text>
              <TextInput
                style={[styles.macroInput, { color: colors.text, borderColor: colors.border }]}
                value={targetProtein}
                onChangeText={setTargetProtein}
                keyboardType="numeric"
              />
              <Text style={[styles.macroItemUnit, { color: colors.textMuted }]}>
                {isImperial ? 'oz' : 'g'}
              </Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroItemLabel, { color: '#B85C00' }]}>Carbs</Text>
              <TextInput
                style={[styles.macroInput, { color: colors.text, borderColor: colors.border }]}
                value={targetCarbs}
                onChangeText={setTargetCarbs}
                keyboardType="numeric"
              />
              <Text style={[styles.macroItemUnit, { color: colors.textMuted }]}>
                {isImperial ? 'oz' : 'g'}
              </Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroItemLabel, { color: '#8B1A1A' }]}>Grasas</Text>
              <TextInput
                style={[styles.macroInput, { color: colors.text, borderColor: colors.border }]}
                value={targetFats}
                onChangeText={setTargetFats}
                keyboardType="numeric"
              />
              <Text style={[styles.macroItemUnit, { color: colors.textMuted }]}>
                {isImperial ? 'oz' : 'g'}
              </Text>
            </View>
          </View>
          <View style={[styles.hydrationMiniRow, { marginTop: 12 }]}>
            <Droplets size={14} color="#14614A" />
            <TextInput
              style={[styles.hydrationInput, { color: colors.text, borderColor: colors.border }]}
              value={waterTarget}
              onChangeText={setWaterTarget}
              keyboardType="numeric"
              placeholder="3"
              placeholderTextColor={colors.textQuaternary}
            />
            <Text style={[styles.hydrationLabel, { color: colors.textMuted }]}>L agua/día</Text>
            <TextInput
              style={[styles.hydrationInput, { color: colors.text, borderColor: colors.border }]}
              value={sodiumTarget}
              onChangeText={setSodiumTarget}
              keyboardType="numeric"
              placeholder="2000"
              placeholderTextColor={colors.textQuaternary}
            />
            <Text style={[styles.hydrationLabel, { color: colors.textMuted }]}>mg sodio</Text>
          </View>
        </View>

        {/* ── Progress bars ── */}
        <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.progressTitle, { color: colors.text }]}>Progreso actual</Text>
          {([
            { label: 'Kcal', pct: calPercent, actual: totals.calories, target: targetCalories, color: colors.tint },
            { label: 'P', pct: proPercent, actual: totals.protein, target: targetProtein, color: '#1B5E38' },
            { label: 'C', pct: carbPercent, actual: totals.carbs, target: targetCarbs, color: '#B85C00' },
            { label: 'G', pct: fatPercent, actual: totals.fats, target: targetFats, color: '#8B1A1A' },
          ]).map((row) => (
            <View key={row.label} style={styles.progressRow}>
              <Text style={[styles.progressLabel, { color: row.color, fontWeight: '700' as const }]}>
                {row.label}
              </Text>
              <View style={[styles.progressBarBg, { backgroundColor: colors.tertiaryFill }]}>
                <View style={[styles.progressBarFill, { width: `${row.pct}%`, backgroundColor: row.pct > 100 ? colors.danger : row.color }]} />
              </View>
              <Text style={[styles.progressValue, { color: row.pct > 105 ? colors.danger : colors.text }]}>
                {row.actual}/{row.target}{row.label !== 'Kcal' ? (isImperial ? 'oz' : 'g') : ''}
              </Text>
            </View>
          ))}
        </View>

        {/* ── MEALS ────────────────────────────────────────────── */}
        {meals.map((meal, mealIdx) => {
          const mt = mealTotals(meal);
          const isExpanded = expandedMeals.has(meal.id);
          return (
            <View key={meal.id} style={[styles.mealCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.mealHeader}
                onPress={() => toggleMeal(meal.id)}
                activeOpacity={0.7}
              >
                <View style={styles.mealHeaderLeft}>
                  <View style={[styles.mealNumber, { backgroundColor: '#1B5E3818' }]}>
                    <Text style={[styles.mealNumberText, { color: '#1B5E38' }]}>{mealIdx + 1}</Text>
                  </View>
                  <View>
                    <TextInput
                      style={[styles.mealNameInput, { color: colors.text }]}
                      value={meal.name}
                      onChangeText={(v) => updateMealName(meal.id, v)}
                      placeholder="Nombre de la comida"
                      placeholderTextColor={colors.textMuted}
                    />
                    <View style={styles.mealMetaRow}>
                      <Clock size={10} color={colors.textMuted} />
                      <TextInput
                        style={[styles.mealTimeInput, { color: colors.textMuted }]}
                        value={meal.time}
                        onChangeText={(v) => updateMealTime(meal.id, v)}
                        placeholder="00:00"
                        placeholderTextColor={colors.textQuaternary}
                      />
                      <Text style={[styles.mealMacrosSummary, { color: colors.textMuted }]}>
                        {mt.calories} kcal
                      </Text>
                      {meal.objective && (
                        <View style={[styles.objectiveChip, { backgroundColor: '#1B5E3812' }]}>
                          <Text style={[styles.objectiveChipText, { color: '#1B5E38' }]} numberOfLines={1}>
                            {MEAL_OBJECTIVE_LABELS[meal.objective]}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                <View style={styles.mealActions}>
                  <TouchableOpacity onPress={() => duplicateMeal(meal.id)} activeOpacity={0.6} style={styles.mealActionBtn}>
                    <Copy size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeMeal(meal.id)} activeOpacity={0.6} style={styles.mealActionBtn}>
                    <Trash2 size={14} color={colors.danger} />
                  </TouchableOpacity>
                  {isExpanded ? <ChevronUp size={16} color={colors.textMuted} /> : <ChevronDown size={16} color={colors.textMuted} />}
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.mealBody}>
                  {/* ── Meal objective selector ── */}
                  <TouchableOpacity
                    style={[styles.objectiveBtn, { borderColor: colors.border }]}
                    onPress={() => { setObjectiveMealId(meal.id); setShowObjectivePicker(true); }}
                    activeOpacity={0.7}
                  >
                    <Heart size={14} color={meal.objective ? '#1B5E38' : colors.textMuted} />
                    <Text style={[styles.objectiveBtnText, { color: meal.objective ? '#1B5E38' : colors.textMuted }]}>
                      {meal.objective ? MEAL_OBJECTIVE_LABELS[meal.objective] : 'Objetivo metabólico'}
                    </Text>
                    {meal.objective && (
                      <TouchableOpacity onPress={() => setMealObjective(meal.id, undefined)}>
                        <X size={14} color={colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                  {meal.objective && (
                    <TextInput
                      style={[styles.objectiveTextInput, { color: colors.textMuted, borderColor: colors.border }]}
                      value={meal.objectiveText || ''}
                      onChangeText={(v) => updateMealObjectiveText(meal.id, v)}
                      placeholder="Descripción personalizada del objetivo..."
                      placeholderTextColor={colors.textQuaternary}
                    />
                  )}

                  {/* ── Foods ── */}
                  {meal.foods.map((food, foodIdx) => {
                    const displayQty = isImperial ? gramsToOz(food.quantity) : food.quantity;
                    const displayUnit = isImperial ? 'oz' : 'g';
                    return (
                      <View key={`${meal.id}-${foodIdx}`} style={[styles.foodRow, { borderBottomColor: colors.separator }]}>
                        <GripVertical size={14} color={colors.textQuaternary} />
                        <View style={styles.foodInfo}>
                          <TextInput
                            style={[styles.foodName, { color: colors.text }]}
                            value={food.name}
                            onChangeText={(v) => updateFoodName(meal.id, foodIdx, v)}
                            placeholder="Alimento"
                            placeholderTextColor={colors.textMuted}
                            selectTextOnFocus
                          />
                          <View style={styles.foodMacros}>
                            <Text style={[styles.foodMacro, { color: colors.textMuted }]}>{food.calories}kcal</Text>
                            <Text style={[styles.foodMacro, { color: '#1B5E38' }]}>P:{food.protein}</Text>
                            <Text style={[styles.foodMacro, { color: '#B85C00' }]}>C:{food.carbs}</Text>
                            <Text style={[styles.foodMacro, { color: '#8B1A1A' }]}>G:{food.fats}</Text>
                          </View>
                          <TouchableOpacity onPress={() => toggleFoodWeightType(meal.id, foodIdx)} activeOpacity={0.6}>
                            <Text style={[styles.weightTypeLabel, { color: food.weightType === 'dry' ? '#B85C00' : '#1B5E38' }]}>
                              {food.weightType === 'dry' ? 'PESADO EN SECO' : 'pesado cocido'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.foodQtyWrap}>
                          <TextInput
                            style={[styles.foodQtyInput, { color: colors.text, borderColor: colors.border }]}
                            value={displayQty.toString()}
                            onChangeText={(v) => updateFoodQuantity(meal.id, foodIdx, v)}
                            keyboardType="numeric"
                          />
                          <Text style={[styles.foodUnit, { color: colors.textMuted }]}>{displayUnit}</Text>
                        </View>
                        <TouchableOpacity onPress={() => removeFoodFromMeal(meal.id, foodIdx)} activeOpacity={0.6}>
                          <X size={16} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}

                  {meal.foods.length === 0 && (
                    <View style={styles.emptyFoods}>
                      <ChefHat size={24} color={colors.textQuaternary} />
                      <Text style={[styles.emptyFoodsText, { color: colors.textMuted }]}>Sin alimentos aún</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.addFoodBtn, { borderColor: '#1B5E3840' }]}
                    onPress={() => { setActiveMealId(meal.id); setShowFoodPicker(true); resetCustomFood(); }}
                    activeOpacity={0.7}
                  >
                    <Plus size={16} color="#1B5E38" />
                    <Text style={[styles.addFoodText, { color: '#1B5E38' }]}>Añadir alimento</Text>
                  </TouchableOpacity>

                  <View style={styles.mealTotalsRow}>
                    <Text style={[styles.mealTotalLabel, { color: colors.textMuted }]}>Total comida:</Text>
                    <Text style={[styles.mealTotalValue, { color: colors.text }]}>{mt.calories} kcal</Text>
                    <Text style={[styles.mealTotalMacro, { color: '#1B5E38' }]}>P:{mt.protein}</Text>
                    <Text style={[styles.mealTotalMacro, { color: '#B85C00' }]}>C:{mt.carbs}</Text>
                    <Text style={[styles.mealTotalMacro, { color: '#8B1A1A' }]}>G:{mt.fats}</Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}

        <TouchableOpacity
          style={[styles.addMealBtn, { backgroundColor: '#1B5E3812', borderColor: '#1B5E3830' }]}
          onPress={addMeal}
          activeOpacity={0.7}
        >
          <Plus size={18} color="#1B5E38" />
          <Text style={[styles.addMealText, { color: '#1B5E38' }]}>Añadir comida</Text>
          <Text style={[styles.mealCountHint, { color: colors.textQuaternary }]}>
            {meals.length} de 7
          </Text>
        </TouchableOpacity>

        {/* ── CARDIO ── */}
        <View style={[styles.cardioCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardioHeader}>
            <View style={styles.cardioHeaderLeft}>
              <Dumbbell size={16} color="#4A4A4E" />
              <Text style={[styles.cardioTitle, { color: colors.text }]}>Cardio</Text>
            </View>
            <Switch
              value={cardioEnabled}
              onValueChange={(v) => {
                setCardioEnabled(v);
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              trackColor={{ false: colors.tertiaryFill, true: '#4A4A4E60' }}
              thumbColor={cardioEnabled ? '#4A4A4E' : '#f4f3f4'}
            />
          </View>
          {cardioEnabled && (
            <View style={styles.cardioBody}>
              <View style={styles.cardioRow}>
                <Text style={[styles.cardioLabel, { color: colors.textMuted }]}>Tipo</Text>
                <TextInput
                  style={[styles.cardioInput, { color: colors.text, borderColor: colors.border }]}
                  value={cardioType}
                  onChangeText={setCardioType}
                  placeholder="Ej: Caminata inclinada"
                  placeholderTextColor={colors.textQuaternary}
                />
              </View>
              <View style={styles.cardioRow}>
                <Text style={[styles.cardioLabel, { color: colors.textMuted }]}>Duración</Text>
                <TextInput
                  style={[styles.cardioInputSm, { color: colors.text, borderColor: colors.border }]}
                  value={cardioDuration}
                  onChangeText={setCardioDuration}
                  keyboardType="numeric"
                />
                <Text style={[styles.cardioUnit, { color: colors.textMuted }]}>min</Text>
              </View>
              <View style={styles.cardioRow}>
                <Text style={[styles.cardioLabel, { color: colors.textMuted }]}>Frec. cardíaca</Text>
                <TextInput
                  style={[styles.cardioInputSm, { color: colors.text, borderColor: colors.border }]}
                  value={cardioHrMin}
                  onChangeText={setCardioHrMin}
                  keyboardType="numeric"
                />
                <Text style={[styles.cardioDash, { color: colors.textMuted }]}>—</Text>
                <TextInput
                  style={[styles.cardioInputSm, { color: colors.text, borderColor: colors.border }]}
                  value={cardioHrMax}
                  onChangeText={setCardioHrMax}
                  keyboardType="numeric"
                />
                <Text style={[styles.cardioUnit, { color: colors.textMuted }]}>bpm</Text>
              </View>
              <View style={styles.cardioRow}>
                <Text style={[styles.cardioLabel, { color: colors.textMuted }]}>Frecuencia</Text>
                <TextInput
                  style={[styles.cardioInputSm, { color: colors.text, borderColor: colors.border }]}
                  value={cardioFreq}
                  onChangeText={setCardioFreq}
                  keyboardType="numeric"
                />
                <Text style={[styles.cardioUnit, { color: colors.textMuted }]}>x semana</Text>
              </View>
              <View style={styles.cardioRow}>
                <Text style={[styles.cardioLabel, { color: colors.textMuted }]}>Timing</Text>
                <View style={styles.timingRow}>
                  {(['post_entreno', 'ayunas', 'any'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.timingChip, { borderColor: colors.border }, cardioTiming === t && { backgroundColor: '#4A4A4E', borderColor: '#4A4A4E' }]}
                      onPress={() => setCardioTiming(t)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.timingChipText, { color: cardioTiming === t ? '#fff' : colors.textMuted }]}>
                        {t === 'post_entreno' ? 'Post entreno' : t === 'ayunas' ? 'Ayunas' : 'Cualquiera'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <TextInput
                style={[styles.cardioNotes, { color: colors.text, borderColor: colors.border }]}
                value={cardioNotes}
                onChangeText={setCardioNotes}
                placeholder="Notas adicionales de cardio..."
                placeholderTextColor={colors.textQuaternary}
                multiline
              />
            </View>
          )}
        </View>

        {/* ── Notes ── */}
        <View style={[styles.notesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.notesTitle, { color: colors.text }]}>Indicaciones adicionales</Text>
          <TextInput
            style={[styles.notesInput, { color: colors.text, borderColor: colors.border }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Notas, indicaciones de monitoreo, suplementación..."
            placeholderTextColor={colors.textQuaternary}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Food Picker Modal ── */}
      <Modal
        visible={showFoodPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFoodPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Añadir alimento</Text>
              <TouchableOpacity onPress={() => setShowFoodPicker(false)} activeOpacity={0.7}>
                <X size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {(
              <ScrollView style={styles.customFormWrap} showsVerticalScrollIndicator={false}>
                <View style={styles.customFormField}>
                  <Text style={[styles.customFieldLabel, { color: colors.textMuted }]}>Nombre del alimento</Text>
                  <TextInput
                    style={[styles.customInputFull, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                    value={customFood.name}
                    onChangeText={(v) => setCustomFood(p => ({ ...p, name: v }))}
                    placeholder="Ej: Pollo hervido con especias"
                    placeholderTextColor={colors.textQuaternary}
                  />
                </View>

                <View style={styles.customFormRow}>
                  <View style={styles.customFormFieldFlex}>
                    <Text style={[styles.customFieldLabel, { color: colors.textMuted }]}>Cantidad</Text>
                    <TextInput
                      style={[styles.customInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                      value={customFood.quantity}
                      onChangeText={(v) => setCustomFood(p => ({ ...p, quantity: v }))}
                      placeholder="220"
                      placeholderTextColor={colors.textQuaternary}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.customFormFieldFlex}>
                    <Text style={[styles.customFieldLabel, { color: colors.textMuted }]}>Unidad</Text>
                    <View style={[styles.unitPicker, { borderColor: colors.border, backgroundColor: colors.background }]}>
                      {['g', 'oz', 'ml', 'uds'].map((u) => (
                        <TouchableOpacity
                          key={u}
                          style={[
                            styles.unitPickerOpt,
                            customFood.unit === u && { backgroundColor: '#1B5E38' },
                          ]}
                          onPress={() => setCustomFood(p => ({ ...p, unit: u }))}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.unitPickerText,
                            { color: customFood.unit === u ? '#fff' : colors.textMuted },
                          ]}>{u}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={styles.customFormField}>
                  <Text style={[styles.customFieldLabel, { color: colors.textMuted }]}>Tipo de pesaje</Text>
                  <View style={[styles.weightTypeRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
                    <TouchableOpacity
                      style={[
                        styles.weightTypeBtn,
                        customFood.weightType === 'cooked' && { backgroundColor: '#1B5E38' },
                      ]}
                      onPress={() => setCustomFood(p => ({ ...p, weightType: 'cooked' }))}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.weightTypeText,
                        { color: customFood.weightType === 'cooked' ? '#fff' : colors.textMuted },
                      ]}>Pesado cocido</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.weightTypeBtn,
                        customFood.weightType === 'dry' && { backgroundColor: '#B85C00' },
                      ]}
                      onPress={() => setCustomFood(p => ({ ...p, weightType: 'dry' }))}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.weightTypeText,
                        { color: customFood.weightType === 'dry' ? '#fff' : colors.textMuted },
                      ]}>Pesado en seco</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.customFormRow}>
                  <View style={styles.customFormFieldFlex}>
                    <Text style={[styles.customFieldLabel, { color: colors.textMuted }]}>Calorías</Text>
                    <TextInput
                      style={[styles.customInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                      value={customFood.calories}
                      onChangeText={(v) => setCustomFood(p => ({ ...p, calories: v }))}
                      placeholder="248"
                      placeholderTextColor={colors.textQuaternary}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.customFormFieldFlex}>
                    <Text style={[styles.customFieldLabel, { color: '#1B5E38' }]}>Proteína (g)</Text>
                    <TextInput
                      style={[styles.customInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                      value={customFood.protein}
                      onChangeText={(v) => setCustomFood(p => ({ ...p, protein: v }))}
                      placeholder="46.5"
                      placeholderTextColor={colors.textQuaternary}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={styles.customFormRow}>
                  <View style={styles.customFormFieldFlex}>
                    <Text style={[styles.customFieldLabel, { color: '#B85C00' }]}>Carbs (g)</Text>
                    <TextInput
                      style={[styles.customInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                      value={customFood.carbs}
                      onChangeText={(v) => setCustomFood(p => ({ ...p, carbs: v }))}
                      placeholder="28.2"
                      placeholderTextColor={colors.textQuaternary}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.customFormFieldFlex}>
                    <Text style={[styles.customFieldLabel, { color: '#8B1A1A' }]}>Grasas (g)</Text>
                    <TextInput
                      style={[styles.customInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                      value={customFood.fats}
                      onChangeText={(v) => setCustomFood(p => ({ ...p, fats: v }))}
                      placeholder="5.4"
                      placeholderTextColor={colors.textQuaternary}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.customFormField}>
                  <Text style={[styles.customFieldLabel, { color: colors.textMuted }]}>Notas (opcional)</Text>
                  <TextInput
                    style={[styles.customNotesInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                    value={customFood.notes}
                    onChangeText={(v) => setCustomFood(p => ({ ...p, notes: v }))}
                    placeholder="Ej: Hervido sin sal, con orégano..."
                    placeholderTextColor={colors.textQuaternary}
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <TouchableOpacity
                  style={styles.customAddBtn}
                  onPress={addCustomFoodToMeal}
                  activeOpacity={0.7}
                >
                  <Check size={16} color="#fff" />
                  <Text style={styles.customAddBtnText}>Añadir alimento personalizado</Text>
                </TouchableOpacity>

                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Objective Picker Modal ── */}
      <Modal
        visible={showObjectivePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowObjectivePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Objetivo metabólico</Text>
              <TouchableOpacity onPress={() => setShowObjectivePicker(false)} activeOpacity={0.7}>
                <X size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {MEAL_OBJECTIVES.map((obj) => (
                <TouchableOpacity
                  key={obj}
                  style={[styles.modalRow, { borderBottomColor: colors.separator }]}
                  onPress={() => {
                    if (objectiveMealId) setMealObjective(objectiveMealId, obj);
                    setShowObjectivePicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.modalRowIcon, { backgroundColor: '#1B5E3812' }]}>
                    <Heart size={14} color="#1B5E38" />
                  </View>
                  <Text style={[styles.modalRowName, { color: colors.text }]}>
                    {MEAL_OBJECTIVE_LABELS[obj]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBackBtn: { padding: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' as const },
  scrollContent: { padding: 16, gap: 10 },

  // ── Title ──
  titleCard: { borderRadius: 14, padding: 16, borderWidth: 1 },
  titleInput: { fontSize: 18, fontWeight: '700' as const, marginBottom: 4 },
  studentLabel: { fontSize: 14, fontWeight: '600' as const },

  // ── Unit toggle ──
  rowCard: { borderRadius: 14, padding: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { fontSize: 15, fontWeight: '600' as const },
  unitToggle: { flexDirection: 'row', borderRadius: 8, padding: 2 },
  unitOption: {
    fontSize: 13,
    fontWeight: '600' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    overflow: 'hidden',
  },
  unitActive: { backgroundColor: '#1B5E38' },

  // ── Info ──
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { fontSize: 13, fontWeight: '500' as const, width: 120 },
  infoInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'center',
    width: 80,
  },
  infoInputFull: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: '500' as const,
    flex: 1,
  },
  infoUnit: { fontSize: 12, fontWeight: '500' as const },

  // ── Macros ──
  macroCard: { borderRadius: 14, padding: 16, borderWidth: 1 },
  macroHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  macroHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  macroTitle: { fontSize: 15, fontWeight: '600' as const },
  macroRow: { flexDirection: 'row', gap: 6 },
  macroItem: { flex: 1 },
  macroItemLabel: { fontSize: 11, fontWeight: '700' as const, marginBottom: 4, textAlign: 'center' },
  macroInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  macroItemUnit: { fontSize: 10, fontWeight: '500' as const, textAlign: 'center', marginTop: 2 },
  hydrationMiniRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hydrationInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    fontWeight: '600' as const,
    width: 56,
    textAlign: 'center',
  },
  hydrationLabel: { fontSize: 12, fontWeight: '500' as const },

  // ── Progress ──
  progressCard: { borderRadius: 14, padding: 14, borderWidth: 1 },
  progressTitle: { fontSize: 14, fontWeight: '600' as const, marginBottom: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  progressLabel: { fontSize: 12, width: 24, textAlign: 'center' },
  progressBarBg: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressValue: { fontSize: 11, fontWeight: '600' as const, width: 76, textAlign: 'right' },

  // ── Meals ──
  mealCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  mealHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  mealNumber: {
    width: 30, height: 30, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  mealNumberText: { fontSize: 14, fontWeight: '700' as const },
  mealNameInput: { fontSize: 15, fontWeight: '600' as const, padding: 0, minWidth: 100 },
  mealMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, flexWrap: 'wrap' },
  mealTimeInput: { fontSize: 12, padding: 0, minWidth: 36 },
  mealMacrosSummary: { fontSize: 12, marginLeft: 6 },
  objectiveChip: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    marginLeft: 6, maxWidth: 120,
  },
  objectiveChipText: { fontSize: 10, fontWeight: '600' as const },
  mealActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mealActionBtn: { padding: 2 },
  mealBody: { paddingHorizontal: 14, paddingBottom: 14 },

  // ── Objective button ──
  objectiveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1, borderStyle: 'dashed',
    marginBottom: 10,
  },
  objectiveBtnText: { fontSize: 13, fontWeight: '500' as const, flex: 1 },
  objectiveTextInput: {
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
    fontSize: 12, marginBottom: 10,
  },

  // ── Food rows ──
  foodRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  foodInfo: { flex: 1 },
  foodName: { fontSize: 14, fontWeight: '500' as const },
  foodMacros: { flexDirection: 'row', gap: 8, marginTop: 2 },
  foodMacro: { fontSize: 11, fontWeight: '500' as const },
  weightTypeLabel: { fontSize: 10, fontWeight: '700' as const, marginTop: 2 },
  foodQtyWrap: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  foodQtyInput: {
    borderWidth: 1, borderRadius: 6, width: 52,
    paddingHorizontal: 6, paddingVertical: 4,
    fontSize: 13, fontWeight: '600' as const, textAlign: 'center',
  },
  foodUnit: { fontSize: 11 },

  emptyFoods: { alignItems: 'center', paddingVertical: 16, gap: 6 },
  emptyFoodsText: { fontSize: 13 },

  addFoodBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderStyle: 'dashed', marginTop: 8,
  },
  addFoodText: { fontSize: 13, fontWeight: '600' as const },
  mealTotalsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 10, paddingTop: 8,
  },
  mealTotalLabel: { fontSize: 12, fontWeight: '600' as const },
  mealTotalValue: { fontSize: 13, fontWeight: '700' as const },
  mealTotalMacro: { fontSize: 11, fontWeight: '600' as const },

  // ── Add meal ──
  addMealBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1, borderStyle: 'dashed',
  },
  addMealText: { fontSize: 15, fontWeight: '600' as const },
  mealCountHint: { fontSize: 12, fontWeight: '500' as const },

  // ── Cardio ──
  cardioCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  cardioHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14,
  },
  cardioHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardioTitle: { fontSize: 15, fontWeight: '600' as const },
  cardioBody: { paddingHorizontal: 14, paddingBottom: 14, gap: 10 },
  cardioRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardioLabel: { fontSize: 13, fontWeight: '500' as const, width: 100 },
  cardioInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, fontWeight: '500' as const, flex: 1 },
  cardioInputSm: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, fontWeight: '500' as const, width: 64, textAlign: 'center' },
  cardioUnit: { fontSize: 12, fontWeight: '500' as const },
  cardioDash: { fontSize: 14, fontWeight: '600' as const },
  timingRow: { flexDirection: 'row', gap: 6, flex: 1 },
  timingChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  timingChipText: { fontSize: 12, fontWeight: '600' as const },
  cardioNotes: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, minHeight: 50 },

  // ── Notes ──
  notesCard: { borderRadius: 14, padding: 14, borderWidth: 1 },
  notesTitle: { fontSize: 15, fontWeight: '600' as const, marginBottom: 8 },
  notesInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, minHeight: 80 },

  // ── Modals ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 17, fontWeight: '600' as const },
  modalList: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20, maxHeight: 400 },
  modalRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalRowIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  modalRowInfo: { flex: 1 },
  modalRowName: { fontSize: 14, fontWeight: '600' as const },

  // ── Custom food form ──
  customFormWrap: { paddingHorizontal: 16, paddingTop: 12 },
  customFormField: { marginBottom: 14 },
  customFormRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  customFormFieldFlex: { flex: 1 },
  customFieldLabel: { fontSize: 12, fontWeight: '700' as const, marginBottom: 6, letterSpacing: 0.3 },
  customInputFull: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '500' as const,
  },
  customInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  unitPicker: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    gap: 2,
  },
  unitPickerOpt: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 7,
    alignItems: 'center',
  },
  unitPickerText: { fontSize: 12, fontWeight: '700' as const },
  weightTypeRow: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    gap: 2,
  },
  weightTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 7,
    alignItems: 'center',
  },
  weightTypeText: { fontSize: 12, fontWeight: '700' as const },
  customNotesInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 60,
  },
  customAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1B5E38',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 6,
  },
  customAddBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' as const },
});
