# Slack App — Setup & Runbook

Cómo crear y configurar la Slack App de Rowi (bot bidireccional: Rowi
Coach, check-ins, notificaciones). Todo el flujo es **saliente + entrante**
vía Request URLs HTTP (NO Socket Mode).

## Arquitectura

- **Claves** (`SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `SLACK_SIGNING_SECRET`)
  se guardan en `/hub/admin/settings` → Integraciones (SystemConfig,
  encriptado AES-256-GCM) con fallback a env. Las lee `src/lib/slack/config.ts`.
- **Instalación por workspace**: cada empresa instala la app en SU Slack vía
  OAuth → crea una fila `SlackInstallation` (bot token encriptado en `botTokenEnc`).
- **Identidad**: `SlackUserLink` mapea `slackUserId` ↔ usuario Rowi.
- **Endpoints** (`src/app/api/integrations/slack/`):
  - `install` — inicia OAuth (requiere sesión Rowi).
  - `callback` — intercambia code por bot token, crea SlackInstallation.
  - `events` — Events API (verifica firma HMAC). Rutea `app_mention` + DM al Coach.
  - `commands` — slash command `/rowi`.
  - `status` — estado de conexión (para el panel admin).
- **Coach**: `src/lib/slack/coach.ts` reusa la lógica de `/api/rowi`; responde
  vía `chat.postMessage` (`src/lib/slack/postMessage.ts`); ackea <3s con `after()`.

## Crear la app (una sola vez)

1. https://api.slack.com/apps → **Create New App** → **From scratch** → workspace.
2. **App Credentials** (Basic Information): copia Client ID; revela y copia
   Client Secret y Signing Secret → pégalos en `/hub/admin/settings` → Integraciones.
   (El "Verification Token" está deprecado, NO se usa.)

## Configurar (en api.slack.com)

### OAuth & Permissions
- **Redirect URLs** → agrega EXACTAMENTE (y Save URLs):
  `https://www.rowiia.com/api/integrations/slack/callback`
  (Sin `www` o con la URL de Vercel **falla** — ver Troubleshooting.)
- **Bot Token Scopes** (7): `chat:write`, `im:write`, `im:history`,
  `app_mentions:read`, `commands`, `users:read`, `users:read.email`.
- **User Token Scopes**: vacío.
- **Restrict API Token Usage** (IPs): vacío (Vercel usa IPs dinámicas).

### Event Subscriptions
- Enable Events → ON.
- **Request URL**: `https://www.rowiia.com/api/integrations/slack/events`
  (debe ponerse verde ✓ — requiere `SLACK_SIGNING_SECRET` ya cargado).
- **Subscribe to bot events**: `app_mention`, `message.im`.

### Slash Commands
- Create New Command → `/rowi` →
  Request URL: `https://www.rowiia.com/api/integrations/slack/commands`.

### App Home
- **Messages Tab** → ON + marca "Allow users to send Slash commands and
  messages from the messages tab" (sin esto, los DM al bot están bloqueados).
- (Opcional) Home Tab → ON.

### Socket Mode
- **OFF.** Usamos Request URLs, no WebSockets.

## Conectar (instalar en un workspace)
- Logueado en Rowi (en `www.rowiia.com`), abre:
  `https://www.rowiia.com/api/integrations/slack/install`
- Autoriza → vuelve a `/hub/admin/integrations?slack=connected`.
- Para que el bot reciba menciones en un canal: `/invite @Rowi` en ese canal.

## Probar
- `/rowi help` → responde con comandos.
- `@Rowi hola` en canal, o DM al bot → responde el Coach.

## Troubleshooting

| Síntoma | Causa | Fix |
|---|---|---|
| `redirect_uri did not match … rowi.vercel.app` | El redirect salió con el host de Vercel | Ya hardcodeado a www en `getSlackRedirectUri()`. Asegura que la Redirect URL en Slack sea la de www y empieza el flujo desde www. |
| `Invalid state or code` → `detail: missing_code` | Slack no devolvió code (Redirect URL no coincide o claves faltan) | Verifica Redirect URL exacta + claves en `/hub/admin/settings`. |
| `detail: missing_state_cookie` | Empezaste por el callback directo, o en otro dominio | Empieza por `/install` en www, mismo navegador. |
| Event Subscriptions no verifica (rojo) | Falta `SLACK_SIGNING_SECRET` o deploy no vivo | Carga la clave y reintenta "Retry". |
| "Sending messages to this app has been turned off" | Messages Tab off | App Home → Messages Tab ON + casilla de mensajes. |
| El bot no responde menciones | No suscrito a `app_mention` / no está en el canal | Suscribe el evento + `/invite @Rowi`. |

## Notas / limitaciones
- Dedupe de eventos: en memoria por instancia (best-effort). Para garantía
  dura usar cola (QStash/Inngest).
- `/rowi checkin` es stub (falta flujo real con persistencia).
- `SLACK_REDIRECT_URI` (env) permite override del redirect canónico si algún
  día hace falta staging con su propia Slack App.
