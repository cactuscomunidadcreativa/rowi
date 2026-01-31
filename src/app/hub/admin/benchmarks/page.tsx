"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  BarChart3,
  Upload,
  Trash2,
  Eye,
  RefreshCcw,
  Brain,
  Globe,
  Building2,
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Archive,
  Calculator,
  Loader2,
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
   📊 Benchmarks — Lista Principal
========================================================= */

interface Benchmark {
  id: string;
  name: string;
  description: string | null;
  type: "ROWIVERSE" | "EXTERNAL" | "INTERNAL";
  scope: string;
  status: "PROCESSING" | "COMPLETED" | "ENRICHING" | "FAILED" | "ARCHIVED";
  totalRows: number;
  processedRows: number;
  isLearning: boolean;
  isActive: boolean;
  uploadedAt: string;
  lastEnrichedAt: string | null;
  tenant?: { id: string; name: string } | null;
  hub?: { id: string; name: string } | null;
  _count: {
    dataPoints: number;
    statistics: number;
    topPerformers: number;
    correlations: number;
  };
}

export default function BenchmarksPage() {
  const { t, ready } = useI18n();
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculatingId, setCalculatingId] = useState<string | null>(null);

  async function loadBenchmarks() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/benchmarks");
      const data = await res.json();
      if (data.ok) {
        setBenchmarks(data.benchmarks);
      }
    } catch (error) {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) loadBenchmarks();
  }, [ready]);

  async function deleteBenchmark(id: string) {
    if (!confirm(t("admin.benchmarks.confirmDelete"))) return;

    try {
      const res = await fetch(`/api/admin/benchmarks/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(t("admin.benchmarks.deleted"));
        loadBenchmarks();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error(t("common.error"));
    }
  }

  async function calculateCorrelations(id: string) {
    setCalculatingId(id);
    try {
      const res = await fetch(`/api/admin/benchmarks/${id}/correlations/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(t("admin.benchmarks.correlations.calculated"));
        loadBenchmarks();
      } else {
        toast.error(data.error || t("common.error"));
      }
    } catch {
      toast.error(t("common.error"));
    } finally {
      setCalculatingId(null);
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ROWIVERSE":
        return <Globe className="w-4 h-4" />;
      case "EXTERNAL":
        return <TrendingUp className="w-4 h-4" />;
      case "INTERNAL":
        return <Building2 className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "ROWIVERSE":
        return t("admin.benchmarks.types.rowiverse");
      case "EXTERNAL":
        return t("admin.benchmarks.types.external");
      case "INTERNAL":
        return t("admin.benchmarks.types.internal");
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <AdminBadge variant="success">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t("admin.benchmarks.status.completed")}
          </AdminBadge>
        );
      case "PROCESSING":
        return (
          <AdminBadge variant="warning">
            <Clock className="w-3 h-3 mr-1 animate-spin" />
            {t("admin.benchmarks.status.processing")}
          </AdminBadge>
        );
      case "ENRICHING":
        return (
          <AdminBadge variant="info">
            <RefreshCcw className="w-3 h-3 mr-1 animate-spin" />
            {t("admin.benchmarks.status.enriching")}
          </AdminBadge>
        );
      case "FAILED":
        return (
          <AdminBadge variant="danger">
            <AlertCircle className="w-3 h-3 mr-1" />
            {t("admin.benchmarks.status.failed")}
          </AdminBadge>
        );
      case "ARCHIVED":
        return (
          <AdminBadge variant="secondary">
            <Archive className="w-3 h-3 mr-1" />
            {t("admin.benchmarks.status.archived")}
          </AdminBadge>
        );
      default:
        return <AdminBadge>{status}</AdminBadge>;
    }
  };

  return (
    <AdminPage
      titleKey="admin.benchmarks.title"
      descriptionKey="admin.benchmarks.subtitle"
      icon={BarChart3}
      loading={loading}
      actions={
        <div className="flex gap-2">
          <AdminButton
            variant="secondary"
            icon={RefreshCcw}
            onClick={loadBenchmarks}
            size="sm"
          >
            {t("admin.common.refresh")}
          </AdminButton>
          <Link href="/hub/admin/benchmarks/upload">
            <AdminButton variant="primary" icon={Upload} size="sm">
              {t("admin.benchmarks.upload")}
            </AdminButton>
          </Link>
        </div>
      }
    >
      {benchmarks.length === 0 && !loading ? (
        <AdminCard className="text-center py-12">
          <BarChart3 className="w-16 h-16 mx-auto text-[var(--rowi-muted)] mb-4" />
          <h3 className="text-lg font-semibold text-[var(--rowi-foreground)] mb-2">
            {t("admin.benchmarks.empty")}
          </h3>
          <p className="text-sm text-[var(--rowi-muted)] mb-6">
            {t("admin.benchmarks.emptyDesc")}
          </p>
          <Link href="/hub/admin/benchmarks/upload">
            <AdminButton variant="primary" icon={Upload}>
              {t("admin.benchmarks.upload")}
            </AdminButton>
          </Link>
        </AdminCard>
      ) : (
        <AdminGrid cols={1}>
          {benchmarks.map((benchmark) => (
            <AdminCard key={benchmark.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between gap-4">
                {/* Info Principal */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
                      {getTypeIcon(benchmark.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--rowi-foreground)]">
                        {benchmark.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-[var(--rowi-muted)]">
                        <span>{getTypeLabel(benchmark.type)}</span>
                        <span>•</span>
                        <span>{t(`admin.benchmarks.scopes.${benchmark.scope.toLowerCase()}`)}</span>
                        {benchmark.tenant && (
                          <>
                            <span>•</span>
                            <span>{benchmark.tenant.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {benchmark.description && (
                    <p className="text-sm text-[var(--rowi-muted)] mb-3">
                      {benchmark.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-[var(--rowi-muted)]" />
                      <span className="font-medium">{benchmark.totalRows.toLocaleString()}</span>
                      <span className="text-[var(--rowi-muted)]">{t("admin.benchmarks.rows")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Brain className="w-3 h-3 text-[var(--rowi-muted)]" />
                      <span className="font-medium">{benchmark._count.topPerformers}</span>
                      <span className="text-[var(--rowi-muted)]">{t("admin.benchmarks.topPerformers.title")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-[var(--rowi-muted)]" />
                      <span className="font-medium">{benchmark._count.correlations}</span>
                      <span className="text-[var(--rowi-muted)]">{t("admin.benchmarks.correlations.title")}</span>
                    </div>
                    {benchmark.isLearning && (
                      <div className="flex items-center gap-1 text-green-600">
                        <RefreshCcw className="w-3 h-3" />
                        <span>{t("admin.benchmarks.isLearning")}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status y Acciones */}
                <div className="flex flex-col items-end gap-3">
                  {getStatusBadge(benchmark.status)}

                  <div className="flex gap-1 flex-wrap justify-end">
                    {benchmark.status === "COMPLETED" && benchmark._count.correlations === 0 && (
                      <AdminButton
                        variant="primary"
                        size="sm"
                        icon={calculatingId === benchmark.id ? Loader2 : Calculator}
                        onClick={() => calculateCorrelations(benchmark.id)}
                        disabled={calculatingId === benchmark.id}
                      >
                        {calculatingId === benchmark.id
                          ? t("admin.benchmarks.correlations.calculating")
                          : t("admin.benchmarks.correlations.generate")}
                      </AdminButton>
                    )}
                    <Link href={`/hub/admin/benchmarks/${benchmark.id}`}>
                      <AdminButton variant="secondary" size="sm" icon={Eye}>
                        {t("admin.benchmarks.viewDetails")}
                      </AdminButton>
                    </Link>
                    <AdminButton
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => deleteBenchmark(benchmark.id)}
                    />
                  </div>

                  <p className="text-xs text-[var(--rowi-muted)]">
                    {t("admin.benchmarks.uploadedAt")}:{" "}
                    {new Date(benchmark.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </AdminCard>
          ))}
        </AdminGrid>
      )}
    </AdminPage>
  );
}
