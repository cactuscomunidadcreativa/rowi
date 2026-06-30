"use client";

/**
 * PreSeiMirror — EL ESPEJO (el primer WOW del blueprint, ROWI_3 §6).
 *
 * "Tu superpoder: [X]. Tu punto ciego: [Y]." — una frase que duele de precisa,
 * no un reporte. Superpoder = competencia más alta; punto ciego = la más baja.
 * Debajo: la micro-práctica para mañana (anclada al punto ciego) y el
 * compromiso de retorno ("¿te escribo mañana?") — captura suave DESPUÉS del
 * valor, nunca antes.
 *
 * Se renderiza ARRIBA del insight detallado: primero el espejo, luego el dato.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Eye, Compass, Mail, Check, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { mirrorPair } from "@/lib/pre-sei/mirror";
import type { PreSeiInsightData } from "./types";

interface Props {
  insight: PreSeiInsightData;
  token: string | null;
}

export default function PreSeiMirror({ insight, token }: Props) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [optInState, setOptInState] = useState<"idle" | "saving" | "done" | "error">("idle");

  const pair = mirrorPair(insight.competencies as Record<string, number>);
  if (!pair) return null;

  const powerName = t(`sei.competencies.${pair.power}`, pair.power);
  const blindName = t(`sei.competencies.${pair.blind}`, pair.blind);
  const powerPhrase = t(`preSei.mirror.power.${pair.power}`, "");
  const blindPhrase = t(`preSei.mirror.blind.${pair.blind}`, "");
  const action = t(`preSei.mirror.action.${pair.blind}`, "");

  const optIn = async () => {
    const trimmed = email.trim();
    if (!trimmed || !token || optInState === "saving") return;
    setOptInState("saving");
    try {
      const res = await fetch("/api/public/pre-sei/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email: trimmed }),
      });
      const data = await res.json().catch(() => null);
      setOptInState(data?.ok ? "done" : "error");
    } catch {
      setOptInState("error");
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto w-full space-y-4"
    >
      {/* EL ESPEJO */}
      <div className="rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 text-white p-6 md:p-8 shadow-xl shadow-violet-500/20">
        <p className="text-xs uppercase tracking-widest text-white/70 font-semibold mb-4 flex items-center gap-1.5">
          <Eye className="w-4 h-4" />
          {t("preSei.mirror.title", "Tu espejo")}
        </p>

        <div className="space-y-5">
          <div>
            <p className="text-sm text-white/70 flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4" />
              {t("preSei.mirror.powerLabel", "Tu superpoder")} · {powerName}
            </p>
            <p className="text-lg md:text-xl font-semibold leading-snug">{powerPhrase}</p>
          </div>

          <div className="border-t border-white/15 pt-5">
            <p className="text-sm text-white/70 flex items-center gap-1.5 mb-1">
              <Eye className="w-4 h-4" />
              {t("preSei.mirror.blindLabel", "Tu punto ciego")} · {blindName}
            </p>
            <p className="text-lg md:text-xl font-semibold leading-snug">{blindPhrase}</p>
          </div>
        </div>
      </div>

      {/* MICRO-PRÁCTICA PARA MAÑANA */}
      <div className="rounded-2xl border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] p-5">
        <p className="text-xs uppercase tracking-wide text-[var(--rowi-muted)] font-semibold mb-2 flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-[var(--rowi-g2)]" />
          {t("preSei.mirror.actionLabel", "Tu micro-práctica para mañana")}
        </p>
        <p className="text-sm md:text-base text-[var(--rowi-fg)] leading-relaxed">{action}</p>

        {/* COMPROMISO DE RETORNO — captura suave después del valor */}
        {token && optInState !== "done" && (
          <div className="mt-4 pt-4 border-t border-[var(--rowi-card-border)]">
            <p className="text-sm text-[var(--rowi-muted)] mb-2">
              {t("preSei.mirror.followQ", "¿Te escribo mañana para recordártela?")}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-[var(--rowi-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("preSei.mirror.emailPlaceholder", "tu@correo.com")}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-[var(--rowi-card-border)] bg-transparent focus:ring-2 focus:ring-[var(--rowi-g2)]/30 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => void optIn()}
                disabled={!email.trim() || optInState === "saving"}
                className="rowi-btn-primary px-5 py-2.5 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {optInState === "saving" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {t("preSei.mirror.notify", "Sí, avísame")}
              </button>
            </div>
            {optInState === "error" && (
              <p className="text-xs text-rose-500 mt-2">
                {t("preSei.mirror.optInError", "No se pudo guardar. Revisa el correo e intenta de nuevo.")}
              </p>
            )}
            <p className="text-[11px] text-[var(--rowi-muted-weak)] mt-2">
              {t("preSei.mirror.privacy", "Solo un correo, mañana. Nada de spam.")}
            </p>
          </div>
        )}
        {optInState === "done" && (
          <p className="mt-4 pt-4 border-t border-[var(--rowi-card-border)] text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            {t("preSei.mirror.optInDone", "Listo — mañana te escribo.")}
          </p>
        )}
      </div>
    </motion.section>
  );
}
