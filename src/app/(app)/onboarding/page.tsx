"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Briefcase,
  Users,
  Brain,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Compass,
  Heart,
  Target,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

type Lang = "es" | "en" | "pt" | "it";

type Step = {
  key: string;
  icon: typeof Sparkles;
  gradient: string;
  href?: string;
};

const STEPS: Step[] = [
  { key: "welcome", icon: Sparkles, gradient: "from-violet-500 to-fuchsia-500" },
  { key: "workspace", icon: Briefcase, gradient: "from-indigo-500 to-purple-600", href: "/workspace/new" },
  { key: "invite", icon: Users, gradient: "from-blue-500 to-cyan-600" },
  { key: "explore", icon: Brain, gradient: "from-emerald-500 to-green-600" },
];

const ROLE_PATHS = [
  { key: "coach", labelKey: "onboarding.role.coach", icon: Target, href: "/workspace/new?template=coaching" },
  { key: "hr", labelKey: "onboarding.role.hr", icon: Briefcase, href: "/hr" },
  { key: "consultant", labelKey: "onboarding.role.consultant", icon: Compass, href: "/workspace/new?template=consulting" },
  { key: "individual", labelKey: "onboarding.role.individual", icon: Heart, href: "/dashboard" },
];

export default function OnboardingPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const L = lang as Lang;
  const [step, setStep] = useState(0);
  const [hasWorkspace, setHasWorkspace] = useState<boolean | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  useEffect(() => {
    async function checkState() {
      try {
        const res = await fetch("/api/workspaces");
        const data = await res.json();
        setHasWorkspace((data.workspaces?.length || 0) > 0);
      } catch {
        setHasWorkspace(false);
      }
    }
    checkState();
  }, []);

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const StepIcon = STEPS[step].icon;
  const current = STEPS[step];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={`h-1.5 rounded-full transition-all ${
                i === step
                  ? "w-12 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)]"
                  : i < step
                    ? "w-8 bg-[var(--rowi-g2)]"
                    : "w-8 bg-gray-200 dark:bg-zinc-800"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-8 md:p-12 text-center"
          >
            <div
              className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${current.gradient} flex items-center justify-center mx-auto mb-6 shadow-lg`}
            >
              <StepIcon className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {t(`onboarding.${current.key}.title`)}
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
              {t(`onboarding.${current.key}.description`)}
            </p>

            {/* Step 0: Welcome — role selection */}
            {step === 0 && (
              <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto mb-2">
                {ROLE_PATHS.map((r) => {
                  const RoleIcon = r.icon;
                  const isSelected = selectedRole === r.key;
                  return (
                    <button
                      key={r.key}
                      onClick={() => setSelectedRole(r.key)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                        isSelected
                          ? "border-[var(--rowi-g2)] bg-[var(--rowi-g2)]/5"
                          : "border-gray-200 dark:border-zinc-800 hover:border-[var(--rowi-g2)]/40"
                      }`}
                    >
                      <RoleIcon
                        className={`w-7 h-7 ${
                          isSelected
                            ? "text-[var(--rowi-g2)]"
                            : "text-gray-500"
                        }`}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                        {t(r.labelKey)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 1: Create workspace */}
            {step === 1 && (
              <div className="space-y-3 max-w-md mx-auto">
                {hasWorkspace === null && (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-[var(--rowi-g2)]" />
                )}
                {hasWorkspace === false && (
                  <Link
                    href={selectedRole ? ROLE_PATHS.find((r) => r.key === selectedRole)?.href || "/workspace/new" : "/workspace/new"}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
                  >
                    {t("onboarding.workspace.cta")}
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                )}
                {hasWorkspace === true && (
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl text-sm font-medium">
                      <Check className="w-4 h-4" />
                      {t("onboarding.workspace.alreadyDone")}
                    </div>
                    <Link
                      href="/workspace"
                      className="block text-sm text-[var(--rowi-g2)] hover:underline"
                    >
                      {t("onboarding.workspace.viewMine")}
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Invite members */}
            {step === 2 && (
              <div className="max-w-md mx-auto space-y-3">
                <Link
                  href="/workspace"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
                >
                  {t("onboarding.invite.cta")}
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  {t("onboarding.invite.tip")}
                </p>
              </div>
            )}

            {/* Step 3: Explore */}
            {step === 3 && (
              <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto">
                <Link
                  href="/dashboard"
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 hover:border-[var(--rowi-g2)] transition-colors"
                >
                  <Brain className="w-6 h-6 text-violet-500" />
                  <span className="text-sm font-medium">{t("onboarding.explore.dashboard")}</span>
                </Link>
                <Link
                  href="/rowi"
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 hover:border-[var(--rowi-g2)] transition-colors"
                >
                  <Sparkles className="w-6 h-6 text-emerald-500" />
                  <span className="text-sm font-medium">{t("onboarding.explore.coach")}</span>
                </Link>
                <Link
                  href="/eco"
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 hover:border-[var(--rowi-g2)] transition-colors"
                >
                  <Heart className="w-6 h-6 text-rose-500" />
                  <span className="text-sm font-medium">{t("onboarding.explore.eco")}</span>
                </Link>
                <Link
                  href="/community"
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 hover:border-[var(--rowi-g2)] transition-colors"
                >
                  <Users className="w-6 h-6 text-blue-500" />
                  <span className="text-sm font-medium">{t("onboarding.explore.community")}</span>
                </Link>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={back}
            disabled={step === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("onboarding.back")}
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-gray-500 hover:text-[var(--rowi-g2)] transition-colors"
          >
            {t("onboarding.skip")}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={next}
              disabled={step === 0 && !selectedRole}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {t("onboarding.next")}
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              <Check className="w-4 h-4" />
              {t("onboarding.finish")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
