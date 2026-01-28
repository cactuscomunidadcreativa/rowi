import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

/**
 * 🧭 API Debug DB — explora tu base Prisma vía navegador.
 * Permite leer cualquier modelo: ?model=User, ?model=Tenant, etc.
 * Compatible con modelos que no tienen 'createdAt'.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const model = url.searchParams.get("model");

    if (!model) {
      return NextResponse.json({
        ok: false,
        error: "Debes enviar ?model=User o ?model=Tenant, etc.",
        ejemplos: [
          "/api/debug/db?model=User",
          "/api/debug/db?model=Tenant",
          "/api/debug/db?model=Membership",
          "/api/debug/db?model=UserPermission",
        ],
      });
    }

    if (!(model in prisma)) {
      return NextResponse.json({ ok: false, error: `Modelo '${model}' no existe.` });
    }

    // @ts-ignore — acceso dinámico
    const modelClient = prisma[model];
    let rows;

    try {
      // Intenta ordenar por createdAt si existe
      rows = await modelClient.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
      });
    } catch {
      // Fallback a grantedAt o sin orden
      try {
        rows = await modelClient.findMany({
          take: 50,
          orderBy: { grantedAt: "desc" },
        });
      } catch {
        rows = await modelClient.findMany({ take: 50 });
      }
    }

    return NextResponse.json({ ok: true, model, count: rows.length, data: rows });
  } catch (e: any) {
    console.error("❌ Error GET /api/debug/db:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}