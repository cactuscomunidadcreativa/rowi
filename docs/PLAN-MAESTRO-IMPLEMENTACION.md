# PLAN MAESTRO DE IMPLEMENTACION - ROWI

**Fecha**: 2025-01-30
**Version**: 1.0
**Estado**: Pendiente de aprobacion

---

## RESUMEN EJECUTIVO

Este documento consolida TODAS las mejoras, correcciones y nuevas funcionalidades identificadas durante la sesion de analisis del sistema Rowi. El objetivo es tener una hoja de ruta clara antes de comenzar cualquier implementacion.

---

## PARTE 1: LIMPIEZA TECNICA (Schema y Codigo)

### 1.1 Bugs Criticos

| # | Problema | Ubicacion | Solucion | Riesgo | Tiempo |
|---|----------|-----------|----------|--------|--------|
| 1 | Doble relacion en RowiCommunity | schema.prisma L2642, L2657 | Eliminar linea 2657 | 🟢 Bajo | 5 min |

### 1.2 Modelos No Utilizados (Eliminar)

| # | Modelo | Uso Actual | Accion | Riesgo |
|---|--------|------------|--------|--------|
| 1 | `AvatarStreak` | Solo en seed.ts | Eliminar del schema | 🟢 Bajo |

### 1.3 Modelos Duplicados (Unificar)

| # | Modelo Actual | Migrar A | Cambios Necesarios | Riesgo | Tiempo |
|---|---------------|----------|-------------------|--------|--------|
| 1 | `AvatarMilestone` | `Achievement` con categoria AVATAR | Modificar avatar-evolution.ts (4 lugares) | 🟡 Medio | 2-3h |
| 2 | `AuditLog` + `ActivityLog` | `AuditLog` unificado con campo type | Buscar usos y migrar | 🟡 Medio | 2h |

### 1.4 Enums Duplicados (Unificar)

| # | Enum 1 | Enum 2 | Accion |
|---|--------|--------|--------|
| 1 | `MetricPeriod` | `MetricPeriodType` | Eliminar MetricPeriodType, usar MetricPeriod |

### 1.5 Problemas de UX en Filtros de Benchmarks

| # | Problema | Ubicacion | Solucion | Prioridad |
|---|----------|-----------|----------|-----------|
| 1 | Paises NO se filtran por region | API + UI benchmarks | Agregar mapeo pais→region, filtrar dinamicamente | Alta |
| 2 | No hay busqueda en dropdowns | UI benchmarks (select nativo) | Reemplazar con componente searchable (react-select o cmdk) | Alta |
| 3 | Demasiadas opciones sin agrupar | Filtros de pais/sector | Agrupar por region, mostrar conteo | Media |

**Archivos afectados**:
- `src/app/api/admin/benchmarks/[id]/route.ts` - Agregar countryToRegion mapping
- `src/app/hub/admin/benchmarks/compare/page.tsx` - Filtros dinamicos + searchable
- `src/app/hub/admin/benchmarks/[id]/top-performers/page.tsx` - Filtros dinamicos + searchable
- `src/app/hub/admin/benchmarks/[id]/stats/page.tsx` - Filtros dinamicos + searchable

**Solucion tecnica**:
```typescript
// 1. API devuelve mapeo pais-region
{
  countries: [...],
  regions: [...],
  countryToRegion: {
    "Mexico": "Latin America",
    "Brazil": "Latin America",
    "Germany": "Europe",
    // ...
  }
}

// 2. Frontend filtra paises cuando se selecciona region
const filteredCountries = selectedRegion
  ? countries.filter(c => countryToRegion[c.value] === selectedRegion)
  : countries;

// 3. Componente searchable con react-select o similar
<SearchableSelect
  options={filteredCountries}
  placeholder="Buscar pais..."
  onChange={handleCountryChange}
/>
```

---

## PARTE 2: JERARQUIA ORGANIZACIONAL

### 2.1 Problema Actual

El sistema actual NO soporta estructuras como:

```
Six Seconds (mundo)
├── Staff
│   ├── LATAM
│   ├── EMEA
│   └── APAC
├── Coaches
└── Clientes
```

### 2.2 Solucion Propuesta: Agregar Jerarquia a Organization

```prisma
model Organization {
  // Campos existentes...

  // NUEVOS CAMPOS
  parentId           String?
  parent             Organization?  @relation("OrgHierarchy", fields: [parentId], references: [id])
  children           Organization[] @relation("OrgHierarchy")

  unitType           OrgUnitType    @default(ORGANIZATION)
  inheritPermissions Boolean        @default(true)

  // Para benchmarks por organizacion
  benchmarks         Benchmark[]
}

enum OrgUnitType {
  ORGANIZATION  // Empresa principal (Six Seconds)
  DIVISION      // Division (Staff, Coaches, Clientes)
  REGION        // Region (LATAM, EMEA, APAC)
  TEAM          // Equipo especifico
  PROJECT       // Proyecto temporal
}
```

### 2.3 Cambios en Sistema de Permisos

```typescript
// Nuevo flujo de verificacion de permisos
async function hasAccess(userId, scopeType, scopeId) {
  // 1. Verificar permiso directo
  const directPermission = await checkDirectPermission(userId, scopeType, scopeId);
  if (directPermission) return true;

  // 2. NUEVO: Verificar permisos heredados de organizacion padre
  if (scopeType === 'organization') {
    const org = await getOrganizationWithParents(scopeId);
    for (const parentOrg of org.parents) {
      const parentPermission = await checkDirectPermission(userId, 'organization', parentOrg.id);
      if (parentPermission && parentOrg.inheritPermissions) return true;
    }
  }

  return false;
}
```

### 2.4 Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `prisma/schema.prisma` | Agregar parentId, unitType, inheritPermissions a Organization |
| `src/core/auth/hasAccess.ts` | Logica de herencia de permisos |
| `src/core/auth/policies/policy.admin.ts` | Verificar jerarquia |
| `src/app/api/admin/organizations/` | CRUD con jerarquia |

---

## PARTE 3: ROLES Y VISTAS ESPECIALIZADAS

### 3.1 Nuevos Roles Necesarios

| Rol | Descripcion | Puede Ver | Puede Hacer |
|-----|-------------|-----------|-------------|
| **COACH** | Coach certificado | Sus clientes, metricas agregadas | Asignar tareas, ver progreso |
| **MANAGER** | Gerente de equipo | Su equipo directo, benchmarks de equipo | Asignar metas, ver ROI |
| **SUPERVISOR** | Supervisor de region | Multiples equipos, comparativas | Reportes ejecutivos |
| **HR_ADMIN** | Admin de RRHH | Toda la organizacion | Configurar, importar datos |

### 3.2 Coach Vision

**Proposito**: Dashboard para coaches que trabajan con clientes

**Funcionalidades**:
- [ ] Lista de clientes asignados
- [ ] Estado EQ de cada cliente (ultimo snapshot)
- [ ] Progreso del avatar de cada cliente
- [ ] Metricas agregadas del grupo
- [ ] Alertas: clientes sin actividad, rachas perdidas
- [ ] Asignar tareas/ejercicios
- [ ] Programar sesiones

**API Endpoints Nuevos**:
```
GET  /api/coach/clients              → Lista de clientes
GET  /api/coach/clients/[id]/eq      → EQ de un cliente
GET  /api/coach/clients/[id]/progress → Progreso detallado
POST /api/coach/clients/[id]/tasks   → Asignar tarea
GET  /api/coach/dashboard            → Metricas agregadas
```

### 3.3 Manager Vision

**Proposito**: Dashboard para managers que supervisan equipos

**Funcionalidades**:
- [ ] Vista de equipo con metricas EQ agregadas
- [ ] Benchmark del equipo vs organizacion
- [ ] Affinity map del equipo
- [ ] Identificar top performers y areas de mejora
- [ ] ROI: correlacion EQ con KPIs de negocio
- [ ] Plan de accion por empleado

**API Endpoints Nuevos**:
```
GET  /api/manager/team                    → Miembros del equipo
GET  /api/manager/team/benchmark          → Benchmark del equipo
GET  /api/manager/team/affinity           → Mapa de afinidad
GET  /api/manager/team/roi                → Metricas de ROI
GET  /api/manager/team/[userId]/plan      → Plan de accion individual
POST /api/manager/team/[userId]/goals     → Asignar metas
```

### 3.4 Supervisor Vision

**Proposito**: Vista ejecutiva para supervisores de multiples equipos/regiones

**Funcionalidades**:
- [ ] Comparar equipos/regiones
- [ ] Drill-down: Region → Equipo → Individuo
- [ ] Tendencias temporales
- [ ] Alertas de equipos en riesgo
- [ ] Reportes ejecutivos exportables

**API Endpoints Nuevos**:
```
GET  /api/supervisor/regions              → Regiones bajo supervision
GET  /api/supervisor/regions/compare      → Comparar regiones
GET  /api/supervisor/reports/executive    → Reporte ejecutivo
GET  /api/supervisor/alerts               → Alertas de equipos
```

---

## PARTE 4: SISTEMA DE ROI Y PLANES DE ACCION

### 4.1 Modelo de ROI

**Concepto**: Correlacionar metricas EQ con resultados de negocio

```prisma
model BusinessMetric {
  id              String   @id @default(cuid())
  organizationId  String
  name            String   // "Ventas", "Retencion", "NPS"
  type            MetricType // CURRENCY, PERCENTAGE, NUMBER
  value           Float
  period          String   // "2024-Q1"

  organization    Organization @relation(...)
}

model RoiAnalysis {
  id              String   @id @default(cuid())
  organizationId  String
  period          String

  // Correlaciones calculadas
  eqVsSales       Float?   // Correlacion EQ total vs ventas
  eqVsRetention   Float?   // Correlacion EQ vs retencion
  topDrivers      Json     // Competencias que mas impactan

  // ROI estimado
  estimatedRoi    Float?   // % mejora estimada
  confidence      Float?   // Nivel de confianza

  createdAt       DateTime @default(now())
}
```

### 4.2 Planes de Accion

**Concepto**: Recomendaciones personalizadas basadas en gaps EQ

```prisma
model ActionPlan {
  id              String   @id @default(cuid())
  userId          String
  createdById     String   // Manager o Coach que lo creo

  targetOutcome   String   // "effectiveness", "relationships"
  currentScore    Float
  targetScore     Float
  deadline        DateTime?

  status          ActionPlanStatus @default(ACTIVE)

  // Acciones especificas
  actions         ActionPlanItem[]

  user            User @relation(...)
  createdBy       User @relation(...)
}

model ActionPlanItem {
  id              String   @id @default(cuid())
  planId          String

  competency      String   // "EMP", "NG", etc.
  action          String   // "Completar modulo de empatia"
  resourceUrl     String?  // Link a recurso
  dueDate         DateTime?
  completed       Boolean  @default(false)
  completedAt     DateTime?

  plan            ActionPlan @relation(...)
}

enum ActionPlanStatus {
  DRAFT
  ACTIVE
  COMPLETED
  ARCHIVED
}
```

### 4.3 Generacion Automatica de Planes

```typescript
// Logica para generar plan de accion automatico
async function generateActionPlan(userId: string, targetOutcome: string) {
  // 1. Obtener perfil EQ actual
  const eqProfile = await getLatestEqSnapshot(userId);

  // 2. Obtener top performers para ese outcome
  const topPerformers = await getTopPerformerProfile(targetOutcome);

  // 3. Calcular gaps (donde el usuario esta por debajo del P75 de top performers)
  const gaps = calculateGaps(eqProfile, topPerformers);

  // 4. Priorizar gaps por impacto (usando correlaciones)
  const prioritizedGaps = prioritizeByImpact(gaps, targetOutcome);

  // 5. Generar acciones recomendadas
  const actions = await generateRecommendedActions(prioritizedGaps);

  return {
    targetOutcome,
    currentScore: eqProfile[targetOutcome],
    targetScore: topPerformers.avg[targetOutcome],
    gaps: prioritizedGaps,
    actions,
  };
}
```

---

## PARTE 5: MEJORAS EN BENCHMARKS

### 5.1 Pagina Compare - Mejoras

| # | Mejora | Descripcion | Prioridad |
|---|--------|-------------|-----------|
| 1 | Selector de Outcome | Agregar dropdown para seleccionar outcome objetivo | Alta |
| 2 | Top Performers por Segmento | Mostrar perfil de top performers para cada segmento | Alta |
| 3 | Insight automatico | "EMP es clave en LATAM, NG en EMEA" | Media |
| 4 | Comparar anos | Agregar filtro de ano y comparativa temporal | Alta |

### 5.2 Pagina Top Performers - Mejoras

| # | Mejora | Descripcion | Prioridad |
|---|--------|-------------|-----------|
| 1 | Filtro de Ano | Agregar filtro year a la UI (ya existe en API) | Alta |
| 2 | Comparar Anos | Modo "2023 vs 2024" para ver evolucion | Media |
| 3 | Evolucion Temporal | Grafico de tendencia de top performers | Baja |

### 5.3 Benchmarks por Organizacion Jerarquica

| # | Funcionalidad | Descripcion |
|---|---------------|-------------|
| 1 | Benchmark por Organization | Cada org/sub-org puede tener su benchmark |
| 2 | Agregacion hacia arriba | LATAM contribuye a Staff, Staff a Six Seconds |
| 3 | Comparar hermanos | LATAM vs EMEA vs APAC |
| 4 | Drill-down | Six Seconds → Staff → LATAM → Equipo X |

---

## PARTE 6: AFFINITY ENTRE EQUIPOS

### 6.1 Affinity Actual

- Solo calcula afinidad entre 2 usuarios individuales
- Basado en competencias EQ y brain style

### 6.2 Affinity de Equipos (Nuevo)

```typescript
interface TeamAffinityResult {
  team1: { id: string; name: string; avgProfile: EqProfile };
  team2: { id: string; name: string; avgProfile: EqProfile };

  // Afinidad agregada
  overallScore: number; // 0-135

  // Desglose
  growthAffinity: number;
  collaborationAffinity: number;
  understandingAffinity: number;

  // Insights
  strengths: string[];      // "Ambos equipos son fuertes en EMP"
  opportunities: string[];  // "Team1 puede aportar NG a Team2"
  risks: string[];          // "Posible friccion en estilos de decision"
}
```

### 6.3 Casos de Uso

1. **Fusionar equipos**: Antes de fusionar LATAM y EMEA, ver compatibilidad
2. **Asignar proyectos**: Que equipos trabajan mejor juntos
3. **Identificar silos**: Equipos con baja afinidad que deberian colaborar mas

---

## PARTE 7: ORDEN DE IMPLEMENTACION

### Fase 1: Limpieza Tecnica (1-2 dias)
- [ ] Arreglar bug doble relacion RowiCommunity
- [ ] Eliminar AvatarStreak del schema
- [ ] Unificar enums duplicados
- [ ] Correr migracion

### Fase 2: Jerarquia Organizacional (3-5 dias)
- [ ] Modificar schema: parentId, unitType, inheritPermissions
- [ ] Actualizar hasAccess con herencia
- [ ] APIs CRUD para organizaciones jerarquicas
- [ ] UI basica de navegacion jerarquica

### Fase 3: Mejoras Benchmarks (2-3 dias)
- [ ] Agregar filtro year a Top Performers UI
- [ ] Agregar selector outcome a Compare
- [ ] Calcular top performers por segmento
- [ ] Benchmark por Organization

### Fase 4: Roles y Vistas (5-7 dias)
- [ ] Modelo de roles (COACH, MANAGER, SUPERVISOR)
- [ ] Coach Vision: dashboard + APIs
- [ ] Manager Vision: dashboard + APIs
- [ ] Supervisor Vision: dashboard + APIs

### Fase 5: ROI y Planes de Accion (5-7 dias)
- [ ] Modelos BusinessMetric, RoiAnalysis, ActionPlan
- [ ] API de correlacion EQ vs KPIs
- [ ] Generador automatico de planes de accion
- [ ] UI para crear/gestionar planes

### Fase 6: Affinity de Equipos (2-3 dias)
- [ ] Calcular perfil promedio de equipo
- [ ] Algoritmo de afinidad entre equipos
- [ ] UI de visualizacion
- [ ] Integracion con jerarquia organizacional

---

## PARTE 8: RESUMEN DE ARCHIVOS A CREAR/MODIFICAR

### Nuevos Archivos

```
src/app/api/coach/
├── clients/route.ts
├── clients/[id]/eq/route.ts
├── clients/[id]/progress/route.ts
├── clients/[id]/tasks/route.ts
└── dashboard/route.ts

src/app/api/manager/
├── team/route.ts
├── team/benchmark/route.ts
├── team/affinity/route.ts
├── team/roi/route.ts
└── team/[userId]/plan/route.ts

src/app/api/supervisor/
├── regions/route.ts
├── regions/compare/route.ts
├── reports/executive/route.ts
└── alerts/route.ts

src/app/(app)/coach/
├── page.tsx
├── clients/page.tsx
└── clients/[id]/page.tsx

src/app/(app)/manager/
├── page.tsx
├── team/page.tsx
└── roi/page.tsx

src/app/(app)/supervisor/
├── page.tsx
├── regions/page.tsx
└── reports/page.tsx

src/services/
├── team-affinity.ts
├── action-plan-generator.ts
└── roi-calculator.ts

src/lib/benchmarks/
└── team-benchmark.ts
```

### Archivos a Modificar

```
prisma/schema.prisma
├── Organization (agregar parentId, unitType, inheritPermissions)
├── ActionPlan (nuevo modelo)
├── ActionPlanItem (nuevo modelo)
├── BusinessMetric (nuevo modelo)
├── RoiAnalysis (nuevo modelo)
└── Eliminar AvatarStreak

src/core/auth/
├── hasAccess.ts (herencia de permisos)
├── policies/policy.admin.ts
└── policies/policy.scope.ts

src/app/hub/admin/benchmarks/
├── compare/page.tsx (agregar selector outcome, filtro year)
└── [id]/top-performers/page.tsx (agregar filtro year)

src/services/
└── avatar-evolution.ts (migrar AvatarMilestone → Achievement)
```

---

## PARTE 9: ESTIMACION DE TIEMPO TOTAL

| Fase | Tiempo Estimado | Dependencias |
|------|-----------------|--------------|
| Fase 1: Limpieza | 1-2 dias | Ninguna |
| Fase 2: Jerarquia | 3-5 dias | Fase 1 |
| Fase 3: Benchmarks | 2-3 dias | Fase 2 |
| Fase 4: Roles/Vistas | 5-7 dias | Fase 2 |
| Fase 5: ROI/Planes | 5-7 dias | Fase 4 |
| Fase 6: Affinity Equipos | 2-3 dias | Fase 2 |
| **TOTAL** | **18-27 dias** | |

---

## PARTE 10: PREGUNTAS PENDIENTES

Antes de comenzar, necesito clarificar:

1. **Prioridad de fases**: ¿Cual es mas urgente? ¿ROI o Coach Vision?

2. **BusinessMetrics**: ¿De donde vendran los KPIs de negocio? ¿Importacion manual o integracion?

3. **Generacion de planes**: ¿Quieres que los planes se generen automaticamente o que un coach/manager los cree manualmente?

4. **Affinity de equipos**: ¿Debe ser visible para todos o solo para admins/supervisores?

5. **Permisos de Coach**: ¿Un coach puede ver datos sensibles de sus clientes o solo metricas agregadas?

---

## NOTAS

- **No hacer push a GitHub** hasta que todo este estable en local
- **Hacer backup** de la base de datos antes de cada migracion
- **Testear localmente** cada cambio antes de continuar
- Este documento se actualizara conforme avancemos

---

*Documento generado por Claude Code - 2025-01-30*
