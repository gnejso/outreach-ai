import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { generateSmsContent } from "@/lib/anthropic";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await request.json();
  const {
    sessionId,
    businessIndex,
    business,
    purpose,
    locale = "pl",
  }: {
    sessionId: string;
    businessIndex: number;
    business: {
      name: string;
      industry?: string;
      reviews: number;
      rating?: number;
      hasWebsite: boolean;
      city?: string;
      phone?: string;
    };
    purpose: string;
    locale?: string;
  } = body;

  if (!sessionId || businessIndex === undefined || !business || !purpose) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // Check if SMS already exists
    const existing = await prisma.generatedScript.findUnique({
      where: {
        sessionId_businessIndex: {
          sessionId,
          businessIndex,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ message: existing.script, cached: true });
    }

    // Generate new SMS
    const message = await generateSmsContent({
      name: business.name,
      industry: business.industry ?? "ogólna",
      reviews: business.reviews,
      rating: business.rating,
      hasWebsite: business.hasWebsite,
      city: business.city,
      purpose,
      locale,
    });

    // Save to database
    await prisma.generatedScript.create({
      data: {
        sessionId,
        businessIndex,
        businessName: business.name,
        script: message,
      },
    });

    return NextResponse.json({ message, cached: false });
  } catch (err) {
    console.error("[sms/single] Error:", err);
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Failed to generate SMS: ${errorMsg}` },
      { status: 500 }
    );
  }
}
