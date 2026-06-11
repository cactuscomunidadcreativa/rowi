"use client";

/**
 * Deep link del invitado (HOOK de la cadena SIA): /r/[token].
 *
 * El invitado frío es la pieza más frágil del motor. Entra por VALOR PROPIO con
 * encuadre por tipo de relación, móvil-first, sin login. Reusa el PreSeiWizard
 * (las 8 preguntas) como mini-test. Tras responder, ofrece guardar + crear cuenta
 * (captura suave, después de mostrar valor — nunca antes).
 */
import { useEffect, useState } from "react";
import { use } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/I18nProvider";
import PreSeiWizard, { type PreSeiDemographics } from "@/components/pre-sei/PreSeiWizard";
import { affinityAsGap, type AttunementGap } from "@/domains/affinity/lib/asGap";

type Phase = "loading" | "intro" | "test" | "done" | "error";
interface QuestionView { sei: string; index: number; prompt: string }

export default function RelationshipInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const { t, lang } = useI18n();
  const [phase, setPhase] = useState<Phase>("loading");
  const [inviterName, setInviterName] = useState<string | null>(null);
  const [relationType, setRelationType] = useState<string>("other");
  const [errorKey, setErrorKey] = useState<string>("relInvite.notFound");
  const [questions, setQuestions] = useState<QuestionView[]>([]);
  // BRECHA, no porcentaje (regla dura de asGap.ts): nivel de sintonía 0-3.
  const [gap, setGap] = useState<AttunementGap | null>(null);
  const [ownerHasProfile, setOwnerHasProfile] = useState(true);

  // Cargar el encuadre de la invitación (marca opened).
  useEffect(() => {
    fetch(`/api/public/relationships/invite/${token}`)
      .then(async (r) => ({ status: r.status, json: await r.json() }))
      .then(({ status, json }) => {
        if (status === 410) { setErrorKey("relInvite.expired"); setPhase("error"); return; }
        if (!json.ok) { setErrorKey("relInvite.notFound"); setPhase("error"); return; }
        setInviterName(json.inviterName);
        setRelationType(json.relationType || "other");
        setOwnerHasProfile(json.ownerHasProfile !== false);
        setPhase("intro");
      })
      .catch(() => { setErrorKey("relInvite.notFound"); setPhase("error"); });
  }, [token]);

  async function startTest() {
    const res = await fetch(`/api/public/pre-sei/questions?lang=${lang}`);
    const json = await res.json();
    if (json.ok) { setQuestions(json.questions); setPhase("test"); }
  }

  async function handleComplete(answers: Record<string, number>, _demo: PreSeiDemographics) {
    const json = await fetch(`/api/public/relationships/invite/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    })
      .then((r) => r.json())
      .catch(() => null);
    // El WOW de la cadena SIA: la BRECHA owner↔invitado, recién calculada.
    // Nunca un % crudo (prohibido por asGap.ts): escala de sintonía.
    if (json?.ok) {
      setGap(affinityAsGap({ heat135: json.heat135, heat100: json.heat100 }));
    }
    setPhase("done");
  }

  const framing = t(`relInvite.framing.${relationType}`, t("relInvite.framing.other"));
  const inviter = inviterName || t("relInvite.someone", "Alguien");

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 bg-[var(--rowi-bg)]">
      <div className="max-w-xl mx-auto">
        {phase === "loading" && (
          <p className="text-center text-[var(--rowi-muted)]">…</p>
        )}

        {phase === "error" && (
          <p className="text-center text-[var(--rowi-muted)] mt-10">{t(errorKey)}</p>
        )}

        {phase === "intro" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-2xl md:text-4xl font-bold mb-3 text-[var(--rowi-fg)]">
              {t("relInvite.title", "{name} quiere entenderte mejor").replace("{name}", inviter)}
            </h1>
            <p className="text-sm text-[var(--rowi-muted)] mb-2">{framing}</p>
            <p className="text-base text-[var(--rowi-muted)] mb-8">{t("relInvite.subtitle")}</p>
            {!ownerHasProfile && (
              <p className="text-xs text-[var(--rowi-muted)] mb-4 max-w-sm mx-auto">
                {t(
                  "relInvite.ownerPending",
                  "{name} aún está completando su perfil: verás tu resultado hoy y la sintonía entre ambos en cuanto lo termine."
                ).replace("{name}", inviter)}
              </p>
            )}
            <button onClick={startTest} className="rowi-btn-primary py-3 px-8 text-base">
              {t("relInvite.start", "Empezar (1 minuto)")}
            </button>
          </motion.div>
        )}

        {phase === "test" && questions.length > 0 && (
          <PreSeiWizard questions={questions} onComplete={handleComplete} />
        )}

        {phase === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold mb-2 text-[var(--rowi-fg)]">
              {t("relInvite.done.title")}
            </h2>

            {/* WOW de afinidad: la BRECHA owner↔invitado como escala de
                sintonía (termómetro 0-3), jamás un % crudo (regla asGap.ts). */}
            {gap && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="my-6 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white p-6"
              >
                <div className="text-3xl font-extrabold">{t(gap.labelKey)}</div>
                {/* Termómetro de sintonía: 4 pasos que se llenan */}
                <div className="flex gap-1.5 justify-center mt-4" role="img" aria-label={t(gap.labelKey)}>
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-2 w-12 rounded-full ${i <= gap.step ? "bg-white" : "bg-white/25"}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-violet-100 mt-4">{t(gap.hintKey)}</p>
                <p className="text-xs text-violet-200 mt-2">
                  {t(
                    "relInvite.done.affinity",
                    "Tu sintonía con {name} ahora mismo. Es un punto de partida — crece a medida que se conocen.",
                  ).replace("{name}", inviter)}
                </p>
              </motion.div>
            )}

            <p className="text-base text-[var(--rowi-muted)] mb-8">{t("relInvite.done.body")}</p>
            {/* El token viaja al registro: al crear la cuenta se vincula la
                díada (dyad.otherUserId) — sin esto la relación quedaba huérfana. */}
            <a
              href={`/register?source=rel_invite&relToken=${encodeURIComponent(token)}`}
              className="rowi-btn-primary py-3 px-8 text-base inline-block"
            >
              {t("relInvite.done.createAccount")}
            </a>
          </motion.div>
        )}
      </div>
    </div>
  );
}
