import { ensureSystemBootstrap } from "./ensureSystemBootstrap";

(async () => {
  await ensureSystemBootstrap();
  console.log("🌍 Sistema inicializado completamente.");
})();