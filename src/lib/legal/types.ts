// src/lib/legal/types.ts
// ============================================================
// Tipos compartidos para el contenido legal multi-idioma.
// El contenido vive en es.ts / en.ts / pt.ts / it.ts y se
// ensambla en index.ts. Las páginas leen por locale con
// fallback a ES.
// ============================================================

export type LegalDocKey =
  | "privacy"
  | "terms"
  | "six-seconds"
  | "cookies"
  | "research";

export type LegalLocale = "es" | "en" | "pt" | "it";

export interface LegalSection {
  /** Encabezado de la sección. */
  heading: string;
  /** Párrafos. Cada string es un <p>. Para listas usar prefijo "- ". */
  body: string[];
}

export interface LegalDocument {
  title: string;
  /** ISO date string, e.g. "2026-05-28". */
  lastUpdated: string;
  /** Párrafo introductorio opcional. */
  intro?: string;
  sections: LegalSection[];
  /**
   * Aviso de borrador. Cuando true, la página muestra un banner de
   * "pendiente de revisión legal". Quitar cuando el abogado valide.
   */
  draft?: boolean;
}

export type LegalDocSet = Record<LegalDocKey, LegalDocument>;
