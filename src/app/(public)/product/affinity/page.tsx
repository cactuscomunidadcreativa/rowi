"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { HeroSection, FeaturesSection, CTASection, StatsSection } from "@/components/public/sections";
import { motion } from "framer-motion";
import { Users, Brain, MessageCircle, Zap, Puzzle, Rocket, Shield, Target, Heart, Briefcase, UserCheck, BarChart3 } from "lucide-react";

export default function ProductAffinityPage() {
  const { lang } = useI18n();

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <HeroSection
        content={{
          badge: lang !== "es" ? "🤝 Human Collaboration" : "🤝 Colaboración Humana",
          title1: lang !== "es" ? "Work better" : "Trabaja mejor",
          title2: lang !== "es" ? "together" : "en equipo",
          subtitle: lang === "en"
            ? "Affinity transforms Emotional Intelligence profiles into practical insights to improve collaboration, interaction and results, inside and outside of work."
            : "Affinity transforma perfiles de Inteligencia Emocional en insights prácticos para mejorar la colaboración, la interacción y los resultados, dentro y fuera del trabajo.",
          ctaPrimary: lang !== "es" ? "Discover Affinity" : "Descubrir Affinity",
          ctaPrimaryHref: "/register",
          ctaSecondary: lang !== "es" ? "See how it works" : "Ver cómo funciona",
          ctaSecondaryHref: "#how-it-works",
          image: "/rowivectors/Rowi-06.png"
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
            {lang === "en"
              ? "\"Relationships don't fail due to lack of talent, they fail due to lack of mutual emotional understanding.\""
              : "\"Las relaciones no fallan por falta de talento, fallan por falta de comprensión emocional mutua.\""}
          </motion.blockquote>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-lg text-[var(--rowi-g2)] font-semibold"
          >
            {lang === "en"
              ? "Affinity turns that understanding into concrete action."
              : "Affinity convierte esa comprensión en acción concreta."}
          </motion.p>
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection
        content={{
          stats: [
            { value: "32", suffix: "%", label: lang !== "es" ? "Better collaboration" : "Mejor colaboración" },
            { value: "45", suffix: "%", label: lang !== "es" ? "Less friction" : "Menos fricción" },
            { value: "28", suffix: "%", label: lang !== "es" ? "Higher execution" : "Mayor ejecución" },
            { value: "3", suffix: "x", label: lang !== "es" ? "Faster decisions" : "Decisiones más rápidas" },
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
              {lang !== "es" ? "Applied Collaboration" : "Colaboración Aplicada"}
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold mb-4"
            >
              {lang !== "es" ? "What Affinity" : "Qué permite"}{" "}
              <span className="rowi-gradient-text">{lang !== "es" ? "enables" : "Affinity"}</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
            >
              {lang === "en"
                ? "It's not about \"getting along.\" It's about functioning better together."
                : "No se trata de \"llevarse bien.\" Se trata de funcionar mejor juntos."}
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: lang !== "es" ? "Understand how to collaborate" : "Entender cómo colaborar",
                desc: lang === "en"
                  ? "See how to work better with each person based on their emotional profile"
                  : "Comprende cómo trabajar mejor con cada persona según su perfil emocional",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: Brain,
                title: lang !== "es" ? "Information processing" : "Procesamiento de información",
                desc: lang === "en"
                  ? "See how each person processes information and makes decisions"
                  : "Ve cómo cada uno procesa la información y toma decisiones",
                gradient: "from-purple-500 to-violet-500"
              },
              {
                icon: MessageCircle,
                title: lang !== "es" ? "Adaptive communication" : "Comunicación adaptativa",
                desc: lang === "en"
                  ? "Adjust your communication style based on the other's emotional profile"
                  : "Ajusta la comunicación según el perfil emocional del otro",
                gradient: "from-pink-500 to-rose-500"
              },
              {
                icon: Zap,
                title: lang !== "es" ? "Reduce friction" : "Reducir fricciones",
                desc: lang === "en"
                  ? "Eliminate unnecessary friction in teams and projects"
                  : "Elimina fricciones innecesarias en equipos y proyectos",
                gradient: "from-orange-500 to-amber-500"
              },
              {
                icon: Puzzle,
                title: lang !== "es" ? "Intelligent role assignment" : "Asignación inteligente de roles",
                desc: lang === "en"
                  ? "Assign roles based on real strengths, not assumptions"
                  : "Asigna roles de forma inteligente, según fortalezas reales",
                gradient: "from-green-500 to-emerald-500"
              },
              {
                icon: Rocket,
                title: lang !== "es" ? "Improve execution" : "Mejorar la ejecución",
                desc: lang === "en"
                  ? "Focus on results, not just relationships"
                  : "Mejora la ejecución, no solo la relación",
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
              {lang !== "es" ? "Interaction at" : "Interacción en"}{" "}
              <span className="rowi-gradient-text">{lang !== "es" ? "multiple levels" : "múltiples niveles"}</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
            >
              {lang === "en"
                ? "Affinity analyzes interaction between people on multiple planes. All from Applied Emotional Intelligence."
                : "Affinity analiza la interacción entre personas en múltiples planos. Todo desde la Inteligencia Emocional aplicada."}
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Heart,
                title: lang !== "es" ? "Personal" : "Personal",
                items: lang === "en"
                  ? ["Emotional styles", "Reactions", "Motivators"]
                  : ["Estilos emocionales", "Reacciones", "Motivadores"],
                color: "bg-pink-500"
              },
              {
                icon: Briefcase,
                title: lang !== "es" ? "Work" : "Laboral",
                items: lang === "en"
                  ? ["Collaboration", "Leadership", "Execution", "Feedback"]
                  : ["Colaboración", "Liderazgo", "Ejecución", "Feedback"],
                color: "bg-blue-500"
              },
              {
                icon: UserCheck,
                title: lang !== "es" ? "Relational" : "Relacional",
                items: lang === "en"
                  ? ["Trust", "Friction", "Complementarity"]
                  : ["Confianza", "Fricción", "Complementariedad"],
                color: "bg-purple-500"
              },
              {
                icon: BarChart3,
                title: lang !== "es" ? "Operational" : "Operativo",
                items: lang === "en"
                  ? ["How they work together", "Make decisions", "Solve problems"]
                  : ["Cómo trabajan juntos", "Deciden", "Resuelven problemas"],
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
          title1: lang !== "es" ? "Affinity in" : "Affinity en",
          title2: lang !== "es" ? "action" : "acción",
          subtitle: lang === "en"
            ? "See how teams and individuals use Affinity to collaborate better"
            : "Descubre cómo equipos e individuos usan Affinity para colaborar mejor",
          features: [
            {
              icon: "users",
              title: lang !== "es" ? "Team Building" : "Formación de equipos",
              description: lang === "en"
                ? "Build high-performance teams based on emotional complementarity"
                : "Forma equipos de alto rendimiento basados en complementariedad emocional",
              gradient: "from-blue-500 to-cyan-500"
            },
            {
              icon: "target",
              title: lang !== "es" ? "Leadership Development" : "Desarrollo de liderazgo",
              description: lang === "en"
                ? "Help leaders understand and adapt to their team's emotional profiles"
                : "Ayuda a líderes a entender y adaptarse a los perfiles emocionales de su equipo",
              gradient: "from-purple-500 to-violet-500"
            },
            {
              icon: "zap",
              title: lang !== "es" ? "Conflict Resolution" : "Resolución de conflictos",
              description: lang === "en"
                ? "Understand the root of friction and resolve it with emotional intelligence"
                : "Entiende la raíz de las fricciones y resuélvelas con inteligencia emocional",
              gradient: "from-orange-500 to-amber-500"
            },
            {
              icon: "sparkles",
              title: lang !== "es" ? "Onboarding" : "Onboarding",
              description: lang === "en"
                ? "Integrate new members faster by understanding their collaboration style"
                : "Integra nuevos miembros más rápido entendiendo su estilo de colaboración",
              gradient: "from-green-500 to-emerald-500"
            },
          ]
        }}
        config={{ columns: 2, showIcons: true }}
      />

      {/* CTA Section */}
      <CTASection
        content={{
          title: lang !== "es" ? "Ready to collaborate better?" : "¿Listo para colaborar mejor?",
          subtitle: lang === "en"
            ? "Discover how Affinity can transform the way your team works together."
            : "Descubre cómo Affinity puede transformar la forma en que tu equipo trabaja junto.",
          buttonText: lang !== "es" ? "Start with Affinity" : "Comenzar con Affinity",
          buttonIcon: "users"
        }}
        config={{ gradient: true }}
      />
    </div>
  );
}
