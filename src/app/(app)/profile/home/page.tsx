export const dynamic = "force-dynamic";
import { prisma } from "@/core/prisma";
import { getServerSession } from "next-auth";
import { getI18n } from "@/lib/i18n/getI18n";
import Link from "next/link";
import { Brain, Target, Heart, Sparkles, ArrowRight, TrendingUp, Calendar, Award } from "lucide-react";

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
    },
  });

  const latestEQ = user?.eqSnapshots?.[0];
  const hasEQ = latestEQ && (latestEQ.K || latestEQ.C || latestEQ.G);

  // Usuario sin resultados EQ
  if (!hasEQ) {
    return (
      <section className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">
            {lang === "es" ? `¡Hola, ${user?.name || ""}!` : `Hello, ${user?.name || ""}!`}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {lang === "es"
              ? "Bienvenido a tu espacio de desarrollo emocional"
              : "Welcome to your emotional development space"}
          </p>
        </div>

        {/* CTA para tomar el SEI */}
        <div className="bg-gradient-to-br from-[var(--rowi-g1)]/10 to-[var(--rowi-g2)]/10 rounded-2xl p-8 mb-8 border border-[var(--rowi-g2)]/20">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center shrink-0">
              <Brain className="w-12 h-12 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-bold mb-2">
                {lang === "es" ? "Descubre tu perfil emocional" : "Discover your emotional profile"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {lang === "es"
                  ? "Completa la evaluación SEI (Six Seconds Emotional Intelligence) para obtener tu perfil EQ personalizado y comenzar tu desarrollo."
                  : "Complete the SEI (Six Seconds Emotional Intelligence) assessment to get your personalized EQ profile and start your development."}
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <Link
                  href="/rowi"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  <Sparkles className="w-4 h-4" />
                  {lang === "es" ? "Hablar con Rowi" : "Talk to Rowi"}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Preview de las 3 áreas */}
        <div className="grid gap-4 md:grid-cols-3">
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
                <p className="text-xs text-gray-400 mt-2">
                  {lang === "es" ? "Pendiente de evaluación" : "Pending assessment"}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // Usuario con resultados EQ
  const eqDate = latestEQ.at ? new Date(latestEQ.at).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }) : null;

  return (
    <section className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">
            {lang === "es" ? `Tu Perfil EQ` : `Your EQ Profile`}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {lang === "es" ? `Hola, ${user?.name || ""}` : `Hello, ${user?.name || ""}`}
          </p>
        </div>
        {eqDate && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            {lang === "es" ? `Última evaluación: ${eqDate}` : `Last assessment: ${eqDate}`}
          </div>
        )}
      </div>

      {/* Scores principales */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
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

      {/* Brain Style si existe */}
      {latestEQ.brainStyle && (
        <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-purple-500" />
            <div>
              <p className="text-sm text-gray-500">
                {lang === "es" ? "Tu Estilo Cerebral" : "Your Brain Style"}
              </p>
              <p className="font-bold text-lg">{latestEQ.brainStyle}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
