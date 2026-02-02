// src/app/api/hello/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, message: "Hola Rowi 🚀 API funcionando" });
}