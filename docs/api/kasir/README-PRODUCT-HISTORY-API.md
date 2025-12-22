# Product History API - Quick Testing Guide

## 📋 Overview
API endpoint untuk mendapatkan transaction history dari specific product size dengan caching optimization (5 minutes TTL).

**Endpoint:** `GET /api/kasir/transaksi/product-history`

---

## 🚀 Quick Start

### 1. Setup Postman
1. Import collection: `docs/api/kasir/history-size-product.json`
2. Set variables di Collection level:
   - `base_url`: `http://localhost:3000`
   - `clerk_session_token`: Copy dari browser cookies (`__session`)
   - `productSizeId`: ID dari product size yang ingin di-test

### 2. Get Session Token
1. Login ke aplikasi di browser
2. Buka Developer Tools (F12) → Application/Storage → Cookies
3. Copy value dari cookie `__session`
4. Paste ke Postman variable `clerk_session_token`

### 3. Get Product Size ID
Cara mendapatkan `productSizeId`:
```sql
-- Query database untuk get product size ID
SELECT id, productId, size, ageCategory, quantity 
FROM ProductSize 
WHERE isActive = true 
LIMIT 5;
```
Atau gunakan existing product size ID dari database Anda.

---

## 🧪 Testing Scenarios

### Basic Test (Recommended untuk mulai)
**Request:** `Product History - Basic Scenarios` → `Get Product History - Default Parameters`

**Expected Response:**
```json
{
  "success": true,
  "data": [...],
  "cached": false,
  "metadata": {
    "productSizeId": "...",
    "statuses": ["active", "diambil"],
    "limit": 50,
    "sortBy": "date_proximity",
    "totalResults": 2,
    "cacheExpiresAt": "...",
    "serviceUsed": "ItemHistoryService"
  }
}
```

### Cache Testing (Test performance)
1. **First Request** → Run `Test Cache Miss (Fresh Request)`
   - Response: `cached: false`
   - Slower response time
   
2. **Repeat Request** → Run `Test Cache Hit (Repeat Request)` 
   - Response: `cached: true`
   - Much faster (<50ms typical)

### Error Testing
- **Missing Parameter:** Run `Missing productSizeId Parameter`
  - Expected: 400 Bad Request
  
- **Unauthorized:** Run `Unauthorized Request` (disable auth)
  - Expected: 401 Unauthorized

---

## 📊 Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `productSizeId` | string | ✅ Yes | - | ID dari product size |
| `statuses` | string | ❌ No | `active,diambil` | Filter status (comma-separated) |
| `limit` | number | ❌ No | `50` | Limit jumlah results |
| `sortBy` | string | ❌ No | `date_proximity` | Sort order: `date_proximity`, `date_asc`, `date_desc` |

**Example URLs:**
```
# Default parameters
GET /api/kasir/transaksi/product-history?productSizeId=abc123

# Custom filtering
GET /api/kasir/transaksi/product-history?productSizeId=abc123&statuses=active&limit=10

# Custom sorting
GET /api/kasir/transaksi/product-history?productSizeId=abc123&sortBy=date_desc
```

---

## ✅ Automated Tests

Collection sudah include automated tests yang akan run otomatis:

### Success Response Tests (200)
- ✓ Response structure validation
- ✓ Transaction data format validation
- ✓ Status filtering validation (only 'active' & 'diambil')
- ✓ Sorting validation
- ✓ Cache behavior validation
- ✓ Performance validation (<2s SLA)

### Error Response Tests
- ✓ 400: Bad request structure
- ✓ 401: Unauthorized validation
- ✓ 500: Server error structure

**View Test Results:** Check "Test Results" tab di Postman setelah run request.

---

## 🎯 Common Use Cases

### 1. View Active Bookings Only
```
GET /api/kasir/transaksi/product-history?productSizeId=abc123&statuses=active
```

### 2. Get Recent 10 Transactions
```
GET /api/kasir/transaksi/product-history?productSizeId=abc123&limit=10&sortBy=date_desc
```

### 3. Check Availability for Date Range
```
GET /api/kasir/transaksi/product-history?productSizeId=abc123&statuses=active,diambil
```
Lalu check `tglMulai` dan `tglSelesai` untuk overlap detection.

---

## 🐛 Troubleshooting

### Issue: 401 Unauthorized
**Solution:** 
- Refresh session token dari browser
- Pastikan sudah login di aplikasi
- Copy ulang `__session` cookie value

### Issue: Empty Data Array
**Possible Causes:**
- Product size ID tidak valid
- Tidak ada transaction history untuk product size tersebut
- Status filter terlalu restrictive

**Solution:** 
- Verify product size ID di database
- Check apakah ada transactions dengan status 'active' atau 'diambil'

### Issue: Slow Response Time
**Check:**
- First request akan slower (cache miss)
- Subsequent requests should be faster (cache hit)
- If consistently slow, check database performance

---

## 📈 Performance Monitoring

Collection akan log performance metrics di Console:
```
Product History API Performance: 
Response Time: 245ms, 
Status: 200, 
Cached: true
```

**Performance Targets:**
- Cache Hit: <500ms
- Cache Miss: <2s
- Cache TTL: 5 minutes

---

## 🔗 Related Documentation

- **Requirements:** `.kiro/specs/availability-product-view/requirements.md`
- **Design:** `.kiro/specs/availability-product-view/design.md`
- **API Implementation:** `app/api/kasir/transaksi/product-history/route.ts`
- **Service Layer:** `features/kasir/services/ItemHistoryService.ts`

---

## 💡 Tips

1. **Run Collection:** Use Postman Collection Runner untuk run all tests sekaligus
2. **Environment:** Create separate environments untuk dev/staging/prod
3. **Monitor Cache:** Watch `cached` field untuk verify caching behavior
4. **Test Concurrency:** Run concurrent tests untuk verify thread safety
5. **Check Logs:** Monitor server console untuk detailed error messages

---

**Last Updated:** December 2024  
**API Version:** 1.0.0  
**Collection:** `docs/api/kasir/history-size-product.json`
