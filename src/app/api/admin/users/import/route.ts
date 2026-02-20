import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";
import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";

/* =========================================================
   🧠 Helper — Detectar y parsear CSV o XLSX
========================================================= */
async function parseFile(file: File): Promise<any[]> {
  const buffer = Buffer.from(await file.arrayBuffer());

  // 📘 Excel
  if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet);
  }

  // 📗 CSV
  const csvData = buffer.toString("utf8");
  return parse(csvData, {
    columns: true,
    skip_empty_lines: true,
  });
}

/* =========================================================
   📤 POST — Importar usuarios y snapshots desde CSV/Excel
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser().catch(() => null);
    if (!auth)
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const tenantId = formData.get("tenantId") as string | null;

    if (!file)
      return NextResponse.json({ ok: false, error: "No se adjuntó archivo" }, { status: 400 });

    const rows = await parseFile(file);
    console.log(`📥 Importando ${rows.length} filas desde ${file.name}`);

    let created = 0;
    let updated = 0;

    for (const row of rows) {
      const email = String(row.Email || row.email || "").toLowerCase().trim();
      const firstName = String(row["Test Taker Name"] || row.FirstName || "").trim();
      const lastName = String(row["Test Taker Surname"] || row.LastName || "").trim();
      const name = [firstName, lastName].filter(Boolean).join(" ");

      if (!email) continue;

      // 1️⃣ Usuario existente o nuevo
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: name || email,
            primaryTenantId: tenantId,
            organizationRole: "VIEWER",
            active: true,
            allowAI: true,
          },
        });
        created++;
      } else {
        updated++;
      }

      // 2️⃣ Crear miembro de comunidad si no existe
      const member =
        (await prisma.communityMember.findFirst({ where: { email } })) ||
        (await prisma.communityMember.create({
          data: {
            email,
            name,
            tenantId: tenantId!,
            userId: user.id,
            status: "ACTIVE",
            country: row.Country || "Desconocido",
            role: row["Job Role"] || null,
          },
        }));

      // 3️⃣ Crear EQ Snapshot si hay puntajes válidos
      const totalEQ = parseFloat(row["Emotional Intelligence Score"]) || null;
      const k = parseInt(row["Know Yourself Score"]) || null;
      const c = parseInt(row["Choose Yourself Score"]) || null;
      const g = parseInt(row["Give Yourself Score"]) || null;

      if (totalEQ || k || c || g) {
        const snapshot = await prisma.eqSnapshot.create({
          data: {
            userId: user.id,
            memberId: member.id,
            dataset: row.Project || "Imported SEI",
            context: row.Sector || "General",
            K: k,
            C: c,
            G: g,
            EL: parseInt(row["Enhance Emotional Literacy Score"]) || null,
            RP: parseInt(row["Recognize Patterns Score"]) || null,
            ACT: parseInt(row["Apply Consequential Thinking Score"]) || null,
            NE: parseInt(row["Navigate Emotions Score"]) || null,
            IM: parseInt(row["Engage Intrinsic Motivation Score"]) || null,
            OP: parseInt(row["Excercise Optimism Score"]) || null,
            EMP: parseInt(row["Increase Empathy Score"]) || null,
            NG: parseInt(row["Pursue Noble Goals Score"]) || null,
            overall4: parseFloat(row["Overall 4 Outcome"]) || totalEQ,
            brainStyle: row["Profile"] || null,
            recentMood: row["Recent Mood"] || null,
            moodIntensity: row["Intensity"] || null,
          },
        });

        // 4️⃣ Crear outcomes (efectiveness, wellbeing, etc.)
        const outcomes = [
          ["Effectiveness", row.Effectiveness],
          ["Relationship", row.Relationship],
          ["QualityOfLife", row["Quality of Life"]],
          ["Wellbeing", row.Wellbeing],
        ];

        for (const [key, value] of outcomes) {
          if (!value) continue;
          await prisma.eqOutcomeSnapshot.create({
            data: {
              snapshotId: snapshot.id,
              key,
              score: parseInt(value) || 0,
            },
          });
        }
      }
    }

    console.log(`✅ Import completado: ${created} nuevos, ${updated} actualizados`);

    return NextResponse.json({
      ok: true,
      message: "Importación completada exitosamente",
      created,
      updated,
      total: rows.length,
    });
  } catch (err: any) {
    console.error("❌ Error POST /api/admin/users/import:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Error al importar usuarios" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ⚙️ Configuración dinámica
========================================================= */
export const dynamic = "force-dynamic";
export const preferredRegion = "iad1";