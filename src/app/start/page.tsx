import { redirect } from "next/navigation";
import { getServerAuthUser } from "@/core/auth";

/**
 * Smart landing page for authenticated users.
 * Decides where to send them based on role:
 *   - SuperAdmin → /hub/admin/inventory
 *   - Has admin permissions in a tenant/hub/superhub → /org
 *   - Anyone else with a tenant assignment → /org
 *   - Otherwise → /dashboard
 *
 * Used as the default post-signin landing. Renders nothing — pure redirect.
 */
export default async function StartPage() {
  const user = await getServerAuthUser();

  if (!user) {
    redirect("/signin");
  }

  if (user.isSuperAdmin) {
    redirect("/hub/admin/inventory");
  }

  const permissions = (user.permissions as Array<{ scopeType?: string; role?: string }>) || [];
  const hasAdminScope = permissions.some((p) =>
    ["superhub", "tenant", "hub"].includes(p.scopeType || ""),
  );

  if (hasAdminScope || user.primaryTenant) {
    redirect("/org");
  }

  redirect("/dashboard");
}
