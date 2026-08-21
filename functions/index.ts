// functions/index.ts
// Worker entrypoint for HGRAND OS backend.
//
// Every /api/* request is routed to the CoachData Durable Object, keyed by the
// coach id carried in a signed token. The id is NEVER taken from a raw request
// header — see functions/auth.ts for why that mattered.

import {
  createToken,
  verifyToken,
  verifyPassword,
  parseAccounts,
  findAccount,
  DUMMY_ACCOUNT,
} from "./auth";

export { CoachData } from "./coach-data";

type Env = {
  DO: Fetcher;
  /** HMAC secret used to sign session tokens. Set via `wrangler secret put`. */
  AUTH_SECRET?: string;
  /** JSON array of coach accounts. Set via `wrangler secret put`. */
  COACH_ACCOUNTS?: string;
  /** Comma-separated list of allowed web origins. */
  ALLOWED_ORIGINS?: string;
  /**
   * ElevenLabs / Rork toolkit key. Server-side ONLY — this previously shipped
   * to the client as EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY, which meant anyone
   * could extract it from the app bundle and burn the quota.
   */
  TOOLKIT_SECRET_KEY?: string;
  /** Toolkit base URL. Defaults to the public Rork endpoint. */
  TOOLKIT_URL?: string;
};

/** Hard cap on a single TTS request, in characters. */
const MAX_TTS_CHARS = 5000;
/** Per-coach TTS budget, to bound the damage from a leaked session token. */
const TTS_WINDOW_MS = 60 * 1000;
const TTS_MAX_PER_WINDOW = 60;

/** Reject request bodies above this size before they reach the DO. */
const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2 MB

// ---------------------------------------------------------------------------
// CORS — allowlist instead of the previous wildcard
// ---------------------------------------------------------------------------

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get("Origin");
  const allowed = (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  // Native app requests carry no Origin header and are unaffected by CORS.
  // Browsers do — and `*` previously let any website on the internet call
  // this API on behalf of a visitor.
  if (origin && allowed.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
}

function secureJson(body: unknown, status: number, request: Request, env: Env): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request, env),
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Cache-Control": "no-store",
    },
  });
}

// ---------------------------------------------------------------------------
// Login throttling — in-memory, per isolate. Not a distributed limiter, but
// enough to make online password guessing impractical.
// ---------------------------------------------------------------------------

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;

const ttsUsage = new Map<string, { count: number; resetAt: number }>();

function ttsRateLimited(coachId: string): boolean {
  const now = Date.now();
  const entry = ttsUsage.get(coachId);
  if (!entry || now > entry.resetAt) {
    ttsUsage.set(coachId, { count: 1, resetAt: now + TTS_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > TTS_MAX_PER_WINDOW;
}

function loginRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > LOGIN_MAX_ATTEMPTS;
}

// ---------------------------------------------------------------------------

async function authenticate(request: Request, env: Env): Promise<string | null> {
  if (!env.AUTH_SECRET) return null;
  const header = request.headers.get("Authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;
  const payload = await verifyToken(header.slice(7).trim(), env.AUTH_SECRET);
  return payload?.sub ?? null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    // Health check — deliberately reveals nothing about configuration.
    if (url.pathname === "/ping") {
      return secureJson({ ok: true, service: "hgrand-backend" }, 200, request, env);
    }

    // ---- Login -----------------------------------------------------------
    if (url.pathname === "/api/auth/login" && method === "POST") {
      if (!env.AUTH_SECRET || !env.COACH_ACCOUNTS) {
        console.error("[auth] AUTH_SECRET or COACH_ACCOUNTS is not configured");
        return secureJson({ error: "auth not configured" }, 503, request, env);
      }

      const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
      if (loginRateLimited(ip)) {
        return secureJson({ error: "too many attempts, try again later" }, 429, request, env);
      }

      let body: { email?: unknown; password?: unknown };
      try {
        body = (await request.json()) as typeof body;
      } catch {
        return secureJson({ error: "invalid body" }, 400, request, env);
      }

      const email = typeof body.email === "string" ? body.email : "";
      const password = typeof body.password === "string" ? body.password : "";
      if (!email || !password) {
        return secureJson({ error: "email and password required" }, 400, request, env);
      }

      const accounts = parseAccounts(env.COACH_ACCOUNTS);
      const account = findAccount(accounts, email);
      // Always run the hash, even for unknown emails, so response timing
      // doesn't disclose which addresses are registered.
      const ok = await verifyPassword(password, account ?? DUMMY_ACCOUNT);

      if (!account || !ok) {
        // Deliberately identical message for both failure modes.
        return secureJson({ error: "credenciales incorrectas" }, 401, request, env);
      }

      const { token, expiresAt } = await createToken(account, env.AUTH_SECRET);
      return secureJson(
        { token, expiresAt, coach: { id: account.id, email: account.email } },
        200,
        request,
        env,
      );
    }

    // ---- Everything else under /api/ requires a valid token --------------
    if (url.pathname.startsWith("/api/")) {
      if (!env.AUTH_SECRET) {
        console.error("[auth] AUTH_SECRET is not configured — refusing all API traffic");
        return secureJson({ error: "auth not configured" }, 503, request, env);
      }

      const coachId = await authenticate(request, env);
      if (!coachId) {
        return secureJson({ error: "unauthorized" }, 401, request, env);
      }

      // WebSocket upgrade for real-time voice sessions (now authenticated).
      if (request.headers.get("Upgrade") === "websocket" && url.pathname === "/api/voice-session") {
        const wrapped = new Request(request.url, request);
        wrapped.headers.set("X-Rork-DO-Class", "CoachData");
        wrapped.headers.set("X-Rork-DO-Id", coachId);
        wrapped.headers.delete("X-Rork-User-Id");
        return env.DO.fetch(wrapped);
      }

      // ---- Text-to-speech proxy ---------------------------------------
      // The client no longer holds the toolkit key; it asks us, and we call
      // upstream on its behalf using a secret that never leaves the worker.
      if (url.pathname === "/api/tts" && method === "POST") {
        if (!env.TOOLKIT_SECRET_KEY) {
          console.error("[tts] TOOLKIT_SECRET_KEY is not configured");
          return secureJson({ error: "tts not configured" }, 503, request, env);
        }
        if (ttsRateLimited(coachId)) {
          return secureJson({ error: "tts rate limit exceeded" }, 429, request, env);
        }

        let body: { text?: unknown; voiceId?: unknown; voiceSettings?: unknown };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return secureJson({ error: "invalid body" }, 400, request, env);
        }

        const text = typeof body.text === "string" ? body.text : "";
        const voiceId = typeof body.voiceId === "string" ? body.voiceId : "";

        if (!text.trim()) {
          return secureJson({ error: "text required" }, 400, request, env);
        }
        if (text.length > MAX_TTS_CHARS) {
          return secureJson({ error: "text too long" }, 413, request, env);
        }
        // Constrain the voice id to the shape ElevenLabs uses, so this can't be
        // steered into an arbitrary upstream path.
        if (!/^[A-Za-z0-9]{16,40}$/.test(voiceId)) {
          return secureJson({ error: "invalid voiceId" }, 400, request, env);
        }

        // Only forward the specific tuning knobs we expect, as numbers.
        const raw = (body.voiceSettings ?? {}) as Record<string, unknown>;
        const num = (v: unknown, min: number, max: number, dflt: number): number => {
          const n = typeof v === "number" ? v : Number(v);
          if (!Number.isFinite(n)) return dflt;
          return Math.min(max, Math.max(min, n));
        };
        const voiceSettings = {
          stability: num(raw.stability, 0, 1, 0.5),
          similarity_boost: num(raw.similarity_boost, 0, 1, 0.75),
          style: num(raw.style, 0, 1, 0),
          use_speaker_boost: true,
        };

        const base = env.TOOLKIT_URL ?? "https://toolkit.rork.com";
        const upstream = await fetch(
          `${base}/v2/elevenlabs/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.TOOLKIT_SECRET_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text, model_id: "eleven_flash_v2_5", voice_settings: voiceSettings }),
          },
        );

        if (!upstream.ok) {
          // Log upstream detail, return a generic status — the upstream body
          // can echo account and key information.
          const detail = await upstream.text().catch(() => "");
          console.error("[tts] upstream error", upstream.status, detail.slice(0, 200));
          return secureJson({ error: "tts upstream error" }, 502, request, env);
        }

        return new Response(upstream.body, {
          status: 200,
          headers: {
            ...corsHeaders(request, env),
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
          },
        });
      }

      // Cap body size before handing anything to the DO.
      const declared = Number(request.headers.get("Content-Length") ?? "0");
      if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
        return secureJson({ error: "payload too large" }, 413, request, env);
      }

      const wrapped = new Request(request.url, request);
      wrapped.headers.set("X-Rork-DO-Class", "CoachData");
      wrapped.headers.set("X-Rork-DO-Id", coachId);
      // Strip any client-supplied identity header so it can never influence
      // routing downstream.
      wrapped.headers.delete("X-Rork-User-Id");

      const response = await env.DO.fetch(wrapped);
      const body = await response.text();

      return new Response(body, {
        status: response.status,
        headers: {
          ...corsHeaders(request, env),
          "Content-Type": response.headers.get("Content-Type") ?? "application/json",
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "no-referrer",
          "Cache-Control": "no-store",
        },
      });
    }

    return secureJson({ error: "not found" }, 404, request, env);
  },
} satisfies ExportedHandler<Env>;
