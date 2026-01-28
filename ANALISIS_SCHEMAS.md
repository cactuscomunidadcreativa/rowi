# Análisis Comparativo de Schemas: ROWI vs ROWI 2.1

## Resumen

| Métrica | ROWI | ROWI 2.1 |
|---------|------|----------|
| Total modelos | 112 | 119 |
| Líneas schema | 2,708 | 2,838 |

---

## Modelos EXCLUSIVOS de ROWI (que NO tiene rowi2.1)

Estos modelos implementan el **Sistema RowiVerse** completo:

| Modelo | Descripción |
|--------|-------------|
| `RowiVerse` | Raíz global del ecosistema |
| `RowiVerseUser` | Usuario vinculado al RowiVerse |
| `RowiCommunity` | Comunidades del RowiVerse |
| `RowiCommunityUser` | Usuarios en comunidades RowiVerse |
| `RowiCommunityPost` | Posts en comunidades RowiVerse |
| `CommunityBatch` | Lotes de procesamiento de comunidades |
| `EcosystemLink` | Enlaces entre ecosistemas |
| `AffinityProfile` | Perfil de afinidad extendido |
| `OrganizationToTenant` | Relación N:M Org-Tenant |

---

## Modelos EXCLUSIVOS de ROWI 2.1 (que NO tiene rowi)

Estos modelos implementan las **nuevas funcionalidades**:

| Modelo | Descripción | Prioridad |
|--------|-------------|-----------|
| `AvatarEvolution` | Gamificación - evolución del avatar | ALTA |
| `AvatarMilestone` | Logros desbloqueados | ALTA |
| `AvatarStreak` | Rachas de actividad | ALTA |
| `TopPerformerMetric` | Rankings de desempeño | ALTA |
| `CollectivePattern` | Patrones de inteligencia colectiva | ALTA |
| `EmotionalROI` | Retorno de inversión emocional | ALTA |
| `DecisionTracking` | Seguimiento de decisiones | MEDIA |
| `IntegrationConnection` | Conexiones Slack/Teams/etc | ALTA |
| `TenantBranding` | Theming corporativo | MEDIA |
| `CalendarEvent` | Eventos de calendario | MEDIA |
| `NotificationQueue` | Cola de notificaciones | MEDIA |
| `UserPhone` | Teléfonos del usuario | BAJA |
| `UserSocial` | Redes sociales del usuario | BAJA |
| `UserRole` | Roles dinámicos del usuario | MEDIA |
| `Community` | Modelo de comunidad rediseñado | EVALUAR |
| `CommunityMembership` | Membresías de comunidad | EVALUAR |
| `CommunityPost` | Posts de comunidad | EVALUAR |
| `RowiVerseNode` | Nodos del RowiVerse | EVALUAR |

---

## Modelos con DIFERENCIAS entre versiones

| Modelo | ROWI | ROWI 2.1 | Acción |
|--------|------|----------|--------|
| `User` | Tiene `rowiverseId`, campos geo | Tiene relaciones a nuevos modelos | MERGE |
| `CommunityMember` | Tiene `closeness` | Diferente estructura | MANTENER ROWI |
| `AffinitySnapshot` | Tiene `memberEqSnapshot` | Simplificado | MANTENER ROWI |

---

## PLAN DE MIGRACIÓN

### Fase 1: Agregar modelos de Gamificación (ALTA PRIORIDAD)
```
AvatarEvolution
AvatarMilestone
AvatarStreak
```

### Fase 2: Agregar modelos de Inteligencia Colectiva
```
TopPerformerMetric
CollectivePattern
EmotionalROI
DecisionTracking
```

### Fase 3: Agregar modelos de Integraciones
```
IntegrationConnection
TenantBranding
CalendarEvent
NotificationQueue
```

### Fase 4: Agregar modelos de Usuario extendido
```
UserPhone
UserSocial
UserRole
```

---

## Enums a AGREGAR

```prisma
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

## DECISIÓN RECOMENDADA

**Usar ROWI como base** y agregar los 11 modelos nuevos de rowi2.1:

1. ROWI tiene el sistema RowiVerse completo (9 modelos exclusivos)
2. ROWI tiene menos errores (384 vs 1,322)
3. Solo necesitamos agregar las nuevas funcionalidades de gamificación/ROI

**NO mezclar** los modelos de Community de rowi2.1 ya que ROWI tiene su propio sistema de comunidades más completo (RowiCommunity, RowiCommunityUser, RowiCommunityPost).
