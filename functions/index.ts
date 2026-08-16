// functions/index.ts
// Worker entrypoint for HGRAND OS backend.
// Routes all /api/* requests to the CoachData Durable Object,
// keyed by the authenticated coach's user ID.

export { CoachData } from "./coach-data";

type Env = {
  DO: Fetcher;
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // Handle CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    // Health check (no auth needed)
    if (url.pathname === "/ping") {
      return Response.json(
        { ok: true, now: new Date().toISOString(), service: "hgrand-backend" },
        { headers: CORS },
      );
    }

    // WebSocket upgrade for real-time voice sessions
    const upgrade = request.headers.get("Upgrade");
    if (upgrade === "websocket" && url.pathname === "/api/voice-session") {
      const coachId = request.headers.get("X-Rork-User-Id") ?? "demo-coach";
      const wrapped = new Request(request.url, request);
      wrapped.headers.set("X-Rork-DO-Class", "CoachData");
      wrapped.headers.set("X-Rork-DO-Id", coachId);
      return env.DO.fetch(wrapped);
    }

    // All API routes go through the CoachData DO
    if (url.pathname.startsWith("/api/")) {
      const coachId = request.headers.get("X-Rork-User-Id") ?? "demo-coach";

      // Wrap with 2-arg form to preserve headers
      const wrapped = new Request(request.url, request);
      wrapped.headers.set("X-Rork-DO-Class", "CoachData");
      wrapped.headers.set("X-Rork-DO-Id", coachId);

      const response = await env.DO.fetch(wrapped);

      // Add CORS headers to DO responses
      const body = await response.text();
      return new Response(body, {
        status: response.status,
        headers: {
          ...CORS,
          "Content-Type": response.headers.get("Content-Type") ?? "application/json",
        },
      });
    }

    return Response.json({ error: "not found" }, { status: 404, headers: CORS });
  },
} satisfies ExportedHandler<Env>;
