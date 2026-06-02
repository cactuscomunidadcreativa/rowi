import type { Metadata } from "next";

// Metadata SEO única por página. El page.tsx es "use client" (no puede
// exportar metadata), así que la definimos en este layout server-side.
export const metadata: Metadata = {
  title: "Planes y precios",
  description:
    "Planes Rowi para personas, familias y empresas. Inteligencia emocional con IA y metodología Six Seconds, con precios transparentes y garantía.",
  openGraph: {
    title: "Planes y precios · Rowi",
    description:
      "Planes Rowi para personas, familias y empresas. Precios transparentes, IA emocional y metodología Six Seconds.",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
