# Auditoría Digital Total — Rowi (rowiia.com)

> Auditoría estática de código + arquitectura + producto (2026-06). No
> incluye Lighthouse/CWV en vivo, pentest dinámico ni pruebas de lector de
> pantalla reales — donde no hay evidencia medible, se indica. Score global
> inicial: **61/100**.

## Scores

| Dimensión | Score |
|-----------|:-----:|
| UX | 62 |
| Conversión | 55 |
| Seguridad | 72 |
| SEO | 38 |
| Accesibilidad | 48 |
| Rendimiento | 63 |
| Producto | 72 |
| Diseño | 75 |
| **GENERAL** | **61** |

---

## 1. UX
- **Registro de 5 pasos** (Plan→Cuenta→Perfil→SEI→Confirmar) — fricción alta (grav. 9).
- **Propuesta de valor genérica** ("Know yourself better") — no se entiende a los 5s (7).
- **Producto sobre-extendido** (personal/RRHH/colegios/universidad/familia/research) (8).
- **Sin precios en el landing** (8). **Sin product analytics** — optimización a ciegas (9).
- Hero `min-h-[90vh]` empuja el CTA bajo el fold en móvil (6).

## 2. CRO
No-conversión por: precio oculto, registro largo, promesa difusa, **6 tiers** ($0/9.95/12/25/99/499). Desconfianza por: sin badges GDPR/seguridad, sin logos de clientes, testimonios poco verificables. Quick wins: precios en home, registro 2 pasos, Google arriba, lead magnet (test EQ 2 min). A/B: copy hero, 5 vs 2 pasos, precios visibles, 6 vs 3 tiers.

## 3. Seguridad
Sólida (headers completos, AES-256-GCM at rest, MFA TOTP, scope-aware admin, JWT rotado, sin SQLi/SSRF/open-redirect). Footguns:
- 🔴 **MFA firma con secreto hardcoded** si faltan envs (`src/lib/admin-mfa/edge.ts`) → bypass.
- 🟠 **CSRF permite si faltan Origin Y Referer** (`middleware.ts`).
- 🟠 **Rate-limit in-memory** por instancia (buckets IA = costo).
- 🟠 **`/api/invites`**: store en archivo JSON (no funciona en Vercel, probable código muerto) → triage.
- 🟡 CSP con `unsafe-inline`/`unsafe-eval`; `img-src https: http:` abierto.

## 4. Rendimiento
Cuellos atacados esta sesión: `/api/rowi` ~45–55 queries/mensaje (≈37 bloqueantes) → `after()`; `resolveAgent` colapsado; config cacheada; upsert atómico; índices. Pendiente: migrar `getServerAuthUser` (~85 call-sites), paginar `/api/admin/memberships`, **medir** (no hay baseline), bundle cliente (framer-motion + recharts). Correr Lighthouse en prod.

## 5. SEO (el más débil)
🔴 sin `sitemap.ts`/`robots.ts`, sin `metadataBase`, sin hreflang, páginas públicas en `"use client"` (no exportan metadata), `<html lang="es">` fijo, sin JSON-LD. hreflang real requiere routing i18n por URL (hoy el i18n es client-side) — proyecto aparte.

## 6. Accesibilidad — 48/100, no AA
Inputs sin `<label>`, sin `prefers-reduced-motion`, focus indicators débiles, contraste `gray-400`/`white/80`. Bien: HTML semántico, `aria-label` en icon-buttons, `next/image` con alt.

## 7. Producto
Diferenciado (Six Seconds, multi-hat, Vital Signs, agentes IA por scope) pero **sin foco** (6 frentes). Falta: validación BE2GROW v0→v1, analytics, un *wedge*. Roadmap IA: streaming, voz (Whisper), insights automáticos, RAG Six Seconds.

## 8. Diseño — 7.5/10
Tokens CSS, Varela Round + Poppins, `.rowi-btn-primary`, dark mode. Resta: exceso de animación, contraste, **marca ambivalente** (Rowi / Rowi SIA / ROWIIA).

## 9. Negocio
Monetización subutilizada. Nuevas líneas: B2B2C colegios (EmoPower), licencia de metodología a coaches, benchmarks como producto. Cross/upsell natural por el modelo multi-hat (persona→equipo→org). Joya: ventaja de datos del research lens.

## 10. Competencia
Directos: EQ-i 2.0, Genos, RocheMartin, Six Seconds (coopetición). Adyacentes: BetterUp, CoachHub, Modern Health. People analytics: Culture Amp, Lattice. SEL escolar: Panorama, Second Step. IA: Wysa, Woebot. Rowi gana en amplitud + metodología + datos; pierde en marca/distribución/foco de categoría.

## 11. Plan de acción
- **Críticos:** secreto MFA, CSRF, SEO (sitemap/robots/metadata), analytics.
- **Quick wins:** labels + focus-visible + reduced-motion, 3 tiers, badges, JSON-LD, unificar marca, Redis.
- **Estratégicas:** páginas públicas a Server Components, elegir wedge, cerrar BE2GROW v0→v1, lead nurturing.
- **Futuras:** streaming/voz IA, API pública, marketplace coaching, benchmarks producto.

---

### Estado de implementación (rama `claude/debug-performance-optimization-LknQH`)
- ✅ SEO: `sitemap.ts`, `robots.ts`, `metadataBase` + canonical + robots + Organization JSON-LD, Twitter `summary_large_image`.
- ✅ A11y: `prefers-reduced-motion` (CSS + `<MotionConfig reducedMotion="user">`), focus-visible global, `aria-label` en inputs de registro.
- ✅ Seguridad: secreto MFA sin fallback predecible; CSRF rechaza mutaciones sin Origin/Referer.
- ⏳ Pendiente (flag): `/api/invites` (triage — código muerto/FS), hreflang (requiere i18n por URL), contraste (verificación visual).
