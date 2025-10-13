# 🌱 Database Seeding Guide

Panduan ringkas untuk seeding data produk ke database.

---

## 📋 Available Seeds

### 1. Organza Products (Baju Bodo)
- **File**: `prisma/organza-products.json`
- **Products**: 14 items
- **Images**: Auto-upload ke Supabase Storage
- **Category**: Organza (ID: 912520ea-ad5a-4294-8057-e9084a871a05)

---

## ⚡ Quick Start

### Import Organza Products
```bash
# Dry-run validation (no database changes)
yarn import:organza:dry

# Actual import
yarn import:organza
```

---

## 📝 Step-by-Step Guide

### 1️⃣ Preparation

**Check Supabase Config**:
```bash
# Ensure these environment variables exist in .env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Prepare Images** (Optional):
- Place images in `public/products/organza/`
- Naming: `{PRODUCT_CODE}.jpg` (e.g., `OLL01.jpg`)

---

### 2️⃣ Validation (Recommended)

**Run Dry-Run**:
```bash
yarn import:organza:dry
```

**Expected Output**:
```
✅ Category validation passed
✅ No duplicate codes found
📊 Total products: 14
   Would import: 14
   Would skip (duplicates): 0
```

---

### 3️⃣ Clean Database (If Re-importing)

**Delete Existing**:
```bash
npx tsx scripts/delete-organza-products.ts
```

**Confirmation**:
```
✅ Deleted N products successfully
Ready for fresh import!
```

---

### 4️⃣ Execute Import

**Run Import**:
```bash
yarn import:organza
```

**Process**:
1. Validates Supabase config
2. Checks category exists
3. Detects duplicate codes
4. Uploads images to Supabase (if available)
5. Creates products with sizes
6. Falls back to direct path if image missing

**Expected Output**:
```
✅ Supabase configuration detected
📦 Found 14 products to import
✅ Category validation passed
✅ No duplicate codes found

📝 [1/14] Importing OLL01 - Organza Lilac
   📸 Uploading image...
   ✅ Image uploaded: https://...supabase.co/...
   ✅ Success (1 sizes created)

...

==================================================
📊 IMPORT SUMMARY
==================================================
Status: ✅ SUCCESS
Total products: 14
Imported: 14
Skipped: 0
Failed: 0
==================================================
```

---

### 5️⃣ Validation

**Check Results**:
```bash
# Verify products imported
npx tsx scripts/validate-organza-import.ts

# Check image URLs
npx tsx scripts/check-organza-images.ts
```

**Validation Output**:
```
✅ Found 14 Organza products
📈 Summary:
   Total Products: 14
   Total Stock: 144 items
   Total Size Records: 53
```

---

## 🔍 Image Upload Behavior

### Auto-Upload to Supabase
- ✅ Reads from `public/products/organza/`
- ✅ Flexible filename matching (OLL01.jpg OR OLL1.jpg)
- ✅ Case-insensitive (.jpg, .JPG, .jpeg)
- ✅ Retry logic (3 attempts)
- ✅ Returns Supabase CDN URL

### Fallback Strategy
If image not found or upload fails:
- ⚠️ Uses direct path: `/products/organza/{CODE}.jpg`
- ⚠️ Logs warning
- ✅ Import continues (no failure)

---

## 🛠️ Troubleshooting

### ❌ Duplicate Products
**Problem**: Import skips all products

**Solution**:
```bash
# Delete existing first
npx tsx scripts/delete-organza-products.ts

# Then re-import
yarn import:organza
```

---

### ❌ Supabase Upload Fails
**Problem**: All images use direct path

**Check**:
1. Environment variables configured?
2. Supabase credentials correct?
3. Storage bucket 'products' exists?

**Debug**:
```bash
# Check env
echo $NEXT_PUBLIC_SUPABASE_URL

# Test connection manually via Prisma Studio
```

---

### ⚠️ Missing Images
**Problem**: Some products have direct path

**Solution**:
1. Upload missing images to `public/products/organza/`
2. Delete affected products
3. Re-run import for those products only

**Example**:
```bash
# Manual delete via Prisma Studio
# Or use delete script with filter

# Re-import will pick up new images
yarn import:organza
```

---

## 📂 File Structure

```
prisma/
├── seed.md                      # This guide
├── organza-products.json        # Product data (14 items)
└── schema.prisma               # Database schema

scripts/
├── import-organza-products.ts   # Main import script
├── delete-organza-products.ts   # Cleanup utility
├── validate-organza-import.ts   # Validation script
└── check-organza-images.ts      # Image URL checker

public/products/organza/
├── OLL01.jpg                    # Product images
├── OPS02.jpg
└── ...
```

---

## 📊 Data Format

### JSON Structure
```json
{
  "code": "OLL01",
  "name": "Organza Lilac",
  "description": "",
  "modalAwal": 75000,
  "currentPrice": 75000,
  "quantity": 3,
  "categoryId": "912520ea-ad5a-4294-8057-e9084a871a05",
  "imageUrl": "/products/organza/OLL01.jpg",
  "sizes": [
    {
      "ageCategory": "CHILD",
      "size": "S",
      "quantity": 3
    }
  ]
}
```

### Field Requirements
- `code`: 4-5 chars, uppercase alphanumeric (e.g., OLL01)
- `name`: Max 100 chars
- `modalAwal`, `currentPrice`: Positive numbers
- `quantity`: Sum of all sizes
- `categoryId`: Valid UUID
- `sizes`: Min 1 size required

---

## 🎯 Best Practices

### ✅ Do
- Run dry-run before actual import
- Backup data if re-importing
- Validate after import
- Check Supabase config first
- Use consistent image naming

### ❌ Don't
- Import without validation
- Skip dry-run in production
- Ignore duplicate warnings
- Mix image storage strategies
- Forget to check logs

---

## 📚 Related Documentation

- **Architecture**: `/docs/rules/architecture.md`
- **Implementation Report**: `/.claudedocs/reports/organza-import-implementation.md`
- **ProductService**: `/features/manage-product/services/productService.ts`
- **FileUploadService**: `/features/manage-product/services/fileUploadService.ts`

---

## 🚀 Quick Reference

| Task | Command |
|------|---------|
| **Dry-run** | `yarn import:organza:dry` |
| **Import** | `yarn import:organza` |
| **Delete** | `npx tsx scripts/delete-organza-products.ts` |
| **Validate** | `npx tsx scripts/validate-organza-import.ts` |
| **Check URLs** | `npx tsx scripts/check-organza-images.ts` |

---

**Last Updated**: 2025-10-13
**Version**: 1.0
**Status**: Production Ready ✅
