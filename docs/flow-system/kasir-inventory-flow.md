# Dokumentasi Flow Sistem Kasir - Pengelolaan Inventory

## Ringkasan

Dokumen ini menjelaskan alur kerja (flow) sistem kasir dalam mengelola inventory produk rental, mulai dari pembuatan transaksi, proses pengambilan barang (pickup), hingga pengembalian barang (return).

**Target Audience:** Developer, Product Manager, QA Engineer

**Level:** Basic - Intermediate

---

## Konsep Dasar Inventory Management

Sistem kasir menggunakan **dual inventory system** untuk mengelola stok produk:

### 1. Legacy Format (Product-based)
- `Product.quantity`: Total inventory yang dimiliki (tidak berubah)
- `Product.rentedStock`: Jumlah barang yang sedang disewakan

**Formula:**
```
Available Stock = Product.quantity - Product.rentedStock
```

### 2. Size-Aware Format (ProductSize-based)
- `ProductSize.quantity`: Stok tersedia per ukuran/kategori umur
- Lebih granular dan akurat untuk produk dengan multiple sizes

**Contoh:**
```
Product: "Baju Adat Betawi"
├─ Size S (Anak 3-5 tahun): quantity = 5
├─ Size M (Anak 6-8 tahun): quantity = 8
└─ Size L (Anak 9-12 tahun): quantity = 3
```

---

## Flow 1: Transaksi Creation (Reservasi Stock)

**Endpoint:** `POST /api/kasir/transaksi`

**Tujuan:** Membuat transaksi baru dan mereservasi stock produk untuk pelanggan.

### Proses Flow

```
┌─────────────────────────────────────────────────────────┐
│           BEFORE TRANSACTION                            │
│ Product.quantity = 100      (total inventory)           │
│ Product.rentedStock = 20    (sedang disewa)             │
│ Available = 100 - 20 = 80                               │
└─────────────────────────────────────────────────────────┘
                        ↓
          Customer menyewa 5 pcs produk
                        ↓
┌─────────────────────────────────────────────────────────┐
│           AFTER TRANSACTION                             │
│ Product.quantity = 100      (tidak berubah)             │
│ Product.rentedStock = 25    (bertambah +5)              │
│ Available = 100 - 25 = 75                               │
└─────────────────────────────────────────────────────────┘
```

### Step-by-Step Process

#### Step 1: Validasi Ketersediaan Stock
```typescript
// AvailabilityService.validateTransactionItems()
1. Cek apakah produk aktif dan status = 'AVAILABLE'
2. Hitung available stock: quantity - rentedStock
3. Validasi: available stock >= jumlah yang diminta
4. Warning jika stock hampir habis (sisa ≤ 1)
```

#### Step 2: Update Stock (Legacy Format)
```typescript
// TransaksiService.updateProductQuantities()
await prisma.product.update({
  where: { id: productId },
  data: {
    rentedStock: { increment: 5 }  // +5 items disewa
  }
})
```

#### Step 3: Update Stock (Size-Aware Format)
```typescript
// TransaksiService.updateProductSizeQuantities()
await prisma.productSize.update({
  where: { id: productSizeId },
  data: {
    quantity: { decrement: 5 }  // -5 items dari stock tersedia
  }
})
```

### Proteksi Race Condition

Sistem menggunakan **atomic update** untuk mencegah overbooking:

```typescript
const updateResult = await prisma.product.updateMany({
  where: {
    id: productId,
    rentedStock: { lte: currentQuantity - requestedAmount }
  },
  data: {
    rentedStock: { increment: requestedAmount }
  }
})

// Jika count = 0, berarti ada transaksi lain yang lebih dulu
if (updateResult.count === 0) {
  throw new Error('Stock tidak mencukupi atau sudah di-update transaksi lain')
}
```

### Contoh Request & Response

**Request:**
```json
{
  "penyewaId": "penyewa-001",
  "tglMulai": "2025-10-28",
  "tglSelesai": "2025-11-02",
  "items": [
    {
      "produkId": "prod-001",
      "productSizeId": "size-M-001",
      "jumlah": 5,
      "harga": 50000
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "kode": "TRX-20251028-001",
    "status": "pending",
    "totalHarga": 250000,
    "items": [...]
  }
}
```

---

## Flow 2: Pickup Process (Pengambilan Barang)

**Endpoint:** `PATCH /api/kasir/transaksi/[kode]/ambil`

**Tujuan:** Mencatat barang yang sudah diambil pelanggan.

### Konsep Penting

⚠️ **PENTING:** Pickup **TIDAK mengubah stock** karena stock sudah direservasi saat transaksi dibuat!

Pickup hanya **tracking internal** untuk mencatat:
- Kapan barang diambil
- Berapa quantity yang diambil (mendukung partial pickup)
- Status kondisi awal barang

### Proses Flow

```
┌─────────────────────────────────────────────────────────┐
│           BEFORE PICKUP                                 │
│ TransaksiItem.jumlah = 5                                │
│ TransaksiItem.jumlahDiambil = 0                         │
│ Product.rentedStock = 25    (tidak berubah)             │
└─────────────────────────────────────────────────────────┘
                        ↓
          Customer mengambil 3 pcs dari 5 pcs
                        ↓
┌─────────────────────────────────────────────────────────┐
│           AFTER PICKUP                                  │
│ TransaksiItem.jumlah = 5                                │
│ TransaksiItem.jumlahDiambil = 3                         │
│ Product.rentedStock = 25    (tetap tidak berubah!)      │
└─────────────────────────────────────────────────────────┘
```

### Step-by-Step Process

#### Step 1: Update Jumlah Diambil
```typescript
// PickupService.processPickup()
await prisma.transaksiItem.update({
  where: { id: itemId },
  data: {
    jumlahDiambil: { increment: 3 },  // +3 items diambil
    kondisiAwal: JSON.stringify({
      productSizeId: "size-M-001",
      size: "M",
      ageCategory: "6-8 tahun"
    })
  }
})
```

#### Step 2: Update Status Transaksi
```typescript
// Jika semua item sudah diambil (fully picked up)
if (allItemsPickedUp) {
  await prisma.transaksi.update({
    where: { kode: transactionCode },
    data: { status: 'diambil' }
  })
}
```

### Partial Pickup

Sistem mendukung pengambilan bertahap:

```typescript
// Pickup 1: Ambil 3 pcs
jumlahDiambil = 0 + 3 = 3

// Pickup 2: Ambil 2 pcs lagi
jumlahDiambil = 3 + 2 = 5  // Fully picked up
```

### Contoh Request & Response

**Request:**
```json
{
  "items": [
    {
      "id": "item-001",
      "jumlahDiambil": 3,
      "kondisiAwal": {
        "productSizeId": "size-M-001",
        "size": "M",
        "ageCategory": "6-8 tahun"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "kode": "TRX-20251028-001",
    "status": "diambil",
    "items": [{
      "id": "item-001",
      "jumlah": 5,
      "jumlahDiambil": 3
    }]
  }
}
```

---

## Flow 3: Return Process (Pengembalian Barang)

**Endpoint:** `PUT /api/kasir/transaksi/[kode]/pengembalian`

**Tujuan:** Memproses pengembalian barang dan mengembalikan stock ke inventory.

### Konsep Penting

✅ Return **MENGEMBALIKAN stock** ke inventory yang tersedia:
- **Legacy:** `Product.rentedStock` berkurang
- **Size-Aware:** `ProductSize.quantity` bertambah

### Proses Flow

```
┌─────────────────────────────────────────────────────────┐
│           BEFORE RETURN                                 │
│ Product.rentedStock = 25    (sedang disewa)             │
│ ProductSize.quantity = 5    (tersedia)                  │
│ Available = 100 - 25 = 75                               │
└─────────────────────────────────────────────────────────┘
                        ↓
        Customer mengembalikan 3 pcs (kondisi baik)
                        ↓
┌─────────────────────────────────────────────────────────┐
│           AFTER RETURN                                  │
│ Product.rentedStock = 22    (berkurang -3)              │
│ ProductSize.quantity = 8    (bertambah +3)              │
│ Available = 100 - 22 = 78                               │
└─────────────────────────────────────────────────────────┘
```

### Step-by-Step Process

#### Step 1: Validasi Eligibility
```typescript
// UnifiedReturnService.validateUnifiedReturn()
1. Cek status transaksi: 'active', 'terlambat', atau 'diambil'
2. Validasi ada item yang belum dikembalikan
3. Cek return quantity ≤ jumlahDiambil
```

#### Step 2: Update Transaction Item
```typescript
await prisma.transaksiItem.update({
  where: { id: itemId },
  data: {
    statusKembali: 'lengkap',
    totalReturnPenalty: calculatePenalty(),
    conditionCount: conditions.length
  }
})
```

#### Step 3: Restore Stock (Legacy)
```typescript
// Kurangi rentedStock
await prisma.product.update({
  where: { id: productId },
  data: {
    rentedStock: { decrement: 3 }  // -3 items kembali tersedia
  }
})
```

#### Step 4: Restore Stock (Size-Aware)
```typescript
// Tambah quantity size-specific
await prisma.productSize.update({
  where: { id: productSizeId },
  data: {
    quantity: { increment: 3 }  // +3 items kembali ke stock
  }
})
```

#### Step 5: Update Transaction Status
```typescript
// Jika semua item sudah dikembalikan
if (allItemsReturned) {
  await prisma.transaksi.update({
    where: { kode: transactionCode },
    data: {
      status: 'selesai',
      tglKembali: new Date()
    }
  })
}
```

### Split Condition Handling

Sistem mendukung pengembalian dengan kondisi berbeda:

```typescript
// Skenario: 5 items diambil, 3 dikembalikan baik, 2 hilang
{
  "items": [
    {
      "itemId": "item-001",
      "conditions": [
        {
          "kondisiAkhir": "baik",
          "jumlahKembali": 3,  // 3 items baik
          "catatan": "Kondisi masih bagus"
        },
        {
          "kondisiAkhir": "hilang",
          "jumlahKembali": 0,  // 2 items hilang (tidak dikembalikan)
          "catatan": "2 item hilang, penalty applied"
        }
      ]
    }
  ]
}
```

**Hasil:**
- `Product.rentedStock` -= 3 (hanya yang dikembalikan)
- `ProductSize.quantity` += 3 (hanya yang dikembalikan)
- Penalty diterapkan untuk 2 items hilang

### Contoh Request & Response

**Request:**
```json
{
  "tglKembali": "2025-11-02T10:00:00Z",
  "items": [
    {
      "itemId": "item-001",
      "conditions": [
        {
          "kondisiAkhir": "baik",
          "jumlahKembali": 3,
          "catatan": "Kondisi sangat baik"
        }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "kode": "TRX-20251028-001",
    "status": "selesai",
    "totalPenalty": 0,
    "items": [{
      "id": "item-001",
      "statusKembali": "lengkap",
      "totalReturnPenalty": 0
    }]
  }
}
```

---

## Diagram Flow Lengkap

```
┌──────────────────────────────────────────────────────────────┐
│                    INITIAL STATE                             │
│ Product.quantity = 100                                       │
│ Product.rentedStock = 20                                     │
│ ProductSize.quantity = 10                                    │
│ Available = 80                                               │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  STEP 1: TRANSACTION CREATION (POST /api/kasir/transaksi)   │
│                                                              │
│  Action:                                                     │
│  - Customer request: 5 items                                 │
│  - Validate availability: 80 >= 5 ✅                         │
│  - Reserve stock                                             │
│                                                              │
│  Legacy:                                                     │
│    Product.rentedStock += 5  →  rentedStock = 25            │
│                                                              │
│  Size-Aware:                                                 │
│    ProductSize.quantity -= 5  →  quantity = 5               │
│                                                              │
│  Status: pending → active                                    │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  STEP 2: PICKUP PROCESS (PATCH /api/.../[kode]/ambil)       │
│                                                              │
│  Action:                                                     │
│  - Customer pickup: 3 items (partial)                        │
│  - Record pickup quantity                                    │
│  - NO STOCK CHANGE (already reserved!)                       │
│                                                              │
│  Update:                                                     │
│    TransaksiItem.jumlahDiambil += 3                          │
│                                                              │
│  Stock Unchanged:                                            │
│    Product.rentedStock = 25  (tetap)                         │
│    ProductSize.quantity = 5  (tetap)                         │
│                                                              │
│  Status: active → diambil (if all picked up)                 │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  STEP 3: RETURN PROCESS (PUT /api/.../[kode]/pengembalian)  │
│                                                              │
│  Action:                                                     │
│  - Customer return: 3 items (kondisi baik)                   │
│  - Validate return eligibility                               │
│  - Restore stock to inventory                                │
│                                                              │
│  Legacy:                                                     │
│    Product.rentedStock -= 3  →  rentedStock = 22            │
│                                                              │
│  Size-Aware:                                                 │
│    ProductSize.quantity += 3  →  quantity = 8               │
│                                                              │
│  Status: diambil → selesai (if all returned)                 │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    FINAL STATE                               │
│ Product.quantity = 100      (tidak berubah)                  │
│ Product.rentedStock = 22    (berkurang dari 25)             │
│ ProductSize.quantity = 8    (bertambah dari 5)              │
│ Available = 78              (bertambah dari 75)              │
└──────────────────────────────────────────────────────────────┘
```

---

## Validasi & Error Handling

### 1. Stock Validation (Transaction Creation)

**Validasi:**
- ✅ Product aktif dan status = 'AVAILABLE'
- ✅ Available stock >= requested quantity
- ⚠️ Low stock warning (sisa ≤ 1)

**Error Response:**
```json
{
  "success": false,
  "error": "Produk Baju Adat tidak mencukupi. Tersedia: 2, Diminta: 5"
}
```

### 2. Return Validation

**Validasi:**
- ✅ Transaction status: 'active', 'terlambat', 'diambil'
- ✅ Ada item yang belum dikembalikan
- ✅ Return quantity ≤ picked up quantity

**Error Response:**
```json
{
  "success": false,
  "error": "Total jumlah kembali (5) melebihi jumlah yang diambil (3)"
}
```

### 3. Race Condition Protection

Sistem menggunakan **optimistic locking**:

```typescript
// Update hanya berhasil jika kondisi terpenuhi
const result = await prisma.product.updateMany({
  where: {
    id: productId,
    rentedStock: { lte: quantity - requestedAmount }
  },
  data: { rentedStock: { increment: requestedAmount } }
})

if (result.count === 0) {
  throw new Error('Stock sudah di-update transaksi lain')
}
```

---

## Kesimpulan

### Key Points

1. **Stock Reservation** terjadi saat **Transaction Creation**, bukan saat Pickup
2. **Pickup Process** hanya **tracking internal**, tidak mengubah stock
3. **Return Process** mengembalikan stock ke inventory yang tersedia
4. **Dual System** (Legacy + Size-Aware) bekerja parallel untuk backward compatibility
5. **Atomic Transactions** memastikan data consistency
6. **Comprehensive Validation** mencegah edge cases dan race conditions

### Flow Ringkas

```
CREATE  → Reserve Stock  (rentedStock↑ / quantity↓)
PICKUP  → Track Only     (no stock change)
RETURN  → Restore Stock  (rentedStock↓ / quantity↑)
```

### Status Assessment

✅ **Sistem Robust** - Design yang baik dengan:
- Proper validation di setiap tahap
- Atomic operations untuk data consistency
- Race condition protection
- Comprehensive error handling
- Support untuk partial operations (pickup/return)

---

## Referensi Kode

### File Locations

- **Transaction Creation:** `app/api/kasir/transaksi/route.ts`
- **Pickup Process:** `app/api/kasir/transaksi/[kode]/ambil/route.ts`
- **Return Process:** `app/api/kasir/transaksi/[kode]/pengembalian/route.ts`

### Service Layer

- **TransaksiService:** `features/kasir/services/transaksiService.ts`
- **PickupService:** `features/kasir/services/pickupService.ts`
- **UnifiedReturnService:** `features/kasir/services/returnService.ts`
- **AvailabilityService:** `features/kasir/services/availabilityService.ts`

---

**Dibuat oleh:** Analisis SuperClaude
**Tanggal:** 2025-10-27
**Versi:** 1.0
**Level:** Basic - Intermediate
