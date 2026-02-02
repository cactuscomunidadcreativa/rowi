"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Users, ArrowRight, CheckSquare, Sparkles, Lock } from "lucide-react";
import Link from "next/link";

interface Hub {
  id: string;
  name: string;
  description?: string;
  image?: string;
  _count?: {
    members: number;
  };
}

export default function WeekFlowPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { data: session, status } = useSession();
  const authLoading = status === "loading";
  const user = session?.user as { plan?: { weekflowAccess?: boolean } } | undefined;
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && session) {
      fetchUserHubs();
    }
  }, [authLoading, session]);

  const fetchUserHubs = async () => {
    try {
      const res = await fetch("/api/hubs/my");
      const data = await res.json();
      if (data.ok) {
        setHubs(data.hubs || []);
      }
    } catch (error) {
      console.error("Error fetching hubs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check plan access for team features (hubs)
  // Individual tasks are available for everyone
  // TEMPORALMENTE: Abierto para todos durante desarrollo
  const hasTeamAccess = true; // user?.plan?.weekflowAccess;

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("weekflow.title") || "WeekFlow"}</h1>
        <p className="text-muted-foreground">
          {t("weekflow.description") || "Gestiona tus tareas y check-ins semanales"}
        </p>
      </div>

      {/* Personal Tasks - Always available */}
      <Card className="mb-6 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => router.push("/weekflow/tasks")}>
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">{t("weekflow.tasks.title") || "Rowi Tasks"}</h3>
              <p className="text-sm text-muted-foreground">
                {t("weekflow.tasks.subtitle") || "Tus tareas con insights emocionales"}
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground" />
        </CardContent>
      </Card>

      {/* Insights - Always available */}
      <Card className="mb-8 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => router.push("/weekflow/tasks/insights")}>
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">{t("weekflow.insights.title") || "Insights Emocionales"}</h3>
              <p className="text-sm text-muted-foreground">
                {t("weekflow.insights.subtitle") || "Descubre patrones en tus tareas"}
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground" />
        </CardContent>
      </Card>

      {/* Team Section */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">
          {t("weekflow.teamCheckins") || "Check-ins de Equipo"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("weekflow.teamCheckinsDesc") || "Colabora con tu equipo en check-ins semanales"}
        </p>
      </div>

      {/* Team Hubs - Requires plan */}
      {!hasTeamAccess ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Lock className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="font-medium mb-2">
              {t("weekflow.teamLocked") || "Check-ins de equipo"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("weekflow.errors.planRequired") || "Mejora tu plan para acceder a check-ins de equipo"}
            </p>
            <Button asChild variant="outline">
              <Link href="/settings/subscription">
                {t("common.upgradePlan") || "Mejorar Plan"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : hubs.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">
              {t("weekflow.noHubs") || "No tienes comunidades con WeekFlow activo"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t("weekflow.noHubsDesc") || "Únete a una comunidad o crea la tuya para empezar"}
            </p>
            <Button asChild>
              <Link href="/community">
                {t("common.exploreCommunities") || "Explorar Comunidades"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {hubs.map((hub) => (
            <Card
              key={hub.id}
              className="hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => router.push(`/weekflow/${hub.id}`)}
            >
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  {hub.image ? (
                    <img
                      src={hub.image}
                      alt={hub.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{hub.name}</h3>
                    {hub.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {hub.description}
                      </p>
                    )}
                    {hub._count && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {hub._count.members} {t("common.members") || "miembros"}
                      </p>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
