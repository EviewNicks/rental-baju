# Task: Update Postman Collection - Return API Tests

## =� Overview
Update Postman collection `@docs/api/kasir/return.json` untuk mencerminkan behavior API yang sebenarnya.

## <� Tasks

### 1. Fix Test Expectations (Priority: HIGH)
- [ ] Update Test 1: "Size-Aware Return - Success" � expect 400 error
- [ ] Update Test 3: "Legacy Compatibility" � expect 400 error
- [ ] Fix assertions untuk `processedItems: []`
- [ ] Update success vs failure expectations

### 2. Update Request Format (Priority: HIGH)
- [ ] Tambah `productSizeId` field ke semua requests
- [ ] Konversi legacy format ke unified format:
  ```json
  // Dari:
  {"kondisiAkhir": "Baik - ukuran M..."}

  // Ke:
  {
    "productSizeId": "uuid",
    "conditions": [
      {"kondisiAkhir": "Baik - ukuran M...", "jumlahKembali": 1}
    ]
  }
  ```

### 3. Add Error Response Tests (Priority: MEDIUM)
- [ ] Test validasi size error (400 response)
- [ ] Test validation error details
- [ ] Test error message structure
- [ ] Add header validation untuk error responses

### 4. Fix Test Logic (Priority: MEDIUM)
- [ ] Update assertions untuk mencerminkan actual behavior
- [ ] Fix `processedItems` validation expectations
- [ ] Update penalty calculation tests
- [ ] Sync test metadata dengan real API responses

## =' Implementation Notes

### Current Issues:
- Tests expect success tapi API return validation errors
- Legacy format tidak compatible dengan size-aware validation
- Missing error response validation
- False positive test results

### Expected Behavior:
- Legacy format requests � 400 Validation Error
- Size-aware format requests � 200 Success
- Proper error message structure
- Accurate `processedItems` array

## � Timeline
- **Immediate**: Fix test expectations (1 day)
- **Short-term**: Update request formats (2 days)
- **Review**: Test validation and sign-off (1 day)

---
*Created: 2025-10-20*
*Priority: HIGH - Fix broken test suite*