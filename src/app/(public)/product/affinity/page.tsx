"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { HeroSection, FeaturesSection, CTASection, StatsSection } from "@/components/public/sections";
import { motion } from "framer-motion";
import { Users, Brain, MessageCircle, Zap, Puzzle, Rocket, Shield, Target, Heart, Briefcase, UserCheck, BarChart3 } from "lucide-react";

export default function ProductAffinityPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <HeroSection
        content={{
          badge: t("productAffinity.hero.badge", "🤝 Colaboración Humana"),
          title1: t("productAffinity.hero.title1", "Trabaja mejor"),
          title2: t("productAffinity.hero.title2", "en equipo"),
          subtitle: t("productAffinity.hero.subtitle", "Affinity transforma perfiles de Inteligencia Emocional en insights prácticos para mejorar la colaboración, la interacción y los resultados, dentro y fuera del trabajo."),
          ctaPrimary: t("productAffinity.hero.ctaPrimary", "Descubrir Affinity"),
          ctaPrimaryHref: "/register",
          ctaSecondary: t("productAffinity.hero.ctaSecondary", "Ver cómo funciona"),
          ctaSecondaryHref: "#how-it-works",
          image: "/rowivectors/Rowi-06.webp"
        }}
        config={{ layout: "split", showBadge: true, gradient: true }}
      />

      {/* Key Insight Quote */}
      <section className="py-16 px-4 bg-gradient-to-r from-[var(--rowi-g1)]/10 to-[var(--rowi-g2)]/10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.blockquote
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-medium italic text-gray-800 dark:text-gray-200"
          >
            {t("productAffinity.quote.text", "\"Las relaciones no fallan por falta de talento, fallan por falta de comprensión emocional mutua.\"")}
          </motion.blockquote>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-lg text-[var(--rowi-g2)] font-semibold"
          >
            {t("productAffinity.quote.caption", "Affinity convierte esa comprensión en acción concreta.")}
          </motion.p>
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection
        content={{
          stats: [
            { value: "32", suffix: "%", label: t("productAffinity.stats.collaboration", "Mejor colaboración") },
            { value: "45", suffix: "%", label: t("productAffinity.stats.friction", "Menos fricción") },
            { value: "28", suffix: "%", label: t("productAffinity.stats.execution", "Mayor ejecución") },
            { value: "3", suffix: "x", label: t("productAffinity.stats.decisions", "Decisiones más rápidas") },
          ]
        }}
        config={{ layout: "gradient", columns: 4 }}
      />

      {/* What Affinity Enables - Work Level */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--rowi-g2)]/10 text-[var(--rowi-g2)] text-sm font-medium mb-4"
            >
              <Briefcase className="w-4 h-4" />
              {t("productAffinity.enables.badge", "Colaboración Aplicada")}
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold mb-4"
            >
              {t("productAffinity.enables.titlePre", "Qué permite")}{" "}
              <span className="rowi-gradient-text">{t("productAffinity.enables.titlePost", "Affinity")}</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
            >
              {t("productAffinity.enables.subtitle", "No se trata de \"llevarse bien.\" Se trata de funcionar mejor juntos.")}
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: t("productAffinity.enables.c1.title", "Entender cómo colaborar"),
                desc: t("productAffinity.enables.c1.desc", "Comprende cómo trabajar mejor con cada persona según su perfil emocional"),
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: Brain,
                title: t("productAffinity.enables.c2.title", "Procesamiento de información"),
                desc: t("productAffinity.enables.c2.desc", "Ve cómo cada uno procesa la información y toma decisiones"),
                gradient: "from-purple-500 to-violet-500"
              },
              {
                icon: MessageCircle,
                title: t("productAffinity.enables.c3.title", "Comunicación adaptativa"),
                desc: t("productAffinity.enables.c3.desc", "Ajusta la comunicación según el perfil emocional del otro"),
                gradient: "from-pink-500 to-rose-500"
              },
              {
                icon: Zap,
                title: t("productAffinity.enables.c4.title", "Reducir fricciones"),
                desc: t("productAffinity.enables.c4.desc", "Elimina fricciones innecesarias en equipos y proyectos"),
                gradient: "from-orange-500 to-amber-500"
              },
              {
                icon: Puzzle,
                title: t("productAffinity.enables.c5.title", "Asignación inteligente de roles"),
                desc: t("productAffinity.enables.c5.desc", "Asigna roles de forma inteligente, según fortalezas reales"),
                gradient: "from-green-500 to-emerald-500"
              },
              {
                icon: Rocket,
                title: t("productAffinity.enables.c6.title", "Mejorar la ejecución"),
                desc: t("productAffinity.enables.c6.desc", "Mejora la ejecución, no solo la relación"),
                gradient: "from-indigo-500 to-blue-500"
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-4`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interaction Levels */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-zinc-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold mb-4"
            >
              {t("productAffinity.interaction.titlePre", "Interacción en")}{" "}
              <span className="rowi-gradient-text">{t("productAffinity.interaction.titlePost", "múltiples niveles")}</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
            >
              {t("productAffinity.interaction.subtitle", "Affinity analiza la interacción entre personas en múltiples planos. Todo desde la Inteligencia Emocional aplicada.")}
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Heart,
                title: t("productAffinity.level.personal.title", "Personal"),
                items: [
                  t("productAffinity.level.personal.i1", "Estilos emocionales"),
                  t("productAffinity.level.personal.i2", "Reacciones"),
                  t("productAffinity.level.personal.i3", "Motivadores"),
                ],
                color: "bg-pink-500"
              },
              {
                icon: Briefcase,
                title: t("productAffinity.level.work.title", "Laboral"),
                items: [
                  t("productAffinity.level.work.i1", "Colaboración"),
                  t("productAffinity.level.work.i2", "Liderazgo"),
                  t("productAffinity.level.work.i3", "Ejecución"),
                  t("productAffinity.level.work.i4", "Feedback"),
                ],
                color: "bg-blue-500"
              },
              {
                icon: UserCheck,
                title: t("productAffinity.level.relational.title", "Relacional"),
                items: [
                  t("productAffinity.level.relational.i1", "Confianza"),
                  t("productAffinity.level.relational.i2", "Fricción"),
                  t("productAffinity.level.relational.i3", "Complementariedad"),
                ],
                color: "bg-purple-500"
              },
              {
                icon: BarChart3,
                title: t("productAffinity.level.operational.title", "Operativo"),
                items: [
                  t("productAffinity.level.operational.i1", "Cómo trabajan juntos"),
                  t("productAffinity.level.operational.i2", "Deciden"),
                  t("productAffinity.level.operational.i3", "Resuelven problemas"),
                ],
                color: "bg-green-500"
              },
            ].map((level, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-lg"
              >
                <div className={`w-12 h-12 rounded-xl ${level.color} flex items-center justify-center text-white mb-4`}>
                  <level.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl mb-3">{level.title}</h3>
                <ul className="space-y-2">
                  {level.items.map((item, j) => (
                    <li key={j} className="text-gray-600 dark:text-gray-400 text-sm flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${level.color}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <FeaturesSection
        content={{
          title1: t("productAffinity.useCases.title1", "Affinity en"),
          title2: t("productAffinity.useCases.title2", "acción"),
          subtitle: t("productAffinity.useCases.subtitle", "Descubre cómo equipos e individuos usan Affinity para colaborar mejor"),
          features: [
            {
              icon: "users",
              title: t("productAffinity.useCases.u1.title", "Formación de equipos"),
              description: t("productAffinity.useCases.u1.desc", "Forma equipos de alto rendimiento basados en complementariedad emocional"),
              gradient: "from-blue-500 to-cyan-500"
            },
            {
              icon: "target",
              title: t("productAffinity.useCases.u2.title", "Desarrollo de liderazgo"),
              description: t("productAffinity.useCases.u2.desc", "Ayuda a líderes a entender y adaptarse a los perfiles emocionales de su equipo"),
              gradient: "from-purple-500 to-violet-500"
            },
            {
              icon: "zap",
              title: t("productAffinity.useCases.u3.title", "Resolución de conflictos"),
              description: t("productAffinity.useCases.u3.desc", "Entiende la raíz de las fricciones y resuélvelas con inteligencia emocional"),
              gradient: "from-orange-500 to-amber-500"
            },
            {
              icon: "sparkles",
              title: t("productAffinity.useCases.u4.title", "Onboarding"),
              description: t("productAffinity.useCases.u4.desc", "Integra nuevos miembros más rápido entendiendo su estilo de colaboración"),
              gradient: "from-green-500 to-emerald-500"
            },
          ]
        }}
        config={{ columns: 2, showIcons: true }}
      />

      {/* CTA Section */}
      <CTASection
        content={{
          title: t("productAffinity.cta.title", "¿Listo para colaborar mejor?"),
          subtitle: t("productAffinity.cta.subtitle", "Descubre cómo Affinity puede transformar la forma en que tu equipo trabaja junto."),
          buttonText: t("productAffinity.cta.button", "Comenzar con Affinity"),
          buttonIcon: "users"
        }}
        config={{ gradient: true }}
      />
    </div>
  );
}
