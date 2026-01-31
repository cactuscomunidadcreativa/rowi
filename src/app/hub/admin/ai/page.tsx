import { redirect } from "next/navigation";

/**
 * Redirección: /hub/admin/ai -> /hub/admin/agents
 */
export default function AiRedirectPage() {
  redirect("/hub/admin/agents");
}
