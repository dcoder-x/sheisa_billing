/*
  Warnings:

  - A unique constraint covering the columns `[subdomain]` on the table `RegistrationRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('PDF', 'IMAGE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "BulkJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'PAUSED', 'CANCELED');

-- AlterTable
ALTER TABLE "InvoiceTemplate" ADD COLUMN     "design" JSONB,
ADD COLUMN     "fields" JSONB,
ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "type" "TemplateType" NOT NULL DEFAULT 'CUSTOM',
ALTER COLUMN "content" DROP NOT NULL;

-- AlterTable
ALTER TABLE "RegistrationRequest" ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "subdomain" TEXT,
ADD COLUMN     "themeColor" TEXT;

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "pdfUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "bulkJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkGenerationJob" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "status" "BulkJobStatus" NOT NULL DEFAULT 'PENDING',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "resultUrl" TEXT,
    "errorLog" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulkGenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Document_templateId_idx" ON "Document"("templateId");

-- CreateIndex
CREATE INDEX "Document_bulkJobId_idx" ON "Document"("bulkJobId");

-- CreateIndex
CREATE INDEX "BulkGenerationJob_entityId_idx" ON "BulkGenerationJob"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationRequest_subdomain_key" ON "RegistrationRequest"("subdomain");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "InvoiceTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_bulkJobId_fkey" FOREIGN KEY ("bulkJobId") REFERENCES "BulkGenerationJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkGenerationJob" ADD CONSTRAINT "BulkGenerationJob_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
