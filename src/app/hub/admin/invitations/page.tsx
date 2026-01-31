import { redirect } from "next/navigation";

/**
 * Redirección: /hub/admin/invitations -> /hub/admin/invites
 */
export default function InvitationsRedirectPage() {
  redirect("/hub/admin/invites");
}
