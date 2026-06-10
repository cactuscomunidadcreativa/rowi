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
  Play,
  Download,
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

interface AffinityWeightVersion {
  id: string;
  version: number;
  active: boolean;
  rSquared: number | null;
  sampleSize: number;
  notes: string | null;
  createdAt: string;
}

export default function KnowledgeLayerPage() {
  const { t, ready } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState("");
  const [roleName, setRoleName] = useState("");
  const [weights, setWeights] = useState<AffinityWeightVersion[]>([]);

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

  // Versiones de pesos de afinidad (scope global) para promover a producción.
  async function loadWeights() {
    try {
      const res = await fetch("/api/admin/knowledge/affinity-weights?scope=global");
      const data = await res.json();
      if (data.ok) setWeights(data.versions || []);
    } catch {
      /* best-effort: la tabla puede estar vacía al nacer el sistema */
    }
  }

  // Activar ("subir a main") una versión de pesos → invalida cache del motor.
  async function activateWeights(id: string) {
    setActing(`weights:${id}`);
    try {
      const res = await fetch("/api/admin/knowledge/affinity-weights", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, scope: "global" }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(t("admin.knowledgeLayer.weightsActivated", "Versión activada en producción"));
        await Promise.all([load(), loadWeights()]);
      } else {
        toast.error(data.error || t("common.error", "Error"));
      }
    } catch {
      toast.error(t("common.error", "Error"));
    } finally {
      setActing(null);
    }
  }

  useEffect(() => {
    if (ready) {
      load();
      loadWeights();
    }
  }, [ready]);

  // Disparar un endpoint de acción (writer) y refrescar stats.
  async function runAction(key: string, url: string, body?: object) {
    setActing(key);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(
          t("admin.knowledgeLayer.actionOk", "Acción completada") +
            (typeof data.created === "number" ? ` (${data.created})` : "")
        );
        await load();
      } else {
        toast.error(data.error || t("common.error", "Error"));
      }
    } catch {
      toast.error(t("common.error", "Error"));
    } finally {
      setActing(null);
    }
  }

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

          {/* Promover una versión de pesos de afinidad a producción */}
          <div className="mt-5 pt-5 border-t border-[var(--rowi-border)]">
            <p className="text-sm font-medium text-[var(--rowi-foreground)] mb-3">
              {t("admin.knowledgeLayer.weightsVersionsTitle", "Versiones de pesos de afinidad (global)")}
            </p>
            {weights.length > 0 ? (
              <div className="space-y-2">
                {weights.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between gap-3 text-sm rounded-lg border border-[var(--rowi-border)] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-[var(--rowi-foreground)]">v{w.version}</span>
                      <span className="ml-2 text-xs text-[var(--rowi-muted)]">
                        {t("admin.knowledgeLayer.weightsMeta", "R²")}{" "}
                        {w.rSquared != null ? w.rSquared.toFixed(2) : "—"} · N {w.sampleSize}
                      </span>
                    </div>
                    {w.active ? (
                      <AdminBadge variant="success">
                        {t("admin.knowledgeLayer.weightsActive", "Activa")}
                      </AdminBadge>
                    ) : (
                      <AdminButton
                        variant="secondary"
                        size="sm"
                        disabled={acting === `weights:${w.id}`}
                        onClick={() => activateWeights(w.id)}
                      >
                        {acting === `weights:${w.id}`
                          ? t("admin.common.processing", "Procesando…")
                          : t("admin.knowledgeLayer.weightsActivate", "Promover a producción")}
                      </AdminButton>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--rowi-muted)]">
                {t(
                  "admin.knowledgeLayer.weightsEmpty",
                  "Sin versiones aún. El calibrador las crea cuando el ground-truth basta."
                )}
              </p>
            )}
          </div>
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

      {/* Acciones — disparar writers + descargar dataset */}
      <AdminCard className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Play className="w-4 h-4 text-[var(--rowi-primary)]" />
          <h3 className="font-semibold text-[var(--rowi-foreground)]">
            {t("admin.knowledgeLayer.actionsTitle", "Acciones")}
          </h3>
        </div>

        {/* Detectar patrones colectivos de un tenant */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-4">
          <input
            type="text"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            placeholder={t("admin.knowledgeLayer.tenantIdPlaceholder", "ID del tenant")}
            className="flex-1 px-3 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-sm text-[var(--rowi-foreground)]"
          />
          <AdminButton
            variant="primary"
            icon={Sparkles}
            size="sm"
            disabled={!tenantId || acting === "collective"}
            onClick={() =>
              runAction("collective", "/api/admin/knowledge/collective-patterns/generate", { tenantId })
            }
          >
            {acting === "collective"
              ? t("admin.common.processing", "Procesando…")
              : t("admin.knowledgeLayer.detectPatterns", "Detectar patrones del tenant")}
          </AdminButton>
        </div>

        {/* Descargar dataset (Fase 8 — recopilación) */}
        <div className="flex flex-wrap gap-3">
          <a
            href="/api/admin/knowledge/dataset/export"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] text-sm font-medium text-[var(--rowi-foreground)] hover:bg-[var(--rowi-primary)]/5 transition-colors"
          >
            <Download className="w-4 h-4" />
            {t("admin.knowledgeLayer.downloadDataset", "Descargar dataset (JSONL)")}
          </a>
        </div>
        {/* Crear un JobProfile (hiring playbook — patrón objetivo de un rol) */}
        <div className="mt-5 pt-5 border-t border-[var(--rowi-border)]">
          <p className="text-sm font-medium text-[var(--rowi-foreground)] mb-3">
            {t("admin.knowledgeLayer.newJobProfile", "Nuevo perfil de rol (hiring)")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <input
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder={t("admin.knowledgeLayer.roleNamePlaceholder", "Nombre del rol (ej. Sales Manager)")}
              className="flex-1 px-3 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-sm text-[var(--rowi-foreground)]"
            />
            <AdminButton
              variant="secondary"
              icon={Target}
              size="sm"
              disabled={!roleName || acting === "jobProfile"}
              onClick={async () => {
                await runAction("jobProfile", "/api/admin/knowledge/job-profiles", {
                  roleName,
                  scope: "global",
                });
                setRoleName("");
              }}
            >
              {acting === "jobProfile"
                ? t("admin.common.processing", "Procesando…")
                : t("admin.knowledgeLayer.createProfile", "Crear perfil")}
            </AdminButton>
          </div>
        </div>

        <p className="mt-3 text-xs text-[var(--rowi-muted)]">
          {t(
            "admin.knowledgeLayer.actionsHint",
            "Los patrones de outcome por benchmark se generan desde la página de cada benchmark."
          )}
        </p>
      </AdminCard>
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
