import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { invokeBedrock } from "@/lib/bedrock";

export const maxDuration = 60;
export const runtime = "nodejs";

const LANGUAGE_MAP: Record<string, string> = {
  pl: "Polish (polski)",
  en: "English",
  de: "German (Deutsch)",
  es: "Spanish (Español)",
  fr: "French (Français)",
  it: "Italian (Italiano)",
};

interface Business {
  name: string;
  email?: string;
  reviews: number;
  rating?: number;
  industry?: string;
  website?: string;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sessionId, businessIndex, business, purpose, locale } = await req.json();

    if (!sessionId || businessIndex === undefined || !business || !purpose) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const languageInstruction = LANGUAGE_MAP[locale] || LANGUAGE_MAP.pl;
    const hasWebsite = business.website && business.website.trim().length > 3;

    let reviewContext = "";
    if (business.reviews === 0 || business.reviews <= 3) {
      reviewContext = "Very few reviews — mention finding them through a recommendation or local search";
    } else if (business.reviews <= 30) {
      reviewContext = "Growing reputation — acknowledge their developing online presence";
    } else if (business.reviews <= 100) {
      reviewContext = "Solid presence — recognize their established reputation";
    } else {
      reviewContext = "Industry leader status — acknowledge their strong market position";
    }

    if (business.rating && business.rating < 3.0) {
      reviewContext += ". NEVER mention reviews or ratings.";
    }

    const prompt = `You are an expert cold email copywriter.
Write ENTIRELY in ${languageInstruction}.
Generate a professional, personalized cold email for this business.

Cold emails are LONGER and MORE PROFESSIONAL than SMS.
They should feel researched and thoughtful, not spammy.

PURPOSE (most important):
${purpose}

BUSINESS DATA:
Name: ${business.name}
Industry: ${business.industry || "unknown"}
Reviews: ${business.reviews || 0} reviews, rating ${business.rating || "unknown"}
Has website: ${hasWebsite ? "YES - " + business.website : "NO"}

THINK DEEPLY:
- What does this business actually do?
- What specific problem does the PURPOSE solve for THIS industry?
- What would make the owner of THIS business open and read this email?
- What number or fact would be most relevant?

WEBSITE RULE:
- Has website YES: never offer to build one. Focus on other aspects.
- Has website NO: mention they are invisible to online searchers.

REVIEWS RULE:
${reviewContext}

EMAIL FORMAT - use exactly this structure:

Subject: [compelling subject line, max 60 chars, no clickbait]

[Opening - 2 sentences]
Personal hook referencing something specific about their business.
Sound like you researched them, not like a template.

[Problem - 2-3 sentences]
Describe a specific problem they likely have right now.
Connect it directly to the PURPOSE of this email.
Use a relevant statistic or number if possible.

[Solution - 2-3 sentences]
What you offer and how it specifically solves their problem.
Be concrete about the benefit, not the feature.
Reference their industry specifically.

[Social proof - 1-2 sentences]
Brief mention of results for similar businesses.
No names needed, just industry and result.

[CTA - 1-2 sentences]
Soft, low-pressure call to action.
Offer a specific next step (15-minute call, free audit, quick question).

[Signature]
[Imię]
[Stanowisko opcjonalne]
[Kontakt opcjonalny]

ABSOLUTE RULES:
- Write in ${languageInstruction} only
- Professional but human tone
- No exclamation marks in subject line
- No spam trigger words: FREE, GUARANTEED, LIMITED TIME
- Every email completely unique
- 150-250 words total (body only, not subject)
- Sound like it was written by a human expert`;

    const email = await invokeBedrock({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 1200,
      temperature: 0.7,
      system: `You are a professional cold email copywriter. Write in ${languageInstruction}. Generate personalized, professional emails that feel researched and human-written.`,
    });

    if (!email) {
      return NextResponse.json({ error: "Email generation failed" }, { status: 500 });
    }

    return NextResponse.json({ email });
  } catch (error) {
    console.error("[cold-email/single] Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
