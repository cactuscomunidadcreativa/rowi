"use client";

import dynamic from "next/dynamic";

// Carga perezosa del tester (evita SSR)
const InsightTest = dynamic(() => import("@/components/rowi/InsightTest"), {
  ssr: false,
});

export default function InsightClient() {
  return <InsightTest />;
}