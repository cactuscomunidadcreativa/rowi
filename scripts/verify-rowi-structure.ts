import fs from "fs";
import path from "path";
import chalk from "chalk";

console.log(chalk.cyan("🌲 Generando estructura completa de Rowi (hasta 18 niveles)..."));

const ROOT = path.resolve(".");
const TARGET_DIR = fs.existsSync(path.join(ROOT, "src"))
  ? ROOT
  : path.join(ROOT, "apps/Rowi");

const OUTPUT = path.join(TARGET_DIR, "rowi_structure_full.txt");

let folders = 0;
let files = 0;

function mapTree(dir: string, depth = 0, maxDepth = 18): string {
  if (depth > maxDepth) return "";
  let output = "";

  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (["node_modules", ".next", ".git", "dist", "coverage"].includes(entry.name))
      continue;

    const prefix = "│  ".repeat(depth);
    if (entry.isDirectory()) {
      folders++;
      output += `${prefix}📁 ${entry.name}\n`;
      output += mapTree(fullPath, depth + 1, maxDepth);
    } else {
      files++;
      output += `${prefix}📄 ${entry.name}\n`;
    }
  }

  return output;
}

try {
  const structure = mapTree(TARGET_DIR);
  fs.writeFileSync(OUTPUT, structure, "utf8");

  console.log(chalk.green(`✅ Estructura completa guardada en:`));
  console.log(chalk.cyan(`   ${OUTPUT}\n`));
  console.log(chalk.yellow(`📊 Resumen: ${folders} carpetas · ${files} archivos`));
} catch (err: any) {
  console.error(chalk.red("❌ Error al generar estructura:"), err.message);
}