"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Palette,
  RefreshCcw,
  Save,
  Sun,
  Moon,
  Type,
  Image,
  Sparkles,
  Eye,
  RotateCcw,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminButton,
  AdminInput,
  AdminSelect,
} from "@/components/admin/AdminPage";
import { defaultTokens } from "@/lib/theme/tokens";

/* =========================================================
   🎨 Rowi Admin — Branding & Theme Editor
   ---------------------------------------------------------
   Customize colors, fonts and branding for the tenant/hub
========================================================= */

interface BrandingForm {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
  fontHeading: string;
  fontBody: string;
  logoUrl: string;
  logoLightUrl: string;
  faviconUrl: string;
  colorK: string;
  colorC: string;
  colorG: string;
}

const DEFAULT_FORM: BrandingForm = {
  primaryColor: "#31a2e3",
  secondaryColor: "#f378a5",
  accentColor: "#8b5cf6",
  backgroundColor: "#ffffff",
  textColor: "#1f2937",
  successColor: "#10b981",
  warningColor: "#f59e0b",
  errorColor: "#ef4444",
  fontHeading: "Inter",
  fontBody: "Inter",
  logoUrl: "",
  logoLightUrl: "",
  faviconUrl: "",
  // SEI Pursuit Colors (Six Seconds EQ Model)
  colorK: "#1E88E5", // Know Yourself / Focus - Azul
  colorC: "#E53935", // Choose Yourself / Decisions - Rojo
  colorG: "#43A047", // Give Yourself / Drive - Verde
};

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "Poppins", label: "Poppins" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Lato", label: "Lato" },
  { value: "Nunito", label: "Nunito" },
  { value: "system-ui", label: "System UI" },
];

export default function BrandingPage() {
  const { t, ready } = useI18n();
  const [form, setForm] = useState<BrandingForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("light");

  async function loadTenants() {
    try {
      const res = await fetch("/api/hub/tenants");
      const data = await res.json();
      setTenants(data.tenants || []);
      if (data.tenants?.length > 0 && !tenantId) {
        setTenantId(data.tenants[0].id);
      }
    } catch {
      toast.error(t("common.error"));
    }
  }

  async function loadBranding() {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/theme/branding?tenantId=${tenantId}`);
      const data = await res.json();

      if (data.ok && data.branding) {
        const b = data.branding;
        setForm({
          primaryColor: b.colors?.primary || DEFAULT_FORM.primaryColor,
          secondaryColor: b.colors?.secondary || DEFAULT_FORM.secondaryColor,
          accentColor: b.colors?.accent || DEFAULT_FORM.accentColor,
          backgroundColor: b.colors?.background || DEFAULT_FORM.backgroundColor,
          textColor: b.colors?.foreground || DEFAULT_FORM.textColor,
          successColor: b.colors?.success || DEFAULT_FORM.successColor,
          warningColor: b.colors?.warning || DEFAULT_FORM.warningColor,
          errorColor: b.colors?.error || DEFAULT_FORM.errorColor,
          fontHeading: b.fonts?.heading || DEFAULT_FORM.fontHeading,
          fontBody: b.fonts?.body || DEFAULT_FORM.fontBody,
          logoUrl: data.logo || "",
          logoLightUrl: data.logoLight || "",
          faviconUrl: data.favicon || "",
          colorK: b.sei?.k || DEFAULT_FORM.colorK,
          colorC: b.sei?.c || DEFAULT_FORM.colorC,
          colorG: b.sei?.g || DEFAULT_FORM.colorG,
        });
      }
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) loadTenants();
  }, [ready]);

  useEffect(() => {
    if (tenantId) loadBranding();
  }, [tenantId]);

  async function saveBranding() {
    if (!tenantId) {
      toast.error(t("admin.branding.selectTenant"));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/theme/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          primaryColor: form.primaryColor,
          secondaryColor: form.secondaryColor,
          accentColor: form.accentColor,
          backgroundColor: form.backgroundColor,
          textColor: form.textColor,
          fontHeading: form.fontHeading,
          fontBody: form.fontBody,
          logoUrl: form.logoUrl,
          logoLightUrl: form.logoLightUrl,
          faviconUrl: form.faviconUrl,
          colorK: form.colorK,
          colorC: form.colorC,
          colorG: form.colorG,
          isActive: true,
          cssVariables: {
            colors: {
              primary: form.primaryColor,
              secondary: form.secondaryColor,
              accent: form.accentColor,
              background: form.backgroundColor,
              foreground: form.textColor,
              success: form.successColor,
              warning: form.warningColor,
              error: form.errorColor,
            },
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(t("admin.branding.saved"));

      // Aplicar colores inmediatamente
      applyPreview();
    } catch (err: any) {
      toast.error(err.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  function applyPreview() {
    const root = document.documentElement;
    root.style.setProperty("--rowi-primary", form.primaryColor);
    root.style.setProperty("--rowi-secondary", form.secondaryColor);
    root.style.setProperty("--rowi-accent", form.accentColor);
    root.style.setProperty("--rowi-background", form.backgroundColor);
    root.style.setProperty("--rowi-foreground", form.textColor);
    root.style.setProperty("--rowi-success", form.successColor);
    root.style.setProperty("--rowi-warning", form.warningColor);
    root.style.setProperty("--rowi-error", form.errorColor);
  }

  function resetToDefault() {
    setForm(DEFAULT_FORM);
    toast.info(t("admin.branding.reset"));
  }

  return (
    <AdminPage
      titleKey="admin.branding.title"
      descriptionKey="admin.branding.description"
      icon={Palette}
      loading={loading}
      actions={
        <div className="flex items-center gap-2">
          <AdminSelect
            value={tenantId || ""}
            onChange={setTenantId}
            options={tenants.map((t) => ({ value: t.id, label: t.name }))}
          />
          <AdminButton variant="secondary" icon={RotateCcw} onClick={resetToDefault} size="sm">
            {t("admin.branding.reset")}
          </AdminButton>
          <AdminButton variant="secondary" icon={Eye} onClick={applyPreview} size="sm">
            {t("admin.branding.preview")}
          </AdminButton>
          <AdminButton icon={Save} onClick={saveBranding} loading={saving} size="sm">
            {t("admin.common.save")}
          </AdminButton>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Colors */}
        <AdminCard>
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-[var(--rowi-primary)]" />
            <h3 className="font-semibold text-[var(--rowi-foreground)]">{t("admin.branding.mainColors")}</h3>
          </div>
          <div className="space-y-4">
            <ColorPicker
              label={t("admin.branding.primary")}
              value={form.primaryColor}
              onChange={(v) => setForm({ ...form, primaryColor: v })}
            />
            <ColorPicker
              label={t("admin.branding.secondary")}
              value={form.secondaryColor}
              onChange={(v) => setForm({ ...form, secondaryColor: v })}
            />
            <ColorPicker
              label={t("admin.branding.accent")}
              value={form.accentColor}
              onChange={(v) => setForm({ ...form, accentColor: v })}
            />
          </div>
        </AdminCard>

        {/* UI Colors */}
        <AdminCard>
          <div className="flex items-center gap-2 mb-4">
            <Sun className="w-5 h-5 text-[var(--rowi-warning)]" />
            <h3 className="font-semibold text-[var(--rowi-foreground)]">{t("admin.branding.uiColors")}</h3>
          </div>
          <div className="space-y-4">
            <ColorPicker
              label={t("admin.branding.background")}
              value={form.backgroundColor}
              onChange={(v) => setForm({ ...form, backgroundColor: v })}
            />
            <ColorPicker
              label={t("admin.branding.text")}
              value={form.textColor}
              onChange={(v) => setForm({ ...form, textColor: v })}
            />
          </div>
        </AdminCard>

        {/* Status Colors */}
        <AdminCard>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[var(--rowi-success)]" />
            <h3 className="font-semibold text-[var(--rowi-foreground)]">{t("admin.branding.statusColors")}</h3>
          </div>
          <div className="space-y-4">
            <ColorPicker
              label={t("admin.branding.success")}
              value={form.successColor}
              onChange={(v) => setForm({ ...form, successColor: v })}
            />
            <ColorPicker
              label={t("admin.branding.warning")}
              value={form.warningColor}
              onChange={(v) => setForm({ ...form, warningColor: v })}
            />
            <ColorPicker
              label={t("admin.branding.error")}
              value={form.errorColor}
              onChange={(v) => setForm({ ...form, errorColor: v })}
            />
          </div>
        </AdminCard>

        {/* SEI Colors - Six Seconds EQ Model */}
        <AdminCard>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-full" style={{ background: form.colorK }} />
              <div className="w-3 h-3 rounded-full" style={{ background: form.colorC }} />
              <div className="w-3 h-3 rounded-full" style={{ background: form.colorG }} />
            </div>
            <h3 className="font-semibold text-[var(--rowi-foreground)]">{t("admin.branding.seiColors")}</h3>
          </div>
          <p className="text-xs text-[var(--rowi-muted)] mb-4">Six Seconds EQ Model - Pursuit Clusters</p>
          <div className="space-y-4">
            <ColorPicker
              label="K - Know Yourself (Focus)"
              value={form.colorK}
              onChange={(v) => setForm({ ...form, colorK: v })}
            />
            <ColorPicker
              label="C - Choose Yourself (Decisions)"
              value={form.colorC}
              onChange={(v) => setForm({ ...form, colorC: v })}
            />
            <ColorPicker
              label="G - Give Yourself (Drive)"
              value={form.colorG}
              onChange={(v) => setForm({ ...form, colorG: v })}
            />
          </div>
        </AdminCard>

        {/* Typography */}
        <AdminCard>
          <div className="flex items-center gap-2 mb-4">
            <Type className="w-5 h-5 text-[var(--rowi-primary)]" />
            <h3 className="font-semibold text-[var(--rowi-foreground)]">{t("admin.branding.typography")}</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.branding.headingFont")}</label>
              <AdminSelect
                value={form.fontHeading}
                onChange={(v) => setForm({ ...form, fontHeading: v })}
                options={FONT_OPTIONS}
              />
            </div>
            <div>
              <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.branding.bodyFont")}</label>
              <AdminSelect
                value={form.fontBody}
                onChange={(v) => setForm({ ...form, fontBody: v })}
                options={FONT_OPTIONS}
              />
            </div>
          </div>
        </AdminCard>

        {/* Logos */}
        <AdminCard>
          <div className="flex items-center gap-2 mb-4">
            <Image className="w-5 h-5 text-[var(--rowi-primary)]" />
            <h3 className="font-semibold text-[var(--rowi-foreground)]">{t("admin.branding.logos")}</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.branding.logoUrl")}</label>
              <AdminInput
                value={form.logoUrl}
                onChange={(v) => setForm({ ...form, logoUrl: v })}
                placeholderKey="admin.branding.logoUrlPlaceholder"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.branding.logoLight")}</label>
              <AdminInput
                value={form.logoLightUrl}
                onChange={(v) => setForm({ ...form, logoLightUrl: v })}
                placeholderKey="admin.branding.logoLightPlaceholder"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t("admin.branding.favicon")}</label>
              <AdminInput
                value={form.faviconUrl}
                onChange={(v) => setForm({ ...form, faviconUrl: v })}
                placeholderKey="admin.branding.faviconPlaceholder"
              />
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Preview */}
      <AdminCard className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[var(--rowi-foreground)]">{t("admin.branding.livePreview")}</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setPreviewMode("light")}
              className={`p-2 rounded ${previewMode === "light" ? "bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)]" : "text-[var(--rowi-muted)]"}`}
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewMode("dark")}
              className={`p-2 rounded ${previewMode === "dark" ? "bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)]" : "text-[var(--rowi-muted)]"}`}
            >
              <Moon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          className="rounded-xl p-6 border"
          style={{
            background: previewMode === "light" ? form.backgroundColor : "#1f2937",
            color: previewMode === "light" ? form.textColor : "#f9fafb",
            borderColor: previewMode === "light" ? "#e5e7eb" : "#374151",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ background: `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})` }}
            >
              R
            </div>
            <div>
              <h4 style={{ fontFamily: form.fontHeading, color: form.primaryColor }} className="font-bold">
                Rowi Admin
              </h4>
              <p className="text-xs opacity-60" style={{ fontFamily: form.fontBody }}>
                Branding Preview
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 rounded-full text-xs text-white" style={{ background: form.primaryColor }}>
              Primary
            </span>
            <span className="px-3 py-1 rounded-full text-xs text-white" style={{ background: form.secondaryColor }}>
              Secondary
            </span>
            <span className="px-3 py-1 rounded-full text-xs text-white" style={{ background: form.accentColor }}>
              Accent
            </span>
            <span className="px-3 py-1 rounded-full text-xs text-white" style={{ background: form.successColor }}>
              Success
            </span>
            <span className="px-3 py-1 rounded-full text-xs text-white" style={{ background: form.warningColor }}>
              Warning
            </span>
            <span className="px-3 py-1 rounded-full text-xs text-white" style={{ background: form.errorColor }}>
              Error
            </span>
          </div>

          {/* SEI Pursuit Colors */}
          <div className="flex gap-3 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full" style={{ background: form.colorK }} />
              <span className="text-xs font-medium">K (Focus)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full" style={{ background: form.colorC }} />
              <span className="text-xs font-medium">C (Decisions)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full" style={{ background: form.colorG }} />
              <span className="text-xs font-medium">G (Drive)</span>
            </div>
          </div>
        </div>
      </AdminCard>
    </AdminPage>
  );
}

/* =========================================================
   🎨 ColorPicker — Inline color picker
========================================================= */

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-10 rounded-lg border border-[var(--rowi-border)] cursor-pointer"
      />
      <div className="flex-1">
        <label className="text-xs text-[var(--rowi-muted)] block">{label}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-sm font-mono bg-transparent border-b border-[var(--rowi-border)] focus:border-[var(--rowi-primary)] outline-none py-1"
        />
      </div>
    </div>
  );
}
