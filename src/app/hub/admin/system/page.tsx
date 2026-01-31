import { redirect } from "next/navigation";

/**
 * Redirección: /hub/admin/system -> /hub/admin/system-health
 */
export default function SystemRedirectPage() {
  redirect("/hub/admin/system-health");
}
