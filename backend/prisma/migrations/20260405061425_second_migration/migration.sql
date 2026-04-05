/*
  Warnings:

  - The values [SCHEDULED,LIVE] on the enum `MatchStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [RETIRED_OUT,OBSTRUCTING_THE_FIELD,TIMED_OUT] on the enum `WicketType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `dismissedBatsmanId` on the `Ball` table. All the data in the column will be lost.
  - You are about to drop the column `isLegalDelivery` on the `Ball` table. All the data in the column will be lost.
  - You are about to drop the column `over` on the `Ball` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `Ball` table. All the data in the column will be lost.
  - You are about to drop the column `wicket` on the `Ball` table. All the data in the column will be lost.
  - You are about to drop the column `awayTeamId` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `format` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `homeTeamId` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `overs` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `battingOrder` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `bowlingOrder` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `shortName` on the `Team` table. All the data in the column will be lost.
  - Added the required column `nonStrikerId` to the `Ball` table without a default value. This is not possible if the table is not empty.
  - Added the required column `overNumber` to the `Ball` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teamAId` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teamBId` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalOvers` to the `Match` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TossDecision" AS ENUM ('BAT', 'BOWL');

-- AlterEnum
BEGIN;
CREATE TYPE "MatchStatus_new" AS ENUM ('CREATED', 'TOSS_DONE', 'INNINGS_1', 'INNINGS_BREAK', 'INNINGS_2', 'COMPLETED');
ALTER TABLE "public"."Match" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Match" ALTER COLUMN "status" TYPE "MatchStatus_new" USING ("status"::text::"MatchStatus_new");
ALTER TYPE "MatchStatus" RENAME TO "MatchStatus_old";
ALTER TYPE "MatchStatus_new" RENAME TO "MatchStatus";
DROP TYPE "public"."MatchStatus_old";
ALTER TABLE "Match" ALTER COLUMN "status" SET DEFAULT 'CREATED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "WicketType_new" AS ENUM ('BOWLED', 'CAUGHT', 'RUN_OUT', 'LBW', 'STUMPED', 'HIT_WICKET');
ALTER TABLE "Ball" ALTER COLUMN "wicketType" TYPE "WicketType_new" USING ("wicketType"::text::"WicketType_new");
ALTER TYPE "WicketType" RENAME TO "WicketType_old";
ALTER TYPE "WicketType_new" RENAME TO "WicketType";
DROP TYPE "public"."WicketType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Ball" DROP CONSTRAINT "Ball_dismissedBatsmanId_fkey";

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_awayTeamId_fkey";

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_homeTeamId_fkey";

-- DropIndex
DROP INDEX "Ball_inningsId_over_ballNumber_timestamp_idx";

-- DropIndex
DROP INDEX "Ball_matchId_inningsId_timestamp_idx";

-- AlterTable
ALTER TABLE "Ball" DROP COLUMN "dismissedBatsmanId",
DROP COLUMN "isLegalDelivery",
DROP COLUMN "over",
DROP COLUMN "timestamp",
DROP COLUMN "wicket",
ADD COLUMN     "dismissedPlayerId" TEXT,
ADD COLUMN     "incomingBatsmanId" TEXT,
ADD COLUMN     "isDead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isLegal" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isWicket" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nonStrikerId" TEXT NOT NULL,
ADD COLUMN     "overNumber" INTEGER NOT NULL,
ADD COLUMN     "overthrowRuns" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Innings" ADD COLUMN     "lastOverBowlerId" TEXT,
ADD COLUMN     "openingBowlerId" TEXT,
ADD COLUMN     "openingNonStrikerId" TEXT,
ADD COLUMN     "openingStrikerId" TEXT;

-- AlterTable
ALTER TABLE "Match" DROP COLUMN "awayTeamId",
DROP COLUMN "completedAt",
DROP COLUMN "format",
DROP COLUMN "homeTeamId",
DROP COLUMN "overs",
DROP COLUMN "startedAt",
ADD COLUMN     "currentInnings" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "teamAId" TEXT NOT NULL,
ADD COLUMN     "teamBId" TEXT NOT NULL,
ADD COLUMN     "tossDecision" "TossDecision",
ADD COLUMN     "tossWinnerId" TEXT,
ADD COLUMN     "totalOvers" INTEGER NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'CREATED';

-- AlterTable
ALTER TABLE "Player" DROP COLUMN "battingOrder",
DROP COLUMN "bowlingOrder",
DROP COLUMN "role";

-- AlterTable
ALTER TABLE "Team" DROP COLUMN "shortName";

-- DropEnum
DROP TYPE "MatchFormat";

-- DropEnum
DROP TYPE "PlayerRole";

-- CreateIndex
CREATE INDEX "Ball_matchId_inningsId_createdAt_idx" ON "Ball"("matchId", "inningsId", "createdAt");

-- CreateIndex
CREATE INDEX "Ball_inningsId_overNumber_ballNumber_idx" ON "Ball"("inningsId", "overNumber", "ballNumber");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_teamAId_fkey" FOREIGN KEY ("teamAId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_teamBId_fkey" FOREIGN KEY ("teamBId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_tossWinnerId_fkey" FOREIGN KEY ("tossWinnerId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Innings" ADD CONSTRAINT "Innings_openingStrikerId_fkey" FOREIGN KEY ("openingStrikerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Innings" ADD CONSTRAINT "Innings_openingNonStrikerId_fkey" FOREIGN KEY ("openingNonStrikerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Innings" ADD CONSTRAINT "Innings_openingBowlerId_fkey" FOREIGN KEY ("openingBowlerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Innings" ADD CONSTRAINT "Innings_lastOverBowlerId_fkey" FOREIGN KEY ("lastOverBowlerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ball" ADD CONSTRAINT "Ball_nonStrikerId_fkey" FOREIGN KEY ("nonStrikerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ball" ADD CONSTRAINT "Ball_incomingBatsmanId_fkey" FOREIGN KEY ("incomingBatsmanId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ball" ADD CONSTRAINT "Ball_dismissedPlayerId_fkey" FOREIGN KEY ("dismissedPlayerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
