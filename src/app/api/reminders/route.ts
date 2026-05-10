import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const notes = await prisma.businessNote.findMany({
      where: { userId: user.id, followUpDate: { not: null }, followUpDone: false },
      orderBy: { followUpDate: "asc" },
    });

    return NextResponse.json({ reminders: notes });
  } catch (err) {
    console.error("GET /api/reminders error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();
    const { noteId, action, newDate } = body;
    if (!noteId || !action) return NextResponse.json({ error: "Missing noteId or action" }, { status: 400 });

    if (action === "done") {
      const updated = await prisma.businessNote.update({
        where: { id: noteId },
        data: { followUpDone: true },
      });
      return NextResponse.json({ note: updated });
    }

    if (action === "reschedule" && newDate) {
      const updated = await prisma.businessNote.update({
        where: { id: noteId },
        data: { followUpDate: new Date(newDate) },
      });
      return NextResponse.json({ note: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("PUT /api/reminders error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
