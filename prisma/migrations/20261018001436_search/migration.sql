-- Поиск: триграммы для артикулов внутри текста и похожести названий, расстояние Левенштейна
-- для исправления опечаток. Оба расширения есть в PostgreSQL, Neon и `prisma dev`.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- CreateEnum
CREATE TYPE "ProductEventKind" AS ENUM ('IMPRESSION', 'VIEW');

-- CreateEnum
CREATE TYPE "OrderNeedKind" AS ENUM ('IMPORT_REPLACEMENT', 'MANUFACTURE', 'SUPPLY');

-- CreateEnum
CREATE TYPE "OrderRecurrence" AS ENUM ('ONCE', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "analogAllowed" BOOLEAN,
ADD COLUMN     "application" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "needKind" "OrderNeedKind",
ADD COLUMN     "originalArticle" TEXT,
ADD COLUMN     "originalBrand" TEXT,
ADD COLUMN     "recurrence" "OrderRecurrence",
ADD COLUMN     "requiredDocuments" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "analogs" TEXT,
ADD COLUMN     "article" TEXT,
ADD COLUMN     "searchVector" tsvector;

-- CreateTable
CREATE TABLE "ProductEvent" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "kind" "ProductEventKind" NOT NULL,
    "viewerOrganizationId" TEXT,
    "searchQueryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchQuery" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "resultsCount" INTEGER NOT NULL,
    "viewerOrganizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchQuery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductEvent_productId_kind_createdAt_idx" ON "ProductEvent"("productId", "kind", "createdAt");

-- CreateIndex
CREATE INDEX "ProductEvent_searchQueryId_idx" ON "ProductEvent"("searchQueryId");

-- CreateIndex
CREATE INDEX "SearchQuery_createdAt_idx" ON "SearchQuery"("createdAt");

-- CreateIndex
CREATE INDEX "SearchQuery_normalized_idx" ON "SearchQuery"("normalized");

-- CreateIndex
CREATE INDEX "Product_searchVector_idx" ON "Product" USING GIN ("searchVector");

-- CreateIndex
CREATE INDEX "Product_searchText_idx" ON "Product" USING GIN ("searchText" gin_trgm_ops);

-- AddForeignKey
ALTER TABLE "ProductEvent" ADD CONSTRAINT "ProductEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductEvent" ADD CONSTRAINT "ProductEvent_searchQueryId_fkey" FOREIGN KEY ("searchQueryId") REFERENCES "SearchQuery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Полнотекстовый индекс позиции считает сама база, поэтому он не расходится с данными,
-- как бы позиция ни менялась. Веса: A — название и артикулы, B — описание, D — остальное
-- (город, производитель, слитные написания артикулов из searchText).
CREATE FUNCTION product_search_vector() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('russian', coalesce(NEW."name", '')), 'A') ||
    setweight(to_tsvector('simple', regexp_replace(
      coalesce(NEW."article", '') || ' ' || coalesce(NEW."analogs", ''), '[-./,;:()×]+', ' ', 'g'
    )), 'A') ||
    setweight(to_tsvector('russian', coalesce(NEW."description", '')), 'B') ||
    setweight(to_tsvector('russian', coalesce(NEW."searchText", '')), 'D');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_search_vector
  BEFORE INSERT OR UPDATE OF "name", "article", "analogs", "description", "searchText" ON "Product"
  FOR EACH ROW EXECUTE FUNCTION product_search_vector();

-- Заполнить индекс у уже существующих позиций.
UPDATE "Product" SET "searchText" = "searchText";
