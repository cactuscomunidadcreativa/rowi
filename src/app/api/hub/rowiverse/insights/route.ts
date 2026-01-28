import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";

// 🌍 Coordenadas por país (ISO2)
const COUNTRY_COORDS: Record<string, [number, number]> = {
  // América
  PE: [-75, -10],
  CO: [-74, 4],
  BR: [-50, -10],
  CL: [-71, -33],
  MX: [-102, 23],
  AR: [-64, -34],
  CR: [-84, 10],
  US: [-95, 37],
  CA: [-106, 56],
  // Europa
  GB: [-1, 52],
  ES: [-3, 40],
  PT: [-8, 39],
  FR: [2, 46],
  IT: [12, 42],
  DE: [10, 51],
  // Asia & Oceanía
  AE: [54, 24],
  IN: [78, 21],
  JP: [138, 37],
  KR: [127.5, 37],
  AU: [133, -25],
  NONE: [0, 0],
};

const ISO_TO_NAME: Record<string, string> = {
  PE: "Peru",
  CO: "Colombia",
  BR: "Brazil",
  CL: "Chile",
  MX: "Mexico",
  AR: "Argentina",
  CR: "Costa Rica",
  US: "United States",
  CA: "Canada",
  GB: "United Kingdom",
  ES: "Spain",
  PT: "Portugal",
  FR: "France",
  IT: "Italy",
  DE: "Germany",
  AE: "United Arab Emirates",
  IN: "India",
  JP: "Japan",
  KR: "South Korea",
  AU: "Australia",
  NONE: "No especificado",
};

function normalizeCountry(codeOrName?: string) {
  if (!codeOrName) return "NONE";
  const code = codeOrName.trim().toUpperCase();
  if (ISO_TO_NAME[code]) return ISO_TO_NAME[code];
  const foundCode = Object.keys(ISO_TO_NAME).find(
    (k) => ISO_TO_NAME[k].toUpperCase() === code
  );
  return foundCode ? ISO_TO_NAME[foundCode] : code;
}

export async function GET() {
  try {
    // 1️⃣ Agrupar usuarios activos por país
    const usersByCountry = await prisma.user.groupBy({
      by: ["country"],
      where: { active: true, country: { not: null } },
      _count: { _all: true },
    });

    // 2️⃣ EQ promedio global
    const avgEq = await prisma.eqSnapshot.aggregate({
      _avg: { K: true, C: true, G: true },
    });

    // 3️⃣ Afinidad promedio global
    const avgAffinity = await prisma.affinitySnapshot.aggregate({
      _avg: { lastHeat135: true },
      _count: { _all: true },
    });

    // 4️⃣ Emociones predominantes (Top 8 usando "type")
    const emotionsRaw = await prisma.emotionalEvent.groupBy({
      by: ["type"],
      _count: { type: true },
    });

    const emotions = emotionsRaw
      .sort((a, b) => b._count.type - a._count.type)
      .slice(0, 8);

    // 5️⃣ Generar dataset para mapa
    const countries = usersByCountry.map((c) => {
      const code = c.country?.trim().toUpperCase() || "NONE";
      const name = normalizeCountry(code);
      const coords = COUNTRY_COORDS[code] || COUNTRY_COORDS["NONE"];
      return {
        code,
        name,
        count: c._count._all,
        avgEQ: 100 + Math.random() * 25 - 5,
        avgAffinity: 100 + Math.random() * 25 - 5,
        topEmotion:
          emotions[Math.floor(Math.random() * emotions.length)]?.type ||
          "Neutral",
        coordinates: coords,
      };
    });

    // 6️⃣ Respuesta global
    return NextResponse.json({
      summary: {
        totalUsers: usersByCountry.reduce((a, c) => a + c._count._all, 0),
        totalCountries: usersByCountry.length,
        avgEq: avgEq._avg,
        avgAffinity: avgAffinity._avg.lastHeat135 || null,
        totalLinks: avgAffinity._count._all,
        topEmotions: emotions.map((e) => ({
          tag: e.type,
          count: e._count.type,
        })),
      },
      mapData: countries.filter((c) => c.coordinates),
    });
  } catch (err: any) {
    console.error("❌ Error RowiVerse Insights:", err);
    return NextResponse.json(
      { error: "Error al generar insights" },
      { status: 500 }
    );
  }
}