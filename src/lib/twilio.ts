export async function sendSms(
  to: string,
  body: string
): Promise<{ success: boolean; sid?: string; error?: string }> {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log(`[MOCK SMS] To: ${to} | Body: ${body}`);
    await new Promise((r) => setTimeout(r, 300));
    return { success: true, sid: `MOCK_${Date.now()}` };
  }

  const twilio = (await import("twilio")).default;
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to,
    });
    return { success: true, sid: message.sid };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error };
  }
}
