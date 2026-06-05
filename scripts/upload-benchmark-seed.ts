/**
 * Sube los datasets semilla del benchmark a Vercel Blob PRIVADO.
 *
 * Se corre UNA vez (o cuando cambien los datasets) desde una máquina con
 * acceso a `data/seed/` y a BLOB_READ_WRITE_TOKEN. Tras subir, producción los
 * lee vía src/lib/benchmark/seedSource.ts con BENCHMARK_SEED_BLOB_PREFIX.
 *
 * Uso:
 *   BLOB_READ_WRITE_TOKEN=... BENCHMARK_SEED_BLOB_PREFIX=benchmark-seed/ \
 *     pnpm tsx scripts/upload-benchmark-seed.ts
 *
 * IMPORTANTE: access "private" — estos datos NUNCA deben ser públicos.
 */

import fs from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";
import type { SeedDatasetId } from "../src/lib/benchmark/seedSource";

const LOCAL: Record<SeedDatasetId, string> = {
  soh_benchmark_csv: "data/seed/benchmark/SOH_benchmark_data.csv",
  soh_merged_xlsx: "data/seed/benchmark/SOH_2018-2024_merged_anonymized_full.xlsx",
  tp_assessments_xlsx: "data/seed/imports/TP_all_assessments_2026-01-22.xlsx",
  be2grow_csv: "data/seed/imports/be2growplaning.csv",
};

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const prefix = process.env.BENCHMARK_SEED_BLOB_PREFIX?.trim();
  if (!token) throw new Error("Falta BLOB_READ_WRITE_TOKEN");
  if (!prefix) throw new Error("Falta BENCHMARK_SEED_BLOB_PREFIX (ej. benchmark-seed/)");
  const pfx = prefix.replace(/\/?$/, "/");

  for (const [id, rel] of Object.entries(LOCAL) as [SeedDatasetId, string][]) {
    const file = path.join(process.cwd(), rel);
    if (!fs.existsSync(file)) {
      console.warn(`⚠️  saltado (no existe local): ${rel}`);
      continue;
    }
    const size = (fs.statSync(file).size / 1024 / 1024).toFixed(1);
    console.log(`📤 subiendo ${id} (${size}MB) → ${pfx}${id}`);
    const blob = await put(`${pfx}${id}`, fs.createReadStream(file), {
      access: "public" as const, // NOTA: ver advertencia abajo
      addRandomSuffix: false,
      token,
      allowOverwrite: true,
    });
    console.log(`   ✅ ${blob.url}`);
  }

  console.warn(
    "\n⚠️  ADVERTENCIA: @vercel/blob v2 solo soporta access 'public' (URL no " +
      "adivinable pero accesible si se filtra el enlace). Para privacidad real " +
      "evalúa un bucket S3/R2 privado con URLs firmadas. Mientras tanto, NO " +
      "publiques estas URLs y mantén el pathname (prefix+id) fuera de logs/clientes.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
