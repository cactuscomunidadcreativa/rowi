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

export default function TPOnboardingPage() {
  const { lang, t } = useI18n();
  const isEs = lang === "es";

  const welcomeFeatures = [
    t("tpOnboarding.welcomeFeature0", "Evaluaci\u00f3n SEI personalizada"),
    t("tpOnboarding.welcomeFeature1", "Comparaci\u00f3n con benchmarks TP"),
    t("tpOnboarding.welcomeFeature2", "Matching y compatibilidad con tu equipo"),
    t("tpOnboarding.welcomeFeature3", "Coach de IA disponible 24/7"),
  ];
  const profileRegions = [
    t("tpOnboarding.profileRegion0", "Norteam\u00e9rica"),
    t("tpOnboarding.profileRegion1", "Latinoam\u00e9rica"),
    t("tpOnboarding.profileRegion2", "EMEA"),
    t("tpOnboarding.profileRegion3", "Asia Pac\u00edfico"),
  ];
  const profileRoles = [
    t("tpOnboarding.profileRole0", "Atenci\u00f3n al Cliente"),
    t("tpOnboarding.profileRole1", "Ventas"),
    t("tpOnboarding.profileRole2", "RRHH"),
    t("tpOnboarding.profileRole3", "TI & Tecnolog\u00eda"),
    t("tpOnboarding.profileRole4", "Operaciones"),
    t("tpOnboarding.profileRole5", "Gerencia"),
  ];

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
          <ArrowLeft className="w-4 h-4" /> {t("tpOnboarding.backToTP", "TP Hub")}
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-purple-500/20 text-purple-500">{t("tpOnboarding.badge", "Onboarding TP")}</span>
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
              <div className="w-32 h-32 mx-auto mb-8 relative"><Image src="/rowivectors/Rowi-01.webp" alt="Rowi" fill className="object-contain" /></div>
              <h1 className="text-3xl font-bold mb-3">{t("tpOnboarding.welcomeTitle", "Bienvenido a Rowi")}</h1>
              <p className="text-lg text-purple-500 font-medium mb-2">{t("tpOnboarding.welcomeSubtitle", "Tu plataforma de inteligencia emocional en Teleperformance")}</p>
              <p className="text-[var(--rowi-muted)] mb-8 max-w-lg mx-auto">{t("tpOnboarding.welcomeDesc", "En los próximos minutos, descubrirás tu perfil de inteligencia emocional y cómo puedes crecer dentro de TP.")}</p>
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mb-10">
                {welcomeFeatures.map((feat, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-center gap-2 text-sm bg-white dark:bg-zinc-900 rounded-xl p-3 border border-gray-100 dark:border-zinc-800">
                    <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />{feat}
                  </motion.div>
                ))}
              </div>
              <button onClick={nextStep} className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold text-lg shadow-lg hover:opacity-90 transition-opacity">
                {t("tpOnboarding.startBtn", "Comenzar mi viaje")} <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* STEP 2: Profile */}
          {currentStep === 1 && (
            <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <h2 className="text-2xl font-bold mb-2">{t("tpOnboarding.profileTitle", "Tu Perfil en TP")}</h2>
              <p className="text-[var(--rowi-muted)] mb-8">{t("tpOnboarding.profileSubtitle", "Cuéntanos sobre tu rol para personalizar tu experiencia")}</p>
              <div className="space-y-6 max-w-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">{t("tpOnboarding.profileRegion", "Región")}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {profileRegions.map((r) => (
                      <button key={r} onClick={() => setSelectedRegion(r)}
                        className={`px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all ${selectedRegion === r ? "border-purple-500 bg-purple-500/10 text-purple-500" : "border-gray-200 dark:border-zinc-700 hover:border-purple-500/50"}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("tpOnboarding.profileRole", "Rol actual")}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {profileRoles.map((r) => (
                      <button key={r} onClick={() => setSelectedRole(r)}
                        className={`px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all ${selectedRole === r ? "border-purple-500 bg-purple-500/10 text-purple-500" : "border-gray-200 dark:border-zinc-700 hover:border-purple-500/50"}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800">
                  <span className="text-sm font-medium">{t("tpOnboarding.profileNewHire", "¿Eres nuevo ingreso?")}</span>
                  <button onClick={() => setIsNewHire(!isNewHire)} className={`w-12 h-6 rounded-full transition-colors relative ${isNewHire ? "bg-purple-500" : "bg-gray-300 dark:bg-zinc-700"}`}>
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow ${isNewHire ? "translate-x-6" : "translate-x-0.5"}`} />
                  </button>
                </div>
              </div>
              <div className="flex gap-3 mt-10">
                <button onClick={prevStep} className="px-6 py-3 rounded-full border-2 border-gray-200 dark:border-zinc-700 text-sm font-medium hover:border-purple-500 transition-colors"><ArrowLeft className="w-4 h-4" /></button>
                <button onClick={nextStep} className="flex-1 px-6 py-3 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold shadow-lg hover:opacity-90 transition-opacity">
                  {t("tpOnboarding.continueBtn", "Continuar")} <ArrowRight className="w-4 h-4 inline ml-2" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Assessment */}
          {currentStep === 2 && (
            <motion.div key="assessment" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 relative"><Image src="/rowivectors/Rowi-06.webp" alt="Rowi" fill className="object-contain" /></div>
              <h2 className="text-2xl font-bold mb-2">{t("tpOnboarding.assessmentTitle", "Evaluación SEI")}</h2>
              <p className="text-[var(--rowi-muted)] mb-6">{t("tpOnboarding.assessmentSubtitle", "Simulación de la evaluación Six Seconds SEI")}</p>
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-gray-100 dark:border-zinc-800 max-w-md mx-auto mb-8">
                <Brain className="w-16 h-16 mx-auto mb-4 text-purple-500 opacity-50" />
                <p className="text-sm text-[var(--rowi-muted)] mb-6">{t("tpOnboarding.assessmentNote", "En producción, aquí se integra el assessment real de Six Seconds. Para este demo, mostramos resultados simulados.")}</p>
                <button onClick={nextStep} className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold shadow-lg hover:opacity-90 transition-opacity">
                  {t("tpOnboarding.simulateBtn", "Simular evaluación completada")} <ChevronRight className="w-5 h-5 inline ml-2" />
                </button>
              </div>
              <button onClick={prevStep} className="text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors"><ArrowLeft className="w-4 h-4 inline mr-1" /> {t("tpOnboarding.backBtn", "Volver")}</button>
            </motion.div>
          )}

          {/* STEP 4: Results */}
          {currentStep === 3 && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <h2 className="text-2xl font-bold mb-2">{t("tpOnboarding.resultsTitle", "Tus Resultados SEI")}</h2>
              <p className="text-[var(--rowi-muted)] mb-8">{t("tpOnboarding.resultsSubtitle", "Tu perfil de inteligencia emocional")}</p>
              <div className="grid md:grid-cols-2 gap-6">
                {/* EQ Score */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800">
                  <h3 className="font-semibold mb-4">{t("tpOnboarding.eqScore", "Puntaje EQ Total")}</h3>
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
                      { label: t("tpOnboarding.yourScore", "Tu puntaje"), value: DEMO_RESULTS.eqTotal, color: "#7B2D8E" },
                      { label: t("tpOnboarding.tpAverage", "Promedio TP"), value: BENCHMARK_COMPARE.tpAvg, color: "#6366f1" },
                      { label: t("tpOnboarding.roleAverage", "Promedio tu rol"), value: BENCHMARK_COMPARE.roleAvg, color: "#3b82f6" },
                      { label: t("tpOnboarding.topPerformer", "Top Performers"), value: BENCHMARK_COMPARE.topPerformerAvg, color: "#10b981" },
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
                  <h3 className="font-semibold mb-4">{t("tpOnboarding.competencies", "Competencias")}</h3>
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
                  <h3 className="font-semibold mb-4">{t("tpOnboarding.brainProfile", "Tu Perfil Cerebral")}</h3>
                  <div className="text-center">
                    <span className="text-6xl block mb-3">{DEMO_RESULTS.brainEmoji}</span>
                    <h4 className="text-xl font-bold text-purple-500">{isEs ? DEMO_RESULTS.brainProfileEs : DEMO_RESULTS.brainProfile}</h4>
                  </div>
                </div>
                {/* Top Talents */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800">
                  <h3 className="font-semibold mb-4">{t("tpOnboarding.topTalents", "Tus Top Talentos")}</h3>
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
                <button onClick={nextStep} className="flex-1 px-6 py-3 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold shadow-lg hover:opacity-90 transition-opacity">
                  {t("tpOnboarding.seeMatches", "Ver mi equipo")} <Heart className="w-4 h-4 inline ml-2" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Team Matching */}
          {currentStep === 4 && (
            <motion.div key="match" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <h2 className="text-2xl font-bold mb-2">{t("tpOnboarding.matchTitle", "Tu Equipo")}</h2>
              <p className="text-[var(--rowi-muted)] mb-8">{t("tpOnboarding.matchSubtitle", "Personas con alta compatibilidad emocional en tu área")}</p>
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
                        <p className="text-[10px] text-[var(--rowi-muted)]">{t("tpOnboarding.compatibility", "Compatibilidad")}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <span className="text-xs text-[var(--rowi-muted)]">{t("tpOnboarding.brainStyle", "Perfil Cerebral")}:</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-500 font-medium">{match.emoji} {isEs ? match.brainStyleEs : match.brainStyle}</span>
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600" initial={{ width: 0 }}
                          animate={{ width: `${match.compatibility}%` }} transition={{ duration: 1, delay: i * 0.15 }} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              {/* Demo Note */}
              <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10 text-sm text-[var(--rowi-muted)] mb-8">
                <p>{t("tpOnboarding.demoNote", "Este es un demo del flujo de onboarding. En producción, cada empleado de TP completaría este proceso con datos reales de su evaluación Six Seconds SEI.")}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={prevStep} className="px-6 py-3 rounded-full border-2 border-gray-200 dark:border-zinc-700 text-sm font-medium hover:border-purple-500 transition-colors"><ArrowLeft className="w-4 h-4" /></button>
                <Link href="/hub/admin/tp" className="flex-1 text-center px-6 py-3 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold shadow-lg hover:opacity-90 transition-opacity">
                  {t("tpOnboarding.finishBtn", "Completar onboarding")} <Check className="w-4 h-4 inline ml-2" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
