/*
  Warnings:

  - You are about to drop the column `authorised` on the `UserTool` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserTool" DROP COLUMN "authorised",
ADD COLUMN     "authorized" BOOLEAN NOT NULL DEFAULT false;
