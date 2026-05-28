# Smoke Tests pre-lanzamiento Rowi

## ⚠️ Regresión conocida i18n

Durante la sesión que dejó la branch lista para lanzamiento, un proceso
externo (probablemente `git reset` o linter agresivo) revirtió las
adiciones de ~225 keys en `src/lib/i18n/locales/*.json`. Las keys están
referenciadas en código vía `t("key", "fallback ES")`, por lo que:

- **Usuarios ES**: no afectados — el fallback inline es el ES original.
- **Usuarios EN/PT/IT**: ven español en ~225 strings de páginas
  específicas (registro multi-paso, perfil settings, hub error page,
  invite landing, hub placeholder pages).

Lanzamiento es funcional para ES (mercado principal). Para no-ES users,
crear un sub-agente o restaurar manualmente las keys post-launch. Ver
`docs/I18N_REGRESSION.md` si se crea, o el commit history para
referencias.



Checklist a ejecutar manualmente después del deploy a `main` y antes de
anunciar el lanzamiento. Cubre tareas #22 (flujo E2E) y #23 (emails 4 idiomas).

## Prerequisitos

- Acceso a Vercel para confirmar env vars:
  - `NEXT_PUBLIC_APP_URL=https://www.rowiia.com`
  - `RESEND_API_KEY` válido (clave de prod)
  - `NEXT_PUBLIC_SENTRY_DSN` si querés telemetría client-side
  - `DATABASE_URL` apuntando a Neon pooled
- 4 cuentas de email reales (preferentemente +alias, e.g. `tu+es@gmail.com`).
- 1 cuenta admin (Eduardo) para crear tenant + invitar.

## Tarea #22 — Smoke E2E

### Perfil B2C (usuario individual)
1. Ir a `https://www.rowiia.com/register` en incognito.
2. Elegir plan **Personal** (cualquier slug B2C). Completar:
   - Email: `tu+es@gmail.com`
   - Password: 8+ chars
   - País + idioma ES
3. Tras envío esperar redirect a `/settings/profile` o `/dashboard`.
4. **Esperado**: email "Bienvenido a Rowi" llega en <1 minuto. CTA apunta a `https://www.rowiia.com/hub`.
5. Click en el botón → debe abrir `/hub` autenticado.
6. Click en "Vital Signs" → primera OVS. Completar al menos 1 medición.
7. **Esperado**: aterriza en results sin error.

### Perfil OAuth (Google)
1. Ir a `/register` en otra ventana incognito.
2. Elegir plan, click "Continuar con Google".
3. Aceptar permisos Google.
4. **Esperado**: aterriza en `/register/complete` con loader "Activando tu cuenta...".
5. Tras 2 segundos redirect automático a `/hub` (o `/onboarding` si plan paid).
6. Verificar que el plan elegido quedó asignado: ir a `/settings/billing` o `/hub/account`.

### Perfil Tenant (B2B)
1. Como Eduardo (SuperAdmin), ir a `/hub/admin/tenants` → "Nuevo tenant" → slug único.
2. Ir a `/hub/admin/users` → "Invitar". Email: `tu+en@gmail.com`.
3. **Esperado**: invite email llega. Subject en EN.
4. Abrir invite link en incognito (sin autenticar).
5. Click "Accept invitation".
6. **Esperado**: redirect a `/signin?callbackUrl=/invite/{token}`.
7. Login con la cuenta destinataria.
8. **Esperado**: vuelve a `/invite/{token}` → "🎉 Invitation accepted. Redirecting..." → `/hub` con membresía.

### Perfil Family
1. Desde cuenta B2C: ir a `/settings/family` → "Declarar familiar".
2. Email: `tu+pt@gmail.com`, relación: "partner".
3. **Esperado**: email de consent llega en PT. CTA apunta a `/settings/family`.
4. Login con la cuenta destinataria, abrir `/settings/family`.
5. Click "Aceitar" / "Aceptar".
6. **Esperado**: relación activa en ambos lados. `/hub/family/vital-signs` muestra al familiar (sin datos VS aún).

## Tarea #23 — Emails en 4 idiomas

Crear 4 cuentas de prueba con `preferredLang` distinto (vía SuperAdmin → editar User).

| Cuenta | Lang | Email |
|---|---|---|
| ES | `es` | `tu+es@gmail.com` |
| EN | `en` | `tu+en@gmail.com` |
| PT | `pt` | `tu+pt@gmail.com` |
| IT | `it` | `tu+it@gmail.com` |

Para cada uno, disparar:
- **Welcome email** (vía signup nuevo)
- **Invite email** (vía /hub/admin/users → invitar)
- **family.requested** (declarar familiar)
- **service.proposed** (declarar service provider)

**Verificar en cada email**:
- [ ] Subject está traducido al locale de la cuenta destino
- [ ] Body usa el idioma correcto
- [ ] "Six Seconds" aparece literal (no traducido)
- [ ] CTA link apunta a `https://www.rowiia.com/...` (no `localhost`)
- [ ] Variables como `{name}` / `${inviterName}` no se renderizan como "null" o "undefined"
- [ ] Para invite: expiry dice "14 días" (admin/users), "7 días" (community, family)

## Smoke check rápido sin auth

```bash
curl -sI https://www.rowiia.com/api/account/contexts | head -3
# Esperado: HTTP/2 401
```

## Si algo falla

1. Click en el error ID que aparece en `/hub/error.tsx` (ya implementado).
2. Revisar logs de Resend en su dashboard (filtrar por tag).
3. Logs de envío de email: buscar `[invite-email] sent to=` y `[context-notification] sent kind=` en Vercel logs.
4. Logs de slow queries Prisma (≥500ms): `prisma.slow_query`.
