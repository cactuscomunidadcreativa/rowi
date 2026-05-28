# Integraciones — Guía de operación

Resumen de las integraciones externas de Rowi, cómo se configuran, y los
diagnósticos para verificarlas. Detalle de Slack en `docs/SLACK_SETUP.md`.

## Modelo de configuración: SystemConfig + env

Las credenciales se resuelven **primero desde SystemConfig** (tabla DB
encriptada AES-256-GCM, editable en `/hub/admin/settings`) y caen a **env
vars** como fallback. Cache 5 min por instancia serverless; al guardar una
clave en el admin se invalida el cache (`refreshStripeConfig` /
`refreshSlackConfig` / `telemetry.refreshConfig`).

Patrón de referencia: `src/lib/stripe/client.ts` (`loadStripeConfig`).

Categorías en `/hub/admin/settings`: ai · auth · email · payments ·
database · observability · **integrations** · general.

---

## Stripe (pagos + licencias por asiento)

- Claves: `STRIPE_SECRET_KEY` (`sk_live_…`), `STRIPE_PUBLISHABLE_KEY`
  (`pk_live_…`), `STRIPE_WEBHOOK_SECRET` (`whsec_…`). Las 3 en
  `/hub/admin/settings` → Pagos.
- Webhook endpoint: `https://www.rowiia.com/api/stripe/webhook`.
  Eventos: `checkout.session.completed`, `customer.subscription.*` (created/
  updated/deleted/trial_will_end), `invoice.paid`, `invoice.payment_failed`,
  `invoice.payment_action_required`.
- Idempotency persistente en `StripeWebhookEvent`.
- **Licencias por asiento**: la `quantity` de la suscripción B2B (metadata
  `tenantId`) sincroniza `Tenant.licenseCount`. Ver `src/lib/licensing/seats.ts`.
- **Diagnóstico**: `GET /api/admin/stripe/account-status` (SuperAdmin) →
  `chargesEnabled`, requirements, veredicto de si cobra en vivo.
- Gotcha: el `STRIPE_SECRET_KEY` debe empezar con `sk_` (no `pk_`, no `mk_`).

## Email (Resend)

- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME` (env).
- Helpers en `src/lib/email/` (welcome, verification, password-reset, invite,
  context-notification, billing-notification). Locale chain:
  `preferredLang → language → es`.
- **Diagnóstico**: `GET /api/admin/email/deliverability-status` (SuperAdmin) →
  dominios verificados en Resend + estado SPF/DKIM + si el FROM está verified.
- Gotcha: el FROM por defecto es `noreply@rowi.app`; el dominio del FROM debe
  estar **verified** en Resend o los correos caen en spam. Verifica que el
  dominio verificado coincida con el del FROM.

## Slack (bot bidireccional)

Ver `docs/SLACK_SETUP.md`. Claves `SLACK_CLIENT_ID/SECRET/SIGNING_SECRET` en
`/hub/admin/settings` → Integraciones. Panel: `/hub/admin/integrations`.

## Notificaciones salientes (Slack / Teams / WhatsApp)

- Providers en `src/lib/notifications/providers/` (integrations.ts = Slack/
  Teams; sms.ts = SMS/WhatsApp vía Twilio).
- **Por usuario**: `NotificationPreference` (slackWebhookUrl, teamsWebhookUrl,
  whatsappNumber + flags *Enabled).
- **Por organización**: `Tenant.orgSlackWebhookUrl/orgTeamsWebhookUrl` +
  `notifyOrgChannel()` (`src/lib/notifications/orgChannel.ts`). Config:
  `POST /api/admin/integrations/org-channel` (scope-aware, con test).
- WhatsApp requiere `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
  `TWILIO_WHATSAPP_NUMBER` (env).

## Observabilidad (Sentry / Axiom)

- `TELEMETRY_PROVIDER` = `log_only | sentry | axiom`, `SENTRY_DSN`,
  `NEXT_PUBLIC_SENTRY_DSN` (debe ir también en Vercel env para el bundle),
  `AXIOM_TOKEN`, `AXIOM_DATASET`. Ver `docs/OBSERVABILITY.md`.

## Cron jobs (vercel.json)

Protegidos con `CRON_SECRET` (Authorization Bearer):
- `/api/cron/weekly-pulse` (lunes 09:00 UTC)
- `/api/cron/debrief-reminder` (diario 14:00 UTC)
- `/api/cron/invite-expiry-reminder` (diario 10:00 UTC)

## URL canónica

Toda la app debe usar `https://www.rowiia.com`. Setea
`NEXT_PUBLIC_APP_URL=https://www.rowiia.com` en Vercel y asegúrate de que
`NEXT_PUBLIC_BASE_URL` / `BASE_URL` **no** apunten a `rowi.vercel.app`
(rompe links de emails). El redirect de Slack ya está hardcodeado a www.
