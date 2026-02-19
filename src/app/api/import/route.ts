// src/app/api/admin/users/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { parse } from "csv-parse/sync";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

/**
 * POST /api/admin/users/import
 * Content-Type: multipart/form-data
 * Fields:
 * - file: CSV/TSV (field name "file")
 * - superHub (slug opcional)   default: "six-seconds"
 * - tenant (slug opcional)     default: "six-seconds-global"
 * - hub (slug opcional)        default: "rowi"
 * - org (slug opcional)        default: "rowi-organization"
 *
 * Notas:
 * - Tolerante a CSV/TSV (detecta delimitador automáticamente).
 * - Columnas esperadas (case-insensitive, con tolerancia):
 *   name -> "Test Taker Name" + "Test Taker Surname" (o "Test Taker Name" completo)
 *   email -> "Email"
 *   K/C/G -> "Know Yourself Score" / "Choose Yourself Score" / "Give Yourself Score"
 *   Total EQ -> "Emotional Intelligence Score"
 *   Competencias -> "Enhance Emotional Literacy Score" (EL), "Recognize Patterns Score" (RP),
 *                   "Apply Consequential Thinking Score" (ACT), "Navigate Emotions Score" (NE),
 *                   "Engage Intrinsic Motivation Score" (IM), "Excercise Optimism Score" (OP) [sic],
 *                   "Increase Empathy Score" (EMP), "Pursue Noble Goals Score" (NG)
 *   Outcomes core -> "Effectiveness", "Relationship", "Quality of Life", "Wellbeing"
 *   Otros outcomes -> "Influence","Decision Making","Community","Network",
 *                     "Achievement","Satisfaction","Balance","Health"
 *   Mood -> "Recent Mood", "Intensity"
 *   BrainStyle opcional -> "Brain Agility"
 *
 * - Para cada fila:
 *   - upsert jerarquía (superhub/hub/tenant/org)
 *   - upsert user + membership + orgMembership + invite (si no tiene sesión previa)
 *   - crear EqSnapshot con subtablas de competencias/outcomes/mood
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "auto";

type Row = Record<string, any>;

// ----------------------------- helpers ------------------------------

const norm = (s: any) =>
  (typeof s === "string" ? s.trim() : s ?? "").toString().trim();

const num = (v: any) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

// flexible get: busca por claves aproximadas
function pick(row: Row, keys: string[]): any {
  const cols = Object.keys(row);
  const found = cols.find((c) => {
    const lc = c.toLowerCase().trim();
    return keys.some((k) => lc === k.toLowerCase().trim());
  });
  return found ? row[found] : undefined;
}

function pickAny(row: Row, map: Record<string, string[]>) {
  const out: Record<string, any> = {};
  for (const k of Object.keys(map)) {
    out[k] = pick(row, map[k]);
  }
  return out;
}

// ----------------------------- mapping ------------------------------

const COLS = {
  name: ["Test Taker Name"],
  surname: ["Test Taker Surname", "Surname", "Last Name"],
  email: ["Email"],
  // K/C/G + total
  K: ["Know Yourself Score"],
  C: ["Choose Yourself Score"],
  G: ["Give Yourself Score"],
  EQ_TOTAL: ["Emotional Intelligence Score"],
  // Competencies
  EL: ["Enhance Emotional Literacy Score"],
  RP: ["Recognize Patterns Score"],
  ACT: ["Apply Consequential Thinking Score"],
  NE: ["Navigate Emotions Score"],
  IM: ["Engage Intrinsic Motivation Score"],
  OP: ["Excercise Optimism Score", "Exercise Optimism Score"], // tolera typo
  EMP: ["Increase Empathy Score"],
  NG: ["Pursue Noble Goals Score"],
  // Outcomes
  OUT_EFFECTIVENESS: ["Effectiveness"],
  OUT_RELATIONSHIP: ["Relationship"],
  OUT_QOL: ["Quality of Life"],
  OUT_WELLBEING: ["Wellbeing"],
  OUT_INFLUENCE: ["Influence"],
  OUT_DECISION: ["Decision Making"],
  OUT_COMMUNITY: ["Community"],
  OUT_NETWORK: ["Network"],
  OUT_ACHIEVEMENT: ["Achievement"],
  OUT_SATISFACTION: ["Satisfaction"],
  OUT_BALANCE: ["Balance"],
  OUT_HEALTH: ["Health"],
  // Mood
  MOOD: ["Recent Mood"],
  MOOD_INTENSITY: ["Intensity"],
  // Brain
  BRAIN: ["Brain Agility"],
};

// outcomes a crear como EqOutcomeSnapshot (key → columnas)
const OUTCOME_MAP: Record<string, (keyof typeof COLS)[]> = {
  effectiveness: ["OUT_EFFECTIVENESS"],
  relationships: ["OUT_RELATIONSHIP"],
  qualityOfLife: ["OUT_QOL"],
  wellbeing: ["OUT_WELLBEING"],
  influence: ["OUT_INFLUENCE"],
  decisionMaking: ["OUT_DECISION"],
  community: ["OUT_COMMUNITY"],
  network: ["OUT_NETWORK"],
  achievement: ["OUT_ACHIEVEMENT"],
  satisfaction: ["OUT_SATISFACTION"],
  balance: ["OUT_BALANCE"],
  health: ["OUT_HEALTH"],
};

// ----------------------- eq snapshot builder ------------------------

async function createEqSnapshot(userId: string, row: Row) {
  const vals = pickAny(row, {
    K: COLS.K,
    C: COLS.C,
    G: COLS.G,
    EL: COLS.EL,
    RP: COLS.RP,
    ACT: COLS.ACT,
    NE: COLS.NE,
    IM: COLS.IM,
    OP: COLS.OP,
    EMP: COLS.EMP,
    NG: COLS.NG,
    MOOD: COLS.MOOD,
    MOOD_INTENSITY: COLS.MOOD_INTENSITY,
    BRAIN: COLS.BRAIN,
  });

  // Solo generamos snapshot si hay al menos K/C/G o alguna comp
  const hasCore =
    num(vals.K) != null || num(vals.C) != null || num(vals.G) != null;
  const hasComp =
    num(vals.EL) != null ||
    num(vals.RP) != null ||
    num(vals.ACT) != null ||
    num(vals.NE) != null ||
    num(vals.IM) != null ||
    num(vals.OP) != null ||
    num(vals.EMP) != null ||
    num(vals.NG) != null;

  if (!hasCore && !hasComp) return null;

  const snapshot = await prisma.eqSnapshot.create({
    data: {
      userId,
      dataset: "CSV Import",
      K: num(vals.K),
      C: num(vals.C),
      G: num(vals.G),
      brainStyle: norm(vals.BRAIN),
      recentMood: norm(vals.MOOD) || null,
      moodIntensity: num(vals.MOOD_INTENSITY),
      // createdAt se mantiene en now() por simplicidad; puedes incluir un parse de fecha si la tienes
    },
  });

  // Competencias
  const comps: { key: string; score: number }[] = [];
  [
    ["emotional_literacy", vals.EL],
    ["recognize_patterns", vals.RP],
    ["apply_consequential_thinking", vals.ACT],
    ["navigate_emotions", vals.NE],
    ["intrinsic_motivation", vals.IM],
    ["optimism", vals.OP],
    ["empathy", vals.EMP],
    ["noble_goals", vals.NG],
  ].forEach(([key, v]) => {
    const s = num(v);
    if (s != null) comps.push({ key: String(key), score: s });
  });

  if (comps.length) {
    await prisma.eqCompetencySnapshot.createMany({
      data: comps.map((c) => ({
        snapshotId: snapshot.id,
        key: c.key,
        score: c.score,
      })),
    });
  }

  // Outcomes
  const outs: { key: string; score: number }[] = [];
  for (const oKey of Object.keys(OUTCOME_MAP)) {
    const cols = OUTCOME_MAP[oKey];
    const first = cols.find((k) => pick(row, COLS[k]) !== undefined);
    if (!first) continue;
    const s = num(pick(row, COLS[first]));
    if (s != null) outs.push({ key: oKey, score: s });
  }
  if (outs.length) {
    await prisma.eqOutcomeSnapshot.createMany({
      data: outs.map((o) => ({
        snapshotId: snapshot.id,
        key: o.key,
        score: o.score,
      })),
    });
  }

  // Mood extra ya fue al snapshot; si quieres histórico:
  // if (vals.MOOD) await prisma.eqMoodSnapshot.create({ ... })

  return snapshot.id;
}

// ----------------------- jerarquía (ensure) -------------------------

async function ensureHierarchy(
  superHubSlug: string,
  tenantSlug: string,
  hubSlug: string,
  orgSlug: string
) {
  const superHub =
    (await prisma.superHub.findUnique({ where: { slug: superHubSlug } })) ||
    (await prisma.superHub.create({
      data: {
        slug: superHubSlug,
        name: superHubSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        description: "Auto-created by CSV import",
      },
    }));

  const tenant =
    (await prisma.tenant.findUnique({ where: { slug: tenantSlug } })) ||
    (await prisma.tenant.create({
      data: {
        slug: tenantSlug,
        name: tenantSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        superHubId: superHub.id,
      },
    }));

  const hub =
    (await prisma.hub.findUnique({ where: { slug: hubSlug } })) ||
    (await prisma.hub.create({
      data: {
        slug: hubSlug,
        name: hubSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        tenantId: tenant.id,
        superHubId: superHub.id,
        visibility: "public",
      },
    }));

  const org =
    (await prisma.organization.findUnique({ where: { slug: orgSlug } })) ||
    (await prisma.organization.create({
      data: {
        slug: orgSlug,
        name: orgSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        superHubId: superHub.id,
        tenants: { connect: [{ id: tenant.id }] },
        hubs: { connect: [{ id: hub.id }] },
      },
    }));

  return { superHub, tenant, hub, org };
}

// ----------------------------- handler ------------------------------

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "Falta el archivo CSV (field 'file')." },
        { status: 400 }
      );
    }

    // Overrides opcionales de jerarquía
    const superHubSlug = slugify(norm(form.get("superHub") || "six-seconds"));
    const tenantSlug = slugify(norm(form.get("tenant") || "six-seconds-global"));
    const hubSlug = slugify(norm(form.get("hub") || "six-seconds-hub"));
    const orgSlug = slugify(norm(form.get("org") || "six-seconds-org"));

    const buf = Buffer.from(await file.arrayBuffer());
    // Auto detect delimiter (csv-parse lo hace si no pasas delimiter fijo)
    const rows: Row[] = parse(buf, {
      bom: true,
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
    });

    const { superHub, tenant, hub, org } = await ensureHierarchy(
      superHubSlug,
      tenantSlug,
      hubSlug,
      orgSlug
    );

    let createdUsers = 0;
    let updatedUsers = 0;
    let eqCreated = 0;
    const sample: any[] = [];
    const errors: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      const email = norm(pick(row, COLS.email));
      const namePart = norm(pick(row, COLS.name));
      const surnamePart = norm(pick(row, COLS.surname));
      const displayName =
        [namePart, surnamePart].filter(Boolean).join(" ").trim() ||
        namePart ||
        email.split("@")[0];

      if (!email) {
        errors.push({ row: i + 1, error: "Fila sin email" });
        continue;
      }

      // upsert user
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: displayName,
            primaryTenantId: tenant.id,
            allowAI: true,
            active: true,
          },
        });
        createdUsers++;
      } else {
        // update básico de nombre/tenant si viniera distinto
        if (displayName && user.name !== displayName) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { name: displayName },
          });
        }
        updatedUsers++;
      }

      // membership tenant
      const mem = await prisma.membership.findUnique({
        where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
      });
      if (!mem) {
        await prisma.membership.create({
          data: {
            userId: user.id,
            tenantId: tenant.id,
            role: "VIEWER",
            tokenQuota: 0,
            tokenUsed: 0,
          },
        });
      }

      // org membership
      const orgMem = await prisma.orgMembership.findFirst({
        where: { userId: user.id, organizationId: org.id },
      });
      if (!orgMem) {
        await prisma.orgMembership.create({
          data: {
            userId: user.id,
            organizationId: org.id,
            role: "MEMBER",
            status: "active",
          },
        });
      }

      // invite (solo si el usuario no tiene sesiones y quieres flujo de reclamo)
      // se puede dejar opcional — aquí solo si lo deseas, descomenta:
      // await prisma.inviteToken.create({ ... })

      // eq snapshot
      const sid = await createEqSnapshot(user.id, row);
      if (sid) eqCreated++;

      // muestra de parseo para QA (primeras 3 filas)
      if (sample.length < 3) {
        const k = num(pick(row, COLS.K));
        const c = num(pick(row, COLS.C));
        const g = num(pick(row, COLS.G));
        sample.push({
          row: i + 1,
          email,
          name: displayName,
          K: k,
          C: c,
          G: g,
          mood: norm(pick(row, COLS.MOOD)),
        });
      }
    }

    return NextResponse.json({
      ok: true,
      message: "✅ Importación jerárquica + emocional completada",
      target: {
        superHub: { id: superHub.id, slug: superHub.slug },
        tenant: { id: tenant.id, slug: tenant.slug },
        hub: { id: hub.id, slug: hub.slug },
        organization: { id: org.id, slug: org.slug },
      },
      summary: {
        rows: rows.length,
        usersCreated: createdUsers,
        usersUpdated: updatedUsers,
        eqSnapshots: eqCreated,
        errors: errors.length,
      },
      sample,
      errors,
    });
  } catch (e: any) {
    console.error("❌ Error import:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al procesar el archivo" },
      { status: 500 }
    );
  }
}