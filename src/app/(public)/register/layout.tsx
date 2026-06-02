import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description:
    "Crea tu cuenta de Rowi y empieza a desarrollar tu inteligencia emocional con IA y metodología Six Seconds.",
  // El registro no aporta valor SEO y puede tener parámetros de campaña.
  robots: { index: false, follow: true },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
