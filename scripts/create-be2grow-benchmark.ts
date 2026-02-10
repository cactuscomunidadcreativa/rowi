import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const toFloat = (v: any): number | null => {
  if (v === undefined || v === null || v === "") return null;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

const toInt = (v: any): number | null => {
  if (v === undefined || v === null || v === "") return null;
  const n = parseInt(String(v).replace(/,/g, ""), 10);
  return Number.isFinite(n) ? n : null;
};

async function main() {
  const csvPath = path.join(process.cwd(), "public/test/be2growplaning.csv");
  const csvText = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
  const rows = parse(csvText, { columns: true, skip_empty_lines: true, trim: true });

  console.log(`📊 CSV loaded: ${rows.length} rows`);

  // 1. Create Benchmark
  const benchmarkId = "be2grow-assessments-2025";
  let benchmark = await prisma.benchmark.findUnique({ where: { id: benchmarkId } });

  if (!benchmark) {
    benchmark = await prisma.benchmark.create({
      data: {
        id: benchmarkId,
        name: "Be2Grow Assessments 2025",
        description: "SEI assessments from Be2Grow coaching community — 9 participants from Colombia and Peru",
        type: "INTERNAL",
        uploadedBy: "eduardo.gonzalez@6seconds.org",
        status: "COMPLETED",
        totalRows: rows.length,
        processedRows: rows.length,
        sourceFile: "be2growplaning.csv",
        isActive: true,
      },
    });
    console.log("✅ Benchmark CREATED:", benchmark.id);
  } else {
    console.log("ℹ️ Benchmark already exists:", benchmark.id);
  }

  // 2. Create data points
  let created = 0;
  for (const row of rows) {
    const email = (row.Email || "").trim().toLowerCase();
    if (!email) continue;

    const eqTotal = (() => {
      const k = toFloat(row["Know Yourself Score"]);
      const c = toFloat(row["Choose Yourself Score"]);
      const g = toFloat(row["Give Yourself Score"]);
      if (k && c && g) return Math.round(((k + c + g) / 3) * 100) / 100;
      return toFloat(row["Emotional Intelligence Score"]);
    })();

    await prisma.benchmarkDataPoint.create({
      data: {
        benchmarkId: benchmark.id,
        sourceId: row.ID || `be2grow-${email}`,
        sourceDate: row.Date ? new Date(row.Date) : new Date(),
        country: row.Country || null,
        jobRole: row["Job Role"] || null,
        jobFunction: row["Job Function"] || null,
        sector: row.Sector || null,
        ageRange: row.Age ? `${row.Age}` : null,
        gender: row.Gender || null,
        brainStyle: row.Profile || null,
        eqTotal: eqTotal,
        K: toFloat(row["Know Yourself Score"]),
        C: toFloat(row["Choose Yourself Score"]),
        G: toFloat(row["Give Yourself Score"]),
        EL: toFloat(row["Enhance Emotional Literacy Score"]),
        RP: toFloat(row["Recognize Patterns Score"]),
        ACT: toFloat(row["Apply Consequential Thinking Score"]),
        NE: toFloat(row["Navigate Emotions Score"]),
        IM: toFloat(row["Engage Intrinsic Motivation Score"]),
        OP: toFloat(row["Excercise Optimism Score"]),
        EMP: toFloat(row["Increase Empathy Score"]),
        NG: toFloat(row["Pursue Noble Goals Score"]),
        effectiveness: toFloat(row["Effectiveness"]),
        influence: toFloat(row["Influence"]),
        decisionMaking: toFloat(row["Decision Making"]),
        satisfaction: toFloat(row["Satisfaction"]),
        balance: toFloat(row["Balance"]),
        health: toFloat(row["Health"]),
        achievement: toFloat(row["Achievement"]),
        network: toFloat(row["Network"]),
        community: toFloat(row["Community"]),
        education: row["Education"] || null,
        profile: row["Profile"] || null,
      },
    });
    created++;
    console.log(`  ✅ Data point: ${row["Test Taker Name"]} ${row["Test Taker Surname"]} (EQ: ${eqTotal})`);
  }

  // 3. Update count
  await prisma.benchmark.update({
    where: { id: benchmark.id },
    data: { processedRows: created },
  });

  console.log(`\n🎉 Benchmark "${benchmark.name}" created with ${created} data points`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
