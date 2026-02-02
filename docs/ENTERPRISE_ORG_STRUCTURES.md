# 🏢 Estructuras Organizacionales Enterprise

> Análisis de estructuras corporativas para escalar Rowi a grandes empresas
> Fecha: 2025-01-31

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Apple](#apple)
3. [Coca-Cola](#coca-cola)
4. [Teleperformance](#teleperformance)
5. [FedEx](#fedex)
6. [Komatsu](#komatsu)
7. [Six Seconds](#six-seconds)
8. [Patrones Comunes](#patrones-comunes)
9. [Mapeo a Rowi](#mapeo-a-rowi)

---

## 📊 Resumen Ejecutivo

### Patrones Identificados en Empresas Enterprise

| Nivel | Apple | Coca-Cola | FedEx | Teleperformance | Komatsu | Six Seconds |
|-------|-------|-----------|-------|-----------------|---------|-------------|
| **Global** | CEO + SVPs | CEO + C-Suite | CEO | Chairman + CEO | President | Founders |
| **Regional** | Americas/EMEA/APAC/China | Americas/EMEA/APAC/LATAM | US/Canada/EMEA/APAC/LAC/MEISA | Americas/EMEA/APAC | Americas/Europe/APAC | APAC/LATAM/EMEA |
| **Divisional** | Funcional (SW/HW/Retail) | Productos (Sparkling/Hydration) | Servicios (Express/Ground/Freight) | Servicios (Core/Specialized) | Productos (Construction/Mining) | Sectores (Biz/Edu/Gov) |
| **Local** | Oficinas regionales | Market Units | Centros de distribución | Delivery Centers | Plantas/Dealers | Partners/Certified |
| **Equipo** | Equipos de producto | Equipos de marca | Equipos operativos | Equipos de cuenta | Equipos de proyecto | Network Leaders |

---

## 🍎 Apple

### Estructura Jerárquica Funcional

```
                            ┌─────────────────┐
                            │   Tim Cook      │
                            │      CEO        │
                            └────────┬────────┘
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
   ┌────┴────┐                 ┌─────┴─────┐               ┌──────┴──────┐
   │  COO    │                 │   CFO     │               │   Legal     │
   │Jeff Will│                 │Luca Maest │               │ Kate Adams  │
   └────┬────┘                 └───────────┘               └─────────────┘
        │
┌───────┼───────┬───────────┬───────────┬───────────┬───────────┐
│       │       │           │           │           │           │
▼       ▼       ▼           ▼           ▼           ▼           ▼
┌────┐ ┌────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ HW │ │ SW │ │Services│ │  ML/AI │ │ Retail │ │Marketing│ │  Ops   │
│Eng │ │Eng │ │        │ │        │ │& People│ │        │ │        │
└─┬──┘ └─┬──┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘
  │      │
  │      └─── iOS, macOS, watchOS
  │
  └─── iPhone, iPad, Mac, Watch, Vision Pro
```

### Regiones Geográficas

| Región | Descripción | Responsabilidades |
|--------|-------------|-------------------|
| **Americas** | Mayor volumen de ventas | US, Canadá, LATAM |
| **Europe** | Mercado clave | EU, UK |
| **Greater China** | Mercado estratégico | China, Hong Kong, Taiwan |
| **APAC** | Crecimiento | Japón, Corea, Australia, India |

### Características Clave

- **Spoke-and-Wheel**: Decisiones centralizadas en HQ
- **Funcional**: Organizado por expertise, no por producto
- **164,000+ empleados** globalmente
- SVPs reportan directamente al CEO

**Fuente**: [Panmore](https://panmore.com/apple-inc-organizational-structure-features-pros-cons), [FourWeekMBA](https://fourweekmba.com/apple-organizational-structure/)

---

## 🥤 Coca-Cola

### Estructura Matricial Geográfica-Funcional

```
                         ┌──────────────────┐
                         │  James Quincey   │
                         │       CEO        │
                         └────────┬─────────┘
                                  │
         ┌────────────────────────┼────────────────────────────┐
         │                        │                            │
    ┌────┴────┐             ┌─────┴─────┐              ┌───────┴───────┐
    │   COO   │             │   CFO     │              │     CMO       │
    │H. Braun │             │ J. Murphy │              │               │
    └────┬────┘             └───────────┘              └───────┬───────┘
         │                                                     │
         │                                        ┌────────────┼────────────┐
         │                                        ▼            ▼            ▼
         │                                   ┌────────┐  ┌─────────┐  ┌────────┐
         │                                   │Sparkling│  │Hydration│  │ Coffee │
         │                                   │ Flavors │  │ Sports  │  │  Tea   │
         │                                   └────────┘  └─────────┘  └────────┘
         │
    ┌────┴────────────────────────────────────────┐
    │              OPERATING UNITS                 │
    ├──────────────┬──────────────┬───────────────┤
    ▼              ▼              ▼               ▼
┌────────┐    ┌────────┐    ┌────────┐     ┌──────────┐
│  EMEA  │    │ LATAM  │    │  APAC  │     │ N.America│
└────┬───┘    └────┬───┘    └────┬───┘     └────┬─────┘
     │             │             │              │
     ▼             ▼             ▼              ▼
┌─────────┐  ┌─────────┐  ┌─────────┐    ┌─────────┐
│ Market  │  │ Market  │  │ Market  │    │ Market  │
│  Units  │  │  Units  │  │  Units  │    │  Units  │
└─────────┘  └─────────┘  └─────────┘    └─────────┘
     │
     └─── Bottling Partners (Franquicia)
```

### Segmentos de Negocio

| Segmento | Tipo | Descripción |
|----------|------|-------------|
| **EMEA** | Geográfico | Europa, Medio Oriente, África |
| **Latin America** | Geográfico | Sudamérica, Centroamérica, México |
| **Asia Pacific** | Geográfico | APAC completo |
| **North America** | Geográfico | US y Canadá |
| **Global Ventures** | Negocio | Costa Coffee, otras adquisiciones |
| **Bottling Investments** | Negocio | Operaciones de embotellado |

### Categorías de Producto

- Sparkling Flavors (Coca-Cola, Sprite, Fanta)
- Hydration (Dasani, SmartWater)
- Sports (Powerade)
- Coffee and Tea (Costa, Gold Peak)

### Características Clave

- **Matriz compleja**: Geográfica + Producto + Funcional
- **9 Business Units** introducidas en 2021
- **200+ marcas** globalmente
- **Modelo de franquicia** con embotelladores

**Fuente**: [Organimi](https://www.organimi.com/organizational-structures/coca-cola/), [BusinessModelAnalyst](https://businessmodelanalyst.com/coca-cola-organizational-structure-analysis/)

---

## 📞 Teleperformance

### Estructura Post-Majorel (2024)

```
                    ┌────────────────────────────────┐
                    │       Moulay Elalamy          │
                    │         Chairman              │
                    └───────────────┬───────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │       Daniel Julien           │
                    │           CEO                 │
                    └───────────────┬───────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
    ┌───────┴───────┐      ┌────────┴────────┐     ┌───────┴───────┐
    │ Deputy CEO    │      │   Deputy CEO    │     │  Deputy CEO   │
    │Thomas Mackenbr│      │ Agustin Grisanti│     │  Scott Klein  │
    └───────┬───────┘      └─────────────────┘     └───────────────┘
            │
    ┌───────┴───────────────────────────────────────────┐
    │                    REGIONS                         │
    ├─────────────┬─────────────┬─────────────┬─────────┤
    ▼             ▼             ▼             ▼         ▼
┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐  ┌────────┐
│Americas│   │  EMEA  │   │  APAC  │   │  LATAM │  │ France │
└────┬───┘   └────┬───┘   └────────┘   └────────┘  └────────┘
     │            │
     │            └─── Multilingual: Greece, Egypt, Turkey, UK, Germany
     │
     └─── Nearshore/Offshore operations
```

### Divisiones de Negocio

| División | EBITA 2024 | Margen | Descripción |
|----------|------------|--------|-------------|
| **Core Services** | €518M | 12.4% | BPO tradicional |
| **Specialized Services** | €446M | 30.0% | Alto valor |
| **LanguageLine Solutions** | - | - | Interpretación |
| **TP Infinity** | - | - | Consultoría digital (post-Majorel) |

### Características Clave

- **Separación Chairman/CEO** en 2024
- **Adquisición Majorel** por €3B (2024)
- **246 líderes** ejecutivos
- Fuerte presencia nearshore/offshore

**Fuente**: [Wikipedia](https://en.wikipedia.org/wiki/Teleperformance), [TP Integrated Report 2024](https://www.tp.com/media/ym0pt3df/tp_integrated_report_2024.pdf)

---

## 📦 FedEx

### Consolidación 2024 (DRIVE Transformation)

```
                         ┌──────────────────────┐
                         │   Raj Subramaniam    │
                         │    President & CEO   │
                         └──────────┬───────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
┌───────┴───────┐          ┌────────┴────────┐         ┌────────┴────────┐
│  John Smith   │          │  Richard Smith  │         │    FedEx        │
│ US & Canada   │          │  International  │         │   Dataworks     │
│   Ground Ops  │          │  & Airline      │         │   (Data/Tech)   │
└───────┬───────┘          └────────┬────────┘         └─────────────────┘
        │                           │
        │                           │
┌───────┴─────────────┐    ┌────────┴────────────────────────────┐
│  OPERATING UNITS    │    │           REGIONS                   │
├─────────┬───────────┤    ├────────┬────────┬────────┬─────────┤
▼         ▼           ▼    ▼        ▼        ▼        ▼         ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│FedEx │ │FedEx │ │FedEx │ │ US  │ │EMEA │ │APAC │ │LAC  │ │MEISA│
│Express│ │Ground│ │Freight│ │     │ │     │ │     │ │     │ │     │
└──────┘ └──────┘ └──────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘
            │
    ┌───────┴───────┐
    ▼               ▼
┌────────┐    ┌──────────┐
│ Office │    │Supply    │
│        │    │Chain     │
└────────┘    └──────────┘
```

### Transformación DRIVE

| Antes (2023) | Después (2024) |
|--------------|----------------|
| Compañías operativas separadas | **Federal Express Corporation** unificada |
| FedEx Express independiente | Integrado |
| FedEx Ground independiente | Integrado |
| FedEx Services independiente | Integrado |
| Múltiples sistemas | Red aire-tierra unificada |

### Regiones Geográficas

| Región | HQ Regional |
|--------|-------------|
| **US & Canada** | Memphis, TN / Toronto |
| **EMEA** | Hoofddorp, Netherlands |
| **APAC** | Hong Kong |
| **LAC** | Miami, FL |
| **MEISA** | Dubai |

### Características Clave

- **Consolidación masiva** en 2024
- **$4B en reducción de costos** con DRIVE
- **6 regiones** globales
- Red aire-tierra integrada

**Fuente**: [FedEx Company Structure](https://www.fedex.com/en-us/about/company-structure.html), [FedEx Newsroom](https://newsroom.fedex.com/newsroom/global-english/fedex-announces-planned-consolidation-of-operating-companies)

---

## 🏗️ Komatsu

### Estructura Matricial Producto-Región

```
                         ┌──────────────────────┐
                         │   Masaaki Kanayama   │
                         │      President       │
                         └──────────┬───────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
┌───────┴───────┐          ┌────────┴────────┐         ┌────────┴────────┐
│ Construction  │          │     Mining      │         │    Utilities    │
│  Equipment    │          │   Equipment     │         │ Forest/Industry │
└───────┬───────┘          └─────────────────┘         └─────────────────┘
        │
┌───────┴─────────────────────────────────────────────────┐
│                      REGIONS                             │
├────────────────┬────────────────┬────────────────┬──────┤
▼                ▼                ▼                ▼
┌──────────┐  ┌──────────┐  ┌──────────┐   ┌──────────┐
│ Japan    │  │  North   │  │  Europe  │   │  APAC    │
│          │  │ America  │  │          │   │          │
└──────────┘  └────┬─────┘  └────┬─────┘   └──────────┘
                   │             │
             ┌─────┴─────┐  ┌────┴─────┐
             │Komatsu    │  │Komatsu   │
             │America    │  │Europe    │
             │Corp       │  │Int'l NV  │
             └───────────┘  └──────────┘
```

### Divisiones de Producto

| División | Productos |
|----------|-----------|
| **Construction Equipment** | Excavadoras, bulldozers, cargadores |
| **Mining Equipment** | Camiones mineros, palas |
| **Utilities** | Equipos forestales, industriales |
| **Digital** | KOMTRAX, Smart Construction |

### Entidades Regionales

- **Komatsu America Corp** - CEO dedicado
- **Komatsu North America Corp** - COO dedicado
- **Komatsu Europe International N.V.** - Presidente dedicado
- **Komatsu Customer Support Japan Ltd.**

### Características Clave

- **Plantas en 11 países**
- Estructura matricial producto × región
- Red de dealers global
- Enfoque en diversidad (FY2022-2024)

**Fuente**: [Komatsu Management](https://www.komatsu.jp/en/aboutus/management-team), [Komatsu Report 2024](https://www.komatsu.jp/en/-/media/HOME/ir/library/annual/en/2024/kmt_kr24e.pdf)

---

## 🧠 Six Seconds

### Red Global de Inteligencia Emocional

```
                         ┌──────────────────────┐
                         │      Founders        │
                         │ Freedman, Jensen,    │
                         │ McCown, Rideout      │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │         GLOBAL HQ             │
                    │       California, USA         │
                    └───────────────┬───────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    │                               │                               │
┌───┴───────┐              ┌────────┴────────┐             ┌────────┴────────┐
│   APAC    │              │      EMEA       │             │      LATAM      │
│  Region   │              │     Region      │             │     Region      │
└─────┬─────┘              └────────┬────────┘             └────────┬────────┘
      │                             │                               │
┌─────┴────────────┐     ┌──────────┴──────────┐         ┌─────────┴─────────┐
│ Network Leaders  │     │  Network Leaders    │         │  Network Leaders  │
│ (9 en APAC)      │     │                     │         │  Mexico, Peru     │
└─────┬────────────┘     └──────────┬──────────┘         └─────────┬─────────┘
      │                             │                               │
      ▼                             ▼                               ▼
┌──────────────┐          ┌──────────────┐               ┌──────────────┐
│  Preferred   │          │  Preferred   │               │  Preferred   │
│   Partners   │          │   Partners   │               │   Partners   │
└──────────────┘          └──────────────┘               └──────────────┘
      │                             │                               │
      ▼                             ▼                               ▼
┌──────────────┐          ┌──────────────┐               ┌──────────────┐
│  Certified   │          │  Certified   │               │  Certified   │
│ Practitioners│          │ Practitioners│               │ Practitioners│
│ (200+ China) │          │              │               │              │
└──────────────┘          └──────────────┘               └──────────────┘
```

### Modelo de Red

| Nivel | Descripción | Cantidad |
|-------|-------------|----------|
| **Global HQ** | Liderazgo y desarrollo | California |
| **Offices** | Oficinas regionales | 10 países |
| **Representatives** | Representantes | 25 países |
| **Network Leaders** | Líderes de red regional | ~50 |
| **Preferred Partners** | Partners certificados premium | ~30 |
| **Certified** | Coaches, assessors, educators | 1000+ |

### Sectores de Aplicación

- **EQ Business (EQ Biz)** - Sector corporativo
- **EQ Education** - Sector educativo
- **EQ Government** - Sector público
- **EQ Nonprofit** - ONGs

### Eventos Regionales

- **Leaders Worth Following Conference** - Lima, Peru (2019)
- **EQ Six Seconds Summit** - Mexico City (2020)
- **Regional Summits** - Múltiples países

### Características Clave

- **501(c)3 nonprofit** fundada en 1997
- **150+ países** con presencia
- Modelo de **certificación** y **partners**
- Red de **200+ certified** solo en China

**Fuente**: [Six Seconds About](https://www.6seconds.org/about/), [Six Seconds Global Network](https://www.6seconds.org/about/global-network/)

---

## 🔄 Patrones Comunes

### Niveles Organizacionales Típicos

| Nivel | Nombre Común | Ejemplos |
|-------|--------------|----------|
| **0** | Global/Corporate | Headquarters, C-Suite |
| **1** | Region | Americas, EMEA, APAC |
| **2** | Country/Market | Mexico, UK, Japan |
| **3** | Division/BU | Sales, Operations, HR |
| **4** | Department | Finance Team, Marketing |
| **5** | Team | Product Team, Account Team |
| **6** | Individual | Employee, Contractor |

### Tipos de Estructura

| Tipo | Empresas | Características |
|------|----------|-----------------|
| **Funcional** | Apple | Organizado por expertise |
| **Matricial** | Coca-Cola, Komatsu | Región × Producto |
| **Divisional** | FedEx | Por unidad de negocio |
| **Red/Network** | Six Seconds | Partners distribuidos |
| **Híbrida** | Teleperformance | Combinación post-adquisición |

### Roles Multi-Contexto

En todas las empresas, una persona puede tener:

1. **Rol Global** - Función a nivel corporativo
2. **Rol Regional** - Responsabilidad en una región
3. **Rol de División** - Dentro de una línea de negocio
4. **Rol de Proyecto** - En iniciativas específicas
5. **Rol de Equipo** - En un equipo local

---

## 🦉 Mapeo a Rowi

### Equivalencias de Modelos

| Enterprise Concept | Modelo Rowi | Notas |
|--------------------|-------------|-------|
| **Corporation/Group** | `SuperHub` | Coca-Cola, Apple |
| **Region** | `Hub` | EMEA, LATAM, APAC |
| **Country/Market** | `Tenant` + `Hub` | México, Perú |
| **Business Unit** | `Organization` | Sparkling, Express |
| **Department** | `Organization` (child) | HR, Finance, IT |
| **Team** | `RowiCommunity` | Sales Team, Product Team |
| **Partner/Consultant** | Usuario multi-tenant | HR Consultant |
| **Individual** | `User` | Empleado |

### Estructura Propuesta para Enterprise

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ROWIVERSE                                       │
│                    (Ecosistema Global de Rowi)                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
    ┌───────────────┐      ┌───────────────┐       ┌───────────────┐
    │   SuperHub    │      │   SuperHub    │       │   SuperHub    │
    │  "Coca-Cola"  │      │   "FedEx"     │       │ "Six Seconds" │
    │  (Corporation)│      │  (Corporation)│       │   (Network)   │
    └───────┬───────┘      └───────────────┘       └───────┬───────┘
            │                                              │
    ┌───────┴───────────────────────┐              ┌───────┴───────┐
    ▼               ▼               ▼              ▼               ▼
┌────────┐    ┌────────┐      ┌────────┐     ┌────────┐     ┌────────┐
│  Hub   │    │  Hub   │      │  Hub   │     │  Hub   │     │  Hub   │
│ "EMEA" │    │"LATAM" │      │ "APAC" │     │ "APAC" │     │"LATAM" │
│(Region)│    │(Region)│      │(Region)│     │(Region)│     │(Region)│
└───┬────┘    └───┬────┘      └────────┘     └───┬────┘     └───┬────┘
    │             │                              │             │
    │       ┌─────┴─────┐                  ┌─────┴─────┐       │
    │       ▼           ▼                  ▼           ▼       │
    │   ┌────────┐ ┌────────┐         ┌────────┐ ┌────────┐   │
    │   │ Tenant │ │ Tenant │         │ Tenant │ │ Tenant │   │
    │   │"Mexico"│ │ "Peru" │         │"China" │ │"Japan" │   │
    │   │(Market)│ │(Market)│         │(Market)│ │(Market)│   │
    │   └───┬────┘ └────────┘         └───┬────┘ └────────┘   │
    │       │                             │                    │
    │       ▼                             ▼                    │
    │  ┌──────────────────────┐    ┌──────────────┐           │
    │  │    Organizations     │    │ Preferred    │           │
    │  │  Sales │ HR │ Ops    │    │   Partners   │           │
    │  └──────────────────────┘    └──────┬───────┘           │
    │                                      │                   │
    └──────────────────────────────────────┴───────────────────┘
                         │
                         ▼
               ┌──────────────────┐
               │  RowiCommunities │
               │  Teams/Squads    │
               └──────────────────┘
```

### Sistema Multi-Rol para Rowi

Un usuario puede tener simultáneamente:

```typescript
interface UserRoles {
  // Rol global en el sistema
  globalRole: 'USER' | 'ADMIN' | 'SUPERADMIN';

  // Membresías en diferentes contextos
  memberships: {
    // En SuperHub (corporación)
    superHubRoles: {
      superHubId: string;
      role: 'ADMIN' | 'MANAGER' | 'VIEWER';
    }[];

    // En Hubs (regiones/divisiones)
    hubRoles: {
      hubId: string;
      role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';
    }[];

    // En Tenants (empresas/clientes)
    tenantRoles: {
      tenantId: string;
      role: TenantRole; // SUPERADMIN, ADMIN, MANAGER, etc.
    }[];

    // En Organizations (departamentos)
    orgRoles: {
      orgId: string;
      role: OrgRole; // OWNER, ADMIN, MANAGER, MEMBER, VIEWER
    }[];

    // En Communities (equipos)
    communityRoles: {
      communityId: string;
      role: 'OWNER' | 'ADMIN' | 'COACH' | 'MENTOR' | 'MEMBER';
    }[];
  };

  // Rol especial: HR Consultant (maneja múltiples empresas)
  isHRConsultant: boolean;
  consultingTenants: string[]; // Tenants que gestiona como consultor
}
```

### Vistas por Tipo de Usuario

| Tipo | Vista Principal | Vistas Adicionales | Multi-Contexto |
|------|----------------|-------------------|----------------|
| **Usuario** | Dashboard Personal | Avatar, EQ, Tareas | No |
| **Team Leader** | Mi Equipo | Métricas, Tareas Equipo | 1 equipo |
| **Manager** | Departamento | Reportes, ROI | N equipos |
| **Region Leader** | Multi-Hub | Comparativas, Benchmarks | N hubs |
| **HR** | Empleados | Payroll, Reviews, Leaves | 1 tenant |
| **Coach** | Coachees | Sesiones, Progreso | N usuarios |
| **HR Consultant** | **Multi-Empresa** | Dashboard por cliente | N tenants |
| **Researcher** | Datos | Benchmarks, Export | Read-only |
| **Financial** | Finanzas | Transacciones, Facturas | 1 tenant |
| **System Admin** | Panel Admin | Todo | Global |

---

## 📝 Próximos Pasos

1. **Implementar modelo de membresía multi-contexto**
2. **Crear vista de HR Consultant** con selector de empresas
3. **Desarrollar permisos granulares** por scope
4. **Integrar benchmarks cross-company** para consultores
5. **Diseñar dashboard de región** para Region Leaders

---

*Documento creado para planificación de escalabilidad enterprise de Rowi*
*Fecha: 2025-01-31*
