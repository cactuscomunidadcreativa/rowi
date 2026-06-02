import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Producto Rowi",
  description:
    "Descubre cómo funciona Rowi: coach de IA emocional, Vital Signs, dashboards de equipo con privacidad y metodología Six Seconds.",
  openGraph: {
    title: "Producto Rowi",
    description:
      "Coach de IA emocional, Vital Signs y dashboards de equipo con privacidad. Basado en Six Seconds.",
  },
};

export default function ProductRowiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
