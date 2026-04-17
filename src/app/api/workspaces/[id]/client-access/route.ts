// src/app/api/workspaces/[id]/client-access/route.ts
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

  const accesses = await prisma.clientAccess.findMany({
    where: { communityId: id, revokedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ accesses });
}

export async function POST(
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
    const {
      clientEmail,
      clientName,
      viewDashboard = true,
      viewBenchmark = true,
      viewIndividuals = false,
      viewNotes = false,
      exportPdf = true,
      expiresInDays = 90,
    } = body;
    if (!clientEmail?.trim()) return NextResponse.json({ error: "clientEmail required" }, { status: 400 });

    const access = await prisma.clientAccess.create({
      data: {
        communityId: id,
        clientEmail: clientEmail.trim().toLowerCase(),
        clientName: clientName?.trim() || null,
        permissions: {
          viewDashboard,
          viewBenchmark,
          viewIndividuals,
          viewNotes,
          exportPdf,
        },
        expiresAt: expiresInDays > 0 ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null,
        createdById: token.sub,
      },
    });

    const portalUrl = `${req.nextUrl.origin}/workspace/${id}/client-portal?token=${access.accessToken}`;

    return NextResponse.json({ access, portalUrl }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const canManage = await canManageWorkspace(token.sub, id);
    if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const accessId = searchParams.get("accessId");
    if (!accessId) return NextResponse.json({ error: "accessId required" }, { status: 400 });

    await prisma.clientAccess.update({
      where: { id: accessId },
      data: { revokedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
