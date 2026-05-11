import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL required");

const pool = new Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_BEDROCK_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

async function generateContent(strategyTitle: string): Promise<string> {
  const prompt = `Jesteś ekspertem od sprzedaży B2B i pozyskiwania klientów. Napisz krótką, praktyczną instrukcję na temat strategii sprzedażowej: "${strategyTitle}".

Napisz dokładnie 10 zdań. Każde zdanie w nowej linii. Wyjaśnij:
- Na czym polega ta strategia
- Dlaczego działa
- Jak ją zastosować krok po kroku
- Na co uważać

Pisz po polsku, konkretnie i praktycznie. Nie używaj punktów ani numerów - tylko zdania.`;

  const body = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  };

  const command = new InvokeModelCommand({
    modelId: "us.anthropic.claude-haiku-4-5-20251001-v1:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(body),
  });

  // Retry with backoff on throttling
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const response = await bedrockClient.send(command);
      const decoded = JSON.parse(new TextDecoder().decode(response.body));
      return decoded.content?.[0]?.text ?? "";
    } catch (err: unknown) {
      const isThrottle = err instanceof Error && err.name === "ThrottlingException";
      if (isThrottle && attempt < 5) {
        const wait = attempt * 3000;
        await new Promise((r) => setTimeout(r, wait));
      } else {
        throw err;
      }
    }
  }
  return "";
}

async function main() {
  // Get all unique strategy titles
  const cards = await prisma.strategyCard.findMany({
    select: { id: true, title: true, content: true },
  });

  // Only process cards that don't have content yet
  const emptyCards = cards.filter((c) => !c.content || c.content.trim() === "");
  const uniqueTitles = [...new Set(emptyCards.map((c) => c.title))];
  console.log(`Found ${cards.length} total cards, ${emptyCards.length} without content, ${uniqueTitles.length} unique titles to generate`);

  // Generate and save immediately for each unique title
  let done = 0;
  let updated = 0;

  for (const title of uniqueTitles) {
    process.stdout.write(`[${++done}/${uniqueTitles.length}] "${title}"... `);
    try {
      const content = await generateContent(title);
      // Save immediately to all cards with this title
      const result = await prisma.strategyCard.updateMany({
        where: { title, content: "" },
        data: { content },
      });
      updated += result.count;
      console.log(`✓ (saved ${result.count} cards)`);
    } catch (err) {
      console.log(`✗ ERROR: ${err}`);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(`\n✓ Done! Updated ${updated}/${cards.length} strategy cards.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
