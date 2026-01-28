import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      scope: "community",
      endpoints: [
        "/api/community/connections",
        "/api/community/groups",
        "/api/community/members"
      ],
      note: "Punto de entrada del módulo de comunidad (miembros, grupos, conexiones)."
    },
    { headers: { "cache-control": "no-store" } }
  );
}