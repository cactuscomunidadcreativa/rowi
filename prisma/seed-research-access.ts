/**
 * 🔬 Seed inicial de researchAccessLevel.
 *
 * Política (decisión Eduardo, 2026-05-21):
 *   - eduardo@cactuscomunidadcreativa.com  → founder
 *   - Cualquier otro SUPERADMIN/ADMIN sin nivel explícito → rowi_team
 *   - NO sobrescribe usuarios que ya tengan founder / scientific_lead /
 *     six_seconds_team / invited_personal / invited_observer asignados
 *     desde la UI o un seed previo.
 *
 * Detecta admins desde tres fuentes (OR):
 *   - User.organizationRole = SUPERADMIN | ADMIN
 *   - Membership.role = SUPERADMIN | ADMIN
 *   - UserPermission.role = superadmin (cualquier scope)
 *
 * Cada cambio queda registrado en ResearchAccessAudit.
 * Idempotente: re-ejecutar es seguro.
 *
 * Usage:
 *   npx tsx prisma/seed-research-access.ts
 */
import { PrismaClient, type ResearchAccessLevel } from "@prisma/client";

const prisma = new PrismaClient();

const FOUNDER_EMAIL = "eduardo@cactuscomunidadcreativa.com";
const DEFAULT_ADMIN_LEVEL: ResearchAccessLevel = "rowi_team";

// Niveles "manuales" que NUNCA se sobrescriben automáticamente.
const PROTECTED_LEVELS: ResearchAccessLevel[] = [
  "founder",
  "scientific_lead",
  "six_seconds_team",
  "invited_personal",
  "invited_observer",
];

async function setLevel(
  userId: string,
  email: string | null,
  currentLevel: ResearchAccessLevel,
  newLevel: ResearchAccessLevel,
  reason: string,
) {
  if (currentLevel === newLevel) {
    console.log(`  · ${email ?? userId}: already ${newLevel}, skip`);
    return;
  }
  if (PROTECTED_LEVELS.includes(currentLevel) && newLevel !== "founder") {
    console.log(
      `  · ${email ?? userId}: protected level ${currentLevel} (manual assignment), skip`,
    );
    return;
  }
  await prisma.user.update({
    where: { id: userId },
    data: { researchAccessLevel: newLevel },
  });
  await prisma.researchAccessAudit.create({
    data: {
      viewerUserId: userId,
      subjectUserId: userId,
      action: "grant_role",
      contextPath: "prisma/seed-research-access.ts",
      reason,
      metadata: { previousLevel: currentLevel, newLevel },
    },
  });
  console.log(`  ✓ ${email ?? userId}: ${currentLevel} → ${newLevel}`);
}

async function main() {
  console.log("\n===== seed-research-access =====\n");

  // 1) Founder
  const founder = await prisma.user.findUnique({
    where: { email: FOUNDER_EMAIL },
    select: { id: true, email: true, researchAccessLevel: true },
  });
  if (!founder) {
    console.log(`⚠️  Founder email ${FOUNDER_EMAIL} not found — skipping founder step`);
  } else {
    await setLevel(
      founder.id,
      founder.email,
      founder.researchAccessLevel,
      "founder",
      "Founder pre-assignment via seed",
    );
  }

  // 2) Todos los SuperAdmin/Admin (3 fuentes OR'd)
  const adminUsers = await prisma.user.findMany({
    where: {
      OR: [
        { organizationRole: { in: ["SUPERADMIN", "ADMIN"] } },
        { memberships: { some: { role: { in: ["SUPERADMIN", "ADMIN"] } } } },
        { permissions: { some: { role: "superadmin" } } },
      ],
    },
    select: { id: true, email: true, researchAccessLevel: true },
  });

  console.log(`\nFound ${adminUsers.length} admin candidates\n`);

  for (const u of adminUsers) {
    if (u.email === FOUNDER_EMAIL) continue;
    await setLevel(
      u.id,
      u.email,
      u.researchAccessLevel,
      DEFAULT_ADMIN_LEVEL,
      `Admin default assignment: ${DEFAULT_ADMIN_LEVEL}`,
    );
  }

  console.log("\n✅ Done\n");
}

main()
  .catch((e) => {
    console.error("❌ seed-research-access failed:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
