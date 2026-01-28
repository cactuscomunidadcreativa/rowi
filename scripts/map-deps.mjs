import { execSync } from "child_process";
try {
  execSync(`npx depcruise --include-only ^src --output-type dot src | dot -Tsvg > architecture/deps.svg`,{stdio:"inherit"});
  console.log("✅  Mapa generado en architecture/deps.svg");
}catch(e){
  console.log("⚠️  Error al generar deps.svg (¿tienes graphviz?)");
}