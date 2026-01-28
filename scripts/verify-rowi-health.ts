import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import chalk from "chalk";

console.log(chalk.cyan("\n🧠 Verificando salud general de Rowi...\n"));

const report: Record<string, "ok" | "warn" | "fail"> = {
  typescript: "fail",
  prisma: "fail",
  i18n: "fail",
  api: "fail",
  build: "fail",
};

function safeExec(command: string, label: string) {
  try {
    execSync(command, { stdio: "pipe" });
    console.log(chalk.green(`✅ ${label}: OK`));
    return "ok";
  } catch (err: any) {
    console.log(chalk.red(`❌ ${label}: FAILED`));
    return "fail";
  }
}

function warn(msg: string) {
  console.log(chalk.yellow(`⚠️  ${msg}`));
}

// =========================================================
// 1️⃣ TypeScript
// =========================================================
try {
  execSync("npx tsc --noEmit", { stdio: "pipe" });
  console.log(chalk.green("✅ TypeScript compile: OK"));
  report.typescript = "ok";
} catch {
  console.log(chalk.red("❌ TypeScript compile: FAILED"));
  report.typescript = "fail";
}

// =========================================================
// 2️⃣ Prisma schema
// =========================================================
try {
  const schema = fs.readFileSync(
    path.resolve("prisma/schema.prisma"),
    "utf-8"
  );
  if (schema.includes("model Translation")) {
    console.log(chalk.green("✅ Prisma: modelo Translation presente"));
    report.prisma = "ok";
  } else {
    console.log(chalk.yellow("⚠️ Prisma: modelo Translation no encontrado"));
    report.prisma = "warn";
  }
} catch {
  console.log(chalk.red("❌ Prisma: error leyendo schema.prisma"));
  report.prisma = "fail";
}

// =========================================================
// 3️⃣ Archivos i18n
// =========================================================
try {
  const langs = ["es", "en", "pt", "it"];
  const missing: string[] = [];
  for (const lang of langs) {
    const file = path.resolve(`src/lib/i18n/locales/${lang}.json`);
    if (!fs.existsSync(file)) missing.push(lang);
  }
  if (missing.length === 0) {
    console.log(chalk.green("✅ i18n: OK (4 idiomas detectados)"));
    report.i18n = "ok";
  } else {
    warn(`i18n: Faltan idiomas -> ${missing.join(", ")}`);
    report.i18n = "warn";
  }
} catch {
  console.log(chalk.red("❌ i18n: error verificando archivos"));
  report.i18n = "fail";
}

// =========================================================
// 4️⃣ API Routes
// =========================================================
try {
  const apiDir = path.resolve("src/app/api");
  const routes = execSync(`find ${apiDir} -name route.ts`).toString().trim();
  const count = routes.split("\n").length;
  if (count > 50) {
    console.log(chalk.green(`✅ API routes: OK (${count} detectadas)`));
    report.api = "ok";
  } else {
    warn(`API routes: solo ${count} encontradas (posible problema)`);
    report.api = "warn";
  }
} catch {
  console.log(chalk.red("❌ API routes: error al listar rutas"));
  report.api = "fail";
}

// =========================================================
// 5️⃣ Next.js build test
// =========================================================
if (process.env.NODE_ENV === "production") {
  try {
    execSync("next build --no-lint", { stdio: "pipe" });
    console.log(chalk.green("✅ Next.js build: OK"));
    report.build = "ok";
  } catch {
    console.log(chalk.red("❌ Next.js build: FAILED"));
    report.build = "fail";
  }
} else {
  console.log(
    chalk.yellow(
      "⚠️  Saltando verificación de build en modo desarrollo — Next.js dev no genera prerender-manifest.json"
    )
  );
  report.build = "warn";
}

// =========================================================
// 🧾 Resultado final
// =========================================================
const okCount = Object.values(report).filter((v) => v === "ok").length;
const warnCount = Object.values(report).filter((v) => v === "warn").length;
const failCount = Object.values(report).filter((v) => v === "fail").length;

console.log("\n📊 Estado general:");
console.log(chalk.green(`🟢 OK: ${okCount}`));
console.log(chalk.yellow(`🟡 WARN: ${warnCount}`));
console.log(chalk.red(`🔴 FAIL: ${failCount}\n`));

if (failCount === 0 && warnCount === 0)
  console.log(chalk.greenBright("🌱 Todo está en equilibrio — me siento bien"));
else if (failCount === 0)
  console.log(chalk.yellowBright("⚠️  Hay pequeñas advertencias en algunos módulos"));
else
  console.log(chalk.redBright("🚨 Atención: hay módulos críticos con errores"));

const output = {
  ok: failCount === 0,
  modules: report,
  timestamp: new Date().toISOString(),
};

const backupDir = path.resolve(".backups");
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
fs.writeFileSync(
  path.join(backupDir, `verify-health-${new Date().toISOString().slice(0, 10)}.json`),
  JSON.stringify(output, null, 2),
  "utf-8"
);

console.log(chalk.gray(`📝 Log guardado en .backups/verify-health-${new Date().toISOString().slice(0, 10)}.json`));