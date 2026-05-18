/**
 * Smoke tests — verify the deployed app is alive and basic public
 * routes respond. Tag every test with @smoke so a `--grep @smoke`
 * run can hit production safely.
 *
 * No auth, no test database, no fixtures. Pure HTTP checks plus a
 * couple of DOM assertions on the landing page.
 *
 * Run against prod:
 *   BASE_URL=https://www.rowiia.com pnpm exec playwright test --grep @smoke
 */

import { expect, test } from "@playwright/test";

test.describe("public smoke @smoke", () => {
  test("landing renders the Rowi gradient logo", async ({ page }) => {
    await page.goto("/");
    // We don't lock onto specific copy because i18n could flip it;
    // the gradient-text class on the brand is stable.
    await expect(page.locator(".rowi-gradient-text").first()).toBeVisible();
  });

  test("signin page reachable", async ({ page }) => {
    const res = await page.goto("/signin");
    expect(res?.status() ?? 200).toBeLessThan(400);
    // There should be at least one email/password input.
    await expect(page.locator("input[type='email'], input[name='email']").first()).toBeVisible();
  });

  test("private API endpoints respond 401 when unauthenticated @smoke", async ({ request }) => {
    // The contexts-model surface we built this session — confirms
    // routes exist and the auth gate is wired.
    const routes = [
      "/api/auth/me",
      "/api/account/contexts",
      "/api/account/family",
      "/api/account/services",
      "/api/team/summary",
      "/api/org/summary",
    ];
    for (const path of routes) {
      const r = await request.get(path, {
        failOnStatusCode: false,
        maxRedirects: 0,
      });
      // 401 is what we want; some routes might 307→/signin which is
      // also valid for unauthenticated GETs.
      expect([401, 307, 302]).toContain(r.status());
    }
  });

  test("admin orphan-members API requires auth @smoke", async ({ request }) => {
    const r = await request.get("/api/admin/community-members/orphans", {
      failOnStatusCode: false,
      maxRedirects: 0,
    });
    expect([401, 403, 307]).toContain(r.status());
  });
});
