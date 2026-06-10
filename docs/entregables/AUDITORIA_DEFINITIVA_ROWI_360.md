# AUDITORÍA DEFINITIVA ROWI 360°

### Visión · Marca · Producto · UX · Código · Seguridad · IA · Negocio · Escalabilidad

**Modo:** comité extremo de auditoría · analizado como dueño que pagó USD 50M · solo evidencia con `file:line`, cero diplomacia.
**Fecha:** 2026-06-10 · **Rama:** `main` · **Dominio:** https://www.rowiia.com
**Método:** auditoría del código local (`Desktop/rowi`, mismo árbol que GitHub) + sitio en producción (headers, robots, sitemap, URLs sensibles verificadas con `curl`) + documentos oficiales. Hallazgos críticos verificados de primera mano.

---

## RESUMEN EJECUTIVO

> La auditoría **no** dice que Rowi esté mal. Dice algo más útil: **la visión es correcta, la arquitectura es razonablemente buena, el código está sorprendentemente sano — pero los loops que convierten la visión en realidad están incompletos.**

Eso es muy distinto a "el producto está roto" o "la tesis es incorrecta".

| Dimensión | Score | Lectura |
|---|---|---|
| Visión | 88/100 | Clara y diferenciada (a nivel interno) |
| Código | 72/100 | 0 errores TS, strict real, deuda acotada |
| Arquitectura | 70/100 | Capas sanas, multi-tenant maduro |
| **Posicionamiento** | **40/100** | **La web vende otra empresa distinta a la que se está construyendo** |
| **SCORE GLOBAL** | **56/100** | Inacabado en sus 3 cm más importantes, no roto |

**El hallazgo central:** existe una brecha entre *la empresa que el fundador cree que está construyendo* (Human Growth OS, foso de datos longitudinales) y *la empresa que el visitante cree que está viendo* (otra app de inteligencia emocional con IA). Esa brecha explica el 40/100 de posicionamiento y arrastra retención, viralidad y monetización.

**Los 3 loops que importan** (no la seguridad, ni el SEO, ni el diseño):

1. **TODAY no mueve BECOMING** → no hay recompensa al reflexionar → retención débil.
2. **El avatar crece por XP, no por evidencia de transformación** → el avatar contradice la filosofía oficial.
3. **La invitación no genera afinidad automáticamente** → no hay efecto red → no hay viralidad ni moat relacional.

Y el moat declarado (`Intervention → Outcome → Dataset → Rowi LLM`): la tabla está **vacía, cero inserts**. Si sigue vacía en 90 días, el moat es narrativa.

**Decisión:** **REPOSITION + FINISH.** No construir ninguna feature nueva (ni Education, ni Marketplace, ni API, ni dashboards) hasta cerrar estos tres loops. Cerrarlos sube a Rowi de 56 a ~75-80/100 **sin agregar un solo producto nuevo**.

---

## NOTA SOBRE LOS ACTIVOS

| Activo | Estado |
|---|---|
| https://rowiia.com | ✅ Auditado |
| GitHub `cactuscomunidadcreativa/rowi` | ⚠️ Auditado vía código local (mismo árbol); no se comparó divergencia con `origin/main` |
| `Desktop/rowi` | ✅ Auditado en profundidad |
| `ROWI_DOCUMENTO_TOTAL.pdf` | ⚠️ Existe solo como `.md` |
| `Rowi_PitchDeck.pptx` | ❌ No existe (solo `pitch/Rowi_NVIDIA_Inception_Pitch.pptx`) |
| `Rowi_OnePager.pdf` | ❌ No existe |

**Hallazgo:** los documentos comerciales "oficiales" no existen. Para levantar capital, el deck y el one-pager no pueden ser un archivo reutilizado de NVIDIA.

---

## LOS 3 LOOPS — DIAGNÓSTICO CON EVIDENCIA

### Loop 1 — TODAY → Avatar → BECOMING (ROTO)

- El loop diario de 4 pasos **sí funciona y persiste**: `src/app/(app)/today/page.tsx:104-254` + `src/app/api/today/route.ts:78-182`.
- **Pero `today/route.ts` NUNCA otorga XP, NUNCA actualiza la racha de reflexión, NUNCA llama `checkAndEvolve`.** Completar el loop no mueve el avatar.
- El que sí mueve el avatar es un sistema **paralelo**: el Daily Pulse (`src/app/api/daily-pulse/answer/route.ts:129-167` actualiza streak + `awardPoints` + `checkAndEvolve`).
- BECOMING (`src/app/(app)/becoming/page.tsx`) es un contraste + 3 stats (incl. `totalXP`), no memoria viva. El contraste exige 2 snapshots que casi nunca existen (`src/app/api/becoming/contrast/route.ts:78`), así que para el usuario nuevo aparece vacío.

**Consecuencia:** el usuario reflexiona y no pasa nada. Retención día-7 estimada 8-12%.

### Loop 2 — El Avatar (DESCONECTADO DE LA TESIS)

- Los 6 estados existen y están bien: `EGG/HATCHING/BABY/YOUNG/ADULT/WISE` (`src/lib/eq/evolution-calculator.ts:45-88`, `src/domains/avatar/components/RowiStageImage.tsx:16`).
- La cascada SEI→mini-SEI→fallback existe y es correcta (`src/services/avatar-evolution.ts:48-80`).
- **El defecto de fondo:** `evolutionScore = rowiLevel*0.6 + sixSecondsLevel*0.4` (`evolution-calculator.ts:121-123`), y `rowiLevel` (el 60%, el "Becoming") sale **puramente de `totalXP`** (`avatar-evolution.ts:139-140`). El XP se gana con `CHAT: 10, DAILY_LOGIN: 5, SOCIAL_*` (`src/services/gamification.ts:443-446`).
- El comentario del calculador dice "NO crece por actividad vacía" (`evolution-calculator.ts:110-111`) — **el código hace exactamente lo contrario.**
- Lo único alineado: la "Regla del Huevo" pondera reflexión (3%/día vs 0.5%/día de presencia, `evolution-calculator.ts:185-194`) — pero solo aplica antes de eclosionar, y la racha que premia la mueve el Daily Pulse, no la reflexión de TODAY.

**Consecuencia:** el avatar representa actividad, no transformación. Contradice la filosofía oficial.

### Loop 3 — Invitación → Affinity → ECO → Connect (SIN EFECTO RED)

- Motor Affinity: sólido y determinista, fusiona 5 fuentes (`src/domains/affinity/lib/affinityEngine.ts:129-229`).
- ECO: compone con brain style/talentos/díada reales y acumula hilo (`src/app/api/eco/compose/route.ts:186-483,573`). **70/100, lo más terminado.**
- **La invitación está ROTA:** `src/app/api/public/relationships/invite/[token]/route.ts:100-103` guarda `inviteeAnswers` y **nunca calcula `heat135`** ni lo persiste en la díada. La función que cerraría el loop (`persistHeat135ToDyad`) existe pero no se invoca aquí.
- `AffinityInteraction` solo recibe inserts self↔self (`src/app/api/today/route.ts:189`); las díadas reales no alimentan el aprendizaje.
- **Connect:** `RowiRelation.strength` es columna dormida, nunca se calcula. "Fuerza de relación" no existe como feature.
- Cron de afinidad **roto**: `vercel.json` invoca 6 crons vía GET, pero `src/app/api/affinity/recalculate/route.ts:20` solo exporta POST con sesión → nunca corre.

**Consecuencia:** sin afinidad calculada al invitar, no hay viralidad ni moat relacional.

### El Moat — Knowledge Layer (INFRA EN CONSTRUCCIÓN → PROMESA en la capa causal)

| Loop de captura | Estado | ¿Captura hoy? |
|---|---|---|
| AIResponseCache | EJECUTADO | ✅ (7 endpoints) |
| ECO memoria de hilo | EJECUTADO | ✅ |
| PulsePointInference | EJECUTADO | ✅ |
| Affinity heat135→díada (vista en vivo) | PARCIAL | ⚠️ solo si se abre la pantalla |
| AffinityInteraction | PARCIAL | ⚠️ solo self↔self |
| Afinidad al aceptar invitación | ROTO | ❌ |
| Cron recalc afinidad | ROTO | ❌ |
| **Intervention → InterventionOutcome** | **VACÍO** | ❌ **cero inserts en todo el repo** |
| PulsePointGroundTruth | VACÍO | ❌ sin escritor |
| ECO → outcome | VACÍO | ❌ |
| CONNECT strength | NO EXISTE | ❌ |

**~3-4 de ~12 loops capturan datos (~30%).** El exportador JSONL (`src/ai/learning/datasetExporter.ts`) funciona pero exporta de tablas vacías. **No hay dataset entrenable para un "Rowi LLM" hoy.** El bueno: alrededor de `Intervention/Outcome` ya está todo montado (exportador, panel admin, versionamiento de pesos) — **falta solo el `insert`.**

---

## SEGURIDAD — TOP RIESGOS (P0 a cerrar Día 0)

| # | Riesgo | Evidencia | Severidad |
|---|---|---|---|
| 1 | `/api/hub/ai` sin auth: cualquiera lista y apaga/reinicia los agentes IA | `src/app/api/hub/ai/route.ts` (sin guard) + bypass `middleware.ts:426` | **Crítica** (verificado en prod) |
| 2 | 635MB de assessments en `public/` sin `.vercelignore` | `public/SOH_benchmark_data.csv` (307MB), `public/SOH...xlsx` (291MB), `public/oa.csv`, `otiandre.csv`, `staff-retreat-sei.csv`, `public/TEST/` | **Crítica latente** (hoy 307 por middleware; sin defensa de archivo) |
| 3 | Bypass `IA_PATHS` salta gate de rol del middleware | `middleware.ts:85-90,426` | Alta |
| 4 | Permisos en JWT, revocación tarda 24h | jwt callback NextAuth | Alta |
| 5 | reset-password sin rate-limit por token | `src/app/api/auth/reset-password/route.ts` | Alta |
| 6 | IDOR de datos EQ en `eco/compose` (`memberIds` sin validar ownership) | `src/app/api/eco/compose/route.ts:28-37` | Media |
| 7 | `_avg` EQ del tenant sin piso N≥5 ni consent (privacidad) | `src/app/api/org/summary/route.ts:185-194` | Alta |
| 8 | robots.txt/sitemap apuntan a `rowi.vercel.app`, no a rowiia.com | producción (verificado) | Media (SEO) |

**Bien (señales de salud):** sin secretos en git, cero SQL injection, OAuth exige `email_verified`, cookie `rowi_active_context` solo estrecha, Stripe webhook verifica firma (`src/app/api/stripe/webhook/route.ts:59`), diarios privados blindados por `userId === session`, export GDPR Art.15 completo, headers de prod excelentes (HSTS preload, CSP, X-Frame DENY).

---

## PRIVACIDAD

- **Diarios/reflexiones: NO visibles para empresas.** Blindado por `session.user.id` en todas las rutas. ✅
- **Hueco Alto:** `org/summary/route.ts:185-194` expone `_avg` EQ sin N≥5 ni consent → desanonimiza en tenants chicos.
- Borrado de cuenta (GDPR Art.17) **no automatizado**, solo email (`src/app/hub/account/privacy/page.tsx:210`).
- PII (nombres + texto libre) va a OpenAI sin anonimizar (`eco/compose/route.ts:434-453`). No se envían diarios ni emails.

---

## CÓDIGO — SALUD Y DEUDA

**Salud:** ✅ 0 errores TS · ✅ strict real (`next.config.ts:12`) · ✅ 4 locales completos (6759 líneas c/u) · ✅ XSS sanitizado (DOMPurify) · ✅ AI wiring unificado en `src/lib/ai/generate.ts`.

**Deuda priorizada:**
- P1: falta `directUrl` Neon (`prisma/schema.prisma` datasource); bcrypt+bcryptjs coexisten (`package.json:63-64`); 3 CSV + 3 xlsx libs; `landing-old/page.tsx` muerto; 509 `catch(e:any)` que devuelven `error.message` crudo.
- P2: `apps/rowi/` (app paralela falsa); 265 `console.log`; 215 `as any` (peor en `core/auth/config.ts`, `stripe/subscription-service.ts`); ~14 modelos ERP sin UI.
- P3: 48 ternarios `lang==="es"` en 22 archivos (dejan pt/it en inglés, incl. `pricing` y `register`).

---

## POSICIONAMIENTO — LA BRECHA

| Percepción actual | % | Causa |
|---|---|---|
| Wellbeing / emocional / chatbot | ~65% | `landing.hero.badge`="Inteligencia emocional con IA"; footer="Emotional Intelligence Platform"; GUIDE="🤖 Rowi Coach" |
| Human Growth OS / Daily Practice / relaciones | ~15% | solo el headline "Sé quien quieres ser" |

**El producto debería vender:** *"Conviértete en quien quieres ser"* / *"La práctica diaria que transforma relaciones."*

---

## SCORE FINAL

| Categoría | Score | | Categoría | Score |
|---|---|---|---|---|
| Visión | 88 | | Knowledge Layer | 35 |
| Claridad | 50 | | IA | 65 |
| Posicionamiento | 40 | | Six Seconds Align | 62 |
| Marca | 70 | | Seguridad | 60 |
| Producto | 55 | | Privacidad | 68 |
| UX | 60 | | Código | 72 |
| Conversión | 42 | | Arquitectura | 70 |
| Today | 68 | | Escalabilidad | 58 |
| Becoming | 45 | | SEO | 48 |
| Affinity | 62 | | Monetización | 50 |
| ECO | 70 | | Potencial VC | 58 |
| Connect | 15 | | Avatar | 45 |

### **SCORE GLOBAL: 56/100** → objetivo tras 3 sprints: **75-80/100**

---

## VEREDICTO

### → **REPOSITION + FINISH**

El código está sano y la visión es correcta (descarta REBUILD/KILL). Pero el producto no cumple su propia tesis y la web vende otra cosa (descarta BUILD ciego/PAUSE).

1. **REPOSITION** la narrativa pública: de "inteligencia emocional con IA" a "la práctica diaria que te convierte en quien quieres ser", con Affinity/ECO en el hero.
2. **FINISH** los 3 cm que faltan: conectar el loop al avatar, calcular afinidad en la invitación, escribir Intervention/Outcome. **Nada nuevo hasta cerrar estos tres loops.**

> *"No teníamos un problema de visión ni de ingeniería. Teníamos un problema de foco: construimos a lo ancho lo que debíamos terminar a lo hondo."*

**Plan de ejecución detallado:** ver `PLAN_EJECUCION_3_SPRINTS_ROWI.md`.
