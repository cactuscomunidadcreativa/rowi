import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

export async function GET(req: Request) {
  const auth = await getServerAuthUser();
  
  if (!auth?.id) {
    return NextResponse.json({ error: "sin auth" });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.id },
    include: {
      hubMemberships: {
        include: {
          hub: {
            include: {
              superHub: true,
            },
          },
        },
      },
      permissions: true,
    },
  });

  return NextResponse.json({
    authResult: auth,
    bdUser: user,
    hubMemberships: user?.hubMemberships,
    superHubsFromHubs: user?.hubMemberships?.map(
      m => m.hub?.superHub || null
    ),
  });
}