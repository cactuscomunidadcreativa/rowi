// src/app/api/rowi/lexicon/route.ts
import { NextResponse } from "next/server";
export const runtime = "nodejs";

const ES = ["ansiedad","nervios","miedo","preocupación","tensión","enojo","frustración","molestia","tristeza","nostalgia","alegría","calma","curiosidad"];

export async function GET() {
  return NextResponse.json({ ok:true, hints: ES });
}