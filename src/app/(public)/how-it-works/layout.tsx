import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cómo funciona",
  description:
    "Cómo funciona Rowi en 5 pasos: del check-in emocional diario a insights accionables, con IA y metodología Six Seconds.",
  openGraph: {
    title: "Cómo funciona · Rowi",
    description:
      "Del check-in emocional diario a insights accionables, con IA y metodología Six Seconds.",
  },
};

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
