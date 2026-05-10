-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "tier" TEXT NOT NULL DEFAULT 'FREE',
    "credits" INTEGER NOT NULL DEFAULT 75,
    "freeScripts" INTEGER NOT NULL DEFAULT 11,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "creditsUsed" INTEGER NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScriptSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionType" TEXT NOT NULL DEFAULT 'COLD_CALL',
    "purpose" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "creditsUsed" INTEGER NOT NULL,
    "scripts" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScriptSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedScript" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "businessIndex" INTEGER NOT NULL,
    "businessName" TEXT NOT NULL,
    "script" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedScript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "businessIndex" INTEGER NOT NULL DEFAULT 0,
    "businessName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "note" TEXT DEFAULT '',
    "followUpDate" TIMESTAMP(3),
    "followUpDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessStrategy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "teaser" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategyCard" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "StrategyCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnlockedStrategy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnlockedStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShadowBoxingSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "personaName" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "feedback" TEXT,
    "creditsUsed" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShadowBoxingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- CreateIndex
CREATE INDEX "Activity_userId_createdAt_idx" ON "Activity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ScriptSession_userId_idx" ON "ScriptSession"("userId");

-- CreateIndex
CREATE INDEX "ScriptSession_createdAt_idx" ON "ScriptSession"("createdAt");

-- CreateIndex
CREATE INDEX "ScriptSession_userId_sessionType_idx" ON "ScriptSession"("userId", "sessionType");

-- CreateIndex
CREATE INDEX "GeneratedScript_sessionId_idx" ON "GeneratedScript"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedScript_sessionId_businessIndex_key" ON "GeneratedScript"("sessionId", "businessIndex");

-- CreateIndex
CREATE INDEX "BusinessNote_userId_idx" ON "BusinessNote"("userId");

-- CreateIndex
CREATE INDEX "BusinessNote_sessionId_idx" ON "BusinessNote"("sessionId");

-- CreateIndex
CREATE INDEX "BusinessNote_followUpDate_idx" ON "BusinessNote"("followUpDate");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessNote_userId_sessionId_businessName_key" ON "BusinessNote"("userId", "sessionId", "businessName");

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

-- CreateIndex
CREATE INDEX "ShadowBoxingSession_userId_idx" ON "ShadowBoxingSession"("userId");

-- CreateIndex
CREATE INDEX "ShadowBoxingSession_userId_createdAt_idx" ON "ShadowBoxingSession"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScriptSession" ADD CONSTRAINT "ScriptSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedScript" ADD CONSTRAINT "GeneratedScript_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ScriptSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessNote" ADD CONSTRAINT "BusinessNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategyCard" ADD CONSTRAINT "StrategyCard_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessStrategy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnlockedStrategy" ADD CONSTRAINT "UnlockedStrategy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnlockedStrategy" ADD CONSTRAINT "UnlockedStrategy_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessStrategy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShadowBoxingSession" ADD CONSTRAINT "ShadowBoxingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
