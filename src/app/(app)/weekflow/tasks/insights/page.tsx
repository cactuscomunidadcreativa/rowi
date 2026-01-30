"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Lightbulb,
  BarChart3,
  PieChart,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Insights {
  summary: {
    totalTasks: number;
    completedTasks: number;
    postponedTasks: number;
    blockedTasks: number;
    completionRate: number;
  };
  completionByEmotion: Record<string, { completed: number; total: number }>;
  topIncompletionReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  emotionsAtCompletion: Record<string, number>;
  blockerTypes: Record<string, number>;
  patterns: string[];
  suggestions: string[];
  emotionalVocabulary: {
    uniqueEmotionsUsed: number;
  };
}

const EMOTION_EMOJIS: Record<string, string> = {
  JOY: "😊",
  TRUST: "🤝",
  FEAR: "😨",
  SURPRISE: "😮",
  SADNESS: "😢",
  DISGUST: "🤢",
  ANGER: "😠",
  ANTICIPATION: "😬",
};

export default function TaskInsightsPage() {
  const { t } = useI18n();
  const { user, isLoading: authLoading } = useAuth();

  const [insights, setInsights] = useState<Insights | null>(null);
  const [period, setPeriod] = useState("MONTHLY");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      fetchInsights();
    }
  }, [authLoading, user, period]);

  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/weekflow/tasks/insights?period=${period}`);
      const data = await res.json();
      if (data.ok) {
        setInsights(data.insights);
      }
    } catch (error) {
      console.error("Error fetching insights:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check plan access
  if (!authLoading && !user?.plan?.weekflowInsights) {
    return (
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Lock className="w-8 h-8 text-amber-600" />
            </div>
            <CardTitle>{t("weekflow.tasks.insights") || "Insights Emocionales"}</CardTitle>
            <CardDescription>
              {t("weekflow.errors.insightsRequired") ||
                "Necesitas un plan Pro o superior para acceder a Insights"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/settings/subscription">
                {t("common.upgradePlan") || "Mejorar Plan"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/weekflow/tasks">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("common.back") || "Volver"}
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {t("weekflow.tasks.insights.title") || "Insights Emocionales"}
            </h1>
            <p className="text-muted-foreground">
              {t("weekflow.tasks.insights.subtitle") ||
                "Descubre patrones entre tus emociones y productividad"}
            </p>
          </div>
        </div>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WEEKLY">
              {t("weekflow.tasks.insights.weekly") || "Semanal"}
            </SelectItem>
            <SelectItem value="MONTHLY">
              {t("weekflow.tasks.insights.monthly") || "Mensual"}
            </SelectItem>
            <SelectItem value="QUARTERLY">
              {t("weekflow.tasks.insights.quarterly") || "Trimestral"}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!insights || insights.summary.totalTasks === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">
              {t("weekflow.tasks.insights.noData") ||
                "Aún no hay suficientes datos para generar insights"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {t("weekflow.tasks.insights.startUsing") ||
                "Crea tareas y haz check-ins para ver tus patrones"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{insights.summary.totalTasks}</div>
                <p className="text-sm text-muted-foreground">
                  {t("weekflow.tasks.insights.totalTasks") || "Tareas totales"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  {insights.summary.completionRate}%
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("weekflow.tasks.insights.completionRate") || "Tasa de completar"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-amber-600">
                  {insights.summary.postponedTasks}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("weekflow.tasks.insights.postponed") || "Pospuestas"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-purple-600">
                  {insights.emotionalVocabulary.uniqueEmotionsUsed}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("weekflow.tasks.insights.emotionsUsed") || "Emociones usadas"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Completion by Emotion */}
          {Object.keys(insights.completionByEmotion).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  {t("weekflow.tasks.insights.byEmotion") || "Completar por Emoción"}
                </CardTitle>
                <CardDescription>
                  {t("weekflow.tasks.insights.byEmotionDesc") ||
                    "Cómo afecta tu estado emocional a completar tareas"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(insights.completionByEmotion).map(([emotion, data]) => {
                    const rate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
                    return (
                      <div key={emotion} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{EMOTION_EMOJIS[emotion] || "🎯"}</span>
                            <span className="font-medium">
                              {t(`weekflow.mood.${emotion.toLowerCase()}`) || emotion}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn("font-semibold", rate >= 50 ? "text-green-600" : "text-amber-600")}>
                              {rate}%
                            </span>
                            {rate >= 70 ? (
                              <TrendingUp className="w-4 h-4 text-green-500" />
                            ) : rate < 40 ? (
                              <TrendingDown className="w-4 h-4 text-red-500" />
                            ) : null}
                          </div>
                        </div>
                        <Progress value={rate} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {data.completed} / {data.total}{" "}
                          {t("weekflow.tasks.insights.tasksCompleted") || "tareas completadas"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Incompletion Reasons */}
          {insights.topIncompletionReasons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {t("weekflow.tasks.insights.topReasons") || "Razones Principales"}
                </CardTitle>
                <CardDescription>
                  {t("weekflow.tasks.insights.topReasonsDesc") ||
                    "Por qué no completas algunas tareas"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.topIncompletionReasons.map((item, index) => (
                    <div
                      key={item.reason}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-6 h-6 p-0 justify-center">
                          {index + 1}
                        </Badge>
                        <span>
                          {t(`weekflow.incompletionReasons.${item.reason.toLowerCase()}`) ||
                            item.reason}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{item.count}</span>
                        <span className="text-sm text-muted-foreground">
                          ({item.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Patterns */}
          {insights.patterns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  {t("weekflow.tasks.insights.patterns") || "Patrones Detectados"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.patterns.map((pattern, index) => {
                    // Parse pattern string (e.g., "weekflow.tasks.insights.pattern.lowCompletion:FEAR:30")
                    const [key, ...params] = pattern.split(":");
                    let text = t(key) || pattern;

                    // Replace placeholders
                    params.forEach((param, i) => {
                      text = text.replace(`{${i}}`, param);
                    });

                    return (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <TrendingUp className="w-4 h-4 text-primary" />
                        </div>
                        <p>{text}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggestions */}
          {insights.suggestions.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  {t("weekflow.tasks.insights.suggestions") || "Sugerencias"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-slate-900"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Lightbulb className="w-4 h-4 text-primary" />
                      </div>
                      <p>{t(suggestion) || suggestion}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
