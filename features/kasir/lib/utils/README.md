# Kasir Utilities

## kondisiAwalParser.ts - RPK-51 AgeSizes System

### Overview
Utility untuk parsing `kondisiAwal` field yang mengandung informasi size dan age category dari RPK-51 size-aware transaction system.

### Format
Backend menyimpan data dalam format ter-encode: `"productSizeId|size|ageCategory|condition"`

**Contoh**: `"85a7a3b8-4e13-45bf-b413-ff24ffdf1af9|M|ADULT|baik"`

### Functions

#### `parseKondisiAwal(kondisiAwal?: string | null): ParsedKondisiAwal`
Parse string kondisiAwal menjadi structured data.

**Returns**:
```typescript
{
  productSizeId?: string      // UUID dari product size
  size?: string             // Size (M, L, XL, etc.)
  ageCategory?: 'ADULT' | 'CHILD' | 'TODDLER'
  condition?: string        // Kondisi barang
  isLegacyFormat: boolean   // True untuk format lama
}
```

#### `formatSizeWithAge(size?: string, ageCategory?: string): string`
Format size dan age category untuk display.
**Contoh**: `"M | ADULT"`

#### `getAgeCategoryLabel(ageCategory?: string): string`
Convert age category code ke label Bahasa Indonesia.
- `ADULT` → `"Dewasa"`
- `CHILD` → `"Anak-anak"`
- `TODDLER` → `"Balita"`

#### `extractSizeInfo(item: any): { size, ageCategory, hasSizeInfo }`
Extract size information dari item data dengan fallback logic.

### Usage Example
```typescript
import { parseKondisiAwal, formatSizeWithAge } from './kondisiAwalParser'

// Parse data dari API
const parsed = parseKondisiAwal("85a7a3b8-4e13-45bf-b413-ff24ffdf1af9|M|ADULT|baik")

// Display size info
const sizeDisplay = formatSizeWithAge(parsed.size, parsed.ageCategory)
// Result: "M | ADULT"
```

### Backward Compatibility
Utility ini dapat menangani:
- **Format baru** dengan UUID dan age category
- **Format lama** dengan plain text condition
- **Data kosong** atau null values

### Implementation Notes
- Digunakan di `ProductDetailCard.tsx` untuk display size+age info
- Data di-parse dari `kondisiAwal` field dari API response
- Tidak memerlukan perubahan backend API
- Mendukung transisi gradual dari legacy ke new system