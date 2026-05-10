// AI generation — powered by AWS Bedrock (Claude Haiku 4.5)
import { invokeBedrock, logCost } from "./bedrock";
import { getLanguageInstruction, getLanguageName } from "./utils/language";
import { hasWebsite as detectWebsite } from "./utils/parseSpreadsheet";

// ── Script params ───────────────────────────────────────────────────────────

interface ScriptParams {
  name: string;
  industry: string;
  city?: string;
  reviews: number;
  rating?: number;
  hasWebsite: boolean;
  websiteUrl?: string;
  purpose: string;
  locale?: string;
}

// ── Cold Call ────────────────────────────────────────────────────────────────

export async function generateColdCallScript(params: ScriptParams): Promise<string> {
  const { name, industry, reviews, rating, hasWebsite, purpose, locale = "pl" } = params;
  const languageInstruction = getLanguageInstruction(locale);
  const langName = getLanguageName(locale);

  const systemPrompt = `You are a professional B2B sales coach with 15 years of experience training cold callers.
${languageInstruction}

You create natural, consultative cold call scripts that build trust and open conversations - not aggressive pitches.
Your scripts feel like helpful business advice, not sales pressure.`;

  const userPrompt = `
CRITICAL TASK: Write a professional cold call script for this specific business.

═══════════════════════════════════════════════════════════════════
STEP 1: READ AND ANALYZE THE BUSINESS
═══════════════════════════════════════════════════════════════════

Business name: ${name}
Industry: ${industry || "general business"}
Google reviews: ${reviews || 0} reviews${rating ? `, ${rating}/5.0 rating` : ""}
Has their own website: ${hasWebsite ? "YES - they are online" : "NO - they are invisible online"}

═══════════════════════════════════════════════════════════════════
STEP 2: READ WHAT YOU'RE SELLING (THIS IS THE MOST IMPORTANT PART)
═══════════════════════════════════════════════════════════════════

${purpose}

↑ READ THIS CAREFULLY. Understand exactly what service/product you're offering.
Think: How does THIS specific offer help THIS specific business in ${industry} industry?

═══════════════════════════════════════════════════════════════════
STEP 3: THINK BEFORE WRITING
═══════════════════════════════════════════════════════════════════

Ask yourself these questions:

1. OPENING - How do I reference their business naturally?
${reviews > 20
  ? `   → They have ${reviews} reviews - this shows they're established. Compliment this achievement genuinely.`
  : reviews > 5
  ? `   → They have ${reviews} reviews - acknowledge their growing online presence.`
  : `   → Few/no reviews - use "I heard about you" or "someone recommended you" approach.`}

2. PROBLEM - What specific problem does THIS business have?
${!hasWebsite
  ? `   → They have NO WEBSITE. This means:
     • Customers searching "${industry}" online cannot find them
     • Competitors with websites steal their potential clients
     • They lose 50-70% of leads to online competition
     • This is THEIR problem - make it clear but not aggressive`
  : `   → They HAVE a website already. So the problem is NOT "you need a website."
     Look at what you're selling: "${purpose}"
     • If SEO → they're ranked low, competitors appear first
     • If ads → they're not reaching new customers proactively
     • If social media → they're missing visual marketing opportunities
     • If AI/automation → they're wasting time on manual tasks
     Find the SPECIFIC pain point for ${industry} industry based on your offer.`}

3. SOLUTION - How does "${purpose}" solve THEIR problem?
   → Don't just describe your service - connect it to THEIR situation
   → Use numbers if possible: "businesses like yours see 40% more inquiries"
   → Be specific to ${industry} industry
   → Explain the outcome, not features

4. TRUST - Why should they listen to you?
   → You specialize in ${industry} or similar industries
   → You've helped businesses like theirs before
   → You understand their specific challenges
   → You're offering to help, not pressure to buy

═══════════════════════════════════════════════════════════════════
STEP 4: WRITE THE SCRIPT IN THIS EXACT FORMAT
═══════════════════════════════════════════════════════════════════

Use these section headers (tags) exactly:

[OTWIERACZ]
Write 3-4 sentences that:
• Greet them professionally and mention their business name
• Reference something specific (their reviews, location, industry position)
• Build credibility - why are you calling THEM specifically
• Feel like you researched them, not random cold call

Tone: Friendly, respectful, professional. Like talking to a business colleague.

[HACZYK]
Write 2-3 sentences that:
• Identify the SPECIFIC problem they have (based on your analysis above)
• Make it relevant to THEIR industry and situation
• Frame it as an observation, not accusation
• Create curiosity - they should want to know more

Tone: Consultative, helpful. You're pointing out something they might not have realized.

[PROPOZYCJA]
Write 3-4 sentences that:
• Explain EXACTLY what you're offering: "${purpose}"
• Connect it directly to the problem you mentioned
• Use a specific benefit or number if possible
• Explain the outcome for THEIR business, not just features
• Reference how it works for ${industry} industry specifically

Tone: Clear, specific, valuable. Focus on THEIR benefit, not your service.

[CTA]
Write 1-2 sentences that:
• Soft call to action - not pushy
• Example: "Czy mogę wysłać Panu przykłady firm z branży ${industry}, którym pomogliśmy?"
• Or: "Warto poświęcić 15 minut na rozmowę, żeby pokazać konkretne liczby?"
• Make it easy to say yes - low commitment

Tone: Inviting, not demanding. Give them a simple next step.

[OBIEKCJE]
List 3 most common objections for ${industry} industry, and natural responses:

Objection 1: [Most common objection for this industry]
Response: [Natural, understanding response that addresses it without being defensive]

Objection 2: [Second most common objection]
Response: [Natural response]

Objection 3: [Third most common objection]
Response: [Natural response]

Tone: Understanding, professional, solution-focused.

═══════════════════════════════════════════════════════════════════
ABSOLUTE REQUIREMENTS
═══════════════════════════════════════════════════════════════════

✓ Write ENTIRELY in ${langName} language - every single word
✓ Use the exact section headers: [OTWIERACZ], [HACZYK], [PROPOZYCJA], [CTA], [OBIEKCJE]
✓ Professional but conversational - like business colleague, not salesperson
✓ NO corporate jargon, buzzwords, or marketing speak
✓ Reference ${name} naturally in the opening
✓ Connect everything to ${industry} industry specifically
✓ Make it feel researched and personalized, not template
✓ Focus on THEIR benefit, not your service features
✓ Be helpful and consultative, not pushy or aggressive

Now write the complete cold call script following this structure exactly.`;

  try {
    const result = await invokeBedrock({
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 1500,
      temperature: 0.8,
    });
    logCost("cold-call", systemPrompt + userPrompt, result);
    return result;
  } catch (err) {
    console.error("[bedrock:cold-call] Error:", err);
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to generate cold call script: ${errorMsg}`);
  }
}

// ── SMS ──────────────────────────────────────────────────────────────────────

const recentSmsOpenings: string[] = [];

export async function generateSmsContent(params: {
  name: string;
  industry: string;
  reviews: number;
  rating?: number;
  hasWebsite: boolean;
  city?: string;
  purpose: string;
  locale?: string;
}): Promise<string> {
  const { name, reviews, rating, hasWebsite, city, purpose, industry, locale = "pl" } = params;
  const languageInstruction = getLanguageInstruction(locale);
  const langName = getLanguageName(locale);

  const systemPrompt = `You are an expert B2B sales SMS writer with 10 years of experience in direct outreach.
${languageInstruction}
You write multi-sentence SMS messages that are professional, specific, and conversion-focused.`;

  const avoidHint = recentSmsOpenings.length > 0
    ? `\n\nDO NOT START with any of these phrases: ${recentSmsOpenings.slice(-5).map(p => `"${p}"`).join(", ")}`
    : "";

  const userPrompt = `
TASK: Write a professional multi-sentence SMS for this business.

BUSINESS DETAILS:
- Business name: ${name}
- Industry: ${industry || "general"}
- Google reviews: ${reviews || 0} reviews${rating ? `, rating ${rating}/5.0` : ""}
- Has their own website: ${hasWebsite ? "YES" : "NO"}
${city ? `- Location: ${city}` : ""}

WHAT YOU'RE SELLING:
${purpose}

CRITICAL INSTRUCTION - READ THIS CAREFULLY:
Your SMS MUST be 3-5 sentences long. Think step by step before writing:

STEP 1 - OPENING (1 sentence):
${reviews > 20
  ? `Reference their ${reviews} Google reviews positively. This shows you researched them and builds credibility.`
  : reviews > 0
  ? `Mention you found them online and their growing online presence.`
  : `Start with a professional introduction - you help businesses in ${industry} industry.`}

STEP 2 - THE PROBLEM (1-2 sentences):
${!hasWebsite
  ? `State the hard truth: Customers searching for "${industry}" online cannot find ${name}. They're losing clients to competitors who appear in Google.`
  : `Based on "${purpose}" - identify the specific problem they have RIGHT NOW. Be concrete and specific to their industry.`}

STEP 3 - YOUR SOLUTION (1 sentence):
${purpose.toLowerCase().includes("strona") || purpose.toLowerCase().includes("website") || purpose.toLowerCase().includes("www")
  ? `Explain how a professional website will make them visible to customers actively searching for their services.`
  : purpose.toLowerCase().includes("seo")
  ? `Explain how you get them to appear first in Google when customers search for their service.`
  : purpose.toLowerCase().includes("social") || purpose.toLowerCase().includes("instagram") || purpose.toLowerCase().includes("facebook")
  ? `Explain how social media brings them new clients automatically through targeted content.`
  : `Explain exactly how "${purpose}" solves their problem. Be specific, not vague.`}

STEP 4 - CALL TO ACTION (1 sentence):
End with a direct question that invites response: "Interested in seeing examples?" or "Can I send you details?" or "Worth 10 minutes to discuss?"

FORMATTING RULES:
✓ Write 3-5 complete sentences
✓ Write in ${langName} language - every single word
✓ Professional tone, but conversational (like texting a business colleague)
✓ Use specific numbers or facts when possible
✓ Reference their business name naturally
✓ Maximum 500 characters total (about 3-5 sentences in ${langName})
✓ NO corporate jargon or marketing buzzwords
✓ NO emojis
✓ Sound like a human reaching out, not a bot${avoidHint}

EXAMPLES OF GOOD MULTI-SENTENCE SMS:
"${name} - widzę że macie ${reviews} opinii na Google, świetna robota! Problem jest taki, że większość Waszych potencjalnych klientów szuka online, a Wy nie macie strony www. Tracicie dziesiątki zapytań miesięcznie na rzecz konkurencji. Specjalizuję się w prostych stronach dla firm z branży ${industry}. Mogę wysłać przykłady?"

"Dzień dobry ${name}. Pomagam firmom z branży ${industry} zwiększać ilość zapytań przez Google. Obecnie konkurencja wyświetla się powyżej Was w wynikach wyszukiwania i zabiera klientów. Mam sprawdzony system, który stawia firmy na pierwszej stronie Google. Zainteresowani szczegółami?"

Now write ONE professional multi-sentence SMS following this structure exactly. Reply with ONLY the SMS text.`;

  try {
    const result = await invokeBedrock({
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 350,
      temperature: 0.9,
    });
    logCost("sms", systemPrompt + userPrompt, result);
    const cleaned = result.trim().replace(/^["']|["']$/g, "");
    recentSmsOpenings.push(cleaned.slice(0, 40));
    if (recentSmsOpenings.length > 10) recentSmsOpenings.shift();
    return cleaned;
  } catch (err) {
    console.error("[bedrock:sms] Error:", err);
    const errorMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to generate SMS content: ${errorMsg}`);
  }
}
