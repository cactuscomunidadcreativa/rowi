/**
 * H2.A — Claves i18n de la navbar = el viaje (5 fases). Añade/actualiza las
 * etiquetas de fase y los encabezados de grupo del dropdown "Más" en 5 idiomas.
 * Ejecutar: `tsx scripts/h2-navbar-i18n.ts`
 */
import * as fs from "fs";
import * as path from "path";

type Five = { es: string; en: string; pt: string; it: string; zh: string };

const KEYS: Record<string, Five> = {
  // Fases (navbar primaria)
  "navbar.nav.verme": { es: "Verme", en: "See Myself", pt: "Ver-me", it: "Vedermi", zh: "看见自己" },
  "navbar.nav.practicar": { es: "Practicar", en: "Practice", pt: "Praticar", it: "Esercitarmi", zh: "练习" },
  "navbar.nav.conectar": { es: "Conectar", en: "Connect", pt: "Conectar", it: "Connettermi", zh: "连接" },
  "navbar.nav.impacto": { es: "Impacto", en: "Impact", pt: "Impacto", it: "Impatto", zh: "影响" },
  // Encabezados de grupo "Más" (alineados a las fases)
  "navbar.nav.jSee": { es: "Verme", en: "See Myself", pt: "Ver-me", it: "Vedermi", zh: "看见自己" },
  "navbar.nav.jPractice": { es: "Practicar", en: "Practice", pt: "Praticar", it: "Esercitarmi", zh: "练习" },
  "navbar.nav.jConnect": { es: "Conectar", en: "Connect", pt: "Conectar", it: "Connettermi", zh: "连接" },
  "navbar.nav.jImpact": { es: "Impacto", en: "Impact", pt: "Impacto", it: "Impatto", zh: "影响" },
  "navbar.nav.jGuia": { es: "Guía", en: "Guide", pt: "Guia", it: "Guida", zh: "向导" },
  "navbar.nav.jOps": { es: "Cuenta", en: "Account", pt: "Conta", it: "Account", zh: "账户" },
};

const LOCALES: Array<keyof Five> = ["es", "en", "pt", "it", "zh"];
const dir = path.join(process.cwd(), "src/lib/i18n/locales");

let n = 0;
for (const loc of LOCALES) {
  const file = path.join(dir, `${loc}.json`);
  const json = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, string>;
  for (const [key, val] of Object.entries(KEYS)) {
    if (json[key] !== val[loc]) {
      json[key] = val[loc];
      n++;
    }
  }
  const sorted: Record<string, string> = {};
  for (const k of Object.keys(json).sort()) sorted[k] = json[k];
  fs.writeFileSync(file, JSON.stringify(sorted, null, 2) + "\n", "utf8");
}
console.log(`[h2-navbar-i18n] ${n} escrituras (5 idiomas)`);
