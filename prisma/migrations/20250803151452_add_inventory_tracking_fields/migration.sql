-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "availableStock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rentedStock" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Product_availableStock_idx" ON "public"."Product"("availableStock");
