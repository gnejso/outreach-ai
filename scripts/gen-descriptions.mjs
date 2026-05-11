import { Pool } from "pg";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_BEDROCK_REGION ?? "us-east-1", credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY } });

async function generate(name, industry) {
  const body = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 120,
    messages: [{ role: "user", content: `Napisz 1-2 zdania opisujące czym zajmuje się firma "${name}" z branży "${industry}". Opis ma być konkretny i naturalny — jak w katalogu firm. Tylko opis, bez wstępów.` }],
  };
  const cmd = new InvokeModelCommand({ modelId: "us.anthropic.claude-haiku-4-5-20251001-v1:0", contentType: "application/json", accept: "application/json", body: JSON.stringify(body) });
  const res = await bedrock.send(cmd);
  const decoded = JSON.parse(new TextDecoder().decode(res.body));
  return decoded.content?.[0]?.text?.trim() ?? "";
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const { rows } = await pool.query('SELECT id, name, industry FROM "BusinessStrategy" ORDER BY name');
console.log(`Generating descriptions for ${rows.length} businesses...\n`);

for (let i = 0; i < rows.length; i++) {
  const { id, name, industry } = rows[i];
  let desc = "";
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      desc = await generate(name, industry);
      break;
    } catch (e) {
      if (attempt < 3) { await sleep(3000 * (attempt + 1)); }
      else { desc = `${name} — firma z branży ${industry}.`; }
    }
  }
  await pool.query('UPDATE "BusinessStrategy" SET description = $1 WHERE id = $2', [desc, id]);
  console.log(`[${i + 1}/${rows.length}] ${name}: ${desc.slice(0, 80)}...`);
  await sleep(600);
}

console.log("\nDone!");
await pool.end();
