import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Animated,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import {
  Search,
  Plus,
  X,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Instagram,
  Facebook,
  Heart,
  AlertTriangle,
  Pill,
  Briefcase,
  Phone,
  Droplets,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useStudents, useFilteredStudents } from '@/contexts/StudentsContext';
import StudentCard from '@/components/StudentCard';
import { ActivityLevel, FitnessGoal, ACTIVITY_LABELS, GOAL_LABELS } from '@/types';
import { calculateBMR, calculateTDEE } from '@/utils/calculations';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: string;
  colors: Record<string, string>;
}

function CollapsibleSection({ title, icon, expanded, onToggle, children, badge, colors }: CollapsibleSectionProps) {
  return (
    <View style={[sectionStyles.container, { borderColor: colors.cardBorder }]}>
      <TouchableOpacity
        style={[sectionStyles.header, { backgroundColor: colors.card }]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={sectionStyles.headerLeft}>
          {icon}
          <Text style={[sectionStyles.headerTitle, { color: colors.text }]}>{title}</Text>
          {badge ? (
            <View style={[sectionStyles.badge, { backgroundColor: colors.gold + '22' }]}>
              <Text style={[sectionStyles.badgeText, { color: colors.gold }]}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {expanded ? (
          <ChevronUp size={18} color={colors.textMuted} />
        ) : (
          <ChevronDown size={18} color={colors.textMuted} />
        )}
      </TouchableOpacity>
      {expanded && (
        <View style={[sectionStyles.content, { backgroundColor: colors.card }]}>
          {children}
        </View>
      )}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: {
    borderRadius: 14,
    overflow: 'hidden' as const,
    borderWidth: 1,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
  colors,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
  colors: Record<string, string>;
}) {
  const [text, setText] = useState<string>('');

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onAdd(trimmed);
      setText('');
    }
  }, [text, tags, onAdd]);

  return (
    <View>
      <View style={[tagStyles.inputRow, { backgroundColor: colors.elevated, borderColor: colors.cardBorder }]}>
        <TextInput
          style={[tagStyles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
        />
        <TouchableOpacity
          onPress={handleSubmit}
          style={[tagStyles.addBtn, { backgroundColor: colors.gold + '20' }]}
        >
          <Plus size={16} color={colors.gold} />
        </TouchableOpacity>
      </View>
      {tags.length > 0 && (
        <View style={tagStyles.tagsWrap}>
          {tags.map((tag, i) => (
            <View key={`${tag}-${i}`} style={[tagStyles.tag, { backgroundColor: colors.elevated }]}>
              <Text style={[tagStyles.tagText, { color: colors.text }]}>{tag}</Text>
              <TouchableOpacity onPress={() => onRemove(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={12} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const tagStyles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderRadius: 10,
    borderWidth: 1,
    paddingLeft: 12,
    paddingRight: 4,
    height: 42,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  tagsWrap: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginTop: 10,
  },
  tag: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
});

export default function StudentsScreen() {
  const [search, setSearch] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const filteredStudents = useFilteredStudents(search);
  const { addStudent } = useStudents();
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [newName, setNewName] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newAge, setNewAge] = useState<string>('');
  const [newGender, setNewGender] = useState<'male' | 'female'>('male');
  const [newHeight, setNewHeight] = useState<string>('');
  const [newWeight, setNewWeight] = useState<string>('');
  const [newGoalWeight, setNewGoalWeight] = useState<string>('');
  const [newActivity, setNewActivity] = useState<ActivityLevel>('moderate');
  const [newGoal, setNewGoal] = useState<FitnessGoal>('lose_fat');
  const [newNotes, setNewNotes] = useState<string>('');
  const [newBodyFat, setNewBodyFat] = useState<string>('');

  const [newInstagram, setNewInstagram] = useState<string>('');
  const [newFacebook, setNewFacebook] = useState<string>('');
  const [newTiktok, setNewTiktok] = useState<string>('');

  const [newOccupation, setNewOccupation] = useState<string>('');
  const [newEmergencyName, setNewEmergencyName] = useState<string>('');
  const [newEmergencyPhone, setNewEmergencyPhone] = useState<string>('');
  const [newEmergencyRelation, setNewEmergencyRelation] = useState<string>('');

  const [newMedicalConditions, setNewMedicalConditions] = useState<string[]>([]);
  const [newAllergies, setNewAllergies] = useState<string[]>([]);
  const [newInjuries, setNewInjuries] = useState<string[]>([]);
  const [newMedications, setNewMedications] = useState<string[]>([]);
  const [newBloodType, setNewBloodType] = useState<string>('');

  const [socialExpanded, setSocialExpanded] = useState<boolean>(false);
  const [medicalExpanded, setMedicalExpanded] = useState<boolean>(false);
  const [emergencyExpanded, setEmergencyExpanded] = useState<boolean>(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const resetForm = useCallback(() => {
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewAge('');
    setNewGender('male');
    setNewHeight('');
    setNewWeight('');
    setNewGoalWeight('');
    setNewActivity('moderate');
    setNewGoal('lose_fat');
    setNewNotes('');
    setNewBodyFat('');
    setNewInstagram('');
    setNewFacebook('');
    setNewTiktok('');
    setNewOccupation('');
    setNewEmergencyName('');
    setNewEmergencyPhone('');
    setNewEmergencyRelation('');
    setNewMedicalConditions([]);
    setNewAllergies([]);
    setNewInjuries([]);
    setNewMedications([]);
    setNewBloodType('');
    setSocialExpanded(false);
    setMedicalExpanded(false);
    setEmergencyExpanded(false);
  }, []);

  const handleAddStudent = useCallback(async () => {
    if (!newName.trim() || !newWeight.trim() || !newHeight.trim() || !newAge.trim()) {
      Alert.alert('Error', 'Completa los campos obligatorios (nombre, edad, altura, peso)');
      return;
    }

    const weight = parseFloat(newWeight);
    const height = parseFloat(newHeight);
    const age = parseInt(newAge, 10);
    const bodyFat = newBodyFat ? parseFloat(newBodyFat) : (newGender === 'male' ? 15 : 25);
    const bmr = calculateBMR(weight, bodyFat);
    const tdee = calculateTDEE(bmr, newActivity);

    const emergencyContact = newEmergencyName.trim()
      ? {
          name: newEmergencyName.trim(),
          phone: newEmergencyPhone.trim(),
          relationship: newEmergencyRelation.trim(),
        }
      : undefined;

    await addStudent({
      name: newName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim() || undefined,
      instagram: newInstagram.trim() || undefined,
      facebook: newFacebook.trim() || undefined,
      tiktok: newTiktok.trim() || undefined,
      age,
      gender: newGender,
      height,
      weight,
      goalWeight: newGoalWeight ? parseFloat(newGoalWeight) : undefined,
      activityLevel: newActivity,
      goal: newGoal,
      notes: newNotes.trim(),
      bmr,
      tdee,
      bodyFatPercentage: newBodyFat ? parseFloat(newBodyFat) : undefined,
      occupation: newOccupation.trim() || undefined,
      emergencyContact,
      medicalConditions: newMedicalConditions.length > 0 ? newMedicalConditions : undefined,
      allergies: newAllergies.length > 0 ? newAllergies : undefined,
      injuries: newInjuries.length > 0 ? newInjuries : undefined,
      medications: newMedications.length > 0 ? newMedications : undefined,
      bloodType: newBloodType || undefined,
    });

    resetForm();
    setShowAddModal(false);
  }, [
    newName, newEmail, newPhone, newAge, newGender, newHeight, newWeight,
    newGoalWeight, newActivity, newGoal, newNotes, newBodyFat, newInstagram,
    newFacebook, newTiktok, newOccupation, newEmergencyName, newEmergencyPhone,
    newEmergencyRelation, newMedicalConditions, newAllergies, newInjuries,
    newMedications, newBloodType, addStudent, resetForm,
  ]);

  const socialCount = [newInstagram, newFacebook, newTiktok].filter((s) => s.trim()).length;
  const medicalCount = newMedicalConditions.length + newAllergies.length + newInjuries.length + newMedications.length + (newBloodType ? 1 : 0);
  const emergencyCount = newEmergencyName.trim() ? 1 : 0;

  const renderStudent = useCallback(({ item, index }: { item: typeof filteredStudents[0]; index: number }) => (
    <View
      style={[
        styles.cardWrapper,
        { backgroundColor: colors.card },
        index === 0 && styles.cardFirst,
        index === filteredStudents.length - 1 && styles.cardLast,
      ]}
    >
      {index > 0 && <View style={[styles.cardSeparator, { backgroundColor: colors.separator }]} />}
      <StudentCard
        student={item}
        onPress={() => router.push(`/student/${item.id}`)}
      />
    </View>
  ), [colors, filteredStudents.length]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Clientes',
          headerStyle: { backgroundColor: colors.headerBg },
          headerTintColor: colors.gold,
          headerTitleStyle: { color: colors.text, fontWeight: '600' as const },
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
              <Plus size={22} color={colors.gold} />
            </TouchableOpacity>
          ),
        }}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar clientes..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            testID="search-input"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={15} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.countText, { color: colors.textMuted }]}>{filteredStudents.length} clientes</Text>

        <FlatList
          data={filteredStudents}
          renderItem={renderStudent}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.card }]}>
                <UserPlus size={32} color={colors.gold} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin clientes aún</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Añade tu primer cliente para comenzar</Text>
            </View>
          }
        />
      </Animated.View>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.secondaryBg }]}>
              <View style={[styles.modalHandle, { backgroundColor: colors.fill }]} />
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Nuevo Cliente</Text>
                  <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>Completa el perfil del atleta</Text>
                </View>
                <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
                  <X size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">

                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>NOMBRE *</Text>
                <View style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <TextInput
                    style={[styles.modalInput, { color: colors.text }]}
                    placeholder="Nombre completo"
                    placeholderTextColor={colors.textMuted}
                    value={newName}
                    onChangeText={setNewName}
                  />
                </View>

                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>CONTACTO</Text>
                <View style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <TextInput
                    style={[styles.modalInput, { color: colors.text }]}
                    placeholder="Email"
                    placeholderTextColor={colors.textMuted}
                    value={newEmail}
                    onChangeText={setNewEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <View style={[styles.inputSep, { backgroundColor: colors.separator }]} />
                  <TextInput
                    style={[styles.modalInput, { color: colors.text }]}
                    placeholder="Teléfono"
                    placeholderTextColor={colors.textMuted}
                    value={newPhone}
                    onChangeText={setNewPhone}
                    keyboardType="phone-pad"
                  />
                </View>

                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>DATOS FÍSICOS *</Text>
                <View style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.inlineRow}>
                    <Text style={[styles.inlineLabel, { color: colors.text }]}>Edad</Text>
                    <TextInput
                      style={[styles.inlineInput, { color: colors.textTertiary }]}
                      placeholder="25"
                      placeholderTextColor={colors.textMuted}
                      value={newAge}
                      onChangeText={setNewAge}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputSep, { backgroundColor: colors.separator }]} />
                  <View style={styles.inlineRow}>
                    <Text style={[styles.inlineLabel, { color: colors.text }]}>Sexo</Text>
                    <View style={[styles.segmentControl, { backgroundColor: colors.elevated }]}>
                      <TouchableOpacity
                        style={[styles.segmentBtn, newGender === 'male' && { backgroundColor: colors.gold }]}
                        onPress={() => setNewGender('male')}
                      >
                        <Text style={[styles.segmentText, { color: colors.textMuted }, newGender === 'male' && styles.segmentTextActive]}>M</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.segmentBtn, newGender === 'female' && { backgroundColor: colors.gold }]}
                        onPress={() => setNewGender('female')}
                      >
                        <Text style={[styles.segmentText, { color: colors.textMuted }, newGender === 'female' && styles.segmentTextActive]}>F</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={[styles.inputSep, { backgroundColor: colors.separator }]} />
                  <View style={styles.inlineRow}>
                    <Text style={[styles.inlineLabel, { color: colors.text }]}>Altura (cm)</Text>
                    <TextInput
                      style={[styles.inlineInput, { color: colors.textTertiary }]}
                      placeholder="175"
                      placeholderTextColor={colors.textMuted}
                      value={newHeight}
                      onChangeText={setNewHeight}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputSep, { backgroundColor: colors.separator }]} />
                  <View style={styles.inlineRow}>
                    <Text style={[styles.inlineLabel, { color: colors.text }]}>Peso (kg)</Text>
                    <TextInput
                      style={[styles.inlineInput, { color: colors.textTertiary }]}
                      placeholder="80"
                      placeholderTextColor={colors.textMuted}
                      value={newWeight}
                      onChangeText={setNewWeight}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputSep, { backgroundColor: colors.separator }]} />
                  <View style={styles.inlineRow}>
                    <Text style={[styles.inlineLabel, { color: colors.text }]}>Grasa corporal %</Text>
                    <TextInput
                      style={[styles.inlineInput, { color: colors.textTertiary }]}
                      placeholder="15"
                      placeholderTextColor={colors.textMuted}
                      value={newBodyFat}
                      onChangeText={setNewBodyFat}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputSep, { backgroundColor: colors.separator }]} />
                  <View style={styles.inlineRow}>
                    <Text style={[styles.inlineLabel, { color: colors.text }]}>Peso objetivo (kg)</Text>
                    <TextInput
                      style={[styles.inlineInput, { color: colors.textTertiary }]}
                      placeholder="75"
                      placeholderTextColor={colors.textMuted}
                      value={newGoalWeight}
                      onChangeText={setNewGoalWeight}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>OCUPACIÓN</Text>
                <View style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.inlineRow}>
                    <Briefcase size={16} color={colors.textMuted} style={{ marginRight: 10 }} />
                    <TextInput
                      style={[styles.modalInputFlex, { color: colors.text }]}
                      placeholder="Ej: Ingeniero, estudiante, ama de casa..."
                      placeholderTextColor={colors.textMuted}
                      value={newOccupation}
                      onChangeText={setNewOccupation}
                    />
                  </View>
                </View>

                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>NIVEL DE ACTIVIDAD</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1 }, newActivity === level && { backgroundColor: colors.gold, borderColor: colors.gold }]}
                      onPress={() => setNewActivity(level)}
                    >
                      <Text style={[styles.chipText, { color: colors.textMuted }, newActivity === level && styles.chipTextActive]}>
                        {ACTIVITY_LABELS[level]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>OBJETIVO</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {(Object.keys(GOAL_LABELS) as FitnessGoal[]).map((goal) => (
                    <TouchableOpacity
                      key={goal}
                      style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1 }, newGoal === goal && { backgroundColor: colors.gold, borderColor: colors.gold }]}
                      onPress={() => setNewGoal(goal)}
                    >
                      <Text style={[styles.chipText, { color: colors.textMuted }, newGoal === goal && styles.chipTextActive]}>
                        {GOAL_LABELS[goal]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <CollapsibleSection
                  title="Redes Sociales"
                  icon={<Instagram size={18} color={colors.gold} />}
                  expanded={socialExpanded}
                  onToggle={() => setSocialExpanded(!socialExpanded)}
                  badge={socialCount > 0 ? `${socialCount}` : undefined}
                  colors={colors}
                >
                  <View style={{ gap: 12 }}>
                    <View style={[styles.socialRow, { backgroundColor: colors.elevated, borderColor: colors.cardBorder }]}>
                      <View style={[styles.socialIconWrap, { backgroundColor: '#E1306C15' }]}>
                        <Instagram size={16} color="#E1306C" />
                      </View>
                      <TextInput
                        style={[styles.socialInput, { color: colors.text }]}
                        placeholder="@usuario_instagram"
                        placeholderTextColor={colors.textMuted}
                        value={newInstagram}
                        onChangeText={setNewInstagram}
                        autoCapitalize="none"
                      />
                    </View>
                    <View style={[styles.socialRow, { backgroundColor: colors.elevated, borderColor: colors.cardBorder }]}>
                      <View style={[styles.socialIconWrap, { backgroundColor: '#1877F215' }]}>
                        <Facebook size={16} color="#1877F2" />
                      </View>
                      <TextInput
                        style={[styles.socialInput, { color: colors.text }]}
                        placeholder="usuario.facebook"
                        placeholderTextColor={colors.textMuted}
                        value={newFacebook}
                        onChangeText={setNewFacebook}
                        autoCapitalize="none"
                      />
                    </View>
                    <View style={[styles.socialRow, { backgroundColor: colors.elevated, borderColor: colors.cardBorder }]}>
                      <View style={[styles.socialIconWrap, { backgroundColor: '#00000010' }]}>
                        <Text style={{ fontSize: 14, fontWeight: '800' as const }}>T</Text>
                      </View>
                      <TextInput
                        style={[styles.socialInput, { color: colors.text }]}
                        placeholder="@usuario_tiktok"
                        placeholderTextColor={colors.textMuted}
                        value={newTiktok}
                        onChangeText={setNewTiktok}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>
                </CollapsibleSection>

                <CollapsibleSection
                  title="Historial Médico"
                  icon={<Heart size={18} color={colors.danger} />}
                  expanded={medicalExpanded}
                  onToggle={() => setMedicalExpanded(!medicalExpanded)}
                  badge={medicalCount > 0 ? `${medicalCount}` : undefined}
                  colors={colors}
                >
                  <View style={{ gap: 16 }}>
                    <View>
                      <View style={styles.medicalLabelRow}>
                        <AlertTriangle size={14} color={colors.warning} />
                        <Text style={[styles.medicalLabel, { color: colors.text }]}>Patologías / Condiciones</Text>
                      </View>
                      <Text style={[styles.medicalHint, { color: colors.textMuted }]}>
                        Diabetes, hipertensión, hipotiroidismo, etc.
                      </Text>
                      <TagInput
                        tags={newMedicalConditions}
                        onAdd={(t) => setNewMedicalConditions([...newMedicalConditions, t])}
                        onRemove={(i) => setNewMedicalConditions(newMedicalConditions.filter((_, idx) => idx !== i))}
                        placeholder="Añadir condición..."
                        colors={colors}
                      />
                    </View>

                    <View>
                      <View style={styles.medicalLabelRow}>
                        <AlertTriangle size={14} color={colors.orange} />
                        <Text style={[styles.medicalLabel, { color: colors.text }]}>Alergias Alimentarias</Text>
                      </View>
                      <Text style={[styles.medicalHint, { color: colors.textMuted }]}>
                        Lactosa, gluten, frutos secos, mariscos, etc.
                      </Text>
                      <TagInput
                        tags={newAllergies}
                        onAdd={(t) => setNewAllergies([...newAllergies, t])}
                        onRemove={(i) => setNewAllergies(newAllergies.filter((_, idx) => idx !== i))}
                        placeholder="Añadir alergia..."
                        colors={colors}
                      />
                    </View>

                    <View>
                      <View style={styles.medicalLabelRow}>
                        <AlertTriangle size={14} color={colors.red} />
                        <Text style={[styles.medicalLabel, { color: colors.text }]}>Lesiones</Text>
                      </View>
                      <Text style={[styles.medicalHint, { color: colors.textMuted }]}>
                        Lesiones actuales o pasadas relevantes al entrenamiento.
                      </Text>
                      <TagInput
                        tags={newInjuries}
                        onAdd={(t) => setNewInjuries([...newInjuries, t])}
                        onRemove={(i) => setNewInjuries(newInjuries.filter((_, idx) => idx !== i))}
                        placeholder="Añadir lesión..."
                        colors={colors}
                      />
                    </View>

                    <View>
                      <View style={styles.medicalLabelRow}>
                        <Pill size={14} color={colors.blue} />
                        <Text style={[styles.medicalLabel, { color: colors.text }]}>Medicamentos</Text>
                      </View>
                      <Text style={[styles.medicalHint, { color: colors.textMuted }]}>
                        Medicamentos que toma actualmente.
                      </Text>
                      <TagInput
                        tags={newMedications}
                        onAdd={(t) => setNewMedications([...newMedications, t])}
                        onRemove={(i) => setNewMedications(newMedications.filter((_, idx) => idx !== i))}
                        placeholder="Añadir medicamento..."
                        colors={colors}
                      />
                    </View>

                    <View>
                      <View style={styles.medicalLabelRow}>
                        <Droplets size={14} color={colors.red} />
                        <Text style={[styles.medicalLabel, { color: colors.text }]}>Tipo de Sangre</Text>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.bloodTypeRow}>
                          {BLOOD_TYPES.map((bt) => (
                            <TouchableOpacity
                              key={bt}
                              style={[
                                styles.bloodTypeChip,
                                { backgroundColor: colors.elevated, borderColor: colors.cardBorder, borderWidth: 1 },
                                newBloodType === bt && { backgroundColor: colors.danger + '20', borderColor: colors.danger },
                              ]}
                              onPress={() => setNewBloodType(newBloodType === bt ? '' : bt)}
                            >
                              <Text
                                style={[
                                  styles.bloodTypeText,
                                  { color: colors.textMuted },
                                  newBloodType === bt && { color: colors.danger, fontWeight: '700' as const },
                                ]}
                              >
                                {bt}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  </View>
                </CollapsibleSection>

                <CollapsibleSection
                  title="Contacto de Emergencia"
                  icon={<Phone size={18} color={colors.success} />}
                  expanded={emergencyExpanded}
                  onToggle={() => setEmergencyExpanded(!emergencyExpanded)}
                  badge={emergencyCount > 0 ? '1' : undefined}
                  colors={colors}
                >
                  <View style={{ gap: 12 }}>
                    <View style={[styles.socialRow, { backgroundColor: colors.elevated, borderColor: colors.cardBorder }]}>
                      <TextInput
                        style={[styles.emergencyInput, { color: colors.text }]}
                        placeholder="Nombre del contacto"
                        placeholderTextColor={colors.textMuted}
                        value={newEmergencyName}
                        onChangeText={setNewEmergencyName}
                      />
                    </View>
                    <View style={[styles.socialRow, { backgroundColor: colors.elevated, borderColor: colors.cardBorder }]}>
                      <TextInput
                        style={[styles.emergencyInput, { color: colors.text }]}
                        placeholder="Teléfono de emergencia"
                        placeholderTextColor={colors.textMuted}
                        value={newEmergencyPhone}
                        onChangeText={setNewEmergencyPhone}
                        keyboardType="phone-pad"
                      />
                    </View>
                    <View style={[styles.socialRow, { backgroundColor: colors.elevated, borderColor: colors.cardBorder }]}>
                      <TextInput
                        style={[styles.emergencyInput, { color: colors.text }]}
                        placeholder="Relación (madre, esposa, hermano...)"
                        placeholderTextColor={colors.textMuted}
                        value={newEmergencyRelation}
                        onChangeText={setNewEmergencyRelation}
                      />
                    </View>
                  </View>
                </CollapsibleSection>

                <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 20 }]}>NOTAS ADICIONALES</Text>
                <View style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <TextInput
                    style={[styles.modalInput, styles.textArea, { color: colors.text }]}
                    placeholder="Historial deportivo, preferencias, horarios..."
                    placeholderTextColor={colors.textMuted}
                    value={newNotes}
                    onChangeText={setNewNotes}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.gold }]} onPress={handleAddStudent} activeOpacity={0.8}>
                  <UserPlus size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.saveText}>Añadir Cliente</Text>
                </TouchableOpacity>

                <View style={styles.modalBottomSpacer} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  addButton: {
    marginRight: 4,
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 40,
    marginHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
  },
  countText: {
    fontSize: 13,
    marginTop: 12,
    marginBottom: 4,
    marginHorizontal: 16,
  },
  listContent: {
    paddingBottom: 20,
    marginHorizontal: 16,
  },
  cardWrapper: {
    overflow: 'hidden' as const,
  },
  cardFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardLast: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  cardSeparator: {
    height: 0.5,
    marginLeft: 76,
  },
  emptyContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingTop: 80,
    gap: 12,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  emptyText: {
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end' as const,
  },
  modalContainer: {
    maxHeight: '92%',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 16,
    maxHeight: '100%',
  },
  modalHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center' as const,
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
  },
  modalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  modalScroll: {
    flexGrow: 0,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    marginBottom: 8,
    marginTop: 20,
    marginLeft: 4,
    letterSpacing: 1,
  },
  inputGroup: {
    borderRadius: 14,
    overflow: 'hidden' as const,
    borderWidth: 1,
  },
  modalInput: {
    paddingHorizontal: 16,
    height: 48,
    fontSize: 16,
  },
  modalInputFlex: {
    flex: 1,
    fontSize: 15,
    height: 48,
  },
  inputSep: {
    height: 0.5,
    marginLeft: 16,
  },
  inlineRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    height: 48,
  },
  inlineLabel: {
    flex: 1,
    fontSize: 16,
  },
  inlineInput: {
    fontSize: 16,
    textAlign: 'right' as const,
    minWidth: 80,
  },
  segmentControl: {
    flexDirection: 'row' as const,
    borderRadius: 8,
    padding: 2,
  },
  segmentBtn: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 6,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  textArea: {
    height: 80,
    paddingTop: 14,
    textAlignVertical: 'top' as const,
  },
  chipScroll: {
    flexDirection: 'row' as const,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  socialRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  socialIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 10,
  },
  socialInput: {
    flex: 1,
    fontSize: 15,
  },
  emergencyInput: {
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 4,
  },
  medicalLabelRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 4,
  },
  medicalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  medicalHint: {
    fontSize: 12,
    marginBottom: 8,
  },
  bloodTypeRow: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  bloodTypeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bloodTypeText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  saveButton: {
    borderRadius: 14,
    height: 52,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: 28,
  },
  saveText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  modalBottomSpacer: {
    height: 40,
  },
});
