"use client";

/**
 * PreSeiCTA — el "empuje a la validez total". Tras el insight inferido, lleva a:
 *  1. crear cuenta para guardar el resultado (pasa el preSeiToken al registro),
 *  2. tomar el SEI real (Six Seconds formal, normado),
 *  3. invitar gente para normar la organización (Vital Signs real).
 */
import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";

interface Props {
  token: string | null;
}

export default function PreSeiCTA({ token }: Props) {
  const { t } = useI18n();
  const registerHref = token
    ? `/register?preSeiToken=${encodeURIComponent(token)}`
    : "/register";

  return (
    <div className="max-w-2xl mx-auto w-full space-y-4">
      {/* Crear cuenta — guardar resultado */}
      <Link
        href={registerHref}
        className="block w-full text-center rowi-btn-primary py-3 text-base"
      >
        {t("preSei.cta.createAccount", "Guardar mi resultado y crear cuenta")}
      </Link>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* SEI real */}
        <div className="rowi-card">
          <h4 className="font-semibold text-[var(--rowi-fg)] mb-1">
            {t("preSei.cta.fullSei.title", "Toma el SEI real")}
          </h4>
          <p className="text-sm text-[var(--rowi-muted)] mb-3">
            {t("preSei.cta.fullSei.body", "El assessment formal de Six Seconds te da tu perfil completo y normado.")}
          </p>
          <Link href="/pricing?source=presei" className="rowi-btn-primary inline-block">
            {t("preSei.cta.fullSei.button", "Quiero mi SEI")}
          </Link>
        </div>

        {/* Relacional — invitar a alguien (el HOOK). Anónimo → registro con intención. */}
        <div className="rowi-card">
          <h4 className="font-semibold text-[var(--rowi-fg)] mb-1">
            {t("preSei.cta.org.title", "Invita a quien te importa")}
          </h4>
          <p className="text-sm text-[var(--rowi-muted)] mb-3">
            {t("preSei.cta.org.body", "El verdadero valor aparece al cruzar tu lectura con otra persona: ves la brecha y cómo cerrarla.")}
          </p>
          <Link href={`${registerHref}${registerHref.includes("?") ? "&" : "?"}intent=invite`} className="rowi-btn inline-block">
            {t("preSei.cta.org.button", "Invitar a alguien")}
          </Link>
        </div>
      </div>
    </div>
  );
}
