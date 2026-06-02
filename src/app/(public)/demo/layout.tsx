import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demo",
  description:
    "Mira Rowi en acción: una demo de la experiencia de inteligencia emocional con IA y metodología Six Seconds.",
  openGraph: {
    title: "Demo · Rowi",
    description: "Mira Rowi en acción: IA emocional y metodología Six Seconds.",
  },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
