import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

export const runtime = "nodejs";
export const maxDuration = 120; // ⏱️ hasta 2 minutos para CSVs grandes

/* 🔧 Helpers */
function normKey(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_").toUpperCase();
}
function decodeWithFallback(buf: Buffer) {
  try {
    let text = new TextDecoder("latin1").decode(buf);
    text = text.replace(/^\uFEFF/, "").replace(/^\ï»¿/, "").trimStart();
    return text;
  } catch {
    let text = new TextDecoder().decode(buf);
    text = text.replace(/^\uFEFF/, "").replace(/^\ï»¿/, "").trimStart();
    return text;
  }
}
function toNum(v: any) {
  if (v === "" || v == null) return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
const toInt = (v: number | null | undefined) =>
  typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null;

function pick(row: Record<string, any>, aliases: string[]) {
  for (const a of aliases) {
    const k = normKey(a);
    if (k in row && row[k] !== "" && row[k] != null) return row[k];
  }
  return undefined;
}

/* 🧩 Alias de columnas CSV */
const A = {
  KY: ["Know Yourself Score", "Know Yourself", "KY", "K"],
  CY: ["Choose Yourself Score", "Choose Yourself", "CY", "C"],
  GY: ["Give Yourself Score", "Give Yourself", "GY", "G"],
  EL: ["Enhance Emotional Literacy Score", "Enhance Emotional Literacy", "EL"],
  RP: ["Recognize Patterns Score", "Recognize Patterns", "RP"],
  ACT: ["Apply Consequential Thinking Score", "Apply Consequential Thinking", "ACT"],
  NE: ["Navigate Emotions Score", "Navigate Emotions", "NE"],
  IM: ["Engage Intrinsic Motivation Score", "Intrinsic Motivation", "IM"],
  OP: ["Exercise Optimism Score", "Excercise Optimism Score", "Optimism", "OP"],
  EMP: ["Increase Empathy Score", "Empathy", "EMP"],
  NG: ["Pursue Noble Goals Score", "Noble Goals", "NG"],
  EFFECTIVENESS: ["Effectiveness"],
  RELATIONSHIPS: ["Relationship", "Relationships", "Relaciones"],
  WELLBEING: ["Wellbeing", "Bienestar"],
  QOL: ["Quality of Life", "Quality Of Life", "Calidad de Vida"],
  OVERALL4: ["Overall 4 Outcome", "Overall 4 Outcomes", "Overall EQ", "Overall"],
  TOTAL_EQ: ["Total EQ", "EQ Total", "TotalEQ", "Overall EQ Total"], // 🆕 nueva alias
  MOOD: ["Recent Mood", "Estado Emocional", "Mood"],
  INTENSITY: ["Intensity", "Intensidad"],
  BRAIN: ["Brain Style", "Profile", "BrainStyle", "Estilo Cerebral"],
  SUBS: {
    influence: ["Influence"],
    decisionMaking: ["Decision Making"],
    community: ["Community"],
    network: ["Network"],
    achievement: ["Achievement"],
    satisfaction: ["Satisfaction"],
    balance: ["Balance"],
    health: ["Health"],
  },
  TALENTS: {
    dataMining: ["DataMining", "Data Mining"],
    modeling: ["Modeling"],
    prioritizing: ["Prioritizing"],
    connection: ["Connection"],
    emotionalInsight: ["EmotionalInsight", "Emotional Insight"],
    collaboration: ["Collaboration"],
    reflecting: ["Reflecting", "Reflection"],
    adaptability: ["Adaptability"],
    criticalThinking: ["CriticalThinking", "Critical Thinking"],
    resilience: ["Resilience"],
    riskTolerance: ["RiskTolerance", "Risk Tolerance"],
    imagination: ["Imagination"],
    proactivity: ["Proactivity"],
    commitment: ["Commitment"],
    problemSolving: ["ProblemSolving", "Problem Solving"],
    vision: ["Vision"],
    design: ["Designing", "Design"],
    entrepreneurship: ["Entrepreneurship"],
  },
};

/* =========================================================
   📤 POST — Importar CSV (Self o Feedback)
========================================================= */
export async function POST(req: NextRequest) {
  const start = Date.now();

  try {
    const user = await getServerAuthUser();
    if (!user?.email)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const email = user.email.toLowerCase();

    // 📎 Validar archivo
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file)
      return NextResponse.json({ ok: false, error: 'Missing file: "file"' }, { status: 400 });

    // 🧍 Usuario (crear si no existe)
    let userRow = await prisma.user.findUnique({ where: { email } });
    if (!userRow) {
      userRow = await prisma.user.create({ data: { email, name: email.split("@")[0] } });
    }

    // 🧾 Parsear CSV (streaming)
    const buf = Buffer.from(await file.arrayBuffer());
    const text = decodeWithFallback(buf);
    const rows: Record<string, string>[] = [];
    const parser = parse(text, { columns: true, skip_empty_lines: true, trim: true });
    for await (const record of parser) rows.push(record);

    const normalized = rows.map((r) => {
      const o: Record<string, any> = {};
      for (const [k, v] of Object.entries(r)) o[normKey(k)] = v;
      return o;
    });

    let inserted = 0;

    for (const row of normalized) {
      const K = toInt(toNum(pick(row, A.KY)));
      const C = toInt(toNum(pick(row, A.CY)));
      const G = toInt(toNum(pick(row, A.GY)));
      const EL = toInt(toNum(pick(row, A.EL)));
      const RP = toInt(toNum(pick(row, A.RP)));
      const ACT = toInt(toNum(pick(row, A.ACT)));
      const NE = toInt(toNum(pick(row, A.NE)));
      const IM = toInt(toNum(pick(row, A.IM)));
      const OP = toInt(toNum(pick(row, A.OP)));
      const EMP = toInt(toNum(pick(row, A.EMP)));
      const NG = toInt(toNum(pick(row, A.NG)));

      const overall4 = toNum(pick(row, A.OVERALL4));
      const totalEQ = toNum(pick(row, A.TOTAL_EQ)); // 🆕 campo nuevo
      const brainStyle = (pick(row, A.BRAIN) || "").toString().trim() || null;
      const recentMood = (pick(row, A.MOOD) || "").toString().trim() || null;
      const moodIntensity = (pick(row, A.INTENSITY) || "").toString().trim() || null;

      const baseAll = [K, C, G, EL, RP, ACT, NE, IM, OP, EMP, NG];
      if (baseAll.every((v) => v == null)) continue;

      const snap = await prisma.eqSnapshot.create({
        data: {
          userId: userRow.id,
          dataset: "upload-csv",
          brainStyle,
          recentMood,
          moodIntensity,
          // Guardar competencias directamente en el snapshot
          K,
          C,
          G,
          EL,
          RP,
          ACT,
          NE,
          IM,
          OP,
          EMP,
          NG,
          overall4,
        },
      });

      const comps = { K, C, G, EL, RP, ACT, NE, IM, OP, EMP, NG };
      for (const [key, score] of Object.entries(comps)) {
        if (score != null)
          await prisma.eqCompetencySnapshot.create({ data: { snapshotId: snap.id, key, score } });
      }

      const OUT = {
        effectiveness: toInt(toNum(pick(row, A.EFFECTIVENESS))),
        relationships: toInt(toNum(pick(row, A.RELATIONSHIPS))),
        wellbeing: toInt(toNum(pick(row, A.WELLBEING))),
        qualityOfLife: toInt(toNum(pick(row, A.QOL))),
      };
      const outcomes = Object.entries(OUT)
        .filter(([_, v]) => v != null)
        .map(([key, score]) => ({ snapshotId: snap.id, key, score: score as number }));
      if (outcomes.length) await prisma.eqOutcomeSnapshot.createMany({ data: outcomes });

      for (const [key, aliases] of Object.entries(A.SUBS)) {
        const v = toInt(toNum(pick(row, aliases as string[])));
        if (v != null)
          await prisma.eqSubfactorSnapshot.create({ data: { snapshotId: snap.id, key, score: v } });
      }

      for (const [key, aliases] of Object.entries(A.TALENTS)) {
        const v = toInt(toNum(pick(row, aliases as string[])));
        if (v != null)
          await prisma.talentSnapshot.create({ data: { snapshotId: snap.id, key, score: v } });
      }

      // 🌈 Valores agregados
      const values: any[] = [];
      if (overall4 != null)
        values.push({ snapshotId: snap.id, key: "overall4", score: overall4 });
      if (totalEQ != null)
        values.push({ snapshotId: snap.id, key: "total_eq", score: totalEQ }); // 🆕 nuevo valor
      if (values.length)
        await prisma.eqValueSnapshot.createMany({ data: values });

      inserted++;
    }

    return NextResponse.json({
      ok: true,
      inserted,
      durationMs: Date.now() - start,
      message: `✅ ${inserted} registros importados correctamente (con Total EQ incluido).`,
    });
  } catch (e: any) {
    console.error("❌ Upload CSV error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Error interno" }, { status: 500 });
  }
}