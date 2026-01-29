// update-brain-talents.mjs - Actualiza los Brain Talents desde el CSV
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as readline from "readline";

const prisma = new PrismaClient();

// Mapeo de columnas del CSV a campos de la BD (nuevos talentos)
const NEW_TALENT_MAPPING = {
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
};

// Parser de líneas CSV
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function main() {
  console.log("🔄 Actualizando Brain Talents desde CSV...\n");

  // Obtener el benchmark
  const benchmark = await prisma.benchmark.findFirst({
    where: { status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
  });

  if (!benchmark) {
    console.log("❌ No se encontró benchmark");
    return;
  }

  console.log(`📊 Benchmark: ${benchmark.name}`);
  console.log(`   ID: ${benchmark.id}\n`);

  // Borrar los datos existentes y reimportar
  console.log("🗑️ Eliminando datos antiguos...");
  await prisma.benchmarkDataPoint.deleteMany({
    where: { benchmarkId: benchmark.id },
  });

  // También eliminar estadísticas, correlaciones y top performers
  await prisma.benchmarkStatistic.deleteMany({ where: { benchmarkId: benchmark.id } });
  await prisma.benchmarkCorrelation.deleteMany({ where: { benchmarkId: benchmark.id } });
  await prisma.benchmarkTopPerformer.deleteMany({ where: { benchmarkId: benchmark.id } });

  console.log("✅ Datos antiguos eliminados\n");

  // Leer CSV y procesar
  const CSV_PATH = "/Users/eduardogonzalez/Desktop/rowi/public/SOH_benchmark_data.csv";

  // Mapeo completo
  const FULL_MAPPING = {
    Country: "country",
    Countries: "country",
    Regions: "region",
    "Job Function": "jobFunction",
    "Job Role": "jobRole",
    Sector: "sector",
    Age: "ageRange",
    "Age (new)": "ageRange",
    Gender: "gender",
    Education: "education",
    Generations: "generation",
    "Know Yourself Score": "K",
    "Know Yourself Score.1": "K",
    "Choose Yourself Score": "C",
    "Choose Yourself Score.1": "C",
    "Give Yourself Score": "G",
    "Give Yourself Score.1": "G",
    "Emotional Intelligence Score": "eqTotal",
    "Overall EQ": "eqTotal",
    "Enhance Emotional Literacy Score": "EL",
    "Enhance Emotional Literacy": "EL",
    "Recognize Patterns Score": "RP",
    "Recognize Patterns": "RP",
    "Apply Consequential Thinking Score": "ACT",
    "Apply Consequential Thinking": "ACT",
    "Navigate Emotions Score": "NE",
    "Navigate Emotions": "NE",
    "Engage Intrinsic Motivation Score": "IM",
    "Engage Intrinsic Motivation": "IM",
    "Excercise Optimism Score": "OP",
    "Exercise Optimism Score": "OP",
    "Exercise Optimism": "OP",
    "Increase Empathy Score": "EMP",
    "Increase Empathy": "EMP",
    "Pursue Noble Goals Score": "NG",
    "Pursue Noble Goals": "NG",
    Effectiveness: "effectiveness",
    Relationship: "relationships",
    "Quality of Life": "qualityOfLife",
    Wellbeing: "wellbeing",
    Influence: "influence",
    "Decision Making": "decisionMaking",
    Community: "community",
    Network: "network",
    Networking: "network",
    Achievement: "achievement",
    Satisfaction: "satisfaction",
    Balance: "balance",
    "Work Life Balance": "balance",
    Health: "health",
    // Brain Talents (18)
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
    "Problem Solving": "problemSolving",
    Vision: "vision",
    Designing: "designing",
    Entrepreneurship: "entrepreneurship",
    "Brain Agility": "brainAgility",
    Profile: "profile",
    "Reliability Index": "reliabilityIndex",
  };

  const NUMERIC_COLUMNS = [
    "K", "C", "G", "eqTotal",
    "EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG",
    "effectiveness", "relationships", "qualityOfLife", "wellbeing",
    "influence", "decisionMaking", "community", "network",
    "achievement", "satisfaction", "balance", "health",
    "dataMining", "modeling", "prioritizing", "connection",
    "emotionalInsight", "collaboration", "reflecting", "adaptability",
    "criticalThinking", "resilience", "riskTolerance",
    "imagination", "proactivity", "commitment", "problemSolving",
    "vision", "designing", "entrepreneurship", "brainAgility",
    "reliabilityIndex",
  ];

  const EQ_COMPETENCIES = ["K", "C", "G", "EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];

  const fileStream = fs.createReadStream(CSV_PATH, { highWaterMark: 64 * 1024 });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let headers = [];
  let isFirstRow = true;
  let rowCount = 0;
  let validRowCount = 0;
  let batch = [];
  const BATCH_SIZE = 1000;

  console.log("📊 Procesando CSV con todos los Brain Talents...\n");

  for await (const line of rl) {
    if (isFirstRow) {
      headers = parseCSVLine(line);
      console.log(`📋 Headers encontrados: ${headers.length} columnas`);

      // Verificar talentos
      const talents = headers.filter(h => Object.keys(NEW_TALENT_MAPPING).includes(h));
      console.log(`🧠 Brain Talents encontrados: ${talents.join(", ")}\n`);

      isFirstRow = false;
      continue;
    }

    const values = parseCSVLine(line);
    const rowData = {};

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      if (!header) continue;

      const mappedKey = FULL_MAPPING[header];
      if (mappedKey) {
        let value = values[i];

        if (NUMERIC_COLUMNS.includes(mappedKey)) {
          const num = parseFloat(String(value));
          value = isNaN(num) ? null : num;
        }

        rowData[mappedKey] = value ?? null;
      }
    }

    rowCount++;

    // Solo agregar si tiene al menos un valor de EQ
    const hasEQData = EQ_COMPETENCIES.some((c) => rowData[c] !== null && rowData[c] !== undefined);

    if (hasEQData) {
      batch.push({
        benchmarkId: benchmark.id,
        sourceType: "soh",
        ...rowData,
      });
      validRowCount++;

      if (batch.length >= BATCH_SIZE) {
        await prisma.benchmarkDataPoint.createMany({ data: batch, skipDuplicates: true });
        batch = [];

        if (validRowCount % 10000 === 0) {
          console.log(`📊 Procesadas: ${rowCount} filas, insertadas: ${validRowCount}`);
        }
      }
    }
  }

  // Insertar último batch
  if (batch.length > 0) {
    await prisma.benchmarkDataPoint.createMany({ data: batch, skipDuplicates: true });
  }

  console.log(`\n✅ CSV completado: ${rowCount} filas procesadas, ${validRowCount} insertadas`);

  // Actualizar benchmark
  await prisma.benchmark.update({
    where: { id: benchmark.id },
    data: {
      totalRows: validRowCount,
      processedRows: validRowCount,
      processedAt: new Date(),
    },
  });

  // Verificar que los nuevos talentos tienen datos
  console.log("\n🔍 Verificando datos de Brain Talents...");

  for (const talent of Object.values(NEW_TALENT_MAPPING)) {
    const count = await prisma.benchmarkDataPoint.count({
      where: {
        benchmarkId: benchmark.id,
        [talent]: { not: null },
      },
    });
    console.log(`   ${talent}: ${count} registros con datos`);
  }

  console.log("\n✅ Importación completada!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
