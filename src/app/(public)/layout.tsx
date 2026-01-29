import type { Metadata } from "next";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";

export const metadata: Metadata = {
  title: "Rowi - Tu compañero de Inteligencia Emocional",
  description: "Desarrolla tu inteligencia emocional con Rowi, tu coach personal impulsado por IA y metodología Six Seconds.",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100 transition-colors">
      <PublicNavbar />
      <main className="flex-1 bg-gray-50 dark:bg-zinc-900">{children}</main>
      <PublicFooter />
    </div>
  );
}
