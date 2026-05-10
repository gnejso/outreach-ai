-- CreateTable
CREATE TABLE "BusinessStrategy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "teaser" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "StrategyCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    CONSTRAINT "StrategyCard_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessStrategy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UnlockedStrategy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UnlockedStrategy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UnlockedStrategy_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessStrategy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BusinessStrategy_industry_idx" ON "BusinessStrategy"("industry");

-- CreateIndex
CREATE INDEX "BusinessStrategy_category_idx" ON "BusinessStrategy"("category");

-- CreateIndex
CREATE INDEX "BusinessStrategy_difficulty_idx" ON "BusinessStrategy"("difficulty");

-- CreateIndex
CREATE INDEX "StrategyCard_businessId_idx" ON "StrategyCard"("businessId");

-- CreateIndex
CREATE INDEX "UnlockedStrategy_userId_idx" ON "UnlockedStrategy"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UnlockedStrategy_userId_businessId_key" ON "UnlockedStrategy"("userId", "businessId");
