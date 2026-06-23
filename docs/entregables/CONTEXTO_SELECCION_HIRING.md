# Contexto de SELECCIÓN / HIRING — para abrir nueva sesión

> Estado a 23-jun-2026. Resume qué es el módulo de selección de Rowi, qué está
> hecho, qué falta, las decisiones tomadas y cómo retomar. Léelo al arrancar.

---

## 0. Qué es (en una frase)

El módulo de **Selección/Hiring** de Rowi: un consultor/headhunter sube un CSV
SEI (Six Seconds) de candidatos, marca quién es el **manager** (la persona que
contrata), y Rowi calcula y entrega:

- **Afinidad** de cada candidato con el manager, por 6 contextos (escala 0-135).
- **Benchmark** de cada candidato vs los 273k SEI del mundo (percentil EQ, vs
  top performers).
- **Hipótesis LVS** (Leadership Vital Signs inferido del SEI).
- Entregables PDF: **Reporte Full** (12-14 págs) + **Perfil por candidato** +
  **Guía del presentador**, en **ES / PT / EN**.

**Regla de oro:** es una *lente de relación y desarrollo, no un veredicto*. La
IE NO decide a quién contratar. "Diagnóstico" solo existe en el módulo
consultor; el lado usuario es "espejo/reflejo".

---

## 1. La visión de Eduardo (el modelo de producto)

> "Subo CSV + digo el manager → calculas todo → me das el reporte y **se queda
> como caso analizado**. Eso NO crea relación ni comunidad. La data SEI sube al
> Rowiverse para tener más data. Y si una persona del caso luego se inscribe o
> es contratada, su SEI ya está ahí para vincularse."

Tres persistencias, **ninguna crea comunidad**:
1. **HiringCase** — el caso completo, archivado y reabrible.
2. **BenchmarkDataPoint** anónimo → alimenta el **Rowiverse** (pool global, sin PII).
3. **EqSnapshot puente** (email, sin userId) → linking futuro al registrarse/contratar.

Spec completa: `docs/entregables/HIRING_PROCESO_Y_ROWIVERSE.md`.

---

## 2. Estado actual (lo HECHO)

Rama: **`feat/hiring-analyze-rowiverse`** (NO mergeada). Commit:
`81b49cd feat(hiring): proceso de análisis archivado + alimenta Rowiverse`.
**tsc: 0 errores.**

### Backend (commiteado, en la rama)
- **Modelo Prisma `HiringCase`** (`prisma/schema.prisma`, @@map `hiring_cases`):
  reportData Json completo + manager + lang + owner + contadores. Caso
  archivado, NO crea comunidad. Back-relation `User.hiringCases`.
- **`src/lib/hiring/parse-sei-csv.ts`** — parser POR ÍNDICE del CSV SEI. Clave:
  el CSV tiene DOS columnas "Profile" (Brain Brief col 102 + Influence Profile
  col 143); parsear por nombre las colapsa. Extrae comps, talentos, outcomes,
  demografía, email. Probado contra los CSV reales.
- **`src/lib/hiring/analyze-case.ts`** — orquestador: parse →
  buildHiringReportData (puro) → contributeToRowiverse (anónimo) → EqSnapshot
  puente (dataset:"hiring_case", email, sin userId) → persiste HiringCase.
  Invariante `createdCommunities: 0`.
- **`src/lib/hiring/build-report-data.ts`** — motor PURO (afinidad/LVS/deltas).
  YA existía, no tocar.
- **`src/lib/hiring/load-people.ts`** — exporta `buildOptionsFromPeople()`
  (benchmark vs BenchmarkDataPoint), reusado por el flujo workspace y el CSV.
- **`POST /api/hiring/analyze`** — sube CSV + manager → analiza + guarda el
  caso + GET lista "Mis casos". Multi-idioma.
- **`GET/DELETE /api/hiring/case/[id]`** — reabre el caso + re-renderiza el PDF
  (reporte-full / guia-presentador) en cualquier idioma SIN recalcular.

### Generadores de entregables (en `src/lib/deliverables/`, ya en main/rama)
- `pdf-kit.ts` (kit gráfico Rowi: header+búho, barras 70-130 con norma, tablas,
  chips), `pptx-kit.ts` (kit PPTX).
- `reporte-full-hiring.ts`, `perfil-candidato.ts`, `guia-presentador.ts`
  (Hiring); `perfil-integral.ts`, `guia-confidencial.ts`, `propuesta-cliente.ts`,
  `hallazgos.ts` (Consulting). Todos ES/PT/EN.
- `from-consultant-report.ts` — mapea report/findings → inputs de generadores.

### ⚠️ DEUDA del generador TS de reporte-full
El `reporte-full-hiring.ts` produce una versión **CONDENSADA** (~9 págs) vs el
original validado por Eduardo (12-14 págs RICAS). Le falta: puntos verdes en la
matriz (usa asterisco), óvalo violeta del header, mini-barras bajo cada nº,
FICHAS de afinidad por persona (dims díada + talentos/comps en chips), FICHAS
benchmark con doble-marca (gris=población, verde=top), perfil top performer,
roles ricos. **Mientras tanto**, el reporte rico se genera con el script
permanente `scripts/hiring-rich-report/generate.py` (ES/PT/EN, consume un JSON
"rico" del motor TS). Mejorar el módulo TS para igualarlo es trabajo pendiente.

### Scripts de referencia (SIN commitear, en `scripts/hiring-rich-report/`)
- `generate.py` — reporte rico de 12-14 págs (ES/PT/EN). Consume `rich.json`.
- `shortlist_fusion.py` — pieza FUSIÓN People Inc × Rowi (capa humana CV/avaliação
  + capa datos afinidad/benchmark/LVS), ficha por candidato, ES/PT.
  Consume un JSON manual (ver `/tmp/shortlist-fusion-data.json` de ejemplo).

---

## 3. Lo que se ha generado a mano (entregables reales)

Para los procesos Werfen "Recrutamento BDP" / "Gerente de Serviços SP":
- Grupo Giselly Zanetti (líder) + 4-5 candidatos → reporte full + guía, ES/PT/EN.
- Grupo Ronaldo Borba (líder) + candidatos → reporte full + guía + fusión People
  Inc. Salidas en `~/Downloads/Ronaldo_Reportes/`.
- Fusión short list People Inc × Rowi (7 candidatos: 4 con SEI, 3 sin) →
  `ROWI_SHORTLIST_FUSION_ES.pdf` / `_FUSAO_PT.pdf`.

### Cómo se generan (flujo manual actual)
1. CSV en `~/Downloads/report (N).csv`.
2. Benchmark vs SOH 273k: script Python contra
   `data/seed/benchmark/SOH_benchmark_data.csv` → `bench-results.json`.
3. JSON rico (afinidad+dims+talentos+LVS): smoke TS que invoca
   `affinityEngine` + `calculate` + `parse-sei-csv`, marcando el líder →
   `rich.json`.
4. PDF: `python3 scripts/hiring-rich-report/generate.py <rich.json> <out.pdf> <lang>`.
   Guía: smoke TS con `buildGuiaPresentador` (módulo TS, ya tiene ES/PT/EN).

NOTA tsx: agrupa los exports nombrados bajo `default`. En smoke tests importar
`import mod from "..."` y leer `(mod as any).buildX`. Correr con
`TSX_TSCONFIG_PATH=./tsconfig.json pnpm exec tsx scripts/.../<x>.mts` y los
scripts deben vivir DENTRO del repo (para resolver papaparse/node_modules).

---

## 4. Conceptos clave del CSV SEI (no confundir)

Cada persona trae TRES perfiles distintos (Eduardo preguntó por esto):
1. **Brain Brief** (col "Profile" #102: Visionary/Sage/Superhero) = estilo
   cognitivo. **YA entra al motor** de afinidad (collScoreBBP).
2. **Influence Profile** (2º "Profile" #143: Connector/Advisor/Generator/
   Negotiator) = "perfil de VENTAS" (cómo influye/persuade). HOY solo se
   MUESTRA, no entra al cálculo.
3. **Change Style** (col "STYLE": Balanced/Social/Ad Hoc) = disposición al
   cambio. HOY solo se muestra.

**ROADMAP (decisión Eduardo):** Influence Profile y Change Style **deberían
entrar al cálculo** más adelante (ej. contexto de afinidad "ventas/influencia" o
enriquecer la lente relacional). No hacer ahora.

---

## 5. Decisiones tomadas (no volver a preguntar)
- El caso se guarda COMPLETO (datos + resultados), reabrible. Modelo HiringCase.
- Vive en el workspace pero NO crea comunidad/relaciones/CommunityMember.
- La data SEI alimenta el Rowiverse (anónimo, opt-in `User.contributeToRowiverse`).
- EqSnapshot puente (email, sin userId) → linking al registrarse/contratar.
- Idiomas: ES/PT/EN, los elige el consultor.
- Reporte rico (12-14 págs) es el estándar visual aprobado, NO el condensado.
- Cruce SEI↔VS usa el motor real (honesto, no bajar umbral).
- Texto interpretativo HÍBRIDO: plantilla determinista + IA en plan superior.
- Influence Profile se mapea (perfil de ventas) pero no entra al cálculo aún.

## 6. Lo que FALTA (próximos pasos)
1. ✅ **UI de Hiring** (HECHO, sesión 23-jun): `src/app/hub/admin/hiring/page.tsx`
   — subir CSV + preview de nombres + dropdown del manager (parseado en cliente
   del propio CSV → match exacto garantizado) + analizar + ver resultado
   (ranking, afinidad por 6 contextos con bandas, percentil EQ, LVS) + lista
   "Mis casos" + descargas PDF (reporte-full / guía) + borrar con ConfirmDialog.
   Acceso gated por nueva capability `consultant.hiring` (catalog.ts, planFlag
   `benchmarkAccess`), aplicada en endpoints (`requireCapability`) y en la UI
   (`can()`). Enlace en Sidebar (sección Workspaces, gated por capability).
   i18n completo en es/en/pt/it (`hiring.*` + `admin.nav.hiring`). tsc 0 + 546
   tests. PENDIENTE: verificar el flujo autorizado en browser con sesión real
   de consultor/SuperAdmin (el preview cold solo alcanza el estado "sin acceso").
2. **Linking en onboarding**: al registrarse/verificar email, vincular
   EqSnapshot huérfanos por email (`eqSnapshot.updateMany({where:{email,
   userId:null}}, {data:{userId}})`). Patrón "reclamar tu SEI" — ya esbozado en
   `vital-signs/me/route.ts:77`.
3. **Mejorar `reporte-full-hiring.ts`** para igualar la riqueza del script
   Python (puntos verdes, fichas por persona, doble-marca benchmark) → así el
   reporte rico sale del módulo, no de un script manual.
4. **Influence/Change Style al motor** (roadmap, sección 4).
5. **Commitear** `scripts/hiring-rich-report/` (los scripts de referencia).
6. (Pendiente de otra sesión) F4 parser PDF Six Seconds, F5 cobro SEI $50.

## 7. Reglas duras del repo
- Nunca `git push --no-verify` / `--force` a main / tocar `git config`.
- Nunca `git add -A` wildcard — stage explícito archivo por archivo.
- TS strict ON: `pnpm exec tsc --noEmit --skipLibCheck` antes de pushear.
- Todo string visible al usuario pasa por `t()` en los 4 locales.
- Todo agente/call IA con `max_tokens`.
- Commits `feat(scope):` + trailer `Co-Authored-By: Claude Opus 4.7 (1M context)`.
- Build corre `prisma db push --accept-data-loss`: schema se propaga solo, pero
  back-relations + columnas non-null en tablas pobladas requieren cuidado.

## 8. Cómo arrancar la nueva sesión
Decir: *"lee `docs/entregables/CONTEXTO_SELECCION_HIRING.md` y sigamos con el
módulo de hiring"*. Ahí está todo. El siguiente paso natural es la **UI** (#1) o
el **linking de onboarding** (#2). Documentos relacionados:
`HIRING_PROCESO_Y_ROWIVERSE.md` (spec) y `CONTEXTO_MODULOS_SESION.md` (deuda
visual de los generadores).
