"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Users,
  Target,
  ChevronDown,
  Star,
  TrendingUp,
  Lightbulb,
  Award,
  ArrowRight,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminGrid,
  AdminButton,
  AdminBadge,
} from "@/components/admin/AdminPage";

/* =========================================================
   👤 Comparación Usuario vs Benchmark
   ---------------------------------------------------------
   "Strengths First" — Muestra fortalezas primero
========================================================= */

interface UserOption {
  id: string;
  name: string;
  email: string;
  type: "user" | "member";
}

interface ComparisonResult {
  targetOutcome: string;
  context: {
    country?: string;
    region?: string;
    sector?: string;
    tenantId?: string;
  };
  fallbackUsed: string | null;

  userStrengths: {
    competency: string;
    score: number;
    percentile: number;
    vsTopPerformer: "above" | "at" | "below";
  }[];

  topPerformerInsights: {
    strength: string;
    howTheyUseIt: string;
    resultTheyGet: string;
  }[];

  developmentAreas: {
    area: string;
    priority: "high" | "medium" | "low";
    leveragedBy: string;
    suggestion: string;
  }[];

  userScores: Record<string, number>;
  benchmarkScores: Record<string, number>;
  percentiles: Record<string, number>;

  summaryInsight: string;
}

const OUTCOMES = [
  "effectiveness",
  "relationships",
  "qualityOfLife",
  "wellbeing",
  "influence",
  "decisionMaking",
  "health",
  "satisfaction",
  "balance",
  "achievement",
];

const COMPETENCIES = ["K", "C", "G", "EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];

export default function BenchmarkComparePage() {
  const { t } = useI18n();
  const params = useParams();
  const benchmarkId = params.id as string;

  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [targetOutcome, setTargetOutcome] = useState<string>("effectiveness");
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      // Cargar usuarios y miembros con perfil
      const [usersRes, membersRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/hub/members"),
      ]);

      const usersData = await usersRes.json();
      const membersData = await membersRes.json();

      const options: UserOption[] = [];

      // Usuarios con perfil
      if (Array.isArray(usersData)) {
        usersData.forEach((u: any) => {
          if (u.profile) {
            options.push({
              id: u.id,
              name: u.name || u.email,
              email: u.email,
              type: "user",
            });
          }
        });
      }

      // Miembros con perfil
      if (Array.isArray(membersData)) {
        membersData.forEach((m: any) => {
          if (m.profile) {
            options.push({
              id: m.id,
              name: m.name || m.email,
              email: m.email,
              type: "member",
            });
          }
        });
      }

      setUsers(options);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function runComparison() {
    if (!selectedUser) {
      toast.error(t("admin.benchmarks.compare.selectUser"));
      return;
    }

    setLoading(true);
    try {
      const selected = users.find((u) => u.id === selectedUser);
      const body = {
        benchmarkId,
        targetOutcome,
        userId: selected?.type === "user" ? selected.id : undefined,
        memberId: selected?.type === "member" ? selected.id : undefined,
      };

      const res = await fetch("/api/admin/benchmarks/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.ok) {
        setResult(data.comparison);
      } else {
        toast.error(data.error || t("common.error"));
      }
    } catch (error) {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  const getStrengthIcon = (vsTopPerformer: string) => {
    switch (vsTopPerformer) {
      case "above":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "at":
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <ArrowRight className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      default:
        return "secondary";
    }
  };

  return (
    <AdminPage
      titleKey="admin.benchmarks.compare.title"
      descriptionKey="admin.benchmarks.compare.subtitle"
      icon={Users}
      loading={loadingUsers}
    >
      {/* Selection Panel */}
      <AdminCard className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* User Selector */}
          <div>
            <label className="block text-sm font-medium text-[var(--rowi-foreground)] mb-2">
              {t("admin.benchmarks.compare.selectUser")}
            </label>
            <div className="relative">
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-4 py-2 pr-10 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]"
              >
                <option value="">{t("common.select")}</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--rowi-muted)] pointer-events-none" />
            </div>
          </div>

          {/* Outcome Selector */}
          <div>
            <label className="block text-sm font-medium text-[var(--rowi-foreground)] mb-2">
              {t("admin.benchmarks.compare.targetOutcome")}
            </label>
            <div className="relative">
              <select
                value={targetOutcome}
                onChange={(e) => setTargetOutcome(e.target.value)}
                className="w-full px-4 py-2 pr-10 rounded-lg border border-[var(--rowi-card-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]"
              >
                {OUTCOMES.map((outcome) => (
                  <option key={outcome} value={outcome}>
                    {t(`admin.benchmarks.outcomes.${outcome}`)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--rowi-muted)] pointer-events-none" />
            </div>
            <p className="text-xs text-[var(--rowi-muted)] mt-1">
              {t("admin.benchmarks.compare.targetOutcomeHint")}
            </p>
          </div>

          {/* Run Button */}
          <div className="flex items-end">
            <AdminButton
              variant="primary"
              onClick={runComparison}
              loading={loading}
              className="w-full"
            >
              {t("admin.benchmarks.compare.runComparison")}
            </AdminButton>
          </div>
        </div>
      </AdminCard>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Fallback Notice */}
          {result.fallbackUsed && (
            <AdminCard className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {t("admin.benchmarks.compare.results.fallbackNotice", {
                  source: t(`admin.benchmarks.compare.results.fallback.${result.fallbackUsed}`),
                })}
              </p>
            </AdminCard>
          )}

          {/* Summary Insight */}
          {result.summaryInsight && (
            <AdminCard>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--rowi-foreground)] mb-2">
                    {t("admin.benchmarks.compare.summary.mainInsight")}
                  </h3>
                  <p className="text-[var(--rowi-foreground)]">{result.summaryInsight}</p>
                </div>
              </div>
            </AdminCard>
          )}

          {/* User Strengths */}
          <AdminCard>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                  {t("admin.benchmarks.compare.strengths.title")}
                </h3>
                <p className="text-xs text-[var(--rowi-muted)]">
                  {t("admin.benchmarks.compare.strengths.subtitle")}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {result.userStrengths.map((strength, idx) => (
                <div
                  key={strength.competency}
                  className="flex items-center gap-4 p-3 rounded-lg bg-[var(--rowi-background)] border border-[var(--rowi-card-border)]"
                >
                  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center text-sm font-bold text-green-700 dark:text-green-300">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--rowi-foreground)]">
                      {t(`admin.benchmarks.metrics.${strength.competency}`)}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-[var(--rowi-muted)]">
                        {t("admin.benchmarks.compare.strengths.yourScore")}:{" "}
                        <strong>{strength.score.toFixed(1)}</strong>
                      </span>
                      <span className="text-xs text-[var(--rowi-muted)]">
                        {t("admin.benchmarks.compare.strengths.percentile")}:{" "}
                        <strong>P{strength.percentile}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStrengthIcon(strength.vsTopPerformer)}
                    <span className="text-xs text-[var(--rowi-muted)]">
                      {t(`admin.benchmarks.compare.strengths.${strength.vsTopPerformer}Top`)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>

          {/* Top Performer Insights */}
          {result.topPerformerInsights.length > 0 && (
            <AdminCard>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                    {t("admin.benchmarks.compare.insights.title")}
                  </h3>
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {t("admin.benchmarks.compare.insights.subtitle")}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {result.topPerformerInsights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border border-[var(--rowi-card-border)] bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <AdminBadge variant="primary">
                        {t(`admin.benchmarks.metrics.${insight.strength}`)}
                      </AdminBadge>
                    </div>
                    <p className="text-sm text-[var(--rowi-foreground)] mb-2">
                      <strong>{t("admin.benchmarks.compare.insights.howTheyUseIt")}:</strong>{" "}
                      {insight.howTheyUseIt}
                    </p>
                    <p className="text-sm text-[var(--rowi-muted)]">
                      <strong>{t("admin.benchmarks.compare.insights.resultTheyGet")}:</strong>{" "}
                      {insight.resultTheyGet}
                    </p>
                  </div>
                ))}
              </div>
            </AdminCard>
          )}

          {/* Development Areas */}
          {result.developmentAreas.length > 0 && (
            <AdminCard>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                    {t("admin.benchmarks.compare.development.title")}
                  </h3>
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {t("admin.benchmarks.compare.development.subtitle")}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {result.developmentAreas.map((area, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border border-[var(--rowi-card-border)]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[var(--rowi-foreground)]">
                        {t(`admin.benchmarks.metrics.${area.area}`)}
                      </span>
                      <AdminBadge variant={getPriorityColor(area.priority) as any}>
                        {t(`admin.benchmarks.compare.development.${area.priority}`)}
                      </AdminBadge>
                    </div>
                    <p className="text-xs text-[var(--rowi-muted)] mb-2">
                      <strong>{t("admin.benchmarks.compare.development.leveragedBy")}:</strong>{" "}
                      {t(`admin.benchmarks.metrics.${area.leveragedBy}`)}
                    </p>
                    <p className="text-sm text-[var(--rowi-foreground)]">{area.suggestion}</p>
                  </div>
                ))}
              </div>
            </AdminCard>
          )}

          {/* Score Comparison Chart */}
          <AdminCard>
            <h3 className="text-sm font-semibold text-[var(--rowi-foreground)] mb-4">
              {t("admin.benchmarks.compare.results.title")}
            </h3>

            <div className="space-y-4">
              {COMPETENCIES.map((comp) => {
                const userScore = result.userScores[comp] || 0;
                const benchmarkScore = result.benchmarkScores[comp] || 0;
                const percentile = result.percentiles[comp] || 50;

                return (
                  <div key={comp}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-[var(--rowi-foreground)]">
                        {t(`admin.benchmarks.metrics.${comp}`)}
                      </span>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-[var(--rowi-primary)]">
                          {t("admin.benchmarks.compare.strengths.yourScore")}: {userScore.toFixed(1)}
                        </span>
                        <span className="text-[var(--rowi-muted)]">
                          Benchmark: {benchmarkScore.toFixed(1)}
                        </span>
                        <AdminBadge
                          variant={
                            percentile >= 75
                              ? "success"
                              : percentile >= 50
                                ? "info"
                                : percentile >= 25
                                  ? "warning"
                                  : "danger"
                          }
                        >
                          P{percentile}
                        </AdminBadge>
                      </div>
                    </div>
                    <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      {/* Benchmark line */}
                      <div
                        className="absolute h-full w-0.5 bg-gray-400 z-10"
                        style={{ left: `${(benchmarkScore / 120) * 100}%` }}
                      />
                      {/* User score bar */}
                      <div
                        className={`h-full rounded-full transition-all ${
                          userScore >= benchmarkScore
                            ? "bg-gradient-to-r from-green-400 to-emerald-500"
                            : "bg-gradient-to-r from-amber-400 to-orange-500"
                        }`}
                        style={{ width: `${(userScore / 120) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </AdminCard>
        </div>
      )}

      {/* Empty State */}
      {!result && !loading && (
        <AdminCard className="text-center py-12">
          <Users className="w-16 h-16 mx-auto text-[var(--rowi-muted)] mb-4" />
          <h3 className="text-lg font-semibold text-[var(--rowi-foreground)] mb-2">
            {t("admin.benchmarks.compare.title")}
          </h3>
          <p className="text-[var(--rowi-muted)] max-w-md mx-auto">
            {t("admin.benchmarks.compare.subtitle")}
          </p>
        </AdminCard>
      )}
    </AdminPage>
  );
}
