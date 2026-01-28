import { NextResponse } from "next/server";
import { ensureLayoutsAndComponents } from "@/core/startup/ensureLayoutsAndComponents";

export async function POST() {
  try {
    const result = await ensureLayoutsAndComponents();
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    console.error("❌ Error /layouts/scan:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}