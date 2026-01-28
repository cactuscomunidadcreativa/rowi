// src/app/api/eco/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

function band(v?: number | null) {
  if (v == null) return "mid";
  if (v >= 70) return "high";
  if (v >= 50) return "mid";
  return "low";
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toString().toLowerCase() || null;

    // Demo si no hay sesión
    if (!email) {
      return NextResponse.json({
        ok: true,
        date: new Date().toISOString().slice(0, 10),
        routines: [
          { id: "ne-breath", title: "Regulación 2–3 min", how: "Respira 4-7-8 durante 2–3 minutos.", reason: "Cuidar NE (emociones).", minutes: 3 },
          { id: "act-pause", title: "Micro-pausa ACT (60s)", how: "Antes de decidir, pausa 60s y enumera 3 consecuencias.", reason: "Fortalecer ACT.", minutes: 1 },
        ],
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const snap = user && await prisma.eqSnapshot.findFirst({
      where: { userId: user.id },
      orderBy: { at: "desc" },
    });

    const NE = band(snap?.NE);
    const ACT = band(snap?.ACT);
    const OP = band(snap?.OP);
    const EMP = band(snap?.EMP);

    const routines: Array<{ id:string; title:string; how:string; reason:string; minutes:number }> = [];
    if (NE === "low") routines.push({ id:"ne-breath", title:"Regulación 2–3 min", how:"Respira 4-7-8 durante 2–3 minutos.", reason:"Cuidar NE (emociones).", minutes:3 });
    if (ACT === "low") routines.push({ id:"act-pause", title:"Micro-pausa ACT (60s)", how:"Antes de decidir, pausa 60s y enumera 3 consecuencias.", reason:"Fortalecer ACT.", minutes:1 });
    if (OP === "low") routines.push({ id:"op-gratitude", title:"3 gratitudes", how:"Escribe 3 cosas por las que te sientes agradecid@.", reason:"Sostener Optimism.", minutes:2 });
    if (EMP === "low") routines.push({ id:"emp-listening", title:"Escucha activa", how:"En tu próxima charla, usa 3 preguntas abiertas y parafrasea.", reason:"Aumentar Empathy.", minutes:2 });

    if (routines.length === 0) {
      routines.push(
        { id:"maint-checkin", title:"Check-in de 1 min", how:"Nombra cómo te sientes ahora y qué necesitas.", reason:"Mantener autoconsciencia.", minutes:1 },
        { id:"maint-recap",   title:"Recap del día (2 min)", how:"Apunta 1 aprendizaje y 1 micro-logro.", reason:"Consolidar hábitos.", minutes:2 },
      );
    }

    return NextResponse.json({
      ok: true,
      date: new Date().toISOString().slice(0, 10),
      routines: routines.slice(0, 3),
    });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message || "Error" }, { status:500 });
  }
}
