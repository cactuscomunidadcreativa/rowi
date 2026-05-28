"use client";

/**
 * 🏢 Wizard de onboarding self-service de empresa
 * ---------------------------------------------------------
 * Flujo de 4 pasos (estado local, sin routing por paso):
 *   1. Datos de la empresa  → POST /api/account/create-organization
 *   2. Plan + licencias      → POST /api/stripe/checkout (quantity + tenantId)
 *   3. Conectar Slack        → ConnectSlackButton (opcional)
 *   4. Invitar equipo        → POST /api/admin/users/invite por cada email
 *
 * El paso 1 devuelve `needsSessionRefresh`; refrescamos la sesión de
 * NextAuth con `update()` para que entre el scope admin del tenant nuevo.
 *
 * Si el OAuth de Slack regresa a esta página con `?slack=connected`,
 * saltamos directo al paso de Slack para mostrar el estado conectado.
 */

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Building2,
  CreditCard,
  Users,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  Mail,
  Sparkles,
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import ConnectSlackButton from "@/components/integrations/ConnectSlackButton";

type Tenant = { id: string; name: string; slug: string };

type Plan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceUsd: number | null;
  priceCents: number | null;
  trialDays: number;
  badge: string | null;
  stripePriceIdMonthly: string | null;
};

type InviteResult = {
  email: string;
  status: "ok" | "no_seats" | "error";
  message?: string;
};

const STEP_META = [
  { key: "company", icon: Building2, gradient: "from-indigo-500 to-purple-600" },
  { key: "plan", icon: CreditCard, gradient: "from-emerald-500 to-green-600" },
  { key: "slack", icon: Sparkles, gradient: "from-violet-500 to-fuchsia-500" },
  { key: "invite", icon: Users, gradient: "from-blue-500 to-cyan-600" },
] as const;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function SetupOrganizationWizard() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update: updateSession } = useSession();

  // Si volvemos del OAuth de Slack, arranca directo en ese paso.
  const slackReturn = searchParams.get("slack");
  const [step, setStep] = useState<number>(slackReturn ? 2 : 0);
  const [done, setDone] = useState(false);

  // Paso 1: empresa
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [companySaving, setCompanySaving] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [refreshNotice, setRefreshNotice] = useState(false);

  // Paso 2: plan + licencias
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [seats, setSeats] = useState<number>(5);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  // Paso 4: invitaciones
  const [emailsText, setEmailsText] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteResults, setInviteResults] = useState<InviteResult[]>([]);

  // Slug auto-derivado del nombre mientras el usuario no lo edite a mano.
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  // Cargar planes al entrar al paso 2.
  useEffect(() => {
    if (STEP_META[step]?.key !== "plan" || plans.length > 0 || plansLoading) return;
    setPlansLoading(true);
    fetch("/api/public/plans")
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && Array.isArray(data.plans)) {
          // Solo planes con price de Stripe configurado son comprables.
          const usable = (data.plans as Plan[]).filter((p) => p.stripePriceIdMonthly);
          setPlans(usable);
          if (usable.length > 0) setSelectedPlanId(usable[0].id);
        }
      })
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false));
  }, [step, plans.length, plansLoading]);

  async function createOrganization(): Promise<boolean> {
    if (!name.trim()) {
      setCompanyError(
        t("setupOrg.company.nameRequired", "El nombre de la organización es obligatorio."),
      );
      return false;
    }
    setCompanySaving(true);
    setCompanyError(null);
    try {
      const res = await fetch("/api/account/create-organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok || data?.ok === false) {
        setCompanyError(
          data?.message ||
            data?.error ||
            t("setupOrg.company.createError", "No se pudo crear la organización."),
        );
        return false;
      }
      setTenant(data.tenant as Tenant);

      // El scope admin del tenant nuevo entra al refrescar la sesión.
      if (data.needsSessionRefresh) {
        try {
          await updateSession?.();
        } catch {
          // Si el refresh falla, avisamos para que recargue manualmente.
          setRefreshNotice(true);
        }
      }
      return true;
    } catch (e) {
      setCompanyError(
        e instanceof Error
          ? e.message
          : t("setupOrg.company.createError", "No se pudo crear la organización."),
      );
      return false;
    } finally {
      setCompanySaving(false);
    }
  }

  async function startCheckout() {
    if (!tenant || !selectedPlanId) return;
    setCheckoutLoading(true);
    setPlanError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlanId,
          quantity: seats,
          tenantId: tenant.id,
        }),
      });
      const data = await res.json();
      if ((res.ok && data?.url) || data?.ok) {
        if (data.url) {
          window.location.href = data.url as string;
          return;
        }
      }
      setPlanError(
        data?.error ||
          t("setupOrg.plan.checkoutError", "No se pudo iniciar el pago. Intenta de nuevo."),
      );
    } catch (e) {
      setPlanError(
        e instanceof Error
          ? e.message
          : t("setupOrg.plan.checkoutError", "No se pudo iniciar el pago. Intenta de nuevo."),
      );
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function sendInvites() {
    if (!tenant) return;
    const emails = emailsText
      .split(/[\s,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes("@"));
    if (emails.length === 0) {
      setInviteResults([]);
      return;
    }
    setInviting(true);
    const results: InviteResult[] = [];
    for (const email of emails) {
      try {
        const res = await fetch("/api/admin/users/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, tenantId: tenant.id, role: "VIEWER" }),
        });
        const data = await res.json();
        if (res.status === 402 || data?.error === "no_seats") {
          results.push({
            email,
            status: "no_seats",
            message:
              data?.message ||
              t("setupOrg.invite.noSeats", "Sin licencias disponibles para este correo."),
          });
        } else if (!res.ok || data?.ok === false) {
          results.push({
            email,
            status: "error",
            message:
              data?.error ||
              t("setupOrg.invite.failed", "No se pudo enviar la invitación."),
          });
        } else {
          results.push({ email, status: "ok" });
        }
      } catch {
        results.push({
          email,
          status: "error",
          message: t("setupOrg.invite.failed", "No se pudo enviar la invitación."),
        });
      }
    }
    setInviteResults(results);
    setInviting(false);
  }

  const current = STEP_META[step];
  const StepIcon = current.icon;

  async function next() {
    if (current.key === "company" && !tenant) {
      const ok = await createOrganization();
      if (!ok) return;
    }
    setStep((s) => Math.min(STEP_META.length - 1, s + 1));
  }
  const back = () => setStep((s) => Math.max(0, s - 1));

  // Pantalla final.
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl text-center bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-8 md:p-12">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {t("setupOrg.done.title", "Tu organización está lista")}
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 mb-8">
            {t(
              "setupOrg.done.description",
              "Ya puedes administrar tu equipo, licencias e integraciones desde el panel.",
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/hub/admin"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
            >
              {t("setupOrg.done.adminHub", "Ir al panel de administración")}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              {t("setupOrg.done.dashboard", "Ir a mi panel")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEP_META.map((s, i) => (
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

        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-8 md:p-12 text-center">
          <div
            className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${current.gradient} flex items-center justify-center mx-auto mb-6 shadow-lg`}
          >
            <StepIcon className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {t(`setupOrg.${current.key}.title`, defaultTitle(current.key))}
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
            {t(`setupOrg.${current.key}.description`, defaultDescription(current.key))}
          </p>

          {/* Paso 1: datos de la empresa */}
          {current.key === "company" && (
            <div className="max-w-md mx-auto space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t("setupOrg.company.nameLabel", "Nombre de la organización")}
                </label>
                <input
                  type="text"
                  value={name}
                  disabled={!!tenant || companySaving}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("setupOrg.company.namePlaceholder", "Mi Empresa S.A.")}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--rowi-g2)] focus:border-transparent disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t("setupOrg.company.slugLabel", "Identificador (URL)")}
                </label>
                <input
                  type="text"
                  value={slug}
                  disabled={!!tenant || companySaving}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(slugify(e.target.value));
                  }}
                  placeholder="mi-empresa"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--rowi-g2)] focus:border-transparent disabled:opacity-60 font-mono text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {t("setupOrg.company.slugHint", "Se deriva del nombre. Puedes editarlo.")}
                </p>
              </div>

              {tenant && (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-medium">
                  <Check className="w-4 h-4" />
                  {t("setupOrg.company.created", "Organización creada")}: {tenant.name}
                </div>
              )}

              {refreshNotice && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    {t(
                      "setupOrg.company.refreshNotice",
                      "Recarga la página para activar tus permisos de administrador.",
                    )}
                  </span>
                </div>
              )}

              {companyError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{companyError}</span>
                </div>
              )}
            </div>
          )}

          {/* Paso 2: plan + licencias */}
          {current.key === "plan" && (
            <div className="max-w-xl mx-auto space-y-5 text-left">
              {plansLoading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--rowi-g2)]" />
                </div>
              )}

              {!plansLoading && plans.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t(
                      "setupOrg.plan.noPlans",
                      "No hay planes disponibles todavía. Puedes omitir este paso por ahora.",
                    )}
                  </p>
                </div>
              )}

              {!plansLoading && plans.length > 0 && (
                <>
                  <div className="space-y-2">
                    {plans.map((p) => {
                      const isSel = selectedPlanId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPlanId(p.id)}
                          className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                            isSel
                              ? "border-[var(--rowi-g2)] bg-[var(--rowi-g2)]/5"
                              : "border-gray-200 dark:border-zinc-700 hover:border-[var(--rowi-g2)]/40"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {p.name}
                                </span>
                                {p.badge && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--rowi-g2)]/10 text-[var(--rowi-g2)]">
                                    {p.badge}
                                  </span>
                                )}
                              </div>
                              {p.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {p.description}
                                </p>
                              )}
                            </div>
                            <div className="text-right whitespace-nowrap">
                              <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {formatPrice(p)}
                              </span>
                              <div className="text-xs text-gray-400">
                                {t("setupOrg.plan.perSeat", "por asiento")}
                              </div>
                            </div>
                          </div>
                          {isSel && (
                            <Check className="w-4 h-4 text-[var(--rowi-g2)] mt-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t("setupOrg.plan.seatsLabel", "Número de licencias")}
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={seats}
                      onChange={(e) =>
                        setSeats(Math.max(1, Math.floor(Number(e.target.value) || 1)))
                      }
                      className="w-32 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--rowi-g2)] focus:border-transparent"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {t(
                        "setupOrg.plan.seatsHint",
                        "Cuántas personas podrán usar Rowi en tu organización.",
                      )}
                    </p>
                  </div>

                  {planError && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{planError}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={startCheckout}
                    disabled={checkoutLoading || !selectedPlanId}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {checkoutLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        {t("setupOrg.plan.checkoutCta", "Continuar al pago")}
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Paso 3: conectar Slack */}
          {current.key === "slack" && (
            <div className="flex flex-col items-center gap-3">
              <ConnectSlackButton />
              <p className="text-xs text-gray-400 max-w-sm">
                {t(
                  "setupOrg.slack.optional",
                  "Opcional. Puedes conectar Slack ahora o más tarde desde el panel de integraciones.",
                )}
              </p>
            </div>
          )}

          {/* Paso 4: invitar equipo */}
          {current.key === "invite" && (
            <div className="max-w-md mx-auto space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t("setupOrg.invite.emailsLabel", "Correos del equipo")}
                </label>
                <textarea
                  value={emailsText}
                  onChange={(e) => setEmailsText(e.target.value)}
                  rows={4}
                  placeholder={t(
                    "setupOrg.invite.emailsPlaceholder",
                    "Un correo por línea o separados por coma",
                  )}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--rowi-g2)] focus:border-transparent text-sm"
                />
              </div>

              <button
                type="button"
                onClick={sendInvites}
                disabled={inviting || !emailsText.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {inviting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                {t("setupOrg.invite.sendCta", "Enviar invitaciones")}
              </button>

              {inviteResults.length > 0 && (
                <ul className="space-y-1.5 pt-2">
                  {inviteResults.map((r) => (
                    <li
                      key={r.email}
                      className="flex items-start gap-2 text-xs"
                    >
                      {r.status === "ok" ? (
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                      )}
                      <span
                        className={
                          r.status === "ok"
                            ? "text-gray-600 dark:text-gray-300"
                            : "text-rose-600 dark:text-rose-400"
                        }
                      >
                        <span className="font-medium">{r.email}</span>
                        {r.status === "no_seats" && (
                          <> — {r.message || t("setupOrg.invite.noSeats", "Sin licencias disponibles.")}</>
                        )}
                        {r.status === "error" && r.message && <> — {r.message}</>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Navegación */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={back}
            disabled={step === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("setupOrg.back", "Atrás")}
          </button>

          {/* Omitir: en pasos opcionales (plan/slack/invite) deja avanzar. */}
          {current.key !== "company" && step < STEP_META.length - 1 && (
            <button
              onClick={() => setStep((s) => Math.min(STEP_META.length - 1, s + 1))}
              className="text-sm text-gray-500 hover:text-[var(--rowi-g2)] transition-colors"
            >
              {t("setupOrg.skip", "Omitir por ahora")}
            </button>
          )}

          {step < STEP_META.length - 1 ? (
            <button
              onClick={next}
              disabled={
                (current.key === "company" && (!name.trim() || companySaving)) ||
                companySaving
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {companySaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {t("setupOrg.next", "Continuar")}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setDone(true)}
              disabled={!tenant}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              <Check className="w-4 h-4" />
              {t("setupOrg.finish", "Finalizar")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function defaultTitle(key: string): string {
  switch (key) {
    case "company":
      return "Crea tu organización";
    case "plan":
      return "Elige tu plan y licencias";
    case "slack":
      return "Conecta Slack";
    case "invite":
      return "Invita a tu equipo";
    default:
      return "";
  }
}

function defaultDescription(key: string): string {
  switch (key) {
    case "company":
      return "Empieza con el nombre de tu organización. Serás su administrador.";
    case "plan":
      return "Selecciona un plan y cuántas licencias necesitas para tu equipo.";
    case "slack":
      return "Lleva Rowi a tus conversaciones. Este paso es opcional.";
    case "invite":
      return "Agrega los correos de tu equipo para enviarles una invitación.";
    default:
      return "";
  }
}

function formatPrice(p: Plan): string {
  const usd =
    p.priceUsd != null
      ? p.priceUsd
      : p.priceCents != null
        ? p.priceCents / 100
        : null;
  if (usd == null) return "—";
  return `$${usd.toFixed(usd % 1 === 0 ? 0 : 2)}`;
}

export default function SetupOrganizationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-g2)]" />
        </div>
      }
    >
      <SetupOrganizationWizard />
    </Suspense>
  );
}
