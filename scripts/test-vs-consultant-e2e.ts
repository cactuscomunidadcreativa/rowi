/**
 * Prueba end-to-end del módulo VS consultor contra la DB real, usando los
 * servicios reales (sin HTTP). Crea un benchmark de prueba, importa el CSV de
 * Bancolombia, corre la inferencia VS, marca un líder y corre el análisis
 * multi-líder. Limpia todo al final.
 *
 * Uso: pnpm exec tsx scripts/test-vs-consultant-e2e.ts "<ruta CSV>"
 */
import { prisma } from "@/core/prisma";
import fs from "fs";
import { hashPersonId } from "@/lib/benchmarks/process-benchmark";
import { runVsInferenceForBenchmark } from "@/lib/consultant/vs-inference";
import { runMultiLeaderAnalysis } from "@/lib/consultant/cross-analysis";

const csvPath =
  process.argv[2] || "/Users/eduardogonzalez/Downloads/quests (2).csv";

// --- mini parser CSV (comillas + decimales con coma) ---
function parseCSV(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const parseLine = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (const c of line) {
      if (c === '"') inQ = !inQ;
      else if (c === "," && !inQ) { out.push(cur); cur = ""; }
      else cur += c;
    }
    out.push(cur);
    return out;
  };
  const headers = parseLine(lines[0]);
  return lines.slice(1).map((l) => {
    const cells = parseLine(l);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = cells[i]));
    return row;
  });
}
function num(v: string | undefined): number | null {
  if (v == null || v === "") return null;
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? null : n;
}

const TALENTS: Record<string, string> = {
  DataMining: "dataMining", Modeling: "modeling", Prioritizing: "prioritizing",
  Connection: "connection", EmotionalInsight: "emotionalInsight",
  Collaboration: "collaboration", Reflecting: "reflecting", Adaptability: "adaptability",
  CriticalThinking: "criticalThinking", Resilience: "resilience",
  RiskTolerance: "riskTolerance", Imagination: "imagination", Proactivity: "proactivity",
  Commitment: "commitment", ProblemSolving: "problemSolving", Vision: "vision",
  Designing: "designing", Entrepreneurship: "entrepreneurship",
};

async function main() {
  const rows = parseCSV(fs.readFileSync(csvPath, "utf8"));
  console.log(`\n📥 CSV: ${rows.length} filas — proyecto: ${rows[0]?.Project}`);

  // 1) Crear benchmark de prueba (INTERNAL).
  const bench = await prisma.benchmark.create({
    data: {
      name: "TEST E2E — Bancolombia VS Consultor",
      type: "INTERNAL",
      scope: "TENANT",
      status: "COMPLETED",
      isActive: true,
      uploadedBy: "e2e-test",
    },
  });
  console.log(`✅ Benchmark creado: ${bench.id}`);

  // 2) Insertar data points (replicando lo que hace buildDataPoint: hash email).
  const dps = rows.map((r) => {
    const dp: Record<string, any> = {
      benchmarkId: bench.id,
      sourceType: "soh",
      sourceId: hashPersonId(r["Email"]),
      projectCohort: r["Project"] || null,
      country: r["Country"] || null,
      jobRole: r["Job Role"] || null,
      sector: r["Sector"] || null,
      eqTotal: num(r["Emotional Intelligence Score"]),
      EL: num(r["Enhance Emotional Literacy Score"]),
      RP: num(r["Recognize Patterns Score"]),
      ACT: num(r["Apply Consequential Thinking Score"]),
      NE: num(r["Navigate Emotions Score"]),
      IM: num(r["Engage Intrinsic Motivation Score"]),
      OP: num(r["Excercise Optimism Score"]),
      EMP: num(r["Increase Empathy Score"]),
      NG: num(r["Pursue Noble Goals Score"]),
      effectiveness: num(r["Effectiveness"]),
      relationships: num(r["Relationship"]),
      qualityOfLife: num(r["Quality of Life"]),
      wellbeing: num(r["Wellbeing"]),
      balance: num(r["Balance"]),
    };
    for (const [csvKey, field] of Object.entries(TALENTS)) {
      dp[field] = num(r[csvKey]);
    }
    return dp;
  });
  await prisma.benchmarkDataPoint.createMany({ data: dps as any });
  console.log(`✅ ${dps.length} data points insertados`);

  // 3) Inferencia VS (motor oficial → PulsePointInference).
  const inf = await runVsInferenceForBenchmark(bench.id);
  console.log(`🔬 Inferencia VS: ${inf.inferred} pulse points inferidos`);
  const sample = await prisma.pulsePointInference.findMany({
    where: { snapshotRef: { startsWith: `bench:${bench.id}:` } },
    take: 5,
    select: { pulsePointCode: true, inferredScore: true, competencyComp: true, talentComp: true },
  });
  console.log("   Muestra:", sample.map((s) => `${s.pulsePointCode}=${s.inferredScore?.toFixed(1)}`).join(", "));

  // 4) Marcar un líder (la primera persona del CSV).
  const leaderEmail = rows[0]["Email"];
  const leaderHash = hashPersonId(leaderEmail)!;
  await prisma.consultantLeaderAssignment.create({
    data: {
      benchmarkId: bench.id,
      personHash: leaderHash,
      projectCohort: rows[0]["Project"] || null,
      label: `${rows[0]["Test Taker Name"]} — Líder (test)`,
    },
  });
  console.log(`✅ Líder marcado: ${rows[0]["Test Taker Name"]} (${leaderEmail})`);

  // 5) Análisis multi-líder.
  const analysis = await runMultiLeaderAnalysis(bench.id);
  console.log(`\n📊 ANÁLISIS MULTI-LÍDER`);
  console.log(`   Equipos: ${analysis.teams.map((t) => `${t.projectCohort} (n=${t.n}, EQ=${t.eqAverage?.toFixed(1)})`).join("; ")}`);
  console.log(`   Top correlaciones:`);
  for (const c of analysis.topCorrelations.slice(0, 5)) {
    console.log(`     ${c.competencyKey} → ${c.outcomeKey}: r=${c.r} (n=${c.n}, ${c.strength})`);
  }
  console.log(`   Deriva temporal: present=${analysis.temporalDrift.present}, personas re-medidas=${analysis.temporalDrift.peopleWithRetest}`);
  console.log(`   Líderes (${analysis.leaders.length}):`);
  for (const l of analysis.leaders) {
    console.log(`     ${l.label || l.personHash.slice(0, 16)} — espejo present=${l.mirror.present}`);
    if (l.mirror.present) {
      console.log(`       Por encima del equipo: ${l.mirror.aboveTeam.slice(0, 3).map((d) => `${d.key} +${d.vsNorm}`).join(", ")}`);
      console.log(`       Por debajo del equipo: ${l.mirror.belowTeam.slice(0, 3).map((d) => `${d.key} ${d.vsNorm}`).join(", ")}`);
    }
  }

  // 6) Limpieza.
  await prisma.consultantLeaderAssignment.deleteMany({ where: { benchmarkId: bench.id } });
  await prisma.pulsePointInference.deleteMany({ where: { snapshotRef: { startsWith: `bench:${bench.id}:` } } });
  await prisma.benchmarkDataPoint.deleteMany({ where: { benchmarkId: bench.id } });
  await prisma.benchmark.delete({ where: { id: bench.id } });
  console.log(`\n🧹 Datos de prueba eliminados. ✅ E2E OK`);
}

main()
  .catch((e) => { console.error("❌ E2E FALLÓ:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
