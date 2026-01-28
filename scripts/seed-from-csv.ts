// scripts/seed-from-csv.ts
import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "csv-parse/sync";

// Normaliza una clave: minúsculas, sin acentos, sin espacios/guiones
const normalizeKey = (s: string) =>
  s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");

// Convierte string a número tolerante: "65 %", "64,5"
const toNumber = (v: any): number => {
  if (v == null) return NaN;
  const s = String(v).trim();
  if (!s) return NaN;
  const cleaned = s.replace(",", ".").replace(/[^0-9.\-+eE]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
};

const readVal = (row: Record<string, any>, aliases: string[]) => {
  for (const k of Object.keys(row)) {
    const nk = normalizeKey(k);
    for (const a of aliases) {
      if (nk === normalizeKey(a)) return row[k];
    }
  }
  return undefined;
};

const readNum = (row: Record<string, any>, aliases: string[]) => toNumber(readVal(row, aliases));

const FIELD_ALIASES = {
  id: ["ID", "id", "user id", "userid", "identificador", "codigo"],
  owner: ["Owner", "Coach", "owner", "coach"],

  // Nombre: usamos columnas de Six Seconds
  name: ["name", "fullname", "full name", "displayname", "display name", "persona"],
  first: ["Test Taker Name", "first", "firstname", "first_name", "nombre"],
  last:  ["Test Taker Surname", "last", "lastname", "last_name", "apellido"],

  email: ["Email", "email", "mail", "correo", "correo electronico"],
  localeItems: ["Items Language", "items language"],
  locale: ["Language", "locale", "idioma", "language", "lenguaje"],

  // KCG
  K: ["Know Yourself Score", "K", "k", "k score"],
  C: ["Choose Yourself Score", "C", "c", "c score"],
  G: ["Give Yourself Score", "G", "g", "g score"],

  // 8 competencias
  EL: ["Enhance Emotional Literacy Score", "EL", "el", "emotional literacy"],
  RP: ["Recognize Patterns Score", "RP", "rp"],
  ACT: ["Apply Consequential Thinking Score", "ACT", "act"],
  NE: ["Navigate Emotions Score", "NE", "ne"],
  IM: ["Engage Intrinsic Motivation Score", "IM", "im"],
  // Ojo: en el CSV viene “Excercise” (con c extra), lo contemplamos:
  OP: ["Excercise Optimism Score", "Exercise Optimism Score", "OP", "op", "optimism"],
  EMP: ["Increase Empathy Score", "EMP", "emp", "empathy"],
  NG: ["Pursue Noble Goals Score", "NG", "ng", "noble goals"],
} as const;

function requireStr(row: Record<string, any>, aliases: string[], fallback?: string): string {
  const v = readVal(row, aliases);
  const s = String(v ?? "").trim();
  if (s) return s;
  if (fallback !== undefined) return fallback;
  throw new Error(`Campo obligatorio faltante: ${aliases.join(" / ")}`);
}

function requireName(row: Record<string, any>, idx: number): string {
  const direct = readVal(row, FIELD_ALIASES.name);
  if (direct && String(direct).trim()) return String(direct).trim();

  const first = String(readVal(row, FIELD_ALIASES.first) ?? "").trim();
  const last  = String(readVal(row, FIELD_ALIASES.last) ?? "").trim();
  const combo = [first, last].filter(Boolean).join(" ").trim();

  if (combo) return combo;
  throw new Error(`Nombre faltante (fila #${idx + 1}): se esperaban columnas "Test Taker Name" y/o "Test Taker Surname".`);
}

function requireNum(row: Record<string, any>, aliases: string[], fieldLabel: string, idx: number): number {
  const n = readNum(row, aliases);
  if (!Number.isFinite(n)) {
    const sample = Object.fromEntries(Object.entries(row).slice(0, 10));
    throw new Error(`Número inválido en "${fieldLabel}" (fila #${idx + 1}). Muestra fila: ${JSON.stringify(sample)}`);
  }
  return Math.round(n);
}

function mapLocale(s?: string): "es" | "en" | "pt" {
  const raw = String(s ?? "").toLowerCase();
  if (raw.includes("spanish") || raw.includes("es")) return "es";
  if (raw.includes("portuguese") || raw.includes("pt-br") || raw.includes("pt")) return "pt";
  if (raw.includes("english") || raw.includes("en")) return "en";
  return "es";
}

function main() {
  const csvPath = "src/data/seeds/demodatalatam.csv";
  const csv = readFileSync(csvPath, "utf8");

  const rows = parse(csv, {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    trim: true,
    delimiter: [",", ";", "\t"],
  }) as Record<string, any>[];

  if (!rows.length) throw new Error("CSV sin filas (o sin encabezados).");

  // Debug encabezados
  const headerDebug = Object.keys(rows[0]).map((k) => `${k} -> ${normalizeKey(k)}`);
  console.log("Encabezados detectados:", headerDebug);

  const out = rows.map((row, idx) => {
    const id = requireStr(row, FIELD_ALIASES.id, `auto_${idx + 1}`);
    const name = requireName(row, idx);
    const email = requireStr(row, FIELD_ALIASES.email, "");
    const owner = requireStr(row, FIELD_ALIASES.owner, ""); // coach opcional
    const langItems = readVal(row, FIELD_ALIASES.localeItems);
    const lang = readVal(row, FIELD_ALIASES.locale);
    const locale = mapLocale((langItems as string) || (lang as string) || "es");

    const K   = requireNum(row, FIELD_ALIASES.K,   "Know Yourself Score", idx);
    const C   = requireNum(row, FIELD_ALIASES.C,   "Choose Yourself Score", idx);
    const G   = requireNum(row, FIELD_ALIASES.G,   "Give Yourself Score", idx);
    const EL  = requireNum(row, FIELD_ALIASES.EL,  "Enhance Emotional Literacy Score", idx);
    const RP  = requireNum(row, FIELD_ALIASES.RP,  "Recognize Patterns Score", idx);
    const ACT = requireNum(row, FIELD_ALIASES.ACT, "Apply Consequential Thinking Score", idx);
    const NE  = requireNum(row, FIELD_ALIASES.NE,  "Navigate Emotions Score", idx);
    const IM  = requireNum(row, FIELD_ALIASES.IM,  "Engage Intrinsic Motivation Score", idx);
    const OP  = requireNum(row, FIELD_ALIASES.OP,  "Excercise/Exercise Optimism Score", idx);
    const EMP = requireNum(row, FIELD_ALIASES.EMP, "Increase Empathy Score", idx);
    const NG  = requireNum(row, FIELD_ALIASES.NG,  "Pursue Noble Goals Score", idx);

    return {
      id,
      name,
      email: email || undefined,
      owner: owner || undefined,       // guardamos el coach si existe
      locale,
      eq: { K, C, G, EL, RP, ACT, NE, IM, OP, EMP, NG },
    };
  });

  writeFileSync("src/data/seeds/users.json", JSON.stringify(out, null, 2));
  console.log(`OK -> src/data/seeds/users.json (${out.length} perfiles)`);
}

main();