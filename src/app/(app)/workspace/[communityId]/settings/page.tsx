"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Settings, Save, Loader2, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  const { communityId } = use(params);
  const { t } = useI18n();
  const router = useRouter();
  const [workspace, setWorkspace] = useState<any>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [projectStatus, setProjectStatus] = useState("active");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/workspaces/${communityId}`)
      .then((r) => r.json())
      .then((d) => {
        setWorkspace(d.workspace);
        setName(d.workspace.name);
        setDescription(d.workspace.description || "");
        setTargetRole(d.workspace.targetRole || "");
        setProjectStatus(d.workspace.projectStatus || "active");
      });
  }, [communityId]);

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/workspaces/${communityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          targetRole: targetRole.trim() || null,
          projectStatus,
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  async function archive() {
    if (!confirm(t("workspace.settings.confirmArchive", "Archive this workspace?"))) return;
    await fetch(`/api/workspaces/${communityId}`, { method: "DELETE" });
    router.push("/workspace");
  }

  if (!workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--rowi-g2)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 px-4 max-w-3xl mx-auto space-y-6">
      <Link
        href={`/workspace/${communityId}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[var(--rowi-g2)]"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("workspace.landing.overview")}
      </Link>

      <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
        <Settings className="w-7 h-7 text-gray-500" />
        {t("workspace.modules.settings")}
      </h1>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">{t("workspace.new.nameLabel")}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">{t("workspace.new.descriptionLabel")}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">{t("workspace.new.targetRoleLabel")}</label>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            {t("workspace.settings.status", "Status")}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {["active", "paused", "completed", "archived"].map((s) => (
              <button
                key={s}
                onClick={() => setProjectStatus(s)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  projectStatus === s
                    ? "border-[var(--rowi-g2)] bg-[var(--rowi-g2)]/10 text-[var(--rowi-g2)]"
                    : "border-gray-200 dark:border-zinc-700 text-gray-600 hover:border-gray-300"
                }`}
              >
                {t(`workspace.list.projectStatus.${s}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t("workspace.settings.save", "Save changes")}
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-2xl p-5">
        <h3 className="font-semibold text-red-900 dark:text-red-300 mb-2">
          {t("workspace.settings.dangerZone", "Danger Zone")}
        </h3>
        <p className="text-sm text-red-700 dark:text-red-400 mb-3">
          {t("workspace.settings.archiveDesc", "Archive this workspace. It will be hidden but data is preserved.")}
        </p>
        <button
          onClick={archive}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
        >
          <Trash2 className="w-4 h-4" />
          {t("workspace.settings.archive", "Archive workspace")}
        </button>
      </div>
    </div>
  );
}
