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
  EC: [-78, -2],
  VE: [-66, 8],
  PA: [-80, 9],
  BO: [-65, -17],
  PY: [-58, -23],
  UY: [-56, -33],
  US: [-95, 37],
  CA: [-106, 56],
  GT: [-90, 15],
  HN: [-87, 15],
  SV: [-89, 14],
  NI: [-85, 13],
  DO: [-70, 19],
  PR: [-66, 18],
  // Europa
  GB: [-1, 52],
  ES: [-3, 40],
  PT: [-8, 39],
  FR: [2, 46],
  IT: [12, 42],
  DE: [10, 51],
  NL: [5, 52],
  BE: [4, 51],
  CH: [8, 47],
  AT: [14, 47],
  PL: [19, 52],
  // Asia & Oceanía
  AE: [54, 24],
  IN: [78, 21],
  JP: [138, 37],
  KR: [127.5, 37],
  CN: [104, 35],
  SG: [104, 1],
  AU: [133, -25],
  NZ: [174, -41],
  // Otros
  ZA: [25, -29],
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
  EC: "Ecuador",
  VE: "Venezuela",
  PA: "Panama",
  BO: "Bolivia",
  PY: "Paraguay",
  UY: "Uruguay",
  US: "United States",
  CA: "Canada",
  GT: "Guatemala",
  HN: "Honduras",
  SV: "El Salvador",
  NI: "Nicaragua",
  DO: "Dominican Republic",
  PR: "Puerto Rico",
  GB: "United Kingdom",
  ES: "Spain",
  PT: "Portugal",
  FR: "France",
  IT: "Italy",
  DE: "Germany",
  NL: "Netherlands",
  BE: "Belgium",
  CH: "Switzerland",
  AT: "Austria",
  PL: "Poland",
  AE: "United Arab Emirates",
  IN: "India",
  JP: "Japan",
  KR: "South Korea",
  CN: "China",
  SG: "Singapore",
  AU: "Australia",
  NZ: "New Zealand",
  ZA: "South Africa",
  NONE: "No especificado",
};

function normalizeCountry(codeOrName?: string | null): { code: string; name: string } {
  if (!codeOrName) return { code: "NONE", name: "No especificado" };
  const input = codeOrName.trim().toUpperCase();

  // Si es un código ISO válido
  if (ISO_TO_NAME[input]) {
    return { code: input, name: ISO_TO_NAME[input] };
  }

  // Buscar por nombre
  const foundCode = Object.keys(ISO_TO_NAME).find(
    (k) => ISO_TO_NAME[k].toUpperCase() === input
  );
  if (foundCode) {
    return { code: foundCode, name: ISO_TO_NAME[foundCode] };
  }

  return { code: input, name: input };
}

// Base de benchmarks globales (273k registros históricos de Six Seconds)
const BENCHMARK_BASE = 273000;

export async function GET() {
  try {
    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // ═══════════════════════════════════════════════════════════════
    // 1️⃣ BENCHMARKS - Datos históricos por país (base 273k)
    // ═══════════════════════════════════════════════════════════════
    const benchmarksByCountry = await prisma.benchmarkDataPoint.groupBy({
      by: ["country"],
      where: { country: { not: null } },
      _count: { _all: true },
      _avg: { K: true, C: true, G: true },
    });

    // ═══════════════════════════════════════════════════════════════
    // 2️⃣ USUARIOS TOTALES por país
    // ═══════════════════════════════════════════════════════════════
    const usersByCountry = await prisma.user.groupBy({
      by: ["country"],
      where: { active: true, country: { not: null } },
      _count: { _all: true },
    });

    // ═══════════════════════════════════════════════════════════════
    // 3️⃣ USUARIOS NUEVOS (últimos 3 meses) por país
    // ═══════════════════════════════════════════════════════════════
    const newUsersByCountry = await prisma.user.groupBy({
      by: ["country"],
      where: {
        active: true,
        country: { not: null },
        createdAt: { gte: threeMonthsAgo },
      },
      _count: { _all: true },
    });

    // ═══════════════════════════════════════════════════════════════
    // 4️⃣ COMUNIDADES TOTALES (conteo simple)
    // ═══════════════════════════════════════════════════════════════
    const totalCommunities = await prisma.rowiCommunity.count();

    // ═══════════════════════════════════════════════════════════════
    // 5️⃣ EQ SNAPSHOTS por país (datos reales de evaluaciones)
    // ═══════════════════════════════════════════════════════════════
    const eqByCountry = await prisma.eqSnapshot.groupBy({
      by: ["country"],
      where: { country: { not: null } },
      _count: { _all: true },
      _avg: { K: true, C: true, G: true },
    });

    // ═══════════════════════════════════════════════════════════════
    // 6️⃣ ESTADÍSTICAS GLOBALES
    // ═══════════════════════════════════════════════════════════════
    const [totalUsers, newUsersTotal, totalSnapshots] = await Promise.all([
      prisma.user.count({ where: { active: true } }),
      prisma.user.count({ where: { active: true, createdAt: { gte: threeMonthsAgo } } }),
      prisma.eqSnapshot.count(),
    ]);

    // Emociones predominantes
    const emotionsRaw = await prisma.emotionalEvent.groupBy({
      by: ["type"],
      _count: { type: true },
    });
    const topEmotions = emotionsRaw
      .sort((a, b) => b._count.type - a._count.type)
      .slice(0, 8)
      .map((e) => ({ tag: e.type, count: e._count.type }));

    // ═══════════════════════════════════════════════════════════════
    // 7️⃣ CONSTRUIR MAPA DE DATOS POR PAÍS
    // ═══════════════════════════════════════════════════════════════
    const countryMap = new Map<string, {
      code: string;
      name: string;
      benchmarks: number;
      users: number;
      newUsers: number;
      communities: number;
      eqSnapshots: number;
      avgK: number | null;
      avgC: number | null;
      avgG: number | null;
      coordinates: [number, number];
    }>();

    // Inicializar con benchmarks
    for (const b of benchmarksByCountry) {
      const { code, name } = normalizeCountry(b.country);
      const coords = COUNTRY_COORDS[code] || COUNTRY_COORDS["NONE"];
      countryMap.set(code, {
        code,
        name,
        benchmarks: b._count._all,
        users: 0,
        newUsers: 0,
        communities: 0,
        eqSnapshots: 0,
        avgK: b._avg.K,
        avgC: b._avg.C,
        avgG: b._avg.G,
        coordinates: coords,
      });
    }

    // Agregar usuarios
    for (const u of usersByCountry) {
      const { code, name } = normalizeCountry(u.country);
      const coords = COUNTRY_COORDS[code] || COUNTRY_COORDS["NONE"];
      if (countryMap.has(code)) {
        countryMap.get(code)!.users = u._count._all;
      } else {
        countryMap.set(code, {
          code,
          name,
          benchmarks: 0,
          users: u._count._all,
          newUsers: 0,
          communities: 0,
          eqSnapshots: 0,
          avgK: null,
          avgC: null,
          avgG: null,
          coordinates: coords,
        });
      }
    }

    // Agregar usuarios nuevos
    for (const u of newUsersByCountry) {
      const { code } = normalizeCountry(u.country);
      if (countryMap.has(code)) {
        countryMap.get(code)!.newUsers = u._count._all;
      }
    }

    // Agregar EQ snapshots
    for (const e of eqByCountry) {
      const { code } = normalizeCountry(e.country);
      if (countryMap.has(code)) {
        const entry = countryMap.get(code)!;
        entry.eqSnapshots = e._count._all;
        // Actualizar promedios con datos reales si están disponibles
        if (e._avg.K) entry.avgK = e._avg.K;
        if (e._avg.C) entry.avgC = e._avg.C;
        if (e._avg.G) entry.avgG = e._avg.G;
      }
    }

    // Convertir a array y calcular totales
    const countries = Array.from(countryMap.values())
      .filter((c) => c.coordinates[0] !== 0 || c.coordinates[1] !== 0)
      .map((c) => ({
        ...c,
        total: c.benchmarks + c.users + c.eqSnapshots,
        avgEQ: c.avgK && c.avgC && c.avgG
          ? Math.round((c.avgK + c.avgC + c.avgG) / 3)
          : null,
      }))
      .sort((a, b) => b.total - a.total);

    // ═══════════════════════════════════════════════════════════════
    // 8️⃣ RESPUESTA
    // ═══════════════════════════════════════════════════════════════
    const totalBenchmarks = benchmarksByCountry.reduce((sum, b) => sum + b._count._all, 0);

    return NextResponse.json({
      ok: true,
      summary: {
        // Base global
        benchmarkBase: BENCHMARK_BASE,
        benchmarksInDB: totalBenchmarks,
        totalRowiers: BENCHMARK_BASE + totalUsers + totalSnapshots,

        // Usuarios
        totalUsers,
        newUsers: newUsersTotal,
        newUsersLabel: "Últimos 3 meses",

        // Organizaciones
        totalCommunities,

        // EQ
        totalSnapshots,
        topEmotions,

        // Geografía
        totalCountries: countries.length,
      },
      mapData: countries,
      // Para compatibilidad con el mapa anterior
      countries: countries.reduce((acc, c) => {
        acc[c.name] = {
          count: c.total,
          avgEQ: c.avgEQ || 100,
          avgAffinity: 100,
          topEmotion: topEmotions[0]?.tag || "Neutral",
          users: c.users,
          newUsers: c.newUsers,
          benchmarks: c.benchmarks,
          communities: c.communities,
        };
        return acc;
      }, {} as Record<string, { count: number; avgEQ: number; avgAffinity: number; topEmotion: string; users: number; newUsers: number; benchmarks: number; communities: number }>),
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error al generar insights";
    console.error("❌ Error RowiVerse Insights:", err);
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}
