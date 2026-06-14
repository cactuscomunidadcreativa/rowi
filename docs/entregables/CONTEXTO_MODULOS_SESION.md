# Contexto para nueva sesión — Cierre de módulos Hiring + Consulting

> **Cómo trabajar esta sesión (instrucción de Eduardo):**
> Se hace **UNO por UNO**. Para cada entregable: se construye → **se prueba**
> (se genera el PDF/PPTX real y se renderiza a imagen para revisarlo) → **se ve**
> → se toman decisiones con Eduardo → y al final **se termina TODO en una sola
> sesión**. No avanzar al siguiente hasta que el actual esté al 100%.

---

## 0. El objetivo

Rowi tiene dos módulos que producen entregables profesionales a partir de
archivos SEI / Vital Signs que sube un consultor:

- **HIRING** (reclutamiento): líder + N candidatos → reporte de afinidad,
  benchmark vs top performers, hipótesis LVS, perfil por candidato.
- **CONSULTING** (consultor): equipo/líder → perfil integral, propuesta al
  cliente, guía confidencial del partner, hallazgos.

Los entregables ya fueron **validados a mano** por Eduardo (están en
`~/Downloads/Rowi_LineaGrafica/` los originales, y en `~/Downloads/` las
muestras nuevas). La tarea es que el **módulo los genere automáticamente** en
TypeScript nativo (corre en Vercel, el consultor da clic y descarga), en el
**idioma que elija el consultor** (ES / PT / EN; IT es roadmap).

**Regla de oro Rowi en estos entregables:** son una *lente de relación y
desarrollo, no un veredicto*. La IE nunca se usa para decidir a quién contratar.
"Diagnóstico" solo existe en el módulo consultor; el lado usuario (Pre-SEI) es
"espejo / reflejo emocional".

---

## 1. Estado actual (lo HECHO)

Rama de trabajo: **`feat/hiring-consulting-modules`** (NO mergeada a main).
Commits en orden:
- `bc84d4c` — F1 lenguaje espejo (purgar "diagnóstico" del Pre-SEI, 4 idiomas).
- (commit) — Entregable 1: Perfil Integral PDF (kit gráfico + generador).
- (commit) — Entregable 2: Reporte Full de Hiring PDF (12-pág, 3 idiomas).

### Lo que ya existía en el repo ANTES (no reconstruir)
- `/api/consultant/report` — stateless: sube SEI CSV + VS CSV → devuelve perfil
  (SEI agregado + VS real/inferido + mapa puntos ciegos + diagnóstico + 2
  canastas). **NINGÚN botón lo dispara hoy** (esa es parte de la brecha).
- `src/lib/consultant/pptx-export.ts` — genera 2 PPTX (cliente + confidencial),
  client-side, con pptxgenjs. Existe pero sin UI que lo invoque.
- `src/lib/consultant/profile-generator.ts` — arma el perfil + narrativa IA
  (Anthropic, maxTokens 900). Motor del diagnóstico.
- `src/lib/consultant/blindspot-map.ts` — motor del cruce SEI↔VS (z-scores,
  umbral 0.35). Clasifica: alineado / punto_ciego / oculto / neutral.
- `src/app/hub/admin/vital-signs/consultant/page.tsx` — flujo 4 pasos: sube SEI
  → infiere VS → marca líderes → hallazgos. **Llega a "hallazgos", NO genera
  entregables descargables.**
- Motores de datos en TS que YA existen (NO portar de Python):
  - `src/domains/affinity/lib/affinityEngine.ts` — afinidad por contexto (0-135).
  - `src/lib/benchmarks/top-performers.ts` — percentil p90, perfil top performer.
  - `src/lib/vital-signs/calculate.ts` — `calculateVitalSigns` (LVS inferido).
  - `src/lib/benchmarks/process-benchmark.ts`, `parsers/ovs.ts`, `parsers/lvs.ts`
    — parsean SEI/VS CSV+XLSX (PDF aún NO, ver F4).

### Lo NUEVO que se construyó (TS nativo, en `src/lib/deliverables/`)
- **`pdf-kit.ts`** — kit gráfico Rowi compartido (server-side, pdfkit). Clase
  `RowiPdf` con: header (franja violeta + búho de `public/owl.png`), barras
  70-130 con marca de norma, tablas con header violeta, callouts, chips de
  estado, bandChip (hot/warm/cold), rankCard, countCards. **Base de TODOS los
  entregables PDF.** Paleta y geometría aquí.
- **`perfil-integral.ts`** — Entregable 1 (Consulting). Modelo Carolina:
  SEI completo + 18 talentos + outcomes + sub-outcomes + estilos + 15 pulse
  points LVS + tabla 5 drivers + cruce SEI↔VS + diagnóstico. 3 idiomas.
  Smoke test: `scripts/deliverables-smoke/perfil-integral.smoke.mts`.
- **`reporte-full-hiring.ts`** — Entregable 2 (Hiring). 3 secciones (Afinidad,
  Benchmark, Hipótesis LVS). Texto interpretativo HÍBRIDO: plantillas
  deterministas por defecto + hook `enrich` (IA) para plan superior.
  Smoke test: `scripts/deliverables-smoke/reporte-full-hiring.smoke.mts`.

### Cómo correr los smoke tests (generan los PDF reales)
```bash
cd /Users/eduardogonzalez/Desktop/rowi
TSX_TSCONFIG_PATH=./tsconfig.json pnpm exec tsx scripts/deliverables-smoke/perfil-integral.smoke.mts
TSX_TSCONFIG_PATH=./tsconfig.json pnpm exec tsx scripts/deliverables-smoke/reporte-full-hiring.smoke.mts
# luego renderizar para revisar:
pdftoppm -png -r 60 /tmp/perfil-carolina-es.pdf /tmp/check && open /tmp/check-1.png
```
Los smoke tests leen JSONs de datos reales en `/tmp/` (affinity-results.json,
benchmark-results.json, lvs-results.json, context-deltas.json). **Si /tmp se
limpió**, regenerarlos con los scripts `/tmp/affinity-hiring.mts`,
`/tmp/benchmark_analysis.py`, `/tmp/lvs-hiring.mts` (o re-derivar del CSV del
proceso). NOTA: tsx agrupa los exports nombrados bajo `default` — en los smoke
tests importar `import mod from "..."` y leer `(mod as any).buildX`.

---

## 2. BUGS VISUALES detectados (ARREGLAR PRIMERO en la nueva sesión)

Eduardo revisó las muestras y marcó estos problemas. **Antes de construir más
entregables, arreglar el kit gráfico** (beneficia a todos):

### 2.1 Texto se sale de las cajas
En `pdf-kit.ts` el `callout()` y algunas celdas: el texto desborda el borde
derecho (visible en "Lectura de Rowi" de la portada del Reporte Full — el
nombre "Kaue Ferreira Lisboa" se corta contra el margen). Causa probable:
ancho interno mal calculado o `lineBreak:false` donde debería envolver.
**Revisar TODOS los helpers que dibujan texto y garantizar `width` correcto +
wrap.** Probar con textos largos en los 3 idiomas (el alemán/portugués estiran).

### 2.2 Celdas de tabla con `\n` no respetan el alto
En la tabla síntesis de la portada (Persona con "Nombre\nRol · EQ"), el salto
de línea no expande bien la fila. Revisar `table()` para multilínea real.

### 2.3 Paginación poco densa
El Reporte Full salió en 9 páginas pero con mucho espacio vacío al fondo de
varias (ej. pág 3 "lente relacional" medio vacía). Decidir con Eduardo:
- ¿más denso (juntar secciones, menos páginas)?  o
- ¿forzar saltos para igualar las 12 págs del original (1 sección por página)?

### 2.4 Lenguaje visual de marca incompleto (LOS COLORES DIFIEREN)
Los colores base SÍ coinciden con la marca, pero falta el lenguaje visual
COMPLETO de Rowi. Diferencias a cerrar:
- **Gradientes:** la marca usa gradiente violeta `--rowi-g2 #7c3aed` →
  `--rowi-g1 #d797cf` (rosa) en headers/botones. El PDF usa violeta plano.
  Considerar gradiente en la franja del header.
- **Fuente:** el producto usa fuentes redondeadas y cálidas
  (Varela Round / Quicksand para títulos, Poppins para cuerpo — el brand book
  dice que son "exactamente la voz de la marca, no tocar"). El PDF usa
  **Helvetica** (fuente base de pdfkit). **Para fidelidad real hay que embeber
  los TTF** (Poppins/Quicksand) en pdfkit con `doc.registerFont()`. Conseguir
  los .ttf (Google Fonts) y meterlos en `public/fonts/` o `assets/`.
- **El búho:** ya se usa (`public/owl.png`), bien.

### Paleta oficial Rowi (del Brand Book, confirmada en `globals.css`)
```
Primario:    Violeta  #7c3aed   (--rowi-g2)         ← color de marca
Secundario:  Violeta  #7a59c9   (--rowi-g3) + Azul #31a2e3 + Rosa #f378a5
Gradiente:   #7c3aed → #d797cf (g2→g1, violeta→rosa)
Cálido:      Naranja  #e0723a   (acento WIII)
Noche:       Violeta  #a78bfa   (primario modo noche)
SEI funcionales (dashboards, NO branding):
  Know/Focus/SEE       Azul   #1E88E5
  Choose/Decisions     Morado #7A59C9
  Give/Drive/CONNECT   Verde  #43A047
Fuentes: Varela Round / Quicksand (títulos) · Poppins (cuerpo) · Inter (fallback web)
Tagline: ES "Sé quien quieres ser" · EN "Be who you want to be" · PT "Seja quem você quer ser"
Marca "rowi" siempre en minúsculas. "Six Seconds", "SEI" nunca se traducen.
```
El Brand Book completo está en `~/Downloads/Rowi_LineaGrafica/ROWI_2_BRAND_BOOK_ROWI.pdf`
(y traducido a EN/PT en la misma carpeta).

---

## 3. Lo que FALTA (los 5 entregables restantes + cableado + cobro)

### Entregables restantes (TS nativo, mismo patrón que los 2 hechos)
3. **Perfil individual por candidato** (Hiring, PDF) — ficha por persona del
   proceso. Reusa secciones del Reporte Full pero para 1 candidato.
4. **Guía Confidencial del Partner** (Consulting, PDF) — el mapa, insight
   central, gap jefatura-equipo, qué tocar y qué no, guion de conversación.
   Modelo: `~/Downloads/Rowi_LineaGrafica/Guia_Confidencial_*_ROWI.pdf`.
   Datos: `insights.partner` de `/api/consultant/report` ya se calcula.
5. **Guía del presentador** (Hiring, PDF) — cómo explicar el reporte, preguntas
   difíciles, ética. Modelo: `~/Downloads/ROWI_GUIA_DEL_PRESENTADOR_*.pdf`.
6. **Propuesta / Pitch al cliente** (Consulting, PPTX) — deck comercial:
   hallazgos + enfoque Atraer·Activar·Reflexionar + rutas + inversión. Usa
   pptxgenjs (ya en repo). Modelos: `Propuesta_Bancolombia_OFICIAL` /
   `Pitch_Werfen_Marketing`.
7. **Hallazgos preliminares** (Consulting, PPTX) — los 5 hallazgos con persona
   puente, lectura cruzada TVS+SEI. Modelo: `Hallazgos_Bancolombia_VS_SEI`.

### Cableado (conectar generadores a la UI) — decisión ya tomada: AMBOS modos
- **Paso 5 "Entregables"** en `consultant/page.tsx`: tras hallazgos, botones de
  descarga (PDF+PPTX, cliente+confidencial) reusando el `benchmarkId` cargado.
- **Vista rápida stateless**: sube SEI+VS directo → baja los 4 archivos, sin el
  flujo largo de benchmark/líderes.
- **Endpoints API server-side** que devuelven el PDF (decisión: PDF en servidor,
  no browser). Cada generador `buildX()` ya devuelve Buffer; falta el route
  `/api/consultant/deliverable/[tipo]` y `/api/hiring/deliverable/[tipo]` con
  selección de idioma y `requireCapability`.
- **Hiring necesita además:** bulk CSV import de candidatos (hoy es 1×1 en
  `selection/page.tsx`), y conectar los motores (affinityEngine, top-performers,
  calculate) en vivo para producir los datos que hoy vienen de JSONs de /tmp.

### F4 — Parser de PDF de reportes Six Seconds (VIABLE, probado)
Los 3 PDFs de ejemplo de Eduardo extraen texto limpio (números con etiquetas):
- `~/Downloads/2026-05-2525_TVS - Marketing Werfen...pdf` (TVS, PT)
- `~/Downloads/OVS 2.0 - Sample Report (English) (1).pdf` (OVS, EN)
- `~/Downloads/CarolinaNavarro (1).pdf` (es LVS Self, NO SEI — drivers 1-5)
Construir `src/lib/parsers/vs-pdf.ts`: autodetecta TVS/OVS/LVS, extrae tabla de
scores (driver/outcome + media + DP) con `pdftotext -layout` o pdf parsing.
Calibrar contra esos 3. **FALTA un PDF de SEI individual completo** (8 comps +
18 talentos, 70-130) para calibrar ese parser — pedírselo a Eduardo. El SEI por
ahora entra por CSV (ya funciona).

### F5 — Cobro SEI $50 (VIABLE: links son por convenio, Eduardo revende)
Six Seconds NO recobra al usuario (links cubiertos por convenio de partner) →
cobrar $50 y reenviar el link es limpio. Construir:
- Producto one-time $50 en Stripe (la infra `subscription-service.ts` existe;
  agregar modo pago único).
- Flujo: pide SEI → checkout Stripe $50 → webhook `checkout.session.completed`
  → activa `seiIncluded`/entrega link de `/api/sei/link` → registra `Payment`.
- Detrás de flag `SEI_PAID_ENABLED` (apagado hasta confirmar todo en prod).
- (Idea de Eduardo, mejor margen pero NO elegida aún: bundle "SEI + 6 meses
  Rowi" — la infra de planes de 6 meses YA existe (`plan SEI` $49/6m). Dejar
  como opción de upsell.)

---

## 4. Decisiones ya tomadas (no volver a preguntar)
- Idioma: lo elige el consultor (ES/PT/EN). IT roadmap.
- Salida: PDF (server-side, pdfkit) + PPTX (pptxgenjs).
- Generadores: TS nativo en el repo (lo más automatizado; corre en Vercel).
- Lenguaje: "diagnóstico" solo en consultor; usuario = "espejo/reflejo".
- Cruce SEI↔VS: usar el motor real `blindspot-map.ts` (más honesto, más
  "Neutral" que la clasificación editorial manual). NO bajar el umbral.
- Texto interpretativo: híbrido — plantillas deterministas + IA en plan superior.
- Cableado: ambos modos (Paso 5 en flujo + vista rápida stateless).
- Cobro SEI: $50 suelto (Rowi cobra y reenvía link); links por convenio.
- Lib PDF: pdfkit (ya instalada). PPTX: pptxgenjs (ya en repo).

## 5. Decisiones PENDIENTES (preguntar a Eduardo al arrancar)
- Paginación Reporte Full: ¿densa (9 págs) o 1-sección-por-página (12 págs)?
- ¿Embeber fuentes Poppins/Quicksand (.ttf) para fidelidad de marca, o seguir
  con Helvetica? (embeber es más fiel pero suma assets).
- ¿Gradiente violeta→rosa en headers, o violeta plano?
- ¿Conseguir un PDF de SEI individual completo para calibrar ese parser (F4)?

---

## 6. Orden sugerido para la nueva sesión
1. **Arreglar bugs del kit** (§2.1–2.4): texto en cajas, tablas multilínea,
   fuentes/gradiente. Regenerar los 2 entregables hechos y re-validar.
2. Entregable 3 (Perfil candidato) → probar → ver → decidir.
3. Entregable 4 (Guía Confidencial) → probar → ver → decidir.
4. Entregable 5 (Guía presentador) → probar → ver → decidir.
5. Entregables 6 y 7 (PPTX: Propuesta + Hallazgos) → probar → ver → decidir.
6. Cableado: endpoints API + Paso 5 UI + vista rápida + bulk CSV Hiring.
7. F4 parser PDF. F5 cobro SEI (flag).
8. typecheck final (`pnpm exec tsc --noEmit --skipLibCheck`), commit, y
   decidir merge a main con Eduardo.

## 7. Reglas duras del repo (NO violar)
- Nunca `git push --no-verify` / `--force` a main / tocar `git config`.
- Nunca `git add -A` con wildcard (stage explícito archivo por archivo).
- TS strict ON: `pnpm exec tsc --noEmit --skipLibCheck` antes de pushear.
- Todo string visible al usuario pasa por `t()` en los 4 locales.
- Todo agente/call IA con `max_tokens` (cost-control).
- Commits `feat(scope):` con trailer `Co-Authored-By: Claude Opus 4.7 (1M context)`.
```
```
