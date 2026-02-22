/*
  Warnings:

  - A unique constraint covering the columns `[email,entityId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'ENTITY_ADMIN';

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_supplierId_fkey";

-- DropIndex
DROP INDEX "Invoice_supplierId_idx";

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "documentId" TEXT,
ALTER COLUMN "supplierId" DROP NOT NULL,
ALTER COLUMN "amount" SET DEFAULT 0,
ALTER COLUMN "issueDate" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "dueDate" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "forcePasswordReset" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE UNIQUE INDEX "User_email_entityId_key" ON "User"("email", "entityId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
