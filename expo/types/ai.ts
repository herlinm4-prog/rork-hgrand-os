export type ConversationMode = 'coach' | 'client' | 'document';

export const CONVERSATION_MODE_LABELS: Record<ConversationMode, string> = {
  coach: 'Coach',
  client: 'Cliente',
  document: 'Documento',
};

export const CONVERSATION_MODE_DESCRIPTIONS: Record<ConversationMode, string> = {
  coach: 'Respuestas técnicas y detalladas',
  client: 'Respuestas simplificadas para el atleta',
  document: 'Salidas formateadas para documentos',
};

export interface QuickTool {
  id: string;
  label: string;
  prompt: string;
  icon: string;
  color: string;
}

export const QUICK_AI_TOOLS: QuickTool[] = [
  {
    id: 'analyze_image',
    label: 'Analizar imagen',
    prompt: 'Analiza la imagen que te he subido. Si es una foto de físico, evalúa conditioning, fullness muscular, separación muscular, indicadores de grasa corporal, retención de agua, simetría, puntos fuertes y débiles. Estima un rango de grasa corporal visual. Si es otro tipo de imagen (comida, suplemento, documento), extrae información útil.',
    icon: 'scan',
    color: '#EC4899',
  },
  {
    id: 'metabolic_analysis',
    label: 'Análisis Metabólico',
    prompt: 'Ejecuta un análisis metabólico completo para el alumno más reciente. Pregúntame cuál alumno o dime si quieres que analice uno específico. Usa runMetabolicAnalysis para obtener el análisis automatizado y luego interpreta los resultados.',
    icon: 'activity',
    color: '#0EA5E9',
  },
  {
    id: 'check_supplements',
    label: 'Chequeo Suplementos',
    prompt: 'Revisa los suplementos del alumno. Pregúntame cuál alumno y analiza: compatibilidad entre suplementos, dosis, riesgos por uso prolongado, y posibles interacciones o contraindicaciones.',
    icon: 'pill',
    color: '#F97316',
  },
  {
    id: 'plan_risks',
    label: 'Riesgos del Plan',
    prompt: 'Detecta riesgos metabólicos en el plan nutricional del alumno. Pregúntame cuál alumno. Usa detectPlanRisks para escanear el plan activo y detecta: déficit prolongado, grasas insuficientes, proteína baja, exceso de cardio, adaptación metabólica.',
    icon: 'shield-alert',
    color: '#DC2626',
  },
  {
    id: 'athlete_memory',
    label: 'Memoria del Atleta',
    prompt: 'Consulta la memoria lineal completa del alumno. Pregúntame cuál alumno. Usa getAthleteMemory para obtener el timeline cronológico y resume los eventos clave: cambios de plan, sugerencias de IA, decisiones del coach, análisis realizados.',
    icon: 'brain',
    color: '#7C3AED',
  },
  {
    id: 'analyze_checkin',
    label: 'Analizar check-in',
    prompt: 'Analiza el último check-in del alumno. Pregúntame cuál alumno. Compara métricas con la semana anterior, ejecuta análisis metabólico automático, y sugiere ajustes basados en los hallazgos.',
    icon: 'clipboard',
    color: '#3B82F6',
  },
  {
    id: 'compare_photos',
    label: 'Comparar fotos',
    prompt: 'Compara las fotos del último check-in con las anteriores del mismo alumno. Pregúntame cuál alumno. Analiza condición, fullness, simetría, retención de agua y cambios visibles. Guarda el análisis en la memoria del atleta.',
    icon: 'images',
    color: '#8B5CF6',
  },
  {
    id: 'nutrition_plan',
    label: 'Plan nutricional',
    prompt: 'Genera un plan nutricional completo para el alumno. Pregúntame cuál alumno. Consulta primero su perfil completo, historial de dietas, y memoria del atleta antes de generar.',
    icon: 'apple',
    color: '#10B981',
  },
  {
    id: 'training_plan',
    label: 'Plan de entreno',
    prompt: 'Genera un plan de entrenamiento completo. Pregúntame cuál alumno. Consulta el perfil del alumno, su fase actual y su historial de rendimiento.',
    icon: 'dumbbell',
    color: '#F59E0B',
  },
  {
    id: 'progress_summary',
    label: 'Resumen progreso',
    prompt: 'Resume el progreso completo del alumno en las últimas 8 semanas. Incluye tendencias de peso, grasa corporal, adherencia, energía, sueño, rendimiento y análisis metabólico si existe.',
    icon: 'trending-up',
    color: '#06B6D4',
  },
  {
    id: 'peak_week',
    label: 'Peak Week',
    prompt: 'Prepara un protocolo completo de Peak Week para el alumno. Pregúntame cuál alumno. Incluye manipulación de carbohidratos, agua, sodio e intensidad de entrenamiento día a día.',
    icon: 'trophy',
    color: '#EF4444',
  },
  {
    id: 'read_document',
    label: 'Leer documento',
    prompt: 'Lista los documentos del alumno más reciente y lee el último documento guardado. Resúmelo y da feedback profesional.',
    icon: 'file-text',
    color: '#64748B',
  },
  {
    id: 'blood_panels',
    label: 'Paneles Sanguíneos',
    prompt: 'Revisa las recomendaciones de paneles sanguíneos del alumno. Pregúntame cuál alumno. Usa fetchBloodPanelRecs para ver qué paneles están pendientes y fetchBloodPanels para ver resultados anteriores. El sistema detecta automáticamente necesidades basadas en suplementos, duración del plan, fase de competición y señales metabólicas.',
    icon: 'droplets',
    color: '#EF4444',
  },
  {
    id: 'health_monitoring',
    label: 'Monitoreo Salud',
    prompt: 'Ejecuta un escaneo completo de salud para todos los atletas o para uno específico. Pregúntame si quiero escanear todos o uno. Usa runHealthMonitoring para ejecutar el motor de detección que analiza: necesidades de paneles sanguíneos por suplementos, duración del plan, fase de competición, señales metabólicas (energía, sueño, digestión), y chequeos periódicos. Luego interpreta los resultados y resume las alertas generadas.',
    icon: 'stethoscope',
    color: '#DC2626',
  },
];

export type FoodCategory =
  | 'pollo'
  | 'res'
  | 'cerdo'
  | 'cordero'
  | 'pavo'
  | 'pescado_blanco'
  | 'pescado_azul'
  | 'marisco'
  | 'huevos'
  | 'lacteos'
  | 'arroz'
  | 'pasta'
  | 'avena_cereales'
  | 'pan'
  | 'legumbres'
  | 'patata_tuberculos'
  | 'verduras'
  | 'frutas'
  | 'frutos_secos'
  | 'aceites_grasas'
  | 'vegetariano'
  | 'suplementos'
  | 'otros';

export type CookingMethod =
  | 'crudo'
  | 'hervido'
  | 'plancha'
  | 'horno'
  | 'parrilla'
  | 'frito'
  | 'al_vapor'
  | 'microondas'
  | 'seco'
  | 'preparado';

export const FOOD_CATEGORY_LABELS: Record<FoodCategory, string> = {
  pollo: 'Pollo',
  res: 'Carne de res',
  cerdo: 'Cerdo',
  cordero: 'Cordero',
  pavo: 'Pavo',
  pescado_blanco: 'Pescado blanco',
  pescado_azul: 'Pescado azul',
  marisco: 'Marisco',
  huevos: 'Huevos',
  lacteos: 'Lácteos',
  arroz: 'Arroz',
  pasta: 'Pasta',
  avena_cereales: 'Avena y cereales',
  pan: 'Pan',
  legumbres: 'Legumbres',
  patata_tuberculos: 'Patata y tubérculos',
  verduras: 'Verduras',
  frutas: 'Frutas',
  frutos_secos: 'Frutos secos',
  aceites_grasas: 'Aceites y grasas',
  vegetariano: 'Vegetariano',
  suplementos: 'Suplementos',
  otros: 'Otros',
};

export interface FoodDatabaseEntry {
  id: string;
  name: string;
  category: FoodCategory;
  cookingMethod: CookingMethod;
  quantity: number;
  unit: string;
  weightType: 'cooked' | 'dry';
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface MealPlanFood {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  weightType: 'cooked' | 'dry';
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  category?: FoodCategory;
  cookingMethod?: CookingMethod;
  perUnitCalories?: number;
  perUnitProtein?: number;
  perUnitCarbs?: number;
  perUnitFats?: number;
}

export interface MealPlanMeal {
  id: string;
  name: string;
  time: string;
  foods: MealPlanFood[];
  objective?: import('@/types').MealObjective;
  objectiveText?: string;
}

export interface MealPlanData {
  studentId: string;
  studentName: string;
  title: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  meals: MealPlanMeal[];
}

// The massive food database now lives in @/utils/foodDatabase.ts for tree-shaking.
// Re-export here for backwards compatibility with existing imports.
export { FOOD_DATABASE } from '@/utils/foodDatabase';
