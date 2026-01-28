// File: apps/rowi/scripts/sync-locales.mjs
// Run: node --env-file=./apps/rowi/.env apps/rowi/scripts/sync-life/mjs --out=src/i18n/generated
// Optional:  --tenant=cmhlakpzn0002xxxv6istbvi5

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectDir = path.resolve(__dirname, '..');
process.chdir(projectDir);

// CLI args
const args = process.argv.slice(2);
const argMap = Object.fromEntries(args.map(s => {
  const [k,v] = s.replace(/^--/,'').split('=');
  return [k, v ?? true];
}));
const outDir = argMap.out || 'src/i18n/generated';
const tenantId = argMap.tenant || null;

try {
  const { PrismaClient } = await import(path.join(process.cwd(),'node_modules/@prisma/client/index.js'));
  const prisma = new PrismaClient();
  await prisma.$connect();

  const where = tenantId ? { tenantId } : { superHubId: null, tenantId: null, organizationId: null };
  const rows = await prisma.translation.findMany({ where, select: { ns:true, key:true, lang:true, value:true } });

  if (!rows.length) {
    console.log(`No se encontraron traducciones para ${tenantId ? `tenant=${tenantId}` : 'nivel System'}.`);
    process.exit(0);
  }

  const byLang = new Map(); // lang -> { k:v }
  for (const r of rows) {
    const lang = r.lang || 'en';
    const obj = byLang.get(lang) || {};
    obj[`${r.ns}.${r.key}`] = r.value ?? '';
    byLang.set(lang, obj);
  }

  await fs.mkdir(path.join(projectDir, outDir), { recursive: true });

  for (const [lang, dict] of byLang.entries()) {
    const file = path.join(projectDir, outDir, `${lang}.json`);
    await fs.writeFile(file, JSON.stringify(dict, null, 2), 'utf8');
    console.log(`✅ Escrito: ${file} (${Object.keys(dict).length} claves)`);
  }

  await prisma.$disconnect();
  console.log(`\nHecho. Ahora puedes importar desde "${outDir}" en tu capa i18n (p.ej. src/i18n/index.ts).`);
} catch (e) {
  console.error('Error en sync-locales:', e?.message || e);
  process.exit(1);
}