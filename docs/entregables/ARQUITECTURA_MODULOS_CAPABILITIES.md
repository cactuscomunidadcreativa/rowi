# ARQUITECTURA DE MÓDULOS — Capabilities (Rol + Suscripción)

### Cómo Rowi separa lo tuyo, lo del consultor y lo del cliente — y monetiza por módulo

**Fecha:** 2026-06-10 · **Decisión Eduardo:** activación por Rol + Suscripción combinados.

---

## EL PROBLEMA QUE RESUELVE

Hoy `/hub/admin` mezcla tres cosas en un solo cajón protegido por "¿eres SuperAdmin?":
1. **Plataforma** (solo tú): agentes IA, benchmarks globales, CMS, cupones, knowledge.
2. **Consultor** (tú + consultores, ven solo SUS clientes): perfil integral, cross-analysis.
3. **Operación del cliente** (HR + team-leads del tenant): TP Hub — people, teams, roi, alerts.

No escala y le filtra lo tuyo al cliente. La solución: **capabilities** — una capa de
permisos por módulo sobre lo que ya existe, sin mover las 308 páginas.

---

## EL MODELO: dos ejes que se combinan

Una **capability** = permiso de ver/usar un módulo. Se concede solo si AMBOS ejes se cumplen:

- **Eje 1 — Scope/Rol** (`requireAdminWithScope`): `rowiverse` (SuperAdmin = tú) /
  `superhub` / `tenant` (HR/admin del cliente) / `hub` (team-lead). Define QUÉ TIPO de
  cosa puede ver.
- **Eje 2 — Suscripción** (flags del modelo `Plan`: `benchmarkAccess`, `rowiECOAccess`…):
  define si el tenant COMPRÓ el módulo.

`rowiverse` (tú) es especial: **ve todo, sin depender de suscripción** — un SuperAdmin no
queda bloqueado por el plan de un cliente. Las capabilities `platform.*` solo las tiene
`rowiverse` por catálogo, así que nunca se le filtran a un cliente.

---

## ARCHIVOS (la base, ya construida y testeada)

| Archivo | Qué hace |
|---|---|
| `src/core/capabilities/catalog.ts` | EL MAPA: cada capability → {scopes permitidos, planFlag requerido}. Puro, declarativo. |
| `src/core/capabilities/resolve.ts` | `resolveCapabilities(scope, planFlags)` → Set de capabilities. Función pura, sin DB. |
| `src/core/capabilities/requireCapability.ts` | Gate para routes/páginas: carga scope + Plan del tenant y aplica el resolver. |
| `src/__tests__/capabilities/resolve.test.ts` | 6 tests del modelo de dos ejes. |

### Capabilities definidas hoy
- `platform.*` — agents, benchmarks, cms, coupons, knowledge, tenants, settings (solo tú).
- `consultant.*` — profile, cross, narrative (rol consultor, scoped a sus clientes, gated por benchmarkAccess).
- `tp.*` — dashboard, people, teams, alerts, roi, eco, coach (HR/team-lead del tenant, gated por plan).
- `hr.*` — employees, reviews, vitalSigns (HR del tenant).

---

## CÓMO SE USA (una línea por vista)

En un route handler o página server:
```ts
import { requireCapability } from "@/core/capabilities/requireCapability";

const gate = await requireCapability("tp.people");
if (gate.error) return gate.error;   // 403 capability_denied
// gate.scope y gate.caps disponibles para narrowing de datos
```

La nav admin puede pintar solo los módulos cuya capability tenga el usuario (resolver una
vez, filtrar el menú).

---

## PLAN DE APLICACIÓN (siguiente, por fases seguras)

> La base ya está. Aplicar guards es incremental y reversible, vista por vista.

1. **TP Hub → abrir a HR/team-lead.** Poner `requireCapability("tp.*")` en cada vista de
   `src/app/hub/admin/tp/*` y sus APIs. Hoy están a `@6seconds`; pasan a rol tenant/hub +
   plan. Empezar por las read-only (dashboard, people, teams).
2. **Consultor → scoped.** `requireCapability("consultant.profile")` en `/api/consultant/*`
   y la página de perfil. Un consultor invitado de un tenant ve solo lo suyo.
3. **Plataforma → blindar.** `requireCapability("platform.*")` en agents/benchmarks/cms/etc.
   (hoy SuperAdmin-only; el guard lo formaliza y lo saca del menú del cliente).
4. **Nav dinámica.** El sidebar admin filtra por `gate.caps`. Lo tuyo desaparece para el cliente.
5. **Panel de planes.** Mapear cada `planFlag` a un módulo vendible → "este plan incluye TP Hub".

---

## POR QUÉ ESTE ENFOQUE (y no mover carpetas)

- **Reusa lo que ya tienes**: `requireAdminWithScope`, `Plan` con sus flags, `tenantIdsForScope`.
  No inventa un sistema paralelo de permisos.
- **Bajo riesgo**: cada vista gana una línea de guard; no se mueve ninguna ruta (308 páginas intactas).
- **Monetización por módulo gratis**: la capability mira el `Plan` del tenant → "se activa según suscripción".
- **Separa lo tuyo del cliente por diseño**: `platform.*` solo rowiverse; imposible que un HR lo vea.

## ESTADO
- [x] Base: catálogo + resolver + gate + 6 tests (commiteado)
- [x] **Cap-1** Manage Hub (antes TP): layout con gate por capability (tp.dashboard) +
      renombrado "Teleperformance" → "Hub de Gestión / Manage Hub" (UI, 4 idiomas; rutas intactas).
- [x] **Cap-2** Consultor: las 7 rutas /api/consultant/* usan requireCapability (consultant.*).
- [x] **Cap-3** Plataforma: los ~41 endpoints agents/benchmarks/cms/sales/knowledge YA estaban
      blindados con requireSuperAdmin ≡ platform.* (solo rowiverse). No requieren migración.
- [x] **Cap-4 (parcial)** Nav: secciones `aiAutomation` y `sales` marcadas `superOnly`
      (eran visibles al cliente — la fuga que Eduardo señaló). Badge "TP" → "HUB".

- [x] **Cap-4 (completo)** Nav dinámica REAL por capabilities:
      - `GET /api/account/capabilities` resuelve scope+plan y lista lo concedido.
      - `AdminUserContext` carga las caps y expone `can(cap)`.
      - `Sidebar`: secciones/items aceptan `capability`; Manage Hub pasó de superOnly a
        `capability:"tp.dashboard"` → un HR/team-lead con plan lo VE en el menú; el cliente
        sigue sin ver platform.* (agentes/ventas/knowledge marcados superOnly).

### Estado: SISTEMA DE MÓDULOS COMPLETO Y EN PRODUCCIÓN
Tú ves todo · HR ve Manage Hub si su plan lo activa · Consultor scoped a sus clientes ·
lo de plataforma nunca aparece para el cliente. Cada ruta protegida por requireCapability;
el menú refleja exactamente rol+plan.

### Único pendiente (requiere a Eduardo — NO se aplicó para no romper el build)
- **E1 directUrl Neon**: añadir `directUrl = env("DIRECT_URL")` al datasource de
  `prisma/schema.prisma`. NO se commiteó porque si `DIRECT_URL` no existe en Vercel, el build
  (`prisma db push`) falla. Acción de 1 línea cuando confirmes que la env está puesta.

### Mejora futura opcional (no bloqueante)
- Panel de planes: mapear cada `planFlag` ↔ módulo vendible ("este plan incluye Manage Hub")
  para vender por módulo desde la UI de pricing.
