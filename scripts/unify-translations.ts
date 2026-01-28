import { prisma } from "@/lib/db";

(async () => {
  try {
    console.log("🔍 Buscando duplicados semánticos...");

    const all = await prisma.translation.findMany();

    // Agrupar por "versión normalizada del valor"
    const normalize = (s: string) =>
      s
        ?.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    const map = new Map<string, any[]>();

    for (const t of all) {
      const norm = normalize(t.value);
      if (!norm || norm.length < 3) continue;
      if (!map.has(norm)) map.set(norm, []);
      map.get(norm)!.push(t);
    }

    let merges = 0;

    for (const [norm, group] of map.entries()) {
      if (group.length < 2) continue;

      // Mismo ns pero idiomas distintos → fusionar
      const nsSet = new Set(group.map((t) => t.ns));
      if (nsSet.size > 1) continue;

      const ns = group[0].ns;
      const key = group[0].key;

      // Tomar el valor original como base en español si existe
      const es = group.find((g) => g.lang === "es")?.value || "";
      const en = group.find((g) => g.lang === "en")?.value || "";
      const pt = group.find((g) => g.lang === "pt")?.value || "";
      const it = group.find((g) => g.lang === "it")?.value || "";

      // Crear clave unificada
      const newKey = `${ns}_${normalize(en || es || pt || it)
        .replace(/\s+/g, "_")
        .slice(0, 30)}`;

      // Eliminar duplicados viejos
      await prisma.translation.deleteMany({
        where: { id: { in: group.map((g) => g.id) } },
      });

      // Insertar registro único con los cuatro idiomas
      await prisma.translation.createMany({
        data: [
          { ns, key: newKey, lang: "es", value: es },
          { ns, key: newKey, lang: "en", value: en },
          { ns, key: newKey, lang: "pt", value: pt },
          { ns, key: newKey, lang: "it", value: it },
        ],
      });

      merges++;
    }

    console.log(`✅ ${merges} grupos de duplicados fusionados.`);
    process.exit(0);
  } catch (e) {
    console.error("❌ Error unificando traducciones:", e);
    process.exit(1);
  }
})();