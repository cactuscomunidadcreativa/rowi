# ROWI — HANDOFF SESIÓN 5 → 6

### Contexto completo para abrir una nueva sesión: qué se hizo, qué falta, qué depende de Eduardo

**Fecha de cierre:** 2026-06-10 · **Rama:** `main` (sincronizada con origin) · **Último commit:** `49af652`
**Estado:** 32 commits esta sesión · 518 tests pasando · 0 errores TS · deploy live (home 200).

---

## 0 · CÓMO RETOMAR (lo primero que debe leer la nueva sesión)

- Todo está en `main` y desplegado en https://www.rowiia.com (push a main → Vercel auto-deploy 2-5 min).
- Cada commit pasó: `pnpm exec tsc --noEmit --skipLibCheck` (0 errores) + `pnpm test` (518 tests).
- Documentos clave de esta sesión en `docs/entregables/`:
  - `AUDITORIA_DEFINITIVA_ROWI_360.md` — la auditoría base.
  - `PLAN_REMEDIACION_TOTAL_ROWI.md` — fases A-G (seguridad/privacidad/etc.), todas hechas.
  - `ARQUITECTURA_MODULOS_CAPABILITIES.md` — sistema de módulos por rol+suscripción.
  - `PLAN_ROWI_CONSULTOR.md` + `PLAN_EQ_PROPOSAL_ACCELERATOR.md` — el consultor y su producto.

---

## 1 · LO QUE SE CONSTRUYÓ ESTA SESIÓN (todo en prod)

### A. Auditoría 360° + remediación (Fases A-G)
3 loops del producto (avatar↔reflexión, afinidad en invitación=heat135, foso Intervention→Outcome)
+ seguridad (`/api/hub/ai` auth, reset-pw rate-limit, IDOR eco, path-injection affinity, decrypt)
+ privacidad (org/summary N≥5, borrado GDPR Art.17, anonimizar PII a OpenAI)
+ producto (registro unificado→onboarding, ECO /send+feedback)
+ escala (cache contexts) + limpieza (deps muertas) + SEO (dominio canónico, JSON-LD).

### B. Sistema de módulos / capabilities (rol + suscripción)
`src/core/capabilities/{catalog,resolve,requireCapability}.ts` — dos ejes: scope (rowiverse/
superhub/tenant/hub) + flags del Plan. Tú (rowiverse) ves todo; cliente solo lo que su plan
activa; lo de plataforma (agentes/ventas/knowledge) nunca aparece para el cliente.
- "TP Hub" renombrado a **"Hub de Gestión / Manage Hub"** (genérico, no Teleperformance).
- Nav dinámica: `/api/account/capabilities` + AdminUserContext.can() + Sidebar filtra por capability.

### C. Integraciones (espejo de Slack, código-listo)
- **WhatsApp** (Twilio): completa — status + UI.
- **Microsoft Teams** (Incoming Webhook): `lib/teams/*` + connect/status + card con form.
- **Gmail** (OAuth Google): `lib/gmail/*` + install/callback/status + envío vía Gmail API.
- Panel: `/hub/admin/integrations`.

### D. Rowi Consultor + EQ Proposal Accelerator
- **Motor de puntos ciegos** SEI↔VS (`lib/consultant/blindspot-map.ts`) — validado con datos reales de Carolina.
- **Motor de reglas de diagnóstico** (`lib/consultant/diagnosis-engine.ts`) — vs norma, dispersión, iceberg, bienestar, segmentación cliente/partner. Validado con números de Bancolombia.
- **Flujo principal:** `/hub/admin/vital-signs/report` → sube SEI + VS (CSV) → entregable formato Rowi (barras + puntos ciegos + diagnóstico) + 2 canastas (cliente/confidencial) + **Guía confidencial** del partner. Export PDF (print). Stateless (no persiste, privacidad).
- **Flujo con benchmark** (cruces avanzados líder↔equipo, longitudinal): `/hub/admin/vital-signs/consultant` (persiste con consentimiento).

### E. Comunidad: Relaciones fusionada
`/relationships` ya no es entrada de menú → es pestaña **"Relaciones"** dentro de `/community`,
con **edición de cercanía** (Cercano/Neutral/Lejano) por vínculo + invitar. `/relationships`
redirige a `/community?tab=relationships`. Campo nuevo `RelationshipDyad.closeness`.

---

## 2 · LO QUE FALTA (priorizado para la nueva sesión)

### 🔑 BLOQUEADO POR EDUARDO (credenciales/contenido — no es código)
| Pendiente | Qué desbloquea | Dónde |
|---|---|---|
| `DIRECT_URL` en Vercel | añadir `directUrl` al schema Prisma (1 línea) → pooling Neon a escala | env Vercel |
| `ROWI_VS_PULSE_MAP` en Vercel | que el VS del consultor salga **real** (hoy cae a "inferido") | env Vercel |
| Credenciales Twilio / Google / Teams webhook | activar las 3 integraciones (código-listo) | admin → Ajustes / card Teams |
| `NEXT_PUBLIC_APP_URL=https://www.rowiia.com` | opcional (el fix ya es robusto) | env Vercel |
| **Estructura EAR + 3 opciones + pricing** | la **propuesta comercial** del Accelerator (el blueprint prohíbe inventar) | contenido de Eduardo |

### 🟡 CÓDIGO PENDIENTE (no bloqueado — se puede construir)
- **Accelerator v2/v3:** propuesta EAR (cuando haya contenido), PPTX real (pptxgenjs), biblioteca de casos, pricing multi-país, EVS.
- **Diferidos de la auditoría (bajo impacto):** D3 BECOMING memoria viva · D5 plan tras WOW · E2 cachedCompletion en rowi/eco · E4 paginación de listados · F5 i18n hardcoded (48 ternarios) · F7 catch(e:any) (509) · B5 JWT 24h · B6 CSP nonces. Detalle en `PLAN_REMEDIACION_TOTAL_ROWI.md`.
- **Conectar ECO → Gmail/WhatsApp:** cuando las integraciones tengan claves, el botón de enviar de ECO puede usar el canal conectado (cerrar el círculo componer→enviar).

### ⚠️ VERIFICACIÓN PENDIENTE EN NAVEGADOR (necesita login de Eduardo)
Nada de esto se pudo probar end-to-end por requerir auth admin / datos reales:
- El informe del Consultor con un CSV real de Bancolombia (`/vital-signs/report`).
- Edición de cercanía en Comunidad → Relaciones.
- Los flujos OAuth de Teams/Gmail (requieren credenciales).
- Manage Hub con login de HR/team-lead (que el gate por capability deja entrar).
Todo compila y tiene tests; la prueba real es en vivo con login.

---

## 3 · REGLAS DEL REPO (recordatorio para la nueva sesión)
- TS strict activo: `next.config.ts` `ignoreBuildErrors:false`. Correr `pnpm exec tsc --noEmit --skipLibCheck` antes de push.
- Todo string nuevo por `t()` en los 4 locales (es/en/pt/it).
- Git: no `--no-verify`, no force-push a main, no `git add -A`. Commits con trailer `Co-Authored-By: Claude Opus 4.7 (1M context)`.
- Schema: `prisma db push` corre en cada deploy; campos nuevos nullable (seguro en tablas pobladas).
- Tras borrar una página, limpiar `.next/dev/types/validator.ts` (cache de tipos stale de Next).

---

## 4 · URLS CLAVE DEL PRODUCTO
- Consultor (flujo rápido): `/hub/admin/vital-signs/report`
- Consultor (cohorte/benchmark): `/hub/admin/vital-signs/consultant`
- Integraciones: `/hub/admin/integrations`
- Comunidad (con Relaciones): `/community`
- Manage Hub: `/hub/admin/tp` (renombrado a "Hub de Gestión")

---

## 5 · RESUMEN EN UNA FRASE
Sesión 5 cerró la auditoría completa + sistema de módulos por suscripción + 3 integraciones +
el Rowi Consultor/EQ Proposal Accelerator (subir SEI+VS → 2 entregables) + fusión de Relaciones
en Comunidad. **Todo en prod, verificado por tests.** Lo que falta es (a) credenciales/contenido
de Eduardo, (b) la propuesta EAR comercial, y (c) verificación en navegador con login real.
