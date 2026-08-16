export interface Coach {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  specialties: string[];
  subscription: SubscriptionTier;
  studentsCount: number;
  createdAt: string;
}

export type SubscriptionTier = 'free' | 'weekly' | 'monthly' | 'annual';

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  avatar?: string;
  age: number;
  gender: 'male' | 'female';
  dateOfBirth?: string;
  height: number;
  weight: number;
  goalWeight?: number;
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
  notes: string;
  occupation?: string;
  emergencyContact?: EmergencyContact;
  medicalConditions?: string[];
  allergies?: string[];
  injuries?: string[];
  medications?: string[];
  bloodType?: string;
  checkIns: CheckIn[];
  nutritionPlan?: NutritionPlan;
  trainingPlan?: TrainingPlan;
  documents?: StudentDocument[];
  folders?: StudentFolder[];
  dietHistory?: DietHistoryEntry[];
  createdAt: string;
  bmr?: number;
  tdee?: number;
  bodyFatPercentage?: number;
  stressLevel?: number;
  adherenceScore?: number;
}

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export type FitnessGoal = 'lose_fat' | 'build_muscle' | 'maintain' | 'recomp' | 'competition';

export type BodyFatMethod = 'bia' | 'parrillo_9_site';

export interface Skinfolds9 {
  chest: number;
  abdomen: number;
  thigh: number;
  triceps: number;
  subscapular: number;
  suprailiac: number;
  lowerBack: number;
  calf: number;
  biceps: number;
}

export interface CheckIn {
  id: string;
  studentId: string;
  date: string;
  weight: number;
  bodyFatPercentage?: number;
  bodyFatMethod?: BodyFatMethod;
  skinfolds9?: Skinfolds9;
  skinfoldSum9?: number;
  measurementDevice?: string;
  measurementNotes?: string;
  calculationVersion?: string;
  sexUsedForCalc?: 'male' | 'female';
  photos: CheckInPhoto[];
  measurements?: Measurements;
  notes: string;
  coachFeedback?: string;
  mood?: number;
  sleepHours?: number;
  sleepQuality?: number;
  waterIntake?: number;
  stressLevel?: number;
  energyLevel?: number;
  digestiveHealth?: number;
  trainingPerformance?: number;
  dietAdherence?: number;
  appetiteLevel?: number;
  cravings?: string;
  supplementAdherence?: number;
  cardioMinutes?: number;
  cardioType?: string;
  bloating?: number;
  muscleSoreness?: number;
  menstrualPhase?: string;
  alcoholDrinks?: number;
  mealsCompleted?: number;
  mealsPlanned?: number;
  proteinHit?: boolean;
  carbsHit?: boolean;
  fatsHit?: boolean;
  cheatMeals?: number;
  stepsCount?: number;
  trainingTime?: string;
  trainingDuration?: number;
  trainingType?: string;
}

export interface CheckInPhoto {
  id: string;
  uri: string;
  pose: 'front' | 'back' | 'side_left' | 'side_right';
  timestamp: string;
}

export interface Measurements {
  chest?: number;
  waist?: number;
  hips?: number;
  bicepLeft?: number;
  bicepRight?: number;
  thighLeft?: number;
  thighRight?: number;
  calfLeft?: number;
  calfRight?: number;
}

export type NutritionUnitSystem = 'metric' | 'imperial';
export type FoodWeightType = 'cooked' | 'dry';
export type MealObjective =
  | 'pre_entreno'
  | 'post_entreno'
  | 'recuperacion'
  | 'sensibilidad_insulina'
  | 'estabilidad_glucemica'
  | 'rendimiento'
  | 'soporte_anabolico'
  | 'saciedad'
  | 'control_inflamatorio'
  | 'densidad_calorica'
  | 'ayuno'
  | 'recarga_glucogeno'
  | 'equilibrio_hormonal'
  | 'sueno';

export const MEAL_OBJECTIVE_LABELS: Record<MealObjective, string> = {
  pre_entreno: 'Pre-entreno',
  post_entreno: 'Post-entreno',
  recuperacion: 'Recuperación',
  sensibilidad_insulina: 'Sensibilidad a la insulina',
  estabilidad_glucemica: 'Estabilidad glucémica',
  rendimiento: 'Rendimiento',
  soporte_anabolico: 'Soporte anabólico',
  saciedad: 'Saciedad',
  control_inflamatorio: 'Control inflamatorio',
  densidad_calorica: 'Densidad calórica',
  ayuno: 'Ayuno',
  recarga_glucogeno: 'Recarga de glucógeno',
  equilibrio_hormonal: 'Equilibrio hormonal',
  sueno: 'Sueño',
};

export interface CardioSection {
  enabled: boolean;
  type: string;
  durationMinutes: number;
  heartRateMin?: number;
  heartRateMax?: number;
  frequencyPerWeek: number;
  timing: 'post_entreno' | 'ayunas' | 'any';
  notes?: string;
}

export interface NutritionPlan {
  id: string;
  studentId: string;
  title?: string;
  currentWeight?: number;
  weeklyGoal?: string;
  metabolicStrategy?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  unitSystem: NutritionUnitSystem;
  meals: Meal[];
  supplements: Supplement[];
  cardio?: CardioSection;
  notes: string;
  createdAt: string;
  updatedAt: string;
  sodiumTarget?: number;
  waterTarget?: number;
  fiberTarget?: number;
  days?: NutritionDay[];
}

export interface NutritionDay {
  id: string;
  dayNumber: number;
  title: string;
  subtitle: string;
  objectives: {
    calories?: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  hydration: {
    waterLiters: string;
    salt: string;
    notes?: string;
  };
  meals: Meal[];
}

export interface Meal {
  id: string;
  name: string;
  time: string;
  foods: FoodItem[];
  objective?: MealObjective;
  objectiveText?: string;
}

export interface FoodItem {
  name: string;
  quantity: number;
  unit: string;
  weightType: FoodWeightType;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface Supplement {
  name: string;
  dosage: string;
  timing: string;
  notes?: string;
}

export interface TrainingPlan {
  id: string;
  studentId: string;
  name: string;
  phase: TrainingPhase;
  weekDays: TrainingDay[];
  notes: string;
  createdAt: string;
}

export type TrainingPhase = 'hypertrophy' | 'strength' | 'peaking' | 'deload' | 'maintenance';

export const TRAINING_PHASE_LABELS: Record<TrainingPhase, string> = {
  hypertrophy: 'Hipertrofia',
  strength: 'Fuerza',
  peaking: 'Pico',
  deload: 'Descarga',
  maintenance: 'Mantenimiento',
};

export interface TrainingDay {
  id: string;
  dayName: string;
  muscleGroups: string[];
  exercises: Exercise[];
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: number;
  rir?: number;
  rpe?: number;
  restSeconds?: number;
  notes?: string;
}

export type DocumentCategory = 'nutrition' | 'training' | 'medical' | 'progress' | 'other';

export interface StudentDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  notes?: string;
  content?: string;
  htmlContent?: string;
  folderId?: string;
  fileUri?: string;
  fileType?: string;
  fileName?: string;
  fileSize?: number;
  isExternalFile?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DietHistoryEntry {
  id: string;
  studentId: string;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  planTitle: string;
  notes?: string;
  changes?: string;
  createdBy: 'coach' | 'ai';
}

export interface StudentFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  nutrition: 'Nutrición',
  training: 'Entrenamiento',
  medical: 'Médico',
  progress: 'Progreso',
  other: 'Otro',
};

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type GoalPhase = 'cutting' | 'bulking' | 'maintenance' | 'peak_week';

export const GOAL_PHASE_LABELS: Record<GoalPhase, string> = {
  cutting: 'Cutting',
  bulking: 'Bulking',
  maintenance: 'Mantenimiento',
  peak_week: 'Peak Week',
};

// ---------------------------------------------------------------------------
// Athlete Memory System — Linear chronological record of every event
// ---------------------------------------------------------------------------

export type MemoryEventType =
  | 'ai_suggestion'
  | 'coach_decision'
  | 'plan_change'
  | 'athlete_agreement'
  | 'checkin_review'
  | 'media_analysis'
  | 'metabolic_analysis'
  | 'supplement_change'
  | 'risk_detected'
  | 'risk_resolved'
  | 'alert_triggered'
  | 'corrective_action'
  | 'test_recommended'
  | 'diet_adjustment'
  | 'coach_note'
  | 'system_event';

export const MEMORY_EVENT_LABELS: Record<MemoryEventType, string> = {
  ai_suggestion: 'Sugerencia IA',
  coach_decision: 'Decisión del coach',
  plan_change: 'Cambio de plan',
  athlete_agreement: 'Acuerdo del atleta',
  checkin_review: 'Revisión de check-in',
  media_analysis: 'Análisis de medios',
  metabolic_analysis: 'Análisis metabólico',
  supplement_change: 'Cambio de suplementos',
  risk_detected: 'Riesgo detectado',
  risk_resolved: 'Riesgo resuelto',
  alert_triggered: 'Alerta disparada',
  corrective_action: 'Acción correctiva',
  test_recommended: 'Prueba recomendada',
  diet_adjustment: 'Ajuste de dieta',
  coach_note: 'Nota del coach',
  system_event: 'Evento del sistema',
};

export const MEMORY_EVENT_ICONS: Record<MemoryEventType, string> = {
  ai_suggestion: '🤖',
  coach_decision: '👤',
  plan_change: '📋',
  athlete_agreement: '🤝',
  checkin_review: '📊',
  media_analysis: '📸',
  metabolic_analysis: '🔬',
  supplement_change: '💊',
  risk_detected: '⚠️',
  risk_resolved: '✅',
  alert_triggered: '🚨',
  corrective_action: '🔧',
  test_recommended: '🩺',
  diet_adjustment: '🥗',
  coach_note: '📝',
  system_event: '⚙️',
};

export interface AthleteMemoryEvent {
  id: string;
  studentId: string;
  type: MemoryEventType;
  title: string;
  description: string;
  date: string;
  createdBy: 'ai' | 'coach' | 'system';
  metadata?: {
    planBefore?: { calories?: number; protein?: number; carbs?: number; fats?: number };
    planAfter?: { calories?: number; protein?: number; carbs?: number; fats?: number };
    supplementChanges?: string[];
    riskId?: string;
    analysisId?: string;
    aiModel?: string;
    coachConfirmRequired?: boolean;
    coachConfirmed?: boolean;
    coachConfirmedDate?: string;
    source?: string;
    [key: string]: unknown;
  };
}

// ---------------------------------------------------------------------------
// Metabolic Analysis
// ---------------------------------------------------------------------------

export type InflammationMarker = 'weight_stagnation' | 'bloating_persistent' | 'digestive_decline' | 'energy_drop' | 'sleep_decline' | 'stress_elevated' | 'performance_drop' | 'appetite_loss' | 'mood_decline' | 'rapid_weight_change';

export const INFLAMMATION_MARKER_LABELS: Record<InflammationMarker, string> = {
  weight_stagnation: 'Estancamiento de peso',
  bloating_persistent: 'Hinchazón persistente',
  digestive_decline: 'Deterioro digestivo',
  energy_drop: 'Caída de energía',
  sleep_decline: 'Deterioro del sueño',
  stress_elevated: 'Estrés elevado',
  performance_drop: 'Caída de rendimiento',
  appetite_loss: 'Pérdida de apetito',
  mood_decline: 'Deterioro del ánimo',
  rapid_weight_change: 'Cambio rápido de peso',
};

export interface MetabolicAnalysis {
  id: string;
  studentId: string;
  date: string;
  periodWeeks: number;
  metrics: {
    weightTrend: { direction: 'losing' | 'stable' | 'gaining'; weeklyRate: number; totalChange: number };
    bodyFatTrend: { direction: 'losing' | 'stable' | 'gaining'; weeklyRate: number; totalChange: number } | null;
    adherenceTrend: { direction: 'improving' | 'stable' | 'declining'; average: number; recentAverage: number };
    energyTrend: { direction: 'improving' | 'stable' | 'declining'; average: number } | null;
    sleepTrend: { direction: 'improving' | 'stable' | 'declining'; average: number } | null;
    stressTrend: { direction: 'improving' | 'stable' | 'worsening'; average: number } | null;
    digestiveTrend: { direction: 'improving' | 'stable' | 'worsening'; average: number } | null;
    performanceTrend: { direction: 'improving' | 'stable' | 'declining'; average: number } | null;
  };
  inflammationMarkers: InflammationMarker[];
  riskScore: number;
  metabolicHealth: 'optimal' | 'good' | 'warning' | 'critical';
  findings: string[];
  recommendations: {
    tests: string[];
    nutrition: string[];
    supplements: string[];
    training: string[];
    recovery: string[];
    medicalReferral?: string;
  };
  generatedBy: 'ai' | 'manual';
}

// ---------------------------------------------------------------------------
// Plan Risks
// ---------------------------------------------------------------------------

export type RiskCategory =
  | 'caloric_deficit_prolonged'
  | 'low_fat_prolonged'
  | 'micronutrient_deficiency'
  | 'excessive_cardio'
  | 'insufficient_protein'
  | 'dehydration_risk'
  | 'overtraining'
  | 'metabolic_adaptation'
  | 'hormonal_disruption'
  | 'electrolyte_imbalance';

export const RISK_CATEGORY_LABELS: Record<RiskCategory, string> = {
  caloric_deficit_prolonged: 'Déficit calórico prolongado',
  low_fat_prolonged: 'Grasas insuficientes (riesgo hormonal)',
  micronutrient_deficiency: 'Deficiencia de micronutrientes',
  excessive_cardio: 'Exceso de cardio',
  insufficient_protein: 'Proteína insuficiente',
  dehydration_risk: 'Riesgo de deshidratación',
  overtraining: 'Sobreentrenamiento',
  metabolic_adaptation: 'Adaptación metabólica',
  hormonal_disruption: 'Disrupción hormonal',
  electrolyte_imbalance: 'Desequilibrio electrolítico',
};

export interface PlanRisk {
  id: string;
  studentId: string;
  category: RiskCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  detectedDate: string;
  evidence: string[];
  suggestedAction: string;
  resolved: boolean;
  resolvedDate?: string;
  resolvedBy?: string;
}

// ---------------------------------------------------------------------------
// Supplement Alerts
// ---------------------------------------------------------------------------

export type IncompatibilityType =
  | 'competition_absorption'
  | 'liver_toxicity_risk'
  | 'kidney_stress'
  | 'contraindicated_combination'
  | 'excessive_dosage'
  | 'prolonged_use_risk'
  | 'timing_conflict'
  | 'allergy_risk';

export const INCOMPATIBILITY_LABELS: Record<IncompatibilityType, string> = {
  competition_absorption: 'Competición por absorción',
  liver_toxicity_risk: 'Riesgo de toxicidad hepática',
  kidney_stress: 'Estrés renal',
  contraindicated_combination: 'Combinación contraindicada',
  excessive_dosage: 'Dosis excesiva',
  prolonged_use_risk: 'Riesgo por uso prolongado',
  timing_conflict: 'Conflicto de timing',
  allergy_risk: 'Riesgo de alergia',
};

export interface SupplementAlert {
  id: string;
  studentId: string;
  type: IncompatibilityType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  supplements: string[];
  description: string;
  recommendation: string;
  detectedDate: string;
  resolved: boolean;
  resolvedDate?: string;
}

// ---------------------------------------------------------------------------
// Media Analysis
// ---------------------------------------------------------------------------

export type MediaAnalysisType = 'physique' | 'food' | 'supplement' | 'training' | 'posture' | 'injury' | 'progress_comparison';

export const MEDIA_ANALYSIS_LABELS: Record<MediaAnalysisType, string> = {
  physique: 'Físico',
  food: 'Comida',
  supplement: 'Suplemento',
  training: 'Entrenamiento',
  posture: 'Postura',
  injury: 'Lesión',
  progress_comparison: 'Comparación de progreso',
};

export interface MediaAnalysis {
  id: string;
  studentId: string;
  type: MediaAnalysisType;
  mediaUris: string[];
  date: string;
  summary: string;
  detailedFindings: Record<string, string>;
  bodyFatEstimate?: { min: number; max: number; confidence: 'low' | 'medium' | 'high' };
  recommendations: string[];
  comparisonWithPrevious?: {
    previousAnalysisId: string;
    previousDate: string;
    changes: string[];
  };
  createdBy: 'ai' | 'coach';
}

export type CheckInStatus = 'completed' | 'pending' | 'overdue';

export type TimelineEventType =
  | 'checkin'
  | 'nutrition_update'
  | 'training_update'
  | 'weight_update'
  | 'bodyfat_change'
  | 'message'
  | 'subscription_renewal'
  | 'alert'
  | 'document_added';

export const TIMELINE_EVENT_LABELS: Record<TimelineEventType, string> = {
  checkin: 'Check-in',
  nutrition_update: 'Plan nutricional actualizado',
  training_update: 'Plan de entrenamiento actualizado',
  weight_update: 'Actualización de peso',
  bodyfat_change: 'Cambio grasa corporal',
  message: 'Mensaje',
  subscription_renewal: 'Renovación suscripción',
  alert: 'Alerta',
  document_added: 'Documento añadido',
};

export const TIMELINE_EVENT_ICONS: Record<TimelineEventType, string> = {
  checkin: '📋',
  nutrition_update: '🥗',
  training_update: '🏋️',
  weight_update: '⚖️',
  bodyfat_change: '📊',
  message: '💬',
  subscription_renewal: '💳',
  alert: '⚠️',
  document_added: '📄',
};

export interface TimelineEvent {
  id: string;
  studentId: string;
  type: TimelineEventType;
  title: string;
  description: string;
  date: string;
  metadata?: Record<string, unknown>;
}

export type CoachTaskCategory = 'checkin' | 'plan_update' | 'message' | 'subscription' | 'alert';

export const TASK_CATEGORY_LABELS: Record<CoachTaskCategory, string> = {
  checkin: 'Check-ins',
  plan_update: 'Actualización de planes',
  message: 'Mensajes',
  subscription: 'Suscripciones',
  alert: 'Alertas',
};

export interface CoachTask {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  category: CoachTaskCategory;
  title: string;
  description: string;
  date: string;
  completed: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export type NotificationCategory = 'checkin' | 'plan_update' | 'message' | 'billing' | 'alert' | 'system';

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  checkin: 'Check-ins',
  plan_update: 'Planes',
  message: 'Mensajes',
  billing: 'Facturación',
  alert: 'Alertas',
  system: 'Sistema',
};

export interface CoachNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  read: boolean;
  studentId?: string;
  studentName?: string;
  date: string;
  actionRoute?: string;
}

export interface DailyDigest {
  pendingCheckIns: number;
  expiringSubscriptions: number;
  planUpdatesNeeded: number;
  aiAlerts: number;
}

export type AlertType = 'stagnation' | 'low_adherence' | 'overtraining' | 'no_checkin' | 'performance_drop' | 'goal_risk';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface SmartAlert {
  id: string;
  studentId: string;
  studentName: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  suggestion: string;
  createdAt: string;
  dismissed?: boolean;
}

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  stagnation: 'Estancamiento',
  low_adherence: 'Baja adherencia',
  overtraining: 'Sobreentrenamiento',
  no_checkin: 'Sin check-in',
  performance_drop: 'Caída rendimiento',
  goal_risk: 'Riesgo objetivo',
};

// ---------------------------------------------------------------------------
// Blood Panels & Health Monitoring
// ---------------------------------------------------------------------------

export type BloodPanelCategory =
  | 'complete_blood_count'
  | 'metabolic_panel'
  | 'lipid_panel'
  | 'thyroid_panel'
  | 'hormonal_panel'
  | 'liver_panel'
  | 'kidney_panel'
  | 'vitamin_mineral'
  | 'inflammation_markers'
  | 'iron_panel'
  | 'electrolyte_panel'
  | 'cardiac_markers';

export const BLOOD_PANEL_LABELS: Record<BloodPanelCategory, string> = {
  complete_blood_count: 'Hemograma Completo',
  metabolic_panel: 'Perfil Metabólico',
  lipid_panel: 'Perfil Lipídico',
  thyroid_panel: 'Perfil Tiroideo',
  hormonal_panel: 'Perfil Hormonal',
  liver_panel: 'Perfil Hepático',
  kidney_panel: 'Perfil Renal',
  vitamin_mineral: 'Vitaminas y Minerales',
  inflammation_markers: 'Marcadores Inflamatorios',
  iron_panel: 'Perfil de Hierro',
  electrolyte_panel: 'Panel de Electrolitos',
  cardiac_markers: 'Marcadores Cardíacos',
};

export const BLOOD_PANEL_ICONS: Record<BloodPanelCategory, string> = {
  complete_blood_count: '🩸',
  metabolic_panel: '🧪',
  lipid_panel: '🫀',
  thyroid_panel: '🦋',
  hormonal_panel: '⚡',
  liver_panel: '🏥',
  kidney_panel: '💧',
  vitamin_mineral: '💊',
  inflammation_markers: '🔥',
  iron_panel: '🩸',
  electrolyte_panel: '⚡',
  cardiac_markers: '❤️',
};

export interface BloodMarker {
  name: string;
  value: number;
  unit: string;
  referenceMin: number;
  referenceMax: number;
  optimalMin: number;
  optimalMax: number;
  status: 'low' | 'normal' | 'optimal' | 'high';
  flagged: boolean;
}

export interface BloodPanel {
  id: string;
  studentId: string;
  category: BloodPanelCategory;
  date: string;
  markers: BloodMarker[];
  summary: string;
  recommendations: string[];
  labName?: string;
  attachmentUri?: string;
  createdBy: 'ai' | 'coach' | 'manual';
}

export type BloodPanelUrgency = 'routine' | 'recommended' | 'urgent';
export type BloodPanelRecStatus = 'pending' | 'scheduled' | 'completed' | 'dismissed';

export const BLOOD_PANEL_URGENCY_LABELS: Record<BloodPanelUrgency, string> = {
  routine: 'Rutina',
  recommended: 'Recomendado',
  urgent: 'Urgente',
};

export interface BloodPanelRecommendation {
  id: string;
  studentId: string;
  category: BloodPanelCategory;
  reason: string;
  urgency: BloodPanelUrgency;
  suggestedDate: string;
  basedOn: string[];
  status: BloodPanelRecStatus;
  createdAt: string;
  createdBy: 'ai' | 'coach' | 'system';
}

export type HealthAlertType =
  | 'blood_panel_due'
  | 'abnormal_result'
  | 'supplement_monitoring'
  | 'metabolic_concern'
  | 'periodic_checkup'
  | 'deficiency_detected'
  | 'organ_stress'
  | 'hormonal_imbalance';

export const HEALTH_ALERT_LABELS: Record<HealthAlertType, string> = {
  blood_panel_due: 'Panel sanguíneo pendiente',
  abnormal_result: 'Resultado anormal',
  supplement_monitoring: 'Monitoreo de suplementos',
  metabolic_concern: 'Preocupación metabólica',
  periodic_checkup: 'Chequeo periódico',
  deficiency_detected: 'Deficiencia detectada',
  organ_stress: 'Estrés orgánico',
  hormonal_imbalance: 'Desequilibrio hormonal',
};

export const HEALTH_ALERT_ICONS: Record<HealthAlertType, string> = {
  blood_panel_due: '🩸',
  abnormal_result: '⚠️',
  supplement_monitoring: '💊',
  metabolic_concern: '🔬',
  periodic_checkup: '📅',
  deficiency_detected: '🔻',
  organ_stress: '🏥',
  hormonal_imbalance: '⚡',
};

export interface HealthAlert {
  id: string;
  studentId: string;
  studentName: string;
  type: HealthAlertType;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  relatedPanelCategory?: BloodPanelCategory;
  createdAt: string;
  acknowledged: boolean;
}

// ---------------------------------------------------------------------------
// Supplement-to-blood-panel mapping for health monitoring engine
// ---------------------------------------------------------------------------

export const SUPPLEMENT_MONITORING_MAP: Record<string, { panels: BloodPanelCategory[]; intervalWeeks: number; reason: string }> = {
  'hierro': { panels: ['iron_panel', 'complete_blood_count'], intervalWeeks: 8, reason: 'Monitoreo de ferritina y hemograma por suplementación con hierro.' },
  'iron': { panels: ['iron_panel', 'complete_blood_count'], intervalWeeks: 8, reason: 'Monitoreo de ferritina y hemograma por suplementación con hierro.' },
  'vitamina d': { panels: ['vitamin_mineral'], intervalWeeks: 12, reason: 'Monitoreo de 25-OH vitamina D.' },
  'vitamin d': { panels: ['vitamin_mineral'], intervalWeeks: 12, reason: 'Monitoreo de 25-OH vitamina D.' },
  'zinc': { panels: ['vitamin_mineral'], intervalWeeks: 12, reason: 'El zinc en dosis altas puede depletar cobre.' },
  'magnesio': { panels: ['electrolyte_panel', 'kidney_panel'], intervalWeeks: 12, reason: 'Monitoreo renal por suplementación de magnesio.' },
  'magnesium': { panels: ['electrolyte_panel', 'kidney_panel'], intervalWeeks: 12, reason: 'Monitoreo renal por suplementación de magnesio.' },
  'calcio': { panels: ['vitamin_mineral', 'kidney_panel'], intervalWeeks: 12, reason: 'Monitoreo de calcio sérico y función renal.' },
  'calcium': { panels: ['vitamin_mineral', 'kidney_panel'], intervalWeeks: 12, reason: 'Monitoreo de calcio sérico y función renal.' },
  'potasio': { panels: ['electrolyte_panel', 'cardiac_markers'], intervalWeeks: 8, reason: 'Monitoreo de potasio sérico y función cardíaca.' },
  'potassium': { panels: ['electrolyte_panel', 'cardiac_markers'], intervalWeeks: 8, reason: 'Monitoreo de potasio sérico y función cardíaca.' },
  'omega 3': { panels: ['lipid_panel'], intervalWeeks: 16, reason: 'Monitoreo de perfil lipídico.' },
  'omega-3': { panels: ['lipid_panel'], intervalWeeks: 16, reason: 'Monitoreo de perfil lipídico.' },
  'creatina': { panels: ['kidney_panel'], intervalWeeks: 16, reason: 'Monitoreo de función renal por suplementación con creatina.' },
  'creatine': { panels: ['kidney_panel'], intervalWeeks: 16, reason: 'Monitoreo de función renal por suplementación con creatina.' },
  'ashwagandha': { panels: ['liver_panel', 'thyroid_panel'], intervalWeeks: 12, reason: 'Monitoreo hepático y tiroideo por uso de ashwagandha.' },
  'vitamina a': { panels: ['liver_panel'], intervalWeeks: 12, reason: 'Riesgo de toxicidad hepática por vitamina A en dosis altas.' },
  'vitamin a': { panels: ['liver_panel'], intervalWeeks: 12, reason: 'Riesgo de toxicidad hepática por vitamina A en dosis altas.' },
  'vitamina e': { panels: ['complete_blood_count'], intervalWeeks: 12, reason: 'Vitamina E en dosis altas puede afectar coagulación.' },
  'vitamin e': { panels: ['complete_blood_count'], intervalWeeks: 12, reason: 'Vitamina E en dosis altas puede afectar coagulación.' },
  'cafeína': { panels: ['cardiac_markers', 'electrolyte_panel'], intervalWeeks: 12, reason: 'Monitoreo cardíaco y electrolitos por uso de cafeína/estimulantes.' },
  'caffeine': { panels: ['cardiac_markers', 'electrolyte_panel'], intervalWeeks: 12, reason: 'Monitoreo cardíaco y electrolitos por uso de cafeína/estimulantes.' },
  'pre workout': { panels: ['cardiac_markers', 'liver_panel', 'kidney_panel'], intervalWeeks: 8, reason: 'Monitoreo de seguridad por uso de pre-entreno.' },
  'pre entreno': { panels: ['cardiac_markers', 'liver_panel', 'kidney_panel'], intervalWeeks: 8, reason: 'Monitoreo de seguridad por uso de pre-entreno.' },
};

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentario',
  light: 'Ligeramente activo',
  moderate: 'Moderadamente activo',
  active: 'Activo',
  very_active: 'Muy activo',
};

export const GOAL_LABELS: Record<FitnessGoal, string> = {
  lose_fat: 'Perder grasa',
  build_muscle: 'Ganar músculo',
  maintain: 'Mantener',
  recomp: 'Recomposición',
  competition: 'Competición',
};
