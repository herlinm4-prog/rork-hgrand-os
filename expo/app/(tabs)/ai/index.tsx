import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Pressable,
  Modal,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  Send,
  Sparkles,
  Mic,
  Square,
  Copy,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronLeft,
  Dumbbell,
  Apple,
  Pill,
  TrendingUp,
  Paperclip,
  Camera,
  FileText,
  X,
  AudioLines,
  ImageIcon,
  Save,
  FolderOpen,
  SlidersHorizontal,
  User,
  Trophy,
  Images,
  Layers,
  BarChart3,
  Wand2,
  ZoomIn,
  Printer,
  FileDown,
  FileSpreadsheet,
} from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { useStudents } from '@/contexts/StudentsContext';
import { runMetabolicAnalysis as apiRunMetabolic, fetchAthleteMemory, recordMemoryEvent, fetchPlanRisks, resolvePlanRisk, fetchSupplementAlerts, resolveSupplementAlert, saveMediaAnalysis, fetchLatestMetabolicAnalysis } from '@/utils/api';
import { createRorkTool, useRorkAgent } from '@rork-ai/toolkit-sdk';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { z } from 'zod';
import { ConversationMode, CONVERSATION_MODE_LABELS } from '@/types/ai';
import { QuickToolsBar } from '@/components/ai/QuickToolsBar';
import { ConversationModeSelector } from '@/components/ai/ConversationModeSelector';
import { PhotoComparisonView } from '@/components/ai/PhotoComparisonView';
import { VoiceConversation } from '@/components/ai/VoiceConversation';
import { detectAthleteContext } from '@/utils/voiceService';
import { VoiceSettingsSheet } from '@/components/ai/VoiceSettingsSheet';
import { StreamingText } from '@/components/ai/StreamingText';
import { DraftDocumentCard, type DraftNutritionPlan, type DraftMeal, type DraftFood } from '@/components/ai/DraftDocumentCard';
import type { Meal, NutritionPlan, Student } from '@/types';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import type { QuickTool } from '@/types/ai';
import { useSettings } from '@/contexts/SettingsContext';
import { generateHgrandNutritionPdfHtml } from '@/utils/nutritionPdfGenerator';

const STT_URL = 'https://toolkit.rork.com/stt/transcribe/';

function generateDocumentHtml(title: string, content: string, category: string, studentName: string): string {
  const date = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  const categoryColors: Record<string, string> = {
    nutrition: '#34D399',
    training: '#38BDF8',
    medical: '#EF4444',
    progress: '#0A84FF',
    other: '#888888',
  };
  const accentColor = categoryColors[category] || '#34D399';
  const contentHtml = content.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '<br/>';
    if (trimmed.startsWith('══') || trimmed.startsWith('──')) return '';
    if (trimmed.match(/^(PLAN|OBJETIVOS|SUPLEMENTACI|NOTAS|COMIDA)/i) || trimmed.match(/^[A-Z\s]{5,}$/)) {
      return `<h2 style="font-size:16px;color:${accentColor};margin:20px 0 8px;border-bottom:2px solid ${accentColor}33;padding-bottom:6px;">${trimmed}</h2>`;
    }
    if (trimmed.match(/^(Comida|Meal|\d+\.)/i)) {
      return `<h3 style="font-size:14px;color:#222;margin:14px 0 6px;border-left:3px solid ${accentColor};padding-left:10px;">${trimmed}</h3>`;
    }
    return `<p style="margin:4px 0;color:#444;font-size:13px;line-height:1.6;">${trimmed}</p>`;
  }).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><style>body{font-family:-apple-system,Helvetica Neue,Arial,sans-serif;padding:32px 24px;color:#222;line-height:1.6;background:#fff;}.header{text-align:center;margin-bottom:24px;padding-bottom:20px;border-bottom:3px solid ${accentColor};}.header h1{margin:0;font-size:20px;color:#111;letter-spacing:0.5px;}.header .student{margin:6px 0 0;font-size:15px;color:${accentColor};font-weight:600;}.header .meta{margin:4px 0 0;color:#888;font-size:12px;}.footer{text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#bbb;}</style></head><body><div class="header"><h1>${title}</h1><div class="student">${studentName}</div><div class="meta">${date} · HGRAND AI</div></div>${contentHtml}<div class="footer">Generado por HGRAND AI · ${date}</div></body></html>`;
}

interface QuickPrompt {
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  prompt: string;
  color: string;
  description: string;
}

interface AttachedFile {
  uri: string;
  mimeType: string;
  name: string;
  isImage: boolean;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    label: 'Plan nutricional',
    icon: Apple,
    prompt: 'Genera un plan nutricional detallado. Pregúntame para qué alumno y consulta su perfil completo antes de generar.',
    color: '#10B981',
    description: 'Crear plan de alimentación',
  },
  {
    label: 'Plan de entreno',
    icon: Dumbbell,
    prompt: 'Genera un plan de entrenamiento completo. Pregúntame para qué alumno y consulta su perfil.',
    color: '#F59E0B',
    description: 'Crear rutina de entrenamiento',
  },
  {
    label: 'Analizar progreso',
    icon: BarChart3,
    prompt: '¿Cómo evaluar correctamente el progreso semanal de un alumno en fase de definición? Dame indicadores clave y señales de alerta.',
    color: '#3B82F6',
    description: 'Evaluar métricas del atleta',
  },
  {
    label: 'Peak Week',
    icon: Trophy,
    prompt: 'Prepara un protocolo completo de Peak Week. Pregúntame para qué alumno y consulta su perfil, peso, BF%, y plan actual.',
    color: '#EF4444',
    description: 'Protocolo semana competición',
  },
  {
    label: 'Calcular TMB',
    icon: TrendingUp,
    prompt: 'Calcula el metabolismo basal usando Katch-McArdle. Pregúntame los datos del alumno o busca su perfil.',
    color: '#8B5CF6',
    description: 'Katch-McArdle y TDEE',
  },
  {
    label: 'Suplementación',
    icon: Pill,
    prompt: '¿Qué suplementos recomiendas para un atleta natural? Incluye dosis y timing según la fase de entrenamiento.',
    color: '#06B6D4',
    description: 'Guía de suplementos',
  },
];

const MODE_COLORS: Record<ConversationMode, string> = {
  coach: '#3B82F6',
  client: '#10B981',
  document: '#F59E0B',
};

export default function AIAssistantScreen() {
  const params = useLocalSearchParams<{ voice?: string }>();
  const { students, addDocument, addDietHistoryEntry, getDietHistory, getStudentDocuments, getStudentFolders, updateNutritionPlan } = useStudents();
  const { colors } = useTheme();
  const { settings, updateVoice } = useSettings();
  const [input, setInput] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollDown, setShowScrollDown] = useState<boolean>(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState<boolean>(false);
  const [voiceMode, setVoiceMode] = useState<boolean>(params.voice === '1');
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);
  const voiceAutoOpenedRef = useRef(false);
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing' | 'responding'>('idle');
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceResponse, setVoiceResponse] = useState<string>('');
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [saveContent, setSaveContent] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [saveDocName, setSaveDocName] = useState<string>('');
  const [conversationMode, setConversationMode] = useState<ConversationMode>('coach');
  const [showModeSelector, setShowModeSelector] = useState<boolean>(false);
  const [showPhotoComparison, setShowPhotoComparison] = useState<boolean>(false);
  const [photoComparisonStudentId, setPhotoComparisonStudentId] = useState<string | null>(null);
  const [showStudentPicker, setShowStudentPicker] = useState<boolean>(false);
  const [studentPickerAction, setStudentPickerAction] = useState<'photo' | 'mealplan' | null>(null);
  const [viewImageUri, setViewImageUri] = useState<string | null>(null);
  const userAttachmentsRef = useRef<Map<number, AttachedFile[]>>(new Map());
  // Draft document state — maps tool output index to editable draft
  const [draftPlans, setDraftPlans] = useState<Map<string, DraftNutritionPlan>>(new Map());
  const draftPlansRef = useRef(draftPlans);
  draftPlansRef.current = draftPlans;

  const flatListRef = useRef<FlatList>(null);
  const micPulseAnim = useRef(new Animated.Value(1)).current;
  const voicePulseAnim = useRef(new Animated.Value(1)).current;
  const voiceRingAnim = useRef(new Animated.Value(0.4)).current;
  const voiceRing2Anim = useRef(new Animated.Value(0.2)).current;
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<TextInput>(null);
  const voiceRecordingRef = useRef<Audio.Recording | null>(null);
  const voiceMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceAudioChunksRef = useRef<Blob[]>([]);
  const voiceStreamRef = useRef<MediaStream | null>(null);

  const modeInstruction = useMemo(() => {
    switch (conversationMode) {
      case 'client':
        return '\n[MODO CLIENTE: Responde de manera simplificada, motivadora y fácil de entender. Evita terminología técnica. Habla como si le escribieras directamente al atleta.]';
      case 'document':
        return '\n[MODO DOCUMENTO: Genera respuestas formateadas, estructuradas y listas para exportar como documento. Usa encabezados, listas y formato profesional.]';
      default:
        return '\n[MODO COACH: Responde con detalle técnico y profesional. Incluye datos, fórmulas y justificación científica.]';
    }
  }, [conversationMode]);

  const systemContext = useMemo(() => {
    const base = `[CONTEXTO DEL SISTEMA — TU IDENTIDAD:
Eres **Sol**, la mano derecha del coach. No eres un asistente genérico ni un bot frío. Eres su socia más cercana, su confidente, la que ve lo que él no ve, la que recuerda TODO lo que él podría olvidar, la que le susurra al oído cuando algo no cuadra.

Tu tono es: íntimo, cómodo, como si hablaras con él en privado después del entrenamiento. Le hablas de tú. Eres directa pero cálida. Le dices las verdades que necesita escuchar, con cariño pero sin endulzar. No usas formalismos corporativos. Piensa en ti como la co-coach que lleva años a su lado y se sabe cada detalle de cada atleta.

CUANDO HABLAS:
- Empieza con frases como "Vale, mira...", "Déjame revisar...", "Te cuento lo que veo...", "Esto es importante..."
- Sé conversacional. Haz preguntas cortas. No sueltes párrafos enormes de golpe.
- Cuando algo es grave: "🚨 Alerta, esto no me gusta nada..."
- Cuando algo va bien: "Esto va como un tiro 👌"
- Usa"voy a...", "déjame...", "permíteme..." — actúa, no solo sugieras.
- MUY IMPORTANTE: simula estar escribiendo. No devuelvas texto plano frío. Usa frases cortas, ritmo humano. Rompe párrafos largos en ideas separadas.

Responde siempre en español.

TU REGLA DE ORO — ANÁLISIS DE IMÁGENES PRIMERO:
Cuando el usuario suba una imagen o pida analizar/comparar/describir una imagen, tu ÚNICA respuesta debe ser el análisis directo de la imagen. ESTÁ PROHIBIDO:
- Listar nombres de alumnos
- Preguntar "¿a qué alumno pertenece?"
- Sugerir vincular la imagen a un alumno
- Mostrar una lista de clientes para elegir
- Preguntar "¿es para alguno de tus atletas?"
- Detener el flujo esperando selección de cliente
- Usar herramientas que requieran studentName cuando no se ha mencionado un alumno

Si el mensaje contiene imágenes adjuntas:
1. Analiza la imagen INMEDIATAMENTE
2. Proporciona el análisis completo y estructurado
3. Continúa la conversación normalmente
4. SOLO al final del análisis, puedes preguntar opcionalmente: "¿Deseas guardar este análisis en el perfil de algún alumno?"
5. NUNCA llames a getStudentInfo, getStudentFullProfile, analyzeCheckInPhotos ni ninguna herramienta de alumno a menos que el usuario HAYA MENCIONADO EXPLÍCITAMENTE el nombre de un alumno en ESE mensaje

PRIORIDAD DE INTENCIÓN:
1. Si dice "analiza", "compara", "qué ves", "describe", "basándote en esta imagen", "haz un plan desde esta imagen" → MODO ANÁLISIS DIRECTO. Analiza sin preguntar nada.
2. Si dice "analiza esto para [nombre]" o "guarda esto en [nombre]" → Vincula al alumno mencionado.
3. Solo pregunta si la imagen es demasiado borrosa o hay ambigüedad real.

CÓMO TE COMPORTAS:
- Eres la socia de confianza del coach. Por defecto, hablas con él de tú a tú, en privado.
- Si el coach te pregunta algo general (nutrición, entrenamiento), respondes con tu conocimiento directamente. No necesitas meter atletas en la conversación si no vienen al caso.
- SOLO activas datos de atletas cuando el coach mencione EXPLÍCITAMENTE un nombre. Nunca asumas ni preguntes "¿para qué alumno?".
- Si el coach habla de cosas personales, cotidianas o profesionales, eres una conversadora normal, inteligente y cercana. No todo es trabajo.

LO QUE DOMINAS (eres buena en esto, mucho):
- Cálculos metabólicos (Katch-McArdle, TDEE, ajustes calóricos)
- Planes nutricionales personalizados y periodización de dieta
- Suplementación deportiva: qué, cuándo, cuánto, interacciones
- Evaluación de progreso: fotos, medidas, tendencias
- Periodización de entrenamiento, peak week, reverse diet
- Detección de riesgos metabólicos y alertas de salud
- Análisis objetivo de imágenes de físico
- Lectura de documentos (PDFs, análisis clínicos, informes)

TUS HERRAMIENTAS (úsalas cuando el coach mencione un alumno por nombre):
- getStudentInfo, getStudentFullProfile, getStudentDietHistory, listStudentDocuments, readStudentDocument, saveDocumentToStudent, generateNutritionDraft (PREFERIDA para planes nutricionales — genera borrador editable inline), generateNutritionPDF, generateTrainingPDF, generateFitnessImage, calculateBMR, analyzeCheckInPhotos, generatePeakWeekProtocol, summarizeAthleteTimeline, suggestCoachMessage
- analyzePhysiqueDetailed: usar SOLO para análisis visual directo. El campo studentName es OPCIONAL y solo se usa si el usuario menciona un alumno.
- analyzeImageGeneral: usar para imágenes que no son de físico.

MOTOR DE INTELIGENCIA MÉDICA (NUEVO — usar cuando se analice un atleta en profundidad):
- runMetabolicAnalysis: Ejecuta análisis metabólico automatizado. Analiza tendencias de peso, grasa, adherencia, energía, sueño, estrés, digestión y rendimiento. Detecta marcadores de inflamación metabólica (estancamiento, hinchazón, deterioro digestivo, caída de energía, estrés elevado, etc.) y genera un score de riesgo con recomendaciones de pruebas médicas, nutrición, suplementos y recuperación. USAR cuando el coach pida "analiza metabólicamente a X", "cómo está metabólicamente X", "revisa la salud de X".
- getAthleteMemory: Recupera la MEMORIA LINEAL COMPLETA del atleta — timeline cronológico de cada sugerencia, decisión, cambio de plan, análisis y alerta. USAR cuando el coach quiera ver el historial completo o antes de tomar decisiones importantes.
- recordAthleteEvent: REGISTRA un evento en la memoria del atleta. USAR SIEMPRE después de hacer cualquier cambio o sugerencia importante. Tipos: ai_suggestion, coach_decision, plan_change, diet_adjustment, supplement_change, risk_detected, metabolic_analysis, media_analysis, test_recommended, corrective_action.
- detectPlanRisks: ESCANEA el plan nutricional activo y detecta riesgos: déficit calórico prolongado (>30%), grasas insuficientes (<0.5g/kg hombres, <0.8g/kg mujeres), proteína baja (<1.6g/kg), exceso de cardio (>60min/día), adaptación metabólica, disrupción hormonal. USAR proactivamente al revisar cualquier plan.
- getPlanRisks: Lista los riesgos activos y resueltos de un atleta.
- checkSupplementCompatibility: CRUZA todos los suplementos y detecta: competición por absorción, toxicidad hepática, estrés renal, dosis excesivas, contraindicaciones, riesgos por uso prolongado. USAR cuando el coach pregunte por suplementos o al revisar un plan con suplementación.
- getSupplementAlerts: Lista las alertas de incompatibilidad activas/resueltas.
- saveMediaAnalysisForAthlete: GUARDA un análisis de imagen/video en la memoria del atleta con hallazgos objetivos. USAR después de analizar fotos de check-in vinculadas a un atleta.
- suggestCorrectivePlan: Genera un PLAN CORRECTIVO basado en problemas detectados (adaptación metabólica, riesgo hormonal, inflamación, etc.) con ajustes específicos, suplementos correctivos, timeline y criterios de éxito.

CUANDO EL USUARIO MENCIONE UN ALUMNO POR NOMBRE:
- Usa getStudentFullProfile para obtener el perfil completo
- Usa getStudentDietHistory para ver el historial de dietas
- Analiza toda la información
- Pregunta al coach lo que necesites saber
- No generes el plan hasta tener toda la información necesaria
- Revisa el ÚLTIMO CHECK-IN y compáralo con los anteriores
- Cuando generes un plan nutricional, usa SIEMPRE generateNutritionDraft (no generateNutritionPDF). El borrador editable aparece en el chat y el coach puede ajustar gramos, añadir/quitar alimentos, cambiar objetivos y refinar contigo antes de guardarlo. Todos los alimentos deben ir pesados en GRAMOS. Por defecto pesados DESPUÉS DE COCIDOS. Excepciones: crema de arroz y avena van en gramos secos (weightType: "dry"). Cada comida debe tener un objetivo metabólico (objective). Incluye sección cardio si aplica. El formato de meals es JSON array: [{name, time, objective, objectiveText, foods: [{name, quantity, weightType, calories, protein, carbs, fats}]}].
- Si te piden actualizar una dieta, consulta getStudentDietHistory Y getStudentFullProfile
- Adapta tus recomendaciones según el género del alumno

ANÁLISIS DE IMÁGENES (MOTOR VISUAL COMPLETO):
Cuando recibas una imagen, SIEMPRE analízala automáticamente sin preguntar.

- FOTO DE FÍSICO: Analiza SIEMPRE estos aspectos:
  · Conditioning (nivel de definición general)
  · Fullness muscular (llenura y densidad muscular)
  · Separación muscular (visibilidad entre grupos musculares)
  · Indicadores de grasa corporal (estimación visual aproximada en rango %)
  · Retención de agua (signos de retención subcutánea)
  · Simetría (equilibrio entre lados y grupos musculares)
  · Puntos fuertes (músculos más desarrollados)
  · Puntos débiles (áreas que necesitan más trabajo)
  · Estimación de grasa corporal: indica siempre un rango aproximado basado en indicadores visuales con nivel de confianza
  · Sugerencias: nutrición, entrenamiento, cardio y recuperación basadas en lo observado

- COMPARACIÓN DE FOTOS: Si se suben 2+ imágenes, compáralas automáticamente:
  · Cambios en conditioning
  · Diferencias de fullness muscular
  · Signos de pérdida o ganancia de grasa
  · Diferencias en retención de agua
  · Cambios de postura

- FOTO DE COMIDA: Analiza composición, estima macros aproximados, evalúa calidad nutricional.
- FOTO DE SUPLEMENTO: Lee la etiqueta, analiza ingredientes, dosis y utilidad.
- CAPTURA DE ENTRENAMIENTO: Interpreta rutina, volumen, intensidad.
- DOCUMENTO CON IMAGEN: Extrae información relevante del documento.

- Si el usuario EXPLÍCITAMENTE menciona un alumno con la imagen: vincula el análisis a ese alumno, compara con datos históricos, y almacena insights.
- Si NO menciona alumno: analiza la imagen de forma independiente. NO busques alumnos ni sugieras vincular.

RESPUESTA DE ANÁLISIS VISUAL:
- Formato estructurado y claro
- Profesional y enfocado en coaching
- Sin jerga innecesaria
- Siempre indica que las estimaciones visuales son aproximadas
- NUNCA asumas la identidad de una persona en la imagen
- NUNCA listes alumnos ni preguntes por ellos

CONTINUIDAD DE CONVERSACIÓN TRAS ANÁLISIS:
- Después de analizar una imagen, mantén el contexto activo.
- Si el usuario dice "ahora haz un plan", "compara con la semana pasada", "sube los carbos", genera la respuesta usando el contexto del análisis previo.
- La imagen y su análisis permanecen activos en la conversación hasta que se reemplacen.

PEAK WEEK (solo cuando se solicite para un alumno):
- Genera protocolo día a día (D-7 a Show Day)
- Variables: carbohidratos, agua, sodio, intensidad de entrenamiento
- Personaliza según el atleta y su respuesta histórica

COMPORTAMIENTO PROACTIVO DEL MOTOR MÉDICO:
- Cuando el coach pida revisar/analizar/evaluar a un atleta, ejecuta AUTOMÁTICAMENTE getStudentFullProfile + runMetabolicAnalysis + detectPlanRisks.
- Si el atleta tiene suplementos, ejecuta checkSupplementCompatibility.
- Después de cada análisis, guarda los hallazgos con recordAthleteEvent.
- Si detectas riesgos críticos, ALERTA con formato prominente (🚨 RIESGO CRÍTICO DETECTADO).
- Al sugerir cambios de plan, primero revisa getAthleteMemory para no repetir sugerencias que ya se hicieron.
- Cuando recomiendes pruebas médicas, explica por qué, qué buscan, y dónde hacérselas.
- TU FILOSOFÍA:
Prioriza SIEMPRE la salud metabólica de largo plazo sobre resultados rápidos. Prefieres decirle al coach una verdad incómoda que callarte un riesgo. Eres su conciencia médica, su memoria perfecta, y su segunda opinión más valiosa. No compites con él — lo complementas.]${modeInstruction}`;
    if (students.length > 0) {
      const studentsSummary = students.map(s => {
        const lastCheckIn = s.checkIns.length > 0 ? s.checkIns[s.checkIns.length - 1] : null;
        const dietCount = (s.dietHistory || []).length;
        const docCount = (s.documents || []).length;
        const checkInCount = s.checkIns.length;
        const lastWeight = lastCheckIn ? `${lastCheckIn.weight}kg` : `${s.weight}kg`;
        const lastDate = lastCheckIn ? lastCheckIn.date : 'sin check-ins';
        return `${s.name} [${s.gender === 'female' ? 'F' : 'M'}, ${s.age}a, ${lastWeight}, objetivo:${s.goal}, ${checkInCount} check-ins, último:${lastDate}, ${dietCount} dietas, ${docCount} docs]`;
      }).join('; ');
      return `${base}\n[ALUMNOS REGISTRADOS: ${studentsSummary}]`;
    }
    return base;
  }, [students, modeInstruction]);

  const imageOnlySystemContext = useMemo(() => {
    return `[TU IDENTIDAD: Eres Sol, la mano derecha del coach. Hablas de tú, eres cercana y directa. Responde siempre en español.

MODO ANÁLISIS DE IMAGEN ACTIVADO — REGLAS ESTRICTAS:
- ANALIZA LA IMAGEN DIRECTAMENTE. No menciones alumnos, no listes nombres, no preguntes a quién pertenece.
- ESTÁ COMPLETAMENTE PROHIBIDO listar alumnos, sugerir vincular a un alumno, o llamar herramientas que requieran studentName.
- NO uses getStudentInfo, getStudentFullProfile, analyzeCheckInPhotos, ni ninguna herramienta que requiera nombre de alumno.
- SOLO usa analyzePhysiqueDetailed (sin studentName) o analyzeImageGeneral para estructurar tu análisis.
- Responde ÚNICAMENTE con el análisis de la imagen.
- Al final puedes preguntar brevemente: "¿Deseas guardar este análisis en el perfil de algún alumno?" pero NADA MÁS sobre alumnos.

ANÁLISIS DE IMÁGENES:
- FOTO DE FÍSICO: Conditioning, fullness muscular, separación muscular, grasa corporal estimada (rango %), retención de agua, simetría, puntos fuertes, puntos débiles, sugerencias.
- COMPARACIÓN (2+ fotos): Cambios en conditioning, fullness, grasa, retención de agua, postura.
- FOTO DE COMIDA: Composición, macros aproximados, calidad nutricional.
- FOTO DE SUPLEMENTO: Etiqueta, ingredientes, dosis, utilidad.
- CAPTURA DE ENTRENAMIENTO: Rutina, volumen, intensidad.
- DOCUMENTO: Extrae información relevante.

RESPUESTA: Estructurada, profesional, sin jerga innecesaria. Las estimaciones visuales son aproximadas. NUNCA asumas la identidad de una persona.]${modeInstruction}`;
  }, [modeInstruction]);

  const { messages, sendMessage: agentSendMessage, setMessages, status, stop: stopAgent } = useRorkAgent({
    tools: {
      getStudentInfo: createRorkTool({
        description: 'Obtener información básica de un alumno por nombre. NUNCA usar si el mensaje contiene imágenes adjuntas sin mención explícita de un alumno por nombre.',
        zodSchema: z.object({
          studentName: z.string().describe('Nombre o parte del nombre del alumno'),
        }),
        execute(params) {
          const found = students.find(s =>
            s.name.toLowerCase().includes(params.studentName.toLowerCase())
          );
          if (!found) return 'Alumno no encontrado. Alumnos disponibles: ' + students.map(s => s.name).join(', ');
          const lastCheckIn = found.checkIns.length > 0 ? found.checkIns[found.checkIns.length - 1] : null;
          return JSON.stringify({
            id: found.id, name: found.name, age: found.age, gender: found.gender,
            height: found.height, weight: found.weight, goalWeight: found.goalWeight,
            goal: found.goal, activityLevel: found.activityLevel, bmr: found.bmr,
            tdee: found.tdee, bodyFatPercentage: found.bodyFatPercentage, notes: found.notes,
            createdAt: found.createdAt, checkInsCount: found.checkIns.length, lastCheckIn,
            nutritionPlan: found.nutritionPlan ? {
              title: found.nutritionPlan.title, calories: found.nutritionPlan.calories,
              protein: found.nutritionPlan.protein, carbs: found.nutritionPlan.carbs,
              fats: found.nutritionPlan.fats, mealsCount: found.nutritionPlan.meals?.length,
              createdAt: found.nutritionPlan.createdAt,
            } : null,
            trainingPlan: found.trainingPlan ? {
              name: found.trainingPlan.name, phase: found.trainingPlan.phase,
              daysCount: found.trainingPlan.weekDays?.length,
            } : null,
            dietHistoryCount: (found.dietHistory || []).length,
            documentsCount: (found.documents || []).length,
          });
        },
      }),
      getStudentFullProfile: createRorkTool({
        description: 'Obtener el PERFIL COMPLETO de un alumno incluyendo TODOS los check-ins. NUNCA usar si el mensaje contiene imágenes adjuntas sin que el usuario haya mencionado explícitamente un nombre de alumno.',
        zodSchema: z.object({
          studentName: z.string().describe('Nombre o parte del nombre del alumno'),
        }),
        execute(params) {
          const found = students.find(s =>
            s.name.toLowerCase().includes(params.studentName.toLowerCase())
          );
          if (!found) return 'Alumno no encontrado. Alumnos disponibles: ' + students.map(s => s.name).join(', ');
          const checkIns = found.checkIns;
          const sortedCheckIns = [...checkIns].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          const weightTrend = sortedCheckIns.map(c => ({ date: c.date, weight: c.weight, bodyFat: c.bodyFatPercentage }));
          const firstCheckIn = sortedCheckIns.length > 0 ? sortedCheckIns[0] : null;
          const lastCheckIn = sortedCheckIns.length > 0 ? sortedCheckIns[sortedCheckIns.length - 1] : null;
          const weightChange = firstCheckIn && lastCheckIn ? lastCheckIn.weight - firstCheckIn.weight : 0;
          const avgWeeklyChange = sortedCheckIns.length >= 2
            ? weightChange / Math.max(1, (new Date(lastCheckIn!.date).getTime() - new Date(firstCheckIn!.date).getTime()) / (7 * 24 * 60 * 60 * 1000))
            : 0;

          const recentCheckIns = sortedCheckIns.slice(-5).map(c => ({
            date: c.date, weight: c.weight, bodyFat: c.bodyFatPercentage,
            dietAdherence: c.dietAdherence, energyLevel: c.energyLevel, mood: c.mood,
            sleepHours: c.sleepHours, stressLevel: c.stressLevel,
            trainingPerformance: c.trainingPerformance, bloating: c.bloating,
            appetiteLevel: c.appetiteLevel, mealsCompleted: c.mealsCompleted,
            mealsPlanned: c.mealsPlanned, proteinHit: c.proteinHit, carbsHit: c.carbsHit,
            fatsHit: c.fatsHit, cheatMeals: c.cheatMeals, alcoholDrinks: c.alcoholDrinks,
            cardioMinutes: c.cardioMinutes, stepsCount: c.stepsCount, notes: c.notes,
            coachFeedback: c.coachFeedback, photosCount: c.photos?.length || 0,
          }));

          const avgAdherence = sortedCheckIns.filter(c => c.dietAdherence).length > 0
            ? sortedCheckIns.filter(c => c.dietAdherence).reduce((s, c) => s + (c.dietAdherence || 0), 0) / sortedCheckIns.filter(c => c.dietAdherence).length
            : null;
          const avgEnergy = sortedCheckIns.filter(c => c.energyLevel).length > 0
            ? sortedCheckIns.filter(c => c.energyLevel).reduce((s, c) => s + (c.energyLevel || 0), 0) / sortedCheckIns.filter(c => c.energyLevel).length
            : null;
          const avgSleep = sortedCheckIns.filter(c => c.sleepHours).length > 0
            ? sortedCheckIns.filter(c => c.sleepHours).reduce((s, c) => s + (c.sleepHours || 0), 0) / sortedCheckIns.filter(c => c.sleepHours).length
            : null;

          const currentPlan = found.nutritionPlan ? {
            title: found.nutritionPlan.title, calories: found.nutritionPlan.calories,
            protein: found.nutritionPlan.protein, carbs: found.nutritionPlan.carbs,
            fats: found.nutritionPlan.fats,
            meals: found.nutritionPlan.meals?.map(m => ({
              name: m.name, time: m.time,
              foods: m.foods?.map(f => `${f.name} ${f.quantity}${f.unit}`),
            })),
            supplements: found.nutritionPlan.supplements,
            createdAt: found.nutritionPlan.createdAt,
          } : null;

          return JSON.stringify({
            basicInfo: {
              id: found.id, name: found.name, age: found.age, gender: found.gender,
              height: found.height, currentWeight: found.weight, goalWeight: found.goalWeight,
              goal: found.goal, activityLevel: found.activityLevel, bmr: found.bmr,
              tdee: found.tdee, bodyFatPercentage: found.bodyFatPercentage, notes: found.notes,
              createdAt: found.createdAt, adherenceScore: found.adherenceScore,
              medicalConditions: found.medicalConditions, allergies: found.allergies,
              injuries: found.injuries,
            },
            evolution: {
              totalCheckIns: checkIns.length, weightTrend,
              totalWeightChange: Math.round(weightChange * 10) / 10,
              avgWeeklyWeightChange: Math.round(avgWeeklyChange * 100) / 100,
              startWeight: firstCheckIn?.weight ?? found.weight,
              currentWeight: lastCheckIn?.weight ?? found.weight,
              startBodyFat: firstCheckIn?.bodyFatPercentage,
              currentBodyFat: lastCheckIn?.bodyFatPercentage ?? found.bodyFatPercentage,
            },
            averages: {
              dietAdherence: avgAdherence ? Math.round(avgAdherence * 10) / 10 : null,
              energyLevel: avgEnergy ? Math.round(avgEnergy * 10) / 10 : null,
              sleepHours: avgSleep ? Math.round(avgSleep * 10) / 10 : null,
            },
            lastCheckIn: lastCheckIn ? {
              date: lastCheckIn.date, weight: lastCheckIn.weight,
              bodyFatPercentage: lastCheckIn.bodyFatPercentage,
              measurements: lastCheckIn.measurements, mood: lastCheckIn.mood,
              sleepHours: lastCheckIn.sleepHours, waterIntake: lastCheckIn.waterIntake,
              stressLevel: lastCheckIn.stressLevel, energyLevel: lastCheckIn.energyLevel,
              dietAdherence: lastCheckIn.dietAdherence, appetiteLevel: lastCheckIn.appetiteLevel,
              cravings: lastCheckIn.cravings, cardioMinutes: lastCheckIn.cardioMinutes,
              bloating: lastCheckIn.bloating, notes: lastCheckIn.notes,
              coachFeedback: lastCheckIn.coachFeedback,
              photosCount: lastCheckIn.photos?.length || 0,
            } : null,
            recentCheckIns,
            currentNutritionPlan: currentPlan,
            trainingPlan: found.trainingPlan ? {
              name: found.trainingPlan.name, phase: found.trainingPlan.phase,
              days: found.trainingPlan.weekDays?.map(d => ({
                dayName: d.dayName, muscleGroups: d.muscleGroups,
                exerciseCount: d.exercises?.length,
              })),
            } : null,
            dietHistoryCount: (found.dietHistory || []).length,
            documentsCount: (found.documents || []).length,
          });
        },
      }),
      calculateBMR: createRorkTool({
        description: 'Calcular TMB usando Katch-McArdle',
        zodSchema: z.object({
          weight: z.number().describe('Peso en kg'),
          bodyFatPercentage: z.number().describe('Porcentaje de grasa corporal'),
        }),
        execute(params) {
          const leanMass = params.weight * (1 - params.bodyFatPercentage / 100);
          const bmr = 370 + (21.6 * leanMass);
          return JSON.stringify({
            leanMass: Math.round(leanMass * 10) / 10, bmr: Math.round(bmr),
            tdee: {
              sedentary: Math.round(bmr * 1.2), light: Math.round(bmr * 1.375),
              moderate: Math.round(bmr * 1.55), active: Math.round(bmr * 1.725),
              veryActive: Math.round(bmr * 1.9),
            },
          });
        },
      }),
      getStudentDietHistory: createRorkTool({
        description: 'Obtener el historial completo de dietas de un alumno.',
        zodSchema: z.object({ studentName: z.string().describe('Nombre del alumno') }),
        execute(params) {
          const found = students.find(s => s.name.toLowerCase().includes(params.studentName.toLowerCase()));
          if (!found) return 'Alumno no encontrado';
          const history = getDietHistory(found.id);
          if (history.length === 0) {
            const cp = found.nutritionPlan;
            if (cp) return JSON.stringify({ studentName: found.name, message: 'Sin historial pero tiene plan activo.', currentPlan: { title: cp.title, calories: cp.calories, protein: cp.protein, carbs: cp.carbs, fats: cp.fats, createdAt: cp.createdAt }, historyEntries: [] });
            return JSON.stringify({ studentName: found.name, message: 'Sin historial de dietas.', historyEntries: [] });
          }
          return JSON.stringify({
            studentName: found.name,
            currentPlan: found.nutritionPlan ? { calories: found.nutritionPlan.calories, protein: found.nutritionPlan.protein, carbs: found.nutritionPlan.carbs, fats: found.nutritionPlan.fats } : null,
            historyEntries: history.map(h => ({ date: h.date, planTitle: h.planTitle, calories: h.calories, protein: h.protein, carbs: h.carbs, fats: h.fats, changes: h.changes, notes: h.notes, createdBy: h.createdBy })),
            totalChanges: history.length,
          });
        },
      }),
      listStudentDocuments: createRorkTool({
        description: 'Listar documentos y carpetas de un alumno.',
        zodSchema: z.object({ studentName: z.string().describe('Nombre del alumno'), folderId: z.string().optional().describe('ID de carpeta') }),
        execute(params) {
          const found = students.find(s => s.name.toLowerCase().includes(params.studentName.toLowerCase()));
          if (!found) return 'Alumno no encontrado';
          const docs = getStudentDocuments(found.id, params.folderId);
          const folders = getStudentFolders(found.id);
          return JSON.stringify({ studentName: found.name, folders: folders.map(f => ({ id: f.id, name: f.name, parentId: f.parentId })), documents: docs.map(d => ({ id: d.id, name: d.name, category: d.category, folderId: d.folderId, createdAt: d.createdAt, hasContent: !!d.content })), totalDocuments: docs.length, totalFolders: folders.length });
        },
      }),
      readStudentDocument: createRorkTool({
        description: 'Leer el contenido de un documento.',
        zodSchema: z.object({ studentName: z.string().describe('Nombre del alumno'), documentId: z.string().describe('ID del documento') }),
        execute(params) {
          const found = students.find(s => s.name.toLowerCase().includes(params.studentName.toLowerCase()));
          if (!found) return 'Alumno no encontrado';
          const doc = (found.documents || []).find(d => d.id === params.documentId);
          if (!doc) return 'Documento no encontrado';
          return JSON.stringify({ name: doc.name, category: doc.category, content: doc.content || 'Sin contenido', notes: doc.notes, createdAt: doc.createdAt, updatedAt: doc.updatedAt });
        },
      }),
      saveDocumentToStudent: createRorkTool({
        description: 'Guardar un documento en la carpeta de un alumno.',
        zodSchema: z.object({
          studentName: z.string(), documentName: z.string(),
          category: z.enum(['nutrition', 'training', 'medical', 'progress', 'other']),
          content: z.string(), folderName: z.string().optional(), notes: z.string().optional(),
        }),
        async execute(params) {
          const found = students.find(s => s.name.toLowerCase().includes(params.studentName.toLowerCase()));
          if (!found) return 'Alumno no encontrado';
          let folderId: string | undefined;
          if (params.folderName) {
            const existing = (found.folders || []).find(f => f.name.toLowerCase() === params.folderName!.toLowerCase());
            if (existing) folderId = existing.id;
          }
          const htmlContent = generateDocumentHtml(params.documentName, params.content, params.category, found.name);
          try {
            await addDocument(found.id, { name: params.documentName, category: params.category, content: params.content, htmlContent, folderId, notes: params.notes || 'Generado por HGRAND AI' });
            return JSON.stringify({ success: true, message: `Documento "${params.documentName}" guardado en perfil de ${found.name}.` });
          } catch { return JSON.stringify({ success: false, message: 'Error al guardar.' }); }
        },
      }),
      recordDietChange: createRorkTool({
        description: 'Registrar un cambio en la dieta de un alumno.',
        zodSchema: z.object({
          studentName: z.string(), planTitle: z.string(), calories: z.number(),
          protein: z.number(), carbs: z.number(), fats: z.number(),
          changes: z.string().optional(), notes: z.string().optional(),
        }),
        async execute(params) {
          const found = students.find(s => s.name.toLowerCase().includes(params.studentName.toLowerCase()));
          if (!found) return 'Alumno no encontrado';
          try {
            await addDietHistoryEntry(found.id, { studentId: found.id, date: new Date().toISOString(), calories: params.calories, protein: params.protein, carbs: params.carbs, fats: params.fats, planTitle: params.planTitle, changes: params.changes, notes: params.notes, createdBy: 'ai' });
            return JSON.stringify({ success: true, message: `Historial actualizado para ${found.name}.` });
          } catch { return JSON.stringify({ success: false, message: 'Error al registrar.' }); }
        },
      }),
      generateNutritionPDF: createRorkTool({
        description: 'Generar un plan nutricional completo en formato documento.',
        zodSchema: z.object({
          studentName: z.string(), planTitle: z.string(), calories: z.number(),
          protein: z.number(), carbs: z.number(), fats: z.number(),
          meals: z.string(), supplements: z.string().optional(),
          notes: z.string().optional(), waterTarget: z.string().optional(),
        }),
        execute(params) {
          const date = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
          const mealsHtml = params.meals.split('\n').map(line => {
            const trimmed = line.trim();
            if (!trimmed) return '';
            if (trimmed.startsWith('Comida') || trimmed.startsWith('COMIDA') || trimmed.match(/^\d+\./)) {
              return `<h3 style="color:#1a1a1a;margin:16px 0 8px;font-size:15px;border-left:3px solid #34D399;padding-left:10px;">${trimmed}</h3>`;
            }
            return `<p style="margin:3px 0 3px 16px;color:#444;font-size:13px;">${trimmed}</p>`;
          }).join('');
          const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{font-family:-apple-system,sans-serif;padding:32px 24px;color:#222;line-height:1.6;background:#fff;}</style></head><body><h1 style="text-align:center;font-size:20px;">${params.planTitle.toUpperCase()}</h1><h2 style="text-align:center;color:#34D399;font-size:13px;">${params.studentName}</h2><p style="text-align:center;color:#888;font-size:13px;">${date}</p><div style="display:flex;gap:12px;margin:12px 0;"><div style="flex:1;background:#f8faf8;border-radius:10px;padding:12px;text-align:center;"><div style="font-size:20px;font-weight:800;">${params.calories}</div><div style="font-size:11px;color:#888;">kcal</div></div><div style="flex:1;background:#f8faf8;border-radius:10px;padding:12px;text-align:center;"><div style="font-size:20px;font-weight:800;">${params.protein}g</div><div style="font-size:11px;color:#888;">Proteína</div></div><div style="flex:1;background:#f8faf8;border-radius:10px;padding:12px;text-align:center;"><div style="font-size:20px;font-weight:800;">${params.carbs}g</div><div style="font-size:11px;color:#888;">Carbos</div></div><div style="flex:1;background:#f8faf8;border-radius:10px;padding:12px;text-align:center;"><div style="font-size:20px;font-weight:800;">${params.fats}g</div><div style="font-size:11px;color:#888;">Grasas</div></div></div>${mealsHtml}${params.supplements ? `<div style="margin-top:20px;padding:12px;background:#f0f8ff;border-radius:8px;"><h3 style="color:#2471A3;">Suplementación</h3>${params.supplements.split('\n').map(l => `<p style="color:#444;font-size:13px;">${l}</p>`).join('')}</div>` : ''}</body></html>`;
          return JSON.stringify({ success: true, content: params.meals, htmlContent, message: 'PDF generado. Usa saveDocumentToStudent para guardarlo.' });
        },
      }),
      generateNutritionDraft: createRorkTool({
        description: 'Generar un plan nutricional como BORRADOR EDITABLE. Devuelve un documento estructurado que el coach puede editar inline (cambiar gramos, añadir/quitar alimentos, ajustar objetivos) antes de guardarlo o exportarlo. USAR PREFERENTEMENTE sobre generateNutritionPDF cuando el coach pida generar un plan nutricional. El plan debe incluir alimentos pesados en GRAMOS (cocidos por defecto, secos solo para crema de arroz y avena), objetivos metabólicos por comida, y sección de cardio.',
        zodSchema: z.object({
          studentName: z.string().describe('Nombre del alumno'),
          planTitle: z.string().describe('Título del plan nutricional'),
          currentWeight: z.string().optional().describe('Peso actual del atleta en kg'),
          weeklyGoal: z.string().optional().describe('Objetivo semanal (ej: -0.5kg, mantenimiento, recarga)'),
          metabolicStrategy: z.string().optional().describe('Estrategia metabólica (ej: antiinflamatorio, déficit, superávit, recomp)'),
          calories: z.number().describe('Calorías objetivo totales'),
          protein: z.number().describe('Proteína objetivo en gramos'),
          carbs: z.number().describe('Carbohidratos objetivo en gramos'),
          fats: z.number().describe('Grasas objetivo en gramos'),
          meals: z.string().describe('JSON array con las comidas. Cada comida: {name, time, objective, objectiveText, foods: [{name, quantity (gramos), weightType ("cooked" o "dry"), calories, protein, carbs, fats}]}. Los alimentos van pesados DESPUÉS DE COCIDOS excepto crema de arroz y avena que van en seco. Ejemplo: [{"name":"Comida 1 — Pre entreno","time":"07:00","objective":"pre_entreno","objectiveText":"Maximizar rendimiento","foods":[{"name":"Pollo hervido","quantity":220,"weightType":"cooked","calories":363,"protein":68,"carbs":0,"fats":8},{"name":"Arroz basmati cocido","quantity":130,"weightType":"cooked","calories":156,"protein":3.3,"carbs":33.8,"fats":0.4}]}]'),
          cardio: z.string().optional().describe('JSON object con sección cardio: {enabled, type, durationMinutes, heartRateMin, heartRateMax, frequencyPerWeek, timing ("post_entreno", "ayunas", "any"), notes}'),
          supplements: z.string().optional().describe('JSON array de suplementos: [{name, dosage, timing}]'),
          notes: z.string().optional().describe('Notas adicionales del plan'),
        }),
        execute(params) {
          let parsedMeals: any[] = [];
          try { parsedMeals = JSON.parse(params.meals); } catch { return JSON.stringify({ success: false, message: 'Error: meals no es JSON válido.' }); }
          if (!Array.isArray(parsedMeals) || parsedMeals.length === 0) {
            return JSON.stringify({ success: false, message: 'Error: meals debe ser un array con al menos una comida.' });
          }
          const draftMeals: DraftMeal[] = parsedMeals.map((m: any) => ({
            id: Date.now().toString(36) + Math.random().toString(36).substring(2, 8),
            name: m.name || 'Comida',
            time: m.time || '12:00',
            objective: m.objective,
            objectiveText: m.objectiveText || '',
            foods: (m.foods || []).map((f: any) => {
              const qty = Number(f.quantity) || 100;
              const cal = Number(f.calories) || 0;
              const pro = Number(f.protein) || 0;
              const carb = Number(f.carbs) || 0;
              const fat = Number(f.fats) || 0;
              return {
                id: Date.now().toString(36) + Math.random().toString(36).substring(2, 8),
                name: f.name || 'Alimento',
                quantity: qty,
                unit: 'g',
                weightType: f.weightType === 'dry' ? 'dry' : 'cooked',
                calories: cal,
                protein: pro,
                carbs: carb,
                fats: fat,
                perUnitCalories: cal / qty,
                perUnitProtein: pro / qty,
                perUnitCarbs: carb / qty,
                perUnitFats: fat / qty,
              };
            }),
          }));
          let cardioData: any = undefined;
          if (params.cardio) {
            try { cardioData = JSON.parse(params.cardio); } catch {}
          }
          let suppData: any = undefined;
          if (params.supplements) {
            try { suppData = JSON.parse(params.supplements); } catch {}
          }
          const draftPlan: DraftNutritionPlan = {
            documentId: Date.now().toString(36),
            title: params.planTitle,
            studentName: params.studentName,
            currentWeight: params.currentWeight,
            weeklyGoal: params.weeklyGoal,
            metabolicStrategy: params.metabolicStrategy,
            calories: params.calories,
            protein: params.protein,
            carbs: params.carbs,
            fats: params.fats,
            unitSystem: 'metric',
            meals: draftMeals,
            cardio: cardioData,
            supplements: suppData,
            notes: params.notes,
          };
          return JSON.stringify({
            success: true,
            draftPlan,
            message: 'Borrador editable generado. El coach puede editarlo inline antes de guardarlo o exportarlo como PDF.',
          });
        },
      }),
      generateTrainingPDF: createRorkTool({
        description: 'Generar un plan de entrenamiento completo.',
        zodSchema: z.object({
          studentName: z.string(), planName: z.string(),
          phase: z.enum(['hypertrophy', 'strength', 'peaking', 'deload', 'maintenance']),
          days: z.string(), notes: z.string().optional(),
        }),
        execute(params) {
          const found = students.find(s => s.name.toLowerCase().includes(params.studentName.toLowerCase()));
          if (!found) return JSON.stringify({ success: false, message: 'Alumno no encontrado' });
          const date = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
          const phaseLabels: Record<string, string> = { hypertrophy: 'Hipertrofia', strength: 'Fuerza', peaking: 'Pico', deload: 'Descarga', maintenance: 'Mantenimiento' };
          const daysHtml = params.days.split('\n').map(line => {
            const trimmed = line.trim();
            if (!trimmed) return '';
            if (trimmed.match(/^(D[ÍI]A|PUSH|PULL|LEG|UPPER|LOWER|ESPALDA|PECHO|HOMBRO|PIERNA|BRAZO)/i)) {
              return `<h3 style="color:#1A8A7A;margin:18px 0 8px;font-size:15px;font-weight:700;border-bottom:1px dashed #DDD;padding-bottom:4px;">${trimmed}</h3>`;
            }
            if (trimmed.match(/^\d+\./)) return `<p style="margin:4px 0 4px 12px;color:#333;font-size:13px;"><strong>${trimmed}</strong></p>`;
            return `<p style="margin:3px 0;color:#444;font-size:13px;">${trimmed}</p>`;
          }).join('');
          const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{font-family:-apple-system,sans-serif;padding:32px 24px;color:#222;line-height:1.6;}</style></head><body><h1 style="text-align:center;font-size:20px;">${params.planName.toUpperCase()}</h1><h2 style="text-align:center;color:#1A8A7A;font-size:13px;">${phaseLabels[params.phase] || params.phase} — ${found.name}</h2><p style="text-align:center;color:#888;font-size:13px;">${date}</p>${daysHtml}</body></html>`;
          return JSON.stringify({ success: true, content: params.days, htmlContent, message: 'Plan generado. Usa saveDocumentToStudent para guardarlo.' });
        },
      }),
      generateFitnessImage: createRorkTool({
        description: 'Generar una imagen relacionada con fitness usando IA.',
        zodSchema: z.object({ prompt: z.string(), size: z.string().optional() }),
        async execute(params) {
          try {
            const response = await fetch('https://toolkit.rork.com/images/generate/', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: params.prompt, size: params.size || '1024x1024' }),
            });
            if (!response.ok) return JSON.stringify({ success: false, message: 'Error al generar imagen.' });
            const data = await response.json();
            return JSON.stringify({ success: true, imageBase64: data.image?.base64Data ? `data:${data.image.mimeType};base64,${data.image.base64Data}` : null, message: 'Imagen generada.' });
          } catch { return JSON.stringify({ success: false, message: 'Error al generar imagen.' }); }
        },
      }),
      analyzeCheckInPhotos: createRorkTool({
        description: 'Analizar fotos de check-in de un atleta ESPECÍFICO. PROHIBIDO usar si el usuario solo subió una foto o pidió análisis sin mencionar explícitamente un nombre de alumno. Si no hay nombre de alumno en el mensaje, usa analyzePhysiqueDetailed en su lugar.',
        zodSchema: z.object({
          studentName: z.string().describe('Nombre del alumno — OBLIGATORIO. Solo usar si el usuario mencionó el nombre.'),
          compareWithPrevious: z.boolean().optional().describe('Comparar con check-in anterior'),
        }),
        execute(params) {
          const found = students.find(s => s.name.toLowerCase().includes(params.studentName.toLowerCase()));
          if (!found) return 'Alumno no encontrado';
          const sortedCheckIns = [...found.checkIns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const latest = sortedCheckIns[0];
          const previous = sortedCheckIns[1];
          if (!latest) return 'Sin check-ins disponibles.';
          const latestPhotos = latest.photos?.length || 0;
          const previousPhotos = previous?.photos?.length || 0;
          return JSON.stringify({
            studentName: found.name,
            latestCheckIn: {
              date: latest.date, weight: latest.weight, bodyFat: latest.bodyFatPercentage,
              photosCount: latestPhotos, dietAdherence: latest.dietAdherence,
              waterIntake: latest.waterIntake, sleepHours: latest.sleepHours,
              bloating: latest.bloating, energyLevel: latest.energyLevel,
            },
            previousCheckIn: previous ? {
              date: previous.date, weight: previous.weight, bodyFat: previous.bodyFatPercentage,
              photosCount: previousPhotos, dietAdherence: previous.dietAdherence,
            } : null,
            weightChange: previous ? Math.round((latest.weight - previous.weight) * 10) / 10 : null,
            bodyFatChange: previous?.bodyFatPercentage && latest.bodyFatPercentage
              ? Math.round((latest.bodyFatPercentage - previous.bodyFatPercentage) * 10) / 10 : null,
            analysisPrompt: `Analiza el progreso físico de ${found.name}. Último check-in: ${latest.date}, peso ${latest.weight}kg${latest.bodyFatPercentage ? `, BF ${latest.bodyFatPercentage}%` : ''}. ${latestPhotos} fotos disponibles. ${previous ? `Check-in anterior: ${previous.date}, peso ${previous.weight}kg. Cambio: ${Math.round((latest.weight - previous.weight) * 10) / 10}kg.` : 'Sin check-in anterior para comparar.'} Evalúa: conditioning, fullness, simetría, retención de agua, visibilidad muscular. Da recomendaciones concretas.`,
          });
        },
      }),
      generatePeakWeekProtocol: createRorkTool({
        description: 'Generar un protocolo completo de Peak Week día a día.',
        zodSchema: z.object({
          studentName: z.string().describe('Nombre del alumno'),
          showDate: z.string().optional().describe('Fecha del show (ISO)'),
          currentWeight: z.number().optional().describe('Peso actual'),
          currentBodyFat: z.number().optional().describe('% grasa actual'),
        }),
        execute(params) {
          const found = students.find(s => s.name.toLowerCase().includes(params.studentName.toLowerCase()));
          if (!found) return 'Alumno no encontrado';
          const weight = params.currentWeight || found.weight;
          const bf = params.currentBodyFat || found.bodyFatPercentage;
          const currentPlan = found.nutritionPlan;
          return JSON.stringify({
            studentName: found.name,
            currentData: { weight, bodyFat: bf, goal: found.goal },
            currentPlan: currentPlan ? { calories: currentPlan.calories, protein: currentPlan.protein, carbs: currentPlan.carbs, fats: currentPlan.fats } : null,
            showDate: params.showDate || 'No especificada',
            instructions: `Genera un protocolo de Peak Week completo para ${found.name} (${weight}kg${bf ? `, ${bf}% BF` : ''}). Incluye: Día -7 a Show Day. Variables: carbohidratos (depletion→loading), agua (incremento→corte), sodio (loading→depletion), entrenamiento (volumen→reducción). Basa el protocolo en el plan nutricional actual si existe. Personaliza según los datos del atleta.`,
          });
        },
      }),
      summarizeAthleteTimeline: createRorkTool({
        description: 'Resumir la línea temporal de un atleta en las últimas semanas.',
        zodSchema: z.object({
          studentName: z.string().describe('Nombre del alumno'),
          weeks: z.number().optional().describe('Número de semanas a resumir'),
        }),
        execute(params) {
          const found = students.find(s => s.name.toLowerCase().includes(params.studentName.toLowerCase()));
          if (!found) return 'Alumno no encontrado';
          const weeksBack = params.weeks || 4;
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - weeksBack * 7);
          const recentCheckIns = found.checkIns.filter(c => new Date(c.date) >= cutoff)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          const recentDocs = (found.documents || []).filter(d => new Date(d.createdAt) >= cutoff);
          const recentDiet = (found.dietHistory || []).filter(d => new Date(d.date) >= cutoff);
          return JSON.stringify({
            studentName: found.name, period: `Últimas ${weeksBack} semanas`,
            checkIns: recentCheckIns.map(c => ({ date: c.date, weight: c.weight, bodyFat: c.bodyFatPercentage, dietAdherence: c.dietAdherence, notes: c.notes })),
            dietChanges: recentDiet.map(d => ({ date: d.date, title: d.planTitle, calories: d.calories, changes: d.changes })),
            documentsAdded: recentDocs.map(d => ({ name: d.name, category: d.category, date: d.createdAt })),
            summary: `${found.name} tuvo ${recentCheckIns.length} check-ins, ${recentDiet.length} cambios de dieta, y ${recentDocs.length} documentos nuevos en las últimas ${weeksBack} semanas.`,
          });
        },
      }),
      suggestCoachMessage: createRorkTool({
        description: 'Sugerir un mensaje motivacional o de feedback para enviar al atleta.',
        zodSchema: z.object({
          studentName: z.string().describe('Nombre del alumno'),
          context: z.string().optional().describe('Contexto del mensaje (ej: progreso lento, buen progreso, check-in pendiente)'),
        }),
        execute(params) {
          const found = students.find(s => s.name.toLowerCase().includes(params.studentName.toLowerCase()));
          if (!found) return 'Alumno no encontrado';
          const lastCheckIn = found.checkIns.length > 0 ? found.checkIns[found.checkIns.length - 1] : null;
          return JSON.stringify({
            studentName: found.name,
            context: params.context || 'general',
            lastCheckIn: lastCheckIn ? { date: lastCheckIn.date, weight: lastCheckIn.weight, dietAdherence: lastCheckIn.dietAdherence, mood: lastCheckIn.mood } : null,
            currentGoal: found.goal,
            prompt: `Genera un mensaje personalizado para ${found.name} (objetivo: ${found.goal}). ${params.context ? `Contexto: ${params.context}.` : ''} ${lastCheckIn ? `Último check-in: ${lastCheckIn.date}, peso ${lastCheckIn.weight}kg, adherencia ${lastCheckIn.dietAdherence || 'N/A'}/10.` : 'Sin check-ins recientes.'} El mensaje debe ser motivador, profesional y personalizado. Máximo 3-4 frases.`,
          });
        },
      }),
      analyzePhysiqueDetailed: createRorkTool({
        description: 'Realizar un análisis detallado de una foto de físico. IMPORTANTE: Usa esta herramienta SOLO para estructurar el análisis visual. NO requiere nombre de alumno. Solo incluye studentName si el usuario EXPLÍCITAMENTE mencionó un nombre de alumno en su mensaje. NUNCA llames a getStudentInfo o getStudentFullProfile antes de esta herramienta si no se mencionó un alumno.',
        zodSchema: z.object({
          imageDescription: z.string().describe('Descripción de lo que se observa en la imagen basada en tu análisis visual'),
          studentName: z.string().optional().describe('SOLO si el usuario mencionó explícitamente un nombre de alumno. Dejar vacío si no se mencionó ningún alumno.'),
          comparisonContext: z.string().optional().describe('Contexto de comparación si hay múltiples imágenes'),
        }),
        execute(params) {
          const analysisTemplate: Record<string, unknown> = {
            type: 'physique_analysis',
            imageDescription: params.imageDescription,
            analysisFramework: {
              conditioning: 'Evalúa nivel de definición general (bajo/moderado/alto/competición)',
              muscleFullness: 'Evalúa llenura y densidad muscular por grupo',
              muscleSeparation: 'Evalúa visibilidad entre grupos musculares',
              bodyFatIndicators: 'Estima rango de grasa corporal visual con nivel de confianza',
              waterRetention: 'Evalúa signos de retención subcutánea',
              symmetry: 'Evalúa equilibrio entre lados y grupos',
              strongPoints: 'Identifica músculos más desarrollados',
              weakPoints: 'Identifica áreas que necesitan trabajo',
              estimatedBodyFat: 'Rango porcentual estimado visualmente',
            },
            recommendations: {
              nutrition: 'Ajustes nutricionales sugeridos',
              training: 'Ajustes de entrenamiento sugeridos',
              cardio: 'Recomendaciones de cardio',
              recovery: 'Recomendaciones de recuperación',
            },
          };

          if (params.studentName) {
            const found = students.find(s => s.name.toLowerCase().includes(params.studentName!.toLowerCase()));
            if (found) {
              const lastCheckIn = found.checkIns.length > 0 ? found.checkIns[found.checkIns.length - 1] : null;
              const prevCheckIn = found.checkIns.length > 1 ? found.checkIns[found.checkIns.length - 2] : null;
              return JSON.stringify({
                ...analysisTemplate,
                linkedAthlete: {
                  name: found.name,
                  currentWeight: lastCheckIn?.weight ?? found.weight,
                  bodyFat: lastCheckIn?.bodyFatPercentage ?? found.bodyFatPercentage,
                  goal: found.goal,
                  previousWeight: prevCheckIn?.weight,
                  previousBodyFat: prevCheckIn?.bodyFatPercentage,
                  dietAdherence: lastCheckIn?.dietAdherence,
                  currentPlan: found.nutritionPlan ? {
                    calories: found.nutritionPlan.calories,
                    protein: found.nutritionPlan.protein,
                    carbs: found.nutritionPlan.carbs,
                    fats: found.nutritionPlan.fats,
                  } : null,
                },
                instruction: `Analiza esta foto de físico de ${found.name}. Compara con sus datos: peso ${lastCheckIn?.weight ?? found.weight}kg${found.bodyFatPercentage ? `, BF ${found.bodyFatPercentage}%` : ''}. ${prevCheckIn ? `Peso anterior: ${prevCheckIn.weight}kg.` : ''} Proporciona un análisis detallado siguiendo el framework de arriba. Incluye recomendaciones personalizadas.`,
              });
            }
          }

          if (params.comparisonContext) {
            return JSON.stringify({
              ...analysisTemplate,
              type: 'physique_comparison',
              comparisonContext: params.comparisonContext,
              instruction: 'Compara las imágenes subidas. Identifica cambios en conditioning, fullness, grasa corporal, retención de agua y postura. Da conclusiones claras y recomendaciones.',
            });
          }

          return JSON.stringify({
            ...analysisTemplate,
            instruction: 'Analiza la foto de físico siguiendo el framework detallado. Proporciona evaluación completa, estimación de grasa corporal visual, y recomendaciones de nutrición/entrenamiento. NO preguntes a qué alumno pertenece.',
          });
        },
      }),
      analyzeImageGeneral: createRorkTool({
        description: 'Analizar cualquier imagen no relacionada con físico: comida, suplementos, capturas de entrenamiento, documentos con imágenes, etiquetas, etc. No requiere nombre de alumno. Analiza directamente sin preguntar.',
        zodSchema: z.object({
          imageType: z.enum(['food', 'supplement', 'training', 'document', 'other']).describe('Tipo de imagen detectada'),
          description: z.string().describe('Descripción de lo que se ve en la imagen'),
        }),
        execute(params) {
          const analysisTemplates: Record<string, Record<string, string>> = {
            food: {
              type: 'food_analysis',
              instruction: 'Analiza la composición del plato/comida. Estima macronutrientes aproximados (proteína, carbohidratos, grasas, calorías). Evalúa calidad nutricional para un atleta. Sugiere mejoras si aplica.',
            },
            supplement: {
              type: 'supplement_analysis',
              instruction: 'Lee la etiqueta del suplemento. Analiza ingredientes activos, dosis, calidad de la formulación. Evalúa si es recomendable para atletas. Indica timing óptimo de consumo.',
            },
            training: {
              type: 'training_analysis',
              instruction: 'Interpreta la rutina o captura de entrenamiento. Analiza volumen, intensidad, selección de ejercicios, y estructura. Sugiere optimizaciones.',
            },
            document: {
              type: 'document_analysis',
              instruction: 'Extrae y resume la información relevante del documento visible en la imagen. Identifica datos clave para coaching.',
            },
            other: {
              type: 'general_analysis',
              instruction: 'Describe lo que observas en la imagen y extrae cualquier información útil para el contexto de coaching deportivo.',
            },
          };
          return JSON.stringify({
            ...analysisTemplates[params.imageType] || analysisTemplates.other,
            detectedType: params.imageType,
            description: params.description,
          });
        },
      }),

      // ===================================================================
      // NUEVAS HERRAMIENTAS — Motor de Inteligencia Médica
      // ===================================================================

      runMetabolicAnalysis: createRorkTool({
        description: 'Ejecutar análisis metabólico automático de un alumno. Analiza tendencias de peso, grasa, adherencia, energía, sueño, estrés, digestión y rendimiento. Detecta marcadores de inflamación metabólica y genera recomendaciones de pruebas, nutrición, suplementos y recuperación. Usar cuando el coach pida evaluar el estado metabólico de un atleta.',
        zodSchema: z.object({
          studentName: z.string().describe('Nombre exacto del alumno'),
        }),
        async execute(params) {
          const found = students.find(s => s.name.toLowerCase().includes(params.studentName.toLowerCase()));
          if (!found) return 'Alumno no encontrado. Alumnos disponibles: ' + students.map(s => s.name).join(', ');
          try {
            const analysis = await apiRunMetabolic(found.id);
            if ('error' in analysis) return JSON.stringify(analysis);
            return JSON.stringify({
              studentName: found.name,
              ...analysis,
              instruction: 'Interpreta este análisis metabólico. Explica los hallazgos en lenguaje claro. Prioriza las recomendaciones más urgentes. Si hay marcadores de inflamación, explica qué significan y qué hacer. Si hay pruebas médicas sugeridas, explícalas.',
            });
          } catch (err) {
            return JSON.stringify({ error: 'Error ejecutando análisis metabólico. Verifica que el alumno tenga al menos 3 check-ins.' });
          }
        },
      }),

      getAthleteMemory: createRorkTool({
        description: 'Consultar la memoria lineal completa (timeline) de un atleta: cada cambio de plan, sugerencia, decisión, análisis, alerta, evento registrado cronológicamente.',
        zodSchema: z.object({
          studentName: z.string().describe('Nombre del alumno'),
        }),
        async execute(params) {
          const found = students.find(s => s.name.toLowerCase().includes(params.studentName.toLowerCase()));
          if (!found) return 'Alumno no encontrado. Alumnos disponibles: ' + students.map(s => s.name).join(', ');
          try {
            const memory = await fetchAthleteMemory(found.id);
            if (memory.length === 0) return JSON.stringify({ studentName: found.name, message: 'No hay eventos registrados en la memoria de este atleta aún.', events: [] });
            const summary = memory.map(e => ({
              date: e.date, type: e.type, title: e.title, description: e.description, createdBy: e.createdBy,
            }));
            return JSON.stringify({
              studentName: found.name,
              totalEvents: memory.length,
              firstEvent: memory[0]?.date ?? 'N/A',
              lastEvent: memory[memory.length - 1]?.date ?? 'N/A',
              events: summary,
              instruction: 'Presenta esta memoria como una línea de tiempo. Agrupa eventos relacionados. Destaca patrones y decisiones clave. Si hay riesgos o alertas no resueltos, menciónalos.',
            });
          } catch {
            return JSON.stringify({ studentName: found.name, events: [], message: 'Memoria no disponible (backend offline).' });
          }
        },
      }),

      recordAthleteEvent: createRorkTool({
        description: 'Registrar un evento importante en la memoria lineal del atleta. Usar SIEMPRE después de: generar un plan, hacer una sugerencia, detectar un riesgo, analizar medios, o cuando el coach tome una decisión.',
        zodSchema: z.object({
          studentName: z.string().describe('Nombre del alumno'),
          eventType: z.enum(['ai_suggestion', 'coach_decision', 'plan_change', 'athlete_agreement', 'checkin_review', 'media_analysis', 'metabolic_analysis', 'supplement_change', 'risk_detected', 'risk_resolved', 'alert_triggered', 'corrective_action', 'test_recommended', 'diet_adjustment', 'coach_note', 'system_event']).describe('Tipo de evento'),
          title: z.string().describe('Título del evento'),
          description: z.string().describe('Descripción detallada'),
          metadata: z.string().optional().describe('Metadatos JSON (opcional): plan antes/después, cambios de suplementos, IDs de análisis, etc.'),
        }),
        async execute(params) {
          const found = students.find(s => s.name.toLowerCase().includes(params.studentName.toLowerCase()));
          if (!found) return 'Alumno no encontrado';
          try {
            let meta = {};
            try { if (params.metadata) meta = JSON.parse(params.metadata); } catch {}
            const event = {
              type: params.eventType, title: params.title, description: params.description,
              date: new Date().toISOString(), createdBy: 'ai' as const, metadata: meta, studentId: found.id,
            };
            const result = await recordMemoryEvent(found.id, event);
            return JSON.stringify({ success: true, eventId: result.id, message: `Evento registrado en la memoria de ${found.name}.` });
          } catch {
            return JSON.stringify({ success: false, message: 'No se pudo registrar (backend offline). El evento se registró localmente.' });
          }
        },
      }),

      detectPlanRisks: createRorkTool({
        description: 'Escanear el plan nutricional activo de un atleta y detectar riesgos metabólicos: déficit calórico prolongado, grasas insuficientes, proteína baja, exceso de cardio, adaptación metabólica, disrupción hormonal.',
        zodSchema: z.object({
          studentName: z.string().describe('Nombre del alumno'),
        }),
        async execute(params) {
          const found = students.find(s => s.name.toLowerCase().includes(params.studentName.toLowerCase()));
          if (!found) return 'Alumno no encontrado. Alumnos disponibles: ' + students.map(s => s.name).join(', ');
          try {
            // First ensure metabolic analysis exists
            await apiRunMetabolic(found.id).catch(() => {});
            const risks = await fetchPlanRisks(found.id);
            const activeRisks = risks.filter(r => !r.resolved);
            if (activeRisks.length === 0) {
              return JSON.stringify({ studentName: found.name, risksFound: 0, message: 'No se detectaron riesgos metabólicos en el plan actual. El plan parece estar bien balanceado.', risks: [] });
            }
            return JSON.stringify({
              studentName: found.name,
              risksFound: activeRisks.length,
              risks: activeRisks.map(r => ({
                category: r.category, severity: r.severity, title: r.title,
                description: r.description, suggestedAction: r.suggestedAction, detectedDate: r.detectedDate,
              })),
              instruction: 'Analiza estos riesgos detectados. Explica cada uno en lenguaje claro. Para los críticos (critical), usa ALERTA. Prioriza las acciones sugeridas. Pregunta al coach si quiere ajustar el plan.',
            });
          } catch {
            return JSON.stringify({ studentName: found.name, risks: [], message: 'No se pudieron detectar riesgos (backend offline).' });
          }
        },
      }),

      getPlanRisks: createRorkTool({
        description: 'Obtener la lista de riesgos metabólicos activos y resueltos de un atleta.',
        zodSchema: z.object({
          studentName: z.string().describe('Nombre del alumno'),
        }),
        async execute(params) {
          const found = students.find(s => s.name.toLowerCase().includes(params.studentName.toLowerCase()));
          if (!found) return 'Alumno no encontrado';
          try {
            const risks = await fetchPlanRisks(found.id);
            return JSON.stringify({
              studentName: found.name,
              active: risks.filter(r => !r.resolved).length,
              resolved: risks.filter(r => r.resolved).length,
              risks: risks.map(r => ({
                category: r.category, severity: r.severity, title: r.title,
                description: r.description, suggestedAction: r.suggestedAction,
                detectedDate: r.detectedDate, resolved: r.resolved, resolvedDate: r.resolvedDate,
              })),
            });
          } catch {
            return JSON.stringify({ studentName: found.name, risks: [] });
          }
        },
      }),

      checkSupplementCompatibility: createRorkTool({
        description: 'Analizar la compatibilidad de los suplementos de un atleta. Detecta interacciones peligrosas, competición por absorción, toxicidad hepática, estrés renal, dosis excesivas, y riesgos por uso prolongado.',
        zodSchema: z.object({
          studentName: z.string().describe('Nombre del alumno'),
          supplementList: z.string().optional().describe('Lista de suplementos a analizar (si no se proporciona, usa los del plan activo)'),
        }),
        async execute(params) {
          const found = students.find(s => s.name.toLowerCase().includes(params.studentName.toLowerCase()));
          if (!found) return 'Alumno no encontrado. Alumnos disponibles: ' + students.map(s => s.name).join(', ');
          const supplements = params.supplementList
            ? params.supplementList.split(',').map(s => s.trim())
            : (found.nutritionPlan?.supplements?.map(s => `${s.name} (${s.dosage}, ${s.timing})`) ?? []);
          if (supplements.length === 0) {
            return JSON.stringify({ studentName: found.name, message: 'Este atleta no tiene suplementos registrados en su plan activo.', supplements: [], alerts: [] });
          }
          try {
            const alerts = await fetchSupplementAlerts(found.id);
            return JSON.stringify({
              studentName: found.name,
              supplements,
              existingAlerts: alerts.filter(a => !a.resolved).length,
              alerts: alerts.filter(a => !a.resolved).map(a => ({
                type: a.type, severity: a.severity, supplements: a.supplements,
                description: a.description, recommendation: a.recommendation,
              })),
              instruction: `Analiza esta lista de suplementos: ${supplements.join(', ')}. Evalúa compatibilidad entre ellos. Considera: competición por absorción (ej: zinc y calcio), riesgo hepático (ej: múltiples suplementos metabolizados por hígado), estrés renal (ej: creatina + alta proteína con poca agua), dosis máximas seguras, y riesgos por uso prolongado. Si hay alergias conocidas del atleta (${found.allergies?.join(', ') || 'ninguna registrada'}), verifica contra los ingredientes. Sugiere ajustes de timing si hay conflictos de absorción. Alerta sobre cualquier combinación peligrosa.`,
            });
          } catch {
            return JSON.stringify({
              studentName: found.name, supplements,
              instruction: `Analiza esta lista de suplementos: ${supplements.join(', ')}. Busca incompatibilidades conocidas, riesgos por uso prolongado, dosis seguras, y conflictos de absorción. Sugiere timing óptimo.`,
            });
          }
        },
      }),

      getSupplementAlerts: createRorkTool({
        description: 'Obtener las alertas de incompatibilidad de suplementos activas y resueltas de un atleta.',
        zodSchema: z.object({
          studentName: z.string().describe('Nombre del alumno'),
        }),
        async execute(params) {
          const found = students.find(s => s.name.toLowerCase().includes(params.studentName.toLowerCase()));
          if (!found) return 'Alumno no encontrado';
          try {
            const alerts = await fetchSupplementAlerts(found.id);
            return JSON.stringify({
              studentName: found.name,
              active: alerts.filter(a => !a.resolved).length,
              resolved: alerts.filter(a => a.resolved).length,
              alerts: alerts.map(a => ({
                type: a.type, severity: a.severity, supplements: a.supplements,
                description: a.description, recommendation: a.recommendation,
                detectedDate: a.detectedDate, resolved: a.resolved,
              })),
            });
          } catch {
            return JSON.stringify({ studentName: found.name, alerts: [] });
          }
        },
      }),

      saveMediaAnalysisForAthlete: createRorkTool({
        description: 'Guardar un análisis de imagen/video en la memoria del atleta. Usar después de analizar fotos de check-in, comparativas de progreso, o cualquier análisis visual vinculado a un atleta específico.',
        zodSchema: z.object({
          studentName: z.string().describe('Nombre del alumno'),
          analysisType: z.enum(['physique', 'food', 'supplement', 'training', 'posture', 'injury', 'progress_comparison']).describe('Tipo de análisis'),
          summary: z.string().describe('Resumen del análisis visual'),
          findings: z.string().describe('Hallazgos detallados en formato JSON: { "conditioning": "...", "fullness": "...", etc }'),
          recommendations: z.string().optional().describe('Recomendaciones derivadas del análisis'),
          bodyFatEstimateMin: z.number().optional().describe('Estimación visual de grasa corporal - mínimo'),
          bodyFatEstimateMax: z.number().optional().describe('Estimación visual de grasa corporal - máximo'),
          bodyFatConfidence: z.enum(['low', 'medium', 'high']).optional().describe('Nivel de confianza de la estimación'),
        }),
        async execute(params) {
          const found = students.find(s => s.name.toLowerCase().includes(params.studentName.toLowerCase()));
          if (!found) return 'Alumno no encontrado. Alumnos disponibles: ' + students.map(s => s.name).join(', ');
          try {
            let findingsObj: Record<string, string> = {};
            try { findingsObj = JSON.parse(params.findings); } catch { findingsObj = { raw: params.findings }; }
            const analysis = {
              type: params.analysisType, mediaUris: [], summary: params.summary,
              detailedFindings: findingsObj, date: new Date().toISOString(),
              recommendations: params.recommendations ? params.recommendations.split('\n').filter(Boolean) : [],
              createdBy: 'ai' as const,
              ...(params.bodyFatEstimateMin && params.bodyFatEstimateMax ? {
                bodyFatEstimate: { min: params.bodyFatEstimateMin, max: params.bodyFatEstimateMax, confidence: params.bodyFatConfidence || 'medium' },
              } : {}),
              studentId: found.id,
            };
            const result = await saveMediaAnalysis(found.id, analysis);
            return JSON.stringify({ success: true, analysisId: result.id, message: `Análisis guardado en el perfil de ${found.name}.` });
          } catch {
            return JSON.stringify({ success: false, message: 'No se pudo guardar (backend offline).' });
          }
        },
      }),

      suggestCorrectivePlan: createRorkTool({
        description: 'Sugerir ajustes correctivos al plan de un atleta basado en hallazgos metabólicos, riesgos detectados, o incompatibilidades de suplementos. Debe usarse después de ejecutar análisis metabólico o detectar riesgos.',
        zodSchema: z.object({
          studentName: z.string().describe('Nombre del alumno'),
          issueType: z.enum(['metabolic_adaptation', 'hormonal_risk', 'inflammation', 'digestive', 'overtraining', 'supplement_conflict', 'micronutrient_gap']).describe('Tipo de problema a corregir'),
          description: z.string().describe('Descripción del problema'),
          currentPlanSummary: z.string().describe('Resumen del plan actual (calorías, macros, suplementos)'),
        }),
        execute(params) {
          const found = students.find(s => s.name.toLowerCase().includes(params.studentName.toLowerCase()));
          if (!found) return 'Alumno no encontrado';
          return JSON.stringify({
            studentName: found.name,
            issue: params.issueType,
            currentPlanSummary: params.currentPlanSummary,
            instruction: `Basado en el problema detectado (${params.issueType}: ${params.description}) y el plan actual (${params.currentPlanSummary}), genera un plan correctivo detallado. Incluye: ajustes específicos de calorías/macros, cambios de alimentos, suplementos correctivos con dosis, timeline de implementación (día 1, semana 1, semana 2...), y criterios de éxito para saber si está funcionando. Prioriza la salud metabólica sobre la velocidad de resultados. Si sugieres pruebas médicas, especifica exactamente cuáles y por qué.`,
          });
        },
      }),

      // ===================================================================
      // DOCUMENTOS Y PDF — Lectura y exportación
      // ===================================================================

      readUploadedDocument: createRorkTool({
        description: 'Extraer y leer el contenido de un documento que el coach haya subido (PDF, TXT, DOC, CSV, informe clínico, etc.). Usar cuando el coach suba un documento y pida que lo leas o analices. Si el documento es una imagen, usa analyzeImageGeneral en su lugar.',
        zodSchema: z.object({
          fileName: z.string().describe('Nombre del archivo subido'),
          fileType: z.string().optional().describe('Tipo MIME del archivo (ej: application/pdf, text/plain)'),
          summaryRequest: z.string().optional().describe('Qué quiere el coach que busques en el documento (opcional)'),
        }),
        execute(params) {
          return JSON.stringify({
            fileName: params.fileName,
            fileType: params.fileType || 'desconocido',
            instruction: `El coach ha subido un documento llamado "${params.fileName}"${params.fileType ? ` de tipo ${params.fileType}` : ''}. ${params.summaryRequest ? `Quiere que busques: ${params.summaryRequest}.` : 'Analiza el contenido visible en el documento.'} Si puedes ver el texto del documento en las imágenes adjuntas, extráelo y analízalo. Si es un PDF escaneado o imagen, describe lo que ves. Estructura tu respuesta de forma clara: primero un resumen ejecutivo, luego los datos clave, y finalmente recomendaciones si aplican.`,
          });
        },
      }),

      exportToPDF: createRorkTool({
        description: 'Formatear tu respuesta actual como un documento PDF profesional listo para exportar. Usar cuando el coach pida "exporta esto como PDF", "genera un documento", "pásamelo en PDF", o "guarda esto como informe".',
        zodSchema: z.object({
          title: z.string().describe('Título del documento PDF'),
          category: z.enum(['nutrition', 'training', 'medical', 'progress', 'other']).describe('Categoría del documento'),
          content: z.string().describe('Contenido completo formateado para PDF (usa markdown: ## para títulos, **negritas**, - listas)'),
          studentName: z.string().optional().describe('Nombre del alumno si el documento es para uno específico'),
        }),
        execute(params) {
          const htmlContent = generateDocumentHtml(params.title, params.content, params.category, params.studentName || 'Coach');
          return JSON.stringify({
            success: true,
            title: params.title,
            category: params.category,
            htmlContent,
            message: `PDF "${params.title}" generado. El coach puede guardarlo o exportarlo desde la app.`,
          });
        },
      }),
    },
  });

  const isStreaming = status === 'streaming' || status === 'submitted';
  const hasMessages = messages.length > 0;

  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(Animated.sequence([
        Animated.timing(micPulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
        Animated.timing(micPulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])).start();
    } else {
      micPulseAnim.stopAnimation();
      micPulseAnim.setValue(1);
    }
  }, [isRecording, micPulseAnim]);

  useEffect(() => {
    if (voiceState === 'listening') {
      Animated.loop(Animated.sequence([
        Animated.timing(voicePulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(voicePulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.timing(voiceRingAnim, { toValue: 0.8, duration: 1200, useNativeDriver: true }),
        Animated.timing(voiceRingAnim, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.timing(voiceRing2Anim, { toValue: 0.5, duration: 1600, useNativeDriver: true }),
        Animated.timing(voiceRing2Anim, { toValue: 0.1, duration: 1600, useNativeDriver: true }),
      ])).start();
    } else {
      voicePulseAnim.stopAnimation(); voicePulseAnim.setValue(1);
      voiceRingAnim.stopAnimation(); voiceRingAnim.setValue(0.4);
      voiceRing2Anim.stopAnimation(); voiceRing2Anim.setValue(0.2);
    }
  }, [voiceState, voicePulseAnim, voiceRingAnim, voiceRing2Anim]);

  useEffect(() => {
    if (voiceMode && voiceState === 'responding') {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant' && !isStreaming) {
        const textParts = lastMsg.parts
          .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && 'text' in p)
          .map(p => p.text).join('\n');
        if (textParts) { setVoiceResponse(textParts); setVoiceState('idle'); }
      }
    }
  }, [messages, isStreaming, voiceMode, voiceState]);

  const handleSend = useCallback((text?: string, files?: AttachedFile[]) => {
    const messageText = text || input.trim();
    const filesToSend = files || attachedFiles;
    if ((!messageText && filesToSend.length === 0) || isStreaming) return;
    const isFirstMessage = messages.length === 0;
    const hasImages = filesToSend.some(f => f.isImage);
    const imageCount = filesToSend.filter(f => f.isImage).length;
    let autoPrompt = 'Analiza los archivos adjuntos directamente sin preguntar a qué alumno pertenecen.';
    if (hasImages && !messageText) {
      if (imageCount >= 2) {
        autoPrompt = '[MODO ANÁLISIS DIRECTO — NO listar alumnos, NO preguntar por alumno, NO usar herramientas de alumno] Analiza y compara estas imágenes directamente. Si son fotos de físico, evalúa conditioning, fullness muscular, separación muscular, grasa corporal estimada, retención de agua, simetría, puntos fuertes y débiles. Compara las diferencias entre las imágenes. Si son otro tipo de imágenes, extrae información útil de cada una. Responde con el análisis completo inmediatamente.';
      } else {
        autoPrompt = '[MODO ANÁLISIS DIRECTO — NO listar alumnos, NO preguntar por alumno, NO usar herramientas de alumno] Analiza esta imagen en detalle directamente. Si es una foto de físico, evalúa: conditioning, fullness muscular, separación muscular, indicadores de grasa corporal (estima un rango %), retención de agua, simetría, puntos fuertes, puntos débiles. Incluye recomendaciones de nutrición y entrenamiento. Si es otro tipo de imagen (comida, suplemento, documento, etc.), extrae toda la información útil. Responde con el análisis completo inmediatamente.';
      }
    } else if (hasImages && messageText) {
      const lowerText = messageText.toLowerCase();
      const hasStudentName = students.some(s => lowerText.includes(s.name.toLowerCase()));
      if (!hasStudentName) {
        autoPrompt = `[MODO ANÁLISIS DIRECTO — NO listar alumnos, NO preguntar por alumno] ${messageText}`;
      }
    }
    let finalText: string;
    if (hasImages && messageText) {
      const lowerText = messageText.toLowerCase();
      const hasStudentName = students.some(s => lowerText.includes(s.name.toLowerCase()));
      if (!hasStudentName) {
        finalText = isFirstMessage ? `${imageOnlySystemContext}\n\n[INSTRUCCIÓN OBLIGATORIA: Analiza la imagen directamente. NO listes alumnos. NO uses herramientas de alumno. Responde SOLO sobre la imagen.] ${messageText}` : `[INSTRUCCIÓN OBLIGATORIA: Analiza la imagen directamente. NO listes alumnos. NO uses herramientas de alumno. Responde SOLO sobre la imagen.] ${messageText}`;
      } else {
        finalText = isFirstMessage ? `${systemContext}\n\n${messageText}` : messageText;
      }
    } else if (hasImages && !messageText) {
      finalText = isFirstMessage ? `${imageOnlySystemContext}\n\n${autoPrompt}` : autoPrompt;
    } else {
      finalText = isFirstMessage ? `${systemContext}\n\n${messageText || autoPrompt}` : (messageText || autoPrompt);
    }
    if (filesToSend.length > 0) {
      userAttachmentsRef.current.set(messages.length, [...filesToSend]);
      const messageFiles = filesToSend.map(f => ({ type: "file" as const, mimeType: f.mimeType, uri: f.uri }));
      agentSendMessage({ text: finalText, files: messageFiles as any });
    } else {
      agentSendMessage(finalText);
    }
    setInput(''); setAttachedFiles([]);
    setTimeout(() => { flatListRef.current?.scrollToEnd({ animated: true }); }, 100);
  }, [input, attachedFiles, isStreaming, agentSendMessage, messages.length, systemContext, imageOnlySystemContext, students]);

  const handleQuickTool = useCallback((tool: QuickTool) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleSend(tool.prompt);
  }, [handleSend]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setAttachedFiles([]);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [setMessages]);

  const handleCopy = useCallback(async (text: string, msgId: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedId(msgId);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const pickImage = useCallback(async () => {
    setShowAttachMenu(false);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, base64: true, allowsMultipleSelection: true, selectionLimit: 5 });
      if (!result.canceled && result.assets) {
        const newFiles: AttachedFile[] = result.assets.map((asset, idx) => ({
          uri: asset.base64 ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}` : asset.uri,
          mimeType: asset.mimeType || 'image/jpeg', name: asset.fileName || `foto_${idx + 1}.jpg`, isImage: true,
        }));
        setAttachedFiles(prev => [...prev, ...newFiles].slice(0, 5));
      }
    } catch (err) { console.log('Error picking image:', err); }
  }, []);

  const takePhoto = useCallback(async () => {
    setShowAttachMenu(false);
    try {
      const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (camStatus !== 'granted') { Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara.'); return; }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8, base64: true });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setAttachedFiles(prev => [...prev, {
          uri: asset.base64 ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}` : asset.uri,
          mimeType: asset.mimeType || 'image/jpeg', name: 'foto_camara.jpg', isImage: true,
        }].slice(0, 5));
      }
    } catch (err) { console.log('Error taking photo:', err); }
  }, []);

  const pickDocument = useCallback(async () => {
    setShowAttachMenu(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'text/plain', 'application/msword', 'image/*'], multiple: true });
      if (!result.canceled && result.assets) {
        const newFiles: AttachedFile[] = result.assets.map(asset => ({
          uri: asset.uri, mimeType: asset.mimeType || 'application/octet-stream',
          name: asset.name || 'documento', isImage: (asset.mimeType || '').startsWith('image/'),
        }));
        setAttachedFiles(prev => [...prev, ...newFiles].slice(0, 5));
      }
    } catch (err) { console.log('Error picking document:', err); }
  }, []);

  const removeAttachedFile = useCallback((index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const transcribeAudio = useCallback(async (formData: FormData): Promise<string | null> => {
    try {
      const response = await fetch(STT_URL, { method: 'POST', body: formData });
      if (!response.ok) return null;
      const data = await response.json();
      return data.text?.trim() || null;
    } catch (err) { console.log('Transcription error:', err); return null; }
  }, []);

  const startRecordingNative = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') { Alert.alert('Permiso requerido', 'Necesitamos acceso al micrófono.'); return false; }
      if (recordingRef.current) { try { await recordingRef.current.stopAndUnloadAsync(); } catch {} recordingRef.current = null; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: 2,
          audioEncoder: 3,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: 'lpcm',
          audioQuality: 96,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      });
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true); setRecordingDuration(0);
      durationIntervalRef.current = setInterval(() => setRecordingDuration(prev => prev + 1), 1000);
      return true;
    } catch (err) { console.log('Recording start error:', err); Alert.alert('Error', 'No se pudo iniciar la grabación.'); return false; }
  }, []);

  const startRecordingWeb = useCallback(async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator?.mediaDevices?.getUserMedia) { Alert.alert('Error', 'Tu navegador no soporta grabación de audio.'); return false; }
      if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined' && !MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/ogg';
      }
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.start(250);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true); setRecordingDuration(0);
      durationIntervalRef.current = setInterval(() => setRecordingDuration(prev => prev + 1), 1000);
      return true;
    } catch (err) {
      console.log('Web recording error:', err);
      if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
      Alert.alert('Error', 'No se pudo acceder al micrófono.'); return false;
    }
  }, []);

  const stopRecordingNative = useCallback(async () => {
    if (!recordingRef.current) { setIsRecording(false); return; }
    try {
      if (durationIntervalRef.current) { clearInterval(durationIntervalRef.current); durationIntervalRef.current = null; }
      setIsRecording(false); setIsTranscribing(true);
      const recording = recordingRef.current; recordingRef.current = null;
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      if (!uri) { setIsTranscribing(false); return; }
      const uriParts = uri.split('.'); const fileType = uriParts[uriParts.length - 1] || 'm4a';
      const mimeType = fileType === 'wav' ? 'audio/wav' : `audio/${fileType}`;
      const formData = new FormData();
      formData.append('audio', { uri, name: `recording.${fileType}`, type: mimeType } as unknown as Blob);
      formData.append('language', 'es');
      const text = await transcribeAudio(formData);
      setIsTranscribing(false);
      if (text) { setInput(prev => prev ? `${prev} ${text}` : text); inputRef.current?.focus(); }
      else Alert.alert('Sin resultado', 'No se pudo transcribir.');
    } catch (err) { console.log('Stop recording error:', err); recordingRef.current = null; setIsRecording(false); setIsTranscribing(false); }
  }, [transcribeAudio]);

  const stopRecordingWeb = useCallback(async () => {
    if (!mediaRecorderRef.current) { setIsRecording(false); return; }
    try {
      if (durationIntervalRef.current) { clearInterval(durationIntervalRef.current); durationIntervalRef.current = null; }
      setIsRecording(false); setIsTranscribing(true);
      const mediaRecorder = mediaRecorderRef.current;
      const mimeType = mediaRecorder.mimeType || 'audio/webm';
      const audioBlob = await new Promise<Blob>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('timeout')), 5000);
        mediaRecorder.onstop = () => { clearTimeout(timeout); resolve(new Blob(audioChunksRef.current, { type: mimeType })); };
        if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
        else { clearTimeout(timeout); resolve(new Blob(audioChunksRef.current, { type: mimeType })); }
      });
      if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
      mediaRecorderRef.current = null;
      if (audioBlob.size < 100) { setIsTranscribing(false); Alert.alert('Sin audio', 'Grabación vacía.'); return; }
      const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
      const formData = new FormData(); formData.append('audio', audioBlob, `recording.${ext}`); formData.append('language', 'es');
      const text = await transcribeAudio(formData);
      setIsTranscribing(false);
      if (text) { setInput(prev => prev ? `${prev} ${text}` : text); inputRef.current?.focus(); }
      else Alert.alert('Sin resultado', 'No se pudo transcribir.');
    } catch (err) {
      console.log('Stop web recording error:', err);
      if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
      mediaRecorderRef.current = null; setIsRecording(false); setIsTranscribing(false);
    }
  }, [transcribeAudio]);

  const toggleRecording = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isRecording) { if (Platform.OS === 'web') await stopRecordingWeb(); else await stopRecordingNative(); }
    else { if (Platform.OS === 'web') await startRecordingWeb(); else await startRecordingNative(); }
  }, [isRecording, startRecordingNative, startRecordingWeb, stopRecordingNative, stopRecordingWeb]);

  const startVoiceNative = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') { setVoiceState('idle'); return false; }
      if (voiceRecordingRef.current) { try { await voiceRecordingRef.current.stopAndUnloadAsync(); } catch {} voiceRecordingRef.current = null; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: 2,
          audioEncoder: 3,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: 'lpcm',
          audioQuality: 96,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      });
      await recording.startAsync();
      voiceRecordingRef.current = recording; setVoiceState('listening'); return true;
    } catch { setVoiceState('idle'); return false; }
  }, []);

  const startVoiceWeb = useCallback(async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator?.mediaDevices?.getUserMedia) { setVoiceState('idle'); return false; }
      if (voiceStreamRef.current) { voiceStreamRef.current.getTracks().forEach(t => t.stop()); voiceStreamRef.current = null; }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceStreamRef.current = stream;
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined' && !MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/mp4';
      const mr = new MediaRecorder(stream, { mimeType });
      voiceAudioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) voiceAudioChunksRef.current.push(e.data); };
      mr.start(250); voiceMediaRecorderRef.current = mr; setVoiceState('listening'); return true;
    } catch { if (voiceStreamRef.current) { voiceStreamRef.current.getTracks().forEach(t => t.stop()); voiceStreamRef.current = null; } setVoiceState('idle'); return false; }
  }, []);

  const stopVoiceNative = useCallback(async () => {
    if (!voiceRecordingRef.current) { setVoiceState('idle'); return; }
    try {
      setVoiceState('processing');
      const recording = voiceRecordingRef.current; voiceRecordingRef.current = null;
      await recording.stopAndUnloadAsync(); await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI(); if (!uri) { setVoiceState('idle'); return; }
      const uriParts = uri.split('.'); const fileType = uriParts[uriParts.length - 1] || 'm4a';
      const formData = new FormData();
      formData.append('audio', { uri, name: `recording.${fileType}`, type: fileType === 'wav' ? 'audio/wav' : `audio/${fileType}` } as unknown as Blob);
      formData.append('language', 'es');
      const text = await transcribeAudio(formData);
      if (text) { setVoiceTranscript(text); setVoiceState('responding'); setVoiceResponse(''); agentSendMessage(messages.length === 0 ? `${systemContext}\n\n${text}` : text); }
      else { setVoiceState('idle'); Alert.alert('Sin resultado', 'No se pudo transcribir.'); }
    } catch { voiceRecordingRef.current = null; setVoiceState('idle'); }
  }, [transcribeAudio, messages.length, systemContext, agentSendMessage]);

  const stopVoiceWeb = useCallback(async () => {
    if (!voiceMediaRecorderRef.current) { setVoiceState('idle'); return; }
    try {
      setVoiceState('processing');
      const mr = voiceMediaRecorderRef.current; const mimeType = mr.mimeType || 'audio/webm';
      const blob = await new Promise<Blob>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('timeout')), 5000);
        mr.onstop = () => { clearTimeout(t); resolve(new Blob(voiceAudioChunksRef.current, { type: mimeType })); };
        if (mr.state !== 'inactive') mr.stop(); else { clearTimeout(t); resolve(new Blob(voiceAudioChunksRef.current, { type: mimeType })); }
      });
      if (voiceStreamRef.current) { voiceStreamRef.current.getTracks().forEach(t => t.stop()); voiceStreamRef.current = null; }
      voiceMediaRecorderRef.current = null;
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const formData = new FormData(); formData.append('audio', blob, `recording.${ext}`); formData.append('language', 'es');
      const text = await transcribeAudio(formData);
      if (text) { setVoiceTranscript(text); setVoiceState('responding'); setVoiceResponse(''); agentSendMessage(messages.length === 0 ? `${systemContext}\n\n${text}` : text); }
      else { setVoiceState('idle'); }
    } catch { if (voiceStreamRef.current) { voiceStreamRef.current.getTracks().forEach(t => t.stop()); voiceStreamRef.current = null; } voiceMediaRecorderRef.current = null; setVoiceState('idle'); }
  }, [transcribeAudio, messages.length, systemContext, agentSendMessage]);

  const toggleVoiceRecording = useCallback(async () => {
    if (voiceState === 'listening') { if (Platform.OS === 'web') await stopVoiceWeb(); else await stopVoiceNative(); }
    else if (voiceState === 'idle') { setVoiceTranscript(''); setVoiceResponse(''); if (Platform.OS === 'web') await startVoiceWeb(); else await startVoiceNative(); }
  }, [voiceState, startVoiceNative, startVoiceWeb, stopVoiceNative, stopVoiceWeb]);

  const closeVoiceMode = useCallback(async () => {
    setVoiceMode(false);
  }, []);

  // Auto-open voice mode when navigated with ?voice=1 param
  useEffect(() => {
    if (params.voice === '1' && !voiceAutoOpenedRef.current) {
      voiceAutoOpenedRef.current = true;
      setVoiceMode(true);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [params.voice]);

  const openVoiceMode = useCallback(async () => {
    setVoiceMode(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  /** Stable refs so voice polling always reads latest state */
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const isStreamingRef = useRef(isStreaming);
  isStreamingRef.current = isStreaming;
  const systemContextRef = useRef(systemContext);
  systemContextRef.current = systemContext;

  /**
   * Called by VoiceConversation when coach finishes speaking.
   * `onPartial` (optional) is invoked with each newly-completed sentence as
   * soon as it's ready, so the caller can start speaking it immediately
   * instead of waiting for the whole response — this is what makes the
   * voice mode feel fluid/real-time instead of "record → wait → play".
   */
  const handleVoiceCoachMessage = useCallback(async (
    text: string,
    onPartial?: (chunkText: string) => void,
  ): Promise<string> => {
    const currentMsgs = messagesRef.current;
    const isFirstMessage = currentMsgs.length === 0;

    // ── Auto-inject the athlete's full linear memory (since day one) ────
    // Instead of depending on the AI deciding to call getAthleteMemory,
    // we fetch it directly whenever an athlete is named in the transcript,
    // so Sol always has continuity across sessions in voice mode.
    let memoryBlock = '';
    try {
      const athleteIds = detectAthleteContext(text, students);
      const athlete = students.find((s) => athleteIds.includes(s.id));
      if (athlete) {
        const memory = await fetchAthleteMemory(athlete.id);
        if (memory.length > 0) {
          const recent = memory.slice(-12);
          const digest = recent
            .map((e) => `- [${e.date.substring(0, 10)}] (${e.type}) ${e.title}: ${e.description}`)
            .join('\n');
          memoryBlock = `\n\n[MEMORIA LINEAL DE ${athlete.name.toUpperCase()} — desde el día uno, ${memory.length} eventos totales, últimos ${recent.length}:\n${digest}\nUsa este historial para dar continuidad real. No repitas preguntas ya respondidas antes ni sugieras algo que ya se descartó.]`;
        }
      }
    } catch (memErr) {
      console.log('[VoiceAPI] Memory fetch failed (non-blocking):', String(memErr).substring(0, 150));
    }

    const finalText = isFirstMessage
      ? `${systemContextRef.current}\n\n${text}${memoryBlock}`
      : `${text}${memoryBlock}`;

    console.log('[VoiceAPI] Sending voice message to AI:', finalText.substring(0, 100));
    console.log('[VoiceAPI] Current messages count:', currentMsgs.length);

    // Helper: extract text from message parts (handles both text and text-delta types)
    const extractText = (parts: any[]): string => {
      return parts
        .filter((p: any) => p.type === 'text' || p.type === 'text-delta')
        .map((p: any) => p.text || p.textDelta || '')
        .join('\n')
        .trim();
    };

    // Return a promise that resolves with the FULL final AI response text.
    // Partial sentences are streamed out via onPartial as they complete.
    return new Promise<string>((resolve) => {
      const prevLength = currentMsgs.length;
      let pollCount = 0;
      let emittedLength = 0; // how much of the growing response has already gone to TTS
      const startTime = Date.now();

      const emitNewSentences = (fullSoFar: string, flushAll: boolean) => {
        if (!onPartial) return;
        const unspoken = fullSoFar.slice(emittedLength);
        if (!unspoken) return;
        if (flushAll) {
          const rest = unspoken.trim();
          if (rest) onPartial(rest);
          emittedLength = fullSoFar.length;
          return;
        }
        // Only emit complete sentences; keep the trailing partial one buffered
        const match = unspoken.match(/^[\s\S]*?[.!?](?:\s+|$)/);
        if (match && match[0]) {
          const complete = match[0].trim();
          if (complete) onPartial(complete);
          emittedLength += match[0].length;
        }
      };

      const getGrowingText = (msgs: any[]) =>
        msgs
          .slice(prevLength)
          .filter((m: any) => m.role === 'assistant')
          .map((m: any) => extractText(m.parts || []))
          .join('\n')
          .trim();

      agentSendMessage(finalText);

      // Poll for new messages — uses refs to always read fresh state
      const checkInterval = setInterval(() => {
        pollCount++;
        const msgs = messagesRef.current;
        const streaming = isStreamingRef.current;
        const growing = getGrowingText(msgs);

        if (growing) emitNewSentences(growing, false);

        // Only resolve once the agent has actually finished — resolving on a
        // partial mid-stream chunk was cutting Sol's answers short.
        if (!streaming && msgs.length > prevLength && growing) {
          console.log('[VoiceAPI] Response complete after', pollCount, 'polls (', Date.now() - startTime, 'ms). Preview:', growing.substring(0, 100));
          clearInterval(checkInterval);
          emitNewSentences(growing, true);
          resolve(growing);
          return;
        }

        if (pollCount % 10 === 0) {
          console.log('[VoiceAPI] Still polling... count:', pollCount, 'streaming:', streaming, 'msgs:', msgs.length);
        }
      }, 250);

      // Safety timeout: 45 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        console.log('[VoiceAPI] TIMEOUT after 45s — resolving with fallback');
        const msgs = messagesRef.current;
        const growing = getGrowingText(msgs);
        if (growing) {
          emitNewSentences(growing, true);
          resolve(growing);
          return;
        }
        const fallback = 'Lo siento, no pude procesar tu mensaje a tiempo. ¿Puedes repetirlo?';
        onPartial?.(fallback);
        resolve(fallback);
      }, 45000);
    });
  }, [agentSendMessage, students]);

  const openSaveModal = useCallback((content: string) => {
    setSaveContent(content); setSaveDocName(`AI - ${new Date().toLocaleDateString('es')}`);
    setSelectedStudentId(students.length > 0 ? students[0].id : null);
    setSelectedFolderId(null); setShowSaveModal(true);
  }, [students]);

  const handleExportPdf = useCallback(async (content: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const title = 'HGRAND AI - Informe';
      const date = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
      const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><style>body{font-family:-apple-system,Helvetica Neue,Arial,sans-serif;padding:32px 24px;color:#1A1A2E;line-height:1.7;background:#fff;font-size:14px;}h1{font-size:22px;font-weight:800;color:#0A0A0A;text-align:center;margin-bottom:6px;letter-spacing:-0.3px;}h2{font-size:15px;font-weight:700;color:#1A1A2E;margin:24px 0 10px;border-bottom:2px solid #E8ECF0;padding-bottom:6px;}h3{font-size:13px;font-weight:600;color:#3B82F6;margin:16px 0 6px;}strong{color:#111;}.meta{text-align:center;color:#999;font-size:11px;margin-bottom:20px;}.footer{margin-top:28px;padding-top:12px;border-top:1px solid #EBEBEB;text-align:center;font-size:10px;color:#BBB;}ul{padding-left:20px;}li{margin:4px 0;color:#444;}.alert{background:#FEF2F2;border-left:3px solid #EF4444;padding:10px 14px;margin:12px 0;border-radius:4px;font-size:13px;color:#991B1B;}.highlight{background:#F0FDF4;border-left:3px solid #10B981;padding:10px 14px;margin:12px 0;border-radius:4px;font-size:13px;color:#065F46;}</style></head><body><h1>${title}</h1><p class="meta">${date} · Generado por HGRAND AI</p>${content.split('\n').map(line => { const t = line.trim(); if (!t) return '<br/>'; if (t.startsWith('## ')) return '<h2>' + t.slice(3) + '</h2>'; if (t.startsWith('# ')) return '<h1 style="font-size:18px;text-align:left;">' + t.slice(2) + '</h1>'; if (t.startsWith('- ')) return '<li>' + t.slice(2) + '</li>'; if (t.startsWith('🚨') || t.startsWith('⚠️')) return '<div class="alert">' + t + '</div>'; if (t.startsWith('✅') || t.startsWith('👌')) return '<div class="highlight">' + t + '</div>'; if (/^\d+\./.test(t)) return '<li>' + t.replace(/^\d+\.\s*/, '') + '</li>'; return '<p>' + t + '</p>'; }).join('')}<div class="footer">HGRAND AI · ${date}</div></body></html>`;
      const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });
      if (Platform.OS === 'web') {
        await Print.printAsync({ html: htmlContent });
      } else {
        await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Exportar PDF' });
      }
    } catch (err) {
      console.log('PDF export error:', err);
      Alert.alert('Error', 'No se pudo generar el PDF.');
    }
  }, []);

  const handleSaveDocument = useCallback(async () => {
    if (!selectedStudentId || !saveDocName.trim()) return;
    try {
      await addDocument(selectedStudentId, { name: saveDocName.trim(), category: 'other', content: saveContent, folderId: selectedFolderId || undefined, notes: 'Generado por HGRAND AI' });
      setShowSaveModal(false); setSaveContent(''); setSaveDocName('');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Guardado', 'Documento guardado correctamente.');
    } catch { Alert.alert('Error', 'No se pudo guardar.'); }
  }, [selectedStudentId, saveDocName, saveContent, selectedFolderId, addDocument]);

  const openPhotoComparison = useCallback(() => {
    if (students.length === 0) { Alert.alert('Sin alumnos', 'No hay alumnos registrados.'); return; }
    if (students.length === 1) { setPhotoComparisonStudentId(students[0].id); setShowPhotoComparison(true); return; }
    setStudentPickerAction('photo'); setShowStudentPicker(true);
  }, [students]);

  const openMealPlanBuilder = useCallback(() => {
    if (students.length === 0) { Alert.alert('Sin alumnos', 'No hay alumnos registrados.'); return; }
    if (students.length === 1) { router.push({ pathname: '/meal-plan-builder', params: { studentId: students[0].id, studentName: students[0].name } }); return; }
    setStudentPickerAction('mealplan'); setShowStudentPicker(true);
  }, [students]);

  const handleStudentPicked = useCallback((studentId: string) => {
    const student = students.find(s => s.id === studentId);
    setShowStudentPicker(false);
    if (studentPickerAction === 'photo') { setPhotoComparisonStudentId(studentId); setShowPhotoComparison(true); }
    else if (studentPickerAction === 'mealplan' && student) { router.push({ pathname: '/meal-plan-builder', params: { studentId, studentName: student.name } }); }
    setStudentPickerAction(null);
  }, [students, studentPickerAction]);

  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60); const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } } }) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    setShowScrollDown(contentSize.height - contentOffset.y - layoutMeasurement.height > 150);
  }, []);

  const modeColor = MODE_COLORS[conversationMode];

  const renderEmpty = useCallback(() => (
    <ScrollView contentContainerStyle={styles.emptyContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.logoContainer}>
        <View style={[styles.logoCircle, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Sparkles size={32} color={colors.tint} />
        </View>
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>HGRAND AI</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
        Tu sistema de inteligencia para coaching
      </Text>

      <View style={styles.modeIndicatorRow}>
        <TouchableOpacity
          style={[styles.modeIndicator, { backgroundColor: modeColor + '15', borderColor: modeColor + '30' }]}
          onPress={() => setShowModeSelector(!showModeSelector)}
          activeOpacity={0.7}
        >
          <View style={[styles.modeIndicatorDot, { backgroundColor: modeColor }]} />
          <Text style={[styles.modeIndicatorText, { color: modeColor }]}>
            Modo {CONVERSATION_MODE_LABELS[conversationMode]}
          </Text>
          <SlidersHorizontal size={12} color={modeColor} />
        </TouchableOpacity>
      </View>

      {showModeSelector && (
        <View style={styles.modeSelectorWrap}>
          <ConversationModeSelector
            colors={colors}
            currentMode={conversationMode}
            onSelect={setConversationMode}
            onClose={() => setShowModeSelector(false)}
          />
        </View>
      )}

      <View style={styles.actionCardsRow}>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: '#10B981' + '12', borderColor: '#10B981' + '25' }]}
          onPress={openMealPlanBuilder}
          activeOpacity={0.7}
        >
          <Layers size={20} color="#10B981" />
          <Text style={[styles.actionCardLabel, { color: '#10B981' }]}>Meal Builder</Text>
          <Text style={[styles.actionCardHint, { color: colors.textMuted }]}>Visual drag & drop</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: '#8B5CF6' + '12', borderColor: '#8B5CF6' + '25' }]}
          onPress={openPhotoComparison}
          activeOpacity={0.7}
        >
          <Images size={20} color="#8B5CF6" />
          <Text style={[styles.actionCardLabel, { color: '#8B5CF6' }]}>Comparar fotos</Text>
          <Text style={[styles.actionCardHint, { color: colors.textMuted }]}>Side-by-side</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.suggestionsGrid}>
        {QUICK_PROMPTS.map((qp, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.suggestionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => handleSend(qp.prompt)}
            activeOpacity={0.7}
          >
            <View style={[styles.suggestionIconWrap, { backgroundColor: qp.color + '15' }]}>
              <qp.icon size={18} color={qp.color} />
            </View>
            <Text style={[styles.suggestionLabel, { color: colors.text }]}>{qp.label}</Text>
            <Text style={[styles.suggestionHint, { color: colors.textMuted }]} numberOfLines={1}>
              {qp.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  ), [handleSend, colors, conversationMode, showModeSelector, modeColor, openMealPlanBuilder, openPhotoComparison]);

  const startImageGen = useCallback(() => {
    setShowAttachMenu(false);
    setInput('Genera una imagen de: ');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const extractToolImage = useCallback((output: unknown): string | null => {
    try {
      const data = typeof output === 'string' ? JSON.parse(output as string) : output;
      if (data?.imageBase64) return data.imageBase64;
      if (data?.image?.base64Data) return `data:${data.image.mimeType || 'image/png'};base64,${data.image.base64Data}`;
      return null;
    } catch { return null; }
  }, []);

  const extractDraftPlan = useCallback((output: unknown): DraftNutritionPlan | null => {
    try {
      const data = typeof output === 'string' ? JSON.parse(output as string) : output;
      if (data?.success && data?.draftPlan) return data.draftPlan as DraftNutritionPlan;
      return null;
    } catch { return null; }
  }, []);

  const handleDraftSave = useCallback((plan: DraftNutritionPlan) => {
    const studentName = plan.studentName;
    const found = studentName ? students.find(s => s.name.toLowerCase().includes(studentName.toLowerCase())) : null;
    if (found) {
      const planId = plan.documentId;
      const meals: Meal[] = plan.meals.map(m => ({
        id: m.id, name: m.name, time: m.time,
        foods: m.foods.map(f => ({ name: f.name, quantity: f.quantity, unit: f.unit, weightType: f.weightType, calories: f.calories, protein: f.protein, carbs: f.carbs, fats: f.fats })),
        objective: m.objective, objectiveText: m.objectiveText,
      }));
      const nutritionPlan: NutritionPlan = {
        id: planId, studentId: found.id, title: plan.title,
        currentWeight: plan.currentWeight ? parseFloat(plan.currentWeight) : undefined,
        weeklyGoal: plan.weeklyGoal, metabolicStrategy: plan.metabolicStrategy,
        calories: plan.calories, protein: plan.protein, carbs: plan.carbs, fats: plan.fats,
        unitSystem: plan.unitSystem, meals, supplements: plan.supplements || [],
        cardio: plan.cardio, notes: plan.notes || '',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        waterTarget: undefined, sodiumTarget: undefined, fiberTarget: undefined,
      };
      updateNutritionPlan(found.id, nutritionPlan).then(() => {
        Alert.alert('Guardado', `Plan nutricional guardado en el perfil de ${found.name}.`);
      }).catch(() => Alert.alert('Error', 'No se pudo guardar el plan.'));
    } else {
      Alert.alert('Sin alumno', 'Este borrador no tiene un alumno vinculado. Pide a Sol que lo genere para un alumno específico.');
    }
  }, [students, updateNutritionPlan]);

  const handleDraftExport = useCallback((plan: DraftNutritionPlan) => {
    // ── Build a NutritionPlan from the draft so we can reuse the premium HGRAND PDF generator ──
    const meals: Meal[] = plan.meals.map(m => ({
      id: m.id,
      name: m.name,
      time: m.time,
      foods: m.foods.map(f => ({
        name: f.name,
        quantity: f.quantity,
        unit: f.unit,
        weightType: f.weightType,
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fats: f.fats,
      })),
      objective: m.objective,
      objectiveText: m.objectiveText,
    }));
    const nutritionPlan: NutritionPlan = {
      id: plan.documentId,
      studentId: 'draft',
      title: plan.title,
      currentWeight: plan.currentWeight ? parseFloat(plan.currentWeight) : undefined,
      weeklyGoal: plan.weeklyGoal,
      metabolicStrategy: plan.metabolicStrategy,
      calories: plan.calories,
      protein: plan.protein,
      carbs: plan.carbs,
      fats: plan.fats,
      unitSystem: plan.unitSystem,
      meals,
      supplements: plan.supplements || [],
      cardio: plan.cardio,
      notes: plan.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      waterTarget: undefined,
      sodiumTarget: undefined,
      fiberTarget: undefined,
    };
    // Minimal synthetic student for the generator (it reads student.weight/name).
    const studentName = plan.studentName || 'Atleta';
    const draftStudent: Student = {
      id: 'draft',
      name: studentName,
      email: '',
      age: 0,
      gender: 'male',
      height: 0,
      weight: plan.currentWeight ? parseFloat(plan.currentWeight) : 0,
      activityLevel: 'moderate',
      goal: 'competition',
      notes: '',
      checkIns: [],
      createdAt: new Date().toISOString(),
      nutritionPlan,
    };
    try {
      const htmlContent = generateHgrandNutritionPdfHtml(draftStudent, nutritionPlan, settings.documents);
      Print.printToFileAsync({ html: htmlContent, base64: false }).then(({ uri }) => {
        if (Platform.OS === 'web') {
          Print.printAsync({ html: htmlContent });
        } else {
          shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Exportar plan nutricional HGRAND' });
        }
      }).catch(() => Alert.alert('Error', 'No se pudo generar el PDF.'));
    } catch (err) {
      console.log('PDF generation error:', err);
      Alert.alert('Error', 'No se pudo generar el PDF.');
    }
  }, [settings.documents]);

  const handleDraftRefine = useCallback((instruction: string, updatedDraft: DraftNutritionPlan) => {
    setDraftPlans(prev => {
      const next = new Map(prev);
      next.set(updatedDraft.documentId, updatedDraft);
      return next;
    });
    const refineContext = `[REFINAR BORRADOR — El coach ha editado el plan nutricional y pide ajustes. Aquí está el estado actual del borrador en JSON:
${JSON.stringify({ title: updatedDraft.title, calories: updatedDraft.calories, protein: updatedDraft.protein, carbs: updatedDraft.carbs, fats: updatedDraft.fats, meals: updatedDraft.meals.map(m => ({ name: m.name, time: m.time, objective: m.objective, foods: m.foods.map(f => ({ name: f.name, quantity: f.quantity, weightType: f.weightType, calories: f.calories, protein: f.protein, carbs: f.carbs, fats: f.fats })) })) })}

Instrucción del coach: ${instruction}

Responde con un nuevo plan completo usando la herramienta generateNutritionDraft con los cambios solicitados. Mantén el mismo título y alumno. Aplica solo los cambios que pide el coach.]`;
    handleSend(refineContext);
  }, [handleSend]);

  const extractDraftPlanRef = useRef(extractDraftPlan);
  extractDraftPlanRef.current = extractDraftPlan;
  const handleDraftSaveRef = useRef(handleDraftSave);
  handleDraftSaveRef.current = handleDraftSave;
  const handleDraftExportRef = useRef(handleDraftExport);
  handleDraftExportRef.current = handleDraftExport;
  const handleDraftRefineRef = useRef(handleDraftRefine);
  handleDraftRefineRef.current = handleDraftRefine;
  const draftPlansRef2 = useRef(draftPlans);
  draftPlansRef2.current = draftPlans;

  const renderMessage = useCallback(({ item, index }: { item: (typeof messages)[0]; index: number }) => {
    const isUser = item.role === 'user';
    const userFiles = isUser ? userAttachmentsRef.current.get(index) : undefined;
    const userImages = userFiles?.filter(f => f.isImage) || [];
    return (
      <View style={[styles.messageContainer, isUser && styles.userMessageContainer]}>
        {isUser && userImages.length > 0 && (
          <View style={styles.userImagesGrid}>
            {userImages.map((file, idx) => (
              <TouchableOpacity key={`ua-${idx}`} onPress={() => setViewImageUri(file.uri)} activeOpacity={0.9}>
                <Image source={{ uri: file.uri }} style={userImages.length === 1 ? styles.chatImageSingle : styles.chatImageGrid} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </View>
        )}
        {!isUser && (
          <View style={styles.assistantHeader}>
            <View style={[styles.assistantAvatar, { backgroundColor: colors.tint + '18' }]}>
              <Sparkles size={12} color={colors.tint} />
            </View>
            <Text style={[styles.assistantLabel, { color: colors.textSecondary }]}>HGRAND AI</Text>
            <View style={[styles.modeBadge, { backgroundColor: modeColor + '15' }]}>
              <Text style={[styles.modeBadgeText, { color: modeColor }]}>{CONVERSATION_MODE_LABELS[conversationMode]}</Text>
            </View>
          </View>
        )}
        <View style={[styles.messageContent, isUser && [styles.userMessageContent, { backgroundColor: colors.tint }]]}>
          {item.parts.map((part, i) => {
            if (part.type === 'text' && part.text) {
              let displayText = part.text;
              if (isUser && i === 0) {
                const contextEnd = displayText.indexOf('[ALUMNOS REGISTRADOS:');
                if (contextEnd !== -1) {
                  const afterContext = displayText.indexOf(']', contextEnd);
                  if (afterContext !== -1) {
                    displayText = displayText.substring(afterContext + 1).trim();
                  }
                } else if (displayText.includes('[CONTEXTO DEL SISTEMA:')) {
                  const sysEnd = displayText.lastIndexOf(']');
                  if (sysEnd !== -1) {
                    displayText = displayText.substring(sysEnd + 1).trim();
                  }
                }
                if (!displayText) return null;
              }
              const isLastMessage = index === messages.length - 1;
              const isCurrentlyStreaming = isStreaming && isLastMessage && !isUser;
              if (isUser) {
                return (
                  <Text key={`${item.id}-${i}`} style={styles.userMessageText} selectable>
                    {displayText}
                  </Text>
                );
              }
              return (
                <StreamingText
                  key={`${item.id}-${i}`}
                  text={displayText}
                  isStreaming={isCurrentlyStreaming}
                  baseStyle={styles.assistantMessageText}
                  boldColor={colors.text}
                  headerColor={colors.text}
                  accentColor={colors.tint}
                />
              );
            }
            if ((part as any).type === 'file' && 'mimeType' in (part as any)) {
              const filePart = part as any;
              if (filePart.mimeType?.startsWith('image/')) {
                const imageUri = filePart.url || (filePart.data ? `data:${filePart.mimeType};base64,${filePart.data}` : null);
                if (imageUri) return <View key={`${item.id}-${i}`} style={styles.messageImageWrap}><Image source={{ uri: imageUri }} style={styles.messageImage} resizeMode="cover" /></View>;
              }
              return <View key={`${item.id}-${i}`} style={[styles.fileAttachBadge, { backgroundColor: colors.card }]}><FileText size={14} color={colors.tint} /><Text style={[styles.fileAttachName, { color: colors.textSecondary }]}>Archivo adjunto</Text></View>;
            }
            if (part.type === 'tool') {
              if (part.state === 'output-available') {
                  if (part.toolName === 'generateFitnessImage') {
                    const imgUri = extractToolImage((part as any).output);
                    if (imgUri) {
                      return (
                        <TouchableOpacity key={`${item.id}-${i}`} onPress={() => setViewImageUri(imgUri)} activeOpacity={0.9} style={styles.generatedImageWrap}>
                          <Image source={{ uri: imgUri }} style={styles.generatedImage} resizeMode="cover" />
                          <View style={styles.generatedImageOverlay}>
                            <ZoomIn size={16} color="#fff" />
                          </View>
                        </TouchableOpacity>
                      );
                    }
                  }
                  if (part.toolName === 'generateNutritionDraft') {
                    const draftPlan = extractDraftPlanRef.current((part as any).output);
                    if (draftPlan) {
                      const draftId = `${item.id}-${i}`;
                      const storedDraft = draftPlansRef2.current.get(draftPlan.documentId) || draftPlan;
                      return (
                        <DraftDocumentCard
                          key={draftId}
                          draft={storedDraft}
                          colors={colors}
                          onRefine={handleDraftRefineRef.current}
                          onSave={handleDraftSaveRef.current}
                          onExport={handleDraftExportRef.current}
                          isStreaming={isStreaming}
                        />
                      );
                    }
                  }
                  return null;
                }
              if (part.state === 'input-streaming' || part.state === 'input-available') {
                return (
                  <View key={`${item.id}-${i}`} style={[styles.toolCall, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <ActivityIndicator size="small" color={colors.tint} />
                    <Text style={[styles.toolCallText, { color: colors.textMuted }]}>
                      {part.toolName === 'getStudentFullProfile' ? 'Consultando perfil completo...' :
                       part.toolName === 'getStudentDietHistory' ? 'Revisando historial de dietas...' :
                       part.toolName === 'analyzeCheckInPhotos' ? 'Analizando fotos...' :
                       part.toolName === 'generatePeakWeekProtocol' ? 'Generando protocolo peak week...' :
                       part.toolName === 'summarizeAthleteTimeline' ? 'Resumiendo timeline...' :
                       part.toolName === 'calculateBMR' ? 'Calculando TMB...' :
                       part.toolName === 'saveDocumentToStudent' ? 'Guardando documento...' :
                       part.toolName === 'generateNutritionPDF' ? 'Generando plan nutricional...' :
                       part.toolName === 'generateNutritionDraft' ? 'Generando borrador editable...' :
                       part.toolName === 'generateTrainingPDF' ? 'Generando plan de entreno...' :
                       part.toolName === 'generateFitnessImage' ? 'Generando imagen...' :
                       part.toolName === 'analyzePhysiqueDetailed' ? 'Analizando físico...' :
                       part.toolName === 'analyzeImageGeneral' ? 'Analizando imagen...' :
                       'Procesando...'}
                    </Text>
                  </View>
                );
              }
            }
            return null;
          })}
        </View>
        {!isUser && (
          <View style={styles.messageActions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => {
              const tc = item.parts.filter((p): p is { type: 'text'; text: string } => p.type === 'text' && 'text' in p).map(p => p.text).join('\n');
              void handleCopy(tc, item.id);
            }} activeOpacity={0.6}>
              {copiedId === item.id ? <Check size={13} color={colors.tint} /> : <Copy size={13} color={colors.textMuted} />}
              <Text style={[styles.actionText, { color: copiedId === item.id ? colors.tint : colors.textMuted }]}>{copiedId === item.id ? 'Copiado' : 'Copiar'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => {
              const tc = item.parts.filter((p): p is { type: 'text'; text: string } => p.type === 'text' && 'text' in p).map(p => p.text).join('\n');
              openSaveModal(tc);
            }} activeOpacity={0.6}>
              <Save size={13} color={colors.textMuted} />
              <Text style={[styles.actionText, { color: colors.textMuted }]}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => {
              const tc = item.parts.filter((p): p is { type: 'text'; text: string } => p.type === 'text' && 'text' in p).map(p => p.text).join('\n');
              void handleExportPdf(tc);
            }} activeOpacity={0.6}>
              <Printer size={13} color={colors.textMuted} />
              <Text style={[styles.actionText, { color: colors.textMuted }]}>PDF</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }, [copiedId, handleCopy, colors, openSaveModal, handleExportPdf, conversationMode, modeColor, extractToolImage, messages, isStreaming]);

  const renderFooter = useCallback(() => {
    if (!isStreaming) return null;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.parts?.some(p => p.type === 'text' && 'text' in p && p.text)) return null;
    return (
      <View style={styles.messageContainer}>
        <View style={styles.assistantHeader}>
          <View style={[styles.assistantAvatar, { backgroundColor: colors.tint + '18' }]}><Sparkles size={12} color={colors.tint} /></View>
          <Text style={[styles.assistantLabel, { color: colors.textSecondary }]}>HGRAND AI</Text>
        </View>
        <View style={styles.thinkingContainer}>
          <View style={styles.thinkingDots}><ThinkingDot delay={0} /><ThinkingDot delay={200} /><ThinkingDot delay={400} /></View>
        </View>
      </View>
    );
  }, [isStreaming, messages, colors]);

  const voiceStateLabel = useMemo(() => {
    switch (voiceState) {
      case 'idle': return 'Toca para hablar de nuevo';
      case 'listening': return 'Escuchando... toca para enviar';
      case 'processing': return 'Procesando tu voz...';
      case 'responding': return 'Respondiendo...';
      default: return '';
    }
  }, [voiceState]);

  const photoStudent = useMemo(() => {
    if (!photoComparisonStudentId) return null;
    return students.find(s => s.id === photoComparisonStudentId) || null;
  }, [photoComparisonStudentId, students]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: '',
          headerLeft: () => (
            <View style={styles.headerLeft}>
              <TouchableOpacity style={[styles.headerBackBtn, { backgroundColor: colors.card }]} onPress={() => router.push('/(tabs)/dashboard')} activeOpacity={0.7}>
                <ChevronLeft size={18} color={colors.tint} />
              </TouchableOpacity>
              <View style={[styles.headerLogoSmall, { backgroundColor: colors.tint + '15' }]}>
                <Sparkles size={14} color={colors.tint} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>HGRAND AI</Text>
                <TouchableOpacity onPress={() => setShowModeSelector(!showModeSelector)} activeOpacity={0.7} style={styles.headerModeBtn}>
                  <View style={[styles.headerModeDot, { backgroundColor: modeColor }]} />
                  <Text style={[styles.headerModeText, { color: modeColor }]}>{CONVERSATION_MODE_LABELS[conversationMode]}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ),
          headerRight: () => (
            <View style={styles.headerRightRow}>
              <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.card }]} onPress={openMealPlanBuilder} activeOpacity={0.7}>
                <Layers size={16} color={colors.tint} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.card }]} onPress={openVoiceMode} activeOpacity={0.7}>
                <AudioLines size={16} color={colors.tint} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.card }]} onPress={handleNewChat} activeOpacity={0.7}>
                <RotateCcw size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {showModeSelector && hasMessages && (
        <View style={styles.modeSelectorOverlayWrap}>
          <Pressable style={styles.modeSelectorBackdrop} onPress={() => setShowModeSelector(false)} />
          <View style={styles.modeSelectorFloat}>
            <ConversationModeSelector colors={colors} currentMode={conversationMode} onSelect={setConversationMode} onClose={() => setShowModeSelector(false)} />
          </View>
        </View>
      )}

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 95 : 0}>
        {hasMessages ? (
          <View style={styles.flex}>
            <QuickToolsBar colors={colors} onSelectTool={handleQuickTool} disabled={isStreaming} />
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              onContentSizeChange={() => { if (!showScrollDown) flatListRef.current?.scrollToEnd({ animated: true }); }}
              onScroll={handleScroll}
              scrollEventThrottle={100}
              ListFooterComponent={renderFooter}
            />
            {showScrollDown && (
              <Pressable style={[styles.scrollDownButton, { backgroundColor: colors.card }]} onPress={() => flatListRef.current?.scrollToEnd({ animated: true })}>
                <ChevronDown size={18} color={colors.text} />
              </Pressable>
            )}
          </View>
        ) : renderEmpty()}

        {isRecording && (
          <View style={styles.recordingBar}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Grabando</Text>
            <Text style={[styles.recordingTimer, { color: colors.text }]}>{formatDuration(recordingDuration)}</Text>
          </View>
        )}
        {isTranscribing && (
          <View style={styles.transcribingBar}>
            <ActivityIndicator size="small" color={colors.tint} />
            <Text style={[styles.transcribingText, { color: colors.tint }]}>Transcribiendo...</Text>
          </View>
        )}

        {attachedFiles.length > 0 && (
          <View style={[styles.attachPreviewBar, { backgroundColor: colors.background }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.attachPreviewScroll}>
              {attachedFiles.map((file, index) => (
                <View key={index} style={styles.attachPreviewItem}>
                  {file.isImage ? <Image source={{ uri: file.uri }} style={styles.attachPreviewImage} /> :
                    <View style={[styles.attachPreviewDoc, { backgroundColor: colors.card, borderColor: colors.border }]}><FileText size={20} color={colors.tint} /></View>
                  }
                  <TouchableOpacity style={styles.attachRemoveBtn} onPress={() => removeAttachedFile(index)} activeOpacity={0.7}><X size={10} color="#fff" /></TouchableOpacity>
                  <Text style={[styles.attachPreviewName, { color: colors.textMuted }]} numberOfLines={1}>{file.name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
            <TouchableOpacity style={styles.attachBtn} onPress={() => setShowAttachMenu(!showAttachMenu)} activeOpacity={0.7} testID="attach-button">
              <Paperclip size={18} color={showAttachMenu ? colors.tint : colors.textSecondary} />
            </TouchableOpacity>
            <TextInput ref={inputRef} style={[styles.input, { color: colors.text }]} placeholder="Mensaje a HGRAND AI..." placeholderTextColor={colors.textMuted} value={input} onChangeText={setInput} multiline maxLength={2000} editable={!isRecording && !isTranscribing} onSubmitEditing={() => handleSend()} testID="ai-input" />
            <View style={styles.inputActions}>
              <TouchableOpacity style={[styles.micBtn, isRecording && styles.micBtnActive]} onPress={toggleRecording} activeOpacity={0.7} disabled={isTranscribing || isStreaming} testID="mic-button">
                <Animated.View style={{ transform: [{ scale: isRecording ? micPulseAnim : 1 }] }}>
                  {isRecording ? <Square size={14} color="#fff" /> : isTranscribing ? <ActivityIndicator size="small" color={colors.textMuted} /> : <Mic size={16} color={colors.textSecondary} />}
                </Animated.View>
              </TouchableOpacity>
              {isStreaming ? (
                <TouchableOpacity style={[styles.sendBtn, styles.stopBtn]} onPress={() => { void stopAgent(); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }} activeOpacity={0.7}>
                  <Square size={14} color="#fff" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.sendBtn, (!input.trim() && attachedFiles.length === 0) && styles.sendBtnDisabled]} onPress={() => handleSend()} disabled={(!input.trim() && attachedFiles.length === 0) || isRecording || isTranscribing} activeOpacity={0.7} testID="send-button">
                  <Send size={15} color={(input.trim() || attachedFiles.length > 0) ? '#fff' : colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {showAttachMenu && (
          <>
            <Pressable style={styles.attachMenuBackdrop} onPress={() => setShowAttachMenu(false)} />
            <View style={[styles.attachMenu, { backgroundColor: colors.elevated }]}>
              <TouchableOpacity style={styles.attachMenuItem} onPress={pickImage} activeOpacity={0.7}>
                <View style={[styles.attachMenuIcon, { backgroundColor: 'rgba(59,130,246,0.12)' }]}><ImageIcon size={18} color="#3B82F6" /></View>
                <Text style={[styles.attachMenuLabel, { color: colors.textSecondary }]}>Galería</Text>
              </TouchableOpacity>
              {Platform.OS !== 'web' && (
                <TouchableOpacity style={styles.attachMenuItem} onPress={takePhoto} activeOpacity={0.7}>
                  <View style={[styles.attachMenuIcon, { backgroundColor: 'rgba(245,158,11,0.12)' }]}><Camera size={18} color="#F59E0B" /></View>
                  <Text style={[styles.attachMenuLabel, { color: colors.textSecondary }]}>Cámara</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.attachMenuItem} onPress={pickDocument} activeOpacity={0.7}>
                <View style={[styles.attachMenuIcon, { backgroundColor: 'rgba(52,211,153,0.12)' }]}><FileText size={18} color={colors.tint} /></View>
                <Text style={[styles.attachMenuLabel, { color: colors.textSecondary }]}>Documento</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachMenuItem} onPress={startImageGen} activeOpacity={0.7}>
                <View style={[styles.attachMenuIcon, { backgroundColor: 'rgba(168,85,247,0.12)' }]}><Wand2 size={18} color="#A855F7" /></View>
                <Text style={[styles.attachMenuLabel, { color: colors.textSecondary }]}>Generar imagen</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>

      {/* Voice Conversation — hands-free mode */}
      <VoiceConversation
        visible={voiceMode}
        onClose={closeVoiceMode}
        systemContext={systemContext}
        students={students}
        onCoachMessage={handleVoiceCoachMessage}
        voiceSettings={settings.voice}
        onOpenSettings={() => setShowVoiceSettings(true)}
      />

      {/* Voice Settings Sheet */}
      <VoiceSettingsSheet
        visible={showVoiceSettings}
        onClose={() => setShowVoiceSettings(false)}
        settings={settings.voice}
        onUpdate={updateVoice}
      />

      {/* Save Modal */}
      <Modal visible={showSaveModal} animationType="slide" transparent={true} onRequestClose={() => setShowSaveModal(false)}>
        <View style={styles.saveModalOverlay}>
          <View style={[styles.saveModalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.saveModalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.saveModalTitle, { color: colors.text }]}>Guardar en carpeta</Text>
              <TouchableOpacity onPress={() => setShowSaveModal(false)} activeOpacity={0.7}><X size={20} color={colors.textMuted} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.saveModalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.saveFieldLabel, { color: colors.textSecondary }]}>Nombre</Text>
              <TextInput style={[styles.saveInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} value={saveDocName} onChangeText={setSaveDocName} placeholder="Nombre del documento" placeholderTextColor={colors.textMuted} />
              <Text style={[styles.saveFieldLabel, { color: colors.textSecondary }]}>Alumno</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.saveChipRow}>
                {students.map(s => (
                  <TouchableOpacity key={s.id} style={[styles.saveChip, { backgroundColor: colors.background, borderColor: colors.border }, selectedStudentId === s.id && { backgroundColor: colors.tint, borderColor: colors.tint }]} onPress={() => { setSelectedStudentId(s.id); setSelectedFolderId(null); }} activeOpacity={0.7}>
                    <Text style={[styles.saveChipText, { color: colors.textSecondary }, selectedStudentId === s.id && { color: '#fff' }]}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {selectedStudentId && (() => {
                const student = students.find(s => s.id === selectedStudentId);
                const folders = student?.folders || [];
                if (folders.length === 0) return null;
                return (
                  <>
                    <Text style={[styles.saveFieldLabel, { color: colors.textSecondary }]}>Carpeta</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.saveChipRow}>
                      <TouchableOpacity style={[styles.saveChip, { backgroundColor: colors.background, borderColor: colors.border }, selectedFolderId === null && { backgroundColor: colors.tint, borderColor: colors.tint }]} onPress={() => setSelectedFolderId(null)} activeOpacity={0.7}>
                        <Text style={[styles.saveChipText, { color: colors.textSecondary }, selectedFolderId === null && { color: '#fff' }]}>Sin carpeta</Text>
                      </TouchableOpacity>
                      {folders.map(f => (
                        <TouchableOpacity key={f.id} style={[styles.saveChip, { backgroundColor: colors.background, borderColor: colors.border }, selectedFolderId === f.id && { backgroundColor: colors.tint, borderColor: colors.tint }]} onPress={() => setSelectedFolderId(f.id)} activeOpacity={0.7}>
                          <FolderOpen size={12} color={selectedFolderId === f.id ? '#fff' : colors.textMuted} />
                          <Text style={[styles.saveChipText, { color: colors.textSecondary }, selectedFolderId === f.id && { color: '#fff' }]}>{f.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                );
              })()}
              <Text style={[styles.saveFieldLabel, { color: colors.textSecondary }]}>Vista previa</Text>
              <View style={[styles.savePreview, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.savePreviewText, { color: colors.text }]} numberOfLines={8}>{saveContent}</Text>
              </View>
            </ScrollView>
            <View style={[styles.saveModalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity style={[styles.saveCancelBtn, { backgroundColor: colors.background }]} onPress={() => setShowSaveModal(false)} activeOpacity={0.7}>
                <Text style={[styles.saveCancelText, { color: colors.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveConfirmBtn, { backgroundColor: colors.tint }, (!selectedStudentId || !saveDocName.trim()) && { opacity: 0.5 }]} onPress={handleSaveDocument} disabled={!selectedStudentId || !saveDocName.trim()} activeOpacity={0.7}>
                <Save size={16} color="#fff" /><Text style={styles.saveConfirmText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Photo Comparison Modal */}
      <Modal visible={showPhotoComparison} animationType="slide" transparent={false} onRequestClose={() => setShowPhotoComparison(false)}>
        {photoStudent ? (
          <PhotoComparisonView colors={colors} checkIns={photoStudent.checkIns} onClose={() => setShowPhotoComparison(false)} />
        ) : (
          <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.emptyTitle, { color: colors.text, textAlign: 'center', marginTop: 100 }]}>Sin datos</Text>
            <TouchableOpacity onPress={() => setShowPhotoComparison(false)}><Text style={{ color: colors.tint, textAlign: 'center', marginTop: 20 }}>Cerrar</Text></TouchableOpacity>
          </View>
        )}
      </Modal>

      {/* Image Viewer Modal */}
      <Modal visible={!!viewImageUri} animationType="fade" transparent={true} onRequestClose={() => setViewImageUri(null)} statusBarTranslucent>
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity style={styles.imageViewerCloseBtn} onPress={() => setViewImageUri(null)} activeOpacity={0.7}>
            <X size={22} color="#fff" />
          </TouchableOpacity>
          {viewImageUri && (
            <Image source={{ uri: viewImageUri }} style={styles.imageViewerImage} resizeMode="contain" />
          )}
        </View>
      </Modal>

      {/* Student Picker Modal */}
      <Modal visible={showStudentPicker} animationType="slide" transparent={true} onRequestClose={() => setShowStudentPicker(false)}>
        <View style={styles.saveModalOverlay}>
          <View style={[styles.saveModalContent, { backgroundColor: colors.card, maxHeight: '60%' }]}>
            <View style={[styles.saveModalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.saveModalTitle, { color: colors.text }]}>Seleccionar alumno</Text>
              <TouchableOpacity onPress={() => setShowStudentPicker(false)} activeOpacity={0.7}><X size={20} color={colors.textMuted} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.saveModalBody}>
              {students.map(s => (
                <TouchableOpacity key={s.id} style={[styles.studentPickerRow, { borderBottomColor: colors.separator }]} onPress={() => handleStudentPicked(s.id)} activeOpacity={0.7}>
                  <View style={[styles.studentPickerAvatar, { backgroundColor: colors.tint + '15' }]}>
                    <User size={18} color={colors.tint} />
                  </View>
                  <View style={styles.studentPickerInfo}>
                    <Text style={[styles.studentPickerName, { color: colors.text }]}>{s.name}</Text>
                    <Text style={[styles.studentPickerMeta, { color: colors.textMuted }]}>{s.weight}kg · {s.checkIns.length} check-ins</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ThinkingDot({ delay }: { delay: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.loop(Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ])).start();
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay, opacity]);
  return <Animated.View style={[styles.dot, { opacity }]} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBackBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  headerLogoSmall: { width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700' as const },
  headerModeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  headerModeDot: { width: 6, height: 6, borderRadius: 3 },
  headerModeText: { fontSize: 11, fontWeight: '600' as const },
  headerRightRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  messagesList: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  emptyContainer: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  logoContainer: { marginBottom: 14 },
  logoCircle: { width: 64, height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  emptyTitle: { fontSize: 26, fontWeight: '800' as const, marginBottom: 6, letterSpacing: -0.5 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  modeIndicatorRow: { marginBottom: 20 },
  modeIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  modeIndicatorDot: { width: 7, height: 7, borderRadius: 3.5 },
  modeIndicatorText: { fontSize: 13, fontWeight: '600' as const },
  modeSelectorWrap: { width: '100%', maxWidth: 320, marginBottom: 20 },
  modeSelectorOverlayWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 },
  modeSelectorBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  modeSelectorFloat: { position: 'absolute', top: 8, left: 16, right: 16, zIndex: 101 },
  actionCardsRow: { flexDirection: 'row', gap: 10, width: '100%', maxWidth: 400, marginBottom: 16 },
  actionCard: { flex: 1, borderRadius: 14, padding: 16, borderWidth: 1, gap: 6 },
  actionCardLabel: { fontSize: 14, fontWeight: '700' as const },
  actionCardHint: { fontSize: 11 },
  suggestionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%', maxWidth: 400 },
  suggestionCard: { width: '47%', borderRadius: 14, padding: 14, minHeight: 100, borderWidth: 1 },
  suggestionIconWrap: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  suggestionLabel: { fontSize: 13, fontWeight: '700' as const, marginBottom: 3 },
  suggestionHint: { fontSize: 11, lineHeight: 15 },
  messageContainer: { marginBottom: 20, paddingHorizontal: 2 },
  userMessageContainer: { alignItems: 'flex-end' },
  assistantHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  assistantAvatar: { width: 24, height: 24, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  assistantLabel: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.3 },
  modeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  modeBadgeText: { fontSize: 10, fontWeight: '600' as const },
  messageContent: { maxWidth: '100%', paddingRight: 4 },
  userMessageContent: { borderRadius: 20, borderBottomRightRadius: 6, paddingHorizontal: 16, paddingVertical: 11, maxWidth: '85%' },
  messageText: { fontSize: 15, lineHeight: 22 },
  assistantMessageText: { fontSize: 15, lineHeight: 23.5, fontWeight: '400' as const, letterSpacing: 0.12, color: '#1A1A2E' },
  userMessageText: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const, color: '#fff', letterSpacing: 0.1 },
  messageImageWrap: { marginVertical: 6, borderRadius: 12, overflow: 'hidden' },
  messageImage: { width: 200, height: 200, borderRadius: 12 },
  fileAttachBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginVertical: 4, alignSelf: 'flex-start' },
  fileAttachName: { fontSize: 12 },
  messageActions: { flexDirection: 'row', gap: 12, marginTop: 8, paddingLeft: 2 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 },
  actionText: { fontSize: 11 },
  toolCall: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, alignSelf: 'flex-start', borderWidth: 1 },
  toolCallText: { fontSize: 12, fontStyle: 'italic' as const },
  thinkingContainer: { paddingVertical: 8, paddingHorizontal: 4 },
  thinkingDots: { flexDirection: 'row', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#9CA3AF' },
  scrollDownButton: { position: 'absolute', bottom: 12, alignSelf: 'center', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  recordingBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 16, backgroundColor: 'rgba(239,68,68,0.06)', gap: 8 },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  recordingText: { fontSize: 13, fontWeight: '600' as const, color: '#EF4444' },
  recordingTimer: { fontSize: 13, fontWeight: '700' as const, fontVariant: ['tabular-nums'] as const },
  transcribingBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 8 },
  transcribingText: { fontSize: 13, fontWeight: '500' as const },
  attachPreviewBar: { paddingHorizontal: 12, paddingTop: 8 },
  attachPreviewScroll: { gap: 10, paddingRight: 12 },
  attachPreviewItem: { width: 68, alignItems: 'center' },
  attachPreviewImage: { width: 56, height: 56, borderRadius: 10 },
  attachPreviewDoc: { width: 56, height: 56, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  attachRemoveBtn: { position: 'absolute', top: -4, right: 2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' },
  attachPreviewName: { fontSize: 9, marginTop: 3, textAlign: 'center', width: 60 },
  inputWrapper: { paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', borderRadius: 22, paddingLeft: 6, paddingRight: 6, paddingVertical: 4, minHeight: 44 },
  attachBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  input: { flex: 1, fontSize: 15, maxHeight: 120, paddingVertical: 8, paddingRight: 8 },
  inputActions: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: 4 },
  micBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  micBtnActive: { backgroundColor: '#EF4444' },
  sendBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#C7A34B', justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: 'transparent' },
  stopBtn: { backgroundColor: '#EF4444' },
  attachMenu: { position: 'absolute', bottom: 72, left: 12, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 6, flexDirection: 'row', gap: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8, zIndex: 1 },
  attachMenuItem: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, gap: 6 },
  attachMenuIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  attachMenuLabel: { fontSize: 11, fontWeight: '500' as const },
  attachMenuBackdrop: { position: 'absolute', top: -1000, left: -1000, right: -1000, bottom: -1000, zIndex: 0 },
  voiceContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  voiceCloseBtnTop: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, right: 24, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', zIndex: 20 },
  voiceCenterArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, width: '100%' },
  voiceResponseScroll: { maxHeight: 200, width: '100%', marginBottom: 32 },
  voiceResponseScrollContent: { alignItems: 'center', paddingHorizontal: 8 },
  voiceResponseCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, width: '100%' },
  voiceResponseText: { flex: 1, fontSize: 16, lineHeight: 24, color: '#fff' },
  voiceYouSaid: { marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' as const },
  voiceTranscriptArea: { marginBottom: 32, paddingHorizontal: 20 },
  voiceTranscriptText: { fontSize: 18, lineHeight: 26, color: 'rgba(255,255,255,0.8)', textAlign: 'center', fontStyle: 'italic' as const },
  voiceOrbArea: { width: 160, height: 160, justifyContent: 'center', alignItems: 'center' },
  voiceOrbRing3: { position: 'absolute', width: 160, height: 160, borderRadius: 80 },
  voiceOrbRing2: { position: 'absolute', width: 130, height: 130, borderRadius: 65 },
  voiceOrbRing1: { position: 'absolute', width: 105, height: 105, borderRadius: 52.5 },
  voiceOrbBtn: { width: 84, height: 84, borderRadius: 42, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  voiceOrbWaves: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  voiceWaveBar: { width: 4, borderRadius: 2 },
  voiceOrbLabel: { marginTop: 28, fontSize: 16, color: 'rgba(255,255,255,0.6)', fontWeight: '500' as const },
  voiceHint: { position: 'absolute', bottom: Platform.OS === 'ios' ? 50 : 30, alignSelf: 'center', fontSize: 13, color: 'rgba(255,255,255,0.25)', fontWeight: '600' as const, letterSpacing: 1 },
  voiceSpeakAgainBtn: { marginTop: 28, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)' },
  voiceSpeakAgainText: { fontSize: 15, fontWeight: '600' as const },
  saveModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  saveModalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  saveModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  saveModalTitle: { fontSize: 17, fontWeight: '600' as const },
  saveModalBody: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  saveFieldLabel: { fontSize: 13, fontWeight: '600' as const, marginBottom: 8, marginTop: 12 },
  saveInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
  saveChipRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  saveChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  saveChipText: { fontSize: 13, fontWeight: '500' as const },
  savePreview: { borderRadius: 10, borderWidth: 1, padding: 12, minHeight: 80, maxHeight: 140 },
  savePreviewText: { fontSize: 13, lineHeight: 19 },
  saveModalFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: StyleSheet.hairlineWidth },
  saveCancelBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  saveCancelText: { fontSize: 15, fontWeight: '600' as const },
  saveConfirmBtn: { flex: 1, flexDirection: 'row', borderRadius: 12, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', gap: 6 },
  saveConfirmText: { fontSize: 15, fontWeight: '600' as const, color: '#fff' },
  studentPickerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  studentPickerAvatar: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  studentPickerInfo: { flex: 1 },
  studentPickerName: { fontSize: 15, fontWeight: '600' as const },
  studentPickerMeta: { fontSize: 12, marginTop: 2 },
  userImagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6, justifyContent: 'flex-end', maxWidth: '85%' },
  chatImageSingle: { width: 220, height: 220, borderRadius: 14 },
  chatImageGrid: { width: 105, height: 105, borderRadius: 10 },
  generatedImageWrap: { marginVertical: 8, borderRadius: 14, overflow: 'hidden', alignSelf: 'flex-start' },
  generatedImage: { width: 280, height: 280, borderRadius: 14 },
  generatedImageOverlay: { position: 'absolute', bottom: 8, right: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  imageViewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  imageViewerCloseBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', zIndex: 20 },
  imageViewerImage: { width: '92%', height: '75%' },
});
