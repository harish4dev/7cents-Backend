/*
  Warnings:

  - You are about to drop the column `authorised` on the `Tool` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Tool" DROP COLUMN "authorised";

-- AlterTable
ALTER TABLE "UserTool" ADD COLUMN     "authorised" BOOLEAN NOT NULL DEFAULT false;
