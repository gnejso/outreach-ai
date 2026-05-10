import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { checkAndDeductCredits, logActivity } from "@/lib/credits";
import { sendSms } from "@/lib/twilio";
import { CREDIT_COSTS } from "@/types";

interface SendItem {
  phone: string;
  message: string;
  companyName: string;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, credits: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await request.json();
  const { items }: { items: SendItem[] } = body;

  if (!items?.length) {
    return NextResponse.json({ error: "No items to send" }, { status: 400 });
  }

  const totalCost = items.length * CREDIT_COSTS.SMS_SEND;

  if (user.role !== "ADMIN" && user.credits < totalCost) {
    return NextResponse.json(
      { error: "Insufficient credits", needed: totalCost - user.credits },
      { status: 402 }
    );
  }

  const results: { phone: string; companyName: string; success: boolean; error?: string }[] = [];

  for (const item of items) {
    const ok = await checkAndDeductCredits(user.id, CREDIT_COSTS.SMS_SEND);
    if (!ok) {
      results.push({ phone: item.phone, companyName: item.companyName, success: false, error: "Insufficient credits" });
      continue;
    }

    const result = await sendSms(item.phone, item.message);
    results.push({
      phone: item.phone,
      companyName: item.companyName,
      success: result.success,
      error: result.error,
    });
  }

  const sent = results.filter((r) => r.success);
  await logActivity({
    userId: user.id,
    type: "SMS_SEND",
    description: `Wysyłka SMS — ${sent.length}/${items.length} do: ${items.slice(0, 3).map((i) => i.companyName).join(", ")}${items.length > 3 ? "..." : ""}`,
    creditsUsed: sent.length * CREDIT_COSTS.SMS_SEND,
    metadata: { total: items.length, sent: sent.length, failed: items.length - sent.length },
  });

  return NextResponse.json({ results });
}
