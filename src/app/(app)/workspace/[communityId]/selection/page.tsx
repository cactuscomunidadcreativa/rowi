"use client";

import { useState, useEffect, use, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Target,
  Loader2,
  Sparkles,
  UserPlus,
  Globe,
  MapPin,
  Flag,
  Brain,
  Users2,
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { AddCandidateModal } from "./AddCandidateModal";

const COMPETENCIES = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];

type Member = {
  id: string;
  type: "community_member" | "rowi_user";
  name: string;
  email: string | null;
  country: string | null;
  brainStyle: string | null;
  role: string | null;
  source?: string | null;
  snapshot: {
    overall4: number | null;
    K: number | null;
    C: number | null;
    G: number | null;
    brainStyle: string | null;
  } & Record<string, number | null> | null;
};

type Workspace = {
  id: string;
  name: string;
  workspaceType: string | null;
  _count: { members: number; communityMembers: number };
};

type Positioning = {
  region: string;
  global: { percentile: number; sampleSize: number } | null;
  regional: { percentile: number; sampleSize: number } | null;
  country: { percentile: number; sampleSize: number } | null;
  competencies: Record<string, { value: number; percentile: number; sampleSize: number } | null>;
};

type TeamFit = {
  candidate: { id: string; name: string; brainStyle: string | null; overall4: number | null };
  team: {
    id: string;
    name: string;
    memberCount: number;
    snapshotCount: number;
    dominantStyle: string | null;
    styleDistribution: { style: string; count: number; pct: number }[];
    avg: Record<string, number | null>;
  };
  analysis: {
    styleMatch: boolean | null;
    styleVerdict: "complements" | "reinforces" | "unknown";
    deltas: Record<string, { candidate: number | null; team: number | null; delta: number | null }>;
    components: { style: number; gap: number; overall: number };
    fit: number;
  };
  message?: string;
};

export default function WorkspaceSelectionPage({
  params,
}: {
  params: Promise<{ communityId: string }>;
}) {
  const { communityId } = use(params);
  const { t } = useI18n();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [targetProfile, setTargetProfile] = useState<Record<string, number>>({
    EL: 110, RP: 110, ACT: 115, NE: 110, IM: 115, OP: 110, EMP: 105, NG: 115,
  });
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [positioning, setPositioning] = useState<Positioning | null>(null);
  const [posLoading, setPosLoading] = useState(false);
  const [teamFit, setTeamFit] = useState<TeamFit | null>(null);
  const [tfLoading, setTfLoading] = useState(false);
  const [tfTeamId, setTfTeamId] = useState<string>("");

  async function loadMembers() {
    const res = await fetch(`/api/workspaces/${communityId}/members`);
    const data = await res.json();
    setMembers(data.members?.filter((m: Member) => m.snapshot) || []);
  }

  useEffect(() => {
    loadMembers().catch(() => setMembers([]));
    fetch("/api/workspaces")
      .then((r) => r.json())
      .then((d) =>
        setWorkspaces(
          (d.workspaces || []).filter((w: Workspace) => w.id !== communityId),
        ),
      )
      .catch(() => setWorkspaces([]));
  }, [communityId]);

  async function loadPositioning(memberId: string) {
    setPosLoading(true);
    setPositioning(null);
    try {
      const res = await fetch(
        `/api/workspaces/${communityId}/candidates/${memberId}/positioning`,
      );
      const data = await res.json();
      if (data.ok) setPositioning(data.positioning);
    } finally {
      setPosLoading(false);
    }
  }

  async function loadTeamFit(memberId: string, teamId: string) {
    if (!teamId) {
      setTeamFit(null);
      return;
    }
    setTfLoading(true);
    setTeamFit(null);
    try {
      const res = await fetch(
        `/api/workspaces/${communityId}/candidates/${memberId}/team-fit?teamId=${teamId}`,
      );
      const data = await res.json();
      if (data.ok) setTeamFit(data);
    } finally {
      setTfLoading(false);
    }
  }

  function selectCandidate(id: string) {
    setSelectedId(id);
    loadPositioning(id);
    setTeamFit(null);
    setTfTeamId("");
  }

  // Compute fit score for each member vs target
  const scored = useMemo(() => {
    return (members || []).map((m) => {
      const comps = m.snapshot as Record<string, number | null> | null;
      let totalDelta = 0;
      let count = 0;
      for (const k of COMPETENCIES) {
        const target = targetProfile[k];
        const actual = comps?.[k];
        if (actual != null && target != null) {
          const delta = actual - target;
          const penalty = delta < 0 ? Math.abs(delta) * 2 : Math.abs(delta) * 0.5;
          totalDelta += penalty;
          count++;
        }
      }
      const avgPenalty = count > 0 ? totalDelta / count : 999;
      const fit = Math.max(0, Math.min(100, 100 - avgPenalty));
      return { ...m, fit: Math.round(fit) };
    });
  }, [members, targetProfile]);

  const ranked = useMemo(() => [...scored].sort((a, b) => b.fit - a.fit), [scored]);
  const selectedCandidate = members?.find((m) => m.id === selectedId);

  if (!members) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--rowi-g2)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 px-4 max-w-7xl mx-auto space-y-6">
      <Link
        href={`/workspace/${communityId}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[var(--rowi-g2)]"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("workspace.landing.overview")}
      </Link>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Target className="w-7 h-7 text-[var(--rowi-g2)]" />
            {t("workspace.modules.selection")}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t(
              "workspace.selection.subtitle",
              "Rank candidates against an ideal profile",
            )}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
        >
          <UserPlus className="w-5 h-5" />
          {t("selection.candidate.addCta", "Add candidate")}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Target Profile */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--rowi-g2)]" />
            {t("workspace.selection.idealProfile", "Ideal Profile")}
          </h3>
          <div className="space-y-3">
            {COMPETENCIES.map((c) => (
              <div key={c}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{c}</span>
                  <span className="text-gray-500">{targetProfile[c]}</span>
                </div>
                <input
                  type="range"
                  min={65}
                  max={135}
                  value={targetProfile[c]}
                  onChange={(e) =>
                    setTargetProfile((p) => ({ ...p, [c]: Number(e.target.value) }))
                  }
                  className="w-full accent-[var(--rowi-g2)]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Ranking */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5">
          <h3 className="font-semibold text-sm mb-3">
            {t("workspace.selection.ranking", "Candidate Ranking")} ({ranked.length})
          </h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {ranked.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 mb-3">
                  {t(
                    "selection.candidate.empty",
                    "No candidates yet. Add your first candidate to see their fit.",
                  )}
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white text-sm font-semibold rounded-lg"
                >
                  <UserPlus className="w-4 h-4" />
                  {t("selection.candidate.addCta", "Add candidate")}
                </button>
              </div>
            ) : (
              ranked.map((m, i) => {
                const fitColor =
                  m.fit >= 80 ? "#10b981" : m.fit >= 60 ? "#f59e0b" : "#ef4444";
                const isActive = selectedId === m.id;
                return (
                  <motion.button
                    key={m.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.5) }}
                    onClick={() => selectCandidate(m.id)}
                    className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      isActive
                        ? "bg-[var(--rowi-g2)]/10 ring-2 ring-[var(--rowi-g2)]/40"
                        : "bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700"
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{
                        backgroundColor: `${fitColor}20`,
                        color: fitColor,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{m.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {m.snapshot?.overall4 != null
                          ? `EQ: ${Math.round(m.snapshot.overall4)}`
                          : "—"}
                        {m.brainStyle && ` • ${m.brainStyle}`}
                        {m.country && ` • ${m.country}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold" style={{ color: fitColor }}>
                        {m.fit}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {t("workspace.selection.fit", "fit")}
                      </div>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Detail panel: Positioning + Team Fit */}
      {selectedCandidate && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--rowi-g2)]" />
                {selectedCandidate.name}
              </h3>
              <p className="text-xs text-gray-500">
                {selectedCandidate.role || "—"} · {selectedCandidate.country || "—"}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedId(null);
                setPositioning(null);
                setTeamFit(null);
              }}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-zinc-800"
              aria-label={t("actions.close", "Close")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Positioning */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[var(--rowi-g2)]" />
                {t("selection.positioning.title", "Benchmark positioning")}
              </h4>
              {posLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("common.loading", "Loading...")}
                </div>
              )}
              {!posLoading && !positioning && (
                <p className="text-sm text-gray-500">
                  {t(
                    "selection.positioning.noData",
                    "No SEI snapshot available for this candidate.",
                  )}
                </p>
              )}
              {positioning && (
                <div className="space-y-3">
                  <PercentileBar
                    icon={Globe}
                    labelKey="selection.positioning.global"
                    fallback="Global"
                    data={positioning.global}
                  />
                  <PercentileBar
                    icon={MapPin}
                    labelKey={`selection.positioning.region.${positioning.region}`}
                    fallback={positioning.region}
                    data={positioning.regional}
                  />
                  <PercentileBar
                    icon={Flag}
                    labelKey="selection.positioning.country"
                    fallback={selectedCandidate.country || "Country"}
                    data={positioning.country}
                  />

                  <div className="pt-3 border-t border-gray-100 dark:border-zinc-800">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t(
                        "selection.positioning.competencies",
                        "Per-competency vs global",
                      )}
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {COMPETENCIES.map((c) => {
                        const comp = positioning.competencies[c];
                        if (!comp) {
                          return (
                            <div
                              key={c}
                              className="text-center py-1.5 rounded bg-gray-50 dark:bg-zinc-800"
                            >
                              <div className="text-[10px] font-medium text-gray-500">
                                {c}
                              </div>
                              <div className="text-xs text-gray-400">—</div>
                            </div>
                          );
                        }
                        const color =
                          comp.percentile >= 75
                            ? "text-emerald-600"
                            : comp.percentile >= 50
                              ? "text-amber-600"
                              : "text-red-600";
                        return (
                          <div
                            key={c}
                            className="text-center py-1.5 rounded bg-gray-50 dark:bg-zinc-800"
                            title={`${comp.value} · n=${comp.sampleSize}`}
                          >
                            <div className="text-[10px] font-medium text-gray-500">
                              {c}
                            </div>
                            <div className={`text-xs font-bold tabular-nums ${color}`}>
                              p{comp.percentile}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Team Fit */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Users2 className="w-4 h-4 text-[var(--rowi-g2)]" />
                {t("selection.teamFit.title", "Team fit (affinity)")}
              </h4>
              <p className="text-xs text-gray-500 mb-3">
                {t(
                  "selection.teamFit.help",
                  "Pick a team to see how this candidate would complement or reinforce its dynamics.",
                )}
              </p>
              <select
                value={tfTeamId}
                onChange={(e) => {
                  setTfTeamId(e.target.value);
                  if (selectedId) loadTeamFit(selectedId, e.target.value);
                }}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-[var(--rowi-g2)] mb-3"
              >
                <option value="">{t("selection.teamFit.selectTeam", "Select a team...")}</option>
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>

              {tfLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("common.loading", "Loading...")}
                </div>
              )}

              {!tfLoading && teamFit && (
                <div className="space-y-3">
                  {teamFit.message ? (
                    <p className="text-xs text-gray-500">{teamFit.message}</p>
                  ) : (
                    <>
                      <div className="bg-gradient-to-br from-[var(--rowi-g1)]/10 to-[var(--rowi-g2)]/10 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {t("selection.teamFit.score", "Fit score")}
                        </p>
                        <p
                          className="text-4xl font-bold"
                          style={{
                            color:
                              teamFit.analysis.fit >= 75
                                ? "#10b981"
                                : teamFit.analysis.fit >= 50
                                  ? "#f59e0b"
                                  : "#ef4444",
                          }}
                        >
                          {teamFit.analysis.fit}%
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">
                          {teamFit.team.memberCount} {t("workspace.list.members")} ·{" "}
                          {teamFit.team.snapshotCount} {t("selection.teamFit.withSEI", "with SEI")}
                        </p>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800">
                        <Brain className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                        <div className="text-xs flex-1 min-w-0">
                          <p className="font-medium text-gray-800 dark:text-gray-200">
                            {teamFit.analysis.styleVerdict === "complements"
                              ? t(
                                  "selection.teamFit.complements",
                                  "Brain style complements the team",
                                )
                              : teamFit.analysis.styleVerdict === "reinforces"
                                ? t(
                                    "selection.teamFit.reinforces",
                                    "Brain style reinforces the team",
                                  )
                                : t(
                                    "selection.teamFit.unknown",
                                    "Brain style unknown",
                                  )}
                          </p>
                          <p className="text-gray-500 mt-0.5">
                            {teamFit.candidate.brainStyle || "—"} →{" "}
                            {teamFit.team.dominantStyle || "—"}
                          </p>
                          {teamFit.team.styleDistribution.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {teamFit.team.styleDistribution.map((s) => (
                                <span
                                  key={s.style}
                                  className="px-1.5 py-0.5 rounded-full bg-white dark:bg-zinc-900 text-[10px] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-zinc-700"
                                >
                                  {s.style} ({s.pct}%)
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5">
                        {COMPETENCIES.map((c) => {
                          const d = teamFit.analysis.deltas[c];
                          if (!d || d.delta == null) {
                            return (
                              <div
                                key={c}
                                className="text-center py-1.5 rounded bg-gray-50 dark:bg-zinc-800"
                              >
                                <div className="text-[10px] font-medium text-gray-500">
                                  {c}
                                </div>
                                <div className="text-xs text-gray-400">—</div>
                              </div>
                            );
                          }
                          const positive = d.delta > 0;
                          const color = positive
                            ? "text-emerald-600"
                            : d.delta < 0
                              ? "text-red-600"
                              : "text-gray-500";
                          return (
                            <div
                              key={c}
                              className="text-center py-1.5 rounded bg-gray-50 dark:bg-zinc-800"
                              title={`${t("selection.teamFit.candidate", "Candidate")}: ${d.candidate} · ${t("selection.teamFit.team", "Team")}: ${d.team}`}
                            >
                              <div className="text-[10px] font-medium text-gray-500">
                                {c}
                              </div>
                              <div className={`text-xs font-bold tabular-nums ${color}`}>
                                {positive ? "+" : ""}
                                {d.delta}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {members && members.length >= 2 && (
        <HiringDeliverables members={members} communityId={communityId} t={t} />
      )}

      <AddCandidateModal
        open={showModal}
        communityId={communityId}
        onClose={() => setShowModal(false)}
        onCreated={(memberId) => {
          setShowModal(false);
          loadMembers().then(() => selectCandidate(memberId));
        }}
      />
    </div>
  );
}

/** Panel de descarga de los entregables de Hiring (Reporte Full / Perfil /
 * Guía del presentador) a partir de un líder elegido + el resto como candidatos. */
function HiringDeliverables({
  members,
  communityId,
  t,
}: {
  members: Member[];
  communityId: string;
  t: (k: string, fb?: string) => string;
}) {
  const eligible = members.filter((m) => m.type === "community_member" && m.snapshot);
  const [leaderId, setLeaderId] = useState<string>(eligible[0]?.id ?? "");
  const [dlLang, setDlLang] = useState<"es" | "en" | "pt">("es");
  const [busy, setBusy] = useState<string | null>(null);

  if (eligible.length < 2) return null;

  async function download(tipo: string) {
    if (busy) return;
    const candidateMemberIds = eligible.filter((m) => m.id !== leaderId).map((m) => m.id);
    if (!leaderId || candidateMemberIds.length === 0) return;
    setBusy(tipo);
    try {
      const res = await fetch(`/api/workspaces/${communityId}/hiring/deliverable/${tipo}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaderMemberId: leaderId, candidateMemberIds, lang: dlLang }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") || "";
      const fname = cd.match(/filename="([^"]+)"/)?.[1] || `${tipo}-${dlLang}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] p-5 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-[var(--rowi-fg)]">
          {t("selection.deliverables.title", "Entregables del proceso")}
        </h3>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--rowi-muted)]">
            {t("selection.deliverables.leader", "Líder")}
          </label>
          <select
            value={leaderId}
            onChange={(e) => setLeaderId(e.target.value)}
            className="rounded-md border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] px-2 py-1 text-sm text-[var(--rowi-fg)] max-w-[180px]"
          >
            {eligible.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <select
            value={dlLang}
            onChange={(e) => setDlLang(e.target.value as "es" | "en" | "pt")}
            className="rounded-md border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] px-2 py-1 text-sm text-[var(--rowi-fg)]"
          >
            <option value="es">ES</option>
            <option value="en">EN</option>
            <option value="pt">PT</option>
            <option value="zh">中文</option>
          </select>
        </div>
      </div>
      <p className="text-xs text-[var(--rowi-muted)]">
        {t("selection.deliverables.hint", "Lente de relación y desarrollo, no un veredicto. La IE no decide a quién contratar.")}
      </p>
      <div className="flex flex-wrap gap-2">
        {[
          { tipo: "reporte-full", label: t("selection.deliverables.reporteFull", "Reporte Full (PDF)") },
          { tipo: "perfil-candidato", label: t("selection.deliverables.perfilCandidato", "Perfil por candidato (PDF)") },
          { tipo: "guia-presentador", label: t("selection.deliverables.guiaPresentador", "Guía del presentador (PDF)") },
        ].map((d) => (
          <button
            key={d.tipo}
            onClick={() => download(d.tipo)}
            disabled={busy !== null}
            className="text-sm rounded-lg border border-[var(--rowi-card-border)] px-3 py-1.5 text-[var(--rowi-fg)] disabled:opacity-50"
          >
            {busy === d.tipo ? t("selection.deliverables.generating", "Generando…") : `⬇ ${d.label}`}
          </button>
        ))}
      </div>
    </div>
  );
}

function PercentileBar({
  icon: Icon,
  labelKey,
  fallback,
  data,
}: {
  icon: typeof Globe;
  labelKey: string;
  fallback: string;
  data: { percentile: number; sampleSize: number } | null;
}) {
  const { t } = useI18n();
  if (!data) {
    return (
      <div className="text-xs text-gray-500">
        <div className="flex items-center gap-1.5 mb-1">
          <Icon className="w-3.5 h-3.5" />
          {t(labelKey, fallback)} —{" "}
          {t("selection.positioning.notAvailable", "no data")}
        </div>
      </div>
    );
  }
  const color =
    data.percentile >= 75
      ? "from-emerald-500 to-green-600"
      : data.percentile >= 50
        ? "from-amber-500 to-orange-600"
        : "from-red-500 to-rose-600";
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
          <Icon className="w-3.5 h-3.5" />
          {t(labelKey, fallback)}
        </span>
        <span className="text-gray-500 tabular-nums">
          p{data.percentile} · n={data.sampleSize.toLocaleString()}
        </span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${data.percentile}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`h-full bg-gradient-to-r ${color}`}
        />
      </div>
    </div>
  );
}
