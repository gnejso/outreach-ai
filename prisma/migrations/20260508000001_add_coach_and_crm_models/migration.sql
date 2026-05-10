-- CreateTable
CREATE TABLE IF NOT EXISTS "ScriptSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sessionType" TEXT NOT NULL DEFAULT 'COLD_CALL',
    "purpose" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "creditsUsed" INTEGER NOT NULL,
    "scripts" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScriptSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "BusinessNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "businessIndex" INTEGER NOT NULL DEFAULT 0,
    "businessName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "note" TEXT DEFAULT '',
    "followUpDate" DATETIME,
    "followUpDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BusinessNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserCoachProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "targetCustomer" TEXT NOT NULL,
    "revenueGoal" TEXT NOT NULL,
    "monthlyGoal" INTEGER NOT NULL,
    "weeklyHours" INTEGER NOT NULL,
    "mondayHours" REAL NOT NULL DEFAULT 0,
    "tuesdayHours" REAL NOT NULL DEFAULT 0,
    "wednesdayHours" REAL NOT NULL DEFAULT 0,
    "thursdayHours" REAL NOT NULL DEFAULT 0,
    "fridayHours" REAL NOT NULL DEFAULT 0,
    "saturdayHours" REAL NOT NULL DEFAULT 0,
    "sundayHours" REAL NOT NULL DEFAULT 0,
    "experience" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserCoachProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "WeeklyPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "weekStart" TEXT NOT NULL,
    "planJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WeeklyPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CoachMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoachMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Activity_userId_idx" ON "Activity"("userId");
CREATE INDEX IF NOT EXISTS "Activity_createdAt_idx" ON "Activity"("createdAt");
CREATE INDEX IF NOT EXISTS "Activity_userId_createdAt_idx" ON "Activity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ScriptSession_userId_idx" ON "ScriptSession"("userId");
CREATE INDEX IF NOT EXISTS "ScriptSession_createdAt_idx" ON "ScriptSession"("createdAt");
CREATE INDEX IF NOT EXISTS "ScriptSession_userId_sessionType_idx" ON "ScriptSession"("userId", "sessionType");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "BusinessNote_userId_sessionId_businessName_key" ON "BusinessNote"("userId", "sessionId", "businessName");
CREATE INDEX IF NOT EXISTS "BusinessNote_userId_idx" ON "BusinessNote"("userId");
CREATE INDEX IF NOT EXISTS "BusinessNote_sessionId_idx" ON "BusinessNote"("sessionId");
CREATE INDEX IF NOT EXISTS "BusinessNote_followUpDate_idx" ON "BusinessNote"("followUpDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserCoachProfile_userId_key" ON "UserCoachProfile"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WeeklyPlan_userId_idx" ON "WeeklyPlan"("userId");
CREATE INDEX IF NOT EXISTS "WeeklyPlan_userId_weekStart_idx" ON "WeeklyPlan"("userId", "weekStart");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CoachMessage_userId_idx" ON "CoachMessage"("userId");
CREATE INDEX IF NOT EXISTS "CoachMessage_userId_createdAt_idx" ON "CoachMessage"("userId", "createdAt");
