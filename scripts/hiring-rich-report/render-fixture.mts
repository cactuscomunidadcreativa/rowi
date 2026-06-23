/**
 * Smoke runner: renderiza el reporte rico TS contra el fixture dorado y escribe
 * un PDF, para verificar la maqueta contra ROWI_REPORTE_FULL_RECRUTAMENTO_BDP.pdf.
 *
 *   TSX_TSCONFIG_PATH=./tsconfig.json pnpm exec tsx \
 *     scripts/hiring-rich-report/render-fixture.mts [lang] [out.pdf]
 *
 * NOTA tsx: agrupa los exports nombrados bajo `default`; por eso se importa el
 * módulo entero y se lee (mod as any).buildReporteFullHiring.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import mod from "@/lib/deliverables/reporte-full-hiring";
import type { HiringReportData } from "@/lib/deliverables/reporte-full-hiring";

const lang = (process.argv[2] as "es" | "pt" | "en") || "es";
const out = process.argv[3] || `/tmp/rowi-hiring-rich-${lang}.pdf`;

async function main() {
  const fixturePath = path.join(process.cwd(), "scripts/hiring-rich-report/fixture-bdp.json");
  const data = JSON.parse(await readFile(fixturePath, "utf8")) as HiringReportData;

  let owl: Buffer | undefined;
  try {
    owl = await readFile(path.join(process.cwd(), "public", "owl.png"));
  } catch {
    owl = undefined;
  }

  const build = (mod as unknown as {
    buildReporteFullHiring: (d: HiringReportData, l: "es" | "pt" | "en", owl?: Buffer) => Promise<Buffer>;
  }).buildReporteFullHiring;

  const buf = await build(data, lang, owl);
  await writeFile(out, buf);
  console.log("OK", out, "·", buf.length, "bytes");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
