-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "currentPrice" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Product_rentedStock_idx" ON "public"."Product"("rentedStock");
