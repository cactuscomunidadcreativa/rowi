"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Heart, Users, Sparkles, Brain, Zap, Target,
  Building2, Globe, Shield, TrendingUp, Award,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   TP Affinity — Team Compatibility & Brain Style Matching
   Using TP-specific team data (bilingual ES/EN)
========================================================= */

const translations = {
  es: {
    // Header
    backToHub: "TP Hub",
    badge: "Afinidad de Equipo",
    title: "Afinidad de Equipo TP",
    subtitle: "Análisis de compatibilidad emocional en los equipos globales de Teleperformance — basado en estilos cerebrales SEI",

    // Team section
    topCompatibleTitle: "Miembros Más Compatibles",
    topCompatibleDesc: "Miembros del equipo interregionales con mayor compatibilidad emocional",
    match: "Afinidad",
    compatibility: "Compatibilidad",
    brainStyleLabel: "Estilo Cerebral",
    eqScoreLabel: "Puntaje EQ",

    // Team roles
    roleSarahChen: "Líder de Equipo — Ventas NA",
    roleMarcusRivera: "Éxito del Cliente — LATAM",
    roleAikoTanaka: "Gerente de Operaciones — APAC",
    roleEmmaSchmidt: "Directora de RRHH — EMEA",
    roleCarlosMendoza: "Líder de Capacitación — LATAM",
    roleJenniferPark: "Aseguramiento de Calidad — NA",

    // Regions
    regionNA: "Norteamérica",
    regionLATAM: "Latinoamérica",
    regionAPAC: "Asia Pacífico",
    regionEMEA: "EMEA",

    // Brain styles section
    brainDistTitle: "Distribución de Estilos Cerebrales",
    brainDistDesc: "Distribución de 7 estilos cerebrales en 14,886 evaluaciones TP",
    employees: "empleados",

    // Brain style names
    scientistName: "Científico",
    delivererName: "Ejecutor",
    strategistName: "Estratega",
    inventorName: "Inventor",
    guardianName: "Guardián",
    visionaryName: "Visionario",
    superheroName: "Superhéroe",

    // Brain style descriptions
    scientistDesc: "Analítico, toma de decisiones basada en datos. Fuerte en Reconocer Patrones.",
    delivererDesc: "Enfocado en la ejecución, confiable. Fuerte en Pensamiento Consecuente.",
    strategistDesc: "Pensador de visión global, experto en planificación. Equilibrio entre Conocer y Elegir.",
    inventorDesc: "Solucionador creativo, impulsor de innovación. Fuerte en Motivación Intrínseca.",
    guardianDesc: "Protector del equipo, constructor de relaciones. Fuerte en Empatía.",
    visionaryDesc: "Orientado al futuro, inspirador. Fuerte en Metas Nobles.",
    superheroDesc: "Fortaleza integral, adaptable. Alto rendimiento en todas las competencias.",

    // Cross-region insights
    crossRegionTitle: "Perspectivas Interregionales",
    crossRegionDesc: "Patrones de afinidad en las operaciones globales de TP",
    insight1: "Los equipos NA-EMEA muestran la mayor compatibilidad interregional (prom. 87%), impulsada por perfiles Estratega compartidos",
    insight2: "Los equipos LATAM tienen la mayor cohesión interna (prom. 91%), siendo las parejas Ejecutor-Inventor las más comunes",
    insight3: "Los perfiles Científico de APAC complementan excepcionalmente a los perfiles Guardián de NA para flujos de aseguramiento de calidad",
    insight4: "Las parejas de mentoría interregional con estilos cerebrales complementarios muestran un crecimiento de EQ 34% más rápido",

    // Info box
    infoTitle: "Datos de Afinidad TP",
    infoDesc: "Puntajes de compatibilidad derivados del emparejamiento de perfiles cerebrales SEI en 14,886 evaluaciones de Teleperformance. Datos individuales anonimizados.",

    // Navigation
    navBenchmark: "Benchmark",
    navEco: "ECO",
  },
  en: {
    // Header
    backToHub: "TP Hub",
    badge: "Team Affinity",
    title: "TP Team Affinity",
    subtitle: "Emotional compatibility analysis across Teleperformance global teams — powered by SEI brain style matching",

    // Team section
    topCompatibleTitle: "Top Compatible Team Members",
    topCompatibleDesc: "Cross-regional team members with highest emotional compatibility",
    match: "Match",
    compatibility: "Compatibility",
    brainStyleLabel: "Brain Style",
    eqScoreLabel: "EQ Score",

    // Team roles
    roleSarahChen: "Team Lead — Sales NA",
    roleMarcusRivera: "Customer Success — LATAM",
    roleAikoTanaka: "Operations Manager — APAC",
    roleEmmaSchmidt: "HR Director — EMEA",
    roleCarlosMendoza: "Training Lead — LATAM",
    roleJenniferPark: "Quality Assurance — NA",

    // Regions
    regionNA: "North America",
    regionLATAM: "Latin America",
    regionAPAC: "Asia Pacific",
    regionEMEA: "EMEA",

    // Brain styles section
    brainDistTitle: "Brain Style Distribution",
    brainDistDesc: "Distribution of 7 brain styles across 14,886 TP assessments",
    employees: "employees",

    // Brain style names
    scientistName: "Scientist",
    delivererName: "Deliverer",
    strategistName: "Strategist",
    inventorName: "Inventor",
    guardianName: "Guardian",
    visionaryName: "Visionary",
    superheroName: "Superhero",

    // Brain style descriptions
    scientistDesc: "Analytical, data-driven decision making. Strong in Recognize Patterns.",
    delivererDesc: "Execution-focused, reliable. Strong in Consequential Thinking.",
    strategistDesc: "Big picture thinker, planning expertise. Balance of Know & Choose.",
    inventorDesc: "Creative problem-solver, innovation driver. Strong in Intrinsic Motivation.",
    guardianDesc: "Team protector, relationship builder. Strong in Empathy.",
    visionaryDesc: "Forward-looking, inspiring. Strong in Noble Goals.",
    superheroDesc: "All-around strength, adaptable. High across all competencies.",

    // Cross-region insights
    crossRegionTitle: "Cross-Region Insights",
    crossRegionDesc: "Affinity patterns across TP global operations",
    insight1: "NA-EMEA teams show highest cross-region compatibility (avg 87%), driven by shared Strategist profiles",
    insight2: "LATAM teams have the highest internal cohesion (avg 91%), with Deliverer-Inventor pairings most common",
    insight3: "APAC Scientist profiles complement NA Guardian profiles exceptionally well for QA workflows",
    insight4: "Cross-region mentoring pairs with complementary brain styles show 34% faster EQ growth",

    // Info box
    infoTitle: "TP Affinity Data",
    infoDesc: "Compatibility scores derived from SEI brain profile matching across 14,886 Teleperformance assessments. Individual data anonymized.",

    // Navigation
    navBenchmark: "Benchmark",
    navEco: "ECO",
  },
};

type TranslationSet = typeof translations.es;

/* =========================================================
   Data builders (depend on translations)
========================================================= */

function getTPTeam(t: TranslationSet) {
  return [
    { id: "1", name: "Sarah Chen", role: t.roleSarahChen, avatar: "/rowivectors/Rowi-05.png", compatibility: 94, brainStyle: t.strategistName, emoji: "♟️", region: t.regionNA, eqScore: 108.3 },
    { id: "2", name: "Marcus Rivera", role: t.roleMarcusRivera, avatar: "/rowivectors/Rowi-04.png", compatibility: 91, brainStyle: t.delivererName, emoji: "📦", region: t.regionLATAM, eqScore: 103.7 },
    { id: "3", name: "Aiko Tanaka", role: t.roleAikoTanaka, avatar: "/rowivectors/Rowi-03.png", compatibility: 88, brainStyle: t.scientistName, emoji: "🔬", region: t.regionAPAC, eqScore: 101.2 },
    { id: "4", name: "Emma Schmidt", role: t.roleEmmaSchmidt, avatar: "/rowivectors/Rowi-02.png", compatibility: 86, brainStyle: t.visionaryName, emoji: "🔮", region: t.regionEMEA, eqScore: 105.9 },
    { id: "5", name: "Carlos Mendoza", role: t.roleCarlosMendoza, avatar: "/rowivectors/Rowi-06.png", compatibility: 83, brainStyle: t.inventorName, emoji: "💡", region: t.regionLATAM, eqScore: 99.4 },
    { id: "6", name: "Jennifer Park", role: t.roleJenniferPark, avatar: "/rowivectors/Rowi-01.png", compatibility: 79, brainStyle: t.guardianName, emoji: "🛡️", region: t.regionNA, eqScore: 97.8 },
  ];
}

function getBrainStyles(t: TranslationSet) {
  return [
    { key: "scientist", name: t.scientistName, color: "#3b82f6", icon: Brain, emoji: "🔬", count: 2841, percent: 19.1, desc: t.scientistDesc },
    { key: "deliverer", name: t.delivererName, color: "#10b981", icon: Target, emoji: "📦", count: 2673, percent: 18.0, desc: t.delivererDesc },
    { key: "strategist", name: t.strategistName, color: "#8b5cf6", icon: Zap, emoji: "♟️", count: 2524, percent: 17.0, desc: t.strategistDesc },
    { key: "inventor", name: t.inventorName, color: "#f59e0b", icon: Sparkles, emoji: "💡", count: 2227, percent: 15.0, desc: t.inventorDesc },
    { key: "guardian", name: t.guardianName, color: "#ef4444", icon: Heart, emoji: "🛡️", count: 1935, percent: 13.0, desc: t.guardianDesc },
    { key: "visionary", name: t.visionaryName, color: "#ec4899", icon: TrendingUp, emoji: "🔮", count: 1489, percent: 10.0, desc: t.visionaryDesc },
    { key: "superhero", name: t.superheroName, color: "#14b8a6", icon: Award, emoji: "🦸", count: 1197, percent: 7.9, desc: t.superheroDesc },
  ];
}

function getCrossRegionInsights(t: TranslationSet) {
  return [
    { text: t.insight1, icon: Globe, color: "#3b82f6" },
    { text: t.insight2, icon: Heart, color: "#ec4899" },
    { text: t.insight3, icon: Brain, color: "#8b5cf6" },
    { text: t.insight4, icon: TrendingUp, color: "#10b981" },
  ];
}

/* =========================================================
   Components
========================================================= */

function TeamMemberCard({ member, t }: { member: ReturnType<typeof getTPTeam>[0]; t: TranslationSet }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-14 h-14">
          <Image src={member.avatar} alt={member.name} fill className="object-contain" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold">{member.name}</h3>
          <p className="text-xs text-[var(--rowi-muted)]">{member.role}</p>
          <p className="text-[10px] text-purple-500 font-medium">{member.region}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-pink-500">{member.compatibility}%</div>
          <p className="text-[10px] text-[var(--rowi-muted)]">{t.match}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[var(--rowi-muted)]">{t.compatibility}</span>
            <span className="font-bold text-pink-500">{member.compatibility}%</span>
          </div>
          <div className="h-2.5 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500" initial={{ width: 0 }} animate={{ width: `${member.compatibility}%` }} transition={{ duration: 1, ease: "easeOut" }} />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--rowi-muted)]">{t.brainStyleLabel}</span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
            {member.emoji} {member.brainStyle}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--rowi-muted)]">{t.eqScoreLabel}</span>
          <span className="text-sm font-mono font-bold text-purple-600">{member.eqScore.toFixed(1)}</span>
        </div>
      </div>
    </motion.div>
  );
}

function BrainStyleCard({ style, t }: { style: ReturnType<typeof getBrainStyles>[0]; t: TranslationSet }) {
  const Icon = style.icon;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
      className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm text-center border border-gray-100 dark:border-zinc-800 hover:shadow-md transition-shadow">
      <span className="text-3xl block mb-2">{style.emoji}</span>
      <h3 className="font-semibold text-sm">{style.name}</h3>
      <div className="text-lg font-bold mt-1" style={{ color: style.color }}>{style.percent}%</div>
      <p className="text-[10px] text-[var(--rowi-muted)] mt-1">{style.count.toLocaleString()} {t.employees}</p>
      <p className="text-[10px] text-[var(--rowi-muted)] mt-2 line-clamp-2">{style.desc}</p>
      <div className="h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full mt-3 overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ backgroundColor: style.color }} initial={{ width: 0 }} whileInView={{ width: `${style.percent * 5}%` }} viewport={{ once: true }} transition={{ duration: 0.8 }} />
      </div>
    </motion.div>
  );
}

/* =========================================================
   Main Page
========================================================= */

export default function TPAffinityPage() {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;

  const TP_TEAM = getTPTeam(t);
  const BRAIN_STYLES = getBrainStyles(t);
  const CROSS_REGION_INSIGHTS = getCrossRegionInsights(t);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/hub/admin/tp" className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> {t.backToHub}
        </Link>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-pink-500/20 text-pink-500 mb-3">
          <Sparkles className="w-3 h-3" /> {t.badge}
        </span>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Heart className="w-8 h-8 text-pink-500" /> {t.title}
        </h1>
        <p className="text-[var(--rowi-muted)]">{t.subtitle}</p>
      </div>

      {/* Team Grid */}
      <div>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Users className="w-5 h-5 text-pink-500" /> {t.topCompatibleTitle}
        </h2>
        <p className="text-sm text-[var(--rowi-muted)] mb-4">{t.topCompatibleDesc}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TP_TEAM.map((member) => (
            <TeamMemberCard key={member.id} member={member} t={t} />
          ))}
        </div>
      </div>

      {/* Brain Styles Distribution */}
      <div>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" /> {t.brainDistTitle}
        </h2>
        <p className="text-sm text-[var(--rowi-muted)] mb-4">{t.brainDistDesc}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {BRAIN_STYLES.map((style) => (
            <BrainStyleCard key={style.key} style={style} t={t} />
          ))}
        </div>
      </div>

      {/* Cross-Region Insights */}
      <div>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-500" /> {t.crossRegionTitle}
        </h2>
        <p className="text-sm text-[var(--rowi-muted)] mb-4">{t.crossRegionDesc}</p>
        <div className="grid md:grid-cols-2 gap-4">
          {CROSS_REGION_INSIGHTS.map((insight, i) => {
            const Icon = insight.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-gradient-to-br from-pink-500/5 to-purple-500/5 rounded-2xl p-5 border border-pink-500/10">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${insight.color}15` }}>
                    <Icon className="w-4 h-4" style={{ color: insight.color }} />
                  </div>
                  <p className="text-sm leading-relaxed">{insight.text}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-2xl p-6 flex gap-4">
        <Shield className="w-6 h-6 text-pink-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-pink-900 dark:text-pink-100 mb-1">{t.infoTitle}</h3>
          <p className="text-sm text-pink-700 dark:text-pink-300">
            {t.infoDesc}
          </p>
        </div>
      </motion.div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-gray-200 dark:border-zinc-800">
        <Link href="/hub/admin/tp/benchmark" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-gray-200 dark:border-zinc-700 hover:border-pink-500 transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /> {t.navBenchmark}
        </Link>
        <Link href="/hub/admin/tp/eco" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold hover:opacity-90 transition-opacity">
          {t.navEco} <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
