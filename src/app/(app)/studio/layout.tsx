/**
 * Gate del Sanity Studio (F6 · Rowi Launch 1.0): antes CUALQUIER usuario
 * logueado podía abrir /studio (solo lo cubría el useSession del grupo (app)
 * — auditoría jun-2026, P2 navegación). El CMS es superficie de plataforma.
 */
import { redirect } from "next/navigation";
import { getServerAuthUser } from "@/core/auth";

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getServerAuthUser();
  if (!auth) redirect("/signin");
  if (!auth.isSuperAdmin) redirect("/today");
  return children;
}
