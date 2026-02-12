"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  Target,
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  Plus,
  Send,
  Loader2,
  UserPlus,
  TrendingUp,
} from "lucide-react";

/* =========================================================
   🎯 Detalle de Noble Goal

   Info del goal, timeline de updates, participantes, unirse
========================================================= */

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const [goal, setGoal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updateContent, setUpdateContent] = useState("");
  const [updateProgress, setUpdateProgress] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [joining, setJoining] = useState(false);

  const goalId = params.id as string;

  useEffect(() => {
    fetchGoal();
  }, [goalId]);

  const fetchGoal = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/social/goals/${goalId}`);
      const data = await res.json();
      if (data.ok) setGoal(data.goal);
    } catch (err) {
      console.error("Error fetching goal:", err);
    } finally {
      setLoading(false);
    }
  };

  const joinGoal = async () => {
    setJoining(true);
    try {
      const res = await fetch(`/api/social/goals/${goalId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.ok) fetchGoal();
    } catch (err) {
      console.error("Error joining:", err);
    } finally {
      setJoining(false);
    }
  };

  const submitUpdate = async () => {
    if (!updateContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/social/goals/${goalId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: updateContent.trim(),
          progress: updateProgress !== "" ? Number(updateProgress) : undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setUpdateContent("");
        setUpdateProgress("");
        fetchGoal();
      }
    } catch (err) {
      console.error("Error submitting update:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--rowi-g2)]" />
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">{t("social.goals.detail.back")}</p>
        <button
          onClick={() => router.push("/social/goals")}
          className="mt-4 text-sm text-[var(--rowi-g2)] hover:underline"
        >
          {t("social.goals.detail.back")}
        </button>
      </div>
    );
  }

  const isParticipant = goal.participants?.some((p: any) => p.userId === goal.authorId);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <button
        onClick={() => router.push("/social/goals")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("social.goals.detail.back")}
      </button>

      {/* Goal header */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {goal.title}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5">
                {goal.author.image ? (
                  <img src={goal.author.image} alt="" className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-zinc-700 text-xs flex items-center justify-center font-bold">
                    {goal.author.name?.charAt(0)}
                  </div>
                )}
                <span className="text-sm text-gray-500">{goal.author.name}</span>
              </div>
              {goal.targetDate && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {t("social.goals.targetDate")}: {new Date(goal.targetDate).toLocaleDateString("es")}
                </span>
              )}
            </div>
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium ${
              goal.status === "active"
                ? "bg-green-50 dark:bg-green-900/20 text-green-600"
                : goal.status === "completed"
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-500"
            }`}
          >
            {goal.status === "active" ? t("social.goals.status.active") : goal.status === "completed" ? t("social.goals.status.completed") : t("social.goals.status.paused")}
          </span>
        </div>

        {goal.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 whitespace-pre-wrap">
            {goal.description}
          </p>
        )}

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-500">{t("social.goals.progress")}</span>
            <span className="font-semibold text-[var(--rowi-g2)]">{goal.progress}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${goal.progress}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>

        {/* Join button */}
        <button
          onClick={joinGoal}
          disabled={joining}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {joining ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          {t("social.goals.join")}
        </button>
      </div>

      {/* Participants */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-[var(--rowi-g2)]" />
          {t("social.goals.detail.participants")} ({goal._count.participants})
        </h2>
        <div className="space-y-3">
          {goal.participants.map((p: any) => (
            <div key={p.id} className="flex items-center gap-3">
              {p.user.image ? (
                <img src={p.user.image} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-bold">
                  {p.user.name?.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{p.user.name}</span>
                <span className="text-xs text-gray-400 ml-2 capitalize">{p.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Updates timeline */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[var(--rowi-g2)]" />
          {t("social.goals.detail.updates")} ({goal._count.updates})
        </h2>

        {/* New update form */}
        <div className="mb-6 p-3 rounded-lg bg-gray-50 dark:bg-zinc-800">
          <textarea
            value={updateContent}
            onChange={(e) => setUpdateContent(e.target.value)}
            placeholder={t("social.goals.detail.updatePlaceholder")}
            rows={2}
            className="w-full bg-transparent text-sm resize-none focus:outline-none"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">{t("social.goals.detail.progressLabel")}:</label>
              <input
                type="number"
                min="0"
                max="100"
                value={updateProgress}
                onChange={(e) => setUpdateProgress(e.target.value ? Number(e.target.value) : "")}
                placeholder="0-100"
                className="w-16 px-2 py-1 text-xs rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              />
              <span className="text-xs text-gray-400">%</span>
            </div>
            <button
              onClick={submitUpdate}
              disabled={!updateContent.trim() || submitting}
              className="px-3 py-1.5 rounded-lg bg-[var(--rowi-g2)] text-white text-xs font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
            >
              {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              {t("social.goals.detail.publishUpdate")}
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {goal.updates.map((update: any) => (
            <div key={update.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-[var(--rowi-g2)]/10 flex items-center justify-center flex-shrink-0">
                  {update.author.image ? (
                    <img src={update.author.image} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <span className="text-xs font-bold text-[var(--rowi-g2)]">
                      {update.author.name?.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="w-px flex-1 bg-gray-200 dark:bg-zinc-800 mt-1" />
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {update.author.name}
                  </span>
                  {update.progress !== null && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--rowi-g2)]/10 text-[var(--rowi-g2)]">
                      {update.progress}%
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(update.createdAt).toLocaleDateString("es", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {update.content}
                </p>
              </div>
            </div>
          ))}

          {goal.updates.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              {t("social.goals.detail.noUpdates")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
