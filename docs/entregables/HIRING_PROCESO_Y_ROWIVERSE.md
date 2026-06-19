# Hiring como proceso de análisis + alimentación del Rowiverse

> **Spec para implementar en Rowi.** Lo describe Eduardo así: "Yo subo un CSV,
> te digo quién es el manager, y tú calculas todo. Eso me da el reporte y **se
> queda ahí como caso analizado** — pero NO crea relación ni comunidad. La data
> del SEI sube al Rowiverse para tener más data. Y si después una persona del
> caso se inscribe en Rowi, o el seleccionado es contratado, su SEI ya está ahí
> para vincularse." Este documento define ese flujo exacto comparando lo que YA
> existe contra lo que se quiere, y da la receta de implementación.

---

## 1. La idea en una frase

Un **proceso de hiring** es un **caso de análisis que se archiva**: subes un CSV
de SEI, marcas quién es el manager, y el motor calcula afinidad + benchmark +
LVS y te lo muestra. El caso **se guarda completo** (datos + resultados) para
que lo reabras, lo consultes y lo compares cuando quieras. Pero **NO crea
relaciones, NO crea comunidad, NO conecta personas** en el grafo de Rowi: es un
documento de análisis archivado, no un equipo.

Tres cosas pasan, y NINGUNA crea comunidad:

1. **El caso queda guardado** (`HiringCase`) — tu historial consultable.
2. **La data SEI anónima alimenta el Rowiverse** (`BenchmarkDataPoint`) → más
   data para el benchmark global.
3. **Queda un puente latente**: cada persona del caso lleva su `EqSnapshot` con
   `email` pero sin `userId`. Si esa persona luego **se inscribe en Rowi** (o el
   **seleccionado es contratado**), su SEI ya la precede y se **vincula** a su
   cuenta real → su data pasa de "candidato anónimo analizado" a "persona Rowi
   con su historia SEI".

```
        CSV SEI  +  "el manager es X"
                 │
                 ▼
   ┌─────────────────────────────┐
   │   PROCESO DE HIRING          │   ← caso archivado, análisis puro
   │   (afinidad/benchmark/LVS)   │      NO crea comunidad / relaciones
   └──────────┬───────────────────┘
              │
     ┌────────┼────────────┬───────────────────┐
     ▼        ▼            ▼                   ▼
  CASO     ROWIVERSE   EqSnapshot         (futuro) si la persona
  guardado data anón.  con email          se registra / es contratada
  reabrible (benchmark) sin userId   →    se vincula a su User real
            global)    = puente latente   → su SEI entra al Rowiverse
                                            como persona, no anónimo
```

---

## 2. Lo que YA existe en el repo (verificado)

### 2.1 El motor de análisis es PURO (no crea nada)
`src/lib/hiring/build-report-data.ts:128` — `buildHiringReportData(leader,
candidates, opts)` es 100% función pura: recibe las personas ya cargadas,
calcula afinidad (`affinity()`), LVS (`lvsOf()`), deltas relacionales, y
devuelve un `HiringReportData`. **No toca Prisma. No escribe nada.** Esto es
exactamente "calcula y muéstramelo, no generes nada".

### 2.2 El Rowiverse y la contribución anónima YA existen
- `src/lib/rowiverse/contribution-service.ts:71` — `ContributionInput` recibe
  `eqData` (8 comps + KCG + eqTotal), `demographics`, `outcomes`,
  `brainTalents`, con `sourceType: "csv_upload"`.
- `contributeToRowiverse()` crea un `BenchmarkDataPoint` **anónimo** en el
  benchmark global (`type:"ROWIVERSE"`, `scope:"GLOBAL"`) — sin nombre ni email
  en claro, solo hash/segmentación demográfica.
- Flag opt-in: `User.contributeToRowiverse` (default true) en
  `prisma/schema.prisma`.
- Modelo de registro: `RowiVerseContribution` (quién contribuyó, status), pero
  NO vincula a comunidad.

### 2.3 Lo que HOY hace de más (y que Eduardo NO quiere para este flujo)
El flujo actual de hiring por workspace **sí crea entidades**:
- `POST /api/workspaces/[id]/candidates` (`route.ts:86`) crea un
  `CommunityMember` con `source:"candidate"` + un `EqSnapshot`.
- Eso ata cada candidato a una `RowiCommunity` (el workspace tipo SELECTION).

→ **Ese es el desajuste con la visión.** Eduardo quiere subir un CSV y analizar
SIN crear `CommunityMember` ni workspace. Hoy el camino "rápido" obliga a crear
la comunidad de selección.

---

## 3. Lo que se quiere (la spec a implementar)

### 3.1 El modelo `HiringCase` (el caso que se archiva)
Nuevo modelo Prisma. Guarda el caso COMPLETO para reabrirlo, regenerar el PDF y
comparar. NO es un workspace ni una comunidad — es un análisis archivado.

```prisma
model HiringCase {
  id           String   @id @default(cuid())
  ownerUserId  String   // quién corrió el análisis (consultor/manager)
  tenantId     String?  // opcional: vive en el workspace del consultor
  process      String   // "Recrutamento BDP"
  managerName  String   // a quién se marcó como manager
  lang         String   // es/pt/en
  reportData   Json     // el HiringReportData COMPLETO (datos + resultados)
  candidateCount Int
  createdAt    DateTime @default(now())
  // sin relación a CommunityMember ni RowiCommunity — a propósito.
  owner        User     @relation(fields: [ownerUserId], references: [id])
  @@index([ownerUserId])
}
```
Guardar el `HiringReportData` completo en `reportData` (Json) permite: reabrir
el caso, re-renderizar cualquier idioma/PDF, y comparar entre casos — sin
recalcular y sin volver a subir el CSV.

### 3.2 El endpoint `POST /api/hiring/analyze`
Espejo del consultor `/api/consultant/report`, pero PERSISTE el caso.

**Recibe:**
```jsonc
{
  "seiCsv": "<contenido del CSV>",
  "managerName": "Ronaldo Borba",
  "lang": "pt",
  "contributeToRowiverse": true   // default true; respeta User.contributeToRowiverse
}
```

**Hace:**
1. Parsea el CSV → `HiringPerson[]` (manager + candidatos). Reusa el parser por
   índice (columnas "Profile" duplicadas → brain brief + influence).
2. Calcula benchmark contra el Rowiverse global (`BenchmarkDataPoint` del pool).
3. Llama `buildHiringReportData()` (puro) → `HiringReportData`.
4. **Guarda un `HiringCase`** con el `reportData` completo. ← el "se queda ahí".
5. **NO crea** `CommunityMember`, `RowiCommunity`, ni relaciones.
6. Por cada persona: crea un `EqSnapshot` con `email` + `userId:null`
   (= puente latente, ver 3.4) y llama `contributeToRowiverse(...)` → pool
   global anónimo (si opt-in).

**Devuelve:** `{ caseId, reportData, contributedToRowiverse: N, createdCommunities: 0 }`.

### 3.3 La "página de una sola vista" + lista de casos
- **Una pantalla** con el resultado: tabla síntesis (candidatos ordenados por
  afinidad con el manager), matriz de 6 contextos (punto verde = mejor de cada
  fila), ranking de percentil EQ vs Rowiverse, mini-resumen LVS, y botón
  "descargar reporte completo (PDF)" → el de 14 págs.
- **Lista "Mis casos de hiring"** dentro del workspace del consultor: cada fila
  es un `HiringCase`, click para reabrir. Es análisis archivado, NO un equipo
  con miembros — vive en el workspace pero no crea comunidad.

### 3.4 El puente latente (la conexión futura)
Cada persona del caso deja un `EqSnapshot` con `email` y `userId:null`. El repo
YA soporta esto: `EqSnapshot.email` está indexado y
`src/app/api/vital-signs/me/route.ts:77` ya busca snapshots por email
(`equals, insensitive`). Entonces:

- **Si la persona se inscribe en Rowi**: en el onboarding se busca su email en
  `EqSnapshot` huérfanos → se vinculan a su nuevo `userId`. Su SEI del proceso
  de hiring **la precede**: entra a Rowi con su historia ya cargada.
- **Si el seleccionado es contratado**: igual — su SEI ya está y se conecta a su
  cuenta. Su data pasa de anónima-en-benchmark a **persona-en-Rowiverse**.

Esto convierte cada proceso de hiring en un **canal de adquisición de usuarios
con su SEI precargado**, sin fricción. (Implementación del linking: un job/paso
de onboarding que hace `eqSnapshot.updateMany({where:{email, userId:null}},
{data:{userId}})` tras verificar el email — el patrón "reclamar tu SEI".)

### 3.5 La regla de oro de este flujo
| Acción | ¿Persiste? | ¿Dónde? |
|---|---|---|
| El caso (datos + resultados) | **SÍ** | `HiringCase.reportData` (Json) |
| EqSnapshot por persona (email, sin userId) | **SÍ** | `EqSnapshot` (puente latente) |
| Data SEI anónima → benchmark global | **SÍ** | `BenchmarkDataPoint` (Rowiverse) |
| Crear comunidad / workspace | NO | — |
| Crear CommunityMember / relación / ECO | NO | — |

**PII:** el caso (`HiringCase`) SÍ guarda nombres+email porque es TU análisis
privado (base legal: proceso de selección real, bajo control del owner, con
retención). El **Rowiverse** NUNCA recibe PII: solo el perfil numérico +
demografía anonimizada (país, sector, rol, edad-rango, género).

---

## 4. Por qué esto es valioso (la tesis de Eduardo)

> "Se usa la data para alimentar el Rowiverse y de esa forma tener más data."

Cada proceso de hiring que un consultor corre = N perfiles SEI nuevos al pool
global, **gratis y anónimos**. Esto:
- Hace el benchmark de Rowi más grande y más representativo (mejores
  percentiles, mejores top-performers por sector/rol/región).
- Calibra los pesos del motor de afinidad (hoy hipótesis v0) contra más data
  real — el patrón de oro que ya se aplica en pulse points.
- NO compromete privacidad: es data agregada/anónima, nunca identidad.
- NO ensucia el grafo de relaciones de Rowi con "comunidades" que no son
  comunidades reales (un proceso de selección no es una comunidad).

El hiring se vuelve un **motor de adquisición de data** para el Rowiverse, sin
fricción y sin crear basura relacional.

---

## 5. Receta de implementación (orden sugerido)

1. **Modelo `HiringCase`** (Prisma) — guarda el caso completo (`reportData` Json
   + manager + idioma + fecha). El build pipeline propaga el schema solo.
2. **`POST /api/hiring/analyze`** — parsea CSV + manager →
   `buildHiringReportData()` (puro) → **guarda el `HiringCase`** → devuelve
   `{ caseId, reportData }`. Modelo: `/api/consultant/report` (pero ese es
   stateless; este SÍ persiste el caso).
3. **EqSnapshot puente**: por cada persona, crear `EqSnapshot` con `email` y
   `userId:null` (el puente latente). NO crear `CommunityMember`.
4. **Cablear contribución**: si `contributeToRowiverse`, mapear cada fila a
   `ContributionInput` y llamar `contributeToRowiverse()`. Respetar
   `User.contributeToRowiverse`.
5. **Página + lista de casos**: `/hub/hiring` con (a) subir CSV + marcar manager
   (dropdown con nombres del CSV) + ver el resultado en una pantalla + descargar
   PDF; (b) lista "Mis casos" que lee `HiringCase` y reabre cada uno.
6. **Linking en onboarding**: al registrarse/verificar email, vincular
   `EqSnapshot` huérfanos por email al nuevo `userId` (patrón "reclamar tu SEI",
   ya esbozado en `vital-signs/me`). Esto cierra el puente latente.
7. **Reusar el parser por índice** (columnas "Profile" duplicadas) de los smoke
   tests de Ronaldo — ya probado contra los CSV reales.

### Lo que NO hay que tocar
- El motor `build-report-data.ts` ya es puro — no cambiarlo.
- `contributeToRowiverse()` ya existe — solo llamarlo.
- Los generadores de PDF (`reporte-full-hiring.ts`) — reusar para "descargar
  completo" y para re-renderizar un caso archivado.
- `EqSnapshot.email` ya está indexado y se busca por email — reusar.

---

## 6. Diferencia conceptual clave (para no confundir)

| Concepto | Qué es | ¿Persiste? | ¿Crea relación? |
|---|---|---|---|
| **Caso de hiring** | Análisis archivado de un CSV | SÍ (`HiringCase`) | NO |
| **Rowiverse** | Lago global anónimo de SEI | SÍ (anónimo) | NO |
| **EqSnapshot puente** | SEI con email, sin userId | SÍ (latente) | NO (hasta que se registre) |
| **Workspace / Comunidad** | Equipo persistente con miembros | SÍ | SÍ |
| **ECO / Afinidad en producto** | Conexión real entre usuarios | SÍ | SÍ |

El hiring vive en las tres primeras filas: **archiva el caso, alimenta el
Rowiverse y deja un puente latente** — pero **nunca cruza a las dos últimas**
(no crea comunidad ni relación). Cuando la persona se registra, su EqSnapshot
puente se vincula y ENTONCES es un usuario Rowi — pero eso lo decide ella al
inscribirse, no el proceso de hiring.

---

## 7. Notas de privacidad y honestidad (heredadas de Rowi)
- El SEI es un espejo de capacidad individual, no un veredicto. El reporte de
  hiring es "lente de relación, no criterio de selección".
- La contribución al Rowiverse es opt-in (`User.contributeToRowiverse`) y
  anónima (sin PII). GDPR como piso.
- El benchmark global es agregado: ninguna persona es identificable en el pool.
