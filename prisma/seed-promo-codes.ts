import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function randomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const TIERS = [
  { tier: "TIER1", prefix: "T1", credits: 400, count: 10 },
  { tier: "TIER2", prefix: "T2", credits: 1500, count: 10 },
  { tier: "TIER3", prefix: "T3", credits: 2500, count: 10 },
];

async function main() {
  console.log("Generating 30 promo codes (10 per tier)...\n");

  for (const { tier, prefix, credits, count } of TIERS) {
    console.log(`\n--- ${tier} (${credits} kredytów) ---`);
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      const code = `${prefix}-${randomCode()}`;
      await prisma.promoCode.upsert({
        where: { code },
        update: {},
        create: {
          code,
          tier,
          credits,
          maxUses: 1,
          active: true,
        },
      });
      codes.push(code);
      console.log(`  ${code}`);
    }
  }

  console.log("\n✅ Done! 30 promo codes generated.");
  console.log("\nSave these codes — they won't be shown again.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
