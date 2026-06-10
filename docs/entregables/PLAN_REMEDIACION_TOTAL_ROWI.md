# PLAN DE REMEDIACIÓN TOTAL — ROWI

### Cierre de TODAS las observaciones de la auditoría definitiva 360°

**Basado en:** `AUDITORIA_DEFINITIVA_ROWI_360.md` + `PLAN_EJECUCION_3_SPRINTS_ROWI.md`
**Fecha de inicio:** 2026-06-10
**Método:** fases ordenadas por riesgo→impacto. Cada cambio: `tsc --noEmit` 0 errores + `pnpm test` verde + commit atómico. i18n siempre en los 4 idiomas. Sin tocar `main` con `--force`/`--no-verify`.

---

## ESTADO PREVIO (ya en producción — 8 commits)

✅ **Loop 1** TODAY→Avatar · **Loop 2** Invitación→Affinity (heat135) · **Loop 3** Intervention→Outcome (foso)
✅ **P0** `/api/hub/ai` auth · 635MB fuera de `public/` · dominio canónico SEO
**Verificado LIVE:** robots.txt = rowiia.com · `/api/hub/ai` = 401

---

## FASES DE REMEDIACIÓN

Leyenda estado: ⬜ pendiente · 🔄 en curso · ✅ hecho · 🔑 bloqueado por credenciales de Eduardo

### FASE A — P0 que faltaron del Día 0 (privacidad + reposicionamiento)
| # | Tarea | Evidencia | Prio | Estado |
|---|---|---|---|---|
| A1 | `org/summary` `_avg` EQ con piso N≥5 + consent | `org/summary/route.ts:185-194` | P0 | ⬜ |
| A2 | Reposicionar copy hero/badge/footer (4 idiomas) | `landing.hero.badge`, `landing.footer.copyright` | P1 | ⬜ |
| A3 | `for-you`: lenguaje de Afinidad, no "Matches Emocionales" | `for-you/page.tsx:59-60` | P1 | ⬜ |

### FASE B — Seguridad restante (Fase 16 auditoría)
| # | Tarea | Evidencia | Prio | Estado |
|---|---|---|---|---|
| B1 | reset-password: rate-limit por token | `auth/reset-password/route.ts` | Alta | ⬜ |
| B2 | IDOR datos EQ en eco/compose (validar ownership de memberIds) | `eco/compose/route.ts:28-37` | Media | ⬜ |
| B3 | Path-injection gateway affinity (allowlist de project) | `affinity/route.ts:13-34` | Media | ⬜ |
| B4 | `decrypt()` no debe devolver plaintext si falla | lib crypto | Media | ⬜ |
| B5 | Permisos JWT: releer DB en acciones sensibles (documentar) | jwt callback | Alta | ⬜ |
| B6 | CSP: endurecer `'unsafe-inline'` (nonces) — backlog | headers | Baja | ⬜ |

### FASE C — Privacidad / GDPR restante (Fase 17)
| # | Tarea | Evidencia | Prio | Estado |
|---|---|---|---|---|
| C1 | Borrado de cuenta GDPR Art.17 (backend real) | `privacy/page.tsx:210` (solo alert) | Media | ⬜ |
| C2 | Anonimizar PII (nombres) en prompts eco/compose | `eco/compose/route.ts:434-453` | Media | ⬜ |
| C3 | Family VS: exigir consent granular vs_sei_individual | `family/vital-signs/me/route.ts:117` | Media | ⬜ |

### FASE D — Producto: cerrar lo que falta de los loops
| # | Tarea | Evidencia | Prio | Estado |
|---|---|---|---|---|
| D1 | Unificar registro: email→`/onboarding` (no `/settings/profile`) | `register/page.tsx:626` | P0 producto | ⬜ |
| D2 | ECO `/send` + feedback loop (cierra ECO→outcome) | no existe `/api/eco/send` | P1 | ⬜ |
| D3 | BECOMING como memoria viva (timeline reflexiones/milestones) | `becoming/page.tsx` | P1 | ⬜ |
| D4 | Cron afinidad: GET + CRON_SECRET + batching | `affinity/recalculate/route.ts:20` | P1 | 🔑 |
| D5 | Plan después del WOW en registro | `register/page.tsx:727` | P2 | ⬜ |

### FASE E — Arquitectura / escala (Fase 19)
| # | Tarea | Evidencia | Prio | Estado |
|---|---|---|---|---|
| E1 | `directUrl` Neon en datasource | `schema.prisma` datasource | P1 | 🔑 (necesita DIRECT_URL en Vercel) |
| E2 | `cachedCompletion` en rowi + eco/compose | hot paths sin caché | P2 | ⬜ |
| E3 | `unstable_cache` en `/api/account/contexts` | 8 queries/page-load | P2 | ⬜ |
| E4 | Paginar listados sin `take` de cara al usuario | community/members, etc. | P2 | ⬜ |

### FASE F — Limpieza de código / deuda (Fase 15)
| # | Tarea | Evidencia | Prio | Estado |
|---|---|---|---|---|
| F1 | Eliminar `landing-old/` | `src/app/landing-old/` | P2 | ⬜ |
| F2 | Eliminar `.bak` del motor IA | `src/ai/engine/*.bak` | P2 | ⬜ |
| F3 | Resolver `apps/` (app paralela falsa) | `apps/rowi/` | P2 | ⬜ |
| F4 | Consolidar deps: 1 bcrypt, 1 CSV, 1 xlsx | `package.json` | P1 | ⬜ |
| F5 | i18n hardcoded: 48 ternarios `lang==="es"` → t() | 22 archivos | P3 | ⬜ |
| F6 | `engines.node` + `packageManager` en package.json | package.json | P3 | ⬜ |
| F7 | catch(e:any) que filtran error.message → errorHandler | 509 sitios | P2 | ⬜ |

### FASE G — SEO / observabilidad
| # | Tarea | Evidencia | Prio | Estado |
|---|---|---|---|---|
| G1 | JSON-LD (structured data) en home | 0 en prod | P2 | ⬜ |
| G2 | Activar Sentry server-side | infra lista, log_only | P2 | 🔑 (SENTRY_DSN) |

---

## BLOQUEADAS POR EDUARDO (credenciales/env en Vercel)
- `CRON_SECRET` → D4 · `DIRECT_URL` → E1 · `SENTRY_DSN` → G2 · `NEXT_PUBLIC_APP_URL=https://www.rowiia.com` (opcional, fix ya robusto)

---

## ORDEN DE EJECUCIÓN
A → B → C → D → E → F → G. Las 🔑 se dejan código-listo y se activan cuando Eduardo pegue credenciales. Commits atómicos por tarea; push a main por fase (cada fase es desplegable y verificada).
