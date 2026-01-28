import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      scope: "social",
      endpoints: [
        "/api/social/init",
        "/api/social/post",
        "/api/social/feed"
      ],
      note: "API para manejo de red social interna: posts, comentarios y sincronizaciones."
    },
    { headers: { "cache-control": "no-store" } }
  );
}