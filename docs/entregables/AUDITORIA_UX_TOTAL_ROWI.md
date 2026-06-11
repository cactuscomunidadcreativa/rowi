# AUDITORÍA UX / PRODUCTO / DISEÑO / TÉCNICA TOTAL DE ROWI

**Fecha:** 2026-06-10 · **Commit auditado:** `985048c` (main, = deploy en prod según /api/health) · **Producción:** https://www.rowiia.com
**Método:** orquestación multi-agente (68 agentes: 3 lectores de documentos base, 13 auditores por dimensión, 6 trazadores de flujos end-to-end, 2 mapeadores de rutas, 30+ verificadores adversariales, 1 crítico de completitud) + verificación manual en browser local a 380px.
**Regla de evidencia:** ningún hallazgo entró sin reproducirse. Los P0 pasaron panel adversarial de 2 verificadores independientes; los P1, un verificador escéptico cada uno; los P2/P3, filtro de evidencia dura (archivo:línea / URL / comando). **4 hallazgos fueron refutados y excluidos** (se listan en §8.1 por transparencia).
**Base técnica:** `tsc --noEmit` exit 0 · 518/518 tests en 53 suites pasando (2.83s).

---

## 1. VEREDICTO EJECUTIVO

Rowi tiene la tesis correcta y el esqueleto correcto, pero **las costuras del producto están rotas exactamente donde vive la tesis**. La capa visible (landing, pre-SEI, navegación de 4, loop diario, consultor, Stripe) existe, compila, pasa 518 tests y responde 200 en producción. Pero la cadena que Rowi vende como su razón de ser — diagnóstico → registro → invitación → afinidad → ECO → outcome — **pierde el dato en cada handoff**: el resultado del Pre-SEI no sobrevive al registro, la invitación de relación devuelve 400 silencioso en producción (los tests están verdes porque prueban el payload equivocado), ECO jamás registra un outcome (el "foso de datos" tiene 0 filas), y el cierre nocturno del loop diario cae en el día equivocado por un signo negado en el timezone. A eso se suman tres P0 de confianza/negocio: testimonios inventados publicados junto a una promesa de "nunca inventamos testimonios", consentimiento de datos que se recoge pero no se aplica, y precios anunciados distintos de los que Stripe cobra. Y dos P0 operativos que el crítico de completitud descubrió: **cero analítica** (el lanzamiento no puede medir ni una conversión) y **DNS de email vacío** (sin SPF/DKIM/MX: las invitaciones, el reset de password y el follow-up del Pre-SEI probablemente no se entregan, y soporte@rowiia.com es un agujero negro). Nada de esto es un rediseño: son ~10 arreglos quirúrgicos de horas, no semanas. La decisión está al final: **REPARAR CORE ANTES DE LANZAR** (de empujar el producto al mercado).

---

## 2. SCORECARD

| Dimensión | Score (1-10) | Motivo |
|---|---|---|
| Navegación | 5 | La espina TODAY·BECOMING·GUIDE existe en desktop (NavBar.tsx:347-349), pero el grafo de entrada la contradice: 5 destinos post-auth distintos y ninguno es /today; /hub es un segundo home; 3 páginas de login; 10+ huérfanas desplegadas. |
| UI visual | 6 | Violeta #7c3aed es el primario real del código nuevo (46 usos, tailwind/globals), pero la tipografía de marca jamás se carga (prod sirve 0 @font-face), los 5 emails siguen azul pre-rebrand, dark mode revierte el primario a #5bc0eb y conviven 427 clases blue-* y 3 sistemas de botones. |
| Flujos críticos | 3 | De 6 flujos: 1 ROTO en producción (D, invitación/afinidad — el hook de la tesis SIA) y 5 PARCIALES con fugas de dato en los handoffs. Ninguno funciona completo de punta a punta. |
| Copy y filosofía | 6 | El núcleo está bien: hero "Sé quien quieres ser.", niveles no puntajes, Becoming→"Mi evolución", cifras atribuidas a Six Seconds. Lo rompen: testimonios inventados (P0), la marca vendida como "IA" en title/footer/card (contra el Brand Book), 128 anglicismos y lenguaje de vigilancia en Affinity Monitor. |
| i18n | 5 | Paridad de claves perfecta (7038/7038 en 4 locales) pero PT/IT son ciudadanos de segunda: /community e ECO con diccionarios locales en inglés/es-en, 46 ternarios binarios, 29 claves t() inexistentes, html lang fijo. |
| Mobile | 4 | Menú móvil logueado sin scroll dentro de header fixed: con 16-26 ítems, la mitad inferior de la nav core es inaccesible. Sin CTA de registro en nav pública <640px. Doble chrome (2 headers + 2 main) en todas las públicas. |
| Estados no felices | 4 | Estados vacíos bien diseñados (BECOMING, /community guían), pero los FALLOS son sistemáticamente mudos: mini-SEI y loop diario muestran éxito con un 500 detrás; errores de red disfrazados de "no tienes datos". |
| Accesibilidad | 4 | Base estructural decente (1 h1, alt, aria-pressed en wizards), pero la selección de plan del registro es inoperable por teclado (bloqueo WCAG 2.1.1 en el funnel), 1 solo aria-live en todo el repo, contraste 2.16-2.5:1 en errores y texto débil. |
| Performance | 5 | Servidor sano (TTFB 0.31s, ISR, next/image) pero 745 KB gzip de JS en landing, dominados por un chunk de 401 KB con los 4 diccionarios i18n completos; shell autenticado hidratado en páginas públicas; 0 loading.tsx en 306 páginas. |
| SEO | 4 | Sitemap/robots/JSON-LD existen, pero /pre-sei (el gancho del lanzamiento) no tiene SEO propio, rowi.vercel.app sirve el sitio completo indexable, el sitemap apunta a dos 404 y toda URL inexistente es un soft-404 (307 a /signin). |
| Confianza | 4 | Capa legal sólida y viva (4 páginas legales 200, consent granular, GDPR Art.17 self-service), pero el consentimiento NO se aplica (P0), hay toggles de privacidad fantasma que confirman "Guardado" sin guardar, y soporte@rowiia.com no puede recibir correo. |
| Retención | 4 | El loop in-product existe completo y desplegado (DailyLoopEntry, racha, puntos, avatar, timeline) — verificación positiva. Pero cero canal de retorno: ningún recordatorio diario, push muerto en cliente, triggers de notificación nunca llamados, y la recompensa calculada se descarta en la UI. |
| Conversión | 4 | Pre-SEI cumple el spec del Espejo (insight antes de cuenta) pero está relegado a botón secundario; el CTA primario lleva a un registro de 5 pasos que arranca con selección de plan; el resultado del Pre-SEI se pierde al registrarse; cero analítica para medirlo. |
| Monetización | 3 | Stripe cableado de punta a punta (checkout, trial, webhook, portal) pero los diferenciadores vendidos (tokens IA, profundidad Affinity/ECO) no se aplican en ningún endpoint: **Free equivale funcionalmente a Pro**. Doble fuente de verdad de precios (plans.ts vs DB). |

---

## 3. MAPA DE RUTAS

306 páginas + 498 endpoints API. Tabla condensada (grupos; veredicto verificado por grep de inbound links + curl en prod):

| Ruta | Existe | Alcanzable desde UI | Estado | Comentario |
|---|---|---|---|---|
| `/` + marketing (how-it-works, pricing, for-you, for-organizations, about, contact, stories, resources, product/*, legal/[doc]) | sí | sí | ok | 200 en prod, enlazadas desde PublicNavbar/Footer. **Pero `/product` (índice) da 404 y /resources enlaza a él.** |
| `/pre-sei` | sí | sí | ok | Gancho del EQ Day, 200 en prod. Sin SEO propio (P1) y como botón secundario del hero (P1). |
| `/demo` + 4 sub-demos | sí | sí | ok | Coherente con web de conversión. |
| `/r/[token]` | sí | sí (por email/link) | ok | Deep link del invitado. **Indexable (sin noindex/robots disallow)** — P3. |
| `/register`, `/register/complete`, `/register/success` | sí | sí | ok* | 200 en prod. *Wizard roto por dentro: pasos 2-4 inalcanzables; OAuth sale a `/hub`, credenciales a `/onboarding` — dos experiencias (regresión D1 persiste en camino OAuth). |
| `/signin` | sí | sí | ok | Login canónico efectivo (todos los redirects llegan aquí). |
| `/login` | sí | sí | **duplicada** | Segundo login completo con tráfico real (register fallback, RowiCoach:654). Unificar como redirect a /signin. |
| `/hub/login` | sí | **no** | **huérfana/rota** | Es la página signIn configurada en NextAuth (config.ts:37) y destino de TODOS los errores SSO Six Seconds, pero el middleware la gatea → 307 a /signin perdiendo `?error=sso_*` (curl verificado). El usuario nunca ve por qué falló el SSO. |
| `/start` | sí | sí (post-login) | **contradice arquitectura** | Router post-login que reparte a /hub/admin/inventory → /org → /workspace → /dashboard. **Nunca a /today.** |
| `/today`, `/becoming`, `/rowi` | sí | sí (nav primary) | ok | La nav de 4 está implementada en desktop (NavBar.tsx:347-349, GUIDE renombrado). Gateadas 307 en prod (correcto). |
| `/dashboard` | sí | sí | **contradice arquitectura** | Correctamente en dropdown "Más" como SEE, **pero el logo del NavBar (línea 570) y el fallback de /start apuntan aquí**: el home efectivo es el dashboard, no TODAY. |
| `/hub` (home) + universo /hub/{eq,learn,settings,achievements} | sí | sí | **contradice arquitectura** | Segundo home paralelo: el registro OAuth (register/complete:82), success:228 y verify-email:137 aterrizan aquí. /hub/learn duplica /learning; /hub/settings duplica /settings. Tres "homes" en prod. |
| `/feed`, `/post/new`, `/relationships`, `/reports` | sí | sí | ok (legacy resuelto) | Redirects limpios. /reports en nav lleva a hub de ADMIN para managers no-admin (quitar de nav). |
| `/affinity`, `/eco`, `/community`, `/social/*`, `/weekflow/*`, `/learning/*`, `/progress`, `/sei`, `/mini-sei` | sí | sí | ok | Mapean a AFFINITY/ECO/CONNECT/PRACTICE/SEE coherentemente. |
| `/me` + 6 subrutas | sí | **no** | **huérfana** | Familia entera muerta: solo enlazada desde UserActions.tsx, que nadie importa (grep = 0). Duplican /profile/home, /settings/profile, /hub/achievements. |
| `/team` | sí | **no** | **huérfana** | Única referencia: página admin routes-map. El item "team" del NavBar apunta a /workspace. |
| `/setup-organization` | sí | **no** | **huérfana** | 0 inbound links. |
| `/(app)/admin/ui` | sí | **no** | **legacy** | Editor UIConfig sin links, sin gate de rol en página, edita botones hacia el /feed muerto. Borrar. |
| `/studio/[[...index]]` | sí | no | **ocultar pre-launch** | Sanity Studio accesible a CUALQUIER usuario logueado (solo gate useSession). Mover bajo admin. |
| `/ventas`, `/asesor` | sí | sí (por rol en nav) | ok* | Nav los gatea por rol, **pero ni la página ni /api/rowi verifican rol** (P2): cualquier autenticado que tipee la URL usa los agentes internos de venta. |
| `/landing-old` | sí (solo local) | no | legacy | 871 líneas sin trackear en git. Borrar del working tree. |
| `/workspace/*` (24 rutas), `/org`, `/hr`, `/finance`, `/research/*` | sí | sí (por rol) | ok | Capa por rol fuera de las 4, como declara la arquitectura. /org y /benchmark visibles a roles:* (matiz P3). |
| `/hub/admin/*` (156 rutas) | sí | sí (sidebar 150/156) | ok* | El "admin tidy" se sostiene; única huérfana real: `/hub/admin/users/imports`. *Pero: sección **Educación entera fetchea /api/admin/education/\* que NO EXISTE** (siempre vacía, duplica eLearning); elearning/courses es DEMO hardcodeado; finance vs accounting leen los MISMOS modelos prisma (fusión sin decidir); gamification/coupons (mock) duplica sales/coupons (real); /hub/admin/tasks muestra métricas 100% inventadas (DEMO_STATS, cero fetches). |
| `/p/[slug]` | sí | desconocido | ok | Páginas CMS; solo por URL directa. |

---

## 4. FLUJOS CRÍTICOS

| Flujo | Funciona | Dónde se rompe | Impacto | Fix |
|---|---|---|---|---|
| **A — Conversión pública** (landing→pre-sei→registro→onboarding→mini-SEI→/today) | **PARCIAL** | (1) `preSeiToken` se construye en PreSeiCTA.tsx:18-20 pero register/page.tsx jamás lo lee → **100% de quienes hacen el Pre-SEI y se registran pierden su diagnóstico**; (2) wizard de registro: el paso 1 crea la cuenta y sale → pasos 2-4 inalcanzables, checkout nunca corre; (3) finalize-oauth asigna plan de pago SIN pago; (4) onboarding termina en /dashboard, nunca en /today; (5) fallo del mini-SEI tratado como éxito. | El WOW que justifica registrarse no sobrevive al registro; el dinero del wizard no se cobra. | Leer `preSeiToken`+`intent` en register y pasarlos a /api/auth/register (claimPreSeiSession ya existe); unificar salida a /onboarding→/today. |
| **B — Loop diario** (/today→intención→práctica→reflexión→avatar→Becoming) | **PARCIAL** | (1) **today/page.tsx:46 envía el timezone NEGADO** (`-getTimezoneOffset()`) contra el contrato de timezone.ts:4-10 → el cierre nocturno cae en el día equivocado para medio planeta (Ecuador 19:00 = día siguiente); (2) la recompensa que el server devuelve (puntos+racha, route.ts:344) **se descarta en la UI** (solo lee evolution); (3) doble contabilidad de racha entre /api/today y /api/daily-pulse sobre la misma fila UserStreak. | El gatillo de TODA la recompensa (cerrar el día) está roto; cerrar TODAY produce recompensa parcial (solo si evoluciona el avatar). | Quitar el signo negado (1 carácter); mostrar `res.reward` ("+15 pts · racha N"); unificar racha. |
| **C — ECO** (compose→sugerencia→enviar→feedback→outcome) | **PARCIAL** | (1) la UI nunca envía `dyadId` (eco/page.tsx:229-241) aunque compose lo soporta → el puente Affinity→ECO no se usa; (2) **/api/eco/send (outcome/feedback) tiene CERO callers** — recordEcoFeedback es huérfano; (3) los 5 deep-links de envío (Gmail/mailto/WhatsApp/copy) no registran nada; (4) panel integraciones hardcodea connected:false/"Pronto" cuando /api/eco/deliver existe. | El círculo que justifica ECO según el Documento Total — outcome→calibrar brecha→foso de datos — registra exactamente **0 datos**. | Cablear dyadId end-to-end; registrar "sent" en los deep-links; banner "¿funcionó tu último mensaje?" → POST /api/eco/send. |
| **D — Invitación y afinidad** (invitar→/r/[token]→datos→heat135→resultado→ECO→relación) | **ROTO** | **Paso 1, en producción:** RelationshipsTab.tsx:59 envía `{otherName, relationType}`; la API (relationships/invite/route.ts:41-52) lee `body.name`/`body.email` → **400 siempre**, y la UI traga el error (sin rama else). Los tests están verdes porque usan el payload de la API, no el de la UI. Aguas abajo (verificado): heat135 SÍ se calcula (si el owner tiene perfil), pero /r/[token] muestra "73%" crudo (viola la regla BRECHA de asGap.ts:4-9), el CTA post-resultado pierde el token (la relación nunca se vincula: dyad.otherUserId no se escribe en este flujo) y no se envía ningún email (TODO en route.ts:111). | **El hook de adquisición de la tesis SIA no funciona para ningún usuario real.** Todo lo demás de la cadena, que sorprendentemente sí existe, es inalcanzable. | Aceptar `body.otherName ?? body.name` (1 línea) + mostrar error en UI + arreglar tests + propagar token al registro del invitado. |
| **E — Consultor** (crear informe→visualizar→PPTX→compartir) | **PARCIAL** | El núcleo FUNCIONA (informe stateless CSV→visualización→PPTX real con pptxgenjs, 2 decks, honestidad de datos con vsSource/n/smallN). Se rompe en: (1) **IDOR cross-tenant en los 6 endpoints /api/consultant/\*/[benchmarkId]** (solo requireCapability, sin verificar pertenencia del benchmark); (2) "compartir" no existe (termina en descarga local); (3) sin entrada de navegación para el consultor no-superadmin; (4) sin `ROWI_VS_PULSE_MAP` el VS real subido se descarta y se sustituye por inferencia en silencio. | Un consultor de un tenant puede leer benchmarks de otro; el flujo de venta termina en un archivo local. | Validar pertenencia con tenantIdsForScope (helper ya existe); añadir item de Sidebar por capability. |
| **F — Usuario nuevo sin datos** (registro→onboarding abandonado→Today/Becoming/Guide vacíos) | **PARCIAL** | No crashea en ningún punto (optional chaining consistente, empty states escritos, avatar y entrada diaria auto-creados server-side) — verificación positiva. Fugas: (1) "Omitir" sale a /dashboard SIN persistir consents (y ConsentGate es fail-open en error); (2) el progreso del onboarding vive solo en useState → abandonar = empezar de cero, y `?step=payment` no se lee (el paso de pago prometido no existe); (3) usuario OAuth se salta el onboarding entero vía /hub. | Usuarios "activados" sin consentimiento registrado; el onboarding no es reanudable. | Persistir paso (query param o User.onboardingStep); guardar consents en Omitir; OAuth→/onboarding. |

---

## 5. HALLAZGOS P0 (10)

Todos confirmados por panel adversarial de 2 verificadores (o reproducidos con comando en vivo).

### P0-1 · La cadena de invitación (Flujo D) está rota en producción: payload de UI ≠ contrato de API
- **Evidencia:** RelationshipsTab.tsx:56-60 envía `JSON.stringify({ otherName: name.trim(), relationType })`; la API lee `body.name` y `body.email` (`const inviteeName = (body.name as string)?.trim() || null`, route.ts:41) y valida → **400 siempre** (47-52). La UI solo actúa `if (json.ok && json.inviteUrl)` (61-68): sin rama de error, el spinner se detiene y no pasa nada. Los tests (relationship-invite.test.ts:56,72,95,101) usan `{ name: 'Ana' }` — el payload de la API, no el de la UI: suite verde con flujo muerto.
- **Ruta:** /community?tab=relationships → "Invitar a alguien"
- **Archivo:línea:** `src/components/community/RelationshipsTab.tsx:59` vs `src/app/api/relationships/invite/route.ts:41-52`
- **Impacto:** el hook de adquisición de la tesis SIA ("invito a alguien a ver NUESTRA afinidad") no funciona para ningún usuario real; toda la cadena aguas abajo (que sí existe) es inalcanzable.
- **Fix:** en route.ts:41 aceptar `body.otherName ?? body.name` + rama de error en la UI + actualizar tests al payload real.

### P0-2 · El diagnóstico del Pre-SEI se pierde al registrarse: el WOW no sobrevive al funnel
- **Evidencia:** PreSeiCTA.tsx:18-20 construye `/register?preSeiToken=<token>`; `grep preSeiToken src/app/(public)/register/page.tsx` → **0 resultados** (solo lee ref/coupon/plan/utm/source). El backend SÍ tiene `claimPreSeiSession` esperando el token. El parámetro `intent=invite` (el hook relacional del CTA "Invitar a alguien") también se pierde.
- **Ruta:** /pre-sei → resultado → "Crear cuenta"
- **Archivo:línea:** `src/components/pre-sei/PreSeiCTA.tsx:18-20` vs `src/app/(public)/register/page.tsx:244-259`
- **Impacto:** el 100% de los usuarios que hacen el Pre-SEI y crean cuenta pierden su diagnóstico — el momento WOW que justifica registrarse desaparece; el onboarding les pide repetir desde cero.
- **Fix:** leer `searchParams.get('preSeiToken')` e `intent` en register e incluirlos en el body de /api/auth/register.

### P0-3 · Timezone negado: el cierre nocturno del loop diario cae en el día equivocado
- **Evidencia:** today/page.tsx:46 envía `tz = -new Date().getTimezoneOffset()`; el contrato del servidor (timezone.ts:4-10, leído) espera el offset SIN negar — `localDateString(now, tz)` calcula el día local con el signo invertido. Para un usuario en Ecuador (UTC-5) a las 19:00, la reflexión nocturna se guarda en el día siguiente. Mismo bug en profile/avatar/page.tsx:84. DailyPulseCard lo hace bien (prueba de que es un descuido, no una convención).
- **Ruta:** /today (reflexión de noche)
- **Archivo:línea:** `src/app/(app)/today/page.tsx:46` vs `src/lib/daily-pulse/timezone.ts:4-10`
- **Impacto:** el momento de cierre del día — el gatillo de TODA la recompensa (puntos, racha, evolución del avatar) — está roto para cualquier usuario al oeste de UTC, es decir, todo el mercado inicial (Ecuador/LatAm).
- **Fix:** quitar el signo negado (1 carácter, 2 archivos) + test de localDateString con tz=300.

### P0-4 · ECO jamás registra un outcome: el "foso de datos" tiene 0 filas
- **Evidencia:** (1) el body de compose desde la UI es `{goal, channel, memberIds, freeTargets, refine, ask}` — sin dyadId (eco/page.tsx:229-241), aunque compose/route.ts:315 sí soporta `buildDyadBridge`; (2) `grep -rn 'eco/send' src/` excluyendo la API → 0 callers; `recordEcoFeedback`: único caller es el endpoint huérfano; (3) los 5 caminos de envío de SendMessageActions.tsx:141-165 solo hacen `window.open()`/clipboard sin registrar nada. El propio docstring de /api/eco/send:16-19 admite el problema.
- **Ruta:** /eco → componer → enviar
- **Archivo:línea:** `src/app/(app)/eco/page.tsx:229-241` · `src/app/api/eco/send/route.ts:57` · `src/components/eco/SendMessageActions.tsx:141-165`
- **Impacto:** el círculo outcome→calibrar brecha→ground truth — el moat declarado del Knowledge Layer — captura exactamente cero datos desde el día 1.
- **Fix:** cablear dyadId end-to-end; registrar action="sent" en los deep-links; banner de feedback "¿funcionó?" en /eco.

### P0-5 · El consentimiento se recoge pero NO se aplica: la contribución de datos EQ usa un flag legacy que nace en true
- **Evidencia:** `prisma/schema.prisma:27` `contributeToRowiverse Boolean @default(true)`; register/route.ts:281 lo fija `true` al crear cuenta; six-seconds/import/route.ts:256 y communities/import/route.ts:345 gatean con `if (user.contributeToRowiverse !== false)`; `canContributeToBenchmark()` (checkConsent.ts) **no es invocado por ningún flujo productivo** (grep: solo tests). El endpoint POST /api/account/consent escribe solo en UserConsent y nunca sincroniza el flag. Mientras, https://www.rowiia.com/legal/research (200) promete que el uso para investigación "es opcional y requiere tu consentimiento".
- **Ruta:** onboarding (consents) vs imports de datos EQ
- **Archivo:línea:** `src/app/api/admin/six-seconds/import/route.ts:256` · `src/app/api/auth/register/route.ts:281` · `src/lib/privacy/checkConsent.ts:42`
- **Impacto:** un usuario que rechaza "Contribuir al benchmark" sigue aportando sus scores SEI completos. La promesa publicada en /legal/research es falsa en la práctica — el riesgo de confianza más caro para un producto cuya tesis es custodiar datos emocionales.
- **Fix:** sustituir los checks `contributeToRowiverse !== false` por `canContributeToBenchmark(userId)` y dejar de fijar el flag en el registro.

### P0-6 · Doble fuente de verdad de planes: /pricing anuncia precios/features distintos a los que Stripe cobra
- **Evidencia:** plans.ts:645-648 define Business `$10/usuario, mín. 20` y plus `seiIncluded: false`; pero `curl https://www.rowiia.com/api/public/plans` devuelve Business `"priceUsd":99` (flat) y ROWI+ `"seiIncluded":true`. Stripe cobra desde la DB (sync-products/route.ts:94-96); /pricing y /register renderizan desde plans.ts estático.
- **Ruta:** /pricing y /register (paso plan)
- **Archivo:línea:** `src/domains/plans/lib/plans.ts:645` · `src/app/(public)/pricing/page.tsx:88` · prod `/api/public/plans`
- **Impacto:** precio anunciado ≠ precio cobrado en la web pública (un B2B espera $200/mes y Stripe le cobra $99; un ROWI+ ve "SEI no incluido" cuando el runtime se lo otorga). Riesgo legal y de confianza en plena venta.
- **Fix:** /pricing y /register leen de /api/public/plans (DB = única fuente); plans.ts queda como copy/features sin precios.

### P0-7 · Testimonios inventados con nombre y 5 estrellas en /for-you — junto a la promesa pública de no inventarlos
- **Evidencia:** for-you/page.tsx:91-116 hardcodea "María García" (Diseñadora), "Carlos López" (Desarrollador), "Ana Martínez" (Emprendedora), todos rating 5. es.json:4125: "Los matches emocionales me conectaron con personas increíbles…" (además lenguaje de app de citas). El verificador confirmó el detalle no obvio: son fallback del CMS, **pero el CMS de prod devuelve secciones vacías para 'for-you', así que el fallback ES lo que se publica**. Contradice es.json:6233 ("Nuestro compromiso: nunca inventamos cifras ni testimonios") servido en /stories.
- **Ruta:** https://www.rowiia.com/for-you (200)
- **Archivo:línea:** `src/app/(public)/for-you/page.tsx:91-116` · `es.json:4121-4127`
- **Impacto:** viola la regla dura del proyecto ("no fake social proof") y desactiva la promesa de honestidad del mismo sitio. Si Six Seconds o un prospecto lo nota, daño de credibilidad pre-lanzamiento.
- **Fix:** eliminar TestimonialsSection de /for-you (o patrón honesto de /stories) y borrar las keys en los 4 locales.

### P0-8 · El wizard de registro está roto por dentro: pasos 2-4 inalcanzables, checkout nunca corre, plan de pago asignado sin pago
- **Evidencia:** el botón del paso 1 ("Crear cuenta", register/page.tsx:783) crea la cuenta y hace `router.push('/onboarding')` (376) — los pasos profile/sei/confirm del wizard son inalcanzables; el OAuth también sale en el paso 1. finalize-oauth/route.ts:69-101 asigna `planId` del plan PAGO al usuario y marca `onboardingStatus=PAYMENT_PENDING` **antes de cualquier cobro**, y el paso 'payment' al que redirige register/complete:80 **no existe** (onboarding no lee searchParams). Además el cliente envía `planSlug` y la API lee `planId` (mismatch silencioso).
- **Ruta:** /register (todo el wizard)
- **Archivo:línea:** `src/app/(public)/register/page.tsx:361-377,783` · `src/app/api/account/finalize-oauth/route.ts:69-101` · `src/app/(public)/register/complete/page.tsx:79-83`
- **Impacto:** nadie puede pagar durante el registro; usuarios OAuth quedan con plan pago asignado y sin cobrar; el wizard de 5 pasos que añade fricción ni siquiera ejecuta su propósito.
- **Fix:** registro de 1 paso con plan free implícito; pago diferido a /pricing post-activación (y eliminar la asignación de plan sin pago en finalize-oauth).

### P0-9 · Cero analítica en todo el producto: el lanzamiento no puede medir ni una conversión
- **Evidencia:** `curl -s https://www.rowiia.com/ | grep -ciE 'analytics|gtag|posthog|plausible'` → 0; grep en layout.tsx y package.json → vacío; `find src -iname '*analytics*'` → 0 archivos. Ironía: el CSP de prod permite googletagmanager y google-analytics — la intención existió, el cableado nunca.
- **Ruta:** todo el sitio
- **Archivo:línea:** `src/app/layout.tsx` (ausencia) · `package.json` (ausencia)
- **Impacto:** no hay forma de responder "¿cuántos visitaron /pre-sei? ¿dónde abandonan el registro?". Toda decisión de optimización post-lanzamiento será a ciegas.
- **Fix:** instalar un analytics privacy-first (Plausible/PostHog EU o Vercel Analytics) en layout.tsx con eventos en los 5 pasos del funnel.

### P0-10 · DNS de email vacío: rowiia.com no tiene SPF, ni DKIM, ni DMARC, ni MX
- **Evidencia:** `dig @8.8.8.8 +short TXT rowiia.com` → vacío; `TXT _dmarc.rowiia.com` → vacío; `TXT resend._domainkey.rowiia.com` → vacío; `MX rowiia.com` → **vacío**. La zona existe (A records en Vercel DNS). Remitente default en código: `noreply@rowiia.com` (4 helpers de email). /api/health dice resend "configured:true" pero solo comprueba que exista API key. *(Consecuencia exacta = parcialmente INFERENCIA: depende de RESEND_FROM_EMAIL en Vercel, no verificable desde fuera.)*
- **Ruta:** capa completa de email transaccional
- **Archivo:línea:** DNS público + `src/lib/email/sendInviteEmail.ts:258` et al.
- **Impacto:** sin DKIM verificado, Resend rechaza o sandboxea los envíos desde @rowiia.com → mueren en silencio: invitación de la cadena SIA, reset de password, follow-up del Pre-SEI (el gancho de retención del EQ Day) y weekly pulse. Sin MX, **soporte@rowiia.com (citado en páginas legales y en el flujo de borrado) no puede recibir correo: es un agujero negro.**
- **Fix:** añadir en Vercel DNS los TXT de SPF+DKIM de Resend y un MX (o cambiar soporte@ a un buzón real); probar con forgot-password a un correo propio (2 minutos).

---

## 6. HALLAZGOS P1 (28)

Confirmados por verificador adversarial individual (los marcados ⊕ vienen de los trazadores de flujo o del crítico, con evidencia equivalente).

| # | Dim | Hallazgo | Archivo:línea | Impacto | Fix de una línea |
|---|---|---|---|---|---|
| 1 | mobile | Menú móvil logueado sin scroll dentro de header `fixed`: 16-26 ítems ≈ 770-1250px en viewport de 667px → mitad inferior de la nav inaccesible | `NavBar.tsx:1110-1114` (header fixed :559) | Navegación core parcialmente rota en móvil | Añadir `max-h-[calc(100vh-4rem)] overflow-y-auto` al motion.div |
| 2 | mobile | <640px no existe ningún CTA de registro en la nav pública (botón `hidden sm:block`; menú hamburguesa solo trae "Iniciar sesión") | `PublicNavbar.tsx:175,226-240` | Fricción directa de conversión en todas las públicas | Añadir "Comenzar gratis" al bloque auth del menú móvil |
| 3 | mobile | Todas las públicas montan DOS headers fijos y DOS `<main>` anidados (chrome de app + chrome público) — verificado en prod (headers:2, mains:2) | `ClientWrapper.tsx:13-25` + `(public)/layout.tsx:17-25` | ~104px de espacio muerto sobre el gancho de /pre-sei; nav fantasma focusable; peso doble | Early-return de NavBar/main en ClientWrapper para rutas públicas |
| 4 | copy | La marca se vende como "IA" en el title global, footer omnipresente y card "Rowi Coach IA 24/7" — el Brand Book lo prohíbe (línea 30 del mismo layout ya migró el og:title a "Sé quien quieres ser": migración a medias) | `layout.tsx:16` · `es.json:4039,4349-4350` | Ancla la percepción en chatbot/wellness-IA, no Human Growth OS | Title → "Rowi — La práctica diaria de la inteligencia emocional"; footer sin "La IA que…" |
| 5 | navegación | Aterrizaje post-auth inconsistente: /signin→/dashboard, /login→/today, OAuth→/hub, success→/hub, logo→/dashboard; /start (el router inteligente) huérfano y su fallback tampoco es /today | `signin/page.tsx:65` et al. | "TODAY = puerta de entrada" no se cumple en NINGÚN camino real | Unificar default post-auth a /today |
| 6 | navegación | /hub/login (página signIn de NextAuth Y destino de errores SSO Six Seconds) está auth-gated: 307 a /signin perdiendo `?error=sso_*` (curl prod verificado) | `middleware.ts:11-39` + `core/auth/config.ts:37` | El usuario nunca ve por qué falló el SSO | Añadir /hub/login a PUBLIC_PAGES (o consolidar los 3 logins en /signin) |
| 7 | estados | Submit del mini-SEI muestra "¡Listo! Tu perfil se está afinando" aunque el servidor falle (sin res.ok/catch; en /mini-sei ni se lee la respuesta) | `onboarding/page.tsx:167` · `mini-sei/page.tsx:53-59` | El ancla de la cadena (perfil→avatar→BECOME) queda vacía sin que nadie lo sepa | Chequear res.ok && json.ok antes de setDone, con reintento |
| 8 | estados | Pre-SEI: pantalla en blanco tras el primer clic mientras cargan las preguntas; en error, dead-end sin reintento | `pre-sei/page.tsx:107-108,78-80` | LA página de conversión del EQ Day abandona al visitante en el paso 0:00→0:30 | Spinner cuando questions.length===0 + botón Reintentar |
| 9 | estados | TODAY falla en silencio: post() sin catch (reflexión perdida sin aviso) y card de práctica vacía con botón activo si el GET falla | `today/page.tsx:79-98,183` | Rompe la confianza en el hábito justo donde más duele | catch con mensaje + estado de error con Reintentar |
| 10 | estados | /community: bloques pt/it del diccionario local son copias en INGLÉS (123 strings, 1 en portugués, 1 en italiano) | `community/page.tsx:404-756,814` | Una de las 4 pantallas core casi íntegra en inglés para PT/IT | Migrar el diccionario local a t() en los 4 locales |
| 11 | i18n | Registro y pricing muestran fragmentos en inglés a PT/IT: formatPrice/getSupportLevelName/getTokensText siguen binarios es/en | `plans.ts:950-996` · `register/page.tsx:435,611,663` | Inglés justo donde se decide el pago | Convertir los 3 helpers a 4 idiomas (relationalDepthLabel del mismo archivo ya migró) |
| 12 | a11y | Selección de plan en register solo funciona con mouse: divs sin role/tabIndex/onKeyDown, y "Continuar" solo aparece con plan elegido | `register/page.tsx:550-562` | Bloqueo total de conversión por teclado (WCAG 2.1.1) en el primer paso del funnel | Convertir la tarjeta en `<button>` con aria-pressed |
| 13 | seo | /pre-sei sin SEO propio: title genérico con marca doblada ("Rowi — … · Rowi"), fuera del sitemap, og:url apuntando a la home | `pre-sei/` (sin metadata) + `sitemap.ts:22-34` | El gancho del lanzamiento es invisible para buscadores y se comparte mal | layout.tsx de pre-sei con metadata propia + entrada en sitemap |
| 14 | seo | rowi.vercel.app sirve el sitio completo indexable (200, sin x-robots-tag, robots.txt Allow:/, 0 canonical) — el comentario del código que dice que metadataBase lo previene es falso | `layout.tsx:11-14` + middleware (sin regla por host) | Dominio espejo parte la autoridad SEO en pleno lanzamiento | Middleware: 308 a www.rowiia.com (o X-Robots-Tag noindex) si host contiene vercel.app |
| 15 | perf | Los 4 diccionarios i18n completos viajan en un chunk de 401 KB gzip (1.56 MB raw) a todo visitante — >50% del JS de landing (745 KB) y /pre-sei (689 KB) | `I18nProvider.tsx:4-8` | Segundos de time-to-interactive en móvil de gama media, en las 2 páginas que deben convertir | dynamic import del locale activo (es.json único estático) |
| 16 | confianza | La cuenta se crea en el paso 1; el aviso de términos aparece en el paso 4, sin links ni checkbox, y no se registra aceptación | `register/page.tsx:333,1070-1072` | Cuenta con datos personales antes de ver términos; sin timestamp de aceptación | Aviso con links reales en el paso de cuenta + timestamp en el POST |
| 17 | confianza | Dos páginas de privacidad divergentes: /settings/privacy (defaults opt-out + borrado por mailto a un buzón que no existe) vs /hub/account/privacy (consents reales + GDPR self-service) | `settings/privacy/page.tsx:325` vs `hub/account/privacy/page.tsx:68` | Según por dónde entres, derechos distintos | Redirigir /settings/privacy a /hub/account/privacy |
| 18 | confianza | Toggles de visibilidad fantasma: showBrain/showTalents/showContact no se cargan ni se guardan, pero el botón confirma "Guardado" | `settings/privacy/page.tsx:101-150` | El usuario cree haber protegido su privacidad y no lo hizo | Eliminar la sección hasta que exista backend |
| 19 | retención | No existe ningún canal de retorno diario: ningún cron recuerda el loop/reflexión (solo weekly + mini-SEI mensual); cero tipos DAILY_* en notificaciones | `vercel.json` (crons) + `notifications/types.ts:128-146` | "¿Qué hace volver mañana?" solo tiene respuesta si el usuario vuelve solo | Cron diario 18:00 → recordatorio de reflexión a quien no cerró el día |
| 20 | retención | El feedback de outcome de ECO es inalcanzable: /api/eco/send sin callers y sin recordatorio (duplica P0-4, vista retención) | `eco/send/route.ts:57` · `SendMessageActions.tsx:117` | El loop de calibración nunca arranca | Banner "¿funcionó tu último mensaje?" en /eco |
| 21 | conversión | El CTA primario de la home es /register (5 botones primarios) y el Espejo Emocional — el WOW diseñado — queda como único botón outline secundario | prod `/` + `HomeClient.tsx` | El tráfico se canaliza al camino con más fricción | Invertir jerarquía: /pre-sei primario, /register secundario |
| 22 | conversión | Los "tokens IA" que diferencian los planes no se aplican en ningún endpoint: /api/rowi solo estima y registra uso, nunca corta → **Free tiene IA ilimitada** | `api/rowi/route.ts:480-517` · `pricing/page.tsx:445` | La razón principal para pagar es cosmética + costo OpenAI sin tope por usuario free | Cuota mensual contra plan.tokensMonthly con 402 + CTA upgrade |
| 23 | conversión | El registro pide elegir plan como PASO 1 de 5 (icono de tarjeta de crédito incluido) — decisión de pago antes de entregar valor, contra el Documento Total | `register/page.tsx:56-61,171` | Paywall psicológico en el clic "Comenzar gratis" | Registro de 1 paso con free implícito; plan diferido |
| 24 ⊕ | navegación | Sección admin Educación entera fetchea /api/admin/education/* que NO EXISTE → 5 páginas siempre vacías en sidebar; duplica eLearning | `Sidebar.tsx:444-448` + `find src/app/api/admin/education` → vacío | Un admin ve módulos muertos como reales | Borrar sección o crear las APIs |
| 25 ⊕ | navegación | /hub/admin/tasks en sidebar con métricas 100% inventadas (DEMO_STATS, cero fetches); tp/coach y tp/onboarding también puro demo | `hub/admin/tasks/page.tsx:62,103` | Dashboards con números falsos visibles para admins/clientes | Gatear como demo o quitar del sidebar |
| 26 ⊕ | seguridad | IDOR cross-tenant en los 6 endpoints /api/consultant/*/[benchmarkId]: requireCapability sin validar pertenencia del benchmark | `api/consultant/analysis/route.ts:33-48` et al. | Un consultor lee benchmarks de otros tenants | Validar benchmark.tenantId ∈ tenantIdsForScope(scope) |
| 27 ⊕ | ops | Telemetría de errores APAGADA en prod en semana de lanzamiento: /api/health reporta `provider:log_only, enabled:false` | prod `/api/health` + `docs/OBSERVABILITY.md` | Combinado con los fallos mudos (#7,#9): nadie se enteraría de una ola de 500s | Activar Sentry/Axiom desde /hub/admin/settings (mayor retorno/esfuerzo de toda la auditoría) |
| 28 ⊕ | navegación | No existe página 404: toda URL inexistente da 307 a /signin (soft-404 para crawlers, login desconcertante para humanos) | `middleware.ts:361-396` + `find src/app -name not-found.tsx` → 0 | Cada link roto del lanzamiento aterriza en un login sin explicación | not-found.tsx global + allowlist en middleware |

---

## 7. HALLAZGOS P2 (65 confirmados — consolidados)

Con evidencia dura verificada (archivo:línea o prod). Agrupados por dimensión; formato `hallazgo — ubicación — fix`.

**UI / marca (8):**
- Tipografía de marca (Varela Round/Poppins) jamás se carga: prod sirve 0 @font-face, todo es fuente de sistema — `globals.css:96` + `tailwind.config.ts:15-18` — cargar vía next/font/google.
- Los 5 emails transaccionales usan el gradiente azul pre-rebrand #31a2e3 — `sendWelcomeEmail.ts:128,137` et al. — migrar a violeta.
- Dark mode revierte el primario al azul viejo #5bc0eb vía darkTokens — `theme/tokens.ts:155` — cambiar a #a78bfa.
- /pricing (conversión) liderada por azul: hero, plan destacado y CTA final no son violeta — `pricing/page.tsx:138,243,376,605,616`.
- 427 clases blue-* heredadas en 40+ archivos, incluidas públicas en prod — barrido decorativo→violeta (azul solo semántico KCG).
- Color SEI "Choose Yourself" = rojo #E53935 en código vs morado #7A59C9 en brand book — `dictionary.ts:195-201` — **decisión de Eduardo**.
- 3 sistemas de botones y 3 de cards con radios distintos — `ui/button.tsx:13` vs `globals.css:117-165` vs inline — consolidar.
- Dark mode con dos paletas de fondo (zinc hardcodeado vs --rowi-*) — `today/page.tsx:105`, `becoming/page.tsx:112,176`.

**Navegación (7):**
- Nav real con 5+ elementos top-level y "Más" contiene crecimiento, no configuración (viola "Cuatro, no más") — `NavBar.tsx:368-384`.
- Nav mobile = lista plana de 13+ links sin jerarquía TODAY/BECOMING/GUIDE: la arquitectura de 4 solo existe en desktop — `NavBar.tsx:1127-1146`.
- /ventas y /asesor accesibles a cualquier autenticado: ni página ni /api/rowi verifican rol — `api/rowi/route.ts:301-321`.
- Sanity Studio (/studio) sin gate de admin — `(app)/studio/[[...index]]/page.tsx:1-9`.
- 7+ huérfanas vivas (/landing-old, /me×6, /team, /start, /setup-organization) — convertir a redirects o borrar.
- Módulos admin duplicados enlazados a la vez: education vs elearning, finance vs accounting (mismos modelos prisma), gamification/coupons (mock) vs sales/coupons (real) — `Sidebar.tsx:215-223,440-477`.
- ContextSwitcher desactivado en desktop por roto pero visible en mobile — `NavBar.tsx:583` vs `:1117`.
- /pitch en PUBLIC_PAGES del middleware: un commit accidental lo publicaría sin auth — `middleware.ts:33`.

**Copy (5):**
- Hero promete "las palabras exactas" (advertencia crítica Año 1 del Brand Book) — `es.json:4373` — suavizar.
- /product 404 en prod y /resources enlaza a él — `ResourcesContent.tsx:88`.
- 128 anglicismos en es.json (Dashboard/Insights/Engagement/scores) — pasada de sustitución.
- Lenguaje de vigilancia/leads en Affinity Monitor: "relaciones monitoreadas", bandas HOT/WARM/COLD — `AffinityMonitor.tsx:129` + `es.json:4545-4567`.
- Badge "Presente en +200 países" sin atribución (la presencia es de Six Seconds) — `es.json:4378`.

**i18n (5):**
- 29 claves t() sin fallback inexistentes en todo locale (incl. mensaje de nivel EQ del dashboard, roto en los 4 idiomas) — `OverallSummary.tsx:21-34`.
- "Sei Secondi" en it.json (3 claves de avatar; hoy huérfanas → latente) — `it.json:3520,3533,3543`.
- `<html lang="es">` nunca cambia al cambiar idioma — `layout.tsx:98` + `I18nProvider.tsx:138`.
- 46 ternarios es/en residuales en 28 archivos (ContextSwitcher, snapshots EQ, RowiCoach, fechas) — PT/IT degradan a inglés.
- Página Becoming: etapas (stageInfo) y SEI_LABEL solo en/es-en — `becoming/page.tsx:35-44,109,139`.

**Mobile (4):**
- Globo de RowiCoach (z-50) tapa el FloatingCTA de registro (z-40) — `RowiCoach.tsx:380` + `FloatingCTA.tsx:33`.
- ThemeToggle flotante duplicado enterrado bajo el navbar: control fantasma — `ClientWrapper.tsx:16-18`.
- Selects de idioma <16px → auto-zoom iOS — `LangToggle.tsx:38`, `PublicNavbar.tsx:152`.
- (P3 asociados: header auto-hide con menú abierto, padres del menú con href="#", toggle de tema de 32px.)

**Estados no felices (6):**
- ECO: diccionario solo ES/EN + error de perfil sin salida — `eco/page.tsx:88-201,391-395`.
- Estados vacíos de ECO y Affinity sin CTA al siguiente paso (el patrón EmptyState ya existe en /community y no se reutiliza) — `eco/page.tsx:477`, `affinity/page.tsx:696-700`.
- /community: error de red/sesión disfrazado de "no tienes miembros" — `community/page.tsx:903-908`.
- Affinity: errores del coach y niveles hardcodeados en español — `affinity/page.tsx:216-222,437,446`.
- Onboarding: spinner infinito si el fetch de preguntas falla; /mini-sei muestra solo "Error" — `onboarding/page.tsx:144-151`.
- BECOMING: competencias SEI hardcodeadas en inglés — `becoming/page.tsx:35-44`.

**Accesibilidad (6):**
- 8 campos core sin label (register, login, today) — solo placeholder.
- 3 controles sin nombre accesible: toggle facturación, hamburguesa, eliminar contacto — `register:513`, `PublicNavbar:182`, `eco:584`.
- Errores nunca anunciados: 1 solo aria-live en el repo — adoptar role="alert".
- Errores en rosa con contraste 2.16-2.28:1 — usar token --destructive ya definido.
- --rowi-muted-weak 2.5:1 con 77 usos + text-gray-400 en 29 puntos core.
- ConfirmDialog sin focus trap, sin foco inicial, sin Escape — `ConfirmDialog.tsx:48-116`.
- `<main>` anidado + doble header/nav en prod (duplica mobile #3, vista a11y).

**Performance (4):**
- Shell completo de app (NavBar + RowiCoach + SessionProvider) montado en cada pública — `layout.tsx:106`.
- Cero lazy-loading: framer-motion en 18 componentes públicos, mapa d3 eager — `PublicWorldMap.tsx:7`.
- Pre-SEI: blanco al pulsar el CTA (sin prefetch/spinner; las preguntas pesan 860 B) — prefetchear en mount.
- 0 loading.tsx en todo src/app (306 páginas).

**SEO (5):**
- sitemap.xml apunta a /legal y /product → 404 — `sitemap.ts:26,33`.
- canonical ausente en todas las públicas salvo /resources y /stories.
- Title default con marca duplicada ("Rowi — … · Rowi") — `(public)/layout.tsx:9-12`.
- Producto 4 idiomas, SEO monolingüe: sin hreflang ni rutas localizadas — decisión de roadmap.
- OG débil: imagen 512×512, twitter:card summary, og:url ausente/erróneo por página — `layout.tsx:33-52`.

**Confianza (4):**
- Política de cookies promete cambiar la elección "en cualquier momento" pero no hay UI para reabrirla — `CookieConsent.tsx:44-53`.
- Today/Becoming capturan datos emocionales diarios sin un solo microcopy de quién los ve — añadir línea "Privado: solo tú lo ves; tu org solo agregados N≥5".
- El toggle "Análisis de IA" (allowAI) no gatea ninguna llamada de IA — `api/rowi/route.ts`.
- Pantallas de privacidad y ECO con diccionarios solo es/en: usuarios PT/IT leen su consentimiento en español.

**Retención (4):**
- Push muerto en cliente: sin service worker ni suscripción posible (servidor OK) — falta `public/sw.js`.
- Triggers de racha/avatar/nivel definidos pero nunca llamados: dead code — `triggers.ts:46-95`.
- La recompensa al cerrar reflexión (puntos+racha) se calcula y la UI la descarta — `today/page.tsx:90-94`.
- Celebración de evolución vía Daily Pulse solo se consume en /profile/avatar (página enterrada) — `DailyPulseCard.tsx:98-100`.

**Conversión (4):**
- "Profundidad relacional" y agentes por plan se venden y no se gatean en APIs — helper `requirePlanDepth` inexistente.
- Mensajes de trial contradictorios entre CTA, FAQ y Stripe real — `pricing/page.tsx:409,578`.
- Plan SEI anual etiquetado "/año" cuando $49 es pase de 6 meses — `plans.ts:240`.
- No existe landing para coaches/practitioners — el primer mercado declarado no tiene página.

**Ops (2, del crítico):**
- /api/health expone sin auth commit SHA, región, latencia DB y proveedores configurados — `health/route.ts:83`.
- CSP mantiene `script-src 'unsafe-inline'` (backlog de nonces vivo en el deploy actual).

---

## 8. HALLAZGOS P3 (23 — lista breve)

- NavBar con diccionario local de 265 líneas en vez de t() — `NavBar.tsx:24-289`.
- /benchmark y /org visibles a todos los roles, /benchmark clasificado SEE (doc dice IMPACT por rol) — `NavBar.tsx:359-360`.
- Selector de acento ofrece el azul abandonado #31a2e3 y omite #7c3aed — `settings/appearance/page.tsx:63-72`.
- `window.confirm` sobrevive en moderación social — `hub/admin/social/moderation/page.tsx:30`.
- Charts EQRadar/EQLine/HistoryLine con estilo glass solo-noche, ilegibles en día — `EQRadar.tsx:14` et al.
- EmoPower Schools descrito en presente como programa operativo en /stories — `es.json:6234-6242`.
- Hero EN dice "Become who you want to be" vs tagline oficial "Be Who You Want To Be" — `en.json:4374`.
- Typo "Tu evolucion" sin tilde — `es.json:3520`.
- API hardcodeada en español para todos los idiomas ("Resumen IA restringido a plan Pro") — `api/affinity/ia/route.ts:13`.
- Fetch de /api/hub/translations devuelve 401 a anónimos (request desperdiciado por página) — `I18nProvider.tsx:104-124`.
- globals.css declara 'Inter' que nunca se carga (system-ui silencioso) — `globals.css:96`.
- JSON-LD único Organization en todas las páginas; pricing sin Product/Offer — `layout.tsx:86-95`.
- /r/[token] indexable (sin disallow/noindex) — `robots.ts:21-28`.
- Sin skip-link con navbar fija — `ClientWrapper.tsx:12-28`.
- Wizard Pre-SEI sin progressbar/aria-live (progreso invisible a lector de pantalla) — `PreSeiWizard.tsx:64-89`.
- Sesión expirada en TODAY/BECOMING: texto muerto sin link — `today/page.tsx:68-74`.
- ECO compose: validaciones mudas (mensajes definidos que nunca se muestran) — `eco/page.tsx:121-122,223-225`.
- Fallo de checkout redirige en silencio a /settings/subscription — `pricing/page.tsx:74-85`.
- Streak mostrado sin decay (racha rota hace 5 días sigue visible) — `api/daily-pulse/today/route.ts:45-48`.
- checkAndEvolve no-op silencioso si no existe fila AvatarEvolution — `avatar-evolution.ts:329-337`.
- /hub/admin/users/imports: única huérfana real del admin — enlazar desde sidebar.
- Endpoints muertos con typo: `api/eco/analayze-self` y `analayze-target` (0 callers) — borrar.
- Dark mode no sigue `prefers-color-scheme` (solo toggle manual) — verificado en browser local. INFERENCIA sobre si es intencional.

### 8.1 Hallazgos REFUTADOS por la verificación adversarial (excluidos del informe, listados por transparencia)
1. ~~"Sei Secondi" como P1 de copy visible~~ → las 3 claves son huérfanas (0 referencias en componentes); ningún usuario italiano lo ve. Degradado a P2 latente (higiene de locale).
2. ~~"Login fallido no muestra ningún error" (P1 a11y)~~ → falso: con redirect:true NextAuth encadena a /hub/login?error=CredentialsSignin que SÍ renderiza el banner (reproducido en prod con curl). Queda solo la inconsistencia UX /login→/hub/login (P3).
3. ~~50/89 claves en inglés en pt/it.json~~ → sin evidencia dura reproducible.
4. ~~12 strings en inglés en es.json (admin.social)~~ → sin evidencia dura reproducible.

---

## 9. SCREENSHOTS VISUALES

Capturas tomadas en vivo durante la auditoría (dev server local, viewport 380×820, light y dark). **No persistidas como archivos PNG** (limitación de la herramienta de captura en sesión); cada una está descrita con su hallazgo verificable en código:

| # | Pantalla | Viewport | Qué muestra |
|---|---|---|---|
| 1 | `/` (hero) | 380×820 light | Primera pantalla casi vacía: banner beta arriba, ~400px de gradiente sin contenido, mascota; el H1 cae bajo el fold. Banner beta y tagline en INGLÉS con browser en-US pese a html lang="es". |
| 2 | `/` (scroll 900px) | 380×820 | CTAs "Start free" + "Discover your emotional mirror"; trust badges "Backed by Six Seconds · In 200+ countries" (ver P2 copy: atribución). |
| 3 | `/pre-sei` | 380×820 | **El banner de cookies tapa el CTA principal**; triple chrome (banner beta + navbar + cookies) antes del contenido. |
| 4 | `/pricing` | 380×820 | Renderiza bien; gap vacío recurrente bajo el navbar; card ROWI SEI $10/mes con "80 tokens/month" (jargon). |
| 5 | `/register` | 380×820 | El wizard arranca en "Choose your perfect plan" — selección de plan ANTES de crear cuenta (P0-8/P1-23), con stepper de 5 iconos. |
| 6 | `/today` sin sesión | 380×820 | Redirige a /signin (tercera página de login; confirma P1-5/6). |
| 7 | `/` dark mode | 380×820 dark | Con `prefers-color-scheme: dark` la página sigue LIGHT; el toggle manual sí funciona y el dark renderiza correcto (mismo vacío de hero). |

Además, evidencia HTML de producción capturada por comando (reproducible): H1 de prod servido con `style="opacity:0"` inline (invisible pre-hidratación), headers:2/mains:2 en todas las públicas, chunk i18n de 401 KB.

---

## 10. PROBLEMAS POR IDIOMA

**ES (default):** 128 anglicismos en es.json (Dashboard, Insights, Engagement, scores); typo "Tu evolucion"; lenguaje de vigilancia en Affinity Monitor ("monitoreadas", HOT/COLD); jargon "tokens" en pricing.

**EN:** hero "Become who you want to be" ≠ tagline oficial "Be Who You Want To Be" (en.json:4374); usuarios con browser EN ven el banner beta/landing en inglés pero html lang="es" + title en español (mezcla SEO/contenido).

**PT:** /community casi íntegra en inglés (bloque pt = 123 strings, 1 en portugués); ECO entero en español (diccionario solo es/en con fallback es); registro/pricing con "Free", "Priority", "tokens/month" en inglés (helpers plans.ts); Becoming con etapas en inglés; 46 ternarios es/en degradan a inglés; consentimiento/privacidad en español.

**IT:** todo lo de PT, más "Sei Secondi" en 3 claves latentes de avatar (viola regla de marca, hoy sin render); fechas/Intl con locale incorrecto en varios puntos.

**Transversal:** `<html lang>` fijo en "es" para los 4 idiomas; 29 claves t() inexistentes (rotas en los 4); paridad de claves 7038/7038 verificada por script (la base estructural es sólida — el problema son los diccionarios locales y ternarios que esquivan el sistema).

---

## 11. PROBLEMAS MOBILE (380px)

1. **Menú móvil logueado inaccesible a partir del ítem ~13** (sin scroll en header fixed) — NavBar.tsx:1110. El más grave.
2. **Sin CTA de registro en nav pública <640px** — PublicNavbar.tsx:175.
3. **Doble chrome:** 2 headers + 2 main anidados en todas las públicas (~104px muertos sobre el gancho de /pre-sei) — verificado en prod.
4. **Cookie banner tapa el CTA de /pre-sei** (captura #3).
5. **Hero de landing con primera pantalla casi vacía** — H1/CTA bajo el fold (capturas #1/#7).
6. RowiCoach (z-50) tapa el FloatingCTA de registro (z-40).
7. ThemeToggle fantasma duplicado bajo el navbar.
8. Selects de idioma <16px → auto-zoom iOS.
9. Nav mobile plana sin jerarquía de 4 (la arquitectura solo existe en desktop).
10. Dark mode no sigue prefers-color-scheme (toggle manual sí funciona).
11. Lo positivo verificado: viewport meta correcto, grids con breakpoints, wizard Pre-SEI con targets 48px, tablas con overflow-x-auto.

---

## 12. PROBLEMAS DE COPY Y POSICIONAMIENTO

**¿Qué parece Rowi hoy?** El núcleo narrativo está sorprendentemente alineado con la tesis: hero "Sé quien quieres ser.", loop diario en lenguaje de práctica (no medición), niveles no puntajes en pre-SEI, Becoming → "Mi evolución", cifras atribuidas a Six Seconds con casos reales (Amadori, Komatsu). **Pero la primera impresión la fijan el title, el footer y la feature card — y los tres dicen "IA":** "Rowi — Inteligencia emocional con IA…", "La IA que te ayuda a entender…", "Rowi Coach IA 24/7". Resultado neto: **Rowi se lee hoy como app de bienestar emocional con IA / chatbot**, no como Human Growth OS ni Daily Practice Layer. La evidencia de que es migración incompleta (no decisión): el og:title del MISMO layout ya dice "Rowi — Sé quien quieres ser".

- **Human Growth OS:** no aparece como categoría en ninguna superficie pública. NO SE ENCONTRÓ EVIDENCIA de la frase en la web.
- **Daily Practice Layer:** el concepto vive en el producto (/today) pero el marketing no lo nombra; el hero vende relaciones+IA.
- **Affinity/ECO como diferenciador:** /for-you lo reduce a "matches emocionales" (lenguaje de app de citas, P0-7) y el hero promete "las palabras exactas" (la advertencia crítica del Brand Book). El Affinity Monitor usa lenguaje de vigilancia/CRM (monitoreadas, HOT/COLD) — riesgo de leerse como herramienta HR fría.
- **¿Se entiende que Rowi transforma relaciones?** En el copy del hero sí; en el producto, la cadena que lo demostraría está rota (Flujo D).

---

## 13. PROBLEMAS DE RETENCIÓN

**Cadena TODAY → Avatar → BECOMING:** existe completa en código y producción (verificación positiva: DailyLoopEntry + UserStreak + puntos + checkAndEvolve + timeline con datos reales). La rompen: (1) el timezone negado (P0-3) — el cierre del día cae en la fecha equivocada para LatAm; (2) la recompensa calculada se descarta en la UI (el server devuelve puntos+racha y TODAY solo muestra evolución de avatar); (3) la celebración de evolución se difiere a /profile/avatar, una página enterrada en "Más"; (4) el onboarding nunca aterriza en /today, así que el loop ni siquiera se presenta al usuario nuevo.

**Cadena Invitación → Affinity → ECO → Connect:** rota en el eslabón 1 (P0-1, 400 silencioso en producción). Aguas abajo: heat135 sí se calcula, pero el resultado del invitado muestra % crudo (contra la regla BRECHA), el token no viaja al registro (la relación nunca se vincula: `dyad.otherUserId` no se escribe en este flujo), no se envía email de invitación (TODO en el código + DNS muerto P0-10), y ECO nunca registra outcome (P0-4).

**Canales de retorno: cero.** Ningún recordatorio diario del loop (los crons existentes: weekly, mensual, debrief VS); push sin service worker (imposible suscribirse); triggers de racha/avatar/nivel definidos y jamás llamados; email lifecycle limitado a invitaciones/billing/weekly — y probablemente nada se entrega (P0-10). **Respuesta honesta a "¿qué hace volver al usuario mañana?": hoy, nada que Rowi haga activamente.**

---

## 14. PLAN DE REMEDIACIÓN (ordenado por impacto ÷ esfuerzo)

| Orden | Acción | Prioridad | Impacto | Esfuerzo | Archivos probables | Resultado esperado |
|---|---|---|---|---|---|---|
| 1 | DNS de email: SPF + DKIM Resend + DMARC + MX (y probar con forgot-password) | P0-10 | Crítico | XS (config, sin código) | Vercel DNS | Los emails del producto se entregan; soporte@ recibe |
| 2 | Activar telemetría (Sentry/Axiom) desde /hub/admin/settings | P1-27 | Crítico | XS (config) | SystemConfig vía UI | Los 500s de prod se ven |
| 3 | Quitar el signo del timezone | P0-3 | Crítico | XS (1 carácter ×2) | today/page.tsx:46, profile/avatar/page.tsx:84 | El cierre nocturno cae en el día correcto |
| 4 | Alinear payload de invitación (`otherName ?? name`) + error visible + tests reales | P0-1 | Crítico | S | api/relationships/invite/route.ts:41, RelationshipsTab.tsx:61 | La cadena SIA arranca |
| 5 | Leer `preSeiToken` + `intent` en register y reclamar la sesión | P0-2 | Crítico | S | register/page.tsx, api/auth/register | El WOW sobrevive al registro |
| 6 | Testimonios de /for-you fuera | P0-7 | Alto | XS | for-you/page.tsx:91-116 + 4 locales | Coherencia con /stories y regla del proyecto |
| 7 | Analytics (Plausible/PostHog/Vercel) + 5 eventos del funnel | P0-9 | Crítico | S | layout.tsx, package.json | El lanzamiento se puede medir |
| 8 | Consent real: `canContributeToBenchmark()` en los imports + no fijar flag en registro | P0-5 | Crítico | S | six-seconds/import:256, communities/import:345, register:281 | La promesa de /legal/research se cumple |
| 9 | Unificar destino post-auth a /today (signin, complete, success, logo) | P1-5 | Alto | S | signin:65, register/complete:82, success:228, NavBar:570 | TODAY = puerta de entrada, de verdad |
| 10 | /pricing y /register leen planes de /api/public/plans | P0-6 | Alto | M | pricing/page.tsx, register/page.tsx, plans.ts | Precio anunciado = precio cobrado |
| 11 | Registro de 1 paso (free implícito, plan diferido) + aviso de términos con links en el paso de cuenta | P0-8 + P1-16/23 | Alto | M | register/page.tsx | Funnel sin paywall psicológico ni cuenta-antes-de-términos |
| 12 | Scroll en menú móvil + CTA registro en menú móvil público | P1-1/2 | Alto | XS | NavBar.tsx:1110, PublicNavbar.tsx:226 | Nav móvil funcional |
| 13 | res.ok + catch + reintento en mini-SEI, TODAY y Pre-SEI (los 3 puntos mudos) | P1-7/8/9 | Alto | S | onboarding:167, mini-sei:53, today:79, pre-sei:107 | Fin de los falsos éxitos |
| 14 | Mostrar `res.reward` al cerrar el día (+15 pts · racha N) | P2-retención | Alto | XS | today/page.tsx:90-94 | Cerrar TODAY produce recompensa visible |
| 15 | ECO: dyadId end-to-end + registrar "sent" + banner de feedback | P0-4 | Alto | M | eco/page.tsx, SendMessageActions.tsx | El foso de datos empieza a llenarse |
| 16 | Cron diario de recordatorio de reflexión | P1-19 | Alto | S | vercel.json + api/cron nuevo + types.ts | Primer canal de retorno |
| 17 | SEO de /pre-sei (metadata + sitemap) + redirect 308 de vercel.app + canonical en públicas + 404 real | P1-13/14/28 + P2 | Alto | S | pre-sei/layout.tsx, middleware.ts, sitemap.ts, not-found.tsx | El gancho se encuentra y se comparte bien |
| 18 | i18n dinámico: import del locale activo (mata el chunk de 401 KB) | P1-15 | Alto | M | I18nProvider.tsx:4-8 | Landing/pre-sei ~50% más ligeras |
| 19 | Chrome único en públicas (ClientWrapper early-return) | P1-3 | Medio | M | ClientWrapper.tsx, (public)/layout.tsx | 1 header, 1 main, menos peso, mejor fold |
| 20 | Cuota de tokens IA + requirePlanDepth en affinity/eco | P1-22 + P2 | Medio | M | api/rowi/route.ts + helper nuevo | Free ≠ Pro; costo OpenAI acotado |
| 21 | Tarjetas de plan operables por teclado + labels + role=alert + contraste de errores | P1-12 + P2 a11y | Medio | S | register:550, formularios core | Funnel accesible |
| 22 | Consolidar logins (/login y /hub/login → /signin) preservando errores SSO | P1-6 | Medio | S | middleware.ts, config.ts:37 | Errores SSO visibles; 1 login |
| 23 | PT/IT de verdad: /community, ECO, plans.ts helpers, Becoming, 29 claves muertas | P1-10/11 + P2 | Medio | M-L | community/page.tsx, eco/page.tsx, plans.ts, becoming | 4 idiomas reales en pantallas core |
| 24 | Privacidad: redirect /settings/privacy → /hub/account/privacy + quitar toggles fantasma + microcopy en Today/Becoming | P1-17/18 + P2 | Medio | S | settings/privacy/page.tsx | Una sola verdad de privacidad |
| 25 | IDOR consultor (tenantIdsForScope en 6 endpoints) + gates /ventas /asesor /studio | P1-26 + P2 | Medio | S | api/consultant/*, api/rowi:301 | Superficies internas cerradas |
| 26 | Marca: tipografía next/font + emails violeta + dark primario + title/footer sin "IA" | P1-4 + P2 UI | Medio | M | layout.tsx, globals.css, 5 emails, tokens.ts | La marca se ve y se lee como el Brand Book |
| 27 | Borrar huérfanas (/me, /team, landing-old, admin/ui, education admin, demos con datos falsos) | P2 | Bajo | S | varios | Menos superficie muerta |
| 28 | Backlog mayor: hreflang/rutas localizadas, push client (sw.js), nav móvil jerárquica, loading.tsx core, consolidación botones/cards | P2-P3 | — | L | — | Post-arreglos core |

**Nota de verificación pendiente (del crítico):** la pregunta que esta auditoría no pudo responder con solo-GET: ¿funciona la cadena completa con dos usuarios reales en producción (registro → mini-SEI → invitar → /r/[token] → affinity → ECO → email entregado)? **Una sesión de 30 minutos con dos cuentas reales, después de los fixes 1-5, responde lo que 120 páginas de auditoría rodean.** También NO SE PUDO VERIFICAR: checkout Stripe ejecutado, comportamiento autenticado en prod, plan Vercel (cron */5 requiere Pro), buzón RESEND_FROM_EMAIL.

---

## CRITERIO FINAL

# 🔴 REPARAR CORE ANTES DE LANZAR

**Por qué (sin tibieza):**

1. **La tesis central no es operable hoy.** Rowi vende "transforma tus relaciones" y la cadena relacional completa — invitar → afinidad → ECO → outcome — está rota en el primer eslabón en producción (400 silencioso) y muda en el último (0 outcomes registrados). Lo que sí funciona (loop diario, consultor, Stripe) pertenece a la promesa secundaria.
2. **El funnel pierde lo que captura.** El Pre-SEI convierte (cumple el spec del Espejo) pero su resultado se tira a la basura en el registro, y el registro mismo cobra a nadie y asigna planes pagos sin pago.
3. **Hay tres bombas de confianza armadas:** testimonios inventados junto a la promesa de no inventarlos, consentimiento decorativo contra promesa legal publicada, y precios anunciados ≠ cobrados. Cualquiera de las tres, descubierta por un cliente o por Six Seconds, cuesta más que todas las features juntas.
4. **El lanzamiento sería ciego y mudo:** sin analítica no se puede medir, sin telemetría no se ven los errores, y sin DNS de email los usuarios no reciben ni el reset de password.
5. **La buena noticia es el tamaño del arreglo.** No hay nada podrido en los cimientos: tsc limpio, 518 tests, arquitectura de 4 implementada, loop diario completo, Stripe cableado, capa legal seria. Los 10 P0 son costuras, no vigas: los primeros 8 ítems del plan son ~2-3 días de trabajo enfocado. Después de eso (y de la sesión de verificación en vivo), el veredicto pasa a LANZAR CON RIESGOS con los P1 como backlog de la semana 1.

No es "NO LANZAR" (el esqueleto es sano) ni "REPOSICIONAR" (el posicionamiento del hero ya es correcto; lo que falla es que el producto no lo cumple). Es exactamente lo que dice: **reparar el core, verificar en vivo, y entonces empujar al mercado.**

---

## 15. PROMPT PARA LA SIGUIENTE SESIÓN

```
Ejecuta el plan de remediación de docs/entregables/AUDITORIA_UX_TOTAL_ROWI.md
empezando por P0 (ítems 1-8 del plan, en ese orden), sin tocar P1 hasta
terminar P0, sin commits hasta que yo lo apruebe, preservando tsc (0 errores)
y los 518 tests en verde. Los ítems 1-2 (DNS de email y telemetría) son
configuración que me corresponde a mí: dame las instrucciones exactas y sigue
con el 3. Al terminar P0, corre la verificación en vivo: dos cuentas reales
en producción recorriendo registro → mini-SEI → invitación → /r/[token] →
affinity → ECO → email entregado, y reporta qué eslabones ya cierran.
```

---
---

# ANEXO — CONSEJO DE ADMINISTRACIÓN DE ROWI

*La auditoría terminó. Lo que sigue no es auditoría: es el Board decidiendo qué hacer con la empresa, conociendo el código, la arquitectura, la visión y los problemas.*

---

## MODO STEVE JOBS

- **¿Qué eliminaría inmediatamente?** 250 de las 306 páginas. El universo /hub paralelo, /me, los 3 logins, los dashboards admin con números inventados (tasks, tp/coach, education), los demos muertos. Un producto con tres "homes" no tiene home. Y la palabra "IA" de cada superficie de marca: nadie compra una IA, la gente compra convertirse en quien quiere ser.
- **¿Qué producto escondería?** Todo el admin que no sea el consultor, EmoPower Schools (es un negocio, no un producto: véndelo con PDFs hasta que el core respire) y /ventas//asesor.
- **¿Qué pantalla rediseñaría?** Ninguna. Ese es el punto: las pantallas están bien. Rediseñaría el **camino**: hoy ningún login aterriza en /today. Eso es como si el iPhone encendiera en Ajustes.
- **¿Qué funcionalidad simplificaría?** El registro: 5 pasos con selector de plan y tarjeta de crédito en el paso 1 es una ofensa. Un tap de Google y estás dentro de tu espejo. El plan se discute cuando ya te importa.
- **¿Qué mensaje cambiaría?** "Inteligencia emocional con IA" → fuera. La metodología es Six Seconds; la magia es la práctica; la IA es plomería.
- **¿Qué pondría en el hero?** Lo que ya está — "Sé quien quieres ser." — pero con UN solo botón: *Mírate* (el espejo, /pre-sei). Cinco botones de "Comenzar gratis" es no saber qué quieres que la gente haga.
- **¿Qué mantendría?** El búho. El espejo del Pre-SEI. El loop de 2 minutos. La honestidad de "niveles, no puntajes". Eso es producto de verdad.
- **¿Qué retrasaría?** Enterprise, integraciones Teams/Gmail, multi-idioma SEO, todo lo que no toca el loop.
- **¿El centro absoluto?** Cerrar el día y **ver** algo cambiar. La recompensa ya se calcula y la UI la tira (today/page.tsx:90). Eso, en mi empresa, es un despido.

### EL PRODUCTO DE ROWI SEGÚN STEVE JOBS
Una sola experiencia: abres Rowi y está **TODAY** — quién quieres ser hoy, una práctica de 2 minutos, y de noche una pregunta. Al cerrar, tu búho cambia delante de ti y tu historia (BECOMING) crece una página. Un botón: "¿Con quién quieres crecer?" — invitas, los dos ven su BRECHA, ECO te da las palabras. Nada más. Ni dashboard, ni hub, ni tokens. El resto existe, pero detrás del telón, para coaches y empresas que pagan por mirar (agregado, N≥5). Tres pantallas, una promesa, cero mentiras.

---

## MODO ELON MUSK

- **¿Qué destruiría?** La superficie duplicada (la mejor pieza es la que no existe): /hub home, education-admin, finance-vs-accounting, gamification/coupons mock, los endpoints `analayze-*` con typo. Borrar ~40% del código baja el costo de cada cambio futuro.
- **¿Qué automatizaría?** La verificación del contrato UI↔API. El bug de la invitación (UI manda `otherName`, API lee `name`, tests verdes) demuestra que los 518 tests prueban las piezas y no la máquina. Un e2e de los 4 flujos core en CI, corriendo contra preview en cada push. Sin eso, cada deploy es fe.
- **¿Qué reconstruiría?** Nada. El que reconstruye lo que se arregla con un carácter (`-getTimezoneOffset()`) no entiende de física de costos.
- **¿Qué parte es innecesaria?** El wizard de registro entero. La selección de plan dentro del registro. 128 anglicismos discutidos en comités imaginarios.
- **¿Qué parte es crítica?** La captura de outcomes (P0-4). Sin datos de "¿funcionó el mensaje?", Rowi es un generador de textos; con ellos, es el único dataset del mundo de intervenciones relacionales con resultado. Eso es lo único no-copiable.
- **¿Qué KPI revisaría cada mañana?** Tres números: loops diarios cerrados ayer · invitaciones aceptadas ayer · emails entregados/bounced. Hoy los tres son ciegos (sin analytics, cadena rota, DNS muerto). Inaceptable.
- **¿Qué cuello de botella atacaría primero?** El DNS de email. Es literalmente un registro TXT que bloquea password-reset, invitaciones y retención. 15 minutos de trabajo bloqueando el 100% del growth loop: el cuello de botella más barato que he visto.

### EL PLAN DE ELON PARA LOS PRÓXIMOS 90 DÍAS
**Días 1-7:** DNS + telemetría + analytics + los 8 P0 (son ~3 días de código). E2E de los 4 flujos en CI. **Días 8-30:** borrar las 250 páginas que sobran; medir el funnel; un solo objetivo: 100 personas cerrando el loop diario, cada una con ≥1 invitación enviada Y entregada. **Días 31-60:** iterar SOLO sobre lo que los 3 KPIs digan; cuota de tokens (el costo OpenAI sin tope es una bomba de relojería); primer cohorte de coaches usando el accelerator con clientes reales. **Días 61-90:** el flywheel de outcomes encendido (cada ECO con feedback), primer reporte de calibración Affinity v0→v0.1 con datos propios. Si el día 90 los 3 KPIs no crecen semana a semana, el problema no era el código.

---

## MODO SATYA NADELLA

- **¿Qué convertiría en plataforma?** El Knowledge Layer + la maquinaria Six Seconds (SEI→VS→pulse points→debrief) como API con consentimiento. Rowi no es una app: es el runtime operativo de una metodología que ya tiene 25 años de distribución global.
- **¿Qué convertiría en ecosistema?** Los coaches. No son un mercado: son el canal. Cada coach certificado Six Seconds que adopta Rowi trae 10-50 clientes B2C que jamás habrías adquirido con ads. El workspace de coach + el EQ Proposal Accelerator son la semilla correcta — hoy escondidos detrás de un sidebar superOnly (P1-26 del informe).
- **¿Qué integraciones construiría?** Las tres que ya están código-listo y apagadas (WhatsApp/Teams/Gmail — solo faltan credenciales) y después Slack. ECO entregando el mensaje DENTRO de la herramienta donde la conversación ocurre es la diferencia entre una app y una capa.
- **¿Qué vendería primero a empresas?** Vital Signs + el dashboard exec N≥5. La historia de privacidad estructural ("es imposible que un diario personal aparezca en un dashboard corporativo") es, bien contada, el mejor argumento enterprise del producto — la mayoría de HR-tech no puede decir eso.
- **¿Qué haría con los coaches?** Accelerator gratis 12 meses a cambio de casos de estudio y datos de calibración (consentidos). Revenue share en los clientes que traigan.
- **¿Qué haría con Six Seconds?** Formalizar lo que el libro ya insinúa (ROWIIA, cap. 16): Rowi como plataforma operativa oficial de la red Six Seconds. Exclusividad de datos de calibración a cambio de distribución en su red de practitioners. Esa alianza ES la empresa.

### EL PLAN ENTERPRISE DE ROWI
Fase 1 (Q3): 5 organizaciones piloto vía consultores Six Seconds — el consultor sube el SEI de la cohorte, entrega el informe con el Accelerator, la empresa ve el dashboard N≥5. Fase 2 (Q4): TP Hub como producto con asiento por empleado ($8-12/mes), ECO para managers ("la conversación difícil con tu reporte, bien dicha"). Fase 3 (2027): API del Knowledge Layer para HRIS (Workday/BambooHR), certificación "Rowi Inside" para consultoras. Regla de hierro en todo el camino: el dato individual jamás se vende; el agregado con consentimiento es el producto.

---

## MODO JENSEN HUANG

- **¿Dónde está el verdadero activo de datos?** No en los snapshots SEI (esos son de Six Seconds, replicables). Está en los **pares calibración**: inferencia→ground truth. Rowi ya descubrió el patrón con los pulse points (inferir → debrief OWN/CONSIDER/REJECT → pesos versionados). Ese patrón, aplicado a TODO, es la empresa.
- **¿Dónde está el verdadero moat?** El dataset longitudinal de práctica emocional con outcome: (estado → intervención → relación → resultado), con consentimiento, multi-idioma, anclado a un instrumento normado (SEI). No existe en el mundo. OpenAI no lo puede scrapear.
- **¿Qué dataset debería existir y todavía no existe?** Exactamente el que el P0-4 mantiene en cero filas: `(mensaje ECO, contexto de la díada, brecha Affinity, ¿funcionó?, nota)`. Cada día sin capturarlo es un día de moat regalado.
- **¿Qué datos acumularía obsesivamente?** (1) outcomes de ECO; (2) debriefs de Vital Signs (los 3 highlighters); (3) reflexiones↔evolución del avatar (privadas, agregables con consentimiento); (4) los check-ins VS-en-vivo que validan que el SEI no es clima (la memoria del proyecto ya lo sabe: Bancolombia). Y arreglaría HOY el P0-5 — un dataset con consentimiento defectuoso es un pasivo, no un activo.
- **¿Qué construiría antes de pensar en un Rowi LLM?** Tres cosas: el pipeline de datos consentido (export limpio, versionado, anonimizado), el **eval set** (200 casos dorados de "buen consejo ECO" juzgados por practitioners Six Seconds), y la telemetría de calidad (¿qué respuestas del guide se aceptan/rechazan?). Un LLM propio sin eval set es un gasto, no una estrategia.

### EL ROADMAP DE IA DE ROWI
**v0 (ya, semanas):** capturar todo (ECO outcomes, debriefs, feedback del guide) + consent real + cache IA. **v1 (meses):** pesos calibrados — Affinity v1 con datos propios, BE2GROW matrix v1; el "modelo" es regresión sobre ground truth, no deep learning, y eso está bien. **v2 (12-18 meses):** RAG sobre el Knowledge Layer (responder sin llamar a OpenAI el 60% de las veces — el plan ya existe en project_knowledge_layer). **v3 (cuando haya 100k+ outcomes):** fine-tune de un modelo abierto para ECO/Guide, evaluado contra el eval set, vendible como "el único modelo entrenado en práctica emocional real con outcomes". No antes.

---

## MODO REID HOFFMAN

- **¿Dónde está el efecto red?** En la díada. Rowi es de los pocos productos donde el valor unitario REQUIERE dos personas: la afinidad no existe en singular. Eso es estructuralmente mejor que el social graph de un feed — cada relación nueva crea valor para ambos lados y datos para el sistema.
- **¿Por qué todavía no existe?** Porque la tubería está rota en tres puntos físicos: la invitación devuelve 400 (P0-1), el email no se entrega (P0-10) y el token no vincula la relación al registrarse el invitado (Flujo D). No es un problema de diseño de incentivos — es plomería. La mejor noticia posible: los efectos de red rotos por plomería se arreglan con plomería.
- **¿Qué loop viral construiría?** El que ya está diseñado y nadie cableó: Pre-SEI → resultado → "¿Quieres ver tu BRECHA con alguien?" → esa persona hace SU pre-SEI (su propio WOW) → ambos ven la brecha → ambos crean cuenta para guardar la relación. El invitado no recibe spam: recibe su propio espejo. Coeficiente viral embebido en el core loop, no pegado encima.
- **¿Qué relación invitaría a otra relación?** ECO. Cada mensaje ECO enviado es un artefacto que el receptor nota ("esto me lo dijiste distinto"). El follow-up de outcome puede cerrar con: "¿Hay alguien más con quien quieras hablar así?" — y el mapa de la cohorte (mi pareja → mi jefe → mi madre) se va llenando solo.
- **¿Cómo convertiría Affinity en una red?** Dejando de pensarla como score y pensándola como **grafo**: cada díada aceptada es una arista con metadata viva (brecha, ECO usados, outcomes). A 3 aristas por usuario, el costo de irse de Rowi es perder el mapa de tus relaciones — el lock-in más humano posible.

### EL NETWORK EFFECT DE ROWI
Etapa 1 — *utility single-player* (hoy): el loop diario tiene que retener solo, sin red. Etapa 2 — *duos*: la brecha como momento compartido; meta: 1 invitación aceptada por usuario activo. Etapa 3 — *constelaciones*: la familia/equipo como unidad (los modelos FamilyRelation/EmployeeProfile ya existen); el agregado N≥5 hace que cada miembro nuevo mejore el espejo de todos. Etapa 4 — *red de practitioners*: coaches como super-nodos que conectan constelaciones. La regla de Hoffman: no pagues por usuarios hasta que la etapa 2 retenga; hoy el trabajo es 100% plomería de la etapa 2.

---

## MODO SEQUOIA CAPITAL

- **¿Invertirías?** Hoy, no — y no por la tesis sino por la legibilidad: cero métricas instrumentadas, la cadena core rota en prod, y concentración total en un solo founder-operator. En seed, con los P0 cerrados y 90 días de datos: sí miraríamos en serio.
- **¿Por qué?** Lo que nos entusiasma no es "app de bienestar con IA" (categoría muerta, CAC brutal, churn 90%): es (1) la alianza de distribución con una red global de practitioners ya existente (Six Seconds), (2) el dataset de outcomes relacionales que nadie más puede construir, (3) un producto B2B (consultor/VS) que financia el B2C mientras madura. Eso es un negocio raro de verdad.
- **¿Qué te preocupa?** Bus factor = 1 (Eduardo es founder, PM, dev y admin). La superficie (306 páginas, 498 endpoints) vs. la tracción (≈0 medible) — síntoma de construir en vez de vender. La dependencia de la marca Six Seconds sin acuerdo formal de plataforma. Y que el "WOW" prometido aún no ha sido visto funcionando por nadie de punta a punta.
- **¿Qué te entusiasma?** El Pre-SEI como motor de adquisición sin fricción; la honestidad metodológica (niveles, no puntajes; inferido vs. medido) que en esta categoría es diferenciador de confianza; el patrón de calibración de pulse points — eso es pensamiento de data-company, no de app.
- **¿Qué debes ver en 90 días?** La cadena viva (dos extraños: invitación → brecha → ECO → outcome registrado), 1.000 usuarios con el loop instrumentado, retención D7 > 25%, 10 coaches pagando, y el acuerdo Six Seconds por escrito.
- **¿En 12 meses?** D30 > 20% en la cohorte orgánica, 50k+ outcomes de ECO capturados, $25k+ MRR mezclando coach/B2B, y la primera prueba de que la calibración mejora resultados (Affinity v1 > v0 en datos propios).

**Probabilidad de USD 100M:** ~10% con foco y los P0 cerrados este mes (la distribución Six Seconds es lo que la sostiene; sin ese acuerdo, 4%).
**Probabilidad de USD 1B:** ~1.5% — requiere que el dataset de outcomes se vuelva el estándar de la categoría y eso tiene viento regulatorio y de plataforma en contra.
**Probabilidad de fracasar:** ~60% — la base rate de la categoría; lo que la baja no es más código: es retención medida y el canal de coaches encendido.

---

## MODO Y COMBINATOR

- **¿Cuál es la mentira que el equipo podría estar contándose?** *"Ya está construido — solo falta lanzar."* 518 tests verdes, 306 páginas, 6 sesiones de handoffs impecables… y el botón de invitar devuelve 400 desde hace semanas sin que nadie lo notara, porque **nadie real lo ha pulsado**. La métrica de progreso ha sido "features terminadas", no "personas que volvieron ayer". Esa es la mentira clásica, contada con tests verdes.
- **¿Cuál es la verdad incómoda?** Rowi todavía no tiene usuarios — tiene un creador. Todo lo auditado (los falsos éxitos mudos, la recompensa descartada, el email muerto) son cosas que el primer día de 10 usuarios reales habría gritado. El producto fue construido más rápido de lo que fue usado, y eso siempre se paga con esta factura exacta.
- **¿Qué harías durante los próximos 30 días?** Cosas que no escalan: cerrar los 8 P0 en la semana 1, y luego onboarding **manual** — 20 personas que Eduardo conoce (coaches del network Six Seconds, conocidos de Brain Up), sentándose con 5 de ellas a verlas usar el espejo, invitando él mismo a sus díadas, mirando los 3 números cada mañana. Hablar con usuarios > escribir código, 4:1.
- **¿Qué construirías?** Nada nuevo. Terminar: la recompensa visible al cerrar el día, el banner de outcome de ECO, el recordatorio nocturno. Tres cosas, todas ya diseñadas, todas a medio cablear.
- **¿Qué dejarías de construir?** Todo lo demás. EmoPower, education, enterprise modules, idiomas nuevos, features del backlog. Si la semana que viene aparece un feature nuevo en main antes de que 20 personas cierren el loop, el problema es disciplina, no producto.

---

## DECISIÓN FINAL DEL BOARD

Escuchados Jobs, Musk, Nadella, Huang, Hoffman, Sequoia y YC, el Board vota — **por unanimidad, 7-0:**

# ✅ FINISH

**Terminar los loops fundamentales antes de agregar cualquier funcionalidad.**

**Por qué exactamente esta y no otra:**
- No es **BUILD**: construir más es lo que produjo 306 páginas con la cadena core rota. El producto no necesita más; necesita que lo que hay **cierre**.
- No es **REPOSITION**: el posicionamiento ya es correcto y raro de bueno ("Sé quien quieres ser", niveles no puntajes, práctica diaria). Lo que falla no es la historia: es que el producto aún no la cumple. Reposicionar sería huir del trabajo real.
- No es **REBUILD**: tsc limpio, 518 tests, arquitectura de 4 implementada, loop diario completo server-side, Stripe cableado, capa legal seria. Las vigas están sanas; lo roto son costuras de horas.
- No es **PAUSE** ni **KILL**: hay una tesis defendible (práctica diaria + díadas + Six Seconds + dataset de outcomes), una ventana real (EQ Day, red de practitioners) y un costo de terminar ridículamente bajo comparado con lo invertido. Matar o pausar a 10 fixes del producto funcionando sería la peor decisión de capital posible.

FINISH significa, operativamente: **los 4 loops cerrados y medidos** — (1) loop diario con recompensa visible y recordatorio; (2) loop relacional: invitar→brecha→relación creada; (3) loop ECO: mensaje→entrega→outcome registrado; (4) loop de negocio: precio anunciado = cobrado = aplicado. Nada nuevo entra a main hasta que los cuatro cierren con usuarios reales delante.

---

## PREGUNTA FINAL — CEO por 30 días, USD 250.000, el equipo actual

Plan operativo real, día por día. Presupuesto asignado: $40k contratos (1 dev contractor senior 1 mes + 1 QA manual), $5k herramientas/infra (Sentry, PostHog, Resend pro, Vercel Pro), $15k diseño/video del espejo, $30k activación de coaches (talleres, revenue share seed), $20k legal (acuerdo Six Seconds, revisión privacidad), $140k reserva de runway (no se toca: 30 días no es el horizonte de gasto).

**Día 1 (lunes):** DNS de email (SPF/DKIM/MX, 1 hora) + activar Sentry desde admin + instalar PostHog con 5 eventos del funnel. Probar forgot-password contra un inbox real. *Al final del día: Rowi ve y habla.*
**Día 2:** Los 4 fixes quirúrgicos del core: timezone (1 carácter), payload de invitación (1 línea + error visible), preSeiToken en register, testimonios fuera de /for-you. Deploy.
**Día 3:** Consent real (canContributeToBenchmark en los 2 imports), pricing desde DB, recompensa visible al cerrar TODAY. Deploy.
**Día 4:** Verificación en vivo: dos cuentas reales (Eduardo + alguien de confianza) recorren TODA la cadena en producción. Cada eslabón que no cierre, se arregla ese mismo día.
**Día 5:** Registro a 1 paso (plan free implícito); destino post-auth unificado a /today; scroll del menú móvil + CTA registro móvil.
**Días 6-7:** E2E de los 4 flujos en CI (el contractor lo monta). Fin de semana: nadie toca main.
**Día 8:** Cron de recordatorio nocturno + banner de outcome en ECO + registrar "sent" en deep-links. *Los 4 loops cierran.*
**Días 9-10:** Onboarding manual de los primeros 10 usuarios reales (coaches conocidos de la red Six Seconds / Brain Up). Sesiones de 30 min mirándolos usar el espejo. Lista de fricciones, ordenada, sin código aún.
**Días 11-12:** Arreglar SOLO las 5 fricciones más repetidas de las sesiones. SEO de /pre-sei + redirect de vercel.app (antes de cualquier difusión).
**Día 13:** Reunión Six Seconds/Joshua: propuesta formal de "plataforma operativa de la red" — exclusividad de calibración por distribución. ($20k legal empieza aquí.)
**Día 14:** Revisión de los 3 KPIs (loops cerrados / invitaciones aceptadas / emails entregados). Primera semana con datos de verdad en la historia de la empresa.
**Días 15-18:** Cohorte 2: 25 usuarios más, mitad invitados POR los primeros 10 (probar el loop viral de la brecha). El QA manual recorre los 6 flujos en 4 idiomas y 380px; se arregla lo que sangre.
**Días 19-21:** Taller con 5 coaches: el Accelerator gratis 12 meses a cambio de casos y calibración. Objetivo: 3 coaches con 1 cliente real cada uno dentro de Rowi.
**Días 22-24:** Cuota de tokens IA (cerrar la bomba de costos) + microcopy de privacidad en Today/Becoming + redirect /settings/privacy. Las tres deudas de confianza restantes.
**Días 25-27:** Cohorte 3: 50 usuarios (ya con el Pre-SEI como CTA primario del hero — el cambio de jerarquía se hace aquí, con medición A/B simple). Primer email de lifecycle real.
**Día 28:** Corte de datos: D7 de la cohorte 1, aceptación de invitaciones, outcomes de ECO capturados. Se escribe en una página.
**Día 29:** Decisión basada en esa página: ¿el loop diario retiene solo (etapa 1 de Hoffman) o necesita la díada antes (etapa 2)? Esa respuesta ordena el trimestre siguiente.
**Día 30:** Informe al board: los 4 loops cerrados ✅/❌, 3 KPIs con tendencia, acuerdo Six Seconds en borrador, y la única slide que importa: **cuántas personas volvieron ayer sin que nadie se lo pidiera.**

Lo que NO se hace en estos 30 días: ningún feature nuevo, ningún módulo enterprise, ningún idioma nuevo, ningún rediseño, EmoPower congelado, cero ads. El dinero compra foco, no superficie.
