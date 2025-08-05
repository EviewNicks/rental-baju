🧑‍🏫 Penjelasan Masalah Fundamental: Konflik Konsep "Quantity" di Sistem Rental

Anda benar sekali! Mari saya jelaskan masalah mendasar yang terjadi di sistem
rental baju ini.

🔍 Analisis Log Menunjukkan Masalah Utama

Dari log terbaru yang saya lihat, ada kontradiksi yang sangat jelas:

Di Database Query (Line 278-304):
productQuantities: [
{ id: '2a225c70-148d-4fca-a5b2-02d151ffb334', name: 'Dress Elegant Red',
quantity: 1 },
{ id: 'ee781c3a-e7be-4ec4-9889-904c664b1d54', name: 'Dress Elegant Updated
Update', quantity: 2 }
]

Di Availability Calculation (Line 317-356):
availabilities: [
{ productId: '2a225c70-148d-4fca-a5b2-02d151ffb334', totalStock: 1,
availableQuantity: 1 },
{ productId: 'ee781c3a-e7be-4ec4-9889-904c664b1d54', totalStock: 2,
availableQuantity: 2 }
]

Tapi di Transaction Validation (Line 689-696):
errors: [
'Produk Dress Elegant Updated Update tidak mencukupi. Tersedia: 0, Diminta:
2',
'Produk Dress Elegant Red tidak mencukupi. Tersedia: 0, Diminta: 1'
]

🚨 Root Problem: Konsep "Quantity" yang Tidak Konsisten

1. Masalah Semantik di Schema

-- Di Product model (Line 24)
quantity Int -- ❌ AMBIGU: Apakah ini "Total Stock" atau "Available
Stock"?

-- Di TransaksiItem model (Line 139)
jumlah Int -- ✅ BENAR: Ini adalah "Rental Quantity"

2. Logika Business yang Bertentangan

A. Product.quantity digunakan sebagai "Total Inventory"

- System mengurangi Product.quantity ketika barang disewa (Line 138-171 dari
  log transaksi)
- quantity: 3 → setelah disewa 2 → quantity: 1

B. Tapi AvailabilityService menghitung "Available Stock" berbeda
// Dari availabilityService.ts
const availableQuantity = Math.max(0, product.quantity - rentedQuantity)

C. Problem: Kedua logika ini KONFLIK!

🔧 Solusi Arsitektur yang Benar

Model Database yang Benar untuk Rental System:

model Product {
-- INVENTORY FIELDS
totalStock Int -- Total fisik barang yang dimiliki (TIDAK BERUBAH saat
rental)
availableStock Int -- Barang yang tersedia untuk disewa (BERUBAH saat
rental)
rentedStock Int -- Barang yang sedang disewa (BERUBAH saat rental)
-- totalStock = availableStock + rentedStock (SELALU)

    -- CURRENT FIELDS (tetap)
    quantity        Int  -- ❌ HAPUS atau ubah jadi totalStock

}

model TransaksiItem {
jumlah Int -- ✅ Quantity yang disewa (BENAR)
}

Business Logic yang Benar:

// ❌ SALAH: Mengurangi Product.quantity
product.quantity = product.quantity - rentalQuantity

// ✅ BENAR: Update rental tracking
product.availableStock = product.availableStock - rentalQuantity
product.rentedStock = product.rentedStock + rentalQuantity
// product.totalStock TIDAK BERUBAH

📊 Mengapa System Rental Berbeda dari E-commerce?

| Aspek | E-commerce | Rental System
|
|--------------|---------------------------------|----------------------------
-----|
| Stock | Berkurang permanent saat dijual | Berkurang sementara saat
disewa |
| Return | Tidak ada | Ada (barang kembali)
|
| Availability | stock - sold | totalStock -
currentlyRented |
| Tracking | Sold items hilang | Rented items masih ada
|

🔍 Mengapa Error "Tersedia: 0" Terjadi?

Dari log Line 689-696, kemungkinan:

1. Race Condition: Ada transaksi lain yang menggunakan barang yang sama
2. Date Range Conflict: AvailabilityService memeriksa tanggal 2025-08-05, ada
   rental aktif di tanggal tersebut
3. Status Inconsistency: Barang mungkin masih berstatus "RENTED" dari
   transaksi sebelumnya

💡 Rekomendasi Segera

Phase 1: Database Schema Fix

ALTER TABLE Product ADD COLUMN totalStock INT DEFAULT 0;
ALTER TABLE Product ADD COLUMN availableStock INT DEFAULT 0;
ALTER TABLE Product ADD COLUMN rentedStock INT DEFAULT 0;

-- Migrate existing data
UPDATE Product SET
totalStock = quantity,
availableStock = quantity,
rentedStock = 0;

Phase 2: Business Logic Update

// Saat rental
product.availableStock -= rentalQuantity
product.rentedStock += rentalQuantity

// Saat return
product.availableStock += returnQuantity
product.rentedStock -= returnQuantity

Phase 3: Availability Service Simplification

// Dari kompleks calculation jadi simple
const availableQuantity = product.availableStock // ✅ SIMPLE!

🎯 Kesimpulan

Anda 100% benar! Field quantity di Product model ambigu dan menyebabkan
konflik logika. Sistem rental membutuhkan:

1. totalStock: Total inventory fisik
2. availableStock: Yang bisa disewa sekarang
3. rentedStock: Yang sedang disewa
4. jumlah di TransaksiItem: Quantity rental per transaksi ✅ (sudah benar)

Masalah bukan di cache, tapi di fundamental database design untuk rental
business model.
