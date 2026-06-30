/**
 * /api/espacios — la vista unificada de "Espacios" (Hito 4, reencuadre 3 niveles).
 *
 * Un "Espacio" es el contenedor del medio en Rowiverse → Espacio → Persona: un
 * cliente, empresa, colegio o comunidad. En el modelo actual ES un RowiCommunity
 * (con o sin workspaceType). Este endpoint da la lista unificada de los Espacios
 * del usuario — workspaces B2B (con workspaceType) Y comunidades sociales — que
 * hoy viven en endpoints separados (/api/workspaces excluye las comunidades).
 *
 * NO duplica la creación: para crear un Espacio se sigue usando /api/workspaces
 * (RowiCommunity con workspaceType). Aquí solo se LEE (GET). Cero schema, cero
 * scopes — reencuadre seguro pre-launch.
 *
 * GET → { ok: true, espacios: [...] }
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";
import { telemetry } from "@/lib/telemetry";

/** Tipo de Espacio para la UI: workspace B2B vs comunidad social. */
type EspacioKind = "workspace" | "community";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ ok: false, error: "auth.unauthorized" }, { status: 401 });
    }
    const userId = token.sub;

    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("includeArchived") === "1";
    // kind=workspace | community | all (default)
    const kind = searchParams.get("kind") || "all";

    // Todos los RowiCommunity donde el usuario es miembro (un Espacio = un
    // RowiCommunity). No filtramos por workspaceType: las comunidades sociales
    // también son Espacios (auditoría: "cliente, empresa, colegio o comunidad").
    const memberships = await prisma.rowiCommunityUser.findMany({
      where: { userId },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            workspaceType: true,
            projectStatus: true,
            bannerUrl: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { members: true, communityMembers: true } },
          },
        },
      },
      orderBy: { id: "desc" },
    });

    const espacios = memberships
      .map((m) => m.community ? { community: m.community, role: m.role } : null)
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .filter(({ community }) => includeArchived || community.projectStatus !== "archived")
      .map(({ community, role }) => {
        const espacioKind: EspacioKind = community.workspaceType ? "workspace" : "community";
        return {
          id: community.id,
          name: community.name,
          slug: community.slug,
          description: community.description,
          kind: espacioKind,
          workspaceType: community.workspaceType,
          projectStatus: community.projectStatus,
          bannerUrl: community.bannerUrl,
          memberCount: community._count.members + community._count.communityMembers,
          role,
          createdAt: community.createdAt,
          updatedAt: community.updatedAt,
        };
      })
      .filter((e) => kind === "all" || e.kind === kind);

    return NextResponse.json({ ok: true, espacios });
  } catch (err) {
    telemetry.captureException(err, { route: "/api/espacios", op: "GET" });
    return NextResponse.json({ ok: false, error: "server.error" }, { status: 500 });
  }
}
