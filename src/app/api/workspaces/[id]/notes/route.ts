// src/app/api/workspaces/[id]/notes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import { canManageWorkspace } from "@/lib/workspace/permissions";

export const runtime = "nodejs";

export async function GET(
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
    const memberId = searchParams.get("memberId");

    const notes = await prisma.coachNote.findMany({
      where: {
        communityId: id,
        ...(memberId ? { memberId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { name: true, email: true, image: true } },
      },
    });
    return NextResponse.json({ notes });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
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
    const { memberId, title, content, category, tags } = body;
    if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

    const note = await prisma.coachNote.create({
      data: {
        communityId: id,
        authorId: token.sub,
        memberId: memberId || null,
        title: title?.trim() || null,
        content: content.trim(),
        category: category || null,
        tags: Array.isArray(tags) ? tags : [],
        isPrivate: true,
      },
    });
    return NextResponse.json({ note }, { status: 201 });
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
    const noteId = searchParams.get("noteId");
    if (!noteId) return NextResponse.json({ error: "noteId required" }, { status: 400 });

    await prisma.coachNote.delete({ where: { id: noteId } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
