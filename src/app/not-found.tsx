"use client";

/**
 * 404 global. Antes no existía: el middleware mandaba cualquier URL
 * inexistente a /signin (soft-404 para crawlers, login desconcertante
 * para humanos). Renderiza dentro del root layout (I18nProvider activo).
 */
import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <p className="text-6xl font-bold text-[var(--rowi-primary,#7c3aed)] mb-4">404</p>
      <h1 className="text-2xl font-semibold text-[var(--rowi-fg)] mb-2">
        {t("notFound.title", "Esta página no existe")}
      </h1>
      <p className="text-[var(--rowi-muted)] mb-8 max-w-md">
        {t(
          "notFound.body",
          "Puede que el enlace esté roto o que la página se haya movido."
        )}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="rowi-btn-primary px-6 py-3 text-sm">
          {t("notFound.home", "Ir al inicio")}
        </Link>
        <Link
          href="/today"
          className="px-6 py-3 text-sm rounded-full border border-[var(--rowi-card-border)] text-[var(--rowi-fg)]"
        >
          {t("notFound.today", "Ir a mi día")}
        </Link>
      </div>
    </main>
  );
}
