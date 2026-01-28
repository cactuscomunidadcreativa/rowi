# Plan de Acción: Cultura Corporativa en Agentes ROWI

## Contexto del Proyecto

ROWI es un Sistema de Inteligencia Emocional Aumentada con arquitectura multi-agente basado en el modelo Six Seconds.

### Agentes del Sistema:
- **SuperAgent** (`super.ts`) - Coordinador principal que orquesta a los demás
- **EQ Agent** (`eq.ts`) - Inteligencia emocional y autoconciencia
- **Affinity Agent** (`affinity.ts`) - Relaciones interpersonales y afinidad
- **ECO Agent** (`eco.ts`) - Comunicación emocional efectiva
- **Sales Agent** (`sales.ts`) - Ventas con inteligencia emocional
- **Trainer Agent** (`trainer.ts`) - Entrenamiento de hábitos emocionales

---

## ✅ COMPLETADO

### 1. Archivo Helper Principal
**Archivo:** `/src/ai/agents/getAgentConfig.ts`

Funciones implementadas:
- `getAgentConfig()` - Carga configuración del agente desde BD
- `buildCultureEnrichedPrompt()` - Construye prompt con cultura corporativa
- `getAgentsFromPlan()` - Obtiene agentes según plan de suscripción
- `getUserEnabledAgents()` - Agentes habilitados para usuario (plan + controles)
- `getUserPlanInfo()` - Info del plan para UI
- `getTenantCulture()` - Cultura unificada del tenant
- `buildSuperAgentPrompt()` - Prompt especial para SuperAgent
- `canUserAccessAgent()` - Verifica acceso a agente específico

### 2. Definición de Planes
```typescript
PLAN_AGENTS = {
  free: ["super", "eq"],
  personal: ["super", "eq", "trainer", "eco"],
  pro: ["super", "eq", "trainer", "eco", "affinity"],
  enterprise: ["super", "eq", "affinity", "eco", "sales", "trainer"],
  "global-ai": ["super", "eq", "affinity", "eco", "sales", "trainer"],
}
```

### 3. Agentes Actualizados con Cultura
- ✅ `super.ts` - Usa `getTenantCulture()` y `buildSuperAgentPrompt()`
- ✅ `trainer.ts` - Usa `getAgentConfig()` y `buildCultureEnrichedPrompt()`
- ✅ `sales.ts` - Usa `getAgentConfig()` y `buildCultureEnrichedPrompt()`
- ✅ `eco.ts` - Usa `getAgentConfig()` y `buildCultureEnrichedPrompt()`
- ✅ `affinity.ts` - Usa `getAgentConfig()` y `buildCultureEnrichedPrompt()`

---

## ⏳ PENDIENTE

### 1. Actualizar EQ Agent
**Archivo:** `/src/ai/agents/eq.ts`

Agregar:
```typescript
import { getAgentConfig, buildCultureEnrichedPrompt } from "./getAgentConfig";

// En el método run():
const agentConfig = await getAgentConfig("eq", tenantId);
const systemPrompt = buildCultureEnrichedPrompt(basePrompt, agentConfig, language);
```

### 2. Agregar Campos de Cultura al Schema Prisma
**Archivo:** `/prisma/schema.prisma`

Verificar que `AgentConfig` tenga estos campos:
```prisma
model AgentConfig {
  // ... campos existentes
  culturePrompt      String?
  companyValues      String[]              @default([])
  companyMission     String?
  companyTone        String?
  industryContext    String?
  customInstructions String?
  brandVoice         Json?
}
```

### 3. Crear Seed con Cultura de Ejemplo
**Archivo:** `/prisma/seed.ts`

Agregar datos de ejemplo:
```typescript
const tenantCulture = {
  culturePrompt: `CULTURA ROWI: Somos una plataforma de inteligencia emocional...`,
  companyValues: ["Empatía Radical", "Crecimiento Continuo", "Autenticidad"],
  companyMission: "Democratizar la inteligencia emocional...",
  companyTone: "Cálido, inspirador, cercano pero profesional",
  industryContext: "Tecnología educativa (EdTech/HRTech)",
  brandVoice: {
    formalityLevel: "semi-formal",
    useEmojis: true,
    emojiFrequency: "moderado",
    preferredEmojis: ["🧠", "💡", "🌱", "✨", "🎯"],
    avoidWords: ["problema", "difícil", "imposible"],
    preferWords: ["oportunidad", "crecimiento", "posibilidad"]
  }
};
```

### 4. Migración de Base de Datos
```bash
cd /Users/eduardogonzalez/Desktop/rowi
npx prisma migrate dev --name add_culture_fields
npx prisma generate
```

### 5. Crear API para Editar Cultura
**Archivo sugerido:** `/src/app/api/admin/culture/route.ts`

Endpoints:
- `GET /api/admin/culture` - Obtener cultura del tenant
- `PUT /api/admin/culture` - Actualizar cultura del tenant

### 6. UI para Administrar Cultura
**Ubicación sugerida:** `/src/app/[tenant]/admin/culture/page.tsx`

Formulario para editar:
- Prompt de cultura
- Valores de la empresa
- Misión
- Tono de comunicación
- Contexto de industria
- Instrucciones personalizadas
- Voz de marca (JSON editor)

### 7. Verificación de Acceso en Router
**Archivo:** `/src/ai/agents/router.ts`

Antes de ejecutar un agente, verificar:
```typescript
import { canUserAccessAgent } from "./getAgentConfig";

// Antes de ejecutar el agente:
const hasAccess = await canUserAccessAgent(userId, agentSlug, tenantId);
if (!hasAccess) {
  return { error: "No tienes acceso a este agente según tu plan" };
}
```

---

## 📁 Archivos Clave

```
/Users/eduardogonzalez/Desktop/rowi/
├── src/ai/agents/
│   ├── getAgentConfig.ts    ← Helper principal (COMPLETO)
│   ├── super.ts             ← Coordinador (ACTUALIZADO)
│   ├── eq.ts                ← PENDIENTE de actualizar
│   ├── affinity.ts          ← ACTUALIZADO
│   ├── eco.ts               ← ACTUALIZADO
│   ├── sales.ts             ← ACTUALIZADO
│   ├── trainer.ts           ← ACTUALIZADO
│   └── router.ts            ← PENDIENTE verificación de acceso
├── prisma/
│   ├── schema.prisma        ← PENDIENTE campos de cultura
│   └── seed.ts              ← PENDIENTE datos de ejemplo
└── src/app/api/admin/
    └── culture/route.ts     ← PENDIENTE crear
```

---

## 🔑 Flujo de Datos

```
Usuario hace pregunta
        ↓
SuperAgent.run({ ask, tenantId, userId })
        ↓
getTenantCulture(tenantId, userId)
        ↓
┌─────────────────────────────────────┐
│ 1. getAgentsFromPlan(userId)        │
│    - Verifica Membership.planId     │
│    - Verifica User.planId           │
│    - Devuelve agentes del plan      │
├─────────────────────────────────────┤
│ 2. getUserEnabledAgents()           │
│    - Filtra por UserAIControl       │
│    - Usuario puede desactivar       │
├─────────────────────────────────────┤
│ 3. Carga AgentConfig del tenant     │
│    - Cultura corporativa            │
│    - Valores, misión, tono          │
└─────────────────────────────────────┘
        ↓
buildSuperAgentPrompt()
        ↓
┌─────────────────────────────────────┐
│ Prompt incluye:                     │
│ - Plan del usuario                  │
│ - Cultura corporativa               │
│ - Agentes habilitados (✅)          │
│ - Agentes no disponibles (❌)       │
└─────────────────────────────────────┘
        ↓
SuperAgent orquesta subagentes habilitados
        ↓
Respuesta al usuario
```

---

## 🚀 Comandos para Continuar

```bash
# 1. Ir al directorio correcto
cd /Users/eduardogonzalez/Desktop/rowi

# 2. Ver estado actual
git status

# 3. Verificar schema de Prisma
cat prisma/schema.prisma | grep -A 20 "model AgentConfig"

# 4. Ejecutar migración (cuando schema esté listo)
npx prisma migrate dev --name add_culture_fields

# 5. Ejecutar seed
npx prisma db seed

# 6. Iniciar desarrollo
npm run dev
```

---

## 📝 Notas Importantes

1. **Directorio de trabajo:** `/Users/eduardogonzalez/Desktop/rowi` (NO rowi2.1)

2. **Los prompts base se mantienen en los archivos .ts** - La cultura solo se AGREGA, no reemplaza

3. **Prioridad de planes:**
   - Primero: `Membership.planId` (plan empresarial del tenant)
   - Segundo: `User.planId` (plan personal del usuario)

4. **SuperAgent siempre disponible** - Aunque el usuario desactive agentes, "super" siempre está

5. **Campos de cultura en AgentConfig** - Todos los agentes del tenant comparten la misma cultura
