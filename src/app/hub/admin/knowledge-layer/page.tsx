"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Brain,
  RefreshCcw,
  Database,
  FlaskConical,
  Target,
  Sparkles,
  GitBranch,
  Layers,
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
   🧠 Rowi Admin — Knowledge Layer (tracking del aprendizaje)
   ---------------------------------------------------------
   Panel de progreso de la base de conocimiento propia:
   catálogo causal, ground-truth acumulado, calibración,
   cache de IA y tamaño del dataset (recopilación, Fase 8).
   Distinto de /hub/admin/knowledge (CRUD de KnowledgeResource).
========================================================= */

interface Stats {
  catalog: {
    interventions: number;
    interventionsHypothesis: number;
    interventionsCalibrated: number;
    jobProfiles: number;
  };
  groundTruth: {
    interventionOutcomes: number;
    affinityGroundTruth: number;
    pulseGroundTruth: number;
    total: number;
  };
  patterns: { outcomePatterns: number; collectivePatterns: number };
  calibration: { affinityWeightsActive: number; pulseWeightsActive: number };
  cache: { entries: number; hits: number };
  dataset: { total: number; byTask: Record<string, number> };
}

export default function KnowledgeLayerPage() {
  const { t, ready } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/knowledge/stats");
      const data = await res.json();
      if (data.ok) setStats(data);
      else toast.error(t("common.error", "Error"));
    } catch {
      toast.error(t("common.error", "Error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) load();
  }, [ready]);

  const gt = stats?.groundTruth;
  const cat = stats?.catalog;
  const cal = stats?.calibration;
  const cache = stats?.cache;
  const ds = stats?.dataset;

  const calibratedPct =
    cat && cat.interventions > 0
      ? Math.round((cat.interventionsCalibrated / cat.interventions) * 100)
      : 0;

  return (
    <AdminPage
      titleKey="admin.knowledgeLayer.title"
      descriptionKey="admin.knowledgeLayer.description"
      icon={Brain}
      loading={loading}
      actions={
        <AdminButton variant="secondary" icon={RefreshCcw} onClick={load} size="sm">
          {t("admin.common.refresh", "Actualizar")}
        </AdminButton>
      }
    >
      {/* Tarjetas resumen */}
      <AdminGrid cols={4} className="mb-6">
        <AdminCard compact>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--rowi-muted)]">
                {t("admin.knowledgeLayer.interventions", "Intervenciones")}
              </p>
              <p className="text-xl font-bold text-[var(--rowi-foreground)]">
                {cat?.interventions ?? 0}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard compact>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--rowi-muted)]">
                {t("admin.knowledgeLayer.groundTruth", "Ground-truth")}
              </p>
              <p className="text-xl font-bold text-[var(--rowi-foreground)]">
                {(gt?.total ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard compact>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--rowi-muted)]">
                {t("admin.knowledgeLayer.datasetSize", "Dataset (registros)")}
              </p>
              <p className="text-xl font-bold text-[var(--rowi-foreground)]">
                {(ds?.total ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard compact>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-xs text-[var(--rowi-muted)]">
                {t("admin.knowledgeLayer.cacheHits", "Cache IA (hits)")}
              </p>
              <p className="text-xl font-bold text-[var(--rowi-foreground)]">
                {(cache?.hits ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
        </AdminCard>
      </AdminGrid>

      {/* Catálogo causal */}
      <AdminCard className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-[var(--rowi-primary)]" />
          <h3 className="font-semibold text-[var(--rowi-foreground)]">
            {t("admin.knowledgeLayer.catalogTitle", "Catálogo causal")}
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Stat label={t("admin.knowledgeLayer.interventions", "Intervenciones")} value={cat?.interventions ?? 0} />
          <div>
            <p className="text-xs text-[var(--rowi-muted)]">
              {t("admin.knowledgeLayer.calibratedPct", "% calibrado")}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-[var(--rowi-foreground)]">{calibratedPct}%</p>
              <AdminBadge variant={calibratedPct > 0 ? "success" : "warning"}>
                {cat?.interventionsCalibrated ?? 0} / {cat?.interventions ?? 0}
              </AdminBadge>
            </div>
          </div>
          <Stat
            label={t("admin.knowledgeLayer.hypothesis", "Hipótesis v0")}
            value={cat?.interventionsHypothesis ?? 0}
          />
          <Stat label={t("admin.knowledgeLayer.jobProfiles", "Perfiles de rol")} value={cat?.jobProfiles ?? 0} />
        </div>
      </AdminCard>

      {/* Ground-truth por fuente */}
      <AdminCard className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-[var(--rowi-primary)]" />
          <h3 className="font-semibold text-[var(--rowi-foreground)]">
            {t("admin.knowledgeLayer.groundTruthTitle", "Ground-truth acumulado")}
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <Stat label={t("admin.knowledgeLayer.pulseGt", "Pulse Points")} value={gt?.pulseGroundTruth ?? 0} />
          <Stat label={t("admin.knowledgeLayer.affinityGt", "Afinidad")} value={gt?.affinityGroundTruth ?? 0} />
          <Stat
            label={t("admin.knowledgeLayer.interventionGt", "Intervenciones")}
            value={gt?.interventionOutcomes ?? 0}
          />
        </div>
      </AdminCard>

      {/* Patrones detectados */}
      <AdminCard className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-[var(--rowi-primary)]" />
          <h3 className="font-semibold text-[var(--rowi-foreground)]">
            {t("admin.knowledgeLayer.patternsTitle", "Patrones detectados")}
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Stat
            label={t("admin.knowledgeLayer.outcomePatterns", "Patrones de outcome")}
            value={stats?.patterns?.outcomePatterns ?? 0}
          />
          <Stat
            label={t("admin.knowledgeLayer.collectivePatterns", "Patrones colectivos")}
            value={stats?.patterns?.collectivePatterns ?? 0}
          />
        </div>
      </AdminCard>

      {/* Calibración + dataset por tarea */}
      <AdminGrid cols={2}>
        <AdminCard>
          <div className="flex items-center gap-2 mb-4">
            <GitBranch className="w-4 h-4 text-[var(--rowi-primary)]" />
            <h3 className="font-semibold text-[var(--rowi-foreground)]">
              {t("admin.knowledgeLayer.calibrationTitle", "Calibración de pesos")}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Stat
              label={t("admin.knowledgeLayer.affinityWeights", "Afinidad (v activos)")}
              value={cal?.affinityWeightsActive ?? 0}
            />
            <Stat
              label={t("admin.knowledgeLayer.pulseWeights", "Pulse (v activos)")}
              value={cal?.pulseWeightsActive ?? 0}
            />
          </div>
          <p className="mt-4 text-xs text-[var(--rowi-muted)]">
            {t(
              "admin.knowledgeLayer.calibrationHint",
              "0 = usando hipótesis v0 hardcoded. Sube a v1+ cuando el ground-truth lo respalde."
            )}
          </p>
        </AdminCard>

        <AdminCard>
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical className="w-4 h-4 text-[var(--rowi-primary)]" />
            <h3 className="font-semibold text-[var(--rowi-foreground)]">
              {t("admin.knowledgeLayer.datasetTitle", "Dataset por tarea")}
            </h3>
          </div>
          {ds && Object.keys(ds.byTask).length > 0 ? (
            <div className="space-y-2 text-sm">
              {Object.entries(ds.byTask).map(([task, n]) => (
                <div key={task} className="flex items-center justify-between">
                  <span className="text-[var(--rowi-foreground)]">{task}</span>
                  <AdminBadge variant="info">{n.toLocaleString()}</AdminBadge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--rowi-muted)]">
              {t(
                "admin.knowledgeLayer.datasetEmpty",
                "Aún sin registros. El dataset crece con cada medición real."
              )}
            </p>
          )}
        </AdminCard>
      </AdminGrid>
    </AdminPage>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-[var(--rowi-muted)]">{label}</p>
      <p className="text-lg font-bold text-[var(--rowi-foreground)]">{value.toLocaleString()}</p>
    </div>
  );
}
