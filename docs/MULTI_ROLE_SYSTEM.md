# 🎭 Sistema Multi-Rol de Rowi

> Un usuario puede tener múltiples roles en múltiples contextos simultáneamente
> Fecha: 2025-01-31

---

## 📋 Tabla de Contenidos

1. [Concepto Multi-Rol](#concepto-multi-rol)
2. [Tipos de Usuario](#tipos-de-usuario)
3. [Jerarquía de Roles](#jerarquía-de-roles)
4. [Matriz de Permisos](#matriz-de-permisos)
5. [Vistas por Rol](#vistas-por-rol)
6. [Implementación Técnica](#implementación-técnica)
7. [Casos de Uso](#casos-de-uso)

---

## 🌟 Concepto Multi-Rol

### Principio Fundamental

> **Un usuario NO es un rol, un usuario TIENE roles en diferentes contextos.**

### Ejemplo Real

**María García** puede ser simultáneamente:

| Contexto | Rol | Permisos |
|----------|-----|----------|
| **Global** | Usuario Premium | Acceso a features premium |
| **SuperHub "Six Seconds"** | Network Leader | Ver métricas LATAM |
| **Hub "LATAM"** | Admin | Gestionar region |
| **Tenant "EQ México"** | Owner | Control total |
| **Tenant "EQ Perú"** | Consultant | Ver métricas, coachear |
| **Tenant "Acme Corp"** | HR Consultant | Gestionar como externo |
| **Community "Coaches LATAM"** | Admin | Moderar comunidad |
| **Community "Equipo Ventas"** | Coach | Coachear miembros |

### Diagrama de Contextos

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │                      MARÍA GARCÍA                           │
                    │                   (userId: "user_123")                       │
                    └───────────────────────────┬─────────────────────────────────┘
                                                │
        ┌───────────────────────────────────────┼───────────────────────────────────────┐
        │                                       │                                       │
        ▼                                       ▼                                       ▼
┌───────────────────┐                ┌────────────────────┐               ┌───────────────────┐
│   SuperHub Roles  │                │     Hub Roles      │               │   Tenant Roles    │
├───────────────────┤                ├────────────────────┤               ├───────────────────┤
│ Six Seconds:      │                │ LATAM: ADMIN       │               │ EQ México: OWNER  │
│   NETWORK_LEADER  │                │ Mexico: MANAGER    │               │ EQ Perú: VIEWER   │
└───────────────────┘                │ Peru: MEMBER       │               │ Acme: CONSULTANT  │
                                     └────────────────────┘               └───────────────────┘
        │                                       │                                       │
        └───────────────────────────────────────┼───────────────────────────────────────┘
                                                │
                                                ▼
                                    ┌────────────────────┐
                                    │  Community Roles   │
                                    ├────────────────────┤
                                    │ Coaches LATAM: ADMIN│
                                    │ Equipo Ventas: COACH│
                                    │ EQ Network: MEMBER  │
                                    └────────────────────┘
```

---

## 👥 Tipos de Usuario

### 1. Usuario Básico (USER)

**Descripción**: Usuario estándar que consume la plataforma para su desarrollo personal.

| Característica | Valor |
|---------------|-------|
| **Rol global** | USER |
| **Contextos** | 1 tenant, N communities |
| **Vistas** | Dashboard personal |
| **Puede gestionar** | Su perfil, avatar, tareas propias |

**Vistas disponibles**:
- Dashboard personal
- Perfil y Avatar
- EQ y Assessments
- Afinidad (sus conexiones)
- Mis Comunidades
- Mis Tareas (WeekFlow)
- Microlearning
- Chat con Rowi

---

### 2. Team Leader (TEAM_LEADER)

**Descripción**: Líder de un equipo pequeño. Ve métricas de su equipo directo.

| Característica | Valor |
|---------------|-------|
| **Rol global** | USER |
| **Rol en comunidad** | OWNER / ADMIN |
| **Contextos** | 1-3 comunidades bajo su cargo |
| **Vistas** | Dashboard personal + Vista de equipo |

**Vistas adicionales**:
- Mi Equipo (lista de miembros)
- Métricas de Equipo (EQ agregado)
- Tareas del Equipo
- Afinidad del Equipo (mapa de relaciones)
- Asignación de tareas

**Permisos especiales**:
```typescript
{
  community: {
    view_members: true,
    view_metrics: true,
    assign_tasks: true,
    view_affinity_team: true,
    invite_members: true,
  }
}
```

---

### 3. Manager (MANAGER)

**Descripción**: Gerente de múltiples equipos o departamento. Ve métricas agregadas.

| Característica | Valor |
|---------------|-------|
| **Rol global** | USER |
| **Rol en org** | MANAGER |
| **Contextos** | N comunidades, 1 organización |
| **Vistas** | Dashboard personal + Vista de departamento |

**Vistas adicionales**:
- Dashboard de Departamento
- Reportes de Desempeño
- ROI Emocional del área
- Patrones Colectivos
- Benchmarks internos
- Comparativas entre equipos

**Permisos especiales**:
```typescript
{
  organization: {
    view_all_teams: true,
    view_performance: true,
    view_patterns: true,
    view_roi: true,
    export_reports: true,
    approve_leaves: true,
  }
}
```

---

### 4. Region Leader (REGION_LEADER)

**Descripción**: Líder de región que supervisa múltiples hubs/países.

| Característica | Valor |
|---------------|-------|
| **Rol global** | USER |
| **Rol en hub** | ADMIN / OWNER |
| **Contextos** | N hubs, N tenants |
| **Vistas** | Dashboard personal + Vista multi-región |

**Vistas adicionales**:
- Dashboard Regional
- Comparativas por País
- Benchmarks Regionales
- Top Performers por región
- Métricas de Expansión
- Pipeline de Partners

**Permisos especiales**:
```typescript
{
  hub: {
    view_all_tenants: true,
    view_regional_analytics: true,
    compare_markets: true,
    view_benchmarks: true,
    manage_hub_admins: true,
  }
}
```

---

### 5. HR (HUMAN_RESOURCES)

**Descripción**: Profesional de Recursos Humanos dentro de una empresa.

| Característica | Valor |
|---------------|-------|
| **Rol global** | USER |
| **Rol en tenant** | ADMIN / MANAGER |
| **Permisos especiales** | HR_ACCESS |
| **Contextos** | 1 tenant |
| **Vistas** | Dashboard personal + Vista HR |

**Vistas adicionales**:
- Panel de Empleados
- Performance Reviews
- Solicitudes de Ausencia
- Payroll Overview
- Onboarding de empleados
- Reportes de bienestar
- Clima organizacional

**Permisos especiales**:
```typescript
{
  tenant: {
    view_employees: true,
    manage_employees: true,
    view_payroll: true,
    approve_leaves: true,
    view_performance: true,
    create_reviews: true,
    view_wellbeing: true,
    export_hr_data: true,
  }
}
```

---

### 6. Coach (COACH)

**Descripción**: Coach interno o externo que trabaja con individuos o equipos.

| Característica | Valor |
|---------------|-------|
| **Rol global** | USER |
| **Rol en comunidad** | COACH / MENTOR |
| **Feature flag** | `coach_mode` |
| **Contextos** | N coachees, N comunidades |
| **Vistas** | Dashboard personal + Vista Coach |

**Vistas adicionales**:
- Mis Coachees
- Sesiones de Coaching
- Progreso Individual
- Insights por Coachee
- Notas de Sesión
- EQ Histórico
- Recomendaciones IA

**Permisos especiales**:
```typescript
{
  coaching: {
    view_coachee_profile: true,
    view_coachee_eq: true,
    view_coachee_affinity: true,
    create_session_notes: true,
    view_ai_insights: true,
    assign_practices: true,
  }
}
```

---

### 7. HR Consultant / EQ Consultant (CONSULTANT)

**Descripción**: Coach o consultor externo que gestiona MÚLTIPLES empresas como clientes.

| Característica | Valor |
|---------------|-------|
| **Rol global** | USER + CONSULTANT |
| **Rol en cada tenant** | CONSULTANT / VIEWER |
| **Feature flag** | `consultant_mode` |
| **Contextos** | N tenants como consultor |
| **Vistas** | Dashboard personal + Vista Consultor Multi-Empresa |

**Vistas adicionales**:
- **Selector de Empresa** (dropdown global)
- Dashboard por Cliente
- Portafolio de Clientes
- Métricas Comparativas
- Sesiones por Cliente
- Facturación por Cliente
- Reportes Cross-Client

**Permisos especiales**:
```typescript
{
  consultant: {
    switch_tenant_context: true,  // Puede cambiar entre tenants
    view_client_dashboard: true,
    view_client_metrics: true,
    view_client_members: true,
    create_reports: true,
    schedule_sessions: true,
    view_billing: true,
  }
}
```

**UI Especial**:
```
┌─────────────────────────────────────────────────────────────────────┐
│  🏢 Empresa actual: [▼ Coca-Cola México        ]  [Ver todas →]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   📊 Dashboard de Coca-Cola México                                  │
│                                                                      │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│   │ Empleados   │  │ EQ Promedio │  │ Afinidad    │                │
│   │    147      │  │    67.3     │  │    78%      │                │
│   └─────────────┘  └─────────────┘  └─────────────┘                │
│                                                                      │
│   📋 Próximas Sesiones    📈 Progreso del Mes    🎯 Objetivos      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 8. Academic Researcher (RESEARCHER)

**Descripción**: Investigador académico con acceso a datos agregados/anonimizados.

| Característica | Valor |
|---------------|-------|
| **Rol global** | USER |
| **Rol especial** | RESEARCHER |
| **Feature flag** | `research_access` |
| **Contextos** | Benchmarks globales (read-only) |
| **Vistas** | Dashboard personal + Vista Research |

**Vistas adicionales**:
- Benchmarks Globales
- Datos Agregados
- Herramientas Estadísticas
- Exportación Segura
- Estudios de Caso (anonimizados)
- Publicaciones

**Permisos especiales**:
```typescript
{
  research: {
    view_aggregated_data: true,
    view_benchmarks: true,
    export_anonymized: true,
    access_statistics: true,
    view_global_patterns: true,
    // NUNCA datos individuales identificables
  }
}
```

---

### 9. Financial (FINANCIAL)

**Descripción**: Responsable financiero dentro de una empresa.

| Característica | Valor |
|---------------|-------|
| **Rol global** | USER |
| **Rol en tenant** | BILLING / MANAGER |
| **Feature flag** | `finance_access` |
| **Contextos** | 1 tenant |
| **Vistas** | Dashboard personal + Vista Finanzas |

**Vistas adicionales**:
- Dashboard Financiero
- Transacciones
- Facturas
- Presupuestos
- Centros de Costo
- ROI de Programas EQ
- Proyecciones

**Permisos especiales**:
```typescript
{
  finance: {
    view_transactions: true,
    create_transactions: true,
    view_invoices: true,
    create_invoices: true,
    manage_budgets: true,
    view_cost_centers: true,
    export_financial: true,
  }
}
```

---

### 10. System Admin (SYSTEM_ADMIN)

**Descripción**: Administrador del sistema con acceso completo.

| Característica | Valor |
|---------------|-------|
| **Rol global** | SUPERADMIN |
| **Contextos** | Todos |
| **Vistas** | Todo |

**Niveles de System Admin**:

| Nivel | Scope | Ejemplo |
|-------|-------|---------|
| **Hub Admin** | 1 hub + sus tenants | Admin de LATAM |
| **SuperHub Admin** | 1 superhub + todos sus hubs | Admin de Six Seconds |
| **System Admin** | Todo el sistema Rowi | Equipo Rowi |
| **Rowiverse Admin** | Todo incluyendo config global | Founders |

---

## 🏛️ Jerarquía de Roles

### Modelo de Herencia

Los permisos se heredan de arriba hacia abajo, con override en cada nivel:

```
ROWIVERSE (rol global)
    │
    ├── Permisos base del usuario
    │
    └─► SUPERHUB (rol en corporación)
            │
            ├── + Permisos de SuperHub
            │
            └─► HUB (rol en región/división)
                    │
                    ├── + Permisos de Hub
                    │
                    └─► TENANT (rol en empresa)
                            │
                            ├── + Permisos de Tenant
                            │
                            └─► ORGANIZATION (rol en departamento)
                                    │
                                    ├── + Permisos de Organization
                                    │
                                    └─► COMMUNITY (rol en equipo)
                                            │
                                            └── Permisos finales del contexto
```

### Resolución de Permisos

```typescript
function resolvePermissions(userId: string, context: Context): Permissions {
  // 1. Obtener permisos base del usuario
  let permissions = getUserBasePermissions(userId);

  // 2. Agregar permisos por membresías
  if (context.superHubId) {
    const superHubRole = getSuperHubRole(userId, context.superHubId);
    permissions = merge(permissions, getSuperHubPermissions(superHubRole));
  }

  if (context.hubId) {
    const hubRole = getHubRole(userId, context.hubId);
    permissions = merge(permissions, getHubPermissions(hubRole));
  }

  if (context.tenantId) {
    const tenantRole = getTenantRole(userId, context.tenantId);
    permissions = merge(permissions, getTenantPermissions(tenantRole));
  }

  if (context.orgId) {
    const orgRole = getOrgRole(userId, context.orgId);
    permissions = merge(permissions, getOrgPermissions(orgRole));
  }

  if (context.communityId) {
    const communityRole = getCommunityRole(userId, context.communityId);
    permissions = merge(permissions, getCommunityPermissions(communityRole));
  }

  // 3. Aplicar features habilitadas
  const features = getUserFeatures(userId);
  permissions = applyFeatures(permissions, features);

  // 4. Aplicar overrides específicos
  const overrides = getUserPermissionOverrides(userId, context);
  permissions = merge(permissions, overrides);

  return permissions;
}
```

---

## 📊 Matriz de Permisos

### Permisos por Módulo

| Módulo | USER | TEAM_LEADER | MANAGER | REGION_LEADER | HR | COACH | CONSULTANT | RESEARCHER | FINANCIAL | ADMIN |
|--------|------|-------------|---------|---------------|-----|-------|------------|------------|-----------|-------|
| **Dashboard Personal** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Avatar** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **EQ Personal** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Afinidad Personal** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Vista de Equipo** | ❌ | ✅ | ✅ | ✅ | ✅ | ⚡ | ⚡ | ❌ | ❌ | ✅ |
| **Métricas de Equipo** | ❌ | ✅ | ✅ | ✅ | ✅ | ⚡ | ⚡ | ❌ | ❌ | ✅ |
| **Vista de Departamento** | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ⚡ | ❌ | ❌ | ✅ |
| **Reportes de Desempeño** | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ⚡ | ❌ | ❌ | ✅ |
| **Vista Multi-Hub** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ⚡ | ❌ | ❌ | ✅ |
| **Benchmarks Regionales** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ⚡ | ✅ | ❌ | ✅ |
| **Empleados** | ❌ | ❌ | 👀 | 👀 | ✅ | ❌ | ⚡ | ❌ | ❌ | ✅ |
| **Payroll** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Sesiones Coaching** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Multi-Empresa** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Datos Agregados** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Finanzas** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Admin Panel** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

**Leyenda**:
- ✅ = Acceso completo
- ⚡ = Acceso condicional (solo sus clientes/coachees)
- 👀 = Solo lectura
- ❌ = Sin acceso

---

## 🖥️ Vistas por Rol

### Navegación Dinámica

La navegación se construye dinámicamente según los roles del usuario:

```typescript
function buildNavigation(user: User): NavItem[] {
  const nav: NavItem[] = [];

  // Siempre presente
  nav.push({ label: 'Dashboard', href: '/dashboard', icon: 'home' });
  nav.push({ label: 'Perfil', href: '/profile', icon: 'user' });
  nav.push({ label: 'Avatar', href: '/profile/avatar', icon: 'egg' });

  // Basado en features
  if (hasFeature(user, 'eq_enabled')) {
    nav.push({ label: 'Mi EQ', href: '/eq', icon: 'brain' });
  }

  if (hasFeature(user, 'affinity_enabled')) {
    nav.push({ label: 'Afinidad', href: '/affinity', icon: 'heart' });
  }

  // Basado en roles en contextos
  if (hasAnyRole(user, ['TEAM_LEADER', 'MANAGER', 'ADMIN'])) {
    nav.push({
      label: 'Equipo',
      icon: 'users',
      children: [
        { label: 'Miembros', href: '/team/members' },
        { label: 'Métricas', href: '/team/metrics' },
        { label: 'Tareas', href: '/team/tasks' },
      ]
    });
  }

  if (hasRole(user, 'MANAGER')) {
    nav.push({
      label: 'Reportes',
      icon: 'chart',
      children: [
        { label: 'Desempeño', href: '/reports/performance' },
        { label: 'ROI', href: '/reports/roi' },
        { label: 'Patrones', href: '/reports/patterns' },
      ]
    });
  }

  if (hasRole(user, 'HR')) {
    nav.push({
      label: 'HR',
      icon: 'briefcase',
      children: [
        { label: 'Empleados', href: '/hr/employees' },
        { label: 'Reviews', href: '/hr/reviews' },
        { label: 'Ausencias', href: '/hr/leaves' },
      ]
    });
  }

  if (hasRole(user, 'COACH')) {
    nav.push({
      label: 'Coaching',
      icon: 'message-circle',
      children: [
        { label: 'Coachees', href: '/coaching/coachees' },
        { label: 'Sesiones', href: '/coaching/sessions' },
        { label: 'Notas', href: '/coaching/notes' },
      ]
    });
  }

  if (hasRole(user, 'CONSULTANT')) {
    nav.push({
      label: 'Clientes',
      icon: 'building',
      children: [
        { label: 'Portafolio', href: '/clients' },
        { label: 'Comparativas', href: '/clients/compare' },
      ]
    });
  }

  if (hasRole(user, 'FINANCIAL')) {
    nav.push({
      label: 'Finanzas',
      icon: 'dollar-sign',
      children: [
        { label: 'Transacciones', href: '/finance/transactions' },
        { label: 'Facturas', href: '/finance/invoices' },
        { label: 'Presupuestos', href: '/finance/budgets' },
      ]
    });
  }

  if (hasRole(user, 'ADMIN')) {
    nav.push({
      label: 'Admin',
      icon: 'settings',
      children: [
        { label: 'Usuarios', href: '/admin/users' },
        { label: 'Configuración', href: '/admin/settings' },
        { label: 'Integraciones', href: '/admin/integrations' },
      ]
    });
  }

  return nav;
}
```

### Selector de Contexto (para Consultores)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 🦉 ROWI                                         [🔔] [👤 María García ▼]        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │ 🏢 Contexto actual:  ┌─────────────────────────────────────────────────┐ │  │
│  │                      │ ▼ Coca-Cola México                              │ │  │
│  │                      ├─────────────────────────────────────────────────┤ │  │
│  │                      │   ★ Coca-Cola México (actual)                   │ │  │
│  │                      │   ○ Pepsi Latam                                 │ │  │
│  │                      │   ○ Nestlé Peru                                 │ │  │
│  │                      │   ○ Grupo Bimbo                                 │ │  │
│  │                      │   ─────────────────────────                     │ │  │
│  │                      │   + Agregar cliente                             │ │  │
│  │                      │   📊 Ver portafolio completo                    │ │  │
│  │                      └─────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  [Dashboard] [Empleados] [Métricas] [Sesiones] [Reportes]                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 Implementación Técnica

### Modelos de Base de Datos

```prisma
// Nuevo: Rol especial del usuario
model UserRole {
  id          String    @id @default(cuid())
  userId      String
  roleType    SpecialRoleType
  config      Json?     // Configuración específica del rol
  isActive    Boolean   @default(true)
  grantedBy   String?
  grantedAt   DateTime  @default(now())
  expiresAt   DateTime?

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, roleType])
  @@map("user_role")
}

enum SpecialRoleType {
  CONSULTANT       // HR/EQ Consultant multi-tenant
  COACH           // Coach certificado
  RESEARCHER      // Investigador académico
  FINANCIAL       // Acceso financiero
  NETWORK_LEADER  // Líder de red (Six Seconds)
}

// Nuevo: Relación Consultor-Cliente
model ConsultantClient {
  id            String    @id @default(cuid())
  consultantId  String    // Usuario consultor
  tenantId      String    // Tenant cliente
  role          String    @default("CONSULTANT")
  permissions   Json?     // Permisos específicos
  contractStart DateTime?
  contractEnd   DateTime?
  isActive      Boolean   @default(true)
  notes         String?

  consultant    User      @relation("ConsultantRelation", fields: [consultantId], references: [id])
  tenant        Tenant    @relation("TenantClients", fields: [tenantId], references: [id])

  @@unique([consultantId, tenantId])
  @@map("consultant_client")
}
```

### Hook de Permisos

```typescript
// src/hooks/usePermissions.ts

import { useSession } from 'next-auth/react';
import { useContext } from 'react';
import { TenantContext } from '@/contexts/TenantContext';

export function usePermissions() {
  const { data: session } = useSession();
  const { currentTenantId, currentHubId, currentOrgId } = useContext(TenantContext);

  const user = session?.user;

  // Verificar permiso específico
  const hasPermission = (action: string, scope?: string): boolean => {
    if (!user) return false;

    // Superadmin tiene todo
    if (user.role === 'SUPERADMIN') return true;

    // Verificar en permisos específicos del usuario
    const userPermission = user.permissions?.find(
      p => p.action === action &&
           (!scope || p.scope === scope) &&
           p.granted
    );
    if (userPermission) return true;

    // Verificar por rol en contexto actual
    const contextRole = getContextRole(user, {
      tenantId: currentTenantId,
      hubId: currentHubId,
      orgId: currentOrgId,
    });

    return roleHasPermission(contextRole, action);
  };

  // Verificar rol específico
  const hasRole = (role: string, context?: Context): boolean => {
    if (!user) return false;

    // Rol global
    if (user.role === role) return true;

    // Rol en contexto específico
    if (context?.tenantId) {
      const tenantMembership = user.tenantMemberships?.find(
        m => m.tenantId === context.tenantId
      );
      if (tenantMembership?.role === role) return true;
    }

    // ... similar para hub, org, community

    return false;
  };

  // Verificar feature habilitada
  const hasFeature = (feature: string): boolean => {
    if (!user) return false;
    return user.features?.some(f => f.slug === feature && f.enabled) ?? false;
  };

  // Verificar si es consultor
  const isConsultant = (): boolean => {
    return user?.specialRoles?.some(r => r.roleType === 'CONSULTANT') ?? false;
  };

  // Obtener clientes del consultor
  const getConsultantClients = (): ConsultantClient[] => {
    if (!isConsultant()) return [];
    return user?.consultantClients ?? [];
  };

  return {
    hasPermission,
    hasRole,
    hasFeature,
    isConsultant,
    getConsultantClients,
    user,
  };
}
```

### Middleware de Rol

```typescript
// src/middleware/roleGuard.ts

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const ROLE_ROUTES: Record<string, string[]> = {
  '/admin': ['SUPERADMIN', 'ADMIN'],
  '/hr': ['HR', 'ADMIN', 'SUPERADMIN'],
  '/finance': ['FINANCIAL', 'BILLING', 'ADMIN', 'SUPERADMIN'],
  '/coaching': ['COACH', 'CONSULTANT', 'ADMIN', 'SUPERADMIN'],
  '/clients': ['CONSULTANT', 'ADMIN', 'SUPERADMIN'],
  '/research': ['RESEARCHER', 'ADMIN', 'SUPERADMIN'],
  '/team': ['TEAM_LEADER', 'MANAGER', 'ADMIN', 'SUPERADMIN'],
  '/reports': ['MANAGER', 'REGION_LEADER', 'ADMIN', 'SUPERADMIN'],
};

export async function roleGuard(request: NextRequest) {
  const token = await getToken({ req: request });

  if (!token) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  const path = request.nextUrl.pathname;

  // Encontrar regla de ruta
  for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
    if (path.startsWith(route)) {
      const userRoles = getAllUserRoles(token);
      const hasAccess = userRoles.some(role => allowedRoles.includes(role));

      if (!hasAccess) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }
  }

  return NextResponse.next();
}

function getAllUserRoles(token: JWT): string[] {
  const roles: string[] = [];

  // Rol global
  if (token.role) roles.push(token.role);

  // Roles especiales
  if (token.specialRoles) {
    roles.push(...token.specialRoles.map(r => r.roleType));
  }

  // Roles de membresías
  if (token.hubMemberships) {
    roles.push(...token.hubMemberships.map(m => m.role));
  }

  if (token.tenantMemberships) {
    roles.push(...token.tenantMemberships.map(m => m.role));
  }

  return [...new Set(roles)]; // Únicos
}
```

---

## 📖 Casos de Uso

### Caso 1: Coach de Six Seconds con Clientes Corporativos

**Persona**: Carlos López
- Network Leader de Six Seconds LATAM
- Coach certificado EQ
- 5 empresas como clientes

**Configuración**:
```typescript
{
  user: {
    role: 'USER',
    specialRoles: ['COACH', 'CONSULTANT', 'NETWORK_LEADER'],
  },
  memberships: {
    superHub: { id: 'six-seconds', role: 'NETWORK_LEADER' },
    hub: { id: 'latam', role: 'ADMIN' },
  },
  consultantClients: [
    { tenantId: 'coca-cola-mx', role: 'CONSULTANT' },
    { tenantId: 'bimbo', role: 'CONSULTANT' },
    { tenantId: 'cemex', role: 'CONSULTANT' },
    { tenantId: 'femsa', role: 'CONSULTANT' },
    { tenantId: 'banorte', role: 'CONSULTANT' },
  ],
  features: ['consultant_mode', 'coach_mode', 'benchmark_access'],
}
```

**Vistas disponibles**:
- Dashboard personal
- Selector de empresa (5 clientes)
- Dashboard por cliente
- Sesiones de coaching
- Métricas de red LATAM
- Benchmarks comparativos

---

### Caso 2: Gerente de HR con Múltiples Países

**Persona**: Ana Martínez
- HR Director LATAM para Teleperformance
- Gestiona HR de 3 países

**Configuración**:
```typescript
{
  user: {
    role: 'USER',
    specialRoles: ['HR'],
  },
  memberships: {
    hub: { id: 'tp-latam', role: 'ADMIN' },
    tenants: [
      { tenantId: 'tp-mexico', role: 'ADMIN' },
      { tenantId: 'tp-colombia', role: 'ADMIN' },
      { tenantId: 'tp-peru', role: 'VIEWER' },
    ],
  },
  features: ['hr_access', 'multi_tenant_view'],
}
```

**Vistas disponibles**:
- Dashboard personal
- Selector de país
- Panel HR por país
- Empleados (por país)
- Performance reviews
- Comparativas regionales
- Payroll consolidado

---

### Caso 3: Usuario que es Team Leader en un equipo y Miembro en otro

**Persona**: Roberto Sánchez
- Team Leader del equipo de Ventas
- Miembro del equipo de Innovación (como colaborador)

**Configuración**:
```typescript
{
  user: {
    role: 'USER',
  },
  memberships: {
    communities: [
      { communityId: 'ventas-mx', role: 'OWNER' },
      { communityId: 'innovacion', role: 'MEMBER' },
    ],
  },
}
```

**Comportamiento**:
- En `/team` ve su equipo de Ventas
- En `/communities` ve ambas comunidades
- Puede gestionar miembros de Ventas
- Solo puede participar en Innovación

---

## 🚀 Próximos Pasos de Implementación

1. [ ] Crear modelo `UserRole` y `ConsultantClient` en Prisma
2. [ ] Implementar `usePermissions` hook
3. [ ] Crear `roleGuard` middleware
4. [ ] Desarrollar selector de contexto para consultores
5. [ ] Implementar navegación dinámica
6. [ ] Crear vistas específicas por rol
7. [ ] Tests de permisos por rol

---

*Sistema Multi-Rol de Rowi - Documento de Diseño*
*Fecha: 2025-01-31*
