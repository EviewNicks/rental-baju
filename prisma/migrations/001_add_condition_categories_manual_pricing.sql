-- Migration: Add condition categories and manual pricing support
-- Date: 2025-09-16

-- Create ConditionCategory enum
CREATE TYPE "ConditionCategory" AS ENUM ('BAIK', 'KOTOR', 'RUSAK_RINGAN', 'RUSAK_BERAT', 'HILANG');

-- Add new fields to transaksi table for flat penalty
ALTER TABLE "transaksi" ADD COLUMN "flatLatePenalty" DECIMAL(10,2) DEFAULT 20000 NOT NULL;
ALTER TABLE "transaksi" ADD COLUMN "isLateReturn" BOOLEAN DEFAULT false NOT NULL;

-- Add index for late penalty lookups
CREATE INDEX "idx_transaksi_late_penalty" ON "transaksi"("isLateReturn");

-- Add new fields to transaksi_item_return table for manual pricing
ALTER TABLE "transaksi_item_return" ADD COLUMN "conditionCategory" "ConditionCategory" DEFAULT 'BAIK' NOT NULL;
ALTER TABLE "transaksi_item_return" ADD COLUMN "manualPrice" DECIMAL(10,2);
ALTER TABLE "transaksi_item_return" ADD COLUMN "useManualPricing" BOOLEAN DEFAULT false NOT NULL;

-- Add indexes for the new fields
CREATE INDEX "idx_transaksi_item_return_condition" ON "transaksi_item_return"("conditionCategory");
CREATE INDEX "idx_transaksi_item_return_manual_pricing" ON "transaksi_item_return"("useManualPricing", "manualPrice");

-- Update existing records to use default values (optional, for safety)
-- This ensures all existing data has proper values
UPDATE "transaksi" SET "flatLatePenalty" = 20000, "isLateReturn" = false WHERE "flatLatePenalty" IS NULL;
UPDATE "transaksi_item_return" SET "conditionCategory" = 'BAIK', "useManualPricing" = false WHERE "conditionCategory" IS NULL;

-- Migration completed successfully
-- Added: ConditionCategory enum, flatLatePenalty fields, manual pricing support