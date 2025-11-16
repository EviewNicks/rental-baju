/*
  Warnings:

  - You are about to drop the column `quantity` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `rentedStock` on the `Product` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Product_rentedStock_idx";

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "quantity",
DROP COLUMN "rentedStock";

-- AlterTable
ALTER TABLE "public"."product_sizes" ADD COLUMN     "availableQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "originalQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rentedQuantity" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "product_sizes_originalQuantity_idx" ON "public"."product_sizes"("originalQuantity");

-- CreateIndex
CREATE INDEX "product_sizes_rentedQuantity_idx" ON "public"."product_sizes"("rentedQuantity");

-- CreateIndex
CREATE INDEX "product_sizes_availableQuantity_idx" ON "public"."product_sizes"("availableQuantity");
