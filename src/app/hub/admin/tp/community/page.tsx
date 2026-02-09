"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Users, Trophy, Star, Flame, Crown, Heart,
  Brain, Target, Sparkles, Shield, Calendar, BookOpen, Award, Zap,
  TrendingUp, MessageSquare, Globe, Building2, Medal,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   TP Community — EQ Community Dashboard
   Leaderboards, events, peer learning, recognition
========================================================= */

const translations = {
  es: {
    // Header
    backToHub: "TP Hub",
    communityBadge: "Comunidad",
    pageTitle: "Comunidad EQ de TP",
    pageDescription: "La comunidad de inteligencia emocional de Teleperformance — eventos, clasificaciones, logros y aprendizaje entre pares",

    // Leaderboard
    eqLeaderboard: "Clasificación EQ",
    filterGlobal: "Global",

    // Leaderboard member fields
    deptCustomerSuccess: "Éxito del Cliente",
    deptHR: "RRHH",
    deptSales: "Ventas",
    deptOperations: "Operaciones",
    deptIT: "TI",
    deptCustomerService: "Servicio al Cliente",
    deptTraining: "Capacitación",

    brainStyleSuperhero: "Superhéroe",
    brainStyleVisionary: "Visionario",
    brainStyleStrategist: "Estratega",
    brainStyleInventor: "Inventor",
    brainStyleScientist: "Científico",
    brainStyleGuardian: "Guardián",
    brainStyleDeliverer: "Ejecutor",

    // Community stats
    statMembers: "Miembros",
    statCountries: "Países",
    statAchievements: "Logros",
    statUpcomingEvents: "Eventos Próximos",
    statAvgEqGrowth: "Crecimiento EQ Prom.",
    statActiveStreaks: "Rachas Activas",

    // Achievements section
    achievementsTitle: "Logros",
    unlocked: "desbloqueados",
    achEqExplorer: "Explorador EQ",
    achEqExplorerDesc: "Completa tu primera evaluación SEI",
    achBrainMaster: "Maestro Cerebral",
    achBrainMasterDesc: "Comprende los 7 perfiles cerebrales",
    achEmpathyChampion: "Campeón de Empatía",
    achEmpathyChampionDesc: "Obtén más de 110 en Empatía",
    achGrowthMindset: "Mentalidad de Crecimiento",
    achGrowthMindsetDesc: "Mejora tu EQ en 5+ puntos",
    achTeamBuilder: "Constructor de Equipos",
    achTeamBuilderDesc: "Completa 3 sesiones de afinidad grupal",
    achGlobalCitizen: "Ciudadano Global",
    achGlobalCitizenDesc: "Conéctate con 5+ regiones",
    achCoachingStar: "Estrella de Coaching",
    achCoachingStarDesc: "Completa 20 sesiones de coaching",
    achEqLegend: "Leyenda EQ",
    achEqLegendDesc: "Alcanza el top 5% en puntuación EQ",

    // Events
    upcomingEvents: "Eventos Próximos",
    participants: "participantes",
    eventEmpathyWeekTitle: "Reto EQ: Semana de la Empatía",
    eventEmpathyWeekDesc: "Reto de 7 días enfocado en desarrollar la competencia de Empatía en todas las regiones de TP",
    eventBrainStyleTitle: "Taller de Estilos Cerebrales: Científicos",
    eventBrainStyleDesc: "Taller intensivo para perfiles cerebrales Científicos — aprovechando fortalezas analíticas",
    eventCrossCulturalTitle: "Masterclass EQ Intercultural",
    eventCrossCulturalDesc: "Cómo adaptar la comunicación emocional en las 42 operaciones de TP a nivel mundial",
    eventHackathonTitle: "Hackathon EQ: Sprint de Innovación",
    eventHackathonDesc: "Los equipos compiten para crear la mejor solución de experiencia al cliente impulsada por EQ",
    eventTypeChallenge: "Reto",
    eventTypeWorkshop: "Taller",
    eventTypeMasterclass: "Masterclass",
    eventTypeHackathon: "Hackathon",

    // Learning
    learningTitle: "Aprendizaje",
    resourceSeiFundamentals: "Fundamentos SEI",
    resourceSeiFundamentalsType: "Curso",
    resourceNavigateEmotions: "Taller Navegar Emociones",
    resourceNavigateEmotionsType: "Taller",
    resourceLeadershipEQ: "Ruta de Liderazgo EQ",
    resourceLeadershipEQType: "Ruta de Aprendizaje",
    resourceBrainStyles: "Estilos Cerebrales a Fondo",
    resourceBrainStylesType: "Serie de Videos",

    // Info box
    infoTitle: "Comunidad EQ de TP",
    infoDescription: "Comunidad EQ empresarial de Teleperformance. Las puntuaciones de la clasificación se agregan a partir de evaluaciones SEI reales. Los eventos y logros son parte del motor de gamificación de Rowi.",

    // Navigation
    navCoach: "Coach",
    navOnboarding: "Onboarding",
  },
  en: {
    // Header
    backToHub: "TP Hub",
    communityBadge: "Community",
    pageTitle: "TP EQ Community",
    pageDescription: "The Teleperformance emotional intelligence community — events, leaderboards, achievements, and peer learning",

    // Leaderboard
    eqLeaderboard: "EQ Leaderboard",
    filterGlobal: "Global",

    // Leaderboard member fields
    deptCustomerSuccess: "Customer Success",
    deptHR: "HR",
    deptSales: "Sales",
    deptOperations: "Operations",
    deptIT: "IT",
    deptCustomerService: "Customer Service",
    deptTraining: "Training",

    brainStyleSuperhero: "Superhero",
    brainStyleVisionary: "Visionary",
    brainStyleStrategist: "Strategist",
    brainStyleInventor: "Inventor",
    brainStyleScientist: "Scientist",
    brainStyleGuardian: "Guardian",
    brainStyleDeliverer: "Deliverer",

    // Community stats
    statMembers: "Members",
    statCountries: "Countries",
    statAchievements: "Achievements",
    statUpcomingEvents: "Upcoming Events",
    statAvgEqGrowth: "Avg EQ Growth",
    statActiveStreaks: "Active Streaks",

    // Achievements section
    achievementsTitle: "Achievements",
    unlocked: "unlocked",
    achEqExplorer: "EQ Explorer",
    achEqExplorerDesc: "Complete first SEI assessment",
    achBrainMaster: "Brain Master",
    achBrainMasterDesc: "Understand all 7 brain profiles",
    achEmpathyChampion: "Empathy Champion",
    achEmpathyChampionDesc: "Score above 110 in Empathy",
    achGrowthMindset: "Growth Mindset",
    achGrowthMindsetDesc: "Improve EQ by 5+ points",
    achTeamBuilder: "Team Builder",
    achTeamBuilderDesc: "Complete 3 team affinity sessions",
    achGlobalCitizen: "Global Citizen",
    achGlobalCitizenDesc: "Connect with 5+ regions",
    achCoachingStar: "Coaching Star",
    achCoachingStarDesc: "Complete 20 coaching sessions",
    achEqLegend: "EQ Legend",
    achEqLegendDesc: "Reach top 5% in EQ score",

    // Events
    upcomingEvents: "Upcoming Events",
    participants: "participants",
    eventEmpathyWeekTitle: "EQ Challenge: Empathy Week",
    eventEmpathyWeekDesc: "7-day challenge focused on developing Empathy competency across all TP regions",
    eventBrainStyleTitle: "Brain Style Workshop: Scientists",
    eventBrainStyleDesc: "Deep-dive workshop for Scientist brain profiles — leveraging analytical strengths",
    eventCrossCulturalTitle: "Cross-Cultural EQ Masterclass",
    eventCrossCulturalDesc: "How to adapt emotional communication across TP's 42 country operations",
    eventHackathonTitle: "EQ Hackathon: Innovation Sprint",
    eventHackathonDesc: "Teams compete to create the best EQ-driven customer experience solution",
    eventTypeChallenge: "Challenge",
    eventTypeWorkshop: "Workshop",
    eventTypeMasterclass: "Masterclass",
    eventTypeHackathon: "Hackathon",

    // Learning
    learningTitle: "Learning",
    resourceSeiFundamentals: "SEI Fundamentals",
    resourceSeiFundamentalsType: "Course",
    resourceNavigateEmotions: "Navigate Emotions Workshop",
    resourceNavigateEmotionsType: "Workshop",
    resourceLeadershipEQ: "Leadership EQ Path",
    resourceLeadershipEQType: "Learning Path",
    resourceBrainStyles: "Brain Styles Deep Dive",
    resourceBrainStylesType: "Video Series",

    // Info box
    infoTitle: "TP EQ Community",
    infoDescription: "Enterprise EQ community for Teleperformance. Leaderboard scores are aggregated from real SEI assessments. Events and achievements are part of the Rowi gamification engine.",

    // Navigation
    navCoach: "Coach",
    navOnboarding: "Onboarding",
  },
};

/* Main Page */
export default function TPCommunityPage() {
  const [leaderboardFilter, setLeaderboardFilter] = useState("global");
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;

  const LEADERBOARD = [
    { rank: 1, name: "Priya Sharma", region: "APAC", dept: t.deptCustomerSuccess, eqScore: 118.7, growth: "+8.3", brainStyle: t.brainStyleSuperhero, emoji: "\u{1f9b8}", avatar: "/rowivectors/Rowi-06.png" },
    { rank: 2, name: "David Okonkwo", region: "EMEA", dept: t.deptHR, eqScore: 116.2, growth: "+7.1", brainStyle: t.brainStyleVisionary, emoji: "\u{1f52e}", avatar: "/rowivectors/Rowi-05.png" },
    { rank: 3, name: "Maria Santos", region: "LATAM", dept: t.deptSales, eqScore: 115.8, growth: "+6.9", brainStyle: t.brainStyleStrategist, emoji: "\u265f\ufe0f", avatar: "/rowivectors/Rowi-04.png" },
    { rank: 4, name: "James Wilson", region: "NA", dept: t.deptOperations, eqScore: 114.5, growth: "+5.4", brainStyle: t.brainStyleInventor, emoji: "\u{1f4a1}", avatar: "/rowivectors/Rowi-03.png" },
    { rank: 5, name: "Li Wei", region: "APAC", dept: t.deptIT, eqScore: 113.9, growth: "+6.2", brainStyle: t.brainStyleScientist, emoji: "\u{1f52c}", avatar: "/rowivectors/Rowi-02.png" },
    { rank: 6, name: "Anna Kowalski", region: "EMEA", dept: t.deptCustomerService, eqScore: 112.8, growth: "+4.8", brainStyle: t.brainStyleGuardian, emoji: "\u{1f6e1}\ufe0f", avatar: "/rowivectors/Rowi-01.png" },
    { rank: 7, name: "Roberto D\u00edaz", region: "LATAM", dept: t.deptTraining, eqScore: 112.1, growth: "+5.7", brainStyle: t.brainStyleDeliverer, emoji: "\u{1f4e6}", avatar: "/rowivectors/Rowi-06.png" },
    { rank: 8, name: "Sarah Mitchell", region: "NA", dept: t.deptSales, eqScore: 111.5, growth: "+4.2", brainStyle: t.brainStyleStrategist, emoji: "\u265f\ufe0f", avatar: "/rowivectors/Rowi-05.png" },
  ];

  const EVENTS = [
    { title: t.eventEmpathyWeekTitle, date: "Feb 17-21, 2025", type: t.eventTypeChallenge, icon: Heart, color: "#ec4899", participants: 2847, desc: t.eventEmpathyWeekDesc },
    { title: t.eventBrainStyleTitle, date: "Feb 24, 2025", type: t.eventTypeWorkshop, icon: Brain, color: "#3b82f6", participants: 428, desc: t.eventBrainStyleDesc },
    { title: t.eventCrossCulturalTitle, date: "Mar 3, 2025", type: t.eventTypeMasterclass, icon: Globe, color: "#10b981", participants: 1205, desc: t.eventCrossCulturalDesc },
    { title: t.eventHackathonTitle, date: "Mar 10-14, 2025", type: t.eventTypeHackathon, icon: Zap, color: "#f59e0b", participants: 356, desc: t.eventHackathonDesc },
  ];

  const ACHIEVEMENTS = [
    { title: t.achEqExplorer, desc: t.achEqExplorerDesc, icon: "\u{1f9ed}", unlocked: 14886 },
    { title: t.achBrainMaster, desc: t.achBrainMasterDesc, icon: "\u{1f9e0}", unlocked: 8742 },
    { title: t.achEmpathyChampion, desc: t.achEmpathyChampionDesc, icon: "\u{1f496}", unlocked: 3214 },
    { title: t.achGrowthMindset, desc: t.achGrowthMindsetDesc, icon: "\u{1f331}", unlocked: 5891 },
    { title: t.achTeamBuilder, desc: t.achTeamBuilderDesc, icon: "\u{1f91d}", unlocked: 2103 },
    { title: t.achGlobalCitizen, desc: t.achGlobalCitizenDesc, icon: "\u{1f30d}", unlocked: 1567 },
    { title: t.achCoachingStar, desc: t.achCoachingStarDesc, icon: "\u2b50", unlocked: 982 },
    { title: t.achEqLegend, desc: t.achEqLegendDesc, icon: "\u{1f451}", unlocked: 744 },
  ];

  const COMMUNITY_STATS = [
    { icon: Users, value: "14,886", label: t.statMembers, color: "#3b82f6" },
    { icon: Globe, value: "42", label: t.statCountries, color: "#10b981" },
    { icon: Trophy, value: "8", label: t.statAchievements, color: "#f59e0b" },
    { icon: Calendar, value: "4", label: t.statUpcomingEvents, color: "#ec4899" },
    { icon: TrendingUp, value: "+3.2", label: t.statAvgEqGrowth, color: "#8b5cf6" },
    { icon: Flame, value: "847", label: t.statActiveStreaks, color: "#ef4444" },
  ];

  const LEARNING_RESOURCES = [
    { title: t.resourceSeiFundamentals, type: t.resourceSeiFundamentalsType, duration: "2h 30min", completions: 9841, icon: BookOpen, color: "#3b82f6" },
    { title: t.resourceNavigateEmotions, type: t.resourceNavigateEmotionsType, duration: "45min", completions: 6234, icon: Heart, color: "#ec4899" },
    { title: t.resourceLeadershipEQ, type: t.resourceLeadershipEQType, duration: "8h", completions: 2891, icon: Crown, color: "#f59e0b" },
    { title: t.resourceBrainStyles, type: t.resourceBrainStylesType, duration: "3h 15min", completions: 5127, icon: Brain, color: "#8b5cf6" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/hub/admin/tp" className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> {t.backToHub}
        </Link>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-600 mb-3">
          <Sparkles className="w-3 h-3" /> {t.communityBadge}
        </span>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Users className="w-8 h-8 text-amber-500" /> {t.pageTitle}
        </h1>
        <p className="text-[var(--rowi-muted)]">{t.pageDescription}</p>
      </div>

      {/* Community Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {COMMUNITY_STATS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-gray-100 dark:border-zinc-800 text-center">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: `${stat.color}15` }}>
                <Icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <div className="text-lg font-bold">{stat.value}</div>
              <div className="text-[10px] text-[var(--rowi-muted)]">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Leaderboard */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> {t.eqLeaderboard}</h2>
            <div className="flex gap-1">
              {["global", "NA", "LATAM", "EMEA", "APAC"].map((filter) => (
                <button key={filter} onClick={() => setLeaderboardFilter(filter)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${leaderboardFilter === filter ? "bg-amber-500 text-white" : "text-[var(--rowi-muted)] hover:bg-gray-100 dark:hover:bg-zinc-800"}`}>
                  {filter === "global" ? t.filterGlobal : filter}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
            {LEADERBOARD.filter((m) => leaderboardFilter === "global" || m.region === leaderboardFilter).map((member, i) => (
              <motion.div key={member.rank} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-4 p-4 ${i > 0 ? "border-t border-gray-100 dark:border-zinc-800" : ""} hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${member.rank <= 3 ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white" : "bg-gray-100 dark:bg-zinc-800 text-[var(--rowi-muted)]"}`}>
                  {member.rank}
                </div>
                <div className="relative w-10 h-10 shrink-0"><Image src={member.avatar} alt={member.name} fill className="object-contain" /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{member.name}</div>
                  <div className="text-[10px] text-[var(--rowi-muted)]">{member.dept} &bull; {member.region}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-purple-600">{member.eqScore.toFixed(1)}</div>
                  <div className="text-[10px] text-emerald-500 font-medium">{member.growth}</div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-500 shrink-0">{member.emoji}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Achievements */}
          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Medal className="w-5 h-5 text-amber-500" /> {t.achievementsTitle}</h2>
            <div className="grid grid-cols-2 gap-2">
              {ACHIEVEMENTS.map((ach, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-gray-100 dark:border-zinc-800 text-center hover:shadow-md transition-shadow">
                  <span className="text-2xl block mb-1">{ach.icon}</span>
                  <h4 className="font-medium text-xs mb-0.5">{ach.title}</h4>
                  <p className="text-[9px] text-[var(--rowi-muted)] mb-1">{ach.desc}</p>
                  <span className="text-[9px] text-purple-500 font-mono">{ach.unlocked.toLocaleString()} {t.unlocked}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Learning Resources */}
          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-500" /> {t.learningTitle}</h2>
            <div className="space-y-2">
              {LEARNING_RESOURCES.map((resource, i) => {
                const Icon = resource.icon;
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
                    className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-gray-100 dark:border-zinc-800 flex items-center gap-3 hover:shadow-sm transition-shadow cursor-pointer">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${resource.color}15` }}>
                      <Icon className="w-4 h-4" style={{ color: resource.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs truncate">{resource.title}</div>
                      <div className="text-[9px] text-[var(--rowi-muted)]">{resource.type} &bull; {resource.duration}</div>
                    </div>
                    <span className="text-[9px] text-[var(--rowi-muted)] shrink-0">{resource.completions.toLocaleString()}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Events */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-pink-500" /> {t.upcomingEvents}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {EVENTS.map((event, i) => {
            const Icon = event.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 hover:shadow-lg transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${event.color}15` }}>
                    <Icon className="w-6 h-6" style={{ color: event.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm">{event.title}</h3>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${event.color}15`, color: event.color }}>{event.type}</span>
                    </div>
                    <p className="text-xs text-purple-500 font-medium mb-2">{event.date}</p>
                    <p className="text-xs text-[var(--rowi-muted)] mb-2">{event.desc}</p>
                    <div className="flex items-center gap-1 text-[10px] text-[var(--rowi-muted)]">
                      <Users className="w-3 h-3" /> {event.participants.toLocaleString()} {t.participants}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 flex gap-4">
        <Shield className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">{t.infoTitle}</h3>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {t.infoDescription}
          </p>
        </div>
      </motion.div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-gray-200 dark:border-zinc-800">
        <Link href="/hub/admin/tp/coach" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-gray-200 dark:border-zinc-700 hover:border-amber-500 transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /> {t.navCoach}
        </Link>
        <Link href="/hub/admin/tp/onboarding" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:opacity-90 transition-opacity">
          {t.navOnboarding} <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
