"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const EXEMPT_PREFIXES = ["/onboarding", "/signin", "/login", "/register", "/auth", "/invite"];

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
    fetch("/api/account/consent")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.ok === false) {
          setStatus("ok");
          return;
        }
        const basic = (data.consents ?? []).find(
          (c: { key: string; granted: boolean }) => c.key === "basic_processing",
        );
        if (!basic?.granted) {
          setStatus("redirecting");
          router.replace("/onboarding");
        } else {
          setStatus("ok");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("ok");
      });
    return () => {
      cancelled = true;
    };
  }, [isExempt, pathname, router]);

  if (status === "redirecting") return null;
  return <>{children}</>;
}
