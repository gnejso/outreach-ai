import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Stripe webhook placeholder — connect when Stripe is configured
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    // TODO: verify stripe signature
    // const sig = request.headers.get("stripe-signature");
    const event = JSON.parse(body);

    if (event.type === "checkout.session.completed" || event.type === "payment_intent.succeeded") {
      const email = event.data?.object?.customer_email ?? event.data?.object?.metadata?.email;
      const creditsToAdd = parseInt(event.data?.object?.metadata?.credits ?? "0", 10);
      const packName = event.data?.object?.metadata?.pack_name ?? "Credit Pack";

      if (email && creditsToAdd > 0) {
        const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { credits: { increment: creditsToAdd } },
          });
          await prisma.activity.create({
            data: {
              userId: user.id,
              type: "CREDITS_PURCHASE",
              description: `Doładowanie: ${packName} +${creditsToAdd} kredytów`,
              creditsUsed: -creditsToAdd,
              metadata: JSON.stringify({ pack: packName, credits: creditsToAdd, stripeEventId: event.id }),
            },
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
