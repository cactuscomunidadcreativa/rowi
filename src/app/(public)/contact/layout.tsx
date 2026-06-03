import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Habla con el equipo de Rowi. Resolvemos tus dudas sobre planes, empresas y la metodología Six Seconds.",
  openGraph: {
    title: "Contacto · Rowi",
    description: "Habla con el equipo de Rowi sobre planes, empresas y metodología.",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
