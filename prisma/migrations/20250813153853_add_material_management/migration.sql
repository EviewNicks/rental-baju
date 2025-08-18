-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "materialCost" DECIMAL(10,2),
ADD COLUMN     "materialId" TEXT,
ADD COLUMN     "materialQuantity" INTEGER;

-- CreateTable
CREATE TABLE "public"."materials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pricePerUnit" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_material_active_name" ON "public"."materials"("isActive", "name");

-- CreateIndex
CREATE INDEX "materials_createdBy_idx" ON "public"."materials"("createdBy");

-- CreateIndex
CREATE INDEX "Product_materialId_idx" ON "public"."Product"("materialId");

-- CreateIndex
CREATE INDEX "idx_product_material_cost" ON "public"."Product"("materialCost");

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "public"."materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;
