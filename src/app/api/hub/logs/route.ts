import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      scope: "hub.logs",
      endpoints: [
        "/api/hub/logs/interactions",
        "/api/hub/logs/errors",
        "/api/hub/logs/system"
      ],
      note: "Registro centralizado de logs, auditorías e interacciones."
    },
    { headers: { "cache-control": "no-store" } }
  );
}