import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "janmikolajczak77@gmail.com";

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existing) {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: "ADMIN", tier: "ADMIN", credits: 999999 },
    });
    console.log(`Admin account updated: ${adminEmail}`);
  } else {
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Jan Mikołajczak",
        role: "ADMIN",
        tier: "ADMIN",
        credits: 999999,
        freeScripts: 999,
      },
    });
    console.log(`Admin account created: ${adminEmail}`);
  }

  const user = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (user) {
    const actCount = await prisma.activity.count({ where: { userId: user.id } });
    if (actCount === 0) {
      await prisma.activity.createMany({
        data: [
          {
            userId: user.id,
            type: "COLD_CALL_SCRIPT",
            description: "Cold Call Script — 3 firm: Kowalski Stolarz, ABC Budowlanka, XYZ Auto",
            creditsUsed: 12,
            metadata: JSON.stringify({ count: 3 }),
          },
          {
            userId: user.id,
            type: "SMS_CONTENT",
            description: "Treść SMS — 5 firm: Auto Serwis Nowak, Piekarnia Kowal...",
            creditsUsed: 15,
            metadata: JSON.stringify({ count: 5 }),
          },
          {
            userId: user.id,
            type: "SMS_SEND",
            description: "Wysyłka SMS — 5/5 do: Auto Serwis Nowak...",
            creditsUsed: 50,
            metadata: JSON.stringify({ total: 5, sent: 5, failed: 0 }),
          },
        ],
      });
      console.log("Demo activities seeded.");
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
