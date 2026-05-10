-- CreateTable
CREATE TABLE "GeneratedScript" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "businessIndex" INTEGER NOT NULL,
    "businessName" TEXT NOT NULL,
    "script" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("sessionId") REFERENCES "ScriptSession" ("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedScript_sessionId_businessIndex_key" ON "GeneratedScript"("sessionId", "businessIndex");

-- CreateIndex
CREATE INDEX "GeneratedScript_sessionId_idx" ON "GeneratedScript"("sessionId");
