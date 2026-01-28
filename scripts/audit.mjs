// File: apps/rowi/scripts/audit.mjs
// Run: node --env-file=./apps/rowi/.env apps/rowi/scripts/audit.mjs --base http://localhost:3000 --cookie "next-auth.session-token=..." 
// Node 18+ required (you have Node v22). No external deps required.

import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectDir = path.resolve(__dirname, '..');           // apps/rowi/
process.chdir(projectDir);

// ---- CLI Args ----
const args = process.argv.slice(2);
const argMap = Object.fromEntries(
  args.flatMap((a) => {
    const [k, v] = a.split('=');
    if (!k.startsWith('--')) return [];
    return [[k.replace(/^--/, ''), v === undefined ? true : v]];
  })
);
const baseUrl = argMap.base || null;      // e.g. http://localhost:3000
const cookie = argMap.cookie || null;

// ---- Colors ----
const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  ok: (s) => `\x1b[32m${s}\x1b[0m`,
  warn: (s) => `\x1b[33m${s}\xb[0m`,
  err: (s) => `\x1b[31m${s}\x1b[0m`,
  info: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

// ---- Helpers ----
async function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { stdio: 'pipe', ...opts });
    let out = '';
    let err = '';
    p.stdout.on('data', (d) => (out += d.toString()));
    p.stderr.on('data', (d) => (err += d.toString()));
    p.on('close', (code) => resolve({ code, out, err }));
  });
}

async function readJSON(p) {
  try {
    const t = await fs.readFile(p, 'utf8');
    return JSON.parse(t);
  } catch {
    return null;
  }
}

async function walkDir(dir, filterFn = null) {
  const out = [];
  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(current, e.name);
      if (e.isDirectory()) {
        if (!['node_modules', '.next', 'dist', '.turbo', 'build'].includes(e.name)) {
          await walk(full);
        }
      } else {
        if (!filterFn || filterFn(full)) out.push(full);
      }
    }
  }
  await walk(dir);
  return out;
}

// ---- 0) Basic info ----
console.log(c.bold(`\n🔎 Rowi Audit — ${new Date().toISOString()}`));
const pkg = await readJSON(path.join(projectDir, 'package.json'));
console.log(`${c.info('Project')}: ${pkg?.name || '(unknown)'}  ${c.dim(`v${pkg?.version || ''}`)}`);
console.log(`${c.info('Node')}: ${process.version}`);
const rowiSrc = path.join(projectDir, 'src');
if (!fssync.existsSync(rowiSrc)) {
  console.error(c.err(`No se encontró ${rowiSrc}. Asegúrate de estar en apps/rowi/`));
  process.exit(1);
}

// ---- 1) Check ENV ----
console.log(`\n${c.bold('1) Verificando variables de entorno (.env)')}`);
const required = ['DATABASE', 'DATABASE_URL','NEXTAUTH_SECRET','NEXT_PUBLIC_APP_URL'];
const optional = ['OPENAI_API_KEY','RESEND_API_KEY'];

const present = {};
for (const key of [...required, ...optional]) {
  const val = process.env[key];
  const ok = !!(val && !/^\s*$/.test(val) && !/^(your_|changeme|placeholder)/i.test(val || ''));
  present[key] = ok ? 'OK' : 'MISSING';
}
for (const k of required) {
  console.log(`  ${k.padEnd(22)}: ${present[k] === 'OK' ? c.ok('OK') : c.err('❌ FALTA')}`);
}
for (const k of optional) {
  console.log(`  ${k.padEnd(22)}: ${present[k] === 'OK' ? c.ok('OK') : c.warn('⚠️ faltante (opcional)')}`);
}

if (present.DATABASE_URL !== 'OK') {
  console.error(c.err('  → DATABASE_URL falta o está vacío. Sin esto no se puede conectar a Postgres.'));
}
if (present.NEXTAUTH_SECRET !== 'OK') {
  console.error(c.warn('  → Falta NEXTAUTH_SECRET. La auth puede no funcionar.'));
}
if (present.OPENAI_OPTIONAL && present.OPENAI_API_KEY !== 'OK') {
  console.warn(c.warn('  → No hay OPENAI_API_KEY; la IA no funcionará.'));
}

// ---- 2) Prisma & DB connectivity ----
console.log(`\n${c.bold('2) Verificando Prisma & BD')}`);

let prismaOK = false;
let prisma;
try {
  // Import @prisma/client from this workspace
  const { PrismaClient } = await import(path.join(process.cwd(), 'node_modules/@prisma/client/index.js'));
  prisma = new PrismaClient();
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1+1 AS result`;
  prismaOK = true;
  console.log(c.ok('  Conexión a DB: OK'));
} catch (e) {
  console.error(c.err('  Conexión a DB: ERROR'), e.message || e);
}

if (prismaOK) {
    try {
      const [users, tenants, superHubs, agents, contexts, translations] = await Promise.all([
        prisma.user.count(),
        prisma.tenant.count().catch(()=>0),
        prisma.superHub.count().catch(()=>0),
        prisma.agentConfig.count().catch(()=>0),
        prisma.agentContext?.count?.().catch(()=>0) ?? 0,
        prisma.translation?.count?.().catch(()=>0) ?? 0,
      ]);
      console.log(`  Tablas clave: users=${users}, tenants=${tenants}, superHubs=${superHubs}, agents=${agents}, agentContexts=${contexts}, translations=${translations}`);
    } catch (e) {
      console.error(c.err('  Error consultando tablas clave:'), e.message || e);
    }

    // prisma validate/migrate status (optional)
    try {
      const { code, out } = await run('npx', ['-y', 'prisma@latest', 'validate', '--schema', 'prisma/schema.prisma']);
      if (code === 0) {
        console.log(c.ok('  prisma validate: OK')));
      } else {
        console.log(c.err('  prisma validate: ERROR'));
        console.log(c.dim(out));
      }
    } catch (e) {
      console.log(c.warn('  (No se pudo ejecutar prisma validate desde script; puedes correrlo manualmente: `pnpm -F @app/rowi prisma validate`)'));
    }
}

// ---- 3) Auditoría de rutas API: JSX / wrong files in `app/api/**/route.ts` ----
console.log(`\n${c.bold('3) Auditando rutas API (JSX/uso indebido)')}`);
const apiDir = path.join(projectDir, 'src', 'app');
const apiRouteFiles = (await walkDir(apiDir, (f) => /\/api\/.*\/route\.(t|j)sx?$/.test(f))) || [];
if (apiRouteFiles.length === 0) {
  console.log(c.warn('  No se encontraron archivos route.ts/route.js en app/api/** — ¿estructura distinta?'));
} else {
  let issues = 0;
  for (const file of apiRouteFiles) {
    const code = await fs.readFile(file, 'utf8');
    const hasClientDirective = /['"]use client['"]/.test(code);
    const hasJSX = /<\s*[A-Za-z][\w:-]*(\s|>)/m.test(code);
    const importsReact = /from\s+['"]react['"]/.test(code);
    if (hasClientDirective || hasJSX || imports ReactInApi(code)) {
      issues++;
      console.log(c.warn(`  ⚠️ ${file.replace(projectDir + '/', '')}`));
      if (hasClientDirective) console.log(c.dim('     → contiene "use client" (las rutas /api/* deben ser server-only)'));
      if (importsReact) console.log(c.dim('     → importa React/Componentes en un route.ts (esto rompe el build: "Expected \'>\' got \'className\'")'));
      if (hasJSX) console.log(c.dim('     → detectado JSX en un endpoint /api (mover este componente a un page.tsx o componente en /components)'));
    }
  }
  if (issues === 0) console.log(c.ok('  OK: sin JSX ni "use client" en routes'));
}

// ---- 4) Auditoría de traducciones: claves usadas vs DB ----
console.log(`\n${c.bold('4) Analizando claves de traducción (t("…")) vs DB')}`);

// 4a) Extraer claves desde el código
const srcFiles = await walkDir(path.join(projectDir, 'src'), (f) => /\.(tsx?|js|jsx)$/.test(f));
const keyRe = /\bt\s*\(\s*['"`]([^'"`]+)['"`]/g; // matches t('ns.key') / t("ns.key")
const codeKeys = new Set();
for (const f of srcFiles) {
  const txt = await fs.readFile(f, 'utf8');
  let m;
  while ((m = keyRe.exec(txt))) {
    if (m[1]) codeKeys.add(m[1]);
  }
}
console.log(`  Claves detectadas en código: ${codeKeys.size}`);

// 4b) Leer claves desde DB (System scope + opcional tenant)
let dbKeysSystem = new Set();
let dbKeysTenant = new Set();
if (prismaOK && prisma?.translation) {
  try {
    const sysRows = await prisma.translation.findMany({
      where: { superHubId: null, tenantId: null, organizationId: null },
      select: { ns: true, key: true },
      take: 50000,
    });
    dbKeysSystem = new Set(sysRows.map((r) => `${r.ns}.${r.key}`));
    console.log(`  Claves en DB (System): ${dbKeysSystem.size}`);
  } catch (e) {
    console.log(c.warn(`  No se pudieron leer translations System: ${e.message || e}`));
  }
  if (process.env.DEFAULT_TENANT_ID) {
    try {
      const tenantRows = await prisma.translation.findMany({
        where: { tenantId: process.env.DEFAULT_TENANT_ID },
        select: { ns: true, key: true },
        take: 50000,
      });
      dbKeysTenant = new Set(tenantRows.map((r) => `${r.ns}.${r.key}`));
      console.log(`  Claves en DB (tenant=${process.env.DEFAULT_TENANT_ID}): ${dbKeysTenant.size}`);
    } catch (e) {
      console.log(c.warn(`  No se pudieron leer translations del tenant: ${e.message || e}`));
    }
  }
}

const missingInDB = [];
for (const k of codeKeys) {
  if (!dbKeysSystem.has(k) && !dbKeysTenant.has(k)) {
    missingInDB.push(k);
  }
}
const danglingInDB = [];
for (const k of [...dbKeysSystem, ...dbKeysTenant]) {
  if (!codeKeys.has(k)) danglingInDB.push(k);
}
console.log(`  ${missingInDB.length ? c.warn('Faltan en DB: ' + missingInDB.length) : c.ok('No faltan claves en DB')} `);
if (missingInDB.length) {
  console.log(c.dim('  Ej.: ' + missingInDB.slice(0, 10).join(', ') + (missingInDB.length > 10 ? ' …' : '')));
}

// ---- 5) Chequeo opcional de endpoints (si se pasa --base)
if (baseUrl) {
  console.log(`\n${c.bold('5) Ping a endpoints críticos (requiere cookie si hay auth)')}`);
  const hit = async (url) => {
    try {
      const res = await fetch(url, { headers: cookie ? { 'cookie': String(cookie) } : {} });
      const text = await res.text();
      let status = res.status;
      let ok = res.ok;
      const snippet = text.slice(0, 200).replace(/\n/g, ' ');
      console.log(`  [${ok ? c.ok(status) : c.err(status)}] ${url} ${c.dim(' -> ' + snippet)}`);
      return { url, status, ok };
    } catch(e) {
      console.log(`  ${c.err('ERR')} ${url} ${e.message}`);
      return { url, status: 0, ok: false, error: e.message };
    }
  };

  const endpoints = [
    '/api/admin/users',
    '/api/hub/tenants',
    '/api/hub/superhubs',
    '/api/hub/organizations',
    '/api/admin/agents',
    '/api/hub/translations',
  ].map((p) => new URL(p, baseUrl).toString());

  for (const url of endpoints) {
    await hit(url);
  }
} else {
  console.log(c.dim(`  (Sáltate esta sección o pásame --base http://localhost:3000 para testear endpoints)`));
}

// ---- 6) Chequeo opcional token OpenAI
if (process.env.OPENING_AI_KEY || process.env.OPENAI_API_KEY) {
  console.log(`\n${c.bold('6) Verificando OPENAI_API_KEY (opcional)')}`);
  const key = process.env.OPENAI_API_KEY || process.env.OPENAI_APIKEY || '';
  if (!key) {
    console.log(c.warn('  No hay OPENAI_API_KEY — no se prueba'));
  } else {
    try {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!res.ok) {
        console.log(c.err(`  OpenAI /models -> ${res.status}`));
      } else {
        const j = await res.json();
        console.log(c.ok(`  OpenAI ok — modelos disponibles: ${j?.data?.length ?? '?'} `));
      }
    } catch (e) {
      console.log(c.err('  Error llamando a OpenAI: ' + e.message));
    }
  }
}

// ---- 7) Guardar reporte
const reportDir = path.join('scripts', 'out');
await fs.mkdir(reportDir, { recursive: true });
const report = {
  when: new Date().toISOString(),
  env: Object.fromEntries(Object.entries(process.env).filter(([k]) => required.concat(['OPENAI_API_KEY','NEXT_PUBLIC_APP_URL']).includes(k))),
  prisma: { ok: prismaOK },
  apiRoutesScanned: apiRouteFiles.length,
  translation: {
    codeKeyCount: codeKeys.size,
    systemDbKeys: dbKeysSystem.size || 0,
    tenantDbKeys: dbKeysTenant.size || 0,
    missingInDB: missingInDB,
    danglingInDB: danglingInDB.slice(0, 200),
  },
};
await fs.writeFile(path.join(reportDir, 'audit-report.json'), JSON.stringify(report, null, 2), 'utf8');
console.log(`\n${c.bold('📄 Reporte')} escrito en ${path.join(reportDir, 'audit-report.json')}`);

if (typeof prisma?.$disconnect === 'function') {
  await prisma.$disconnect().catch(()=>{});
}

function importsReactInApi(code) {
  return /from\s+['"]react['"]/.test(code) || /from\s+['"]@\/components\//.test(code);
}

console.log(`\n${c.bold('✔ Listo.')} Revisa el informe y dime qué bloque quieres que ataquemos primero.\n`);