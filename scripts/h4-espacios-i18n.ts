/**
 * H4 — reencuadre "Workspace" → "Espacio" (Rowiverse → Espacio → Persona).
 * Solo cambia el LENGUAJE de cara al usuario; rutas y modelos siguen igual.
 */
import * as fs from "fs";
import * as path from "path";

type Five = { es: string; en: string; pt: string; it: string; zh: string };

const KEYS: Record<string, Five> = {
  "workspace.list.title": {
    es: "Tus Espacios",
    en: "Your Spaces",
    pt: "Seus Espaços",
    it: "I tuoi Spazi",
    zh: "你的空间",
  },
  "workspace.list.subtitle": {
    es: "Un Espacio es un cliente, empresa, equipo o comunidad. Aquí los creas y los acompañas con la Guía y Vital Signs.",
    en: "A Space is a client, company, team or community. Here you create them and support them with the Guide and Vital Signs.",
    pt: "Um Espaço é um cliente, empresa, equipe ou comunidade. Aqui você os cria e acompanha com o Guia e os Vital Signs.",
    it: "Uno Spazio è un cliente, azienda, team o comunità. Qui li crei e li accompagni con la Guida e i Vital Signs.",
    zh: "空间可以是客户、公司、团队或社区。在这里创建它们，并用向导和 Vital Signs 陪伴它们。",
  },
  "workspace.nav.new": {
    es: "Nuevo Espacio",
    en: "New Space",
    pt: "Novo Espaço",
    it: "Nuovo Spazio",
    zh: "新建空间",
  },
  "workspace.list.createFirst": {
    es: "Crear tu primer Espacio",
    en: "Create your first Space",
    pt: "Criar seu primeiro Espaço",
    it: "Crea il tuo primo Spazio",
    zh: "创建你的第一个空间",
  },
  // Encabezado conceptual de los 3 niveles (Rowiverse → Espacio → Persona).
  "espacios.levels": {
    es: "Rowiverse → Espacio → Persona",
    en: "Rowiverse → Space → Person",
    pt: "Rowiverse → Espaço → Pessoa",
    it: "Rowiverse → Spazio → Persona",
    zh: "Rowiverse → 空间 → 个人",
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
console.log(`[h4-espacios-i18n] ${n} escrituras`);
