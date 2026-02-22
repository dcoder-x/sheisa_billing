/*
  Warnings:

  - A unique constraint covering the columns `[subdomain]` on the table `Entity` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Entity" ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "subdomain" TEXT,
ADD COLUMN     "themeColor" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Entity_subdomain_key" ON "Entity"("subdomain");
