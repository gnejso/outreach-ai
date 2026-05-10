import { invokeBedrock } from "./bedrock";

const LANG_MAP: Record<string, string> = {
  pl: "Polish", en: "English", de: "German", fr: "French",
  es: "Spanish", it: "Italian", pt: "Portuguese", nl: "Dutch",
  cs: "Czech", uk: "Ukrainian",
};

const g = globalThis as unknown as { __translCache?: Map<string, string> };
if (!g.__translCache) g.__translCache = new Map();

export async function translateBatch(texts: string[], locale: string): Promise<string[]> {
  if (locale === "pl" || !texts.length) return texts;
  const lang = LANG_MAP[locale] ?? "English";

  const result: string[] = new Array(texts.length);
  const toTranslate: { idx: number; text: string }[] = [];

  for (let i = 0; i < texts.length; i++) {
    const key = `${locale}:${texts[i]}`;
    const cached = g.__translCache!.get(key);
    if (cached !== undefined) {
      result[i] = cached;
    } else {
      toTranslate.push({ idx: i, text: texts[i] });
    }
  }

  if (toTranslate.length === 0) return result;

  const BATCH_SIZE = 60;
  for (let b = 0; b < toTranslate.length; b += BATCH_SIZE) {
    const batch = toTranslate.slice(b, b + BATCH_SIZE);
    const inputTexts = batch.map((x) => x.text);

    const prompt = `Translate these Polish texts to ${lang}. Return ONLY a valid JSON array with exactly ${inputTexts.length} translated strings in the same order. No markdown, no explanation, no extra text.\n\n${JSON.stringify(inputTexts)}`;

    try {
      const raw = await invokeBedrock({
        messages: [{ role: "user", content: prompt }],
        maxTokens: BATCH_SIZE * 150,
      });

      const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
      const translated: string[] = JSON.parse(cleaned);

      batch.forEach((item, i) => {
        const t = typeof translated[i] === "string" ? translated[i] : item.text;
        g.__translCache!.set(`${locale}:${item.text}`, t);
        result[item.idx] = t;
      });
    } catch {
      batch.forEach((item) => {
        g.__translCache!.set(`${locale}:${item.text}`, item.text);
        result[item.idx] = item.text;
      });
    }
  }

  return result;
}
