/**
 * 🩺 Diagnose onboarding state for a user.
 *
 * Read-only by default. With --fix flag, inserts a granted basic_processing
 * UserConsent row so the user can pass the ConsentGate without re-doing
 * the onboarding flow.
 *
 * Use this when a user is stuck in the onboarding redirect loop because
 * their basic_processing consent never got persisted (known bug fixed in
 * commit after this script — but already-stuck accounts need manual unblock).
 *
 * Usage:
 *   # Read-only diagnosis
 *   npx tsx prisma/diagnose-onboarding.ts user@example.com
 *
 *   # Fix mode: inserts basic_processing granted if missing
 *   npx tsx prisma/diagnose-onboarding.ts user@example.com --fix
 *
 *   # Fix mode for all required consents (basic_processing only today,
 *   # but future-proof if more become required)
 *   npx tsx prisma/diagnose-onboarding.ts user@example.com --fix-required
 */
import { PrismaClient } from "@prisma/client";
import { CONSENTS } from "../src/lib/privacy/consents";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashConsentText(esBody: string, enBody: string, version: number): string {
  return crypto
    .createHash("sha256")
    .update(`${version}::${esBody}::${enBody}`)
    .digest("hex");
}

async function main() {
  const email = process.argv[2]?.toLowerCase();
  const fixMode = process.argv.includes("--fix");
  const fixRequiredMode = process.argv.includes("--fix-required");

  if (!email) {
    console.error("❌ Provide email as first argument.");
    console.error("   npx tsx prisma/diagnose-onboarding.ts user@example.com [--fix|--fix-required]");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, createdAt: true, organizationRole: true, researchAccessLevel: true },
  });
  if (!user) {
    console.error(`❌ User ${email} not found.`);
    process.exit(1);
  }

  console.log(`\n===== Onboarding diagnosis: ${email} =====\n`);
  console.log(`User ID:               ${user.id}`);
  console.log(`Name:                  ${user.name ?? "—"}`);
  console.log(`Created:               ${user.createdAt.toISOString()}`);
  console.log(`organizationRole:      ${user.organizationRole ?? "—"}`);
  console.log(`researchAccessLevel:   ${user.researchAccessLevel}`);
  console.log("");

  // Latest consent state by key
  const consents = await prisma.userConsent.findMany({
    where: { userId: user.id },
    orderBy: { grantedAt: "desc" },
  });
  console.log(`Total UserConsent rows: ${consents.length}\n`);

  // Reduce to latest record per consentKey
  const latestByKey = new Map<string, { granted: boolean; revokedAt: Date | null; version: number; grantedAt: Date }>();
  for (const c of consents) {
    if (!latestByKey.has(c.consentKey)) {
      latestByKey.set(c.consentKey, {
        granted: c.granted && c.revokedAt === null,
        revokedAt: c.revokedAt,
        version: c.version,
        grantedAt: c.grantedAt,
      });
    }
  }

  console.log("Catalog vs DB:");
  console.log("─".repeat(95));
  console.log(
    "key".padEnd(28) +
      "required".padEnd(10) +
      "DB granted".padEnd(12) +
      "DB version".padEnd(12) +
      "Latest grantedAt".padEnd(22) +
      "Status",
  );
  console.log("─".repeat(95));

  let basicProcessingMissing = false;
  const requiredKeysToFix: string[] = [];

  for (const c of CONSENTS) {
    const state = latestByKey.get(c.key);
    const status =
      !state
        ? "❌ NEVER granted (missing)"
        : state.granted
          ? state.version >= c.version
            ? "✅ OK"
            : `⚠️  outdated (catalog v${c.version})`
          : "⚠️  revoked";

    console.log(
      c.key.padEnd(28) +
        (c.required ? "yes" : "no").padEnd(10) +
        (state?.granted ? "true" : "false").padEnd(12) +
        (state?.version != null ? `v${state.version}` : "—").padEnd(12) +
        (state?.grantedAt?.toISOString().slice(0, 19) ?? "—").padEnd(22) +
        status,
    );

    if (c.required && (!state || !state.granted)) {
      if (c.key === "basic_processing") basicProcessingMissing = true;
      requiredKeysToFix.push(c.key);
    }
  }
  console.log("─".repeat(95));
  console.log("");

  if (basicProcessingMissing) {
    console.log("🚨 basic_processing is NOT granted in DB.");
    console.log("   This user is stuck in the ConsentGate redirect loop.");
    if (!fixMode && !fixRequiredMode) {
      console.log("   Run with --fix to insert it now.");
      console.log(`   npx tsx prisma/diagnose-onboarding.ts ${email} --fix`);
    }
  } else {
    console.log("✅ basic_processing is granted. User can pass ConsentGate.");
  }

  if (fixMode || fixRequiredMode) {
    if (requiredKeysToFix.length === 0) {
      console.log("\nNothing to fix — all required consents already granted.");
    } else {
      console.log(`\n🔧 Fix mode — inserting ${requiredKeysToFix.length} required consent(s):`);
      for (const key of requiredKeysToFix) {
        const descriptor = CONSENTS.find((c) => c.key === key)!;
        const textHash = hashConsentText(descriptor.esBody, descriptor.enBody, descriptor.version);
        await prisma.userConsent.create({
          data: {
            userId: user.id,
            consentKey: descriptor.key,
            version: descriptor.version,
            granted: true,
            textHash,
            locale: null,
            ipAddress: null,
            userAgent: "diagnose-onboarding.ts CLI fix",
          },
        });
        console.log(`   ✓ Inserted ${key} v${descriptor.version} granted=true`);
      }
      console.log("\n✅ Done. Reload the app — ConsentGate should now let the user through.");
    }
  }

  console.log("");
}

main()
  .catch((e) => {
    console.error("❌ diagnose-onboarding failed:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
