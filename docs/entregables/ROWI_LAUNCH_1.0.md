# ROWI LAUNCH 1.0 — PLAN DE EJECUCIÓN POR FASES

**Fecha:** 2026-06-10 · **Base:** AUDITORIA_UX_TOTAL_ROWI.md (commit auditado `985048c`) + Plan Maestro por Fases de Eduardo
**Promesa central:** SÉ QUIEN QUIERES SER · **Modelo:** MÍRATE → ELÍGETE → ACCIONA → ENTRÉGATE → IMPACTA
**Decisión vigente:** FINISH — cerrar loops, capturar outcomes, activar el moat, validar con humanos, escalar lo que funcione.

---

## CÓMO SE USA ESTE PLAN

- **Cada fase se cierra al 100% antes de abrir la siguiente.** El cierre lo define el "Criterio de 100%" de cada fase: checklist técnico + verificación en vivo + KPI instrumentado. No hay cierre "casi".
- **Tres tracks transversales** (T1 i18n total · T2 Google Cloud · T3 Apps móviles) avanzan en paralelo, pero cada uno tiene su momento de activación para no violar la regla FINISH.
- **Regla congelada hasta Fase 7:** no funcionalidades nuevas, no módulos nuevos, no rediseños, no EmoPower, no Education, no ERP, no dashboards nuevos, no idiomas nuevos (los 4 actuales se COMPLETAN, no se agregan más), no integraciones nuevas (las 3 código-listo solo se ENCIENDEN).
- Cada tarea referencia el hallazgo de la auditoría (P0-x / P1-x / P2) y el archivo:línea. Convenciones del repo aplican siempre: `t()` en 4 idiomas para todo string nuevo, tsc 0 errores, 518+ tests verdes, commits `fix(scope):`/`feat(scope):` solo con aprobación de Eduardo.

### Reconciliación filosofía ↔ producto (fijada, no se rediscute)
| Filosofía | Producto |
|---|---|
| MÍRATE | Emotional Mirror / Pre-SEI / mini-SEI / SEI / perfil |
| ELÍGETE + ACCIONA | **TODAY (intacto, no se divide)** |
| ENTRÉGATE | Affinity / ECO / Community / Relaciones |
| IMPACTA | Vital Signs / equipos / reportes / coaching |
| **BECOMING = memoria viva transversal** (no es etapa) | /becoming — el plano vertical del tiempo |
| Navegación UI | **Se mantiene TODAY · BECOMING · GUIDE · MORE** (los 5 verbos son modelo conceptual, copy y métrica; los `journey` keys del NavBar ya mapean a ellos) |

---

# FASE 1 — ESTABILIZAR EL CORE (≈1 semana)

**Objetivo:** eliminar los P0. Resultado: *"Lo que prometemos es lo que ocurre."*

### 1A. Infraestructura de email (Eduardo, ~1 hora, sin código) — P0-10
- [ ] En Vercel DNS de rowiia.com: TXT SPF, TXT DKIM de Resend (`resend._domainkey`), TXT `_dmarc`, registro MX (o redirigir soporte@ a un buzón real).
- [ ] Verificar dominio en el dashboard de Resend.
- [ ] Prueba de fuego: forgot-password a un correo propio → llega al inbox (no spam).

### 1B. Observabilidad (Eduardo + código, ~½ día) — P0-9, P1-27
- [ ] Activar Sentry desde `/hub/admin/settings` (categoría observability; el sistema ya lo soporta) + `NEXT_PUBLIC_SENTRY_DSN` en Vercel para el browser.
- [ ] Instalar PostHog (o Plausible) en `src/app/layout.tsx` con **5 eventos del funnel**: `mirror_started`, `mirror_completed`, `register_completed`, `daily_loop_closed`, `invite_accepted`. (Los 5 KPIs del CEO se derivan de estos + `eco_outcome_recorded` de Fase 5.)
- [ ] Quitar `version`/providers de `/api/health` sin auth (COMP-4).

### 1C. Correcciones críticas de código (~2-3 días)
- [ ] **Timezone** (P0-3): quitar el signo negado en `src/app/(app)/today/page.tsx:46` y `src/app/(app)/profile/avatar/page.tsx:84` + test de `localDateString` con tz=300.
- [ ] **Invitaciones** (P0-1): `api/relationships/invite/route.ts:41` acepta `body.otherName ?? body.name`; rama de error visible en `RelationshipsTab.tsx:61-68`; tests con el payload REAL de la UI.
- [ ] **Pre-SEI preservado** (P0-2): `register/page.tsx` lee `preSeiToken` + `intent` y los manda a `/api/auth/register` (el backend ya tiene `claimPreSeiSession`).
- [ ] **Consentimiento real** (P0-5): sustituir `contributeToRowiverse !== false` por `canContributeToBenchmark(userId)` en `six-seconds/import:256` y `communities/import:345`; dejar de fijar el flag en `register:281`.
- [ ] **Pricing unificado** (P0-6): /pricing y /register leen de `/api/public/plans`; `plans.ts` queda como copy sin precios.
- [ ] **Testimonios ficticios fuera** (P0-7): eliminar TestimonialsSection de `for-you/page.tsx:91-116` + keys en los 4 locales.
- [ ] **Registro sin bombas** (P0-8): eliminar la asignación de plan pago sin pago en `finalize-oauth:69-101` (el registro a 1 paso completo es Fase 2).
- [ ] **E2E mínimo en CI**: Playwright (ya scaffolded en `e2e/`) con los 4 flujos core contra preview. *Esta suite es el seguro de todo el plan — y de la migración a GCP.*

### Criterio de 100% — Fase 1
✅ Los 10 P0 cerrados · ✅ email de prueba entregado · ✅ un evento de analytics visible en el dashboard · ✅ un error forzado visible en Sentry · ✅ tsc 0 + tests verdes + E2E verde · ✅ deploy en prod verificado con curl.

---

# FASE 2 — CERRAR EL LOOP DE AUTOCONOCIMIENTO · MÍRATE (≈1 semana)

**Pregunta:** ¿Quién soy? · **KPI:** personas que completan MÍRATE.

- [ ] **El insight sobrevive y se muestra:** tras registro con `preSeiToken`, el onboarding muestra el resultado del espejo (no repite el test); si ya existe `MiniSeiSnapshot`, el paso rowiTest muestra el WOW con el último resultado (hallazgo Flujo F).
- [ ] **Fin de los falsos éxitos** (P1-7): `res.ok && json.ok` en `onboarding:167` y `mini-sei:53-59`, con mensaje y reintento.
- [ ] **Pre-SEI sin pantalla en blanco** (P1-8): spinner cuando `phase==='wizard' && questions.length===0` + botón Reintentar; prefetch de preguntas en el mount (pesan 860 B).
- [ ] **Registro a 1 paso** (P1-23/P0-8): OAuth o email+password, plan free implícito, selección de plan diferida a /pricing post-activación; aviso de términos con links reales + timestamp de aceptación (P1-16).
- [ ] **El espejo como CTA primario del hero** (P1-21): "Descubre tu espejo emocional" → botón primario; "Comenzar gratis" → secundario. Medir con los eventos de F1 (es el primer experimento instrumentado).
- [ ] **SEO del gancho** (P1-13): metadata propia de /pre-sei + entrada en sitemap + og:url correcto; redirect 308 de rowi.vercel.app (P1-14); página 404 real (P1-28).
- [ ] **Cookie banner no tapa el CTA** en /pre-sei a 380px (captura #3 de la auditoría).
- [ ] **Plan picker / formularios accesibles** donde sobrevivan (P1-12): tarjetas operables por teclado, labels en register/login.

### Criterio de 100% — Fase 2
✅ Un usuario nuevo real: espejo → registro 1 paso → ve SU insight preservado → llega a /today · ✅ funnel `mirror_started→register_completed` medible en analytics · ✅ E2E del flujo A verde.

---

# FASE 3 — CERRAR EL LOOP DIARIO · ELÍGETE + ACCIONA (≈1 semana)

**TODAY permanece intacto. No se divide.** · **KPI operativo:** loops diarios cerrados.

- [ ] **Recompensa visible** (P2-retención): mostrar `res.reward` ("+15 puntos · racha de N días") al guardar la reflexión (`today/page.tsx:90-94`); celebración de evolución inline en DailyPulseCard (no diferida a /profile/avatar).
- [ ] **TODAY no falla en silencio** (P1-9): `post()` con catch + `res.ok` + estado de error con Reintentar; card de práctica nunca vacía con botón activo.
- [ ] **Todos los caminos llevan a TODAY** (P1-5): destino post-auth unificado en `signin:65`, `register/complete:82`, `register/success:228`, `verify-email:137`, fallback de `/start`, y logo del NavBar (`NavBar.tsx:570`). El onboarding termina en /today, no /dashboard (`onboarding:756,718`).
- [ ] **Retorno diario** (P1-19): cron `0 18 * * *` (hora local del usuario si es posible; si no, 18:00 UTC-5 para el mercado inicial) → recordatorio de reflexión a usuarios con DailyLoopEntry sin `reflectionText`, vía NotificationService con tipo nuevo `DAILY_REFLECTION_REMINDER` + email.
- [ ] **Triggers conectados** (P2): `triggerAvatarEvolved` desde `checkAndEvolve` y `triggerStreakMilestone` en hitos 3/7/30.
- [ ] **Racha única** (Flujo B): unificar la contabilidad UserStreak entre `/api/today` y `/api/daily-pulse`; mostrar racha con decay (no rachas zombis).
- [ ] **Menú móvil funcional** (P1-1/2): scroll en el menú logueado + CTA "Comenzar gratis" en el menú móvil público. *(Va aquí porque el loop diario se vive en el teléfono.)*

### Criterio de 100% — Fase 3
✅ Cerrar el día produce recompensa visible e inmediata · ✅ el recordatorio nocturno llega (email real recibido) · ✅ `daily_loop_closed` se registra y la retención D1/D7 es medible · ✅ el loop completo usable a 380px.

---

# FASE 4 — CERRAR EL LOOP RELACIONAL · ENTRÉGATE (≈1-2 semanas)

**Promesa SIA completa.** · **KPI operativo:** invitaciones aceptadas.

- [ ] **Email de invitación real**: implementar el `TODO(email)` de `relationships/invite/route.ts:111` vía `sendContextNotification` (nunca duplicar wiring de Resend); campo email opcional en el form de RelationshipsTab. *(Depende de F1A.)*
- [ ] **El token vincula la relación**: el CTA post-resultado de `/r/[token]` lleva el token al registro del invitado y al aceptar se escribe `dyad.otherUserId` / `acceptedUserId` (hoy nadie lo escribe en este flujo — Flujo D).
- [ ] **BRECHA, no porcentaje** : `/r/[token]/page.tsx:119` muestra la brecha/banda según la regla de `asGap.ts:4-9`, jamás "73%" crudo.
- [ ] **Resultado → ECO**: CTA "Escríbele con ECO" desde el resultado de afinidad, con `?dyadId=`.
- [ ] **dyadId end-to-end en ECO** (P0-4 parte 1): /eco acepta `?dyadId=`, lo incluye en el body de compose (`eco/page.tsx:229-236`) y lo pasa a SendMessageActions (:952) junto con `recipientEmail`.
- [ ] **Registrar "sent"**: los 5 deep-links (Gmail/mailto/Outlook/WhatsApp/copy) hacen POST `/api/eco/send {action:'sent'}` antes del `window.open()`.
- [ ] **Estados vacíos que guían** (P2): ECO y Affinity sin relaciones → EmptyState con "Invita a tu primera persona" (el componente ya existe en /community).
- [ ] **Panel de integraciones honesto**: dejar de hardcodear `connected:false`/"Pronto" cuando `/api/eco/deliver` existe; encender Gmail/WhatsApp si Eduardo pega credenciales (código-listo desde sesión 6).
- [ ] **Owner sin perfil**: si el owner no tiene snapshot, avisar ANTES de que el invitado responda (hoy: responde 8 preguntas para un `heat135=null`).
- [ ] **i18n del tab de relaciones**: las claves `relationships.invite.*` no existen en ningún locale — crearlas en los 4.

### Criterio de 100% — Fase 4
✅ Dos cuentas reales en producción: invitar → email llega → /r/[token] → responde → BRECHA visible para ambos → ECO desde el resultado → relación persistida (`otherUserId` escrito) · ✅ `invite_accepted` instrumentado · ✅ E2E del flujo D verde.

---

# FASE 5 — ACTIVAR EL MOAT (≈2 semanas)

**El moat: Estado → Intervención → Resultado.** · **KPI operativo:** outcomes ECO registrados.

- [ ] **Outcome capturado** (P0-4 parte 2): banner en /eco "¿Funcionó tu último mensaje?" sobre díadas con `sent` sin `feedback` → POST `/api/eco/send {action:'feedback', worked, note}`; arreglar `recordEcoSent` para no descartar en silencio sin thread (`ecoBridge.ts:157`).
- [ ] **Recordatorio de outcome**: cron que pregunta a las 48h del envío (email + in-app).
- [ ] **Aprendizaje → calibración**: pipeline outcome → actualización de pesos versionados (replicar el patrón de oro de Pulse Points: inferir → ground truth → pesos versionados → activar); registro en el Knowledge Layer.
- [ ] **Consent enforcement completo**: `allowAI` gatea las llamadas de IA (hoy no gatea nada — P2 confianza); export del dataset SOLO con consents válidos; microcopy de privacidad contextual en Today/Becoming/ECO ("Privado: solo tú lo ves; tu organización solo agregados N≥5").
- [ ] **Cuota de tokens IA** (P1-22): consumo mensual contra `plan.tokensMonthly` con 402 + CTA de upgrade (cierra la bomba de costos OpenAI y enciende la razón de pagar); `requirePlanDepth` en affinity/eco (P2).
- [ ] **Eval set v0**: 200 casos dorados de "buen mensaje ECO" juzgados por practitioners (trabajo humano de Eduardo + red Six Seconds) — el prerequisito de cualquier IA propia futura.
- [ ] **Privacidad coherente**: redirect `/settings/privacy` → `/hub/account/privacy`; eliminar toggles fantasma (P1-17/18).

### Criterio de 100% — Fase 5
✅ `eco_outcome_recorded` > 0 y creciendo semana a semana · ✅ dataset exportable con consentimiento verificable · ✅ ningún endpoint de IA accesible con `allowAI=false` · ✅ Free ≠ Pro (cuota activa).

---

# FASE 6 — VISIBILIZAR EL IMPACTO · IMPACTA + BECOMING (≈2 semanas)

**BECOMING no es etapa: es la memoria viva que atraviesa todo.** · **KPI:** usuarios que muestran evolución (definición operativa: ≥2 hitos/snapshots en su timeline con ≥30 días entre el primero y el último).

- [ ] **BECOMING memoria viva** (diferido D3 de sesión 5, nunca implementado): timeline 70% memoria / 30% acción — reflexiones reales, hitos de avatar, snapshots, momentos de relación (díadas creadas, primeros ECO), con un "antes/ahora" visible.
- [ ] **Avatar 40/60** (fase D del plan anterior): ponderar eje Becoming (práctica/reflexión/racha) al 60% en `avatar-evolution.ts` — el avatar crece por evidencia de práctica, no por actividad vacía.
- [ ] **i18n de BECOMING**: `SEI_LABEL` (8 competencias hardcodeadas en inglés, `becoming/page.tsx:35-44`) y `stageInfo` a t() en 4 idiomas.
- [ ] **IMPACTA por rol sin vigilancia**: revisar copy del Affinity Monitor ("monitoreadas", HOT/COLD → lenguaje humano, P2 copy); verificar que toda vista org respete N≥5 y lo DIGA en pantalla.
- [ ] **Consultor desbloqueado para su dueño** (P1-26): fix IDOR en los 6 endpoints `/api/consultant/*` (tenantIdsForScope) + entrada de navegación por capability (hoy solo superOnly).
- [ ] **Limpieza de superficie** (P2 nav): borrar/redirigir huérfanas (/me×7, /team, /setup-organization, admin/ui, landing-old local), gatear /studio /ventas /asesor, decidir education-vs-elearning y finance-vs-accounting (decisión de Eduardo, 15 min), quitar dashboards con datos inventados (admin/tasks, tp demos) del sidebar.

### Criterio de 100% — Fase 6
✅ Un usuario con 30 días de uso ve en /becoming quién era, quién es y quién está llegando a ser (con datos reales) · ✅ el avatar refleja práctica · ✅ cero superficies con números inventados visibles · ✅ consultor usable por un consultor real no-superadmin.

---

# FASE 7 — VALIDACIÓN HUMANA (≈2 semanas, solapa con F5-F6)

**Dejar de mirar código. Mirar personas.** Regla: no explicar, no defender, no convencer — observar, escuchar, aprender.

- [ ] **Cohorte 1 (10 personas)**: onboarding manual, sesiones de observación de 30 min (espejo → registro → primer loop → primera invitación). Sin ayudar salvo bloqueo total.
- [ ] **Cohorte 2 (25)**: mitad invitados POR la cohorte 1 (prueba del loop viral de la brecha).
- [ ] **Coaches/practitioners (5)**: Accelerator gratis 12 meses a cambio de casos + calibración consentida; cada uno con ≥1 cliente real dentro.
- [ ] **Checkout real**: una compra Stripe completa ejecutada y verificada (webhook, trial, portal) — lo único que la auditoría no pudo probar con solo-GET.
- [ ] **Los 3 KPIs operativos revisados cada mañana**: loops cerrados · invitaciones aceptadas · outcomes registrados.
- [ ] **Corrección quirúrgica**: solo las 5 fricciones más repetidas por cohorte. Nada más entra a main.

### Criterio de 100% — Fase 7
✅ La cadena completa vista funcionando con humanos reales en producción · ✅ 3 KPIs con dos semanas de tendencia · ✅ lista priorizada de fricciones del mercado (no del auditor) · ✅ decisión informada: ¿el loop diario retiene solo o necesita la díada antes?

---

# FASE 8 — CRECIMIENTO (30 días)

**Escalar únicamente lo que ya demostró funcionar en F7.**

- Canal 1 — **Six Seconds Practitioners**: formalizar el acuerdo de plataforma (exclusividad de calibración ↔ distribución en la red); el Pre-SEI como herramienta del practitioner.
- Canal 2 — **Coaches**: landing pública `/for-coaches` (P2 — el primer mercado declarado hoy no tiene página) + workspace + revenue share.
- Canal 3 — **Community**: el loop viral de la brecha medido y optimizado (cada resultado invita una relación).
- Canal 4 — **Organizations**: pilotos vía consultores (informe Accelerator → dashboard N≥5 → asientos TP Hub).
- Canal 5 — **Vital Signs**: el instrumento como puerta enterprise.
- **Lanzamiento de stores** (ver T3): submit iOS + Android.

### Criterio de 100% — Fase 8
✅ Cada canal con su primera cohorte y CAC/conversión medidos · ✅ apps publicadas · ✅ decisión de inversión del trimestre siguiente basada en datos de canal.

---
---

# TRACKS TRANSVERSALES

## T1 — i18n TOTAL: "todo habla 4 idiomas, en todo"

**Meta:** cero strings fuera de t(), los 4 locales completos y verificados EN TODO — UI, emails, PPTX, errores de API, SEO. (Idiomas nuevos: congelados hasta F8+; primero se completan ES/EN/PT/IT.)

**Mecánica:** cada fase migra las pantallas que toca (F2: register/pre-sei · F3: today/DailyPulseCard · F4: community/RelationshipsTab/ECO · F5: privacidad/consents · F6: becoming/affinity/consultor) + un **barrido final en F6**. Backlog completo de la auditoría:

- [ ] Diccionarios locales eliminados: `/community` (123 strings en inglés en pt/it — P1-10), ECO (es/en), `/rowi` GUIDE (es/en), NavBar (265 líneas), DailyPulseCard (ternarios isEN).
- [ ] Helpers binarios → 4 idiomas: `plans.ts` formatPrice/getSupportLevelName/getTokensText (P1-11).
- [ ] 46 ternarios `lang === "es"` erradicados (28 archivos); 29 claves t() muertas creadas o con fallback.
- [ ] "Sei Secondi" → "Six Seconds" en it.json (3 claves); typo "Tu evolucion"; hero EN = "Be Who You Want To Be".
- [ ] `<html lang>` dinámico (`document.documentElement.lang = next` en I18nProvider + cookie para SSR).
- [ ] Emails transaccionales i18n (la cadena preferredLang→language→es ya existe — verificar los 5 templates) y PPTX del consultor con labels por t().
- [ ] Errores de API: devolver códigos/claves, traducir en cliente (no "Resumen IA restringido…" hardcodeado).
- [ ] **SEO multi-idioma** (decisión de roadmap, activar en F8): hreflang + `alternates.languages`, empezando por home, /pre-sei y /pricing.
- [ ] **Gates de CI (se instalan en F1 y vigilan todo el plan):** script de paridad de claves 4 locales (ya se verificó 7038/7038 — mantenerlo) + lint que bloquea `lang === "es"` y diccionarios locales nuevos + grep de strings JSX hardcodeados en pantallas core.
- [ ] **Performance i18n** (P1-15): dynamic import del locale activo — mata el chunk de 401 KB y hace viable el bundle móvil de T3.

**Definición de "listo para traducciones en TODO":** un idioma nuevo futuro (zh/fr/de) se agrega creando UN archivo de locale + columnas de email, sin tocar ningún componente.

## T2 — INFRAESTRUCTURA: NOS QUEDAMOS EN VERCEL ✅ (decisión Eduardo, 2026-06-10)

**La migración a Google Cloud queda DESCARTADA.** Vercel + Neon + Resend siguen siendo el stack: el auto-deploy funciona, los 13 crons funcionan, y el riesgo de regresión silenciosa de una migración en pleno cierre de loops no compra nada que el lanzamiento necesite.

Queda solo higiene de portabilidad opcional y barata (por si la decisión cambia en 2027): mantener los crons como endpoints HTTP con `CRON_SECRET` (ya es así) y no acoplar código nuevo a APIs exclusivas de Vercel sin necesidad. Nada más. El único pendiente de infraestructura real es el ya conocido: mover los 600MB de `data/seed` a storage firmado (S3/R2) cuando Eduardo pegue credenciales.

## T3 — APPS iOS Y ANDROID

**Camino: PWA completa → Capacitor (mismo código) → stores.** No rewrite nativo (violaría FINISH y duplicaría la superficie que acabamos de reducir).

**T3-a (en F3, sinergia directa con retención):**
- [ ] **Service worker** (`public/sw.js`) + registro + permiso + POST de suscripción VAPID — es el MISMO trabajo que desbloquea las push del loop diario (P2 retención: el servidor ya está listo, falta el cliente).
- [ ] PWA instalable completa: el `site.webmanifest` ya está en prod; añadir iconos maskable, splash, `display: standalone`.

**T3-b (en F6-F7, ~1 semana):**
- [ ] Shell **Capacitor** (iOS + Android) envolviendo la PWA; plugins: push nativo (FCM + APNs), deep links (`/r/[token]` y `/today` abren la app), share sheet (ECO → WhatsApp nativo).
- [ ] Cuentas: Apple Developer ($99/año) + Google Play ($25) — Eduardo.
- [ ] Ajustes de chrome móvil: safe areas, gesto back Android, sin doble navbar (resuelto en F2/F3).

**T3-c (en F8):**
- [ ] TestFlight + internal track → corrección de review issues → **submit a ambas stores**.
- [ ] Nota de revisión Apple: apps WebView pasan review cuando aportan valor nativo — push, deep links y share sheet son exactamente eso. El loop diario con recordatorio push es el argumento.

---

# CALENDARIO CONSOLIDADO (≈12 semanas a stores)

| Semana | Fases | Tracks |
|---|---|---|
| 1 | **F1** Estabilizar core | T1 gates CI |
| 2 | **F2** Loop MÍRATE | T1 (register/pre-sei) |
| 3 | **F3** Loop diario | T1 (today) · **T3-a service worker + push** |
| 4-5 | **F4** Loop relacional | T1 (community/ECO) |
| 6-7 | **F5** Moat | T1 (privacidad) |
| 8-9 | **F6** Impacto/BECOMING + **F7** Validación (solapa) | T1 barrido final · **T3-b Capacitor** |
| 10 | **F7** Validación cierra | T3-b deep links/push nativo |
| 11-14 | **F8** Crecimiento (30 días) | **T3-c stores** · acuerdo Six Seconds |

*(F9/migración GCP: descartada — nos quedamos en Vercel.)*

---

# KPIs

**Los 5 del CEO (transformación, semanal):** personas que se miraron · se eligieron · accionaron · conectaron · impactaron.
**Los 3 operativos (diario, desde F1):** loops diarios cerrados · invitaciones aceptadas · outcomes ECO registrados.
**Instrumentación:** eventos de F1B; dashboard simple en PostHog. Sin estos números, ninguna fase se declara cerrada.

# LO QUE SIGUE CONGELADO HASTA F8
EmoPower Schools · Education · ERP/accounting-finance nuevos · módulos nuevos · dashboards nuevos · idiomas adicionales · integraciones nuevas (las 3 código-listo solo se encienden) · rediseños de navegación (los 5 verbos viven en copy/KPIs/journeys, no en tabs nuevos).

# DECISIÓN
**FINISH.** Cerrar loops → capturar outcomes → activar el moat → validar con humanos → escalar lo que demuestre ayudar a las personas a cumplir la promesa central: **SÉ QUIEN QUIERES SER.**
