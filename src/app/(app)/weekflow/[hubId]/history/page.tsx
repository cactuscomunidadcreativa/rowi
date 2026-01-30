"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Calendar, Users, MessageSquare, Target, Megaphone } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Session {
  id: string;
  weekNumber: number;
  year: number;
  weekStart: string;
  weekEnd: string;
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED";
  _count: {
    contributions: number;
    moodCheckins: number;
  };
}

export default function WeekFlowHistoryPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const hubId = params.hubId as string;
  const { data: authSession, status } = useSession();
  const authLoading = status === "loading";

  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && authSession) {
      fetchSessions();
    }
  }, [authLoading, authSession, hubId]);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`/api/weekflow/sessions?hubId=${hubId}`);
      const data = await res.json();
      if (data.ok) {
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatWeekRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    return `${startDate.toLocaleDateString(undefined, options)} - ${endDate.toLocaleDateString(undefined, options)}`;
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/weekflow/${hubId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("common.back") || "Volver"}
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {t("weekflow.history.title") || "Historial de Semanas"}
          </h1>
          <p className="text-muted-foreground">
            {t("weekflow.history.subtitle") || "Revisa las sesiones anteriores"}
          </p>
        </div>
      </div>

      {/* Sessions list */}
      {sessions.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">
              {t("weekflow.history.noSessions") || "No hay sesiones anteriores"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session, index) => {
            const isCurrentWeek = session.status === "ACTIVE";

            return (
              <Card
                key={session.id}
                className={cn(
                  "transition-colors",
                  isCurrentWeek && "border-primary"
                )}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-lg flex items-center justify-center",
                          isCurrentWeek
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <span className="text-lg font-bold">
                          {session.weekNumber}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {t("weekflow.week") || "Semana"} {session.weekNumber},{" "}
                            {session.year}
                          </h3>
                          {isCurrentWeek && (
                            <Badge variant="default" className="text-xs">
                              {t("weekflow.history.current") || "Actual"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatWeekRange(session.weekStart, session.weekEnd)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{session._count.moodCheckins}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{session._count.contributions}</span>
                        </div>
                      </div>

                      {/* View button */}
                      {isCurrentWeek ? (
                        <Button size="sm" asChild>
                          <Link href={`/weekflow/${hubId}`}>
                            {t("common.view") || "Ver"}
                          </Link>
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" disabled>
                          {t("weekflow.history.archived") || "Archivada"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
