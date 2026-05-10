/*
  Warnings:

  - You are about to drop the `CoachMessage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserCoachProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WeeklyPlan` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CoachMessage";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "UserCoachProfile";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "WeeklyPlan";
PRAGMA foreign_keys=on;
