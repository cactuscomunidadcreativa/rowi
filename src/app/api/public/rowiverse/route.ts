/**
 * 🌍 API: Public RowiVerse Stats
 * GET /api/public/rowiverse - Get public stats for the world map
 */

import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 300; // Cache for 5 minutes

// Base benchmark count (Six Seconds historical data)
const BENCHMARK_BASE = 273000;

// Country coordinates for map visualization
const COUNTRY_COORDS: Record<string, [number, number]> = {
  PE: [-75, -10],
  BR: [-50, -10],
  AR: [-64, -34],
  MX: [-102, 23],
  CO: [-74, 4],
  US: [-95, 37],
  ES: [-3, 40],
  IT: [12, 42],
  PT: [-8, 39],
  GB: [-1, 52],
  CR: [-84, 10],
  CL: [-71, -33],
  EC: [-78, -2],
  VE: [-66, 8],
  PA: [-80, 9],
  GT: [-90, 15],
  HN: [-87, 15],
  SV: [-89, 14],
  NI: [-85, 13],
  DO: [-70, 19],
  PR: [-66, 18],
  UY: [-56, -33],
  PY: [-58, -23],
  BO: [-65, -17],
  FR: [2, 46],
  DE: [10, 51],
  NL: [5, 52],
  BE: [4, 51],
  CH: [8, 47],
  AT: [14, 47],
  CA: [-106, 56],
  AU: [134, -25],
  NZ: [174, -41],
  JP: [138, 36],
  KR: [128, 36],
  CN: [105, 35],
  IN: [79, 21],
  SG: [104, 1],
  PH: [122, 13],
  TH: [101, 15],
  MY: [102, 4],
  ID: [120, -5],
  ZA: [25, -29],
  NG: [8, 10],
  KE: [38, 1],
  EG: [30, 27],
  MA: [-8, 32],
  AE: [54, 24],
  SA: [45, 24],
  IL: [35, 31],
  TR: [35, 39],
  RU: [100, 60],
  PL: [20, 52],
  CZ: [15, 50],
  SE: [18, 62],
  NO: [10, 62],
  FI: [26, 64],
  DK: [10, 56],
  IE: [-8, 53],
  GR: [22, 39],
  RO: [25, 46],
  HU: [20, 47],
  UA: [32, 49],
};

const COUNTRY_NAMES: Record<string, { es: string; en: string }> = {
  PE: { es: "Perú", en: "Peru" },
  BR: { es: "Brasil", en: "Brazil" },
  AR: { es: "Argentina", en: "Argentina" },
  MX: { es: "México", en: "Mexico" },
  CO: { es: "Colombia", en: "Colombia" },
  US: { es: "Estados Unidos", en: "United States" },
  ES: { es: "España", en: "Spain" },
  IT: { es: "Italia", en: "Italy" },
  PT: { es: "Portugal", en: "Portugal" },
  GB: { es: "Reino Unido", en: "United Kingdom" },
  CR: { es: "Costa Rica", en: "Costa Rica" },
  CL: { es: "Chile", en: "Chile" },
  EC: { es: "Ecuador", en: "Ecuador" },
  VE: { es: "Venezuela", en: "Venezuela" },
  PA: { es: "Panamá", en: "Panama" },
  GT: { es: "Guatemala", en: "Guatemala" },
  HN: { es: "Honduras", en: "Honduras" },
  SV: { es: "El Salvador", en: "El Salvador" },
  NI: { es: "Nicaragua", en: "Nicaragua" },
  DO: { es: "Rep. Dominicana", en: "Dominican Rep." },
  PR: { es: "Puerto Rico", en: "Puerto Rico" },
  UY: { es: "Uruguay", en: "Uruguay" },
  PY: { es: "Paraguay", en: "Paraguay" },
  BO: { es: "Bolivia", en: "Bolivia" },
  FR: { es: "Francia", en: "France" },
  DE: { es: "Alemania", en: "Germany" },
  NL: { es: "Países Bajos", en: "Netherlands" },
  BE: { es: "Bélgica", en: "Belgium" },
  CH: { es: "Suiza", en: "Switzerland" },
  AT: { es: "Austria", en: "Austria" },
  CA: { es: "Canadá", en: "Canada" },
  AU: { es: "Australia", en: "Australia" },
  NZ: { es: "Nueva Zelanda", en: "New Zealand" },
  JP: { es: "Japón", en: "Japan" },
  KR: { es: "Corea del Sur", en: "South Korea" },
  CN: { es: "China", en: "China" },
  IN: { es: "India", en: "India" },
  SG: { es: "Singapur", en: "Singapore" },
  PH: { es: "Filipinas", en: "Philippines" },
  TH: { es: "Tailandia", en: "Thailand" },
  MY: { es: "Malasia", en: "Malaysia" },
  ID: { es: "Indonesia", en: "Indonesia" },
  ZA: { es: "Sudáfrica", en: "South Africa" },
  NG: { es: "Nigeria", en: "Nigeria" },
  KE: { es: "Kenia", en: "Kenya" },
  EG: { es: "Egipto", en: "Egypt" },
  MA: { es: "Marruecos", en: "Morocco" },
  AE: { es: "Emiratos Árabes", en: "UAE" },
  SA: { es: "Arabia Saudita", en: "Saudi Arabia" },
  IL: { es: "Israel", en: "Israel" },
  TR: { es: "Turquía", en: "Turkey" },
  RU: { es: "Rusia", en: "Russia" },
  PL: { es: "Polonia", en: "Poland" },
  CZ: { es: "Chequia", en: "Czech Republic" },
  SE: { es: "Suecia", en: "Sweden" },
  NO: { es: "Noruega", en: "Norway" },
  FI: { es: "Finlandia", en: "Finland" },
  DK: { es: "Dinamarca", en: "Denmark" },
  IE: { es: "Irlanda", en: "Ireland" },
  GR: { es: "Grecia", en: "Greece" },
  RO: { es: "Rumania", en: "Romania" },
  HU: { es: "Hungría", en: "Hungary" },
  UA: { es: "Ucrania", en: "Ukraine" },
};

export async function GET() {
  try {
    // Get real stats from database with error handling for missing tables
    let totalUsers = 0;
    let totalConversations = 0;
    let usersByCountry: { country: string | null; _count: { id: number } }[] = [];
    let newUsersByCountry: { country: string | null; _count: { id: number } }[] = [];

    try {
      totalUsers = await prisma.user.count();
    } catch (e) {
      console.warn("Could not count users:", e);
    }

    try {
      totalConversations = await prisma.message.count();
    } catch (e) {
      console.warn("Could not count messages:", e);
    }

    // Get users by country
    try {
      usersByCountry = await prisma.user.groupBy({
        by: ["country"],
        _count: { id: true },
        where: { country: { not: null } },
      });
    } catch (e) {
      console.warn("Could not group users by country:", e);
    }

    // Get new users (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    try {
      newUsersByCountry = await prisma.user.groupBy({
        by: ["country"],
        _count: { id: true },
        where: {
          country: { not: null },
          createdAt: { gte: threeMonthsAgo },
        },
      });
    } catch (e) {
      console.warn("Could not group new users by country:", e);
    }

    // Build map data
    const countryMap: Record<string, any> = {};

    // Add benchmark base distributed across key countries
    const benchmarkDistribution: Record<string, number> = {
      US: 85000,
      MX: 35000,
      BR: 25000,
      ES: 20000,
      AR: 18000,
      CO: 15000,
      PE: 12000,
      CL: 10000,
      IT: 8000,
      GB: 7000,
      FR: 6000,
      DE: 5000,
      CA: 5000,
      CR: 4000,
      EC: 3000,
      GT: 3000,
      PA: 2000,
      VE: 2000,
      DO: 2000,
      UY: 2000,
      PY: 1500,
      BO: 1500,
      HN: 1000,
      SV: 1000,
      NI: 1000,
    };

    // Initialize with benchmarks
    for (const [code, count] of Object.entries(benchmarkDistribution)) {
      if (COUNTRY_COORDS[code]) {
        countryMap[code] = {
          code,
          benchmarks: count,
          users: 0,
          newUsers: 0,
          total: count,
          coordinates: COUNTRY_COORDS[code],
        };
      }
    }

    // Add real users
    for (const row of usersByCountry) {
      const code = row.country as string;
      if (COUNTRY_COORDS[code]) {
        if (!countryMap[code]) {
          countryMap[code] = {
            code,
            benchmarks: 0,
            users: 0,
            newUsers: 0,
            total: 0,
            coordinates: COUNTRY_COORDS[code],
          };
        }
        countryMap[code].users = row._count.id;
        countryMap[code].total += row._count.id;
      }
    }

    // Add new users
    for (const row of newUsersByCountry) {
      const code = row.country as string;
      if (countryMap[code]) {
        countryMap[code].newUsers = row._count.id;
      }
    }

    // Convert to array and sort by total
    const mapData = Object.values(countryMap).sort(
      (a: any, b: any) => b.total - a.total
    );

    // Calculate summary stats
    const totalRowiers = BENCHMARK_BASE + totalUsers;
    const totalNewUsers = newUsersByCountry.reduce((sum, r) => sum + r._count.id, 0);

    return NextResponse.json({
      ok: true,
      summary: {
        totalRowiers,
        activeUsers: totalUsers,
        conversations: totalConversations,
        satisfaction: 95, // Static for now
        availability: "24/7",
        countries: mapData.length,
        newUsers: totalNewUsers,
      },
      mapData,
      countryNames: COUNTRY_NAMES,
    });
  } catch (err: any) {
    console.error("❌ Error GET /api/public/rowiverse:", err);
    return NextResponse.json(
      { ok: false, error: "Error loading data" },
      { status: 500 }
    );
  }
}
