"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  FolderInput,
  Building2,
  Network,
  Layers3,
  Building,
  Users,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminButton,
  AdminSelect,
} from "@/components/admin/AdminPage";

/* =========================================================
   📁 Rowi Admin — CSV Import for Communities/Members
   ---------------------------------------------------------
   Clean, compact, and 100% translatable
========================================================= */

export default function ImportCommunitiesPage() {
  const { t, ready } = useI18n();
  const [mode, setMode] = useState<"communities" | "members">("communities");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [communityId, setCommunityId] = useState("");
  const [communities, setCommunities] = useState<any[]>([]);

  const [tenants, setTenants] = useState<any[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);
  const [superHubs, setSuperHubs] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);

  const [tenantId, setTenantId] = useState("");
  const [hubId, setHubId] = useState("");
  const [superHubId, setSuperHubId] = useState("");
  const [organizationId, setOrganizationId] = useState("");

  useEffect(() => {
    if (!ready) return;
    async function load() {
      try {
        const [ten, hub, sh, org] = await Promise.all([
          fetch("/api/hub/tenants").then((r) => r.json()),
          fetch("/api/hub/hubs").then((r) => r.json()),
          fetch("/api/hub/superhubs").then((r) => r.json()),
          fetch("/api/hub/organizations").then((r) => r.json()),
        ]);

        setTenants(ten.tenants || []);
        setHubs(hub.hubs || []);
        setSuperHubs(sh.superHubs || []);
        setOrganizations(org.organizations || []);
      } catch {
        toast.error(t("common.error"));
      }
    }
    load();
  }, [ready]);

  useEffect(() => {
    if (mode === "members") {
      fetch("/api/hub/communities")
        .then((r) => (r.ok ? r.json() : []))
        .then(setCommunities)
        .catch(() => setCommunities([]));
    }
  }, [mode]);

  async function handleUpload() {
    if (!file) {
      toast.error(t("admin.import.noFile"));
      return;
    }
    if (mode === "members" && !communityId) {
      toast.error(t("admin.import.selectCommunity"));
      return;
    }

    setLoading(true);
    setProgress(10);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);

      if (communityId) formData.append("communityId", communityId);
      if (tenantId) formData.append("tenantId", tenantId);
      if (hubId) formData.append("hubId", hubId);
      if (superHubId) formData.append("superHubId", superHubId);
      if (organizationId) formData.append("organizationId", organizationId);

      const interval = setInterval(() => {
        setProgress((p) => (p < 90 ? p + 10 : p));
      }, 300);

      const res = await fetch("/api/hub/communities/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      clearInterval(interval);

      if (!res.ok) throw new Error(data.error || t("common.error"));

      setProgress(100);
      setResult(data);
      toast.success(t("admin.import.success"));
    } catch (err: any) {
      toast.error(err.message || t("common.error"));
      setProgress(0);
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 2000);
    }
  }

  return (
    <AdminPage
      titleKey="admin.import.title"
      descriptionKey="admin.import.description"
      icon={FileSpreadsheet}
      loading={false}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <AdminCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                {t("admin.import.configTitle")}
              </h3>
              <p className="text-xs text-[var(--rowi-muted)]">
                {t("admin.import.configDescription")}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Mode */}
            <div>
              <label className="text-xs font-semibold text-[var(--rowi-foreground)] mb-1 block">
                {t("admin.import.mode")}
              </label>
              <AdminSelect
                value={mode}
                onChange={(v) => setMode(v as "communities" | "members")}
                options={[
                  { value: "communities", label: t("admin.import.modeCommunities") },
                  { value: "members", label: t("admin.import.modeMembers") },
                ]}
              />
            </div>

            {/* Community (if members mode) */}
            {mode === "members" && (
              <div>
                <label className="text-xs font-semibold text-[var(--rowi-foreground)] mb-1 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {t("admin.import.targetCommunity")}
                </label>
                <AdminSelect
                  value={communityId}
                  onChange={setCommunityId}
                  options={[
                    { value: "", label: t("admin.import.selectCommunity") },
                    ...communities.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
              </div>
            )}

            {/* Hierarchy */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--rowi-border)]">
              <div>
                <label className="text-xs font-semibold text-[var(--rowi-foreground)] mb-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  Tenant
                </label>
                <AdminSelect
                  value={tenantId}
                  onChange={setTenantId}
                  options={[
                    { value: "", label: t("admin.import.optional") },
                    ...tenants.map((t) => ({ value: t.id, label: t.name })),
                  ]}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--rowi-foreground)] mb-1 flex items-center gap-1">
                  <Network className="w-3 h-3" />
                  Hub
                </label>
                <AdminSelect
                  value={hubId}
                  onChange={setHubId}
                  options={[
                    { value: "", label: t("admin.import.optional") },
                    ...hubs.map((h) => ({ value: h.id, label: h.name })),
                  ]}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--rowi-foreground)] mb-1 flex items-center gap-1">
                  <Layers3 className="w-3 h-3" />
                  SuperHub
                </label>
                <AdminSelect
                  value={superHubId}
                  onChange={setSuperHubId}
                  options={[
                    { value: "", label: t("admin.import.optional") },
                    ...superHubs.map((s) => ({ value: s.id, label: s.name })),
                  ]}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--rowi-foreground)] mb-1 flex items-center gap-1">
                  <Building className="w-3 h-3" />
                  {t("admin.import.organization")}
                </label>
                <AdminSelect
                  value={organizationId}
                  onChange={setOrganizationId}
                  options={[
                    { value: "", label: t("admin.import.optional") },
                    ...organizations.map((o) => ({ value: o.id, label: o.name })),
                  ]}
                />
              </div>
            </div>

            {/* File Upload */}
            <div className="pt-4 border-t border-[var(--rowi-border)]">
              <label className="text-xs font-semibold text-[var(--rowi-foreground)] mb-2 block">
                {t("admin.import.csvFile")}
              </label>
              <div
                onClick={() => document.getElementById("fileUpload")?.click()}
                className="border-2 border-dashed border-[var(--rowi-border)] rounded-lg p-6 text-center cursor-pointer hover:border-[var(--rowi-primary)] hover:bg-[var(--rowi-primary)]/5 transition-colors"
              >
                <FolderInput className="w-8 h-8 mx-auto mb-2 text-[var(--rowi-muted)]" />
                <p className="text-sm text-[var(--rowi-foreground)]">
                  {file ? file.name : t("admin.import.selectFile")}
                </p>
                <p className="text-xs text-[var(--rowi-muted)] mt-1">
                  {t("admin.import.csvFormat")}
                </p>
              </div>
              <input
                id="fileUpload"
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {/* Progress */}
            {loading && (
              <div className="space-y-2">
                <div className="h-2 bg-[var(--rowi-border)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--rowi-primary)] to-[var(--rowi-secondary)] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-[var(--rowi-muted)] text-right">{progress}%</p>
              </div>
            )}

            {/* Submit */}
            <AdminButton
              onClick={handleUpload}
              loading={loading}
              icon={Upload}
              className="w-full"
            >
              {t("admin.import.upload")}
            </AdminButton>
          </div>
        </AdminCard>

        {/* Result */}
        {result && (
          <AdminCard>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                {t("admin.import.result")}
              </h3>
            </div>
            <pre className="bg-[var(--rowi-background)] p-4 rounded-lg text-xs overflow-auto max-h-60 border border-[var(--rowi-border)]">
              {JSON.stringify(result, null, 2)}
            </pre>
          </AdminCard>
        )}
      </div>
    </AdminPage>
  );
}
