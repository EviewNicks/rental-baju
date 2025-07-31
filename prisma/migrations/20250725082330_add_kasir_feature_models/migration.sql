-- CreateTable
CREATE TABLE "penyewa" (
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
CREATE TABLE "transaksi" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "penyewaId" TEXT NOT NULL,
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

    CONSTRAINT "transaksi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaksi_item" (
    "id" TEXT NOT NULL,
    "transaksiId" TEXT NOT NULL,
    "produkId" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL DEFAULT 1,
    "hargaSewa" DECIMAL(10,2) NOT NULL,
    "durasi" INTEGER NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "kondisiAwal" TEXT,
    "kondisiAkhir" TEXT,
    "statusKembali" TEXT NOT NULL DEFAULT 'belum',

    CONSTRAINT "transaksi_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pembayaran" (
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
CREATE TABLE "aktivitas_transaksi" (
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
CREATE TABLE "file_upload" (
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
CREATE UNIQUE INDEX "penyewa_telepon_key" ON "penyewa"("telepon");

-- CreateIndex
CREATE INDEX "penyewa_telepon_idx" ON "penyewa"("telepon");

-- CreateIndex
CREATE INDEX "penyewa_nama_idx" ON "penyewa"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "transaksi_kode_key" ON "transaksi"("kode");

-- CreateIndex
CREATE INDEX "transaksi_kode_idx" ON "transaksi"("kode");

-- CreateIndex
CREATE INDEX "transaksi_status_idx" ON "transaksi"("status");

-- CreateIndex
CREATE INDEX "transaksi_penyewaId_idx" ON "transaksi"("penyewaId");

-- CreateIndex
CREATE INDEX "transaksi_createdAt_idx" ON "transaksi"("createdAt");

-- CreateIndex
CREATE INDEX "transaksi_item_transaksiId_idx" ON "transaksi_item"("transaksiId");

-- CreateIndex
CREATE INDEX "transaksi_item_produkId_idx" ON "transaksi_item"("produkId");

-- CreateIndex
CREATE INDEX "pembayaran_transaksiId_idx" ON "pembayaran"("transaksiId");

-- CreateIndex
CREATE INDEX "pembayaran_createdAt_idx" ON "pembayaran"("createdAt");

-- CreateIndex
CREATE INDEX "aktivitas_transaksi_transaksiId_idx" ON "aktivitas_transaksi"("transaksiId");

-- CreateIndex
CREATE INDEX "aktivitas_transaksi_tipe_idx" ON "aktivitas_transaksi"("tipe");

-- CreateIndex
CREATE INDEX "aktivitas_transaksi_createdAt_idx" ON "aktivitas_transaksi"("createdAt");

-- CreateIndex
CREATE INDEX "file_upload_entityType_entityId_idx" ON "file_upload"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "file_upload_createdAt_idx" ON "file_upload"("createdAt");

-- AddForeignKey
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_penyewaId_fkey" FOREIGN KEY ("penyewaId") REFERENCES "penyewa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi_item" ADD CONSTRAINT "transaksi_item_transaksiId_fkey" FOREIGN KEY ("transaksiId") REFERENCES "transaksi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi_item" ADD CONSTRAINT "transaksi_item_produkId_fkey" FOREIGN KEY ("produkId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_transaksiId_fkey" FOREIGN KEY ("transaksiId") REFERENCES "transaksi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aktivitas_transaksi" ADD CONSTRAINT "aktivitas_transaksi_transaksiId_fkey" FOREIGN KEY ("transaksiId") REFERENCES "transaksi"("id") ON DELETE CASCADE ON UPDATE CASCADE;
