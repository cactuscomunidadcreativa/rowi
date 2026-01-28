import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";

/* =========================================================
 🔍 GET – Listar usuarios (con búsqueda opcional)
========================================================= */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  // Si hay parámetro ?search=, buscar coincidencias
  if (search && search.length >= 2) {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      },
      select: { id: true, name: true, email: true },
      take: 20,
    });
    return NextResponse.json(users);
  }

  // Si no hay búsqueda, devolver todos con tenant y rol (como antes)
  const users = await prisma.user.findMany({
    include: {
      Membership: {
        include: { tenant: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

/* =========================================================
 ➕ POST – Crear usuario nuevo
========================================================= */
export async function POST(req: Request) {
  const { name, email, plan } = await req.json();

  if (!email)
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json(existing);

  const user = await prisma.user.create({
    data: { name, email, plan: plan || "free" },
  });

  return NextResponse.json(user, { status: 201 });
}

/* =========================================================
 🧩 PATCH – Cambiar plan o activar/desactivar
========================================================= */
export async function PATCH(req: Request) {
  const { id, plan, active } = await req.json();

  if (!id)
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id },
    data: { plan, active },
  });

  return NextResponse.json(updated);
}