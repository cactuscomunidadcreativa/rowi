// prisma/import-tp-data.ts
// ============================================================
// ROWI - Importar data real de TP desde Excel
// ============================================================
// Lee el archivo Excel de TP y crea BenchmarkDataPoints reales
// Usa el mismo pipeline que process-blob pero sin Vercel Blob
// ============================================================

import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import * as path from "path";

const prisma = new PrismaClient();

const BENCHMARK_ID = "tp-all-assessments-2025";
const BATCH_SIZE = 500;

// Column mapping (same as SOH_COLUMN_MAPPING)
const COLUMN_MAPPING: Record<string, string> = {
  // Demographics
  Country: "country",
  Countries: "country",
  Regions: "region",
  "Job Function": "jobFunction",
  "Job Role": "jobRole",
  Sector: "sector",
  Age: "ageRange",
  Gender: "gender",
  Education: "education",
  Generations: "generation",
  Year: "year",
  Date: "sourceDate",
  date: "sourceDate",

  // IDs
  ID: "sourceId",
  "TP EmployeeOrApplicationID": "tpEmployeeId",
  "TP Current Role": "tpCurrentRole",
  "TP Role Applied": "tpRoleApplied",
  NewHire: "tpNewHire",

  // Core EQ
  "Know Yourself Score": "K",
  "Know Yourself Score_1": "_K_dup",
  "Choose Yourself Score": "C",
  "Choose Yourself Score_1": "_C_dup",
  "Give Yourself Score": "G",
  "Give Yourself Score_1": "_G_dup",
  "Emotional Intelligence Score": "eqTotal",
  "Overall EQ": "eqTotal",

  // 8 Competencies
  "Enhance Emotional Literacy Score": "EL",
  "Recognize Patterns Score": "RP",
  "Apply Consequential Thinking Score": "ACT",
  "Navigate Emotions Score": "NE",
  "Engage Intrinsic Motivation Score": "IM",
  "Excercise Optimism Score": "OP",
  "Exercise Optimism Score": "OP",
  "Increase Empathy Score": "EMP",
  "Pursue Noble Goals Score": "NG",

  // Outcomes
  Effectiveness: "effectiveness",
  Relationship: "relationships",
  "Quality of Life": "qualityOfLife",
  Wellbeing: "wellbeing",
  Influence: "influence",
  "Decision Making": "decisionMaking",
  Community: "community",
  Network: "network",
  Achievement: "achievement",
  Satisfaction: "satisfaction",
  Balance: "balance",
  Health: "health",

  // Brain Talents
  DataMining: "dataMining",
  Modeling: "modeling",
  Prioritizing: "prioritizing",
  Connection: "connection",
  EmotionalInsight: "emotionalInsight",
  Collaboration: "collaboration",
  Reflecting: "reflecting",
  Adaptability: "adaptability",
  CriticalThinking: "criticalThinking",
  Resilience: "resilience",
  RiskTolerance: "riskTolerance",
  Imagination: "imagination",
  Proactivity: "proactivity",
  Commitment: "commitment",
  ProblemSolving: "problemSolving",
  Vision: "vision",
  Designing: "designing",
  Entrepreneurship: "entrepreneurship",
  "Brain Agility": "brainAgility",

  // Profile & Reliability
  Profile: "profile",
  "Reliability Index": "reliabilityIndex",
  "Consistency Index": "consistencyIndex",
  "Positive Impression Score": "positiveImpressionScore",
};

const NUMERIC_COLUMNS = [
  "K", "C", "G", "eqTotal",
  "EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG",
  "effectiveness", "relationships", "qualityOfLife", "wellbeing",
  "influence", "decisionMaking", "community", "network",
  "achievement", "satisfaction", "balance", "health",
  "dataMining", "modeling", "prioritizing", "connection",
  "emotionalInsight", "collaboration", "reflecting", "adaptability",
  "criticalThinking", "resilience", "riskTolerance", "imagination",
  "proactivity", "commitment", "problemSolving", "vision",
  "designing", "entrepreneurship", "brainAgility",
  "reliabilityIndex", "positiveImpressionScore",
];

const EQ_COMPETENCIES = ["K", "C", "G", "EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];

function normalizeAgeRange(age: any): string | null {
  if (age === null || age === undefined) return null;
  if (typeof age === "number") {
    if (age < 30) return "under30";
    if (age < 40) return "30to40";
    if (age < 50) return "40to50";
    return "over50";
  }
  const ageStr = String(age).trim();
  const numericAge = parseFloat(ageStr);
  if (!isNaN(numericAge) && numericAge > 0 && numericAge < 120) {
    if (numericAge < 30) return "under30";
    if (numericAge < 40) return "30to40";
    if (numericAge < 50) return "40to50";
    return "over50";
  }
  return ageStr || null;
}

function detectGeneration(ageRange: string | null): string | null {
  if (!ageRange) return null;
  switch (ageRange) {
    case "under30": return "genZ";
    case "30to40": return "millennials";
    case "40to50": return "genX";
    case "over50": return "boomers";
    default: return null;
  }
}

function extractDateInfo(value: any): { year: number | null; month: number | null; quarter: number | null } {
  const result = { year: null as number | null, month: null as number | null, quarter: null as number | null };
  if (!value) return result;

  if (typeof value === "number") {
    if (value >= 1900 && value <= 2100) {
      result.year = value;
      return result;
    }
    // Excel serial date
    if (value > 30000 && value < 100000) {
      const date = new Date((value - 25569) * 86400 * 1000);
      if (!isNaN(date.getTime())) {
        result.year = date.getFullYear();
        result.month = date.getMonth() + 1;
        result.quarter = Math.ceil(result.month / 3);
      }
    }
  }
  return result;
}

// Map reliability text to numeric
function reliabilityToNumeric(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  const str = String(value).trim().toUpperCase();
  switch (str) {
    case "GREEN": return 90;
    case "YELLOW": return 60;
    case "ORANGE": return 40;
    case "RED": return 20;
    default:
      const num = parseFloat(str);
      return isNaN(num) ? null : num;
  }
}

// Map Profile to brainStyle
function profileToBrainStyle(profile: string | null): string | null {
  if (!profile) return null;
  // The Profile column contains brain style like "Scientist", "Navigator", etc.
  return profile.trim() || null;
}

// Region mapping for TP countries
function inferRegion(country: string | null): string | null {
  if (!country) return null;
  const c = country.toUpperCase().trim();
  const regionMap: Record<string, string> = {
    US: "North America", USA: "North America", "UNITED STATES": "North America",
    CA: "North America", CANADA: "North America",
    MX: "Latin America", MEXICO: "Latin America",
    BR: "Latin America", BRAZIL: "Latin America",
    CO: "Latin America", COLOMBIA: "Latin America",
    AR: "Latin America", ARGENTINA: "Latin America",
    CL: "Latin America", CHILE: "Latin America",
    PE: "Latin America", PERU: "Latin America",
    CR: "Latin America", "COSTA RICA": "Latin America",
    DO: "Latin America", "DOMINICAN REPUBLIC": "Latin America",
    GT: "Latin America", GUATEMALA: "Latin America",
    HN: "Latin America", HONDURAS: "Latin America",
    SV: "Latin America", "EL SALVADOR": "Latin America",
    PA: "Latin America", PANAMA: "Latin America",
    NI: "Latin America", NICARAGUA: "Latin America",
    EC: "Latin America", ECUADOR: "Latin America",
    PY: "Latin America", PARAGUAY: "Latin America",
    UY: "Latin America", URUGUAY: "Latin America",
    VE: "Latin America", VENEZUELA: "Latin America",
    BO: "Latin America", BOLIVIA: "Latin America",
    HT: "Latin America", HAITI: "Latin America",
    GB: "EMEA", UK: "EMEA", "UNITED KINGDOM": "EMEA",
    DE: "EMEA", GERMANY: "EMEA",
    FR: "EMEA", FRANCE: "EMEA",
    ES: "EMEA", SPAIN: "EMEA",
    IT: "EMEA", ITALY: "EMEA",
    PT: "EMEA", PORTUGAL: "EMEA",
    NL: "EMEA", NETHERLANDS: "EMEA",
    BE: "EMEA", BELGIUM: "EMEA",
    AT: "EMEA", AUSTRIA: "EMEA",
    CH: "EMEA", SWITZERLAND: "EMEA",
    SE: "EMEA", SWEDEN: "EMEA",
    NO: "EMEA", NORWAY: "EMEA",
    DK: "EMEA", DENMARK: "EMEA",
    FI: "EMEA", FINLAND: "EMEA",
    IE: "EMEA", IRELAND: "EMEA",
    PL: "EMEA", POLAND: "EMEA",
    CZ: "EMEA", "CZECH REPUBLIC": "EMEA",
    RO: "EMEA", ROMANIA: "EMEA",
    HU: "EMEA", HUNGARY: "EMEA",
    GR: "EMEA", GREECE: "EMEA",
    TR: "EMEA", TURKEY: "EMEA", TURKIYE: "EMEA",
    ZA: "EMEA", "SOUTH AFRICA": "EMEA",
    AE: "EMEA", UAE: "EMEA", "UNITED ARAB EMIRATES": "EMEA",
    SA: "EMEA", "SAUDI ARABIA": "EMEA",
    EG: "EMEA", EGYPT: "EMEA",
    NG: "EMEA", NIGERIA: "EMEA",
    KE: "EMEA", KENYA: "EMEA",
    MA: "EMEA", MOROCCO: "EMEA",
    TN: "EMEA", TUNISIA: "EMEA",
    IL: "EMEA", ISRAEL: "EMEA",
    RU: "EMEA", RUSSIA: "EMEA",
    UA: "EMEA", UKRAINE: "EMEA",
    CN: "Asia Pacific", CHINA: "Asia Pacific",
    JP: "Asia Pacific", JAPAN: "Asia Pacific",
    KR: "Asia Pacific", "SOUTH KOREA": "Asia Pacific",
    IN: "Asia Pacific", INDIA: "Asia Pacific",
    AU: "Asia Pacific", AUSTRALIA: "Asia Pacific",
    NZ: "Asia Pacific", "NEW ZEALAND": "Asia Pacific",
    SG: "Asia Pacific", SINGAPORE: "Asia Pacific",
    MY: "Asia Pacific", MALAYSIA: "Asia Pacific",
    TH: "Asia Pacific", THAILAND: "Asia Pacific",
    PH: "Asia Pacific", PHILIPPINES: "Asia Pacific",
    ID: "Asia Pacific", INDONESIA: "Asia Pacific",
    VN: "Asia Pacific", VIETNAM: "Asia Pacific",
    HK: "Asia Pacific", "HONG KONG": "Asia Pacific",
    TW: "Asia Pacific", TAIWAN: "Asia Pacific",
    PK: "Asia Pacific", PAKISTAN: "Asia Pacific",
    BD: "Asia Pacific", BANGLADESH: "Asia Pacific",
    LK: "Asia Pacific", "SRI LANKA": "Asia Pacific",
  };
  return regionMap[c] || null;
}

async function main() {
  console.log("\n");
  console.log("=".repeat(60));
  console.log("  ROWI - IMPORT TP DATA FROM EXCEL");
  console.log("=".repeat(60));
  console.log("\n");

  // 1. Check benchmark exists
  console.log("1. Checking benchmark exists...");
  const benchmark = await prisma.benchmark.findUnique({
    where: { id: BENCHMARK_ID },
  });

  if (!benchmark) {
    console.error(`❌ Benchmark '${BENCHMARK_ID}' not found. Run seed-tp.ts first.`);
    return;
  }
  console.log(`   ✅ Benchmark found: ${benchmark.name}`);

  // 2. Check if data already exists
  const existingCount = await prisma.benchmarkDataPoint.count({
    where: { benchmarkId: BENCHMARK_ID },
  });

  if (existingCount > 0) {
    console.log(`   ⚠️  Found ${existingCount} existing data points.`);
    console.log(`   🗑️  Deleting existing data points...`);
    await prisma.benchmarkDataPoint.deleteMany({
      where: { benchmarkId: BENCHMARK_ID },
    });
    console.log(`   ✅ Deleted ${existingCount} existing data points.`);
  }

  // 3. Read Excel file
  console.log("\n2. Reading Excel file...");
  const filePath = path.join(process.cwd(), "public", "TEST", "TP All Assessments 1.22.26 (1).xlsx");
  console.log(`   📁 File: ${filePath}`);

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
  const rawHeaders = Object.keys(rows[0] as any);

  console.log(`   📊 Sheet: ${sheetName}`);
  console.log(`   📊 Total rows: ${rows.length}`);
  console.log(`   📊 Columns: ${rawHeaders.length}`);

  // 4. Process and import data
  console.log("\n3. Importing data points...");
  let validRows = 0;
  let skippedRows = 0;
  let dataPoints: any[] = [];
  let batchCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const rawRow = rows[i] as Record<string, any>;

    // Map columns
    const row: Record<string, any> = {};
    rawHeaders.forEach((header) => {
      const mappedHeader = COLUMN_MAPPING[header];
      if (!mappedHeader || mappedHeader.startsWith("_")) return; // Skip unmapped or duplicates

      const value = rawRow[header];
      if (NUMERIC_COLUMNS.includes(mappedHeader)) {
        const num = parseFloat(value);
        row[mappedHeader] = isNaN(num) ? null : num;
      } else {
        row[mappedHeader] = value ?? null;
      }
    });

    // Check for EQ data
    const hasEQData = EQ_COMPETENCIES.some(
      (c) => typeof row[c] === "number"
    );

    if (!hasEQData) {
      skippedRows++;
      continue;
    }

    const dateInfo = extractDateInfo(rawRow["Date"]);
    const ageRange = normalizeAgeRange(rawRow["Age"]);
    const profile = rawRow["Profile"] ? String(rawRow["Profile"]).trim() : null;
    const sourceIdRaw = rawRow["ID"];
    const sourceId = sourceIdRaw ? String(sourceIdRaw) : null;
    const country = row.country ? String(row.country).trim() : null;
    const region = inferRegion(country);

    dataPoints.push({
      benchmarkId: BENCHMARK_ID,
      sourceType: "soh",
      sourceId: sourceId,
      sourceDate: dateInfo.year ? new Date(dateInfo.year, (dateInfo.month || 1) - 1, 1) : null,
      country: country,
      region: region,
      jobFunction: row.jobFunction || null,
      jobRole: row.jobRole || null,
      sector: row.sector || null,
      ageRange: ageRange,
      gender: row.gender || null,
      education: row.education || null,
      generation: detectGeneration(ageRange),
      year: dateInfo.year,
      month: dateInfo.month,
      quarter: dateInfo.quarter,
      brainStyle: profile,
      profile: profile,
      K: row.K ?? null,
      C: row.C ?? null,
      G: row.G ?? null,
      eqTotal: row.eqTotal ?? null,
      EL: row.EL ?? null,
      RP: row.RP ?? null,
      ACT: row.ACT ?? null,
      NE: row.NE ?? null,
      IM: row.IM ?? null,
      OP: row.OP ?? null,
      EMP: row.EMP ?? null,
      NG: row.NG ?? null,
      effectiveness: row.effectiveness ?? null,
      relationships: row.relationships ?? null,
      qualityOfLife: row.qualityOfLife ?? null,
      wellbeing: row.wellbeing ?? null,
      influence: row.influence ?? null,
      decisionMaking: row.decisionMaking ?? null,
      community: row.community ?? null,
      network: row.network ?? null,
      achievement: row.achievement ?? null,
      satisfaction: row.satisfaction ?? null,
      balance: row.balance ?? null,
      health: row.health ?? null,
      dataMining: row.dataMining ?? null,
      modeling: row.modeling ?? null,
      prioritizing: row.prioritizing ?? null,
      connection: row.connection ?? null,
      emotionalInsight: row.emotionalInsight ?? null,
      collaboration: row.collaboration ?? null,
      reflecting: row.reflecting ?? null,
      adaptability: row.adaptability ?? null,
      criticalThinking: row.criticalThinking ?? null,
      resilience: row.resilience ?? null,
      riskTolerance: row.riskTolerance ?? null,
      imagination: row.imagination ?? null,
      proactivity: row.proactivity ?? null,
      commitment: row.commitment ?? null,
      problemSolving: row.problemSolving ?? null,
      vision: row.vision ?? null,
      designing: row.designing ?? null,
      entrepreneurship: row.entrepreneurship ?? null,
      brainAgility: row.brainAgility ?? null,
      reliabilityIndex: reliabilityToNumeric(rawRow["Reliability Index"]),
    });
    validRows++;

    // Batch insert
    if (dataPoints.length >= BATCH_SIZE) {
      await prisma.benchmarkDataPoint.createMany({
        data: dataPoints,
        skipDuplicates: true,
      });
      batchCount++;
      dataPoints = [];
      if (batchCount % 5 === 0) {
        console.log(`   📊 Progress: ${validRows} rows imported (batch ${batchCount})`);
      }
    }
  }

  // Insert remaining
  if (dataPoints.length > 0) {
    await prisma.benchmarkDataPoint.createMany({
      data: dataPoints,
      skipDuplicates: true,
    });
    batchCount++;
  }

  console.log(`   ✅ Imported ${validRows} valid rows (${skippedRows} skipped, ${batchCount} batches)`);

  // 5. Update benchmark
  console.log("\n4. Updating benchmark metadata...");
  const finalCount = await prisma.benchmarkDataPoint.count({
    where: { benchmarkId: BENCHMARK_ID },
  });

  await prisma.benchmark.update({
    where: { id: BENCHMARK_ID },
    data: {
      status: "COMPLETED",
      totalRows: finalCount,
      processedRows: finalCount,
      processedAt: new Date(),
    },
  });
  console.log(`   ✅ Benchmark updated: ${finalCount} total rows`);

  // 6. Print summary stats
  console.log("\n5. Summary stats...");

  const countries = await prisma.benchmarkDataPoint.groupBy({
    by: ["country"],
    where: { benchmarkId: BENCHMARK_ID, country: { not: null } },
    _count: { country: true },
    orderBy: { _count: { country: "desc" } },
    take: 10,
  });

  console.log("   Top 10 countries:");
  countries.forEach((c) => {
    console.log(`     ${c.country}: ${c._count.country}`);
  });

  const profiles = await prisma.benchmarkDataPoint.groupBy({
    by: ["brainStyle"],
    where: { benchmarkId: BENCHMARK_ID, brainStyle: { not: null } },
    _count: { brainStyle: true },
    orderBy: { _count: { brainStyle: "desc" } },
  });

  console.log("   Brain Styles:");
  profiles.forEach((p) => {
    console.log(`     ${p.brainStyle}: ${p._count.brainStyle}`);
  });

  const eqStats = await prisma.benchmarkDataPoint.aggregate({
    where: { benchmarkId: BENCHMARK_ID, eqTotal: { not: null } },
    _avg: { eqTotal: true },
    _min: { eqTotal: true },
    _max: { eqTotal: true },
    _count: { eqTotal: true },
  });

  console.log(`   EQ Total: avg=${eqStats._avg.eqTotal?.toFixed(2)}, min=${eqStats._min.eqTotal}, max=${eqStats._max.eqTotal}, count=${eqStats._count.eqTotal}`);

  console.log("\n");
  console.log("=".repeat(60));
  console.log("  ✅ TP DATA IMPORT COMPLETED");
  console.log(`  📊 ${finalCount} data points imported`);
  console.log("=".repeat(60));
  console.log("\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
