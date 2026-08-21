#!/usr/bin/env node
// functions/scripts/generate-credentials.mjs
//
// Generates the two secrets the backend needs:
//   AUTH_SECRET     — HMAC key used to sign session tokens
//   COACH_ACCOUNTS  — JSON array of coach accounts with PBKDF2 password hashes
//
// Usage:
//   node functions/scripts/generate-credentials.mjs <email> <password> [coachId]
//
// Nothing is written to disk. Copy the output straight into
// `wrangler secret put`. Plaintext passwords never leave your terminal.

import { webcrypto as crypto } from 'node:crypto';

const PBKDF2_ITERATIONS = 210_000;
const encoder = new TextEncoder();

function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return Buffer.from(binary, 'binary').toString('base64');
}

async function pbkdf2(password, salt, iterations) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, keyMaterial, 256,
  );
  return bytesToBase64(new Uint8Array(bits));
}

const [email, password, coachId] = process.argv.slice(2);

if (!email || !password) {
  console.error('Uso: node functions/scripts/generate-credentials.mjs <email> <password> [coachId]');
  process.exit(1);
}

if (password.length < 12) {
  console.error('La contraseña debe tener al menos 12 caracteres.');
  process.exit(1);
}

const salt = crypto.getRandomValues(new Uint8Array(16));
const passwordHash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);

const account = {
  id: coachId ?? crypto.randomUUID(),
  email: email.trim().toLowerCase(),
  passwordHash,
  salt: bytesToBase64(salt),
  iterations: PBKDF2_ITERATIONS,
};

const authSecret = bytesToBase64(crypto.getRandomValues(new Uint8Array(32)));

console.log(`
=== AUTH_SECRET (guárdalo, no lo compartas) ===
${authSecret}

=== COACH_ACCOUNTS ===
${JSON.stringify([account])}

--- Cómo aplicarlo ---
  wrangler secret put AUTH_SECRET
  wrangler secret put COACH_ACCOUNTS
  wrangler secret put ALLOWED_ORIGINS   # p.ej. https://herlinm4-prog.github.io

IMPORTANTE:
  · El coachId "${account.id}" es la clave del Durable Object. Si lo cambias,
    los datos existentes quedan en el namespace anterior.
  · Para añadir un segundo coach, ejecuta el script de nuevo y añade el objeto
    resultante al mismo array de COACH_ACCOUNTS.
  · Cambiar AUTH_SECRET invalida todas las sesiones activas (útil si sospechas
    que se filtró un token).
`);
