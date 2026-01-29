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
  Users,
  Crown,
  Eye,
  EyeOff,
  Check,
  X,
  Building2,
  Zap,
  Shield,
  BarChart3,
  Globe2,
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
   💳 Rowi Admin — Plans Management (Enhanced)
   ---------------------------------------------------------
   Includes Stripe, trial, features, and display options
========================================================= */

interface Plan {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  priceUsd: number;
  priceCents: number;
  durationDays: number;
  aiEnabled: boolean;
  // Stripe
  stripePriceId?: string;
  stripeProductId?: string;
  // Trial
  trialDays: number;
  // Features
  seiIncluded: boolean;
  maxCommunities: number;
  maxMembers: number;
  benchmarkAccess: boolean;
  apiAccess: boolean;
  // Display
  badge?: string;
  sortOrder: number;
  isPublic: boolean;
  isActive: boolean;
  // Meta
  createdAt: string;
  updatedAt?: string;
  _count?: {
    users: number;
    memberships: number;
  };
}

interface EditorState {
  mode: "create" | "edit";
  id?: string;
  name: string;
  slug: string;
  description: string;
  priceUsd: number;
  priceCents: number;
  durationDays: number;
  aiEnabled: boolean;
  // Stripe
  stripePriceId: string;
  stripeProductId: string;
  // Trial
  trialDays: number;
  // Features
  seiIncluded: boolean;
  maxCommunities: number;
  maxMembers: number;
  benchmarkAccess: boolean;
  apiAccess: boolean;
  // Display
  badge: string;
  sortOrder: number;
  isPublic: boolean;
  isActive: boolean;
}

const INITIAL_EDITOR: Omit<EditorState, "mode"> = {
  name: "",
  slug: "",
  description: "",
  priceUsd: 0,
  priceCents: 0,
  durationDays: 30,
  aiEnabled: true,
  stripePriceId: "",
  stripeProductId: "",
  trialDays: 3,
  seiIncluded: false,
  maxCommunities: 1,
  maxMembers: 10,
  benchmarkAccess: false,
  apiAccess: false,
  badge: "",
  sortOrder: 0,
  isPublic: true,
  isActive: true,
};

export default function PlansAdminPage() {
  const { t, ready } = useI18n();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [showInactive, setShowInactive] = useState(false);
  const [editor, setEditor] = useState<EditorState | null>(null);

  async function loadPlans() {
    setLoading(true);
    try {
      const url = showInactive
        ? "/api/admin/plans?includeInactive=true"
        : "/api/admin/plans";
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setPlans(data.plans || []);
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      toast.error(e.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) loadPlans();
  }, [ready, showInactive]);

  function openCreate() {
    setEditor({ mode: "create", ...INITIAL_EDITOR });
  }

  function openEdit(plan: Plan) {
    setEditor({
      mode: "edit",
      id: plan.id,
      name: plan.name,
      slug: plan.slug || "",
      description: plan.description || "",
      priceUsd: plan.priceUsd,
      priceCents: plan.priceCents,
      durationDays: plan.durationDays,
      aiEnabled: plan.aiEnabled,
      stripePriceId: plan.stripePriceId || "",
      stripeProductId: plan.stripeProductId || "",
      trialDays: plan.trialDays,
      seiIncluded: plan.seiIncluded,
      maxCommunities: plan.maxCommunities,
      maxMembers: plan.maxMembers,
      benchmarkAccess: plan.benchmarkAccess,
      apiAccess: plan.apiAccess,
      badge: plan.badge || "",
      sortOrder: plan.sortOrder,
      isPublic: plan.isPublic,
      isActive: plan.isActive,
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
      const method = editor.mode === "edit" ? "PATCH" : "POST";
      const res = await fetch("/api/admin/plans", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editor.id,
          name: editor.name,
          slug: editor.slug || undefined,
          description: editor.description,
          priceUsd: editor.priceUsd,
          priceCents: editor.priceCents,
          durationDays: editor.durationDays,
          aiEnabled: editor.aiEnabled,
          stripePriceId: editor.stripePriceId || undefined,
          stripeProductId: editor.stripeProductId || undefined,
          trialDays: editor.trialDays,
          seiIncluded: editor.seiIncluded,
          maxCommunities: editor.maxCommunities,
          maxMembers: editor.maxMembers,
          benchmarkAccess: editor.benchmarkAccess,
          apiAccess: editor.apiAccess,
          badge: editor.badge || undefined,
          sortOrder: editor.sortOrder,
          isPublic: editor.isPublic,
          isActive: editor.isActive,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);

      toast.success(
        editor.mode === "edit"
          ? t("admin.plans.updated")
          : t("admin.plans.created")
      );
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
      const res = await fetch("/api/admin/plans", {
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

  async function toggleActive(plan: Plan) {
    try {
      const res = await fetch("/api/admin/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: plan.id, isActive: !plan.isActive }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      toast.success(
        plan.isActive
          ? t("admin.plans.deactivated")
          : t("admin.plans.activated")
      );
      loadPlans();
    } catch (e: any) {
      toast.error(e.message || t("common.error"));
    }
  }

  const filtered = plans.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.slug || "").toLowerCase().includes(search.toLowerCase())
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
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
              showInactive
                ? "bg-[var(--rowi-warning)]/10 text-[var(--rowi-warning)]"
                : "bg-[var(--rowi-muted)]/10 text-[var(--rowi-muted)]"
            }`}
          >
            {showInactive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {showInactive ? t("admin.common.hideInactive") : t("admin.common.showInactive")}
          </button>
          <AdminViewToggle view={viewMode} onChange={setViewMode} />
          <AdminButton
            variant="secondary"
            icon={RefreshCcw}
            onClick={loadPlans}
            size="sm"
          >
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
              {editor.mode === "create"
                ? t("admin.plans.new")
                : t("admin.plans.edit")}
            </h3>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <AdminInput
              placeholderKey="admin.plans.name"
              value={editor.name}
              onChange={(v) => setEditor({ ...editor, name: v })}
            />
            <AdminInput
              placeholderKey="admin.plans.slug"
              value={editor.slug}
              onChange={(v) => setEditor({ ...editor, slug: v })}
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
              onChange={(v) =>
                setEditor({ ...editor, durationDays: Number(v) || 30 })
              }
            />
          </div>

          {/* Stripe */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <AdminInput
              placeholderKey="admin.plans.priceCents"
              type="number"
              value={String(editor.priceCents)}
              onChange={(v) =>
                setEditor({ ...editor, priceCents: Number(v) || 0 })
              }
            />
            <AdminInput
              placeholderKey="admin.plans.stripePriceId"
              value={editor.stripePriceId}
              onChange={(v) => setEditor({ ...editor, stripePriceId: v })}
            />
            <AdminInput
              placeholderKey="admin.plans.stripeProductId"
              value={editor.stripeProductId}
              onChange={(v) => setEditor({ ...editor, stripeProductId: v })}
            />
          </div>

          {/* Trial & Limits */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <AdminInput
              placeholderKey="admin.plans.trialDays"
              type="number"
              value={String(editor.trialDays)}
              onChange={(v) =>
                setEditor({ ...editor, trialDays: Number(v) || 0 })
              }
            />
            <AdminInput
              placeholderKey="admin.plans.maxCommunities"
              type="number"
              value={String(editor.maxCommunities)}
              onChange={(v) =>
                setEditor({ ...editor, maxCommunities: Number(v) || 1 })
              }
            />
            <AdminInput
              placeholderKey="admin.plans.maxMembers"
              type="number"
              value={String(editor.maxMembers)}
              onChange={(v) =>
                setEditor({ ...editor, maxMembers: Number(v) || 10 })
              }
            />
            <AdminInput
              placeholderKey="admin.plans.sortOrder"
              type="number"
              value={String(editor.sortOrder)}
              onChange={(v) =>
                setEditor({ ...editor, sortOrder: Number(v) || 0 })
              }
            />
          </div>

          {/* Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <AdminInput
              placeholderKey="admin.plans.badge"
              value={editor.badge}
              onChange={(v) => setEditor({ ...editor, badge: v })}
            />
            <AdminTextarea
              placeholderKey="admin.plans.descriptionField"
              value={editor.description}
              onChange={(v) => setEditor({ ...editor, description: v })}
            />
          </div>

          {/* Feature Toggles */}
          <div className="flex flex-wrap gap-2 mb-4">
            <FeatureToggle
              active={editor.aiEnabled}
              onClick={() => setEditor({ ...editor, aiEnabled: !editor.aiEnabled })}
              icon={Sparkles}
              label={t("admin.plans.aiEnabled")}
            />
            <FeatureToggle
              active={editor.seiIncluded}
              onClick={() => setEditor({ ...editor, seiIncluded: !editor.seiIncluded })}
              icon={Zap}
              label={t("admin.plans.seiIncluded")}
            />
            <FeatureToggle
              active={editor.benchmarkAccess}
              onClick={() =>
                setEditor({ ...editor, benchmarkAccess: !editor.benchmarkAccess })
              }
              icon={BarChart3}
              label={t("admin.plans.benchmarkAccess")}
            />
            <FeatureToggle
              active={editor.apiAccess}
              onClick={() => setEditor({ ...editor, apiAccess: !editor.apiAccess })}
              icon={Globe2}
              label={t("admin.plans.apiAccess")}
            />
            <FeatureToggle
              active={editor.isPublic}
              onClick={() => setEditor({ ...editor, isPublic: !editor.isPublic })}
              icon={Eye}
              label={t("admin.plans.isPublic")}
            />
            <FeatureToggle
              active={editor.isActive}
              onClick={() => setEditor({ ...editor, isActive: !editor.isActive })}
              icon={Check}
              label={t("admin.plans.isActive")}
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <AdminButton variant="secondary" onClick={() => setEditor(null)}>
              {t("admin.common.cancel")}
            </AdminButton>
            <AdminButton onClick={save} loading={saving}>
              {editor.mode === "create"
                ? t("admin.common.create")
                : t("admin.common.save")}
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
              title={
                <span className="flex items-center gap-2">
                  {plan.name}
                  {plan.badge && (
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-[var(--rowi-warning)]/20 text-[var(--rowi-warning)]">
                      {plan.badge}
                    </span>
                  )}
                  {!plan.isActive && (
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-red-500/20 text-red-500">
                      {t("admin.plans.inactive")}
                    </span>
                  )}
                </span>
              }
              subtitle={plan.description || plan.slug || ""}
              badge={
                <div className="flex items-center gap-2">
                  {plan.aiEnabled && (
                    <AdminBadge variant="success">
                      <Sparkles className="w-3 h-3" />
                    </AdminBadge>
                  )}
                  {plan.seiIncluded && (
                    <AdminBadge variant="info">
                      <Zap className="w-3 h-3" />
                    </AdminBadge>
                  )}
                </div>
              }
              meta={
                <div className="flex items-center gap-4 text-xs text-[var(--rowi-muted)]">
                  <span className="flex items-center gap-1 font-semibold text-[var(--rowi-primary)]">
                    <DollarSign className="w-3 h-3" />$
                    {plan.priceUsd}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {plan.trialDays}d trial
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {plan._count?.users || 0}
                  </span>
                </div>
              }
              actions={
                <>
                  <AdminIconButton
                    icon={plan.isActive ? EyeOff : Eye}
                    onClick={() => toggleActive(plan)}
                    title={
                      plan.isActive
                        ? t("admin.common.deactivate")
                        : t("admin.common.activate")
                    }
                  />
                  <AdminIconButton
                    icon={Pencil}
                    onClick={() => openEdit(plan)}
                    title={t("admin.common.edit")}
                  />
                  <AdminIconButton
                    icon={Trash2}
                    variant="danger"
                    onClick={() => deletePlan(plan.id)}
                    title={t("admin.common.delete")}
                  />
                </>
              }
            />
          ))}
        </AdminList>
      ) : (
        <AdminGrid cols={3}>
          {filtered.map((plan) => (
            <AdminCard
              key={plan.id}
              className={`group flex flex-col ${
                !plan.isActive ? "opacity-60" : ""
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      plan.isActive
                        ? "bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)]"
                        : "bg-[var(--rowi-muted)]/20"
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--rowi-foreground)] flex items-center gap-2">
                      {plan.name}
                      {plan.badge && (
                        <span className="px-1.5 py-0.5 text-[9px] rounded bg-[var(--rowi-warning)]/20 text-[var(--rowi-warning)]">
                          {plan.badge}
                        </span>
                      )}
                    </h3>
                    <p className="text-2xl font-bold text-[var(--rowi-primary)]">
                      ${plan.priceUsd}
                      <span className="text-xs font-normal text-[var(--rowi-muted)] ml-1">
                        /{plan.durationDays}d
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {!plan.isActive && (
                    <AdminBadge variant="error">
                      {t("admin.plans.inactive")}
                    </AdminBadge>
                  )}
                  {!plan.isPublic && (
                    <AdminBadge variant="neutral">
                      <EyeOff className="w-3 h-3" />
                    </AdminBadge>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-1 mb-3">
                {plan.aiEnabled && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-purple-500/10 text-purple-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI
                  </span>
                )}
                {plan.seiIncluded && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-500/10 text-blue-500 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> SEI
                  </span>
                )}
                {plan.benchmarkAccess && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-green-500/10 text-green-500 flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" /> Bench
                  </span>
                )}
                {plan.apiAccess && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-orange-500/10 text-orange-500 flex items-center gap-1">
                    <Globe2 className="w-3 h-3" /> API
                  </span>
                )}
              </div>

              {/* Description */}
              {plan.description && (
                <p className="text-xs text-[var(--rowi-muted)] mb-3 flex-1 line-clamp-2">
                  {plan.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-[var(--rowi-muted)] mb-3">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {plan.trialDays}d trial
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {plan.maxCommunities}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {plan.maxMembers}
                </span>
              </div>

              {/* User count */}
              <div className="flex items-center gap-2 text-xs text-[var(--rowi-muted)] pb-3 border-b border-[var(--rowi-border)]">
                <Crown className="w-3 h-3" />
                <span>
                  {plan._count?.users || 0} {t("admin.plans.subscribers")}
                </span>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-1 pt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <AdminIconButton
                  icon={plan.isActive ? EyeOff : Eye}
                  onClick={() => toggleActive(plan)}
                />
                <AdminIconButton icon={Pencil} onClick={() => openEdit(plan)} />
                <AdminIconButton
                  icon={Trash2}
                  variant="danger"
                  onClick={() => deletePlan(plan.id)}
                />
              </div>
            </AdminCard>
          ))}
        </AdminGrid>
      )}
    </AdminPage>
  );
}

function FeatureToggle({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
        active
          ? "bg-[var(--rowi-primary)]/10 border-[var(--rowi-primary)] text-[var(--rowi-primary)]"
          : "bg-[var(--rowi-background)] border-[var(--rowi-border)] text-[var(--rowi-muted)]"
      }`}
    >
      <Icon className="w-3 h-3" />
      {label}
      {active && <Check className="w-3 h-3" />}
    </button>
  );
}
