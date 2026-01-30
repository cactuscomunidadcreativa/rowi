"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Megaphone,
  MessageSquare,
  Target,
  Users,
  BarChart3,
  Maximize2,
  Minimize2,
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

type ViewMode = "pulse" | "SHOW_TELL" | "TO_DISCUSS" | "FOCUS";

const SECTIONS: ViewMode[] = ["pulse", "SHOW_TELL", "TO_DISCUSS", "FOCUS"];

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
};

export default function WeekFlowPresentPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const hubId = params.hubId as string;
  const { user, isLoading: authLoading } = useAuth();

  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewMode>("pulse");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      fetchCurrentSession();
    }
  }, [authLoading, user, hubId]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b">
        <div className="container max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/weekflow/${hubId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("common.exit") || "Salir"}
            </Link>
          </Button>

          <div className="text-center">
            <h1 className="font-semibold">{t("weekflow.title")}</h1>
            <p className="text-xs text-muted-foreground">
              {t("weekflow.week")} {session?.weekNumber}, {session?.year}
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
                  {t("weekflow.metrics.teamPulse") || "Pulso del Equipo"}
                </Badge>
                <h2 className="text-4xl font-bold mb-2">
                  {t("weekflow.present.howWeFeeling") || "¿Cómo nos sentimos?"}
                </h2>
                <p className="text-muted-foreground">
                  {session.moodCheckins.length}{" "}
                  {t("weekflow.present.checkins") || "check-ins esta semana"}
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-6">
                {session.moodCheckins.map((checkin) => (
                  <div
                    key={checkin.id}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-lg"
                  >
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={checkin.user.image} />
                      <AvatarFallback className="text-xl">
                        {checkin.user.name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-4xl">{getEmotionEmoji(checkin.emotion)}</span>
                    <span className="font-medium">{checkin.user.name}</span>
                  </div>
                ))}
              </div>

              {/* Emotion distribution */}
              <div className="pt-8">
                <EmotionDistribution checkins={session.moodCheckins} />
              </div>
            </div>
          )}

          {/* Section Views */}
          {currentView !== "pulse" && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <Badge className={cn("mb-4", config.bgColor, config.color)}>
                  <Icon className="w-4 h-4 mr-2" />
                  {t(`weekflow.sections.${currentView.toLowerCase()}.title`) || currentView}
                </Badge>
                <h2 className="text-3xl font-bold">
                  {t(`weekflow.sections.${currentView.toLowerCase()}.description`) ||
                    "Compartido por el equipo"}
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {getContributionsByType(currentView).map((contribution) => (
                  <Card key={contribution.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={contribution.user.image} />
                          <AvatarFallback>{contribution.user.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1">
                            {contribution.user.name}
                          </p>
                          <p className="text-lg">{contribution.content}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {getContributionsByType(currentView).length === 0 && (
                  <div className="col-span-2 text-center py-12 text-muted-foreground">
                    <Icon className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>{t("weekflow.noItems") || "No hay aportes en esta sección"}</p>
                  </div>
                )}
              </div>
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
            {t("common.previous") || "Anterior"}
          </Button>

          <div className="text-sm text-muted-foreground">
            {currentIndex + 1} / {SECTIONS.length}
          </div>

          <Button
            onClick={goToNext}
            disabled={currentIndex === SECTIONS.length - 1}
          >
            {t("common.next") || "Siguiente"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Keyboard hint */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
        {t("weekflow.present.keyboardHint") ||
          "Usa ← → para navegar, F para pantalla completa"}
      </div>
    </div>
  );
}

// Emotion Distribution Component
function EmotionDistribution({ checkins }: { checkins: MoodCheckin[] }) {
  const { t } = useI18n();

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
            <span className="font-medium">{percentage}%</span>
          </div>
        );
      })}
    </div>
  );
}

// Helper
function getEmotionEmoji(emotion: string): string {
  const emojis: Record<string, string> = {
    JOY: "😊",
    TRUST: "🤝",
    FEAR: "😨",
    SURPRISE: "😮",
    SADNESS: "😢",
    DISGUST: "🤢",
    ANGER: "😠",
    ANTICIPATION: "😬",
  };
  return emojis[emotion] || "🎯";
}
