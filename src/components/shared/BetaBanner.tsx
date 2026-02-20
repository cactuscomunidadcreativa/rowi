"use client";

import { useState, useEffect, useRef } from "react";
import { X, Bug, Sparkles, ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

/**
 * 🚀 Beta Banner Component
 *
 * Muestra un banner elegante indicando que la app está en fase Beta.
 * Incluye link para reportar bugs y se puede cerrar (persiste en localStorage).
 * Totalmente traducible con i18n.
 *
 * Setea --banner-height en :root para que el NavBar se posicione debajo.
 */
export default function BetaBanner() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const dismissed = localStorage.getItem("rowi-beta-banner-dismissed");
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  // Comunicar altura del banner al NavBar vía CSS variable
  useEffect(() => {
    if (visible && bannerRef.current) {
      const h = bannerRef.current.offsetHeight;
      document.documentElement.style.setProperty("--banner-height", `${h}px`);
    } else {
      document.documentElement.style.setProperty("--banner-height", "0px");
    }

    return () => {
      document.documentElement.style.setProperty("--banner-height", "0px");
    };
  }, [visible, mounted]);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem("rowi-beta-banner-dismissed", "true");
    document.documentElement.style.setProperty("--banner-height", "0px");
  };

  // Build mailto link with translated content
  const getMailtoLink = () => {
    const subject = encodeURIComponent(t("beta.emailSubject", "Bug Report - Rowi Beta"));
    const body = encodeURIComponent(
      t("beta.emailBody", "Describe the problem you found:\n\n\nSteps to reproduce:\n1.\n2.\n3.\n\n\nBrowser and device:")
    );
    return `mailto:soporte@rowi.app?subject=${subject}&body=${body}`;
  };

  // Don't render on server or if dismissed
  if (!mounted || !visible) return null;

  return (
    <div
      ref={bannerRef}
      className="sticky top-0 z-[60] isolate flex items-center gap-x-6 overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-6 py-2.5 sm:px-3.5"
    >
      {/* Animated background elements */}
      <div className="absolute left-[max(-7rem,calc(50%-52rem))] top-1/2 -z-10 -translate-y-1/2 transform-gpu blur-2xl" aria-hidden="true">
        <div
          className="aspect-[577/310] w-[36.0625rem] bg-gradient-to-r from-[#ff80b5] to-[#9089fc] opacity-30"
          style={{
            clipPath: "polygon(74.8% 41.9%, 97.2% 73.2%, 100% 34.9%, 92.5% 0.4%, 87.5% 0%, 75% 28.6%, 58.5% 54.6%, 50.1% 56.8%, 46.9% 44%, 48.3% 17.4%, 24.7% 53.9%, 0% 27.9%, 11.9% 74.2%, 24.9% 54.1%, 68.6% 100%, 74.8% 41.9%)",
          }}
        />
      </div>
      <div className="absolute left-[max(45rem,calc(50%+8rem))] top-1/2 -z-10 -translate-y-1/2 transform-gpu blur-2xl" aria-hidden="true">
        <div
          className="aspect-[577/310] w-[36.0625rem] bg-gradient-to-r from-[#ff80b5] to-[#9089fc] opacity-30"
          style={{
            clipPath: "polygon(74.8% 41.9%, 97.2% 73.2%, 100% 34.9%, 92.5% 0.4%, 87.5% 0%, 75% 28.6%, 58.5% 54.6%, 50.1% 56.8%, 46.9% 44%, 48.3% 17.4%, 24.7% 53.9%, 0% 27.9%, 11.9% 74.2%, 24.9% 54.1%, 68.6% 100%, 74.8% 41.9%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 w-full justify-center">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            {t("beta.badge", "BETA")}
          </span>
          <p className="text-sm leading-6 text-white">
            <strong className="font-semibold">{t("beta.title", "Rowi Pre-Launch")}</strong>
            <svg viewBox="0 0 2 2" className="mx-2 inline h-0.5 w-0.5 fill-current" aria-hidden="true">
              <circle cx={1} cy={1} r={1} />
            </svg>
            {t("beta.message", "We're in testing phase. Your feedback is very valuable.")}
          </p>
        </div>

        <a
          href={getMailtoLink()}
          className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-purple-700 shadow-sm hover:bg-purple-50 transition-colors"
        >
          <Bug className="w-3.5 h-3.5" />
          {t("beta.reportBug", "Report bug")}
          <ExternalLink className="w-3 h-3 opacity-60" />
        </a>
      </div>

      {/* Dismiss button */}
      <div className="flex flex-1 justify-end">
        <button
          type="button"
          onClick={handleDismiss}
          className="-m-3 p-3 focus-visible:outline-offset-[-4px] hover:bg-white/10 rounded-full transition-colors"
        >
          <span className="sr-only">{t("beta.close", "Close")}</span>
          <X className="h-5 w-5 text-white" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
