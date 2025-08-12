/*
  Warnings:

  - You are about to drop the column `isMultiCondition` on the `transaksi_item` table. All the data in the column will be lost.
  - You are about to drop the column `kondisiAkhir` on the `transaksi_item` table. All the data in the column will be lost.
  - You are about to drop the column `multiConditionSummary` on the `transaksi_item` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."idx_transaksi_item_multi_condition";

-- AlterTable
ALTER TABLE "public"."transaksi_item" DROP COLUMN "isMultiCondition",
DROP COLUMN "kondisiAkhir",
DROP COLUMN "multiConditionSummary",
ADD COLUMN     "conditionCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "migratedFromSingleMode" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "idx_transaksi_item_unified_processing" ON "public"."transaksi_item"("id", "statusKembali", "conditionCount");

-- CreateIndex
CREATE INDEX "idx_transaksi_item_migration_history" ON "public"."transaksi_item"("migratedFromSingleMode", "conditionCount");
