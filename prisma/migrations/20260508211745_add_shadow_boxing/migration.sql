-- CreateTable
CREATE TABLE "ShadowBoxingSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "personaName" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "feedback" TEXT,
    "creditsUsed" INTEGER NOT NULL DEFAULT 10,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShadowBoxingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ShadowBoxingSession_userId_idx" ON "ShadowBoxingSession"("userId");

-- CreateIndex
CREATE INDEX "ShadowBoxingSession_userId_createdAt_idx" ON "ShadowBoxingSession"("userId", "createdAt");
