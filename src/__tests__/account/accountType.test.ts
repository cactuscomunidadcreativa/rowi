import { deriveAccountType, ACCOUNT_TYPE_META } from "@/lib/account/accountType";

describe("deriveAccountType", () => {
  it("returns 'superadmin' when isSuperAdmin is true regardless of other signals", () => {
    expect(
      deriveAccountType({
        isSuperAdmin: true,
        permissions: [],
        workspaceRoles: [],
      }),
    ).toBe("superadmin");

    // Even with no other signals
    expect(
      deriveAccountType({
        isSuperAdmin: true,
      }),
    ).toBe("superadmin");

    // Even when other signals would yield "pro" or "admin"
    expect(
      deriveAccountType({
        isSuperAdmin: true,
        permissions: [{ scopeType: "tenant", role: "admin" }],
        workspaceRoles: ["coach"],
      }),
    ).toBe("superadmin");
  });

  it("returns 'admin' for tenant-admin permission with the right role", () => {
    expect(
      deriveAccountType({
        permissions: [{ scopeType: "tenant", role: "admin" }],
      }),
    ).toBe("admin");

    expect(
      deriveAccountType({
        permissions: [{ scopeType: "hub", role: "owner" }],
      }),
    ).toBe("admin");

    expect(
      deriveAccountType({
        permissions: [{ scopeType: "superhub", role: "superhub-admin" }],
      }),
    ).toBe("admin");
  });

  it("returns 'admin' for any tenant/hub/superhub scope even without an admin-named role", () => {
    // The fallback "hasOrgScope" branch in deriveAccountType: any scope at
    // tenant/hub/superhub level promotes to admin.
    expect(
      deriveAccountType({
        permissions: [{ scopeType: "tenant", role: "editor" }],
      }),
    ).toBe("admin");
  });

  it("returns 'pro' for workspace roles like coach/consultant/mentor", () => {
    expect(deriveAccountType({ workspaceRoles: ["coach"] })).toBe("pro");
    expect(deriveAccountType({ workspaceRoles: ["consultant"] })).toBe("pro");
    expect(deriveAccountType({ workspaceRoles: ["mentor"] })).toBe("pro");
    expect(deriveAccountType({ workspaceRoles: ["hr_manager"] })).toBe("pro");
    expect(deriveAccountType({ workspaceRoles: ["team_leader"] })).toBe("pro");
  });

  it("returns 'pro' for workspace owner or admin role", () => {
    expect(deriveAccountType({ workspaceRoles: ["owner"] })).toBe("pro");
    expect(deriveAccountType({ workspaceRoles: ["admin"] })).toBe("pro");
  });

  it("workspace roles are case-insensitive", () => {
    expect(deriveAccountType({ workspaceRoles: ["COACH"] })).toBe("pro");
    expect(deriveAccountType({ workspaceRoles: ["Mentor"] })).toBe("pro");
  });

  it("returns 'free' for users with no signals", () => {
    expect(deriveAccountType({})).toBe("free");
    expect(deriveAccountType({ isSuperAdmin: false })).toBe("free");
    expect(
      deriveAccountType({
        permissions: [],
        workspaceRoles: [],
      }),
    ).toBe("free");
  });

  it("returns 'free' for unrecognized workspace roles", () => {
    expect(deriveAccountType({ workspaceRoles: ["member"] })).toBe("free");
    expect(deriveAccountType({ workspaceRoles: ["viewer"] })).toBe("free");
    expect(deriveAccountType({ workspaceRoles: ["coachee"] })).toBe("free");
  });

  it("handles permission with no scopeType (e.g. rowiverse-only) without crashing", () => {
    expect(
      deriveAccountType({
        permissions: [{ role: "admin" }],
      }),
    ).toBe("free");
  });

  it("hierarchy wins: superadmin > admin > pro > free", () => {
    expect(
      deriveAccountType({
        isSuperAdmin: false,
        permissions: [{ scopeType: "tenant", role: "admin" }],
        workspaceRoles: ["coach"],
      }),
    ).toBe("admin");
    expect(
      deriveAccountType({
        workspaceRoles: ["coach"],
      }),
    ).toBe("pro");
  });
});

describe("ACCOUNT_TYPE_META", () => {
  it("provides a home route for every account type", () => {
    expect(ACCOUNT_TYPE_META.free.home).toBe("/dashboard");
    expect(ACCOUNT_TYPE_META.pro.home).toBe("/workspace");
    expect(ACCOUNT_TYPE_META.admin.home).toBe("/org");
    expect(ACCOUNT_TYPE_META.superadmin.home).toBe("/hub/admin/inventory");
  });

  it("every type has a labelKey, fallback and gradient", () => {
    for (const t of ["free", "pro", "admin", "superadmin"] as const) {
      const meta = ACCOUNT_TYPE_META[t];
      expect(meta.labelKey).toMatch(/^account\.type\./);
      expect(meta.fallback).toBeTruthy();
      expect(meta.gradient).toMatch(/from-/);
    }
  });
});
