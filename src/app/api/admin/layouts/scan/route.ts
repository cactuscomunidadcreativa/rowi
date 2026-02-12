import { NextResponse } from "next/server";
import { ensureLayoutsAndComponents } from "@/core/startup/ensureLayoutsAndComponents";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

export async function POST() {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const result = await ensureLayoutsAndComponents();
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    console.error("❌ Error /layouts/scan:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}