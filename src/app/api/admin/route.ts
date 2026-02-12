import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  return NextResponse.json(
    {
      ok: true,
      scope: "admin",
      endpoints: [
        "/api/admin/hubs",
        "/api/admin/users",
        "/api/admin/ui",
      ],
      note: "Este es un índice informativo. Los endpoints reales están en subrutas."
    },
    {
      headers: {
        "cache-control": "no-store"
      }
    }
  );
}