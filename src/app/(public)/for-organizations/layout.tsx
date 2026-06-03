import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Para empresas",
  description:
    "Plataforma de inteligencia emocional para equipos: bienestar, liderazgo y clima con señales agregadas y anónimas. Basado en Six Seconds.",
  openGraph: {
    title: "Rowi para empresas",
    description:
      "Inteligencia emocional para equipos con señales agregadas y anónimas. Basado en Six Seconds.",
  },
};

export default function ForOrganizationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
