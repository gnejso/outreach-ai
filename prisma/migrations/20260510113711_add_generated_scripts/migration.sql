-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GeneratedScript" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "businessIndex" INTEGER NOT NULL,
    "businessName" TEXT NOT NULL,
    "script" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GeneratedScript_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ScriptSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GeneratedScript" ("businessIndex", "businessName", "createdAt", "id", "script", "sessionId") SELECT "businessIndex", "businessName", "createdAt", "id", "script", "sessionId" FROM "GeneratedScript";
DROP TABLE "GeneratedScript";
ALTER TABLE "new_GeneratedScript" RENAME TO "GeneratedScript";
CREATE INDEX "GeneratedScript_sessionId_idx" ON "GeneratedScript"("sessionId");
CREATE UNIQUE INDEX "GeneratedScript_sessionId_businessIndex_key" ON "GeneratedScript"("sessionId", "businessIndex");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
