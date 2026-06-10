# PLAN — EQ PROPOSAL ACCELERATOR

### Del análisis manual de Bancolombia a plataforma web replicable (blueprint completo)

**Fuente:** Blueprint de Proceso y Producto (EQ Proposal Accelerator).
**Fecha:** 2026-06-10 · **Alcance acordado:** todo el blueprint, por fases · entregables PDF/print primero.

---

## EL PRODUCTO (no una feature)

Un partner certificado Six Seconds sube los datos de un cliente (TVS/SEI/LVS/OVS) y la
plataforma recorre 6 fases hasta DOS entregables segmentados:
- **Propuesta oficial** (cliente): EAR + 3 opciones + pricing. Solo agregado.
- **Guía confidencial** (partner): insights individuales + guion + reglas "¿tocar SEI?".

Human-in-the-loop: el partner confirma identidad de personas puente, decide qué se expone y
a qué nivel, y aprueba antes de exportar.

---

## LAS 6 FASES → mapeo a código (qué reuso, qué falta)

| Fase | Qué hace | Código existente | Falta |
|---|---|---|---|
| **1 Ingesta** | subir TVS/SEI/LVS/OVS, detectar formato/equipo/fecha, resolver identidad | parsers CSV (ovs/lvs), aggregateSeiFull, upload Blob | PDF parse, detección de equipo/cohorte, resolución de identidad cross-archivo |
| **2 Diagnóstico equipo (TVS)** | clima vs norma 100, marcar bajo/alto, **dispersión (DE) como señal** | aggregateOvsTvs (mean/sd/bands) | lectura iceberg, DE alta como "a quién" |
| **3 Diagnóstico individual (SEI)** | 8 comp + outcomes + talentos, vs norma | aggregateSeiFull, calculateVitalSigns, sei-bands | — (ya está) |
| **4 Cruces** | EQ→outcome (direccional n<30), TVS↔talentos, líder↔equipo, persona puente, longitudinal | cross-analysis.ts (espejo, correlaciones, deriva), blindspot-map | integrar al flujo nuevo; TVS↔talentos |
| **5 Segmentar** | clasificar cada insight: cliente/agregado vs partner/individual; ¿toca SEI? | — | **clasificador (nuevo) — el corazón** |
| **6 Entregables** | propuesta oficial (EAR+3 opciones+pricing) + guía confidencial | report PDF/print actual | generador EAR, 3 opciones, pricing; guía confidencial; export |

---

## EL MOTOR DE REGLAS (fase 2-5) — a codificar explícito y auditable

**Modelos de lectura:** iceberg (síntoma vs necesidad) · superficie(TVS) vs motor(SEI) ·
cadena EQ→Clima→Compromiso→Desempeño (validar, no asumir) · espejo líder-equipo ·
dispersión (DE alta = desacuerdo = intervención distinta del promedio bajo).

**Umbrales:** norma 100, DE≈15. bajo <96, alto >104, DE alta >14. Correlaciones solo
direccionales si n<30 (nunca causal). Identidad = varios identificadores duros coincidentes.

**Guardarraíles (no negociables):** no inventar datos · señales de bienestar = conversación
humana, no diagnóstico · nunca garantizar resultados · SEI individual solo en privado con
consent · partner aprueba antes de exportar.

**Segmentación raíz:** lo agregado es del proyecto (cliente); lo individual es de la persona
(partner, privado, con propósito de desarrollo y autorización).

---

## ROADMAP (del propio blueprint)

### MVP — automatiza fases 1-3 + borrador de 6
- [ ] Modelo de "proyecto de consultoría" (cliente, sector, equipos, objetivo)
- [ ] Ingesta TVS+SEI con etiquetado y validación
- [ ] Tablero de hallazgos: iceberg + vs norma + dispersión (motor de reglas v1)
- [ ] Borrador de propuesta oficial (EAR) → PDF/print

### v2 — automatiza fases 4-5 con human-in-the-loop
- [ ] Cruces avanzados (líder↔equipo, longitudinal, persona puente)
- [ ] Clasificador cliente vs confidencial (la decisión "¿tocar SEI?")
- [ ] Decisiones del partner (confirmar identidad, elegir nivel)
- [ ] Guía confidencial del partner → PDF/print

### v3 — plataforma completa
- [ ] Multi-instrumento LVS/OVS/EVS · biblioteca de casos · narrativa IA · pricing multi-país
- [ ] Export PPTX real (pptxgenjs) además del PDF

---

## GUARDARRAÍLES DEL PRODUCTO (no negociables, del blueprint)
Privacidad por diseño (SEI nunca en material de cliente; separación técnica agregado/confidencial) ·
honestidad de datos (etiquetar n pequeño, DE alta, identidad no confirmada) · cuidado humano
(lenguaje de acompañamiento ante bienestar) · solo herramientas/casos Six Seconds reales ·
aprobación del partner antes de exportar.

## ESTADO DE EJECUCIÓN (2026-06-10)

### ✅ MVP + v2 (sin pricing) — EN PRODUCCIÓN
Página: `/hub/admin/vital-signs/report` (tab "Informe SEI↔VS").
- Motor de reglas `diagnosis-engine.ts` (vs norma, dispersión, iceberg, bienestar) — 7 tests con datos reales de Bancolombia.
- Endpoint `/api/consultant/report` stateless: SEI+VS CSV → insights segmentados.
- DOS entregables con toggle: 📊 Informe (cliente, agregado) + 🔒 Guía confidencial (partner, individual). PDF por separado (@media print aísla cada uno).
- Segmentación cliente/partner + guardarraíles (n pequeño, DE alta, bienestar) automáticos.

### DOS FLUJOS, DOS CASOS (decisión Eduardo)
- **`/report` (stateless, rápido):** sube SEI+VS → entregables. NO persiste (privacidad). Sin cruces avanzados.
- **`/consultant` (con benchmark, persistido con consentimiento):** para los CRUCES AVANZADOS
  (espejo líder↔equipo, deriva longitudinal, persona puente) que necesitan data a nivel persona.
  Ya existe (`cross-analysis.ts`). **Los cruces avanzados viven aquí, no en /report** — así no se
  rompe la promesa de "no persistir" del flujo rápido.

### PENDIENTE (requiere contenido/decisión de Eduardo)
- **Propuesta EAR + 3 opciones + pricing** (v2): necesita la estructura EAR real, las 3 opciones
  (piloto/completa/expansión) y rangos de pricing por país. El blueprint prohíbe inventar → pendiente
  de tu contenido.
- **v3:** PPTX real (pptxgenjs), biblioteca de casos, narrativa IA extendida, pricing multi-país, EVS.

### ✅ ESTADO: el 90% del recorrido manual de Bancolombia está automatizado.
