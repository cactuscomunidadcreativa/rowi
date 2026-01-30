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
  PlusCircle,
  GitBranch,
  ChevronRight,
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  AdminPage,
  AdminCard,
  AdminButton,
  AdminSelect,
  AdminInput,
  AdminTextarea,
} from "@/components/admin/AdminPage";

/* =========================================================
   📁 Rowi Admin — CSV Import for Communities/Members
   ---------------------------------------------------------
   Clean, compact, and 100% translatable
========================================================= */

// Tipos de equipo Six Seconds
const TEAM_TYPE_OPTIONS = [
  { value: "", label: "—", color: "gray" },
  { value: "biz", label: "Biz", color: "blue" },
  { value: "impact", label: "Impact", color: "green" },
  { value: "coaching", label: "Coaching", color: "purple" },
  { value: "education", label: "Education", color: "orange" },
  { value: "research", label: "Research", color: "cyan" },
  { value: "ops", label: "Ops", color: "pink" },
  { value: "tech", label: "Tech", color: "indigo" },
  { value: "marketing", label: "Marketing", color: "amber" },
];

interface OrgNode {
  id: string;
  name: string;
  slug: string;
  unitType: string;
  level: number;
  parentId: string | null;
}

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
  const [teamType, setTeamType] = useState("");

  // Modal de crear comunidad
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: "",
    slug: "",
    description: "",
    visibility: "public",
    category: "",
    teamType: "",
    bannerUrl: "",
    hubId: "",
    tenantId: "",
    superHubId: "",
    organizationId: "",
  });
  const [creatingCommunity, setCreatingCommunity] = useState(false);

  useEffect(() => {
    if (!ready) return;
    async function load() {
      try {
        const [ten, hub, sh, org] = await Promise.all([
          fetch("/api/hub/tenants").then((r) => r.json()),
          fetch("/api/hub/hubs").then((r) => r.json()),
          fetch("/api/hub/superhubs").then((r) => r.json()),
          fetch("/api/admin/organizations/hierarchy?flat=true").then((r) => r.json()),
        ]);

        setTenants(ten.tenants || []);
        setHubs(hub.hubs || []);
        setSuperHubs(sh.superHubs || []);
        setOrganizations(org.ok ? (org.organizations || []) : []);
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

  // Helper: get organization path
  function getOrgPath(orgId: string | undefined): string {
    if (!orgId) return "";
    const org = organizations.find((o: OrgNode) => o.id === orgId);
    if (!org) return "";

    const path: string[] = [org.name];
    let currentParentId = org.parentId;

    while (currentParentId) {
      const parent = organizations.find((o: OrgNode) => o.id === currentParentId);
      if (parent) {
        path.unshift(parent.name);
        currentParentId = parent.parentId;
      } else {
        break;
      }
    }

    return path.join(" → ");
  }

  // Crear comunidad
  async function handleCreateCommunity() {
    if (!newCommunity.name) {
      toast.error(t("admin.communities.requiredFields"));
      return;
    }

    setCreatingCommunity(true);
    try {
      const res = await fetch("/api/hub/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCommunity.name,
          slug: newCommunity.slug || newCommunity.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
          description: newCommunity.description,
          visibility: newCommunity.visibility || "public",
          category: newCommunity.category,
          teamType: newCommunity.teamType || null,
          bannerUrl: newCommunity.bannerUrl,
          hubId: newCommunity.hubId || null,
          tenantId: newCommunity.tenantId || null,
          superHubId: newCommunity.superHubId || null,
          organizationId: newCommunity.organizationId || null,
        }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      toast.success(t("admin.communities.created"));

      // Agregar la nueva comunidad a la lista y seleccionarla
      setCommunities((prev) => [data.community, ...prev]);
      setCommunityId(data.community.id);

      // Limpiar y cerrar modal
      setNewCommunity({
        name: "",
        slug: "",
        description: "",
        visibility: "public",
        category: "",
        teamType: "",
        bannerUrl: "",
        hubId: "",
        tenantId: "",
        superHubId: "",
        organizationId: "",
      });
      setShowCreateModal(false);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setCreatingCommunity(false);
    }
  }

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
      if (teamType) formData.append("teamType", teamType);

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
                <div className="flex gap-2">
                  <div className="flex-1">
                    <AdminSelect
                      value={communityId}
                      onChange={setCommunityId}
                      options={[
                        { value: "", label: t("admin.import.selectCommunity") },
                        ...communities.map((c: any) => ({
                          value: c.id,
                          label: c.teamType ? `${c.name} [${c.teamType.toUpperCase()}]` : c.name,
                        })),
                      ]}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="px-3 py-2 rounded-lg bg-gradient-to-r from-[var(--rowi-primary)] to-[var(--rowi-secondary)] text-white text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                  >
                    <PlusCircle className="w-4 h-4" />
                    {t("admin.communities.new")}
                  </button>
                </div>
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
                    ...organizations.map((o: OrgNode) => ({
                      value: o.id,
                      label: `${"│ ".repeat(o.level)}${o.level > 0 ? "└ " : ""}${o.name} (${o.unitType})`,
                    })),
                  ]}
                />
              </div>
            </div>

            {/* Team Type */}
            <div className="pt-4 border-t border-[var(--rowi-border)]">
              <label className="text-xs font-semibold text-[var(--rowi-foreground)] mb-2 flex items-center gap-1">
                <GitBranch className="w-3 h-3" />
                {t("admin.communities.teamType")}
              </label>
              <div className="flex flex-wrap gap-2">
                {TEAM_TYPE_OPTIONS.map((type) => {
                  const isActive = teamType === type.value;
                  const colorMap: Record<string, string> = {
                    blue: "bg-blue-500/10 text-blue-600 ring-blue-500",
                    green: "bg-green-500/10 text-green-600 ring-green-500",
                    purple: "bg-purple-500/10 text-purple-600 ring-purple-500",
                    orange: "bg-orange-500/10 text-orange-600 ring-orange-500",
                    cyan: "bg-cyan-500/10 text-cyan-600 ring-cyan-500",
                    pink: "bg-pink-500/10 text-pink-600 ring-pink-500",
                    indigo: "bg-indigo-500/10 text-indigo-600 ring-indigo-500",
                    amber: "bg-amber-500/10 text-amber-600 ring-amber-500",
                    gray: "bg-gray-500/10 text-gray-600 ring-gray-500",
                  };
                  const colors = colorMap[type.color] || colorMap.gray;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setTeamType(isActive ? "" : type.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? `${colors} ring-2 ring-offset-1`
                          : "bg-[var(--rowi-background)] text-[var(--rowi-muted)] hover:bg-[var(--rowi-border)]"
                      }`}
                    >
                      {type.label}
                    </button>
                  );
                })}
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

      {/* Modal de Crear Comunidad */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--rowi-card)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[var(--rowi-border)]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--rowi-border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
                  <PlusCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--rowi-foreground)]">
                    {t("admin.communities.new")}
                  </h3>
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {t("admin.communities.description")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg hover:bg-[var(--rowi-muted)]/10 transition-colors"
              >
                <X className="w-5 h-5 text-[var(--rowi-muted)]" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AdminInput
                  placeholderKey="admin.communities.name"
                  value={newCommunity.name}
                  onChange={(v) => setNewCommunity({
                    ...newCommunity,
                    name: v,
                    slug: newCommunity.slug || v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
                  })}
                />
                <AdminInput
                  placeholderKey="admin.communities.slug"
                  value={newCommunity.slug}
                  onChange={(v) => setNewCommunity({ ...newCommunity, slug: v })}
                />
              </div>

              <AdminTextarea
                placeholderKey="admin.communities.descriptionPlaceholder"
                value={newCommunity.description}
                onChange={(v) => setNewCommunity({ ...newCommunity, description: v })}
              />

              {/* Jerarquía Completa */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[var(--rowi-primary)]/5 to-[var(--rowi-secondary)]/5 border border-[var(--rowi-primary)]/10">
                <div className="flex items-center gap-2 mb-3">
                  <GitBranch className="w-4 h-4 text-[var(--rowi-primary)]" />
                  <p className="text-sm text-[var(--rowi-foreground)] font-semibold">
                    {t("admin.communities.fullHierarchy")}
                  </p>
                </div>

                {/* Plataforma */}
                <div className="mb-4">
                  <p className="text-[10px] uppercase tracking-wide text-[var(--rowi-muted)] mb-2 font-medium">
                    {t("admin.communities.platformHierarchy")}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-[var(--rowi-muted)] mb-1 block">SuperHub</label>
                      <AdminSelect
                        value={newCommunity.superHubId}
                        onChange={(v) => setNewCommunity({ ...newCommunity, superHubId: v })}
                        options={[
                          { value: "", label: "—" },
                          ...superHubs.map((s: any) => ({ value: s.id, label: s.name })),
                        ]}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--rowi-muted)] mb-1 block">Hub</label>
                      <AdminSelect
                        value={newCommunity.hubId}
                        onChange={(v) => setNewCommunity({ ...newCommunity, hubId: v })}
                        options={[
                          { value: "", label: "—" },
                          ...hubs.map((h: any) => ({ value: h.id, label: h.name })),
                        ]}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--rowi-muted)] mb-1 block">Tenant</label>
                      <AdminSelect
                        value={newCommunity.tenantId}
                        onChange={(v) => setNewCommunity({ ...newCommunity, tenantId: v })}
                        options={[
                          { value: "", label: "—" },
                          ...tenants.map((t: any) => ({ value: t.id, label: t.name })),
                        ]}
                      />
                    </div>
                  </div>
                </div>

                {/* Organización */}
                <div className="mb-4">
                  <p className="text-[10px] uppercase tracking-wide text-[var(--rowi-muted)] mb-2 font-medium">
                    {t("admin.communities.orgHierarchy")}
                  </p>
                  <AdminSelect
                    value={newCommunity.organizationId}
                    onChange={(v) => setNewCommunity({ ...newCommunity, organizationId: v })}
                    options={[
                      { value: "", label: t("admin.communities.selectOrganization") },
                      ...organizations.map((org: OrgNode) => ({
                        value: org.id,
                        label: `${"│ ".repeat(org.level)}${org.level > 0 ? "└ " : ""}${org.name} (${org.unitType})`,
                      })),
                    ]}
                  />
                </div>

                {/* Team Type */}
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--rowi-muted)] mb-2 font-medium">
                    {t("admin.communities.teamType")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TEAM_TYPE_OPTIONS.filter((t) => t.value).map((type) => {
                      const isActive = newCommunity.teamType === type.value;
                      const colorMap: Record<string, string> = {
                        blue: "bg-blue-500/10 text-blue-600 ring-blue-500",
                        green: "bg-green-500/10 text-green-600 ring-green-500",
                        purple: "bg-purple-500/10 text-purple-600 ring-purple-500",
                        orange: "bg-orange-500/10 text-orange-600 ring-orange-500",
                        cyan: "bg-cyan-500/10 text-cyan-600 ring-cyan-500",
                        pink: "bg-pink-500/10 text-pink-600 ring-pink-500",
                        indigo: "bg-indigo-500/10 text-indigo-600 ring-indigo-500",
                        amber: "bg-amber-500/10 text-amber-600 ring-amber-500",
                        gray: "bg-gray-500/10 text-gray-600 ring-gray-500",
                      };
                      const colors = colorMap[type.color] || colorMap.gray;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setNewCommunity({
                            ...newCommunity,
                            teamType: isActive ? "" : type.value,
                          })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? `${colors} ring-2 ring-offset-1`
                              : "bg-[var(--rowi-background)] text-[var(--rowi-muted)] hover:bg-[var(--rowi-border)]"
                          }`}
                        >
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preview del path completo */}
                {(newCommunity.superHubId || newCommunity.hubId || newCommunity.tenantId || newCommunity.organizationId) && (
                  <div className="mt-4 p-3 rounded-lg bg-[var(--rowi-background)] border border-[var(--rowi-border)]">
                    <p className="text-[10px] uppercase tracking-wide text-[var(--rowi-muted)] mb-2">
                      {t("admin.communities.fullPath")}
                    </p>
                    <div className="flex flex-wrap items-center gap-1 text-xs">
                      {newCommunity.superHubId && (
                        <>
                          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 font-medium">
                            {superHubs.find((s: any) => s.id === newCommunity.superHubId)?.name}
                          </span>
                          <ChevronRight className="w-3 h-3 text-[var(--rowi-muted)]" />
                        </>
                      )}
                      {newCommunity.hubId && (
                        <>
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 font-medium">
                            {hubs.find((h: any) => h.id === newCommunity.hubId)?.name}
                          </span>
                          <ChevronRight className="w-3 h-3 text-[var(--rowi-muted)]" />
                        </>
                      )}
                      {newCommunity.tenantId && (
                        <>
                          <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-600 font-medium">
                            {tenants.find((t: any) => t.id === newCommunity.tenantId)?.name}
                          </span>
                          {newCommunity.organizationId && <ChevronRight className="w-3 h-3 text-[var(--rowi-muted)]" />}
                        </>
                      )}
                      {newCommunity.organizationId && (
                        <>
                          <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-600 font-medium">
                            {getOrgPath(newCommunity.organizationId)}
                          </span>
                          {newCommunity.teamType && <ChevronRight className="w-3 h-3 text-[var(--rowi-muted)]" />}
                        </>
                      )}
                      {newCommunity.teamType && (
                        <span className={`px-2 py-0.5 rounded font-medium uppercase text-[10px] ${
                          TEAM_TYPE_OPTIONS.find((t) => t.value === newCommunity.teamType)?.color === "blue" ? "bg-blue-500/10 text-blue-600" :
                          TEAM_TYPE_OPTIONS.find((t) => t.value === newCommunity.teamType)?.color === "green" ? "bg-green-500/10 text-green-600" :
                          TEAM_TYPE_OPTIONS.find((t) => t.value === newCommunity.teamType)?.color === "purple" ? "bg-purple-500/10 text-purple-600" :
                          TEAM_TYPE_OPTIONS.find((t) => t.value === newCommunity.teamType)?.color === "orange" ? "bg-orange-500/10 text-orange-600" :
                          TEAM_TYPE_OPTIONS.find((t) => t.value === newCommunity.teamType)?.color === "cyan" ? "bg-cyan-500/10 text-cyan-600" :
                          TEAM_TYPE_OPTIONS.find((t) => t.value === newCommunity.teamType)?.color === "pink" ? "bg-pink-500/10 text-pink-600" :
                          TEAM_TYPE_OPTIONS.find((t) => t.value === newCommunity.teamType)?.color === "indigo" ? "bg-indigo-500/10 text-indigo-600" :
                          TEAM_TYPE_OPTIONS.find((t) => t.value === newCommunity.teamType)?.color === "amber" ? "bg-amber-500/10 text-amber-600" :
                          "bg-gray-500/10 text-gray-600"
                        }`}>
                          {TEAM_TYPE_OPTIONS.find((t) => t.value === newCommunity.teamType)?.label}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-4 border-t border-[var(--rowi-border)]">
              <AdminButton variant="secondary" onClick={() => setShowCreateModal(false)}>
                {t("admin.common.cancel")}
              </AdminButton>
              <AdminButton onClick={handleCreateCommunity} loading={creatingCommunity}>
                {t("admin.common.create")}
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </AdminPage>
  );
}
