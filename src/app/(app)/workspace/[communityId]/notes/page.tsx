"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Plus, Loader2, Trash2, Lock } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function WorkspaceNotesPage({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  const { communityId } = use(params);
  const { t } = useI18n();
  const [notes, setNotes] = useState<any[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("session");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch(`/api/workspaces/${communityId}/notes`);
    const data = await res.json();
    setNotes(data.notes || []);
  }

  useEffect(() => {
    load();
  }, [communityId]);

  async function save() {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/workspaces/${communityId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content, category }),
      });
      setTitle("");
      setContent("");
      setCreating(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(noteId: string) {
    if (!confirm(t("workspace.notes.confirmDelete", "Delete this note?"))) return;
    await fetch(`/api/workspaces/${communityId}/notes?noteId=${noteId}`, { method: "DELETE" });
    await load();
  }

  const CATEGORIES = [
    { value: "session", label: t("workspace.notes.cat.session", "Session") },
    { value: "observation", label: t("workspace.notes.cat.observation", "Observation") },
    { value: "goal", label: t("workspace.notes.cat.goal", "Goal") },
    { value: "concern", label: t("workspace.notes.cat.concern", "Concern") },
  ];

  return (
    <div className="min-h-screen py-6 px-4 max-w-4xl mx-auto space-y-6">
      <Link
        href={`/workspace/${communityId}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[var(--rowi-g2)]"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("workspace.landing.overview")}
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <FileText className="w-7 h-7 text-yellow-500" />
            {t("workspace.modules.notes")}
          </h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            {t("workspace.notes.private", "Private journal - only visible to you")}
          </p>
        </div>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white rounded-xl text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            {t("workspace.notes.new", "New note")}
          </button>
        )}
      </div>

      {creating && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 space-y-3"
        >
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("workspace.notes.titlePlaceholder", "Title (optional)")}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("workspace.notes.contentPlaceholder", "Write your note...")}
            rows={6}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none"
            autoFocus
          />
          <div className="flex items-center justify-between">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setCreating(false);
                  setTitle("");
                  setContent("");
                }}
                className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                onClick={save}
                disabled={!content.trim() || saving}
                className="px-4 py-2 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("workspace.notes.save", "Save")}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {notes === null ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-g2)]" />
        </div>
      ) : notes.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t("workspace.notes.empty", "No notes yet. Create your first one.")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  {n.title && <h3 className="font-semibold">{n.title}</h3>}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    {n.category && (
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 rounded-full">
                        {t(`workspace.notes.cat.${n.category}`, n.category)}
                      </span>
                    )}
                    <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => remove(n.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {n.content}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
