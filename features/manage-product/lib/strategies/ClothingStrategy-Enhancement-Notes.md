# ClothingStrategy Enhancement - Age Categorization

## 🎯 Problem Summary
Original `ClothingStrategy` hanya memiliki size options tanpa age categorization:
- ❌ Sebelumnya: XS, S, M, L, XL, XXL (static, semua ADULT)
- ✅ Sekarang: XS_Anak, XS_Dewasa, S_Anak, S_Dewasa, dll

## 🔧 Changes Made

### 1. Enhanced Size Options
```typescript
// BEFORE:
private readonly sizeOptions = [
  { value: 'XS', label: 'XS (Extra Small)' },
  { value: 'S', label: 'S (Small)' },
  // ...
]

// AFTER:
private readonly sizeOptions = [
  { value: 'XS_ANAK', label: 'XS - Anak (Extra Small)' },
  { value: 'XS_DEWASA', label: 'XS - Dewasa (Extra Small)' },
  { value: 'S_ANAK', label: 'S - Anak (Small)' },
  { value: 'S_DEWASA', label: 'S - Dewasa (Small)' },
  // ...
]
```

### 2. New Helper Methods
- `parseSizeAgeCombination()` - Parse "XS_DEWASA" → { size: 'XS', ageCategory: 'ADULT' }
- `getBaseSize()` - Extract base size from combination

### 3. Updated Transformation Logic
- `transformToProductSizes()` - Konversi form data ke backend format dengan age awareness
- `transformFromProductSizes()` - Reverse transformation untuk edit mode
- `getInitialSizes()` - Initialize sizes dari form data

### 4. Enhanced Validation
- Validate size-age combinations
- Prevent duplicate combinations
- Ensure proper age categorization

## 🔄 Backward Compatibility

### Migration Strategy:
1. **Existing Products** - Akan di-migrate secara otomatis:
   - ADULT size 'S' → 'S_DEWASA'
   - CHILD size 'S' → 'S_ANAK' (jika ada)

2. **Form Data** - Transformation logic menangani kedua format:
   - Legacy: { ageCategory: 'ADULT', size: 'S' }
   - New: { ageCategory: 'ADULT', size: 'S' } dari 'S_DEWASA'

3. **Database Schema** - Tidak perlu perubahan, hanya data transformation

### Testing Required:
- [ ] Create new clothing product dengan age-aware sizes
- [ ] Edit existing clothing product
- [ ] Verify form validation
- [ ] Test backend API compatibility

## 📋 UI Impact

### Form Fields:
- Checkbox group sekarang menampilkan 11 options vs 6 sebelumnya
- Quantity fields dinamis berdasarkan selected size-age combinations
- Help text diperbarui untuk clarity

### Example Usage:
```
✅ Pilihan: XS_Anak, S_Dewasa, M_Anak, L_Dewasa
✅ Quantity: XS_Anak: 5, S_Dewasa: 10, M_Anak: 3, L_Dewasa: 8

❌ Duplikat: S_Dewasa, S_Dewasa (error)
❌ Invalid: XXL_Anak (tidak ada di options)
```

## 🔍 Quality Assurance

### Validation Rules:
- Minimal 1 size-age combination dengan quantity > 0
- Max quantity: 9999 per combination
- No duplicate combinations
- Valid base sizes: XS, S, M, L, XL, XXL
- Valid age categories: ADULT, CHILD

### Error Messages:
- "Minimal satu ukuran (dewasa atau anak) yang dipilih harus memiliki stok"
- "Kombinasi ukuran tidak valid. Gunakan format: XS_DEWASA, S_ANAK, dll"
- "Tidak boleh ada kombinasi ukuran duplikat"

## 🚀 Next Steps

1. **Testing** - Comprehensive unit & integration tests
2. **Documentation** - Update user guide for clothing size management
3. **Migration Script** - Script untuk migrate existing data jika needed
4. **Monitor** - Track usage dan user feedback