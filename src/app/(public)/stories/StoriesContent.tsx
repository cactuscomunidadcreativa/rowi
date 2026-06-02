"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Building2,
  Users,
  User,
  Heart,
  GraduationCap,
  Activity,
  ClipboardCheck,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/**
 * Historias / Stories — public marketing page.
 *
 * IMPORTANT (regla Eduardo): NO fake social proof. Esta página describe
 * los marcos y los TIPOS de transformación que la metodología Six Seconds /
 * ROWIIA persigue, tal como están documentados en docs/EMOTIONAL_BUDGETING.md
 * y docs/EMOPOWER_SCHOOLS.md. No inventa métricas, testimonios ni clientes.
 * Donde iría un caso real verificado, hay un TODO explícito.
 */
export default function StoriesContent() {
  const { t } = useI18n();

  const useCases = [
    {
      icon: User,
      key: "person",
      color: "from-pink-500 to-rose-500",
      title: t("stories.useCases.person.title", "Personas"),
      desc: t(
        "stories.useCases.person.desc",
        "El modelo KCG (Know · Choose · Give) trabaja las 8 competencias SEI para que cada persona entienda lo que siente, elija cómo responder y conecte con su propósito.",
      ),
      tag: t("stories.useCases.person.tag", "KCG · 8 competencias SEI"),
    },
    {
      icon: Users,
      key: "team",
      color: "from-blue-500 to-cyan-500",
      title: t("stories.useCases.team.title", "Equipos"),
      desc: t(
        "stories.useCases.team.desc",
        "Team Vital Signs (TVS) mide el clima del equipo en los 5 drivers e identifica su arquetipo (Linterna, Mapa, Botiquín o Botas de montaña) para guiar el desarrollo.",
      ),
      tag: t("stories.useCases.team.tag", "TVS · 5 drivers"),
    },
    {
      icon: Building2,
      key: "org",
      color: "from-purple-500 to-violet-500",
      title: t("stories.useCases.org.title", "Organizaciones"),
      desc: t(
        "stories.useCases.org.desc",
        "Organizational Vital Signs (OVS) conecta el clima con cuatro resultados de negocio: éxito futuro, foco en el cliente, productividad y retención. ROI es el resultado; ROE es el motor.",
      ),
      tag: t("stories.useCases.org.tag", "OVS · ROE → ROI"),
    },
    {
      icon: Heart,
      key: "family",
      color: "from-amber-500 to-orange-500",
      title: t("stories.useCases.family.title", "Familias"),
      desc: t(
        "stories.useCases.family.desc",
        "Family Vital Signs (FVS) adapta el modelo a los sistemas familiares: mide cómo se siente vivir en esta familia hoy, qué la sostiene y qué la desgasta, siempre con consentimiento mutuo.",
      ),
      tag: t("stories.useCases.family.tag", "FVS · consentimiento bilateral"),
    },
  ];

  const programSteps = [
    {
      icon: Activity,
      title: t("stories.cycle.week1.title", "Semana 1 — Observación"),
      desc: t(
        "stories.cycle.week1.desc",
        "El Quality Coach observa el aula con una rúbrica de 3 dimensiones (apertura emocional, conexión, transferencia). La rúbrica describe lo observado: es evidencia, no juicio.",
      ),
    },
    {
      icon: ClipboardCheck,
      title: t("stories.cycle.week2.title", "Semana 2 — Devolución 1:1"),
      desc: t(
        "stories.cycle.week2.desc",
        "Encuentro individual con cada docente. Juntos co-construyen una o dos mejoras concretas y acuerdan un compromiso explícito para las próximas semanas.",
      ),
    },
    {
      icon: Users,
      title: t("stories.cycle.week3.title", "Semana 3 — Comunidad de práctica"),
      desc: t(
        "stories.cycle.week3.desc",
        "Encuentro grupal donde el aprendizaje se vuelve horizontal: los docentes traen casos reales del aula, se analizan en colectivo y salen con próximos pasos.",
      ),
    },
    {
      icon: ShieldCheck,
      title: t("stories.cycle.week4.title", "Semana 4 — Supervisión"),
      desc: t(
        "stories.cycle.week4.desc",
        "El propio Quality Coach recibe supervisión técnica de Brain Up con respaldo de Six Seconds, cerrando el ciclo de calidad del programa.",
      ),
    },
  ];

  return (
    <div className="min-h-screen pt-16 bg-[var(--rowi-background)]">
      {/* Hero */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-gradient-to-br from-[var(--rowi-primary)]/20 via-[var(--rowi-secondary)]/10 to-transparent blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-[var(--rowi-primary)]/20 to-[var(--rowi-secondary)]/20 text-[var(--rowi-primary)] mb-6"
          >
            <Sparkles className="w-4 h-4" />
            {t("stories.hero.badge", "Historias y casos de uso")}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
          >
            {t("stories.hero.title", "Transformaciones reales")}{" "}
            <span className="bg-gradient-to-r from-[var(--rowi-primary)] to-[var(--rowi-secondary)] bg-clip-text text-transparent">
              {t("stories.hero.titleHighlight", "que la metodología hace posibles")}
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-[var(--rowi-muted)] leading-relaxed"
          >
            {t(
              "stories.hero.subtitle",
              "Te contamos con honestidad qué tipo de cambio persigue cada marco de Six Seconds que opera ROWIIA. Sin métricas inventadas: marcos reales, casos verificados a medida que el programa madura.",
            )}
          </motion.p>
        </div>
      </section>

      {/* Honesty note */}
      <section className="px-4 -mt-6 mb-4">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-[var(--rowi-border)] bg-[var(--rowi-card)] p-5 text-sm text-[var(--rowi-muted)] flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[var(--rowi-primary)] shrink-0 mt-0.5" />
            <span>
              {t(
                "stories.honesty",
                "Nuestro compromiso: nunca inventamos cifras ni testimonios. Lo que ves aquí son los marcos y resultados que la metodología Six Seconds persigue. Los casos verificados se publican solo cuando existen y con autorización explícita.",
              )}
            </span>
          </div>
        </div>
      </section>

      {/* Emotional Budgeting use cases */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {t("stories.eb.title", "Emotional Budgeting")}
            </h2>
            <p className="text-lg text-[var(--rowi-muted)] max-w-2xl mx-auto">
              {t(
                "stories.eb.subtitle",
                "El sistema de observabilidad emocional para personas, equipos y organizaciones. Cada lente mira los mismos datos según quién observa y qué consintió el titular.",
              )}
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map((c, i) => (
              <motion.div
                key={c.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-zinc-900 rounded-3xl p-7 shadow-lg border border-[var(--rowi-border)]"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-white mb-4`}
                >
                  <c.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">{c.title}</h3>
                <p className="text-[var(--rowi-muted)] mb-4">{c.desc}</p>
                <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)]">
                  {c.tag}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Placeholder for a future verified case */}
          <div className="mt-8 rounded-3xl border-2 border-dashed border-[var(--rowi-border)] p-8 text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-3 text-[var(--rowi-muted)]" />
            <h3 className="text-lg font-semibold mb-2">
              {t("stories.eb.placeholderTitle", "Caso verificado próximamente")}
            </h3>
            <p className="text-[var(--rowi-muted)] max-w-xl mx-auto">
              {t(
                "stories.eb.placeholderDesc",
                "Cuando una organización autorice compartir su recorrido, su caso aparecerá aquí con datos reales y verificados. No publicamos resultados que no podamos respaldar.",
              )}
            </p>
            {/* TODO Eduardo: insertar caso real verificado aquí */}
          </div>
        </div>
      </section>

      {/* EmoPower Schools */}
      <section className="py-16 px-4 bg-[var(--rowi-card)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4">
              <GraduationCap className="w-4 h-4" />
              {t("stories.schools.badge", "EmoPower Schools · Six Seconds + Brain Up Ecuador")}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {t("stories.schools.title", "Sistemas educativos que aprenden a sentir")}
            </h2>
            <p className="text-lg text-[var(--rowi-muted)] max-w-3xl mx-auto">
              {t(
                "stories.schools.subtitle",
                "Un programa SEL de 12 meses que acompaña a colegios completos. El corazón operativo es el ciclo mensual del Quality Coach, que se repite cada mes durante todo el año.",
              )}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {programSteps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-zinc-950 rounded-2xl p-6 border border-[var(--rowi-border)]"
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                  <s.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-[var(--rowi-muted)]">{s.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="rounded-3xl bg-white dark:bg-zinc-950 p-7 border border-[var(--rowi-border)]">
              <h3 className="text-lg font-bold mb-2">
                {t("stories.schools.evsTitle", "Education Vital Signs (EVS)")}
              </h3>
              <p className="text-[var(--rowi-muted)]">
                {t(
                  "stories.schools.evsDesc",
                  "El clima escolar institucional medido en 4 dimensiones: seguridad emocional, conexión, pertenencia y propósito compartido. Es agregado, no individual, y se aplica en 3 olas durante el año para comparar el avance.",
                )}
              </p>
            </div>
            <div className="rounded-3xl bg-white dark:bg-zinc-950 p-7 border border-[var(--rowi-border)]">
              <h3 className="text-lg font-bold mb-2">
                {t("stories.schools.journalTitle", "Journal privado del estudiante")}
              </h3>
              <p className="text-[var(--rowi-muted)]">
                {t(
                  "stories.schools.journalDesc",
                  "Lo que el estudiante escribe es suyo: el colegio no lo ve. La privacidad es absoluta y diferenciadora; solo las señales de crisis configuradas escalan al equipo de apoyo para proteger al estudiante.",
                )}
              </p>
            </div>
          </div>

          {/* Placeholder for a future verified school case */}
          <div className="mt-8 rounded-3xl border-2 border-dashed border-[var(--rowi-border)] p-8 text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-3 text-[var(--rowi-muted)]" />
            <h3 className="text-lg font-semibold mb-2">
              {t("stories.schools.placeholderTitle", "Caso de un colegio próximamente")}
            </h3>
            <p className="text-[var(--rowi-muted)] max-w-xl mx-auto">
              {t(
                "stories.schools.placeholderDesc",
                "A medida que las instituciones completen su año con EmoPower Schools, compartiremos aquí sus recorridos verificados, con su autorización.",
              )}
            </p>
            {/* TODO Eduardo: insertar caso real verificado aquí */}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--rowi-primary)]/20 via-[var(--rowi-secondary)]/20 to-emerald-500/20 rounded-3xl blur-3xl" />
            <div className="relative bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] rounded-3xl p-12 text-white">
              <Sparkles className="w-12 h-12 mx-auto mb-6 opacity-80" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t("stories.cta.title", "¿Quieres protagonizar la próxima historia?")}
              </h2>
              <p className="text-xl mb-8 opacity-90">
                {t(
                  "stories.cta.subtitle",
                  "Descubre cómo funciona la metodología o agenda una demostración para tu equipo, organización o institución.",
                )}
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-[var(--rowi-primary)] font-bold text-lg hover:bg-opacity-90 transition-all shadow-xl"
                >
                  {t("stories.cta.howItWorks", "Cómo funciona")}
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full border-2 border-white/70 text-white font-semibold text-lg hover:bg-white/10 transition-all"
                >
                  {t("stories.cta.demo", "Ver la demo")}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
