"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Globe, Plus, Loader2, Copy, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function ClientPortalPage({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  const { communityId } = use(params);
  const { t } = useI18n();
  const [accesses, setAccesses] = useState<any[] | null>(null);
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [days, setDays] = useState(90);
  const [lastUrl, setLastUrl] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch(`/api/workspaces/${communityId}/client-access`);
    const data = await res.json();
    setAccesses(data.accesses || []);
  }

  useEffect(() => {
    load();
  }, [communityId]);

  async function create() {
    if (!email.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${communityId}/client-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientEmail: email.trim(),
          clientName: name.trim(),
          expiresInDays: days,
        }),
      });
      const data = await res.json();
      setLastUrl(data.portalUrl || "");
      setShow(false);
      setEmail("");
      setName("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function revoke(accessId: string) {
    if (!confirm(t("workspace.client.confirmRevoke", "Revoke this access?"))) return;
    await fetch(`/api/workspaces/${communityId}/client-access?accessId=${accessId}`, {
      method: "DELETE",
    });
    await load();
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
            <Globe className="w-7 h-7 text-slate-500" />
            {t("workspace.modules.clientPortal")}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t("workspace.client.subtitle", "Readonly portal for clients to view aggregate data")}
          </p>
        </div>
        <button
          onClick={() => setShow(!show)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          {t("workspace.client.newAccess", "New access")}
        </button>
      </div>

      {lastUrl && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-xl p-4">
          <p className="text-sm font-medium text-green-900 mb-1">
            ✅ {t("workspace.client.created", "Access created!")}
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs truncate bg-white dark:bg-zinc-900 px-2 py-1.5 rounded">
              {lastUrl}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(lastUrl)}
              className="p-2 bg-white dark:bg-zinc-900 rounded"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 space-y-3"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("workspace.client.emailPlaceholder", "client@company.com")}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("workspace.client.namePlaceholder", "Client name (optional)")}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
          />
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              {t("workspace.client.expiryDays", "Expires in (days)")}
            </label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShow(false)}
              className="px-4 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              onClick={create}
              disabled={!email.trim() || saving}
              className="px-4 py-2 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("workspace.client.generate", "Generate link")}
            </button>
          </div>
        </motion.div>
      )}

      {accesses === null ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-g2)]" />
        </div>
      ) : accesses.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-12 text-center">
          <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t("workspace.client.empty", "No client accesses created")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {accesses.map((a) => (
            <div
              key={a.id}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 flex items-center justify-between gap-3"
            >
              <div>
                <p className="font-medium text-sm">{a.clientName || a.clientEmail}</p>
                <p className="text-xs text-gray-500">
                  {a.clientEmail} •{" "}
                  {a.expiresAt
                    ? `${t("workspace.client.expires", "Expires")}: ${new Date(a.expiresAt).toLocaleDateString()}`
                    : t("workspace.client.noExpiry", "No expiry")}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {a.accessCount} {t("workspace.client.visits", "visits")}
                </p>
              </div>
              <button
                onClick={() => revoke(a.id)}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
