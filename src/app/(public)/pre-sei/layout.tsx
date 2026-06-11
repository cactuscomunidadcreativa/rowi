import type { Metadata } from "next";

/**
 * SEO propio del gancho de conversión (EQ Day). La página es client-side;
 * la metadata vive aquí. `absolute` evita el template "· Rowi" del root
 * (que doblaba la marca: "Rowi — … · Rowi").
 */
export const metadata: Metadata = {
  title: {
    absolute: "Test gratis de inteligencia emocional en 2 minutos · Rowi",
  },
  description:
    "Descubre tu espejo emocional: un diagnóstico gratuito de 2 minutos basado en el modelo Six Seconds. Sin cuenta, resultados al instante.",
  alternates: { canonical: "/pre-sei" },
  openGraph: {
    title: "Descubre tu espejo emocional en 2 minutos",
    description:
      "Diagnóstico gratuito de inteligencia emocional basado en el modelo Six Seconds. Sin cuenta, resultados al instante.",
    url: "/pre-sei",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Descubre tu espejo emocional en 2 minutos",
    description:
      "Diagnóstico gratuito de inteligencia emocional basado en el modelo Six Seconds.",
  },
};

export default function PreSeiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
