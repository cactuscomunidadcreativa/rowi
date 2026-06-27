/**
 * /api/admin/scenarios — CRUD del ScenarioBank (Track B · admin de carga).
 *
 * Contenido del cliente: el "brief" que la IA interpreta + la rúbrica de
 * evaluación. Lectura/escritura gated por admin con scope (mismo patrón que el
 * knowledge admin). Multi-idioma vía `locale`.
 *
 *   GET                       → lista escenarios (filtros: locale, q)
 *   POST   { ...scenario }    → crea
 *   PATCH  { id, ...fields }  → edita
 *   DELETE ?id=<id>           → borra
 *
 * Respuestas: { ok: true, ... } / { ok: false, error }.
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";

const LOCALES = ["es", "en", "pt", "it", "zh"];
const SEI_KEYS = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];

interface ScenarioInput {
  title?: unknown;
  summary?: unknown;
  brief?: unknown;
  locale?: unknown;
  focusSei?: unknown;
  rubric?: unknown;
  difficulty?: unknown;
  tenantId?: unknown;
  agentId?: unknown;
  isActive?: unknown;
}

/** Valida + normaliza la entrada del escenario. Devuelve error legible si falla. */
function normalize(
  body: ScenarioInput,
): { data?: Prisma.ScenarioBankUncheckedCreateInput; error?: string } {
  const title = String(body.title ?? "").trim();
  const brief = String(body.brief ?? "").trim();
  if (!title) return { error: "title.required" };
  if (!brief) return { error: "brief.required" };

  const locale = LOCALES.includes(String(body.locale)) ? String(body.locale) : "es";
  const focusSeiRaw = String(body.focusSei ?? "").toUpperCase();
  const focusSei = SEI_KEYS.includes(focusSeiRaw) ? focusSeiRaw : null;
  const difficultyNum = Number(body.difficulty);
  const difficulty =
    Number.isFinite(difficultyNum) && difficultyNum >= 1 && difficultyNum <= 5
      ? Math.round(difficultyNum)
      : 1;

  // Rúbrica: acepta objeto {criteria:[...]}; si llega vacía, se usa un default mínimo.
  let rubric: unknown = body.rubric;
  if (typeof rubric === "string") {
    try {
      rubric = JSON.parse(rubric);
    } catch {
      return { error: "rubric.invalidJson" };
    }
  }
  if (!rubric || typeof rubric !== "object" || !Array.isArray((rubric as { criteria?: unknown }).criteria)) {
    rubric = {
      criteria: [
        { key: "empathy", label: "Empatía y escucha", weight: 1 },
        { key: "clarity", label: "Claridad y asertividad", weight: 1 },
        { key: "outcome", label: "Avance hacia el objetivo", weight: 1 },
      ],
    };
  }

  return {
    data: {
      title: title.slice(0, 200),
      summary: body.summary ? String(body.summary).slice(0, 500) : null,
      brief: brief.slice(0, 8000),
      locale,
      focusSei,
      rubric: rubric as object,
      difficulty,
      tenantId: body.tenantId ? String(body.tenantId) : null,
      agentId: body.agentId ? String(body.agentId) : null,
      isActive: body.isActive === undefined ? true : body.isActive !== false,
    },
  };
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;
  try {
    const url = new URL(req.url);
    const locale = url.searchParams.get("locale");
    const q = url.searchParams.get("q");
    const where: Record<string, unknown> = {};
    if (locale) where.locale = locale;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { summary: { contains: q, mode: "insensitive" } },
        { brief: { contains: q, mode: "insensitive" } },
      ];
    }
    const scenarios = await prisma.scenarioBank.findMany({
      where,
      orderBy: [{ difficulty: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ ok: true, scenarios });
  } catch (e) {
    console.error("/api/admin/scenarios GET error:", e);
    return NextResponse.json({ ok: false, error: "server.error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;
  try {
    const body = (await req.json().catch(() => ({}))) as ScenarioInput;
    const { data, error } = normalize(body);
    if (error || !data) {
      return NextResponse.json({ ok: false, error: error ?? "invalid" }, { status: 400 });
    }
    const scenario = await prisma.scenarioBank.create({
      data: { ...data, createdBy: auth.user?.id ?? null },
    });
    return NextResponse.json({ ok: true, scenario }, { status: 201 });
  } catch (e) {
    console.error("/api/admin/scenarios POST error:", e);
    return NextResponse.json({ ok: false, error: "server.error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;
  try {
    const body = (await req.json().catch(() => ({}))) as ScenarioInput & { id?: unknown };
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ ok: false, error: "id.required" }, { status: 400 });
    const { data, error } = normalize(body);
    if (error || !data) {
      return NextResponse.json({ ok: false, error: error ?? "invalid" }, { status: 400 });
    }
    const scenario = await prisma.scenarioBank.update({ where: { id }, data });
    return NextResponse.json({ ok: true, scenario });
  } catch (e) {
    console.error("/api/admin/scenarios PATCH error:", e);
    return NextResponse.json({ ok: false, error: "server.error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "id.required" }, { status: 400 });
    await prisma.scenarioBank.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("/api/admin/scenarios DELETE error:", e);
    return NextResponse.json({ ok: false, error: "server.error" }, { status: 500 });
  }
}
