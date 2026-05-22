# CLAUDE.md — Agent notes for this repo

Quick orientation for an agent walking in cold. Owners: Eduardo
(eduardo@cactuscomunidadcreativa.com) — sole SuperAdmin.

## Stack

Next.js 16 App Router · Prisma 6 + Postgres (Neon pooled) · NextAuth ·
Vercel deploys · Resend (email) · OpenAI · Tailwind. Pnpm workspaces
single repo.

Languages: ES default + EN / PT / IT. **Every new user-visible string
must pass through `t("key", "fallback ES")` with keys mirrored in all
four `src/lib/i18n/locales/*.json` files.** "Six Seconds" is a brand
name and never gets translated.

## Hard rules (durable, do not violate)

- Never `git push --no-verify`, `git push --force` to main/master, or
  touch `git config`. Never `git add -A` with wildcards.
- Build pipeline runs `prisma db push --skip-generate
  --accept-data-loss` on every deploy — schema changes propagate
  automatically, but back-relations + non-null columns on populated
  tables require care.
- **TS strict is enabled** as of the May 2026 cleanup —
  `next.config.ts: ignoreBuildErrors: false`. The codebase was
  taken from 198 errors → 0 across three commits (A, B, C). The
  Vercel build now fails fast on a new TS error. Run
  `pnpm exec tsc --noEmit --skipLibCheck` locally before pushing.
  Only flip the flag back to true as a TEMPORARY unblock while a
  fresh batch is investigated — don't ship it.
- Untracked files that NEVER get committed: `.claude/`, `pitch/`,
  `NVIDIA_PITCH_DECK.md`, `src/app/pitch/`, `.env`, `.env.local`.

## Architecture surfaces you'll touch most

### Account contexts (multi-hat identity)

A single user can wear several hats at once: personal, employee
(reporting to a manager + having reports), family (declared by self
or others), service provider/client. Three Prisma models drive this:

- `EmployeeProfile.managerId` (self-FK with cycle detection in the
  PATCH route).
- `FamilyRelation` (owner + consent flow — only the related user can
  flip consentStatus to accepted/declined).
- `ServiceEngagement` (provider → one of Tenant / Community /
  Organization / User, with a state machine for status).

Runtime:
- `getActiveContexts(userId)` in `src/lib/account/contexts.ts` returns
  the user's hats sorted by weight.
- `/api/account/contexts` exposes them to the client.
- `AccountContextChip` in NavBar writes the pick to a cookie
  `rowi_active_context`. The legacy `ContextSwitcher` (org hierarchy)
  also writes the same cookie now — single source of truth.
- Routes `/api/org/summary`, `/api/team/summary`, `/api/hr/summary`
  and several `/api/workspaces/*` read the cookie via
  `resolveContextTenantId()` and **narrow** their queries to that
  tenant. **The cookie only narrows access; it never grants it.**

Full writeup: `docs/CONTEXTS_MODEL.md`.

### Scope-aware admin

Replaces the binary SuperAdmin check on most tenant-touching admin
endpoints. Helpers in `src/core/admin/scopedList.ts`:

- `requireAdminWithScope()` — returns rowiverse / superhub / tenant
  / hub scope.
- `tenantIdsForScope(scope)` — set of tenant ids the scope can
  administer. Returns `null` for rowiverse (no narrowing).
- `scopeCanSeeUser(scope, userId)` — membership-overlap check.
- `scopeCanAdminProfileFeatureScope` / `scopeCanAdminHub` —
  domain-specific checks.

Pattern: **read scope-aware, mutate SuperAdmin** unless the operation
is genuinely tenant-local. Migrated endpoints live in
`src/app/api/admin/{memberships,invites,tenants,superhubs,hubs,
user-roles,permissions,roles}`. Platform-level things (agents,
benchmarks, cms, sales/coupons, sei-links) stay SuperAdmin-only by
design.

### Telemetry + observability

`src/lib/telemetry/index.ts` is the single capture entrypoint
(`captureException`, `captureMessage`). Three providers:
- `log_only` (default) — mirrors to `secureLog`.
- `sentry` — when `SENTRY_DSN` configured.
- `axiom` — when `AXIOM_TOKEN` configured.

Provider + credentials resolve from `SystemConfig` (DB, encrypted
at rest via AES-256-GCM) first, env vars as fallback. Cached 5 min
per serverless instance. The admin UI at `/hub/admin/settings`
manages these from the **observability** category; saves invalidate
the cache via `telemetry.refreshConfig()`.

Browser-side Sentry still needs `NEXT_PUBLIC_SENTRY_DSN` in Vercel
env (the client bundle reads env at build time, not DB at runtime).

Slow-query observability in `src/core/prisma.ts` — a `$extends({query})`
middleware logs `prisma.slow_query` (warn) at ≥500ms (configurable
via `PRISMA_SLOW_QUERY_MS`, env-only because it's read at boot) and
fans `prisma.query_failed` (error) through `telemetry.captureException`.

Full activation guide: `docs/OBSERVABILITY.md`.

### Emotional Budgeting / Vital Signs

Rowi is also the operational platform for **Emotional Budgeting**,
the Six Seconds framework. The book by Eduardo González names this
project as **ROWIIA** explicitly (ch. 16). We host the five frameworks:
Vital Signs (5 drivers · 15 pulse points · OVS/TVS/LVS/FVS), KCG
(8 SEI competencies in `EqSnapshot`), Brain Talents (18 in
`TalentSnapshot`), and the observability layer itself.

Key principles:
- The BE2GROW matrix (pulse point → SEI + brain talents) is a
  **hypothesis v0**, not calibrated truth. Each debrief (3 highlighters
  OWN/CONSIDER/REJECT) and each CSV upload contribute ground truth
  that refines the model toward v1.
- Five visibility levels: `self` / `team_aggregated` (N≥5) /
  `org_aggregated` (N≥5) / `community_public` / `research_lens`.
- Research lens is granted via `User.researchAccessLevel` enum:
  `founder` (Eduardo only), `scientific_lead` (Joshua only),
  `rowi_team` / `six_seconds_team` (anonymized for the respective
  teams), `invited_personal` (user invites their own coach/mentor).
  Every research access is logged in `ResearchAccessAudit`.
- Privacy floor is **GDPR**. Adapted per jurisdiction. China (PIPL)
  will need data residency when we enter.
- All lenses (HR, team leader, GM, coach, mentor, consultant,
  recruiter, family) materialize on existing models: `ServiceEngagement`,
  `EmployeeProfile.managerId`, `FamilyRelation`, scope-aware admin.
  We add the VS layer on top, not a parallel system.

Full writeup: `docs/EMOTIONAL_BUDGETING.md`.

### EmoPower Schools (segundo producto sobre el mismo stack)

ROWIIA opera también **EmoPower Schools** en alianza Six Seconds + Brain
Up Ecuador. Es un programa SEL de 12 meses para sistemas educativos —
mismo stack, mismo modelo Six Seconds, distinto objeto medido
(institución educativa en vez de persona/empresa).

Componentes nuevos respecto a Emotional Budgeting:
- **EVS (Education Vital Signs)** — clima escolar institucional (4 dim:
  seguridad, conexión, pertenencia, propósito). Es agregado, no
  individual. Se aplica en 3 olas durante el año.
- **Ciclo mensual del Quality Coach** — semana 1 observación de aula,
  semana 2 devolución 1:1, semana 3 comunidad de práctica, semana 4
  supervisión Brain Up. Es el corazón operativo del programa.
- **Rúbrica de aula** — 3 dimensiones (apertura emocional, conexión,
  transferencia) × escala 1-4 con anclajes conductuales.
- **Journal del estudiante** — privado del estudiante. El colegio NO lo
  ve. Crisis keyword detection escala al DECE + línea de ayuda.
- **Roles nuevos:** Quality Coach (especialización del lente coach),
  Director, Coord SEL, Brain Up team, MINEDUC / autoridades.
- **Tenancy:** colegio = `Tenant`. Distrito / MINEDUC se modela vía
  `SuperHub` o nuevo `EducationalSystem` que agrupa Tenants.

Plan MVP/v2/v3 detallado en `docs/EMOPOWER_SCHOOLS.md` y mapa de
integración con Emotional Budgeting en `docs/ROWIIA_INTEGRATED_SCOPE.md`.
**Status:** scope documentado, implementación no iniciada — pendiente de
aprobación de las 5 decisiones de arquitectura en sección 5 del scope
integrado.

### Email locale chain

Every transactional email picks recipient's `preferredLang` →
`language` → `"es"` (fallback). Helpers live in
`src/lib/email/sendContextNotification.ts` and
`src/lib/email/sendInviteEmail.ts`. Never duplicate Resend wiring —
extend `sendContextNotification` for new event kinds.

## Repo conventions

- Commits: `feat(scope): ...` / `fix(scope): ...` /
  `test(scope): ...` / `docs: ...` / `chore: ...`. End every commit
  with the `Co-Authored-By: Claude Opus 4.7 (1M context)` trailer.
- `EntityTable` + `AdminPage` (`src/components/admin/*`) for any
  new admin listing. Don't roll your own table.
- `ConfirmDialog` (`src/components/shared/ConfirmDialog.tsx`)
  instead of `window.confirm`.
- API errors return `{ ok: false, error: "..." }` with proper
  HTTP status. Success: `{ ok: true, ... }`.

## Tests

Jest config in `jest.config.js`. Tests in `src/__tests__/`. Run
`pnpm test`. Coverage with `pnpm test:coverage`.

Playwright is scaffolded but not installed by default (see
`e2e/README.md`). The jest suite ignores `e2e/`.

Currently 213+ tests passing in <1s.

## Production

Domain: https://www.rowiia.com. Push to `main` → Vercel
auto-deploys in 2-5 minutes. The build runs `prisma generate &&
prisma db push --skip-generate --accept-data-loss && next build`.

Smoke check (no auth, must give 401 or 302):
```
curl -sI https://www.rowiia.com/api/account/contexts | head -3
```
