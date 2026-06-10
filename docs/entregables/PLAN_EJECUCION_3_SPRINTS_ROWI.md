# PLAN DE EJECUCIÓN — 3 SPRINTS ROWI

### "No construir nada nuevo hasta cerrar los 3 loops que vuelven verdadera la tesis."

**Basado en:** `AUDITORIA_DEFINITIVA_ROWI_360.md`
**Fecha:** 2026-06-10 · **Decisión:** REPOSITION + FINISH
**Regla de oro:** ni Education, ni Marketplace, ni API, ni nuevos dashboards, ni nuevas pantallas, ni nuevos módulos — hasta que los 3 hitos de inversor estén verdes.

---

## CÓMO LEER ESTE PLAN

Cada tarea trae: **impacto · esfuerzo · riesgo · dueño · plazo · ROI · evidencia (file:line)**.
Prioridades: **P0** crítico · **P1** alto · **P2** medio · **P3** bajo.
Cada tarea es convertible directamente a issue de Linear/GitHub.

---

## DÍA 0 — ANTES DE LOS SPRINTS (horas, no días)

> No es "construir features nuevas" — es cerrar puertas abiertas mientras trabajas, para que un incidente no te robe el foco a mitad de sprint. Y el reposicionamiento del copy va aquí porque es medio día y arregla el 40/100 de posicionamiento sin tocar ingeniería.

### D0.1 — Guard de auth en `/api/hub/ai` `[P0 · seguridad]`
- **Evidencia:** `src/app/api/hub/ai/route.ts` (GET y PATCH sin chequeo); bypass en `middleware.ts:426` (`IA_PATHS`).
- **Acción:** añadir `requireSuperAdmin()` en GET y PATCH; sacar `/api/hub/ai` de `IA_PATHS` o restringir el bypass a subrutas de generación.
- **Impacto:** alto · **Esfuerzo:** 1h · **Riesgo:** bajo · **Dueño:** Eng · **ROI:** evita que cualquiera apague la IA en prod.

### D0.2 — Sacar 635MB de `public/` + `.vercelignore` `[P0 · datos/GDPR]`
- **Evidencia:** `public/SOH_benchmark_data.csv` (307MB), `public/SOH...xlsx` (291MB), `public/oa.csv`, `otiandre.csv`, `staff-retreat-sei.csv`, `public/TEST/`. Sin `.vercelignore`.
- **Acción:** mover a `data/seed/` (loader `seedSource.ts`) o S3/R2 firmado; crear `.vercelignore`; borrar `public/TEST/`. Verificar que `/SOH_benchmark_data.csv` dé 404.
- **Impacto:** alto · **Esfuerzo:** 1h · **Riesgo:** bajo · **Dueño:** Eng · **ROI:** elimina riesgo de fuga latente de assessments.

### D0.3 — robots.txt + sitemap → dominio canónico `[P1 · SEO]`
- **Evidencia:** producción devuelve `Host: rowi.vercel.app` y `Sitemap: rowi.vercel.app`.
- **Acción:** base URL canónica `https://www.rowiia.com` (idealmente env `NEXT_PUBLIC_SITE_URL`) en `robots.ts`/`sitemap.ts`.
- **Impacto:** medio · **Esfuerzo:** 1h · **Riesgo:** bajo · **Dueño:** Eng · **ROI:** recupera autoridad SEO.

### D0.4 — Reposicionar copy público `[P1 · posicionamiento]`
- **Evidencia:** `landing.hero.badge`="Inteligencia emocional con IA"; `landing.footer.copyright`="Emotional Intelligence Platform"; `for-you/page.tsx:59-60`="Matches Emocionales".
- **Acción (4 idiomas, vía `t()`):**
  - Badge → "La práctica diaria que te convierte en quien quieres ser · sobre la ciencia de Six Seconds".
  - Subtítulo → liderar con relaciones (Affinity/ECO), no con introspección.
  - Footer → eliminar "Emotional Intelligence Platform".
  - `for-you` → lenguaje de Affinity (leer el vínculo, cerrar la brecha), no "matches".
- **Impacto:** alto · **Esfuerzo:** 0.5 día · **Riesgo:** bajo · **Dueño:** Founder+Eng · **ROI:** ataca el 40/100 de posicionamiento sin código nuevo.

### D0.5 — N≥5 + consent en `org/summary` `[P0 · privacidad]`
- **Evidencia:** `src/app/api/org/summary/route.ts:185-194` (`_avg` EQ sin piso ni consent).
- **Acción:** suprimir el promedio si `< 5` miembros con snapshot; aplicar `filterByConsent`.
- **Impacto:** alto · **Esfuerzo:** 2h · **Riesgo:** bajo · **Dueño:** Eng · **ROI:** cierra desanonimización en empresas pequeñas.

---

## SPRINT 1 — TODAY → AVATAR → BECOMING

> **Objetivo:** si completas un loop diario, el avatar evoluciona, Becoming cambia y aparece un milestone — **inmediatamente**. El avatar crece por evidencia de reflexión, no por XP de chat.

### S1.1 — Conectar el cierre del loop TODAY al motor de evolución `[P0]`
- **Evidencia:** `src/app/api/today/route.ts` no llama a streak/`awardPoints`/`checkAndEvolve`. El patrón correcto ya existe en `src/app/api/daily-pulse/answer/route.ts:129-167`.
- **Acción:** al persistir el paso `reflection` (y/o `practice`) en `today/route.ts`, invocar: actualización de `UserStreak` (racha de reflexión), `awardPoints` (con un tipo de evento NUEVO orientado a evidencia, ver S1.2) y `checkAndEvolve`. Devolver en la respuesta el delta de evolución para que la UI lo muestre.
- **Impacto:** muy alto (retención) · **Esfuerzo:** 1 día · **Riesgo:** medio (no duplicar XP con Daily Pulse) · **Dueño:** Eng · **ROI:** convierte el loop en hábito.

### S1.2 — Rebalancear el avatar: evidencia > actividad `[P0]`
- **Evidencia:** `src/services/gamification.ts:443-446` (`CHAT: 10`, `DAILY_LOGIN: 5`); `evolution-calculator.ts:110-111` (comentario contradice el código).
- **Acción:** que `rowiLevel` (el 60% del `evolutionScore`) pondere fuertemente **reflexión + práctica completada**, y baje/elimine el peso de `CHAT`/`DAILY_LOGIN`. Alinear el código con su propio comentario "no crece por actividad vacía".
- **Impacto:** alto (coherencia con la tesis) · **Esfuerzo:** 0.5 día · **Riesgo:** medio (recalcular niveles existentes) · **Dueño:** Eng · **ROI:** el avatar pasa a representar Becoming, no actividad.

### S1.3 — BECOMING como memoria viva, no contraste vacío `[P1]`
- **Evidencia:** `becoming/page.tsx` usa contraste que exige 2 snapshots (`becoming/contrast/route.ts:78`); no consume `dailyLoopEntry.reflectionText` salvo para contar.
- **Acción:** renderizar timeline de reflexiones pasadas + milestones del avatar (los datos existen). Mostrar "en quién te estás convirtiendo" aunque haya un solo snapshot.
- **Impacto:** medio-alto · **Esfuerzo:** 1-1.5 día · **Riesgo:** bajo · **Dueño:** Eng+Design · **ROI:** BECOMING deja de estar vacío para el usuario nuevo.

### S1.4 — Milestone visible al cerrar el loop `[P1]`
- **Acción:** al evolucionar el avatar (S1.1), crear `avatarMilestone` y mostrarlo en TODAY y BECOMING ("Hoy te pareciste a quien quieres ser").
- **Impacto:** medio · **Esfuerzo:** 0.5 día · **Riesgo:** bajo · **Dueño:** Eng · **ROI:** recompensa emocional tangible.

**HITO 1 (inversor):** Loop completado → avatar evoluciona → usuario vuelve mañana. **Métrica:** retención día-2 y día-7.

---

## SPRINT 2 — INVITACIÓN → AFFINITY → ECO → CONNECT

> **Objetivo:** sin esto no existe la tesis SIA ni el efecto red.

### S2.1 — Calcular `heat135` al aceptar la invitación `[P0]`
- **Evidencia:** `src/app/api/public/relationships/invite/[token]/route.ts:100-103` guarda respuestas, no calcula afinidad. `persistHeat135ToDyad` ya existe (`affinityLearning.ts:62-96`).
- **Acción:** tras guardar `inviteeAnswers`, invocar el motor (`composite135`/`compAffinity135`) y `persistHeat135ToDyad`; marcar `otherJoined`/`lastGapAt`.
- **Impacto:** muy alto (viralidad) · **Esfuerzo:** 1 día · **Riesgo:** medio · **Dueño:** Eng · **ROI:** activa el efecto red.

### S2.2 — Mostrar el resultado de afinidad al invitado `[P0]`
- **Acción:** pantalla post-aceptación: "Tu afinidad con [owner] es X — así pueden conectar mejor", con CTA a ECO.
- **Impacto:** alto (segunda interacción) · **Esfuerzo:** 1 día · **Riesgo:** bajo · **Dueño:** Eng+Design · **ROI:** convierte la invitación en momento WOW relacional.

### S2.3 — ECO `/send` + outcome `[P1]`
- **Evidencia:** solo existe `compose/`; el envío es `mailto:`/`wa.me` (`SendMessageActions.tsx:56-93`); no hay feedback.
- **Acción:** endpoint `/api/eco/send` que registre el envío y, tras un tiempo, pregunte "¿funcionó?" escribiendo el outcome. **Primer escritor del foso.**
- **Impacto:** alto · **Esfuerzo:** 1.5 día · **Riesgo:** medio · **Dueño:** Eng · **ROI:** cierra el loop ECO y empieza a llenar datos.

### S2.4 — CONNECT = fuerza de relación (Affinity+ECO) `[P1]`
- **Evidencia:** `RowiRelation.strength` es columna dormida.
- **Acción:** calcular `strength` como fusión de `heat135` + uso de ECO + interacciones; mostrarlo en `/relationships`.
- **Impacto:** medio · **Esfuerzo:** 1 día · **Riesgo:** bajo · **Dueño:** Eng · **ROI:** materializa CONNECT.

### S2.5 — Arreglar cron de afinidad `[P1]`
- **Evidencia:** `vercel.json` (GET) vs `affinity/recalculate/route.ts:20` (POST+sesión).
- **Acción:** handler GET autenticado por `CRON_SECRET`, batched (patrón weekly-pulse). Borrar/cablear `affinity.cron.ts`.
- **Impacto:** medio · **Esfuerzo:** 0.5 día · **Riesgo:** bajo · **Dueño:** Eng · **ROI:** recálculo automático real.

**HITO 2 (inversor):** Invitación → Affinity calculada → ECO usado → segunda interacción. **Métrica:** % de invitaciones que producen afinidad + segunda sesión del invitado.

---

## SPRINT 3 — INTERVENTION → OUTCOME → KNOWLEDGE LAYER → DATASET

> **Objetivo:** empezar a llenar el foso. Casi todo está montado (exportador, panel admin, versionamiento) — **falta solo el `insert`.**

### S3.1 — Escribir `Intervention` al iniciar una práctica `[P0]`
- **Evidencia:** modelos ricos (`schema.prisma:7367-7419`), **cero `prisma.intervention.create` en el repo**.
- **Acción:** al asignar/aceptar una práctica en el daily loop (`today/route.ts`) o action-commitment, crear `Intervention` con `targetOutcome`/`expectedEffect` y `scoreBefore`.
- **Impacto:** muy alto (moat) · **Esfuerzo:** 1 día · **Riesgo:** medio · **Dueño:** Eng · **ROI:** primer dato del foso.

### S3.2 — Cerrar con `InterventionOutcome` (before/after) `[P0]`
- **Acción:** al completar la práctica/reflexión, escribir `InterventionOutcome` con `scoreAfter`/`measuredEffect`/`delta`.
- **Impacto:** muy alto · **Esfuerzo:** 1 día · **Riesgo:** medio · **Dueño:** Eng · **ROI:** cierra el loop causal "qué intervención movió qué outcome".

### S3.3 — Alimentar `PulsePointGroundTruth` desde el debrief `[P1]`
- **Evidencia:** consumidor existe (`research/calibration/route.ts:139,180`), productor no.
- **Acción:** que el debrief OWN/CONSIDER/REJECT escriba pares medidos en `PulsePointGroundTruth`.
- **Impacto:** alto · **Esfuerzo:** 1 día · **Riesgo:** bajo · **Dueño:** Eng · **ROI:** activa el "patrón de oro".

### S3.4 — Cablear `AffinityWeights` calibrados en los 6 routes en vivo `[P1]`
- **Evidencia:** versionamiento existe; los 6 routes usan `CTX` hardcoded e ignoran `loadAffinityWeights()`.
- **Acción:** que los routes lean los pesos activos.
- **Impacto:** medio · **Esfuerzo:** 0.5 día · **Riesgo:** bajo · **Dueño:** Eng · **ROI:** el motor de prod usa lo calibrado.

### S3.5 — Verificar el exportador con datos reales `[P2]`
- **Acción:** confirmar que `datasetExporter.ts` exporta JSONL no vacío una vez S3.1-S3.3 escriben datos.
- **Impacto:** medio · **Esfuerzo:** 0.5 día · **Dueño:** Eng · **ROI:** dataset entrenable real.

**HITO 3 (inversor):** Intervention → Outcome → Knowledge Layer creciendo → dataset acumulándose. **Métrica:** nº de pares Intervention/Outcome a 90 días (de 0 a >0 es la diferencia entre moat y narrativa).

---

## DESPUÉS DE LOS 3 LOOPS (no antes)

Solo cuando los 3 hitos estén verdes: Marketplace de coaches · API de Relationship Intelligence · Rowi LLM · Teams · Education · Enterprise.

---

## RESUMEN DE HITOS DE INVERSOR

| Hito | Cadena | Métrica de éxito |
|---|---|---|
| 1 | Loop → Avatar evoluciona → vuelve mañana | Retención d2/d7 (objetivo d7 > 25%) |
| 2 | Invitación → Affinity → ECO → 2ª interacción | % invitaciones con afinidad + 2ª sesión |
| 3 | Intervention → Outcome → Dataset | nº de pares a 90 días (>0) |

**Resultado esperado:** de 56/100 a 75-80/100 **sin agregar un solo producto nuevo.**

---

## ESTADO DE EJECUCIÓN

- [ ] Día 0 (D0.1–D0.5)
- [ ] Sprint 1 (S1.1–S1.4) ← **iniciado: S1.1/S1.2 en progreso**
- [ ] Sprint 2 (S2.1–S2.5)
- [ ] Sprint 3 (S3.1–S3.5)

> Nota: D0.1, D0.2, D0.3 y el cron (S2.5) tienen chips de tarea creados en la sesión de auditoría para spin-off en worktrees separados.
