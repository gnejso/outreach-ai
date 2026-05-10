import { getSession } from "@/lib/session";
import { ColdCallClient } from "@/components/cold-call/ColdCallClient";

export default async function ColdCallPage() {
  const session = await getSession();
  const userEmail = session?.user?.email;

  return <ColdCallClient userEmail={userEmail} />;
}
