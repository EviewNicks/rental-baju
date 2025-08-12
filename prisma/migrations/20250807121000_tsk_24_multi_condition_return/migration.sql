/*
  Warnings:

  - You are about to drop the column `availableStock` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `hargaSewa` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `totalPendapatan` on the `Product` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Product_availableStock_idx";

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "availableStock",
DROP COLUMN "hargaSewa",
DROP COLUMN "totalPendapatan",
ALTER COLUMN "currentPrice" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."transaksi_item" ADD COLUMN     "isMultiCondition" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "multiConditionSummary" JSONB,
ADD COLUMN     "totalReturnPenalty" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."transaksi_item_return" (
    "id" TEXT NOT NULL,
    "transaksiItemId" TEXT NOT NULL,
    "kondisiAkhir" TEXT NOT NULL,
    "jumlahKembali" INTEGER NOT NULL,
    "penaltyAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "modalAwalUsed" DECIMAL(10,2),
    "penaltyCalculation" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "transaksi_item_return_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_transaksi_item_return_timeline" ON "public"."transaksi_item_return"("transaksiItemId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_transaksi_item_return_penalty" ON "public"."transaksi_item_return"("transaksiItemId", "penaltyAmount");

-- CreateIndex
CREATE INDEX "idx_product_penalty_calc" ON "public"."Product"("id", "modalAwal");

-- CreateIndex
CREATE INDEX "idx_transaksi_status_id_validation" ON "public"."transaksi"("status", "id");

-- CreateIndex
CREATE INDEX "idx_transaksi_penalty_dates" ON "public"."transaksi"("id", "tglSelesai", "status");

-- CreateIndex
CREATE INDEX "idx_transaksi_item_status_lookup" ON "public"."transaksi_item"("id", "statusKembali", "jumlahDiambil");

-- CreateIndex
CREATE INDEX "idx_transaksi_item_product_join" ON "public"."transaksi_item"("produkId", "transaksiId", "statusKembali");

-- CreateIndex
CREATE INDEX "idx_transaksi_item_multi_condition" ON "public"."transaksi_item"("id", "isMultiCondition", "statusKembali");

-- AddForeignKey
ALTER TABLE "public"."transaksi_item_return" ADD CONSTRAINT "transaksi_item_return_transaksiItemId_fkey" FOREIGN KEY ("transaksiItemId") REFERENCES "public"."transaksi_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
