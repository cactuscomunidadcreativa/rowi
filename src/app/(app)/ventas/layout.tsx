/**
 * Gate de rol (F6): /ventas es herramienta interna de venta. El NavBar ya la
 * filtraba por rol, pero la URL directa no verificaba nada (auditoría
 * jun-2026, P2) — cualquier autenticado podía usar el agente de ventas.
 */
import { redirect } from "next/navigation";
import { getServerAuthUser } from "@/core/auth";

const ALLOWED = new Set(["CONSULTANT", "COACH", "MENTOR", "HR", "ADMIN", "OWNER"]);

export default async function VentasLayout({
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
