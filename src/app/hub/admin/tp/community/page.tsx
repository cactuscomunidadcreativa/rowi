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

/* Main Page */
export default function TPCommunityPage() {
  const [leaderboardFilter, setLeaderboardFilter] = useState("global");
  const { t } = useI18n();

  const LEADERBOARD = [
    { rank: 1, name: "Priya Sharma", region: "APAC", dept: t("tpCommunity.deptCustomerSuccess", "Éxito del Cliente"), eqScore: 118.7, growth: "+8.3", brainStyle: t("tpCommunity.brainStyleSuperhero", "Superhéroe"), emoji: "\u{1f9b8}", avatar: "/rowivectors/Rowi-06.webp" },
    { rank: 2, name: "David Okonkwo", region: "EMEA", dept: t("tpCommunity.deptHR", "RRHH"), eqScore: 116.2, growth: "+7.1", brainStyle: t("tpCommunity.brainStyleVisionary", "Visionario"), emoji: "\u{1f52e}", avatar: "/rowivectors/Rowi-05.webp" },
    { rank: 3, name: "Maria Santos", region: "LATAM", dept: t("tpCommunity.deptSales", "Ventas"), eqScore: 115.8, growth: "+6.9", brainStyle: t("tpCommunity.brainStyleStrategist", "Estratega"), emoji: "♟️", avatar: "/rowivectors/Rowi-04.webp" },
    { rank: 4, name: "James Wilson", region: "NA", dept: t("tpCommunity.deptOperations", "Operaciones"), eqScore: 114.5, growth: "+5.4", brainStyle: t("tpCommunity.brainStyleInventor", "Inventor"), emoji: "\u{1f4a1}", avatar: "/rowivectors/Rowi-03.webp" },
    { rank: 5, name: "Li Wei", region: "APAC", dept: t("tpCommunity.deptIT", "TI"), eqScore: 113.9, growth: "+6.2", brainStyle: t("tpCommunity.brainStyleScientist", "Científico"), emoji: "\u{1f52c}", avatar: "/rowivectors/Rowi-02.webp" },
    { rank: 6, name: "Anna Kowalski", region: "EMEA", dept: t("tpCommunity.deptCustomerService", "Servicio al Cliente"), eqScore: 112.8, growth: "+4.8", brainStyle: t("tpCommunity.brainStyleGuardian", "Guardián"), emoji: "\u{1f6e1}️", avatar: "/rowivectors/Rowi-01.webp" },
    { rank: 7, name: "Roberto Díaz", region: "LATAM", dept: t("tpCommunity.deptTraining", "Capacitación"), eqScore: 112.1, growth: "+5.7", brainStyle: t("tpCommunity.brainStyleDeliverer", "Ejecutor"), emoji: "\u{1f4e6}", avatar: "/rowivectors/Rowi-06.webp" },
    { rank: 8, name: "Sarah Mitchell", region: "NA", dept: t("tpCommunity.deptSales", "Ventas"), eqScore: 111.5, growth: "+4.2", brainStyle: t("tpCommunity.brainStyleStrategist", "Estratega"), emoji: "♟️", avatar: "/rowivectors/Rowi-05.webp" },
  ];

  const EVENTS = [
    { title: t("tpCommunity.eventEmpathyWeekTitle", "Reto EQ: Semana de la Empatía"), date: "Feb 17-21, 2025", type: t("tpCommunity.eventTypeChallenge", "Reto"), icon: Heart, color: "#ec4899", participants: 2847, desc: t("tpCommunity.eventEmpathyWeekDesc", "Reto de 7 días enfocado en desarrollar la competencia de Empatía en todas las regiones de TP") },
    { title: t("tpCommunity.eventBrainStyleTitle", "Taller de Estilos Cerebrales: Científicos"), date: "Feb 24, 2025", type: t("tpCommunity.eventTypeWorkshop", "Taller"), icon: Brain, color: "#3b82f6", participants: 428, desc: t("tpCommunity.eventBrainStyleDesc", "Taller intensivo para perfiles cerebrales Científicos — aprovechando fortalezas analíticas") },
    { title: t("tpCommunity.eventCrossCulturalTitle", "Masterclass EQ Intercultural"), date: "Mar 3, 2025", type: t("tpCommunity.eventTypeMasterclass", "Masterclass"), icon: Globe, color: "#10b981", participants: 1205, desc: t("tpCommunity.eventCrossCulturalDesc", "Cómo adaptar la comunicación emocional en las 42 operaciones de TP a nivel mundial") },
    { title: t("tpCommunity.eventHackathonTitle", "Hackathon EQ: Sprint de Innovación"), date: "Mar 10-14, 2025", type: t("tpCommunity.eventTypeHackathon", "Hackathon"), icon: Zap, color: "#f59e0b", participants: 356, desc: t("tpCommunity.eventHackathonDesc", "Los equipos compiten para crear la mejor solución de experiencia al cliente impulsada por EQ") },
  ];

  const ACHIEVEMENTS = [
    { title: t("tpCommunity.achEqExplorer", "Explorador EQ"), desc: t("tpCommunity.achEqExplorerDesc", "Completa tu primera evaluación SEI"), icon: "\u{1f9ed}", unlocked: 14886 },
    { title: t("tpCommunity.achBrainMaster", "Maestro Cerebral"), desc: t("tpCommunity.achBrainMasterDesc", "Comprende los 7 perfiles cerebrales"), icon: "\u{1f9e0}", unlocked: 8742 },
    { title: t("tpCommunity.achEmpathyChampion", "Campeón de Empatía"), desc: t("tpCommunity.achEmpathyChampionDesc", "Obtén más de 110 en Empatía"), icon: "\u{1f496}", unlocked: 3214 },
    { title: t("tpCommunity.achGrowthMindset", "Mentalidad de Crecimiento"), desc: t("tpCommunity.achGrowthMindsetDesc", "Mejora tu EQ en 5+ puntos"), icon: "\u{1f331}", unlocked: 5891 },
    { title: t("tpCommunity.achTeamBuilder", "Constructor de Equipos"), desc: t("tpCommunity.achTeamBuilderDesc", "Completa 3 sesiones de afinidad grupal"), icon: "\u{1f91d}", unlocked: 2103 },
    { title: t("tpCommunity.achGlobalCitizen", "Ciudadano Global"), desc: t("tpCommunity.achGlobalCitizenDesc", "Conéctate con 5+ regiones"), icon: "\u{1f30d}", unlocked: 1567 },
    { title: t("tpCommunity.achCoachingStar", "Estrella de Coaching"), desc: t("tpCommunity.achCoachingStarDesc", "Completa 20 sesiones de coaching"), icon: "⭐", unlocked: 982 },
    { title: t("tpCommunity.achEqLegend", "Leyenda EQ"), desc: t("tpCommunity.achEqLegendDesc", "Alcanza el top 5% en puntuación EQ"), icon: "\u{1f451}", unlocked: 744 },
  ];

  const COMMUNITY_STATS = [
    { icon: Users, value: "14,886", label: t("tpCommunity.statMembers", "Miembros"), color: "#3b82f6" },
    { icon: Globe, value: "42", label: t("tpCommunity.statCountries", "Países"), color: "#10b981" },
    { icon: Trophy, value: "8", label: t("tpCommunity.statAchievements", "Logros"), color: "#f59e0b" },
    { icon: Calendar, value: "4", label: t("tpCommunity.statUpcomingEvents", "Eventos Próximos"), color: "#ec4899" },
    { icon: TrendingUp, value: "+3.2", label: t("tpCommunity.statAvgEqGrowth", "Crecimiento EQ Prom."), color: "#8b5cf6" },
    { icon: Flame, value: "847", label: t("tpCommunity.statActiveStreaks", "Rachas Activas"), color: "#ef4444" },
  ];

  const LEARNING_RESOURCES = [
    { title: t("tpCommunity.resourceSeiFundamentals", "Fundamentos SEI"), type: t("tpCommunity.resourceSeiFundamentalsType", "Curso"), duration: "2h 30min", completions: 9841, icon: BookOpen, color: "#3b82f6" },
    { title: t("tpCommunity.resourceNavigateEmotions", "Taller Navegar Emociones"), type: t("tpCommunity.resourceNavigateEmotionsType", "Taller"), duration: "45min", completions: 6234, icon: Heart, color: "#ec4899" },
    { title: t("tpCommunity.resourceLeadershipEQ", "Ruta de Liderazgo EQ"), type: t("tpCommunity.resourceLeadershipEQType", "Ruta de Aprendizaje"), duration: "8h", completions: 2891, icon: Crown, color: "#f59e0b" },
    { title: t("tpCommunity.resourceBrainStyles", "Estilos Cerebrales a Fondo"), type: t("tpCommunity.resourceBrainStylesType", "Serie de Videos"), duration: "3h 15min", completions: 5127, icon: Brain, color: "#8b5cf6" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/hub/admin/tp" className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> {t("tpCommunity.backToHub", "TP Hub")}
        </Link>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-600 mb-3">
          <Sparkles className="w-3 h-3" /> {t("tpCommunity.communityBadge", "Comunidad")}
        </span>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Users className="w-8 h-8 text-amber-500" /> {t("tpCommunity.pageTitle", "Comunidad EQ de TP")}
        </h1>
        <p className="text-[var(--rowi-muted)]">{t("tpCommunity.pageDescription", "La comunidad de inteligencia emocional de Teleperformance — eventos, clasificaciones, logros y aprendizaje entre pares")}</p>
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
            <h2 className="text-xl font-bold flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> {t("tpCommunity.eqLeaderboard", "Clasificación EQ")}</h2>
            <div className="flex gap-1">
              {["global", "NA", "LATAM", "EMEA", "APAC"].map((filter) => (
                <button key={filter} onClick={() => setLeaderboardFilter(filter)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${leaderboardFilter === filter ? "bg-amber-500 text-white" : "text-[var(--rowi-muted)] hover:bg-gray-100 dark:hover:bg-zinc-800"}`}>
                  {filter === "global" ? t("tpCommunity.filterGlobal", "Global") : filter}
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
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><Medal className="w-5 h-5 text-amber-500" /> {t("tpCommunity.achievementsTitle", "Logros")}</h2>
            <div className="grid grid-cols-2 gap-2">
              {ACHIEVEMENTS.map((ach, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-zinc-900 rounded-xl p-3 border border-gray-100 dark:border-zinc-800 text-center hover:shadow-md transition-shadow">
                  <span className="text-2xl block mb-1">{ach.icon}</span>
                  <h4 className="font-medium text-xs mb-0.5">{ach.title}</h4>
                  <p className="text-[9px] text-[var(--rowi-muted)] mb-1">{ach.desc}</p>
                  <span className="text-[9px] text-purple-500 font-mono">{ach.unlocked.toLocaleString()} {t("tpCommunity.unlocked", "desbloqueados")}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Learning Resources */}
          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-500" /> {t("tpCommunity.learningTitle", "Aprendizaje")}</h2>
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
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-pink-500" /> {t("tpCommunity.upcomingEvents", "Eventos Próximos")}</h2>
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
                      <Users className="w-3 h-3" /> {event.participants.toLocaleString()} {t("tpCommunity.participants", "participantes")}
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
          <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">{t("tpCommunity.infoTitle", "Comunidad EQ de TP")}</h3>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {t("tpCommunity.infoDescription", "Comunidad EQ empresarial de Teleperformance. Las puntuaciones de la clasificación se agregan a partir de evaluaciones SEI reales. Los eventos y logros son parte del motor de gamificación de Rowi.")}
          </p>
        </div>
      </motion.div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-gray-200 dark:border-zinc-800">
        <Link href="/hub/admin/tp/coach" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-gray-200 dark:border-zinc-700 hover:border-amber-500 transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /> {t("tpCommunity.navCoach", "Coach")}
        </Link>
        <Link href="/hub/admin/tp/onboarding" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:opacity-90 transition-opacity">
          {t("tpCommunity.navOnboarding", "Onboarding")} <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
