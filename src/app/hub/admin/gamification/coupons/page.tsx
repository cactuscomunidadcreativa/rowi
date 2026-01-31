// src/app/hub/admin/gamification/coupons/page.tsx
// ============================================================
// Coupons & Promo Codes - Generador de cupones con gamificación
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/react";
import {
  Ticket,
  Plus,
  Copy,
  Trash2,
  Calendar,
  Users,
  Gift,
  Percent,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Filter,
  Search,
  Sparkles,
  Share2,
  Trophy,
  Zap,
  Crown,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed" | "free_months" | "free_trial";
  value: number;
  description: string;
  maxUses: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  minPurchase?: number;
  applicablePlans?: string[];
  gamificationTrigger?: string;
  createdAt: string;
}

// Demo data
const DEMO_COUPONS: Coupon[] = [
  {
    id: "1",
    code: "WELCOME2024",
    type: "percentage",
    value: 20,
    description: "20% descuento para nuevos usuarios",
    maxUses: 1000,
    usedCount: 456,
    validFrom: "2024-01-01",
    validUntil: "2024-12-31",
    isActive: true,
    createdAt: "2024-01-01",
  },
  {
    id: "2",
    code: "SHARE3FREE",
    type: "free_months",
    value: 1,
    description: "1 mes gratis por compartir con 3 amigos",
    maxUses: 500,
    usedCount: 123,
    validFrom: "2024-01-01",
    validUntil: "2024-06-30",
    isActive: true,
    gamificationTrigger: "share_3_friends",
    createdAt: "2024-01-15",
  },
  {
    id: "3",
    code: "STREAK30",
    type: "free_months",
    value: 2,
    description: "2 meses gratis por 30 días consecutivos",
    maxUses: 200,
    usedCount: 45,
    validFrom: "2024-01-01",
    validUntil: "2024-12-31",
    isActive: true,
    gamificationTrigger: "streak_30_days",
    createdAt: "2024-01-20",
  },
  {
    id: "4",
    code: "EQMASTER",
    type: "percentage",
    value: 50,
    description: "50% off por alcanzar EQ nivel Experto",
    maxUses: 100,
    usedCount: 12,
    validFrom: "2024-01-01",
    validUntil: "2024-12-31",
    isActive: true,
    gamificationTrigger: "eq_level_expert",
    createdAt: "2024-02-01",
  },
  {
    id: "5",
    code: "TRIAL14",
    type: "free_trial",
    value: 14,
    description: "14 días de prueba gratis",
    maxUses: 5000,
    usedCount: 1234,
    validFrom: "2024-01-01",
    validUntil: "2024-12-31",
    isActive: true,
    createdAt: "2024-01-01",
  },
];

const GAMIFICATION_TRIGGERS = [
  { value: "share_3_friends", label: "Compartir con 3 amigos", icon: Share2 },
  { value: "share_5_friends", label: "Compartir con 5 amigos", icon: Share2 },
  { value: "streak_7_days", label: "Racha de 7 días", icon: Zap },
  { value: "streak_30_days", label: "Racha de 30 días", icon: Zap },
  { value: "streak_90_days", label: "Racha de 90 días", icon: Zap },
  { value: "eq_level_intermediate", label: "EQ Nivel Intermedio", icon: Trophy },
  { value: "eq_level_advanced", label: "EQ Nivel Avanzado", icon: Trophy },
  { value: "eq_level_expert", label: "EQ Nivel Experto", icon: Crown },
  { value: "complete_100_tasks", label: "Completar 100 tareas", icon: CheckCircle },
  { value: "weekflow_12_weeks", label: "WeekFlow 12 semanas", icon: Calendar },
];

export default function CouponsPage() {
  const { locale } = useI18n();
  const [coupons, setCoupons] = useState<Coupon[]>(DEMO_COUPONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    type: "percentage" as Coupon["type"],
    value: 10,
    description: "",
    maxUses: 100,
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    gamificationTrigger: "",
  });

  const txt = {
    title: locale === "en" ? "Coupons & Promo Codes" : "Cupones y Códigos Promocionales",
    subtitle: locale === "en" ? "Manage promotional codes and gamification rewards" : "Gestiona códigos promocionales y recompensas de gamificación",
    createCoupon: locale === "en" ? "Create Coupon" : "Crear Cupón",
    search: locale === "en" ? "Search coupons..." : "Buscar cupones...",
    all: locale === "en" ? "All" : "Todos",
    percentage: locale === "en" ? "Percentage" : "Porcentaje",
    fixed: locale === "en" ? "Fixed Amount" : "Monto Fijo",
    freeMonths: locale === "en" ? "Free Months" : "Meses Gratis",
    freeTrial: locale === "en" ? "Free Trial" : "Prueba Gratis",
    code: locale === "en" ? "Code" : "Código",
    type: locale === "en" ? "Type" : "Tipo",
    value: locale === "en" ? "Value" : "Valor",
    description: locale === "en" ? "Description" : "Descripción",
    maxUses: locale === "en" ? "Max Uses" : "Usos Máx",
    usedCount: locale === "en" ? "Used" : "Usados",
    validFrom: locale === "en" ? "Valid From" : "Válido Desde",
    validUntil: locale === "en" ? "Valid Until" : "Válido Hasta",
    status: locale === "en" ? "Status" : "Estado",
    active: locale === "en" ? "Active" : "Activo",
    inactive: locale === "en" ? "Inactive" : "Inactivo",
    expired: locale === "en" ? "Expired" : "Expirado",
    gamificationTrigger: locale === "en" ? "Gamification Trigger" : "Trigger de Gamificación",
    none: locale === "en" ? "None (Manual)" : "Ninguno (Manual)",
    copiedToClipboard: locale === "en" ? "Copied to clipboard!" : "¡Copiado al portapapeles!",
    confirmDelete: locale === "en" ? "Are you sure you want to delete this coupon?" : "¿Estás seguro de eliminar este cupón?",
    totalCoupons: locale === "en" ? "Total Coupons" : "Total Cupones",
    activeCoupons: locale === "en" ? "Active" : "Activos",
    totalRedemptions: locale === "en" ? "Total Redemptions" : "Total Canjes",
    gamificationCoupons: locale === "en" ? "Gamification Linked" : "Vinculados a Gamificación",
    months: locale === "en" ? "months" : "meses",
    days: locale === "en" ? "days" : "días",
    off: locale === "en" ? "off" : "descuento",
    uses: locale === "en" ? "uses" : "usos",
    generate: locale === "en" ? "Generate Code" : "Generar Código",
    save: locale === "en" ? "Save" : "Guardar",
    cancel: locale === "en" ? "Cancel" : "Cancelar",
  };

  const filteredCoupons = coupons.filter((c) => {
    const matchesSearch = c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || c.type === filterType;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: coupons.length,
    active: coupons.filter(c => c.isActive).length,
    totalRedemptions: coupons.reduce((sum, c) => sum + c.usedCount, 0),
    gamificationLinked: coupons.filter(c => c.gamificationTrigger).length,
  };

  function generateCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCoupon({ ...newCoupon, code });
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success(txt.copiedToClipboard);
  }

  function handleCreateCoupon() {
    const coupon: Coupon = {
      id: Date.now().toString(),
      ...newCoupon,
      usedCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    setCoupons([coupon, ...coupons]);
    setShowCreateModal(false);
    setNewCoupon({
      code: "",
      type: "percentage",
      value: 10,
      description: "",
      maxUses: 100,
      validFrom: new Date().toISOString().split("T")[0],
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      gamificationTrigger: "",
    });
    toast.success(locale === "en" ? "Coupon created successfully!" : "¡Cupón creado exitosamente!");
  }

  function toggleCouponStatus(id: string) {
    setCoupons(coupons.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
  }

  function deleteCoupon(id: string) {
    if (confirm(txt.confirmDelete)) {
      setCoupons(coupons.filter(c => c.id !== id));
      toast.success(locale === "en" ? "Coupon deleted" : "Cupón eliminado");
    }
  }

  function getTypeLabel(type: Coupon["type"]) {
    switch (type) {
      case "percentage": return txt.percentage;
      case "fixed": return txt.fixed;
      case "free_months": return txt.freeMonths;
      case "free_trial": return txt.freeTrial;
    }
  }

  function getValueDisplay(coupon: Coupon) {
    switch (coupon.type) {
      case "percentage": return `${coupon.value}% ${txt.off}`;
      case "fixed": return `$${coupon.value} ${txt.off}`;
      case "free_months": return `${coupon.value} ${txt.months}`;
      case "free_trial": return `${coupon.value} ${txt.days}`;
    }
  }

  function isExpired(validUntil: string) {
    return new Date(validUntil) < new Date();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
            <Ticket className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{txt.title}</h1>
            <p className="text-gray-400 text-sm">{txt.subtitle}</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 transition-colors text-white text-sm"
        >
          <Plus className="w-4 h-4" />
          {txt.createCoupon}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <Ticket className="w-5 h-5" />
            <span className="text-sm">{txt.totalCoupons}</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm">{txt.activeCoupons}</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.active}</p>
        </div>
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Users className="w-5 h-5" />
            <span className="text-sm">{txt.totalRedemptions}</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalRedemptions.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-5">
          <div className="flex items-center gap-2 text-violet-400 mb-2">
            <Trophy className="w-5 h-5" />
            <span className="text-sm">{txt.gamificationCoupons}</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.gamificationLinked}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={txt.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white text-sm focus:border-amber-500 focus:outline-none"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white text-sm focus:border-amber-500 focus:outline-none"
        >
          <option value="all">{txt.all}</option>
          <option value="percentage">{txt.percentage}</option>
          <option value="fixed">{txt.fixed}</option>
          <option value="free_months">{txt.freeMonths}</option>
          <option value="free_trial">{txt.freeTrial}</option>
        </select>
      </div>

      {/* Coupons List */}
      <div className="space-y-3">
        {filteredCoupons.map((coupon) => (
          <div
            key={coupon.id}
            className={`bg-gray-800/50 rounded-2xl border p-5 ${
              !coupon.isActive || isExpired(coupon.validUntil)
                ? "border-gray-700/30 opacity-60"
                : coupon.gamificationTrigger
                ? "border-violet-500/30"
                : "border-gray-700/50"
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Code & Badge */}
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${
                  coupon.gamificationTrigger
                    ? "bg-violet-500/20"
                    : "bg-amber-500/20"
                }`}>
                  {coupon.gamificationTrigger ? (
                    <Trophy className="w-6 h-6 text-violet-400" />
                  ) : (
                    <Ticket className="w-6 h-6 text-amber-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <code className="text-lg font-mono font-bold text-white bg-gray-700/50 px-3 py-1 rounded">
                      {coupon.code}
                    </code>
                    <button
                      onClick={() => copyCode(coupon.code)}
                      className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{coupon.description}</p>
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 md:ml-4">
                <div>
                  <span className="text-xs text-gray-500">{txt.type}</span>
                  <p className="text-sm text-white">{getTypeLabel(coupon.type)}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">{txt.value}</span>
                  <p className="text-sm font-semibold text-emerald-400">{getValueDisplay(coupon)}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">{txt.uses}</span>
                  <p className="text-sm text-white">{coupon.usedCount} / {coupon.maxUses}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">{txt.validUntil}</span>
                  <p className="text-sm text-white">{new Date(coupon.validUntil).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center gap-2">
                {coupon.gamificationTrigger && (
                  <span className="text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-300">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    Gamification
                  </span>
                )}
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isExpired(coupon.validUntil)
                    ? "bg-red-500/20 text-red-300"
                    : coupon.isActive
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-gray-500/20 text-gray-300"
                }`}>
                  {isExpired(coupon.validUntil) ? txt.expired : coupon.isActive ? txt.active : txt.inactive}
                </span>
                <button
                  onClick={() => toggleCouponStatus(coupon.id)}
                  className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                  title={coupon.isActive ? "Desactivar" : "Activar"}
                >
                  {coupon.isActive ? (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                <button
                  onClick={() => deleteCoupon(coupon.id)}
                  className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-amber-400" />
              {txt.createCoupon}
            </h2>

            <div className="space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">{txt.code}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white text-sm font-mono focus:border-amber-500 focus:outline-none"
                    placeholder="CODIGO123"
                  />
                  <button
                    onClick={generateCode}
                    className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm"
                  >
                    {txt.generate}
                  </button>
                </div>
              </div>

              {/* Type & Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">{txt.type}</label>
                  <select
                    value={newCoupon.type}
                    onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value as Coupon["type"] })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value="percentage">{txt.percentage}</option>
                    <option value="fixed">{txt.fixed}</option>
                    <option value="free_months">{txt.freeMonths}</option>
                    <option value="free_trial">{txt.freeTrial}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">{txt.value}</label>
                  <input
                    type="number"
                    value={newCoupon.value}
                    onChange={(e) => setNewCoupon({ ...newCoupon, value: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">{txt.description}</label>
                <input
                  type="text"
                  value={newCoupon.description}
                  onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white text-sm focus:border-amber-500 focus:outline-none"
                  placeholder={locale === "en" ? "Coupon description..." : "Descripción del cupón..."}
                />
              </div>

              {/* Max Uses */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">{txt.maxUses}</label>
                <input
                  type="number"
                  value={newCoupon.maxUses}
                  onChange={(e) => setNewCoupon({ ...newCoupon, maxUses: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Validity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">{txt.validFrom}</label>
                  <input
                    type="date"
                    value={newCoupon.validFrom}
                    onChange={(e) => setNewCoupon({ ...newCoupon, validFrom: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">{txt.validUntil}</label>
                  <input
                    type="date"
                    value={newCoupon.validUntil}
                    onChange={(e) => setNewCoupon({ ...newCoupon, validUntil: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Gamification Trigger */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {txt.gamificationTrigger}
                  <Sparkles className="w-3 h-3 inline ml-1 text-violet-400" />
                </label>
                <select
                  value={newCoupon.gamificationTrigger}
                  onChange={(e) => setNewCoupon({ ...newCoupon, gamificationTrigger: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white text-sm focus:border-amber-500 focus:outline-none"
                >
                  <option value="">{txt.none}</option>
                  {GAMIFICATION_TRIGGERS.map((trigger) => (
                    <option key={trigger.value} value={trigger.value}>
                      {trigger.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {locale === "en"
                    ? "Link this coupon to a gamification achievement. Users will receive it automatically when they reach the goal."
                    : "Vincula este cupón a un logro de gamificación. Los usuarios lo recibirán automáticamente al alcanzar la meta."}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 text-white text-sm"
              >
                {txt.cancel}
              </button>
              <button
                onClick={handleCreateCoupon}
                disabled={!newCoupon.code || !newCoupon.description}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm"
              >
                {txt.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
