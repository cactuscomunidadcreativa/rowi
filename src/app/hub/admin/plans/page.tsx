"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  CreditCard,
  RefreshCcw,
  PlusCircle,
  Pencil,
  Trash2,
  Sparkles,
  Clock,
  DollarSign,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminGrid,
  AdminButton,
  AdminBadge,
  AdminInput,
  AdminTextarea,
  AdminEmpty,
  AdminIconButton,
  AdminSearch,
  AdminViewToggle,
  AdminList,
  AdminListItem,
} from "@/components/admin/AdminPage";

/* =========================================================
   💳 Rowi Admin — Plans Management
   ---------------------------------------------------------
   Clean, compact, and 100% translatable
========================================================= */

interface Plan {
  id: string;
  name: string;
  description?: string;
  priceUsd: number;
  durationDays: number;
  aiEnabled: boolean;
  createdAt: string;
  updatedAt?: string;
}

export default function PlansAdminPage() {
  const { t, ready } = useI18n();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [editor, setEditor] = useState<{
    mode: "create" | "edit";
    id?: string;
    name: string;
    description: string;
    priceUsd: number;
    durationDays: number;
    aiEnabled: boolean;
  } | null>(null);

  async function loadPlans() {
    setLoading(true);
    try {
      const res = await fetch("/api/hub/plans", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) setPlans(data);
      else setPlans(data.plans || []);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) loadPlans();
  }, [ready]);

  function openCreate() {
    setEditor({
      mode: "create",
      name: "",
      description: "",
      priceUsd: 0,
      durationDays: 30,
      aiEnabled: true,
    });
  }

  function openEdit(plan: Plan) {
    setEditor({
      mode: "edit",
      id: plan.id,
      name: plan.name,
      description: plan.description || "",
      priceUsd: plan.priceUsd,
      durationDays: plan.durationDays,
      aiEnabled: plan.aiEnabled,
    });
  }

  async function save() {
    if (!editor) return;
    if (!editor.name.trim()) {
      toast.error(t("admin.plans.nameRequired"));
      return;
    }

    setSaving(true);
    try {
      const method = editor.mode === "edit" ? "PUT" : "POST";
      const res = await fetch("/api/hub/plans", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editor.id,
          name: editor.name,
          description: editor.description,
          priceUsd: editor.priceUsd,
          durationDays: editor.durationDays,
          aiEnabled: editor.aiEnabled,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);

      toast.success(editor.mode === "edit" ? t("admin.plans.updated") : t("admin.plans.created"));
      setEditor(null);
      loadPlans();
    } catch (e: any) {
      toast.error(e.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  async function deletePlan(id: string) {
    if (!confirm(t("admin.plans.confirmDelete"))) return;
    try {
      const res = await fetch("/api/hub/plans", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      toast.success(t("admin.plans.deleted"));
      loadPlans();
    } catch (e: any) {
      toast.error(e.message || t("common.error"));
    }
  }

  const filtered = plans.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminPage
      titleKey="admin.plans.title"
      descriptionKey="admin.plans.description"
      icon={CreditCard}
      loading={loading}
      actions={
        <div className="flex items-center gap-2">
          <AdminSearch value={search} onChange={setSearch} className="w-40" />
          <AdminViewToggle view={viewMode} onChange={setViewMode} />
          <AdminButton variant="secondary" icon={RefreshCcw} onClick={loadPlans} size="sm">
            {t("admin.common.refresh")}
          </AdminButton>
          <AdminButton icon={PlusCircle} onClick={openCreate} size="sm">
            {t("admin.plans.new")}
          </AdminButton>
        </div>
      }
    >
      {/* Editor Form */}
      {editor && (
        <AdminCard className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
              {editor.mode === "create" ? (
                <PlusCircle className="w-4 h-4 text-white" />
              ) : (
                <Pencil className="w-4 h-4 text-white" />
              )}
            </div>
            <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
              {editor.mode === "create" ? t("admin.plans.new") : t("admin.plans.edit")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AdminInput
              placeholderKey="admin.plans.name"
              value={editor.name}
              onChange={(v) => setEditor({ ...editor, name: v })}
            />
            <AdminInput
              placeholderKey="admin.plans.price"
              type="number"
              value={String(editor.priceUsd)}
              onChange={(v) => setEditor({ ...editor, priceUsd: Number(v) || 0 })}
            />
            <AdminInput
              placeholderKey="admin.plans.duration"
              type="number"
              value={String(editor.durationDays)}
              onChange={(v) => setEditor({ ...editor, durationDays: Number(v) || 30 })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="md:col-span-1">
              <AdminTextarea
                placeholderKey="admin.plans.descriptionField"
                value={editor.description}
                onChange={(v) => setEditor({ ...editor, description: v })}
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditor({ ...editor, aiEnabled: !editor.aiEnabled })}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  editor.aiEnabled
                    ? "bg-[var(--rowi-primary)]/10 border-[var(--rowi-primary)] text-[var(--rowi-primary)]"
                    : "bg-[var(--rowi-background)] border-[var(--rowi-border)] text-[var(--rowi-muted)]"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                {t("admin.plans.aiEnabled")}
                {editor.aiEnabled && <span className="ml-1 text-xs font-bold">ON</span>}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <AdminButton variant="secondary" onClick={() => setEditor(null)}>
              {t("admin.common.cancel")}
            </AdminButton>
            <AdminButton onClick={save} loading={saving}>
              {editor.mode === "create" ? t("admin.common.create") : t("admin.common.save")}
            </AdminButton>
          </div>
        </AdminCard>
      )}

      {/* Plans List/Grid */}
      {filtered.length === 0 ? (
        <AdminEmpty
          icon={CreditCard}
          titleKey="admin.plans.noPlans"
          descriptionKey="admin.plans.description"
        />
      ) : viewMode === "list" ? (
        <AdminList>
          {filtered.map((plan) => (
            <AdminListItem
              key={plan.id}
              icon={CreditCard}
              title={plan.name}
              subtitle={plan.description || ""}
              badge={
                <AdminBadge variant={plan.aiEnabled ? "success" : "default"}>
                  {plan.aiEnabled ? (
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {t("admin.plans.aiActive")}
                    </span>
                  ) : (
                    t("admin.plans.aiInactive")
                  )}
                </AdminBadge>
              }
              meta={
                <div className="flex items-center gap-4 text-xs text-[var(--rowi-muted)]">
                  <span className="flex items-center gap-1 font-semibold text-[var(--rowi-primary)]">
                    <DollarSign className="w-3 h-3" />
                    ${plan.priceUsd}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {plan.durationDays} {t("admin.plans.days")}
                  </span>
                </div>
              }
              actions={
                <>
                  <AdminIconButton icon={Pencil} onClick={() => openEdit(plan)} title={t("admin.common.edit")} />
                  <AdminIconButton icon={Trash2} variant="danger" onClick={() => deletePlan(plan.id)} title={t("admin.common.delete")} />
                </>
              }
            />
          ))}
        </AdminList>
      ) : (
        <AdminGrid cols={3}>
          {filtered.map((plan) => (
            <AdminCard key={plan.id} className="group flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                      {plan.name}
                    </h3>
                    <p className="text-2xl font-bold text-[var(--rowi-primary)]">
                      ${plan.priceUsd}
                    </p>
                  </div>
                </div>
                <AdminBadge variant={plan.aiEnabled ? "success" : "default"}>
                  {plan.aiEnabled ? (
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      IA
                    </span>
                  ) : (
                    "—"
                  )}
                </AdminBadge>
              </div>

              {/* Description */}
              {plan.description && (
                <p className="text-xs text-[var(--rowi-muted)] mb-3 flex-1 line-clamp-2">
                  {plan.description}
                </p>
              )}

              {/* Duration */}
              <div className="flex items-center gap-2 text-xs text-[var(--rowi-muted)] mb-3">
                <Clock className="w-3 h-3" />
                <span>
                  {plan.durationDays} {t("admin.plans.days")}
                </span>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-1 pt-3 border-t border-[var(--rowi-border)] opacity-0 group-hover:opacity-100 transition-opacity">
                <AdminIconButton icon={Pencil} onClick={() => openEdit(plan)} />
                <AdminIconButton icon={Trash2} variant="danger" onClick={() => deletePlan(plan.id)} />
              </div>
            </AdminCard>
          ))}
        </AdminGrid>
      )}
    </AdminPage>
  );
}
