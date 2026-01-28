// src/app/api/community/groups/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const isDemo = url.searchParams.get("demo") === "1";

  if (isDemo) {
    const groups = [
      { id:"g1", name:"Trabajo", count: 2 },
      { id:"g2", name:"Familia", count: 1 },
      { id:"g3", name:"Amigos",  count: 1 },
      { id:"g4", name:"Por conocer", count: 1 },
    ];
    return NextResponse.json({ groups });
  }
  return NextResponse.json({ groups: [] });
}