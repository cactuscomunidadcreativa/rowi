/**
 * Benchmark seed source — resolución privada de los datasets que SIEMBRAN
 * el benchmark / Rowiverse (SOH 2018-2024, imports SEI crudos, etc.).
 *
 * CONTEXTO DE SEGURIDAD:
 * Estos datasets vivían en `public/` y eran descargables sin auth desde
 * https://www.rowiia.com/SOH_benchmark_data.csv — fuga de nuestro activo de
 * datos más valioso. Se movieron a almacenamiento privado. Este módulo es el
 * ÚNICO punto de acceso a ellos: nunca vuelven a `public/`.
 *
 * Resolución (en orden):
 *   1. Vercel Blob privado  — si BENCHMARK_SEED_BLOB_PREFIX está configurado
 *      (producción / CI). Requiere BLOB_READ_WRITE_TOKEN.
 *   2. Copia local privada  — `data/seed/...` (gitignored). Para desarrollo
 *      y para el script de subida inicial a Blob.
 *
 * NUNCA leer estos archivos vía fetch a una URL pública ni servirlos por HTTP.
 */

import fs from "node:fs";
import path from "node:path";
import { head } from "@vercel/blob";

/** Identificadores estables de cada dataset semilla. */
export type SeedDatasetId =
  | "soh_benchmark_csv"
  | "soh_merged_xlsx"
  | "tp_assessments_xlsx"
  | "be2grow_csv";

/** Mapa id → ruta relativa dentro de `data/seed/` (copia local privada). */
const LOCAL_PATHS: Record<SeedDatasetId, string> = {
  soh_benchmark_csv: "data/seed/benchmark/SOH_benchmark_data.csv",
  soh_merged_xlsx: "data/seed/benchmark/SOH_2018-2024_merged_anonymized_full.xlsx",
  tp_assessments_xlsx: "data/seed/imports/TP_all_assessments_2026-01-22.xlsx",
  be2grow_csv: "data/seed/imports/be2growplaning.csv",
};

/**
 * Prefijo (pathname) bajo el que viven los blobs privados de semilla.
 * Ej. "benchmark-seed/" → blob "benchmark-seed/soh_benchmark_csv".
 * Si no está seteado, se usa solo la copia local.
 */
function blobPrefix(): string | null {
  const p = process.env.BENCHMARK_SEED_BLOB_PREFIX?.trim();
  return p ? p.replace(/\/?$/, "/") : null;
}

function localPath(id: SeedDatasetId): string {
  return path.join(process.cwd(), LOCAL_PATHS[id]);
}

/**
 * Devuelve un stream/buffer del dataset semilla.
 *
 * En producción (con BENCHMARK_SEED_BLOB_PREFIX) descarga el blob privado.
 * En local lee el archivo de `data/seed/`. Lanza si no encuentra ninguno —
 * fail-closed, nunca cae silenciosamente a una fuente pública.
 */
export async function readSeedDataset(id: SeedDatasetId): Promise<Buffer> {
  const prefix = blobPrefix();

  if (prefix) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      throw new Error(
        `[benchmark/seed] BENCHMARK_SEED_BLOB_PREFIX está seteado pero falta ` +
          `BLOB_READ_WRITE_TOKEN. No leo de fuente pública por seguridad.`,
      );
    }
    // `head` resuelve la URL firmada del blob privado; luego se descarga.
    const meta = await head(`${prefix}${id}`, { token });
    const res = await fetch(meta.url);
    if (!res.ok) {
      throw new Error(
        `[benchmark/seed] no pude descargar blob "${prefix}${id}": ${res.status}`,
      );
    }
    return Buffer.from(await res.arrayBuffer());
  }

  const file = localPath(id);
  if (!fs.existsSync(file)) {
    throw new Error(
      `[benchmark/seed] dataset "${id}" no está en Blob (sin ` +
        `BENCHMARK_SEED_BLOB_PREFIX) ni localmente en ${file}. ` +
        `Descárgalo de almacenamiento privado a data/seed/ o configura el Blob.`,
    );
  }
  return fs.readFileSync(file);
}

/** Lee un dataset de texto (CSV) ya decodificado y sin BOM. */
export async function readSeedText(id: SeedDatasetId): Promise<string> {
  const buf = await readSeedDataset(id);
  return buf.toString("utf8").replace(/^﻿/, "");
}

/** ¿Tenemos acceso (Blob o local) a este dataset? Útil para guards de scripts. */
export function seedDatasetAvailable(id: SeedDatasetId): boolean {
  if (blobPrefix()) return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  return fs.existsSync(localPath(id));
}
