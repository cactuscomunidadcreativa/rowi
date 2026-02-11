"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Megaphone,
  MessageSquare,
  Target,
  BarChart3,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  Thermometer,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Session {
  id: string;
  weekNumber: number;
  year: number;
  weekStart: string;
  weekEnd: string;
  contributions: Contribution[];
  moodCheckins: MoodCheckin[];
}

interface Contribution {
  id: string;
  type: "SHOW_TELL" | "TO_DISCUSS" | "FOCUS";
  content: string;
  isTask?: boolean;
  isCompleted?: boolean;
  user: {
    id: string;
    name: string;
    image?: string;
  };
}

interface MoodCheckin {
  id: string;
  emotion: string;
  intensity: number;
  user: {
    id: string;
    name: string;
    image?: string;
  };
}

type ViewMode = "pulse" | "SHOW_TELL" | "TO_DISCUSS" | "FOCUS" | "summary";

const SECTIONS: ViewMode[] = ["pulse", "SHOW_TELL", "TO_DISCUSS", "FOCUS", "summary"];

const SECTION_CONFIG = {
  pulse: {
    icon: BarChart3,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
  },
  SHOW_TELL: {
    icon: Megaphone,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  TO_DISCUSS: {
    icon: MessageSquare,
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
  },
  FOCUS: {
    icon: Target,
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  summary: {
    icon: Sparkles,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
  },
};

// Generar sugerencia de productividad basada en datos de sesión
function getProductivitySuggestion(session: Session, isEs: boolean): string {
  const totalContributions = session.contributions.length;
  const focusItems = session.contributions.filter((c) => c.type === "FOCUS").length;
  const discussItems = session.contributions.filter((c) => c.type === "TO_DISCUSS").length;
  const completedTasks = session.contributions.filter((c) => c.isTask && c.isCompleted).length;
  const totalTasks = session.contributions.filter((c) => c.isTask).length;
  const checkins = session.moodCheckins.length;

  // Analizar emociones predominantes
  const emotions = session.moodCheckins.map((c) => c.emotion.toUpperCase());
  const hasNegative = emotions.some((e) =>
    ["FEAR", "TEMOR", "SADNESS", "TRISTEZA", "ANGER", "FURIA", "ANXIOUS", "ANSIEDAD", "STRESSED", "OVERWHELMED", "FRUSTRATED", "NERVIOS"].includes(e)
  );
  const hasPositive = emotions.some((e) =>
    ["JOY", "ALEGRIA", "TRUST", "CONFIANZA", "OPTIMISTIC", "CONTENT", "PROUD", "EXCITED", "HOPEFUL", "PEACEFUL"].includes(e)
  );

  if (isEs) {
    if (totalContributions === 0) {
      return "💡 Esta semana no hubo contribuciones. Considera empezar con una meta pequeña y alcanzable para generar impulso.";
    }
    if (hasNegative && !hasPositive) {
      return "💡 El equipo parece estar bajo presión. Considera priorizar el bienestar: pausas activas, revisar la carga de trabajo y abrir un espacio de escucha.";
    }
    if (focusItems > discussItems * 2) {
      return "💡 Hay mucho foco individual. Considera dedicar más tiempo a discusión en equipo para alinear prioridades y evitar silos.";
    }
    if (discussItems > focusItems * 2) {
      return "💡 Mucha discusión pero poco foco individual. Asegúrense de que cada discusión termine con acciones concretas y responsables asignados.";
    }
    if (totalTasks > 0 && completedTasks === 0) {
      return "💡 Hay tareas pendientes sin completar. Revisa si las tareas son realistas o si necesitan ser redefinidas en subtareas más manejables.";
    }
    if (hasPositive && totalContributions > 5) {
      return "🌟 ¡Excelente sesión! El equipo está energizado y productivo. Aprovecha este momentum para abordar temas complejos que se han postergado.";
    }
    return "💡 Mantén el ritmo: revisa las tareas de la semana anterior, celebra lo completado y define 1-3 prioridades claras para la próxima semana.";
  }

  // English
  if (totalContributions === 0) {
    return "💡 No contributions this week. Consider starting with a small, achievable goal to build momentum.";
  }
  if (hasNegative && !hasPositive) {
    return "💡 The team seems under pressure. Consider prioritizing well-being: active breaks, workload review, and opening a listening space.";
  }
  if (focusItems > discussItems * 2) {
    return "💡 Lots of individual focus. Consider more team discussion time to align priorities and avoid silos.";
  }
  if (totalTasks > 0 && completedTasks === 0) {
    return "💡 There are uncompleted tasks. Review if tasks are realistic or need to be broken into smaller subtasks.";
  }
  if (hasPositive && totalContributions > 5) {
    return "🌟 Great session! The team is energized and productive. Leverage this momentum to tackle complex deferred topics.";
  }
  return "💡 Keep the pace: review last week's tasks, celebrate completions, and define 1-3 clear priorities for next week.";
}

export default function WeekFlowPresentPage() {
  const { t, lang } = useI18n();
  const isEs = lang !== "en";
  const router = useRouter();
  const params = useParams();
  const hubId = params.hubId as string;
  const { data: authSession, status } = useSession();
  const authLoading = status === "loading";

  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewMode>("pulse");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!authLoading && authSession) {
      fetchCurrentSession();
    }
  }, [authLoading, authSession, hubId]);

  useEffect(() => {
    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = SECTIONS.indexOf(currentView);

      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        if (currentIndex < SECTIONS.length - 1) {
          setCurrentView(SECTIONS[currentIndex + 1]);
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (currentIndex > 0) {
          setCurrentView(SECTIONS[currentIndex - 1]);
        }
      } else if (e.key === "Escape") {
        if (isFullscreen) {
          document.exitFullscreen();
          setIsFullscreen(false);
        }
      } else if (e.key === "f") {
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentView, isFullscreen]);

  const fetchCurrentSession = async () => {
    try {
      const res = await fetch(`/api/weekflow/sessions?hubId=${hubId}&current=true`);
      const data = await res.json();
      if (data.ok) {
        setSession(data.session);
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const goToPrev = () => {
    const currentIndex = SECTIONS.indexOf(currentView);
    if (currentIndex > 0) {
      setCurrentView(SECTIONS[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    const currentIndex = SECTIONS.indexOf(currentView);
    if (currentIndex < SECTIONS.length - 1) {
      setCurrentView(SECTIONS[currentIndex + 1]);
    }
  };

  const getContributionsByType = (type: string) => {
    return session?.contributions.filter((c) => c.type === type) || [];
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentIndex = SECTIONS.indexOf(currentView);
  const config = SECTION_CONFIG[currentView];
  const Icon = config.icon;

  // Stats for summary
  const totalContributions = session?.contributions.length || 0;
  const completedTasks = session?.contributions.filter((c) => c.isTask && c.isCompleted).length || 0;
  const pendingTasks = session?.contributions.filter((c) => c.isTask && !c.isCompleted).length || 0;
  const totalTasks = session?.contributions.filter((c) => c.isTask).length || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const participationRate = session ? Math.min(100, session.moodCheckins.length * 20) : 0; // rough estimate

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b">
        <div className="container max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/weekflow/${hubId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("common.exit") || (isEs ? "Salir" : "Exit")}
            </Link>
          </Button>

          <div className="text-center">
            <h1 className="font-semibold">{t("weekflow.title") || "WeekFlow"}</h1>
            <p className="text-xs text-muted-foreground">
              {t("weekflow.week") || (isEs ? "Semana" : "Week")} {session?.weekNumber}, {session?.year}
            </p>
          </div>

          <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Progress dots */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {SECTIONS.map((section, index) => (
          <button
            key={section}
            onClick={() => setCurrentView(section)}
            className={cn(
              "w-3 h-3 rounded-full transition-all",
              index === currentIndex
                ? "bg-primary scale-125"
                : "bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
            )}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="pt-32 pb-24 px-4 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-4xl">
          {/* Team Pulse View */}
          {currentView === "pulse" && session && (
            <div className="text-center space-y-8">
              <div>
                <Badge className={cn("mb-4", config.bgColor, config.color)}>
                  <Icon className="w-4 h-4 mr-2" />
                  {t("weekflow.metrics.teamPulse") || (isEs ? "Pulso del Equipo" : "Team Pulse")}
                </Badge>
                <h2 className="text-4xl font-bold mb-2">
                  {t("weekflow.present.howWeFeeling") || (isEs ? "¿Cómo nos sentimos?" : "How are we feeling?")}
                </h2>
                <p className="text-muted-foreground">
                  {session.moodCheckins.length}{" "}
                  {t("weekflow.present.checkins") || (isEs ? "check-ins esta semana" : "check-ins this week")}
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-6">
                {session.moodCheckins.map((checkin) => (
                  <div
                    key={checkin.id}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-lg"
                  >
                    <Avatar src={checkin.user.image} alt={checkin.user.name} className="w-16 h-16" />
                    <span className="text-4xl">{getEmotionEmoji(checkin.emotion)}</span>
                    <span className="font-medium">{checkin.user.name}</span>
                  </div>
                ))}
              </div>

              {/* Emotion distribution */}
              <div className="pt-8">
                <EmotionDistribution checkins={session.moodCheckins} isEs={isEs} />
              </div>
            </div>
          )}

          {/* Section Views */}
          {(currentView === "SHOW_TELL" || currentView === "TO_DISCUSS" || currentView === "FOCUS") && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <Badge className={cn("mb-4", config.bgColor, config.color)}>
                  <Icon className="w-4 h-4 mr-2" />
                  {currentView === "SHOW_TELL"
                    ? (t("weekflow.sections.showTell.title") || "Show & Tell")
                    : currentView === "TO_DISCUSS"
                      ? (t("weekflow.sections.toDiscuss.title") || (isEs ? "Para Discutir" : "To Discuss"))
                      : (t("weekflow.sections.focus.title") || (isEs ? "Mi Foco" : "My Focus"))
                  }
                </Badge>
                <h2 className="text-3xl font-bold">
                  {t(`weekflow.sections.${currentView.toLowerCase()}.description`) ||
                    (isEs ? "Compartido por el equipo" : "Shared by the team")}
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {getContributionsByType(currentView).map((contribution) => (
                  <Card key={contribution.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar src={contribution.user.image} alt={contribution.user.name} className="w-10 h-10" />
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1">
                            {contribution.user.name}
                          </p>
                          <p className={cn("text-lg", contribution.isCompleted && "line-through text-muted-foreground")}>
                            {contribution.content}
                          </p>
                          {contribution.isTask && (
                            <Badge variant={contribution.isCompleted ? "default" : "secondary"} className="mt-2">
                              {contribution.isCompleted
                                ? (isEs ? "✓ Completada" : "✓ Completed")
                                : (isEs ? "◻ Pendiente" : "◻ Pending")
                              }
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {getContributionsByType(currentView).length === 0 && (
                  <div className="col-span-2 text-center py-12 text-muted-foreground">
                    <Icon className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>{t("weekflow.noItems") || (isEs ? "No hay aportes en esta sección" : "No contributions in this section")}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════ */}
          {/* SUMMARY VIEW — Resumen final con termómetro */}
          {/* ═══════════════════════════════════════════════════ */}
          {currentView === "summary" && session && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <Badge className={cn("mb-4", config.bgColor, config.color)}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isEs ? "Resumen de Sesión" : "Session Summary"}
                </Badge>
                <h2 className="text-3xl font-bold mb-2">
                  {isEs ? "¡Sesión completada!" : "Session Complete!"}
                </h2>
                <p className="text-muted-foreground">
                  {isEs ? `Semana ${session.weekNumber}, ${session.year}` : `Week ${session.weekNumber}, ${session.year}`}
                </p>
              </div>

              {/* Thermometer / Progress bar */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Thermometer className="w-5 h-5 text-orange-500" />
                    {isEs ? "Termómetro del Equipo" : "Team Thermometer"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Participation */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">
                          {isEs ? "Participación (check-ins)" : "Participation (check-ins)"}
                        </span>
                        <span className="font-medium">{session.moodCheckins.length} {isEs ? "miembros" : "members"}</span>
                      </div>
                      <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-blue-400 to-blue-600"
                          style={{ width: `${Math.min(100, participationRate)}%` }}
                        />
                      </div>
                    </div>

                    {/* Contributions */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">
                          {isEs ? "Contribuciones totales" : "Total contributions"}
                        </span>
                        <span className="font-medium">{totalContributions}</span>
                      </div>
                      <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-green-400 to-green-600"
                          style={{ width: `${Math.min(100, totalContributions * 10)}%` }}
                        />
                      </div>
                    </div>

                    {/* Task completion */}
                    {totalTasks > 0 && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">
                            {isEs ? "Tareas completadas" : "Tasks completed"}
                          </span>
                          <span className="font-medium">{completedTasks}/{totalTasks} ({completionRate}%)</span>
                        </div>
                        <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-1000",
                              completionRate >= 80
                                ? "bg-gradient-to-r from-green-400 to-green-600"
                                : completionRate >= 50
                                  ? "bg-gradient-to-r from-amber-400 to-amber-600"
                                  : "bg-gradient-to-r from-red-400 to-red-600"
                            )}
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Stats cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold">{completedTasks}</p>
                    <p className="text-xs text-muted-foreground">
                      {isEs ? "Completadas" : "Completed"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                    <p className="text-2xl font-bold">{pendingTasks}</p>
                    <p className="text-xs text-muted-foreground">
                      {isEs ? "Pendientes" : "Pending"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold">{totalContributions}</p>
                    <p className="text-xs text-muted-foreground">
                      {isEs ? "Contribuciones" : "Contributions"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                    <p className="text-2xl font-bold">{session.moodCheckins.length}</p>
                    <p className="text-xs text-muted-foreground">
                      {isEs ? "Check-ins" : "Check-ins"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Contributions breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {isEs ? "Desglose por sección" : "Section breakdown"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(["SHOW_TELL", "TO_DISCUSS", "FOCUS"] as const).map((type) => {
                      const items = getContributionsByType(type);
                      const sectionCfg = SECTION_CONFIG[type];
                      const SectionIcon = sectionCfg.icon;
                      return (
                        <div key={type} className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", sectionCfg.bgColor)}>
                            <SectionIcon className={cn("w-4 h-4", sectionCfg.color)} />
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-medium">
                              {type === "SHOW_TELL"
                                ? "Show & Tell"
                                : type === "TO_DISCUSS"
                                  ? (isEs ? "Para Discutir" : "To Discuss")
                                  : (isEs ? "Mi Foco" : "My Focus")
                              }
                            </span>
                          </div>
                          <Badge variant="secondary">{items.length}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Productivity suggestion */}
              <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/50">
                      <Sparkles className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-2">
                        {isEs ? "Sugerencia de Productividad" : "Productivity Suggestion"}
                      </h4>
                      <p className="text-sm text-indigo-800 dark:text-indigo-300">
                        {getProductivitySuggestion(session, isEs)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pending items warning */}
              {pendingTasks > 0 && (
                <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
                          {isEs
                            ? `${pendingTasks} tarea${pendingTasks > 1 ? "s" : ""} pendiente${pendingTasks > 1 ? "s" : ""}`
                            : `${pendingTasks} pending task${pendingTasks > 1 ? "s" : ""}`
                          }
                        </h4>
                        <ul className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
                          {session.contributions
                            .filter((c) => c.isTask && !c.isCompleted)
                            .slice(0, 5)
                            .map((c) => (
                              <li key={c.id} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                {c.content}
                                <span className="text-xs opacity-70">— {c.user.name}</span>
                              </li>
                            ))
                          }
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-t">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goToPrev}
            disabled={currentIndex === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("common.previous") || (isEs ? "Anterior" : "Previous")}
          </Button>

          <div className="text-sm text-muted-foreground">
            {currentIndex + 1} / {SECTIONS.length}
          </div>

          {currentIndex < SECTIONS.length - 1 ? (
            <Button onClick={goToNext}>
              {t("common.next") || (isEs ? "Siguiente" : "Next")}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button asChild variant="default">
              <Link href={`/weekflow/${hubId}`}>
                {isEs ? "Finalizar" : "Finish"}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Keyboard hint */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
        {t("weekflow.present.keyboardHint") ||
          (isEs ? "Usa ← → para navegar, F para pantalla completa" : "Use ← → to navigate, F for fullscreen")}
      </div>
    </div>
  );
}

// Emotion Distribution Component
function EmotionDistribution({ checkins, isEs }: { checkins: MoodCheckin[]; isEs: boolean }) {
  const distribution = checkins.reduce((acc, checkin) => {
    acc[checkin.emotion] = (acc[checkin.emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sorted = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  const total = checkins.length;

  return (
    <div className="flex justify-center gap-4 flex-wrap">
      {sorted.map(([emotion, count]) => {
        const percentage = Math.round((count / total) * 100);
        return (
          <div
            key={emotion}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 shadow"
          >
            <span className="text-2xl">{getEmotionEmoji(emotion)}</span>
            <div className="text-left">
              <span className="text-sm font-medium block">{emotion}</span>
              <span className="text-xs text-muted-foreground">{percentage}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper
function getEmotionEmoji(emotion: string): string {
  const slug = emotion.toUpperCase();
  const emojis: Record<string, string> = {
    JOY: "😊", ALEGRIA: "😊",
    TRUST: "🤝", CONFIANZA: "🤝",
    FEAR: "😨", TEMOR: "😨",
    SURPRISE: "😮", SORPRESA: "😮",
    SADNESS: "😢", TRISTEZA: "😢",
    DISGUST: "🤢", DESAGRADO: "🤢",
    ANGER: "😠", FURIA: "😠",
    ANTICIPATION: "😬", ANTICIPACION: "😬",
    // Extended
    CONTENT: "😌", CONTENTO: "😌",
    PLAYFUL: "🤪", PROUD: "🏆",
    OPTIMISTIC: "🌞",
    LONELY: "😔", VULNERABLE: "🥺",
    GUILTY: "😣", HURT: "💔",
    FRUSTRATED: "😤", BITTER: "😒", CRITICAL: "🧐",
    ANXIOUS: "😰", ANSIEDAD: "😰",
    INSECURE: "😟", OVERWHELMED: "🤯",
    WORRIED: "😥", CONFUSED: "🤔",
    AMAZED: "🤩", EXCITED: "🎉",
    TIRED: "😴", STRESSED: "😫",
    BORED: "😐", BUSY: "🏃",
    DISAPPOINTED: "😞", DISAPPROVING: "👎",
    PEACEFUL: "🕊️", HOPEFUL: "🌈", INTIMATE: "💛",
  };
  return emojis[slug] || "🎯";
}
