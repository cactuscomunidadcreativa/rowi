# DIAGNOSTICO COMPLETO - ARQUITECTURA ROWI

**Fecha**: 2025-01-30
**Version Analizada**: Local Development
**Total Lineas Schema**: 5,212
**Total Modelos**: 168
**Total Enums**: 54
**Total API Routes**: 261

---

## 1. RESUMEN EJECUTIVO

Rowi es una plataforma de inteligencia emocional basada en el modelo Six Seconds. El sistema ha crecido organicamente y presenta:

- **Fortalezas**: Arquitectura modular por dominios, sistema de gamificacion robusto, integracion profunda con Six Seconds
- **Debilidades**: Modelos duplicados, jerarquias confusas, redundancia en sistemas de niveles/rachas

### Metricas Clave
| Metrica | Valor | Riesgo |
|---------|-------|--------|
| Modelos Prisma | 168 | 🟡 ALTO |
| Enums | 54 | 🟡 MEDIO |
| API Routes | 261 | 🟡 ALTO |
| Lineas Schema | 5,212 | 🔴 CRITICO |

---

## 2. ESTRUCTURA DE CARPETAS

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # 261 endpoints API
│   │   ├── admin/         # Admin endpoints
│   │   ├── affinity/      # Afinidad emocional
│   │   ├── avatar/        # Sistema de avatar [NUEVO]
│   │   ├── auth/          # Autenticacion
│   │   ├── benchmark/     # Benchmarks EQ
│   │   ├── eq/            # Inteligencia emocional
│   │   ├── gamification/  # Puntos y logros
│   │   ├── hub/           # Gestion de hubs
│   │   ├── stripe/        # Pagos
│   │   ├── weekflow/      # Check-ins semanales [NUEVO]
│   │   └── ...
│   └── (app)/             # Paginas protegidas
│
├── core/                   # Nucleo del sistema
│   ├── auth/              # Autenticacion y permisos
│   ├── prisma.ts          # Cliente Prisma
│   ├── services/          # Servicios core
│   ├── startup/           # Bootstrap del sistema
│   └── utils/             # Utilidades
│
├── domains/                # Dominios de negocio
│   ├── affinity/          # Afinidad (relaciones)
│   ├── avatar/            # Avatar Rowi [NUEVO]
│   ├── community/         # Comunidades
│   ├── eco/               # ECO (bienestar organizacional)
│   ├── eq/                # EQ (inteligencia emocional)
│   ├── hr/                # Recursos humanos
│   ├── plans/             # Planes de pago
│   └── rowi/              # Rowi Coach (IA)
│
├── lib/                    # Librerias compartidas
│   ├── benchmarks/        # Logica de benchmarks
│   ├── eq/                # Niveles y evolucion [NUEVO]
│   ├── i18n/              # Internacionalizacion
│   ├── kernel/            # Motor IA
│   ├── rowiverse/         # Contribuciones globales
│   ├── security/          # Seguridad
│   ├── six-seconds/       # Integracion SSO
│   ├── stripe/            # Pagos
│   └── theme/             # Theming
│
├── services/               # Servicios de negocio
│   ├── avatar-evolution.ts # Evolucion del avatar [NUEVO]
│   └── gamification.ts    # Sistema de puntos
│
└── components/             # Componentes React
```

---

## 3. JERARQUIA DE ENTIDADES

### 3.1 Jerarquia Organizacional

```
                    ┌─────────────────┐
                    │   ROWIVERSE     │ (Ecosistema Global)
                    │   (RowiVerse)   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
        │ SUPERHUB  │  │ SUPERHUB  │  │ SUPERHUB  │
        │  (LATAM)  │  │  (EMEA)   │  │  (APAC)   │
        └─────┬─────┘  └───────────┘  └───────────┘
              │
     ┌────────┼────────┐
     │        │        │
┌────▼────┐┌──▼──┐┌────▼────┐
│ TENANT  ││ HUB ││ORGANIZ. │
│(Empresa)││     ││         │
└────┬────┘└─────┘└─────────┘
     │
     ├── CommunityMember
     ├── HubMembership
     ├── Membership
     └── OrgMembership    ⚠️ REDUNDANCIA
```

### 3.2 Sistema de Usuarios

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                 │
│  ├── id, email, name                                        │
│  ├── onboardingStatus (REGISTERED → ACTIVE)                 │
│  ├── organizationRole (SUPERADMIN, ADMIN, etc)              │
│  ├── primaryTenantId                                         │
│  └── stripeCustomerId                                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼───────┐  ┌────────▼────────┐  ┌──────▼──────┐
│  ROWIVERSE    │  │   GAMIFICATION  │  │   AVATAR    │
│    USER       │  │                 │  │             │
│ (ID Global)   │  │ ├── UserLevel   │  │ Evolution   │
└───────────────┘  │ ├── UserStreak  │  │ ├── stage   │
                   │ ├── UserPoints  │  │ ├── sixSec  │
                   │ └── UserAchiev  │  │ └── rowiLvl │
                   └─────────────────┘  └─────────────┘
```

---

## 4. PROBLEMAS IDENTIFICADOS

### 4.1 🔴 CRITICOS (Bugs/Errores)

#### 4.1.1 Doble Relacion en RowiCommunity (BUG)
**Lineas 2642 y 2657 en schema.prisma**

```prisma
// LINEA 2642 - Una relacion
rowiVerse    RowiVerse?    @relation("RowiVerseToCommunity", fields: [rowiVerseId]...)

// LINEA 2657 - OTRA relacion al mismo campo!!
RowiVerse      RowiVerse?          @relation(fields: [rowiVerseId], references: [id])
```

**Impacto**: Ambiguedad en queries, posibles errores en runtime
**Solucion**: Eliminar la segunda relacion (linea 2657)

---

### 4.2 🟡 ALTO (Duplicacion/Redundancia)

#### 4.2.1 Sistema de Niveles Duplicado

| Modelo | Proposito | Campos Clave |
|--------|-----------|--------------|
| `UserLevel` | Nivel de gamificacion | `level`, `totalPoints`, `title` |
| `AvatarEvolution.sixSecondsLevel` | Nivel EQ del avatar | `sixSecondsLevel` (1-5) |
| `LevelDefinition` | Definicion de niveles | `level`, `minPoints`, `title` |
| `EmotionVocabulary.level` | Nivel de vocabulario | `level` (enum EmotionLevel) |

**Problema**: 4 sistemas de niveles que hacen cosas similares
**Recomendacion**: Unificar en un solo sistema con tipos

```typescript
// PROPUESTA: UnifiedLevel
interface UnifiedLevel {
  userId: string;
  type: 'ROWI' | 'SIX_SECONDS' | 'EMOTION_VOCAB';
  level: number;
  xp: number;
  metadata: Json;
}
```

#### 4.2.2 Sistema de Rachas Duplicado

| Modelo | Ubicacion | Proposito |
|--------|-----------|-----------|
| `UserStreak` | Gamificacion | Racha general del usuario |
| `AvatarStreak` | Avatar | Racha especifica del avatar |

**Problema**: `AvatarStreak` y `UserStreak` son funcionalmente identicos
**Recomendacion**: Eliminar `AvatarStreak`, usar solo `UserStreak`

#### 4.2.3 Sistema de Logros Duplicado

| Modelo | Proposito |
|--------|-----------|
| `Achievement` + `UserAchievement` | Logros de gamificacion |
| `AvatarMilestone` | Hitos del avatar |

**Problema**: `AvatarMilestone` tiene tipos como `AVATAR_HATCHED` que tambien estan en `Achievement`
**Recomendacion**: Usar `Achievement` para todo, agregar categoria `AVATAR`

#### 4.2.4 Modelos de Membresia Redundantes

```
CommunityMember    → Miembro de Hub/Tenant (tiene userId, email, datos duplicados)
RowiCommunityUser  → Miembro de RowiCommunity (tiene userId, name, email)
HubMembership      → Membresia en Hub
Membership         → Membresia en Tenant
OrgMembership      → Membresia en Organization
```

**Problema**: 5 modelos para "pertenecer a algo"
**Recomendacion**: Crear modelo generico `Membership` con campo `type`

#### 4.2.5 Audit/Logging Duplicado

| Modelo | Proposito |
|--------|-----------|
| `AuditLog` | Registro de auditoria |
| `ActivityLog` | Registro de actividad |

**Problema**: Practicamente identicos
**Recomendacion**: Unificar en `AuditLog` con campo `type`

#### 4.2.6 Enums Duplicados

| Enum 1 | Enum 2 | Problema |
|--------|--------|----------|
| `MetricPeriod` | `MetricPeriodType` | Identicos |
| `EmotionLevel` | `AvatarStage` | Conceptualmente similares |
| `MicroLearningCategory` | `KnowledgeContentType` | Overlap significativo |

---

### 4.3 🟢 MEDIO (Mejoras Recomendadas)

#### 4.3.1 Demasiados Enums de Estado

```
WeekFlowSessionStatus, RowiTaskStatus, CommunityMemberStatus,
SubscriptionStatus, PaymentStatus, SeiRequestStatus, etc.
```

**Recomendacion**: Considerar un enum generico `Status` o usar strings

#### 4.3.2 Campos JSON sin Tipado

Muchos campos usan `Json?` sin estructura definida:
- `AgentConfig.tools`
- `Page.components`
- `EmotionalEvent.metadata`

**Recomendacion**: Definir tipos TypeScript y validar con Zod

---

## 5. FLUJO DE DATOS ACTUAL

### 5.1 Flujo de Gamificacion

```
Usuario hace actividad
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│                    recordActivity()                            │
│  src/services/gamification.ts                                 │
└───────────────────────────┬───────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
  updateStreak()      awardPoints()    checkAndAwardAchievements()
        │                   │                   │
        ▼                   ▼                   ▼
   UserStreak           UserPoints        UserAchievement
   UserLevel            UserLevel         Achievement
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │    addAvatarExperience()    │
              │    checkAndEvolve()         │
              │  src/services/avatar-evo.ts │
              └─────────────────────────────┘
                            │
                            ▼
                    AvatarEvolution
                    AvatarMilestone  ← REDUNDANTE con Achievement
```

### 5.2 Flujo de Evolucion del Avatar

```
┌─────────────────────────────────────────────────────────────┐
│                   SISTEMA DUAL DE NIVELES                   │
└─────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
┌───────────────────┐               ┌───────────────────┐
│   NIVEL ROWI      │               │  NIVEL SIX SEC    │
│   (Engagement)    │               │  (EQ Externo)     │
│                   │               │                   │
│  Fuente: UserLevel│               │ Fuente: EqSnapshot│
│  XP: totalPoints  │               │ Score: overall4   │
│  Niveles: 1-10    │               │ Niveles: 1-5      │
└─────────┬─────────┘               └─────────┬─────────┘
          │                                   │
          └─────────────┬─────────────────────┘
                        │
                        ▼
              ┌───────────────────┐
              │  EVOLUTION SCORE  │
              │  = (rowi * 0.6)   │
              │  + (sixSec * 0.4) │
              └─────────┬─────────┘
                        │
                        ▼
              ┌───────────────────┐
              │   AVATAR STAGE    │
              │                   │
              │  EGG → HATCHING   │
              │  → BABY → YOUNG   │
              │  → ADULT → WISE   │
              └───────────────────┘
```

---

## 6. CONEXIONES ENTRE SISTEMAS

### 6.1 Mapa de Dependencias

```
                        ┌──────────────────┐
                        │      USER        │
                        │    (Modelo)      │
                        └────────┬─────────┘
                                 │
    ┌────────────────────────────┼────────────────────────────┐
    │            │               │               │            │
    ▼            ▼               ▼               ▼            ▼
┌───────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌──────────┐
│EqSnap │  │RowiChat  │  │WeekFlow    │  │Community │  │Affinity  │
│shot   │  │          │  │Contribution│  │Member    │  │Snapshot  │
└───┬───┘  └────┬─────┘  └─────┬──────┘  └────┬─────┘  └────┬─────┘
    │           │              │              │             │
    │           │              │              │             │
    └───────────┴──────────────┴──────────────┴─────────────┘
                               │
                               ▼
                    ┌────────────────────┐
                    │   GAMIFICATION     │
                    │  (recordActivity)  │
                    └──────────┬─────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        ┌──────────┐    ┌──────────┐    ┌──────────────┐
        │UserLevel │    │UserStreak│    │UserAchievement│
        └────┬─────┘    └────┬─────┘    └──────┬───────┘
             │               │                 │
             └───────────────┴─────────────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │  AVATAR EVOLUTION  │
                    │ checkAndEvolve()   │
                    └────────────────────┘
```

### 6.2 Integraciones Externas

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTEGRACIONES EXTERNAS                       │
├─────────────────┬───────────────────┬───────────────────────────┤
│   SIX SECONDS   │      STRIPE       │      OTROS                │
│                 │                   │                           │
│ ├── SSO Login   │ ├── Suscripciones │ ├── Slack (pendiente)    │
│ ├── SEI Import  │ ├── Pagos         │ ├── Teams (pendiente)    │
│ └── Brain Style │ ├── Cupones       │ ├── Google Cal (pendiente)│
│                 │ └── Webhooks      │ └── WhatsApp (pendiente) │
└─────────────────┴───────────────────┴───────────────────────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │IntegrationConnection│
                    │ (modelo en Prisma) │
                    └────────────────────┘
```

---

## 7. PROPUESTA DE LIMPIEZA

### 7.1 Fase 1: Bugs Criticos (Inmediato)

1. **Arreglar doble relacion en RowiCommunity**
   - Eliminar linea 2657 del schema
   - Ejecutar migration

### 7.2 Fase 2: Unificacion de Niveles (1-2 dias)

1. **Eliminar `AvatarStreak`** → Usar solo `UserStreak`
2. **Eliminar `AvatarMilestone`** → Usar `Achievement` con categoria `AVATAR`
3. **Unificar `MetricPeriod` y `MetricPeriodType`**

### 7.3 Fase 3: Simplificacion de Membresías (3-5 dias)

1. Crear modelo generico `UnifiedMembership`
2. Migrar datos de los 5 modelos actuales
3. Deprecar modelos antiguos

### 7.4 Fase 4: Limpieza de Audit/Logging (1 dia)

1. Unificar `AuditLog` y `ActivityLog`
2. Agregar campo `type` para diferenciar

---

## 8. SERVICIOS CRITICOS

### 8.1 Servicios Existentes

| Archivo | Proposito | Estado |
|---------|-----------|--------|
| `src/services/gamification.ts` | Puntos, rachas, achievements | ✅ Funcional |
| `src/services/avatar-evolution.ts` | Evolucion del avatar | ✅ Funcional |
| `src/lib/rowiverse/contribution-service.ts` | Contribuciones al RowiVerse | ✅ Funcional |
| `src/lib/stripe/subscription-service.ts` | Suscripciones Stripe | ✅ Funcional |

### 8.2 Servicios Faltantes (Recomendados)

| Servicio | Proposito |
|----------|-----------|
| `src/services/user-service.ts` | CRUD centralizado de usuarios |
| `src/services/notification-service.ts` | Cola de notificaciones |
| `src/services/integration-service.ts` | Manejo de integraciones externas |
| `src/services/analytics-service.ts` | Metricas y reportes |

---

## 9. RECOMENDACIONES FINALES

### 9.1 Corto Plazo (1 semana)
- [ ] Arreglar bug de doble relacion
- [ ] Eliminar `AvatarStreak` (usar `UserStreak`)
- [ ] Unificar enums duplicados

### 9.2 Mediano Plazo (2-4 semanas)
- [ ] Unificar sistemas de achievements/milestones
- [ ] Crear servicios centralizados
- [ ] Documentar flujos de datos

### 9.3 Largo Plazo (1-2 meses)
- [ ] Refactorizar membresías
- [ ] Implementar sistema de eventos/webhooks interno
- [ ] Agregar tests de integracion

---

## 10. ARCHIVOS CLAVE PARA CONTEXTO

Para el proximo chat, estos son los archivos criticos:

```
prisma/schema.prisma                    # Toda la BD
src/services/gamification.ts            # Sistema de puntos
src/services/avatar-evolution.ts        # Sistema de avatar
src/lib/eq/evolution-calculator.ts      # Calculos de evolucion
src/lib/eq/six-seconds-levels.ts        # Niveles Six Seconds
src/core/auth/index.ts                  # Autenticacion
src/app/api/avatar/route.ts             # API Avatar
src/app/api/gamification/me/route.ts    # API Gamificacion
```

---

## NOTAS IMPORTANTES

1. **No hacer push a GitHub** hasta tener todo estable en local
2. **Hacer backup** antes de cualquier migracion
3. **Testear localmente** cada cambio antes de continuar
4. Este documento sirve como **contexto** para el siguiente chat

---

*Documento generado automaticamente por Claude Code*
