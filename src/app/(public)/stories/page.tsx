import type { Metadata } from "next";
import StoriesContent from "./StoriesContent";

export const metadata: Metadata = {
  title: "Historias y casos de uso · Rowi",
  description:
    "Conoce las transformaciones que la metodología Six Seconds y ROWIIA hacen posibles: Emotional Budgeting para personas, equipos y organizaciones, y EmoPower Schools para sistemas educativos.",
  alternates: { canonical: "/stories" },
  openGraph: {
    title: "Historias y casos de uso · Rowi",
    description:
      "Las transformaciones que la metodología Six Seconds y ROWIIA hacen posibles, contadas con honestidad: marcos reales, no métricas inventadas.",
    url: "/stories",
    type: "website",
  },
};

export default function StoriesPage() {
  return <StoriesContent />;
}
