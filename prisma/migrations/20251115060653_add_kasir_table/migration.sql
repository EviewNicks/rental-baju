-- CreateEnum
CREATE TYPE "public"."ProductStatus" AS ENUM ('AVAILABLE', 'RENTED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "public"."ConditionCategory" AS ENUM ('BAIK', 'KOTOR', 'RUSAK_RINGAN', 'RUSAK_BERAT', 'HILANG');

-- CreateEnum
CREATE TYPE "public"."AgeCategory" AS ENUM ('ADULT', 'CHILD', 'UNIVERSAL');

-- CreateEnum
CREATE TYPE "public"."SizeEnum" AS ENUM ('XS', 'S', 'M', 'L', 'XL', 'XXL', 'UNIVERSAL');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "modalAwal" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "categoryId" TEXT NOT NULL,
    "status" "public"."ProductStatus" NOT NULL DEFAULT 'AVAILABLE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "size" TEXT,
    "rentedStock" INTEGER NOT NULL DEFAULT 0,
    "currentPrice" DECIMAL(10,2) NOT NULL,
    "materialCost" DECIMAL(10,2),
    "materialId" TEXT,
    "materialQuantity" INTEGER,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'clothing',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."materials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pricePerUnit" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'meter',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_sizes" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "ageCategory" "public"."AgeCategory" NOT NULL,
    "size" "public"."SizeEnum" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "product_sizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."penyewa" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "telepon" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "email" TEXT,
    "nik" TEXT,
    "foto" TEXT,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "penyewa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."kasir" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "kasir_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."transaksi" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "penyewaId" TEXT NOT NULL,
    "kasirId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "totalHarga" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "jumlahBayar" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sisaBayar" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tglMulai" TIMESTAMP(3) NOT NULL,
    "tglSelesai" TIMESTAMP(3),
    "tglKembali" TIMESTAMP(3),
    "metodeBayar" TEXT NOT NULL DEFAULT 'tunai',
    "catatan" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "flatLatePenalty" DECIMAL(10,2) NOT NULL DEFAULT 20000,
    "isLateReturn" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "transaksi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."transaksi_item" (
    "id" TEXT NOT NULL,
    "transaksiId" TEXT NOT NULL,
    "produkId" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL DEFAULT 1,
    "hargaSewa" DECIMAL(10,2) NOT NULL,
    "durasi" INTEGER NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "kondisiAwal" TEXT,
    "statusKembali" TEXT NOT NULL DEFAULT 'belum',
    "jumlahDiambil" INTEGER NOT NULL DEFAULT 0,
    "totalReturnPenalty" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "conditionCount" INTEGER NOT NULL DEFAULT 1,
    "migratedFromSingleMode" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "transaksi_item_pkey" PRIMARY KEY ("id")
);

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
    "conditionCategory" "public"."ConditionCategory" NOT NULL DEFAULT 'BAIK',
    "manualPrice" DECIMAL(10,2),
    "useManualPricing" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "transaksi_item_return_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pembayaran" (
    "id" TEXT NOT NULL,
    "transaksiId" TEXT NOT NULL,
    "jumlah" DECIMAL(10,2) NOT NULL,
    "metode" TEXT NOT NULL,
    "referensi" TEXT,
    "catatan" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pembayaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."aktivitas_transaksi" (
    "id" TEXT NOT NULL,
    "transaksiId" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "data" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aktivitas_transaksi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."file_upload" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_upload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Product_code_key" ON "public"."Product"("code");

-- CreateIndex
CREATE INDEX "Product_isActive_idx" ON "public"."Product"("isActive");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "public"."Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "public"."Product"("status");

-- CreateIndex
CREATE INDEX "Product_createdBy_idx" ON "public"."Product"("createdBy");

-- CreateIndex
CREATE INDEX "Product_size_idx" ON "public"."Product"("size");

-- CreateIndex
CREATE INDEX "Product_rentedStock_idx" ON "public"."Product"("rentedStock");

-- CreateIndex
CREATE INDEX "idx_product_penalty_calc" ON "public"."Product"("id", "modalAwal");

-- CreateIndex
CREATE INDEX "Product_materialId_idx" ON "public"."Product"("materialId");

-- CreateIndex
CREATE INDEX "idx_product_material_cost" ON "public"."Product"("materialCost");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "public"."Category"("name");

-- CreateIndex
CREATE INDEX "Category_createdBy_idx" ON "public"."Category"("createdBy");

-- CreateIndex
CREATE INDEX "Category_type_idx" ON "public"."Category"("type");

-- CreateIndex
CREATE UNIQUE INDEX "materials_name_key" ON "public"."materials"("name");

-- CreateIndex
CREATE INDEX "materials_name_idx" ON "public"."materials"("name");

-- CreateIndex
CREATE INDEX "materials_createdBy_idx" ON "public"."materials"("createdBy");

-- CreateIndex
CREATE INDEX "product_sizes_productId_idx" ON "public"."product_sizes"("productId");

-- CreateIndex
CREATE INDEX "product_sizes_ageCategory_idx" ON "public"."product_sizes"("ageCategory");

-- CreateIndex
CREATE INDEX "product_sizes_isActive_idx" ON "public"."product_sizes"("isActive");

-- CreateIndex
CREATE INDEX "product_sizes_createdBy_idx" ON "public"."product_sizes"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "product_sizes_productId_ageCategory_size_key" ON "public"."product_sizes"("productId", "ageCategory", "size");

-- CreateIndex
CREATE UNIQUE INDEX "penyewa_telepon_key" ON "public"."penyewa"("telepon");

-- CreateIndex
CREATE INDEX "penyewa_telepon_idx" ON "public"."penyewa"("telepon");

-- CreateIndex
CREATE INDEX "penyewa_nama_idx" ON "public"."penyewa"("nama");

-- CreateIndex
CREATE INDEX "kasir_nama_idx" ON "public"."kasir"("nama");

-- CreateIndex
CREATE INDEX "kasir_isActive_idx" ON "public"."kasir"("isActive");

-- CreateIndex
CREATE INDEX "kasir_createdAt_idx" ON "public"."kasir"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "transaksi_kode_key" ON "public"."transaksi"("kode");

-- CreateIndex
CREATE INDEX "transaksi_kode_idx" ON "public"."transaksi"("kode");

-- CreateIndex
CREATE INDEX "transaksi_status_idx" ON "public"."transaksi"("status");

-- CreateIndex
CREATE INDEX "transaksi_penyewaId_idx" ON "public"."transaksi"("penyewaId");

-- CreateIndex
CREATE INDEX "transaksi_kasirId_idx" ON "public"."transaksi"("kasirId");

-- CreateIndex
CREATE INDEX "transaksi_createdAt_idx" ON "public"."transaksi"("createdAt");

-- CreateIndex
CREATE INDEX "idx_transaksi_status_id_validation" ON "public"."transaksi"("status", "id");

-- CreateIndex
CREATE INDEX "idx_transaksi_penalty_dates" ON "public"."transaksi"("id", "tglSelesai", "status");

-- CreateIndex
CREATE INDEX "idx_transaksi_late_penalty" ON "public"."transaksi"("isLateReturn");

-- CreateIndex
CREATE INDEX "transaksi_item_transaksiId_idx" ON "public"."transaksi_item"("transaksiId");

-- CreateIndex
CREATE INDEX "transaksi_item_produkId_idx" ON "public"."transaksi_item"("produkId");

-- CreateIndex
CREATE INDEX "idx_transaksi_item_status_lookup" ON "public"."transaksi_item"("id", "statusKembali", "jumlahDiambil");

-- CreateIndex
CREATE INDEX "idx_transaksi_item_product_join" ON "public"."transaksi_item"("produkId", "transaksiId", "statusKembali");

-- CreateIndex
CREATE INDEX "idx_transaksi_item_unified_processing" ON "public"."transaksi_item"("id", "statusKembali", "conditionCount");

-- CreateIndex
CREATE INDEX "idx_transaksi_item_migration_history" ON "public"."transaksi_item"("migratedFromSingleMode", "conditionCount");

-- CreateIndex
CREATE INDEX "idx_transaksi_item_return_timeline" ON "public"."transaksi_item_return"("transaksiItemId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_transaksi_item_return_penalty" ON "public"."transaksi_item_return"("transaksiItemId", "penaltyAmount");

-- CreateIndex
CREATE INDEX "idx_transaksi_item_return_condition" ON "public"."transaksi_item_return"("conditionCategory");

-- CreateIndex
CREATE INDEX "idx_transaksi_item_return_manual_pricing" ON "public"."transaksi_item_return"("useManualPricing", "manualPrice");

-- CreateIndex
CREATE INDEX "pembayaran_transaksiId_idx" ON "public"."pembayaran"("transaksiId");

-- CreateIndex
CREATE INDEX "pembayaran_createdAt_idx" ON "public"."pembayaran"("createdAt");

-- CreateIndex
CREATE INDEX "aktivitas_transaksi_transaksiId_idx" ON "public"."aktivitas_transaksi"("transaksiId");

-- CreateIndex
CREATE INDEX "aktivitas_transaksi_tipe_idx" ON "public"."aktivitas_transaksi"("tipe");

-- CreateIndex
CREATE INDEX "aktivitas_transaksi_createdAt_idx" ON "public"."aktivitas_transaksi"("createdAt");

-- CreateIndex
CREATE INDEX "file_upload_entityType_entityId_idx" ON "public"."file_upload"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "file_upload_createdAt_idx" ON "public"."file_upload"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "public"."materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_sizes" ADD CONSTRAINT "product_sizes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transaksi" ADD CONSTRAINT "transaksi_penyewaId_fkey" FOREIGN KEY ("penyewaId") REFERENCES "public"."penyewa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transaksi" ADD CONSTRAINT "transaksi_kasirId_fkey" FOREIGN KEY ("kasirId") REFERENCES "public"."kasir"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transaksi_item" ADD CONSTRAINT "transaksi_item_produkId_fkey" FOREIGN KEY ("produkId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transaksi_item" ADD CONSTRAINT "transaksi_item_transaksiId_fkey" FOREIGN KEY ("transaksiId") REFERENCES "public"."transaksi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transaksi_item_return" ADD CONSTRAINT "transaksi_item_return_transaksiItemId_fkey" FOREIGN KEY ("transaksiItemId") REFERENCES "public"."transaksi_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pembayaran" ADD CONSTRAINT "pembayaran_transaksiId_fkey" FOREIGN KEY ("transaksiId") REFERENCES "public"."transaksi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."aktivitas_transaksi" ADD CONSTRAINT "aktivitas_transaksi_transaksiId_fkey" FOREIGN KEY ("transaksiId") REFERENCES "public"."transaksi"("id") ON DELETE CASCADE ON UPDATE CASCADE;
