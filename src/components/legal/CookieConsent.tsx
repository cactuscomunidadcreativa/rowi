"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";

/**
 * Banner de consentimiento de cookies (GDPR).
 * - Se muestra hasta que el usuario elige.
 * - Guarda la preferencia en localStorage + cookie `rowi_cookie_consent`.
 * - Categorías no esenciales (analytics) solo se habilitan con consentimiento.
 *
 * Para gatear scripts de analítica, leer `hasAnalyticsConsent()` antes de
 * cargar GA / gtag.
 */

const STORAGE_KEY = "rowi_cookie_consent";

type ConsentValue = "all" | "essential";

function persistConsent(value: ConsentValue) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
    // Cookie de 1 año para que el server/scripts puedan leerla también.
    document.cookie = `${STORAGE_KEY}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  } catch {
    // localStorage bloqueado (modo privado) — ignorar.
  }
}

/** Helper exportado para gatear analítica. */
export function hasAnalyticsConsent(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "all";
  } catch {
    return false;
  }
}

export default function CookieConsent() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function choose(value: ConsentValue) {
    persistConsent(value);
    setVisible(false);
    // Avisar a posibles listeners (e.g. loader de GA) que hubo consentimiento.
    window.dispatchEvent(new CustomEvent("rowi:cookie-consent", { detail: value }));
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t("cookies.bannerLabel", "Consentimiento de cookies")}
      className="fixed bottom-0 inset-x-0 z-[100] p-4 sm:p-6"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <p className="text-sm text-gray-700 dark:text-gray-200 flex-1 leading-relaxed">
          {t(
            "cookies.bannerText",
            "Usamos cookies esenciales para que la plataforma funcione y, con tu permiso, cookies de analítica para mejorarla.",
          )}{" "}
          <Link href="/legal/cookies" className="underline hover:no-underline">
            {t("cookies.bannerLink", "Más información")}
          </Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => choose("essential")}
            className="rounded-lg border border-gray-300 dark:border-zinc-600 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-zinc-800"
          >
            {t("cookies.rejectNonEssential", "Solo esenciales")}
          </button>
          <button
            onClick={() => choose("all")}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ background: "#7c3aed" }}
          >
            {t("cookies.acceptAll", "Aceptar todas")}
          </button>
        </div>
      </div>
    </div>
  );
}
