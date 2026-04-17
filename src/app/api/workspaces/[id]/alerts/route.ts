// src/app/api/workspaces/[id]/alerts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import { canManageWorkspace } from "@/lib/workspace/permissions";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const canManage = await canManageWorkspace(token.sub, id);
  if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const showResolved = searchParams.get("showResolved") === "1";

  const alerts = await prisma.workspaceAlert.findMany({
    where: {
      communityId: id,
      ...(showResolved ? {} : { resolvedAt: null, dismissedAt: null }),
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ alerts });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const canManage = await canManageWorkspace(token.sub, id);
    if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { alertId, action } = body;
    if (!alertId || !action) return NextResponse.json({ error: "alertId and action required" }, { status: 400 });

    const data: any = {};
    if (action === "resolve") {
      data.resolvedAt = new Date();
      data.resolvedById = token.sub;
    } else if (action === "dismiss") {
      data.dismissedAt = new Date();
    }

    const alert = await prisma.workspaceAlert.update({
      where: { id: alertId },
      data,
    });
    return NextResponse.json({ alert });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
