/**
 * /team → redirect a /workspace (F6 · Rowi Launch 1.0).
 * La "vista de manager" era huérfana (cero links de entrada en la UI; el item
 * "team" del NavBar apunta a /workspace). Redirect en vez de superficie muerta.
 */
import { redirect } from "next/navigation";

export default function TeamRedirect() {
  redirect("/workspace");
}
