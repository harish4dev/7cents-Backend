/*
  Warnings:

  - A unique constraint covering the columns `[userId,toolId]` on the table `UserTool` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserTool_userId_toolId_key" ON "UserTool"("userId", "toolId");
