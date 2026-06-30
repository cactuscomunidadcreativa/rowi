# Auditoría v2 — Estado del plan (qué falta)

> Contraste del plan (`PLAN_AUDITORIA_V2.md`) contra el código real.
> Verificado el 2026-06-30 tras la sesión de ejecución (11 commits).

## Resumen: el código del roadmap está hecho. Falta lo operativo + deuda post-launch.

---

## Hito 0 · Higiene/seguridad — ✅ HECHO (commit f18e193)

| # | Tarea | Estado |
|---|---|---|
| 0.1 | Quitar `adminEmails[]` → scope-aware | ✅ |
| 0.2 | Matar 2º admin legacy `(app)/admin/ui` | ✅ (ya estaba borrado; arreglado el enlace muerto) |
| 0.3 | Bug doble relación RowiCommunity | ✅ (ya no existía; verificado con `prisma validate`) |
| 0.4 | Aislar páginas demo (DEMO_STATS/COUPONS) | ✅ PARCIAL — `tasks/*` ya está `superOnly` (oculto a no-plataforma); `gamification/coupons` ya estaba comentado fuera del nav. **No se añadió un badge "DEMO" visible** (decisión: superOnly basta para ocultarlas; un badge sería cosmético). |
| 0.5 | Quitar `false &&` ContextSwitcher | ✅ (flag nombrado `CONTEXT_SWITCHER_ENABLED`) |

---

## Hito 1 · Marca afinada — ✅ HECHO (commits cd93bda + 4e7096f)

- ✅ Violeta primario (core ya lo tenía; barrido de ~54 archivos del shell oscuro).
- ✅ Badges NEW con caducidad (TTL 30d), emojis-ícono fuera, gradientes neón domados.
- ✅ Copy "Coach IA" → "Guía" (i18n x5 + fallbacks).

**Cola menor (chip):** "AI Coach" aún en seeds de CMS (landing-builder/init, api/admin/pages) — son datos semilla, no UI viva.

---

## Hito 2 · Navegación = el viaje + ⌘K — ✅ HECHO (commits 205e2a4 + 5ce1885)

- ✅ Navbar = 5 fases (Hoy·Verme·Practicar·Conectar·Impacto); Guía transversal.
- ✅ Buscador ⌘K (índice desde `adminNavData`, respeta scope).
- ✅ Admin 23→8 dominios (reagrupado visual, 0 items perdidos).

**Diferido (Fase 5, post-launch):** las rutas físicas NO se movieron (el plan dice
"no mover archivos todavía"). La navbar agrupa; las carpetas se reubican en la fase
de módulos. Correcto por diseño.

---

## Hito 3 · Surfacear Practice — ✅ HECHO (commit e8ee707)

| # | Tarea | Estado |
|---|---|---|
| 3.1 | Practice en navbar + gancho en TODAY | ✅ navbar (fase Practicar) + enlace "Ensayar" en TODAY. **Falta el gancho desde weekflow** (menor). |
| 3.2 | Mover `scenarios` junto al viaje | ✅ (a sección EQ, renombrado) |
| 3.3 | Cargar 3-5 escenarios REALES | ⏳ **PENDIENTE — es tuyo**: hay 2 escenarios demo; los del cliente los subes en `/hub/admin/scenarios`. |
| 3.4 | Practice como 7º agente | ✅ (ya es agente global, aparece solo) |

---

## Hito 4 · Rowiverse 3 niveles — ✅ HECHO Tier 1 (commit 9c7f887)

- ✅ Veredicto: "Espacio" = RowiCommunity (no hay que fusionar tablas).
- ✅ `/api/espacios` (vista unificada) + reencuadre UI "Workspace"→"Espacio".
- ✅ Flujo crear+poblar ya existía.

**Diferido (Tier 2, post-launch, riesgo auth):** simplificar scopes 4→3 (`requireAdmin.ts` + ~20 endpoints).

---

## Hito 5 · Launch 1.0 — ⏳ TUYO (operativo, no código)

- Cohorte real 10→25 + coaches
- Checkout Stripe en vivo
- KPIs del funnel (PostHog)
- DNS de email (Resend)

---

## DESPUÉS del launch (no bloquea) — ⏳ deuda diferida

- **Fase 4-Datos** (riesgo alto): unir 3 membresías → `Membership{scopeType}`; `AuditLog`+`ActivityLog` → uno; revisar `UserStreak`/`AvatarStreak`.
- **Fase 5-Módulos** (incremental): `api/·domains/·services/` → `src/modules/` por el viaje; `(app)/` agrupa por fase; mover rutas físicas con redirects.

---

## Chips abiertos (deuda menor, spawneados como tareas)

1. Migrar `isSystemAdmin(env HUB_ADMINS)` → scope-aware en 5 rutas API.
2. Borrar API huérfana `/api/admin/ui`.
3. Limpiar "AI Coach" en seeds CMS.

## Pendientes de credenciales (tuyos)

- **`ANTHROPIC_API_KEY`** en prod (Practice + traducción de escenarios usan Claude; sin ella caen a OpenAI).
- Modelo China: `PRACTICE_MODEL_CN` el día que exista (cero código).

---

## VEREDICTO

**Todo el desarrollo de código del roadmap (Hitos 0-4) está hecho, verificado y en
producción.** Estabilidad confirmada: tsc 0 · 565 tests · build de prod OK · paridad
i18n perfecta (9976×5). Lo que falta es:
- **Operativo tuyo** (Hito 5: launch, credenciales).
- **3 detalles menores** (escenarios reales del cliente, gancho weekflow, badge DEMO).
- **Deuda post-launch** (Tier 2 scopes, consolidación de datos, módulos) — opcional, no bloquea.
