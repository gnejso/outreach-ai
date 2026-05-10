import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { id } = await params;
  const scriptSession = await prisma.scriptSession.findFirst({
    where: { id, userId: user.id },
    include: {
      generatedScripts: {
        orderBy: { businessIndex: 'asc' }
      }
    }
  });
  if (!scriptSession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let businesses: unknown[] = [];
  try {
    const parsed = JSON.parse(scriptSession.scripts as string);
    businesses = Array.isArray(parsed) ? parsed : [];
  } catch {
    businesses = [];
  }

  // Build scripts array with saved scripts
  const savedScripts: Record<number, string> = {};
  scriptSession.generatedScripts.forEach(gs => {
    savedScripts[gs.businessIndex] = gs.script;
  });

  const scripts = businesses.map((business: any, index: number) => ({
    company: {
      name: business.name,
      phone: business.phone,
      reviews: business.reviews,
      rating: business.rating,
      industry: business.industry,
      hasWebsite: business.website ? true : false,
    },
    script: savedScripts[index] || "", // Empty string if not yet generated
  }));

  return NextResponse.json({
    session: {
      id: scriptSession.id,
      purpose: scriptSession.purpose,
      count: scriptSession.count,
      creditsUsed: scriptSession.creditsUsed,
      createdAt: scriptSession.createdAt.toISOString(),
      scripts,
    },
  });
}
