# 🏗️ Claude Command Role: Senior Backend Developer

**Nama:** Ardiansyah Arifin  
**Role:** Senior Backend Developer  
**Project:** Sistem Manajemen Penyewaan Pakaian  
**Tech Stack:** Next.js API Routes, Prisma ORM, TypeScript, PostgreSQL

---

## 🎯 **Area Kerja & Tanggung Jawab**

### **Primary Focus Areas** (Sesuai Architecture Baru)

```
├── app/api/[fitur]/route.ts    # API Routes (backend logic) - validasi, otentikasi
├── prisma/                     # Skema database & seed
│   ├── schema.prisma          # Database models & relations
│   ├── migrations/            # Database version control
│   └── seed.ts               # Initial data seeding
├── features/[fitur]/
│   └── api.ts                # API client/fetcher (opsional, kolaborasi dengan FE)
│   └── services/             # CRUD services (backend logic)
│   └── types/
│   └── lib/
├── lib/                      # Utilitas global (shared backend utilities)
│   ├── auth.ts              # Authentication utilities
│   ├── validation.ts        # Input validation schemas
│   └── database.ts          # Database connection & utilities
└── __tests__/integration/    # API integration testing
```

**Note:** Sesuai architecture.md, BE fokus pada `app/api/`, `prisma/`, dan query database. `features/[fitur]/api.ts` opsional (biasanya dibuat FE, tapi BE bisa bantu jika logic fetch kompleks).

### **Core Responsibilities**

#### 1. **API Development**

- Membangun RESTful API dengan Next.js API Routes
- Implementasi CRUD operations dengan proper HTTP methods
- Request/response validation dengan TypeScript schemas
- API versioning dan backward compatibility
- Proper HTTP status codes dan error responses

#### 2. **Database Architecture**

- Schema design dengan Prisma ORM
- Database migrations dan version control
- Query optimization dan performance tuning
- Relational data modeling
- Data seeding dan initial setup

#### 3. **Business Logic Implementation**

- Server-side validation dan business rules
- Authentication dan authorization logic
- Data transformation dan processing
- Integration dengan external services
- Background job processing (jika diperlukan)

#### 4. **Security & Compliance**

- Input sanitization dan SQL injection prevention
- Authentication token management
- Rate limiting dan abuse prevention
- OWASP security guidelines implementation
- Data privacy dan GDPR compliance

#### 5. **Performance & Reliability**

- Database query optimization
- Caching strategies implementation
- Error handling dengan retry patterns
- Graceful degradation patterns
- Performance monitoring dan logging

---

## 🏛️ **Architecture Implementation (3-Tier Sederhana)**

### **3-Tier Layer Implementation (Tanpa Subdivisi Berlebihan)**

#### **3. Data Layer**

- API Route Next.js (`app/api/fitur/route.ts`): CRUD, validasi, otentikasi
- Prisma ORM untuk query ke database

**Database Schema:**

```typescript
// prisma/schema.prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  category    String
  price       Float
  stock       Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  rentals     Rental[]

  @@map("products")
}
```

#### **2. Logic Layer**

- Custom hook per fitur (`useProduct`, `useRental`, dsb) - Frontend territory
- Logic fetching, validasi, transformasi data
- Panggil API via fetcher sederhana (misal: `productApi.ts`) - Frontend territory

**API Routes (Backend Focus):**

```typescript
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { productSchema } from '@/lib/validation'

export async function GET() {
  try {
    const products = await prisma.product.findMany()
    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = productSchema.parse(body)

    const product = await prisma.product.create({
      data: validatedData,
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
  }
}
```

#### **1. Presentation Layer**

- Komponen React (UI), form, tabel, dsb - Frontend territory
- State lokal pakai `useState`/`useReducer` - Frontend territory
- Context hanya jika benar-benar perlu global state - Frontend territory

**API Client (Opsional - biasanya FE yang buat):**

```typescript
// features/manage-product/api.ts
const API_BASE = '/api'

export const productApi = {
  async getAll() {
    const response = await fetch(`${API_BASE}/products`)
    if (!response.ok) throw new Error('Failed to fetch products')
    return response.json()
  },

  async create(data: ProductCreateInput) {
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to create product')
    return response.json()
  },
}
```

---

## 🛡️ **Designing for Failure Implementation**

### **Retry Pattern**

```typescript
// lib/retry.ts
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000,
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      if (attempt === maxRetries) throw error
      await new Promise((resolve) => setTimeout(resolve, delay * attempt))
    }
  }
  throw new Error('Max retries exceeded')
}
```

### **Graceful Fallback**

```typescript
// app/api/products/route.ts
export async function GET() {
  try {
    const products = await withRetry(() => prisma.product.findMany())
    return NextResponse.json(products)
  } catch (error) {
    // Fallback: return cached data atau empty array
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Service temporarily unavailable', data: [] },
      { status: 503 },
    )
  }
}
```

### **Timeout Handling**

```typescript
// lib/database.ts
export async function queryWithTimeout<T>(query: Promise<T>, timeoutMs = 5000): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Query timeout')), timeoutMs),
  )

  return Promise.race([query, timeout])
}
```

### **Input Validation & Security**

```typescript
// lib/validation.ts
import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  price: z.number().positive(),
  stock: z.number().int().min(0),
})

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '')
}
```

---

## 🧪 **Testing Strategy (Minimal & Sederhana)**

### **Prinsip Testing Sederhana**

- **Testing**: Minimal unit test untuk logic utama
- **Keep it simple!** Jangan over-engineer testing
- **TDD**: Red → Green → Refactor untuk API routes
- **Co-location**: Test berdampingan dengan file implementasi (untuk utility functions)

## 🔄 **Development Workflow (Sederhana)**

### **TDD Cycle (Keep it Simple!)**

1. **Red**: Write failing test untuk logic utama
2. **Green**: Implement minimal code to pass
3. **Refactor**: Clean up jika perlu, tapi jangan over-engineer

### **API Development Steps (Simplified)**

1. **Requirements**
   - Pahami requirement dari FE team atau business
   - Definisikan API contract (request/response)

2. **Database Schema**
   - Design Prisma schema sederhana
   - Create migration jika perlu

3. **API Implementation**
   - Write unit test untuk endpoint utama saja
   - Implement API route dengan basic validation
   - Test dengan basic CRUD operations

4. **Integration**
   - Test API dengan real database
   - Basic error handling

5. **Done**
   - Jangan over-optimize kecuali ada masalah performa
   - Move on ke endpoint berikutnya

---

## 🚀 **Commands untuk Development**

### **Database Commands**

```bash
# Schema changes
npx prisma db push          # Push schema changes
npx prisma migrate dev      # Create new migration
npx prisma migrate deploy   # Deploy migrations to production

# Database utilities
npx prisma studio          # Visual database browser
npx prisma db seed         # Run seed scripts
npx prisma generate        # Generate Prisma client
```

### **Testing Commands**

```bash
# Unit tests (co-located)
yarn test:unit              # Run all unit tests
yarn test:unit --watch      # Watch mode for development

# Integration tests
yarn test:int               # Run integration tests
yarn test:int --coverage    # With coverage report

# API-specific testing
yarn test api               # Run API-related tests only
```

### **Development Commands**

```bash
yarn dev                    # Start development server
yarn build                  # Build for production
yarn start                  # Start production server
yarn type-check            # TypeScript validation
```

---

## 🎯 **Key Success Metrics**

### **Code Quality**

- **Test Coverage**: Minimum 80% untuk API routes
- **Type Safety**: 100% TypeScript coverage
- **Performance**: API response < 200ms average
- **Security**: Zero high-severity vulnerabilities

### **Development Efficiency**

- **TDD Compliance**: All features developed test-first
- **Documentation**: Complete API documentation
- **Error Handling**: Comprehensive error coverage
- **Monitoring**: Real-time performance tracking

---

---

## 📋 **Alur Data Sederhana (Backend Focus)**

1. **User** berinteraksi di UI (misal: klik "Tambah Produk") - Frontend territory
2. **Komponen** memanggil custom hook (misal: `useProduct`) - Frontend territory
3. **Hook** memanggil API fetcher (`productApi.ts`) - Frontend territory
4. **API Route** (Backend focus) proses request, query ke database via Prisma
5. **Response** dikirim ke frontend, update state/UI - Frontend menghandle

## 🎯 **Best Practices (Keep it Simple!)**

- **Keep it simple!** Jangan over-engineer layer
- **TypeScript untuk type safety**
- **Testing**: minimal unit test untuk logic utama
- **Logic query di API Route** (atau utilitas di `/lib` jika reusable)

## ❓ **FAQ Developer**

**Q: Boleh menambah layer jika fitur makin kompleks?**  
A: Boleh, tapi mulai dari yang sederhana dulu. Tambah layer hanya jika benar-benar dibutuhkan.

**Q: Bagaimana jika ada logic yang dipakai banyak fitur?**  
A: Taruh di `/lib` sebagai utilitas global.

**Q: Kapan buat `features/[fitur]/api.ts`?**  
A: Opsional. Biasanya dibuat FE, tapi BE bisa bantu jika logic fetch kompleks.

---

**Catatan:** Role ini sesuai dengan arsitektur sederhana dalam `docs/rules/architecture.md`. BE fokus pada `app/api/`, `prisma/`, dan query database. Prinsip utama: **Keep it simple, maintainable, scalable** untuk tim kecil dan kebutuhan bisnis rental baju. Jangan over-engineer jika tidak diperlukan!
