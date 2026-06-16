# Auditoría del Onboarding — Rowi

Fecha: 2026-06-15 · Alcance: registro → claim Pre-SEI → wizard (consent · mini-SEI ancla ·
manager · workspace) → aterrizaje en Today. Método: lectura de código + tests + verificación.

## Veredicto

El onboarding está **funcionalmente completo y razonablemente robusto**: el claim del Pre-SEI
está cubierto en los dos paths (credenciales + OAuth) con telemetry, el mini-SEI ancla maneja
errores explícitamente, y 52 tests de pre-sei/mini-sei pasan. Las cicatrices históricas
(preSeiToken perdido, WOW vacío) ya se cerraron.

**Pero hay 1 bug real de activación (P1) y 3 gaps que importan para el FINISH checklist.**
Ninguno bloquea al usuario hoy; el riesgo es que la **activación se rompe o no se mide** — y
"activación / conversión Registro→Today" es justo el North Star del FINISH.

---

## Hallazgos

### 🔴 P1 — `finishOnboarding` no espera el PATCH que marca ACTIVE (race condition)
`src/app/(app)/onboarding/page.tsx:193`
```js
function finishOnboarding() {
  persistOnboarding({ step: STEPS.length - 1, complete: true }); // fire-and-forget (.catch(()=>{}))
  router.push("/today");                                          // navega sin await
}
```
`persistOnboarding` (línea 179) hace `fetch(...).catch(()=>{})` — no devuelve la promesa — y
`finishOnboarding` navega a `/today` de inmediato. El PATCH que pone `onboardingStatus="ACTIVE"`
(`api/onboarding/route.ts:176`) puede no completar antes de que el navegador cambie de página.

**Impacto:** un usuario que TERMINÓ el onboarding puede quedarse en `REGISTERED` para siempre.
No lo bloquea (ningún guard usa `onboardingStatus`), pero **corrompe la métrica de activación**
(el dashboard de ventas cuenta `ACTIVE`, `api/admin/sales/dashboard/route.ts:66`) y deja al
usuario en un estado inconsistente.

**Fix:** hacer `persistOnboarding` devolver la promesa y `finishOnboarding` async con
`await` antes del `router.push`. Mantener un fallback (navegar igual si el PATCH falla, pero
después de intentarlo). ~5 líneas.

### 🟠 P2 — No hay guard por `onboardingStatus`: se puede saltar el wizard
`ConsentGate` (componente) solo rebota a `/onboarding` si falta `basic_processing`; **no mira
`onboardingStatus`**. Y ningún middleware lo usa. Un usuario que dio consent pero abandonó el
wizard a la mitad (o cuyo P1 falló) entra a `/today` y **nunca vuelve** al onboarding.

**Impacto:** onboarding incompleto invisible; el usuario no completa el ancla (mini-SEI/perfil)
y la experiencia post-login asume datos que no existen. Choca con el FINISH ("Today guía... el
usuario aterriza con su perfil").

**Fix (opciones):** (a) que `ConsentGate` (o un guard nuevo) rebote a `/onboarding` si
`onboardingStatus !== "ACTIVE"` para rutas de producto; o (b) aceptar que el onboarding es
"suave" y documentarlo. Decisión de producto — recomiendo (a) suave: solo rebota si falta el
ancla (mini-SEI), no por cada paso opcional.

### 🟠 P3 — Sin instrumentación de funnel en el onboarding (gap FINISH)
No hay `trackFunnel`/evento en `onboarding/page.tsx` ni en `api/onboarding`. El FINISH checklist
pide explícitamente medir **Pre-SEI → Registro → Today → activación** y un evento
`today_completed`. Hoy no se puede medir dónde caen los usuarios en el wizard.

**Fix:** emitir eventos en los hitos (registro, mini-SEI completado, onboarding completado) con
el helper de funnel ya existente (`src/domains/metrics/lib/funnel.ts`, el mismo `trackFunnel`
que usa ECO). ~1 línea por hito.

### 🟡 P4 — `ConsentGate` es fail-open ante fallo de red
`ConsentGate.tsx` (`.catch(() => setStatus("ok"))`): si `/api/account/consent` falla, deja pasar
sin verificar consentimiento. Defendible por UX (no bloquear por un 500 transitorio), pero un
fallo del endpoint abre el portón de consentimiento (privacidad/GDPR).

**Fix:** ante fallo, reintentar 1 vez antes de fail-open, y registrar `telemetry.captureMessage`
para que un consent-endpoint caído sea visible. Bajo riesgo; opcional.

---

## Lo que está BIEN (no tocar)

- **Claim del Pre-SEI**: cubierto en register (`route.ts:302`) y finalize-oauth (`:165`), con
  try/catch + telemetry no-fatal; idempotente (tests `pre-sei/claim.test.ts`). Sólido.
- **Mini-SEI ancla**: el submit comprueba `!res.ok || !json?.ok` explícitamente (cerró el bug del
  "WOW vacío"); GET con botón Reintentar; posiciones opacas (el mapeo item↔competencia no sale
  del servidor — moat preservado).
- **Errores enrutados a telemetry**: register, finalize-oauth, consent, mini-sei, onboarding —
  los swallowed-errors de los commits recientes ya están capturados.
- **Cascada del WOW** (`page.tsx:201`): si ya hay snapshot (Pre-SEI reclamado), muestra el WOW en
  vez de repetir el test — cerró el bug "me salió el mismo cuestionario".

## Prioridad sugerida
1. **P1** (5 líneas, alto valor: arregla la activación). 
2. **P3** (instrumentación funnel — desbloquea medir el FINISH).
3. **P2** (decisión de producto: ¿guard duro o suave?).
4. **P4** (opcional, hardening).
