import type { Metadata } from "next";
import ResourcesContent from "./ResourcesContent";

export const metadata: Metadata = {
  title: "Recursos y metodología · Rowi",
  description:
    "Centro de recursos de Rowi: los marcos de Six Seconds explicados — Vital Signs (5 drivers · 15 pulse points), las 8 competencias SEI del modelo KCG y los 18 Brain Talents. Enlaces a cómo funciona, el producto, la demo y precios.",
  alternates: { canonical: "/resources" },
  openGraph: {
    title: "Recursos y metodología · Rowi",
    description:
      "Aprende los marcos de inteligencia emocional de Six Seconds que impulsan Rowi: Vital Signs, KCG y Brain Talents.",
    url: "/resources",
    type: "website",
  },
};

export default function ResourcesPage() {
  return <ResourcesContent />;
}
