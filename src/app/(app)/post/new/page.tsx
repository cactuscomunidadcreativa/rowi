import { redirect } from "next/navigation";

/**
 * /post/new era una pantalla "Próximamente". El composer real para crear y
 * publicar posts vive en /social/feed (DB-backed). Redirigimos ahí para que
 * "Crear post" funcione de verdad desde cualquier punto de entrada.
 */
export default function NewPostRedirect() {
  redirect("/social/feed");
}
