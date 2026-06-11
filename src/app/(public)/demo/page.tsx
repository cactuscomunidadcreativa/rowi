"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Heart,
  MessageSquare,
  Bot,
  ArrowRight,
  Play,
  Sparkles,
  Brain,
  Users,
  TrendingUp,
  Sun,
  BookOpen,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   Traducciones
========================================================= */
const translations = {
  es: {
    badge: "Tour Interactivo",
    title: "Explora Rowi",
    titleHighlight: "en acción",
    subtitle: "Descubre cómo Rowi puede ayudarte a desarrollar tu inteligencia emocional con datos de ejemplo reales.",
    startTour: "Comenzar tour",
    exploreModules: "Explorar módulos",

    // Módulos
    modulesTitle: "Módulos de la plataforma",
    modulesSubtitle: "Haz clic en cualquier módulo para ver una demostración interactiva",

    mirror: {
      title: "El Espejo",
      desc: "El diagnóstico real de 2 minutos. No es demo: pruébalo de verdad, sin cuenta.",
      features: ["8 preguntas, 2 minutos", "Niveles, no puntajes", "Resultado al instante"],
    },
    today: {
      title: "TODAY — el loop diario",
      desc: "Elígete en la mañana, practica 2 minutos y cierra el día viendo a tu Rowi crecer.",
      features: ["Intención de mañana", "Una práctica al día", "Recompensa al cerrar"],
    },
    becoming: {
      title: "Mi evolución",
      desc: "La memoria viva de tu viaje: quién eras, quién eres y en quién te estás convirtiendo.",
      features: ["Memoria viva día a día", "Contraste honesto yo-vs-yo", "Hitos de tu Rowi"],
    },
    dashboard: {
      title: "Mírate",
      desc: "Tu espejo emocional en profundidad: niveles claros (no puntajes) y tus 8 competencias SEI.",
      features: ["Niveles, no puntajes", "8 competencias SEI", "Evolución del avatar"],
    },
    affinity: {
      title: "Sintonía (Affinity)",
      desc: "Ve la BRECHA entre dos estilos y cómo cerrarla — nunca un veredicto de compatibilidad.",
      features: ["Escala de sintonía", "Estilos cerebrales", "Puentes concretos"],
    },
    eco: {
      title: "ECO",
      desc: "Encuentra las palabras para cada persona — y aprende de cada resultado.",
      features: ["Mensaje adaptado a la brecha", "Envío real", "¿Funcionó? — el outcome"],
    },
    coach: {
      title: "Tu Guía",
      desc: "Tu guía de inteligencia emocional disponible 24/7 para acompañar tu camino.",
      features: ["Conversación con tu guía", "Consejos personalizados", "Acompañamiento continuo"],
    },
    tp: {
      title: "Benchmark TP",
      desc: "Demo real con 14,886 evaluaciones SEI de Teleperformance. Benchmarking corporativo en acción.",
      features: ["14,886 evaluaciones reales", "Insights por región y rol", "Perfiles cerebrales"],
    },

    viewDemo: "Ver demo",

    // CTA
    ctaTitle: "¿Te gustó lo que viste?",
    ctaSubtitle: "Crea tu cuenta gratis y comienza tu viaje hacia la inteligencia emocional.",
    ctaButton: "Crear cuenta gratis",
  },
  en: {
    badge: "Interactive Tour",
    title: "Explore Rowi",
    titleHighlight: "in action",
    subtitle: "Discover how Rowi can help you develop your emotional intelligence with real sample data.",
    startTour: "Start tour",
    exploreModules: "Explore modules",

    modulesTitle: "Platform modules",
    modulesSubtitle: "Click on any module to see an interactive demonstration",

    mirror: {
      title: "The Mirror",
      desc: "The real 2-minute diagnostic. Not a demo: try it for real, no account needed.",
      features: ["8 questions, 2 minutes", "Levels, not scores", "Instant result"],
    },
    today: {
      title: "TODAY — the daily loop",
      desc: "Choose yourself in the morning, practice for 2 minutes, and close the day watching your Rowi grow.",
      features: ["Morning intention", "One practice a day", "Reward when you close"],
    },
    becoming: {
      title: "My evolution",
      desc: "The living memory of your journey: who you were, who you are, who you're becoming.",
      features: ["Living day-by-day memory", "Honest you-vs-you contrast", "Your Rowi's milestones"],
    },
    dashboard: {
      title: "See yourself",
      desc: "Your emotional mirror in depth: clear levels (not scores) and your 8 SEI competencies.",
      features: ["Levels, not scores", "8 SEI competencies", "Avatar evolution"],
    },
    affinity: {
      title: "Attunement (Affinity)",
      desc: "See the GAP between two styles and how to close it — never a compatibility verdict.",
      features: ["Attunement scale", "Brain styles", "Concrete bridges"],
    },
    eco: {
      title: "ECO",
      desc: "Find the words for each person — and learn from every outcome.",
      features: ["Gap-aware message", "Real sending", "Did it work? — the outcome"],
    },
    coach: {
      title: "Your Guide",
      desc: "Your emotional intelligence guide, available 24/7 to walk alongside you.",
      features: ["Talk with your guide", "Personalized advice", "Continuous companionship"],
    },
    tp: {
      title: "TP Benchmark",
      desc: "Real demo with 14,886 SEI assessments from Teleperformance. Corporate benchmarking in action.",
      features: ["14,886 real assessments", "Insights by region & role", "Brain profiles"],
    },

    viewDemo: "View demo",

    ctaTitle: "Did you like what you saw?",
    ctaSubtitle: "Create your free account and start your journey towards emotional intelligence.",
    ctaButton: "Create free account",
  },
  pt: {
    badge: "Tour Interativo",
    title: "Explore o Rowi",
    titleHighlight: "em ação",
    subtitle: "Descubra como o Rowi pode ajudá-lo a desenvolver sua inteligência emocional com dados de exemplo reais.",
    startTour: "Começar tour",
    exploreModules: "Explorar módulos",
    modulesTitle: "Módulos da plataforma",
    modulesSubtitle: "Clique em qualquer módulo para ver uma demonstração interativa",
    mirror: {
      title: "O Espelho",
      desc: "O diagnóstico real de 2 minutos. Não é demo: experimente de verdade, sem conta.",
      features: ["8 perguntas, 2 minutos", "Níveis, não pontuações", "Resultado na hora"],
    },
    today: {
      title: "TODAY — o loop diário",
      desc: "Escolha quem ser pela manhã, pratique 2 minutos e feche o dia vendo seu Rowi crescer.",
      features: ["Intenção da manhã", "Uma prática por dia", "Recompensa ao fechar"],
    },
    becoming: {
      title: "Minha evolução",
      desc: "A memória viva da sua jornada: quem você era, quem é e em quem está se tornando.",
      features: ["Memória viva dia a dia", "Contraste honesto você-vs-você", "Marcos do seu Rowi"],
    },
    dashboard: {
      title: "Olhe para você",
      desc: "Seu espelho emocional em profundidade: níveis claros (não pontuações) e suas 8 competências SEI.",
      features: ["Níveis, não pontuações", "8 competências SEI", "Evolução do avatar"],
    },
    affinity: {
      title: "Sintonia (Affinity)",
      desc: "Veja a BRECHA entre dois estilos e como fechá-la — nunca um veredito de compatibilidade.",
      features: ["Escala de sintonia", "Estilos cerebrais", "Pontes concretas"],
    },
    eco: {
      title: "ECO",
      desc: "Encontre as palavras para cada pessoa — e aprenda com cada resultado.",
      features: ["Mensagem adaptada à brecha", "Envio real", "Funcionou? — o outcome"],
    },
    coach: {
      title: "Seu Guia",
      desc: "Seu guia de inteligência emocional disponível 24/7 para acompanhar seu caminho.",
      features: ["Conversa com seu guia", "Conselhos personalizados", "Acompanhamento contínuo"],
    },
    tp: {
      title: "Benchmark TP",
      desc: "Demo real com 14.886 avaliações SEI da Teleperformance. Benchmarking corporativo em ação.",
      features: ["14.886 avaliações reais", "Insights por região e função", "Perfis cerebrais"],
    },
    viewDemo: "Ver demo",
    ctaTitle: "Gostou do que viu?",
    ctaSubtitle: "Crie sua conta grátis e comece sua jornada rumo à inteligência emocional.",
    ctaButton: "Criar conta grátis",
  },
  it: {
    badge: "Tour Interattivo",
    title: "Esplora Rowi",
    titleHighlight: "in azione",
    subtitle: "Scopri come Rowi può aiutarti a sviluppare la tua intelligenza emotiva con dati di esempio reali.",
    startTour: "Inizia il tour",
    exploreModules: "Esplora i moduli",
    modulesTitle: "Moduli della piattaforma",
    modulesSubtitle: "Clicca su qualsiasi modulo per vedere una dimostrazione interattiva",
    mirror: {
      title: "Lo Specchio",
      desc: "La diagnosi reale di 2 minuti. Non è una demo: provala davvero, senza account.",
      features: ["8 domande, 2 minuti", "Livelli, non punteggi", "Risultato immediato"],
    },
    today: {
      title: "TODAY — il loop quotidiano",
      desc: "Scegli chi essere al mattino, pratica 2 minuti e chiudi la giornata vedendo crescere il tuo Rowi.",
      features: ["Intenzione del mattino", "Una pratica al giorno", "Ricompensa alla chiusura"],
    },
    becoming: {
      title: "La mia evoluzione",
      desc: "La memoria viva del tuo viaggio: chi eri, chi sei e chi stai diventando.",
      features: ["Memoria viva giorno per giorno", "Contrasto onesto te-vs-te", "Tappe del tuo Rowi"],
    },
    dashboard: {
      title: "Guardati",
      desc: "Il tuo specchio emotivo in profondità: livelli chiari (non punteggi) e le tue 8 competenze SEI.",
      features: ["Livelli, non punteggi", "8 competenze SEI", "Evoluzione dell'avatar"],
    },
    affinity: {
      title: "Sintonia (Affinity)",
      desc: "Vedi il DIVARIO tra due stili e come colmarlo — mai un verdetto di compatibilità.",
      features: ["Scala di sintonia", "Stili cerebrali", "Ponti concreti"],
    },
    eco: {
      title: "ECO",
      desc: "Trova le parole per ogni persona — e impara da ogni risultato.",
      features: ["Messaggio adattato al divario", "Invio reale", "Ha funzionato? — l'outcome"],
    },
    coach: {
      title: "La tua Guida",
      desc: "La tua guida di intelligenza emotiva disponibile 24/7 per accompagnare il tuo cammino.",
      features: ["Conversazione con la tua guida", "Consigli personalizzati", "Accompagnamento continuo"],
    },
    tp: {
      title: "Benchmark TP",
      desc: "Demo reale con 14.886 valutazioni SEI da Teleperformance. Benchmarking aziendale in azione.",
      features: ["14.886 valutazioni reali", "Insight per regione e ruolo", "Profili cerebrali"],
    },
    viewDemo: "Vedi demo",
    ctaTitle: "Ti è piaciuto quello che hai visto?",
    ctaSubtitle: "Crea il tuo account gratuito e inizia il tuo viaggio verso l'intelligenza emotiva.",
    ctaButton: "Crea account gratis",
  },
};

// Orden = el viaje del producto (Rowi Launch 1.0): el Espejo REAL primero
// (no es demo — es el gancho vivo), luego el loop diario, la memoria, y las
// herramientas relacionales.
const modules = [
  {
    key: "mirror",
    href: "/pre-sei",
    icon: Sparkles,
    gradient: "from-violet-500 to-fuchsia-600",
    image: "/rowivectors/Rowi-06.webp",
  },
  {
    key: "today",
    href: "/demo/today",
    icon: Sun,
    gradient: "from-amber-500 to-orange-500",
    image: "/rowivectors/Rowi-02.webp",
  },
  {
    key: "becoming",
    href: "/demo/becoming",
    icon: BookOpen,
    gradient: "from-violet-600 to-purple-600",
    image: "/rowivectors/Rowi-01.webp",
  },
  {
    key: "dashboard",
    href: "/demo/dashboard",
    icon: LayoutDashboard,
    gradient: "from-blue-500 to-violet-600",
    image: "/rowivectors/Rowi-06.webp",
  },
  {
    key: "affinity",
    href: "/demo/affinity",
    icon: Heart,
    gradient: "from-pink-500 to-rose-600",
    image: "/rowivectors/Rowi-05.webp",
  },
  {
    key: "eco",
    href: "/demo/eco",
    icon: MessageSquare,
    gradient: "from-emerald-500 to-green-600",
    image: "/rowivectors/Rowi-04.webp",
  },
  {
    key: "coach",
    href: "/demo/coach",
    icon: Bot,
    gradient: "from-violet-600 to-purple-600",
    image: "/rowivectors/Rowi-03.webp",
  },
  // El demo organizacional "TP" se retiró de la vista pública. Vive ahora
  // solo en la zona admin (/hub/admin/tp) como reportes/data para HR.
];

export default function DemoPage() {
  const { lang, t: tFn } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.en;
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);

  return (
    <div className="min-h-screen pt-16 bg-[var(--rowi-background)]">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] rounded-full bg-gradient-to-br from-[var(--rowi-primary)]/20 via-purple-500/10 to-transparent blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-[var(--rowi-primary)]/20 to-purple-500/20 text-[var(--rowi-primary)] mb-6">
              <Play className="w-4 h-4" />
              {t.badge}
            </span>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {t.title}{" "}
              <span className="bg-gradient-to-r from-[var(--rowi-primary)] to-purple-500 bg-clip-text text-transparent">
                {t.titleHighlight}
              </span>
            </h1>

            <p className="text-xl text-[var(--rowi-muted)] mb-8 max-w-2xl mx-auto">
              {t.subtitle}
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/demo/today"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[var(--rowi-primary)] to-purple-500 text-white font-semibold hover:opacity-90 transition-opacity shadow-lg"
              >
                {t.startTour}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#modules"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-[var(--rowi-border)] hover:border-[var(--rowi-primary)] transition-colors font-medium"
              >
                {t.exploreModules}
              </a>
            </div>
          </motion.div>

          {/* Floating Rowi Images */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="relative h-48 mt-12"
          >
            {modules.map((mod, i) => (
              <motion.div
                key={mod.key}
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 2 + i * 0.3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute"
                style={{
                  left: `${15 + i * 22}%`,
                  top: i % 2 === 0 ? "10%" : "30%",
                }}
              >
                <div className="relative w-24 h-24">
                  <Image
                    src={mod.image}
                    alt={mod.key}
                    fill
                    className="object-contain drop-shadow-xl"
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Modules Grid */}
      <section id="modules" className="py-20 px-4 bg-[var(--rowi-card)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold mb-4"
            >
              {t.modulesTitle}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-[var(--rowi-muted)]"
            >
              {t.modulesSubtitle}
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {modules.map((mod, i) => {
              const moduleT = t[mod.key as keyof typeof t] as {
                title: string;
                desc: string;
                features: string[];
              };
              const Icon = mod.icon;

              return (
                <motion.div
                  key={mod.key}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  onMouseEnter={() => setHoveredModule(mod.key)}
                  onMouseLeave={() => setHoveredModule(null)}
                >
                  <Link href={mod.href}>
                    <div
                      className={`relative bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl overflow-hidden group cursor-pointer`}
                    >
                      {/* Background gradient on hover */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${mod.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                      />

                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-6">
                          <div
                            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center text-white`}
                          >
                            <Icon className="w-7 h-7" />
                          </div>
                          <div className="relative w-20 h-20">
                            <Image
                              src={mod.image}
                              alt={moduleT.title}
                              fill
                              className="object-contain"
                            />
                          </div>
                        </div>

                        <h3 className="text-2xl font-bold mb-3">{moduleT.title}</h3>
                        <p className="text-[var(--rowi-muted)] mb-6">{moduleT.desc}</p>

                        <div className="space-y-2 mb-6">
                          {moduleT.features.map((feature, fi) => (
                            <div
                              key={fi}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Sparkles className="w-4 h-4 text-[var(--rowi-primary)]" />
                              {feature}
                            </div>
                          ))}
                        </div>

                        <div
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${mod.gradient} text-white text-sm font-medium`}
                        >
                          {t.viewDemo}
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Brain, value: "8", label: tFn("demo.stats.competencies", "Competencias SEI") },
              { icon: Users, value: "5", label: tFn("demo.stats.evolutionLevels", "Niveles de evolución") },
              { icon: TrendingUp, value: "135", label: tFn("demo.stats.maxEqScore", "Puntuación máxima EQ") },
              { icon: Heart, value: "24/7", label: tFn("demo.stats.coachAvailable", "Coach disponible") },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-[var(--rowi-primary)]/10 flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-6 h-6 text-[var(--rowi-primary)]" />
                </div>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-[var(--rowi-muted)]">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--rowi-primary)]/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-3xl" />

            <div className="relative bg-gradient-to-br from-[var(--rowi-primary)] to-purple-600 rounded-3xl p-12 text-white">
              <Sparkles className="w-12 h-12 mx-auto mb-6 opacity-80" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.ctaTitle}</h2>
              <p className="text-xl mb-8 opacity-90">{t.ctaSubtitle}</p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-[var(--rowi-primary)] font-bold text-lg hover:bg-opacity-90 transition-all shadow-xl"
              >
                {t.ctaButton}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
