import { prisma } from "./prisma";
import { ActivityType } from "@/types";

export async function checkAndDeductCredits(
  userId: string,
  cost: number
): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  if (user.credits < cost) return false;
  await prisma.user.update({
    where: { id: userId },
    data: { credits: { decrement: cost } },
  });
  return true;
}

export async function logActivity(params: {
  userId: string;
  type: ActivityType;
  description: string;
  creditsUsed: number;
  metadata?: Record<string, unknown> | null;
}) {
  await prisma.activity.create({
    data: {
      userId: params.userId,
      type: params.type,
      description: params.description,
      creditsUsed: params.creditsUsed,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}

export async function getUserCredits(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });
  return user?.credits ?? 0;
}
