/** H2b — claves i18n de los 8 dominios del admin (auditoría v2). 5 idiomas. */
import * as fs from "fs";
import * as path from "path";

type Five = { es: string; en: string; pt: string; it: string; zh: string };

const KEYS: Record<string, Five> = {
  "admin.domain.resumen": { es: "Resumen", en: "Overview", pt: "Resumo", it: "Riepilogo", zh: "概览" },
  "admin.domain.personas": { es: "Personas", en: "People", pt: "Pessoas", it: "Persone", zh: "人员" },
  "admin.domain.viaje": { es: "El Viaje", en: "The Journey", pt: "A Jornada", it: "Il Viaggio", zh: "旅程" },
  "admin.domain.guiaIA": { es: "Guía & IA", en: "Guide & AI", pt: "Guia & IA", it: "Guida & IA", zh: "向导与 AI" },
  "admin.domain.workspaces": { es: "Workspaces", en: "Workspaces", pt: "Workspaces", it: "Workspaces", zh: "工作区" },
  "admin.domain.contenido": { es: "Contenido", en: "Content", pt: "Conteúdo", it: "Contenuti", zh: "内容" },
  "admin.domain.negocio": { es: "Negocio", en: "Business", pt: "Negócio", it: "Business", zh: "业务" },
  "admin.domain.plataforma": { es: "Plataforma", en: "Platform", pt: "Plataforma", it: "Piattaforma", zh: "平台" },
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
console.log(`[h2b-domains-i18n] ${n} escrituras`);
