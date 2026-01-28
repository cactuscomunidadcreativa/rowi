// src/app/invite/page.tsx
import { getServerSession } from "next-auth";
import Link from "next/link";
import InviteActions from "@/components/invite/InviteActions";

export const dynamic = "force-dynamic";

export default async function InvitePage() {
  const session = await getServerSession();

  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    "http://localhost:3000";

  // Si ya generas tokens en tu API/DB, reemplaza por /invite/[token]
  // Por ahora: si hay sesión, usa ?ref=email; si no, link genérico a /signup
  const ref = session?.user?.email
    ? `?ref=${encodeURIComponent(session.user.email)}`
    : "";
  const inviteUrl = `${base}/signup${ref}`;

  return (
    <section className="mx-auto max-w-xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Invitar / Referir</h1>
      <p className="text-sm opacity-70">
        Comparte tu enlace para invitar a nuevas personas a Rowi.
      </p>

      {/* Pasamos SOLO datos (sin funciones) al componente cliente */}
      <InviteActions inviteUrl={inviteUrl} />

      {!session?.user?.email && (
        <p className="text-xs opacity-60">
          Consejo: inicia sesión para generar un enlace con tu referencia.
        </p>
      )}

      <div className="pt-2">
        <Link href="/community" className="text-sm underline">
          Volver a Community
        </Link>
      </div>
    </section>
  );
}