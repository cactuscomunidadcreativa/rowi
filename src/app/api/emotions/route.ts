import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

// GET: listar todos los eventos emocionales (opcional: filtrar por usuario)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const where = userId ? { userId } : {};
  const events = await prisma.emotionalEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(events);
}