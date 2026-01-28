// src/app/api/eq/at/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "node:fs";
import path from "node:path";

/* =========================================================
   🧠 Utilidades
========================================================= */
type Row = Record<string, any>;
type Num = number | null;

const toNum = (v: any): Num => {
  if (v === null || v === undefined || v === "") return null;
  const s = typeof v === "string" ? v.replace(",", ".").trim() : v;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");
const pick = (row: Row, keys: string[]): any => {
  for (const want of keys) {
    const hit = Object.keys(row).find((k) => norm(k) === norm(want));
    if (hit) return row[hit];
  }
  return null;
};
function moodToEmoji(text?: string, intensity?: string): string {
  const t = (text || "").toLowerCase();
  const i = (intensity || "").toLowerCase();
  if (t.includes("confianza") || i.includes("seguro")) return "🛡️";
  if (t.includes("expectativa") || i.includes("vigilante")) return "👀";
  return "🙂";
}

/* =========================================================
   🎨 Colores y catálogos
========================================================= */
const COLOR = { know: "#1E88E5", choose: "#E53935", give: "#43A047" };
const COMP = {
  EL: { short: "EL", long: "Enhance Emotional Literacy", color: COLOR.know },
  RP: { short: "RP", long: "Recognize Patterns", color: COLOR.know },
  ACT: { short: "ACT", long: "Apply Consequential Thinking", color: COLOR.choose },
  NE: { short: "NE", long: "Navigate Emotions", color: COLOR.choose },
  IM: { short: "IM", long: "Engage Intrinsic Motivation", color: COLOR.choose },
  OP: { short: "OP", long: "Exercise Optimism", color: COLOR.choose },
  EMP: { short: "EMP", long: "Increase Empathy", color: COLOR.give },
  NG: { short: "NG", long: "Pursue Noble Goals", color: COLOR.give },
} as const;

/* =========================================================
   📂 Lectura del CSV
========================================================= */
async function loadCsvRows(): Promise<Row[]> {
  try {
    const dir = path.join(process.cwd(), "src", "data", "sixseconds");
    const files = await fs.readdir(dir);
    const firstCsv = files.find((f) => f.toLowerCase().endsWith(".csv"));
    if (!firstCsv) return [];
    const text = await fs.readFile(path.join(dir, firstCsv), "utf8");
    const [head, ...lines] = text.split(/\r?\n/).filter((l) => l.trim().length);
    if (!head || !lines.length) return [];
    const cols = head.split(",").map((c) => c.trim());
    return lines.map((ln) => {
      const vals = ln.split(",").map((s) => s.trim());
      const row: Row = {};
      cols.forEach((c, i) => (row[c] = vals[i]));
      return row;
    });
  } catch {
    return [];
  }
}

/* =========================================================
   🧮 Constructores
========================================================= */
function buildOutcomes(row: Row) {
  return {
    overall4: toNum(pick(row, ["Overall 4 Outcome", "Overall4", "Overall"])),
    effectiveness: { score: toNum(pick(row, ["Effectiveness"])) },
    relationships: { score: toNum(pick(row, ["Relationship", "Relationships"])) },
    wellbeing: { score: toNum(pick(row, ["Wellbeing"])) },
    qualityOfLife: { score: toNum(pick(row, ["Quality of Life", "QualityOfLife"])) },
  };
}
function buildComps(row: Row) {
  const comps = {
    EL: toNum(pick(row, ["EL"])),
    RP: toNum(pick(row, ["RP"])),
    ACT: toNum(pick(row, ["ACT"])),
    NE: toNum(pick(row, ["NE"])),
    IM: toNum(pick(row, ["IM"])),
    OP: toNum(pick(row, ["OP"])),
    EMP: toNum(pick(row, ["EMP"])),
    NG: toNum(pick(row, ["NG"])),
  };
  const nums = Object.values(comps).filter((x) => typeof x === "number") as number[];
  const total = nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null;
  return { comps, total };
}
function shapeSnapshotFromRow(row: Row) {
  const dateStr = pick(row, ["Date", "Fecha", "date", "fecha"]);
  const moodText = pick(row, ["Recent Mood", "Mood"]) || "";
  const intensity = pick(row, ["Intensity"]) || "";
  const { comps, total } = buildComps(row);
  return {
    date: dateStr ? String(dateStr) : null,
    user: { name: pick(row, ["Name", "Nombre"]) || "Invitado", email: pick(row, ["Email", "Correo"]) || "" },
    mood: { recentText: String(moodText), recentEmoji: moodToEmoji(String(moodText), String(intensity)) },
    eq: { total, competencias: comps },
    outcomes: buildOutcomes(row),
  };
}

/* =========================================================
   📈 Feedback Builder
========================================================= */
function buildFeedback(present: any, compare: any) {
  if (!present || !compare) return null;
  const compKeys = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];
  const deltas: Record<string, number> = {};
  compKeys.forEach((k) => {
    const a = Number(present.eq.competencias?.[k] ?? 0);
    const b = Number(compare.eq.competencias?.[k] ?? 0);
    deltas[k] = Math.round((a - b) * 10) / 10;
  });
  return { competencies: deltas };
}

/* =========================================================
   🚀 Handler principal
========================================================= */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const when = url.searchParams.get("when");
    const dateQ = url.searchParams.get("date");
    const mode = url.searchParams.get("mode");

    // 🧭 SEI 360 demo (mantiene estructura)
    if (mode === "360") {
      const present = shapeSnapshotFromRow({ Profile: "Strategist" });
      const compare = shapeSnapshotFromRow({ Profile: "Guardian" });
      const feedback = buildFeedback(present, compare);
      return NextResponse.json({ present, compare, feedback, labels: { competencies: COMP }, colors: { sei: COLOR } });
    }

    // 🗂 Cargar CSV
    const rows = await loadCsvRows();
    if (!rows.length) return NextResponse.json({ present: null, compare: null, feedback: null });

    // 📅 Ordenar por fecha (soporte DD/MM/YYYY y MM/DD/YYYY)
    const dateKeys = ["Date", "Fecha", "date", "fecha"];

    let ordered = rows
      .map((r) => {
        const raw = String(pick(r, dateKeys) || "1970-01-01").trim();

        // 🧩 Normalizar fecha del CSV — acepta DD/MM/YY, DD/MM/YYYY, MM/DD/YYYY y YYYY-MM-DD
        let d: Date;

        // Formato latino (DD/MM/YY o DD/MM/YYYY)
        if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(raw)) {
          const parts = raw.split("/");
          const [day, month, year] = parts.map(Number);
          const fullYear = year < 100 ? 2000 + year : year;
          d = new Date(fullYear, month - 1, day);
        }
        // Formato ISO (YYYY-MM-DD)
        else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
          d = new Date(raw);
        }
        // Otro formato (MM/DD/YYYY) o fallback
        else {
          const alt = new Date(raw);
          d = isNaN(alt.getTime()) ? new Date("1970-01-01") : alt;
        }

        return { r, d };
      })
      // ✅ Ordenar ascendente por fecha real
      .sort((a, b) => a.d.getTime() - b.d.getTime())
      .map((x) => x.r);

    // 🎯 Selección actual y comparación
    const present = shapeSnapshotFromRow(ordered[ordered.length - 1]);
    let compare: any = null;

    if (ordered.length > 1) {
      let idx = ordered.length - 2;
      if (dateQ) {
        const want = new Date(dateQ);
        let best = 0, bestDiff = Infinity;
        ordered.forEach((r, i) => {
          const rd = new Date(String(pick(r, dateKeys) || "1970-01-01")).getTime();
          const diff = Math.abs(rd - want.getTime());
          if (diff < bestDiff) { bestDiff = diff; best = i; }
        });
        idx = best;
      } else if (when === "past") {
        idx = Math.max(0, ordered.length - 2);
      }
      if (idx !== ordered.length - 1) {
        compare = shapeSnapshotFromRow(ordered[idx]);
      }
    }

    const feedback = compare ? buildFeedback(present, compare) : null;

    return NextResponse.json({
      present,
      compare: compare ?? null,
      feedback: feedback ?? null,
      labels: { competencies: COMP },
      colors: { sei: COLOR },
    });
  } catch (e: any) {
    console.error("❌ Error en /api/eq/at:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Error interno" }, { status: 500 });
  }
}