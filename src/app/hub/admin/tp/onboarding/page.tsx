"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Brain, Building2, Check, ChevronRight, Globe,
  Heart, Sparkles, Target, TrendingUp, Users, Zap, Shield,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   TP Onboarding Flow — Employee SEI Assessment Onboarding
   5-step flow: Welcome > Profile > Assessment > Results > Match
========================================================= */

const STEPS = [
  { id: "welcome", icon: Sparkles },
  { id: "profile", icon: Users },
  { id: "assessment", icon: Brain },
  { id: "results", icon: TrendingUp },
  { id: "match", icon: Heart },
];

const DEMO_RESULTS = {
  eqTotal: 102.4,
  pursuits: {
    K: { label: "Know Yourself", labelEs: "Con\u00f3cete", score: 104.2, color: "#3b82f6" },
    C: { label: "Choose Yourself", labelEs: "El\u00edgete", score: 100.8, color: "#10b981" },
    G: { label: "Give Yourself", labelEs: "Entr\u00e9gate", score: 102.1, color: "#f59e0b" },
  },
  competencies: [
    { key: "EL", label: "Emotional Literacy", labelEs: "Alfabetizaci\u00f3n Emocional", score: 108.3, pursuit: "K" },
    { key: "RP", label: "Recognize Patterns", labelEs: "Reconocer Patrones", score: 101.5, pursuit: "K" },
    { key: "ACT", label: "Consequential Thinking", labelEs: "Pensamiento Consecuente", score: 102.8, pursuit: "K" },
    { key: "NE", label: "Navigate Emotions", labelEs: "Navegar Emociones", score: 99.2, pursuit: "C" },
    { key: "IM", label: "Intrinsic Motivation", labelEs: "Motivaci\u00f3n Intr\u00ednseca", score: 105.1, pursuit: "C" },
    { key: "OP", label: "Exercise Optimism", labelEs: "Ejercer Optimismo", score: 97.9, pursuit: "C" },
    { key: "EMP", label: "Increase Empathy", labelEs: "Aumentar Empat\u00eda", score: 106.7, pursuit: "G" },
    { key: "NG", label: "Pursue Noble Goals", labelEs: "Metas Nobles", score: 97.5, pursuit: "G" },
  ],
  brainProfile: "Scientist",
  brainProfileEs: "Cient\u00edfico",
  brainEmoji: "\ud83d\udd2c",
  topTalents: ["Emotional Insight", "Collaboration", "Critical Thinking"],
  topTalentsEs: ["Perspicacia Emocional", "Colaboraci\u00f3n", "Pensamiento Cr\u00edtico"],
};

const BENCHMARK_COMPARE = { tpAvg: 98.7, roleAvg: 100.3, topPerformerAvg: 115.2 };

const TEAM_MATCHES = [
  { name: "Sarah Chen", role: "Team Lead \u2014 Sales NA", roleEs: "L\u00edder de Equipo \u2014 Ventas NA", compatibility: 92, brainStyle: "Strategist", brainStyleEs: "Estratega", avatar: "\ud83e\udde0", emoji: "\u265f\ufe0f" },
  { name: "Marcus Rivera", role: "Customer Success \u2014 LATAM", roleEs: "\u00c9xito del Cliente \u2014 LATAM", compatibility: 88, brainStyle: "Deliverer", brainStyleEs: "Ejecutor", avatar: "\ud83d\udcaa", emoji: "\ud83d\udce6" },
  { name: "Aiko Tanaka", role: "Product Manager \u2014 APAC", roleEs: "Gerente de Producto \u2014 APAC", compatibility: 85, brainStyle: "Inventor", brainStyleEs: "Inventor", avatar: "\ud83d\udca1", emoji: "\ud83d\udca1" },
];

const translations = {
  es: {
    badge: "Onboarding TP",
    backToTP: "TP Hub",

    // Step 1: Welcome
    welcomeTitle: "Bienvenido a Rowi",
    welcomeSubtitle: "Tu plataforma de inteligencia emocional en Teleperformance",
    welcomeDesc: "En los pr\u00f3ximos minutos, descubrir\u00e1s tu perfil de inteligencia emocional y c\u00f3mo puedes crecer dentro de TP.",
    welcomeFeatures: [
      "Evaluaci\u00f3n SEI personalizada",
      "Comparaci\u00f3n con benchmarks TP",
      "Matching y compatibilidad con tu equipo",
      "Coach de IA disponible 24/7",
    ],
    startBtn: "Comenzar mi viaje",

    // Step 2: Profile
    profileTitle: "Tu Perfil en TP",
    profileSubtitle: "Cu\u00e9ntanos sobre tu rol para personalizar tu experiencia",
    profileRegion: "Regi\u00f3n",
    profileRegions: ["Norteam\u00e9rica", "Latinoam\u00e9rica", "EMEA", "Asia Pac\u00edfico"],
    profileRole: "Rol actual",
    profileRoles: ["Atenci\u00f3n al Cliente", "Ventas", "RRHH", "TI & Tecnolog\u00eda", "Operaciones", "Gerencia"],
    profileNewHire: "\u00bfEres nuevo ingreso?",
    continueBtn: "Continuar",

    // Step 3: Assessment
    assessmentTitle: "Evaluaci\u00f3n SEI",
    assessmentSubtitle: "Simulaci\u00f3n de la evaluaci\u00f3n Six Seconds SEI",
    assessmentNote: "En producci\u00f3n, aqu\u00ed se integra el assessment real de Six Seconds. Para este demo, mostramos resultados simulados.",
    simulateBtn: "Simular evaluaci\u00f3n completada",
    backBtn: "Volver",

    // Step 4: Results
    resultsTitle: "Tus Resultados SEI",
    resultsSubtitle: "Tu perfil de inteligencia emocional",
    eqScore: "Puntaje EQ Total",
    yourScore: "Tu puntaje",
    tpAverage: "Promedio TP",
    roleAverage: "Promedio tu rol",
    topPerformer: "Top Performers",
    competencies: "Competencias",
    brainProfile: "Tu Perfil Cerebral",
    topTalents: "Tus Top Talentos",
    seeMatches: "Ver mi equipo",

    // Step 5: Match
    matchTitle: "Tu Equipo",
    matchSubtitle: "Personas con alta compatibilidad emocional en tu \u00e1rea",
    compatibility: "Compatibilidad",
    brainStyle: "Perfil Cerebral",
    finishBtn: "Completar onboarding",
    demoNote: "Este es un demo del flujo de onboarding. En producci\u00f3n, cada empleado de TP completar\u00eda este proceso con datos reales de su evaluaci\u00f3n Six Seconds SEI.",
  },
  en: {
    badge: "TP Onboarding",
    backToTP: "TP Hub",

    // Step 1: Welcome
    welcomeTitle: "Welcome to Rowi",
    welcomeSubtitle: "Your emotional intelligence platform at Teleperformance",
    welcomeDesc: "In the next few minutes, you\u2019ll discover your emotional intelligence profile and how you can grow within TP.",
    welcomeFeatures: [
      "Personalized SEI assessment",
      "Comparison with TP benchmarks",
      "Team matching & compatibility",
      "24/7 AI coaching available",
    ],
    startBtn: "Start my journey",

    // Step 2: Profile
    profileTitle: "Your TP Profile",
    profileSubtitle: "Tell us about your role to personalize your experience",
    profileRegion: "Region",
    profileRegions: ["North America", "Latin America", "EMEA", "Asia Pacific"],
    profileRole: "Current role",
    profileRoles: ["Customer Service", "Sales", "HR", "IT & Tech", "Operations", "Management"],
    profileNewHire: "Are you a new hire?",
    continueBtn: "Continue",

    // Step 3: Assessment
    assessmentTitle: "SEI Assessment",
    assessmentSubtitle: "Six Seconds SEI Assessment simulation",
    assessmentNote: "In production, the real Six Seconds assessment integrates here. For this demo, we show simulated results.",
    simulateBtn: "Simulate completed assessment",
    backBtn: "Back",

    // Step 4: Results
    resultsTitle: "Your SEI Results",
    resultsSubtitle: "Your emotional intelligence profile",
    eqScore: "Total EQ Score",
    yourScore: "Your score",
    tpAverage: "TP Average",
    roleAverage: "Role Average",
    topPerformer: "Top Performers",
    competencies: "Competencies",
    brainProfile: "Your Brain Profile",
    topTalents: "Your Top Talents",
    seeMatches: "See my team",

    // Step 5: Match
    matchTitle: "Your Team",
    matchSubtitle: "People with high emotional compatibility in your area",
    compatibility: "Compatibility",
    brainStyle: "Brain Profile",
    finishBtn: "Complete onboarding",
    demoNote: "This is a demo of the onboarding flow. In production, each TP employee would complete this process with real data from their Six Seconds SEI assessment.",
  },
};

export default function TPOnboardingPage() {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;
  const isEs = lang === "es";

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [isNewHire, setIsNewHire] = useState(false);

  const nextStep = () => { if (currentStep < STEPS.length - 1) setCurrentStep((s) => s + 1); };
  const prevStep = () => { if (currentStep > 0) setCurrentStep((s) => s - 1); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/hub/admin/tp" className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> {t.backToTP}
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-purple-500/20 text-purple-500">{t.badge}</span>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center gap-2 mb-8 max-w-2xl">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === currentStep;
            const isCompleted = i < currentStep;
            return (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${isActive ? "bg-purple-500 text-white shadow-lg scale-110" : isCompleted ? "bg-emerald-500 text-white" : "bg-gray-200 dark:bg-zinc-800 text-[var(--rowi-muted)]"}`}>
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 rounded transition-colors ${isCompleted ? "bg-emerald-500" : "bg-gray-200 dark:bg-zinc-800"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-3xl">
        <AnimatePresence mode="wait">
          {/* STEP 1: Welcome */}
          {currentStep === 0 && (
            <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
              <div className="w-32 h-32 mx-auto mb-8 relative"><Image src="/rowivectors/Rowi-01.png" alt="Rowi" fill className="object-contain" /></div>
              <h1 className="text-3xl font-bold mb-3">{t.welcomeTitle}</h1>
              <p className="text-lg text-purple-500 font-medium mb-2">{t.welcomeSubtitle}</p>
              <p className="text-[var(--rowi-muted)] mb-8 max-w-lg mx-auto">{t.welcomeDesc}</p>
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mb-10">
                {t.welcomeFeatures.map((feat, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-center gap-2 text-sm bg-white dark:bg-zinc-900 rounded-xl p-3 border border-gray-100 dark:border-zinc-800">
                    <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />{feat}
                  </motion.div>
                ))}
              </div>
              <button onClick={nextStep} className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-lg shadow-lg hover:opacity-90 transition-opacity">
                {t.startBtn} <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* STEP 2: Profile */}
          {currentStep === 1 && (
            <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <h2 className="text-2xl font-bold mb-2">{t.profileTitle}</h2>
              <p className="text-[var(--rowi-muted)] mb-8">{t.profileSubtitle}</p>
              <div className="space-y-6 max-w-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">{t.profileRegion}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {t.profileRegions.map((r) => (
                      <button key={r} onClick={() => setSelectedRegion(r)}
                        className={`px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all ${selectedRegion === r ? "border-purple-500 bg-purple-500/10 text-purple-500" : "border-gray-200 dark:border-zinc-700 hover:border-purple-500/50"}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t.profileRole}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {t.profileRoles.map((r) => (
                      <button key={r} onClick={() => setSelectedRole(r)}
                        className={`px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all ${selectedRole === r ? "border-purple-500 bg-purple-500/10 text-purple-500" : "border-gray-200 dark:border-zinc-700 hover:border-purple-500/50"}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800">
                  <span className="text-sm font-medium">{t.profileNewHire}</span>
                  <button onClick={() => setIsNewHire(!isNewHire)} className={`w-12 h-6 rounded-full transition-colors relative ${isNewHire ? "bg-purple-500" : "bg-gray-300 dark:bg-zinc-700"}`}>
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow ${isNewHire ? "translate-x-6" : "translate-x-0.5"}`} />
                  </button>
                </div>
              </div>
              <div className="flex gap-3 mt-10">
                <button onClick={prevStep} className="px-6 py-3 rounded-full border-2 border-gray-200 dark:border-zinc-700 text-sm font-medium hover:border-purple-500 transition-colors"><ArrowLeft className="w-4 h-4" /></button>
                <button onClick={nextStep} className="flex-1 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-lg hover:opacity-90 transition-opacity">
                  {t.continueBtn} <ArrowRight className="w-4 h-4 inline ml-2" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Assessment */}
          {currentStep === 2 && (
            <motion.div key="assessment" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 relative"><Image src="/rowivectors/Rowi-06.png" alt="Rowi" fill className="object-contain" /></div>
              <h2 className="text-2xl font-bold mb-2">{t.assessmentTitle}</h2>
              <p className="text-[var(--rowi-muted)] mb-6">{t.assessmentSubtitle}</p>
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-gray-100 dark:border-zinc-800 max-w-md mx-auto mb-8">
                <Brain className="w-16 h-16 mx-auto mb-4 text-purple-500 opacity-50" />
                <p className="text-sm text-[var(--rowi-muted)] mb-6">{t.assessmentNote}</p>
                <button onClick={nextStep} className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-lg hover:opacity-90 transition-opacity">
                  {t.simulateBtn} <ChevronRight className="w-5 h-5 inline ml-2" />
                </button>
              </div>
              <button onClick={prevStep} className="text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors"><ArrowLeft className="w-4 h-4 inline mr-1" /> {t.backBtn}</button>
            </motion.div>
          )}

          {/* STEP 4: Results */}
          {currentStep === 3 && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <h2 className="text-2xl font-bold mb-2">{t.resultsTitle}</h2>
              <p className="text-[var(--rowi-muted)] mb-8">{t.resultsSubtitle}</p>
              <div className="grid md:grid-cols-2 gap-6">
                {/* EQ Score */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800">
                  <h3 className="font-semibold mb-4">{t.eqScore}</h3>
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-200 dark:text-zinc-800" />
                      <motion.circle cx="50" cy="50" r="42" stroke="#7B2D8E" strokeWidth="8" fill="none" strokeLinecap="round"
                        initial={{ strokeDasharray: "0 264" }}
                        animate={{ strokeDasharray: `${((DEMO_RESULTS.eqTotal - 65) / 70) * 264} ${264 - ((DEMO_RESULTS.eqTotal - 65) / 70) * 264}` }}
                        transition={{ duration: 1.5, ease: "easeOut" }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-purple-600">{DEMO_RESULTS.eqTotal}</span>
                      <span className="text-[10px] text-[var(--rowi-muted)]">/ 135</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: t.yourScore, value: DEMO_RESULTS.eqTotal, color: "#7B2D8E" },
                      { label: t.tpAverage, value: BENCHMARK_COMPARE.tpAvg, color: "#6366f1" },
                      { label: t.roleAverage, value: BENCHMARK_COMPARE.roleAvg, color: "#3b82f6" },
                      { label: t.topPerformer, value: BENCHMARK_COMPARE.topPerformerAvg, color: "#10b981" },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[var(--rowi-muted)]">{item.label}</span>
                          <span className="font-mono font-bold" style={{ color: item.color }}>{item.value.toFixed(1)}</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full" style={{ backgroundColor: item.color }} initial={{ width: 0 }}
                            animate={{ width: `${((item.value - 65) / 70) * 100}%` }} transition={{ duration: 1, delay: i * 0.15 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Competencies */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800">
                  <h3 className="font-semibold mb-4">{t.competencies}</h3>
                  <div className="space-y-3">
                    {DEMO_RESULTS.competencies.map((comp, i) => {
                      const pursuit = DEMO_RESULTS.pursuits[comp.pursuit as keyof typeof DEMO_RESULTS.pursuits];
                      return (
                        <motion.div key={comp.key} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pursuit.color }} />
                              {isEs ? comp.labelEs : comp.label}
                            </span>
                            <span className="font-mono font-bold" style={{ color: pursuit.color }}>{comp.score.toFixed(1)}</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div className="h-full rounded-full" style={{ backgroundColor: pursuit.color }} initial={{ width: 0 }}
                              animate={{ width: `${((comp.score - 65) / 70) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.08 }} />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
                {/* Brain Profile */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800">
                  <h3 className="font-semibold mb-4">{t.brainProfile}</h3>
                  <div className="text-center">
                    <span className="text-6xl block mb-3">{DEMO_RESULTS.brainEmoji}</span>
                    <h4 className="text-xl font-bold text-purple-500">{isEs ? DEMO_RESULTS.brainProfileEs : DEMO_RESULTS.brainProfile}</h4>
                  </div>
                </div>
                {/* Top Talents */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800">
                  <h3 className="font-semibold mb-4">{t.topTalents}</h3>
                  <div className="space-y-2">
                    {(isEs ? DEMO_RESULTS.topTalentsEs : DEMO_RESULTS.topTalents).map((talent, i) => (
                      <motion.div key={talent} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.15 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                        <span className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-500 font-bold text-sm">{i + 1}</span>
                        <span className="font-medium text-sm">{talent}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={prevStep} className="px-6 py-3 rounded-full border-2 border-gray-200 dark:border-zinc-700 text-sm font-medium hover:border-purple-500 transition-colors"><ArrowLeft className="w-4 h-4" /></button>
                <button onClick={nextStep} className="flex-1 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-lg hover:opacity-90 transition-opacity">
                  {t.seeMatches} <Heart className="w-4 h-4 inline ml-2" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Team Matching */}
          {currentStep === 4 && (
            <motion.div key="match" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <h2 className="text-2xl font-bold mb-2">{t.matchTitle}</h2>
              <p className="text-[var(--rowi-muted)] mb-8">{t.matchSubtitle}</p>
              <div className="space-y-4 mb-8">
                {TEAM_MATCHES.map((match, i) => (
                  <motion.div key={match.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
                    className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-2xl">{match.avatar}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{match.name}</h4>
                        <p className="text-sm text-[var(--rowi-muted)]">{isEs ? match.roleEs : match.role}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-500">{match.compatibility}%</div>
                        <p className="text-[10px] text-[var(--rowi-muted)]">{t.compatibility}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <span className="text-xs text-[var(--rowi-muted)]">{t.brainStyle}:</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-500 font-medium">{match.emoji} {isEs ? match.brainStyleEs : match.brainStyle}</span>
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500" initial={{ width: 0 }}
                          animate={{ width: `${match.compatibility}%` }} transition={{ duration: 1, delay: i * 0.15 }} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              {/* Demo Note */}
              <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10 text-sm text-[var(--rowi-muted)] mb-8">
                <p>{t.demoNote}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={prevStep} className="px-6 py-3 rounded-full border-2 border-gray-200 dark:border-zinc-700 text-sm font-medium hover:border-purple-500 transition-colors"><ArrowLeft className="w-4 h-4" /></button>
                <Link href="/hub/admin/tp" className="flex-1 text-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-lg hover:opacity-90 transition-opacity">
                  {t.finishBtn} <Check className="w-4 h-4 inline ml-2" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
