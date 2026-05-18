# E2E Tests — Playwright

Browser-driven end-to-end tests. Optional; not part of the default
test run (jest skips this directory).

## Why Playwright separate from Jest

- The 213 jest tests cover unit + API integration. They run in <1s
  and need no external services.
- Playwright covers full browser flows: signin, NavBar context
  switcher writing the cookie, /org filtering by that cookie,
  dropdowns opening, etc. These need a running app and a real DOM.
- Keeping them separate means CI for unit/integration stays fast
  while E2E can be run on a slower nightly schedule.

## Setup (one-time)

```bash
pnpm add -D @playwright/test
npx playwright install chromium
```

## Running

Local dev (start `pnpm dev` in another terminal first):

```bash
pnpm exec playwright test
```

Against production (only @smoke tagged tests are safe for prod):

```bash
BASE_URL=https://www.rowiia.com pnpm exec playwright test --grep @smoke
```

Against a Vercel preview deployment:

```bash
BASE_URL=https://rowi-git-feature-branch.vercel.app pnpm exec playwright test --grep @smoke
```

## Test categories

| Tag | Auth | Side-effects | Safe in prod? |
| --- | --- | --- | --- |
| `@smoke` | none | none | ✅ |
| `@auth` | required | writes to test user only | ⚠️ test-user only |
| `@destructive` | required | writes broadly | ❌ never in prod |

`smoke.spec.ts` already has @smoke tests covering: landing renders,
signin reachable, the new contexts-model API routes return 401 to
anonymous clients.

## Adding new tests

Critical paths next on the list (not yet implemented — pure browser
work requires a test user account, defer until that's ready):

- **signin → /org → context switch via NavBar chip → /org reflects narrowed tenant**
- **POST /api/account/family from one user, accept from second user, owner sees consent badge**
- **Coach creates ServiceEngagement; client accepts; both sides see status="active"**

These would need a test user pair with stable credentials, which is
a separate operational decision (test database vs. seed in prod-shaped
preview).
