/**
 * /relationships se fusionó en Comunidad: las relaciones ahora viven en la
 * pestaña "Relaciones" de /community (con edición de cercanía). Esta ruta queda
 * como redirect para bookmarks/links viejos.
 */
import { redirect } from "next/navigation";

export default function RelationshipsRedirect() {
  redirect("/community?tab=relationships");
}
