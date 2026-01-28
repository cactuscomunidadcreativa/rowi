# PLAN DE ACCIÓN - ROWI

> Fecha: 2026-01-27
> Estado inicial: 429 errores TypeScript
> Objetivo: 0 errores + funcionalidad completa

---

## RESUMEN DEL ESTADO ACTUAL

| Métrica | Valor |
|---------|-------|
| Errores TypeScript | 429 |
| Archivos con errores | ~50 |
| APIs stub/vacías | 16 |
| Componentes huérfanos | 17 |
| Scripts obsoletos | ~15 |

---

## FASE 1: LIMPIEZA RÁPIDA (Eliminar archivos)

### 1.1 APIs de Debug/Test a ELIMINAR:
```
src/app/api/hello/route.ts          # Solo test
src/app/api/debug-auth/route.ts     # Debug
src/app/api/debug-auth/version/route.ts  # Debug
src/app/api/env-check/route.ts      # Expone info sensible
```

### 1.2 Scripts Obsoletos a ELIMINAR:
```
scripts/fix_imports_v2.shn          # Extensión incorrecta
scripts/fix_imports.sh              # Obsoleto
scripts/fix_imports_v2.sh           # Obsoleto
scripts/restructure_rowi.sh         # One-time
scripts/restructure_rowi_v2.sh      # One-time
scripts/cleanup-bak-files.ts        # One-time
scripts/cleanup-rowi-structure.ts   # One-time
scripts/clear-translations.ts       # Destructivo
```

### 1.3 Componentes Huérfanos a EVALUAR:
```
src/components/charts/FeedbackCompare.tsx
src/components/charts/SpiderEq.tsx
src/components/shared/NavLinks.tsx
src/components/shared/DemoBanner.tsx
src/components/shared/TopNav.tsx
src/components/eco/EcoChat.tsx
src/components/dashboard/TrendCardsEq.tsx
src/components/dashboard/TalentsEq.tsx
src/components/dashboard/ChartsPanel.tsx
src/components/dashboard/EqTotalCard.tsx
src/components/rowi/EmotionalTimeline.tsx
src/components/hub/HubSidebar.tsx
src/components/hub/HubHeader.tsx
```

**Impacto estimado:** -50 errores (por eliminar código roto)

---

## FASE 2: ARREGLOS DE ALTO IMPACTO

### 2.1 Arreglar `src/sanity/index.ts` (0 bytes)
- **Errores afectados:** 9
- **Problema:** Archivo vacío que se importa en otros lugares
- **Solución:** Agregar exports o eliminar imports

### 2.2 Arreglar `batch/history/route.ts`
- **Errores afectados:** 15
- **Problema:** Variables `prevBatch` y `currentBatch` sin declarar
- **Solución:** Definir variables o arreglar lógica

### 2.3 Arreglar firma de `getServerAuthUser()`
- **Errores afectados:** 41+
- **Problema:** Función espera 0 args pero recibe 1
- **Solución:** Actualizar llamadas o función

### 2.4 Arreglar `src/core/auth/config.ts`
- **Errores afectados:** 20
- **Problema:** Múltiples errores de configuración
- **Solución:** Revisar y corregir config de NextAuth

**Impacto estimado:** -85 errores

---

## FASE 3: SINCRONIZACIÓN DE PRISMA

### Propiedades faltantes detectadas:
- `closeness` en CommunityMember
- `profileEQ` en User
- `plan` en User
- `superHubId` en varios modelos
- `memberEqSnapshot` en AffinitySnapshot

### Opciones:
A) Agregar campos al schema
B) Actualizar código para usar campos existentes
C) Migrar modelos de rowi2.1 que ya tienen estos campos

**Impacto estimado:** -30 errores

---

## FASE 4: MIGRAR MODELOS DE ROWI2.1

Modelos a traer de rowi2.1:
```prisma
AvatarEvolution      # Gamificación
AvatarMilestone      # Logros
AvatarStreak         # Rachas
TopPerformerMetric   # Rankings
CollectivePattern    # Patrones de grupo
EmotionalROI         # ROI emocional
DecisionTracking     # Seguimiento decisiones
IntegrationConnection # Integraciones
TenantBranding       # Theming corporativo
CalendarEvent        # Calendario
NotificationQueue    # Notificaciones
```

---

## FASE 5: ERRORES RESTANTES

Después de las fases 1-4, estimar ~250 errores restantes.
Arreglar archivo por archivo los errores de:
- Null safety (usar optional chaining)
- Tipos implícitos (agregar tipos explícitos)
- Imports faltantes

---

## ORDEN DE EJECUCIÓN

| Paso | Acción | Errores resueltos |
|------|--------|------------------|
| 1 | Eliminar APIs debug/test | ~10 |
| 2 | Eliminar scripts obsoletos | ~5 |
| 3 | Arreglar sanity/index.ts | ~9 |
| 4 | Arreglar batch/history | ~15 |
| 5 | Arreglar getServerAuthUser | ~41 |
| 6 | Arreglar auth/config.ts | ~20 |
| 7 | Sincronizar Prisma | ~30 |
| 8 | Errores restantes | ~299 |

---

## MÉTRICAS DE ÉXITO

| Checkpoint | Errores objetivo |
|------------|-----------------|
| Después Fase 1 | < 380 |
| Después Fase 2 | < 300 |
| Después Fase 3 | < 270 |
| Final | 0 |

---

¿Comenzamos con la Fase 1?
