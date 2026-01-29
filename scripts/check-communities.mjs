import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const communities = await prisma.rowiCommunity.findMany({
  select: { id: true, name: true, slug: true },
});

console.log("Total comunidades:", communities.length);
communities.forEach(c => console.log("  -", c.name, "(" + c.slug + ")"));

await prisma.$disconnect();
