/** H3 — claves i18n del surfacing de Practice (gancho TODAY + label scenarios). */
import * as fs from "fs";
import * as path from "path";

type Five = { es: string; en: string; pt: string; it: string; zh: string };

const KEYS: Record<string, Five> = {
  "today.practice.rehearse": {
    es: "Ensayar una conversación",
    en: "Rehearse a conversation",
    pt: "Ensaiar uma conversa",
    it: "Prova una conversazione",
    zh: "排练一段对话",
  },
  "admin.nav.practiceScenarios": {
    es: "Banco de escenarios (Practice)",
    en: "Scenario bank (Practice)",
    pt: "Banco de cenários (Practice)",
    it: "Banca scenari (Practice)",
    zh: "练习场景库",
  },
};

const LOCALES: Array<keyof Five> = ["es", "en", "pt", "it", "zh"];
const dir = path.join(process.cwd(), "src/lib/i18n/locales");
let n = 0;
for (const loc of LOCALES) {
  const file = path.join(dir, `${loc}.json`);
  const json = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, string>;
  for (const [key, val] of Object.entries(KEYS)) {
    if (json[key] !== val[loc]) { json[key] = val[loc]; n++; }
  }
  const sorted: Record<string, string> = {};
  for (const k of Object.keys(json).sort()) sorted[k] = json[k];
  fs.writeFileSync(file, JSON.stringify(sorted, null, 2) + "\n", "utf8");
}
console.log(`[h3-i18n] ${n} escrituras`);
