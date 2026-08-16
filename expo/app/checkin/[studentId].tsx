import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import {
  Camera,
  ImageIcon,
  X,
  Scale,
  Ruler,
  Moon,
  Droplets,
  Smile,
  Save,
  Zap,
  Brain,
  Heart,
  Dumbbell,
  Utensils,
  Pill,
  Footprints,
  Wine,
  Flame,
  Target,
  Cookie,
  Clock,
  Timer,
  Info,
  Activity,
  AlertTriangle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useStudents } from '@/contexts/StudentsContext';
import { CheckInPhoto, BodyFatMethod, Skinfolds9 } from '@/types';
import {
  calculateParrillo9,
  SKINFOLD_LABELS,
  SKINFOLD_KEYS,
  validateSkinfold,
  PARRILLO_VERSION,
} from '@/utils/parrillo';

type SkinfoldState = Record<keyof Skinfolds9, string>;

const EMPTY_SKINFOLDS: SkinfoldState = {
  chest: '',
  abdomen: '',
  thigh: '',
  triceps: '',
  subscapular: '',
  suprailiac: '',
  lowerBack: '',
  calf: '',
  biceps: '',
};

export default function NewCheckInScreen() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const { getStudent, addCheckIn } = useStudents();
  const { colors } = useTheme();
  const student = getStudent(studentId ?? '');

  const [weight, setWeight] = useState<string>(student?.weight?.toString() ?? '');
  const [bodyFat, setBodyFat] = useState<string>('');
  const [bodyFatMethod, setBodyFatMethod] = useState<BodyFatMethod>('bia');
  const [measurementDevice, setMeasurementDevice] = useState<string>('');
  const [measurementNotes, setMeasurementNotes] = useState<string>('');
  const [skinfolds, setSkinfolds] = useState<SkinfoldState>(EMPTY_SKINFOLDS);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  const [notes, setNotes] = useState<string>('');
  const [coachFeedback, setCoachFeedback] = useState<string>('');
  const [mood, setMood] = useState<number>(3);
  const [sleepHours, setSleepHours] = useState<string>('');
  const [sleepQuality, setSleepQuality] = useState<number>(3);
  const [waterIntake, setWaterIntake] = useState<string>('');
  const [stressLevel, setStressLevel] = useState<number>(2);
  const [energyLevel, setEnergyLevel] = useState<number>(3);
  const [digestiveHealth, setDigestiveHealth] = useState<number>(3);
  const [trainingPerformance, setTrainingPerformance] = useState<number>(3);
  const [photos, setPhotos] = useState<CheckInPhoto[]>([]);
  const [chest, setChest] = useState<string>('');
  const [waist, setWaist] = useState<string>('');
  const [hips, setHips] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [dietAdherence, setDietAdherence] = useState<number>(3);
  const [appetiteLevel, setAppetiteLevel] = useState<number>(3);
  const [cravings, setCravings] = useState<string>('');
  const [supplementAdherence, setSupplementAdherence] = useState<number>(4);
  const [cardioMinutes, setCardioMinutes] = useState<string>('');
  const [cardioType, setCardioType] = useState<string>('');
  const [bloating, setBloating] = useState<number>(2);
  const [muscleSoreness, setMuscleSoreness] = useState<number>(2);
  const [menstrualPhase, setMenstrualPhase] = useState<string>('');
  const [alcoholDrinks, setAlcoholDrinks] = useState<string>('');
  const [mealsCompleted, setMealsCompleted] = useState<string>('');
  const [mealsPlanned, setMealsPlanned] = useState<string>(
    student?.nutritionPlan?.meals?.length?.toString() ?? '5'
  );
  const [proteinHit, setProteinHit] = useState<boolean>(true);
  const [carbsHit, setCarbsHit] = useState<boolean>(true);
  const [fatsHit, setFatsHit] = useState<boolean>(true);
  const [cheatMeals, setCheatMeals] = useState<string>('0');
  const [stepsCount, setStepsCount] = useState<string>('');
  const [trainingTime, setTrainingTime] = useState<string>('');
  const [trainingDuration, setTrainingDuration] = useState<string>('');
  const [trainingType, setTrainingType] = useState<string>('');

  const updateSkinfold = useCallback((key: keyof Skinfolds9, value: string) => {
    setSkinfolds((prev) => ({ ...prev, [key]: value }));
  }, []);

  const allSkinfoldsValid = useMemo(() => {
    return SKINFOLD_KEYS.every((key) => {
      const val = skinfolds[key];
      return val.trim() !== '' && !isNaN(parseFloat(val)) && parseFloat(val) > 0;
    });
  }, [skinfolds]);

  const parrilloResult = useMemo(() => {
    if (bodyFatMethod !== 'parrillo_9_site' || !allSkinfoldsValid || !student) return null;
    const numericSkinfolds: Skinfolds9 = {
      chest: parseFloat(skinfolds.chest),
      abdomen: parseFloat(skinfolds.abdomen),
      thigh: parseFloat(skinfolds.thigh),
      triceps: parseFloat(skinfolds.triceps),
      subscapular: parseFloat(skinfolds.subscapular),
      suprailiac: parseFloat(skinfolds.suprailiac),
      lowerBack: parseFloat(skinfolds.lowerBack),
      calf: parseFloat(skinfolds.calf),
      biceps: parseFloat(skinfolds.biceps),
    };
    return calculateParrillo9(student.gender, numericSkinfolds);
  }, [bodyFatMethod, allSkinfoldsValid, skinfolds, student]);

  const skinfoldWarnings = useMemo(() => {
    const warnings: Partial<Record<keyof Skinfolds9, string>> = {};
    SKINFOLD_KEYS.forEach((key) => {
      const val = skinfolds[key];
      if (val.trim() !== '' && !isNaN(parseFloat(val))) {
        const result = validateSkinfold(parseFloat(val));
        if (result.warning) warnings[key] = result.warning;
      }
    });
    return warnings;
  }, [skinfolds]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const newPhoto: CheckInPhoto = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          pose: 'front',
          timestamp: new Date().toISOString(),
        };
        setPhotos((prev) => [...prev, newPhoto]);
      }
    } catch (e) {
      console.log('Error picking image:', e);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const takePhoto = async () => {
    try {
      const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (camStatus !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para tomar fotos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const newPhoto: CheckInPhoto = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          pose: 'front',
          timestamp: new Date().toISOString(),
        };
        setPhotos((prev) => [...prev, newPhoto]);
      }
    } catch (e) {
      console.log('Error taking photo:', e);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const removePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleSave = async () => {
    if (!weight.trim()) {
      Alert.alert('Error', 'El peso es obligatorio');
      return;
    }

    let finalBodyFat: number | undefined;
    let finalSkinfolds: Skinfolds9 | undefined;
    let finalSum9: number | undefined;
    let calcVersion: string | undefined;
    let sexUsed: 'male' | 'female' | undefined;

    if (bodyFatMethod === 'bia') {
      finalBodyFat = bodyFat ? parseFloat(bodyFat) : undefined;
    } else if (bodyFatMethod === 'parrillo_9_site') {
      if (parrilloResult) {
        finalBodyFat = parrilloResult.bodyFatPercent;
        finalSum9 = parrilloResult.sum9;
        calcVersion = parrilloResult.version;
        sexUsed = student?.gender;
        finalSkinfolds = {
          chest: parseFloat(skinfolds.chest),
          abdomen: parseFloat(skinfolds.abdomen),
          thigh: parseFloat(skinfolds.thigh),
          triceps: parseFloat(skinfolds.triceps),
          subscapular: parseFloat(skinfolds.subscapular),
          suprailiac: parseFloat(skinfolds.suprailiac),
          lowerBack: parseFloat(skinfolds.lowerBack),
          calf: parseFloat(skinfolds.calf),
          biceps: parseFloat(skinfolds.biceps),
        };
      } else if (bodyFat) {
        finalBodyFat = parseFloat(bodyFat);
      }
    }

    setIsSaving(true);
    try {
      await addCheckIn(studentId ?? '', {
        studentId: studentId ?? '',
        date: new Date().toISOString().split('T')[0],
        weight: parseFloat(weight),
        bodyFatPercentage: finalBodyFat,
        bodyFatMethod,
        skinfolds9: finalSkinfolds,
        skinfoldSum9: finalSum9,
        measurementDevice: measurementDevice.trim() || undefined,
        measurementNotes: measurementNotes.trim() || undefined,
        calculationVersion: calcVersion,
        sexUsedForCalc: sexUsed,
        photos,
        measurements: {
          chest: chest ? parseFloat(chest) : undefined,
          waist: waist ? parseFloat(waist) : undefined,
          hips: hips ? parseFloat(hips) : undefined,
        },
        notes: notes.trim(),
        coachFeedback: coachFeedback.trim() || undefined,
        mood,
        sleepHours: sleepHours ? parseFloat(sleepHours) : undefined,
        sleepQuality,
        waterIntake: waterIntake ? parseFloat(waterIntake) : undefined,
        stressLevel,
        energyLevel,
        digestiveHealth,
        trainingPerformance,
        dietAdherence,
        appetiteLevel,
        cravings: cravings.trim() || undefined,
        supplementAdherence,
        cardioMinutes: cardioMinutes ? parseInt(cardioMinutes, 10) : undefined,
        cardioType: cardioType.trim() || undefined,
        bloating,
        muscleSoreness,
        menstrualPhase: menstrualPhase.trim() || undefined,
        alcoholDrinks: alcoholDrinks ? parseInt(alcoholDrinks, 10) : undefined,
        mealsCompleted: mealsCompleted ? parseInt(mealsCompleted, 10) : undefined,
        mealsPlanned: mealsPlanned ? parseInt(mealsPlanned, 10) : undefined,
        proteinHit,
        carbsHit,
        fatsHit,
        cheatMeals: cheatMeals ? parseInt(cheatMeals, 10) : undefined,
        stepsCount: stepsCount ? parseInt(stepsCount, 10) : undefined,
        trainingTime: trainingTime.trim() || undefined,
        trainingDuration: trainingDuration ? parseInt(trainingDuration, 10) : undefined,
        trainingType: trainingType.trim() || undefined,
      });
      Alert.alert('Check-in guardado', 'El check-in se ha registrado correctamente', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      console.log('Error saving check-in:', e);
      Alert.alert('Error', 'No se pudo guardar el check-in');
    } finally {
      setIsSaving(false);
    }
  };

  const isFemale = student?.gender === 'female';

  const hasMethodMix = useMemo(() => {
    if (!student?.checkIns || student.checkIns.length < 2) return false;
    const methods = new Set(student.checkIns.map((c) => c.bodyFatMethod).filter(Boolean));
    return methods.size > 1;
  }, [student?.checkIns]);

  if (!student) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Check-in' }} />
        <Text style={[styles.errorText, { color: colors.textMuted }]}>Alumno no encontrado</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: `Check-in: ${student.name}` }} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
      >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Fotos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosRow}>
            {photos.map((photo) => (
              <View key={photo.id} style={styles.photoItem}>
                <Image source={{ uri: photo.uri }} style={styles.photo} contentFit="cover" />
                <TouchableOpacity style={styles.removePhoto} onPress={() => removePhoto(photo.id)}>
                  <X size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={[styles.addPhotoBtn, { backgroundColor: colors.card, borderColor: colors.separator }]} onPress={pickImage} activeOpacity={0.7}>
              <ImageIcon size={24} color={colors.tint} />
              <Text style={[styles.addPhotoText, { color: colors.tint }]}>Galería</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.addPhotoBtn, { backgroundColor: colors.card, borderColor: colors.separator }]} onPress={takePhoto} activeOpacity={0.7}>
              <Camera size={24} color={colors.orange} />
              <Text style={[styles.addPhotoText, { color: colors.orange }]}>Cámara</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Datos corporales</Text>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Scale size={14} color={colors.tint} />
                <Text style={[styles.labelText, { color: colors.textSecondary }]}>Peso (kg) *</Text>
              </View>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                placeholder="80.0"
                placeholderTextColor={colors.textMuted}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Activity size={14} color={colors.cyan} />
                <Text style={[styles.labelText, { color: colors.textSecondary }]}>Sexo</Text>
              </View>
              <View style={[styles.sexBadge, { backgroundColor: colors.card }]}>
                <Text style={[styles.sexBadgeText, { color: colors.text }]}>
                  {student.gender === 'male' ? 'Masculino' : 'Femenino'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Medición de grasa corporal</Text>
            <TouchableOpacity onPress={() => setShowGuideModal(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Info size={18} color={colors.tint} />
            </TouchableOpacity>
          </View>

          {hasMethodMix && (
            <View style={[styles.warningBanner, { backgroundColor: colors.warning + '18', borderColor: colors.warning + '40' }]}>
              <AlertTriangle size={14} color={colors.warning} />
              <Text style={[styles.warningText, { color: colors.warning }]}>
                Se han usado distintos métodos. Evita mezclar para tendencias precisas.
              </Text>
            </View>
          )}

          <View style={[styles.methodSelector, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[
                styles.methodTab,
                bodyFatMethod === 'bia' && { backgroundColor: colors.tint },
              ]}
              onPress={() => setBodyFatMethod('bia')}
              activeOpacity={0.7}
            >
              <Zap size={14} color={bodyFatMethod === 'bia' ? '#000' : colors.textMuted} />
              <Text style={[
                styles.methodTabText,
                { color: bodyFatMethod === 'bia' ? '#000' : colors.textMuted },
                bodyFatMethod === 'bia' && styles.methodTabTextActive,
              ]}>Bioimpedancia</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.methodTab,
                bodyFatMethod === 'parrillo_9_site' && { backgroundColor: colors.tint },
              ]}
              onPress={() => setBodyFatMethod('parrillo_9_site')}
              activeOpacity={0.7}
            >
              <Ruler size={14} color={bodyFatMethod === 'parrillo_9_site' ? '#000' : colors.textMuted} />
              <Text style={[
                styles.methodTabText,
                { color: bodyFatMethod === 'parrillo_9_site' ? '#000' : colors.textMuted },
                bodyFatMethod === 'parrillo_9_site' && styles.methodTabTextActive,
              ]}>Caliper (Parrillo 9)</Text>
            </TouchableOpacity>
          </View>

          {bodyFatMethod === 'bia' && (
            <View style={styles.methodContent}>
              <View style={styles.inputGroup}>
                <View style={styles.inputLabel}>
                  <Ruler size={14} color={colors.cyan} />
                  <Text style={[styles.labelText, { color: colors.textSecondary }]}>% Grasa corporal</Text>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  placeholder="15.0"
                  placeholderTextColor={colors.textMuted}
                  value={bodyFat}
                  onChangeText={setBodyFat}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[styles.inputGroup, { marginTop: 12 }]}>
                <View style={styles.inputLabel}>
                  <Activity size={14} color={colors.textMuted} />
                  <Text style={[styles.labelText, { color: colors.textSecondary }]}>Dispositivo (opcional)</Text>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  placeholder="Ej: InBody 270, Tanita BC-545N"
                  placeholderTextColor={colors.textMuted}
                  value={measurementDevice}
                  onChangeText={setMeasurementDevice}
                />
              </View>
              <View style={[styles.inputGroup, { marginTop: 12 }]}>
                <Text style={[styles.labelText, { color: colors.textSecondary, marginBottom: 6 }]}>Notas medición (opcional)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  placeholder="Ej: en ayunas, hidratado"
                  placeholderTextColor={colors.textMuted}
                  value={measurementNotes}
                  onChangeText={setMeasurementNotes}
                />
              </View>
              <View style={[styles.methodBadgeRow, { marginTop: 12 }]}>
                <View style={[styles.methodBadge, { backgroundColor: colors.info + '20' }]}>
                  <Text style={[styles.methodBadgeText, { color: colors.info }]}>BIA</Text>
                </View>
              </View>
            </View>
          )}

          {bodyFatMethod === 'parrillo_9_site' && (
            <View style={styles.methodContent}>
              <View style={styles.methodBadgeRow}>
                <View style={[styles.methodBadge, { backgroundColor: colors.tint + '20' }]}>
                  <Text style={[styles.methodBadgeText, { color: colors.tint }]}>Parrillo 9-site</Text>
                </View>
                <View style={[styles.methodBadge, { backgroundColor: isFemale ? colors.pink + '20' : colors.blue + '20' }]}>
                  <Text style={[styles.methodBadgeText, { color: isFemale ? colors.pink : colors.blue }]}>
                    {isFemale ? 'Femenino' : 'Masculino'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.caliperSubtitle, { color: colors.textMuted }]}>
                Ingresa los 9 pliegues cutáneos en milímetros
              </Text>

              <View style={styles.skinfoldsGrid}>
                {SKINFOLD_KEYS.map((key) => {
                  const label = SKINFOLD_LABELS[key];
                  const warning = skinfoldWarnings[key];
                  return (
                    <View key={key} style={styles.skinfoldItem}>
                      <View style={styles.skinfoldLabelRow}>
                        <Text style={[styles.skinfoldLabel, { color: colors.text }]}>{label.es}</Text>
                        <TouchableOpacity
                          onPress={() => Alert.alert(label.es, label.hint)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Info size={12} color={colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                      <TextInput
                        style={[
                          styles.skinfoldInput,
                          { backgroundColor: colors.card, color: colors.text },
                          warning ? { borderWidth: 1, borderColor: colors.warning + '80' } : null,
                        ]}
                        placeholder="mm"
                        placeholderTextColor={colors.textMuted}
                        value={skinfolds[key]}
                        onChangeText={(v) => updateSkinfold(key, v)}
                        keyboardType="decimal-pad"
                      />
                      {warning && (
                        <Text style={[styles.skinfoldWarning, { color: colors.warning }]}>{warning}</Text>
                      )}
                    </View>
                  );
                })}
              </View>

              {parrilloResult && (
                <View style={[styles.resultCard, { backgroundColor: colors.tint + '12', borderColor: colors.tint + '30' }]}>
                  <Text style={[styles.resultTitle, { color: colors.tint }]}>Resultado Parrillo 9-site</Text>
                  <View style={styles.resultRow}>
                    <View style={styles.resultItem}>
                      <Text style={[styles.resultValue, { color: colors.text }]}>{parrilloResult.sum9.toFixed(1)}</Text>
                      <Text style={[styles.resultLabel, { color: colors.textMuted }]}>Suma 9 (mm)</Text>
                    </View>
                    <View style={[styles.resultDivider, { backgroundColor: colors.tint + '30' }]} />
                    <View style={styles.resultItem}>
                      <Text style={[styles.resultValue, { color: colors.tint }]}>{parrilloResult.bodyFatPercent.toFixed(1)}%</Text>
                      <Text style={[styles.resultLabel, { color: colors.textMuted }]}>Grasa corporal</Text>
                    </View>
                  </View>
                  <Text style={[styles.resultVersion, { color: colors.textMuted }]}>
                    {PARRILLO_VERSION} · {isFemale ? 'Femenino' : 'Masculino'}
                  </Text>
                </View>
              )}

              {!allSkinfoldsValid && (
                <Text style={[styles.incompleteHint, { color: colors.textMuted }]}>
                  Completa los 9 pliegues para calcular automáticamente
                </Text>
              )}

              <View style={[styles.inputGroup, { marginTop: 12 }]}>
                <Text style={[styles.labelText, { color: colors.textSecondary, marginBottom: 6 }]}>Notas medición (opcional)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  placeholder="Ej: medido por coach, lado derecho"
                  placeholderTextColor={colors.textMuted}
                  value={measurementNotes}
                  onChangeText={setMeasurementNotes}
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Medidas (cm)</Text>
          <View style={styles.inputRow}>
            <View style={styles.inputGroupThird}>
              <Text style={[styles.smallLabel, { color: colors.textMuted }]}>Pecho</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.text }]} placeholder="100" placeholderTextColor={colors.textMuted} value={chest} onChangeText={setChest} keyboardType="decimal-pad" />
            </View>
            <View style={styles.inputGroupThird}>
              <Text style={[styles.smallLabel, { color: colors.textMuted }]}>Cintura</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.text }]} placeholder="82" placeholderTextColor={colors.textMuted} value={waist} onChangeText={setWaist} keyboardType="decimal-pad" />
            </View>
            <View style={styles.inputGroupThird}>
              <Text style={[styles.smallLabel, { color: colors.textMuted }]}>Cadera</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.text }]} placeholder="96" placeholderTextColor={colors.textMuted} value={hips} onChangeText={setHips} keyboardType="decimal-pad" />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Adherencia nutricional</Text>

          <RatingRow
            icon={<Utensils size={14} color={Colors.light.tint} />}
            label="Adherencia a la dieta"
            value={dietAdherence}
            onChange={setDietAdherence}
          />

          <RatingRow
            icon={<Flame size={14} color={Colors.light.orange} />}
            label="Nivel de apetito"
            value={appetiteLevel}
            onChange={setAppetiteLevel}
          />

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Target size={14} color={colors.tint} />
                <Text style={[styles.labelText, { color: colors.textSecondary }]}>Comidas hechas</Text>
              </View>
              <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.text }]} placeholder="5" placeholderTextColor={colors.textMuted} value={mealsCompleted} onChangeText={setMealsCompleted} keyboardType="number-pad" />
            </View>
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Utensils size={14} color={colors.textSecondary} />
                <Text style={[styles.labelText, { color: colors.textSecondary }]}>Comidas plan</Text>
              </View>
              <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.text }]} placeholder="5" placeholderTextColor={colors.textMuted} value={mealsPlanned} onChangeText={setMealsPlanned} keyboardType="number-pad" />
            </View>
          </View>

          <View style={styles.macroToggles}>
            <View style={[styles.macroToggleRow, { backgroundColor: colors.card }]}>
              <Text style={[styles.macroToggleLabel, { color: colors.text }]}>Proteínas cumplidas</Text>
              <Switch value={proteinHit} onValueChange={setProteinHit} trackColor={{ false: colors.separator, true: colors.tint + '60' }} thumbColor={proteinHit ? colors.tint : colors.textMuted} />
            </View>
            <View style={[styles.macroToggleRow, { backgroundColor: colors.card }]}>
              <Text style={[styles.macroToggleLabel, { color: colors.text }]}>Carbohidratos cumplidos</Text>
              <Switch value={carbsHit} onValueChange={setCarbsHit} trackColor={{ false: colors.separator, true: colors.tint + '60' }} thumbColor={carbsHit ? colors.tint : colors.textMuted} />
            </View>
            <View style={[styles.macroToggleRow, { backgroundColor: colors.card }]}>
              <Text style={[styles.macroToggleLabel, { color: colors.text }]}>Grasas cumplidas</Text>
              <Switch value={fatsHit} onValueChange={setFatsHit} trackColor={{ false: colors.separator, true: colors.tint + '60' }} thumbColor={fatsHit ? colors.tint : colors.textMuted} />
            </View>
          </View>

          <View style={[styles.inputRow, { marginTop: 12 }]}>
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Cookie size={14} color={Colors.light.orange} />
                <Text style={[styles.labelText, { color: colors.textSecondary }]}>Cheat meals</Text>
              </View>
              <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.text }]} placeholder="0" placeholderTextColor={colors.textMuted} value={cheatMeals} onChangeText={setCheatMeals} keyboardType="number-pad" />
            </View>
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Wine size={14} color={Colors.light.red} />
                <Text style={[styles.labelText, { color: colors.textSecondary }]}>Alcohol (copas)</Text>
              </View>
              <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.text }]} placeholder="0" placeholderTextColor={colors.textMuted} value={alcoholDrinks} onChangeText={setAlcoholDrinks} keyboardType="number-pad" />
            </View>
          </View>

          <View style={{ marginTop: 12 }}>
            <View style={styles.inputLabel}>
              <Flame size={14} color={Colors.light.red} />
              <Text style={[styles.labelText, { color: colors.textSecondary }]}>Antojos / Cravings</Text>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="Ej: dulces, pan, chocolate..."
              placeholderTextColor={colors.textMuted}
              value={cravings}
              onChangeText={setCravings}
            />
          </View>

          <RatingRow
            icon={<Pill size={14} color={Colors.light.cyan} />}
            label="Adherencia suplementos"
            value={supplementAdherence}
            onChange={setSupplementAdherence}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Horario de entrenamiento</Text>
          <View style={[styles.trainingScheduleCard, { backgroundColor: colors.card, borderColor: colors.separator }]}>
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <View style={styles.inputLabel}>
                  <Clock size={14} color={colors.tint} />
                  <Text style={[styles.labelText, { color: colors.textSecondary }]}>Hora de entreno</Text>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.elevated || colors.background, color: colors.text }]}
                  placeholder="Ej: 07:00 AM"
                  placeholderTextColor={colors.textMuted}
                  value={trainingTime}
                  onChangeText={setTrainingTime}
                />
              </View>
              <View style={styles.inputGroup}>
                <View style={styles.inputLabel}>
                  <Timer size={14} color={colors.orange} />
                  <Text style={[styles.labelText, { color: colors.textSecondary }]}>Duración (min)</Text>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.elevated || colors.background, color: colors.text }]}
                  placeholder="60"
                  placeholderTextColor={colors.textMuted}
                  value={trainingDuration}
                  onChangeText={setTrainingDuration}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            <View style={{ marginTop: 12 }}>
              <View style={styles.inputLabel}>
                <Dumbbell size={14} color={colors.tint} />
                <Text style={[styles.labelText, { color: colors.textSecondary }]}>Tipo de entreno</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.phaseRow}>
                {['Pesas', 'Funcional', 'CrossFit', 'Calistenia', 'Cardio', 'Mixto', 'Otro'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.phaseChip,
                      { backgroundColor: colors.elevated || colors.background },
                      trainingType === type && { backgroundColor: colors.tint },
                    ]}
                    onPress={() => setTrainingType(trainingType === type ? '' : type)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.phaseChipText,
                      { color: colors.textSecondary },
                      trainingType === type && { color: '#fff' },
                    ]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <Text style={[styles.scheduleHint, { color: colors.textMuted }]}>
              Esto permite determinar las comidas pre y post entreno
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Actividad física</Text>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Dumbbell size={14} color={colors.tint} />
                <Text style={[styles.labelText, { color: colors.textSecondary }]}>Cardio (min)</Text>
              </View>
              <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.text }]} placeholder="30" placeholderTextColor={colors.textMuted} value={cardioMinutes} onChangeText={setCardioMinutes} keyboardType="number-pad" />
            </View>
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Footprints size={14} color={colors.textSecondary} />
                <Text style={[styles.labelText, { color: colors.textSecondary }]}>Pasos</Text>
              </View>
              <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.text }]} placeholder="10000" placeholderTextColor={colors.textMuted} value={stepsCount} onChangeText={setStepsCount} keyboardType="number-pad" />
            </View>
          </View>
          <View style={{ marginTop: 12 }}>
            <View style={styles.inputLabel}>
              <Zap size={14} color={Colors.light.orange} />
              <Text style={[styles.labelText, { color: colors.textSecondary }]}>Tipo de cardio</Text>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="Ej: caminata, bicicleta, elíptica..."
              placeholderTextColor={colors.textMuted}
              value={cardioType}
              onChangeText={setCardioType}
            />
          </View>

          <RatingRow
            icon={<Dumbbell size={14} color={Colors.light.tint} />}
            label="Rendimiento entreno"
            value={trainingPerformance}
            onChange={setTrainingPerformance}
          />

          <RatingRow
            icon={<Heart size={14} color={Colors.light.red} />}
            label="Dolor muscular"
            value={muscleSoreness}
            onChange={setMuscleSoreness}
            inverted
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Bienestar</Text>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Moon size={14} color={colors.mint} />
                <Text style={[styles.labelText, { color: colors.textSecondary }]}>Horas sueño</Text>
              </View>
              <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.text }]} placeholder="7.5" placeholderTextColor={colors.textMuted} value={sleepHours} onChangeText={setSleepHours} keyboardType="decimal-pad" />
            </View>
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Droplets size={14} color={colors.cyan} />
                <Text style={[styles.labelText, { color: colors.textSecondary }]}>Agua (L)</Text>
              </View>
              <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.text }]} placeholder="3.0" placeholderTextColor={colors.textMuted} value={waterIntake} onChangeText={setWaterIntake} keyboardType="decimal-pad" />
            </View>
          </View>

          <RatingRow
            icon={<Moon size={14} color={Colors.light.mint} />}
            label="Calidad del sueño"
            value={sleepQuality}
            onChange={setSleepQuality}
          />

          <RatingRow
            icon={<Smile size={14} color={Colors.light.orange} />}
            label="Estado de ánimo"
            value={mood}
            onChange={setMood}
          />

          <RatingRow
            icon={<Zap size={14} color={Colors.light.orange} />}
            label="Nivel de energía"
            value={energyLevel}
            onChange={setEnergyLevel}
          />

          <RatingRow
            icon={<Brain size={14} color={Colors.light.red} />}
            label="Nivel de estrés"
            value={stressLevel}
            onChange={setStressLevel}
            inverted
          />

          <RatingRow
            icon={<Heart size={14} color={Colors.light.mint} />}
            label="Salud digestiva"
            value={digestiveHealth}
            onChange={setDigestiveHealth}
          />

          <RatingRow
            icon={<Droplets size={14} color={Colors.light.cyan} />}
            label="Hinchazón / Bloating"
            value={bloating}
            onChange={setBloating}
            inverted
          />

          {isFemale && (
            <View style={{ marginTop: 16 }}>
              <View style={styles.inputLabel}>
                <Heart size={14} color={Colors.light.red} />
                <Text style={[styles.labelText, { color: colors.textSecondary }]}>Fase menstrual</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.phaseRow}>
                {['Folicular', 'Ovulación', 'Lútea', 'Menstruación', 'N/A'].map((phase) => (
                  <TouchableOpacity
                    key={phase}
                    style={[
                      styles.phaseChip,
                      { backgroundColor: colors.card },
                      menstrualPhase === phase && { backgroundColor: colors.tint },
                    ]}
                    onPress={() => setMenstrualPhase(phase)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.phaseChipText,
                      { color: colors.textSecondary },
                      menstrualPhase === phase && { color: '#fff' },
                    ]}>{phase}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notas</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="Observaciones del alumno..."
            placeholderTextColor={colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <Text style={[styles.labelText, { marginTop: 14, marginBottom: 6, color: colors.textSecondary }]}>Feedback del coach</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="Tu evaluación y recomendaciones..."
            placeholderTextColor={colors.textMuted}
            value={coachFeedback}
            onChangeText={setCoachFeedback}
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.tint }, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          <Save size={18} color="#000" />
          <Text style={styles.saveText}>{isSaving ? 'Guardando...' : 'Guardar Check-in'}</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showGuideModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Guía Parrillo 9 pliegues</Text>
              <TouchableOpacity onPress={() => setShowGuideModal(false)}>
                <X size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              <Text style={[styles.guideIntro, { color: colors.textSecondary }]}>
                El método Parrillo utiliza 9 sitios de medición con calibre (caliper) para estimar el % de grasa corporal. Use siempre el mismo lado del cuerpo y mida 2-3 veces cada sitio para mayor precisión.
              </Text>
              {SKINFOLD_KEYS.map((key) => {
                const label = SKINFOLD_LABELS[key];
                return (
                  <View key={key} style={[styles.guideItem, { borderBottomColor: colors.separator }]}>
                    <Text style={[styles.guideItemTitle, { color: colors.text }]}>{label.es}</Text>
                    <Text style={[styles.guideItemHint, { color: colors.textMuted }]}>{label.hint}</Text>
                  </View>
                );
              })}
              <View style={styles.guideFooter}>
                <Text style={[styles.guideFooterText, { color: colors.textMuted }]}>
                  Consejo: mida siempre en las mismas condiciones (hora, hidratación, lado del cuerpo) para asegurar consistencia entre check-ins.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function RatingRow({
  icon,
  label,
  value,
  onChange,
  inverted,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (v: number) => void;
  inverted?: boolean;
}) {
  const getColor = (val: number, active: boolean) => {
    if (!active) return Colors.light.textMuted;
    if (inverted) {
      if (val <= 2) return Colors.light.green;
      if (val === 3) return Colors.light.orange;
      return Colors.light.red;
    }
    if (val <= 2) return Colors.light.red;
    if (val === 3) return Colors.light.orange;
    return Colors.light.green;
  };

  return (
    <View style={ratingStyles.container}>
      <View style={ratingStyles.labelRow}>
        {icon}
        <Text style={ratingStyles.label}>{label}</Text>
      </View>
      <View style={ratingStyles.row}>
        {[1, 2, 3, 4, 5].map((val) => (
          <TouchableOpacity
            key={val}
            style={[
              ratingStyles.btn,
              value === val && {
                backgroundColor: getColor(val, true) + '22',
                borderColor: getColor(val, true),
              },
            ]}
            onPress={() => onChange(val)}
          >
            <Text
              style={[
                ratingStyles.btnText,
                value === val && { color: getColor(val, true), fontWeight: '700' as const },
              ]}
            >
              {val}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const ratingStyles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  labelRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    fontWeight: '400' as const,
  },
  row: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.light.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  btnText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.light.textMuted,
  },
});

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
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  photosRow: {
    flexDirection: 'row' as const,
  },
  photoItem: {
    position: 'relative' as const,
    marginRight: 10,
  },
  photo: {
    width: 90,
    height: 120,
    borderRadius: 10,
  },
  removePhoto: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoBtn: {
    width: 90,
    height: 120,
    borderRadius: 10,
    backgroundColor: Colors.light.card,
    borderWidth: 1.5,
    borderColor: Colors.light.separator,
    borderStyle: 'dashed' as const,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  addPhotoText: {
    fontSize: 12,
    color: Colors.light.tint,
    fontWeight: '500' as const,
  },
  inputRow: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputGroupThird: {
    flex: 1,
  },
  inputLabel: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  labelText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    fontWeight: '400' as const,
  },
  smallLabel: {
    fontSize: 13,
    color: Colors.light.textMuted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.light.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 17,
    color: Colors.light.text,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top' as const,
  },
  macroToggles: {
    marginTop: 16,
    gap: 8,
  },
  macroToggleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  macroToggleLabel: {
    fontSize: 15,
    fontWeight: '400' as const,
  },
  phaseRow: {
    gap: 8,
    paddingVertical: 4,
  },
  phaseChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  phaseChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  saveButton: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    height: 50,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#fff',
  },
  bottomSpacer: {
    height: 40,
  },
  trainingScheduleCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  scheduleHint: {
    fontSize: 12,
    fontStyle: 'italic' as const,
    marginTop: 12,
    textAlign: 'center' as const,
  },
  sexBadge: {
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  sexBadgeText: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  methodSelector: {
    flexDirection: 'row' as const,
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  methodTabText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  methodTabTextActive: {
    fontWeight: '700' as const,
  },
  methodContent: {
    marginTop: 16,
  },
  methodBadgeRow: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 12,
  },
  methodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  methodBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  warningBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '500' as const,
    flex: 1,
  },
  caliperSubtitle: {
    fontSize: 13,
    marginBottom: 14,
  },
  skinfoldsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  skinfoldItem: {
    width: '47%' as const,
  },
  skinfoldLabelRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  skinfoldLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  skinfoldInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 16,
  },
  skinfoldWarning: {
    fontSize: 10,
    marginTop: 2,
  },
  resultCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  resultRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  resultValue: {
    fontSize: 28,
    fontWeight: '800' as const,
  },
  resultLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  resultDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
  },
  resultVersion: {
    fontSize: 10,
    textAlign: 'center' as const,
    marginTop: 10,
  },
  incompleteHint: {
    fontSize: 12,
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  modalScroll: {
    maxHeight: 500,
  },
  guideIntro: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  guideItem: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  guideItemTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  guideItemHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  guideFooter: {
    marginTop: 16,
    paddingTop: 12,
  },
  guideFooterText: {
    fontSize: 12,
    fontStyle: 'italic' as const,
    lineHeight: 18,
  },
});
