# Performance Audit — Rowi

> Auditoría de rendimiento de producción y registro de optimizaciones.
> Metodología: barridos sobre los vectores clásicos (queries Prisma, render
> React, runtime de API, memoria) + **verificación manual leyendo el código
> real** de cada hallazgo antes de registrarlo. Lo no confirmado no entra.

**Stack:** Next.js 16 · Prisma 6 + Postgres (Neon pooled, 5 conexiones) ·
NextAuth (JWT) · Vercel serverless.

---

## 0. Tesis

La arquitectura es sólida en lo estructural (singleton de Prisma correcto,
middleware de auth, slow-query observability ya instrumentada). El problema
de rendimiento **no es algorítmico, es de falta de caché y queries sin cota**:
operaciones caras que se repiten decenas de veces por segundo sin memoizar, y
queries que crecen sin `take`. Patrón raíz: **leer de la BD lo que debería
cachearse, y traer a JS lo que debería resolver SQL.**

El patrón se repite en 3 de 4 surfaces server: `getServerAuthUser()` —un query
de 8 niveles (`hubMemberships → hub → superHub → {tenants, organizations,
hubs}`)— se invoca donde sólo se necesita `auth.id`, que el JWT ya transporta.

---

## 1. Hallazgos por severidad

### 🔴 P0
- **`getServerAuthUser()` grafo gigante sin caché de request** (`src/core/auth.ts`).
  Se ejecuta en cada request autenticado y se invoca donde basta el `id`.
- **`/api/admin/memberships` GET sin `take`** — scope rowiverse (`where=undefined`)
  materializa toda la tabla `Membership` con 3 joins.
- **Vital Signs scope `world`** (`src/lib/vital-signs/aggregate.ts`) —
  `user.findMany()` (todos) → `filterByConsent(todos)` → `eqSnapshot.findMany`
  sin `take`: materializa la tabla `eq_snapshot` entera → OOM antes que lentitud.
- **`/api/rowi`: ~37 queries post-LLM bloqueando la respuesta** — usage +
  gamificación + persistencia corrían secuencialmente tras el LLM y antes del
  `return`.
- **`checkAndAwardAchievements`: 22 `COUNT`/mensaje, llamado 2×** — recalcula
  todos los contadores (sobre tablas que crecen) en cada chat.

### 🟠 P1
- **`getActiveContexts`: 8 queries/refresh**, una sin cota (`rowiCommunityUser`).
- **`getSystemConfig` sin caché** — query + descifrado AES por cada request de IA.
- **N+1 en `/api/community/invite`** — `findUnique` por invitación en loop.
- **`resolveAgent`: 4–8 `findFirst` secuenciales** por chat.
- **Context `value` sin `useMemo`** (`UserContextProvider`) — re-render de todos
  los consumers.
- **Rate-limit in-memory por instancia** — techo real ≈ N× el límite; crítico en
  los buckets de IA (control de costo).

### 🟡 P2
- `usageDaily` findFirst+update **no atómico** (race bajo concurrencia).
- Latest-snapshot-per-user calculado en JS en vez de `DISTINCT ON`.
- Índices compuestos faltantes (`rowi_chat`, `ActivityLog`, `EqSnapshot`).
- `RowiCoach`: `localStorage` reserializado en cada mensaje; `JSON.parse` sin
  guardia; `btoa(String.fromCharCode(...buf))` desborda la pila con audios
  grandes; `registerUsage` con ceros (round-trip inútil).
- Sin streaming en `/api/rowi` (TTFB = generación completa).

### ✅ Falsos positivos descartados (verificación)
- **Singleton de Prisma correcto** — `globalThis` es sólo para HMR en dev; en
  prod el `const` a nivel de módulo ya es singleton.
- **`UsageDaily` YA tiene `@@unique([tenantId, feature, day, model])`** — no hay
  que añadirlo; lo que fallaba era el patrón findFirst+create desalineado.
- **`getServerAuthUser` "3× por request" en notifications** — eran GET/POST/PATCH
  (requests distintos), no 3 llamadas en uno.

---

## 2. Implementado

### Commit `ae6e2b0` — lote de 8 quick wins
1. `/api/account/contexts` vía `getAuthIdentity()` (0 queries) en vez del grafo.
2. `getActiveContexts`: merge family/service (8→6 queries) + `take` caps.
3. Vital Signs: `DISTINCT ON (userId)` + `MAX_AGG_USERS` (anti-OOM).
4. `RowiCoach`: debounce+cota localStorage, parse blindado, audio vía
   `FileReader`, `registerUsage` redundante eliminado.
5. `getAuthIdentity()` helper (lee del JWT, 0 queries).
6. Middleware: rate-limit distribuido (Upstash) con fail-open a in-memory.

### Commit siguiente — sección C (`/api/rowi`) + cierre
- **C7** `after()`: usage + gamificación + persistencia fuera del path de
  respuesta (~37 queries diferidas).
- **C8** `checkAndAwardAchievements` una sola pasada (22→11 `COUNT`/mensaje).
- **C9** `resolveAgent` colapsado a 1 query (de 4–8 secuenciales).
- **C10** `getSystemConfig` cacheado (TTL 5 min, invalidación en write).
- **C11** `usageDaily` → `upsert` atómico sobre el unique de 4 columnas.
- **B5** `/api/notifications` migrado a `getAuthIdentity`.
- **D13** índices: `rowi_chat(userId, agentId, intent, createdAt)`,
  `activity_log(userId, createdAt)`, `eq_snapshot(userId, at)`.

---

## 3. Backlog (pendiente)

| Item | Por qué no entró |
|------|------------------|
| **C12 Streaming en `/api/rowi`** | Cambia el contrato (`res.json().text`); requiere cambio coordinado cliente+servidor → su propio PR. |
| **#2 Rollup materializado de Vital Signs** | Sólo está el bound anti-OOM. El rollup por cron es un proyecto aparte (schema + cron). |
| **#5 Migración completa de `getServerAuthUser`** | ~85 call-sites; las formas de retorno difieren (p.ej. `/api/rowi` usa `auth.hubs` para resolver agente) → revisión por ruta, no mecánico. |
| **B4 Activar Upstash** | Requiere provisionar la cuenta + env vars `UPSTASH_REDIS_REST_URL`/`TOKEN` + verificar política de red. Hoy el código es no-op. |
| **Admin P0/P1 generales** | `/api/admin/memberships` (paginar), invite N+1, `UserContextProvider` useMemo, etc. |

---

## 4. Medición (pendiente, imprescindible)

No hay baseline. La slow-query observability (`src/core/prisma.ts`, umbral
`PRISMA_SLOW_QUERY_MS`) ya existe — validar el impacto real en staging:
- Queries por request en `/api/rowi` antes/después (objetivo: de ~45–55 a ~8–10
  en el path síncrono).
- p95 de `/api/rowi` (la mejora de `after()` debe acercarlo al TTFB del LLM).
- Memoria del serverless en agregados grandes de Vital Signs.

> *Optimización sin medición es fe, no ingeniería.*

---

## 5. Nota de verificación

Las optimizaciones de los commits referenciados fueron **type-revisadas
manualmente**; `tsc --noEmit` y la suite Jest (870 tests) no pudieron correrse
en el entorno de desarrollo remoto (la política de red bloquea la instalación
de paquetes). **El build de Vercel (`ignoreBuildErrors: false`) + CI son el
gate de verificación.** Correr localmente antes de mergear:

```bash
pnpm install && pnpm exec tsc --noEmit --skipLibCheck && pnpm test
```
