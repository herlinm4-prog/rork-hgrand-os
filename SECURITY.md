# Seguridad — HGRAND OS

Estado tras la auditoría del 20/08/2026.

## ⚠️ Pasos obligatorios antes del próximo despliegue

El backend ahora **rechaza todo el tráfico `/api/*` con 503** hasta que existan
estos secretos. Esto es intencional: es preferible que la app no funcione a que
sirva historiales médicos sin autenticación.

```bash
# 1. Genera credenciales (no se escribe nada a disco)
node functions/scripts/generate-credentials.mjs tu@email.com "TuContraseñaLarga" 

# 2. Súbelas a Cloudflare
wrangler secret put AUTH_SECRET
wrangler secret put COACH_ACCOUNTS
wrangler secret put ALLOWED_ORIGINS   # https://herlinm4-prog.github.io
wrangler secret put TOOLKIT_SECRET_KEY  # clave de ElevenLabs/Rork ROTADA
```

**Importante sobre `coachId`:** es la clave del Durable Object. Los datos
actuales viven bajo `demo-coach`. Si quieres conservarlos, pasa `demo-coach`
como tercer argumento del script; si prefieres empezar limpio, usa el UUID
generado.

## Qué se corrigió

| # | Severidad | Problema | Estado |
|---|-----------|----------|--------|
| 1 | Crítica | Sin control de acceso: `X-Rork-User-Id` era una cabecera del cliente, sin verificar, con fallback a `demo-coach` | Corregido |
| 2 | Crítica | `login()` aceptaba cualquier email/contraseña y devolvía `true` sin contactar servidor | Corregido |
| 3 | Alta | `Access-Control-Allow-Origin: *` permitía a cualquier web llamar a la API | Corregido |
| 4 | Alta | XSS almacenado en el visor de documentos (WebView con JS y HTML sin sanear; `title` sin escapar) | Corregido |
| 5 | Media | Datos de alumnos inyectados sin escapar en las plantillas PDF | Corregido |
| 6 | Media | Errores del servidor devolvían el mensaje SQL crudo al cliente | Corregido |
| 7 | Media | Logs exponían el prefijo de la clave TTS y el email en login | Corregido |
| 8 | Alta | Clave de ElevenLabs embebida en el bundle del cliente vía `EXPO_PUBLIC_` | Corregido |

### 1. Control de acceso (`functions/auth.ts`, `functions/index.ts`)

La identidad del coach ahora sale exclusivamente de un token HMAC-SHA256 que
solo este worker puede firmar. Contraseñas con PBKDF2-SHA256, 210.000
iteraciones (guía OWASP 2023), salt por cuenta.

Defensas verificadas con tests: firma manipulada, payload alterado para
suplantar a otro coach, ataque `alg: none`, token expirado, y comparación de
firmas en tiempo constante. También hay throttling de login (10 intentos por IP
cada 15 min) y respuesta idéntica para email inexistente vs. contraseña
incorrecta, para no filtrar qué cuentas existen.

### 4. XSS en documentos (`utils/sanitize.ts`, `app/document-viewer.tsx`)

El contenido de los documentos lo genera la IA o se importa de ficheros: es
input no confiable que se renderizaba en un WebView **con JavaScript activado**.
Defensa en tres capas:

1. `sanitizeDocumentHtml()` elimina `<script>`, `<iframe>`, handlers `on*`,
   `javascript:`, `expression()` y demás.
2. CSP `default-src 'none'` en el HTML generado.
3. WebView con `javaScriptEnabled={false}`, sin acceso a ficheros y con
   navegación bloqueada. Los `<iframe>` de web van con `sandbox=""`.

La capa 1 es un denylist por regex, más débil que un parser real. Va acompañada
de las capas 2 y 3 precisamente por eso. **Si algún día los documentos se
comparten entre usuarios, cambia esto por DOMPurify.**

### 8. Clave TTS expuesta en el bundle (`/api/tts`)

`EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY` se compilaba dentro del JavaScript de la
app: cualquiera podía extraerla y gastar la cuota de ElevenLabs / Rork.

Resuelto con un proxy autenticado. El cliente ya no conoce la clave; pide el
audio a `/api/tts` con su token de sesión y el worker llama a ElevenLabs con un
secreto que nunca sale del servidor. La respuesta se transmite en streaming, así
que la latencia del primer chunk no cambia.

Defensas del endpoint:
- Exige token de sesión válido (misma barrera que el resto de `/api/*`).
- `voiceId` restringido por regex — impide desviar la llamada a otra ruta de la
  API upstream.
- Texto limitado a 5.000 caracteres.
- Solo se reenvían `stability`, `similarity_boost` y `style`, recortados al
  rango 0–1; cualquier otro campo del cuerpo se descarta.
- 60 peticiones por minuto y por coach, para acotar el daño si se filtra un
  token.
- Los errores del upstream se registran pero no se devuelven al cliente.

**Rota la clave anterior.** Estuvo publicada en cada build, así que hay que
asumirla comprometida:

```bash
wrangler secret put TOOLKIT_SECRET_KEY   # la clave NUEVA, tras rotarla
```

Y elimina `EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY` de tu `.env` y de la config de
Rork: ya no se usa.

## Notas

- Solo pude auditar un commit (el clon fue `--depth 1`). Si alguna vez se
  commiteó un `.env`, seguiría en el historial: `git log --all -p -- .env`.
- El rate limiting de login es en memoria y por isolate de Cloudflare. Frena
  fuerza bruta pero no es un limitador distribuido.
- No hay validación de esquema en el backend: los 17 `request.json()` confían
  en la forma del cuerpo. Hay límite de 2 MB, pero conviene añadir `zod`
  server-side si esto crece.
