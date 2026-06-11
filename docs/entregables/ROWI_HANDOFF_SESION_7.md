# HANDOFF — SESIÓN 7 → 8

**Fecha:** 2026-06-11 · **main:** `955b2d6` (todo pusheado y desplegado en prod, salvo verificación final del último build) · **tsc:** 0 errores · **tests:** 534/534 · **paridad i18n:** 7126/7126 en es/en/pt/it

---

## 1. QUÉ FUE ESTA SESIÓN (la más grande hasta ahora)

Arco completo: **auditoría total → plan maestro → 6 fases ejecutadas → testing real de Eduardo (F7) con 3 tandas de fixes → 6 deploys a producción.**

### a) Auditoría UX/producto total (multi-agente, verificación adversarial)
- 68 agentes, 114 hallazgos confirmados, 4 refutados. **10 P0**.
- Informe completo + scorecard + plan de remediación + anexo Board (decisión unánime: **FINISH**): `docs/entregables/AUDITORIA_UX_TOTAL_ROWI.md`.

### b) Plan vigente: `docs/entregables/ROWI_LAUNCH_1.0.md`
- Modelo: SÉ QUIEN QUIERES SER → MÍRATE/ELÍGETE/ACCIONA/ENTRÉGATE/IMPACTA (conceptual).
- **La nav UI se queda en TODAY·BECOMING·GUIDE·MORE** — los 5 verbos son copy/KPIs, no tabs.
- TODAY no se divide; BECOMING = memoria viva transversal (no etapa).
- **Migración a Google Cloud DESCARTADA** (decisión Eduardo) — Vercel+Neon+Resend se quedan.
- T3 apps móviles: PWA→Capacitor→stores (sw.js + PushManager ya existen; NO rewrite nativo).

### c) Fases ejecutadas (F1-F6 completas, commits `46dd226` y `9c132fe`)
- **F1**: los 8 P0 de código (timezone negado, invitación rota payload otherName/name, preSeiToken perdido, consent real con filterByConsent, testimonios fake fuera, plan pago nunca sin checkout, pricing desde DB con useDbPlans.ts, health endurecido con Bearer CRON_SECRET para el detalle).
- **F2**: registro REESCRITO a 1 paso (page.tsx ~300 líneas, viejo wizard de 1180 muerto) con términos enlazados + `User.termsAcceptedAt`; onboarding muestra snapshot existente; pre-sei prefetch+retry; SEO pre-sei; 308 vercel.app→rowiia.com (solo VERCEL_ENV=production); not-found.tsx + `KNOWN_FIRST_SEGMENTS` en middleware (⚠️ mantener al crear rutas top-level); hero fallback con espejo primario (**CMS de prod puede pisarlo — Eduardo debe invertir el hero en el CMS admin**).
- **F3**: recompensa visible al cerrar el día (res.reward) + errores visibles; 7 destinos post-auth → /today; cron `daily-reflection-reminder` (0 0 UTC); racha canónica en `src/lib/streak/updateDailyStreak.ts` (hitos 3/7/30/100); triggerAvatarEvolved conectado en checkAndEvolve; menú móvil con scroll + CTA registro; **sw.js + PushManager** (no-op sin NEXT_PUBLIC_VAPID_PUBLIC_KEY; pide permiso solo con racha≥1).
- **F4**: email de invitación real (kind `relationship.invited` en sendContextNotification) + campo email; /r/[token] muestra BRECHA (affinityAsGap, termómetro 0-3) + aviso ownerHasProfile; relToken→registro→`src/lib/relationships/claimInvite.ts` escribe dyad.otherUserId; ECO ?dyadId= end-to-end; deep-links registran "sent" (recordEcoSent crea thread si falta); CTA "Escríbele con ECO" por relación; integraciones honestas.
- **F5**: banner outcome en /eco + GET /api/eco/send (pendiente) + cron `eco-outcome-reminder` (48h); **cuota de tokens IA** en /api/rowi (402 contra plan.tokensMonthly, lee/escribe UserUsage per-user); allowAI gatea (403); /settings/privacy → redirect a /hub/account/privacy.
- **F6**: anti-IDOR consultor (`src/lib/consultant/benchmarkAccess.ts` en 6 endpoints + sidebar por capability); BECOMING i18n (competencies.*); limpieza (/me×7, UserActions, (app)/admin/ui, landing-old borrados; /team y /setup-organization redirects; gates server-side /studio /ventas /asesor + agente sales en /api/rowi; admin/tasks superOnly; gamification/coupons fuera del sidebar); copy humano (monitoreadas→acompañadas, HOT/WARM/COLD→Cercana/Tibia/Distante) + `privacy.contextNote` en TODAY/BECOMING.
- **Verificación positiva**: el 70/30 memoria viva (timeline real) y el avatar 40/60 (BECOMING_WEIGHT=0.6) **ya estaban implementados** de sesión 6 — no rehacer.

### d) Pedidos directos de Eduardo (post-fases, todos desplegados)
- **/demo renovado** (`a2a0ac6`): tour = producto real. 7 cards: Espejo (→/pre-sei VIVO), **TODAY jugable** (/demo/today: loop completo con recompensa y eclosión), **Mi evolución** (/demo/becoming), Mírate, Sintonía (termómetro, sin %), ECO (con paso de outcome), Tu Guía. Cadena Anterior/Siguiente completa.
- **Rotación de preguntas** (`c84c30d`): el espejo rota 3 redacciones por DÍA; el pulse rota redacción por ciclo de 8 días. El mini-SEI normado NO rota a propósito. Copy nuevo marcado PENDIENTE DE APROBACIÓN en `daily-pulse/questions.ts` y `pre-sei/questions.ts`.
- **Cuestionario unificado** (`0e5141f`): el espejo público = el Rowi Test del onboarding (mismos 8 stems intake + 4 preferencias). `PreSeiSession.preferences` (Json) → claim siembra CommunicationProfile. ⚠️ Los 12 ítems normados (Block A) son material LICENCIADO de Six Seconds — viven en env `ROWI_MINISEI_ITEMS` (pendiente), auth-only, JAMÁS públicos.
- **Social proof solo Six Seconds** (`9394445`): /for-you usa los casos Amadori/Komatsu/Business Case (claves forOrg.social.*). Los 3 testimonios de app inventados NO vuelven.
- **Nav sin dashboard** (`b74328e`): PublicNavbar "Dashboard"→"Mi día"(/today), item dashboard fuera del menú, ContextSwitcher y Google-login del chat → /today. La casa es TODAY.

### e) Fixes del testing real de Eduardo (F7, tandas 1-2: `7e5712e`, `955b2d6`)
1. /becoming contraste en NIVELES (fiveBand: 122→Experto; claves `seiBand.*`), no números.
2. /today mezcla EN/ES: la página leía localStorage crudo — ahora usa lang del I18nProvider.
3. Registro→/signin: carrera de navegación post-registro — ref `registering` + window.location.href.
4. Onboarding repetía el test: cascada ampliada (MiniSeiSnapshot → /api/becoming/contrast → WOW).
5. Polos de preferencias como tarjetas legibles 1–2/4–5 (MiniSeiWizard y PreSeiWizard).
6. /dashboard sin SEI: empty-state con camino de monetización (Rowi Test gratis → SEI → planes).
7. **BUG "siempre Rowi Cartografía"**: desempate de cuadrante con AMBAS ramas idénticas en `calculate.ts` — BALANCED nunca ocurría, empates los ganaba MAPA. Fix: top-segundo ≥3 → cuadrante, si no BALANCED. 3 tests de regresión (y el test viejo que fijaba el bug, corregido).
8. /demo/dashboard sin números (todo niveles); ROWI+ `seiIncluded: true` en plans.ts + copy 4 locales ("Evaluación SEI completa incluida"); /eco prod: mensaje con tarjeta violeta (estilo demo, primera pasada).
9. Crash de prod `/hub/admin/hr/vital-signs` con N<5 (`data?.scores.filter` sin `?.` en scores — la respuesta suprimida no trae scores). Blindado también en exec/health y admin/vital-signs (`8c778f3`).

---

## 2. DEPLOYS

6 pushes a main hoy; todos verificados en prod con smoke checks salvo el último: **`955b2d6` quedó compilando al cierre** — verificar que /demo/dashboard muestre niveles (no "112") y que el espejo dé "Equilibrado" con respuestas parejas. Smoke check estándar: health mínimo, pre-sei title, 404 real, 308 vercel.app, 401 contexts.

Schema (todo aditivo, propaga con el `db push` del build): `User.termsAcceptedAt`, `PreSeiSession.preferences`, enums `DAILY_REFLECTION_REMINDER` + `ECO_OUTCOME_REMINDER`.

---

## 3. PENDIENTES DE EDUARDO (bloquean features ya construidas)

1. **DNS de email** (LO MÁS URGENTE — pedido 5+ veces): Resend → Add Domain rowiia.com → pegar TXT SPF/DKIM/DMARC + MX en Vercel DNS → Verify. Sin esto: invitaciones, reset password, crons de email = muertos. (Ofrecido: crear el dominio vía API de Resend con la key del .env y entregarle la tabla.)
2. **Sentry + PostHog**: Sentry se activa en /hub/admin/settings (observability) + NEXT_PUBLIC_SENTRY_DSN en Vercel; PostHog requiere key (los 5 eventos del funnel están pendientes de instrumentar cuando haya key).
3. **VAPID keys** (push): `npx web-push generate-vapid-keys` → VAPID_PUBLIC_KEY/PRIVATE_KEY/SUBJECT + NEXT_PUBLIC_VAPID_PUBLIC_KEY en Vercel.
4. **CMS hero**: si la home de prod usa secciones de DB, invertir CTAs (espejo primario) en el admin CMS.
5. **ROWI_MINISEI_ITEMS** (12 ítems normados licenciados) + **DIRECT_URL** + **ROWI_VS_PULSE_MAP** + credenciales Twilio/Google/Teams (todo código-listo).
6. Revisar copy PENDIENTE DE APROBACIÓN: variantes de preguntas (pulse + espejo) y prompts intake.
7. Decisiones de fusión admin: finance vs accounting, education vs elearning.
8. Playwright E2E: sin instalar (~300MB) — es el seguro de los 4 flujos.

## 4. F7 RESTANTE (validación humana — el plan vive en ROWI_LAUNCH_1.0.md)

- La cadena completa con DOS cuentas reales en prod: registro → mini-SEI/WOW → invitar (con email una vez haya DNS) → /r/[token] → BRECHA → ECO → outcome.
- Checkout Stripe real (nunca ejecutado).
- Cohortes 10 → 25 + 5 coaches con el Accelerator.
- Los 3 KPIs diarios (ciegos hasta PostHog).

## 5. CONVENCIONES DE ESTA COLABORACIÓN (no escritas en CLAUDE.md)

- Eduardo trabaja en español; commits con trailer `Co-Authored-By: Claude Opus 4.7 (1M context)` (lo dice CLAUDE.md).
- Modo continuo: "terminas una fase y sigues a la que sigue". Commit+push directo está autorizado (cada push = deploy prod); verificar cada deploy con poll/smoke.
- Claves i18n SIEMPRE en los 4 locales (insertar alfabéticamente; archivos planos con claves con punto); verificar paridad con node tras cada inserción.
- Regla de marca dura: NIVELES, no puntajes/%; sintonía/BRECHA, jamás "compatibilidad"; "Tu Guía", no "Coach"; social proof solo evidencia Six Seconds.
- Patrón de verificación: tsc + suite completa + browser local (preview rowi-dev) + push + poll de prod en background.
