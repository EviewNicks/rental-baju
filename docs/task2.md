# Manual Testing Guide - Professional Receipt Layout

## Overview
Testing panduan untuk fitur Professional Receipt Layout yang menghasilkan PDF struk profesional dengan format tabel 14x20cm.

## Prerequisites
- ✅ Backend service sudah implemented
- ✅ API route sudah ready
- ❌ Frontend hook belum ada (perlu dibuat)
- ❌ Button UI belum terintegrasi (perlu dibuat)

## Testing Checklist

### 1. Frontend Integration Test
**Status: BELUM READY - Perlu implementasi hook & UI**

#### 1.1 Button Visibility
- [x] Navigate ke transaction detail page
- [x] Verify button "Cetak Struk Profesional" muncul di header
- [x] Button positioned next to "Cetak Struk" yang existing
- [x] Button styling consistent dengan design system

#### 1.2 Loading State
- [x] Click button → loading state muncul immediately
- [x] Button disabled saat loading
- [x] Loading icon (Loader2) dengan spin animation
- [x] Text berubah jadi "Generating..."

### 2. PDF Generation Test
**Status: READY - Backend sudah implemented**

#### 2.1 Happy Path
- [x] Click button → PDF terbuka di new tab
- [x] Success toast: "Struk profesional berhasil dibuat"
- [x] Button kembali ke normal state
- [x] Original page tetap terbuka (tidak navigate away)

#### 2.2 PDF Content Validation
- [ ] **Header Section:**
  - Logo ERLIMA MODE di top-left
  - Store name "ERLIMA MODE" prominent
  - Address: "Jl. Abd Dg sirua no 136D kota makassar"
  - Phone: "+62 821-9699-9962"

- [ ] **Transaction Info (Top-Right):**
  - Document type: "PENAWARAN PENJUALAN"
  - Nomor: [transaction code]
  - Tanggal: format Indonesian (DD MMM YYYY)
  - Pembayaran: [payment method]
  - Kepada Yth: [customer name]

- [ ] **Table Structure:**
  - 7 columns: No, Kategori, Nama Barang, Size, Qty, @Harga, Total Harga
  - Borders properly rendered
  - Column alignment correct (center/left/right)
  - All items displayed with correct data

- [ ] **Financial Summary:**
  - Sub Total calculation correct
  - Diskon calculation (if any)
  - Biaya Lain-lain: 0
  - Total matches transaction total
  - Currency format: dot separators (no Rp prefix)

- [ ] **Footer:**
  - Keterangan section with disclaimer
  - Signature area "Bagian Penjualan"
  - Date line "Tgl. ___________"
  - Price change notice

#### 2.3 PDF Technical Specs
- [ ] Dimensions: 14x20cm (140x200mm)
- [ ] Portrait orientation
- [ ] Professional margins
- [ ] Clear, readable fonts
- [ ] Browser print (Ctrl+P) works correctly

### 3. Error Handling Test

#### 3.1 Network Errors
- [ ] Disconnect network → click button
- [ ] Error toast: "Gagal membuat struk. Silakan coba lagi."
- [ ] Button returns to clickable state
- [ ] No console errors that break UI

#### 3.2 Invalid Transaction
- [ ] Test dengan transaction ID yang tidak exist
- [ ] Appropriate error handling
- [ ] User feedback clear

### 4. Data Scenarios Test

#### 4.1 Various Transaction Types
- [ ] Single item transaction
- [ ] Multiple items (different categories)
- [ ] Different sizes (S, M, L, XL, UNIVERSAL)
- [ ] Transactions with discounts (percentage & nominal)
- [ ] Long product names (text wrapping)
- [ ] Large amounts (millions)
- [ ] Many items (10+ items)

#### 4.2 Size Extraction Test
- [ ] kondisiAwal: "uuid|L|ADULT|baik" → Size: "L"
- [ ] kondisiAwal: "uuid|UNIVERSAL|ADULT|baik" → Size: "UNIVERSAL"
- [ ] Malformed kondisiAwal → Size: empty/dash
- [ ] Missing kondisiAwal → Size: empty/dash

### 5. Performance Test
- [ ] PDF generation < 3 seconds (typical transaction)
- [ ] UI remains responsive during generation
- [ ] Other buttons clickable while generating
- [ ] No memory leaks on repeated use

## Implementation Priority

### Phase 1: Frontend Implementation (URGENT)
1. **Create useProfessionalReceiptPrint hook**
   ```typescript
   // features/kasir/hooks/useProfessionalReceiptPrint.ts
   ```

2. **Update TransactionDetailPage**
   - Import hook
   - Add button next to existing "Cetak Struk"
   - Handle loading states

### Phase 2: Testing
1. Manual testing dengan checklist di atas
2. Fix bugs yang ditemukan
3. Performance optimization jika diperlukan

## Test Data Requirements

### Sample Transaction Data
- Transaction dengan 1 item
- Transaction dengan multiple items
- Transaction dengan discount
- Transaction dengan long product names
- Transaction dengan berbagai ukuran (S, M, L, XL, UNIVERSAL)

### Test Environment
- Browser: Chrome, Firefox, Edge
- Network conditions: Normal, Slow, Offline
- Different screen sizes
- Different printers (untuk print test)

## Success Criteria
- ✅ All manual tests pass
- ✅ PDF content matches requirements exactly
- ✅ Error handling works properly
- ✅ Performance meets targets (< 3s)
- ✅ UI/UX smooth dan responsive
- ✅ No console errors
- ✅ Print functionality works

## Notes
- Backend sudah ready, fokus ke frontend integration
- Testing bisa dimulai setelah hook & UI implemented
- Priority: basic functionality dulu, polish kemudian