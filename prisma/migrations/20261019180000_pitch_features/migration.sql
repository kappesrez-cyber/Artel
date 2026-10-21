-- CreateEnum
CREATE TYPE "AssessmentTone" AS ENUM ('RELIABLE', 'GOOD', 'CAUTION', 'RISK');

-- CreateTable
CREATE TABLE "OrganizationLogo" (
    "organizationId" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationLogo_pkey" PRIMARY KEY ("organizationId")
);

-- CreateTable
CREATE TABLE "CompanyAssessment" (
    "organizationId" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "tone" "AssessmentTone" NOT NULL,
    "score" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "points" JSONB NOT NULL,
    "external" JSONB NOT NULL DEFAULT '{}',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyAssessment_pkey" PRIMARY KEY ("organizationId")
);

-- CreateTable
CREATE TABLE "PhotoSearch" (
    "id" TEXT NOT NULL,
    "viewerOrganizationId" TEXT,
    "hint" TEXT,
    "recognition" JSONB NOT NULL,
    "query" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhotoSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotoSearchImage" (
    "id" TEXT NOT NULL,
    "searchId" TEXT NOT NULL,
    "angle" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhotoSearchImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhotoSearch_createdAt_idx" ON "PhotoSearch"("createdAt");

-- CreateIndex
CREATE INDEX "PhotoSearchImage_searchId_position_idx" ON "PhotoSearchImage"("searchId", "position");

-- AddForeignKey
ALTER TABLE "OrganizationLogo" ADD CONSTRAINT "OrganizationLogo_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAssessment" ADD CONSTRAINT "CompanyAssessment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoSearch" ADD CONSTRAINT "PhotoSearch_viewerOrganizationId_fkey" FOREIGN KEY ("viewerOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoSearchImage" ADD CONSTRAINT "PhotoSearchImage_searchId_fkey" FOREIGN KEY ("searchId") REFERENCES "PhotoSearch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
