// functions/auth.ts
// HGRAND OS — authentication boundary.
//
// Before this module the backend trusted a plain `X-Rork-User-Id` request
// header to decide WHOSE data to serve, and fell back to "demo-coach" when it
// was absent. That meant anyone who knew the worker URL could read or delete
// any coach's athlete records — including blood panels, medications and
// emergency contacts — just by setting a header.
//
// Coach identity now comes exclusively from an HMAC-SHA256 signed token that
// only this worker can mint. Everything is built on WebCrypto (available in
// the Workers runtime); there are no third-party dependencies.

const encoder = new TextEncoder();

export interface CoachAccount {
  id: string;
  email: string;
  /** PBKDF2-SHA256 hash, base64. */
  passwordHash: string;
  /** Per-account salt, base64. */
  salt: string;
  /** Optional override; defaults to PBKDF2_ITERATIONS. */
  iterations?: number;
}

export interface TokenPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

const PBKDF2_ITERATIONS = 210_000; // OWASP 2023 guidance for PBKDF2-SHA256
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

// ---------------------------------------------------------------------------
// base64url helpers
// ---------------------------------------------------------------------------

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function toBase64Url(input: string): string {
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Length-invariant comparison. A naive `===` on signatures leaks how many
 * leading bytes matched via timing, which is enough to forge a token byte by
 * byte given enough attempts.
 */
function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  // Always compare the same number of bytes so length alone reveals nothing.
  const len = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < len; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Password hashing
// ---------------------------------------------------------------------------

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    keyMaterial,
    256,
  );
  return bytesToBase64(new Uint8Array(bits));
}

/** Generate a fresh salt + hash. Used by the credential-generation script. */
export async function hashPassword(password: string): Promise<{ passwordHash: string; salt: string; iterations: number }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordHash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return { passwordHash, salt: bytesToBase64(salt), iterations: PBKDF2_ITERATIONS };
}

export async function verifyPassword(password: string, account: CoachAccount): Promise<boolean> {
  try {
    const salt = base64ToBytes(account.salt);
    const iterations = account.iterations ?? PBKDF2_ITERATIONS;
    const candidate = await pbkdf2(password, salt, iterations);
    return timingSafeEqual(candidate, account.passwordHash);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Token signing / verification (HS256)
// ---------------------------------------------------------------------------

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function sign(data: string, secret: string): Promise<string> {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return bytesToBase64Url(new Uint8Array(sig));
}

export async function createToken(
  account: Pick<CoachAccount, "id" | "email">,
  secret: string,
): Promise<{ token: string; expiresAt: number }> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + TOKEN_TTL_SECONDS;
  const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = toBase64Url(
    JSON.stringify({ sub: account.id, email: account.email, iat: now, exp } satisfies TokenPayload),
  );
  const signature = await sign(`${header}.${payload}`, secret);
  return { token: `${header}.${payload}.${signature}`, expiresAt: exp };
}

export async function verifyToken(token: string, secret: string): Promise<TokenPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;

    // Reject anything that isn't the algorithm we issue. Accepting the token's
    // own `alg` field is how "alg: none" forgery works.
    const parsedHeader = JSON.parse(fromBase64Url(header)) as { alg?: string };
    if (parsedHeader.alg !== "HS256") return null;

    const expected = await sign(`${header}.${payload}`, secret);
    if (!timingSafeEqual(signature, expected)) return null;

    const parsed = JSON.parse(fromBase64Url(payload)) as TokenPayload;
    if (!parsed.sub || typeof parsed.exp !== "number") return null;
    if (Math.floor(Date.now() / 1000) >= parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Account lookup
// ---------------------------------------------------------------------------

export function parseAccounts(raw: string | undefined): CoachAccount[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (a): a is CoachAccount =>
        a && typeof a.id === "string" && typeof a.email === "string" &&
        typeof a.passwordHash === "string" && typeof a.salt === "string",
    );
  } catch {
    return [];
  }
}

export function findAccount(accounts: CoachAccount[], email: string): CoachAccount | undefined {
  const target = email.trim().toLowerCase();
  return accounts.find((a) => a.email.trim().toLowerCase() === target);
}

/**
 * A dummy hash to verify against when the email doesn't exist, so that a
 * failed lookup costs the same wall-clock time as a wrong password. Without
 * it, response timing reveals which emails are registered.
 */
export const DUMMY_ACCOUNT: CoachAccount = {
  id: "__none__",
  email: "__none__",
  passwordHash: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  salt: "AAAAAAAAAAAAAAAAAAAAAA==",
};
