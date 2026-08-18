// functions/index.ts
// Worker entrypoint for HGRAND OS backend.
// Routes app APIs to the CoachData Durable Object and keeps provider secrets
// server-side for realtime voice.

export { CoachData } from "./coach-data";

type Env = {
  DO: Fetcher;
  OPENAI_API_KEY?: string;
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Rork-User-Id",
};

async function withCors(response: Response): Promise<Response> {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS)) headers.set(key, value);
  return new Response(await response.arrayBuffer(), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function coachIdFrom(request: Request): string {
  return request.headers.get("X-Rork-User-Id") ?? "demo-coach";
}

function toDurableObjectRequest(
  original: Request,
  url: URL,
  coachId: string,
  init?: RequestInit,
): Request {
  const wrapped = new Request(url.toString(), init ?? original);
  wrapped.headers.set("X-Rork-DO-Class", "CoachData");
  wrapped.headers.set("X-Rork-DO-Id", coachId);
  return wrapped;
}

async function forwardToCoachData(
  request: Request,
  env: Env,
  targetUrl?: URL,
  init?: RequestInit,
): Promise<Response> {
  const url = targetUrl ?? new URL(request.url);
  const wrapped = toDurableObjectRequest(request, url, coachIdFrom(request), init);
  return env.DO.fetch(wrapped);
}

async function handleNutritionPlanRoute(
  request: Request,
  env: Env,
  studentId: string,
): Promise<Response> {
  const method = request.method;
  const studentUrl = new URL(request.url);
  studentUrl.pathname = `/api/students/${studentId}`;
  studentUrl.search = "";

  if (method === "GET") {
    const response = await forwardToCoachData(request, env, studentUrl, {
      method: "GET",
      headers: request.headers,
    });
    if (!response.ok) return response;
    const student = await response.json() as Record<string, unknown>;
    return Response.json(student.nutritionPlan ?? null);
  }

  if (method === "PUT") {
    const nutritionPlan = await request.json();
    const response = await forwardToCoachData(request, env, studentUrl, {
      method: "PUT",
      headers: request.headers,
      body: JSON.stringify({ nutritionPlan }),
    });
    if (!response.ok) return response;
    // Keep the API contract expected by expo/utils/api.ts: a NutritionPlan,
    // not the full Student returned internally by CoachData.#updateStudent.
    return Response.json(nutritionPlan);
  }

  if (method === "DELETE") {
    const response = await forwardToCoachData(request, env, studentUrl, {
      method: "PUT",
      headers: request.headers,
      body: JSON.stringify({ nutritionPlan: null }),
    });
    if (!response.ok) return response;
    return Response.json({ ok: true });
  }

  return Response.json({ error: "method not allowed" }, { status: 405 });
}

/**
 * Server-side WebRTC SDP bridge for OpenAI Realtime. The long-lived API key
 * never reaches the mobile client. This endpoint is intentionally not wired to
 * the UI yet: the React Native app still needs a WebRTC transport plus Sol's
 * tool/memory sideband before realtime can replace the current fallback safely.
 */
async function handleRealtimeCall(request: Request, env: Env): Promise<Response> {
  if (!env.OPENAI_API_KEY) {
    return Response.json(
      { error: "OPENAI_API_KEY is not configured on the Functions service" },
      { status: 503 },
    );
  }

  const body = await request.json() as {
    sdp?: string;
    instructions?: string;
    voice?: string;
  };

  if (!body.sdp?.trim()) {
    return Response.json({ error: "sdp is required" }, { status: 400 });
  }

  const session = {
    type: "realtime",
    model: "gpt-realtime",
    output_modalities: ["audio"],
    instructions: body.instructions ||
      "Eres Sol, el asistente de voz profesional de HGRAND OS. Habla en español natural, directo y conciso. No inventes datos de atletas.",
    audio: {
      input: {
        transcription: {
          model: "gpt-4o-mini-transcribe",
          language: "es",
        },
        turn_detection: {
          type: "semantic_vad",
          eagerness: "auto",
          create_response: true,
          interrupt_response: true,
        },
      },
      output: {
        voice: body.voice || "marin",
        speed: 1,
      },
    },
  };

  const form = new FormData();
  form.append("sdp", new Blob([body.sdp], { type: "application/sdp" }), "offer.sdp");
  form.append("session", new Blob([JSON.stringify(session)], { type: "application/json" }), "session.json");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: form,
      signal: controller.signal,
    });

    const answer = await response.text();
    return new Response(answer, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "application/sdp",
        ...(response.headers.get("Location")
          ? { "X-HGRAND-Realtime-Call": response.headers.get("Location")! }
          : {}),
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return Response.json({ error: "OpenAI Realtime connection timed out" }, { status: 504 });
    }
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (url.pathname === "/ping") {
      return Response.json(
        { ok: true, now: new Date().toISOString(), service: "hgrand-backend" },
        { headers: CORS },
      );
    }

    if (url.pathname === "/api/realtime/call" && method === "POST") {
      return withCors(await handleRealtimeCall(request, env));
    }

    const nutritionMatch = url.pathname.match(/^\/api\/students\/([^/]+)\/nutrition-plan$/);
    if (nutritionMatch) {
      return withCors(await handleNutritionPlanRoute(request, env, nutritionMatch[1]));
    }

    const upgrade = request.headers.get("Upgrade");
    if (upgrade === "websocket" && url.pathname === "/api/voice-session") {
      return forwardToCoachData(request, env);
    }

    if (url.pathname.startsWith("/api/")) {
      return withCors(await forwardToCoachData(request, env));
    }

    return Response.json({ error: "not found" }, { status: 404, headers: CORS });
  },
} satisfies ExportedHandler<Env>;
