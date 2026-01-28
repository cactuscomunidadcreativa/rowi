/**
 * 🔥 useAllowAI — Control inteligente de acceso a IA
 *
 * PRIORIDADES:
 * 1) En desarrollo → SIEMPRE ON
 * 2) Si servidor (SSR) → OFF (hooks cliente)
 * 3) Si usuario es superadmin → ON
 * 4) Si tenant tiene plan con IA → ON
 * 5) Query param ?ai=on → ON
 * 6) localStorage "rowi-ai-enabled" → ON/OFF manual
 * 7) default en producción → OFF
 */

"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function useAllowAI(): boolean {
  const { data: session } = useSession();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    // 1️⃣ Desarrollo local → ON
    if (process.env.NODE_ENV !== "production") {
      setAllowed(true);
      return;
    }

    // 2️⃣ SSR → OFF
    if (typeof window === "undefined") {
      setAllowed(false);
      return;
    }

    // 3️⃣ Superadmin global → ON
    if (session?.user?.roles?.includes("superadmin")) {
      setAllowed(true);
      return;
    }

    // 4️⃣ Tenant con plan IA habilitada → ON
    if (session?.user?.planAiEnabled === true) {
      setAllowed(true);
      return;
    }

    // 5️⃣ Activación manual vía URL (?ai=on)
    const url = new URL(window.location.href);
    if (url.searchParams.get("ai") === "on") {
      setAllowed(true);
      return;
    }

    // 6️⃣ Flag localStorage
    const ls = localStorage.getItem("rowi-ai-enabled");
    if (ls === "1") {
      setAllowed(true);
      return;
    }

    // 7️⃣ Default en producción → OFF
    setAllowed(false);
  }, [session]);

  return allowed;
}