-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "orderId" TEXT,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Photo_productId_position_idx" ON "Photo"("productId", "position");

-- CreateIndex
CREATE INDEX "Photo_orderId_position_idx" ON "Photo"("orderId", "position");

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Фото принадлежит ровно одному: позиции каталога или заказу.
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_owner_check" CHECK (num_nonnulls("productId", "orderId") = 1);
