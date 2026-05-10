import { prisma } from "./prisma";

const MOCK_EMAIL = process.env.ADMIN_EMAIL ?? "janmikolajczak77@gmail.com";

// Cache the mock user ID so we only create/check once per process lifetime.
// Fresh DB lookups still happen per-request for up-to-date credits.
const g = globalThis as unknown as { __mockUserId?: string };

export async function ensureMockUser() {
  if (g.__mockUserId) {
    const user = await prisma.user.findUnique({ where: { id: g.__mockUserId } });
    if (user) return user;
  }
  const existing = await prisma.user.findUnique({ where: { email: MOCK_EMAIL } });
  if (existing) {
    g.__mockUserId = existing.id;
    return existing;
  }
  const created = await prisma.user.create({
    data: {
      email: MOCK_EMAIL,
      name: "Jan Mikołajczak",
      role: "ADMIN",
      tier: "ADMIN",
      credits: 999999,
      freeScripts: 999,
    },
  });
  g.__mockUserId = created.id;
  return created;
}

export async function getMockSession() {
  const user = await ensureMockUser();
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      tier: user.tier,
      credits: user.credits,
      freeScripts: user.freeScripts,
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

export function isMockMode() {
  return process.env.NEXT_PUBLIC_DEV_MOCK_AUTH === "true";
}
