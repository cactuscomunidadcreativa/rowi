"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BookOpenCheck,
  RefreshCcw,
  Play,
  RotateCw,
  BrainCircuit,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminGrid,
  AdminButton,
  AdminBadge,
  AdminEmpty,
  AdminSearch,
} from "@/components/admin/AdminPage";

/* =========================================================
   🧠 Rowi Admin — AI Learning Panel
   ---------------------------------------------------------
   Clean, compact, and 100% translatable
========================================================= */

export default function AILearningPage() {
  const { t, ready } = useI18n();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadAgents() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/agents", { cache: "no-store" });
      const data = await res.json();
      const list = (data.agents || []).filter((a: any) => a.autoLearn === true);
      setAgents(list);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) loadAgents();
  }, [ready]);

  const filtered = agents.filter(
    (a) =>
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.slug?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleRetrain(a: any) {
    toast.loading(t("admin.learning.retraining", { name: a.name }));
    await new Promise((r) => setTimeout(r, 1500));
    toast.success(t("admin.learning.retrained", { name: a.name }));
  }

  async function handleReset(a: any) {
    toast.loading(t("admin.learning.resetting", { name: a.name }));
    await new Promise((r) => setTimeout(r, 1500));
    toast.success(t("admin.learning.reset", { name: a.name }));
  }

  return (
    <AdminPage
      titleKey="admin.learning.title"
      descriptionKey="admin.learning.description"
      icon={BookOpenCheck}
      loading={loading}
      actions={
        <div className="flex items-center gap-2">
          <AdminSearch value={search} onChange={setSearch} className="w-48" />
          <AdminButton variant="secondary" icon={RefreshCcw} onClick={loadAgents} size="sm">
            {t("admin.common.refresh")}
          </AdminButton>
        </div>
      }
    >
      {filtered.length === 0 ? (
        <AdminEmpty
          icon={BrainCircuit}
          titleKey="admin.learning.noAgents"
          descriptionKey="admin.learning.description"
        />
      ) : (
        <AdminGrid cols={3}>
          {filtered.map((a) => (
            <AdminCard key={a.id} className="flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
                    <BrainCircuit className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                      {a.name}
                    </h3>
                    <p className="text-[10px] text-[var(--rowi-muted)]">
                      {a.model || "—"} · {a.type?.toUpperCase()}
                    </p>
                  </div>
                </div>
                <AdminBadge variant="success">
                  {t("admin.learning.autoLearn")}
                </AdminBadge>
              </div>

              {/* Last Training */}
              <p className="text-xs text-[var(--rowi-muted)] mb-3">
                {t("admin.learning.lastTraining")}:{" "}
                <span className="text-[var(--rowi-primary)] font-medium">
                  {new Date(a.updatedAt).toLocaleDateString()}
                </span>
              </p>

              {/* Metrics (simulated) */}
              <div className="rounded-lg bg-[var(--rowi-background)] border border-[var(--rowi-border)] p-3 mb-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-[var(--rowi-foreground)]">
                      {Math.floor(Math.random() * 2000) + 200}
                    </p>
                    <p className="text-[9px] text-[var(--rowi-muted)]">
                      {t("admin.learning.interactions")}
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[var(--rowi-foreground)]">
                      {Math.floor(Math.random() * 50) + 5}
                    </p>
                    <p className="text-[9px] text-[var(--rowi-muted)]">
                      {t("admin.learning.promptsUsed")}
                    </p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[var(--rowi-foreground)]">
                      {(Math.random() * 500).toFixed(0)}K
                    </p>
                    <p className="text-[9px] text-[var(--rowi-muted)]">
                      {t("admin.learning.tokensConsumed")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 mt-auto pt-3 border-t border-[var(--rowi-border)]">
                <AdminButton
                  variant="secondary"
                  size="sm"
                  icon={Play}
                  onClick={() => handleRetrain(a)}
                >
                  {t("admin.learning.retrain")}
                </AdminButton>
                <AdminButton
                  variant="danger"
                  size="sm"
                  icon={RotateCw}
                  onClick={() => handleReset(a)}
                >
                  {t("admin.learning.resetBtn")}
                </AdminButton>
              </div>
            </AdminCard>
          ))}
        </AdminGrid>
      )}
    </AdminPage>
  );
}
