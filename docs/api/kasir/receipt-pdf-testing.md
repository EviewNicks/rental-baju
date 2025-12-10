# Receipt PDF API Testing Guide

## 📋 Overview

API endpoint untuk generate PDF receipt dari transaksi. PDF akan dibuka di browser (inline) dengan format 58mm thermal paper simulation.

## 🔗 Endpoint

```
GET /api/kasir/receipt/[transaksiId]/pdf
```

## 🔐 Authentication

- **Method**: Clerk session cookie
- **Required Role**: Kasir atau Owner
- **Permission**: `transaksi:read`

## 📥 Request

### URL Parameters

- `transaksiId` - Kode transaksi (contoh: `TXN-20251201-002`) atau UUID transaksi

### Headers

```
Accept: application/pdf
Cookie: __session={clerk_session_token}
```

## 📤 Response

### Success (200 OK)

**Headers:**
```
Content-Type: application/pdf
Content-Disposition: inline; filename="receipt-TXN-20251201-002.pdf"
Cache-Control: no-cache, no-store, must-revalidate
```

**Body:** PDF binary data

### Error Responses

#### 400 Bad Request - Invalid Format
```json
{
  "success": false,
  "error": {
    "message": "Parameter harus berupa kode transaksi (contoh: TXN-20251201-002) atau ID transaksi",
    "code": "VALIDATION_ERROR"
  }
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "message": "Unauthorized",
    "code": "UNAUTHORIZED"
  }
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": {
    "message": "Transaksi tidak ditemukan",
    "code": "NOT_FOUND"
  }
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "message": "Failed to generate receipt",
    "code": "INTERNAL_ERROR"
  }
}
```

## 🧪 Testing dengan Postman

### 1. Import Collection

Import file: `docs/api/kasir/receipt-pdf.json`

### 2. Setup Variables

```
base_url = http://localhost:3000
transaction_code = TXN-20251201-002
transaction_id = d293ea84-d7f3-4788-8f09-e2ce2f8defcb
clerk_session_token = {your_session_token}
```

### 3. Get Session Token

1. Login ke aplikasi di browser
2. Buka DevTools → Application → Cookies
3. Copy value dari cookie `__session`
4. Paste ke Postman variable `clerk_session_token`

### 4. Run Tests

**Test 1: Generate PDF by Transaction Code**
```
GET {{base_url}}/api/kasir/receipt/{{transaction_code}}/pdf
```

**Expected:**
- Status: 200 OK
- Content-Type: application/pdf
- PDF opens in browser

**Test 2: Generate PDF by Transaction ID**
```
GET {{base_url}}/api/kasir/receipt/{{transaction_id}}/pdf
```

**Expected:**
- Status: 200 OK
- Content-Type: application/pdf
- PDF opens in browser

**Test 3: Transaction Not Found**
```
GET {{base_url}}/api/kasir/receipt/TXN-99999999-999/pdf
```

**Expected:**
- Status: 404 Not Found
- JSON error response

**Test 4: Invalid Format**
```
GET {{base_url}}/api/kasir/receipt/invalid-format/pdf
```

**Expected:**
- Status: 400 Bad Request
- JSON error response

## ✅ Validation Checklist

- [ ] PDF generates successfully
- [ ] PDF opens in browser (not download)
- [ ] PDF contains store info (MAGURU RENTAL)
- [ ] PDF contains transaction info (code, date, customer, kasir)
- [ ] PDF contains all items with sizes
- [ ] PDF contains payment summary
- [ ] PDF contains footer (Terima Kasih!)
- [ ] Currency format correct (Rp 300.000)
- [ ] Date format correct (01 Des 2024 12:19)
- [ ] Error handling works (404, 400, 401)
- [ ] Response time < 3 seconds

## 📊 PDF Content Structure

```
================================
      MAGURU RENTAL
Jl. Contoh No. 123, Jakarta 12345
    Tel: (021) 123-4567
================================

STRUK TRANSAKSI

Kode    : TXN-20251201-002
Tanggal : 01 Des 2024 12:19
Customer: Ardiansyah
Kasir   : Adelia

================================
DETAIL PRODUK
================================

Dress Pesta Merah (M)
  3 x Rp 60.000 x 4 hari
  Subtotal: Rp 180.000

Dress Pesta Merah (L)
  2 x Rp 60.000 x 4 hari
  Subtotal: Rp 120.000

================================
RINGKASAN PEMBAYARAN
================================

Total Sewa: Rp 300.000

================================

Terima Kasih!

Barang yang sudah disewa
tidak dapat dikembalikan

================================
```

## 🐛 Troubleshooting

### PDF tidak generate
- Check console logs untuk error details
- Verify transaction exists di database
- Check jsPDF library installed

### PDF download instead of open
- Check Content-Disposition header = "inline"
- Check browser settings

### Authentication error
- Verify session token valid
- Check user has correct role (Kasir/Owner)
- Check permission middleware

### Slow response
- Check database connection
- Check transaction has many items
- Optimize query if needed

## 📚 References

- Design Doc: `.kiro/specs/customer-receipt-printing/design.md`
- Requirements: `.kiro/specs/customer-receipt-printing/requirements.md`
- Tasks: `.kiro/specs/customer-receipt-printing/tasks.md`
- API Route: `app/api/kasir/receipt/[transaksiId]/pdf/route.ts`
- Receipt Service: `features/kasir/services/receiptService.ts`
