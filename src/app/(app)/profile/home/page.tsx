export const dynamic = "force-dynamic";
import { prisma } from "@/core/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth";
import { getI18n } from "@/lib/i18n/getI18n";
import { getEvolutionState } from "@/services/avatar-evolution";
import { RowiStageImage, type RowiStage } from "@/domains/avatar/components/RowiStageImage";
import Link from "next/link";
import Image from "next/image";
import {
  Brain, Target, Heart, Sparkles, ArrowRight, TrendingUp, Calendar, Award,
  User, Clock, CheckCircle2, MessageCircle, Users, Edit, Loader2,
  Handshake, Rss
} from "lucide-react";

// Nombres descriptivos para las competencias EQ
const EQ_LABELS = {
  es: {
    K: { name: "Conocerse", desc: "Autoconocimiento emocional", icon: Brain, color: "#8B5CF6" },
    C: { name: "Elegirse", desc: "Autogestión y decisiones", icon: Target, color: "#06B6D4" },
    G: { name: "Entregarse", desc: "Conexión con otros", icon: Heart, color: "#EC4899" },
  },
  en: {
    K: { name: "Know Yourself", desc: "Emotional self-awareness", icon: Brain, color: "#8B5CF6" },
    C: { name: "Choose Yourself", desc: "Self-management & decisions", icon: Target, color: "#06B6D4" },
    G: { name: "Give Yourself", desc: "Connection with others", icon: Heart, color: "#EC4899" },
  }
};

// Función para verificar si el perfil está completo
function isProfileComplete(user: any): boolean {
  return !!(user?.name && user?.country && user?.language);
}

export default async function ProfileHomePage() {
  // Con authOptions para que la sesión (JWT) se resuelva igual que en el resto
  // de la app; sin ellos session.user venía incompleto → faltaban datos.
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const { t, lang } = await getI18n();
  const labels = EQ_LABELS[lang as keyof typeof EQ_LABELS] || EQ_LABELS.es;

  // Usuario no logueado
  if (!email) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-3">
            {t("profileHome.guestTitle", "Descubre tu Inteligencia Emocional")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t("profileHome.guestSubtitle", "Inicia sesión para ver tu perfil EQ y comenzar tu viaje de desarrollo emocional.")}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            {t("profileHome.signIn", "Iniciar sesión")}
            <ArrowRight className="w-4 h-4" />
          </Link>
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
      },
      plan: true,
      memberships: {
        include: { tenant: true },
        take: 5
      },
      _count: {
        select: {
          userChats: true,
        }
      }
    },
  });

  const latestEQ = user?.eqSnapshots?.[0];
  const hasEQ = latestEQ && (latestEQ.K || latestEQ.C || latestEQ.G);

  // Estado de evolución del avatar (la identidad Becoming: en quién te conviertes).
  let evo: Awaited<ReturnType<typeof getEvolutionState>> = null;
  if (user?.id) {
    try {
      evo = await getEvolutionState(user.id);
    } catch {
      evo = null;
    }
  }
  const profileComplete = isProfileComplete(user);
  const seiRequested = user?.seiRequested || false;
  const seiRequestedAt = user?.seiRequestedAt;

  // Social stats
  let socialStats = { connections: 0, activeGoals: 0, unreadMessages: 0 };
  if (user?.id) {
    const [connectionsCount, goalsCount] = await Promise.all([
      prisma.rowiRelation.count({
        where: {
          status: "active",
          OR: [{ initiatorId: user.id }, { receiverId: user.id }],
        },
      }).catch(() => 0),
      prisma.nobleGoal.count({
        where: {
          OR: [
            { authorId: user.id },
            { participants: { some: { userId: user.id } } },
          ],
          status: "active",
        },
      }).catch(() => 0),
    ]);
    socialStats = { connections: connectionsCount, activeGoals: goalsCount, unreadMessages: 0 };
  }

  // ============================================
  // ESTADO 1: Perfil incompleto - Invitar a completar
  // ============================================
  if (!profileComplete) {
    return (
      <section className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">
            {`${t("profileHome.greeting", "¡Hola")}${user?.name ? `, ${user.name}` : ""}!`}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t("profileHome.incompleteSubtitle", "Completa tu perfil para comenzar tu viaje de inteligencia emocional")}
          </p>
        </div>

        {/* CTA para completar perfil */}
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-8 mb-8 border border-amber-500/20">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
              <User className="w-12 h-12 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-bold mb-2">
                {t("profileHome.completeProfileTitle", "Completa tu perfil")}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t("profileHome.completeProfileDesc", "Necesitamos algunos datos básicos para personalizar tu experiencia en Rowi.")}
              </p>

              {/* Checklist */}
              <div className="flex flex-wrap gap-4 mb-4 text-sm">
                <div className={`flex items-center gap-2 ${user?.name ? "text-green-600" : "text-gray-400"}`}>
                  <CheckCircle2 className="w-4 h-4" />
                  {t("profileHome.fieldName", "Nombre")}
                </div>
                <div className={`flex items-center gap-2 ${user?.country ? "text-green-600" : "text-gray-400"}`}>
                  <CheckCircle2 className="w-4 h-4" />
                  {t("profileHome.fieldCountry", "País")}
                </div>
                <div className={`flex items-center gap-2 ${user?.language ? "text-green-600" : "text-gray-400"}`}>
                  <CheckCircle2 className="w-4 h-4" />
                  {t("profileHome.fieldLanguage", "Idioma")}
                </div>
              </div>

              <Link
                href="/settings/profile"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                <Edit className="w-4 h-4" />
                {t("profileHome.completeProfileCta", "Completar perfil")}
              </Link>
            </div>
          </div>
        </div>

        {/* Preview de lo que viene */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6">
          <h3 className="font-semibold mb-4 text-gray-500">
            {t("profileHome.nextSteps", "Próximos pasos")}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-400">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">1</div>
              <span className={profileComplete ? "line-through" : ""}>
                {t("profileHome.stepComplete", "Completar tu perfil")}
              </span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">2</div>
              <span>{t("profileHome.stepSei", "Tomar la evaluación SEI")}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">3</div>
              <span>{t("profileHome.stepEqProfile", "Descubrir tu perfil EQ")}</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ============================================
  // ESTADO 2: Perfil completo pero sin SEI (esperando activación)
  // ============================================
  if (!hasEQ) {
    return (
      <section className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">
            {`${t("profileHome.greeting", "¡Hola")}, ${user?.name || ""}!`}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t("profileHome.almostReady", "Tu perfil está casi listo")}
          </p>
        </div>

        {/* Estado de activación */}
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-8 mb-8 border border-blue-500/20">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shrink-0 relative">
              <Clock className="w-12 h-12 text-white" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-yellow-900 animate-spin" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-bold mb-2">
                {t("profileHome.activatingTitle", "Tu perfil está en proceso de activación")}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t("profileHome.activatingDesc", "Estamos procesando tus datos. Este proceso puede tomar hasta 48 horas. Te notificaremos cuando tu perfil EQ esté listo.")}
              </p>

              {seiRequestedAt && (
                <p className="text-sm text-gray-500 mb-4">
                  {t("profileHome.requestSent", "Solicitud enviada: ")}
                  {new Date(seiRequestedAt).toLocaleDateString(t("profileHome.dateLocale", "es-ES"), {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </p>
              )}

              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <Link
                  href="/rowi"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t("profileHome.meanwhileTalk", "Mientras tanto, habla con Rowi")}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Lo que podrás ver cuando esté listo */}
        <h3 className="font-semibold mb-4 text-gray-600 dark:text-gray-400">
          {t("profileHome.whenActiveYouSee", "Cuando tu perfil esté activo, verás:")}
        </h3>
        <div className="grid gap-4 md:grid-cols-3 opacity-60">
          {(["K", "C", "G"] as const).map((key) => {
            const info = labels[key];
            const Icon = info.icon;
            return (
              <div
                key={key}
                className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${info.color}20` }}
                >
                  <Icon className="w-6 h-6" style={{ color: info.color }} />
                </div>
                <h3 className="font-bold text-lg mb-1">{info.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{info.desc}</p>
                <div className="mt-4 h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full w-0 rounded-full" style={{ backgroundColor: info.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // ============================================
  // ESTADO 3: Usuario con datos SEI - Experiencia completa
  // ============================================
  const eqDate = latestEQ.at ? new Date(latestEQ.at).toLocaleDateString(t("profileHome.dateLocale", "es-ES"), {
    year: "numeric",
    month: "long",
    day: "numeric"
  }) : null;

  const chatCount = user?._count?.userChats || 0;
  const communityCount = user?.memberships?.length || 0;

  return (
    <section className="p-6 max-w-4xl mx-auto">
      {/* Identidad Becoming: el avatar = la cara de en quién te conviertes.
          El perfil ya no es un dashboard de settings — es identidad. */}
      <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
        {evo ? (
          <Link href="/becoming" className="shrink-0 group" title={t("profileHome.viewMyGrowth", "Ver mi evolución")}>
            <RowiStageImage stage={evo.currentStage as RowiStage} size="lg" float alt={user?.name || "Rowi"} />
          </Link>
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center overflow-hidden shrink-0">
            {user?.image ? (
              <Image src={user.image} alt={user.name || ""} width={80} height={80} className="object-cover" />
            ) : (
              <span className="text-3xl font-bold text-white">{user?.name?.charAt(0) || "R"}</span>
            )}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-1">{user?.name || ""}</h1>
          {evo && (
            <p className="text-sm font-medium text-[var(--rowi-g2)] mb-1">
              {evo.stageInfo.emoji} {lang === "es" ? evo.stageInfo.name.es : evo.stageInfo.name.en}
            </p>
          )}
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {latestEQ.brainStyle && (
              <span className="inline-flex items-center gap-1.5 mr-3">
                <Award className="w-4 h-4 text-purple-500" />
                {latestEQ.brainStyle}
              </span>
            )}
            {user?.country && <span>{user.country}</span>}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/becoming" className="flex items-center gap-1.5 text-[var(--rowi-g2)] font-medium hover:opacity-80 transition-opacity">
            <TrendingUp className="w-4 h-4" />
            {t("profileHome.myGrowth", "Mi evolución")}
          </Link>
          <Link href="/settings/profile" className="flex items-center gap-1.5 text-gray-500 hover:text-[var(--rowi-g2)] transition-colors">
            <Edit className="w-4 h-4" />
            {t("profileHome.edit", "Editar")}
          </Link>
        </div>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 text-center">
          <MessageCircle className="w-5 h-5 mx-auto mb-2 text-[var(--rowi-g2)]" />
          <div className="text-2xl font-bold">{chatCount}</div>
          <div className="text-xs text-gray-500">{t("profileHome.conversations", "Conversaciones")}</div>
        </div>
        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 text-center">
          <Users className="w-5 h-5 mx-auto mb-2 text-blue-500" />
          <div className="text-2xl font-bold">{communityCount}</div>
          <div className="text-xs text-gray-500">{t("profileHome.communitiesStat", "Comunidades")}</div>
        </div>
        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 text-center">
          <Calendar className="w-5 h-5 mx-auto mb-2 text-green-500" />
          <div className="text-sm font-medium">{eqDate?.split(" ").slice(0, 2).join(" ")}</div>
          <div className="text-xs text-gray-500">{t("profileHome.lastSei", "Último SEI")}</div>
        </div>
      </div>

      {/* Scores EQ */}
      <div className="mb-8">
        <h2 className="font-semibold mb-4">{t("profileHome.yourEqProfile", "Tu Perfil EQ")}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {(["K", "C", "G"] as const).map((key) => {
            const info = labels[key];
            const Icon = info.icon;
            const value = latestEQ[key];
            const percentage = value ? Math.min(value, 100) : 0;

            return (
              <div
                key={key}
                className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${info.color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: info.color }} />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold" style={{ color: info.color }}>
                      {value ?? "—"}
                    </div>
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-1">{info.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{info.desc}</p>
                <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: info.color,
                      width: `${percentage}%`
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/rowi"
          className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-[var(--rowi-g2)] transition-colors group"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-0.5">
              {t("profileHome.talkToRowi", "Hablar con Rowi")}
            </h3>
            <p className="text-sm text-gray-500">
              {t("profileHome.talkToRowiDesc", "Tu coach de inteligencia emocional")}
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[var(--rowi-g2)] transition-colors" />
        </Link>

        <Link
          href="/dashboard"
          className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-[var(--rowi-g2)] transition-colors group"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-0.5">
              {t("profileHome.viewDashboard", "Ver Dashboard")}
            </h3>
            <p className="text-sm text-gray-500">
              {t("profileHome.viewDashboardDesc", "Estadísticas y progreso")}
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[var(--rowi-g2)] transition-colors" />
        </Link>
      </div>

      {/* Mi Red Social */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">
            {t("profileHome.mySocialNetwork", "Mi Red Social")}
          </h2>
          <Link href="/social/feed" className="text-sm text-[var(--rowi-g2)] hover:underline">
            {t("profileHome.viewActivity", "Ver Actividad")} →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/social/feed"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-[var(--rowi-g2)] transition-colors text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Rss className="w-5 h-5 text-violet-500" />
            </div>
            <span className="text-sm font-medium">{t("profileHome.activity", "Actividad")}</span>
          </Link>
          <Link
            href="/social/connections"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-[var(--rowi-g2)] transition-colors text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Handshake className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-2xl font-bold">{socialStats.connections}</span>
            <span className="text-xs text-gray-500">{t("profileHome.connections", "Conexiones")}</span>
          </Link>
          <Link
            href="/social/messages"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-[var(--rowi-g2)] transition-colors text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-sm font-medium">{t("profileHome.messages", "Mensajes")}</span>
          </Link>
          <Link
            href="/social/goals"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-[var(--rowi-g2)] transition-colors text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-2xl font-bold">{socialStats.activeGoals}</span>
            <span className="text-xs text-gray-500">{t("profileHome.activeGoals", "Causas Activas")}</span>
          </Link>
        </div>
      </div>

      {/* Comunidades */}
      {user?.memberships && user.memberships.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold mb-4">{t("profileHome.yourCommunities", "Tus Comunidades")}</h2>
          <div className="flex flex-wrap gap-3">
            {user.memberships.map((m) => (
              <Link
                key={m.id}
                href={`/hub/${m.tenant.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-[var(--rowi-g2)] transition-colors text-sm"
              >
                <Users className="w-4 h-4 text-gray-400" />
                {m.tenant.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
