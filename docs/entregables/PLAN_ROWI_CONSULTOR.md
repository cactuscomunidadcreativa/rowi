# PLAN — ROWI CONSULTOR (cruce SEI ↔ Vital Signs)

### El agente que lee SEI + LVS/TVS/OVS y produce el análisis en formato Rowi

**Origen:** proyecto Bancolombia (Be to Grow / EQ Latam). Modelo de salida = `Carolina_Navarro_perfil_integral.pdf`.
**Fecha:** 2026-06-10

---

## QUÉ QUIERE EDUARDO (validado)

1. **Input:** subir LVS / TVS / OVS (PDF **o** CSV) + SEI (CSV). El agente lee todo.
2. **Output en formato Rowi** (como el perfil de Carolina):
   - SEI completo: 8 competencias · 18 talentos · 4 outcomes · 8 sub-outcomes · estilos de cerebro
   - VS: 15 pulse points + 5 drivers (reconstruido vs oficial, con error)
   - **El cruce SEI↔VS = mapa de puntos ciegos** (alineado / punto ciego / oculto)
   - Diagnóstico narrativo del líder (voz en primera persona)
3. **Dos niveles:** individual (LVS↔SEI, perfil persona) + equipo (TVS/OVS↔SEI agregado, espejo líder↔equipo).

## HALLAZGO CIENTÍFICO QUE EL MOTOR DEBE RESPETAR

**SEI ≠ Clima (r≈0).** El cruce NO predice clima. Es un **mapa de brechas de autoconciencia**:
lectura RELATIVA interna (z-score) — dónde la persona se cree fuerte (VS auto-percibido) vs dónde
su capacidad real (SEI competencia + talento) lo sostiene. La escala absoluta no aplica (el LVS es
autoevaluación generosa); importa el patrón DENTRO de la persona.

Tres estados del cruce:
- **Alineado** — se cree fuerte y su SEI/talento lo respalda (fortaleza real).
- **Punto ciego** — se cree fuerte pero su SEI/talento está bajo (sobrevalora).
- **Oculto** — se subvalora teniendo capacidad alta (fortaleza no reclamada).

---

## LO QUE YA EXISTE EN CÓDIGO (no reconstruir)

- `src/lib/vital-signs/catalog.ts` — 15 pulse points, 5 drivers, OVS/TVS/LVS/FVS, outcomes, arquetipos.
- `src/lib/vital-signs/secret-map.ts` — **mapa pregunta→pulse→driver** (moat, desde env, nunca en git). `applyPulseMap` / `applyPulseMapCohort`.
- `src/lib/vital-signs/parsers/lvs.ts` + `ovs.ts` — parsers VS.
- `src/lib/vital-signs/vs-sei-individual.ts` — link VS↔SEI por correlación (≥2 ocasiones, consent-gated).
- `src/lib/consultant/cross-analysis.ts` — TVS↔SEI cohorte, espejo líder↔equipo, deriva temporal, correlaciones EQ→outcomes.
- `src/app/hub/admin/vital-signs/consultant/page.tsx` — sube SEI (CSV/xlsx vía Blob), orquesta endpoints.
- `src/app/api/consultant/*` — analysis, narrative (Claude), findings, leaders, people, inference.

---

## EL GAP (lo que falta para el formato Carolina)

| # | Falta | Por qué |
|---|---|---|
| **G1** | **Motor de puntos ciegos** (z-score interno SEI↔VS, 1 sola toma) | vs-sei-individual hace correlación (≥2 tomas); el perfil Carolina es z-score con 1 toma. Es el corazón del output. |
| **G2** | Parser de **TVS** (existe lvs/ovs, falta tvs) | el proyecto usa TVS de equipo |
| **G3** | **Extractor PDF** de reportes VS oficiales | hoy solo CSV; Eduardo quiere PDF también |
| **G4** | **Generador del perfil integral formato Rowi** (individual) | el "perfil Carolina" como salida HTML/PDF |
| **G5** | UI consultor: subir VS (no solo SEI) + elegir nivel (individuo/equipo) | hoy solo sube SEI |

---

## FASES

### Fase 1 — Motor de puntos ciegos (G1)  ← NÚCLEO, empieza aquí
`src/lib/consultant/blindspot-map.ts`: dado SEI (competencias+talentos) + VS pulse points de una
persona, produce el mapa alineado/ciego/oculto por z-score interno. Determinista, testeable, sin IA.
+ tests con los números reales de Carolina (Imaginación=punto ciego, Ejecución=alineado, etc.).

### Fase 2 — Parser TVS + extractor PDF (G2, G3)
Completar `parsers/tvs.ts`; extractor PDF que saca los valores de driver/pulse del reporte oficial.

### Fase 3 — Generador del perfil integral (G4)
Renderer formato Rowi (como Carolina): SEI + VS + mapa de puntos ciegos + diagnóstico narrativo IA
(reusa narrative/Claude). Individual y cohorte.

### Fase 4 — UI consultor (G5)
Subir VS (PDF/CSV) + SEI, elegir nivel, ver/descargar el perfil. Respeta privacidad (individual =
consent; cliente = solo agregado N≥5, como la guía confidencial del partner).

---

## PRIVACIDAD (de la Guía Confidencial del Partner)
- Lo **agregado** es del proyecto; lo **individual** es de la persona.
- Presentación al cliente: solo TVS equipo + SEI **agregado**, nunca perfiles individuales.
- El SEI individual solo se "toca" en 1:1 con consentimiento, como espejo (no evaluación).
- El motor calcula todo y etiqueta; **el generador decide qué exponer** según el destinatario.

## ESTADO
- [ ] Fase 1 (motor puntos ciegos) ← en curso
- [ ] Fase 2 · [ ] Fase 3 · [ ] Fase 4
