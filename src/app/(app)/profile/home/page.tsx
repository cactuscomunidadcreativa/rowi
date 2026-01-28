export const dynamic = "force-dynamic";
import { prisma } from "@/core/prisma";
import { getServerSession } from "next-auth";

export default async function ProfileHomePage() {
  const session = await getServerSession();
  const email = session?.user?.email ?? null;

  if (!email) {
    return (
      <section className="space-y-4 p-6 max-w-5xl mx-auto">
        <h1 className="text-xl font-semibold">Mi Panel (Demo)</h1>
        <p className="text-sm opacity-70">Inicia sesión para ver tu panel personal.</p>
        <div className="grid gap-3 md:grid-cols-3">
          <Card label="Progreso" value="72%" />
          <Card label="Acciones sugeridas" value="3" />
          <Card label="Comunidad" value="15 miembros" />
        </div>
      </section>
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      eqSnapshots: {
        orderBy: { at: "desc" },
        take: 1
      }
    },
  });

  const latestEQ = user?.eqSnapshots?.[0];

  return (
    <section className="space-y-4 p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold">Mi Panel</h1>
      <p className="text-sm opacity-70">Hola, {user?.name ?? user?.email}</p>
      <div className="grid gap-3 md:grid-cols-3">
        <Card label="K" value={latestEQ?.K ?? "—"} />
        <Card label="C" value={latestEQ?.C ?? "—"} />
        <Card label="G" value={latestEQ?.G ?? "—"} />
      </div>
    </section>
  );
}

function Card({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs opacity-60">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
