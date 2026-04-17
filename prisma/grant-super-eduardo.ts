/**
 * 🦸 Grant SUPER access to Eduardo (all roles everywhere).
 *
 * - organizationRole = SUPERADMIN (triggers global admin)
 * - isSuperAdmin = true
 * - Membership in primary tenant with role ADMIN (triggers isAdmin flag)
 * - Extra RowiCommunityUser with role "coach" (triggers isCoach flag)
 * - Membership CONSULTANT (triggers isConsultant flag)
 * - UserPermission with scope=global SUPERADMIN
 *
 * Usage:
 *   npx tsx prisma/grant-super-eduardo.ts
 *   npx tsx prisma/grant-super-eduardo.ts otra@email.com
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_EMAILS = [
  "eduardo@cactuscomunidadcreativa.com",
  "eduardo.gonzalez@cactuscomunidadcreativa.com",
];

async function grantSuper(email: string) {
  console.log(`\n===== ${email} =====`);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, primaryTenantId: true, organizationRole: true },
  });

  if (!user) {
    console.log(`  ❌ User not found`);
    return;
  }

  console.log(`  ✓ Found: ${user.name || user.email}`);

  // 1. organizationRole = SUPERADMIN
  await prisma.user.update({
    where: { id: user.id },
    data: { organizationRole: "SUPERADMIN" },
  });
  console.log(`  ✓ organizationRole = SUPERADMIN`);

  // 2. Ensure tenant + Membership with ADMIN role
  let tenantId = user.primaryTenantId;
  if (!tenantId) {
    const anyTenant = await prisma.tenant.findFirst({ select: { id: true } });
    tenantId = anyTenant?.id || null;
    if (tenantId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { primaryTenantId: tenantId },
      });
      console.log(`  ✓ primaryTenantId set to ${tenantId}`);
    }
  }

  if (tenantId) {
    const existingMembership = await prisma.membership.findFirst({
      where: { userId: user.id, tenantId },
    });
    if (!existingMembership) {
      await prisma.membership.create({
        data: { userId: user.id, tenantId, role: "SUPERADMIN" },
      });
      console.log(`  ✓ Membership SUPERADMIN created in tenant ${tenantId}`);
    } else {
      await prisma.membership.update({
        where: { id: existingMembership.id },
        data: { role: "SUPERADMIN" },
      });
      console.log(`  ✓ Membership upgraded to SUPERADMIN`);
    }
  }

  // 3. CONSULTANT no existe en enum TenantRole, skip (usamos RowiCommunityUser abajo)

  // 4. RowiCommunityUser with role 'coach' to trigger isCoach flag
  //    Create or use existing workspace/community for Eduardo
  let community = await prisma.rowiCommunity.findFirst({
    where: { createdById: user.id, workspaceType: "COACHING" },
    select: { id: true },
  });

  if (!community) {
    community = await prisma.rowiCommunity.create({
      data: {
        name: `${user.name || "Eduardo"} - Coaching Workspace`,
        slug: `eduardo-coaching-${Date.now().toString(36)}`,
        type: "workspace",
        visibility: "private",
        workspaceType: "COACHING",
        projectStatus: "active",
        createdById: user.id,
        tenantId,
      },
      select: { id: true },
    });
    console.log(`  ✓ Created COACHING workspace ${community.id}`);
  }

  const coachMembership = await prisma.rowiCommunityUser.findFirst({
    where: { userId: user.id, communityId: community.id },
  });
  if (!coachMembership) {
    await prisma.rowiCommunityUser.create({
      data: {
        userId: user.id,
        communityId: community.id,
        role: "coach",
        status: "active",
        email: user.email,
        name: user.name,
      },
    });
    console.log(`  ✓ RowiCommunityUser COACH created`);
  } else if (coachMembership.role !== "coach" && coachMembership.role !== "owner") {
    await prisma.rowiCommunityUser.update({
      where: { id: coachMembership.id },
      data: { role: "coach" },
    });
    console.log(`  ✓ Membership upgraded to coach`);
  } else {
    console.log(`  ✓ Already coach/owner in ${community.id}`);
  }

  // 5. CONSULTANT tenant via second community (since tenant enum doesnt have CONSULTANT)
  let consultantCommunity = await prisma.rowiCommunity.findFirst({
    where: { createdById: user.id, workspaceType: "CONSULTING" },
    select: { id: true },
  });
  if (!consultantCommunity) {
    consultantCommunity = await prisma.rowiCommunity.create({
      data: {
        name: `${user.name || "Eduardo"} - Consulting Workspace`,
        slug: `eduardo-consulting-${Date.now().toString(36)}`,
        type: "workspace",
        visibility: "private",
        workspaceType: "CONSULTING",
        projectStatus: "active",
        createdById: user.id,
        tenantId,
      },
      select: { id: true },
    });
    console.log(`  ✓ Created CONSULTING workspace ${consultantCommunity.id}`);
  }
  const consMem = await prisma.rowiCommunityUser.findFirst({
    where: { userId: user.id, communityId: consultantCommunity.id },
  });
  if (!consMem) {
    await prisma.rowiCommunityUser.create({
      data: {
        userId: user.id,
        communityId: consultantCommunity.id,
        role: "consultant",
        status: "active",
        email: user.email,
        name: user.name,
      },
    });
    console.log(`  ✓ RowiCommunityUser CONSULTANT created`);
  }

  // 6. Global UserPermission SUPERADMIN
  const existingPerm = await prisma.userPermission.findFirst({
    where: { userId: user.id, scopeType: "rowiverse" },
  });
  if (!existingPerm) {
    const rowiverse = await prisma.rowiVerse.findFirst({ select: { id: true } });
    await prisma.userPermission.create({
      data: {
        userId: user.id,
        role: "SUPERADMIN",
        scopeType: "rowiverse",
        scopeId: rowiverse?.id || null,
        scope: "global",
      },
    });
    console.log(`  ✓ UserPermission SUPERADMIN global created`);
  }

  console.log(`  ✅ ${email} is now SUPER user (all roles, all views)`);
}

async function main() {
  const emails = process.argv[2] ? [process.argv[2]] : DEFAULT_EMAILS;
  for (const email of emails) {
    try {
      await grantSuper(email);
    } catch (e) {
      console.error(`  ❌ Error for ${email}:`, e);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
