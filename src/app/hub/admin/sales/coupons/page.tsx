"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Ticket,
  Plus,
  Search,
  Trash2,
  Edit2,
  Gift,
  Percent,
  DollarSign,
  Clock,
  Users,
  RefreshCcw,
  Copy,
  CheckCircle,
  XCircle,
  Sparkles,
  Tag,
  Mail,
  Filter,
  Wand2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminGrid,
  AdminButton,
} from "@/components/admin/AdminPage";

/* =========================================================
   🎟️ Rowi Admin — Gestión de Códigos Promocionales
========================================================= */

interface Coupon {
  id: string;
  code: string;
  name?: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_TRIAL_DAYS" | "FREE_ACCESS";
  discountValue: number;
  category: "GENERAL" | "PROMOTIONAL" | "PERSONAL" | "GAMIFICATION" | "REFERRAL" | "PARTNER";
  maxUses?: number;
  usedCount: number;
  maxUsesPerUser: number;
  startsAt: string;
  expiresAt?: string;
  active: boolean;
  targetEmail?: string;
  sentAt?: string;
  isGamificationReward: boolean;
  achievementId?: string;
  notes?: string;
  createdAt: string;
  redemptions: Array<{
    id: string;
    userId: string;
    redeemedAt: string;
    discountApplied: number;
  }>;
}

interface CouponStats {
  total: number;
  active: number;
  expired: number;
  totalRedemptions: number;
  byCategory: Array<{ category: string; count: number }>;
}

export default function CouponsPage() {
  const { t, ready } = useI18n();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<CouponStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const CATEGORIES = [
    { value: "", labelKey: "admin.coupons.categories.all" },
    { value: "GENERAL", labelKey: "admin.coupons.categories.general" },
    { value: "PROMOTIONAL", labelKey: "admin.coupons.categories.promotional" },
    { value: "PERSONAL", labelKey: "admin.coupons.categories.personal" },
    { value: "GAMIFICATION", labelKey: "admin.coupons.categories.gamification" },
    { value: "REFERRAL", labelKey: "admin.coupons.categories.referral" },
    { value: "PARTNER", labelKey: "admin.coupons.categories.partner" },
  ];

  const DISCOUNT_TYPES = [
    { value: "PERCENTAGE", labelKey: "admin.coupons.discountTypes.percentage", icon: Percent },
    { value: "FIXED_AMOUNT", labelKey: "admin.coupons.discountTypes.fixedAmount", icon: DollarSign },
    { value: "FREE_TRIAL_DAYS", labelKey: "admin.coupons.discountTypes.freeDays", icon: Clock },
    { value: "FREE_ACCESS", labelKey: "admin.coupons.discountTypes.freeAccess", icon: Gift },
  ];

  async function loadCoupons() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter) params.set("category", categoryFilter);

      const res = await fetch(`/api/admin/sales/coupons?${params}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (json.ok) {
        setCoupons(json.coupons);
        setStats(json.stats);
      } else {
        throw new Error(json.error);
      }
    } catch (e: any) {
      toast.error(e.message || t("admin.coupons.errors.load"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) loadCoupons();
  }, [ready, categoryFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (ready) loadCoupons();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function toggleCouponStatus(coupon: Coupon) {
    try {
      const res = await fetch("/api/admin/sales/coupons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: coupon.id, active: !coupon.active }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(coupon.active ? t("admin.coupons.messages.deactivated") : t("admin.coupons.messages.activated"));
        loadCoupons();
      } else {
        throw new Error(json.error);
      }
    } catch (e: any) {
      toast.error(e.message || t("admin.coupons.errors.update"));
    }
  }

  async function deleteCoupon(coupon: Coupon) {
    if (!confirm(t("admin.coupons.confirmDelete", { code: coupon.code }))) return;

    try {
      const res = await fetch("/api/admin/sales/coupons", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: coupon.id }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(json.deactivated ? t("admin.coupons.messages.deactivated") : t("admin.coupons.messages.deleted"));
        loadCoupons();
      } else {
        throw new Error(json.error);
      }
    } catch (e: any) {
      toast.error(e.message || t("admin.coupons.errors.delete"));
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success(t("admin.coupons.messages.copied"));
  }

  function formatDiscount(coupon: Coupon): string {
    switch (coupon.discountType) {
      case "PERCENTAGE":
        return `${coupon.discountValue}%`;
      case "FIXED_AMOUNT":
        return `$${coupon.discountValue}`;
      case "FREE_TRIAL_DAYS":
        return `${coupon.discountValue} ${t("admin.coupons.days")}`;
      case "FREE_ACCESS":
        return t("admin.coupons.free");
      default:
        return String(coupon.discountValue);
    }
  }

  return (
    <AdminPage
      titleKey="admin.coupons.title"
      descriptionKey="admin.coupons.description"
      icon={Ticket}
      loading={loading}
      actions={
        <div className="flex items-center gap-2">
          <AdminButton
            variant="secondary"
            icon={Wand2}
            onClick={() => setShowGenerateModal(true)}
            size="sm"
          >
            {t("admin.coupons.generateCodes")}
          </AdminButton>
          <AdminButton
            variant="primary"
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
            size="sm"
          >
            {t("admin.coupons.newCoupon")}
          </AdminButton>
          <AdminButton
            variant="ghost"
            icon={RefreshCcw}
            onClick={loadCoupons}
            size="sm"
          />
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        {stats && (
          <AdminGrid cols={4}>
            <StatCard icon={Ticket} label={t("admin.coupons.stats.total")} value={stats.total} color="primary" />
            <StatCard icon={CheckCircle} label={t("admin.coupons.stats.active")} value={stats.active} color="success" />
            <StatCard icon={XCircle} label={t("admin.coupons.stats.expired")} value={stats.expired} color="error" />
            <StatCard icon={Users} label={t("admin.coupons.stats.redemptions")} value={stats.totalRedemptions} color="info" />
          </AdminGrid>
        )}

        {/* Filters */}
        <AdminCard>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
              <input
                type="text"
                placeholder={t("admin.coupons.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--rowi-background)] border border-[var(--rowi-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[var(--rowi-muted)]" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-[var(--rowi-background)] border border-[var(--rowi-border)] rounded-lg focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {t(cat.labelKey)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </AdminCard>

        {/* Coupons List */}
        <AdminCard>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--rowi-border)]">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                    {t("admin.coupons.table.code")}
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                    {t("admin.coupons.table.discount")}
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                    {t("admin.coupons.table.category")}
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                    {t("admin.coupons.table.uses")}
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                    {t("admin.coupons.table.validity")}
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                    {t("admin.coupons.table.status")}
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-[var(--rowi-muted)] uppercase">
                    {t("admin.coupons.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <CouponRow
                    key={coupon.id}
                    coupon={coupon}
                    t={t}
                    formatDiscount={formatDiscount}
                    onToggle={() => toggleCouponStatus(coupon)}
                    onEdit={() => setEditingCoupon(coupon)}
                    onDelete={() => deleteCoupon(coupon)}
                    onCopy={() => copyCode(coupon.code)}
                  />
                ))}
                {coupons.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <Ticket className="w-12 h-12 text-[var(--rowi-muted)] mx-auto mb-3 opacity-50" />
                      <p className="text-[var(--rowi-muted)]">{t("admin.coupons.noCoupons")}</p>
                      <p className="text-xs text-[var(--rowi-muted)] mt-1">{t("admin.coupons.createFirst")}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </AdminCard>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingCoupon) && (
        <CouponModal
          coupon={editingCoupon}
          t={t}
          CATEGORIES={CATEGORIES}
          DISCOUNT_TYPES={DISCOUNT_TYPES}
          onClose={() => {
            setShowCreateModal(false);
            setEditingCoupon(null);
          }}
          onSaved={() => {
            setShowCreateModal(false);
            setEditingCoupon(null);
            loadCoupons();
          }}
        />
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <GenerateModal
          t={t}
          CATEGORIES={CATEGORIES}
          DISCOUNT_TYPES={DISCOUNT_TYPES}
          onClose={() => setShowGenerateModal(false)}
          onGenerated={() => {
            setShowGenerateModal(false);
            loadCoupons();
          }}
        />
      )}
    </AdminPage>
  );
}

// =========================================================
// Helper Components
// =========================================================

function StatCard({
  icon: Icon,
  label,
  value,
  color = "primary",
}: {
  icon: any;
  label: string;
  value: number;
  color?: "primary" | "success" | "warning" | "info" | "error";
}) {
  const colorClasses = {
    primary: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    success: "bg-green-500/10 text-green-600 dark:text-green-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    error: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <div className="bg-white dark:bg-zinc-800/50 rounded-xl p-4 border border-gray-200 dark:border-zinc-700/50 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

function CouponRow({
  coupon,
  t,
  formatDiscount,
  onToggle,
  onEdit,
  onDelete,
  onCopy,
}: {
  coupon: Coupon;
  t: (key: string) => string;
  formatDiscount: (coupon: Coupon) => string;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
}) {
  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
  const categoryColors: Record<string, string> = {
    GENERAL: "bg-gray-500/10 text-gray-500",
    PROMOTIONAL: "bg-purple-500/10 text-purple-500",
    PERSONAL: "bg-blue-500/10 text-blue-500",
    GAMIFICATION: "bg-amber-500/10 text-amber-500",
    REFERRAL: "bg-green-500/10 text-green-500",
    PARTNER: "bg-indigo-500/10 text-indigo-500",
  };

  const discountTypeIcons: Record<string, any> = {
    PERCENTAGE: Percent,
    FIXED_AMOUNT: DollarSign,
    FREE_TRIAL_DAYS: Clock,
    FREE_ACCESS: Gift,
  };

  const DiscountIcon = discountTypeIcons[coupon.discountType] || Tag;

  return (
    <tr className="border-b border-[var(--rowi-border)] hover:bg-[var(--rowi-background)]/50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onCopy}
            className="group flex items-center gap-2 font-mono text-sm font-semibold hover:text-[var(--rowi-primary)] transition-colors"
          >
            <span>{coupon.code}</span>
            <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          {coupon.targetEmail && (
            <span className="text-xs text-[var(--rowi-muted)] flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {coupon.targetEmail}
            </span>
          )}
        </div>
        {coupon.name && (
          <p className="text-xs text-[var(--rowi-muted)] mt-0.5">{coupon.name}</p>
        )}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <DiscountIcon className="w-4 h-4 text-[var(--rowi-muted)]" />
          <span className="font-medium">{formatDiscount(coupon)}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${categoryColors[coupon.category] || categoryColors.GENERAL}`}>
          {coupon.isGamificationReward && <Sparkles className="w-3 h-3" />}
          {t(`admin.coupons.categories.${coupon.category.toLowerCase()}`)}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm">
          {coupon.usedCount}
          {coupon.maxUses && <span className="text-[var(--rowi-muted)]">/{coupon.maxUses}</span>}
        </span>
      </td>
      <td className="py-3 px-4">
        {coupon.expiresAt ? (
          <span className={`text-xs ${isExpired ? "text-red-500" : "text-[var(--rowi-muted)]"}`}>
            {isExpired ? t("admin.coupons.expired") : `${t("admin.coupons.until")} ${new Date(coupon.expiresAt).toLocaleDateString()}`}
          </span>
        ) : (
          <span className="text-xs text-[var(--rowi-muted)]">{t("admin.coupons.noLimit")}</span>
        )}
      </td>
      <td className="py-3 px-4">
        <button
          onClick={onToggle}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
            coupon.active
              ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
              : "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
          }`}
        >
          {coupon.active ? (
            <>
              <CheckCircle className="w-3 h-3" /> {t("admin.coupons.active")}
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3" /> {t("admin.coupons.inactive")}
            </>
          )}
        </button>
      </td>
      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={onEdit}
            className="p-2 rounded-lg hover:bg-[var(--rowi-background)] transition-colors"
            title={t("actions.edit")}
          >
            <Edit2 className="w-4 h-4 text-[var(--rowi-muted)]" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
            title={t("actions.delete")}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function CouponModal({
  coupon,
  t,
  CATEGORIES,
  DISCOUNT_TYPES,
  onClose,
  onSaved,
}: {
  coupon: Coupon | null;
  t: (key: string) => string;
  CATEGORIES: Array<{ value: string; labelKey: string }>;
  DISCOUNT_TYPES: Array<{ value: string; labelKey: string; icon: any }>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: coupon?.code || "",
    name: coupon?.name || "",
    discountType: coupon?.discountType || "PERCENTAGE",
    discountValue: coupon?.discountValue || 10,
    category: coupon?.category || "GENERAL",
    maxUses: coupon?.maxUses || "",
    maxUsesPerUser: coupon?.maxUsesPerUser || 1,
    expiresAt: coupon?.expiresAt ? new Date(coupon.expiresAt).toISOString().split("T")[0] : "",
    targetEmail: coupon?.targetEmail || "",
    isGamificationReward: coupon?.isGamificationReward || false,
    achievementId: coupon?.achievementId || "",
    notes: coupon?.notes || "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const method = coupon ? "PUT" : "POST";
      const body = coupon
        ? { id: coupon.id, ...form, maxUses: form.maxUses || null }
        : { ...form, maxUses: form.maxUses || null };

      const res = await fetch("/api/admin/sales/coupons", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (json.ok) {
        toast.success(coupon ? t("admin.coupons.messages.updated") : t("admin.coupons.messages.created"));
        onSaved();
      } else {
        throw new Error(json.error);
      }
    } catch (e: any) {
      toast.error(e.message || t("admin.coupons.errors.save"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--rowi-card)] rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[var(--rowi-card)] p-6 border-b border-[var(--rowi-border)]">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[var(--rowi-primary)]" />
            {coupon ? t("admin.coupons.editCoupon") : t("admin.coupons.newCoupon")}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--rowi-muted)] mb-1">
                {t("admin.coupons.form.code")} *
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-sm bg-[var(--rowi-background)] border border-[var(--rowi-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]/20 font-mono"
                placeholder="PROMO2024"
                required
                disabled={!!coupon}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--rowi-muted)] mb-1">
                {t("admin.coupons.form.name")}
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[var(--rowi-background)] border border-[var(--rowi-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]/20"
                placeholder={t("admin.coupons.form.namePlaceholder")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--rowi-muted)] mb-1">
                {t("admin.coupons.form.discountType")}
              </label>
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value as any })}
                className="w-full px-3 py-2 text-sm bg-[var(--rowi-background)] border border-[var(--rowi-border)] rounded-lg focus:outline-none"
              >
                {DISCOUNT_TYPES.map((dt) => (
                  <option key={dt.value} value={dt.value}>
                    {t(dt.labelKey)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--rowi-muted)] mb-1">
                {t("admin.coupons.form.value")} *
              </label>
              <input
                type="number"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-[var(--rowi-background)] border border-[var(--rowi-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]/20"
                placeholder="10"
                required
                min={0}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--rowi-muted)] mb-1">
                {t("admin.coupons.form.category")}
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                className="w-full px-3 py-2 text-sm bg-[var(--rowi-background)] border border-[var(--rowi-border)] rounded-lg focus:outline-none"
              >
                {CATEGORIES.slice(1).map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {t(cat.labelKey)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--rowi-muted)] mb-1">
                {t("admin.coupons.form.expirationDate")}
              </label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[var(--rowi-background)] border border-[var(--rowi-border)] rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--rowi-muted)] mb-1">
                {t("admin.coupons.form.maxUses")}
              </label>
              <input
                type="number"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value ? parseInt(e.target.value) : "" })}
                className="w-full px-3 py-2 text-sm bg-[var(--rowi-background)] border border-[var(--rowi-border)] rounded-lg focus:outline-none"
                placeholder={t("admin.coupons.noLimit")}
                min={1}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--rowi-muted)] mb-1">
                {t("admin.coupons.form.usesPerUser")}
              </label>
              <input
                type="number"
                value={form.maxUsesPerUser}
                onChange={(e) => setForm({ ...form, maxUsesPerUser: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 text-sm bg-[var(--rowi-background)] border border-[var(--rowi-border)] rounded-lg focus:outline-none"
                min={1}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--rowi-muted)] mb-1">
              {t("admin.coupons.form.targetEmail")}
            </label>
            <input
              type="email"
              value={form.targetEmail}
              onChange={(e) => setForm({ ...form, targetEmail: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-[var(--rowi-background)] border border-[var(--rowi-border)] rounded-lg focus:outline-none"
              placeholder="user@example.com"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isGamificationReward}
                onChange={(e) => setForm({ ...form, isGamificationReward: e.target.checked })}
                className="w-4 h-4 rounded border-[var(--rowi-border)] text-[var(--rowi-primary)] focus:ring-[var(--rowi-primary)]"
              />
              <span className="text-sm flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                {t("admin.coupons.form.gamificationReward")}
              </span>
            </label>
          </div>

          {form.isGamificationReward && (
            <div>
              <label className="block text-xs font-medium text-[var(--rowi-muted)] mb-1">
                {t("admin.coupons.form.achievementId")}
              </label>
              <input
                type="text"
                value={form.achievementId}
                onChange={(e) => setForm({ ...form, achievementId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[var(--rowi-background)] border border-[var(--rowi-border)] rounded-lg focus:outline-none"
                placeholder="achievement_id"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--rowi-muted)] mb-1">
              {t("admin.coupons.form.notes")}
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-[var(--rowi-background)] border border-[var(--rowi-border)] rounded-lg focus:outline-none resize-none"
              rows={2}
              placeholder={t("admin.coupons.form.notesPlaceholder")}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[var(--rowi-border)]">
            <AdminButton variant="ghost" onClick={onClose} disabled={saving}>
              {t("actions.cancel")}
            </AdminButton>
            <AdminButton variant="primary" type="submit" loading={saving}>
              {coupon ? t("actions.save") : t("admin.coupons.createCoupon")}
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}

function GenerateModal({
  t,
  CATEGORIES,
  DISCOUNT_TYPES,
  onClose,
  onGenerated,
}: {
  t: (key: string, params?: any) => string;
  CATEGORIES: Array<{ value: string; labelKey: string }>;
  DISCOUNT_TYPES: Array<{ value: string; labelKey: string; icon: any }>;
  onClose: () => void;
  onGenerated: () => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    count: 10,
    prefix: "PROMO",
    discountType: "PERCENTAGE",
    discountValue: 10,
    category: "PROMOTIONAL",
    expiresAt: "",
    targetEmails: "",
  });

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);

    try {
      const emails = form.targetEmails
        .split(/[\n,]/)
        .map((e) => e.trim())
        .filter(Boolean);

      const res = await fetch("/api/admin/sales/coupons/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: emails.length > 0 ? emails.length : form.count,
          prefix: form.prefix,
          discountType: form.discountType,
          discountValue: form.discountValue,
          category: emails.length > 0 ? "PERSONAL" : form.category,
          expiresAt: form.expiresAt || null,
          targetEmails: emails,
        }),
      });

      const json = await res.json();
      if (json.ok || json.generated > 0) {
        toast.success(t("admin.coupons.messages.generated", { count: json.generated }));
        onGenerated();
      } else {
        throw new Error(json.error);
      }
    } catch (e: any) {
      toast.error(e.message || t("admin.coupons.errors.generate"));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--rowi-card)] rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[var(--rowi-card)] p-6 border-b border-[var(--rowi-border)]">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-[var(--rowi-primary)]" />
            {t("admin.coupons.generateCodes")}
          </h2>
          <p className="text-xs text-[var(--rowi-muted)] mt-1">
            {t("admin.coupons.generateDescription")}
          </p>
        </div>

        <form onSubmit={handleGenerate} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--rowi-muted)] mb-1">
                {t("admin.coupons.form.quantity")}
              </label>
              <input
                type="number"
                value={form.count}
                onChange={(e) => setForm({ ...form, count: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 text-sm bg-[var(--rowi-background)] border border-[var(--rowi-border)] rounded-lg focus:outline-none"
                min={1}
                max={1000}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--rowi-muted)] mb-1">
                {t("admin.coupons.form.prefix")}
              </label>
              <input
                type="text"
                value={form.prefix}
                onChange={(e) => setForm({ ...form, prefix: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-sm bg-[var(--rowi-background)] border border-[var(--rowi-border)] rounded-lg focus:outline-none font-mono"
                placeholder="PROMO"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--rowi-muted)] mb-1">
                {t("admin.coupons.form.discountType")}
              </label>
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[var(--rowi-background)] border border-[var(--rowi-border)] rounded-lg focus:outline-none"
              >
                {DISCOUNT_TYPES.map((dt) => (
                  <option key={dt.value} value={dt.value}>
                    {t(dt.labelKey)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--rowi-muted)] mb-1">
                {t("admin.coupons.form.value")}
              </label>
              <input
                type="number"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-[var(--rowi-background)] border border-[var(--rowi-border)] rounded-lg focus:outline-none"
                min={0}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--rowi-muted)] mb-1">
                {t("admin.coupons.form.category")}
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[var(--rowi-background)] border border-[var(--rowi-border)] rounded-lg focus:outline-none"
              >
                {CATEGORIES.slice(1).map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {t(cat.labelKey)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--rowi-muted)] mb-1">
                {t("admin.coupons.form.expiration")}
              </label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[var(--rowi-background)] border border-[var(--rowi-border)] rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--rowi-muted)] mb-1">
              {t("admin.coupons.form.personalizedEmails")}
            </label>
            <textarea
              value={form.targetEmails}
              onChange={(e) => setForm({ ...form, targetEmails: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-[var(--rowi-background)] border border-[var(--rowi-border)] rounded-lg focus:outline-none resize-none"
              rows={4}
              placeholder="user1@email.com&#10;user2@email.com&#10;user3@email.com"
            />
            <p className="text-xs text-[var(--rowi-muted)] mt-1">
              {t("admin.coupons.form.emailsHelp")}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[var(--rowi-border)]">
            <AdminButton variant="ghost" onClick={onClose} disabled={generating}>
              {t("actions.cancel")}
            </AdminButton>
            <AdminButton variant="primary" type="submit" loading={generating} icon={Wand2}>
              {form.targetEmails ? t("admin.coupons.generatePersonalized") : t("admin.coupons.generateCount", { count: form.count })}
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}
