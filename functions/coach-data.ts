// functions/coach-data.ts
// Durable Object that owns all data for a single coach.
// Keyed by coach ID (from X-Rork-User-Id). SQLite-backed.
import { DurableObject } from "cloudflare:workers";

// ---------------------------------------------------------------------------
// Types (mirror the client-side types)
// ---------------------------------------------------------------------------

export interface CoachTask {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  category: "checkin" | "plan_update" | "message" | "subscription" | "alert";
  title: string;
  description: string;
  date: string;
  completed: boolean;
  priority: "critical" | "high" | "medium" | "low";
}

export interface CoachNotification {
  id: string;
  category: "checkin" | "plan_update" | "message" | "billing" | "alert" | "system";
  title: string;
  body: string;
  priority: "critical" | "high" | "medium" | "low";
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

export interface KPStats {
  totalStudents: number;
  totalCheckIns: number;
  activeStudents: number;
  pendingCheckIns: number;
  todayCheckIns: number;
  atRiskCount: number;
  estimatedMonthlyRevenue: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function json<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function nowISO(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// CoachData — one DO per coach
// ---------------------------------------------------------------------------

export class CoachData extends DurableObject {
  // Active WebSocket connections for real-time voice event broadcasting
  #activeSockets: Set<WebSocket> = new Set();

  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env);
    this.#initSchema();
  }

  #initSchema(): void {
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS check_ins (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        data TEXT NOT NULL,
        date TEXT NOT NULL,
        weight REAL,
        body_fat REAL
      );
      CREATE INDEX IF NOT EXISTS idx_ci_student ON check_ins(student_id);
      CREATE INDEX IF NOT EXISTS idx_ci_date ON check_ins(date);

      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_doc_student ON documents(student_id);

      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_fld_student ON folders(student_id);

      CREATE TABLE IF NOT EXISTS training_plans (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL UNIQUE,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS diet_history (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        data TEXT NOT NULL,
        date TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_dh_student ON diet_history(student_id);

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        data TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        date TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        student_id TEXT,
        data TEXT NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        date TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS athlete_memory (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        data TEXT NOT NULL,
        created_by TEXT NOT NULL DEFAULT 'system',
        date TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_am_student ON athlete_memory(student_id);
      CREATE INDEX IF NOT EXISTS idx_am_date ON athlete_memory(date);

      CREATE TABLE IF NOT EXISTS metabolic_analyses (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        data TEXT NOT NULL,
        date TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_ma_student ON metabolic_analyses(student_id);

      CREATE TABLE IF NOT EXISTS plan_risks (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        category TEXT NOT NULL,
        data TEXT NOT NULL,
        resolved INTEGER NOT NULL DEFAULT 0,
        detected_date TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_pr_student ON plan_risks(student_id);

      CREATE TABLE IF NOT EXISTS supplement_alerts (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        incompatibility_type TEXT NOT NULL,
        data TEXT NOT NULL,
        resolved INTEGER NOT NULL DEFAULT 0,
        detected_date TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sa_student ON supplement_alerts(student_id);

      CREATE TABLE IF NOT EXISTS media_analyses (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        analysis_type TEXT NOT NULL,
        data TEXT NOT NULL,
        date TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_mda_student ON media_analyses(student_id);

      CREATE TABLE IF NOT EXISTS blood_panels (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        category TEXT NOT NULL,
        data TEXT NOT NULL,
        date TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_bp_student ON blood_panels(student_id);
      CREATE INDEX IF NOT EXISTS idx_bp_date ON blood_panels(date);

      CREATE TABLE IF NOT EXISTS blood_panel_recs (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        category TEXT NOT NULL,
        data TEXT NOT NULL,
        urgency TEXT NOT NULL DEFAULT 'routine',
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_bpr_student ON blood_panel_recs(student_id);

      CREATE TABLE IF NOT EXISTS health_alerts (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        alert_type TEXT NOT NULL,
        data TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'info',
        acknowledged INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_ha_student ON health_alerts(student_id);

      CREATE TABLE IF NOT EXISTS conversation_transcripts (
        id TEXT PRIMARY KEY,
        student_id TEXT,
        role TEXT NOT NULL,
        text TEXT NOT NULL,
        detected_athletes TEXT,
        metadata TEXT,
        date TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_ct_student ON conversation_transcripts(student_id);
      CREATE INDEX IF NOT EXISTS idx_ct_date ON conversation_transcripts(date);
    `);
  }

  // -----------------------------------------------------------------------
  // fetch — dispatch by path
  // -----------------------------------------------------------------------

  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // WebSocket upgrade — real-time voice session
      if (request.headers.get("Upgrade") === "websocket" && path === "/api/voice-session") {
        const pair = new WebSocketPair();
        const [client, server] = Object.values(pair);
        server.accept();
        this.#activeSockets.add(server);

        server.addEventListener("message", (event) => {
          // Handle client messages if needed (e.g. ping/pong)
          try {
            const data = JSON.parse(event.data as string);
            if (data.type === "ping") {
              server.send(JSON.stringify({ type: "pong", ts: Date.now() }));
            }
          } catch {
            // ignore invalid messages
          }
        });

        server.addEventListener("close", () => {
          this.#activeSockets.delete(server);
        });

        server.addEventListener("error", () => {
          this.#activeSockets.delete(server);
        });

        return new Response(null, { status: 101, webSocket: client });
      }

      // Students
      if (path === "/api/students") {
        if (method === "GET") return this.#listStudents();
        if (method === "POST") return this.#createStudent(await request.json());
        if (method === "PUT") return this.#bulkMigrate(await request.json());
      }

      const studentMatch = path.match(/^\/api\/students\/([^/]+)$/);
      if (studentMatch) {
        const sid = studentMatch[1];
        if (method === "GET") return this.#getStudent(sid);
        if (method === "PUT") return this.#updateStudent(sid, await request.json());
        if (method === "DELETE") return this.#deleteStudent(sid);
      }

      const ciMatch = path.match(/^\/api\/students\/([^/]+)\/checkins$/);
      if (ciMatch && method === "POST") {
        return this.#addCheckIn(ciMatch[1], await request.json());
      }

      // Documents
      const docListMatch = path.match(/^\/api\/students\/([^/]+)\/documents$/);
      if (docListMatch) {
        const sid = docListMatch[1];
        if (method === "GET") return this.#listDocuments(sid);
        if (method === "POST") return this.#addDocument(sid, await request.json());
      }

      const docMatch = path.match(/^\/api\/students\/([^/]+)\/documents\/([^/]+)$/);
      if (docMatch) {
        const [, sid, did] = docMatch;
        if (method === "PUT") return this.#updateDocument(sid, did, await request.json());
        if (method === "DELETE") return this.#deleteDocument(sid, did);
      }

      // Folders
      const fldListMatch = path.match(/^\/api\/students\/([^/]+)\/folders$/);
      if (fldListMatch) {
        const sid = fldListMatch[1];
        if (method === "GET") return this.#listFolders(sid);
        if (method === "POST") return this.#addFolder(sid, await request.json());
      }

      const fldMatch = path.match(/^\/api\/students\/([^/]+)\/folders\/([^/]+)$/);
      if (fldMatch) {
        const [, sid, fid] = fldMatch;
        if (method === "PUT") return this.#updateFolder(sid, fid, await request.json());
        if (method === "DELETE") return this.#deleteFolder(sid, fid);
      }

      // Folders move
      const fldMoveMatch = path.match(/^\/api\/students\/([^/]+)\/folders\/([^/]+)\/move$/);
      if (fldMoveMatch && method === "PUT") {
        const [, sid, fid] = fldMoveMatch;
        const { targetParentId } = await request.json() as { targetParentId?: string };
        return this.#moveFolder(sid, fid, targetParentId);
      }

      // Documents move
      const docMoveMatch = path.match(/^\/api\/students\/([^/]+)\/documents\/([^/]+)\/move$/);
      if (docMoveMatch && method === "PUT") {
        const [, sid, did] = docMoveMatch;
        const { targetFolderId } = await request.json() as { targetFolderId?: string };
        return this.#moveDocument(sid, did, targetFolderId);
      }

      // Documents duplicate
      const docDupMatch = path.match(/^\/api\/students\/([^/]+)\/documents\/([^/]+)\/duplicate$/);
      if (docDupMatch && method === "POST") {
        const [, sid, did] = docDupMatch;
        const { targetFolderId } = await request.json() as { targetFolderId?: string };
        return this.#duplicateDocument(sid, did, targetFolderId);
      }

      // Training plan
      const tpMatch = path.match(/^\/api\/students\/([^/]+)\/training-plan$/);
      if (tpMatch) {
        const sid = tpMatch[1];
        if (method === "GET") return this.#getTrainingPlan(sid);
        if (method === "PUT") return this.#upsertTrainingPlan(sid, await request.json());
        if (method === "DELETE") return this.#deleteTrainingPlan(sid);
      }

      // Diet history
      const dhMatch = path.match(/^\/api\/students\/([^/]+)\/diet-history$/);
      if (dhMatch) {
        const sid = dhMatch[1];
        if (method === "GET") return this.#getDietHistory(sid);
        if (method === "POST") return this.#addDietEntry(sid, await request.json());
      }

      // Tasks
      if (path === "/api/tasks") {
        if (method === "GET") return this.#listTasks();
      }
      const taskCompleteMatch = path.match(/^\/api\/tasks\/([^/]+)\/complete$/);
      if (taskCompleteMatch && method === "PUT") return this.#completeTask(taskCompleteMatch[1]);
      const taskUncompleteMatch = path.match(/^\/api\/tasks\/([^/]+)\/uncomplete$/);
      if (taskUncompleteMatch && method === "PUT") return this.#uncompleteTask(taskUncompleteMatch[1]);

      // Notifications
      if (path === "/api/notifications") {
        if (method === "GET") return this.#listNotifications();
      }
      if (path === "/api/notifications/read-all" && method === "PUT") {
        return this.#markAllRead();
      }
      const notifReadMatch = path.match(/^\/api\/notifications\/([^/]+)\/read$/);
      if (notifReadMatch && method === "PUT") return this.#markRead(notifReadMatch[1]);

      // Athlete Memory
      const memMatch = path.match(/^\/api\/students\/([^/]+)\/memory$/);
      if (memMatch) {
        const sid = memMatch[1];
        if (method === "GET") return this.#getAthleteMemory(sid);
        if (method === "POST") return this.#recordMemoryEvent(sid, await request.json());
      }

      // Metabolic Analysis
      const metaMatch = path.match(/^\/api\/students\/([^/]+)\/metabolic-analysis$/);
      if (metaMatch) {
        const sid = metaMatch[1];
        if (method === "GET") return this.#getLatestMetabolicAnalysis(sid);
        if (method === "POST") return this.#runMetabolicAnalysis(sid);
      }

      // Plan Risks
      const riskMatch = path.match(/^\/api\/students\/([^/]+)\/plan-risks$/);
      if (riskMatch && method === "GET") return this.#getPlanRisks(riskMatch[1]);
      const riskResolveMatch = path.match(/^\/api\/students\/([^/]+)\/plan-risks\/([^/]+)\/resolve$/);
      if (riskResolveMatch && method === "PUT") return this.#resolvePlanRisk(riskResolveMatch[1], riskResolveMatch[2]);

      // Supplement Alerts
      const suppMatch = path.match(/^\/api\/students\/([^/]+)\/supplement-alerts$/);
      if (suppMatch && method === "GET") return this.#getSupplementAlerts(suppMatch[1]);
      const suppResolveMatch = path.match(/^\/api\/students\/([^/]+)\/supplement-alerts\/([^/]+)\/resolve$/);
      if (suppResolveMatch && method === "PUT") return this.#resolveSupplementAlert(suppResolveMatch[1], suppResolveMatch[2]);

      // Media Analyses
      const mediaMatch = path.match(/^\/api\/students\/([^/]+)\/media-analyses$/);
      if (mediaMatch) {
        const sid = mediaMatch[1];
        if (method === "GET") return this.#getMediaAnalyses(sid);
        if (method === "POST") return this.#saveMediaAnalysis(sid, await request.json());
      }

      // Blood Panels
      const bpMatch = path.match(/^\/api\/students\/([^/]+)\/blood-panels$/);
      if (bpMatch) {
        const sid = bpMatch[1];
        if (method === "GET") return this.#getBloodPanels(sid);
        if (method === "POST") return this.#saveBloodPanel(sid, await request.json());
      }
      const bpSingleMatch = path.match(/^\/api\/students\/([^/]+)\/blood-panels\/([^/]+)$/);
      if (bpSingleMatch) {
        const [, sid, bpid] = bpSingleMatch;
        if (method === "DELETE") return this.#deleteBloodPanel(sid, bpid);
      }

      // Blood Panel Recommendations
      const bprMatch = path.match(/^\/api\/students\/([^/]+)\/blood-panel-recs$/);
      if (bprMatch && method === "GET") return this.#getBloodPanelRecs(bprMatch[1]);
      const bprDismissMatch = path.match(/^\/api\/students\/([^/]+)\/blood-panel-recs\/([^/]+)\/dismiss$/);
      if (bprDismissMatch && method === "PUT") return this.#dismissBloodPanelRec(bprDismissMatch[1], bprDismissMatch[2]);

      // Health Alerts
      const haMatch = path.match(/^\/api\/health-alerts$/);
      if (haMatch && method === "GET") return this.#getHealthAlerts();
      const haAckMatch = path.match(/^\/api\/health-alerts\/([^/]+)\/acknowledge$/);
      if (haAckMatch && method === "PUT") return this.#acknowledgeHealthAlert(haAckMatch[1]);

      // Health Monitoring (run full scan)
      if (path === "/api/health-monitoring" && method === "POST") {
        return this.#runHealthMonitoring();
      }

      // Conversation Transcripts
      const convMatch = path.match(/^\/api\/conversation-transcripts$/);
      if (convMatch) {
        if (method === "GET") return this.#listConversationTranscripts();
        if (method === "POST") return this.#saveConversationTranscript(await request.json());
      }
      const convStudentMatch = path.match(/^\/api\/students\/([^/]+)\/conversation-transcripts$/);
      if (convStudentMatch && method === "GET") {
        return this.#listStudentConversationTranscripts(convStudentMatch[1]);
      }

      // Digest & Stats
      if (path === "/api/digest" && method === "GET") return this.#digest();
      if (path === "/api/stats" && method === "GET") return this.#stats();

      return json({ error: "not found" }, 404);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("CoachData error:", message);
      return json({ error: message }, 500);
    }
  }

  // -----------------------------------------------------------------------
  // Students
  // -----------------------------------------------------------------------

  #listStudents(): Response {
    const rows = this.ctx.storage.sql
      .exec<{ data: string }>("SELECT data FROM students ORDER BY created_at DESC")
      .toArray();
    return json(rows.map((r) => JSON.parse(r.data)));
  }

  #getStudent(id: string): Response {
    const row = this.ctx.storage.sql
      .exec<{ data: string }>("SELECT data FROM students WHERE id = ?", id)
      .one();
    if (!row) return json({ error: "student not found" }, 404);
    return json(JSON.parse(row.data));
  }

  #createStudent(body: Record<string, unknown>): Response {
    const id = String(body.id ?? Date.now().toString());
    const now = nowISO();
    const student = {
      ...body,
      id,
      checkIns: body.checkIns ?? [],
      documents: body.documents ?? [],
      folders: body.folders ?? [],
      dietHistory: body.dietHistory ?? [],
      createdAt: (body.createdAt as string) ?? now.split("T")[0],
    };
    this.ctx.storage.sql.exec(
      "INSERT OR REPLACE INTO students (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)",
      id,
      JSON.stringify(student),
      student.createdAt as string,
      now,
    );
    return json(student, 201);
  }

  #updateStudent(id: string, partial: Record<string, unknown>): Response {
    const row = this.ctx.storage.sql
      .exec<{ data: string }>("SELECT data FROM students WHERE id = ?", id)
      .one();
    if (!row) return json({ error: "student not found" }, 404);

    const existing = JSON.parse(row.data);
    const merged = { ...existing, ...partial, updatedAt: nowISO() };
    this.ctx.storage.sql.exec(
      "UPDATE students SET data = ?, updated_at = ? WHERE id = ?",
      JSON.stringify(merged),
      nowISO(),
      id,
    );
    return json(merged);
  }

  #deleteStudent(id: string): Response {
    this.ctx.storage.sql.exec("DELETE FROM students WHERE id = ?", id);
    this.ctx.storage.sql.exec("DELETE FROM check_ins WHERE student_id = ?", id);
    this.ctx.storage.sql.exec("DELETE FROM documents WHERE student_id = ?", id);
    this.ctx.storage.sql.exec("DELETE FROM folders WHERE student_id = ?", id);
    this.ctx.storage.sql.exec("DELETE FROM training_plans WHERE student_id = ?", id);
    this.ctx.storage.sql.exec("DELETE FROM diet_history WHERE student_id = ?", id);
    this.ctx.storage.sql.exec("DELETE FROM tasks WHERE student_id = ?", id);
    this.ctx.storage.sql.exec("DELETE FROM notifications WHERE student_id = ?", id);
    return json({ ok: true });
  }

  // -----------------------------------------------------------------------
  // Check-ins
  // -----------------------------------------------------------------------

  #addCheckIn(studentId: string, body: Record<string, unknown>): Response {
    const row = this.ctx.storage.sql
      .exec<{ data: string }>("SELECT data FROM students WHERE id = ?", studentId)
      .one();
    if (!row) return json({ error: "student not found" }, 404);

    const checkIn = {
      ...body,
      id: body.id ?? Date.now().toString(),
    };
    const existing = JSON.parse(row.data);
    const updatedStudent = {
      ...existing,
      checkIns: [...(existing.checkIns ?? []), checkIn],
      weight: checkIn.weight ?? existing.weight,
      bodyFatPercentage: checkIn.bodyFatPercentage ?? existing.bodyFatPercentage,
      updatedAt: nowISO(),
    };

    this.ctx.storage.sql.exec(
      "UPDATE students SET data = ?, updated_at = ? WHERE id = ?",
      JSON.stringify(updatedStudent),
      nowISO(),
      studentId,
    );

    this.ctx.storage.sql.exec(
      "INSERT OR REPLACE INTO check_ins (id, student_id, data, date, weight, body_fat) VALUES (?, ?, ?, ?, ?, ?)",
      checkIn.id as string,
      studentId,
      JSON.stringify(checkIn),
      (checkIn.date as string) ?? nowISO(),
      (checkIn.weight as number) ?? null,
      (checkIn.bodyFatPercentage as number) ?? null,
    );

    // Regenerate tasks and notifications
    this.#regenerateTasksAndNotifications();

    return json(checkIn, 201);
  }

  // -----------------------------------------------------------------------
  // Documents
  // -----------------------------------------------------------------------

  #listDocuments(studentId: string): Response {
    const rows = this.ctx.storage.sql
      .exec<{ data: string }>("SELECT data FROM documents WHERE student_id = ? ORDER BY created_at DESC", studentId)
      .toArray();
    return json(rows.map((r) => JSON.parse(r.data)));
  }

  #addDocument(studentId: string, body: Record<string, unknown>): Response {
    const now = nowISO();
    const doc = {
      ...body,
      id: body.id ?? Date.now().toString(),
      createdAt: body.createdAt ?? now,
      updatedAt: now,
    };
    this.ctx.storage.sql.exec(
      "INSERT OR REPLACE INTO documents (id, student_id, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      doc.id as string,
      studentId,
      JSON.stringify(doc),
      doc.createdAt as string,
      now,
    );
    return json(doc, 201);
  }

  #updateDocument(studentId: string, docId: string, partial: Record<string, unknown>): Response {
    const row = this.ctx.storage.sql
      .exec<{ data: string }>("SELECT data FROM documents WHERE id = ? AND student_id = ?", docId, studentId)
      .one();
    if (!row) return json({ error: "document not found" }, 404);
    const existing = JSON.parse(row.data);
    const merged = { ...existing, ...partial, updatedAt: nowISO() };
    this.ctx.storage.sql.exec(
      "UPDATE documents SET data = ?, updated_at = ? WHERE id = ?",
      JSON.stringify(merged),
      nowISO(),
      docId,
    );
    return json(merged);
  }

  #deleteDocument(studentId: string, docId: string): Response {
    this.ctx.storage.sql.exec("DELETE FROM documents WHERE id = ? AND student_id = ?", docId, studentId);
    return json({ ok: true });
  }

  #moveDocument(studentId: string, docId: string, targetFolderId?: string): Response {
    const row = this.ctx.storage.sql
      .exec<{ data: string }>("SELECT data FROM documents WHERE id = ? AND student_id = ?", docId, studentId)
      .one();
    if (!row) return json({ error: "document not found" }, 404);
    const existing = JSON.parse(row.data);
    const merged = { ...existing, folderId: targetFolderId, updatedAt: nowISO() };
    this.ctx.storage.sql.exec(
      "UPDATE documents SET data = ?, updated_at = ? WHERE id = ?",
      JSON.stringify(merged),
      nowISO(),
      docId,
    );
    return json(merged);
  }

  #duplicateDocument(studentId: string, docId: string, targetFolderId?: string): Response {
    const row = this.ctx.storage.sql
      .exec<{ data: string }>("SELECT data FROM documents WHERE id = ? AND student_id = ?", docId, studentId)
      .one();
    if (!row) return json({ error: "document not found" }, 404);
    const existing = JSON.parse(row.data);
    const now = nowISO();
    const newDoc = {
      ...existing,
      id: Date.now().toString(),
      name: `${existing.name ?? "Documento"} (copia)`,
      folderId: targetFolderId ?? existing.folderId,
      createdAt: now,
      updatedAt: now,
    };
    this.ctx.storage.sql.exec(
      "INSERT INTO documents (id, student_id, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      newDoc.id,
      studentId,
      JSON.stringify(newDoc),
      now,
      now,
    );
    return json(newDoc, 201);
  }

  // -----------------------------------------------------------------------
  // Folders
  // -----------------------------------------------------------------------

  #listFolders(studentId: string): Response {
    const rows = this.ctx.storage.sql
      .exec<{ data: string }>("SELECT data FROM folders WHERE student_id = ? ORDER BY created_at ASC", studentId)
      .toArray();
    return json(rows.map((r) => JSON.parse(r.data)));
  }

  #addFolder(studentId: string, body: Record<string, unknown>): Response {
    const now = nowISO();
    const folder = {
      ...body,
      id: body.id ?? Date.now().toString(),
      createdAt: body.createdAt ?? now,
      updatedAt: now,
    };
    this.ctx.storage.sql.exec(
      "INSERT OR REPLACE INTO folders (id, student_id, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      folder.id as string,
      studentId,
      JSON.stringify(folder),
      folder.createdAt as string,
      now,
    );
    return json(folder, 201);
  }

  #updateFolder(studentId: string, folderId: string, partial: Record<string, unknown>): Response {
    const row = this.ctx.storage.sql
      .exec<{ data: string }>("SELECT data FROM folders WHERE id = ? AND student_id = ?", folderId, studentId)
      .one();
    if (!row) return json({ error: "folder not found" }, 404);
    const existing = JSON.parse(row.data);
    const merged = { ...existing, ...partial, updatedAt: nowISO() };
    this.ctx.storage.sql.exec(
      "UPDATE folders SET data = ?, updated_at = ? WHERE id = ?",
      JSON.stringify(merged),
      nowISO(),
      folderId,
    );
    return json(merged);
  }

  #deleteFolder(studentId: string, folderId: string): Response {
    // Collect child folder IDs recursively
    const allFolders = this.ctx.storage.sql
      .exec<{ data: string }>("SELECT data FROM folders WHERE student_id = ?", studentId)
      .toArray()
      .map((r) => JSON.parse(r.data) as { id: string; parentId?: string });

    const toDelete = new Set<string>();
    const collect = (id: string) => {
      toDelete.add(id);
      allFolders.filter((f) => f.parentId === id).forEach((f) => collect(f.id));
    };
    collect(folderId);

    for (const fid of toDelete) {
      this.ctx.storage.sql.exec("DELETE FROM folders WHERE id = ?", fid);
    }
    // Delete documents in those folders
    for (const fid of toDelete) {
      this.ctx.storage.sql.exec("DELETE FROM documents WHERE student_id = ? AND json_extract(data, '$.folderId') = ?", studentId, fid);
    }
    return json({ ok: true });
  }

  #moveFolder(studentId: string, folderId: string, targetParentId?: string): Response {
    const row = this.ctx.storage.sql
      .exec<{ data: string }>("SELECT data FROM folders WHERE id = ? AND student_id = ?", folderId, studentId)
      .one();
    if (!row) return json({ error: "folder not found" }, 404);
    const existing = JSON.parse(row.data);
    const merged = { ...existing, parentId: targetParentId, updatedAt: nowISO() };
    this.ctx.storage.sql.exec(
      "UPDATE folders SET data = ?, updated_at = ? WHERE id = ?",
      JSON.stringify(merged),
      nowISO(),
      folderId,
    );
    return json(merged);
  }

  // -----------------------------------------------------------------------
  // Training Plan
  // -----------------------------------------------------------------------

  #getTrainingPlan(studentId: string): Response {
    const row = this.ctx.storage.sql
      .exec<{ data: string }>("SELECT data FROM training_plans WHERE student_id = ?", studentId)
      .one();
    if (!row) return json(null);
    return json(JSON.parse(row.data));
  }

  #upsertTrainingPlan(studentId: string, plan: Record<string, unknown>): Response {
    const id = (plan.id as string) ?? Date.now().toString();
    const now = nowISO();
    this.ctx.storage.sql.exec(
      "INSERT OR REPLACE INTO training_plans (id, student_id, data, created_at) VALUES (?, ?, ?, ?)",
      id,
      studentId,
      JSON.stringify(plan),
      (plan.createdAt as string) ?? now,
    );
    return json(plan);
  }

  #deleteTrainingPlan(studentId: string): Response {
    this.ctx.storage.sql.exec("DELETE FROM training_plans WHERE student_id = ?", studentId);
    return json({ ok: true });
  }

  // -----------------------------------------------------------------------
  // Diet History
  // -----------------------------------------------------------------------

  #getDietHistory(studentId: string): Response {
    const rows = this.ctx.storage.sql
      .exec<{ data: string }>("SELECT data FROM diet_history WHERE student_id = ? ORDER BY date DESC", studentId)
      .toArray();
    return json(rows.map((r) => JSON.parse(r.data)));
  }

  #addDietEntry(studentId: string, entry: Record<string, unknown>): Response {
    const id = entry.id ?? Date.now().toString();
    this.ctx.storage.sql.exec(
      "INSERT OR REPLACE INTO diet_history (id, student_id, data, date) VALUES (?, ?, ?, ?)",
      id as string,
      studentId,
      JSON.stringify(entry),
      (entry.date as string) ?? nowISO(),
    );
    return json(entry, 201);
  }

  // -----------------------------------------------------------------------
  // Tasks
  // -----------------------------------------------------------------------

  #listTasks(): Response {
    const rows = this.ctx.storage.sql
      .exec<{ data: string; completed: number }>(
        "SELECT data, completed FROM tasks ORDER BY date DESC",
      )
      .toArray();
    const tasks = rows.map((r) => ({
      ...JSON.parse(r.data),
      completed: r.completed === 1,
    }));
    return json(tasks);
  }

  #completeTask(taskId: string): Response {
    this.ctx.storage.sql.exec("UPDATE tasks SET completed = 1 WHERE id = ?", taskId);
    return json({ ok: true });
  }

  #uncompleteTask(taskId: string): Response {
    this.ctx.storage.sql.exec("UPDATE tasks SET completed = 0 WHERE id = ?", taskId);
    return json({ ok: true });
  }

  // -----------------------------------------------------------------------
  // Notifications
  // -----------------------------------------------------------------------

  #listNotifications(): Response {
    const rows = this.ctx.storage.sql
      .exec<{ data: string; is_read: number }>(
        "SELECT data, is_read FROM notifications ORDER BY date DESC",
      )
      .toArray();
    const notifs = rows.map((r) => ({
      ...JSON.parse(r.data),
      read: r.is_read === 1,
    }));
    return json(notifs);
  }

  #markRead(notifId: string): Response {
    this.ctx.storage.sql.exec("UPDATE notifications SET is_read = 1 WHERE id = ?", notifId);
    return json({ ok: true });
  }

  #markAllRead(): Response {
    this.ctx.storage.sql.exec("UPDATE notifications SET is_read = 1 WHERE is_read = 0");
    return json({ ok: true });
  }

  // -----------------------------------------------------------------------
  // Digest & Stats
  // -----------------------------------------------------------------------

  #digest(): Response {
    const students = this.#getAllStudents();
    const now = Date.now();

    let pendingCheckIns = 0;
    let plateauCount = 0;

    for (const s of students) {
      if (s.checkIns.length === 0) {
        pendingCheckIns++;
        continue;
      }
      const last = s.checkIns[s.checkIns.length - 1];
      const days = Math.floor((now - new Date(last.date).getTime()) / 86400000);
      if (days > 7) pendingCheckIns++;

      if (s.checkIns.length >= 3) {
        const last3 = s.checkIns.slice(-3);
        const weights = last3.map((c: { weight?: number }) => c.weight ?? 0).filter(Boolean);
        if (weights.length === 3 && Math.abs(weights[2] - weights[0]) < 0.5) {
          plateauCount++;
        }
      }
    }

    const digest: DailyDigest = {
      pendingCheckIns,
      expiringSubscriptions: 0,
      planUpdatesNeeded: plateauCount,
      aiAlerts: plateauCount,
    };
    return json(digest);
  }

  #stats(): Response {
    const students = this.#getAllStudents();
    const now = Date.now();
    const today = new Date().toISOString().split("T")[0];

    let totalCheckIns = 0;
    let activeStudents = 0;
    let pendingCheckIns = 0;
    let todayCheckIns = 0;
    let atRiskCount = 0;

    for (const s of students) {
      totalCheckIns += s.checkIns.length;
      if (s.checkIns.length > 0) activeStudents++;

      if (s.checkIns.length === 0) {
        pendingCheckIns++;
      } else {
        const last = s.checkIns[s.checkIns.length - 1];
        const days = Math.floor((now - new Date(last.date).getTime()) / 86400000);
        if (days > 7) pendingCheckIns++;
      }

      // Today's check-ins
      const hasToday = s.checkIns.some((c: { date: string }) => c.date.startsWith(today));
      if (hasToday) todayCheckIns++;

      // At-risk: no check-in in 14+ days
      if (s.checkIns.length > 0) {
        const last = s.checkIns[s.checkIns.length - 1];
        const days = Math.floor((now - new Date(last.date).getTime()) / 86400000);
        if (days >= 14) atRiskCount++;
      } else {
        const createdDays = Math.floor((now - new Date(s.createdAt).getTime()) / 86400000);
        if (createdDays > 7) atRiskCount++;
      }
    }

    const stats: KPStats = {
      totalStudents: students.length,
      totalCheckIns,
      activeStudents,
      pendingCheckIns,
      todayCheckIns,
      atRiskCount,
      estimatedMonthlyRevenue: students.length * 25, // placeholder
    };
    return json(stats);
  }

  // -----------------------------------------------------------------------
  // Athlete Memory — Linear chronological event log
  // -----------------------------------------------------------------------

  #getAthleteMemory(studentId: string): Response {
    const rows = this.ctx.storage.sql
      .exec<{ data: string }>(
        "SELECT data FROM athlete_memory WHERE student_id = ? ORDER BY date ASC",
        studentId,
      )
      .toArray();
    return json(rows.map((r) => JSON.parse(r.data)));
  }

  #recordMemoryEvent(studentId: string, body: Record<string, unknown>): Response {
    const id = (body.id as string) ?? Date.now().toString();
    const event = {
      id,
      studentId,
      type: body.type ?? "system_event",
      title: body.title ?? "",
      description: body.description ?? "",
      date: (body.date as string) ?? nowISO(),
      createdBy: body.createdBy ?? "system",
      metadata: body.metadata ?? {},
    };
    this.ctx.storage.sql.exec(
      "INSERT OR REPLACE INTO athlete_memory (id, student_id, event_type, data, created_by, date) VALUES (?, ?, ?, ?, ?, ?)",
      id as string,
      studentId,
      event.type as string,
      JSON.stringify(event),
      event.createdBy as string,
      event.date as string,
    );
    return json(event, 201);
  }

  // -----------------------------------------------------------------------
  // Metabolic Analysis Engine
  // -----------------------------------------------------------------------

  #getLatestMetabolicAnalysis(studentId: string): Response {
    const row = this.ctx.storage.sql
      .exec<{ data: string }>(
        "SELECT data FROM metabolic_analyses WHERE student_id = ? ORDER BY date DESC LIMIT 1",
        studentId,
      )
      .one();
    if (!row) return json(null);
    return json(JSON.parse(row.data));
  }

  #runMetabolicAnalysis(studentId: string): Response {
    const row = this.ctx.storage.sql
      .exec<{ data: string }>("SELECT data FROM students WHERE id = ?", studentId)
      .one();
    if (!row) return json({ error: "student not found" }, 404);

    const student = JSON.parse(row.data) as Record<string, unknown>;
    const checkIns = (student.checkIns as Array<Record<string, unknown>>) ?? [];
    const sortedCheckIns = [...checkIns].sort(
      (a, b) => new Date((a.date as string) ?? "").getTime() - new Date((b.date as string) ?? "").getTime(),
    );

    if (sortedCheckIns.length < 3) {
      return json({ error: "Need at least 3 check-ins for metabolic analysis" }, 400);
    }

    const analysis = this.#computeMetabolicAnalysis(student, sortedCheckIns);

    // Persist
    const id = `meta_${studentId}_${Date.now()}`;
    const record = { id, studentId, ...analysis, date: nowISO(), generatedBy: "ai" };
    this.ctx.storage.sql.exec(
      "INSERT INTO metabolic_analyses (id, student_id, data, date) VALUES (?, ?, ?, ?)",
      id,
      studentId,
      JSON.stringify(record),
      record.date,
    );

    // Record memory event
    this.#recordMemoryEvent(studentId, {
      id: `mem_meta_${Date.now()}`,
      type: "metabolic_analysis",
      title: "Análisis metabólico completado",
      description: `Score de riesgo: ${analysis.riskScore}/100. Salud metabólica: ${analysis.metabolicHealth}. ${analysis.inflammationMarkers.length} marcadores de inflamación detectados.`,
      createdBy: "ai",
      metadata: { analysisId: id },
    });

    // Auto-detect plan risks from analysis
    this.#detectAndSavePlanRisks(student, sortedCheckIns, analysis);

    return json(record, 201);
  }

  #computeMetabolicAnalysis(
    student: Record<string, unknown>,
    sortedCheckIns: Array<Record<string, unknown>>,
  ): Record<string, unknown> {
    const now = Date.now();
    const allCheckIns = sortedCheckIns;
    const weeksBack = Math.min(8, allCheckIns.length);
    const recentCheckIns = allCheckIns.slice(-weeksBack);

    // --- Weight trend ---
    const weights = recentCheckIns.map((c) => (c.weight as number) ?? 0).filter(Boolean);
    const firstW = weights[0];
    const lastW = weights[weights.length - 1];
    const totalChange = lastW && firstW ? lastW - firstW : 0;
    const weeksSpan = Math.max(1, (now - new Date((recentCheckIns[0]?.date as string) ?? "").getTime()) / (7 * 86400000));
    const weeklyRate = weights.length >= 2 ? totalChange / Math.max(1, (weights.length - 1)) : 0;
    const weightDirection: string =
      Math.abs(weeklyRate) < 0.15 ? "stable" : weeklyRate < 0 ? "losing" : "gaining";

    // --- Body fat trend ---
    const bfs = recentCheckIns.filter((c) => c.bodyFatPercentage != null).map((c) => c.bodyFatPercentage as number);
    let bodyFatTrend: Record<string, unknown> | null = null;
    if (bfs.length >= 2) {
      const bfTotalChange = bfs[bfs.length - 1] - bfs[0];
      bodyFatTrend = {
        direction: Math.abs(bfTotalChange) < 0.3 ? "stable" : bfTotalChange < 0 ? "losing" : "gaining",
        weeklyRate: Math.round((bfTotalChange / Math.max(1, bfs.length - 1)) * 10) / 10,
        totalChange: Math.round(bfTotalChange * 10) / 10,
      };
    }

    // --- Adherence trend ---
    const adherences = recentCheckIns.filter((c) => c.dietAdherence != null).map((c) => c.dietAdherence as number);
    const avgAdh = adherences.length > 0 ? adherences.reduce((s, v) => s + v, 0) / adherences.length : 0;
    const recentAdh = adherences.slice(-3);
    const recentAdhAvg = recentAdh.length > 0 ? recentAdh.reduce((s, v) => s + v, 0) / recentAdh.length : avgAdh;
    const adhDirection = recentAdhAvg > avgAdh + 0.3 ? "improving" : recentAdhAvg < avgAdh - 0.3 ? "declining" : "stable";

    // --- Energy, sleep, stress, digestive, performance trends ---
    const calcTrend = (field: string, invertForWorsening = false): { direction: string; average: number } | null => {
      const vals = recentCheckIns.filter((c) => c[field] != null).map((c) => c[field] as number);
      if (vals.length < 2) return null;
      const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
      const recent = vals.slice(-3);
      const recentAvg = recent.length > 0 ? recent.reduce((s, v) => s + v, 0) / recent.length : avg;
      const diff = recentAvg - avg;
      let direction: string;
      if (Math.abs(diff) < 0.3) direction = "stable";
      else if (invertForWorsening) direction = diff < 0 ? "improving" : "worsening";
      else direction = diff > 0 ? "improving" : "declining";
      return { direction, average: Math.round(avg * 10) / 10 };
    };

    const energyTrend = calcTrend("energyLevel");
    const sleepTrend = calcTrend("sleepHours");
    const stressTrend = calcTrend("stressLevel", true);
    const digestiveTrend = calcTrend("digestiveHealth");
    const performanceTrend = calcTrend("trainingPerformance");

    // --- Inflammation markers ---
    const inflammationMarkers: string[] = [];

    if (weightDirection === "stable" && Math.abs(weeklyRate) < 0.1 && totalChange !== 0) {
      // Weight stagnated after initial change (possible adaptation)
      const firstHalf = weights.slice(0, Math.ceil(weights.length / 2));
      const secondHalf = weights.slice(Math.ceil(weights.length / 2));
      const firstHalfChange = firstHalf.length > 1 ? firstHalf[firstHalf.length - 1] - firstHalf[0] : 0;
      const secondHalfChange = secondHalf.length > 1 ? secondHalf[secondHalf.length - 1] - secondHalf[0] : 0;
      if (Math.abs(firstHalfChange) > 0.5 && Math.abs(secondHalfChange) < 0.3) {
        inflammationMarkers.push("weight_stagnation");
      }
    }

    if (Math.abs(weeklyRate) > 0.8) {
      inflammationMarkers.push("rapid_weight_change");
    }

    const recentBloating = recentCheckIns.filter((c) => c.bloating != null).map((c) => c.bloating as number);
    if (recentBloating.length >= 2 && recentBloating.reduce((s, v) => s + v, 0) / recentBloating.length > 5) {
      inflammationMarkers.push("bloating_persistent");
    }

    if (digestiveTrend && digestiveTrend.direction === "worsening" && digestiveTrend.average < 5) {
      inflammationMarkers.push("digestive_decline");
    }

    if (energyTrend && energyTrend.direction === "declining" && energyTrend.average < 5) {
      inflammationMarkers.push("energy_drop");
    }

    if (sleepTrend && sleepTrend.direction === "declining" && sleepTrend.average < 6) {
      inflammationMarkers.push("sleep_decline");
    }

    if (stressTrend && stressTrend.direction === "worsening" && stressTrend.average > 6) {
      inflammationMarkers.push("stress_elevated");
    }

    if (performanceTrend && performanceTrend.direction === "declining") {
      inflammationMarkers.push("performance_drop");
    }

    const recentAppetite = recentCheckIns.filter((c) => c.appetiteLevel != null).map((c) => c.appetiteLevel as number);
    if (recentAppetite.length >= 2 && recentAppetite.reduce((s, v) => s + v, 0) / recentAppetite.length < 4) {
      inflammationMarkers.push("appetite_loss");
    }

    const recentMood = recentCheckIns.filter((c) => c.mood != null).map((c) => c.mood as number);
    if (recentMood.length >= 2 && recentMood.reduce((s, v) => s + v, 0) / recentMood.length < 4) {
      inflammationMarkers.push("mood_decline");
    }

    // --- Risk score (0-100) ---
    let riskScore = 0;
    riskScore += inflammationMarkers.length * 10;
    if (weightDirection === "losing" && weeklyRate > 0.6) riskScore += 15;
    if (adhDirection === "declining") riskScore += 10;
    if (energyTrend?.direction === "declining") riskScore += 8;
    if (stressTrend?.direction === "worsening") riskScore += 8;
    if (digestiveTrend?.direction === "worsening") riskScore += 8;
    if (performanceTrend?.direction === "declining") riskScore += 10;
    riskScore = Math.min(100, riskScore);

    // --- Metabolic health status ---
    const metabolicHealth =
      riskScore <= 15 ? "optimal" :
      riskScore <= 35 ? "good" :
      riskScore <= 60 ? "warning" :
      "critical";

    // --- Findings & recommendations ---
    const findings: string[] = [];
    const recommendations: Record<string, string[]> = {
      tests: [],
      nutrition: [],
      supplements: [],
      training: [],
      recovery: [],
    };

    // Weight findings
    if (weightDirection === "losing" && weeklyRate > 0.6) {
      findings.push(`Pérdida rápida de peso (${Math.abs(Math.round(weeklyRate * 10) / 10)} kg/semana). Riesgo de pérdida muscular y adaptación metabólica.`);
      recommendations.nutrition.push("Reducir ritmo de pérdida a 0.3-0.5 kg/semana aumentando 150-200 kcal.");
      recommendations.tests.push("Perfil tiroideo (TSH, T3, T4) para descartar supresión metabólica.");
    } else if (weightDirection === "stable" && student.goal === "lose_fat") {
      findings.push("Estancamiento en pérdida de peso. Posible adaptación metabólica o déficit mal calculado.");
      recommendations.nutrition.push("Considerar diet break de 7-14 días a calorías de mantenimiento para resensibilizar hormonas tiroideas y leptina.");
      recommendations.tests.push("Leptina sérica y cortisol matutino para confirmar adaptación.");
    }

    // Adherence findings
    if (adhDirection === "declining") {
      findings.push(`Adherencia en declive (promedio reciente: ${Math.round(recentAdhAvg * 10) / 10}/10 vs general: ${Math.round(avgAdh * 10) / 10}/10). Señal de fatiga del plan.`);
      recommendations.nutrition.push("Rotar fuentes de alimentos para combatir fatiga de menú. Introducir 1-2 comidas libres semanales estructuradas.");
    }

    // Energy/Sleep/Stress cluster → possible overtraining or hormonal disruption
    if (energyTrend?.direction === "declining" || stressTrend?.direction === "worsening" || sleepTrend?.direction === "declining") {
      findings.push("Cluster de fatiga: energía, estrés y/o sueño deteriorándose. Riesgo de sobreentrenamiento o disrupción del eje HPA.");
      recommendations.recovery.push("Implementar 2-3 días de descarga activa con reducción del 40% del volumen.");
      recommendations.supplements.push("Magnesio bisglicinato 400mg antes de dormir para mejorar calidad de sueño.");
      recommendations.supplements.push("Ashwagandha KSM-66 600mg para regulación del eje HPA.");
      recommendations.tests.push("Cortisol salival (4 puntos diurnos) y DHEA-S para evaluar eje adrenal.");
    }

    // Digestive markers
    if (inflammationMarkers.includes("digestive_decline") || inflammationMarkers.includes("bloating_persistent")) {
      findings.push("Indicadores de inflamación digestiva detectados. Posible disbiosis, intolerancia alimentaria o permeabilidad intestinal.");
      recommendations.nutrition.push("Eliminar lácteos y gluten 14 días como prueba de eliminación. Introducir probióticos multi-cepa.");
      recommendations.supplements.push("L-Glutamina 10g/día para soporte de barrera intestinal.");
      recommendations.tests.push("Análisis de microbiota intestinal (PCR) y test de permeabilidad (zonulina).");
    }

    // Low fat warning for hormonal health
    const nutritionPlan = student.nutritionPlan as Record<string, unknown> | undefined;
    if (nutritionPlan) {
      const fats = nutritionPlan.fats as number | undefined;
      const weight = student.weight as number | undefined;
      const gender = student.gender as string;
      if (fats && weight) {
        const fatsPerKg = fats / weight;
        const minFat = gender === "female" ? 0.8 : 0.5;
        if (fatsPerKg < minFat) {
          findings.push(`Grasas insuficientes (${Math.round(fatsPerKg * 10) / 10}g/kg). Mínimo recomendado: ${minFat}g/kg para soporte hormonal ${gender === "female" ? "femenino" : "masculino"}.`);
          recommendations.nutrition.push(`Aumentar grasas a mínimo ${Math.round(minFat * weight)}g/día. Priorizar omega-3, aguacate, aceite de oliva y frutos secos.`);
          recommendations.tests.push("Perfil hormonal: testosterona total y libre, estradiol (E2), SHBG.");
        }
      }
    }

    // Recovery recommendations (always)
    if (!recommendations.recovery.length) {
      recommendations.recovery.push("Mantener 7-8h de sueño y al menos 1 día completo de descanso semanal.");
    }
    if (!recommendations.training.length) {
      recommendations.training.push("Periodizar con microciclos de 3:1 (3 semanas carga, 1 descarga).");
    }

    // Medical referral flag
    let medicalReferral: string | undefined;
    if (riskScore >= 70) {
      medicalReferral = "Se recomienda derivación a médico deportivo / endocrinólogo para evaluación presencial. Score de riesgo elevado.";
    }

    return {
      periodWeeks: Math.round(weeksSpan),
      metrics: {
        weightTrend: { direction: weightDirection, weeklyRate: Math.round(weeklyRate * 100) / 100, totalChange: Math.round(totalChange * 10) / 10 },
        bodyFatTrend,
        adherenceTrend: { direction: adhDirection, average: Math.round(avgAdh * 10) / 10, recentAverage: Math.round(recentAdhAvg * 10) / 10 },
        energyTrend,
        sleepTrend,
        stressTrend,
        digestiveTrend,
        performanceTrend,
      },
      inflammationMarkers,
      riskScore,
      metabolicHealth,
      findings,
      recommendations: {
        ...recommendations,
        medicalReferral,
      },
    };
  }

  // -----------------------------------------------------------------------
  // Plan Risk Detection
  // -----------------------------------------------------------------------

  #detectAndSavePlanRisks(
    student: Record<string, unknown>,
    sortedCheckIns: Array<Record<string, unknown>>,
    analysis?: Record<string, unknown>,
  ): void {
    const studentId = student.id as string;
    const nutritionPlan = student.nutritionPlan as Record<string, unknown> | undefined;
    if (!nutritionPlan) return;

    const now = nowISO();
    const risks: Array<Record<string, unknown>> = [];

    // 1. Prolonged caloric deficit
    const calories = nutritionPlan.calories as number;
    const weight = student.weight as number;
    const tdee = (student.tdee as number) ?? weight * 30;
    if (calories && tdee && calories < tdee * 0.7) {
      risks.push({
        id: `risk_cal_deficit_${studentId}_${now}`,
        studentId,
        category: "caloric_deficit_prolonged",
        severity: calories < tdee * 0.55 ? "critical" : "high",
        title: "Déficit calórico agresivo prolongado",
        description: `Plan actual: ${calories} kcal vs TDEE estimado ${Math.round(tdee)} kcal (déficit del ${Math.round((1 - calories / tdee) * 100)}%). Riesgo de supresión metabólica, pérdida muscular y disrupción hormonal.`,
        detectedDate: now,
        evidence: [`Déficit >30% sostenido`, `TDEE estimado: ${Math.round(tdee)} kcal`, `Calorías plan: ${calories} kcal`],
        suggestedAction: "Aumentar 150-250 kcal con carbohidratos complejos. Considerar diet break de 7-14 días si el déficit lleva >8 semanas.",
        resolved: false,
      });
    }

    // 2. Low fat (hormonal risk)
    const fats = nutritionPlan.fats as number;
    const gender = student.gender as string;
    if (fats && weight) {
      const fatsPerKg = fats / weight;
      const minFat = gender === "female" ? 0.8 : 0.5;
      if (fatsPerKg < minFat) {
        risks.push({
          id: `risk_lowfat_${studentId}_${now}`,
          studentId,
          category: "low_fat_prolonged",
          severity: fatsPerKg < minFat * 0.6 ? "critical" : "high",
          title: `Grasas insuficientes — Riesgo hormonal ${gender === "female" ? "femenino" : "masculino"}`,
          description: `Ingesta actual: ${Math.round(fatsPerKg * 10) / 10}g/kg de grasa. Mínimo para soporte hormonal ${gender === "female" ? "femenino (ciclo menstrual, estrógenos)" : "masculino (testosterona)"}: ${minFat}g/kg.`,
          detectedDate: now,
          evidence: [`${fats}g grasa = ${Math.round(fatsPerKg * 10) / 10}g/kg`, `Mínimo recomendado: ${minFat}g/kg`, `Género: ${gender}`],
          suggestedAction: `Aumentar grasas a mínimo ${Math.round(minFat * weight)}g/día con fuentes saludables (aguacate, aceite oliva, frutos secos, pescado graso).`,
          resolved: false,
        });
      }
    }

    // 3. Excessive cardio
    const recentCheckIns = sortedCheckIns.slice(-4);
    const cardioMinutes = recentCheckIns.filter((c) => c.cardioMinutes != null).map((c) => c.cardioMinutes as number);
    if (cardioMinutes.length >= 2) {
      const avgCardio = cardioMinutes.reduce((s, v) => s + v, 0) / cardioMinutes.length;
      if (avgCardio > 60) {
        const severity = avgCardio > 90 ? "critical" : avgCardio > 75 ? "high" : "medium";
        risks.push({
          id: `risk_cardio_${studentId}_${now}`,
          studentId,
          category: "excessive_cardio",
          severity,
          title: `Exceso de cardio (${Math.round(avgCardio)} min/día promedio)`,
          description: `Cardio excesivo puede elevar cortisol, promover catabolismo muscular, aumentar hambre y sabotear la pérdida de grasa por compensación metabólica.`,
          detectedDate: now,
          evidence: [`Promedio últimos check-ins: ${Math.round(avgCardio)} min/día`, `Máximo recomendado en déficit: 45 min/día`],
          suggestedAction: "Reducir cardio a 30-45 min/día máximo. Priorizar pasos diarios (8-12K) sobre cardio estructurado en déficit.",
          resolved: false,
        });
      }
    }

    // 4. Insufficient protein
    const protein = nutritionPlan.protein as number;
    if (protein && weight && protein / weight < 1.6) {
      risks.push({
        id: `risk_protein_${studentId}_${now}`,
        studentId,
        category: "insufficient_protein",
        severity: protein / weight < 1.2 ? "high" : "medium",
        title: `Proteína insuficiente (${Math.round(protein / weight * 10) / 10}g/kg)`,
        description: `Para preservación muscular en déficit se recomienda mínimo 1.8-2.2g/kg. Actual: ${Math.round(protein / weight * 10) / 10}g/kg.`,
        detectedDate: now,
        evidence: [`${protein}g proteína para ${weight}kg = ${Math.round(protein / weight * 10) / 10}g/kg`, `Mínimo recomendado: 1.8g/kg`],
        suggestedAction: `Aumentar proteína a ${Math.round(weight * 2)}g/día reduciendo ligeramente carbohidratos o grasas para mantener calorías.`,
        resolved: false,
      });
    }

    // 5. Metabolic adaptation (from analysis)
    if (analysis) {
      const markers = (analysis.inflammationMarkers as string[]) ?? [];
      if (markers.includes("weight_stagnation") && markers.includes("energy_drop")) {
        risks.push({
          id: `risk_metadapt_${studentId}_${now}`,
          studentId,
          category: "metabolic_adaptation",
          severity: "high",
          title: "Adaptación metabólica detectada",
          description: "Estancamiento de peso combinado con caída de energía sugiere adaptación metabólica. El cuerpo reduce el gasto energético para compensar el déficit.",
          detectedDate: now,
          evidence: ["Estancamiento de peso en 2+ semanas", "Energía en declive", "Posible supresión de T3/leptina"],
          suggestedAction: "Implementar diet break de 10-14 días a calorías de mantenimiento. Reintroducir carbohidratos gradualmente. Monitorear energía y peso durante el break.",
          resolved: false,
        });
      }
    }

    // Persist risks (avoid duplicates: delete old unresolved for same category, then insert new)
    for (const risk of risks) {
      this.ctx.storage.sql.exec(
        "INSERT OR REPLACE INTO plan_risks (id, student_id, category, data, resolved, detected_date) VALUES (?, ?, ?, ?, 0, ?)",
        risk.id as string,
        studentId,
        risk.category as string,
        JSON.stringify(risk),
        risk.detectedDate as string,
      );
    }
  }

  #getPlanRisks(studentId: string): Response {
    const rows = this.ctx.storage.sql
      .exec<{ data: string; resolved: number }>(
        "SELECT data, resolved FROM plan_risks WHERE student_id = ? ORDER BY detected_date DESC",
        studentId,
      )
      .toArray();
    const risks = rows.map((r) => ({ ...JSON.parse(r.data), resolved: r.resolved === 1 }));
    return json(risks);
  }

  #resolvePlanRisk(studentId: string, riskId: string): Response {
    this.ctx.storage.sql.exec(
      "UPDATE plan_risks SET resolved = 1 WHERE id = ? AND student_id = ?",
      riskId,
      studentId,
    );
    return json({ ok: true });
  }

  // -----------------------------------------------------------------------
  // Supplement Alerts — Incompatibility Detection
  // -----------------------------------------------------------------------

  #getSupplementAlerts(studentId: string): Response {
    const rows = this.ctx.storage.sql
      .exec<{ data: string; resolved: number }>(
        "SELECT data, resolved FROM supplement_alerts WHERE student_id = ? ORDER BY detected_date DESC",
        studentId,
      )
      .toArray();
    const alerts = rows.map((r) => ({ ...JSON.parse(r.data), resolved: r.resolved === 1 }));
    return json(alerts);
  }

  #resolveSupplementAlert(studentId: string, alertId: string): Response {
    this.ctx.storage.sql.exec(
      "UPDATE supplement_alerts SET resolved = 1 WHERE id = ? AND student_id = ?",
      alertId,
      studentId,
    );
    return json({ ok: true });
  }

  // -----------------------------------------------------------------------
  // Media Analyses
  // -----------------------------------------------------------------------

  #getMediaAnalyses(studentId: string): Response {
    const rows = this.ctx.storage.sql
      .exec<{ data: string }>(
        "SELECT data FROM media_analyses WHERE student_id = ? ORDER BY date DESC",
        studentId,
      )
      .toArray();
    return json(rows.map((r) => JSON.parse(r.data)));
  }

  #saveMediaAnalysis(studentId: string, body: Record<string, unknown>): Response {
    const id = (body.id as string) ?? `media_${studentId}_${Date.now()}`;
    const analysis = {
      ...body,
      id,
      studentId,
      date: (body.date as string) ?? nowISO(),
    };
    this.ctx.storage.sql.exec(
      "INSERT OR REPLACE INTO media_analyses (id, student_id, analysis_type, data, date) VALUES (?, ?, ?, ?, ?)",
      id as string,
      studentId,
      (analysis.type as string) ?? "physique",
      JSON.stringify(analysis),
      analysis.date as string,
    );

    // Auto-record memory event
    this.#recordMemoryEvent(studentId, {
      id: `mem_media_${Date.now()}`,
      type: "media_analysis",
      title: `Análisis de ${(analysis.type as string) ?? "medios"} registrado`,
      description: (analysis.summary as string) ?? "Análisis de medios completado.",
      createdBy: (analysis.createdBy as string) ?? "ai",
      metadata: { analysisId: id },
    });

    return json(analysis, 201);
  }

  // -----------------------------------------------------------------------
  // Blood Panels — CRUD
  // -----------------------------------------------------------------------

  #getBloodPanels(studentId: string): Response {
    const rows = this.ctx.storage.sql
      .exec<{ data: string }>(
        "SELECT data FROM blood_panels WHERE student_id = ? ORDER BY date DESC",
        studentId,
      )
      .toArray();
    return json(rows.map((r) => JSON.parse(r.data)));
  }

  #saveBloodPanel(studentId: string, body: Record<string, unknown>): Response {
    const id = (body.id as string) ?? `bp_${studentId}_${Date.now()}`;
    const panel = { ...body, id, studentId, date: (body.date as string) ?? nowISO() };
    this.ctx.storage.sql.exec(
      "INSERT OR REPLACE INTO blood_panels (id, student_id, category, data, date) VALUES (?, ?, ?, ?, ?)",
      id, studentId,
      (panel.category as string) ?? "complete_blood_count",
      JSON.stringify(panel), panel.date as string,
    );
    this.ctx.storage.sql.exec(
      "UPDATE blood_panel_recs SET status = 'completed' WHERE student_id = ? AND category = ? AND status = 'pending'",
      studentId, (panel.category as string) ?? "complete_blood_count",
    );
    this.#recordMemoryEvent(studentId, {
      id: `mem_bp_${Date.now()}`, type: "test_recommended",
      title: "Panel sanguíneo registrado",
      description: `${panel.category as string}: ${(panel.summary as string) ?? "Resultados registrados"}`,
      createdBy: panel.createdBy ?? "coach", metadata: { panelId: id },
    });
    return json(panel, 201);
  }

  #deleteBloodPanel(studentId: string, panelId: string): Response {
    this.ctx.storage.sql.exec("DELETE FROM blood_panels WHERE id = ? AND student_id = ?", panelId, studentId);
    return json({ ok: true });
  }

  // -----------------------------------------------------------------------
  // Blood Panel Recommendations
  // -----------------------------------------------------------------------

  #getBloodPanelRecs(studentId: string): Response {
    const rows = this.ctx.storage.sql
      .exec<{ data: string }>("SELECT data FROM blood_panel_recs WHERE student_id = ? ORDER BY created_at DESC", studentId)
      .toArray();
    return json(rows.map((r) => JSON.parse(r.data)));
  }

  #dismissBloodPanelRec(studentId: string, recId: string): Response {
    this.ctx.storage.sql.exec("UPDATE blood_panel_recs SET status = 'dismissed' WHERE id = ? AND student_id = ?", recId, studentId);
    return json({ ok: true });
  }

  // -----------------------------------------------------------------------
  // Health Alerts
  // -----------------------------------------------------------------------

  #getHealthAlerts(): Response {
    const rows = this.ctx.storage.sql
      .exec<{ data: string; acknowledged: number }>("SELECT data, acknowledged FROM health_alerts ORDER BY created_at DESC")
      .toArray();
    return json(rows.map((r) => ({ ...JSON.parse(r.data), acknowledged: r.acknowledged === 1 })));
  }

  #acknowledgeHealthAlert(alertId: string): Response {
    this.ctx.storage.sql.exec("UPDATE health_alerts SET acknowledged = 1 WHERE id = ?", alertId);
    return json({ ok: true });
  }

  // -----------------------------------------------------------------------
  // Health Monitoring Engine
  // -----------------------------------------------------------------------

  #runHealthMonitoring(): Response {
    const students = this.#getAllStudents();
    const now = nowISO();
    const results: { studentId: string; name: string; newAlerts: number; newRecs: number }[] = [];
    for (const s of students) {
      const sid = s.id as string;
      const name = s.name as string;
      let newAlerts = 0;
      let newRecs = 0;
      newRecs += this.#checkSupplementPanels(sid, s, now);
      newRecs += this.#checkPlanDurationPanels(sid, s, now);
      newAlerts += this.#checkMetabolicConcerns(sid, s, now);
      newRecs += this.#checkGoalPhasePanels(sid, s, now);
      newRecs += this.#checkPeriodicCheckup(sid, s, now);
      if (newAlerts > 0 || newRecs > 0) results.push({ studentId: sid, name, newAlerts, newRecs });
    }
    this.#generateHealthNotifications();
    return json({ ok: true, scanned: students.length, results, date: now });
  }

  #checkSupplementPanels(studentId: string, student: Record<string, unknown>, now: string): number {
    let newRecs = 0;
    const nutritionPlan = student.nutritionPlan as Record<string, unknown> | undefined;
    if (!nutritionPlan) return 0;
    const supplements = (nutritionPlan.supplements as Array<{ name: string }>) ?? [];
    for (const supp of supplements) {
      const suppName = (supp.name ?? "").toLowerCase();
      const monitoring = this.#findSupplementMonitoring(suppName);
      if (!monitoring) continue;
      for (const panel of monitoring.panels) {
        const existingRec = this.ctx.storage.sql
          .exec<{ count: number }>("SELECT COUNT(*) as count FROM blood_panel_recs WHERE student_id = ? AND category = ? AND status IN ('pending', 'scheduled')", studentId, panel)
          .one();
        if (existingRec && existingRec.count > 0) continue;
        const lastPanel = this.ctx.storage.sql
          .exec<{ data: string }>("SELECT data FROM blood_panels WHERE student_id = ? AND category = ? ORDER BY date DESC LIMIT 1", studentId, panel)
          .one();
        let needsPanel = true;
        if (lastPanel) {
          const lp = JSON.parse(lastPanel.data);
          const weeksSince = (Date.now() - new Date(lp.date).getTime()) / (7 * 86400000);
          if (weeksSince < monitoring.intervalWeeks) needsPanel = false;
        }
        if (needsPanel) {
          const rec = {
            id: `bpr_${studentId}_${panel}_${Date.now()}`, studentId, category: panel,
            reason: monitoring.reason, urgency: "recommended" as const,
            suggestedDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
            basedOn: [`Suplemento: ${suppName}`], status: "pending" as const,
            createdAt: now, createdBy: "system" as const,
          };
          this.ctx.storage.sql.exec(
            "INSERT OR REPLACE INTO blood_panel_recs (id, student_id, category, data, urgency, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            rec.id, studentId, panel, JSON.stringify(rec), rec.urgency, rec.status, now,
          );
          newRecs++;
        }
      }
    }
    return newRecs;
  }

  #findSupplementMonitoring(name: string): { panels: string[]; intervalWeeks: number; reason: string } | null {
    const map: Record<string, { panels: string[]; intervalWeeks: number; reason: string }> = {
      "hierro": { panels: ["iron_panel", "complete_blood_count"], intervalWeeks: 8, reason: "Monitoreo de ferritina y hemograma por suplementación con hierro." },
      "iron": { panels: ["iron_panel", "complete_blood_count"], intervalWeeks: 8, reason: "Monitoreo de ferritina y hemograma por suplementación con hierro." },
      "vitamina d": { panels: ["vitamin_mineral"], intervalWeeks: 12, reason: "Monitoreo de 25-OH vitamina D." },
      "vitamin d": { panels: ["vitamin_mineral"], intervalWeeks: 12, reason: "Monitoreo de 25-OH vitamina D." },
      "zinc": { panels: ["vitamin_mineral"], intervalWeeks: 12, reason: "El zinc en dosis altas puede depletar cobre." },
      "magnesio": { panels: ["electrolyte_panel", "kidney_panel"], intervalWeeks: 12, reason: "Monitoreo renal y electrolitos por suplementación de magnesio." },
      "magnesium": { panels: ["electrolyte_panel", "kidney_panel"], intervalWeeks: 12, reason: "Monitoreo renal y electrolitos por suplementación de magnesio." },
      "calcio": { panels: ["vitamin_mineral", "kidney_panel"], intervalWeeks: 12, reason: "Monitoreo de calcio sérico y función renal." },
      "calcium": { panels: ["vitamin_mineral", "kidney_panel"], intervalWeeks: 12, reason: "Monitoreo de calcio sérico y función renal." },
      "potasio": { panels: ["electrolyte_panel", "cardiac_markers"], intervalWeeks: 8, reason: "Monitoreo de potasio sérico y función cardíaca." },
      "potassium": { panels: ["electrolyte_panel", "cardiac_markers"], intervalWeeks: 8, reason: "Monitoreo de potasio sérico y función cardíaca." },
      "omega 3": { panels: ["lipid_panel"], intervalWeeks: 16, reason: "Monitoreo de perfil lipídico." },
      "omega-3": { panels: ["lipid_panel"], intervalWeeks: 16, reason: "Monitoreo de perfil lipídico." },
      "creatina": { panels: ["kidney_panel"], intervalWeeks: 16, reason: "Monitoreo de función renal por suplementación con creatina." },
      "creatine": { panels: ["kidney_panel"], intervalWeeks: 16, reason: "Monitoreo de función renal por suplementación con creatina." },
      "ashwagandha": { panels: ["liver_panel", "thyroid_panel"], intervalWeeks: 12, reason: "Monitoreo hepático y tiroideo por uso de ashwagandha." },
      "vitamina a": { panels: ["liver_panel"], intervalWeeks: 12, reason: "Riesgo de toxicidad hepática por vitamina A en dosis altas." },
      "vitamin a": { panels: ["liver_panel"], intervalWeeks: 12, reason: "Riesgo de toxicidad hepática por vitamina A en dosis altas." },
      "cafeína": { panels: ["cardiac_markers", "electrolyte_panel"], intervalWeeks: 12, reason: "Monitoreo cardíaco y electrolitos por uso de cafeína/estimulantes." },
      "caffeine": { panels: ["cardiac_markers", "electrolyte_panel"], intervalWeeks: 12, reason: "Monitoreo cardíaco y electrolitos por uso de cafeína/estimulantes." },
      "pre workout": { panels: ["cardiac_markers", "liver_panel", "kidney_panel"], intervalWeeks: 8, reason: "Monitoreo de seguridad por uso de pre-entreno." },
      "pre entreno": { panels: ["cardiac_markers", "liver_panel", "kidney_panel"], intervalWeeks: 8, reason: "Monitoreo de seguridad por uso de pre-entreno." },
    };
    for (const [key, value] of Object.entries(map)) {
      if (name.includes(key)) return value;
    }
    return null;
  }

  #checkPlanDurationPanels(studentId: string, student: Record<string, unknown>, now: string): number {
    let newRecs = 0;
    const nutritionPlan = student.nutritionPlan as Record<string, unknown> | undefined;
    const checkIns = (student.checkIns as Array<Record<string, unknown>>) ?? [];
    const goal = student.goal as string | undefined;
    if (checkIns.length >= 8 && nutritionPlan) {
      const existingRec = this.ctx.storage.sql
        .exec<{ count: number }>("SELECT COUNT(*) as count FROM blood_panel_recs WHERE student_id = ? AND category = 'metabolic_panel' AND status IN ('pending', 'scheduled')", studentId)
        .one();
      if (!existingRec || existingRec.count === 0) {
        const lastPanel = this.ctx.storage.sql
          .exec<{ count: number }>("SELECT COUNT(*) as count FROM blood_panels WHERE student_id = ? AND category = 'metabolic_panel'", studentId)
          .one();
        if (!lastPanel || lastPanel.count === 0) {
          const calories = nutritionPlan.calories as number | undefined;
          const reason = calories
            ? `Plan activo de ${calories} kcal durante ${checkIns.length}+ semanas. Se recomienda perfil metabólico basal.`
            : `Plan activo durante ${checkIns.length}+ semanas. Se recomienda perfil metabólico basal.`;
          const rec = {
            id: `bpr_${studentId}_metabolic_${Date.now()}`, studentId, category: "metabolic_panel", reason,
            urgency: (goal === "competition" ? "urgent" : "recommended") as const,
            suggestedDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
            basedOn: [`Plan activo ${checkIns.length} semanas`, goal ? `Objetivo: ${goal}` : ""].filter(Boolean),
            status: "pending" as const, createdAt: now, createdBy: "system" as const,
          };
          this.ctx.storage.sql.exec(
            "INSERT OR REPLACE INTO blood_panel_recs (id, student_id, category, data, urgency, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            rec.id, studentId, "metabolic_panel", JSON.stringify(rec), rec.urgency, rec.status, now,
          );
          newRecs++;
        }
      }
    }
    if (goal === "lose_fat" && checkIns.length >= 12) {
      const existingThyroid = this.ctx.storage.sql
        .exec<{ count: number }>("SELECT COUNT(*) as count FROM blood_panel_recs WHERE student_id = ? AND category = 'thyroid_panel' AND status IN ('pending', 'scheduled')", studentId)
        .one();
      if (!existingThyroid || existingThyroid.count === 0) {
        const rec = {
          id: `bpr_${studentId}_thyroid_${Date.now()}`, studentId, category: "thyroid_panel",
          reason: "Déficit calórico prolongado (>12 semanas). Monitoreo tiroideo para descartar supresión metabólica (TSH, T3, T4).",
          urgency: "urgent" as const,
          suggestedDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
          basedOn: ["Déficit >12 semanas", "Riesgo de supresión tiroidea"],
          status: "pending" as const, createdAt: now, createdBy: "system" as const,
        };
        this.ctx.storage.sql.exec(
          "INSERT OR REPLACE INTO blood_panel_recs (id, student_id, category, data, urgency, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
          rec.id, studentId, "thyroid_panel", JSON.stringify(rec), rec.urgency, rec.status, now,
        );
        newRecs++;
      }
    }
    return newRecs;
  }

  #checkMetabolicConcerns(studentId: string, student: Record<string, unknown>, now: string): number {
    let newAlerts = 0;
    const checkIns = (student.checkIns as Array<Record<string, unknown>>) ?? [];
    if (checkIns.length < 3) return 0;
    const name = student.name as string;
    const recent6 = checkIns.slice(-6);

    const energies = recent6.filter((c) => c.energyLevel != null).map((c) => c.energyLevel as number);
    if (energies.length >= 3 && energies.reduce((s, v) => s + v, 0) / energies.length < 4) {
      const existingAlert = this.ctx.storage.sql
        .exec<{ count: number }>("SELECT COUNT(*) as count FROM health_alerts WHERE student_id = ? AND alert_type = 'metabolic_concern' AND acknowledged = 0", studentId)
        .one();
      if (!existingAlert || existingAlert.count === 0) {
        const alert = {
          id: `ha_energy_${studentId}_${Date.now()}`, studentId, studentName: name,
          type: "metabolic_concern", severity: "warning" as const,
          title: "Energía persistentemente baja",
          description: `${name} ha reportado niveles de energía por debajo de 4/10 en los últimos check-ins. Posible indicador de déficit excesivo, deficiencia de micronutrientes o disrupción tiroidea.`,
          recommendation: "Se recomienda perfil tiroideo (TSH, T3, T4) y perfil metabólico completo para descartar causas fisiológicas.",
          relatedPanelCategory: "thyroid_panel", createdAt: now, acknowledged: false,
        };
        this.ctx.storage.sql.exec(
          "INSERT OR REPLACE INTO health_alerts (id, student_id, alert_type, data, severity, acknowledged, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)",
          alert.id, studentId, "metabolic_concern", JSON.stringify(alert), alert.severity, now,
        );
        newAlerts++;
      }
    }

    const sleeps = recent6.filter((c) => c.sleepHours != null).map((c) => c.sleepHours as number);
    if (sleeps.length >= 3 && sleeps.reduce((s, v) => s + v, 0) / sleeps.length < 6) {
      const existingAlert = this.ctx.storage.sql
        .exec<{ count: number }>("SELECT COUNT(*) as count FROM health_alerts WHERE student_id = ? AND alert_type = 'hormonal_imbalance' AND acknowledged = 0", studentId)
        .one();
      if (!existingAlert || existingAlert.count === 0) {
        const alert = {
          id: `ha_sleep_${studentId}_${Date.now()}`, studentId, studentName: name,
          type: "hormonal_imbalance", severity: "warning" as const,
          title: "Sueño persistentemente insuficiente",
          description: `${name} promedia menos de 6h de sueño. Esto puede elevar cortisol, reducir testosterona/GH y sabotear la recuperación y composición corporal.`,
          recommendation: "Se recomienda cortisol salival (4 puntos) y DHEA-S para evaluar eje adrenal. Implementar higiene del sueño inmediatamente.",
          relatedPanelCategory: "hormonal_panel", createdAt: now, acknowledged: false,
        };
        this.ctx.storage.sql.exec(
          "INSERT OR REPLACE INTO health_alerts (id, student_id, alert_type, data, severity, acknowledged, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)",
          alert.id, studentId, "hormonal_imbalance", JSON.stringify(alert), alert.severity, now,
        );
        newAlerts++;
      }
    }

    const digestives = recent6.filter((c) => c.digestiveHealth != null).map((c) => c.digestiveHealth as number);
    if (digestives.length >= 3 && digestives.reduce((s, v) => s + v, 0) / digestives.length < 4) {
      const existingAlert = this.ctx.storage.sql
        .exec<{ count: number }>("SELECT COUNT(*) as count FROM health_alerts WHERE student_id = ? AND alert_type = 'organ_stress' AND acknowledged = 0", studentId)
        .one();
      if (!existingAlert || existingAlert.count === 0) {
        const alert = {
          id: `ha_digest_${studentId}_${Date.now()}`, studentId, studentName: name,
          type: "organ_stress", severity: "warning" as const,
          title: "Salud digestiva deteriorada",
          description: `${name} reporta salud digestiva consistentemente baja. Posible disbiosis, intolerancia alimentaria o permeabilidad intestinal.`,
          recommendation: "Se recomienda análisis de microbiota intestinal (PCR), test de permeabilidad (zonulina en heces) y prueba de eliminación de lácteos/gluten por 14 días.",
          relatedPanelCategory: "inflammation_markers", createdAt: now, acknowledged: false,
        };
        this.ctx.storage.sql.exec(
          "INSERT OR REPLACE INTO health_alerts (id, student_id, alert_type, data, severity, acknowledged, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)",
          alert.id, studentId, "organ_stress", JSON.stringify(alert), alert.severity, now,
        );
        newAlerts++;
      }
    }
    return newAlerts;
  }

  #checkGoalPhasePanels(studentId: string, student: Record<string, unknown>, now: string): number {
    let newRecs = 0;
    const goal = student.goal as string | undefined;
    const checkIns = (student.checkIns as Array<Record<string, unknown>>) ?? [];
    if (goal === "competition" && checkIns.length >= 8) {
      const existingRec = this.ctx.storage.sql
        .exec<{ count: number }>("SELECT COUNT(*) as count FROM blood_panel_recs WHERE student_id = ? AND category = 'hormonal_panel' AND status IN ('pending', 'scheduled')", studentId)
        .one();
      if (!existingRec || existingRec.count === 0) {
        const rec = {
          id: `bpr_${studentId}_hormonal_${Date.now()}`, studentId, category: "hormonal_panel",
          reason: "Fase de competición: perfil hormonal completo recomendado para optimizar peak week y evaluar salud endocrina (testosterona total/libre, E2, SHBG, cortisol, DHEA-S).",
          urgency: "urgent" as const,
          suggestedDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
          basedOn: ["Fase competición", "Optimización peak week"],
          status: "pending" as const, createdAt: now, createdBy: "system" as const,
        };
        this.ctx.storage.sql.exec(
          "INSERT OR REPLACE INTO blood_panel_recs (id, student_id, category, data, urgency, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
          rec.id, studentId, "hormonal_panel", JSON.stringify(rec), rec.urgency, rec.status, now,
        );
        newRecs++;
      }
    }
    return newRecs;
  }

  #checkPeriodicCheckup(studentId: string, student: Record<string, unknown>, now: string): number {
    let newRecs = 0;
    const createdAt = student.createdAt as string | undefined;
    if (!createdAt) return 0;
    const weeksSinceCreation = (Date.now() - new Date(createdAt).getTime()) / (7 * 86400000);
    if (weeksSinceCreation >= 16 && weeksSinceCreation % 16 < 2) {
      const existingRec = this.ctx.storage.sql
        .exec<{ count: number }>("SELECT COUNT(*) as count FROM blood_panel_recs WHERE student_id = ? AND category = 'complete_blood_count' AND created_at > ?", studentId, new Date(Date.now() - 30 * 86400000).toISOString())
        .one();
      if (!existingRec || existingRec.count === 0) {
        const rec = {
          id: `bpr_${studentId}_periodic_${Date.now()}`, studentId, category: "complete_blood_count",
          reason: `Chequeo periódico de rutina (${Math.round(weeksSinceCreation)} semanas desde inicio). Hemograma completo + perfil metabólico para monitoreo preventivo.`,
          urgency: "routine" as const,
          suggestedDate: new Date(Date.now() + 21 * 86400000).toISOString().split("T")[0],
          basedOn: ["Chequeo periódico", `${Math.round(weeksSinceCreation)} semanas desde registro`],
          status: "pending" as const, createdAt: now, createdBy: "system" as const,
        };
        this.ctx.storage.sql.exec(
          "INSERT OR REPLACE INTO blood_panel_recs (id, student_id, category, data, urgency, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
          rec.id, studentId, "complete_blood_count", JSON.stringify(rec), rec.urgency, rec.status, now,
        );
        newRecs++;
      }
    }
    return newRecs;
  }

  #generateHealthNotifications(): void {
    const unacknowledged = this.ctx.storage.sql
      .exec<{ data: string }>("SELECT data FROM health_alerts WHERE acknowledged = 0 ORDER BY created_at DESC LIMIT 20")
      .toArray();
    for (const row of unacknowledged) {
      const alert = JSON.parse(row.data) as { id: string; studentId: string; studentName: string; type: string; severity: string; title: string; description: string; recommendation: string };
      const existingNotif = this.ctx.storage.sql
        .exec<{ count: number }>("SELECT COUNT(*) as count FROM notifications WHERE id = ?", `health_${alert.id}`)
        .one();
      if (existingNotif && existingNotif.count > 0) continue;
      const notif = {
        id: `health_${alert.id}`, category: "alert" as const,
        title: `\u{1FA78} ${alert.title}`,
        body: `${alert.studentName}: ${alert.description}`,
        priority: (alert.severity === "critical" ? "critical" : alert.severity === "warning" ? "high" : "medium") as "critical" | "high" | "medium" | "low",
        read: false, studentId: alert.studentId, studentName: alert.studentName,
        date: new Date().toISOString(), actionRoute: `/student/${alert.studentId}`,
      };
      this.ctx.storage.sql.exec(
        "INSERT OR REPLACE INTO notifications (id, student_id, data, is_read, date) VALUES (?, ?, ?, 0, ?)",
        notif.id, notif.studentId ?? null, JSON.stringify(notif), notif.date,
      );
    }
  }

  // -----------------------------------------------------------------------
  // Bulk migration (from local AsyncStorage)
  // -----------------------------------------------------------------------

  #bulkMigrate(body: { students: Record<string, unknown>[] }): Response {
    const now = nowISO();
    for (const s of body.students ?? []) {
      const id = s.id as string;
      const createdAt = (s.createdAt as string) ?? now.split("T")[0];
      this.ctx.storage.sql.exec(
        "INSERT OR REPLACE INTO students (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)",
        id,
        JSON.stringify(s),
        createdAt,
        now,
      );

      // Also persist check-ins, documents, etc. as separate records
      const checkIns = (s.checkIns as Record<string, unknown>[]) ?? [];
      for (const ci of checkIns) {
        this.ctx.storage.sql.exec(
          "INSERT OR REPLACE INTO check_ins (id, student_id, data, date, weight, body_fat) VALUES (?, ?, ?, ?, ?, ?)",
          ci.id as string,
          id,
          JSON.stringify(ci),
          (ci.date as string) ?? now,
          (ci.weight as number) ?? null,
          (ci.bodyFatPercentage as number) ?? null,
        );
      }

      const documents = (s.documents as Record<string, unknown>[]) ?? [];
      for (const d of documents) {
        this.ctx.storage.sql.exec(
          "INSERT OR REPLACE INTO documents (id, student_id, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
          d.id as string,
          id,
          JSON.stringify(d),
          (d.createdAt as string) ?? now,
          (d.updatedAt as string) ?? now,
        );
      }

      const folders = (s.folders as Record<string, unknown>[]) ?? [];
      for (const f of folders) {
        this.ctx.storage.sql.exec(
          "INSERT OR REPLACE INTO folders (id, student_id, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
          f.id as string,
          id,
          JSON.stringify(f),
          (f.createdAt as string) ?? now,
          (f.updatedAt as string) ?? now,
        );
      }

      const tp = s.trainingPlan as Record<string, unknown> | undefined;
      if (tp) {
        this.ctx.storage.sql.exec(
          "INSERT OR REPLACE INTO training_plans (id, student_id, data, created_at) VALUES (?, ?, ?, ?)",
          tp.id as string,
          id,
          JSON.stringify(tp),
          (tp.createdAt as string) ?? now,
        );
      }

      const dh = (s.dietHistory as Record<string, unknown>[]) ?? [];
      for (const e of dh) {
        this.ctx.storage.sql.exec(
          "INSERT OR REPLACE INTO diet_history (id, student_id, data, date) VALUES (?, ?, ?, ?)",
          e.id as string,
          id,
          JSON.stringify(e),
          (e.date as string) ?? now,
        );
      }
    }

    // Regenerate tasks and notifications from the migrated data
    this.#regenerateTasksAndNotifications();

    return json({ ok: true, count: body.students?.length ?? 0 });
  }

  // -----------------------------------------------------------------------
  // Server-side task & notification generation
  // -----------------------------------------------------------------------

  #getAllStudents(): Array<Record<string, unknown>> {
    return this.ctx.storage.sql
      .exec<{ data: string }>("SELECT data FROM students")
      .toArray()
      .map((r) => JSON.parse(r.data));
  }

  #regenerateTasksAndNotifications(): void {
    // Clear existing generated tasks/notifications
    this.ctx.storage.sql.exec("DELETE FROM tasks");
    this.ctx.storage.sql.exec("DELETE FROM notifications");

    const students = this.#getAllStudents();
    const now = Date.now();

    for (const s of students) {
      const sid = s.id as string;
      const name = s.name as string;
      const avatar = s.avatar as string | undefined;
      const checkIns = (s.checkIns as Array<{ date: string; weight?: number }>) ?? [];
      const goal = s.goal as string;
      const createdAt = s.createdAt as string;

      // --- Tasks ---
      if (checkIns.length === 0) {
        this.#insertTask({
          id: `task_pending_${sid}`,
          studentId: sid,
          studentName: name,
          studentAvatar: avatar,
          category: "checkin",
          title: "Check-in pendiente",
          description: `${name} no ha enviado ningún check-in aún.`,
          date: new Date().toISOString(),
          completed: false,
          priority: "medium",
        });
      } else {
        const last = checkIns[checkIns.length - 1];
        const daysSince = Math.floor((now - new Date(last.date).getTime()) / 86400000);

        if (daysSince >= 7 && daysSince < 14) {
          this.#insertTask({
            id: `task_overdue_${sid}_${last.date}`,
            studentId: sid,
            studentName: name,
            studentAvatar: avatar,
            category: "checkin",
            title: "Check-in atrasado",
            description: `${name} no ha enviado check-in en ${daysSince} días.`,
            date: new Date().toISOString(),
            completed: false,
            priority: "high",
          });
        } else if (daysSince >= 14) {
          this.#insertTask({
            id: `task_critical_${sid}_${last.date}`,
            studentId: sid,
            studentName: name,
            studentAvatar: avatar,
            category: "alert",
            title: "Atleta inactivo",
            description: `${name} lleva ${daysSince} días sin check-in.`,
            date: new Date().toISOString(),
            completed: false,
            priority: "critical",
          });
        }

        if (daysSince <= 3) {
          this.#insertTask({
            id: `task_review_${sid}_${last.date}`,
            studentId: sid,
            studentName: name,
            studentAvatar: avatar,
            category: "checkin",
            title: "Revisar check-in",
            description: `Nuevo check-in de ${name} pendiente de revisión.`,
            date: last.date,
            completed: false,
            priority: "medium",
          });
        }
      }

      if (checkIns.length >= 3) {
        const last3 = checkIns.slice(-3);
        const weights = last3.map((c) => c.weight ?? 0).filter(Boolean);
        if (weights.length === 3 && Math.abs(weights[2] - weights[0]) < 0.5) {
          this.#insertTask({
            id: `task_plateau_${sid}`,
            studentId: sid,
            studentName: name,
            studentAvatar: avatar,
            category: "plan_update",
            title: "Estancamiento detectado",
            description: `${name} lleva 3 semanas sin cambio de peso. Considerar ajuste de plan.`,
            date: new Date().toISOString(),
            completed: false,
            priority: "high",
          });
        }
      }

      // --- Notifications ---
      if (checkIns.length >= 1) {
        const recent = checkIns[checkIns.length - 1];
        const recentDays = Math.floor((now - new Date(recent.date).getTime()) / 86400000);
        if (recentDays <= 2) {
          this.#insertNotification({
            id: `notif_checkin_${sid}_${recent.date}`,
            category: "checkin",
            title: "Nuevo check-in recibido",
            body: `${name} ha enviado su check-in semanal.`,
            priority: "medium",
            read: false,
            studentId: sid,
            studentName: name,
            date: recent.date,
            actionRoute: `/student/${sid}`,
          });
        }
      }

      if (checkIns.length === 0) {
        const daysSinceCreated = Math.floor((now - new Date(createdAt).getTime()) / 86400000);
        if (daysSinceCreated > 7) {
          this.#insertNotification({
            id: `notif_noci_${sid}`,
            category: "alert",
            title: "Sin check-ins",
            body: `${name} no ha enviado ningún check-in desde que se registró.`,
            priority: "high",
            read: false,
            studentId: sid,
            studentName: name,
            date: new Date().toISOString(),
            actionRoute: `/student/${sid}`,
          });
        }
      } else {
        const last = checkIns[checkIns.length - 1];
        const daysSince = Math.floor((now - new Date(last.date).getTime()) / 86400000);
        if (daysSince > 7 && daysSince <= 10) {
          this.#insertNotification({
            id: `notif_missed_${sid}_${last.date}`,
            category: "checkin",
            title: "Check-in no enviado",
            body: `${name} no ha enviado su check-in semanal. (${daysSince} días)`,
            priority: "high",
            read: false,
            studentId: sid,
            studentName: name,
            date: new Date().toISOString(),
            actionRoute: `/student/${sid}`,
          });
        } else if (daysSince > 10) {
          this.#insertNotification({
            id: `notif_overdue_${sid}_${last.date}`,
            category: "alert",
            title: "Check-in muy atrasado",
            body: `${name} lleva ${daysSince} días sin enviar check-in.`,
            priority: "critical",
            read: false,
            studentId: sid,
            studentName: name,
            date: new Date().toISOString(),
            actionRoute: `/student/${sid}`,
          });
        }
      }

      if (checkIns.length >= 3) {
        const last3 = checkIns.slice(-3);
        const weights = last3.map((c) => c.weight ?? 0).filter(Boolean);
        if (weights.length === 3 && Math.abs(weights[2] - weights[0]) < 0.5) {
          this.#insertNotification({
            id: `notif_plateau_${sid}`,
            category: "alert",
            title: "Estancamiento detectado",
            body: `${name}: peso sin cambios en 3 semanas. Considerar ajuste.`,
            priority: "high",
            read: false,
            studentId: sid,
            studentName: name,
            date: new Date().toISOString(),
            actionRoute: `/student/${sid}`,
          });
        }

        const lastW = weights[weights.length - 1];
        const prevW = weights[weights.length - 2];
        if (prevW && lastW && Math.abs(lastW - prevW) > 2) {
          const direction = lastW < prevW ? "pérdida" : "ganancia";
          this.#insertNotification({
            id: `notif_rapid_${sid}_${last3[last3.length - 1].date}`,
            category: "alert",
            title: "Cambio rápido de peso",
            body: `${name}: ${direction} de ${Math.abs(lastW - prevW).toFixed(1)} kg en una semana.`,
            priority: "high",
            read: false,
            studentId: sid,
            studentName: name,
            date: new Date().toISOString(),
            actionRoute: `/student/${sid}`,
          });
        }
      }

      if (goal === "competition") {
        this.#insertNotification({
          id: `notif_comp_${sid}`,
          category: "system",
          title: "Atleta en preparación",
          body: `${name} está en fase de competición. Monitoreo especial requerido.`,
          priority: "medium",
          read: false,
          studentId: sid,
          studentName: name,
          date: new Date().toISOString(),
          actionRoute: `/student/${sid}`,
        });
      }

      // Health: blood panel recommendations as tasks
      const pendingRecs = this.ctx.storage.sql
        .exec<{ data: string }>("SELECT data FROM blood_panel_recs WHERE student_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 5", sid)
        .toArray();
      for (const row of pendingRecs) {
        const rec = JSON.parse(row.data) as { id: string; category: string; reason: string; urgency: string };
        const labels: Record<string, string> = { routine: "Rutina", recommended: "Recomendado", urgent: "Urgente" };
        this.#insertTask({
          id: `task_blood_${rec.id}`,
          studentId: sid,
          studentName: name,
          studentAvatar: avatar,
          category: "plan_update",
          title: `[${labels[rec.urgency] ?? rec.urgency}] Panel: ${rec.category}`,
          description: rec.reason,
          date: new Date().toISOString(),
          completed: false,
          priority: rec.urgency === "urgent" ? "critical" : rec.urgency === "recommended" ? "high" : "medium",
        });
      }
    }
  }

  #insertTask(task: CoachTask): void {
    this.ctx.storage.sql.exec(
      "INSERT OR REPLACE INTO tasks (id, student_id, data, completed, date) VALUES (?, ?, ?, ?, ?)",
      task.id,
      task.studentId,
      JSON.stringify(task),
      task.completed ? 1 : 0,
      task.date,
    );
  }

  #insertNotification(notif: CoachNotification): void {
    this.ctx.storage.sql.exec(
      "INSERT OR REPLACE INTO notifications (id, student_id, data, is_read, date) VALUES (?, ?, ?, ?, ?)",
      notif.id,
      notif.studentId ?? null,
      JSON.stringify(notif),
      notif.read ? 1 : 0,
      notif.date,
    );
  }

  // -----------------------------------------------------------------------
  // Conversation Transcripts — Voice & Chat Memory
  // -----------------------------------------------------------------------

  #listConversationTranscripts(): Response {
    const rows = this.ctx.storage.sql
      .exec<{ data: string }>(
        "SELECT data FROM conversation_transcripts ORDER BY date DESC LIMIT 200",
      )
      .toArray();
    return json(rows.map((r) => JSON.parse(r.data)));
  }

  #listStudentConversationTranscripts(studentId: string): Response {
    const rows = this.ctx.storage.sql
      .exec<{ data: string }>(
        "SELECT data FROM conversation_transcripts WHERE student_id = ? ORDER BY date DESC LIMIT 100",
        studentId,
      )
      .toArray();
    return json(rows.map((r) => JSON.parse(r.data)));
  }

  #saveConversationTranscript(body: Record<string, unknown>): Response {
    const id = (body.id as string) ?? `conv_${Date.now()}`;
    const transcript = {
      id,
      studentId: body.studentId ?? null,
      role: body.role ?? "coach",
      text: body.text ?? "",
      detectedAthletes: body.detectedAthletes ?? null,
      metadata: body.metadata ?? {},
      date: (body.date as string) ?? nowISO(),
    };

    this.ctx.storage.sql.exec(
      "INSERT OR REPLACE INTO conversation_transcripts (id, student_id, role, text, detected_athletes, metadata, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
      transcript.id as string,
      transcript.studentId as string | null,
      transcript.role as string,
      transcript.text as string,
      transcript.detectedAthletes ? JSON.stringify(transcript.detectedAthletes) : null,
      JSON.stringify(transcript.metadata),
      transcript.date as string,
    );

    // If student IDs detected, auto-save to athlete memory
    if (Array.isArray(body.detectedAthletes) && body.detectedAthletes.length > 0) {
      for (const sid of body.detectedAthletes as string[]) {
        this.#recordMemoryEvent(sid, {
          id: `mem_conv_${Date.now()}_${sid}`,
          type: transcript.role === "coach" ? "coach_note" : "ai_suggestion",
          title: transcript.role === "coach"
            ? "Conversación de voz — coach"
            : "Respuesta de Sol (voz)",
          description: (transcript.text as string).substring(0, 500),
          createdBy: "ai",
          metadata: { source: "voice_conversation", transcriptId: id },
        });
      }
    }

    return json(transcript, 201);
  }
}
