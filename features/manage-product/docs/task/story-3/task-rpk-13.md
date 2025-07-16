# Task RPK-13: Implementasi Backend Manage-Product

## Daftar Isi

1. [Pendahuluan](mdc:#pendahuluan)
2. [Batasan dan Penyederhanaan](mdc:#batasan-dan-penyederhanaan)
3. [Spesifikasi Teknis](mdc:#spesifikasi-teknis)
4. [Implementasi Teknis](mdc:#implementasi-teknis)
5. [Test Plan](mdc:#test-plan)
6. [Pertanyaan untuk Diklarifikasi](mdc:#pertanyaan-untuk-diklarifikasi)

## Pendahuluan

Task ini fokus pada implementasi backend untuk fitur manajemen produk, termasuk API CRUD, validasi data, upload file, dan integrasi dengan database Supabase. Implementasi akan mengikuti arsitektur 3-tier dengan pemisahan yang jelas antara API Routes, Services, dan Data Access Layer.

Backend ini akan menyediakan endpoint yang aman dan efisien untuk operasi manajemen produk, dengan validasi yang ketat dan error handling yang komprehensif.

## Batasan dan Penyederhanaan Implementasi

### Batasan Teknis

- **Database**: Menggunakan Supabase sebagai database utama
- **Authentication**: Menggunakan Clerk untuk autentikasi dan otorisasi
- **File Storage**: Menggunakan Supabase Storage untuk upload gambar
- **API Framework**: Next.js API Routes untuk endpoint
- **Validation**: Zod untuk schema validation

### Penyederhanaan

- **Soft Delete**: Implementasi soft delete untuk menjaga integritas data
- **Image Processing**: Resize gambar otomatis untuk optimasi storage
- **Pagination**: Implementasi pagination sederhana dengan limit/offset
- **Search**: Pencarian berdasarkan nama dan kode produk
- **Caching**: Tidak implementasi caching pada tahap awal

## Spesifikasi Teknis

### Struktur Data

```prisma
model Product {
  id              String        @id @default(uuid())
  code            String        @unique // 4 digit alfanumerik uppercase (PRD1, DRES2, dll)
  name            String
  description     String?
  modalAwal       Decimal       @db.Decimal(10, 2) // Biaya pembuatan baju
  hargaSewa       Decimal       @db.Decimal(10, 2) // Harga sewa per sekali
  quantity        Int
  imageUrl        String?
  categoryId      String
  category        Category      @relation(fields: [categoryId], references: [id])
  status          ProductStatus @default(AVAILABLE)
  totalPendapatan Decimal       @db.Decimal(10, 2) @default(0) // Pendapatan kumulatif
  isActive        Boolean       @default(true)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  createdBy       String        // User ID dari Clerk
}

model Category {
  id        String    @id @default(uuid())
  name      String    @unique
  color     String    // Hex color untuk badge
  products  Product[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  createdBy String    // User ID dari Clerk
}

enum ProductStatus {
  AVAILABLE    // Tersedia
  RENTED       // Disewa
  MAINTENANCE  // Maintenance
}

// Index untuk optimasi query
@@index([isActive])
@@index([categoryId])
@@index([status])
@@index([createdBy])
```

### TypeScript Interfaces

```typescript
interface Product {
  id: string
  code: string
  name: string
  description?: string
  modalAwal: number
  hargaSewa: number
  quantity: number
  imageUrl?: string
  categoryId: string
  category: Category
  status: ProductStatus
  totalPendapatan: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

interface Category {
  id: string
  name: string
  color: string
  products: Product[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

interface CreateProductRequest {
  code: string
  name: string
  description?: string
  modalAwal: number
  hargaSewa: number
  quantity: number
  categoryId: string
  image?: File
}

interface UpdateProductRequest {
  name?: string
  description?: string
  modalAwal?: number
  hargaSewa?: number
  quantity?: number
  categoryId?: string
  image?: File
}

interface ProductListResponse {
  products: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

enum ProductStatus {
  AVAILABLE = 'AVAILABLE',
  RENTED = 'RENTED',
  MAINTENANCE = 'MAINTENANCE'
}
```

### Validation Schemas

```typescript
import { z } from 'zod'

const productSchema = z.object({
  code: z.string()
    .min(1, 'Kode produk wajib diisi')
    .max(4, 'Kode maksimal 4 karakter')
    .regex(/^[A-Z0-9]{4}$/, 'Kode harus 4 digit alfanumerik uppercase'),
  name: z.string().min(1, 'Nama produk wajib diisi').max(100, 'Nama maksimal 100 karakter'),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional(),
  modalAwal: z.number().positive('Modal awal harus positif').max(999999999, 'Modal maksimal 999,999,999'),
  hargaSewa: z.number().positive('Harga sewa harus positif').max(999999999, 'Harga sewa maksimal 999,999,999'),
  quantity: z.number().int().min(0, 'Jumlah minimal 0').max(9999, 'Jumlah maksimal 9999'),
  categoryId: z.string().uuid('ID kategori tidak valid'),
})

const updateProductSchema = productSchema.partial()

const categorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi').max(50, 'Nama kategori maksimal 50 karakter'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Warna harus dalam format hex (#RRGGBB)'),
})
```

## Implementasi Teknis

### Arsitektur Layer

Mengikuti arsitektur 3-tier Maguru:

```
API Routes (Entry Point)
    ↓
Services (Business Logic)
    ↓
Data Access (Prisma ORM)
    ↓
Database (Supabase)
```

### API Endpoints

#### 1. `GET /api/products` - Mendapatkan Daftar Produk

- **Authentication**: Required (Producer/Owner)
- **Query Parameters**:
  - `page`: number (default: 1)
  - `limit`: number (default: 10, max: 50)
  - `search`: string (optional) - pencarian berdasarkan nama atau kode produk
  - `categoryId`: string (optional) - filter berdasarkan kategori
  - `status`: ProductStatus (optional) - filter berdasarkan status
  - `isActive`: boolean (optional)
- **Response**: `ProductListResponse`
- **Status Codes**: 200 OK, 401 Unauthorized, 403 Forbidden

#### 2. `GET /api/products/[id]` - Mendapatkan Detail Produk

- **Authentication**: Required (Producer/Owner)
- **Path Parameters**: `id`: string
- **Response**: `Product`
- **Status Codes**: 200 OK, 404 Not Found, 401 Unauthorized

#### 3. `POST /api/products` - Membuat Produk Baru

- **Authentication**: Required (Producer/Owner)
- **Request Body**: `CreateProductRequest` (multipart/form-data)
- **Response**: `Product`
- **Status Codes**: 201 Created, 400 Bad Request, 401 Unauthorized, 409 Conflict

#### 4. `PUT /api/products/[id]` - Mengupdate Produk

- **Authentication**: Required (Producer/Owner)
- **Path Parameters**: `id`: string
- **Request Body**: `UpdateProductRequest` (multipart/form-data)
- **Response**: `Product`
- **Status Codes**: 200 OK, 400 Bad Request, 401 Unauthorized, 404 Not Found

#### 5. `DELETE /api/products/[id]` - Menghapus Produk (Soft Delete)

- **Authentication**: Required (Producer/Owner)
- **Path Parameters**: `id`: string
- **Response**: `{ success: boolean, message: string }`
- **Status Codes**: 200 OK, 401 Unauthorized, 404 Not Found

#### 6. `GET /api/categories` - Mendapatkan Daftar Kategori

- **Authentication**: Required (Producer/Owner)
- **Response**: `Category[]`
- **Status Codes**: 200 OK, 401 Unauthorized

#### 7. `POST /api/categories` - Membuat Kategori Baru

- **Authentication**: Required (Producer/Owner)
- **Request Body**: `{ name: string, color: string }`
- **Response**: `Category`
- **Status Codes**: 201 Created, 400 Bad Request, 401 Unauthorized, 409 Conflict

#### 8. `PUT /api/categories/[id]` - Mengupdate Kategori

- **Authentication**: Required (Producer/Owner)
- **Path Parameters**: `id`: string
- **Request Body**: `{ name?: string, color?: string }`
- **Response**: `Category`
- **Status Codes**: 200 OK, 400 Bad Request, 401 Unauthorized, 404 Not Found

#### 9. `DELETE /api/categories/[id]` - Menghapus Kategori

- **Authentication**: Required (Producer/Owner)
- **Path Parameters**: `id`: string
- **Response**: `{ success: boolean, message: string }`
- **Status Codes**: 200 OK, 401 Unauthorized, 404 Not Found, 409 Conflict (jika kategori masih digunakan)

### Service Layer Implementation

#### ProductService

```typescript
class ProductService {
  // Mendapatkan daftar produk dengan pagination dan filter
  async getProducts(params: GetProductsParams): Promise<ProductListResponse>

  // Mendapatkan detail produk berdasarkan ID
  async getProductById(id: string): Promise<Product | null>

  // Membuat produk baru
  async createProduct(data: CreateProductData, userId: string): Promise<Product>

  // Mengupdate produk
  async updateProduct(id: string, data: UpdateProductData, userId: string): Promise<Product>

  // Soft delete produk
  async deleteProduct(id: string, userId: string): Promise<boolean>

  // Upload dan process gambar
  async uploadProductImage(file: File): Promise<string>

  // Validasi kode produk unik
  async validateProductCode(code: string, excludeId?: string): Promise<boolean>

  // Update status produk
  async updateProductStatus(id: string, status: ProductStatus): Promise<Product>

  // Update total pendapatan produk
  async updateTotalPendapatan(id: string, amount: number): Promise<Product>
}

class CategoryService {
  // Mendapatkan daftar kategori
  async getCategories(): Promise<Category[]>

  // Mendapatkan detail kategori berdasarkan ID
  async getCategoryById(id: string): Promise<Category | null>

  // Membuat kategori baru
  async createCategory(data: { name: string, color: string }, userId: string): Promise<Category>

  // Mengupdate kategori
  async updateCategory(id: string, data: { name?: string, color?: string }, userId: string): Promise<Category>

  // Menghapus kategori (jika tidak digunakan)
  async deleteCategory(id: string): Promise<boolean>

  // Validasi nama kategori unik
  async validateCategoryName(name: string, excludeId?: string): Promise<boolean>

  // Cek apakah kategori masih digunakan
  async isCategoryInUse(id: string): Promise<boolean>
}
```

### Error Handling Strategy

#### Error Types

```typescript
class ProductError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
  ) {
    super(message)
  }
}

// Error codes
const ERROR_CODES = {
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  PRODUCT_CODE_EXISTS: 'PRODUCT_CODE_EXISTS',
  INVALID_IMAGE_FORMAT: 'INVALID_IMAGE_FORMAT',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
  CATEGORY_NAME_EXISTS: 'CATEGORY_NAME_EXISTS',
  CATEGORY_IN_USE: 'CATEGORY_IN_USE',
  INVALID_PRODUCT_STATUS: 'INVALID_PRODUCT_STATUS',
} as const
```

#### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    message: string
    code: string
    details?: Record<string, any>
  }
}
```

### File Upload Implementation

#### Image Processing

- **Format Support**: JPG, PNG, WebP
- **Size Limit**: 5MB per file
- **Auto Resize**: Resize ke max 800x800px untuk optimasi
- **Storage Path**: `products/{productId}/{filename}`

#### Upload Flow

```
1. Validate file format and size
2. Generate unique filename
3. Upload to Supabase Storage
4. Get public URL
5. Update product record
```

## Test Plan

### Unit Testing

- **Coverage Target**: 90% code coverage
- **Test Files**:
  - `productService.test.ts`
  - `productValidation.test.ts`
  - `imageUpload.test.ts`
  - `categoryService.test.ts`
  - `categoryValidation.test.ts`

### Integration Testing

- **API Testing**: Test semua endpoint dengan berbagai skenario
- **Database Testing**: Test CRUD operations dengan test database
- **Authentication Testing**: Test dengan berbagai role user

### Test Scenarios

#### Positive Cases

- [ ] Membuat produk baru dengan data valid
- [ ] Mengupdate produk yang ada
- [ ] Mendapatkan daftar produk dengan pagination
- [ ] Mendapatkan detail produk berdasarkan ID
- [ ] Soft delete produk
- [ ] Upload gambar produk
- [ ] Membuat kategori baru dengan data valid
- [ ] Mengupdate kategori yang ada
- [ ] Mendapatkan daftar kategori
- [ ] Menghapus kategori yang tidak digunakan
- [ ] Update status produk
- [ ] Update total pendapatan produk

#### Negative Cases

- [ ] Membuat produk dengan kode duplikat
- [ ] Mengupdate produk yang tidak ada
- [ ] Akses tanpa autentikasi
- [ ] Akses dengan role yang tidak sesuai
- [ ] Upload file dengan format tidak valid
- [ ] Validasi data dengan format salah
- [ ] Membuat kategori dengan nama duplikat
- [ ] Mengupdate kategori yang tidak ada
- [ ] Menghapus kategori yang masih digunakan
- [ ] Validasi kode produk dengan format salah (bukan 4 digit alfanumerik)
- [ ] Validasi warna kategori dengan format hex salah

### Performance Testing

- [ ] Response time < 500ms untuk GET requests
- [ ] Response time < 2s untuk POST/PUT dengan upload
- [ ] Concurrent requests handling
- [ ] Database query optimization

## Pertanyaan untuk Diklarifikasi

1. **Image Storage**: Apakah perlu implementasi CDN untuk optimasi delivery gambar?
2. **Bulk Operations**: Apakah perlu endpoint untuk bulk create/update/delete?
3. **Audit Trail**: Apakah perlu tracking perubahan detail (who, when, what)?
4. **Export/Import**: Apakah perlu fitur export data ke CSV/Excel?
5. **Category Management**: Apakah kategori produk perlu di-manage terpisah?
6. **Price History**: Apakah perlu tracking perubahan harga?
7. **Stock Alerts**: Apakah perlu notifikasi saat stock menipis?
8. **API Rate Limiting**: Apakah perlu implementasi rate limiting?

## Dependensi

- **Internal**: RPK-12 (UI Design) - untuk memahami struktur data yang dibutuhkan
- **External**:
  - Supabase setup dan konfigurasi
  - Clerk authentication integration
  - Prisma ORM setup

## Definition of Done

- [ ] Semua API endpoints produk berfungsi dengan baik
- [ ] Semua API endpoints kategori berfungsi dengan baik
- [ ] Unit tests mencapai coverage 90%
- [ ] Integration tests berhasil
- [ ] Error handling komprehensif
- [ ] File upload berfungsi dengan baik
- [ ] Validasi data robust (termasuk validasi kode produk 4 digit alfanumerik)
- [ ] Validasi kategori dengan color picker berfungsi
- [ ] Dokumentasi API lengkap
- [ ] Performance sesuai standar
- [ ] Security review disetujui
- [ ] Integration dengan frontend UI yang sudah ada
