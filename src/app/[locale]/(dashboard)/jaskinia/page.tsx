import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { translateBatch } from "@/lib/translate";
import { JaskiniaClient } from "@/components/jaskinia/JaskiniaClient";

export default async function JaskiniaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  const user = session?.user?.email ? await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, credits: true, role: true },
  }) : null;

  const [businesses, unlockedRaw] = await Promise.all([
    prisma.businessStrategy.findMany({
      select: {
        id: true,
        name: true,
        industry: true,
        category: true,
        difficulty: true,
        description: true,
        teaser: true,
        strategies: { select: { id: true, type: true, title: true, content: true } },
      },
      orderBy: { name: "asc" },
    }),
    user ? prisma.unlockedStrategy.findMany({
      where: { userId: user.id },
      select: { businessId: true },
    }) : Promise.resolve([]),
  ]);

  const unlockedIds = new Set(unlockedRaw.map((u) => u.businessId));

  // Translate all text fields in one batch call per locale
  let serialized = businesses.map((b) => ({
    ...b,
    unlocked: user.role === "ADMIN" || unlockedIds.has(b.id),
  }));

  if (locale !== "pl") {
    // Collect all texts that need translation
    const nameTexts = businesses.map((b) => b.name);
    const industryTexts = businesses.map((b) => b.industry);
    const categoryTexts = businesses.map((b) => b.category);
    const descTexts = businesses.map((b) => b.description);
    const teaserTexts = businesses.map((b) => b.teaser);

    // Strategy titles and contents
    const allStrategyTitles: string[] = [];
    const allStrategyContents: string[] = [];
    const strategyIndex: { bizIdx: number; stratIdx: number }[] = [];
    businesses.forEach((b, bizIdx) => {
      b.strategies.forEach((s, stratIdx) => {
        allStrategyTitles.push(s.title);
        allStrategyContents.push(s.content);
        strategyIndex.push({ bizIdx, stratIdx });
      });
    });

    const [
      tNames, tIndustries, tCategories, tDescs, tTeasers,
      tStratTitles, tStratContents,
    ] = await Promise.all([
      translateBatch(nameTexts, locale),
      translateBatch(industryTexts, locale),
      translateBatch(categoryTexts, locale),
      translateBatch(descTexts, locale),
      translateBatch(teaserTexts, locale),
      translateBatch(allStrategyTitles, locale),
      translateBatch(allStrategyContents, locale),
    ]);

    serialized = serialized.map((b, i) => ({
      ...b,
      name: tNames[i],
      industry: tIndustries[i],
      category: tCategories[i],
      description: tDescs[i],
      teaser: tTeasers[i],
    }));

    strategyIndex.forEach(({ bizIdx, stratIdx }, flatIdx) => {
      serialized[bizIdx].strategies[stratIdx] = {
        ...serialized[bizIdx].strategies[stratIdx],
        title: tStratTitles[flatIdx],
        content: tStratContents[flatIdx],
      };
    });
  }

  return (
    <JaskiniaClient
      businesses={serialized}
      userCredits={user?.credits ?? 0}
      isAdmin={user?.role === "ADMIN"}
      locale={locale}
    />
  );
}
