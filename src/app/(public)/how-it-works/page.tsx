"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap,
  Brain,
  MessageCircle,
  TrendingUp,
  Target,
  Heart,
  Star,
  Users,
  Shield,
  Globe,
  ArrowRight,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import CMSPageRenderer from "@/components/public/CMSPageRenderer";
import RowiEvolution from "@/components/public/RowiEvolution";
import SEICompetencies from "@/components/public/SEICompetencies";
import { useI18n } from "@/lib/i18n/I18nProvider";

/**
 * 🔄 Cómo Funciona - How It Works Page
 * Conectado con Six Seconds SEI y la evolución del Rowi
 */

export default function HowItWorksPage() {
  const { t, lang } = useI18n();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    fetch("/api/public/pages/how-it-works")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.sections?.length > 0) setSections(data.sections);
        else setUseFallback(true);
      })
      .catch(() => setUseFallback(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[var(--rowi-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!useFallback && sections.length > 0) {
    return <CMSPageRenderer sections={sections} pageType="how-it-works" />;
  }

  return (
    <div className="min-h-screen pt-16 bg-[var(--rowi-background)]">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-gradient-to-br from-[var(--rowi-primary)]/20 via-[var(--rowi-secondary)]/10 to-transparent blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-[var(--rowi-primary)]/20 to-[var(--rowi-secondary)]/20 text-[var(--rowi-primary)] mb-6">
                <Zap className="w-4 h-4" />
                {lang === "es" ? "Proceso simple" : "Simple Process"}
              </span>

              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                {lang === "es" ? "Cómo funciona" : "How it works"}{" "}
                <span className="bg-gradient-to-r from-[var(--rowi-primary)] to-[var(--rowi-secondary)] bg-clip-text text-transparent">
                  Rowi
                </span>
              </h1>

              <p className="text-xl text-[var(--rowi-muted)] mb-8 leading-relaxed">
                {lang === "es"
                  ? "Tu viaje hacia la inteligencia emocional comienza con tres simples pasos. Basado en el modelo científico SEI de Six Seconds."
                  : "Your journey towards emotional intelligence begins with three simple steps. Based on the scientific SEI model from Six Seconds."}
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[var(--rowi-primary)] to-[var(--rowi-secondary)] text-white font-semibold hover:opacity-90 transition-opacity shadow-lg"
                >
                  {lang === "es" ? "Comenzar ahora" : "Start now"}
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#steps"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-[var(--rowi-border)] hover:border-[var(--rowi-primary)] transition-colors font-medium"
                >
                  {lang === "es" ? "Ver los pasos" : "See the steps"}
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative aspect-square max-w-md mx-auto">
                <Image
                  src="/rowivectors/Rowi-06.png"
                  alt="Rowi"
                  fill
                  className="object-contain drop-shadow-2xl"
                />
                {/* Floating badges */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute top-10 -left-4 bg-white dark:bg-zinc-900 rounded-2xl p-3 shadow-xl"
                >
                  <Brain className="w-8 h-8 text-blue-500" />
                </motion.div>
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="absolute top-20 -right-4 bg-white dark:bg-zinc-900 rounded-2xl p-3 shadow-xl"
                >
                  <Heart className="w-8 h-8 text-pink-500" />
                </motion.div>
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute bottom-20 -left-8 bg-white dark:bg-zinc-900 rounded-2xl p-3 shadow-xl"
                >
                  <Target className="w-8 h-8 text-green-500" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section id="steps" className="py-20 px-4 bg-[var(--rowi-card)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold mb-4"
            >
              {lang === "es" ? "Tu viaje en" : "Your journey in"}{" "}
              <span className="text-[var(--rowi-primary)]">3 {lang === "es" ? "pasos" : "steps"}</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-[var(--rowi-muted)] max-w-2xl mx-auto"
            >
              {lang === "es"
                ? "Un proceso diseñado para tu crecimiento personal y emocional"
                : "A process designed for your personal and emotional growth"}
            </motion.p>
          </div>

          <div className="relative">
            {/* Connection line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-[var(--rowi-primary)] via-[var(--rowi-secondary)] to-green-500 -translate-y-1/2 z-0 rounded-full" />

            <div className="grid lg:grid-cols-3 gap-8 relative z-10">
              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center text-white text-2xl font-bold mb-6">
                  1
                </div>
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <Image src="/rowivectors/Rowi-01.png" alt="Rowi Challenge" fill className="object-contain" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  {lang === "es" ? "Conoce a tu Rowi" : "Meet your Rowi"}
                </h3>
                <p className="text-[var(--rowi-muted)] mb-4">
                  {lang === "es"
                    ? "Crea tu cuenta gratis y conoce a tu compañero de inteligencia emocional. Tu Rowi comienza como un huevo lleno de potencial."
                    : "Create your free account and meet your emotional intelligence companion. Your Rowi starts as an egg full of potential."}
                </p>
                <ul className="space-y-2">
                  {[
                    lang === "es" ? "Registro rápido" : "Quick registration",
                    lang === "es" ? "100% gratuito" : "100% free",
                    lang === "es" ? "Tu Rowi te espera" : "Your Rowi awaits",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold mb-6">
                  2
                </div>
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <Image src="/rowivectors/Rowi-02.png" alt="Rowi Emerging" fill className="object-contain" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  {lang === "es" ? "Evalúa y descubre" : "Assess and discover"}
                </h3>
                <p className="text-[var(--rowi-muted)] mb-4">
                  {lang === "es"
                    ? "Completa la evaluación SEI de Six Seconds para obtener tu perfil emocional detallado con las 8 competencias."
                    : "Complete the Six Seconds SEI assessment to get your detailed emotional profile with all 8 competencies."}
                </p>
                <ul className="space-y-2">
                  {[
                    lang === "es" ? "Evaluación científica" : "Scientific assessment",
                    lang === "es" ? "8 competencias medidas" : "8 competencies measured",
                    lang === "es" ? "Perfil personalizado" : "Personalized profile",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold mb-6">
                  3
                </div>
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <Image src="/rowivectors/Rowi-06.png" alt="Rowi Expert" fill className="object-contain" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  {lang === "es" ? "Crece y evoluciona" : "Grow and evolve"}
                </h3>
                <p className="text-[var(--rowi-muted)] mb-4">
                  {lang === "es"
                    ? "Conversa con Rowi, cumple metas y observa cómo tu compañero evoluciona junto contigo en los 5 niveles SEI."
                    : "Chat with Rowi, achieve goals and watch your companion evolve with you through the 5 SEI levels."}
                </p>
                <ul className="space-y-2">
                  {[
                    lang === "es" ? "Coach IA 24/7" : "24/7 AI Coach",
                    lang === "es" ? "5 niveles de evolución" : "5 evolution levels",
                    lang === "es" ? "Progreso visible" : "Visible progress",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Rowi Evolution with SEI Levels */}
      <RowiEvolution />

      {/* SEI Competencies */}
      <SEICompetencies />

      {/* Features */}
      <section className="py-20 px-4 bg-[var(--rowi-card)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold mb-4"
            >
              {lang === "es" ? "¿Qué hace" : "What makes"}{" "}
              <span className="text-[var(--rowi-primary)]">
                {lang === "es" ? "especial a Rowi?" : "Rowi special?"}
              </span>
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: MessageCircle,
                title: lang === "es" ? "IA Conversacional" : "Conversational AI",
                desc: lang === "es"
                  ? "Rowi entiende el contexto emocional y responde con empatía real"
                  : "Rowi understands emotional context and responds with real empathy",
                color: "from-pink-500 to-rose-500",
              },
              {
                icon: Shield,
                title: lang === "es" ? "Privacidad Total" : "Total Privacy",
                desc: lang === "es"
                  ? "Tus conversaciones son completamente privadas y seguras"
                  : "Your conversations are completely private and secure",
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: TrendingUp,
                title: lang === "es" ? "Aprendizaje Continuo" : "Continuous Learning",
                desc: lang === "es"
                  ? "Rowi aprende de ti para ofrecer recomendaciones más relevantes"
                  : "Rowi learns from you to offer more relevant recommendations",
                color: "from-green-500 to-emerald-500",
              },
              {
                icon: Globe,
                title: lang === "es" ? "Metodología Probada" : "Proven Methodology",
                desc: lang === "es"
                  ? "Basado en Six Seconds, líder mundial en inteligencia emocional"
                  : "Based on Six Seconds, world leader in emotional intelligence",
                color: "from-purple-500 to-violet-500",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-6"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4`}
                >
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-[var(--rowi-muted)]">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--rowi-primary)]/20 via-[var(--rowi-secondary)]/20 to-green-500/20 rounded-3xl blur-3xl" />

            <div className="relative bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] rounded-3xl p-12 text-white">
              <Sparkles className="w-12 h-12 mx-auto mb-6 opacity-80" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {lang === "es" ? "¿Listo para comenzar?" : "Ready to start?"}
              </h2>
              <p className="text-xl mb-8 opacity-90">
                {lang === "es"
                  ? "Tu viaje hacia la inteligencia emocional empieza aquí. Es gratis."
                  : "Your journey towards emotional intelligence starts here. It's free."}
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-[var(--rowi-primary)] font-bold text-lg hover:bg-opacity-90 transition-all shadow-xl"
              >
                {lang === "es" ? "Crear mi cuenta gratis" : "Create my free account"}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
