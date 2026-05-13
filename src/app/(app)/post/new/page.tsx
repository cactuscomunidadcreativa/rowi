"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

export default function NewPostPage() {
  const { t } = useI18n();

  return (
    <main className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[var(--rowi-g1)]/20 to-[var(--rowi-g2)]/20 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-[var(--rowi-g2)]" />
        </div>
        <h1 className="text-2xl font-heading">
          {t("post.new.comingSoonTitle") || "Próximamente"}
        </h1>
        <p className="text-[var(--rowi-muted)]">
          {t("post.new.comingSoonMessage") ||
            "Estamos trabajando en una experiencia mejor para crear y compartir tus posts. Vuelve pronto."}
        </p>
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[var(--rowi-g2)] to-[var(--rowi-g1)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("post.new.backToFeed") || "Volver al feed"}
        </Link>
      </div>
    </main>
  );
}
