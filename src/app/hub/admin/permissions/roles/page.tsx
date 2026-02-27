import { redirect } from "next/navigation";

/**
 * Redirect to the unified Roles & Permissions page.
 * The old /hub/admin/permissions/roles is now merged into /hub/admin/roles.
 */
export default function PermissionsRolesRedirect() {
  redirect("/hub/admin/roles");
}
