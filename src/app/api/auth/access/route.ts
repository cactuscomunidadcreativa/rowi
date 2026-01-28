import { NextResponse } from "next/server";
import { canAccess } from "@/core/auth/hasAccess";

export async function POST(req: Request) {
  try {
    const { userId, level, scopeId, action } = await req.json();

    const ok = await canAccess(userId, level, scopeId, action);
    return NextResponse.json({ allowed: ok });

  } catch (err: any) {
    console.error("❌ Error en /api/auth/access:", err);
    return NextResponse.json({ allowed: false }, { status: 500 });
  }
}