/**
 * Gate de rol (F6): /asesor es herramienta interna de asesoría. Mismo gate
 * que /ventas — la URL directa no verificaba rol (auditoría jun-2026, P2).
 */
import { redirect } from "next/navigation";
import { getServerAuthUser } from "@/core/auth";

const ALLOWED = new Set(["CONSULTANT", "COACH", "MENTOR", "HR", "ADMIN", "OWNER"]);

export default async function AsesorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getServerAuthUser();
  if (!auth) redirect("/signin");
  const role = (auth.organizationRole || "").toUpperCase();
  if (!auth.isSuperAdmin && !ALLOWED.has(role)) redirect("/today");
  return children;
}
