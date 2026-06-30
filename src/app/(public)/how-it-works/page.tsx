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
  const { t } = useI18n();
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
                {t("howItWorksPage.hero.badge", "Proceso simple")}
              </span>

              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                {t("howItWorksPage.hero.title", "Cómo funciona")}{" "}
                <span className="bg-gradient-to-r from-[var(--rowi-primary)] to-[var(--rowi-secondary)] bg-clip-text text-transparent">
                  Rowi
                </span>
              </h1>

              <p className="text-xl text-[var(--rowi-muted)] mb-8 leading-relaxed">
                {t("howItWorksPage.hero.subtitle", "Tu viaje hacia la inteligencia emocional comienza con tres simples pasos. Basado en el modelo científico SEI de Six Seconds.")}
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[var(--rowi-primary)] to-[var(--rowi-secondary)] text-white font-semibold hover:opacity-90 transition-opacity shadow-lg"
                >
                  {t("howItWorksPage.hero.ctaStart", "Comenzar ahora")}
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#steps"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-[var(--rowi-border)] hover:border-[var(--rowi-primary)] transition-colors font-medium"
                >
                  {t("howItWorksPage.hero.ctaSteps", "Ver los pasos")}
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
                  src="/rowivectors/Rowi-06.webp"
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
              {t("howItWorksPage.steps.titlePre", "Tu viaje en")}{" "}
              <span className="text-[var(--rowi-primary)]">3 {t("howItWorksPage.steps.titleSteps", "pasos")}</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-[var(--rowi-muted)] max-w-2xl mx-auto"
            >
              {t("howItWorksPage.steps.subtitle", "Un proceso diseñado para tu crecimiento personal y emocional")}
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
                  <Image src="/rowivectors/Rowi-01.webp" alt="Rowi Challenge" fill className="object-contain" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  {t("howItWorksPage.step1.title", "Conoce a tu Rowi")}
                </h3>
                <p className="text-[var(--rowi-muted)] mb-4">
                  {t("howItWorksPage.step1.desc", "Crea tu cuenta gratis y conoce a tu compañero de inteligencia emocional. Tu Rowi comienza como un huevo lleno de potencial.")}
                </p>
                <ul className="space-y-2">
                  {[
                    t("howItWorksPage.step1.item1", "Registro rápido"),
                    t("howItWorksPage.step1.item2", "100% gratuito"),
                    t("howItWorksPage.step1.item3", "Tu Rowi te espera"),
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
                  <Image src="/rowivectors/Rowi-02.webp" alt="Rowi Emerging" fill className="object-contain" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  {t("howItWorksPage.step2.title", "Evalúa y descubre")}
                </h3>
                <p className="text-[var(--rowi-muted)] mb-4">
                  {t("howItWorksPage.step2.desc", "Completa la evaluación SEI de Six Seconds para obtener tu perfil emocional detallado con las 8 competencias.")}
                </p>
                <ul className="space-y-2">
                  {[
                    t("howItWorksPage.step2.item1", "Evaluación científica"),
                    t("howItWorksPage.step2.item2", "8 competencias medidas"),
                    t("howItWorksPage.step2.item3", "Perfil personalizado"),
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
                  <Image src="/rowivectors/Rowi-06.webp" alt="Rowi Expert" fill className="object-contain" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  {t("howItWorksPage.step3.title", "Mira tu evolución")}
                </h3>
                <p className="text-[var(--rowi-muted)] mb-4">
                  {t("howItWorksPage.step3.desc", "Tu Rowi crece con tu práctica y ves el contraste honesto contigo mismo: en quién te estás convirtiendo, semana a semana.")}
                </p>
                <ul className="space-y-2">
                  {[
                    t("howItWorksPage.step3.item1", "Tu Rowi evoluciona"),
                    t("howItWorksPage.step3.item2", "Contraste contigo mismo"),
                    t("howItWorksPage.step3.item3", "Tu Guía, siempre"),
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
              {t("howItWorksPage.features.titlePre", "¿Qué hace")}{" "}
              <span className="text-[var(--rowi-primary)]">
                {t("howItWorksPage.features.titlePost", "especial a Rowi?")}
              </span>
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: MessageCircle,
                title: t("howItWorksPage.features.f1.title", "IA Conversacional"),
                desc: t("howItWorksPage.features.f1.desc", "Rowi entiende el contexto emocional y responde con empatía real"),
                color: "from-pink-500 to-rose-500",
              },
              {
                icon: Shield,
                title: t("howItWorksPage.features.f2.title", "Privacidad Total"),
                desc: t("howItWorksPage.features.f2.desc", "Tus conversaciones son completamente privadas y seguras"),
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: TrendingUp,
                title: t("howItWorksPage.features.f3.title", "Aprendizaje Continuo"),
                desc: t("howItWorksPage.features.f3.desc", "Rowi aprende de ti para ofrecer recomendaciones más relevantes"),
                color: "from-green-500 to-emerald-500",
              },
              {
                icon: Globe,
                title: t("howItWorksPage.features.f4.title", "Metodología Probada"),
                desc: t("howItWorksPage.features.f4.desc", "Basado en Six Seconds, líder mundial en inteligencia emocional"),
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
                {t("howItWorksPage.cta.title", "¿Listo para comenzar?")}
              </h2>
              <p className="text-xl mb-8 opacity-90">
                {t("howItWorksPage.cta.subtitle", "Tu viaje hacia la inteligencia emocional empieza aquí. Es gratis.")}
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-[var(--rowi-primary)] font-bold text-lg hover:bg-opacity-90 transition-all shadow-xl"
              >
                {t("howItWorksPage.cta.button", "Crear mi cuenta gratis")}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
