import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const businessName = searchParams.get("businessName");

    if (sessionId && businessName) {
      const note = await prisma.businessNote.findUnique({
        where: { userId_sessionId_businessName: { userId: user.id, sessionId, businessName } },
      });
      return NextResponse.json({ note: note ?? null });
    }

    if (sessionId) {
      const notes = await prisma.businessNote.findMany({
        where: { userId: user.id, sessionId },
        orderBy: { businessIndex: "asc" },
      });
      return NextResponse.json({ notes });
    }

    const notes = await prisma.businessNote.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ notes });
  } catch (err) {
    console.error("GET /api/business-notes error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      console.log("[business-notes] No session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
    if (!user) {
      console.log("[business-notes] User not found");
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const { sessionId, businessName, businessIndex, status, note, followUpDate } = body;

    console.log("[business-notes] POST request:", { sessionId, businessName, businessIndex, status, hasNote: !!note, followUpDate });

    if (!sessionId || !businessName) {
      console.log("[business-notes] Missing required fields");
      return NextResponse.json({ error: "Missing required fields: sessionId, businessName" }, { status: 400 });
    }

    const followUpParsed = followUpDate
      ? new Date(followUpDate)
      : null;

    const result = await prisma.businessNote.upsert({
      where: { userId_sessionId_businessName: { userId: user.id, sessionId, businessName } },
      update: {
        ...(status !== undefined && { status }),
        ...(note !== undefined && { note }),
        ...(followUpDate !== undefined && { followUpDate: followUpParsed, followUpDone: false }),
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        sessionId,
        businessName,
        businessIndex: businessIndex ?? 0,
        status: status ?? "NEW",
        note: note ?? "",
        followUpDate: followUpParsed,
        followUpDone: false,
      },
    });

    console.log("[business-notes] Saved successfully:", result.id);

    // Create activity log for CRM action
    if (status && status !== "NEW") {
      await prisma.activity.create({
        data: {
          userId: user.id,
          type: "STATUS_CHANGE",
          description: `Zmieniono status: ${businessName} → ${status}`,
          creditsUsed: 0,
          metadata: JSON.stringify({
            businessName,
            sessionId,
            status,
          }),
        },
      });
      console.log("[business-notes] Activity created for status change");
    }

    if (note && note.trim().length > 0) {
      await prisma.activity.create({
        data: {
          userId: user.id,
          type: "NOTE_SAVED",
          description: `Zapisano notatkę dla: ${businessName}`,
          creditsUsed: 0,
          metadata: JSON.stringify({
            businessName,
            sessionId,
          }),
        },
      });
      console.log("[business-notes] Activity created for note");
    }

    return NextResponse.json({ note: result, ok: true });
  } catch (err) {
    console.error("POST /api/business-notes error:", err);
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
  }
}
