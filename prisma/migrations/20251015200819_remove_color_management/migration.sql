-- AlterTable: Remove colorId column from Product table
ALTER TABLE "Product" DROP COLUMN IF EXISTS "colorId";

-- DropIndex: Remove color-related indexes
DROP INDEX IF EXISTS "Product_colorId_idx";
DROP INDEX IF EXISTS "Product_categoryId_size_colorId_idx";

-- DropTable: Remove colors table
DROP TABLE IF EXISTS "colors";
