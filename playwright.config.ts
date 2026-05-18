// playwright.config.ts
// ====================================================================
// Playwright is OPTIONAL for this repo — install with:
//   pnpm add -D @playwright/test
//   npx playwright install chromium
//
// Then run:
//   pnpm exec playwright test
//
// Without those steps this file is harmless — it's just config. The
// .ts file won't be loaded by jest (we ignore e2e/* in the jest
// config) and won't run in CI until Playwright is added to package.json.
// ====================================================================

import { defineConfig, devices } from "@playwright/test";

/**
 * Base URL the tests hit. Defaults to local dev; set BASE_URL env to
 * point at a deployed preview, staging, or even production for smoke
 * tests.
 *
 *   pnpm exec playwright test --grep @smoke   (run only smoke tests)
 *   BASE_URL=https://www.rowiia.com pnpm exec playwright test --grep @smoke
 */
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  // E2E flows can be slow — give them air.
  timeout: 60_000,
  expect: { timeout: 10_000 },

  // CI: fail fast and produce trace files for the failing tests.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: BASE_URL,
    // Capture trace + screenshot on first failure only (keeps disk usage sane).
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Don't trust self-signed certs in dev; tighten in CI.
    ignoreHTTPSErrors: !process.env.CI,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Add Firefox/WebKit projects later if cross-browser coverage matters.
  ],

  // No webServer block — we don't want Playwright to spin up `next dev`
  // automatically. Whoever runs the tests is responsible for having the
  // app reachable at BASE_URL. Cleaner separation, no port conflicts.
});
