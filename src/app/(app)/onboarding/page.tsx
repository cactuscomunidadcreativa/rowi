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
  ShieldCheck,
  AlertCircle,
  GraduationCap,
  UserRound,
  Building2,
  TrendingUp,
  Award,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { CONSENTS, type ConsentKey, titleFor, bodyFor } from "@/lib/privacy/consents";
import MiniSeiWizard, {
  type MiniSeiQuestion,
  type MiniSeiPrefQuestion,
} from "@/components/mini-sei/MiniSeiWizard";

type Lang = "es" | "en" | "pt" | "it";

type Step = {
  key: string;
  icon: typeof Sparkles;
  gradient: string;
  href?: string;
};

const STEPS: Step[] = [
  { key: "welcome", icon: Sparkles, gradient: "from-violet-500 to-fuchsia-500" },
  { key: "consent", icon: ShieldCheck, gradient: "from-amber-500 to-orange-600" },
  // Cadena SIA: el mini-SEI normado es el ancla del onboarding.
  { key: "rowiTest", icon: Sparkles, gradient: "from-fuchsia-500 to-pink-600" },
  // Cierre: ofrecer el SEI completo (Six Seconds, de pago). Opcional —
  // "hazlo completo o sigue sin él". Handoff a /sei.
  { key: "fullSei", icon: Award, gradient: "from-violet-600 to-indigo-600" },
  // Manager auto-link — solo aplica si el user tiene primaryTenantId.
  // En B2C el step se auto-saltea (ver useEffect más abajo).
  { key: "manager", icon: Users, gradient: "from-sky-500 to-blue-600" },
  { key: "workspace", icon: Briefcase, gradient: "from-indigo-500 to-purple-600", href: "/workspace/new" },
  { key: "invite", icon: Users, gradient: "from-blue-500 to-cyan-600" },
  { key: "explore", icon: Brain, gradient: "from-emerald-500 to-green-600" },
];

// Roles a usuario puede declarar al onboarding. Multi-select — un humano
// suele tener varios sombreros (coach + mentor + consultor + persona).
// El primer rol marcado decide el template del primer workspace que se
// crea en el step siguiente; la selección COMPLETA se persiste en
// User.onboardingData.selectedRoles vía /api/account/onboarding-data, así
// sobrevive al cierre del tab y queda disponible para el resto del producto.
const ROLE_PATHS = [
  { key: "coach", labelKey: "onboarding.role.coach", icon: Target, href: "/workspace/new?template=coaching" },
  { key: "mentor", labelKey: "onboarding.role.mentor", icon: GraduationCap, href: "/workspace/new?template=mentoring" },
  { key: "consultant", labelKey: "onboarding.role.consultant", icon: Compass, href: "/workspace/new?template=consulting" },
  { key: "hr", labelKey: "onboarding.role.hr", icon: Briefcase, href: "/hr" },
  { key: "teamLeader", labelKey: "onboarding.role.teamLeader", icon: Users, href: "/workspace/new?template=team" },
  { key: "exec", labelKey: "onboarding.role.exec", icon: TrendingUp, href: "/hub/exec/health" },
  { key: "family", labelKey: "onboarding.role.family", icon: Building2, href: "/hub/family/vital-signs" },
  { key: "individual", labelKey: "onboarding.role.individual", icon: Heart, href: "/dashboard" },
];

export default function OnboardingPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const L = lang as Lang;
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [hasWorkspace, setHasWorkspace] = useState<boolean | null>(null);
  // Rowi Test step (cadena SIA) — el mini-SEI NORMADO (12 ítems short-form
  // SEI 5.0), no el Pre-SEI. Es el instrumento ancla del onboarding.
  const [rowiTestQuestions, setRowiTestQuestions] = useState<MiniSeiQuestion[]>([]);
  const [rowiTestPrefs, setRowiTestPrefs] = useState<MiniSeiPrefQuestion[]>([]);
  const [rowiTestSaving, setRowiTestSaving] = useState(false);
  const [rowiTestDone, setRowiTestDone] = useState(false);
  // El WOW: el resultado del mini-SEI se muestra al usuario (no se descarta)
  // junto con su plan inmediato en Rowi (D5 del plan de remediación).
  const [rowiTestResult, setRowiTestResult] = useState<{
    totalEqBand: string;
    competencyProfile: Record<string, number>;
  } | null>(null);
  const [rowiTestError, setRowiTestError] = useState(false);
  const [rowiTestLastAttempt, setRowiTestLastAttempt] = useState<{
    answers: Record<string, number>;
    preferences: Record<string, number>;
  } | null>(null);
  // Si el usuario ya tiene un snapshot (p.ej. el Pre-SEI reclamado en el
  // registro), el paso muestra ese resultado en vez de repetir el test.
  const [rowiTestChecked, setRowiTestChecked] = useState(false);
  const [rowiTestLoadError, setRowiTestLoadError] = useState(false);
  // Multi-select: un humano suele llevar varios sombreros (coach + mentor
  // + consultor + persona). El primer rol seleccionado define el template
  // del primer workspace en el step siguiente; la selección completa se
  // persiste en User.onboardingData.selectedRoles (ver persistRoles).
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Consent step state. Required consents start ON; user can toggle ON
  // but the checkbox onChange refuses to flip them back to OFF.
  const [consentMap, setConsentMap] = useState<Record<ConsentKey, boolean>>(() => {
    const seed = {} as Record<ConsentKey, boolean>;
    for (const c of CONSENTS) seed[c.key] = c.required ? true : c.defaultGranted;
    return seed;
  });
  const [consentInitial, setConsentInitial] = useState<Record<ConsentKey, boolean> | null>(null);
  const [consentsLoading, setConsentsLoading] = useState(false);
  const [consentsSaving, setConsentsSaving] = useState(false);

  // Manager step state — populated when the user lands on the step.
  // managerSkippable = no primaryTenant (B2C) → step se omite automáticamente.
  type ManagerSuggestion = {
    userId: string;
    name: string | null;
    email: string;
    image: string | null;
    employeeProfileId: string;
    position: string | null;
    department: string | null;
  };
  const [managerSkippable, setManagerSkippable] = useState<boolean | null>(null);
  const [managerQuery, setManagerQuery] = useState("");
  const [managerSuggestions, setManagerSuggestions] = useState<ManagerSuggestion[]>([]);
  const [managerSelected, setManagerSelected] = useState<ManagerSuggestion | null>(null);
  const [managerSaving, setManagerSaving] = useState(false);
  const [managerError, setManagerError] = useState<string | null>(null);
  const [managerSearching, setManagerSearching] = useState(false);
  const [consentsError, setConsentsError] = useState<string | null>(null);

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
    // Hidratar selectedRoles desde onboardingData: si el usuario ya declaró
    // sus sombreros en una sesión previa, no se los volvemos a pedir en blanco.
    (async () => {
      try {
        const res = await fetch("/api/account/onboarding-data");
        const json = await res.json();
        const saved = json?.data?.selectedRoles;
        if (Array.isArray(saved) && saved.length > 0) {
          setSelectedRoles(saved.filter((r): r is string => typeof r === "string"));
        }
      } catch {
        /* sin datos previos: el wizard arranca en blanco */
      }
    })();
  }, []);

  // Persistencia best-effort de la selección de roles. Se dispara al avanzar
  // del paso welcome; un fallo de red no debe frenar el wizard.
  function persistRoles(roles: string[]) {
    fetch("/api/account/onboarding-data", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedRoles: roles }),
    }).catch(() => {});
  }

  // Registra el avance del onboarding (paso y/o cierre). /api/onboarding
  // tolera llamadas parciales. Best-effort: no bloquea la navegación.
  // Devuelve la promesa para que el cierre del wizard pueda ESPERAR a que el
  // estado ACTIVE quede persistido antes de navegar (ver finishOnboarding).
  function persistOnboarding(payload: { step?: number; complete?: boolean }): Promise<void> {
    const body: Record<string, unknown> = {};
    if (payload.step !== undefined) body.step = payload.step;
    if (payload.complete) body.data = { completeWithoutSei: true };
    return fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(() => undefined)
      .catch(() => undefined);
  }

  // Cierre del onboarding: marca el estado ACTIVE (sale del estado REGISTERED
  // en el que nace la cuenta) y manda al usuario a su día. Único punto de
  // salida del wizard — lo usan tanto "Finalizar" como "Saltar".
  //
  // Hay que ESPERAR el PATCH antes de navegar: si navegamos sin await, la
  // navegación puede cortar el fetch y el usuario queda en REGISTERED pese a
  // haber terminado (se rompe la activación). El fallback navega igual.
  async function finishOnboarding() {
    setFinishing(true);
    try {
      await persistOnboarding({ step: STEPS.length - 1, complete: true });
    } finally {
      router.push("/today");
    }
  }

  // Al entrar al paso: si ya existe un mini-SEI (p.ej. reclamado del Pre-SEI
  // en el registro), mostrar ese WOW en vez de repetir el test. Si no,
  // cargar las preguntas + la capa de preferencias.
  useEffect(() => {
    if (STEPS[step]?.key !== "rowiTest" || rowiTestChecked) return;
    setRowiTestChecked(true);
    (async () => {
      try {
        // Cascada (bug Eduardo F7: "me volvió a salir el mismo cuestionario"):
        // 1) mini-SEI normado; 2) CUALQUIER lectura existente — incluido el
        // EqSnapshot(pre_sei) que materializa el espejo reclamado en el
        // registro. Si ya hay perfil, mostramos el WOW, no el wizard.
        const series = await fetch("/api/mini-sei/series?limit=60").then((r) => r.json());
        const latest = series?.ok && series.count > 0 ? series.series[series.series.length - 1] : null;
        if (latest?.competencyProfile) {
          setRowiTestResult({
            totalEqBand: latest.totalEqBand ?? "unknown",
            competencyProfile: latest.competencyProfile as Record<string, number>,
          });
          setRowiTestDone(true);
          return;
        }
        const contrast = await fetch("/api/becoming/contrast?days=30").then((r) => r.json());
        if (contrast?.ok && Array.isArray(contrast.current) && contrast.current.length > 0) {
          const profile: Record<string, number> = {};
          for (const row of contrast.current) {
            if (typeof row.now === "number") profile[row.sei] = row.now;
          }
          if (Object.keys(profile).length >= 4) {
            setRowiTestResult({ totalEqBand: "unknown", competencyProfile: profile });
            setRowiTestDone(true);
            return;
          }
        }
      } catch {
        /* sin snapshot: cae al wizard */
      }
      fetch(`/api/mini-sei/questions?lang=${lang}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.ok) setRowiTestQuestions(json.questions);
          else setRowiTestLoadError(true);
        })
        .catch(() => setRowiTestLoadError(true));
      fetch(`/api/mini-sei/preferences?lang=${lang}`)
        .then((r) => r.json())
        .then((json) => { if (json.ok) setRowiTestPrefs(json.questions); })
        .catch(() => {});
    })();
  }, [step, lang, rowiTestChecked]);

  // answers + preferences por posición opaca; source="onboarding" lo marca.
  async function submitRowiTest(
    answers: Record<string, number>,
    preferences: Record<string, number>,
  ) {
    setRowiTestSaving(true);
    setRowiTestError(false);
    setRowiTestLastAttempt({ answers, preferences });
    try {
      const res = await fetch("/api/mini-sei/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, preferences, source: "onboarding" }),
      });
      const json = await res.json().catch(() => null);
      // Éxito SOLO si el servidor lo confirma: antes un 500 mostraba
      // "¡Listo!" y el perfil quedaba vacío (el ancla de la cadena rota).
      if (!res.ok || !json?.ok) {
        setRowiTestError(true);
        return;
      }
      setRowiTestDone(true);
      if (json.competencyProfile) {
        // Mostrar el WOW (resultado + plan); el usuario continúa cuando quiera.
        setRowiTestResult({
          totalEqBand: json.totalEqBand ?? "unknown",
          competencyProfile: json.competencyProfile,
        });
      } else {
        // Sin resultado que mostrar: avanzar como antes.
        setTimeout(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 800);
      }
    } catch {
      setRowiTestError(true);
    } finally {
      setRowiTestSaving(false);
    }
  }

  useEffect(() => {
    if (STEPS[step]?.key !== "consent" || consentInitial !== null) return;
    setConsentsLoading(true);
    fetch("/api/account/consent")
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok === false) {
          setConsentsError(data.error ?? "load_failed");
          return;
        }
        // Two separate states:
        //  - uiState (consentMap): what we show in the UI. Required consents
        //    are forced to true so the product can run.
        //  - dbState (consentInitial): the *real* state from DB. Used to
        //    detect what needs to be POSTed. Crucial: if required is true in
        //    UI but missing/false in DB, that counts as a change and gets
        //    persisted on Next. Without this split the diff is empty and
        //    basic_processing is never written, causing the ConsentGate to
        //    redirect-loop after onboarding.
        const dbState = {} as Record<ConsentKey, boolean>;
        const uiState = {} as Record<ConsentKey, boolean>;
        for (const c of CONSENTS) {
          const found = (data.consents ?? []).find((x: { key: ConsentKey }) => x.key === c.key);
          dbState[c.key] = found?.granted === true;
          uiState[c.key] = c.required ? true : (found?.granted ?? c.defaultGranted);
        }
        setConsentMap(uiState);
        setConsentInitial(dbState);
      })
      .catch((e) => setConsentsError(e instanceof Error ? e.message : "load_failed"))
      .finally(() => setConsentsLoading(false));
  }, [step, consentInitial]);

  async function saveConsents(): Promise<boolean> {
    if (!consentMap.basic_processing) {
      setConsentsError(t("onboarding.consent.requiredError", "Necesitas aceptar el uso del producto para continuar."));
      return false;
    }
    setConsentsSaving(true);
    setConsentsError(null);
    try {
      const initial = consentInitial ?? ({} as Record<ConsentKey, boolean>);
      const changes = CONSENTS.filter((c) => consentMap[c.key] !== (initial[c.key] ?? false));
      for (const c of changes) {
        const res = await fetch("/api/account/consent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ consentKey: c.key, granted: consentMap[c.key], locale: L }),
        });
        const j = await res.json();
        if (j?.ok === false) {
          setConsentsError(j.error ?? "save_failed");
          return false;
        }
      }
      setConsentInitial({ ...consentMap });
      return true;
    } catch (e) {
      setConsentsError(e instanceof Error ? e.message : "save_failed");
      return false;
    } finally {
      setConsentsSaving(false);
    }
  }

  // Manager step — fetch suggestions when query changes (debounced) and
  // decide whether the step is skippable (B2C user, no primaryTenant).
  useEffect(() => {
    if (STEPS[step]?.key !== "manager") return;
    let cancelled = false;
    const handle = setTimeout(() => {
      setManagerSearching(true);
      const url = managerQuery.trim()
        ? `/api/account/employee-profile/manager-suggest?q=${encodeURIComponent(managerQuery.trim())}`
        : "/api/account/employee-profile/manager-suggest";
      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return;
          if (data?.ok === false) {
            setManagerError(data.error || "load_failed");
            return;
          }
          setManagerSkippable(!data.tenantId);
          setManagerSuggestions(data.results || []);
        })
        .catch((e) => {
          if (!cancelled) setManagerError(e instanceof Error ? e.message : "load_failed");
        })
        .finally(() => {
          if (!cancelled) setManagerSearching(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [step, managerQuery]);

  async function saveManager(): Promise<boolean> {
    // Sin manager seleccionado → skip silencioso (no es obligatorio).
    if (!managerSelected) return true;
    setManagerSaving(true);
    setManagerError(null);
    try {
      const res = await fetch("/api/account/employee-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId: managerSelected.employeeProfileId }),
      });
      const j = await res.json();
      if (j?.ok === false) {
        setManagerError(j.error ?? "save_failed");
        return false;
      }
      return true;
    } catch (e) {
      setManagerError(e instanceof Error ? e.message : "save_failed");
      return false;
    } finally {
      setManagerSaving(false);
    }
  }

  const next = async () => {
    if (STEPS[step]?.key === "consent") {
      const ok = await saveConsents();
      if (!ok) return;
    }
    if (STEPS[step]?.key === "manager") {
      const ok = await saveManager();
      if (!ok) return;
    }
    // Al salir de welcome, persistir los sombreros declarados.
    if (STEPS[step]?.key === "welcome") persistRoles(selectedRoles);
    const dest = Math.min(STEPS.length - 1, step + 1);
    setStep(dest);
    persistOnboarding({ step: dest });
  };
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

            {/* Step: Welcome — role selection (multi-select) */}
            {current.key === "welcome" && (
              <div>
                <p className="text-xs text-[var(--rowi-muted)] mb-3 max-w-xl mx-auto">
                  {t(
                    "onboarding.welcome.multiHint",
                    "Marca todos los sombreros que llevas. Puedes elegir varios.",
                  )}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mb-2">
                  {ROLE_PATHS.map((r) => {
                    const RoleIcon = r.icon;
                    const isSelected = selectedRoles.includes(r.key);
                    return (
                      <button
                        key={r.key}
                        onClick={() =>
                          setSelectedRoles((prev) =>
                            prev.includes(r.key)
                              ? prev.filter((k) => k !== r.key)
                              : [...prev, r.key],
                          )
                        }
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                          isSelected
                            ? "border-[var(--rowi-g2)] bg-[var(--rowi-g2)]/5"
                            : "border-gray-200 dark:border-zinc-800 hover:border-[var(--rowi-g2)]/40"
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[var(--rowi-g2)] text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                        <RoleIcon
                          className={`w-7 h-7 ${
                            isSelected ? "text-[var(--rowi-g2)]" : "text-gray-500"
                          }`}
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                          {t(r.labelKey)}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selectedRoles.length > 1 && (
                  <p className="text-xs text-[var(--rowi-muted-weak)] mt-3 text-center">
                    {t(
                      "onboarding.welcome.multiCount",
                      "{{n}} sombreros seleccionados",
                    ).replace("{{n}}", String(selectedRoles.length))}
                  </p>
                )}
              </div>
            )}

            {/* Step: Consent (GDPR floor) */}
            {current.key === "consent" && (
              <div className="max-w-xl mx-auto space-y-3 text-left">
                {consentsLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--rowi-g2)]" />
                  </div>
                )}
                {!consentsLoading && CONSENTS.map((c) => {
                  const granted = consentMap[c.key];
                  return (
                    <label
                      key={c.key}
                      className={`block rowi-card cursor-pointer transition-all ${
                        granted ? "border-[var(--rowi-g2)]/60" : ""
                      } ${c.required ? "opacity-100" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={granted}
                          disabled={consentsSaving}
                          onChange={(e) => {
                            // Required consents can be toggled ON but never OFF.
                            if (c.required && !e.target.checked) return;
                            setConsentMap((prev) => ({ ...prev, [c.key]: e.target.checked }));
                          }}
                          className="mt-1 h-4 w-4 rounded border-[var(--rowi-card-border)] accent-[var(--rowi-g2)]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-[var(--rowi-foreground)] font-medium text-sm">
                              {titleFor(c, L)}
                            </h3>
                            {c.required && (
                              <span className="rowi-chip text-xs">
                                {t("onboarding.consent.required", "Obligatorio")}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--rowi-muted)] leading-relaxed">
                            {bodyFor(c, L)}
                          </p>
                        </div>
                      </div>
                    </label>
                  );
                })}
                {consentsError && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{consentsError}</span>
                  </div>
                )}
                <p className="text-xs text-[var(--rowi-muted-weak)] pt-2">
                  {t(
                    "onboarding.consent.footer",
                    "Puedes revisar o revocar estos permisos en cualquier momento desde tu página de privacidad.",
                  )}
                </p>
              </div>
            )}

            {/* Step: Rowi Test — siembra el perfil bajo el capó (cadena SIA) */}
            {current.key === "rowiTest" && (
              <div className="max-w-xl mx-auto">
                {rowiTestError && (
                  <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-4 text-sm">
                    <p className="text-red-700 dark:text-red-300 mb-2">
                      {t("miniSei.submitError", "No pudimos guardar tus respuestas. Tu test no se perdió: vuelve a intentarlo.")}
                    </p>
                    <button
                      onClick={() => rowiTestLastAttempt && submitRowiTest(rowiTestLastAttempt.answers, rowiTestLastAttempt.preferences)}
                      disabled={rowiTestSaving}
                      className="rowi-btn-primary px-4 py-2 text-sm"
                    >
                      {t("common.retry", "Reintentar")}
                    </button>
                  </div>
                )}
                {rowiTestDone && rowiTestResult ? (
                  <RowiTestWow
                    result={rowiTestResult}
                    onContinue={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))}
                  />
                ) : rowiTestDone ? (
                  <p className="text-center text-[var(--rowi-muted)] py-6">
                    {t("onboarding.rowiTest.done", "¡Listo! Tu perfil se está afinando.")}
                  </p>
                ) : rowiTestQuestions.length > 0 ? (
                  <MiniSeiWizard
                    questions={rowiTestQuestions}
                    preferenceQuestions={rowiTestPrefs}
                    submitting={rowiTestSaving}
                    onComplete={submitRowiTest}
                  />
                ) : rowiTestLoadError ? (
                  <div role="alert" className="text-center py-6 space-y-3">
                    <p className="text-sm text-[var(--rowi-muted)]">
                      {t("onboarding.rowiTest.loadError", "No pudimos cargar las preguntas. Revisa tu conexión.")}
                    </p>
                    <button
                      onClick={() => { setRowiTestLoadError(false); setRowiTestChecked(false); }}
                      className="rowi-btn-primary px-4 py-2 text-sm"
                    >
                      {t("common.retry", "Reintentar")}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--rowi-g2)]" />
                  </div>
                )}
              </div>
            )}

            {/* Step: SEI completo — cierre opcional, handoff a Six Seconds */}
            {current.key === "fullSei" && (
              <div className="max-w-md mx-auto space-y-4 text-center">
                <p className="text-sm text-[var(--rowi-muted)]">
                  {t(
                    "onboarding.fullSei.body",
                    "Tu Rowi Test te da una primera lectura. El SEI completo de Six Seconds es la evaluación normada y profunda — opcional, cuando quieras ir más a fondo.",
                  )}
                </p>
                <Link
                  href="/sei"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
                >
                  {t("onboarding.fullSei.cta", "Hacer el SEI completo")}
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <button
                  type="button"
                  onClick={next}
                  className="block w-full text-sm text-[var(--rowi-muted)] hover:underline"
                >
                  {t("onboarding.fullSei.skip", "Por ahora no, seguir")}
                </button>
              </div>
            )}

            {/* Step: Manager auto-link (#28) */}
            {current.key === "manager" && (
              <div className="max-w-xl mx-auto space-y-4 text-left">
                {managerSkippable === true ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-[var(--rowi-muted)]">
                      {t(
                        "onboarding.manager.skip",
                        "Sin organización vinculada. Puedes declararla más tarde desde tu perfil.",
                      )}
                    </p>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={managerQuery}
                      onChange={(e) => setManagerQuery(e.target.value)}
                      placeholder={t(
                        "onboarding.manager.searchPlaceholder",
                        "Buscar por nombre o email...",
                      )}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--rowi-g2)] focus:border-transparent"
                    />
                    {managerSearching && (
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--rowi-g2)]" />
                    )}
                    {!managerSearching && managerSuggestions.length === 0 && (
                      <p className="text-xs text-[var(--rowi-muted)]">
                        {t(
                          "onboarding.manager.noResults",
                          "No encontramos coincidencias en tu organización.",
                        )}
                      </p>
                    )}
                    <ul className="space-y-2 max-h-72 overflow-y-auto">
                      {managerSuggestions.map((m) => {
                        const isSel =
                          managerSelected?.employeeProfileId === m.employeeProfileId;
                        return (
                          <li key={m.employeeProfileId}>
                            <button
                              type="button"
                              onClick={() => setManagerSelected(isSel ? null : m)}
                              className={`w-full text-left px-3 py-2 rounded-xl border transition-all ${
                                isSel
                                  ? "border-[var(--rowi-g2)] bg-[var(--rowi-g2)]/5"
                                  : "border-gray-200 dark:border-zinc-700 hover:border-[var(--rowi-g2)]/40"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <UserRound className="w-5 h-5 text-[var(--rowi-muted)]" />
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {m.name || m.email}
                                  </div>
                                  <div className="text-xs text-[var(--rowi-muted)]">
                                    {m.position || m.email}
                                  </div>
                                </div>
                                {isSel && (
                                  <Check className="w-4 h-4 text-[var(--rowi-g2)]" />
                                )}
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                    {managerError && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{managerError}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Step: Create workspace */}
            {current.key === "workspace" && (
              <div className="space-y-3 max-w-md mx-auto">
                {hasWorkspace === null && (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-[var(--rowi-g2)]" />
                )}
                {hasWorkspace === false && (
                  <Link
                    href={
                      selectedRoles.length > 0
                        ? ROLE_PATHS.find((r) => r.key === selectedRoles[0])?.href ||
                          "/workspace/new"
                        : "/workspace/new"
                    }
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

            {/* Step: Invite members */}
            {current.key === "invite" && (
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

            {/* Step: Explore */}
            {current.key === "explore" && (
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
            onClick={finishOnboarding}
            disabled={finishing || (current.key === "consent" && !consentMap.basic_processing)}
            className="text-sm text-gray-500 hover:text-[var(--rowi-g2)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-500"
            title={
              current.key === "consent" && !consentMap.basic_processing
                ? t("onboarding.consent.requiredError", "Necesitas aceptar el uso del producto para continuar.")
                : undefined
            }
          >
            {t("onboarding.skip")}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={next}
              disabled={
                (current.key === "welcome" && selectedRoles.length === 0) ||
                (current.key === "consent" && (consentsLoading || consentsSaving || !consentMap.basic_processing)) ||
                (current.key === "manager" && managerSaving)
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {(consentsSaving && current.key === "consent") ||
              (managerSaving && current.key === "manager") ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {current.key === "manager" && !managerSelected
                    ? t("onboarding.manager.skip", "Omitir paso")
                    : current.key === "manager"
                      ? t("onboarding.manager.confirm", "Confirmar manager")
                      : t("onboarding.next")}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={finishOnboarding}
              disabled={finishing}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
            >
              {finishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {t("onboarding.finish")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ El WOW del Rowi Test + el plan inmediato (D5) ═══════════
   En vez de descartar el resultado del mini-SEI y saltar al siguiente step,
   se lo mostramos al usuario (banda + fortalezas + foco) junto con su plan
   concreto en Rowi. El WOW sin plan se evapora; esto lo aterriza. */

function RowiTestWow({
  result,
  onContinue,
}: {
  result: { totalEqBand: string; competencyProfile: Record<string, number> };
  onContinue: () => void;
}) {
  const { t } = useI18n();

  const ranked = Object.entries(result.competencyProfile)
    .filter(([, v]) => typeof v === "number")
    .sort((a, b) => b[1] - a[1]);
  const strengths = ranked.slice(0, 2).map(([k]) => k);
  const focus = ranked.length > 2 ? ranked[ranked.length - 1][0] : null;
  const bandLabel =
    result.totalEqBand && result.totalEqBand !== "unknown"
      ? t(`vs.band.${result.totalEqBand}`, result.totalEqBand)
      : null;

  const plan = [
    {
      icon: Target,
      text: t(
        "onboarding.rowiTest.plan.today",
        "Practica 2 minutos al día en TODAY: una emoción, una intención, una práctica.",
      ),
    },
    {
      icon: Sparkles,
      text: t(
        "onboarding.rowiTest.plan.becoming",
        "Tu avatar evoluciona con tu reflexión: cada noche, tu historia crece.",
      ),
    },
    {
      icon: Users,
      text: t(
        "onboarding.rowiTest.plan.invite",
        "Invita a una persona importante para ti y descubre la afinidad entre ambos.",
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-sm font-semibold text-[var(--rowi-g2)] uppercase tracking-wide">
          {t("onboarding.rowiTest.wow.title", "Tu punto de partida")}
        </p>
        {bandLabel && (
          <p className="text-xs text-[var(--rowi-muted)] mt-1">
            {t("onboarding.rowiTest.wow.band", "Lectura general de tu inteligencia emocional:")}{" "}
            <span className="font-semibold text-[var(--rowi-fg)]">{bandLabel}</span>
          </p>
        )}
      </div>

      {strengths.length > 0 && (
        <div className="rounded-2xl border border-[var(--rowi-border)] p-4 space-y-2">
          <p className="text-xs font-semibold text-[var(--rowi-muted)] uppercase tracking-wide">
            {t("onboarding.rowiTest.wow.strengths", "Tus fortalezas de hoy")}
          </p>
          <div className="flex flex-wrap gap-2">
            {strengths.map((k) => (
              <span
                key={k}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                {t(`sei.competencies.${k}`, k)}
              </span>
            ))}
          </div>
          {focus && (
            <p className="text-xs text-[var(--rowi-muted)] pt-1">
              {t("onboarding.rowiTest.wow.focus", "Tu zona de crecimiento:")}{" "}
              <span className="font-medium text-[var(--rowi-fg)]">
                {t(`sei.competencies.${focus}`, focus)}
              </span>
            </p>
          )}
        </div>
      )}

      <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-500/10 dark:to-fuchsia-500/10 p-4 space-y-3">
        <p className="text-xs font-semibold text-[var(--rowi-muted)] uppercase tracking-wide">
          {t("onboarding.rowiTest.wow.planTitle", "Tu plan con Rowi")}
        </p>
        {plan.map((p, i) => {
          const Icon = p.icon;
          return (
            <div key={i} className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-[var(--rowi-g2)]" />
              </span>
              <p className="text-sm text-[var(--rowi-fg)] leading-relaxed">{p.text}</p>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-[var(--rowi-muted-weak)] text-center">
        {t(
          "onboarding.rowiTest.wow.note",
          "Esta es tu primera lectura — se afina con tu práctica diaria.",
        )}
      </p>

      <button
        type="button"
        onClick={onContinue}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
      >
        {t("onboarding.rowiTest.wow.continue", "Empezar mi plan")}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
