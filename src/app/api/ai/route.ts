import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      scope: "ai",
      endpoints: [
        "/api/ai/engine",
        "/api/ai/jobs",
        "/api/ai/train"
      ]
    },
    { headers: { "cache-control": "no-store" } }
  );
}