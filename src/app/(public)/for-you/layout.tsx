import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Para ti",
  description:
    "Tu coach de inteligencia emocional con IA. Convierte tus emociones en mejores decisiones cada día, con privacidad y metodología Six Seconds.",
  openGraph: {
    title: "Rowi para ti",
    description:
      "Tu coach de inteligencia emocional con IA. Convierte tus emociones en mejores decisiones cada día.",
  },
};

export default function ForYouLayout({ children }: { children: React.ReactNode }) {
  return children;
}
