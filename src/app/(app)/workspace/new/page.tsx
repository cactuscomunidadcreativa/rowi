"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Sparkles, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { WORKSPACE_TEMPLATES } from "@/lib/workspace/templates";

type Lang = "es" | "en" | "pt" | "it";

export default function NewWorkspacePage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const L = lang as Lang;

  const [step, setStep] = useState(1); // 1=template, 2=info, 3=config, 4=confirm
  const [templateKey, setTemplateKey] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedTemplate = WORKSPACE_TEMPLATES.find((t) => t.key === templateKey);

  async function handleCreate() {
    if (!templateKey || !name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey,
          name: name.trim(),
          description: description.trim() || undefined,
          targetRole: targetRole.trim() || undefined,
          projectStartDate: startDate || undefined,
          projectEndDate: endDate || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      router.push(`/workspace/${data.workspace.id}`);
    } catch (err: any) {
      setError(err.message || t("workspace.new.error"));
    } finally {
      setLoading(false);
    }
  }

  const canProceed = () => {
    if (step === 1) return !!templateKey;
    if (step === 2) return name.trim().length >= 3;
    if (step === 3) return true; // opcional
    return true;
  };

  return (
    <div className="min-h-screen py-8 px-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/workspace"
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-[var(--rowi-g2)]" />
          {t("workspace.new.title")}
        </h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-between mb-8 bg-white dark:bg-zinc-900 rounded-xl p-4 border border-gray-200 dark:border-zinc-800">
        {[1, 2, 3, 4].map((n, i) => (
          <div key={n} className="flex items-center flex-1 last:flex-initial">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                step >= n
                  ? "bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white"
                  : "bg-gray-200 dark:bg-zinc-800 text-gray-500"
              }`}
            >
              {step > n ? <Check className="w-4 h-4" /> : n}
            </div>
            <div className="ml-2 text-xs font-medium text-gray-600 dark:text-gray-400 hidden sm:block">
              {t(`workspace.new.step${n}`)}
            </div>
            {i < 3 && (
              <div
                className={`flex-1 h-0.5 mx-3 transition-colors ${
                  step > n ? "bg-[var(--rowi-g2)]" : "bg-gray-200 dark:bg-zinc-800"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-xl font-semibold mb-2">
              {t("workspace.templates.title")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {t("workspace.templates.subtitle")}
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {WORKSPACE_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.key}
                  onClick={() => setTemplateKey(tpl.key)}
                  className={`text-left bg-white dark:bg-zinc-900 rounded-2xl p-5 border-2 transition-all ${
                    templateKey === tpl.key
                      ? "border-[var(--rowi-g2)] shadow-lg"
                      : "border-gray-200 dark:border-zinc-800 hover:border-[var(--rowi-g2)]/50"
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-r ${tpl.gradient} flex items-center justify-center text-2xl`}
                    >
                      {tpl.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {tpl.name[L] ?? tpl.name.en}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {tpl.modules.length} {t("workspace.templates.modules")}
                      </p>
                    </div>
                    {templateKey === tpl.key && (
                      <div className="w-6 h-6 rounded-full bg-[var(--rowi-g2)] flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {tpl.description[L] ?? tpl.description.en}
                  </p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-200 dark:border-zinc-800"
          >
            <h2 className="text-xl font-semibold mb-6">
              {t("workspace.new.step2")}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("workspace.new.nameLabel")} *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("workspace.new.namePlaceholder")}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--rowi-g2)] focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("workspace.new.descriptionLabel")}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("workspace.new.descriptionPlaceholder")}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--rowi-g2)] focus:border-transparent resize-none"
                />
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-200 dark:border-zinc-800"
          >
            <h2 className="text-xl font-semibold mb-6">
              {t("workspace.new.step3")}
            </h2>
            <div className="space-y-4">
              {selectedTemplate?.type === "SELECTION" && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("workspace.new.targetRoleLabel")}
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder={t("workspace.new.targetRolePlaceholder")}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--rowi-g2)] focus:border-transparent"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("workspace.new.startDateLabel")}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--rowi-g2)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("workspace.new.endDateLabel")}
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--rowi-g2)] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 4 && selectedTemplate && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-200 dark:border-zinc-800"
          >
            <h2 className="text-xl font-semibold mb-6">
              {t("workspace.new.step4")}
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-r ${selectedTemplate.gradient} flex items-center justify-center text-2xl flex-shrink-0`}
                >
                  {selectedTemplate.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedTemplate.name[L] ?? selectedTemplate.name.en}
                  </p>
                  {description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {description}
                    </p>
                  )}
                  {targetRole && (
                    <p className="text-xs text-[var(--rowi-g2)] font-medium mt-2">
                      🎯 {targetRole}
                    </p>
                  )}
                </div>
              </div>
              {(selectedTemplate.tips[L] ?? selectedTemplate.tips.en).length > 0 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                    💡 Tips:
                  </p>
                  <ul className="space-y-1">
                    {(selectedTemplate.tips[L] ?? selectedTemplate.tips.en).map(
                      (tip, i) => (
                        <li
                          key={i}
                          className="text-sm text-blue-800 dark:text-blue-200"
                        >
                          • {tip}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="px-5 py-2.5 rounded-xl font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {t("workspace.new.back")}
        </button>
        {step < 4 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="px-5 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center gap-2"
          >
            {t("workspace.new.next")}
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("workspace.new.creating")}
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {t("workspace.new.create")}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
