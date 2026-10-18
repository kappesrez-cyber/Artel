-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO', 'MAX', 'ULTRA');

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "docsHelpRequestedAt" TIMESTAMP(3),
ADD COLUMN     "docsHelpRequestedById" TEXT;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "plan" "PlanTier" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "planUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PlanPurchase" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "plan" "PlanTier" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "provider" TEXT NOT NULL,
    "providerPaymentId" TEXT,
    "status" "StarPurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanPurchase_providerPaymentId_key" ON "PlanPurchase"("providerPaymentId");

-- CreateIndex
CREATE INDEX "PlanPurchase_organizationId_createdAt_idx" ON "PlanPurchase"("organizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "PlanPurchase" ADD CONSTRAINT "PlanPurchase_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
