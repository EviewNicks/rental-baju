# 📦 Ringkasan: Proses Stock Deduction Saat Pickup

## Flow Singkat

Saat customer **pickup item**, sistem akan **mengurangi stock** dengan 2 mode:

---

## 1️⃣ **Entry Point - PickupService.processPickup()**

```typescript
// Di dalam atomic transaction
await prisma.$transaction(async (tx) => {
  // ... update jumlahDiambil ...
  
  // ✅ STOCK DEDUCTION DIMULAI DI SINI
  const txInventoryService = createInventoryService(tx)
  
  for (const pickupItem of items) {
    await txInventoryService.processStockForPickup(
      transactionItem.kondisiAwal,  // Berisi info pairing
      pickupItem.jumlahDiambil,     // Jumlah yang diambil
      pickupItem.id,
      console
    )
  }
})
```

---

## 2️⃣ **InventoryService.processStockForPickup()**

```typescript
async processStockForPickup(kondisiAwal, quantity, itemId) {
  // Parse kondisiAwal untuk cek pairing
  const kondisiData = parseKondisiAwalEnhanced(kondisiAwal)
  
  const linkedSarungSizeId = kondisiData.linkedSarung?.productSizeId
  
  if (linkedSarungSizeId) {
    // ✅ DUAL DEDUCTION: Jas + Sarung
    await updateStockOnCreate(
      kondisiData.productSizeId,      // Jas ProductSize ID
      quantity,
      linkedSarungSizeId              // Sarung ProductSize ID
    )
  } else {
    // ✅ SINGLE DEDUCTION: Item biasa
    await updateStockOnCreate(kondisiData.productSizeId, quantity)
  }
}
```

**Penjelasan `kondisiAwal`:**
- Field di `TransaksiItem` yang menyimpan info pairing
- Format JSON: `{productSizeId: "xxx", linkedSarung: {productSizeId: "yyy"}}`
- Di-parse untuk tahu apakah item ini punya pasangan sarung atau tidak

---

## 3️⃣ **InventoryService.updateStockOnCreate()**

### Mode A: Single Deduction (Item Biasa)
```typescript
await prisma.productSize.update({
  where: { id: sizeId },
  data: {
    rentedQuantity: { increment: quantity },      // Tambah yang disewa
    availableQuantity: { decrement: quantity }    // Kurangi yang tersedia
  }
})
```

**Contoh:**
```
Pickup 2x JAS-001 (tanpa sarung)

Before:
- rentedQuantity: 3
- availableQuantity: 7

After:
- rentedQuantity: 5  (3 + 2)
- availableQuantity: 5  (7 - 2)
```

---

### Mode B: Dual Deduction (Jas + Sarung Pairing)
```typescript
// Deduct stock jas
await prisma.productSize.update({
  where: { id: jasProductSizeId },
  data: {
    rentedQuantity: { increment: quantity },
    availableQuantity: { decrement: quantity }
  }
})

// Deduct stock sarung (1:1 ratio)
await prisma.productSize.update({
  where: { id: sarungProductSizeId },
  data: {
    rentedQuantity: { increment: quantity },
    availableQuantity: { decrement: quantity }
  }
})
```

**Contoh:**
```
Pickup 2x JAS-001 + Sarung

JAS-001 Before:
- rentedQuantity: 3
- availableQuantity: 7

JAS-001 After:
- rentedQuantity: 5  (3 + 2)
- availableQuantity: 5  (7 - 2)

SARUNG-001 Before:
- rentedQuantity: 2
- availableQuantity: 13

SARUNG-001 After:
- rentedQuantity: 4  (2 + 2)
- availableQuantity: 11  (13 - 2)
```

---

## 🎯 Key Points

1. **Stock deduction terjadi saat PICKUP, bukan saat transaksi dibuat**
   - Benefit: Stock tidak habis sebelum customer ambil barang

2. **Dual deduction otomatis untuk jas-sarung pairing**
   - Pickup 1 jas → otomatis deduct 1 sarung juga
   - Ratio: 1:1

3. **Semua dilakukan dalam 1 atomic transaction**
   - Kalau 1 gagal, semua rollback

4. **ProductSize Schema:**
   ```
   originalQuantity   = Total stock awal (tidak berubah)
   rentedQuantity     = Yang sedang disewa (INCREMENT saat pickup)
   availableQuantity  = Yang tersedia (DECREMENT saat pickup)
   
   Formula: originalQuantity = rentedQuantity + availableQuantity
   ```

---

## 📁 File Terkait

- **`features/kasir/services/pickupService.ts`**  
  → Method: `processPickup()` - Entry point

- **`features/kasir/services/inventoryService.ts`**  
  → Method: `processStockForPickup()` - Pairing detection  
  → Method: `updateStockOnCreate()` - Stock deduction logic

- **`features/kasir/lib/utils/kondisiAwalParser.ts`**  
  → Method: `parseKondisiAwalEnhanced()` - Parse pairing data

---

Itu saja! Intinya: **pickup → parse kondisiAwal → single/dual deduction → update ProductSize**. 🚀