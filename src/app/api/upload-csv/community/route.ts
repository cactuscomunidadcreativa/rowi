// src/app/api/upload-csv/community/route.ts
import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";
export const maxDuration = 120;

/* Helpers */
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

/* Aliases */
const A = {
  FIRST: ["Test Taker Name", "Nombre", "Name"],
  LAST: ["Test Taker Surname", "Apellido", "Surname"],
  EMAIL: ["Email", "Correo"],
  COUNTRY: ["Country", "País", "Pais"],
  BRAIN: ["Brain Style", "Profile", "BrainStyle", "Estilo Cerebral"],

  KY: ["Know Yourself Score", "Know Yourself", "KY", "K"],
  CY: ["Choose Yourself Score", "Choose Yourself", "CY", "C"],
  GY: ["Give Yourself Score", "Give Yourself", "GY", "G"],
  EL: ["Enhance Emotional Literacy Score", "Enhance Emotional Literacy", "EL"],
  RP: ["Recognize Patterns Score", "Recognize Patterns", "RP"],
  ACT: ["Apply Consequential Thinking Score", "Apply Consequential Thinking", "ACT"],
  NE: ["Navigate Emotions Score", "Navigate Emotions", "NE"],
  IM: ["Engage Intrinsic Motivation Score", "Engage Intrinsic Motivation", "IM"],
  OP: ["Exercise Optimism Score", "Exercise Optimism", "OP"],
  EMP: ["Increase Empathy Score", "Increase Empathy", "EMP"],
  NG: ["Pursue Noble Goals Score", "Pursue Noble Goals", "NG"],

  EFFECTIVENESS: ["Effectiveness"],
  RELATIONSHIPS: ["Relationship", "Relationships", "Relaciones"],
  WELLBEING: ["Wellbeing", "Bienestar"],
  QOL: ["Quality of Life", "Quality Of Life", "Calidad de Vida"],

  SUBS: {
    influence: ["Influence", "Influencia"],
    decisionMaking: ["Decision Making", "DecisionMaking", "Toma de decisiones"],
    network: ["Network", "Red"],
    community: ["Community", "Comunidad"],
    balance: ["Balance"],
    health: ["Health", "Salud"],
    achievement: ["Achievement", "Logro"],
    satisfaction: ["Satisfaction", "Satisfacción"],
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

export async function POST(req: NextRequest) {
  const partialErrors: Array<{ row: number; where: string; message: string }> = [];
  const newMembers: string[] = [];
  let membersUpserted = 0;
  let snapsInserted = 0;
  const start = Date.now();

  try {
    // 1️⃣ Sesión (JWT)
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toString().toLowerCase() || "";
    if (!email) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const owner = await prisma.user.findUnique({
      where: { email },
      select: { id: true, primaryTenantId: true },
    });
    if (!owner) return NextResponse.json({ ok: false, error: "Owner not found" }, { status: 404 });

    // 2️⃣ CSV
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ ok: false, error: 'Missing file: "file"' }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    const text = decodeWithFallback(buf);

    // Streaming parser
    const rows: Record<string, string>[] = [];
    const parser = parse(text, { columns: true, skip_empty_lines: true, trim: true });
    for await (const record of parser) rows.push(record);

    const normalizedRows = rows.map((r) => {
      const o: Record<string, any> = {};
      for (const [k, v] of Object.entries(r)) o[normKey(k)] = v;
      return o;
    });

    // Tenant a usar (forzamos el del owner)
    const tenantId = owner.primaryTenantId;
    if (!tenantId) throw new Error("Tenant no encontrado: primaryTenantId vacío en el usuario.");

    // 3️⃣ Procesar filas
    for (let i = 0; i < normalizedRows.length; i++) {
      const row = normalizedRows[i];
      try {
        // 🧩 Datos básicos
        let firstName = (pick(row, A.FIRST) || "").toString().trim();
        let lastName = (pick(row, A.LAST) || "").toString().trim();

        if (!lastName && firstName.includes(" ")) {
          const parts = firstName.split(" ");
          firstName = parts[0];
          lastName = parts.slice(1).join(" ");
        }

        const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || "Sin nombre";
        const emailM = (pick(row, A.EMAIL) || "").toString().trim().toLowerCase() || null;
        const country = (pick(row, A.COUNTRY) || "").toString().trim() || null;
        const brain = (pick(row, A.BRAIN) || "").toString().trim() || null;

        // ⚙️ Buscar si ya existe (preferir email)
        let member =
          emailM
            ? await prisma.communityMember.findUnique({ where: { email: emailM } })
            : await prisma.communityMember.findFirst({
                where: { ownerId: owner.id, name: fullName },
              });

        // 🧷 Crear o actualizar (asegurar ownerId y tenantId)
        if (!member) {
          member = await prisma.communityMember.create({
            data: {
              owner: { connect: { id: owner.id } },     // 👈 asegura ownerId
              tenant: { connect: { id: tenantId } },    // 👈 asegura tenantId
              firstName,
              lastName,
              name: fullName,
              email: emailM,
              country,
              brainStyle: brain,
              group: "Trabajo",
              closeness: "Neutral",
              source: "csv",
              status: "ACTIVE",
            },
          });
          newMembers.push(member.id);
        } else {
          await prisma.communityMember.update({
            where: { id: member.id },
            data: {
              // si faltaba, lo fijamos
              ownerId: member.ownerId ?? owner.id,
              tenantId: member.tenantId ?? tenantId,
              brainStyle: brain ?? member.brainStyle,
              country: country ?? member.country,
              group: "Trabajo",
              source: "csv",
              status: "ACTIVE",
            },
          });
        }
        membersUpserted++;

        // Dataset inferido
        const profileRaw = (row["Profile"] || "").toString().trim().toLowerCase();
        let dataset: "actual" | "history" | "feedback" = "actual";
        if (profileRaw.includes("hist")) dataset = "history";
        if (profileRaw.includes("feed")) dataset = "feedback";

        // 🧠 Competencias y KCG
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

        const baseAll = [K, C, G, EL, RP, ACT, NE, IM, OP, EMP, NG];

        // Si no hay ningún score, igual queremos que el miembro aparezca (saltamos snapshots)
        if (baseAll.some((v) => v != null)) {
          const snap = await prisma.eqSnapshot.create({
            data: { memberId: member.id, dataset, brainStyle: brain, K, C, G, EL, RP, ACT, NE, IM, OP, EMP, NG },
          });
          snapsInserted++;

          // Outcomes
          const OUT = {
            effectiveness: toInt(toNum(pick(row, A.EFFECTIVENESS))),
            relationships: toInt(toNum(pick(row, A.RELATIONSHIPS))),
            wellbeing: toInt(toNum(pick(row, A.WELLBEING))),
            qualityOfLife: toInt(toNum(pick(row, A.QOL))),
          };
          const outData = Object.entries(OUT)
            .filter(([_, v]) => v != null)
            .map(([key, score]) => ({ snapshotId: snap.id, key, score: score as number }));
          if (outData.length) await prisma.eqOutcomeSnapshot.createMany({ data: outData });

          // Subfactores
          const SF = Object.entries(A.SUBS)
            .map(([key, aliases]) => {
              const v = toInt(toNum(pick(row, aliases as string[])));
              return v != null ? { snapshotId: snap.id, key, score: v } : null;
            })
            .filter(Boolean) as { snapshotId: string; key: string; score: number }[];
          if (SF.length) await prisma.eqSubfactorSnapshot.createMany({ data: SF });

          // Talentos
          const TAL = Object.entries(A.TALENTS)
            .map(([key, aliases]) => {
              const v = toInt(toNum(pick(row, aliases as string[])));
              return v != null ? { snapshotId: snap.id, key, score: v } : null;
            })
            .filter(Boolean) as { snapshotId: string; key: string; score: number }[];
          if (TAL.length) await prisma.talentSnapshot.createMany({ data: TAL });
        }
      } catch (err: any) {
        partialErrors.push({ row: i + 1, where: "row", message: err?.message || String(err) });
      }
    }

    // 🚀 Recalcular afinidad SOLO para nuevos miembros (best-effort)
    if (newMembers.length > 0) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        await Promise.all(
          newMembers.map((id) =>
            fetch(`${baseUrl}/api/affinity?memberId=${id}`, { method: "GET" })
          )
        );
      } catch (autoErr) {
        console.warn("⚠️ Recalculo parcial falló:", autoErr);
      }
    }

    return NextResponse.json({
      ok: true,
      membersUpserted,
      snapsInserted,
      recalculated: newMembers.length,
      partialErrors,
      message: "✅ Comunidad actualizada correctamente.",
      durationMs: Date.now() - start,
    });
  } catch (e: any) {
    console.error("❌ CSV upload error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error interno" },
      { status: 500 }
    );
  }
}