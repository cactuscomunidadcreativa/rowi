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

const safeDate = (v: any): Date | null => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

const SUBFACTORS: Record<string, string> = {
  "Enhance Emotional Literacy Score": "EL",
  "Recognize Patterns Score": "RP",
  "Apply Consequential Thinking Score": "ACT",
  "Navigate Emotions Score": "NE",
  "Engage Intrinsic Motivation Score": "IM",
  "Excercise Optimism Score": "OP",
  "Increase Empathy Score": "EMP",
  "Pursue Noble Goals Score": "NG",
};

const SUCCESS_FACTORS = [
  "Influence", "Decision Making", "Community", "Network",
  "Achievement", "Satisfaction", "Balance", "Health",
];

const TALENTS = [
  "DataMining", "Modeling", "Prioritizing", "Connection",
  "EmotionalInsight", "Collaboration", "Reflecting", "Adaptability",
  "CriticalThinking", "Resilience", "RiskTolerance", "Imagination",
  "Proactivity", "Commitment", "ProblemSolving", "Vision",
  "Designing", "Entrepreneurship", "Brain Agility",
];

async function main() {
  const csvPath = path.join(process.cwd(), "public/test/be2growplaning.csv");
  const csvText = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
  const rows = parse(csvText, { columns: true, skip_empty_lines: true, trim: true });

  console.log(`📊 CSV loaded: ${rows.length} rows`);

  // 1. Get Eduardo (creator)
  const creator = await prisma.user.findUnique({
    where: { email: "eduardo.gonzalez@6seconds.org" },
  });
  console.log("👤 Creator:", creator?.name);

  // Use Six Seconds Global tenant for Be2Grow (it's a 6S project)
  const DEFAULT_TENANT_ID = "cml1fei9l000b0mg8kmymeuvc"; // Six Seconds Global

  // 2. Create or find community
  const projectName = (rows[0].Project || "Be2Grow").trim();
  const slug = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const owner = rows[0].Owner || null;
  const language = rows[0]["Items Language"] || null;
  const executionTime = toInt(rows[0]["Execution Time"]);

  let community = await prisma.rowiCommunity.findUnique({ where: { slug } });

  if (!community) {
    community = await prisma.rowiCommunity.create({
      data: {
        name: projectName,
        slug,
        owner: owner || undefined,
        language: language || undefined,
        executionTime: executionTime ?? undefined,
        createdById: creator?.id,
        tenantId: DEFAULT_TENANT_ID,
        description: `Comunidad importada desde CSV (${projectName})`,
      },
    });
    console.log("✅ Community CREATED:", community.name, community.id);
  } else {
    console.log("ℹ️ Community already exists:", community.name, community.id);
  }

  // 3. Process rows
  const stats = {
    usersCreated: 0,
    membersCreated: 0,
    snapshotsCreated: 0,
    competencies: 0,
    subfactors: 0,
    outcomes: 0,
    success: 0,
    talents: 0,
  };

  for (const row of rows) {
    const email = (row.Email || "").trim().toLowerCase();
    if (!email) {
      console.log("⚠️ Skipping row with no email");
      continue;
    }

    console.log(
      `\n--- Processing: ${row["Test Taker Name"]} ${row["Test Taker Surname"]} (${email})`
    );

    // 3.1 Create/find user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: [row["Test Taker Name"], row["Test Taker Surname"]]
            .filter(Boolean)
            .join(" ")
            .trim() || null,
          active: true,
          country: row["Country"]?.trim() || null,
          language: row["Items Language"]?.trim()?.toLowerCase() || null,
        },
      });
      stats.usersCreated++;
      console.log("  ✅ User CREATED:", user.name);
    } else {
      console.log("  ℹ️ User exists:", user.name);
    }

    // 3.2 RowiVerseUser
    let rowiVerseUser = await prisma.rowiVerseUser.findUnique({
      where: { userId: user.id },
    });
    if (!rowiVerseUser) {
      rowiVerseUser = await prisma.rowiVerseUser.findUnique({
        where: { email: user.email },
      });
    }
    if (!rowiVerseUser) {
      rowiVerseUser = await prisma.rowiVerseUser.create({
        data: {
          userId: user.id,
          email: user.email,
          name: user.name,
          language: user.language || "es",
          verified: false,
          active: true,
          status: "pending",
        },
      });
      console.log("  ✅ RowiVerseUser CREATED");
    } else {
      console.log("  ℹ️ RowiVerseUser exists");
    }

    // Link user to rowiverse
    if (!user.rowiverseId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { rowiverseId: rowiVerseUser.id },
      });
    }

    // 3.3 Community member
    let communityUser = await prisma.rowiCommunityUser.findFirst({
      where: { communityId: community.id, userId: user.id },
    });
    if (!communityUser) {
      communityUser = await prisma.rowiCommunityUser.create({
        data: {
          userId: user.id,
          communityId: community.id,
          rowiverseUserId: rowiVerseUser.id,
          email: user.email,
          name: user.name,
          role: "member",
          status: "active",
          language: user.language || community.language || "es",
        },
      });
      stats.membersCreated++;
      console.log("  ✅ Community member CREATED");
    } else {
      console.log("  ℹ️ Community member exists");
    }

    // 3.4 Legacy member
    const effectiveTenantId = community.tenantId || DEFAULT_TENANT_ID;
    let legacyMember = await prisma.communityMember.findFirst({
      where: { email, tenantId: effectiveTenantId },
    });
    if (!legacyMember) {
      legacyMember = await prisma.communityMember.create({
        data: {
          email,
          name: user.name,
          userId: user.id,
          tenantId: effectiveTenantId,
          rowiverseUserId: rowiVerseUser.id,
          role: "member",
          status: "ACTIVE",
          joinedAt: new Date(),
        },
      });
      console.log("  ✅ Legacy member CREATED");
    } else {
      console.log("  ℹ️ Legacy member exists");
    }

    // 3.5 EQ Snapshot
    const snapshot = await prisma.eqSnapshot.create({
      data: {
        user: { connect: { id: user.id } },
        member: { connect: { id: legacyMember.id } },
        rowiverseUser: { connect: { id: rowiVerseUser.id } },
        dataset: "SEI",
        project: row.Project || null,
        owner: row.Owner || null,
        country: row.Country || null,
        email,
        jobFunction: row["Job Function"] || null,
        jobRole: row["Job Role"] || null,
        sector: row.Sector || null,
        age: toInt(row.Age),
        gender: row.Gender || null,
        education: row.Education || null,
        phone: row.Phone || null,
        context: row["Items Language"] || null,
        at: safeDate(row.Date) || new Date(),
        K: toInt(row["Know Yourself Score"]),
        C: toInt(row["Choose Yourself Score"]),
        G: toInt(row["Give Yourself Score"]),
        EL: toInt(row["Enhance Emotional Literacy Score"]),
        RP: toInt(row["Recognize Patterns Score"]),
        ACT: toInt(row["Apply Consequential Thinking Score"]),
        NE: toInt(row["Navigate Emotions Score"]),
        IM: toInt(row["Engage Intrinsic Motivation Score"]),
        OP: toInt(row["Excercise Optimism Score"]),
        EMP: toInt(row["Increase Empathy Score"]),
        NG: toInt(row["Pursue Noble Goals Score"]),
        brainStyle: row["Profile"] || null,
        overall4: toFloat(row["Overall 4 Outcome"]),
        recentMood: row["Recent Mood"] || null,
        moodIntensity: row["Intensity"] ? String(row["Intensity"]) : null,
        reliabilityIndex: toFloat(row["Reliability Index"]),
        positiveImpressionScore: toFloat(row["Positive Impression Score"]),
        positiveImpressionRange: row["Positive Impression Range"] || null,
        executionTimeRange: row["Execution Time Range"] || null,
        randomIndex: toFloat(row["Random Index"]),
        densityIndex: toFloat(row["Density Index"]),
        answerStyle: row["AnswerStyle"] || null,
        normFactorComplement: toFloat(row["NormFactorComplement"]),
        consistencyOutput: toFloat(row["ConsistencyOutput"]),
      },
    });
    stats.snapshotsCreated++;
    console.log("  ✅ EQ Snapshot CREATED:", snapshot.id);

    // 3.6 Competencies
    for (const c of [
      { key: "K", label: "Know Yourself", value: toFloat(row["Know Yourself Score"]) },
      { key: "C", label: "Choose Yourself", value: toFloat(row["Choose Yourself Score"]) },
      { key: "G", label: "Give Yourself", value: toFloat(row["Give Yourself Score"]) },
    ]) {
      if (c.value != null) {
        await prisma.eqCompetencySnapshot.create({
          data: { snapshotId: snapshot.id, key: c.key, label: c.label, score: c.value },
        });
        stats.competencies++;
      }
    }

    // 3.7 Subfactors
    for (const label in SUBFACTORS) {
      const val = toFloat(row[label]);
      if (val != null) {
        await prisma.eqSubfactorSnapshot.create({
          data: { snapshotId: snapshot.id, key: SUBFACTORS[label], label, score: val },
        });
        stats.subfactors++;
      }
    }

    // 3.8 Outcomes
    for (const o of [
      { key: "Effectiveness", label: "Effectiveness", value: toFloat(row["Effectiveness"]) },
      { key: "Relationship", label: "Relationship", value: toFloat(row["Relationship"]) },
      { key: "QualityOfLife", label: "Quality of Life", value: toFloat(row["Quality of Life"]) },
      { key: "Wellbeing", label: "Wellbeing", value: toFloat(row["Wellbeing"]) },
      { key: "Overall4", label: "Overall 4 Outcome", value: toFloat(row["Overall 4 Outcome"]) },
    ]) {
      if (o.value != null) {
        await prisma.eqOutcomeSnapshot.create({
          data: { snapshotId: snapshot.id, key: o.key, label: o.label, score: o.value },
        });
        stats.outcomes++;
      }
    }

    // 3.9 Success Factors
    for (const key of SUCCESS_FACTORS) {
      const val = toFloat(row[key]);
      if (val != null) {
        await prisma.eqSuccessFactorSnapshot.create({
          data: { snapshotId: snapshot.id, key, label: key, score: val },
        });
        stats.success++;
      }
    }

    // 3.10 Talents
    for (const key of TALENTS) {
      const val = toFloat(row[key]);
      if (val != null) {
        await prisma.talentSnapshot.create({
          data: { snapshotId: snapshot.id, key, label: key, score: val },
        });
        stats.talents++;
      }
    }

    console.log("  ✅ All data saved for", row["Test Taker Name"]);
  }

  console.log("\n\n🎉 === IMPORT COMPLETE ===");
  console.log("📊 Stats:", JSON.stringify(stats, null, 2));
  console.log("🏠 Community:", community.name, "(", community.id, ")");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
