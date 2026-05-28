"use client";

/**
 * 📱 PhoneVerificationForm — vincular y verificar el número de WhatsApp
 * ---------------------------------------------------------
 * Equivalente self-serve de ConnectSlackButton, pero para WhatsApp (que no
 * usa OAuth): el usuario escribe su número → recibe un código de 6 dígitos
 * por WhatsApp → lo ingresa → queda verificado. El número verificado es lo
 * que el webhook entrante usa para resolver la identidad del remitente.
 *
 * Llama a:
 *   POST /api/notifications/send-phone-verification  { phone }
 *   POST /api/notifications/verify-phone-code        { phone, code }
 *
 * Strings vía t(key, fallback ES) — claves espejadas en los 4 locales.
 */

import { useState } from "react";
import { Check, AlertCircle, Loader2, MessageCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

interface PhoneVerificationFormProps {
  className?: string;
  /** Si el número ya está verificado (desde las prefs del usuario). */
  initialVerified?: boolean;
  /** Número enmascarado ya guardado, para mostrarlo cuando está verificado. */
  initialMaskedNumber?: string | null;
  /** Callback al verificar con éxito. */
  onVerified?: (phone: string) => void;
}

type Step = "enter_number" | "enter_code" | "verified";

export default function PhoneVerificationForm({
  className = "",
  initialVerified = false,
  initialMaskedNumber = null,
  onVerified,
}: PhoneVerificationFormProps) {
  const { t } = useI18n();
  const [step, setStep] = useState<Step>(initialVerified ? "verified" : "enter_number");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/send-phone-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || t("integrations.whatsapp.sendError", "No se pudo enviar el código."));
        return;
      }
      setStep("enter_code");
    } catch {
      setError(t("integrations.whatsapp.sendError", "No se pudo enviar el código."));
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/verify-phone-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || t("integrations.whatsapp.verifyError", "Código incorrecto."));
        return;
      }
      setStep("verified");
      onVerified?.(phone);
    } catch {
      setError(t("integrations.whatsapp.verifyError", "Código incorrecto."));
    } finally {
      setLoading(false);
    }
  }

  if (step === "verified") {
    return (
      <div
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium ${className}`}
      >
        <Check className="w-4 h-4" />
        {t("integrations.whatsapp.verified", "WhatsApp verificado ✓")}
        {initialMaskedNumber && step === "verified" && phone === "" && (
          <span className="text-emerald-500/80">· {initialMaskedNumber}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {step === "enter_number" && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("integrations.whatsapp.numberLabel", "Tu número de WhatsApp")}
          </label>
          <div className="flex gap-2">
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+52 1 55 1234 5678"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
            />
            <button
              type="button"
              onClick={sendCode}
              disabled={loading || phone.trim().length < 8}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
              {t("integrations.whatsapp.sendCode", "Enviar código")}
            </button>
          </div>
          <p className="text-[11px] text-gray-500">
            {t(
              "integrations.whatsapp.numberHint",
              "Usa formato internacional. Te enviaremos un código por WhatsApp.",
            )}
          </p>
        </div>
      )}

      {step === "enter_code" && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("integrations.whatsapp.codeLabel", "Código de 6 dígitos")}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm tracking-widest"
            />
            <button
              type="button"
              onClick={verifyCode}
              disabled={loading || code.length !== 6}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {t("integrations.whatsapp.verify", "Verificar")}
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setStep("enter_number");
              setCode("");
              setError(null);
            }}
            className="text-[11px] text-gray-500 underline hover:text-gray-700"
          >
            {t("integrations.whatsapp.changeNumber", "Cambiar número")}
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
