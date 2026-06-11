/**
 * /setup-organization → redirect a /org (F6 · Rowi Launch 1.0).
 * Página de alta de organización sin ningún link de entrada (huérfana desde
 * la auditoría jun-2026). El alta real vive en /org → "crear workspace".
 */
import { redirect } from "next/navigation";

export default function SetupOrganizationRedirect() {
  redirect("/org");
}
