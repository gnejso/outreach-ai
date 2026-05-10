import { prisma } from "../src/lib/prisma";

async function generatePromoCodes() {
  const codes = [
    { code: "OUTREACH1000A", credits: 1000 },
    { code: "OUTREACH1000B", credits: 1000 },
    { code: "OUTREACH1000C", credits: 1000 },
    { code: "OUTREACH1000D", credits: 1000 },
    { code: "OUTREACH1000E", credits: 1000 },
  ];

  for (const codeData of codes) {
    await prisma.promoCode.create({
      data: {
        code: codeData.code,
        credits: codeData.credits,
        maxUses: 1,
        active: true,
      },
    });
    console.log(`✅ Created: ${codeData.code}`);
  }

  console.log("\n🎉 All promo codes created!");
  console.log("\nCODES:");
  codes.forEach((c) => console.log(`  ${c.code} = ${c.credits} kredytów`));
}

generatePromoCodes()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
