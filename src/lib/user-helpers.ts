import { Session } from "next-auth";

export function getUserEmail(session: Session | null): string {
  if (!session?.user?.email) {
    throw new Error("User email not found");
  }
  return session.user.email;
}
