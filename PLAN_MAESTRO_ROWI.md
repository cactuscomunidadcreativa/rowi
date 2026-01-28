# PLAN MAESTRO - ROWI SIA
## Sistema de Inteligencia Emocional Aumentada

> **Directorio de trabajo:** `/Users/eduardogonzalez/Desktop/rowi`
> **Fecha:** 2026-01-27
> **Estado:** En desarrollo activo

---

## ARQUITECTURA DEL SISTEMA

### Stack Tecnológico
- **Frontend:** Next.js 15 + React 19 + TailwindCSS
- **Backend:** Next.js API Routes + Prisma ORM
- **Base de datos:** PostgreSQL (Supabase/Neon)
- **IA:** OpenAI GPT-4o-mini (multi-agente)
- **Auth:** NextAuth.js v4
- **CMS:** Sanity (opcional)

### Modelo de Datos Jerárquico
```
System (Cactus Global)
  └── SuperHub (Grupo de hubs)
       └── Hub (Unidad organizacional)
            └── Organization (División/área)
                 └── Tenant (Empresa/cuenta)
                      └── User (Usuario final)
```

### Agentes de IA (Modelo Six Seconds)
| Agente | Slug | Función |
|--------|------|---------|
| Super Rowi | `super` | Coordinador principal |
| EQ Coach | `eq` | Inteligencia emocional |
| Affinity Coach | `affinity` | Relaciones interpersonales |
| ECO Coach | `eco` | Comunicación emocional |
| Sales Coach | `sales` | Ventas emocionales |
| Trainer | `trainer` | Hábitos y entrenamiento |

---

## ESTADO ACTUAL DEL PROYECTO

### Errores TypeScript
- **Inicial:** 429 errores
- **Actual:** ~400 errores (estimado)
- **Objetivo:** 0 errores

### Funcionalidades Implementadas
- [x] Sistema de autenticación básico
- [x] Estructura multi-tenant
- [x] Agentes de IA funcionando
- [x] Dashboard de EQ
- [x] Sistema de afinidad

### En Desarrollo
- [ ] Cultura corporativa en agentes (70% completado)
- [ ] Control de acceso por plan de suscripción (completado en helper)
- [ ] Gamificación (Avatar Evolution)
- [ ] Integraciones externas

---

## FASE 1: LIMPIEZA Y ERRORES TYPESCRIPT

### 1.1 Archivos a Eliminar
```bash
# APIs de debug/test
rm src/app/api/hello/route.ts
rm src/app/api/debug-auth/route.ts
rm src/app/api/debug-auth/version/route.ts
rm src/app/api/env-check/route.ts

# Scripts obsoletos
rm scripts/fix_imports_v2.shn
rm scripts/fix_imports.sh
rm scripts/fix_imports_v2.sh
rm scripts/restructure_rowi.sh
rm scripts/restructure_rowi_v2.sh
rm scripts/cleanup-bak-files.ts
rm scripts/cleanup-rowi-structure.ts
rm scripts/clear-translations.ts
```

### 1.2 Archivos Críticos a Arreglar
| Archivo | Errores | Problema |
|---------|---------|----------|
| `src/sanity/index.ts` | 9 | Archivo vacío |
| `batch/history/route.ts` | 15 | Variables sin declarar |
| `getServerAuthUser()` | 41+ | Firma incorrecta |
| `src/core/auth/config.ts` | 20 | Config NextAuth |

### 1.3 Sincronización Prisma
Campos faltantes detectados:
- `closeness` en CommunityMember
- `profileEQ` en User
- `plan` en User
- `superHubId` en varios modelos
- `memberEqSnapshot` en AffinitySnapshot

**Acción:** Verificar schema y agregar campos faltantes

---

## FASE 2: CULTURA CORPORATIVA EN AGENTES

### 2.1 Estado Actual

#### Archivo Helper Creado ✅
**Ubicación:** `/src/ai/agents/getAgentConfig.ts`

Funciones implementadas:
```typescript
// Cargar configuración del agente
getAgentConfig(agentSlug, tenantId)

// Construir prompt con cultura
buildCultureEnrichedPrompt(basePrompt, config, language)

// Agentes según plan de suscripción
getAgentsFromPlan(userId, tenantId)

// Agentes habilitados (plan + controles)
getUserEnabledAgents(userId, tenantId)

// Info del plan para UI
getUserPlanInfo(userId, tenantId)

// Cultura unificada del tenant
getTenantCulture(tenantId, userId)

// Prompt especial para SuperAgent
buildSuperAgentPrompt(basePrompt, tenantCulture, language)

// Verificar acceso a agente
canUserAccessAgent(userId, agentSlug, tenantId)
```

#### Planes de Suscripción Definidos ✅
```typescript
PLAN_AGENTS = {
  free: ["super", "eq"],
  personal: ["super", "eq", "trainer", "eco"],
  pro: ["super", "eq", "trainer", "eco", "affinity"],
  enterprise: ["super", "eq", "affinity", "eco", "sales", "trainer"],
  "global-ai": ["super", "eq", "affinity", "eco", "sales", "trainer"],
}
```

#### Agentes Actualizados ✅
- [x] `super.ts` - Usa `getTenantCulture()` y `buildSuperAgentPrompt()`
- [x] `trainer.ts` - Usa `getAgentConfig()` y `buildCultureEnrichedPrompt()`
- [x] `sales.ts` - Usa `getAgentConfig()` y `buildCultureEnrichedPrompt()`
- [x] `eco.ts` - Usa `getAgentConfig()` y `buildCultureEnrichedPrompt()`
- [x] `affinity.ts` - Usa `getAgentConfig()` y `buildCultureEnrichedPrompt()`

### 2.2 Pendiente

#### Actualizar EQ Agent
**Archivo:** `/src/ai/agents/eq.ts`

```typescript
// Agregar import
import { getAgentConfig, buildCultureEnrichedPrompt } from "./getAgentConfig";

// En el método run():
const agentConfig = await getAgentConfig("eq", tenantId);
const systemPrompt = buildCultureEnrichedPrompt(basePrompt, agentConfig, language);
```

#### Agregar Campos al Schema Prisma
**Archivo:** `/prisma/schema.prisma`

```prisma
model AgentConfig {
  // ... campos existentes

  // Nuevos campos de cultura
  culturePrompt      String?
  companyValues      String[]              @default([])
  companyMission     String?
  companyTone        String?
  industryContext    String?
  customInstructions String?
  brandVoice         Json?
}
```

#### Crear Seed con Cultura de Ejemplo
**Archivo:** `/prisma/seed.ts`

```typescript
const tenantCulture = {
  culturePrompt: `CULTURA ROWI: Somos una plataforma de inteligencia emocional
que busca humanizar la tecnología y democratizar el desarrollo personal.`,
  companyValues: [
    "Empatía Radical",
    "Crecimiento Continuo",
    "Autenticidad",
    "Colaboración Consciente",
    "Innovación con Propósito"
  ],
  companyMission: "Democratizar la inteligencia emocional para transformar
vidas, equipos y organizaciones.",
  companyTone: "Cálido, inspirador, cercano pero profesional. Usamos
'nosotros' y hablamos como un coach empático.",
  industryContext: "Tecnología educativa y desarrollo humano (EdTech/HRTech)",
  brandVoice: {
    formalityLevel: "semi-formal",
    useEmojis: true,
    emojiFrequency: "moderado",
    preferredEmojis: ["🧠", "💡", "🌱", "✨", "🎯", "❤️"],
    avoidWords: ["problema", "difícil", "imposible", "fracaso"],
    preferWords: ["oportunidad", "crecimiento", "posibilidad", "aprendizaje"]
  }
};
```

#### Verificación de Acceso en Router
**Archivo:** `/src/ai/agents/router.ts`

```typescript
import { canUserAccessAgent } from "./getAgentConfig";

// Antes de ejecutar el agente:
const hasAccess = await canUserAccessAgent(userId, agentSlug, tenantId);
if (!hasAccess) {
  return {
    error: "No tienes acceso a este agente según tu plan de suscripción",
    upgrade: true
  };
}
```

#### Crear API para Editar Cultura
**Archivo:** `/src/app/api/admin/culture/route.ts`

Endpoints:
- `GET /api/admin/culture` - Obtener cultura del tenant
- `PUT /api/admin/culture` - Actualizar cultura del tenant

#### Crear UI para Administrar Cultura
**Ubicación:** `/src/app/[tenant]/admin/culture/page.tsx`

Formulario para editar:
- Prompt de cultura
- Valores de la empresa (array editable)
- Misión
- Tono de comunicación
- Contexto de industria
- Instrucciones personalizadas
- Voz de marca (JSON editor visual)

---

## FASE 3: MIGRAR MODELOS DE ROWI 2.1

### Modelos de Alta Prioridad

#### Gamificación (Avatar Evolution)
```prisma
model AvatarEvolution {
  id           String       @id @default(cuid())
  userId       String       @unique
  stage        AvatarStage  @default(EGG)
  xp           Int          @default(0)
  level        Int          @default(1)
  streakDays   Int          @default(0)
  lastActive   DateTime     @default(now())
  achievements String[]     @default([])
  customization Json?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  user         User         @relation(fields: [userId], references: [id])
  milestones   AvatarMilestone[]
  streaks      AvatarStreak[]
}

model AvatarMilestone {
  id          String        @id @default(cuid())
  avatarId    String
  type        MilestoneType
  unlockedAt  DateTime      @default(now())
  xpAwarded   Int           @default(0)
  metadata    Json?
  avatar      AvatarEvolution @relation(fields: [avatarId], references: [id])
}

model AvatarStreak {
  id        String   @id @default(cuid())
  avatarId  String
  startDate DateTime
  endDate   DateTime?
  length    Int      @default(0)
  isActive  Boolean  @default(true)
  avatar    AvatarEvolution @relation(fields: [avatarId], references: [id])
}

enum AvatarStage {
  EGG
  HATCHING
  BABY
  YOUNG
  ADULT
  WISE
}

enum MilestoneType {
  PROFILE_COMPLETE
  SEI_COMPLETE
  FIRST_COACH_SESSION
  SEVEN_DAY_STREAK
  THIRTY_DAY_STREAK
  AFFINITY_ANALYSIS
  COMMUNITY_JOIN
  FIRST_REFLECTION
  FIRST_DECISION
  EQ_IMPROVEMENT
  TOP_PERFORMER
  MENTOR
  INTEGRATIONS_SETUP
  CUSTOM
}
```

#### Inteligencia Colectiva
```prisma
model TopPerformerMetric {
  id          String   @id @default(cuid())
  tenantId    String
  userId      String
  metricType  String   // "eq_growth", "engagement", "collaboration"
  value       Float
  rank        Int
  period      String   // "weekly", "monthly", "quarterly"
  calculatedAt DateTime @default(now())
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  user        User     @relation(fields: [userId], references: [id])
}

model CollectivePattern {
  id          String   @id @default(cuid())
  tenantId    String
  patternType String
  insights    Json
  confidence  Float
  detectedAt  DateTime @default(now())
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
}

model EmotionalROI {
  id          String   @id @default(cuid())
  tenantId    String
  period      String
  investment  Json     // hours, resources
  outcomes    Json     // productivity, retention, satisfaction
  roiScore    Float
  calculatedAt DateTime @default(now())
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
}
```

#### Integraciones
```prisma
model IntegrationConnection {
  id          String              @id @default(cuid())
  tenantId    String
  platform    IntegrationPlatform
  accessToken String?
  refreshToken String?
  config      Json?
  isActive    Boolean             @default(true)
  connectedAt DateTime            @default(now())
  tenant      Tenant              @relation(fields: [tenantId], references: [id])
}

enum IntegrationPlatform {
  SLACK
  TEAMS
  WHATSAPP
  GOOGLE_CALENDAR
  OUTLOOK_CALENDAR
  ZOOM
  EMAIL
  CUSTOM
}
```

---

## FASE 4: FUNCIONALIDADES NUEVAS

### 4.1 Dashboard Mejorado
- [ ] Gráficas de evolución EQ
- [ ] Comparativas de equipo
- [ ] ROI emocional
- [ ] Rankings y gamificación

### 4.2 Sistema de Notificaciones
- [ ] Modelo NotificationQueue
- [ ] Push notifications
- [ ] Email digests
- [ ] Slack/Teams webhooks

### 4.3 Calendario de Bienestar
- [ ] Modelo CalendarEvent
- [ ] Check-ins programados
- [ ] Recordatorios de hábitos
- [ ] Sesiones de coaching

### 4.4 Integraciones Externas
- [ ] Slack bot
- [ ] Teams app
- [ ] WhatsApp Business
- [ ] Calendario Google/Outlook

---

## COMANDOS ÚTILES

```bash
# Ir al directorio correcto
cd /Users/eduardogonzalez/Desktop/rowi

# Ver errores TypeScript
npx tsc --noEmit | head -100

# Contar errores
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l

# Ver estado de git
git status

# Verificar schema Prisma
npx prisma validate

# Generar cliente Prisma
npx prisma generate

# Crear migración
npx prisma migrate dev --name nombre_migracion

# Ejecutar seed
npx prisma db seed

# Iniciar desarrollo
npm run dev

# Build de producción
npm run build
```

---

## ESTRUCTURA DE ARCHIVOS CLAVE

```
/Users/eduardogonzalez/Desktop/rowi/
├── prisma/
│   ├── schema.prisma        # Modelo de datos
│   └── seed.ts              # Datos iniciales
├── src/
│   ├── ai/
│   │   ├── agents/
│   │   │   ├── getAgentConfig.ts  ← Helper principal (NUEVO)
│   │   │   ├── super.ts           ← Coordinador
│   │   │   ├── eq.ts              ← EQ Coach
│   │   │   ├── affinity.ts        ← Affinity Coach
│   │   │   ├── eco.ts             ← ECO Coach
│   │   │   ├── sales.ts           ← Sales Coach
│   │   │   ├── trainer.ts         ← Trainer
│   │   │   └── router.ts          ← Enrutador de agentes
│   │   ├── client/
│   │   │   └── registerUsage.ts   # Registro de uso IA
│   │   └── prompts/
│   │       └── modules/           # Builders de prompts
│   ├── app/
│   │   ├── api/                   # API routes
│   │   ├── [tenant]/              # Rutas multi-tenant
│   │   └── auth/                  # Autenticación
│   ├── components/
│   │   ├── ui/                    # Componentes base (shadcn)
│   │   ├── dashboard/             # Dashboard EQ
│   │   ├── rowi/                  # Chat y agentes
│   │   └── shared/                # Compartidos
│   ├── core/
│   │   ├── auth/                  # Configuración auth
│   │   └── prisma.ts              # Cliente Prisma
│   └── data/
│       ├── sixseconds/            # Modelo Six Seconds
│       ├── emotions/              # Emociones
│       └── exercises/             # Ejercicios EQ
├── PLAN_MAESTRO_ROWI.md           ← Este archivo
├── PLAN_ACCION_ROWI.md            # Plan de errores TS
├── ANALISIS_SCHEMAS.md            # Comparativa schemas
└── PLAN_CULTURA_AGENTES.md        # Plan cultura (detallado)
```

---

## PRIORIDADES INMEDIATAS

1. **Completar EQ Agent** - Agregar cultura corporativa
2. **Migrar campos Prisma** - Agregar campos de cultura a AgentConfig
3. **Ejecutar migración** - `npx prisma migrate dev`
4. **Arreglar errores críticos** - sanity/index.ts, auth/config.ts
5. **Verificar router** - Agregar validación de acceso por plan

---

## NOTAS IMPORTANTES

1. **Directorio correcto:** Siempre trabajar en `/Users/eduardogonzalez/Desktop/rowi` (NO rowi2.1)

2. **Los prompts base NO se modifican** - La cultura solo se AGREGA como contexto adicional

3. **Prioridad de planes:**
   - Primero: `Membership.planId` (plan empresarial)
   - Segundo: `User.planId` (plan personal)

4. **SuperAgent siempre disponible** - Es el único agente que no se puede desactivar

5. **Modelo Six Seconds:** El framework de inteligencia emocional usado es KCG (Know Yourself, Choose Yourself, Give Yourself)

---

## HISTORIAL DE CAMBIOS

| Fecha | Cambio |
|-------|--------|
| 2026-01-27 | Creación inicial del plan maestro |
| 2026-01-27 | Implementación de cultura corporativa en agentes |
| 2026-01-27 | Definición de planes de suscripción |
| 2026-01-27 | Actualización de 5/6 agentes con cultura |
