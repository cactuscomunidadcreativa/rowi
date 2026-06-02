"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Activity,
  Brain,
  Compass,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Layers,
  Target,
  PlayCircle,
  Tag,
  Download,
  Clock,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/**
 * Recursos / Resources — public marketing page.
 *
 * Hub de recursos honesto: explica los marcos reales de Six Seconds
 * (Vital Signs, KCG / 8 SEI, 18 Brain Talents) documentados en
 * docs/EMOTIONAL_BUDGETING.md, enlaza a la metodología oficial Six Seconds
 * y a las páginas internas. Sección de guías descargables marcada como
 * "próximamente" con honestidad.
 */
export default function ResourcesContent() {
  const { t } = useI18n();

  const frameworks = [
    {
      icon: Activity,
      color: "from-blue-500 to-cyan-500",
      title: t("resources.fw.vitalSigns.title", "Vital Signs"),
      desc: t(
        "resources.fw.vitalSigns.desc",
        "El diagnóstico anual del clima emocional. Mide 5 drivers (Confianza, Motivación, Cambio, Trabajo en Equipo y Ejecución) a través de 15 pulse points, las palancas operativas del día a día.",
      ),
      points: [
        t("resources.fw.vitalSigns.p1", "5 drivers de clima"),
        t("resources.fw.vitalSigns.p2", "15 pulse points operativos"),
        t("resources.fw.vitalSigns.p3", "Variantes OVS · TVS · LVS · FVS"),
      ],
    },
    {
      icon: Compass,
      color: "from-pink-500 to-rose-500",
      title: t("resources.fw.kcg.title", "KCG · 8 competencias SEI"),
      desc: t(
        "resources.fw.kcg.desc",
        "Know · Choose · Give: el sistema operativo personal de Six Seconds. Tres movimientos circulares que articulan las 8 competencias de inteligencia emocional medidas por el SEI.",
      ),
      points: [
        t("resources.fw.kcg.p1", "Know Yourself — literacy + patrones"),
        t("resources.fw.kcg.p2", "Choose Yourself — pensamiento, navegación, motivación, optimismo"),
        t("resources.fw.kcg.p3", "Give Yourself — empatía + metas nobles"),
      ],
    },
    {
      icon: Brain,
      color: "from-purple-500 to-violet-500",
      title: t("resources.fw.talents.title", "18 Brain Talents"),
      desc: t(
        "resources.fw.talents.desc",
        "Las 18 \"apps del cerebro\" repartidas en 3 dimensiones — Foco, Decisión y Motivación — que describen cómo procesamos información, navegamos la incertidumbre y sostenemos la energía.",
      ),
      points: [
        t("resources.fw.talents.p1", "Foco — cómo procesas información"),
        t("resources.fw.talents.p2", "Decisión — cómo navegas la incertidumbre"),
        t("resources.fw.talents.p3", "Motivación — cómo sostienes la energía"),
      ],
    },
  ];

  const internalLinks = [
    {
      icon: Layers,
      href: "/how-it-works",
      title: t("resources.links.howItWorks.title", "Cómo funciona"),
      desc: t("resources.links.howItWorks.desc", "El recorrido de Rowi en 3 pasos, basado en el modelo SEI."),
    },
    {
      icon: Target,
      href: "/product",
      title: t("resources.links.product.title", "El producto"),
      desc: t("resources.links.product.desc", "Rowi, Affinity, Insights e Integraciones en detalle."),
    },
    {
      icon: PlayCircle,
      href: "/demo",
      title: t("resources.links.demo.title", "Demo interactiva"),
      desc: t("resources.links.demo.desc", "Prueba la experiencia sin registrarte."),
    },
    {
      icon: Tag,
      href: "/pricing",
      title: t("resources.links.pricing.title", "Precios"),
      desc: t("resources.links.pricing.desc", "Planes para personas, equipos y organizaciones."),
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
            <BookOpen className="w-4 h-4" />
            {t("resources.hero.badge", "Centro de recursos")}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
          >
            {t("resources.hero.title", "Entiende la metodología")}{" "}
            <span className="bg-gradient-to-r from-[var(--rowi-primary)] to-[var(--rowi-secondary)] bg-clip-text text-transparent">
              {t("resources.hero.titleHighlight", "detrás de Rowi")}
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-[var(--rowi-muted)] leading-relaxed"
          >
            {t(
              "resources.hero.subtitle",
              "Rowi se apoya en la ciencia de Six Seconds, líder mundial en inteligencia emocional. Aquí explicamos los marcos que usamos y enlazamos a todo lo que necesitas para empezar.",
            )}
          </motion.p>
        </div>
      </section>

      {/* Frameworks */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {t("resources.fw.title", "Los marcos de Six Seconds")}
            </h2>
            <p className="text-lg text-[var(--rowi-muted)] max-w-2xl mx-auto">
              {t(
                "resources.fw.subtitle",
                "Tres modelos complementarios y validados que estructuran cómo Rowi mide y desarrolla la inteligencia emocional.",
              )}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {frameworks.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-zinc-900 rounded-3xl p-7 shadow-lg border border-[var(--rowi-border)] flex flex-col"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-4`}
                >
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-[var(--rowi-muted)] mb-4">{f.desc}</p>
                <ul className="space-y-2 mt-auto">
                  {f.points.map((p, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--rowi-primary)] shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BE2GROW hypothesis note */}
      <section className="px-4 pb-4">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl bg-[var(--rowi-card)] border border-[var(--rowi-border)] p-7">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--rowi-primary)]" />
              {t("resources.be2grow.title", "La hipótesis BE2GROW")}
            </h3>
            <p className="text-[var(--rowi-muted)]">
              {t(
                "resources.be2grow.desc",
                "Cada pulse point se activa hipotéticamente con un conjunto de competencias SEI y se apoya en Brain Talents específicos. Esta matriz es la versión v0 del modelo de inferencia de Rowi: una hipótesis, no una verdad calibrada. Cada debrief y cada dato real la refinan hacia versiones futuras.",
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Six Seconds external */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <a
            href="https://www.6seconds.org"
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-3xl bg-gradient-to-br from-[var(--rowi-primary)]/10 to-[var(--rowi-secondary)]/10 border border-[var(--rowi-border)] p-8 hover:border-[var(--rowi-primary)] transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold mb-2">
                  {t("resources.sixSeconds.title", "Six Seconds — la organización detrás de la ciencia")}
                </h3>
                <p className="text-[var(--rowi-muted)]">
                  {t(
                    "resources.sixSeconds.desc",
                    "Six Seconds es la red global sin fines de lucro dedicada al desarrollo de la inteligencia emocional. Explora su investigación, sus evaluaciones y el informe anual State of the Heart en su sitio oficial.",
                  )}
                </p>
              </div>
              <ExternalLink className="w-6 h-6 text-[var(--rowi-primary)] shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <span className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-[var(--rowi-primary)]">
              6seconds.org
              <ArrowRight className="w-4 h-4" />
            </span>
          </a>
        </div>
      </section>

      {/* Internal links */}
      <section className="py-12 px-4 bg-[var(--rowi-card)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {t("resources.links.title", "Empieza por aquí")}
            </h2>
            <p className="text-lg text-[var(--rowi-muted)] max-w-2xl mx-auto">
              {t("resources.links.subtitle", "Todo lo que necesitas para conocer Rowi en profundidad.")}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {internalLinks.map((l, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={l.href}
                  className="group block h-full bg-white dark:bg-zinc-950 rounded-2xl p-6 border border-[var(--rowi-border)] hover:border-[var(--rowi-primary)] hover:shadow-lg transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-[var(--rowi-primary)]/10 flex items-center justify-center text-[var(--rowi-primary)] mb-4">
                    <l.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold mb-1 flex items-center gap-1">
                    {l.title}
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </h3>
                  <p className="text-sm text-[var(--rowi-muted)]">{l.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Downloadable guides — honest "próximamente" */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl border-2 border-dashed border-[var(--rowi-border)] p-8 md:p-10">
            <div className="flex items-center gap-3 mb-4">
              <Download className="w-7 h-7 text-[var(--rowi-primary)]" />
              <h2 className="text-2xl font-bold">
                {t("resources.guides.title", "Guías descargables")}
              </h2>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="w-3.5 h-3.5" />
                {t("resources.guides.badge", "Próximamente")}
              </span>
            </div>
            <p className="text-[var(--rowi-muted)]">
              {t(
                "resources.guides.desc",
                "Estamos preparando guías prácticas en PDF sobre los Vital Signs, el modelo KCG y los Brain Talents. Las publicaremos aquí cuando estén listas. Mientras tanto, explora la metodología en las secciones anteriores.",
              )}
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--rowi-primary)]/20 via-[var(--rowi-secondary)]/20 to-purple-500/20 rounded-3xl blur-3xl" />
            <div className="relative bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] rounded-3xl p-12 text-white">
              <Sparkles className="w-12 h-12 mx-auto mb-6 opacity-80" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t("resources.cta.title", "¿Listo para ponerlo en práctica?")}
              </h2>
              <p className="text-xl mb-8 opacity-90">
                {t("resources.cta.subtitle", "Crea tu cuenta gratis y empieza tu recorrido de inteligencia emocional.")}
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-[var(--rowi-primary)] font-bold text-lg hover:bg-opacity-90 transition-all shadow-xl"
              >
                {t("resources.cta.button", "Comenzar gratis")}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
