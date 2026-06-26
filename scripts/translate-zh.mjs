// Traduce en.json → zh.json en lotes, usando el glosario Six Seconds como referencia.
// Reanudable: conserva lo ya traducido en zh.json. Token-capped por lote.
// Uso: node scripts/translate-zh.mjs [batchSize]
import fs from "fs";
import OpenAI from "openai";
import "dotenv/config";

const DIR = "src/lib/i18n/locales";
const en = JSON.parse(fs.readFileSync(`${DIR}/en.json`, "utf8"));
const zhPath = `${DIR}/zh.json`;
const zh = fs.existsSync(zhPath) ? JSON.parse(fs.readFileSync(zhPath, "utf8")) : {};
const glossary = JSON.parse(fs.readFileSync("/tmp/zh_glossary.json", "utf8"));

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const BATCH = parseInt(process.argv[2] || "40", 10);

// claves pendientes (sin traducir aún)
const pending = Object.keys(en).filter((k) => !zh[k] && typeof en[k] === "string" && en[k].trim());
console.log(`Total claves: ${Object.keys(en).length} · ya traducidas: ${Object.keys(zh).length} · pendientes: ${pending.length}`);

// glosario compacto para el prompt (solo términos relevantes, recortado)
const glossPairs = Object.entries(glossary).slice(0, 120).map(([e, z]) => `${e} = ${z}`).join("\n");

const SYSTEM = `You are a professional EN→Simplified-Chinese (zh-CN) translator for an emotional-intelligence learning platform built on the Six Seconds model.
Rules:
- Translate UI strings naturally for mainland China (zh-CN).
- Keep placeholders EXACTLY as-is: {{var}}, %s, {0}, \\n, HTML tags.
- Do NOT translate brand names: Rowi, Six Seconds, SEI, ECO, Affinity.
- Use this validated Six Seconds glossary where terms appear:
${glossPairs}
- Return ONLY a JSON object mapping each input key to its Chinese translation. No prose.`;

async function translateBatch(keys) {
  const payload = Object.fromEntries(keys.map((k) => [k, en[k]]));
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 4000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: JSON.stringify(payload) },
    ],
  });
  return JSON.parse(res.choices[0].message.content);
}

let done = 0;
for (let i = 0; i < pending.length; i += BATCH) {
  const keys = pending.slice(i, i + BATCH);
  try {
    const out = await translateBatch(keys);
    for (const k of keys) if (out[k]) zh[k] = out[k];
    done += keys.length;
    fs.writeFileSync(zhPath, JSON.stringify(zh, null, 2) + "\n");
    process.stdout.write(`\r  traducidas ${Object.keys(zh).length}/${Object.keys(en).length} (lote ${i / BATCH + 1})   `);
  } catch (e) {
    console.error(`\n  ⚠ error en lote ${i / BATCH + 1}: ${e.message} — reintentando una vez`);
    try {
      const out = await translateBatch(keys);
      for (const k of keys) if (out[k]) zh[k] = out[k];
      fs.writeFileSync(zhPath, JSON.stringify(zh, null, 2) + "\n");
    } catch (e2) {
      console.error(`  ✗ lote ${i / BATCH + 1} falló de nuevo, se salta: ${e2.message}`);
    }
  }
}
console.log(`\n✓ Listo. zh.json tiene ${Object.keys(zh).length} claves.`);
