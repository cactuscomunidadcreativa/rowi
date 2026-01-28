import ES from "../../data/feelings/es.json";
import EN from "../../data/feelings/en.json";
import PT from "../../data/feelings/pt.json";
import IT from "../../data/feelings/it.json";

type Lex = { words: string[] };

export const LEX: Record<"es"|"en"|"pt"|"it", string[]> = {
  es: (ES as Lex).words || [],
  en: (EN as Lex).words || [],
  pt: (PT as Lex).words || [],    // BR→PT ya lo resolvimos en el CSV
  it: (IT as Lex).words || [],
};

export const LEX_ANY: string[] = Array.from(
  new Set([...LEX.es, ...LEX.en, ...LEX.pt, ...LEX.it].map(w => w.toLowerCase()))
);
