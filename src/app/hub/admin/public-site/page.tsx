import { redirect } from "next/navigation";

/**
 * Redirección: /hub/admin/public-site -> /hub/admin/public-pages
 */
export default function PublicSiteRedirectPage() {
  redirect("/hub/admin/public-pages");
}
