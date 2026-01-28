import fs from "fs";
import path from "path";
import chalk from "chalk";

const ROOT = path.resolve(process.cwd(), "src");
let fixed = 0;

function* walk(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (full.endsWith(".ts") || full.endsWith(".tsx")) yield full;
  }
}

for (const file of walk(ROOT)) {
  const code = fs.readFileSync(file, "utf8");
  if (code.includes(`"@/lib/i18n/useTR"`)) {
    const updated = code.replace(/["@']@\/lib\/i18n\/useTR["@']/g, `"@/lib/i18n/useI18n"`);
    fs.writeFileSync(file, updated, "utf8");
    console.log(chalk.yellow("🔧 Fixed import in:"), file);
    fixed++;
  }
}

console.log(chalk.green(`✅ Reemplazos completados: ${fixed}`));