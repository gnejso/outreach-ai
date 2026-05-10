import { getSession } from "@/lib/session";
import { SmsClient } from "@/components/sms/SmsClient";

export default async function SmsPage() {
  const session = await getSession();
  const userEmail = session?.user?.email;

  return <SmsClient userEmail={userEmail} />;
}
