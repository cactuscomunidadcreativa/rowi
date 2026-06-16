"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const EXEMPT_PREFIXES = ["/onboarding", "/signin", "/login", "/register", "/auth", "/invite"];

// Estados que significan "todavía no terminó el onboarding" → de vuelta al
// wizard. Los demás (PENDING_SEI, ACTIVE, PAYMENT_PENDING, SUSPENDED, etc.) NO
// se rebotan: ya pasaron el onboarding o tienen su propio manejo.
const PRE_ONBOARDING = new Set(["REGISTERED", "ONBOARDING"]);

/** Lee el estado de consentimiento + onboarding con UN reintento antes de
 * fallar. Devuelve null si ambos intentos fallan (el caller decide fail-open). */
async function fetchGateState(): Promise<{ consents: { key: string; granted: boolean }[]; onboardingStatus?: string } | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch("/api/account/consent");
      if (!r.ok) throw new Error(`consent ${r.status}`);
      const data = await r.json();
      if (data?.ok === false) return null;
      return { consents: data.consents ?? [], onboardingStatus: data.onboardingStatus };
    } catch {
      if (attempt === 1) return null;
    }
  }
  return null;
}

export default function ConsentGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const isExempt = EXEMPT_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  const [status, setStatus] = useState<"checking" | "ok" | "redirecting">(
    isExempt ? "ok" : "checking",
  );

  useEffect(() => {
    if (isExempt) {
      setStatus("ok");
      return;
    }
    let cancelled = false;
    (async () => {
      const state = await fetchGateState();
      if (cancelled) return;
      // Fail-open ante un endpoint de consent caído (UX > bloqueo por un 500),
      // pero dejamos rastro en consola para que el fallo sea visible (telemetry
      // server-side no se importa en cliente).
      if (!state) {
        console.warn("[ConsentGate] consent endpoint unreachable; failing open", { pathname });
        setStatus("ok");
        return;
      }
      // Guard de consentimiento: sin basic_processing → de vuelta al onboarding.
      const basic = state.consents.find((c) => c.key === "basic_processing");
      if (!basic?.granted) {
        setStatus("redirecting");
        router.replace("/onboarding");
        return;
      }
      // Guard suave de onboarding: si dio consent pero sigue en estado de
      // pre-onboarding (no terminó el wizard), de vuelta a completar el ancla.
      if (state.onboardingStatus && PRE_ONBOARDING.has(state.onboardingStatus)) {
        setStatus("redirecting");
        router.replace("/onboarding");
        return;
      }
      setStatus("ok");
    })();
    return () => {
      cancelled = true;
    };
  }, [isExempt, pathname, router]);

  if (status === "redirecting") return null;
  return <>{children}</>;
}
