# ROWI SIA — Manual de Uso Completo

> **Versión:** Post-auditoría Febrero 2026
> **Stack:** Next.js 16 + React 19 + Prisma 6 + Neon PostgreSQL + Vercel
> **Arquitectura:** Multi-tenant (RowiVerse → System → SuperHub → Tenant → Hub → Community)

---

## Tabla de Contenidos

1. [Autenticación](#1-autenticación)
2. [Dashboard](#2-dashboard)
3. [Benchmarks](#3-benchmarks)
4. [Comunidades](#4-comunidades)
5. [EQ / Inteligencia Emocional](#5-eq--inteligencia-emocional)
6. [Afinidad](#6-afinidad)
7. [Sistema Social](#7-sistema-social)
8. [Gamificación](#8-gamificación)
9. [Agentes IA / Rowi Coach](#9-agentes-ia--rowi-coach)
10. [Hub Admin](#10-hub-admin)
11. [WeekFlow / Microlearning](#11-weekflow--microlearning)
12. [Familia](#12-familia)
13. [Notificaciones](#13-notificaciones)
14. [Perfil y Configuración](#14-perfil-y-configuración)
15. [Billing / Stripe](#15-billing--stripe)
16. [RowiVerse](#16-rowiverse)
17. [Knowledge Hub](#17-knowledge-hub)
18. [Referencia API Completa](#18-referencia-api-completa)
19. [Troubleshooting](#19-troubleshooting)

---

## 1. Autenticación

### Flujo de Login
- **Ruta UI:** `/signin`
- **Métodos:** Google OAuth, Six Seconds SSO, Email/Password (pendiente TODO)
- **Sesión:** NextAuth con JWT, cookies seguras

### Registro
- **Ruta UI:** `/register`
- **API:** `POST /api/auth/register`
- **Campos:** nombre, email, password (bcrypt cost 12)

### SSO Six Seconds
- **Callback:** `GET /api/auth/six-seconds/callback`
- **Flujo:** Redirect → Six Seconds → Callback → Crear/vincular usuario → Dashboard

### Invitaciones
- **Ruta UI:** `/invite/[token]`
- **API:** `GET /api/admin/users/invite/[token]`

---

## 2. Dashboard

### Ruta UI
`/dashboard` — Página principal del usuario autenticado

### Funcionalidad
- Visualización de scores EQ (SEI)
- Competencias emocionales con gráficos radar
- Talentos cerebrales (Brain Talents)
- Outcomes de vida (Life Outcomes)
- Estado de ánimo actual
- Acceso rápido a Rowi Coach

### APIs Utilizadas
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/eq/me` | GET | Datos EQ del usuario actual |
| `/api/eq/snapshots` | GET | Historial de snapshots |
| `/api/eq/progress` | GET | Progreso emocional |

---

## 3. Benchmarks

### Rutas UI
| Ruta | Descripción |
|------|-------------|
| `/hub/admin/benchmarks` | Lista de benchmarks |
| `/hub/admin/benchmarks/upload` | Subir archivo CSV/Excel |
| `/hub/admin/benchmarks/[id]` | Detalle del benchmark |
| `/hub/admin/benchmarks/[id]/stats` | Estadísticas |
| `/hub/admin/benchmarks/[id]/compare` | Comparaciones |
| `/hub/admin/benchmarks/[id]/correlations` | Correlaciones |
| `/hub/admin/benchmarks/[id]/top-performers` | Top performers |

### Flujo de Upload (Corregido)

```
1. Usuario arrastra archivo (.xlsx, .xls, .csv) → Dropzone
2. Upload directo a Vercel Blob (hasta 500MB)
   → POST /api/admin/benchmarks/blob-token
3. Iniciar procesamiento
   → POST /api/admin/benchmarks/start-processing
   Body: { blobUrl, name, type, scope, isLearning }
   Tipos válidos: ROWIVERSE | EXTERNAL | INTERNAL
   Scopes válidos: GLOBAL | REGION | COUNTRY | SECTOR | TENANT | HUB
4. Procesamiento en background (hasta 5 min)
   → POST /api/admin/benchmarks/process-blob
   (autenticado via BENCHMARK_SERVICE_TOKEN)
5. Polling del estado
   → GET /api/admin/benchmarks/job/[jobId]
   (cada 1.5-3 segundos, muestra barra de progreso)
6. Completado → Redirect al detalle
```

### APIs de Benchmark
| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/api/admin/benchmarks` | GET | SuperAdmin | Listar benchmarks |
| `/api/admin/benchmarks/blob-token` | POST | SuperAdmin | Token para upload |
| `/api/admin/benchmarks/start-processing` | POST | SuperAdmin | Iniciar procesamiento |
| `/api/admin/benchmarks/process-blob` | POST | Service Token | Procesar archivo |
| `/api/admin/benchmarks/job/[jobId]` | GET | Session | Estado del job |
| `/api/admin/benchmarks/[id]` | GET/PATCH/DELETE | Session | CRUD detalle |
| `/api/admin/benchmarks/[id]/stats` | GET | Session | Estadísticas |
| `/api/admin/benchmarks/[id]/correlations` | GET | Session | Correlaciones |
| `/api/admin/benchmarks/[id]/top-performers` | GET | Session | Top performers |
| `/api/admin/benchmarks/compare` | POST | Session | Comparar benchmarks |

### Requisitos del Archivo
- Formato: CSV o Excel (.xlsx, .xls)
- Columnas: Mapeadas via SOH_COLUMN_MAPPING (Six Seconds)
- Campos principales: selfAwareness, selfManagement, selfDirection, y 8 competencias EQ
- Opcionales: país, región, sector, edad, género, rol

---

## 4. Comunidades

### Rutas UI
| Ruta | Descripción |
|------|-------------|
| `/community` | Lista de comunidades del usuario |
| `/hub/admin/communities` | Gestión admin de comunidades |
| `/hub/admin/communities/import` | Importar desde Six Seconds |
| `/hub/admin/communities/[id]/members` | Miembros de comunidad |
| `/settings/communities` | Mis comunidades (usuario) |

### Crear Comunidad (Corregido)
```
POST /api/hub/communities
Headers: Authorization (NextAuth JWT)
Body: {
  name: string (requerido),
  slug?: string (auto-generado si no se envía, con deduplicación),
  description?: string,
  visibility?: "public" | "private",
  category?: string,
  teamType?: string,
  bannerUrl?: string,
  hubId?: string,
  tenantId?: string,
  superHubId?: string,
  organizationId?: string
}
```

**Flujo interno:**
1. Autenticación via JWT
2. Resolución automática de jerarquía (Hub → SuperHub → Tenant → Org)
3. Generación de slug con deduplicación automática (agrega `-1`, `-2`, etc.)
4. Creación de RowiCommunity
5. Creación/verificación de RowiVerseUser
6. Creación de RowiCommunityUser con role "owner"

### APIs de Comunidades
| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/api/hub/communities` | GET | Pública | Listar comunidades |
| `/api/hub/communities` | POST | JWT | Crear comunidad |
| `/api/hub/communities/[id]` | PATCH/PUT | JWT | Editar comunidad |
| `/api/hub/communities/[id]` | DELETE | JWT | Eliminar comunidad |
| `/api/hub/communities/create-dynamic` | POST | JWT | Creación automática |
| `/api/hub/communities/import` | POST | JWT | Importar desde CSV |
| `/api/hub/communities/link-all` | POST | — | Vincular miembros |
| `/api/hub/communities/members` | GET | — | Listar miembros |
| `/api/user/communities` | GET | JWT | Mis comunidades |
| `/api/six-seconds/communities` | GET/POST | SSO | Sync Six Seconds |

---

## 5. EQ / Inteligencia Emocional

### Modelo SEI (Six Seconds Emotional Intelligence)
El sistema evalúa 8 competencias agrupadas en 3 áreas:

**Self-Awareness (Conciencia)**
- Enhance Emotional Literacy
- Recognize Patterns

**Self-Management (Gestión)**
- Apply Consequential Thinking
- Navigate Emotions
- Engage Intrinsic Motivation
- Exercise Optimism

**Self-Direction (Dirección)**
- Increase Empathy
- Pursue Noble Goals

### Rutas UI
| Ruta | Descripción |
|------|-------------|
| `/hub/eq` | Dashboard EQ personal |
| `/hub/eq/progress` | Progreso en el tiempo |
| `/hub/eq/snapshots` | Historial de evaluaciones |
| `/hub/eq/talents` | Brain Talents |
| `/hub/eq/success` | Life Outcomes |
| `/hub/admin/eq` | Admin EQ |
| `/hub/admin/eq-upload` | Upload CSV de datos EQ |

### APIs
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/eq/me` | GET | Mi EQ actual (competencias, talentos, outcomes) |
| `/api/eq/snapshots` | GET/POST | CRUD de snapshots |
| `/api/eq/progress` | GET | Progreso histórico |
| `/api/eq/at` | GET | EQ en momento específico |
| `/api/emotional-config` | GET/POST | Configuración emocional (ahora con auth) |
| `/api/admin/eq/stats` | GET/POST | Estadísticas admin |

---

## 6. Afinidad

### Rutas UI
- `/affinity` — Dashboard de afinidad personal
- `/hub/admin/affinity` — Gestión admin

### Análisis Disponibles
- **Composite Score:** Puntuación compuesta de EQ
- **Leadership Profile:** Estilo de liderazgo
- **Decision Pattern:** Patrón de toma de decisiones
- **Innovation Capacity:** Capacidad de innovación
- **Growth Potential:** Potencial de crecimiento
- **Team Dynamics:** Dinámicas de equipo

### APIs
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/affinity` | GET/POST | Datos de afinidad |
| `/api/affinity/composite` | GET | Score compuesto |
| `/api/affinity/leadership` | GET | Perfil de liderazgo |
| `/api/affinity/growth` | GET | Potencial de crecimiento |
| `/api/affinity/interpret` | POST | Interpretación IA |
| `/api/affinity/conversation` | POST | Conversación IA |

---

## 7. Sistema Social

### Rutas UI
| Ruta | Descripción |
|------|-------------|
| `/social/feed` | Feed social |
| `/social/goals` | Metas personales/grupales |
| `/social/goals/[id]` | Detalle de meta |
| `/social/connections` | Red de conexiones |
| `/social/messages` | Mensajería directa |
| `/profile/[username]` | Perfil público |

### Funcionalidades
- **Feed:** Posts, reacciones, comentarios
- **Goals:** Crear metas, trackear progreso, metas compartidas
- **Connections:** Agregar contactos, sugerencias de conexión
- **Messages:** Chat directo 1:1 y grupal

### APIs Principales
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/social/feed` | GET/POST | Feed y crear posts |
| `/api/social/feed/[id]/reactions` | POST | Reaccionar a post |
| `/api/social/goals` | GET/POST | CRUD de metas |
| `/api/social/goals/[id]/updates` | GET/POST | Updates de progreso |
| `/api/social/connections` | GET/POST | Gestionar conexiones |
| `/api/social/messages/threads` | GET/POST | Threads de mensajes |

---

## 8. Gamificación

### Rutas UI
| Ruta | Descripción |
|------|-------------|
| `/me/gamification` | Mi progreso de gamificación |
| `/me/gamification/achievements` | Logros |
| `/me/gamification/leaderboard` | Tabla de posiciones |
| `/me/gamification/rewards` | Recompensas |
| `/hub/admin/gamification` | Admin gamificación |

### Sistema de Puntos
- **Acciones:** Completar evaluaciones, lograr metas, participar en comunidad
- **Niveles:** Progresión basada en puntos acumulados
- **Streaks:** Rachas de actividad consecutiva
- **Achievements:** Logros desbloqueables por hitos
- **Leaderboard:** Ranking semanal/mensual/total

### APIs
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/gamification/me` | GET | Mi estado de gamificación |
| `/api/gamification/leaderboard` | GET | Leaderboard |
| `/api/gamification/rewards` | GET | Recompensas disponibles |

---

## 9. Agentes IA / Rowi Coach

### Rutas UI
| Ruta | Descripción |
|------|-------------|
| `/rowi` | Rowi Coach (chat IA) |
| `/hub/admin/agents` | Gestión de agentes |
| `/hub/admin/ai` | Configuración IA |
| `/hub/admin/ai/prompts` | Gestión de prompts |
| `/hub/admin/knowledge` | Base de conocimiento |

### Rowi Coach
El coach de IA usa:
- OpenAI GPT-4o/GPT-4o-mini como motor
- Contexto del perfil EQ del usuario
- Base de conocimiento configurada por admin
- Tono y personalidad configurable por tenant

### APIs
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/rowi` | POST | Chat con Rowi Coach |
| `/api/ai/engine` | POST | Motor IA core |
| `/api/admin/agents` | GET/POST | CRUD de agentes |
| `/api/admin/agents/toggle` | POST | Activar/desactivar |
| `/api/hub/knowledge` | GET/POST/PATCH/DELETE | Base de conocimiento |

---

## 10. Hub Admin

### Panel Principal
- **Ruta:** `/hub/admin`
- **Acceso:** Requiere rol admin o superior

### Módulos Admin
| Módulo | Ruta | Descripción |
|--------|------|-------------|
| Usuarios | `/hub/admin/users` | Gestión de usuarios, importación, invitaciones |
| Organizaciones | `/hub/admin/organizations` | Jerarquía organizacional |
| Roles | `/hub/admin/roles` | Definición de roles y permisos |
| Configuración | `/hub/admin/settings` | Configuración del hub |
| Traducciones | `/hub/admin/translations` | Gestión de i18n |
| Branding | `/hub/admin/branding` | Temas y marca visual |
| Páginas | `/hub/admin/pages` | Landing pages |
| CMS | `/hub/admin/cms` | Gestión de contenido |
| Logs | `/hub/admin/logs` | Logs del sistema |
| System Health | `/hub/admin/system-health` | Estado del sistema |

### Jerarquía de Roles
```
SuperAdmin (rowiverse level)
  └─ SystemAdmin (system level)
      └─ TenantAdmin (tenant level)
          └─ HubAdmin (hub level)
              └─ CommunityAdmin (community level)
                  └─ Member (basic user)
```

---

## 11. WeekFlow / Microlearning

### Rutas UI
| Ruta | Descripción |
|------|-------------|
| `/weekflow` | Dashboard WeekFlow |
| `/weekflow/[hubId]/checkin` | Check-in semanal |
| `/weekflow/tasks` | Lista de tareas |
| `/learning` | Contenido de microlearning |

### Flujo Semanal
1. **Lunes:** Check-in emocional de inicio de semana
2. **Diario:** Gestión de tareas con contexto emocional
3. **Viernes:** Reflexión semanal y puntuación
4. **Ongoing:** Microlearning adaptativo

### APIs
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/weekflow/sessions` | GET/POST | Sesiones semanales |
| `/api/weekflow/tasks` | GET/POST | CRUD de tareas |
| `/api/weekflow/checkin` | POST | Check-in semanal |
| `/api/weekflow/metrics` | GET | Métricas de progreso |
| `/api/microlearning` | GET/POST | Contenido de aprendizaje |
| `/api/microlearning/progress` | GET/POST | Progreso de aprendizaje |

---

## 12. Familia

### Ruta UI
- `/settings/family` — Gestión de familia

### Funcionalidad
- Crear grupo familiar
- Invitar miembros
- Compartir progreso EQ entre familia

### APIs
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/family` | GET/POST | Datos familiares |
| `/api/family/members` | GET/POST | Miembros de familia |
| `/api/family/invite` | POST | Invitar familiar |

---

## 13. Notificaciones

### Ruta UI
- `/settings/notifications` — Preferencias de notificación

### Tipos de Notificación
- Push (web push via service worker)
- In-app (toast notifications via Sonner)
- Email (pendiente integración completa)

### APIs
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/notifications` | GET | Listar notificaciones |
| `/api/notifications/preferences` | GET/POST | Preferencias |
| `/api/notifications/push/subscribe` | POST | Suscribir a push |

---

## 14. Perfil y Configuración

### Rutas UI
| Ruta | Descripción |
|------|-------------|
| `/profile` | Mi perfil |
| `/profile/avatar` | Editor de avatar |
| `/settings` | Configuración general |
| `/settings/profile` | Editar perfil |
| `/settings/appearance` | Tema y apariencia |
| `/settings/privacy` | Privacidad |
| `/settings/communities` | Mis comunidades |

### APIs
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/user/me` | GET | Usuario actual |
| `/api/user/profile` | GET | Perfil completo |
| `/api/user/communities` | GET | Mis comunidades (nuevo) |
| `/api/profile` | POST | Actualizar perfil |
| `/api/preferences` | GET/POST | Preferencias |
| `/api/avatar` | GET/POST | Avatar |

---

## 15. Billing / Stripe

### Rutas UI
| Ruta | Descripción |
|------|-------------|
| `/settings/subscription` | Mi suscripción |
| `/hub/admin/plans` | Gestión de planes |
| `/hub/admin/sales/dashboard` | Dashboard de ventas |

### Flujo de Pago
1. Usuario selecciona plan → `POST /api/stripe/checkout`
2. Redirect a Stripe Checkout
3. Webhook procesa el pago → `POST /api/stripe/webhook`
4. Activación automática del plan

### APIs
| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/api/plans` | GET | Pública | Listar planes |
| `/api/stripe/checkout` | POST | JWT | Crear checkout |
| `/api/stripe/portal` | GET | JWT | Portal de billing |
| `/api/stripe/webhook` | POST | Stripe signature | Webhooks |

---

## 16. RowiVerse

### Descripción
Ecosistema global que conecta todos los hubs, tenants y comunidades.

### Rutas UI
- `/settings/rowiverse` — Configuración RowiVerse
- `/hub/admin/rowiverse` — Admin RowiVerse

### APIs
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/hub/rowiverse` | GET | Vista del RowiVerse |
| `/api/hub/rowiverse/bootstrap` | POST | Inicializar |
| `/api/hub/rowiverse/insights` | GET | Insights globales |
| `/api/rowiverse/contribute` | POST | Contribuir |

---

## 17. Knowledge Hub

### Ruta UI
- `/hub/admin/knowledge` — Gestión de conocimiento

### Funcionalidad
- Crear recursos de conocimiento
- Conectar con agentes IA
- Tags y categorización
- Resumen automático con IA (GPT-4o-mini)

### APIs
| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/api/hub/knowledge` | GET | — | Listar recursos |
| `/api/hub/knowledge` | POST | — | Crear recurso (con resumen IA) |
| `/api/hub/knowledge` | PATCH | — | Actualizar recurso |
| `/api/hub/knowledge` | DELETE | — | Eliminar recurso |

---

## 18. Referencia API Completa

### Autenticación de APIs
La mayoría de APIs usan NextAuth JWT. El token se envía automáticamente via cookies.

**Headers opcionales:**
- `x-service-token` — Para llamadas entre servicios (ej: process-blob)
- `Authorization: Bearer <token>` — Para llamadas externas

### Códigos de Respuesta
| Código | Significado |
|--------|-------------|
| 200 | OK |
| 201 | Creado |
| 400 | Datos inválidos |
| 401 | No autenticado |
| 403 | No autorizado (rol insuficiente) |
| 404 | No encontrado |
| 409 | Conflicto (duplicado) |
| 500 | Error interno |

### Formato de Respuesta Estándar
```json
{
  "ok": true,
  "data": { ... },
  "message": "Operación exitosa"
}
```

```json
{
  "ok": false,
  "error": "Descripción del error"
}
```

---

## 19. Troubleshooting

### Benchmark Upload No Funciona
**Problema:** El upload se queda en "procesando" o falla
**Causas posibles:**
1. `BENCHMARK_SERVICE_TOKEN` no está configurado en `.env` — Necesario para la comunicación interna entre start-processing y process-blob
2. Archivo Excel con columnas no reconocidas — Verificar contra SOH_COLUMN_MAPPING
3. Timeout de 5 minutos excedido — Archivos muy grandes (>50k filas)

**Solución:**
- Verificar que `BENCHMARK_SERVICE_TOKEN` esté en `.env` y en Vercel
- Verificar que `NEXTAUTH_URL` esté configurado correctamente
- Para archivos grandes, usar el formato CSV en lugar de Excel

### Crear Comunidad Falla
**Problema:** Error al crear comunidad, se queda cargando
**Causas posibles:**
1. Slug duplicado (corregido — ahora auto-deduplica)
2. RowiVerse root no inicializado — Ejecutar startup del sistema
3. Usuario sin membresía de hub

**Solución:**
- Verificar que el sistema esté inicializado (RowiVerse root existe)
- Verificar la sesión del usuario esté activa

### Errores 401 en APIs
**Problema:** APIs retornan "No autorizado"
**Causas posibles:**
1. Sesión expirada
2. Cookie de NextAuth no presente
3. `NEXTAUTH_SECRET` diferente entre entornos

**Solución:**
- Cerrar sesión y volver a iniciar
- Verificar `NEXTAUTH_SECRET` en `.env`

### Variables de Entorno Requeridas
```
# Base de datos
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://www.rowiia.com

# IA
OPENAI_API_KEY=sk-...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Vercel Blob
BLOB_READ_WRITE_TOKEN=...

# Six Seconds SSO
SIX_SECONDS_CLIENT_ID=...
SIX_SECONDS_CLIENT_SECRET=...
SIX_SECONDS_SSO_URL=...

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Benchmark (NUEVO — requerido)
BENCHMARK_SERVICE_TOKEN=... (cualquier string secreto)

# Admin
HUB_ADMINS=admin@rowiia.com,otro@admin.com
```

---

*Manual generado durante auditoría de producción — Febrero 2026*
