# Scripts Directory

Utility scripts untuk advanced size management migration dan system maintenance.

## Available Scripts

### `assess-legacy-products.ts`

**Purpose**: Analyzes current product data untuk understand migration scope ke advanced-only size management.

**Description**: Safe read-only script yang queries database untuk identify:
- Products with existing ProductSize records (advanced sizing)
- Products needing migration (legacy sizing)
- Migration complexity assessment
- Detailed migration strategy recommendations

**Usage**:
```bash
# Run assessment
npx tsx scripts/assess-legacy-products.ts

# Or with yarn
yarn tsx scripts/assess-legacy-products.ts
```

**Output**:
- Console report dengan detailed analysis
- JSON file dengan complete results (`assessment-result-YYYY-MM-DD.json`)

**Safety**: 100% safe - only performs READ operations, no data modifications.

**Dependencies**:
- Database connection (prisma)
- TypeScript execution environment (tsx)

---

## `import-products.ts`

**Purpose**: Import produk dari JSON files ke database dengan validasi dan image upload otomatis.

**Description**: Script yang mengimport produk dari JSON seed files ke database menggunakan ProductService dengan validasi lengkap dan dukungan image upload ke Supabase.

**Supported Product Types**:
- **Clothing**: `organza`, `renda-premium`, `renda`, `jas-jaguar`, `jas-polos`, `jas-premium`, `jas-renda`, `gamis-anak`, `gamis-dewasa`, `gamis-tanggung`
- **Accessories (UNIVERSAL)**: `anting`, `bando-besar`, `bando-kecil`
- **Accessories (MULTI-SIZE)**: `gelang`, `kalung`, `sarung`, `songket` (NEW)

**Usage**:
```bash
# Dry run (preview only)
DRY_RUN=true PRODUCT_TYPE=anting npx tsx scripts/import-products.ts

# Live import
PRODUCT_TYPE=anting npx tsx scripts/import-products.ts

# Import all accessories
PRODUCT_TYPE=anting npx tsx scripts/import-products.ts
PRODUCT_TYPE=bando-besar npx tsx scripts/import-products.ts
PRODUCT_TYPE=bando-kecil npx tsx scripts/import-products.ts

# Import new multi-size accessories
PRODUCT_TYPE=gelang npx tsx scripts/import-products.ts
PRODUCT_TYPE=kalung npx tsx scripts/import-products.ts
PRODUCT_TYPE=sarung npx tsx scripts/import-products.ts
PRODUCT_TYPE=songket npx tsx scripts/import-products.ts
```

**Features**:
- **Validasi Data**: Category validation, duplicate checking, price/quantity validation
- **Image Upload**: Otomatis upload ke Supabase Storage dengan fallback ke default image
- **Size Management**: Universal sizing untuk accessories (UNIVERSAL age category & size)
- **Error Handling**: Comprehensive error reporting dan recovery mechanisms
- **Progress Tracking**: Real-time progress feedback selama import

**Data Structure**:
Setiap produk memerlukan:
- `code`: Kode produk unik
- `name`: Nama produk
- `description`: Deskripsi produk
- `modalAwal`: Harga modal awal
- `currentPrice`: Harga jual saat ini
- `quantity`: Jumlah stok
- `categoryId`: UUID category dari api.log
- `imageUrl`: Path image produk
- `sizes`: Array dengan ageCategory dan size information

**JSON File Locations**:
- Clothing: `prisma/seed/[type]-products.json`
- Universal Accessories: `prisma/seed/[type].json` (anting.json, bando-besar.json, bando-kecil.json)
- Multi-size Accessories: `prisma/seed/[type].json` (gelang.json, kalung.json, sarung.json, songket.json)

**Dependencies**:
- Database connection (prisma)
- ProductService untuk business logic
- FileUploadService untuk image handling
- Supabase Storage configuration (opsional)

---

## Migration Strategy

Based on assessment results, follow the 4-phase implementation plan:

1. **Phase 1**: Foundation (data assessment, new interfaces)
2. **Phase 2**: Infrastructure (advanced services, components)
3. **Phase 3**: Testing (migration testing, integration)
4. **Phase 4**: Cutover (atomic switch, cleanup)

## Safety Guidelines

- All migration scripts should be tested in development first
- Always create database backups before data modifications
- Use feature flags untuk gradual rollout
- Maintain rollback procedures untuk emergency recovery