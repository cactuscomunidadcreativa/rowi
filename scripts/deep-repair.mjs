#!/usr/bin/env node
// apps/rowi/scripts/deep-repair.mjs
// Auditoría profunda: IA + i18n + Prisma + Endpoints + Rutas con params

import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";
import { spawn } from "node:child_process";

// ──────────────────────────────────────────────────────────────
// Utilidades de consola (colores seguros)
// ──────────────────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m",
  gray: "\x1b[90m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};
const ok = (s) => `${c.green}✔${c.reset} ${s}`;
const warn = (s) => `${c.yellow}⚠${c.reset} ${s}`;
const err = (s) => `${c.red}✖${c.reset} ${s}`;
const info = (s) => `${c.cyan}ℹ${c.reset} ${s}`;
const dim = (s) => `${c.gray}${s}${c.reset}`;

// ──────────────────────────────────────────────────────────────
// Paths / entorno
// ──────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");             // apps/rowi
const repoRoot = path.resolve(appRoot, "..", "..");        // monorepo
const backupsDir = path.join(appRoot, ".backups");
const nowIso = new Date().toISOString().replace(/[:.]/g, "-");
const reportPath = path.join(backupsDir, `deep-repair-${nowIso}.json`);

// Carga .env (simple parser, sin dependencias)
function applyEnvFile(p) {
  if (!fs.existsSync(p)) return;
  const raw = fs.readFileSync(p, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2] || "";
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}
applyEnvFile(path.join(repoRoot, ".env"));
applyEnvFile(path.join(appRoot, ".env"));

// Base URL
const BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ──────────────────────────────────────────────────────────────
async function safeImportPrisma() {
  try {
    const { PrismaClient } = await import(pathToModule("@prisma/client"));
    return new PrismaClient();
  } catch (e) {
    return null;
  }
}

// Resolver paquetes desde el monorepo
function pathToModule(mod) {
  // intenta resolver desde root node_modules
  return mod;
}

// Small helper to run shell commands and capture output
async function run(cmd, args = [], cwd = repoRoot) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, shell: false });
    let out = "", errOut = "";
    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (errOut += d.toString()));
    child.on("close", (code) => resolve({ code, out, err: errOut }));
  });
}

// HTTP helper
async function ping(url, opts = {}) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { cache: "no-store", ...opts });
    const ms = Date.now() - t0;
    let body = "";
    try { body = await r.text(); } catch {}
    return { ok: r.ok, status: r.status, ms, body };
  } catch (e) {
    return { ok: false, status: 0, ms: Date.now() - t0, body: String(e) };
  }
}

// ──────────────────────────────────────────────────────────────
// Checks
// ──────────────────────────────────────────────────────────────
async function checkNodeModulesDup() {
  const suspicious = [];
  const nested = path.join(appRoot, "apps", "rowi");
  if (fs.existsSync(nested)) suspicious.push("apps/rowi/apps/rowi detectado (ruta duplicada)");
  return suspicious;
}

async function checkNextCache() {
  const nextDir = path.join(appRoot, ".next");
  return fs.existsSync(nextDir) ? "present" : "missing";
}

async function checkPrisma(prisma) {
  if (!prisma) {
    return { ok: false, reason: "No se pudo importar @prisma/client" };
  }
  try {
    const system = await prisma.system.findFirst();
    const agents = await prisma.agentConfig.count();
    const translations = await prisma.translation.count();
    return {
      ok: true,
      systemPresent: !!system,
      agents,
      translations,
    };
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
}

async function checkTranslations(prisma) {
  const res = {
    ok: false,
    langs: {},
    samples: {},
    missingCritical: [],
  };
  try {
    const rows = await prisma.translation.findMany({
      select: { ns: true, key: true, lang: true, value: true, tenantId: true, systemId: true },
      take: 2000,
    });
    const langs = {};
    for (const r of rows) {
      const l = r.lang || "es";
      langs[l] = (langs[l] || 0) + 1;
    }
    res.langs = langs;

    // claves críticas para navegación
    const criticalKeys = [
      ["ui", "nav.dashboard"],
      ["ui", "nav.community"],
      ["ui", "nav.affinity"],
      ["ui", "nav.eco"],
      ["ui", "nav.rowicoach"],
      ["ui", "nav.signin"],
      ["ui", "nav.signout"],
    ];
    for (const [ns, key] of criticalKeys) {
      const has = rows.find((r) => r.ns === ns && r.key === key && r.value);
      if (!has) res.missingCritical.push(`${ns}.${key}`);
    }

    res.samples = rows.slice(0, 10);
    res.ok = true;
    return res;
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function checkIA(prisma) {
  const out = { ok: false, globalAgents: 0, canTalk: false, probeStatus: null, error: null };
  try {
    const globalAgents = await prisma.agentConfig.count({
      where: { tenantId: null, superHubId: null, organizationId: null, isActive: true },
    });
    out.globalAgents = globalAgents;

    // Probar /api/rowi con saludo
    const probe = await ping(`${BASE}/api/rowi`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: "es" }),
    });
    out.probeStatus = { status: probe.status, ok: probe.ok, ms: probe.ms };
    out.canTalk = probe.ok;
    out.ok = globalAgents > 0 && probe.ok;
    return out;
  } catch (e) {
    out.error = String(e);
    return out;
  }
}

async function checkRuntimeEndpoints() {
  const endpoints = [
    "/api/hub/translations?format=list",
    "/api/hub/translations/ui",
    "/api/hub/system-health",
  ];
  const results = {};
  for (const ep of endpoints) {
    results[ep] = await ping(`${BASE}${ep}`);
  }
  return results;
}

async function scanParamPromises() {
  // Buscar rutas que usan `context: { params: Promise<...> }` (Next 15 tipo)
  const apiDir = path.join(appRoot, "src", "app", "api");
  const offenders = [];
  async function walk(d) {
    let entries = [];
    try { entries = await fsp.readdir(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.isFile() && e.name === "route.ts") {
        const src = await fsp.readFile(full, "utf8").catch(() => "");
        if (src.includes("params: Promise<{")) offenders.push(full.replace(appRoot + path.sep, ""));
      }
    }
  }
  await walk(apiDir);
  return offenders;
}

// ──────────────────────────────────────────────────────────────
// Orquestación
// ──────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🧠 " + info("Auditoría profunda Rowi — IA + i18n + Prisma + Runtime") + "\n");

  // carpetas útiles
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

  // 1) baliza de estructura
  const dup = await checkNodeModulesDup();
  const nextCache = await checkNextCache();

  // 2) prisma & db
  const prisma = await safeImportPrisma();
  const pRes = await checkPrisma(prisma);

  // 3) i18n
  const i18nRes = prisma ? await checkTranslations(prisma) : { ok: false, error: "sin prisma" };

  // 4) IA
  const iaRes = prisma ? await checkIA(prisma) : { ok: false, error: "sin prisma" };

  // 5) endpoints
  const epRes = await checkRuntimeEndpoints();

  // 6) rutas con params como Promise
  const paramOff = await scanParamPromises();

  // 7) tsc --noEmit para snapshot (opcional, no bloquea)
  const tsc = await run("pnpm", ["tsc", "--noEmit"]);

  // armar reporte
  const report = {
    date: new Date().toISOString(),
    baseUrl: BASE,
    env: {
      NODE_ENV: process.env.NODE_ENV || null,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || null,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      DATABASE_URL: !!process.env.DATABASE_URL,
    },
    structure: {
      nestedAppFolder: dup,
      nextCache,
    },
    prisma: pRes,
    i18n: i18nRes,
    ia: iaRes,
    endpoints: epRes,
    nextParamPromiseRoutes: paramOff,
    tsc: {
      code: tsc.code,
      out: tsc.out,
      err: tsc.err,
    },
    hints: buildHints({ dup, nextCache, pRes, i18nRes, iaRes, epRes, paramOff, tsc }),
  };

  // guardar
  await fsp.writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");

  // stdout amigable
  console.log(ok("Reporte generado: ") + reportPath + "\n");

  // resumen útil en consola
  printSummary(report);

  if (prisma) await prisma.$disconnect();
}

function buildHints({ dup, nextCache, pRes, i18nRes, iaRes, epRes, paramOff, tsc }) {
  const hints = [];

  if (dup.length) {
    hints.push("Hay rutas duplicadas (apps/rowi/apps/rowi). Mueve/borra ese anidado para evitar imports rotos.");
  }
  if (nextCache === "present") {
    hints.push("Limpia cache Next.js: `rm -rf apps/rowi/.next` y reinstala módulos: `pnpm install`.");
  }
  if (!pRes?.ok) {
    hints.push("Prisma no responde: verifica DATABASE_URL y corre `pnpm prisma generate && pnpm prisma migrate deploy`.");
  } else {
    if (!pRes.systemPresent) hints.push("No existe System root. Ejecuta tu bootstrap: ensureSystemBootstrap.ts.");
    if (pRes.agents === 0) hints.push("No hay agentes IA globales activos. Corre ensureBaseAgents / sync de agentes.");
    if (pRes.translations === 0) hints.push("No hay traducciones. Corre ensureTranslations o importa CSV.");
  }
  if (!i18nRes?.ok || i18nRes.missingCritical?.length) {
    hints.push(`Faltan claves críticas i18n: ${i18nRes.missingCritical?.join(", ") || "—"}. Revisa /api/hub/translations.`);
  }
  if (!iaRes?.ok) {
    hints.push("IA no operativa: verifica OPENAI_API_KEY y el endpoint /api/rowi.");
  }
  for (const [ep, r] of Object.entries(epRes || {})) {
    if (!r.ok) hints.push(`Endpoint caído: ${ep} (status ${r.status})`);
  }
  if (paramOff?.length) {
    hints.push(`Rutas con params como Promise<> detectadas: ${paramOff.length}. Alinea a Next 15 (usar \`{ params: { ... } }\`).`);
  }
  if (tsc.code !== 0) {
    hints.push("TypeScript con errores. Revisa el reporte para clasificar (auth, i18n, prisma, openai, etc.).");
  }
  return hints;
}

function printSummary(r) {
  console.log("📊 " + info("Resumen"));

  console.log("• Prisma: " + (r.prisma?.ok ? c.green + "OK" : c.red + "FAIL") + c.reset);
  console.log("  - System: " + (r.prisma?.systemPresent ? "sí" : "no"));
  console.log("  - Agents: " + (r.prisma?.agents ?? "—"));
  console.log("  - Translations: " + (r.prisma?.translations ?? "—"));

  console.log("• i18n: " + (r.i18n?.ok ? c.green + "OK" : c.red + "FAIL") + c.reset);
  if (r.i18n?.langs) console.log("  - Langs: " + JSON.stringify(r.i18n.langs));
  if (r.i18n?.missingCritical?.length) console.log("  - Faltan: " + r.i18n.missingCritical.join(", "));

  console.log("• IA: " + (r.ia?.ok ? c.green + "OK" : c.red + "FAIL") + c.reset);
  console.log("  - Agentes globales: " + (r.ia?.globalAgents ?? "—"));
  console.log("  - /api/rowi: " + (r.ia?.probeStatus?.status ?? "—") + " (" + (r.ia?.probeStatus?.ms ?? "—") + "ms)");

  console.log("• Endpoints:");
  for (const [ep, s] of Object.entries(r.endpoints || {})) {
    const tag = s.ok ? ok(ep) : err(ep);
    console.log("  - " + tag + dim(`  [${s.status}] ${s.ms}ms`));
  }

  console.log("• Rutas con params Promise<>: " + (r.nextParamPromiseRoutes?.length || 0));
  if (r.nextParamPromiseRoutes?.length) {
    r.nextParamPromiseRoutes.slice(0, 5).forEach((p) => console.log("  - " + p));
    if (r.nextParamPromiseRoutes.length > 5) console.log("  ... +" + (r.nextParamPromiseRoutes.length - 5));
  }

  console.log("• TypeScript: " + (r.tsc?.code === 0 ? c.green + "OK" : c.red + "FAIL") + c.reset);
  console.log("\n🧩 " + info("Sugerencias rápidas:"));
  r.hints.forEach((h) => console.log("  - " + h));
  console.log();
}

// run
main().catch((e) => {
  console.error(err("Fallo auditoría: " + (e?.stack || e)));
  process.exit(1);
});