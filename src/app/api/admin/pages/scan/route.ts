import { NextResponse } from "next/server";
import { ensurePages } from "@/core/startup/ensurePages";

export async function POST() {
  try {
    const result = await ensurePages();
    return NextResponse.json({
      ok: true,
      created: result?.created || 0,
      updated: result?.updated || 0,
    });
  } catch (error: any) {
    console.error("❌ Error en /pages/scan:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}