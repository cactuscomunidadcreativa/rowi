import { execSync } from "child_process";
import path from "path";
import fs from "fs";

async function main() {
  const root = path.resolve(process.cwd());
  const output = path.join(root, "rowi_structure_full.txt");

  console.log("🌲 Generando estructura de Rowi (hasta 18 niveles)...");
  try {
    // Si tree-cli está instalado, lo usamos
    try {
      execSync(`npx tree -L 18 -I 'node_modules|.next|dist|coverage|.git' > ${output}`, {
        stdio: "inherit",
      });
    } catch {
      console.log("⚠️ 'tree' no disponible, usando método alternativo...");
      const content = walk(root, 0, 18);
      fs.writeFileSync(output, content.join("\n"), "utf8");
    }

    console.log(`✅ Estructura guardada en: ${output}`);
  } catch (err: any) {
    console.error("❌ Error generando estructura:", err.message);
  }
}

function walk(dir: string, depth: number, maxDepth: number, prefix = ""): string[] {
  if (depth > maxDepth) return [];
  const lines: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (["node_modules", ".next", "dist", ".git"].includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    const line = `${"│   ".repeat(depth)}├── ${entry.name}`;
    lines.push(line);

    if (entry.isDirectory()) {
      lines.push(...walk(fullPath, depth + 1, maxDepth, prefix));
    }
  }
  return lines;
}

main();