import { getMockSession, isMockMode } from "./mockAuth";
import { auth } from "./auth";

export async function getSession() {
  if (isMockMode()) {
    return getMockSession();
  }
  return auth();
}
