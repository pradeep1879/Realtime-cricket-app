/*
  Warnings:

  - Added the required column `leagueId` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leagueId` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LeagueStatus" AS ENUM ('UPCOMING', 'LIVE', 'COMPLETED');

-- AlterEnum
ALTER TYPE "MatchStatus" ADD VALUE 'ABANDONED';

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "leagueId" TEXT NOT NULL,
ADD COLUMN     "scheduledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "leagueId" TEXT NOT NULL,
ADD COLUMN     "logoUrl" TEXT;

-- CreateTable
CREATE TABLE "League" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "LeagueStatus" NOT NULL DEFAULT 'UPCOMING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "League_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Team_leagueId_name_idx" ON "Team"("leagueId", "name");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;
