"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getLegalDoc, isLegalDocKey, LEGAL_DOC_KEYS } from "@/lib/legal";

/**
 * Página legal genérica. Renderiza privacy / terms / cookies /
 * research / six-seconds según el param [doc], en el idioma activo
 * (fallback a ES).
 */
export default function LegalDocPage({
  params,
}: {
  params: Promise<{ doc: string }>;
}) {
  const { doc } = use(params);
  const { lang, t } = useI18n();

  if (!isLegalDocKey(doc)) {
    notFound();
  }

  const document = getLegalDoc(doc, lang);

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 px-6 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Nav entre documentos legales */}
        <nav className="flex flex-wrap gap-3 mb-8 text-sm">
          {LEGAL_DOC_KEYS.map((key) => (
            <Link
              key={key}
              href={`/legal/${key}`}
              className={`rounded-full px-3 py-1 border transition ${
                key === doc
                  ? "bg-rowi-primary text-white border-transparent"
                  : "border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800"
              }`}
            >
              {getLegalDoc(key, lang).title}
            </Link>
          ))}
        </nav>

        <article className="prose dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold rowi-gradient-text">
            {document.title}
          </h1>
          <p className="text-sm text-gray-500">
            {t("legal.lastUpdated", "Última actualización")}:{" "}
            {document.lastUpdated}
          </p>

          {document.draft && (
            <div className="not-prose my-4 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4 text-sm text-amber-800 dark:text-amber-200">
              {t(
                "legal.draftNotice",
                "Documento borrador pendiente de revisión legal. El contenido puede cambiar antes de su versión definitiva.",
              )}
            </div>
          )}

          {document.intro && (
            <p className="text-base leading-relaxed">{document.intro}</p>
          )}

          {document.sections.map((section, i) => (
            <section key={i} className="mt-6">
              <h2 className="text-xl font-semibold">{section.heading}</h2>
              {section.body.map((para, j) =>
                para.startsWith("- ") ? (
                  <ul key={j} className="list-disc pl-6">
                    <li>{para.slice(2)}</li>
                  </ul>
                ) : (
                  <p key={j} className="leading-relaxed">
                    {para}
                  </p>
                ),
              )}
            </section>
          ))}
        </article>

        <footer className="mt-12 pt-6 border-t border-gray-200 dark:border-zinc-800 text-sm text-gray-500">
          <Link href="/" className="hover:underline">
            {t("legal.backHome", "Volver al inicio")}
          </Link>
        </footer>
      </div>
    </main>
  );
}
