"use client";
import { useEffect, useState } from "react";

export function useAccess(userId: string, level: string, scopeId: string | null) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!userId) return;

    async function check() {
      const res = await fetch("/api/auth/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, level, scopeId, action: "view" }),
      });

      const data = await res.json();
      setAllowed(data.allowed);
    }

    check();
  }, [userId, level, scopeId]);

  return allowed;
}