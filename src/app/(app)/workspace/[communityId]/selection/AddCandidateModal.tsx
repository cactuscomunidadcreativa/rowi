"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, UserPlus, X, Sparkles, History } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/I18nProvider";

interface AddCandidateModalProps {
  open: boolean;
  communityId: string;
  onClose: () => void;
  onCreated: (memberId: string) => void;
}

type SEIKey = "K" | "C" | "G" | "EL" | "RP" | "ACT" | "NE" | "IM" | "OP" | "EMP" | "NG" | "overall4";

const SEI_FIELDS: { key: SEIKey; labelKey: string; fallback: string }[] = [
  { key: "overall4", labelKey: "selection.candidate.sei.overall4", fallback: "Overall EQ" },
  { key: "K", labelKey: "selection.candidate.sei.K", fallback: "Know Yourself" },
  { key: "C", labelKey: "selection.candidate.sei.C", fallback: "Choose Yourself" },
  { key: "G", labelKey: "selection.candidate.sei.G", fallback: "Give Yourself" },
  { key: "EL", labelKey: "selection.candidate.sei.EL", fallback: "Emotional Literacy" },
  { key: "RP", labelKey: "selection.candidate.sei.RP", fallback: "Recognize Patterns" },
  { key: "ACT", labelKey: "selection.candidate.sei.ACT", fallback: "Consequential Thinking" },
  { key: "NE", labelKey: "selection.candidate.sei.NE", fallback: "Navigate Emotions" },
  { key: "IM", labelKey: "selection.candidate.sei.IM", fallback: "Intrinsic Motivation" },
  { key: "OP", labelKey: "selection.candidate.sei.OP", fallback: "Optimism" },
  { key: "EMP", labelKey: "selection.candidate.sei.EMP", fallback: "Empathy" },
  { key: "NG", labelKey: "selection.candidate.sei.NG", fallback: "Noble Goals" },
];

export function AddCandidateModal({
  open,
  communityId,
  onClose,
  onCreated,
}: AddCandidateModalProps) {
  const { t } = useI18n();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [brainStyle, setBrainStyle] = useState("");
  const [sei, setSei] = useState<Record<SEIKey, string>>({
    K: "",
    C: "",
    G: "",
    EL: "",
    RP: "",
    ACT: "",
    NE: "",
    IM: "",
    OP: "",
    EMP: "",
    NG: "",
    overall4: "",
  });
  const [saving, setSaving] = useState(false);
  const [lookup, setLookup] = useState<{
    found: boolean;
    user: { id: string; name: string | null; email: string | null; sameTenant: boolean } | null;
    members: Array<{
      id: string;
      name: string;
      country: string | null;
      brainStyle: string | null;
      role: string | null;
      community: { id: string; name: string; workspaceType: string | null } | null;
      createdAt: string;
    }>;
    latestSnapshot: Record<string, number | string | null> | null;
    affinitySnapshotsCount: number;
  } | null>(null);
  const [looking, setLooking] = useState(false);
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce the email-based people lookup so we don't hammer the API on
  // every keystroke.
  useEffect(() => {
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    const e = email.trim().toLowerCase();
    if (!e.includes("@")) {
      setLookup(null);
      setLooking(false);
      return;
    }
    setLooking(true);
    lookupTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/people/lookup?email=${encodeURIComponent(e)}`,
        );
        const data = await res.json();
        setLookup(data.ok ? data : null);
      } catch {
        setLookup(null);
      } finally {
        setLooking(false);
      }
    }, 400);
    return () => {
      if (lookupTimer.current) clearTimeout(lookupTimer.current);
    };
  }, [email]);

  function applyLookup() {
    if (!lookup) return;
    // Fill identity from user or latest community member
    const firstMember = lookup.members[0];
    if (lookup.user?.name && !firstName && !lastName) {
      const parts = lookup.user.name.split(" ");
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" "));
    }
    if (firstMember) {
      if (!country && firstMember.country) setCountry(firstMember.country);
      if (!brainStyle && firstMember.brainStyle)
        setBrainStyle(firstMember.brainStyle);
      if (!jobRole && firstMember.role) setJobRole(firstMember.role);
    }
    // Fill SEI from latest snapshot
    if (lookup.latestSnapshot) {
      const snap = lookup.latestSnapshot;
      const next: Record<SEIKey, string> = { ...sei };
      for (const k of Object.keys(next) as SEIKey[]) {
        const v = snap[k];
        if (v != null && v !== "") next[k] = String(v);
      }
      setSei(next);
      if (!brainStyle && typeof snap.brainStyle === "string") {
        setBrainStyle(snap.brainStyle);
      }
    }
    toast.success(
      t("selection.candidate.lookup.applied", "History applied to the form"),
    );
  }

  function reset() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setCountry("");
    setJobRole("");
    setBrainStyle("");
    setSei({
      K: "", C: "", G: "", EL: "", RP: "", ACT: "", NE: "",
      IM: "", OP: "", EMP: "", NG: "", overall4: "",
    });
  }

  async function submit() {
    if (!firstName.trim() && !email.trim()) {
      toast.error(
        t(
          "selection.candidate.error.nameOrEmail",
          "Please provide at least a first name or email.",
        ),
      );
      return;
    }
    setSaving(true);
    try {
      const seiPayload: Record<string, number> = {};
      for (const f of SEI_FIELDS) {
        const v = sei[f.key];
        if (v !== "") {
          const n = Number(v.replace(",", "."));
          if (Number.isFinite(n)) seiPayload[f.key] = n;
        }
      }
      const res = await fetch(`/api/workspaces/${communityId}/candidates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || undefined,
          country: country.trim() || undefined,
          jobRole: jobRole.trim() || undefined,
          brainStyle: brainStyle.trim() || undefined,
          sei: seiPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "duplicate") {
          toast.error(
            t(
              "selection.candidate.error.duplicate",
              "A candidate with this email already exists.",
            ),
          );
        } else {
          toast.error(data.message || data.error || t("common.error", "Error"));
        }
        return;
      }
      toast.success(
        t("selection.candidate.created", "Candidate added"),
      );
      reset();
      onCreated(data.member.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.error", "Error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 z-50"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    {t("selection.candidate.modal.title", "Add candidate")}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {t(
                      "selection.candidate.modal.subtitle",
                      "We will compute their positioning vs global, region and country.",
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={saving}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                aria-label={t("actions.close", "Close")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Identity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    {t("selection.candidate.firstName", "First name")} *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-[var(--rowi-g2)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    {t("selection.candidate.lastName", "Last name")}
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-[var(--rowi-g2)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 flex items-center gap-2">
                  {t("selection.candidate.email", "Email")}
                  {looking && (
                    <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                  )}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t(
                    "workspace.members.invite.emailPlaceholder",
                    "person@example.com",
                  )}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-[var(--rowi-g2)]"
                />
              </div>

              {/* History banner: surface existing records for this email */}
              {lookup?.found && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-300/40 dark:border-violet-700/40 rounded-xl p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                      <History className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-violet-900 dark:text-violet-200">
                        {t(
                          "selection.candidate.lookup.foundTitle",
                          "We found history for this person",
                        )}
                      </p>
                      <div className="text-xs text-violet-800 dark:text-violet-300 mt-1 space-y-0.5">
                        {lookup.user && (
                          <div>
                            ·{" "}
                            {t(
                              "selection.candidate.lookup.hasAccount",
                              "Has a Rowi account",
                            )}
                            {lookup.user.name && ` (${lookup.user.name})`}
                          </div>
                        )}
                        {lookup.members.length > 0 && (
                          <div>
                            ·{" "}
                            {lookup.members.length}{" "}
                            {t(
                              "selection.candidate.lookup.workspaceMatches",
                              "workspace match(es)",
                            )}
                            : {lookup.members.slice(0, 2).map((m) => m.community?.name).filter(Boolean).join(", ")}
                            {lookup.members.length > 2 && " …"}
                          </div>
                        )}
                        {lookup.latestSnapshot && (
                          <div>
                            ·{" "}
                            {t(
                              "selection.candidate.lookup.hasSEI",
                              "Has SEI snapshot",
                            )}{" "}
                            (Overall{" "}
                            {lookup.latestSnapshot.overall4 ?? "—"})
                          </div>
                        )}
                        {lookup.affinitySnapshotsCount > 0 && (
                          <div>
                            ·{" "}
                            {lookup.affinitySnapshotsCount}{" "}
                            {t(
                              "selection.candidate.lookup.affinitySnapshots",
                              "affinity snapshot(s)",
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={applyLookup}
                        className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:opacity-90 transition-opacity"
                      >
                        <Sparkles className="w-3 h-3" />
                        {t(
                          "selection.candidate.lookup.useExisting",
                          "Use existing data",
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    {t("selection.candidate.country", "Country")}
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder={t(
                      "selection.candidate.countryPlaceholder",
                      "Mexico, USA, Spain...",
                    )}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-[var(--rowi-g2)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    {t("selection.candidate.jobRole", "Target role")}
                  </label>
                  <input
                    type="text"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    placeholder={t(
                      "selection.candidate.jobRolePlaceholder",
                      "Sales Director",
                    )}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-[var(--rowi-g2)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    {t("selection.candidate.brainStyle", "Brain style")}
                  </label>
                  <input
                    type="text"
                    value={brainStyle}
                    onChange={(e) => setBrainStyle(e.target.value)}
                    placeholder={t(
                      "selection.candidate.brainStylePlaceholder",
                      "Empathic, Scientific...",
                    )}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-[var(--rowi-g2)]"
                  />
                </div>
              </div>

              {/* SEI scores */}
              <div className="pt-3 border-t border-gray-100 dark:border-zinc-800">
                <h3 className="text-sm font-semibold mb-2">
                  {t("selection.candidate.seiScores", "SEI scores")}
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  {t(
                    "selection.candidate.seiHint",
                    "Standardized scores 65–135 (mean=100). Leave empty if unknown.",
                  )}
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {SEI_FIELDS.map((f) => (
                    <div key={f.key}>
                      <label className="block text-[10px] font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        {f.key}
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={50}
                        max={150}
                        value={sei[f.key]}
                        onChange={(e) =>
                          setSei((s) => ({ ...s, [f.key]: e.target.value }))
                        }
                        placeholder="100"
                        className="w-full px-2 py-1.5 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-[var(--rowi-g2)] tabular-nums"
                        title={t(f.labelKey, f.fallback)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 px-6 py-4 flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                {t("actions.cancel", "Cancel")}
              </button>
              <button
                onClick={submit}
                disabled={saving || (!firstName.trim() && !email.trim())}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {t("selection.candidate.submit", "Add candidate")}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
