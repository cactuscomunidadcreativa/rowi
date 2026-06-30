/**
 * H1.B — Copy "Coach IA" → "Guía" (Brand Book: Rowi no se vende como IA;
 * "Guía" cubre la IA + los coaches humanos). Actualiza valores i18n en los 5
 * idiomas. Solo toca las claves listadas; idempotente (sobrescribe esas claves).
 *
 * Ejecutar: `tsx scripts/h1b-coach-to-guia.ts`
 */
import * as fs from "fs";
import * as path from "path";

type Five = { es: string; en: string; pt: string; it: string; zh: string };

const UPDATES: Record<string, Five> = {
  "hubHome.coach": { es: "Tu Guía", en: "Your Guide", pt: "Seu Guia", it: "La tua Guida", zh: "你的向导" },
  "hubHome.aiAgents": { es: "Tu Guía", en: "Your Guide", pt: "Seu Guia", it: "La tua Guida", zh: "你的向导" },
  "landing.features.coach.title": {
    es: "Rowi, tu Guía",
    en: "Rowi, your Guide",
    pt: "Rowi, seu Guia",
    it: "Rowi, la tua Guida",
    zh: "Rowi，你的向导",
  },
  "howItWorksPage.step3.item3": {
    es: "Tu Guía, siempre",
    en: "Your Guide, always",
    pt: "Seu Guia, sempre",
    it: "La tua Guida, sempre",
    zh: "你的向导，始终在线",
  },
  "onboarding.explore.coach": { es: "Tu Guía", en: "Your Guide", pt: "Seu Guia", it: "La tua Guida", zh: "你的向导" },
  "workspace.modules.coach": { es: "Guía", en: "Guide", pt: "Guia", it: "Guida", zh: "向导" },
  "tpHome.coachFeat1": {
    es: "Tu Guía por chat",
    en: "Your Guide via chat",
    pt: "Seu Guia por chat",
    it: "La tua Guida via chat",
    zh: "通过聊天的向导",
  },
};

const LOCALES: Array<keyof Five> = ["es", "en", "pt", "it", "zh"];
const dir = path.join(process.cwd(), "src/lib/i18n/locales");

let changed = 0;
for (const loc of LOCALES) {
  const file = path.join(dir, `${loc}.json`);
  const json = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, string>;
  let n = 0;
  for (const [key, val] of Object.entries(UPDATES)) {
    if (key in json && json[key] !== val[loc]) {
      json[key] = val[loc];
      n++;
    } else if (!(key in json)) {
      json[key] = val[loc];
      n++;
    }
  }
  const sorted: Record<string, string> = {};
  for (const k of Object.keys(json).sort()) sorted[k] = json[k];
  fs.writeFileSync(file, JSON.stringify(sorted, null, 2) + "\n", "utf8");
  console.log(`[h1b] ${loc}: ${n} claves actualizadas`);
  changed += n;
}
console.log(`[h1b] total=${changed}`);
