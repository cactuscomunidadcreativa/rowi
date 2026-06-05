/**
 * Step 2 — Calibrate the BE2GROW engine (v0 → v1) from real SEI + LVS pairs.
 *
 * For each person who has BOTH a SEI report and an LVS self-report:
 *   1. inferred  = calculateVitalSigns(SEI competencies + Brain Talents)   [70-130]
 *   2. measured  = applyPulseMap(LVS answers, "LVS")  via the secret map    [1-5 → 70-130]
 *   3. write PulsePointInference (inferred) + PulsePointGroundTruth (delta)
 *
 * The accumulated ground truth feeds /api/research/calibration, which is what
 * promotes hypothesis weights (v0) toward data-driven weights (v1).
 *
 * PRIVACY / SECRECY:
 *   - Runs LOCALLY only. The secret map is read from env ROWI_VS_PULSE_MAP;
 *     if absent the script refuses to run (no silent partial calibration).
 *   - NO PII is written to the DB. snapshotRef is a salted hash of the email,
 *     never the name/email itself. The CSVs stay on disk.
 *
 * Scale note (the lesson from the June 2026 analysis):
 *   LVS is a generous 1-5 self-assessment; SEI is normed 70-130. They are not
 *   comparable on the absolute scale. We linearly project LVS 1-5 → 70-130
 *   ( v -> 70 + (v-1)/4*60 ) ONLY so delta has a consistent unit. The
 *   calibration endpoint should read deltas as directional signal, and the
 *   product-facing SEI↔LVS cross uses per-person z-scores (see Step 3).
 *
 * Run:
 *   ROWI_VS_PULSE_MAP="$(cat ~/secret/rowi_vs_map.json | base64)" \
 *     pnpm dlx tsx scripts/calibrate-lvs-ground-truth.ts
 *
 * Inputs (local, default ~/Downloads): report*.csv files containing SEI columns
 * and the LVS self-report block. LVS answers (q1..q34) are read per person.
 */

import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";
import { calculateVitalSigns } from "@/lib/vital-signs/calculate";
import type { InputSeiCompetencies, InputBrainTalents } from "@/lib/vital-signs/calculate";
import { applyPulseMap, hasSecretPulseMap } from "@/lib/vital-signs/secret-map";

const prisma = new PrismaClient();
const HOME = os.homedir();
const DOWNLOADS = path.join(HOME, "Downloads");
const WEIGHTS_VERSION = "v0-hypothesis"; // inference uses the hardcoded catalog
const SNAPSHOT_PREFIX = "calib:lvs:";
const SALT = process.env.ROWI_CALIB_SALT ?? "rowi-local-calib";

// Report files that bundle SEI + the LVS self-report block.
const REPORT_FILES = [
  "report.csv", "report (1).csv", "report (2).csv", "report (4).csv",
  "report (5).csv", "report (6).csv", "report (7).csv", "report (8).csv",
];

// SEI competency CSV column → calculate.ts key.
const COMP_COL: Record<keyof InputSeiCompetencies, string> = {
  EL: "Enhance Emotional Literacy Score",
  RP: "Recognize Patterns Score",
  ACT: "Apply Consequential Thinking Score",
  NE: "Navigate Emotions Score",
  IM: "Engage Intrinsic Motivation Score",
  OP: "Excercise Optimism Score", // sic — Six Seconds CSV spelling
  EMP: "Increase Empathy Score",
  NG: "Pursue Noble Goals Score",
};

// Brain talent CSV column (PascalCase) → calculate.ts key (lowercase).
const TALENT_COL: Record<string, keyof InputBrainTalents> = {
  DataMining: "datamining", Modeling: "modeling", Prioritizing: "prioritizing",
  Connection: "connection", EmotionalInsight: "emotionalinsight", Collaboration: "collaboration",
  Reflecting: "reflecting", Adaptability: "adaptability", CriticalThinking: "criticalthinking",
  Resilience: "resilience", RiskTolerance: "risktolerance", Imagination: "imagination",
  Proactivity: "proactivity", Commitment: "commitment", ProblemSolving: "problemsolving",
  Vision: "vision", Designing: "designing", Entrepreneurship: "entrepreneurship",
};

const toFloat = (v: unknown): number | null => {
  if (v === undefined || v === null || v === "") return null;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

const lvsTo130 = (v: number): number => 70 + ((v - 1) / 4) * 60;

const hashRef = (email: string): string =>
  SNAPSHOT_PREFIX +
  crypto.createHmac("sha256", SALT).update(email.toLowerCase().trim()).digest("hex").slice(0, 16);

interface Person {
  ref: string;
  sei: InputSeiCompetencies;
  talents: InputBrainTalents;
  lvsItems: Record<string, number | null>; // q1..q34
}

function readPeople(): Person[] {
  const byRef = new Map<string, Person>();

  for (const file of REPORT_FILES) {
    const fp = path.join(DOWNLOADS, file);
    if (!fs.existsSync(fp)) continue;
    const rows: Record<string, string>[] = parse(fs.readFileSync(fp, "utf-8"), {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
    });

    for (const row of rows) {
      const email = (row["Email"] ?? "").trim();
      if (!email) continue;

      // LVS block: 34 self-report answers live in columns "1".."34" only when
      // the report includes the LVS self-report. Detect via presence of an
      // LVS-specific column the export uses. We read q1..q34 by header index.
      const lvsItems: Record<string, number | null> = {};
      let lvsFilled = 0;
      for (let q = 1; q <= 34; q++) {
        const v = toFloat(row[`LVS_Q${q}`] ?? row[`Q${q}`] ?? row[String(q)]);
        lvsItems[`q${q}`] = v;
        if (v !== null) lvsFilled++;
      }
      // Require a substantially complete LVS to count as a pair.
      if (lvsFilled < 30) continue;

      const sei = {} as InputSeiCompetencies;
      let seiFilled = 0;
      for (const k of Object.keys(COMP_COL) as Array<keyof InputSeiCompetencies>) {
        const v = toFloat(row[COMP_COL[k]]);
        sei[k] = v;
        if (v !== null) seiFilled++;
      }
      if (seiFilled < 6) continue;

      const talents: InputBrainTalents = {};
      for (const [col, key] of Object.entries(TALENT_COL)) {
        talents[key] = toFloat(row[col]);
      }

      const ref = hashRef(email);
      if (!byRef.has(ref)) byRef.set(ref, { ref, sei, talents, lvsItems });
    }
  }

  return [...byRef.values()];
}

async function main() {
  if (!hasSecretPulseMap("LVS")) {
    console.error(
      "✗ ROWI_VS_PULSE_MAP not provisioned for LVS. Set it locally before running.\n" +
        '  ROWI_VS_PULSE_MAP="$(cat map.json | base64)" pnpm dlx tsx scripts/calibrate-lvs-ground-truth.ts',
    );
    process.exit(1);
  }

  const people = readPeople();
  console.log(`Found ${people.length} people with SEI + complete LVS.`);
  if (people.length === 0) {
    console.log("Nothing to calibrate.");
    return;
  }

  // Idempotent: wipe prior calibration rows for this batch (cascade clears GT).
  const cleared = await prisma.pulsePointInference.deleteMany({
    where: { snapshotRef: { startsWith: SNAPSHOT_PREFIX } },
  });
  console.log(`Cleared ${cleared.count} prior calibration inferences.`);

  let infCount = 0;
  let gtCount = 0;

  for (const p of people) {
    const inferred = calculateVitalSigns(p.sei, p.talents);
    const measured = applyPulseMap(p.lvsItems, "LVS");
    if (!measured) continue;
    const measuredByCode = new Map(measured.map((m) => [m.code, m.score]));

    for (const pp of inferred.pulsePoints) {
      if (pp.score === null) continue;
      const measuredRaw = measuredByCode.get(pp.code);
      if (measuredRaw === undefined) continue;
      const measured130 = lvsTo130(measuredRaw);

      const inf = await prisma.pulsePointInference.create({
        data: {
          pulsePointCode: pp.code,
          inferredScore: pp.score,
          competencyComp: pp.competencyComponent,
          talentComp: pp.talentComponent,
          weightsVersion: WEIGHTS_VERSION,
          snapshotRef: p.ref,
        },
      });
      infCount++;

      await prisma.pulsePointGroundTruth.create({
        data: {
          inferenceId: inf.id,
          source: "LVS_CSV",
          measuredScore: measured130,
          measuredAt: new Date(),
          delta: measured130 - pp.score,
        },
      });
      gtCount++;
    }
  }

  console.log(`✓ Wrote ${infCount} inferences and ${gtCount} ground-truth rows.`);
  console.log("Now check /api/research/calibration to see per-pulse-point deltas.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
