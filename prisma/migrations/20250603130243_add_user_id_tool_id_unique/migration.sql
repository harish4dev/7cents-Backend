/*
  Warnings:

  - A unique constraint covering the columns `[userId,toolId]` on the table `AccessKey` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AccessKey_userId_toolId_key" ON "AccessKey"("userId", "toolId");
