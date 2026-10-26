-- Три тарифа вместо четырёх: Старт (FREE), Про (PRO), Холдинг (HOLDING).
-- Max переходит в Про, Ultra становится Холдингом.
ALTER TYPE "PlanTier" RENAME TO "PlanTier_old";
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO', 'HOLDING');

ALTER TABLE "Organization" ALTER COLUMN "plan" DROP DEFAULT;
ALTER TABLE "Organization" ALTER COLUMN "plan" TYPE "PlanTier" USING (
  CASE "plan"::text WHEN 'MAX' THEN 'PRO' WHEN 'ULTRA' THEN 'HOLDING' ELSE "plan"::text END
)::"PlanTier";
ALTER TABLE "Organization" ALTER COLUMN "plan" SET DEFAULT 'FREE';

ALTER TABLE "PlanPurchase" ALTER COLUMN "plan" TYPE "PlanTier" USING (
  CASE "plan"::text WHEN 'MAX' THEN 'PRO' WHEN 'ULTRA' THEN 'HOLDING' ELSE "plan"::text END
)::"PlanTier";

DROP TYPE "PlanTier_old";
