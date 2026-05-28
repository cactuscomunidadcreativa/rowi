// src/lib/legal/index.ts
// ============================================================
// Ensambla el contenido legal por locale. ES es la fuente de
// verdad; EN/PT/IT caen a ES hasta que sus traducciones se
// completen (task #44). Cuando existan es.ts/en.ts/pt.ts/it.ts
// con contenido propio, se importan aquí.
// ============================================================

import type { LegalDocKey, LegalDocSet, LegalLocale } from "./types";
import { LEGAL_ES } from "./es";
import { LEGAL_EN } from "./en";
import { LEGAL_PT } from "./pt";
import { LEGAL_IT } from "./it";

// Las traducciones se agregan a medida que se completan. Hasta
// entonces, el getter cae a ES.
const LOCALE_SETS: Partial<Record<LegalLocale, LegalDocSet>> = {
  es: LEGAL_ES,
  en: LEGAL_EN,
  pt: LEGAL_PT,
  it: LEGAL_IT,
};

export const LEGAL_DOC_KEYS: LegalDocKey[] = [
  "privacy",
  "terms",
  "cookies",
  "research",
  "six-seconds",
];

export function getLegalDoc(key: LegalDocKey, locale: string): LegalDocSet[LegalDocKey] {
  const loc = (["es", "en", "pt", "it"] as const).includes(locale as LegalLocale)
    ? (locale as LegalLocale)
    : "es";
  const set = LOCALE_SETS[loc] ?? LEGAL_ES;
  return set[key] ?? LEGAL_ES[key];
}

export function isLegalDocKey(value: string): value is LegalDocKey {
  return (LEGAL_DOC_KEYS as string[]).includes(value);
}

export type { LegalDocKey, LegalLocale } from "./types";
