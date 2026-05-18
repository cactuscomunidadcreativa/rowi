# Observability — Activation Guide

The codebase ships with telemetry wiring for both Sentry and Axiom.
Everything is **dormant by default**: no DSN/token configured →
telemetry mirrors to `secureLog` only, nothing leaves the box.

You have **two ways to activate**, and you can mix them freely:

1. **Vercel env vars** (canonical). Required for browser-side Sentry
   init (the `NEXT_PUBLIC_SENTRY_DSN` must be in the build env so the
   client bundle embeds it). Read at boot.
2. **`/hub/admin/settings`** (UI, encrypted in DB). Reads from
   `SystemConfig` table (AES-256-GCM at rest). Picked up by the
   server-side telemetry adapter on the next request and cached for
   5 minutes. The adapter cache is **auto-invalidated** when you save
   an observability key from this UI, so changes take effect on the
   serving node immediately.

**Recommendation**: paste it in `/hub/admin/settings` first to try
it out (no redeploy needed for server-side capture), then put the
same values in Vercel env so browser-side and cold-start paths also
see them.

## What's already wired

| Piece | Status | Notes |
| --- | --- | --- |
| `src/lib/telemetry/index.ts` | ✅ shipped | `captureException`, `captureMessage`, lazy imports, DB-backed config cache |
| `src/core/prisma.ts` middleware | ✅ shipped | Fans `prisma.query_failed` into `telemetry.captureException` |
| `sentry.client.config.ts` | ✅ shipped | Browser SDK init — no-op without `NEXT_PUBLIC_SENTRY_DSN` env |
| `instrumentation.ts` | ✅ shipped | Server + edge SDK init — no-op without `SENTRY_DSN` env |
| `@sentry/nextjs` dep | ✅ installed | v10.x in `package.json` |
| `@axiomhq/js` dep | ✅ installed | v1.x in `package.json` |
| `SystemConfig` keys | ✅ shipped | `TELEMETRY_PROVIDER`, `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `AXIOM_TOKEN`, `AXIOM_DATASET`, `PRISMA_SLOW_QUERY_MS` |
| `/hub/admin/settings` UI | ✅ exists | New "observability" category auto-appears, with encrypted-at-rest values |
| Cache invalidation hook | ✅ shipped | `telemetry.refreshConfig()` called by `/api/admin/settings` POST/DELETE when an observability key changes |
| Tests | ✅ 7 cases | `src/__tests__/telemetry/telemetry.test.ts` |

---

## Quickest path (Sentry, in-app)

1. https://sentry.io/signup → Next.js project → copy DSN.
2. Go to `/hub/admin/settings` → "observability" section.
3. Paste:
   - `TELEMETRY_PROVIDER` = `sentry`
   - `SENTRY_DSN` = your DSN
   - `NEXT_PUBLIC_SENTRY_DSN` = same DSN (still needs to go in Vercel env for browser)
4. Click save. Server-side capture is now live.
5. For browser-side captures, also paste the DSN in Vercel env as
   `NEXT_PUBLIC_SENTRY_DSN`. Redeploy.

That's it. No code changes, no install, no env-only redeploy required
for the server path.

---

## Option A — Sentry

### 1. Create the project

1. Sign up at https://sentry.io/signup (GitHub login works).
2. Create a project: **Next.js** platform, name `rowi`.
3. Copy the DSN: `https://abc123@o4509xxx.ingest.us.sentry.io/4509xxx`.

Plan: start on **Free** (5K errors/month). Upgrade to Team ($26/mo)
only when you want Performance + 50K errors.

### 2. Set Vercel env vars

In Vercel project settings → **Environment Variables** (scope:
Production + Preview):

```
SENTRY_DSN=https://abc123@o4509xxx.ingest.us.sentry.io/4509xxx
NEXT_PUBLIC_SENTRY_DSN=https://abc123@o4509xxx.ingest.us.sentry.io/4509xxx
TELEMETRY_PROVIDER=sentry
```

Yes, the same DSN goes in both `SENTRY_DSN` (used by server +
instrumentation.ts) and `NEXT_PUBLIC_SENTRY_DSN` (used by
sentry.client.config.ts; the `NEXT_PUBLIC_` prefix is required for
the browser bundle).

### 3. Redeploy

```bash
git commit --allow-empty -m "chore(deploy): bump for Sentry env vars"
git push origin main
```

Or click **Redeploy** in Vercel.

### 4. Verify

After deploy, force an error:

```bash
curl -X POST https://www.rowiia.com/api/admin/nonexistent
```

Within ~30 seconds it should appear in https://sentry.io under the
`rowi` project.

### 5. Source maps for stack traces (already wired)

`next.config.ts` is already wrapped with `withSentryConfig`. The
wrapper is **inert by default** — it only uploads source maps when
all four of these env vars are present at build time:

```
SENTRY_AUTH_TOKEN=<auth-token-from-sentry>
SENTRY_ORG=<your-org-slug>
SENTRY_PROJECT=rowi
SENTRY_DSN=<your-dsn>
```

Get the auth token at https://sentry.io → Settings → Account →
**Auth Tokens** → Create new token. Scope: `project:releases`.

Set those in Vercel env (Production scope), redeploy, and the next
build will upload source maps automatically. Stack traces in Sentry
UI become readable file paths instead of `main-abc123.js:1:8451`.

`hideSourceMaps: true` is set so the maps don't ship publicly — only
Sentry receives them.

---

## Option B — Axiom

### 1. Create the dataset

1. Sign up at https://app.axiom.co/register.
2. **Settings → API Tokens → Generate Token**, role: **Ingest**.
3. Copy the token (`xaat-xxxxxx`).
4. **Datasets → New Dataset**, name: `rowi_errors`.

Plan: free tier 0.5 GB/month is plenty for errors. The $25/mo
Personal Pro opens 100 GB if you also want all Vercel logs there.

### 2. Set Vercel env vars

```
AXIOM_TOKEN=xaat-xxxxxxxxxxxxxxxxxxxx
AXIOM_DATASET=rowi_errors
TELEMETRY_PROVIDER=axiom
```

### 3. Redeploy

Same as Sentry — push an empty commit or hit Redeploy.

### 4. (Bonus) Vercel logs → Axiom automatically

Axiom has a one-click Vercel integration:

1. In Axiom dashboard → **Apps → Vercel → Connect**.
2. Authorize in Vercel.

All function + edge logs now land in Axiom alongside our app's own
events. SQL-style queries across everything.

### 5. Verify

After deploy, in Axiom:

```sql
['rowi_errors']
| limit 20
```

Should show events flowing in within a minute of any error.

---

## How to switch providers later

The adapter reads `TELEMETRY_PROVIDER` at request time. To switch:

1. Update the three env vars in Vercel.
2. Redeploy.

No code changes. The lazy imports in `src/lib/telemetry/index.ts`
will branch to the right SDK on the next request.

To go back to "log only" (no SaaS backend), set
`TELEMETRY_PROVIDER=log_only` or just leave it unset and remove
the DSN. The adapter falls back to `secureLog` only.

## What gets sent

Every call into `telemetry.captureException` / `captureMessage`
attaches:

```
env       — process.env.NODE_ENV ("production" / "development")
deploy    — VERCEL_GIT_COMMIT_SHA (first 7 chars) or package version
region    — VERCEL_REGION ("iad1", "fra1", ...)
signature — stack-trace fingerprint for grouping
```

Callers add their own context (route, userId, model name, etc.)
on top. The adapter never throws — telemetry failures degrade to a
single `telemetry.forward_failed` warn log.

## Cost guard

A single Rowi request that throws will produce one Sentry event
(or one Axiom ingest). The slow-query middleware in
`src/core/prisma.ts` also fires `telemetry.captureException` per
failed query, NOT per slow query (those go through `secureLog.warn`
only — Sentry/Axiom don't see them by default).

If you want slow queries in Sentry too, add a
`telemetry.captureMessage("prisma.slow_query", { ... })` call
inside the `if (elapsed >= SLOW_QUERY_MS)` branch in
`src/core/prisma.ts`. Watch the quota when you do — slow queries
can be high-volume.
