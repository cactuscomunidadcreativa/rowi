"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Plus, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function WorkspaceCampaignsPage({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  const { communityId } = use(params);
  const { t } = useI18n();
  const [campaigns, setCampaigns] = useState<any[] | null>(null);
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch(`/api/workspaces/${communityId}/campaigns`);
    const data = await res.json();
    setCampaigns(data.campaigns || []);
  }

  useEffect(() => {
    load();
  }, [communityId]);

  async function save() {
    if (!name.trim() || !scheduledAt) return;
    setSaving(true);
    try {
      await fetch(`/api/workspaces/${communityId}/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), scheduledAt, assessmentType: "SEI" }),
      });
      setShow(false);
      setName("");
      setScheduledAt("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen py-6 px-4 max-w-4xl mx-auto space-y-6">
      <Link
        href={`/workspace/${communityId}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[var(--rowi-g2)]"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("workspace.landing.overview")}
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Calendar className="w-7 h-7 text-pink-500" />
            {t("workspace.modules.campaigns")}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t("workspace.campaigns.subtitle", "Schedule re-assessments (SEI cycles, mood pulse)")}
          </p>
        </div>
        <button
          onClick={() => setShow(!show)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          {t("workspace.campaigns.new", "New campaign")}
        </button>
      </div>

      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 space-y-3"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("workspace.campaigns.namePlaceholder", "E.g. SEI Q1 2026")}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
          />
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShow(false)}
              className="px-4 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              onClick={save}
              disabled={!name.trim() || !scheduledAt || saving}
              className="px-4 py-2 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("workspace.campaigns.schedule", "Schedule")}
            </button>
          </div>
        </motion.div>
      )}

      {campaigns === null ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-g2)]" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t("workspace.campaigns.empty", "No campaigns scheduled")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{c.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    📅 {new Date(c.scheduledAt).toLocaleString()} • {c.assessmentType}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  c.status === "scheduled" ? "bg-blue-100 text-blue-700" :
                  c.status === "active" ? "bg-green-100 text-green-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {c.status}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <span>{c.responseCount} / {c.sentCount} {t("workspace.campaigns.responses", "responses")}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
