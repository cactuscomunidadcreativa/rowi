/**
 * 🧠 API: Six Seconds CSV Import
 * POST /api/admin/six-seconds/import - Importar CSV con resultados SEI
 *
 * Este endpoint procesa el CSV exportado de Six Seconds y:
 * 1. Crea EqSnapshots para cada usuario encontrado
 * 2. Actualiza el estado de usuarios PENDING_SEI -> ACTIVE
 * 3. Contribuye automáticamente al RowiVerse
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";
import { parse } from "csv-parse/sync";
import { contributeBatchToRowiverse, ContributionInput } from "@/lib/rowiverse/contribution-service";
import { syncSeiLevel, createInitialAvatar } from "@/services/avatar-evolution";

// Mapeo de columnas del CSV de Six Seconds
const COLUMN_MAPPING: Record<string, string> = {
  "Email": "email",
  "Test Taker Name": "firstName",
  "Test Taker Surname": "lastName",
  "Know Yourself Score": "K",
  "Choose Yourself Score": "C",
  "Give Yourself Score": "G",
  "Enhance Emotional Literacy Score": "EL",
  "Recognize Patterns Score": "RP",
  "Apply Consequential Thinking Score": "ACT",
  "Navigate Emotions Score": "NE",
  "Engage Intrinsic Motivation Score": "IM",
  "Excercise Optimism Score": "OP",
  "Increase Empathy Score": "EMP",
  "Pursue Noble Goals Score": "NG",
  "Effectiveness": "effectiveness",
  "Relationship": "relationships",
  "Quality of Life": "qualityOfLife",
  "Wellbeing": "wellbeing",
  "Country": "country",
  "Job Function": "jobFunction",
  "Job Role": "jobRole",
  "Sector": "sector",
  "Age": "age",
  "Gender": "gender",
  "Education": "education",
  "Date": "date",
  "Profile": "brainStyle",
};

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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "csv_file_required" },
        { status: 400 }
      );
    }

    // Crear registro de importación
    const importRecord = await prisma.sixSecondsImport.create({
      data: {
        filename: file.name,
        fileSize: file.size,
        status: "PROCESSING",
        uploadedBy: session.user.email,
      },
    });

    // Parsear CSV
    const buffer = Buffer.from(await file.arrayBuffer());
    const csvText = buffer.toString("utf8").replace(/^\uFEFF/, "");
    const rows = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    if (!rows.length) {
      await prisma.sixSecondsImport.update({
        where: { id: importRecord.id },
        data: { status: "FAILED", errors: [{ error: "csv_empty" }] },
      });
      return NextResponse.json({ error: "csv_empty" }, { status: 400 });
    }

    const stats = {
      totalRows: rows.length,
      processedRows: 0,
      matchedUsers: 0,
      newSnapshots: 0,
      activatedUsers: 0,
      failedRows: 0,
      errors: [] as Array<{ row: number; email?: string; error: string }>,
    };

    const rowiverseContributions: ContributionInput[] = [];

    // Procesar cada fila
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        // Mapear columnas
        const data: Record<string, any> = {};
        for (const [csvCol, fieldName] of Object.entries(COLUMN_MAPPING)) {
          if (row[csvCol] !== undefined) {
            data[fieldName] = row[csvCol];
          }
        }

        const email = (data.email || "").toLowerCase().trim();
        if (!email) {
          stats.errors.push({ row: i + 2, error: "missing_email" });
          stats.failedRows++;
          continue;
        }

        // Buscar usuario en Rowi
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            onboardingStatus: true,
            seiRequested: true,
            contributeToRowiverse: true,
          },
        });

        if (!user) {
          stats.errors.push({
            row: i + 2,
            email,
            error: "user_not_found",
          });
          stats.failedRows++;
          continue;
        }

        stats.matchedUsers++;

        // Buscar o crear CommunityMember
        let member = await prisma.communityMember.findFirst({
          where: { email },
        });

        if (!member) {
          member = await prisma.communityMember.create({
            data: {
              email,
              name:
                [data.firstName, data.lastName].filter(Boolean).join(" ") ||
                user.name,
              userId: user.id,
              role: "member",
              status: "ACTIVE",
              joinedAt: new Date(),
            },
          });
        }

        // Crear EqSnapshot
        const snapshot = await prisma.eqSnapshot.create({
          data: {
            userId: user.id,
            memberId: member.id,
            dataset: "SEI",
            email,
            country: data.country || null,
            jobFunction: data.jobFunction || null,
            jobRole: data.jobRole || null,
            sector: data.sector || null,
            age: toInt(data.age),
            gender: data.gender || null,
            education: data.education || null,
            at: data.date ? new Date(data.date) : new Date(),
            K: toInt(data.K),
            C: toInt(data.C),
            G: toInt(data.G),
            EL: toInt(data.EL),
            RP: toInt(data.RP),
            ACT: toInt(data.ACT),
            NE: toInt(data.NE),
            IM: toInt(data.IM),
            OP: toInt(data.OP),
            EMP: toInt(data.EMP),
            NG: toInt(data.NG),
            brainStyle: data.brainStyle || null,
          },
        });

        stats.newSnapshots++;

        // Actualizar SeiRequest si existe
        await prisma.seiRequest.updateMany({
          where: {
            userId: user.id,
            status: { in: ["PENDING", "SENT", "IN_PROGRESS"] },
          },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            resultSnapshotId: snapshot.id,
          },
        });

        // Activar usuario si estaba en PENDING_SEI
        if (user.onboardingStatus === "PENDING_SEI") {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              onboardingStatus: "ACTIVE",
              seiCompletedAt: new Date(),
            },
          });
          stats.activatedUsers++;
        }

        // Sincronizar nivel Six Seconds del avatar
        try {
          await createInitialAvatar(user.id, data.brainStyle);
          await syncSeiLevel(user.id);
        } catch (avatarError) {
          console.warn(`⚠️ Error syncing avatar for ${email}:`, avatarError);
        }

        // Preparar contribución al RowiVerse
        if (user.contributeToRowiverse !== false) {
          const eqTotal =
            toFloat(data.K) && toFloat(data.C) && toFloat(data.G)
              ? Math.round(
                  ((toFloat(data.K) || 0) +
                    (toFloat(data.C) || 0) +
                    (toFloat(data.G) || 0)) /
                    3
                )
              : null;

          rowiverseContributions.push({
            userId: user.id,
            memberId: member.id,
            sourceType: "eq_snapshot",
            sourceId: snapshot.id,
            eqData: {
              eqTotal,
              K: toFloat(data.K),
              C: toFloat(data.C),
              G: toFloat(data.G),
              EL: toFloat(data.EL),
              RP: toFloat(data.RP),
              ACT: toFloat(data.ACT),
              NE: toFloat(data.NE),
              IM: toFloat(data.IM),
              OP: toFloat(data.OP),
              EMP: toFloat(data.EMP),
              NG: toFloat(data.NG),
            },
            demographics: {
              country: data.country || null,
              sector: data.sector || null,
              jobFunction: data.jobFunction || null,
              jobRole: data.jobRole || null,
              ageRange: data.age ? String(data.age) : null,
              gender: data.gender || null,
              education: data.education || null,
            },
            outcomes: {
              effectiveness: toFloat(data.effectiveness),
              relationships: toFloat(data.relationships),
              qualityOfLife: toFloat(data.qualityOfLife),
              wellbeing: toFloat(data.wellbeing),
            },
          });
        }

        stats.processedRows++;
      } catch (rowError) {
        stats.errors.push({
          row: i + 2,
          error:
            rowError instanceof Error ? rowError.message : "processing_error",
        });
        stats.failedRows++;
      }
    }

    // Contribuir al RowiVerse en batch
    if (rowiverseContributions.length > 0) {
      try {
        await contributeBatchToRowiverse(rowiverseContributions);
        console.log(
          `🌐 RowiVerse: ${rowiverseContributions.length} contribuciones desde Six Seconds import`
        );
      } catch (err) {
        console.warn("⚠️ Error contribuyendo al RowiVerse:", err);
      }
    }

    // Actualizar registro de importación
    await prisma.sixSecondsImport.update({
      where: { id: importRecord.id },
      data: {
        status:
          stats.failedRows === 0
            ? "COMPLETED"
            : stats.processedRows > 0
            ? "PARTIAL"
            : "FAILED",
        totalRows: stats.totalRows,
        processedRows: stats.processedRows,
        matchedUsers: stats.matchedUsers,
        newSnapshots: stats.newSnapshots,
        activatedUsers: stats.activatedUsers,
        failedRows: stats.failedRows,
        errors: stats.errors.length > 0 ? stats.errors : null,
        processedAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      importId: importRecord.id,
      stats,
    });
  } catch (error) {
    console.error("❌ Error importing Six Seconds CSV:", error);
    return NextResponse.json(
      { error: "import_failed" },
      { status: 500 }
    );
  }
}
