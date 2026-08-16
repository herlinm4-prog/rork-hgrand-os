// utils/api.ts
// Typed API client for the HGRAND OS Cloudflare backend.
// All requests are routed through the CoachData Durable Object.

import type {
  Student,
  CheckIn,
  StudentDocument,
  StudentFolder,
  TrainingPlan,
  NutritionPlan,
  DietHistoryEntry,
  CoachTask,
  CoachNotification,
  DailyDigest,
  AthleteMemoryEvent,
  MetabolicAnalysis,
  PlanRisk,
  SupplementAlert,
  MediaAnalysis,
  BloodPanel,
  BloodPanelRecommendation,
  HealthAlert,
} from "@/types";

const BACKEND_URL = process.env.EXPO_PUBLIC_RORK_FUNCTIONS_URL;

if (!BACKEND_URL) {
  console.warn(
    "EXPO_PUBLIC_RORK_FUNCTIONS_URL is not set. Backend calls will fail."
  );
}

// ---------------------------------------------------------------------------
// Internal fetch helper
// ---------------------------------------------------------------------------

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BACKEND_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status} on ${path}: ${body}`);
  }

  const text = await res.text();
  if (!text) return undefined as unknown as T;
  return JSON.parse(text) as T;
}

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

export async function fetchStudents(): Promise<Student[]> {
  return apiFetch<Student[]>("/api/students");
}

export async function createStudent(
  student: Omit<Student, "id" | "checkIns" | "createdAt">
): Promise<Student> {
  return apiFetch<Student>("/api/students", {
    method: "POST",
    body: JSON.stringify(student),
  });
}

export async function getStudent(id: string): Promise<Student> {
  return apiFetch<Student>(`/api/students/${id}`);
}

export async function updateStudent(
  id: string,
  data: Partial<Student>
): Promise<Student> {
  return apiFetch<Student>(`/api/students/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteStudent(id: string): Promise<void> {
  await apiFetch(`/api/students/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Check-ins
// ---------------------------------------------------------------------------

export async function addCheckIn(
  studentId: string,
  checkIn: Omit<CheckIn, "id">
): Promise<CheckIn> {
  return apiFetch<CheckIn>(`/api/students/${studentId}/checkins`, {
    method: "POST",
    body: JSON.stringify(checkIn),
  });
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export async function fetchDocuments(
  studentId: string
): Promise<StudentDocument[]> {
  return apiFetch<StudentDocument[]>(`/api/students/${studentId}/documents`);
}

export async function addDocument(
  studentId: string,
  doc: Omit<StudentDocument, "id" | "createdAt" | "updatedAt">
): Promise<StudentDocument> {
  return apiFetch<StudentDocument>(`/api/students/${studentId}/documents`, {
    method: "POST",
    body: JSON.stringify(doc),
  });
}

export async function updateDocument(
  studentId: string,
  docId: string,
  data: Partial<StudentDocument>
): Promise<StudentDocument> {
  return apiFetch<StudentDocument>(
    `/api/students/${studentId}/documents/${docId}`,
    { method: "PUT", body: JSON.stringify(data) }
  );
}

export async function deleteDocument(
  studentId: string,
  docId: string
): Promise<void> {
  await apiFetch(`/api/students/${studentId}/documents/${docId}`, {
    method: "DELETE",
  });
}

export async function moveDocument(
  studentId: string,
  docId: string,
  targetFolderId?: string
): Promise<StudentDocument> {
  return apiFetch<StudentDocument>(
    `/api/students/${studentId}/documents/${docId}/move`,
    { method: "PUT", body: JSON.stringify({ targetFolderId }) }
  );
}

export async function duplicateDocument(
  studentId: string,
  docId: string,
  targetFolderId?: string
): Promise<StudentDocument> {
  return apiFetch<StudentDocument>(
    `/api/students/${studentId}/documents/${docId}/duplicate`,
    { method: "POST", body: JSON.stringify({ targetFolderId }) }
  );
}

// ---------------------------------------------------------------------------
// Folders
// ---------------------------------------------------------------------------

export async function fetchFolders(
  studentId: string
): Promise<StudentFolder[]> {
  return apiFetch<StudentFolder[]>(`/api/students/${studentId}/folders`);
}

export async function addFolder(
  studentId: string,
  folder: Omit<StudentFolder, "id" | "createdAt" | "updatedAt">
): Promise<StudentFolder> {
  return apiFetch<StudentFolder>(`/api/students/${studentId}/folders`, {
    method: "POST",
    body: JSON.stringify(folder),
  });
}

export async function updateFolder(
  studentId: string,
  folderId: string,
  data: Partial<StudentFolder>
): Promise<StudentFolder> {
  return apiFetch<StudentFolder>(
    `/api/students/${studentId}/folders/${folderId}`,
    { method: "PUT", body: JSON.stringify(data) }
  );
}

export async function deleteFolder(
  studentId: string,
  folderId: string
): Promise<void> {
  await apiFetch(`/api/students/${studentId}/folders/${folderId}`, {
    method: "DELETE",
  });
}

export async function moveFolder(
  studentId: string,
  folderId: string,
  targetParentId?: string
): Promise<StudentFolder> {
  return apiFetch<StudentFolder>(
    `/api/students/${studentId}/folders/${folderId}/move`,
    { method: "PUT", body: JSON.stringify({ targetParentId }) }
  );
}

// ---------------------------------------------------------------------------
// Training Plans
// ---------------------------------------------------------------------------

export async function fetchTrainingPlan(
  studentId: string
): Promise<TrainingPlan | null> {
  return apiFetch<TrainingPlan | null>(
    `/api/students/${studentId}/training-plan`
  );
}

export async function upsertTrainingPlan(
  studentId: string,
  plan: TrainingPlan
): Promise<TrainingPlan> {
  return apiFetch<TrainingPlan>(
    `/api/students/${studentId}/training-plan`,
    { method: "PUT", body: JSON.stringify(plan) }
  );
}

export async function deleteTrainingPlan(studentId: string): Promise<void> {
  await apiFetch(`/api/students/${studentId}/training-plan`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// Nutrition Plan
// ---------------------------------------------------------------------------

export async function upsertNutritionPlan(
  studentId: string,
  plan: NutritionPlan
): Promise<NutritionPlan> {
  return apiFetch<NutritionPlan>(
    `/api/students/${studentId}/nutrition-plan`,
    { method: "PUT", body: JSON.stringify(plan) }
  );
}

export async function deleteNutritionPlan(studentId: string): Promise<void> {
  await apiFetch(`/api/students/${studentId}/nutrition-plan`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// Diet History
// ---------------------------------------------------------------------------

export async function fetchDietHistory(
  studentId: string
): Promise<DietHistoryEntry[]> {
  return apiFetch<DietHistoryEntry[]>(
    `/api/students/${studentId}/diet-history`
  );
}

export async function addDietEntry(
  studentId: string,
  entry: Omit<DietHistoryEntry, "id">
): Promise<DietHistoryEntry> {
  return apiFetch<DietHistoryEntry>(
    `/api/students/${studentId}/diet-history`,
    { method: "POST", body: JSON.stringify(entry) }
  );
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export async function fetchTasks(): Promise<CoachTask[]> {
  return apiFetch<CoachTask[]>("/api/tasks");
}

export async function completeTask(taskId: string): Promise<void> {
  await apiFetch(`/api/tasks/${taskId}/complete`, { method: "PUT" });
}

export async function uncompleteTask(taskId: string): Promise<void> {
  await apiFetch(`/api/tasks/${taskId}/uncomplete`, { method: "PUT" });
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export async function fetchNotifications(): Promise<CoachNotification[]> {
  return apiFetch<CoachNotification[]>("/api/notifications");
}

export async function markNotificationRead(notifId: string): Promise<void> {
  await apiFetch(`/api/notifications/${notifId}/read`, { method: "PUT" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch("/api/notifications/read-all", { method: "PUT" });
}

// ---------------------------------------------------------------------------
// Digest & Stats
// ---------------------------------------------------------------------------

export async function fetchDigest(): Promise<DailyDigest> {
  return apiFetch<DailyDigest>("/api/digest");
}

export interface KPStats {
  totalStudents: number;
  totalCheckIns: number;
  activeStudents: number;
  pendingCheckIns: number;
  todayCheckIns: number;
  atRiskCount: number;
  estimatedMonthlyRevenue: number;
}

export async function fetchStats(): Promise<KPStats> {
  return apiFetch<KPStats>("/api/stats");
}

// ---------------------------------------------------------------------------
// Migration (one-time bulk upload from local AsyncStorage)
// ---------------------------------------------------------------------------

export async function migrateStudents(
  students: Student[]
): Promise<{ ok: boolean; count: number }> {
  return apiFetch<{ ok: boolean; count: number }>("/api/students", {
    method: "PUT",
    body: JSON.stringify({ students }),
  });
}

// ---------------------------------------------------------------------------
// Athlete Memory
// ---------------------------------------------------------------------------

export async function fetchAthleteMemory(
  studentId: string
): Promise<AthleteMemoryEvent[]> {
  return apiFetch<AthleteMemoryEvent[]>(
    `/api/students/${studentId}/memory`
  );
}

export async function recordMemoryEvent(
  studentId: string,
  event: Omit<AthleteMemoryEvent, "id">
): Promise<AthleteMemoryEvent> {
  return apiFetch<AthleteMemoryEvent>(
    `/api/students/${studentId}/memory`,
    { method: "POST", body: JSON.stringify(event) }
  );
}

// ---------------------------------------------------------------------------
// Metabolic Analysis
// ---------------------------------------------------------------------------

export async function fetchLatestMetabolicAnalysis(
  studentId: string
): Promise<MetabolicAnalysis | null> {
  return apiFetch<MetabolicAnalysis | null>(
    `/api/students/${studentId}/metabolic-analysis`
  );
}

export async function runMetabolicAnalysis(
  studentId: string
): Promise<MetabolicAnalysis> {
  return apiFetch<MetabolicAnalysis>(
    `/api/students/${studentId}/metabolic-analysis`,
    { method: "POST" }
  );
}

// ---------------------------------------------------------------------------
// Plan Risks
// ---------------------------------------------------------------------------

export async function fetchPlanRisks(
  studentId: string
): Promise<PlanRisk[]> {
  return apiFetch<PlanRisk[]>(
    `/api/students/${studentId}/plan-risks`
  );
}

export async function resolvePlanRisk(
  studentId: string,
  riskId: string
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(
    `/api/students/${studentId}/plan-risks/${riskId}/resolve`,
    { method: "PUT" }
  );
}

// ---------------------------------------------------------------------------
// Supplement Alerts
// ---------------------------------------------------------------------------

export async function fetchSupplementAlerts(
  studentId: string
): Promise<SupplementAlert[]> {
  return apiFetch<SupplementAlert[]>(
    `/api/students/${studentId}/supplement-alerts`
  );
}

export async function resolveSupplementAlert(
  studentId: string,
  alertId: string
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(
    `/api/students/${studentId}/supplement-alerts/${alertId}/resolve`,
    { method: "PUT" }
  );
}

// ---------------------------------------------------------------------------
// Media Analyses
// ---------------------------------------------------------------------------

export async function fetchMediaAnalyses(
  studentId: string
): Promise<MediaAnalysis[]> {
  return apiFetch<MediaAnalysis[]>(
    `/api/students/${studentId}/media-analyses`
  );
}

export async function saveMediaAnalysis(
  studentId: string,
  analysis: Omit<MediaAnalysis, "id">
): Promise<MediaAnalysis> {
  return apiFetch<MediaAnalysis>(
    `/api/students/${studentId}/media-analyses`,
    { method: "POST", body: JSON.stringify(analysis) }
  );
}

// ---------------------------------------------------------------------------
// Blood Panels
// ---------------------------------------------------------------------------

export async function fetchBloodPanels(
  studentId: string
): Promise<BloodPanel[]> {
  return apiFetch<BloodPanel[]>(`/api/students/${studentId}/blood-panels`);
}

export async function saveBloodPanel(
  studentId: string,
  panel: Omit<BloodPanel, "id">
): Promise<BloodPanel> {
  return apiFetch<BloodPanel>(
    `/api/students/${studentId}/blood-panels`,
    { method: "POST", body: JSON.stringify(panel) }
  );
}

export async function deleteBloodPanel(
  studentId: string,
  panelId: string
): Promise<void> {
  await apiFetch(`/api/students/${studentId}/blood-panels/${panelId}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// Blood Panel Recommendations
// ---------------------------------------------------------------------------

export async function fetchBloodPanelRecs(
  studentId: string
): Promise<BloodPanelRecommendation[]> {
  return apiFetch<BloodPanelRecommendation[]>(
    `/api/students/${studentId}/blood-panel-recs`
  );
}

export async function dismissBloodPanelRec(
  studentId: string,
  recId: string
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(
    `/api/students/${studentId}/blood-panel-recs/${recId}/dismiss`,
    { method: "PUT" }
  );
}

// ---------------------------------------------------------------------------
// Health Alerts
// ---------------------------------------------------------------------------

export async function fetchHealthAlerts(): Promise<HealthAlert[]> {
  return apiFetch<HealthAlert[]>("/api/health-alerts");
}

export async function acknowledgeHealthAlert(
  alertId: string
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(
    `/api/health-alerts/${alertId}/acknowledge`,
    { method: "PUT" }
  );
}

// ---------------------------------------------------------------------------
// Health Monitoring
// ---------------------------------------------------------------------------

export interface HealthMonitoringResult {
  ok: boolean;
  scanned: number;
  results: { studentId: string; name: string; newAlerts: number; newRecs: number }[];
  date: string;
}

export async function runHealthMonitoring(): Promise<HealthMonitoringResult> {
  return apiFetch<HealthMonitoringResult>("/api/health-monitoring", {
    method: "POST",
  });
}

// ---------------------------------------------------------------------------
// Conversation Transcripts
// ---------------------------------------------------------------------------

export interface ConversationTranscript {
  id: string;
  studentId?: string | null;
  role: 'coach' | 'assistant';
  text: string;
  detectedAthletes?: string[] | null;
  metadata?: Record<string, unknown>;
  date: string;
}

export async function fetchConversationTranscripts(): Promise<ConversationTranscript[]> {
  return apiFetch<ConversationTranscript[]>("/api/conversation-transcripts");
}

export async function fetchStudentConversationTranscripts(
  studentId: string
): Promise<ConversationTranscript[]> {
  return apiFetch<ConversationTranscript[]>(
    `/api/students/${studentId}/conversation-transcripts`
  );
}

export async function saveConversationTranscript(
  transcript: Omit<ConversationTranscript, "id">
): Promise<ConversationTranscript> {
  return apiFetch<ConversationTranscript>("/api/conversation-transcripts", {
    method: "POST",
    body: JSON.stringify(transcript),
  });
}
