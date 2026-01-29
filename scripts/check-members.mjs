import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Contar usuarios únicos
const users = await prisma.user.count();
console.log("Total Users:", users);

// Contar RowiCommunityUser (membresías)
const communityUsers = await prisma.rowiCommunityUser.count();
console.log("Total RowiCommunityUser:", communityUsers);

// Ver distribución por comunidad
const byCommunity = await prisma.rowiCommunityUser.groupBy({
  by: ["communityId"],
  _count: true,
});
console.log("\nMembresías por comunidad:");
for (const c of byCommunity) {
  const comm = await prisma.rowiCommunity.findUnique({ where: { id: c.communityId }, select: { name: true } });
  console.log("  " + (comm ? comm.name : c.communityId) + ": " + c._count);
}

// Buscar usuarios en múltiples comunidades
const allMemberships = await prisma.rowiCommunityUser.findMany({
  include: { user: { select: { email: true, name: true } } },
});

const emailCount = {};
for (const m of allMemberships) {
  const email = m.user ? m.user.email : "unknown";
  emailCount[email] = (emailCount[email] || 0) + 1;
}

const duplicates = Object.entries(emailCount).filter(([_, count]) => count > 1);
console.log("\nUsuarios en múltiples comunidades: " + duplicates.length);
if (duplicates.length > 0) {
  duplicates.slice(0, 15).forEach(([email, count]) => console.log("  " + email + ": " + count + " comunidades"));
}

await prisma.$disconnect();
