-- Документы и отчёты всегда видны на публичной странице предприятия: признак скрытия больше не нужен.
ALTER TABLE "OrganizationDocument" DROP COLUMN "isPublic";
