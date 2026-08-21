import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import {
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  UtensilsCrossed,
  Pill,
  Droplets,
  X,
  Copy,
  Target,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useStudents } from '@/contexts/StudentsContext';
import { NutritionPlan, NutritionDay, Meal, FoodItem, Supplement } from '@/types';
import { parseNum } from '@/utils/calculations';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function createEmptyDay(dayNumber: number): NutritionDay {
  return {
    id: generateId(),
    dayNumber,
    title: `Día ${dayNumber}`,
    subtitle: '',
    objectives: { calories: 0, protein: 0, carbs: 0, fats: 0 },
    hydration: { waterLiters: '', salt: '', notes: '' },
    meals: [],
  };
}

function createEmptyMeal(): Meal {
  return {
    id: generateId(),
    name: '',
    time: '',
    foods: [],
  };
}

function createEmptyFood(): FoodItem {
  return { name: '', quantity: 0, unit: 'g', weightType: 'cooked', calories: 0, protein: 0, carbs: 0, fats: 0 };
}

export default function NutritionPlanEditor() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const { getStudent, updateStudent } = useStudents();
  const { colors } = useTheme();
  const student = getStudent(studentId ?? '');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [planTitle, setPlanTitle] = useState<string>('PLANIFICACIÓN NUTRICIONAL');
  const [days, setDays] = useState<NutritionDay[]>([createEmptyDay(1)]);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [activeDayIndex, setActiveDayIndex] = useState<number>(0);
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  useEffect(() => {
    if (student?.nutritionPlan) {
      const plan = student.nutritionPlan;
      setPlanTitle(plan.title || 'PLANIFICACIÓN NUTRICIONAL');
      setNotes(plan.notes);
      setSupplements(plan.supplements.map(s => ({ ...s })));

      if (plan.days && plan.days.length > 0) {
        setDays(plan.days.map(d => ({
          ...d,
          objectives: { ...d.objectives },
          hydration: { ...d.hydration },
          meals: d.meals.map(m => ({ ...m, foods: m.foods.map(f => ({ ...f })) })),
        })));
      } else if (plan.meals.length > 0 || plan.calories > 0) {
        const legacyDay: NutritionDay = {
          id: generateId(),
          dayNumber: 1,
          title: 'Día 1',
          subtitle: '',
          objectives: {
            calories: plan.calories,
            protein: plan.protein,
            carbs: plan.carbs,
            fats: plan.fats,
          },
          hydration: {
            waterLiters: plan.waterTarget ? `${plan.waterTarget}` : '',
            salt: plan.sodiumTarget ? `${plan.sodiumTarget}mg` : '',
          },
          meals: plan.meals.map(m => ({ ...m, foods: m.foods.map(f => ({ ...f })) })),
        };
        setDays([legacyDay]);
      }
    }
  }, [student?.nutritionPlan]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const markChanged = useCallback(() => setHasChanges(true), []);

  const activeDay = days[activeDayIndex] || days[0];

  const addDay = useCallback(() => {
    const newDay = createEmptyDay(days.length + 1);
    setDays(prev => [...prev, newDay]);
    setActiveDayIndex(days.length);
    markChanged();
  }, [days.length, markChanged]);

  const removeDay = useCallback((index: number) => {
    if (days.length <= 1) {
      Alert.alert('Mínimo', 'Debe haber al menos un día en el plan.');
      return;
    }
    Alert.alert('Eliminar día', `¿Eliminar "${days[index].title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: () => {
          setDays(prev => {
            const updated = prev.filter((_, i) => i !== index);
            return updated.map((d, i) => ({ ...d, dayNumber: i + 1 }));
          });
          setActiveDayIndex(prev => Math.max(0, prev >= index ? prev - 1 : prev));
          markChanged();
        },
      },
    ]);
  }, [days, markChanged]);

  const duplicateDay = useCallback((index: number) => {
    const source = days[index];
    const newDay: NutritionDay = {
      ...source,
      id: generateId(),
      dayNumber: days.length + 1,
      title: `Día ${days.length + 1}`,
      subtitle: source.subtitle ? `${source.subtitle} (copia)` : '',
      objectives: { ...source.objectives },
      hydration: { ...source.hydration },
      meals: source.meals.map(m => ({
        ...m,
        id: generateId(),
        foods: m.foods.map(f => ({ ...f })),
      })),
    };
    setDays(prev => [...prev, newDay]);
    setActiveDayIndex(days.length);
    markChanged();
  }, [days, markChanged]);

  const updateDayField = useCallback(<K extends keyof NutritionDay>(field: K, value: NutritionDay[K]) => {
    setDays(prev => prev.map((d, i) => i === activeDayIndex ? { ...d, [field]: value } : d));
    markChanged();
  }, [activeDayIndex, markChanged]);

  const updateObjective = useCallback((field: keyof NutritionDay['objectives'], value: string) => {
    setDays(prev => prev.map((d, i) => {
      if (i !== activeDayIndex) return d;
      return { ...d, objectives: { ...d.objectives, [field]: parseNum(value) || 0 } };
    }));
    markChanged();
  }, [activeDayIndex, markChanged]);

  const updateHydration = useCallback((field: keyof NutritionDay['hydration'], value: string) => {
    setDays(prev => prev.map((d, i) => {
      if (i !== activeDayIndex) return d;
      return { ...d, hydration: { ...d.hydration, [field]: value } };
    }));
    markChanged();
  }, [activeDayIndex, markChanged]);

  const addMeal = useCallback(() => {
    const newMeal = createEmptyMeal();
    setDays(prev => prev.map((d, i) => {
      if (i !== activeDayIndex) return d;
      return { ...d, meals: [...d.meals, newMeal] };
    }));
    setExpandedMeals(prev => ({ ...prev, [newMeal.id]: true }));
    markChanged();
  }, [activeDayIndex, markChanged]);

  const removeMeal = useCallback((mealId: string) => {
    setDays(prev => prev.map((d, i) => {
      if (i !== activeDayIndex) return d;
      return { ...d, meals: d.meals.filter(m => m.id !== mealId) };
    }));
    markChanged();
  }, [activeDayIndex, markChanged]);

  const updateMealField = useCallback((mealId: string, field: keyof Pick<Meal, 'name' | 'time'>, value: string) => {
    setDays(prev => prev.map((d, i) => {
      if (i !== activeDayIndex) return d;
      return { ...d, meals: d.meals.map(m => m.id === mealId ? { ...m, [field]: value } : m) };
    }));
    markChanged();
  }, [activeDayIndex, markChanged]);

  const addFoodToMeal = useCallback((mealId: string) => {
    setDays(prev => prev.map((d, i) => {
      if (i !== activeDayIndex) return d;
      return {
        ...d,
        meals: d.meals.map(m => m.id === mealId ? { ...m, foods: [...m.foods, createEmptyFood()] } : m),
      };
    }));
    markChanged();
  }, [activeDayIndex, markChanged]);

  const removeFoodFromMeal = useCallback((mealId: string, foodIndex: number) => {
    setDays(prev => prev.map((d, i) => {
      if (i !== activeDayIndex) return d;
      return {
        ...d,
        meals: d.meals.map(m => {
          if (m.id !== mealId) return m;
          return { ...m, foods: m.foods.filter((_, fi) => fi !== foodIndex) };
        }),
      };
    }));
    markChanged();
  }, [activeDayIndex, markChanged]);

  const updateFoodField = useCallback((mealId: string, foodIndex: number, field: keyof FoodItem, value: string) => {
    setDays(prev => prev.map((d, i) => {
      if (i !== activeDayIndex) return d;
      return {
        ...d,
        meals: d.meals.map(m => {
          if (m.id !== mealId) return m;
          const updatedFoods = m.foods.map((f, fi) => {
            if (fi !== foodIndex) return f;
            if (field === 'name' || field === 'unit') return { ...f, [field]: value };
            return { ...f, [field]: parseNum(value) || 0 };
          });
          return { ...m, foods: updatedFoods };
        }),
      };
    }));
    markChanged();
  }, [activeDayIndex, markChanged]);

  const toggleMealExpand = useCallback((mealId: string) => {
    setExpandedMeals(prev => ({ ...prev, [mealId]: !prev[mealId] }));
  }, []);

  const addSupplement = useCallback(() => {
    setSupplements(prev => [...prev, { name: '', dosage: '', timing: '', notes: '' }]);
    markChanged();
  }, [markChanged]);

  const removeSupplement = useCallback((index: number) => {
    setSupplements(prev => prev.filter((_, i) => i !== index));
    markChanged();
  }, [markChanged]);

  const updateSupplementField = useCallback((index: number, field: keyof Supplement, value: string) => {
    setSupplements(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
    markChanged();
  }, [markChanged]);

  const computeTotals = useCallback(() => {
    let totalCal = 0, totalProt = 0, totalCarbs = 0, totalFats = 0;
    for (const day of days) {
      totalCal += day.objectives.calories || 0;
      totalProt += day.objectives.protein || 0;
      totalCarbs += day.objectives.carbs || 0;
      totalFats += day.objectives.fats || 0;
    }
    return {
      calories: days.length > 0 ? Math.round(totalCal / days.length) : 0,
      protein: days.length > 0 ? Math.round(totalProt / days.length) : 0,
      carbs: days.length > 0 ? Math.round(totalCarbs / days.length) : 0,
      fats: days.length > 0 ? Math.round(totalFats / days.length) : 0,
    };
  }, [days]);

  const handleSave = async () => {
    if (!studentId) return;

    const validDays = days.map(d => ({
      ...d,
      meals: d.meals.filter(m => m.name.trim() !== ''),
    }));

    const totals = computeTotals();
    const allMeals = validDays.flatMap(d => d.meals);
    const validSupplements = supplements.filter(s => s.name.trim() !== '');

    const plan: NutritionPlan = {
      id: student?.nutritionPlan?.id || generateId(),
      studentId,
      title: planTitle.trim(),
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fats: totals.fats,
      unitSystem: 'metric',
      meals: allMeals,
      supplements: validSupplements,
      notes: notes.trim(),
      createdAt: student?.nutritionPlan?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
      days: validDays,
    };

    await updateStudent(studentId, { nutritionPlan: plan });
    setHasChanges(false);
    Alert.alert('Guardado', 'Plan nutricional actualizado correctamente', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert('Cambios sin guardar', '¿Deseas salir sin guardar los cambios?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  if (!student) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Plan Nutricional' }} />
        <Text style={[styles.errorText, { color: colors.textMuted }]}>Alumno no encontrado</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: `Plan · ${student.name}`,
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
              <Text style={[styles.headerBtnText, { color: colors.tint }]}>Volver</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} style={styles.saveHeaderBtn}>
              <Save size={16} color={colors.tint} />
              <Text style={[styles.saveHeaderText, { color: colors.tint }]}>Guardar</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
      >
        <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            <View style={styles.planTitleSection}>
              <TextInput
                style={styles.planTitleInput}
                value={planTitle}
                onChangeText={(v) => { setPlanTitle(v); markChanged(); }}
                placeholder="Título del plan (ej: Peak Week)"
                placeholderTextColor={Colors.light.textMuted}
              />
              <Text style={styles.planSubtitle}>
                {student.name} · {student.weight} kg · {days.length} {days.length === 1 ? 'día' : 'días'}
              </Text>
            </View>

            <View style={styles.dayTabsContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dayTabsScroll}
              >
                {days.map((day, index) => (
                  <TouchableOpacity
                    key={day.id}
                    style={[styles.dayTab, index === activeDayIndex && styles.dayTabActive]}
                    onPress={() => setActiveDayIndex(index)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dayTabNumber, index === activeDayIndex && styles.dayTabNumberActive]}>
                      {day.dayNumber}
                    </Text>
                    <Text style={[styles.dayTabLabel, index === activeDayIndex && styles.dayTabLabelActive]} numberOfLines={1}>
                      {day.subtitle || day.title}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.addDayTab} onPress={addDay} activeOpacity={0.7}>
                  <Plus size={16} color={Colors.light.tint} />
                </TouchableOpacity>
              </ScrollView>
            </View>

            <View style={styles.dayHeaderSection}>
              <View style={styles.dayTitleRow}>
                <View style={styles.dayTitleInputs}>
                  <TextInput
                    style={styles.dayTitleInput}
                    value={activeDay.title}
                    onChangeText={(v) => updateDayField('title', v)}
                    placeholder="Día 1"
                    placeholderTextColor={Colors.light.textMuted}
                  />
                  <TextInput
                    style={styles.daySubtitleInput}
                    value={activeDay.subtitle}
                    onChangeText={(v) => updateDayField('subtitle', v)}
                    placeholder="Ej: Mini Carga Controlada"
                    placeholderTextColor={Colors.light.textMuted}
                  />
                </View>
                <View style={styles.dayActions}>
                  <TouchableOpacity
                    style={styles.dayActionBtn}
                    onPress={() => duplicateDay(activeDayIndex)}
                    activeOpacity={0.7}
                  >
                    <Copy size={14} color={Colors.light.cyan} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dayActionBtn}
                    onPress={() => removeDay(activeDayIndex)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={14} color={Colors.light.red} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: 'rgba(255, 159, 10, 0.12)' }]}>
                  <Target size={16} color={Colors.light.orange} />
                </View>
                <Text style={styles.sectionTitle}>Objetivo Nutricional</Text>
              </View>

              <View style={styles.objectivesGrid}>
                <View style={[styles.objectiveCard, styles.objectiveCardCalories]}>
                  <Text style={styles.objectiveLabel}>CALORÍAS</Text>
                  <TextInput
                    style={[styles.objectiveValue, { color: Colors.light.green }]}
                    value={activeDay.objectives.calories ? activeDay.objectives.calories.toString() : ''}
                    onChangeText={(v) => updateObjective('calories', v)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={Colors.light.textMuted}
                  />
                  <Text style={styles.objectiveUnit}>kcal</Text>
                </View>
                <View style={styles.objectiveCard}>
                  <Text style={styles.objectiveLabel}>CARBOHIDRATOS</Text>
                  <View style={styles.objectiveRangeRow}>
                    <TextInput
                      style={styles.objectiveValue}
                      value={activeDay.objectives.carbs ? activeDay.objectives.carbs.toString() : ''}
                      onChangeText={(v) => updateObjective('carbs', v)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={Colors.light.textMuted}
                    />
                  </View>
                  <Text style={styles.objectiveUnit}>g</Text>
                </View>
                <View style={styles.objectiveCard}>
                  <Text style={styles.objectiveLabel}>PROTEÍNAS</Text>
                  <TextInput
                    style={styles.objectiveValue}
                    value={activeDay.objectives.protein ? activeDay.objectives.protein.toString() : ''}
                    onChangeText={(v) => updateObjective('protein', v)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={Colors.light.textMuted}
                  />
                  <Text style={styles.objectiveUnit}>g</Text>
                </View>
                <View style={styles.objectiveCard}>
                  <Text style={styles.objectiveLabel}>GRASAS</Text>
                  <TextInput
                    style={styles.objectiveValue}
                    value={activeDay.objectives.fats ? activeDay.objectives.fats.toString() : ''}
                    onChangeText={(v) => updateObjective('fats', v)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={Colors.light.textMuted}
                  />
                  <Text style={styles.objectiveUnit}>g</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: 'rgba(90, 200, 245, 0.12)' }]}>
                  <Droplets size={16} color={Colors.light.cyan} />
                </View>
                <Text style={styles.sectionTitle}>Hidratación y Electrolitos</Text>
              </View>

              <View style={styles.hydrationCard}>
                <View style={styles.hydrationRow}>
                  <View style={styles.hydrationField}>
                    <Text style={styles.hydrationLabel}>AGUA (LITROS)</Text>
                    <TextInput
                      style={styles.hydrationInput}
                      value={activeDay.hydration.waterLiters}
                      onChangeText={(v) => updateHydration('waterLiters', v)}
                      placeholder="Ej: 7-8"
                      placeholderTextColor={Colors.light.textMuted}
                    />
                  </View>
                  <View style={styles.hydrationField}>
                    <Text style={styles.hydrationLabel}>SAL / SODIO</Text>
                    <TextInput
                      style={styles.hydrationInput}
                      value={activeDay.hydration.salt}
                      onChangeText={(v) => updateHydration('salt', v)}
                      placeholder="Ej: 10-12g sal rosada"
                      placeholderTextColor={Colors.light.textMuted}
                    />
                  </View>
                </View>
                <TextInput
                  style={styles.hydrationNotesInput}
                  value={activeDay.hydration.notes || ''}
                  onChangeText={(v) => updateHydration('notes', v)}
                  placeholder="Notas de hidratación..."
                  placeholderTextColor={Colors.light.textMuted}
                  multiline
                />
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: 'rgba(48, 209, 88, 0.12)' }]}>
                  <UtensilsCrossed size={16} color={Colors.light.green} />
                </View>
                <Text style={styles.sectionTitle}>Distribución de Comidas</Text>
                <TouchableOpacity style={styles.addBtn} onPress={addMeal} activeOpacity={0.7}>
                  <Plus size={14} color={Colors.light.tint} />
                  <Text style={styles.addBtnText}>Comida</Text>
                </TouchableOpacity>
              </View>

              {activeDay.meals.length === 0 && (
                <View style={styles.emptySection}>
                  <UtensilsCrossed size={24} color={Colors.light.textMuted} />
                  <Text style={styles.emptyText}>Sin comidas. Toca &quot;+ Comida&quot; para agregar.</Text>
                </View>
              )}

              {activeDay.meals.map((meal, mealIndex) => (
                <View key={meal.id} style={styles.mealCard}>
                  <TouchableOpacity
                    style={styles.mealHeader}
                    onPress={() => toggleMealExpand(meal.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.mealNumberBadge}>
                      <Text style={styles.mealNumberText}>{mealIndex + 1}</Text>
                    </View>
                    <View style={styles.mealHeaderInputs}>
                      <TextInput
                        style={styles.mealNameInput}
                        value={meal.name}
                        onChangeText={(v) => updateMealField(meal.id, 'name', v)}
                        placeholder={`Comida ${mealIndex + 1}`}
                        placeholderTextColor={Colors.light.textMuted}
                      />
                      <TextInput
                        style={styles.mealTimeInput}
                        value={meal.time}
                        onChangeText={(v) => updateMealField(meal.id, 'time', v)}
                        placeholder="Ej: Pre Entreno"
                        placeholderTextColor={Colors.light.textMuted}
                      />
                    </View>
                    <View style={styles.mealHeaderRight}>
                      <TouchableOpacity onPress={() => removeMeal(meal.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Trash2 size={14} color={Colors.light.red} />
                      </TouchableOpacity>
                      {expandedMeals[meal.id] ? (
                        <ChevronUp size={16} color={Colors.light.textMuted} />
                      ) : (
                        <ChevronDown size={16} color={Colors.light.textMuted} />
                      )}
                    </View>
                  </TouchableOpacity>

                  {expandedMeals[meal.id] && (
                    <View style={styles.mealBody}>
                      {meal.foods.length === 0 && (
                        <Text style={styles.emptyFoodText}>Sin alimentos agregados</Text>
                      )}

                      {meal.foods.map((food, fi) => (
                        <View key={fi} style={styles.foodItem}>
                          <View style={styles.foodRow1}>
                            <View style={styles.foodDot} />
                            <TextInput
                              style={styles.foodNameInput}
                              value={food.name}
                              onChangeText={(v) => updateFoodField(meal.id, fi, 'name', v)}
                              placeholder="Nombre del alimento"
                              placeholderTextColor={Colors.light.textMuted}
                            />
                            <TouchableOpacity
                              onPress={() => removeFoodFromMeal(meal.id, fi)}
                              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            >
                              <X size={14} color={Colors.light.red} />
                            </TouchableOpacity>
                          </View>
                          <View style={styles.foodMetrics}>
                            <View style={styles.foodMetricItem}>
                              <Text style={styles.foodMetricLabel}>CANT.</Text>
                              <TextInput
                                style={styles.foodMetricInput}
                                value={food.quantity ? food.quantity.toString() : ''}
                                onChangeText={(v) => updateFoodField(meal.id, fi, 'quantity', v)}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={Colors.light.textMuted}
                              />
                            </View>
                            <View style={styles.foodMetricItem}>
                              <Text style={styles.foodMetricLabel}>UNID.</Text>
                              <TextInput
                                style={styles.foodMetricInput}
                                value={food.unit}
                                onChangeText={(v) => updateFoodField(meal.id, fi, 'unit', v)}
                                placeholder="g"
                                placeholderTextColor={Colors.light.textMuted}
                              />
                            </View>
                            <View style={styles.foodMetricItem}>
                              <Text style={styles.foodMetricLabel}>PROT.</Text>
                              <TextInput
                                style={styles.foodMetricInput}
                                value={food.protein ? food.protein.toString() : ''}
                                onChangeText={(v) => updateFoodField(meal.id, fi, 'protein', v)}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={Colors.light.textMuted}
                              />
                            </View>
                            <View style={styles.foodMetricItem}>
                              <Text style={styles.foodMetricLabel}>CARBS</Text>
                              <TextInput
                                style={styles.foodMetricInput}
                                value={food.carbs ? food.carbs.toString() : ''}
                                onChangeText={(v) => updateFoodField(meal.id, fi, 'carbs', v)}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={Colors.light.textMuted}
                              />
                            </View>
                            <View style={styles.foodMetricItem}>
                              <Text style={styles.foodMetricLabel}>GRASAS</Text>
                              <TextInput
                                style={styles.foodMetricInput}
                                value={food.fats ? food.fats.toString() : ''}
                                onChangeText={(v) => updateFoodField(meal.id, fi, 'fats', v)}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={Colors.light.textMuted}
                              />
                            </View>
                          </View>
                        </View>
                      ))}

                      <TouchableOpacity style={styles.addFoodBtn} onPress={() => addFoodToMeal(meal.id)} activeOpacity={0.7}>
                        <Plus size={12} color={Colors.light.green} />
                        <Text style={styles.addFoodText}>Agregar alimento</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: 'rgba(102, 212, 207, 0.12)' }]}>
                  <Pill size={16} color={Colors.light.mint} />
                </View>
                <Text style={styles.sectionTitle}>Suplementación</Text>
                <TouchableOpacity style={styles.addBtn} onPress={addSupplement} activeOpacity={0.7}>
                  <Plus size={14} color={Colors.light.tint} />
                  <Text style={styles.addBtnText}>Agregar</Text>
                </TouchableOpacity>
              </View>

              {supplements.length === 0 && (
                <View style={styles.emptySection}>
                  <Pill size={24} color={Colors.light.textMuted} />
                  <Text style={styles.emptyText}>Sin suplementos aún.</Text>
                </View>
              )}

              {supplements.map((sup, i) => (
                <View key={i} style={styles.supplementCard}>
                  <View style={styles.supRow}>
                    <TextInput
                      style={styles.supNameInput}
                      value={sup.name}
                      onChangeText={(v) => updateSupplementField(i, 'name', v)}
                      placeholder="Nombre del suplemento"
                      placeholderTextColor={Colors.light.textMuted}
                    />
                    <TouchableOpacity onPress={() => removeSupplement(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Trash2 size={14} color={Colors.light.red} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.supDetailsRow}>
                    <View style={styles.supField}>
                      <Text style={styles.supFieldLabel}>DOSIS</Text>
                      <TextInput
                        style={styles.supFieldInput}
                        value={sup.dosage}
                        onChangeText={(v) => updateSupplementField(i, 'dosage', v)}
                        placeholder="5g"
                        placeholderTextColor={Colors.light.textMuted}
                      />
                    </View>
                    <View style={styles.supField}>
                      <Text style={styles.supFieldLabel}>MOMENTO</Text>
                      <TextInput
                        style={styles.supFieldInput}
                        value={sup.timing}
                        onChangeText={(v) => updateSupplementField(i, 'timing', v)}
                        placeholder="Con comida 1"
                        placeholderTextColor={Colors.light.textMuted}
                      />
                    </View>
                  </View>
                  <TextInput
                    style={styles.supNotesInput}
                    value={sup.notes || ''}
                    onChangeText={(v) => updateSupplementField(i, 'notes', v)}
                    placeholder="Notas del suplemento..."
                    placeholderTextColor={Colors.light.textMuted}
                  />
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.notesLabel}>Notas generales del plan</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={(v) => { setNotes(v); markChanged(); }}
                placeholder="Instrucciones, ajustes, observaciones generales..."
                placeholderTextColor={Colors.light.textMuted}
                multiline
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Save size={18} color="#000" />
              <Text style={styles.saveBtnText}>Guardar plan nutricional</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  flex: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 17,
    color: Colors.light.textMuted,
  },
  scrollContent: {
    paddingBottom: 30,
    paddingTop: 4,
  },
  headerBtn: {
    padding: 4,
  },
  headerBtnText: {
    fontSize: 17,
    color: Colors.light.tint,
  },
  saveHeaderBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  saveHeaderText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.light.tint,
  },
  planTitleSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  planTitleInput: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    textAlign: 'center' as const,
    paddingVertical: 4,
    letterSpacing: 0.5,
  },
  planSubtitle: {
    fontSize: 13,
    color: Colors.light.textMuted,
    textAlign: 'center' as const,
    marginTop: 6,
  },
  dayTabsContainer: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.secondaryBg,
  },
  dayTabsScroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row' as const,
    alignItems: 'center',
  },
  dayTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.light.elevated,
    minWidth: 70,
    alignItems: 'center',
  },
  dayTabActive: {
    backgroundColor: Colors.light.tint,
  },
  dayTabNumber: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.textSecondary,
  },
  dayTabNumberActive: {
    color: '#FFFFFF',
  },
  dayTabLabel: {
    fontSize: 10,
    color: Colors.light.textMuted,
    marginTop: 2,
    maxWidth: 80,
  },
  dayTabLabelActive: {
    color: 'rgba(255,255,255,0.85)',
  },
  addDayTab: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.2)',
    borderStyle: 'dashed',
  },
  dayHeaderSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  dayTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  dayTitleInputs: {
    flex: 1,
    marginRight: 12,
  },
  dayTitleInput: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    paddingVertical: 2,
  },
  daySubtitleInput: {
    fontSize: 14,
    color: Colors.light.cyan,
    paddingVertical: 2,
    marginTop: 2,
    fontWeight: '500' as const,
  },
  dayActions: {
    flexDirection: 'row' as const,
    gap: 8,
    paddingTop: 4,
  },
  dayActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.light.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  addBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.tint,
  },
  objectivesGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  objectiveCard: {
    width: '47%' as unknown as number,
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  objectiveCardCalories: {
    width: '100%' as unknown as number,
    backgroundColor: 'rgba(48, 209, 88, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.15)',
  },
  objectiveLabel: {
    fontSize: 10,
    color: Colors.light.textMuted,
    fontWeight: '600' as const,
    letterSpacing: 1,
    marginBottom: 6,
  },
  objectiveValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.text,
    textAlign: 'center' as const,
    minWidth: 60,
    paddingVertical: 2,
  },
  objectiveRangeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 4,
  },
  objectiveUnit: {
    fontSize: 11,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  hydrationCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.cyan,
  },
  hydrationRow: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 10,
  },
  hydrationField: {
    flex: 1,
  },
  hydrationLabel: {
    fontSize: 10,
    color: Colors.light.textMuted,
    fontWeight: '600' as const,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  hydrationInput: {
    backgroundColor: Colors.light.elevated,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.light.text,
    fontWeight: '600' as const,
  },
  hydrationNotesInput: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    paddingVertical: 4,
    minHeight: 30,
  },
  emptySection: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.light.textMuted,
  },
  mealCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden' as const,
  },
  mealHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  mealNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealNumberText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.light.green,
  },
  mealHeaderInputs: {
    flex: 1,
  },
  mealNameInput: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    paddingVertical: 0,
  },
  mealTimeInput: {
    fontSize: 11,
    color: Colors.light.textMuted,
    paddingVertical: 0,
    marginTop: 2,
  },
  mealHeaderRight: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 12,
  },
  mealBody: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 0.5,
    borderTopColor: Colors.light.border,
  },
  emptyFoodText: {
    fontSize: 12,
    color: Colors.light.textMuted,
    textAlign: 'center' as const,
    paddingVertical: 12,
  },
  foodItem: {
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.light.border,
  },
  foodRow1: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  foodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.green,
  },
  foodNameInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500' as const,
    paddingVertical: 0,
  },
  foodMetrics: {
    flexDirection: 'row' as const,
    gap: 6,
    marginLeft: 14,
  },
  foodMetricItem: {
    flex: 1,
  },
  foodMetricLabel: {
    fontSize: 8,
    color: Colors.light.textMuted,
    letterSpacing: 0.5,
    marginBottom: 3,
    fontWeight: '600' as const,
  },
  foodMetricInput: {
    backgroundColor: Colors.light.elevated,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 6,
    fontSize: 13,
    color: Colors.light.text,
    textAlign: 'center' as const,
  },
  addFoodBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 6,
  },
  addFoodText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.green,
  },
  supplementCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.mint,
  },
  supRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  supNameInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    paddingVertical: 0,
    marginRight: 8,
  },
  supDetailsRow: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  supField: {
    flex: 1,
  },
  supFieldLabel: {
    fontSize: 9,
    color: Colors.light.textMuted,
    marginBottom: 4,
    letterSpacing: 0.5,
    fontWeight: '600' as const,
  },
  supFieldInput: {
    backgroundColor: Colors.light.elevated,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.light.text,
  },
  supNotesInput: {
    fontSize: 12,
    color: Colors.light.textMuted,
    paddingVertical: 4,
    marginTop: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: Colors.light.text,
    minHeight: 100,
    lineHeight: 22,
  },
  saveBtn: {
    marginHorizontal: 16,
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  saveBtnText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
