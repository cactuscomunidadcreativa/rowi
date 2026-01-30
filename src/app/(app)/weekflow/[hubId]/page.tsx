"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Plus,
  MessageSquare,
  Target,
  Megaphone,
  Users,
  BarChart3,
  Presentation,
  CheckCircle2,
  Clock,
  Send,
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
  isTask: boolean;
  isCompleted: boolean;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  createdAt: string;
}

interface MoodCheckin {
  id: string;
  emotion: string;
  intensity: number;
  note?: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
}

const SECTION_CONFIG = {
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

export default function WeekFlowHubPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const hubId = params.hubId as string;
  const { data: authSession, status } = useSession();
  const authLoading = status === "loading";
  const user = authSession?.user as { id?: string; plan?: { weekflowAccess?: boolean } } | undefined;

  const [weekflowSession, setWeekflowSession] = useState<Session | null>(null);
  const [userCheckin, setUserCheckin] = useState<MoodCheckin | null>(null);
  const [requiresCheckin, setRequiresCheckin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newContribution, setNewContribution] = useState<Record<string, string>>({
    SHOW_TELL: "",
    TO_DISCUSS: "",
    FOCUS: "",
  });
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!authLoading && authSession) {
      fetchCurrentSession();
    }
  }, [authLoading, authSession, hubId]);

  const fetchCurrentSession = async () => {
    try {
      const res = await fetch(`/api/weekflow/sessions?hubId=${hubId}&current=true`);
      const data = await res.json();
      if (data.ok) {
        setWeekflowSession(data.session);
        setUserCheckin(data.userCheckin);
        setRequiresCheckin(data.requiresCheckin);
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContribution = async (type: "SHOW_TELL" | "TO_DISCUSS" | "FOCUS") => {
    const content = newContribution[type];
    if (!content.trim() || !weekflowSession) return;

    setIsSubmitting((prev) => ({ ...prev, [type]: true }));

    try {
      const res = await fetch("/api/weekflow/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: weekflowSession.id,
          type,
          content: content.trim(),
          isTask: type === "FOCUS",
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setNewContribution((prev) => ({ ...prev, [type]: "" }));
        // Refresh session
        fetchCurrentSession();
      }
    } catch (error) {
      console.error("Error adding contribution:", error);
    } finally {
      setIsSubmitting((prev) => ({ ...prev, [type]: false }));
    }
  };

  const getUserContributions = (type: string) => {
    return weekflowSession?.contributions.filter((c) => c.type === type && c.user.id === user?.id) || [];
  };

  const getTeamContributions = (type: string) => {
    return weekflowSession?.contributions.filter((c) => c.type === type && c.user.id !== user?.id) || [];
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to checkin if required
  if (requiresCheckin) {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <Card className="text-center">
          <CardHeader>
            <CardTitle>{t("weekflow.checkin.required")}</CardTitle>
            <CardDescription>
              {t("weekflow.checkin.subtitle") ||
                "Tu check-in ayuda al equipo a entenderse mejor"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg">
              <Link href={`/weekflow/${hubId}/checkin`}>
                {t("weekflow.checkin.start") || "Hacer Check-in"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatWeekRange = () => {
    if (!weekflowSession) return "";
    const start = new Date(weekflowSession.weekStart);
    const end = new Date(weekflowSession.weekEnd);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">{t("weekflow.title")}</h1>
          <p className="text-muted-foreground">
            {t("weekflow.week") || "Semana"} {weekflowSession?.weekNumber}, {weekflowSession?.year} •{" "}
            {formatWeekRange()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/weekflow/${hubId}/history`}>
              <Clock className="w-4 h-4 mr-2" />
              {t("weekflow.history") || "Historial"}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/weekflow/${hubId}/present`}>
              <Presentation className="w-4 h-4 mr-2" />
              {t("weekflow.views.present") || "Presentar"}
            </Link>
          </Button>
        </div>
      </div>

      {/* User's mood checkin badge */}
      {userCheckin && (
        <div className="mb-6 p-4 rounded-lg bg-muted/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getEmotionEmoji(userCheckin.emotion)}</span>
            <div>
              <p className="font-medium">
                {t(`weekflow.mood.${userCheckin.emotion.toLowerCase()}`) || userCheckin.emotion}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("weekflow.checkin.done") || "Check-in completado"}
              </p>
            </div>
          </div>
          <Badge variant="secondary">
            {t(`weekflow.mood.intensity.${userCheckin.intensity}`) ||
              `Intensidad: ${userCheckin.intensity}`}
          </Badge>
        </div>
      )}

      {/* Tabs for sections */}
      <Tabs defaultValue="SHOW_TELL" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="SHOW_TELL" className="gap-2">
            <Megaphone className="w-4 h-4" />
            <span className="hidden sm:inline">
              {t("weekflow.sections.showTell.title") || "Show & Tell"}
            </span>
            <span className="sm:hidden">📢</span>
          </TabsTrigger>
          <TabsTrigger value="TO_DISCUSS" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">
              {t("weekflow.sections.toDiscuss.title") || "Para Discutir"}
            </span>
            <span className="sm:hidden">💬</span>
          </TabsTrigger>
          <TabsTrigger value="FOCUS" className="gap-2">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">
              {t("weekflow.sections.focus.title") || "Mi Foco"}
            </span>
            <span className="sm:hidden">🎯</span>
          </TabsTrigger>
        </TabsList>

        {(["SHOW_TELL", "TO_DISCUSS", "FOCUS"] as const).map((sectionType) => {
          const config = SECTION_CONFIG[sectionType];
          const Icon = config.icon;
          const myContributions = getUserContributions(sectionType);
          const teamContributions = getTeamContributions(sectionType);

          return (
            <TabsContent key={sectionType} value={sectionType} className="space-y-6">
              {/* Add new */}
              <Card>
                <CardHeader className={cn("pb-3", config.bgColor)}>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className={cn("w-5 h-5", config.color)} />
                    {t(`weekflow.sections.${sectionType.toLowerCase()}.title`) || sectionType}
                  </CardTitle>
                  <CardDescription>
                    {t(`weekflow.sections.${sectionType.toLowerCase()}.description`) ||
                      "Comparte con tu equipo"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder={
                        t(`weekflow.sections.${sectionType.toLowerCase()}.placeholder`) ||
                        "Escribe aquí..."
                      }
                      value={newContribution[sectionType]}
                      onChange={(e) =>
                        setNewContribution((prev) => ({
                          ...prev,
                          [sectionType]: e.target.value,
                        }))
                      }
                      className="min-h-[80px]"
                    />
                    <Button
                      onClick={() => handleAddContribution(sectionType)}
                      disabled={!newContribution[sectionType].trim() || isSubmitting[sectionType]}
                      size="icon"
                      className="shrink-0"
                    >
                      {isSubmitting[sectionType] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* My contributions */}
              {myContributions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    {t("weekflow.myItems") || "Mis aportes"}
                  </h3>
                  <div className="space-y-3">
                    {myContributions.map((contribution) => (
                      <ContributionCard
                        key={contribution.id}
                        contribution={contribution}
                        isOwn
                        onUpdate={fetchCurrentSession}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Team contributions */}
              {teamContributions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    {t("weekflow.teamItems") || "Del equipo"}
                  </h3>
                  <div className="space-y-3">
                    {teamContributions.map((contribution) => (
                      <ContributionCard
                        key={contribution.id}
                        contribution={contribution}
                        onUpdate={fetchCurrentSession}
                      />
                    ))}
                  </div>
                </div>
              )}

              {myContributions.length === 0 && teamContributions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{t("weekflow.noItems") || "Aún no hay aportes en esta sección"}</p>
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Team Pulse (simplified) */}
      {weekflowSession && weekflowSession.moodCheckins.length > 1 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {t("weekflow.metrics.teamPulse") || "Pulso del Equipo"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {weekflowSession.moodCheckins.map((checkin) => (
                <div
                  key={checkin.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted"
                >
                  <Avatar src={checkin.user.image} alt={checkin.user.name} className="w-6 h-6" />
                  <span className="text-lg">{getEmotionEmoji(checkin.emotion)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Contribution Card Component
function ContributionCard({
  contribution,
  isOwn = false,
  onUpdate,
}: {
  contribution: Contribution;
  isOwn?: boolean;
  onUpdate?: () => void;
}) {
  const { t } = useI18n();
  const [isCompleting, setIsCompleting] = useState(false);

  const handleToggleComplete = async () => {
    if (!isOwn || !contribution.isTask) return;

    setIsCompleting(true);
    try {
      await fetch("/api/weekflow/contributions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: contribution.id,
          isCompleted: !contribution.isCompleted,
        }),
      });
      onUpdate?.();
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div
      className={cn(
        "p-4 rounded-lg border bg-card",
        contribution.isCompleted && "opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        {!isOwn && (
          <Avatar src={contribution.user.image} alt={contribution.user.name} className="w-8 h-8" />
        )}
        <div className="flex-1 min-w-0">
          {!isOwn && (
            <p className="text-sm font-medium mb-1">{contribution.user.name}</p>
          )}
          <p
            className={cn(
              "text-sm",
              contribution.isCompleted && "line-through text-muted-foreground"
            )}
          >
            {contribution.content}
          </p>
        </div>
        {contribution.isTask && isOwn && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleComplete}
            disabled={isCompleting}
          >
            {isCompleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2
                className={cn(
                  "w-5 h-5",
                  contribution.isCompleted
                    ? "text-green-500 fill-green-500"
                    : "text-muted-foreground"
                )}
              />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// Helper para obtener emoji por emoción
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
