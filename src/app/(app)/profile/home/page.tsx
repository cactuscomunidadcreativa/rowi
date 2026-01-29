export const dynamic = "force-dynamic";
import { prisma } from "@/core/prisma";
import { getServerSession } from "next-auth";
import { getI18n } from "@/lib/i18n/getI18n";
import Link from "next/link";
import Image from "next/image";
import {
  Brain, Target, Heart, Sparkles, ArrowRight, TrendingUp, Calendar, Award,
  User, Clock, CheckCircle2, MessageCircle, Users, Edit, Loader2
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
  const session = await getServerSession();
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
            {lang === "es" ? "Descubre tu Inteligencia Emocional" : "Discover your Emotional Intelligence"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {lang === "es"
              ? "Inicia sesión para ver tu perfil EQ y comenzar tu viaje de desarrollo emocional."
              : "Sign in to see your EQ profile and start your emotional development journey."}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            {lang === "es" ? "Iniciar sesión" : "Sign in"}
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
          rowiChats: true,
        }
      }
    },
  });

  const latestEQ = user?.eqSnapshots?.[0];
  const hasEQ = latestEQ && (latestEQ.K || latestEQ.C || latestEQ.G);
  const profileComplete = isProfileComplete(user);
  const seiRequested = user?.seiRequested || false;
  const seiRequestedAt = user?.seiRequestedAt;

  // ============================================
  // ESTADO 1: Perfil incompleto - Invitar a completar
  // ============================================
  if (!profileComplete) {
    return (
      <section className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">
            {lang === "es" ? `¡Hola${user?.name ? `, ${user.name}` : ""}!` : `Hello${user?.name ? `, ${user.name}` : ""}!`}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {lang === "es"
              ? "Completa tu perfil para comenzar tu viaje de inteligencia emocional"
              : "Complete your profile to start your emotional intelligence journey"}
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
                {lang === "es" ? "Completa tu perfil" : "Complete your profile"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {lang === "es"
                  ? "Necesitamos algunos datos básicos para personalizar tu experiencia en Rowi."
                  : "We need some basic information to personalize your Rowi experience."}
              </p>

              {/* Checklist */}
              <div className="flex flex-wrap gap-4 mb-4 text-sm">
                <div className={`flex items-center gap-2 ${user?.name ? "text-green-600" : "text-gray-400"}`}>
                  <CheckCircle2 className="w-4 h-4" />
                  {lang === "es" ? "Nombre" : "Name"}
                </div>
                <div className={`flex items-center gap-2 ${user?.country ? "text-green-600" : "text-gray-400"}`}>
                  <CheckCircle2 className="w-4 h-4" />
                  {lang === "es" ? "País" : "Country"}
                </div>
                <div className={`flex items-center gap-2 ${user?.language ? "text-green-600" : "text-gray-400"}`}>
                  <CheckCircle2 className="w-4 h-4" />
                  {lang === "es" ? "Idioma" : "Language"}
                </div>
              </div>

              <Link
                href="/settings/profile"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                <Edit className="w-4 h-4" />
                {lang === "es" ? "Completar perfil" : "Complete profile"}
              </Link>
            </div>
          </div>
        </div>

        {/* Preview de lo que viene */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6">
          <h3 className="font-semibold mb-4 text-gray-500">
            {lang === "es" ? "Próximos pasos" : "Next steps"}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-400">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">1</div>
              <span className={profileComplete ? "line-through" : ""}>
                {lang === "es" ? "Completar tu perfil" : "Complete your profile"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">2</div>
              <span>{lang === "es" ? "Tomar la evaluación SEI" : "Take the SEI assessment"}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">3</div>
              <span>{lang === "es" ? "Descubrir tu perfil EQ" : "Discover your EQ profile"}</span>
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
            {lang === "es" ? `¡Hola, ${user?.name || ""}!` : `Hello, ${user?.name || ""}!`}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {lang === "es"
              ? "Tu perfil está casi listo"
              : "Your profile is almost ready"}
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
                {lang === "es" ? "Tu perfil está en proceso de activación" : "Your profile is being activated"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {lang === "es"
                  ? "Estamos procesando tus datos. Este proceso puede tomar hasta 48 horas. Te notificaremos cuando tu perfil EQ esté listo."
                  : "We're processing your data. This can take up to 48 hours. We'll notify you when your EQ profile is ready."}
              </p>

              {seiRequestedAt && (
                <p className="text-sm text-gray-500 mb-4">
                  {lang === "es" ? "Solicitud enviada: " : "Request sent: "}
                  {new Date(seiRequestedAt).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
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
                  {lang === "es" ? "Mientras tanto, habla con Rowi" : "Meanwhile, talk to Rowi"}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Lo que podrás ver cuando esté listo */}
        <h3 className="font-semibold mb-4 text-gray-600 dark:text-gray-400">
          {lang === "es" ? "Cuando tu perfil esté activo, verás:" : "When your profile is active, you'll see:"}
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
  const eqDate = latestEQ.at ? new Date(latestEQ.at).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }) : null;

  const chatCount = user?._count?.rowiChats || 0;
  const communityCount = user?.memberships?.length || 0;

  return (
    <section className="p-6 max-w-4xl mx-auto">
      {/* Header con avatar */}
      <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center overflow-hidden">
          {user?.image ? (
            <Image src={user.image} alt={user.name || ""} width={80} height={80} className="object-cover" />
          ) : (
            <span className="text-3xl font-bold text-white">{user?.name?.charAt(0) || "R"}</span>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-1">{user?.name || ""}</h1>
          <p className="text-gray-600 dark:text-gray-400">
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
          <Link href="/settings/profile" className="flex items-center gap-1.5 text-gray-500 hover:text-[var(--rowi-g2)] transition-colors">
            <Edit className="w-4 h-4" />
            {lang === "es" ? "Editar" : "Edit"}
          </Link>
        </div>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 text-center">
          <MessageCircle className="w-5 h-5 mx-auto mb-2 text-[var(--rowi-g2)]" />
          <div className="text-2xl font-bold">{chatCount}</div>
          <div className="text-xs text-gray-500">{lang === "es" ? "Conversaciones" : "Conversations"}</div>
        </div>
        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 text-center">
          <Users className="w-5 h-5 mx-auto mb-2 text-blue-500" />
          <div className="text-2xl font-bold">{communityCount}</div>
          <div className="text-xs text-gray-500">{lang === "es" ? "Comunidades" : "Communities"}</div>
        </div>
        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 text-center">
          <Calendar className="w-5 h-5 mx-auto mb-2 text-green-500" />
          <div className="text-sm font-medium">{eqDate?.split(" ").slice(0, 2).join(" ")}</div>
          <div className="text-xs text-gray-500">{lang === "es" ? "Último SEI" : "Last SEI"}</div>
        </div>
      </div>

      {/* Scores EQ */}
      <div className="mb-8">
        <h2 className="font-semibold mb-4">{lang === "es" ? "Tu Perfil EQ" : "Your EQ Profile"}</h2>
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
              {lang === "es" ? "Hablar con Rowi" : "Talk to Rowi"}
            </h3>
            <p className="text-sm text-gray-500">
              {lang === "es" ? "Tu coach de inteligencia emocional" : "Your emotional intelligence coach"}
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
              {lang === "es" ? "Ver Dashboard" : "View Dashboard"}
            </h3>
            <p className="text-sm text-gray-500">
              {lang === "es" ? "Estadísticas y progreso" : "Statistics and progress"}
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[var(--rowi-g2)] transition-colors" />
        </Link>
      </div>

      {/* Comunidades */}
      {user?.memberships && user.memberships.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold mb-4">{lang === "es" ? "Tus Comunidades" : "Your Communities"}</h2>
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
