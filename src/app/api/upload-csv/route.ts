import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      scope: "upload-csv",
      endpoints: [
        "/api/upload-csv/community",
        "/api/upload-csv/self"
      ],
      note: "Carga masiva de datos CSV: usuarios, comunidad o configuración."
    },
    { headers: { "cache-control": "no-store" } }
  );
}