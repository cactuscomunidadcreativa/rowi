import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export async function GET() {
  try {
    const memberships = await prisma.membership.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        tenant: { select: { id: true, name: true, slug: true } },
        plan: { select: { id: true, name: true, priceUsd: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(memberships);
  } catch (error: any) {
    console.error("Error GET memberships:", error);
    return NextResponse.json({ error: "Error al listar" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const membership = await prisma.membership.create({
      data: {
        userId: data.userId,
        tenantId: data.tenantId,
        planId: data.planId || null,
        role: data.role || "VIEWER",
        tokenQuota: data.tokenQuota ?? 0,
        tokenUsed: data.tokenUsed ?? 0,
        status: data.status || "active",
      },
      include: { user: true, tenant: true, plan: true },
    });
    return NextResponse.json(membership);
  } catch (error: any) {
    console.error("Error POST memberships:", error);
    return NextResponse.json({ error: "Error al crear" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, ...data } = await req.json();
    const membership = await prisma.membership.update({
      where: { id },
      data: {
        role: data.role,
        planId: data.planId || null,
        tokenQuota: data.tokenQuota,
        tokenUsed: data.tokenUsed,
        status: data.status,
      },
      include: { user: true, tenant: true, plan: true },
    });
    return NextResponse.json(membership);
  } catch (error: any) {
    console.error("Error PUT memberships:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await prisma.membership.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error DELETE memberships:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}