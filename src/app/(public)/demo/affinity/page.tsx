"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Users,
  Sparkles,
  Info,
  Brain,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { affinityAsGap } from "@/domains/affinity/lib/asGap";
import { BRAIN_STYLES } from "@/domains/eq/lib/dictionary";

/* =========================================================
   Datos de ejemplo — los brain styles son los 8 REALES del
   modelo Six Seconds (src/domains/eq/lib/dictionary.ts).
========================================================= */
const DEMO_TEAM = [
  {
    id: "1",
    name: "Carlos Ruiz",
    role: "Product Manager",
    avatar: "/rowivectors/Rowi-05.webp",
    compatibility: 92,
    brainStyle: "inventor",
    brainStyleEs: "Inventor",
  },
  {
    id: "2",
    name: "Ana Torres",
    role: "UX Designer",
    avatar: "/rowivectors/Rowi-04.webp",
    compatibility: 87,
    brainStyle: "guardian",
    brainStyleEs: "Guardián",
  },
  {
    id: "3",
    name: "Luis Méndez",
    role: "Developer",
    avatar: "/rowivectors/Rowi-03.webp",
    compatibility: 78,
    brainStyle: "doer",
    brainStyleEs: "Hacedor",
  },
  {
    id: "4",
    name: "Sofia García",
    role: "Marketing Lead",
    avatar: "/rowivectors/Rowi-02.webp",
    compatibility: 85,
    brainStyle: "visionary",
    brainStyleEs: "Visionario",
  },
];

// Los 8 estilos canónicos, con su color y emoji del diccionario.
const STYLE_CARDS = Object.values(BRAIN_STYLES);

/* =========================================================
   Traducciones
========================================================= */
const translations = {
  es: {
    badge: "Demo Interactivo",
    title: "Affinity",
    subtitle: "Ve la sintonía con tu equipo y los puentes para cerrarla — nunca un veredicto",
    back: "Volver al tour",
    prev: "Anterior: Dashboard",
    next: "Siguiente: ECO",

    teamTitle: "Tu Equipo",
    teamDesc: "Miembros con los que tienes mayor afinidad emocional",

    compatibility: "Sintonía",
    brainStyle: "Estilo Cerebral",

    stylesTitle: "Estilos Cerebrales",
    stylesDesc: "El modelo Six Seconds identifica 8 estilos cerebrales basados en tus patrones emocionales",

    insightTitle: "Insights de Afinidad",
    insightDesc: "Basado en tu perfil SEI y el de tu equipo",
    insight1: "Tu mayor afinidad es con perfiles Inventores y Guardianes",
    insight2: "Podrías fortalecer la comunicación con perfiles Hacedores",
    insight3: "Tu estilo de liderazgo es colaborativo y empático",

    tipTitle: "Esto es un demo",
    tipDesc: "En tu cuenta real, verás la sintonía real con tu gente basada en sus perfiles SEI — y cómo cerrarla con ECO.",

    createAccount: "Crear mi cuenta",
  },
  en: {
    badge: "Interactive Demo",
    title: "Affinity",
    subtitle: "See your attunement with your team and the bridges to close the gap — never a verdict",
    back: "Back to tour",
    prev: "Previous: Dashboard",
    next: "Next: ECO",

    teamTitle: "Your Team",
    teamDesc: "Members with whom you have the highest emotional affinity",

    compatibility: "Attunement",
    brainStyle: "Brain Style",

    stylesTitle: "Brain Styles",
    stylesDesc: "The Six Seconds model identifies 8 brain styles based on your emotional patterns",

    insightTitle: "Affinity Insights",
    insightDesc: "Based on your SEI profile and your team's",
    insight1: "Your highest affinity is with Inventor and Guardian profiles",
    insight2: "You could strengthen communication with Doer profiles",
    insight3: "Your leadership style is collaborative and empathetic",

    tipTitle: "This is a demo",
    tipDesc: "In your real account, you will see real attunement with your people based on their SEI profiles — and how to close the gap with ECO.",

    createAccount: "Create my account",
  },
  pt: {
    badge: "Demo Interativo",
    title: "Affinity",
    subtitle: "Veja a sintonia com sua equipe e as pontes para fechá-la — nunca um veredito",
    back: "Voltar ao tour",
    prev: "Anterior: Dashboard",
    next: "Próximo: ECO",
    teamTitle: "Sua Equipe",
    teamDesc: "Membros com quem você tem maior afinidade emocional",
    compatibility: "Sintonia",
    brainStyle: "Estilo Cerebral",
    stylesTitle: "Estilos Cerebrais",
    stylesDesc: "O modelo Six Seconds identifica 8 estilos cerebrais baseados em seus padrões emocionais",
    insightTitle: "Insights de Afinidade",
    insightDesc: "Baseado no seu perfil SEI e no da sua equipe",
    insight1: "Sua maior afinidade é com perfis Inventores e Guardiões",
    insight2: "Você poderia fortalecer a comunicação com perfis Fazedores",
    insight3: "Seu estilo de liderança é colaborativo e empático",
    tipTitle: "Isto é um demo",
    tipDesc: "Na sua conta real, você verá a sintonia real com as suas pessoas baseada em seus perfis SEI — e como fechá-la com o ECO.",
    createAccount: "Criar minha conta",
  },
  it: {
    badge: "Demo Interattivo",
    title: "Affinity",
    subtitle: "Vedi la sintonia con il tuo team e i ponti per colmare il divario — mai un verdetto",
    back: "Torna al tour",
    prev: "Precedente: Dashboard",
    next: "Avanti: ECO",
    teamTitle: "Il tuo Team",
    teamDesc: "Membri con cui hai la maggiore affinità emotiva",
    compatibility: "Sintonia",
    brainStyle: "Stile Cerebrale",
    stylesTitle: "Stili Cerebrali",
    stylesDesc: "Il modello Six Seconds identifica 8 stili cerebrali basati sui tuoi pattern emotivi",
    insightTitle: "Insight di Affinità",
    insightDesc: "Basato sul tuo profilo SEI e su quello del tuo team",
    insight1: "La tua maggiore affinità è con profili Inventori e Guardiani",
    insight2: "Potresti rafforzare la comunicazione con profili Fattori",
    insight3: "Il tuo stile di leadership è collaborativo ed empatico",
    tipTitle: "Questo è un demo",
    tipDesc: "Nel tuo account reale, vedrai la sintonia reale con le tue persone basata sui loro profili SEI — e come colmare il divario con ECO.",
    createAccount: "Crea il mio account",
  },
  zh: {
    badge: "互动演示",
    title: "Affinity",
    subtitle: "看见你与团队之间的默契，以及弥合差距的桥梁——绝非评判",
    back: "返回导览",
    prev: "上一步：Dashboard",
    next: "下一步：ECO",
    teamTitle: "你的团队",
    teamDesc: "与你情感契合度最高的成员",
    compatibility: "默契度",
    brainStyle: "脑力风格",
    stylesTitle: "脑力风格",
    stylesDesc: "Six Seconds 模型基于你的情绪模式识别出 8 种脑力风格",
    insightTitle: "Affinity 洞察",
    insightDesc: "基于你和团队的 SEI 测评结果",
    insight1: "你与 Inventor（发明者）和 Guardian（守护者）类型最为契合",
    insight2: "你可以加强与 Doer（行动者）类型的沟通",
    insight3: "你的领导风格协作而富有同理心",
    tipTitle: "这是一个演示",
    tipDesc: "在你的真实账户中，你将看到基于团队成员 SEI 测评的真实默契度——以及如何借助 ECO 弥合差距。",
    createAccount: "创建我的账户",
  },
};

/* =========================================================
   Componentes
========================================================= */
function TeamMemberCard({ member, lang }: { member: typeof DEMO_TEAM[0]; lang: string }) {
  const { t: tr } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.en;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-16 h-16">
          <Image
            src={member.avatar}
            alt={member.name}
            fill
            className="object-contain"
          />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg">{member.name}</h3>
          <p className="text-sm text-[var(--rowi-muted)]">{member.role}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Sintonía como BRECHA (regla asGap.ts): escala 0-3, jamás un % */}
        {(() => {
          const gap = affinityAsGap({ heat100: member.compatibility });
          if (!gap) return null;
          return (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--rowi-muted)]">{t.compatibility}</span>
                <span className="font-bold text-[var(--rowi-primary)]">
                  {tr(gap.labelKey, gap.level)}
                </span>
              </div>
              <div className="flex gap-1" role="img" aria-label={tr(gap.labelKey, gap.level)}>
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.12 }}
                    className={`h-3 flex-1 rounded-full ${
                      i <= gap.step
                        ? "bg-gradient-to-r from-violet-500 to-purple-500"
                        : "bg-gray-200 dark:bg-zinc-800"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-[var(--rowi-muted)] mt-2">{tr(gap.hintKey, "")}</p>
            </div>
          );
        })()}

        {/* Brain Style — siempre uno de los 8 reales (sei.brainStyles.*) */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--rowi-muted)]">{t.brainStyle}</span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
            {tr(`sei.brainStyles.${member.brainStyle}`, member.brainStyleEs)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function BrainStyleCard({ style }: { style: (typeof STYLE_CARDS)[0] }) {
  const { t } = useI18n();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm text-center"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 text-2xl"
        style={{ backgroundColor: `${style.color}20` }}
      >
        {style.emoji}
      </div>
      <h3 className="font-semibold">{t(`sei.brainStyles.${style.key}`, style.labelES)}</h3>
    </motion.div>
  );
}

/* =========================================================
   Página principal
========================================================= */
export default function DemoAffinityPage() {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.en;

  return (
    <div className="min-h-screen pt-16 pb-24 bg-[var(--rowi-background)]">
      {/* Header */}
      <div className="bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-transparent py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-[var(--rowi-primary)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.back}
            </Link>
          </div>

          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-pink-500/20 text-pink-600 dark:text-pink-400 mb-4">
            <Sparkles className="w-3 h-3" />
            {t.badge}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
            <Heart className="w-8 h-8 text-pink-500" />
            {t.title}
          </h1>
          <p className="text-[var(--rowi-muted)] max-w-2xl">{t.subtitle}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Team Grid */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Users className="w-6 h-6 text-pink-500" />
              {t.teamTitle}
            </h2>
            <p className="text-[var(--rowi-muted)]">{t.teamDesc}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {DEMO_TEAM.map((member) => (
              <TeamMemberCard key={member.id} member={member} lang={lang} />
            ))}
          </div>
        </div>

        {/* Brain Styles */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-500" />
              {t.stylesTitle}
            </h2>
            <p className="text-[var(--rowi-muted)]">{t.stylesDesc}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STYLE_CARDS.map((style) => (
              <BrainStyleCard key={style.key} style={style} />
            ))}
          </div>
        </div>

        {/* Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-3xl p-8"
        >
          <h2 className="text-xl font-bold mb-2">{t.insightTitle}</h2>
          <p className="text-sm text-[var(--rowi-muted)] mb-6">{t.insightDesc}</p>
          <div className="space-y-3">
            {[t.insight1, t.insight2, t.insight3].map((insight, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white/50 dark:bg-zinc-900/50 rounded-xl p-4"
              >
                <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-500 font-bold text-sm">
                  {i + 1}
                </div>
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Info Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-2xl p-6 flex gap-4"
        >
          <Info className="w-6 h-6 text-pink-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-pink-900 dark:text-pink-100 mb-1">{t.tipTitle}</h3>
            <p className="text-sm text-pink-700 dark:text-pink-300">{t.tipDesc}</p>
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between pt-8 border-t border-[var(--rowi-border)]">
          <Link
            href="/demo/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-[var(--rowi-border)] hover:border-[var(--rowi-primary)] transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            {t.prev}
          </Link>
          <div className="flex gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold hover:opacity-90 transition-opacity"
            >
              {t.createAccount}
            </Link>
            <Link
              href="/demo/eco"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white transition-colors font-medium"
            >
              {t.next}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
