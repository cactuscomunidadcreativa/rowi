"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useI18n } from "@/lib/i18n/react";
import { Loader2, AlertCircle } from "lucide-react";

interface StoredRegistration {
  selectedPlan?: { slug?: string } | null;
  formData?: {
    language?: string;
    country?: string;
    wantsSei?: boolean;
    referralCode?: string;
  };
  billingPeriod?: string;
  // Atribución preservada a través del redirect de OAuth.
  source?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

export default function RegisterCompletePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/signin?callbackUrl=/register/complete");
      return;
    }

    if (ran.current) return;
    ran.current = true;

    let stored: StoredRegistration | null = null;
    try {
      const raw = sessionStorage.getItem("rowi_registration");
      if (raw) stored = JSON.parse(raw) as StoredRegistration;
    } catch {
      stored = null;
    }

    const payload = {
      planSlug: stored?.selectedPlan?.slug,
      language: stored?.formData?.language,
      country: stored?.formData?.country,
      wantsSei: stored?.formData?.wantsSei,
      referralCode: stored?.formData?.referralCode,
      source: stored?.source,
      utmSource: stored?.utmSource,
      utmMedium: stored?.utmMedium,
      utmCampaign: stored?.utmCampaign,
    };

    (async () => {
      try {
        const res = await fetch("/api/account/finalize-oauth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        sessionStorage.removeItem("rowi_registration");

        if (!res.ok || !data.ok) {
          setError(data.error || "finalize_failed");
          return;
        }

        if (data.nextStep === "payment") {
          router.push("/onboarding?step=payment");
        } else {
          router.push("/hub");
        }
      } catch (e: any) {
        setError(e?.message || "network_error");
      }
    })();
  }, [status, router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-800 px-6">
      <div className="max-w-md w-full text-center space-y-4">
        {error ? (
          <>
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <h1 className="text-xl font-semibold">
              {t("register.complete.errorTitle", "No pudimos completar tu registro")}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t(
                "register.complete.errorBody",
                "Hubo un problema al finalizar tu cuenta. Vuelve a intentarlo o entra manualmente."
              )}
            </p>
            <button
              onClick={() => router.push("/hub")}
              className="rowi-btn px-6 py-2 text-white font-medium"
              style={{ background: "#31a2e3" }}
            >
              {t("register.complete.goToHub", "Ir al panel")}
            </button>
          </>
        ) : (
          <>
            <Loader2 className="w-10 h-10 text-violet-500 mx-auto animate-spin" />
            <h1 className="text-xl font-semibold">
              {t("register.complete.title", "Activando tu cuenta...")}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t(
                "register.complete.body",
                "Estamos finalizando tu registro. Esto solo toma un momento."
              )}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
