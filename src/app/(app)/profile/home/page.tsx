export const dynamic = "force-dynamic";
import { prisma } from "@/core/prisma";
import { getServerSession } from "next-auth";
import { getI18n } from "@/lib/i18n/getI18n";

export default async function ProfileHomePage() {
  const session = await getServerSession();
  const email = session?.user?.email ?? null;
  const { t } = await getI18n();

  if (!email) {
    return (
      <section className="space-y-4 p-6 max-w-5xl mx-auto">
        <h1 className="text-xl font-semibold">{t("panel.titleDemo")}</h1>
        <p className="text-sm opacity-70">{t("panel.loginPrompt")}</p>
        <div className="grid gap-3 md:grid-cols-3">
          <Card label={t("panel.progress")} value="72%" />
          <Card label={t("panel.suggestedActions")} value="3" />
          <Card label={t("panel.community")} value={`15 ${t("panel.members")}`} />
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
      <h1 className="text-xl font-semibold">{t("panel.title")}</h1>
      <p className="text-sm opacity-70">{t("panel.greeting")}, {user?.name ?? user?.email}</p>
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
