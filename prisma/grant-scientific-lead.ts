/**
 * 🔬 Grant scientific_lead research access to a user.
 *
 * - Sets User.researchAccessLevel = "scientific_lead"
 * - Records a ResearchAccessAudit entry of action="grant_role"
 *
 * Idempotent: re-running on the same email is a no-op if the level already matches.
 * Does not hardcode any name. Email is provided via CLI arg or env.
 *
 * Usage:
 *   SCIENTIFIC_LEAD_EMAIL=person@example.com npx tsx prisma/grant-scientific-lead.ts
 *   npx tsx prisma/grant-scientific-lead.ts person@example.com
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function grantScientificLead(rawEmail: string) {
  const email = rawEmail.trim().toLowerCase();
  console.log(`\n===== ${email} =====`);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, researchAccessLevel: true },
  });

  if (!user) {
    console.log(`  ❌ User not found. Create the account first, then run this script.`);
    return;
  }

  if (user.researchAccessLevel === "scientific_lead") {
    console.log(`  ✓ Already scientific_lead — no-op`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { researchAccessLevel: "scientific_lead" },
  });
  console.log(`  ✓ researchAccessLevel = scientific_lead`);

  await prisma.researchAccessAudit.create({
    data: {
      viewerUserId: user.id,
      subjectUserId: user.id,
      action: "grant_role",
      contextPath: "prisma/grant-scientific-lead.ts",
      reason: "Promoted to scientific_lead via CLI seed",
      metadata: { previousLevel: user.researchAccessLevel, newLevel: "scientific_lead" },
    },
  });
  console.log(`  ✓ ResearchAccessAudit entry recorded`);
  console.log(`  ✅ ${email} is now scientific_lead`);
}

async function main() {
  const email = process.argv[2] ?? process.env.SCIENTIFIC_LEAD_EMAIL;
  if (!email) {
    console.error(
      "❌ Provide email as first argument or set SCIENTIFIC_LEAD_EMAIL env var.\n" +
        "   npx tsx prisma/grant-scientific-lead.ts person@example.com",
    );
    process.exit(1);
  }
  try {
    await grantScientificLead(email);
  } catch (e) {
    console.error(`  ❌ Error for ${email}:`, e);
    process.exitCode = 1;
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
