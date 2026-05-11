-- AlterTable
ALTER TABLE "PromoCode" ADD COLUMN     "tier" TEXT,
ADD COLUMN     "usedAt" TIMESTAMP(3),
ADD COLUMN     "usedBy" TEXT;

-- CreateTable
CREATE TABLE "WebAudit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "industry" TEXT,
    "report" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebAudit_userId_idx" ON "WebAudit"("userId");

-- CreateIndex
CREATE INDEX "WebAudit_userId_createdAt_idx" ON "WebAudit"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "WebAudit" ADD CONSTRAINT "WebAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
