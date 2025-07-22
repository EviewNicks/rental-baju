# Task BE-26: Backend API untuk Pendaftaran Penyewa dan Transaksi Penyewaan

## Daftar Isi

1. [Pendahuluan](#pendahuluan)
2. [Batasan dan Penyederhanaan](#batasan-dan-penyederhanaan)
3. [Spesifikasi Teknis BE](#spesifikasi-teknis-be)
4. [Implementasi Teknis](#implementasi-teknis)
5. [Security & Performance](#security--performance)
6. [Test Plan](#test-plan)
7. [Pertanyaan untuk Diklarifikasi](#pertanyaan-untuk-diklarifikasi)

## Pendahuluan

Task ini bertujuan untuk mengembangkan backend API yang mendukung fitur pendaftaran penyewa baru dan pembuatan transaksi penyewaan. API ini akan menyediakan endpoint untuk menyimpan data penyewa, membuat transaksi dengan kode unik otomatis, dan mengelola data produk yang tersedia untuk disewa.

Backend ini akan terintegrasi dengan sistem autentikasi Clerk untuk memastikan hanya admin/kasir yang terautentikasi yang dapat mengakses fitur ini. Data akan disimpan menggunakan Prisma ORM dengan database yang sudah dikonfigurasi, dan API akan mengikuti arsitektur Next.js App Router untuk konsistensi dengan struktur project.

## Batasan dan Penyederhanaan Implementasi

### Technical Constraints

- **Next.js App Router**: API routes harus menggunakan route handlers baru (`app/api/*/route.ts`)
- **Prisma ORM**: Semua database operations harus melalui Prisma client
- **Clerk Authentication**: Integrasi wajib untuk role-based access control (admin only)
- **TypeScript**: Strict typing untuk semua API contracts dan database operations

### Performance Constraints

- **Response Time**: API calls harus respond dalam < 2 detik untuk optimal UX
- **Concurrent Users**: Support minimal 10 concurrent kasir operations
- **Database Optimization**: Efficient queries dengan proper indexing untuk lookup operations
- **Memory Usage**: Lightweight operations untuk avoid memory leaks pada high-volume usage

### Security Constraints

- **Authentication Required**: Semua endpoints protected dengan Clerk auth middleware
- **Role-Based Access**: Hanya users dengan role 'admin' atau 'kasir' yang dapat akses
- **Input Validation**: Comprehensive validation untuk prevent injection attacks
- **Data Sanitization**: Proper sanitization untuk user inputs sebelum database operations

## Spesifikasi Teknis BE

### Database Schema Changes

Perlu penambahan tabel untuk penyewa dan transaksi:

```prisma
// Schema additions untuk features/kasir
model Penyewa {
  id        String   @id @default(uuid())
  nama      String
  telepon   String   @unique
  alamat    String
  email     String?
  nik       String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  transaksi Transaksi[]
  
  @@map("penyewa")
}

model Transaksi {
  id          String   @id @default(uuid())
  kode        String   @unique // Format: TXN-YYYYMMDD-XXX
  penyewaId   String
  status      String   @default("draft") // draft, confirmed, completed, cancelled
  totalHarga  Decimal  @default(0)
  tglMulai    DateTime
  tglSelesai  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  penyewa     Penyewa @relation(fields: [penyewaId], references: [id])
  items       TransaksiItem[]
  
  @@map("transaksi")
}

model TransaksiItem {
  id          String   @id @default(uuid())
  transaksiId String
  produkId    String
  quantity    Int      @default(1)
  hargaSewa   Decimal
  durasi      Int      // dalam hari
  
  // Relations
  transaksi   Transaksi @relation(fields: [transaksiId], references: [id])
  produk      Produk    @relation(fields: [produkId], references: [id])
  
  @@map("transaksi_item")
}
```

### API Endpoints Design

#### Endpoint Specifications

1. **Penyewa Management**:
   - `POST /api/kasir/penyewa` - Create new penyewa
   - `GET /api/kasir/penyewa` - List penyewa dengan pagination
   - `GET /api/kasir/penyewa/[id]` - Get penyewa by ID
   - `PUT /api/kasir/penyewa/[id]` - Update penyewa data

2. **Transaksi Management**:
   - `POST /api/kasir/transaksi` - Create new transaksi
   - `GET /api/kasir/transaksi` - List transaksi dengan filters
   - `GET /api/kasir/transaksi/[kode]` - Get transaksi by kode
   - `PUT /api/kasir/transaksi/[id]` - Update transaksi status

3. **Product Availability**:
   - `GET /api/kasir/produk/available` - Get available products untuk rental

#### Request/Response Contracts

**POST /api/kasir/penyewa**:
```typescript
interface CreatePenyewaRequest {
  nama: string;
  telepon: string;
  alamat: string;
  email?: string;
  nik?: string;
}

interface CreatePenyewaResponse {
  success: boolean;
  data: {
    id: string;
    nama: string;
    telepon: string;
    alamat: string;
    email: string | null;
    nik: string | null;
    createdAt: string;
  };
  message: string;
}
```

**POST /api/kasir/transaksi**:
```typescript
interface CreateTransaksiRequest {
  penyewaId: string;
  items: Array<{
    produkId: string;
    quantity: number;
    durasi: number; // dalam hari
  }>;
  tglMulai: string; // ISO date string
  tglSelesai?: string;
}

interface CreateTransaksiResponse {
  success: boolean;
  data: {
    id: string;
    kode: string; // Auto-generated: TXN-20240115-001
    penyewa: { nama: string; telepon: string };
    items: Array<{
      produk: { nama: string };
      quantity: number;
      hargaSewa: number;
    }>;
    totalHarga: number;
    status: string;
    createdAt: string;
  };
  message: string;
}
```

### Business Logic Requirements

#### Core Logic

1. **Auto Kode Generation**: Generate unique transaction code dengan format `TXN-YYYYMMDD-XXX`
2. **Price Calculation**: Calculate total harga berdasarkan produk, quantity, dan durasi
3. **Availability Check**: Validate produk availability sebelum create transaksi
4. **Phone Validation**: Ensure unique phone numbers untuk penyewa registration

#### Validation Rules

- **Penyewa**: Nama (required, min 2 chars), Telepon (required, format Indonesia), Alamat (required)
- **Transaksi**: PenyewaId must exist, Items tidak boleh empty, TglMulai tidak boleh past date
- **Business Rules**: Prevent duplicate phone registration, validate product availability

## Implementasi Teknis

### API Route Implementation

#### Route Handler Structure

**File**: `app/api/kasir/penyewa/route.ts`
- `POST` handler untuk create penyewa baru
- `GET` handler untuk list penyewa dengan optional search
- Error handling dengan consistent response format
- Clerk auth middleware untuk verify admin/kasir role

**File**: `app/api/kasir/transaksi/route.ts`
- `POST` handler untuk create transaksi dengan auto kode generation
- `GET` handler untuk list transaksi dengan filtering options
- Transaction logic untuk ensure data consistency

#### Middleware Integration

- **Clerk Auth Middleware**: Verify JWT tokens dan extract user info
- **Role Validation**: Check user role sebelum allow access ke kasir endpoints
- **Request Validation**: Zod schemas untuk validate incoming requests
- **Error Handler**: Consistent error response formatting

### Database Operations

#### Prisma ORM Usage

- **Transaction Queries**: Use Prisma transactions untuk atomic operations (create transaksi + items)
- **Optimized Queries**: Include relations dengan `include` untuk minimize database calls
- **Indexes**: Add indexes pada frequently queried fields (telepon, kode, status)
- **Soft Deletes**: Implement soft deletes untuk audit trail purposes

#### Data Processing

- **Kode Generation**: Utility function untuk generate unique transaction codes
- **Price Calculation**: Business logic untuk calculate total based on items dan duration
- **Date Handling**: Proper timezone handling untuk rental dates
- **Phone Formatting**: Standardize phone number format untuk consistency

### Error Handling Strategy

#### HTTP Status Codes

- `200` - Success operations
- `201` - Successful creation
- `400` - Bad request (validation errors)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not authorized for role)
- `404` - Resource not found
- `409` - Conflict (duplicate phone, unavailable product)
- `500` - Internal server error

#### Logging & Monitoring

- **Error Logging**: Log all errors dengan context information
- **Audit Trail**: Log semua CRUD operations untuk compliance
- **Performance Monitoring**: Track API response times dan database query performance
- **Alert System**: Setup alerts untuk critical errors atau performance issues

## Data Flow & Processing

### Request Processing Flow

1. **Client Request**: Frontend sends API request dengan auth header
2. **Auth Middleware**: Clerk verifies JWT token dan extracts user info
3. **Role Check**: Validate user has admin/kasir role
4. **Request Validation**: Zod schema validates request body
5. **Business Logic**: Execute core business logic (validation, calculation)
6. **Database Operation**: Prisma queries untuk create/read/update data
7. **Response**: Return formatted success/error response

### Data Transformation

- **Input Processing**: Sanitize dan normalize input data (phone numbers, names)
- **Output Formatting**: Consistent API response format dengan proper date formatting
- **Price Calculation**: Convert Decimal types untuk proper JSON serialization
- **Relationship Loading**: Load related data (penyewa info in transaksi response)

### Caching Strategy

- **Static Data**: Cache product data yang rarely changes
- **Query Optimization**: Use database indexes untuk fast lookups
- **Response Caching**: Cache GET responses dengan appropriate TTL
- **Cache Invalidation**: Clear caches when data changes (product updates)

## Security & Performance

### Authentication & Authorization

- **Clerk Integration**: Use Clerk's session verification untuk authenticate requests
- **Role-Based Access**: Middleware checks untuk ensure user has kasir/admin role
- **JWT Validation**: Proper JWT signature verification dan expiration handling
- **Session Management**: Handle session timeout dan renewal gracefully

### Data Validation

- **Input Sanitization**: Strip harmful characters, validate formats
- **SQL Injection Prevention**: Prisma ORM provides built-in protection
- **XSS Protection**: Sanitize output data, proper content-type headers
- **Rate Limiting**: Implement rate limiting untuk prevent abuse

### Performance Optimization

- **Database Optimization**: Proper indexing, efficient queries, connection pooling
- **Response Compression**: Gzip compression untuk reduce bandwidth usage
- **Query Batching**: Batch related queries untuk reduce database roundtrips
- **Resource Monitoring**: Monitor memory usage dan optimize accordingly

## Test Plan

### Unit Testing

- **API Handler Tests**: Test semua route handlers dengan various scenarios
- **Business Logic Tests**: Test kode generation, price calculation, validation logic
- **Database Tests**: Test Prisma queries dengan mock data
- **Utility Function Tests**: Test helper functions (phone formatting, date handling)

### Integration Testing

- **Database Integration**: Test actual database operations dengan test database
- **Clerk Integration**: Test authentication flow dengan mock Clerk responses
- **API Flow Tests**: Test complete request/response cycles
- **Error Handling Tests**: Test error scenarios dan proper error responses

### API Testing

- **Postman Collection**: Create comprehensive test collection untuk manual testing
- **Automated API Tests**: Jest tests untuk test API endpoints
- **Load Testing**: Test API performance under concurrent requests
- **Security Testing**: Test authentication, authorization, dan input validation

### Database Testing

- **Schema Validation**: Test Prisma schema changes dengan migrations
- **Data Integrity**: Test foreign key constraints dan business rules
- **Performance Testing**: Test query performance dengan large datasets
- **Backup/Restore**: Test data backup dan recovery procedures

## Pertanyaan untuk Diklarifikasi

1. **Apakah ada limit maksimum durasi rental** yang perlu di-enforce di backend?
2. **Bagaimana handling untuk kasus produk yang suddenly unavailable** setelah user select tapi sebelum confirm?
3. **Apakah perlu implement soft deletes** untuk audit trail purposes atau hard deletes acceptable?
4. **Format phone number standardization** - apakah perlu support international format atau Indonesia only?
5. **Apakah ada business rules untuk prevent duplicate active rentals** dari penyewa yang sama?

## Acceptance Criteria

| Kriteria Backend                                          | Status | Keterangan |
| --------------------------------------------------------- | ------ | ---------- |
| API endpoint POST /api/kasir/penyewa berfungsi           |        |            |
| API endpoint POST /api/kasir/transaksi berfungsi         |        |            |
| Auto-generation kode transaksi dengan format TXN-XXX     |        |            |
| Clerk authentication terintegrasi dengan role validation |        |            |
| Database schema untuk penyewa dan transaksi implemented  |        |            |
| Input validation dengan Zod schemas                      |        |            |
| Error handling dengan consistent response format         |        |            |
| Unit tests coverage minimal 80%                          |        |            |
| API documentation dengan request/response examples       |        |            |
| Performance target < 2s response time tercapai          |        |            |
| Audit logging untuk semua CRUD operations               |        |            |

---

**Task ID**: RPK-26  
**Story**: RPK-21 - Sebagai kasir, saya ingin mendaftarkan penyewa baru dan membuat transaksi penyewaan agar proses sewa dapat dimulai  
**Type**: Backend Development Task  
**Priority**: High  
**Estimated Effort**: 6 hours  
**Dependencies**: Database setup, Clerk authentication configuration