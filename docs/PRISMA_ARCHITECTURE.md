# 🦉 ROWI - Arquitectura de Base de Datos (Prisma Schema)

> Documento generado: 2025-01-31
> Total de modelos: 120+
> Base de datos: PostgreSQL (Neon)

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Jerarquía del Ecosistema](#jerarquía-del-ecosistema)
3. [Módulos por Dominio](#módulos-por-dominio)
4. [Sistema de Roles y Permisos](#sistema-de-roles-y-permisos)
5. [Relaciones Clave](#relaciones-clave)
6. [Diagramas](#diagramas)

---

## 🌐 Visión General

Rowi es una plataforma de inteligencia emocional que soporta:
- **Multi-tenancy**: Múltiples organizaciones independientes
- **Jerarquía flexible**: Desde usuarios individuales hasta corporaciones globales
- **Roles múltiples**: Un usuario puede tener diferentes roles en diferentes contextos
- **Federación**: Conexión entre organizaciones vía RowiVerse

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              🌍 ROWIVERSE                                    │
│                     (Ecosistema Global de Rowi)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   System    │  │  SuperHub   │  │  SuperHub   │  │  SuperHub   │        │
│  │  (Global)   │  │ Six Seconds │  │   Apple     │  │  Coca-Cola  │        │
│  └─────────────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│                          │                │                │                │
│         ┌────────────────┼────────────────┼────────────────┤                │
│         ▼                ▼                ▼                ▼                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    Hub      │  │    Hub      │  │    Hub      │  │    Hub      │        │
│  │   LATAM     │  │   EMEA      │  │   APAC      │  │    USA      │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │                │
│    ┌────┴────┐      ┌────┴────┐      ┌────┴────┐      ┌────┴────┐          │
│    ▼         ▼      ▼         ▼      ▼         ▼      ▼         ▼          │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│ │Tenant│ │Tenant│ │Tenant│ │Tenant│ │Tenant│ │Tenant│ │Tenant│ │Tenant│    │
│ │Mexico│ │Peru  │ │Spain │ │UK    │ │Japan │ │China │ │NY    │ │LA    │    │
│ └──┬───┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘    │
│    │                                                                        │
│ ┌──┴───────────────────────────────────────────────────────┐               │
│ │                    Organizations                          │               │
│ │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │               │
│ │  │   HR    │ │  Sales  │ │ Finance │ │   IT    │         │               │
│ │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘         │               │
│ │       └───────────┴───────────┴───────────┘               │               │
│ │                         │                                  │               │
│ │                    Communities                             │               │
│ │              ┌──────────┴──────────┐                      │               │
│ │              ▼                     ▼                       │               │
│ │         ┌─────────┐          ┌─────────┐                  │               │
│ │         │  Team A │          │  Team B │                  │               │
│ │         └─────────┘          └─────────┘                  │               │
│ └────────────────────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Jerarquía del Ecosistema

### Niveles de la Jerarquía (de mayor a menor)

| Nivel | Modelo | Descripción | Ejemplo |
|-------|--------|-------------|---------|
| 0 | **RowiVerse** | Ecosistema global | RowiVerse (único) |
| 1 | **System** | Configuración global del sistema | Sistema Rowi |
| 2 | **SuperHub** | Corporación/Federación | Six Seconds, Apple, Coca-Cola |
| 3 | **Hub** | División regional/funcional | LATAM, EMEA, Engineering |
| 4 | **Tenant** | Organización/Empresa | Cliente específico |
| 5 | **Organization** | Unidad organizacional | Departamento, Área |
| 6 | **RowiCommunity** | Comunidad/Equipo | Equipo de ventas, Cohorte |
| 7 | **User** | Usuario individual | Persona |

### Modelos de Jerarquía

```prisma
// 🌍 Ecosistema Global
model RowiVerse {
  id          String @id
  name        String
  slug        String @unique
  // Contiene todos los SuperHubs, Tenants y Usuarios globales
}

// 🌐 Identidad Global del Usuario
model RowiVerseUser {
  id          String @id
  email       String? @unique
  userId      String? @unique  // Vinculado a User local
  rowiVerseId String?          // Vinculado al RowiVerse
  // Permite identidad única a través de múltiples tenants
}

// ⚙️ Sistema Global
model System {
  id          String @id
  name        String
  slug        String @unique
  timezone    String @default("America/Mexico_City")
  // Configuración global, agentes, páginas
}

// 🏢 SuperHub (Corporación)
model SuperHub {
  id          String @id
  name        String
  slug        String @unique
  planId      String?
  // Contiene múltiples Hubs
}

// 🏛️ Hub (División)
model Hub {
  id          String @id
  name        String
  slug        String @unique
  superHubId  String?
  tenantId    String?
  // Contiene organizaciones y equipos
}

// 🏪 Tenant (Empresa)
model Tenant {
  id          String @id
  name        String
  slug        String @unique
  planId      String?
  // Cliente principal, contiene usuarios y configuraciones
}

// 🏬 Organization (Departamento)
model Organization {
  id          String @id
  name        String
  slug        String @unique
  parentId    String?  // Jerarquía de organizaciones
  hubId       String?
  tenantId    String?
  type        OrgUnitType  // WORLD, REGION, COUNTRY, DIVISION, TEAM, CLIENT
}

// 👥 Comunidad
model RowiCommunity {
  id          String @id
  name        String
  slug        String @unique
  type        String? // general, team, coaching, etc.
  teamType    String? // biz, impact, coaching, education, research, ops, tech, marketing
}
```

---

## 📦 Módulos por Dominio

### 1. 👤 IDENTIDAD Y AUTENTICACIÓN

| Modelo | Descripción | Relaciones Clave |
|--------|-------------|------------------|
| **User** | Usuario principal | Tenant, Roles, Avatar, Permissions |
| **Account** | Cuentas OAuth | User (NextAuth) |
| **Session** | Sesiones activas | User (NextAuth) |
| **UserPermission** | Permisos específicos | User, PermissionScope |
| **ProfileFeature** | Features habilitadas | User, FeatureDefinition |
| **InviteToken** | Invitaciones pendientes | User, Tenant |

```
User
├── email, name, image
├── role (TenantRole)
├── onboardingStatus
├── tenantId → Tenant
├── avatarEvolution → AvatarEvolution
├── permissions[] → UserPermission
├── features[] → ProfileFeature
├── hubMemberships[] → HubMembership
└── rowiverseUser → RowiVerseUser (identidad global)
```

### 2. 🧠 INTELIGENCIA EMOCIONAL (EQ)

| Modelo | Descripción | Datos Clave |
|--------|-------------|-------------|
| **EqSnapshot** | Evaluación SEI completa | K, C, G, 8 competencias, outcomes |
| **EqCompetencySnapshot** | Competencia individual | key, label, score |
| **EqOutcomeSnapshot** | Outcome individual | key, label, score |
| **EqSubfactorSnapshot** | Subfactor | key, score |
| **EqValueSnapshot** | Valores | key, score |
| **EqSuccessFactorSnapshot** | Factores de éxito | key, score |
| **TalentSnapshot** | Talentos cerebrales | 18 brain talents |
| **EqMoodSnapshot** | Estado emocional | mood, intensity, valence |
| **EqProgress** | Progreso EQ | reflection, insight, actionPlan |

```
EqSnapshot (Evaluación SEI)
├── Core: K (Know), C (Choose), G (Give)
├── 8 Competencias: EL, RP, ACT, NE, IM, OP, EMP, NG
├── Outcomes: effectiveness, relationships, qualityOfLife, etc.
├── Brain Style: brainStyle
├── Reliability: reliabilityIndex, positiveImpressionScore
└── Relaciones:
    ├── user → User
    ├── member → CommunityMember
    └── rowiverseUser → RowiVerseUser
```

### 3. 💞 AFINIDAD Y RELACIONES

| Modelo | Descripción | Métricas |
|--------|-------------|----------|
| **AffinitySnapshot** | Afinidad entre personas | lastHeat135, closeness, biasFactor |
| **AffinityInteraction** | Micro-interacciones | emotionTag, effectiveness |
| **AffinityProfile** | Perfil de afinidad | traits, clusters, scores |
| **AffinityConfig** | Configuración por scope | contextWeights, bandThresholds |
| **RowiRelation** | Relación entre usuarios | type, strength, status |

```
Sistema de Afinidad (Heat 135)
├── AffinitySnapshot: Estado actual de la relación
│   ├── lastHeat135: 0-135 (score de afinidad)
│   ├── closeness: cercano/neutral/lejano
│   └── biasFactor: sesgo de percepción
├── AffinityInteraction: Cada interacción suma/resta
└── AffinityConfig: Configuración por nivel (global→tenant→hub→team)
```

### 4. 🥚 AVATAR Y GAMIFICACIÓN

| Modelo | Descripción | Campos Clave |
|--------|-------------|--------------|
| **AvatarEvolution** | Avatar del usuario | stage, experience, evolutionScore |
| **AvatarStreak** | Rachas del avatar | currentDays, longestDays |
| **AvatarMilestone** | Hitos alcanzados | type, xpReward, rarity |
| **Achievement** | Definición de logros | slug, requirement, threshold |
| **UserAchievement** | Logros del usuario | progress, completed |
| **UserPoints** | Historial de puntos | amount, balance, reason |
| **UserStreak** | Rachas de actividad | currentStreak, longestStreak |
| **UserLevel** | Nivel del usuario | level, totalPoints |

```
Evolución del Avatar (Rowi Personal)
├── Stages: EGG → HATCHING → BABY → YOUNG → ADULT → WISE
├── Sistema Dual:
│   ├── sixSecondsLevel: 1-5 (del SEI)
│   ├── rowiLevel: Por actividad en la app
│   └── evolutionScore = (rowiLevel * 0.6) + (sixSecondsLevel * 0.4)
└── Gamificación:
    ├── Achievements (logros)
    ├── Streaks (rachas)
    ├── Points (puntos)
    └── Levels (niveles)
```

### 5. 📊 ANALYTICS Y BENCHMARKS

| Modelo | Descripción | Uso |
|--------|-------------|-----|
| **Benchmark** | Benchmark principal | Comparaciones globales |
| **BenchmarkDataPoint** | Datos individuales | Cada registro de la fuente |
| **BenchmarkStatistic** | Estadísticas agregadas | mean, median, percentiles |
| **BenchmarkCorrelation** | Correlaciones EQ↔Outcomes | r, pValue, strength |
| **BenchmarkTopPerformer** | Patrones de top performers | avgK, avgC, topCompetencies |
| **BenchmarkOutcomePattern** | Mapas de éxito | keyCompetencies, successRate |
| **AnalyticsSnapshot** | Métricas diarias | scope, metricKey, metricValue |
| **PredictiveMetric** | Predicciones | horizonDays, confidence |

```
Sistema de Benchmarks
├── Tipos: ROWIVERSE (global), EXTERNAL (mercado), INTERNAL (org)
├── Scopes: GLOBAL → REGION → COUNTRY → SECTOR → TENANT → HUB → TEAM
└── Análisis:
    ├── Estadísticas por filtro (país, sector, rol, edad)
    ├── Correlaciones EQ ↔ Outcomes
    ├── Top Performers por outcome
    └── Patrones de éxito
```

### 6. 🏢 RECURSOS HUMANOS

| Modelo | Descripción | Relaciones |
|--------|-------------|------------|
| **EmployeeProfile** | Perfil de empleado | User, Tenant, position, salary |
| **PerformanceReview** | Evaluación de desempeño | employee, reviewer, score |
| **TimeEntry** | Registro de tiempo | employee, startedAt, billable |
| **ProductivityLog** | Log de productividad | focusLevel, emotionTag |
| **LeaveRequest** | Solicitud de ausencia | type, status, approvedBy |
| **PayrollRun** | Nómina | period, items |
| **PayrollItem** | Ítem de nómina | employee, concept, amount |

```
Módulo de HR
├── EmployeeProfile (Perfil laboral)
│   ├── position, department, hireDate
│   ├── salaryUsd, contractType, status
│   └── skills[]
├── PerformanceReview (Evaluaciones)
│   ├── score, emotionalScore
│   ├── goals (JSON), insightsAI
│   └── Puede ser hecha por AI (agentId)
├── TimeEntry + ProductivityLog
└── PayrollRun + PayrollItem
```

### 7. 💰 FINANZAS Y CONTABILIDAD

| Modelo | Descripción | Campos Clave |
|--------|-------------|--------------|
| **Transaction** | Transacción financiera | type, amountUsd, accountId |
| **Invoice** | Factura | number, totalUsd, status |
| **InvoiceItem** | Línea de factura | product, quantity, unitPrice |
| **AccountCategory** | Categoría contable | code, type, parent |
| **CostCenter** | Centro de costos | code, name, allocations |
| **Product** | Producto | sku, priceUsd, stockQty |
| **Asset** | Activo fijo | valueUsd, depreciationRate |
| **Payout** | Pago saliente | amountUsd, status, method |

```
Módulo Financiero
├── Transacciones: INCOME, EXPENSE, TRANSFER
├── Facturación: Invoice → InvoiceItem → Product
├── Costos: CostCenter → CostAllocation → Transaction
├── Inventario: Product → InventoryMovement
├── Activos: Asset (ACTIVE, DISPOSED, MAINTENANCE)
├── Órdenes: PurchaseOrder, SalesOrder
└── Proyectos: Project (vincula todo)
```

### 8. 📚 APRENDIZAJE

| Modelo | Descripción |
|--------|-------------|
| **Course** | Curso completo |
| **Lesson** | Lección del curso |
| **Enrollment** | Inscripción del usuario |
| **Quiz** | Cuestionario |
| **QuizAttempt** | Intento de quiz |
| **Certificate** | Certificado emitido |
| **MicroLearning** | Micro-acción (2-5 min) |
| **MicroLearningProgress** | Progreso del usuario |

### 9. 🔔 NOTIFICACIONES

| Modelo | Descripción | Canales |
|--------|-------------|---------|
| **NotificationQueue** | Cola de notificaciones | EMAIL, PUSH, SMS, WHATSAPP, SLACK, TEAMS, IN_APP |
| **NotificationPreference** | Preferencias del usuario | Canales habilitados, quiet hours |
| **PushSubscription** | Suscripción web push | endpoint, p256dh, auth |
| **NotificationLog** | Log de entrega | event, externalId |

```
Tipos de Notificación (NotificationType)
├── Progress: ACHIEVEMENT_UNLOCKED, LEVEL_UP, STREAK_MILESTONE
├── Learning: MICROLEARNING_AVAILABLE, COURSE_RECOMMENDATION
├── Tasks: TASK_ASSIGNED, TASK_DUE_SOON, TASK_OVERDUE
├── Affinity: AFFINITY_CALCULATED, NEW_CONNECTION
├── Team: HUB_INVITATION, TEAM_UPDATE, MEMBER_JOINED
├── EQ: EQ_ASSESSMENT_READY, EMOTIONAL_PATTERN_DETECTED
└── System: WELCOME, SECURITY_ALERT
```

### 10. 🤖 AGENTES IA

| Modelo | Descripción |
|--------|-------------|
| **AgentConfig** | Configuración del agente |
| **AgentContext** | Contexto por scope |
| **AgentModelVersion** | Versionado de modelos |
| **AgentTrainingSample** | Dataset de entrenamiento |
| **AgentKnowledgeDeployment** | Despliegue de conocimiento |
| **UserAIControl** | Control de IA por usuario |
| **AiCultureConfig** | Cultura organizacional para IA |
| **EmotionalAIEngine** | Motor emocional |

### 11. 💳 PAGOS Y SUSCRIPCIONES

| Modelo | Descripción |
|--------|-------------|
| **Subscription** | Suscripción Stripe |
| **Payment** | Historial de pagos |
| **Coupon** | Cupones de descuento |
| **CouponRedemption** | Uso de cupones |
| **Plan** | Planes disponibles |
| **SeiRequest** | Solicitud de SEI |
| **SeiLink** | Links SEI por idioma |

### 12. 🌐 CMS Y PÁGINAS

| Modelo | Descripción |
|--------|-------------|
| **Page** | Página dinámica |
| **PageComponent** | Componente en página |
| **Component** | Catálogo de componentes |
| **Layout** | Layouts disponibles |
| **Translation** | Traducciones i18n |
| **LandingSection** | Secciones del landing |
| **CmsContent** | Contenido CMS |

---

## 🔐 Sistema de Roles y Permisos

### Enums de Roles

```prisma
enum TenantRole {
  SUPERADMIN   // Control total del tenant
  ADMIN        // Administración general
  MANAGER      // Gestión de equipos
  EDITOR       // Edición de contenido
  VIEWER       // Solo lectura
  DEVELOPER    // Acceso técnico
  BILLING      // Facturación
  FEDERATOR    // Conexión con otros tenants
}

enum OrgRole {
  OWNER        // Dueño de la organización
  ADMIN        // Administrador
  MANAGER      // Gerente
  MEMBER       // Miembro
  VIEWER       // Solo lectura
}

enum RoleLevel {
  SYSTEM       // Nivel sistema (god mode)
  SUPERHUB     // Nivel corporación
  HUB          // Nivel división
  TENANT       // Nivel empresa
  PLAN         // Basado en plan
}

enum PermissionScope {
  rowiverse    // Todo el ecosistema
  superhub     // Corporación
  hub          // División
  tenant       // Empresa
  organization // Departamento
  community    // Equipo
}

enum OrgUnitType {
  WORLD        // Six Seconds global
  REGION       // LATAM, EMEA, APAC
  COUNTRY      // México, Perú, USA
  DIVISION     // Staff, Coaches
  TEAM         // Equipo específico
  COMMUNITY    // Comunidad
  CLIENT       // Cliente final
}
```

### Modelos de Permisos

```prisma
// Membresía en Hub con rol
model HubMembership {
  id        String @id
  userId    String
  hubId     String
  role      String @default("MEMBER")
  status    String @default("ACTIVE")
  joinedAt  DateTime
}

// Roles dinámicos personalizables
model HubRoleDynamic {
  id          String @id
  hubId       String
  name        String
  description String?
  permissions Json?   // Permisos específicos
  color       String?
  icon        String?
}

// Permisos específicos por usuario
model UserPermission {
  id        String @id
  userId    String
  scope     PermissionScope
  scopeId   String?
  action    String
  granted   Boolean @default(true)
}

// Features habilitadas por usuario
model ProfileFeature {
  id           String @id
  userId       String
  featureId    String
  enabled      Boolean @default(true)
  grantedBy    String?
  expiresAt    DateTime?
}

// Catálogo de features
model FeatureDefinition {
  id          String @id
  slug        String @unique
  name        String
  description String?
  category    String
  scope       String  // plan, tenant, user
  isActive    Boolean @default(true)
}
```

### Sistema Multi-Rol

Un usuario puede tener **múltiples roles en diferentes contextos**:

```
Usuario: Juan Pérez
├── Rol Global: USER (en User.role)
├── Membresías:
│   ├── Hub "LATAM" → rol: MANAGER
│   ├── Hub "Mexico" → rol: ADMIN
│   └── Hub "Coaching" → rol: MEMBER
├── Permisos Específicos:
│   ├── scope: hub, action: "analytics.view"
│   └── scope: tenant, action: "users.invite"
└── Features:
    ├── "advanced-analytics" ✓
    ├── "ai-coach" ✓
    └── "benchmark-export" ✓
```

---

## 🔗 Relaciones Clave

### Usuario y sus Conexiones

```
User (Centro del sistema)
│
├── IDENTIDAD
│   ├── accounts[] → Account (OAuth providers)
│   ├── sessions[] → Session (Sesiones activas)
│   └── rowiverseUser → RowiVerseUser (ID global)
│
├── ORGANIZACIÓN
│   ├── tenant → Tenant (Empresa principal)
│   ├── hubMemberships[] → HubMembership (Divisiones)
│   ├── organizations[] → OrgMembership (Departamentos)
│   └── communities[] → RowiCommunityUser (Equipos)
│
├── PERMISOS
│   ├── role: TenantRole (Rol global)
│   ├── permissions[] → UserPermission (Permisos específicos)
│   └── features[] → ProfileFeature (Features habilitadas)
│
├── EQ & DESARROLLO
│   ├── avatarEvolution → AvatarEvolution (Avatar gamificado)
│   ├── eqSnapshots[] → EqSnapshot (Evaluaciones SEI)
│   ├── achievements[] → UserAchievement (Logros)
│   └── microLearningProgress[] → MicroLearningProgress
│
├── RELACIONES
│   ├── affinitySnapshots[] → AffinitySnapshot (Afinidades)
│   ├── initiatedRelations[] → RowiRelation
│   └── receivedRelations[] → RowiRelation
│
├── HR & PRODUCTIVIDAD
│   ├── employeeProfile → EmployeeProfile
│   ├── weekFlowTasks[] → WeekFlowTask
│   ├── timeEntries[] → TimeEntry
│   └── leaveRequests[] → LeaveRequest
│
├── COMUNICACIÓN
│   ├── notifications[] → NotificationQueue
│   ├── pushSubscriptions[] → PushSubscription
│   └── chats[] → RowiChat
│
└── FINANZAS
    ├── subscriptions[] → Subscription
    ├── payments[] → Payment
    └── payouts[] → Payout
```

### Cascada de Configuraciones

Las configuraciones heredan de arriba hacia abajo:

```
System (defaults globales)
    ↓
SuperHub (override para corporación)
    ↓
Hub (override para división)
    ↓
Tenant (override para empresa)
    ↓
Organization (override para departamento)
    ↓
User (preferencias personales)
```

Esto aplica a:
- **AgentConfig**: Configuración de agentes IA
- **AffinityConfig**: Parámetros de afinidad
- **AiCultureConfig**: Cultura para IA
- **TenantBranding**: Theming visual
- **NotificationPreference**: Preferencias de notificación

---

## 📊 Diagramas

### Flujo de Datos EQ

```
                    ┌─────────────────┐
                    │  Six Seconds    │
                    │  (CSV Export)   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ SixSecondsImport│
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ EqSnapshot  │     │ TalentSnap  │     │ MoodSnap    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Avatar Evolution│
                  │ (sixSecondsLevel)│
                  └────────┬────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Benchmark│ │ Analytics│ │ Affinity │
        │ DataPoint│ │ Snapshot │ │ Calc     │
        └──────────┘ └──────────┘ └──────────┘
```

### Flujo de Gamificación

```
       Acciones del Usuario
              │
              ▼
    ┌─────────────────────┐
    │ Trigger Gamificación│
    │ (chat, login, etc.) │
    └──────────┬──────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌───────┐ ┌───────┐ ┌───────┐
│Points │ │Streak │ │Achieve│
│+10 XP │ │Day +1 │ │Check  │
└───┬───┘ └───┬───┘ └───┬───┘
    │         │         │
    └─────────┼─────────┘
              │
              ▼
    ┌─────────────────────┐
    │  UserLevel Update   │
    │  (level, totalPoints)│
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │  Avatar Evolution   │
    │  (evolutionScore)   │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │   Notification      │
    │ (ACHIEVEMENT_UNLOCKED)│
    └─────────────────────┘
```

### Flujo de Notificaciones

```
    ┌─────────────────────────────────────────┐
    │           EVENTO TRIGGER                │
    │  (achievement, task, affinity, etc.)    │
    └────────────────┬────────────────────────┘
                     │
                     ▼
    ┌─────────────────────────────────────────┐
    │       NotificationQueue (PENDING)       │
    │  channel, type, message, priority       │
    └────────────────┬────────────────────────┘
                     │
                     ▼
    ┌─────────────────────────────────────────┐
    │      NotificationPreference Check       │
    │  emailEnabled? pushEnabled? quietHours? │
    └────────────────┬────────────────────────┘
                     │
    ┌────────────────┼────────────────┬───────────────┐
    ▼                ▼                ▼               ▼
┌───────┐      ┌───────┐       ┌───────┐       ┌───────┐
│ EMAIL │      │ PUSH  │       │  SMS  │       │IN_APP │
│Resend │      │WebPush│       │Twilio │       │Socket │
└───┬───┘      └───┬───┘       └───┬───┘       └───┬───┘
    │              │               │               │
    └──────────────┼───────────────┼───────────────┘
                   │
                   ▼
    ┌─────────────────────────────────────────┐
    │           NotificationLog               │
    │  (sent, delivered, opened, clicked)     │
    └─────────────────────────────────────────┘
```

---

## 📈 Estadísticas del Schema

| Categoría | Cantidad |
|-----------|----------|
| **Modelos totales** | ~120 |
| **Enums** | ~35 |
| **Índices** | ~200+ |
| **Relaciones** | ~300+ |

### Distribución por Módulo

| Módulo | Modelos | % |
|--------|---------|---|
| Core/Identity | 15 | 12% |
| EQ & Assessment | 12 | 10% |
| Gamification | 10 | 8% |
| Analytics/Benchmark | 12 | 10% |
| HR & Productivity | 10 | 8% |
| Finance | 15 | 12% |
| Learning | 8 | 7% |
| Notifications | 4 | 3% |
| AI Agents | 8 | 7% |
| CMS/Pages | 10 | 8% |
| Payments | 8 | 7% |
| Communities | 8 | 7% |

---

## 🚀 Consideraciones para Escalabilidad

### Multi-Tenancy
- Cada modelo tiene `tenantId` para aislamiento de datos
- Índices compuestos `[tenantId, ...]` para queries eficientes
- Cascada de eliminación configurable

### Rendimiento
- Índices en todas las foreign keys
- Índices compuestos para queries frecuentes
- Campos `Json` para datos flexibles (evita joins)

### Federación
- `RowiVerseUser` permite identidad cross-tenant
- `EcosystemLink` para relaciones flexibles entre entidades
- `rowiverseUserId` en modelos clave para tracking global

### Auditoría
- `ActivityLog` unificado para todas las acciones
- `createdAt/updatedAt` en todos los modelos
- `NotificationLog` para tracking de comunicaciones

---

## 🔜 Próximos Pasos

1. **Implementar middleware de roles** con soporte multi-rol
2. **Crear vistas específicas** por tipo de usuario
3. **Integrar HR Consultant view** para coaches con empresas
4. **Escalar para estructuras enterprise** (Apple, Coca-Cola, etc.)

---

*Documento generado automáticamente. Actualizado: 2025-01-31*
