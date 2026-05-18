# Observability — Activation Guide

The codebase ships with telemetry wiring for both Sentry and Axiom.
Everything is **dormant by default**: no DSN/token in env → telemetry
mirrors to `secureLog` only, nothing leaves the box.

To activate, pick one provider, create the account, paste two env
vars in Vercel, and redeploy. No code changes required.

## What's already wired

| Piece | Status | Notes |
| --- | --- | --- |
| `src/lib/telemetry/index.ts` | ✅ shipped | `captureException`, `captureMessage`, lazy imports for both SDKs |
| `src/core/prisma.ts` middleware | ✅ shipped | Fans `prisma.query_failed` into `telemetry.captureException` |
| `sentry.client.config.ts` | ✅ shipped | Browser SDK init — no-op without `NEXT_PUBLIC_SENTRY_DSN` |
| `instrumentation.ts` | ✅ shipped | Server + edge SDK init — no-op without `SENTRY_DSN` |
| `@sentry/nextjs` dep | ✅ installed | v10.x in `package.json` |
| `@axiomhq/js` dep | ✅ installed | v1.x in `package.json` |
| Tests | ✅ 7 cases | `src/__tests__/telemetry/telemetry.test.ts` |

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

### 5. (Optional) Source maps for stack traces

To get readable stack traces in Sentry, install the source map
uploader:

```bash
pnpm add -D @sentry/cli
```

Then in Vercel env vars:

```
SENTRY_AUTH_TOKEN=<sentry-auth-token>
SENTRY_ORG=<your-org-slug>
SENTRY_PROJECT=rowi
```

And wrap `next.config.ts` with `withSentryConfig`. Skipped here
because it changes the build pipeline — do it once you're sure
you want Sentry long-term.

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
