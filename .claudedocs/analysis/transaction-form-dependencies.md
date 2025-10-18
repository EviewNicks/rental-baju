# Analisis Dependency: Form Product Transaction

**Generated:** 2025-10-18
**Target:** `app\(kasir)\dashboard\new\page.tsx`
**Analyst:** Claude Code with Sequential Thinking & Task Management

---

## 📋 Executive Summary

Form Product Transaction adalah sistem multi-step form untuk membuat transaksi penyewaan dengan 3 tahapan:
1. **Product Selection** - Pilih produk dan kuantitas
2. **Customer Biodata** - Pilih atau daftar pelanggan
3. **Payment Summary** - Konfirmasi pembayaran dan submit

### Key Metrics
- **Total Files:** 65+ files
- **Components:** 9 UI components
- **Hooks:** 12 custom hooks
- **Services:** 11 backend services
- **API Routes:** 10 endpoints
- **Database Tables:** 8 Prisma models

---

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  app/(kasir)/dashboard/new/page.tsx                         │
│         └─→ TransactionFormPage (Orchestrator)              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                      │
│  features/kasir/hooks/useTransactionForm.ts                 │
│    ├─→ useCreateTransaksi (Transaction creation)            │
│    ├─→ useCreatePembayaran (Payment creation)               │
│    ├─→ useTransactionFormPersistence (Auto-save)            │
│    └─→ State management & validation                        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA ACCESS LAYER                       │
│  features/kasir/api.ts (KasirApi Client)                    │
│    ├─→ Circuit Breaker Pattern                              │
│    ├─→ Retry Logic (exponential backoff)                    │
│    ├─→ Input Sanitization                                   │
│    └─→ Error Handling                                       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                       API ROUTES LAYER                       │
│  app/api/kasir/                                             │
│    ├─→ /transaksi (POST, GET, PUT)                         │
│    ├─→ /pembayaran (POST, PUT)                             │
│    ├─→ /penyewa (POST, GET, PUT)                           │
│    └─→ /produk/available (GET)                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                          │
│  Prisma ORM → PostgreSQL (Supabase)                        │
│    ├─→ Transaksi, TransaksiItem                            │
│    ├─→ Pembayaran                                           │
│    ├─→ Penyewa                                              │
│    └─→ Product, Category, Color                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Complete File Dependency Tree

### 1️⃣ Entry Point
```
app/(kasir)/dashboard/new/page.tsx
└─→ features/kasir/components/form/TransactionFormPage.tsx
```

### 2️⃣ Main Form Component Dependencies

#### TransactionFormPage.tsx (Orchestrator)
```typescript
features/kasir/components/form/TransactionFormPage.tsx
├─→ Hooks
│   └─→ features/kasir/hooks/useTransactionForm.ts ⭐ (Main hook)
│
├─→ Step Components
│   ├─→ features/kasir/components/form/ProductSelectionStep.tsx
│   ├─→ features/kasir/components/form/CustomerBiodataStep.tsx
│   └─→ features/kasir/components/form/PaymentSummaryStep.tsx
│
├─→ UI Components
│   ├─→ features/kasir/components/ui/stepper.tsx
│   ├─→ features/kasir/components/ui/TransactionSuccessScreen.tsx
│   └─→ features/kasir/components/ui/NotificationBanner.tsx
│
├─→ Constants
│   ├─→ features/kasir/lib/constants/stepValidationMessages.ts
│   └─→ features/kasir/lib/constants/workflowConfig.ts
│
└─→ Types
    └─→ features/kasir/types/index.ts
```

### 3️⃣ Hook Layer Dependencies

#### useTransactionForm.ts (Main Hook)
```typescript
features/kasir/hooks/useTransactionForm.ts
├─→ Sub-Hooks
│   ├─→ features/kasir/hooks/useTransaksi.ts
│   │   └─→ useCreateTransaksi (React Query mutation)
│   │
│   ├─→ features/kasir/hooks/usePembayaran.ts
│   │   └─→ useCreatePembayaran (React Query mutation)
│   │
│   └─→ features/kasir/hooks/useTransactionFormPersistence.ts
│       ├─→ saveFormData (localStorage auto-save)
│       ├─→ loadFormData (data restoration)
│       └─→ clearFormData (cleanup)
│
├─→ API Client
│   └─→ features/kasir/api.ts (KasirApi)
│       ├─→ createTransaksi()
│       ├─→ createPembayaran()
│       ├─→ updateTransaksi() (for rollback)
│       └─→ Circuit breaker & retry logic
│
└─→ Types
    └─→ features/kasir/types/index.ts
        ├─→ TransactionFormData
        ├─→ CreateTransaksiRequest
        ├─→ CreatePembayaranRequest
        └─→ UpdateTransaksiRequest
```

#### Other Important Hooks
```
features/kasir/hooks/
├─→ useProduk.ts
│   └─→ useAvailableProducts (Product list with React Query)
│
├─→ usePenyewa.ts
│   ├─→ usePenyewaList (Customer search)
│   └─→ useCreatePenyewa (Customer registration)
│
├─→ useTransactions.ts (Transaction history)
├─→ useTransactionDetail.ts (Single transaction detail)
├─→ usePickupProcess.ts (Pickup workflow)
├─→ useMultiConditionReturn.ts (Return workflow)
└─→ useAccessibility.ts (Screen reader announcements)
```

### 4️⃣ Step Components Dependencies

#### ProductSelectionStep.tsx
```typescript
features/kasir/components/form/ProductSelectionStep.tsx
├─→ Hooks
│   └─→ features/kasir/hooks/useProduk.ts
│       └─→ useAvailableProducts
│           └─→ kasirApi.produk.getAvailable()
│               └─→ GET /api/kasir/produk/available
│
├─→ UI Components
│   ├─→ features/kasir/components/ui/product-card.tsx
│   ├─→ @/components/ui/input.tsx
│   ├─→ @/components/ui/button.tsx
│   └─→ @/components/ui/badge.tsx
│
├─→ Utils
│   └─→ features/kasir/lib/utils/client.ts
│       └─→ formatCurrency()
│
└─→ Types
    ├─→ Product
    ├─→ ProductFilters
    └─→ ProductSelection
```

#### CustomerBiodataStep.tsx
```typescript
features/kasir/components/form/CustomerBiodataStep.tsx
├─→ Hooks
│   └─→ features/kasir/hooks/usePenyewa.ts
│       ├─→ usePenyewaList (search customers)
│       └─→ useCreatePenyewa (register new)
│
├─→ Modal Component
│   └─→ features/kasir/components/form/CustomerRegistrationModal.tsx
│
└─→ Types
    ├─→ Customer
    └─→ CreatePenyewaRequest
```

#### PaymentSummaryStep.tsx
```typescript
features/kasir/components/form/PaymentSummaryStep.tsx
├─→ Utils
│   ├─→ features/kasir/lib/utils/client.ts (formatCurrency)
│   └─→ features/kasir/lib/utils/priceCalculator.ts
│
├─→ Constants
│   └─→ features/kasir/lib/constants/uiConfig.ts
│
└─→ Types
    ├─→ TransactionFormData
    └─→ PaymentMethod
```

### 5️⃣ API Client Layer

#### KasirApi (features/kasir/api.ts)
```typescript
features/kasir/api.ts
├─→ Core Methods
│   ├─→ createTransaksi(data: CreateTransaksiRequest)
│   │   └─→ POST /api/kasir/transaksi
│   │
│   ├─→ createPembayaran(data: CreatePembayaranRequest)
│   │   └─→ POST /api/kasir/pembayaran
│   │
│   ├─→ updateTransaksi(kode: string, data: UpdateTransaksiRequest)
│   │   └─→ PUT /api/kasir/transaksi/[kode]
│   │
│   ├─→ getAvailableProducts(params)
│   │   └─→ GET /api/kasir/produk/available
│   │
│   └─→ getPenyewaList(params)
│       └─→ GET /api/kasir/penyewa
│
├─→ Advanced Features
│   ├─→ Circuit Breaker Pattern (3 failures → open for 30s)
│   ├─→ Retry Logic (exponential backoff: 1s, 2s, 4s)
│   ├─→ Input Sanitization (XSS prevention)
│   └─→ Custom Error Class (KasirApiError)
│
└─→ Helper Functions
    ├─→ sanitizePenyewaInput()
    ├─→ sanitizeTextInput()
    ├─→ sanitizePhoneInput()
    ├─→ sanitizeEmailInput()
    └─→ buildQueryString()
```

### 6️⃣ API Routes Layer

```
app/api/kasir/
├─→ transaksi/
│   ├─→ route.ts (POST: create, GET: list)
│   └─→ [kode]/
│       ├─→ route.ts (GET: detail, PUT: update)
│       ├─→ ambil/route.ts (PUT: pickup process)
│       └─→ pengembalian/route.ts (PUT: return process)
│
├─→ pembayaran/
│   ├─→ route.ts (POST: create payment)
│   └─→ [id]/route.ts (PUT: update payment)
│
├─→ penyewa/
│   ├─→ route.ts (POST: create, GET: list)
│   └─→ [id]/route.ts (GET: detail, PUT: update)
│
├─→ produk/
│   └─→ available/route.ts (GET: available products)
│
└─→ dashboard/
    └─→ route.ts (GET: statistics)
```

### 7️⃣ Service Layer

```
features/kasir/services/
├─→ transaksiService.ts
│   ├─→ createTransaksi()
│   ├─→ updateTransaksi()
│   ├─→ getTransaksiList()
│   └─→ getTransaksiByKode()
│
├─→ pembayaranService.ts
│   ├─→ createPembayaran()
│   └─→ updatePembayaran()
│
├─→ penyewaService.ts
│   ├─→ createPenyewa()
│   ├─→ updatePenyewa()
│   └─→ getPenyewaList()
│
├─→ availabilityService.ts
│   ├─→ getAvailableProducts()
│   └─→ checkInventoryAvailability()
│
├─→ pickupService.ts (Pickup operations)
├─→ returnService.ts (Return operations)
└─→ auditService.ts (Activity logging)
```

### 8️⃣ Database Models (Prisma)

```
prisma/schema.prisma
├─→ Transaksi (Transaction master)
├─→ TransaksiItem (Transaction line items)
├─→ Pembayaran (Payment records)
├─→ Penyewa (Customer data)
├─→ Product (Product catalog)
├─→ Category (Product categories)
├─→ Color (Product colors)
├─→ AktivitasTransaksi (Audit trail)
└─→ FileUpload (File attachments)
```

---

## 🔄 Data Flow Diagram

### Transaction Creation Flow

```
[User Input]
    │
    ▼
[TransactionFormPage]
    │
    ├─→ Step 1: ProductSelectionStep
    │   ├─→ useAvailableProducts hook
    │   │   └─→ kasirApi.produk.getAvailable()
    │   │       └─→ GET /api/kasir/produk/available
    │   │           └─→ Prisma: Product.findMany()
    │   │
    │   └─→ addProduct(product, quantity)
    │       └─→ Updates formData.products[]
    │
    ├─→ Step 2: CustomerBiodataStep
    │   ├─→ usePenyewaList hook
    │   │   └─→ kasirApi.penyewa.getAll()
    │   │       └─→ GET /api/kasir/penyewa
    │   │           └─→ Prisma: Penyewa.findMany()
    │   │
    │   └─→ setCustomer(customer)
    │       └─→ Updates formData.customer
    │
    └─→ Step 3: PaymentSummaryStep
        └─→ submitTransaction()
            │
            ├─→ useTransactionForm.submitTransaction()
            │   │
            │   ├─→ 1. Create Transaction
            │   │   └─→ createTransaksiMutation.mutateAsync()
            │   │       └─→ kasirApi.transaksi.create()
            │   │           └─→ POST /api/kasir/transaksi
            │   │               └─→ transaksiService.createTransaksi()
            │   │                   ├─→ Prisma: Transaksi.create()
            │   │                   └─→ Prisma: TransaksiItem.createMany()
            │   │
            │   ├─→ 2. Create Payment (if paymentAmount > 0)
            │   │   └─→ createPembayaranMutation.mutateAsync()
            │   │       └─→ kasirApi.pembayaran.create()
            │   │           └─→ POST /api/kasir/pembayaran
            │   │               └─→ pembayaranService.createPembayaran()
            │   │                   └─→ Prisma: Pembayaran.create()
            │   │
            │   └─→ 3. Rollback on Payment Failure (retry 3x)
            │       └─→ updateTransaksiMutation.mutateAsync()
            │           └─→ kasirApi.transaksi.update()
            │               └─→ PUT /api/kasir/transaksi/[kode]
            │                   └─→ transaksiService.updateTransaksi()
            │                       └─→ Prisma: Transaksi.update({ status: 'cancelled' })
            │
            └─→ Success
                ├─→ Clear localStorage (clearFormData)
                ├─→ Show TransactionSuccessScreen
                └─→ Redirect to /dashboard
```

---

## 📦 Supporting Files

### Constants & Configuration
```
features/kasir/lib/constants/
├─→ stepValidationMessages.ts
│   └─→ Validation error messages per step
│
├─→ workflowConfig.ts
│   └─→ Stepper configuration (steps array)
│
└─→ uiConfig.ts
    └─→ Payment methods, status badges
```

### Utilities
```
features/kasir/lib/utils/
├─→ client.ts
│   ├─→ formatCurrency()
│   └─→ formatDate()
│
├─→ priceCalculator.ts
│   └─→ calculateRentalPrice()
│
├─→ codeGenerator.ts
│   └─→ generateTransactionCode()
│
└─→ statusUtils.ts
    └─→ getStatusBadgeVariant()
```

### Validation
```
features/kasir/lib/validation/
├─→ kasirSchema.ts
│   ├─→ createTransaksiSchema
│   ├─→ createPembayaranSchema
│   └─→ createPenyewaSchema
│
└─→ pickupValidation.ts
    └─→ validatePickupData()
```

### Types
```
features/kasir/types/index.ts
├─→ Transaction Types
│   ├─→ TransactionFormData
│   ├─→ CreateTransaksiRequest
│   ├─→ UpdateTransaksiRequest
│   ├─→ TransaksiResponse
│   └─→ TransaksiListResponse
│
├─→ Payment Types
│   ├─→ CreatePembayaranRequest
│   └─→ PembayaranResponse
│
├─→ Customer Types
│   ├─→ Customer
│   ├─→ CreatePenyewaRequest
│   ├─→ UpdatePenyewaRequest
│   └─→ PenyewaResponse
│
├─→ Product Types
│   ├─→ Product
│   ├─→ ProductSelection
│   ├─→ ProductFilters
│   └─→ ProductAvailabilityListResponse
│
└─→ Common Types
    ├─→ ApiResponse<T>
    ├─→ TransactionStep (1 | 2 | 3)
    └─→ PaymentMethod ('cash' | 'transfer' | 'card')
```

---

## 🔑 Key Features & Patterns

### 1. State Persistence (Auto-save)
```typescript
// useTransactionFormPersistence.ts
const STORAGE_KEY = 'kasir_transaction_form_data'

// Auto-save on every form change
useEffect(() => {
  if (formData.products.length > 0 || formData.customer) {
    saveFormData(formData, currentStep)
  }
}, [formData, currentStep])

// Restore on page reload
useEffect(() => {
  const persistedData = loadFormData()
  if (persistedData) {
    setFormData(persistedData)
    setCurrentStep(persistedData.currentStep)
    setIsDataRestored(true) // Show notification
  }
}, [])
```

### 2. Transaction Rollback Pattern
```typescript
// useTransactionForm.ts - submitTransaction()
try {
  // 1. Create transaction
  const transaction = await createTransaksiMutation.mutateAsync(data)

  // 2. Create payment with retry (3 attempts)
  if (paymentAmount > 0) {
    let attempts = 0
    while (!paymentCreated && attempts < 3) {
      try {
        await createPembayaranMutation.mutateAsync(paymentData)
        paymentCreated = true
      } catch (error) {
        if (attempts >= 3) {
          // Rollback transaction on final failure
          await updateTransaksiMutation.mutateAsync({
            kode: transaction.kode,
            data: { status: 'cancelled' }
          })
          throw new Error('Payment failed - transaction cancelled')
        }
        // Exponential backoff: 1s, 2s, 4s
        await delay(Math.pow(2, attempts) * 1000)
        attempts++
      }
    }
  }

  return true
} catch (error) {
  // Error handling with detailed logging
  return false
}
```

### 3. Circuit Breaker Pattern (API Client)
```typescript
// features/kasir/api.ts
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  private failureThreshold = 3
  private recoveryTimeout = 30000 // 30 seconds

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.recoveryTimeout) {
        throw new Error('Service temporarily unavailable')
      }
      this.state = 'HALF_OPEN'
    }

    try {
      const result = await operation()
      this.onSuccess() // Reset to CLOSED
      return result
    } catch (error) {
      this.onFailure() // Increment failures, potentially OPEN
      throw error
    }
  }
}
```

### 4. Input Sanitization (Security)
```typescript
// features/kasir/api.ts
function sanitizePenyewaInput(input: Record<string, unknown>) {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(input)) {
    switch (key) {
      case 'nama':
      case 'alamat':
        sanitized[key] = sanitizeTextInput(value) // Remove HTML, XSS
        break
      case 'telepon':
        sanitized[key] = sanitizePhoneInput(value) // Only valid phone chars
        break
      case 'email':
        sanitized[key] = sanitizeEmailInput(value) // Normalize email
        break
    }
  }

  return sanitized
}
```

### 5. React Query Integration
```typescript
// features/kasir/hooks/useProduk.ts
export function useAvailableProducts(params = {}) {
  return useQuery({
    queryKey: ['kasir', 'produk', 'available', params],
    queryFn: () => kasirApi.produk.getAvailable(params),
    staleTime: 10 * 1000,  // 10s - fresh inventory
    gcTime: 2 * 30 * 1000, // 2min - garbage collection
  })
}
```

### 6. Multi-Step Form Validation
```typescript
// useTransactionForm.ts
const validateStep = (step: TransactionStep): boolean => {
  switch (step) {
    case 1: // Product Selection
      return formData.products.length > 0

    case 2: // Customer Biodata
      return !!formData.customer?.id

    case 3: // Payment Summary
      return !!formData.pickupDate &&
             !!formData.returnDate &&
             !!formData.paymentMethod &&
             (formData.paymentStatus === 'unpaid' || formData.paymentAmount > 0)

    default:
      return false
  }
}
```

---

## 🎨 UI Component Tree

```
TransactionFormPage
├─→ Header
│   ├─→ Button (Back to dashboard)
│   └─→ Title & Subtitle
│
├─→ Stepper
│   └─→ features/kasir/components/ui/stepper.tsx
│       └─→ Shows steps 1, 2, 3 with progress
│
├─→ Notifications
│   ├─→ NotificationBanner (Data Restored)
│   ├─→ NotificationBanner (Error Message)
│   └─→ NotificationBanner (Validation Warning)
│
├─→ Step Content (Conditional Rendering)
│   ├─→ currentStep === 1
│   │   └─→ ProductSelectionStep
│   │       ├─→ Search & Filters
│   │       ├─→ ProductCard (grid)
│   │       └─→ Shopping Cart Panel
│   │
│   ├─→ currentStep === 2
│   │   └─→ CustomerBiodataStep
│   │       ├─→ Customer Search
│   │       ├─→ Customer List
│   │       └─→ CustomerRegistrationModal
│   │
│   └─→ currentStep === 3
│       └─→ PaymentSummaryStep
│           ├─→ Order Summary
│           ├─→ Customer Info
│           ├─→ Date Selection
│           ├─→ Payment Details
│           └─→ Submit Button
│
└─→ Success Screen (showSuccess === true)
    └─→ TransactionSuccessScreen
        ├─→ Success Icon
        ├─→ Success Message
        └─→ Auto-redirect (2s)
```

---

## 📊 Performance Characteristics

### React Query Caching
- **Products:** 10s stale time, 2min gc time
- **Customers:** 30s stale time, 5min gc time
- **Transactions:** 5s stale time, 1min gc time

### API Retry Strategy
- **Max Retries:** 3 attempts
- **Backoff:** Exponential (1s, 2s, 4s)
- **Circuit Breaker:** 3 failures → 30s timeout

### localStorage Usage
- **Key:** `kasir_transaction_form_data`
- **Auto-save:** On every form change
- **Auto-restore:** On page reload
- **Cleanup:** On successful submit or manual back

---

## 🔒 Security Features

1. **Input Sanitization**
   - XSS prevention (HTML tag removal)
   - SQL injection prevention (Prisma parameterized queries)
   - Phone/email normalization

2. **Authentication & Authorization**
   - Clerk authentication required
   - Role-based access (kasir role minimum)
   - API route protection with `auth.protect()`

3. **Error Handling**
   - Custom error classes (KasirApiError)
   - Detailed error logging
   - User-friendly error messages

4. **Data Validation**
   - Zod schemas for request validation
   - Frontend validation (multi-step)
   - Backend validation (API routes)

---

## 🧪 Testing Coverage

### Test Files Related to Transaction Form
```
__tests__/
├─→ integration/kasir/
│   ├─→ transaksi.test.ts
│   ├─→ pembayaran.test.ts
│   └─→ penyewa.test.ts
│
└─→ playwright/kasir/
    └─→ transaction-flow.spec.ts (E2E)
```

### Testing Strategy (Per CLAUDE.md)
- **Unit Tests:** Co-located with implementation (`.test.ts`)
- **Integration Tests:** API + Service layer testing
- **E2E Tests:** Full user flow with Playwright
- **Skip Policy:** Unit & Integration tests skipped per project config

---

## 🚀 Future Enhancements

Based on existing infrastructure:

1. **Multi-condition Returns** (Partially implemented)
   - Already has `processEnhancedReturn()` in API client
   - Frontend components pending

2. **Pickup Process** (Infrastructure ready)
   - `usePickupProcess` hook exists
   - `processPickup()` API method available

3. **Enhanced Penalties**
   - `calculateEnhancedPenalties()` method ready
   - Penalty calculator utilities in place

4. **Audit Trail**
   - `auditService.ts` already implemented
   - `AktivitasTransaksi` model in database

---

## 📝 Development Guidelines

### Adding New Steps to Form

1. Create new step component in `features/kasir/components/form/`
2. Update `workflowConfig.ts` to add step definition
3. Add validation logic in `useTransactionForm.validateStep()`
4. Add validation message in `stepValidationMessages.ts`
5. Update `TransactionFormPage.tsx` to render new step

### Adding New API Endpoints

1. Create route handler in `app/api/kasir/[feature]/route.ts`
2. Implement service in `features/kasir/services/[feature]Service.ts`
3. Add API client method in `features/kasir/api.ts`
4. Create React Query hook in `features/kasir/hooks/use[Feature].ts`
5. Add types in `features/kasir/types/index.ts`

### State Management Pattern

```
Component (UI)
    ↓
Custom Hook (Business Logic)
    ↓
React Query Hook (Data Fetching)
    ↓
API Client (Network Request)
    ↓
API Route (Server-side)
    ↓
Service Layer (Business Logic)
    ↓
Prisma (Database)
```

---

## 🔗 Cross-References

### Related Features
- **Pickup Process:** `features/kasir/hooks/usePickupProcess.ts`
- **Return Process:** `features/kasir/hooks/useMultiConditionReturn.ts`
- **Transaction History:** `features/kasir/hooks/useTransactions.ts`
- **Dashboard Stats:** `app/api/kasir/dashboard/route.ts`

### Shared Components
- **UI Library:** `components/ui/` (Radix + TailwindCSS)
- **Utilities:** `lib/utils.ts` (cn, formatters)
- **React Query Config:** `lib/react-query.ts` (query keys, client config)

---

## 📚 Documentation References

- **Architecture:** `/docs/rules/architecture.md`
- **Test Instructions:** `/docs/rules/test-instruction.md`
- **Failure Handling:** `/docs/rules/designing-for-failure.md`
- **API Documentation:** `/docs/api/kasir-api.json`

---

**Analysis Completed:** 2025-10-18
**Total Analysis Time:** ~8 sequential thinking steps
**Confidence Level:** High (comprehensive file traversal completed)

---

## 🎯 Quick Reference: Complete File List

<details>
<summary>Click to expand full file list (65+ files)</summary>

### Presentation Layer (9 files)
1. `app/(kasir)/dashboard/new/page.tsx`
2. `features/kasir/components/form/TransactionFormPage.tsx`
3. `features/kasir/components/form/ProductSelectionStep.tsx`
4. `features/kasir/components/form/CustomerBiodataStep.tsx`
5. `features/kasir/components/form/PaymentSummaryStep.tsx`
6. `features/kasir/components/form/CustomerRegistrationModal.tsx`
7. `features/kasir/components/ui/stepper.tsx`
8. `features/kasir/components/ui/TransactionSuccessScreen.tsx`
9. `features/kasir/components/ui/NotificationBanner.tsx`

### Business Logic Layer (12 files)
10. `features/kasir/hooks/useTransactionForm.ts` ⭐
11. `features/kasir/hooks/useTransaksi.ts`
12. `features/kasir/hooks/usePembayaran.ts`
13. `features/kasir/hooks/useTransactionFormPersistence.ts`
14. `features/kasir/hooks/useProduk.ts`
15. `features/kasir/hooks/usePenyewa.ts`
16. `features/kasir/hooks/useTransactions.ts`
17. `features/kasir/hooks/useTransactionDetail.ts`
18. `features/kasir/hooks/usePickupProcess.ts`
19. `features/kasir/hooks/useMultiConditionReturn.ts`
20. `features/kasir/hooks/usePaymentProcessing.ts`
21. `features/kasir/hooks/useAccessibility.ts`

### Data Access Layer (1 file)
22. `features/kasir/api.ts` ⭐

### API Routes Layer (10 files)
23. `app/api/kasir/transaksi/route.ts`
24. `app/api/kasir/transaksi/[kode]/route.ts`
25. `app/api/kasir/transaksi/[kode]/ambil/route.ts`
26. `app/api/kasir/transaksi/[kode]/pengembalian/route.ts`
27. `app/api/kasir/pembayaran/route.ts`
28. `app/api/kasir/pembayaran/[id]/route.ts`
29. `app/api/kasir/penyewa/route.ts`
30. `app/api/kasir/penyewa/[id]/route.ts`
31. `app/api/kasir/produk/available/route.ts`
32. `app/api/kasir/dashboard/route.ts`

### Service Layer (11 files)
33. `features/kasir/services/transaksiService.ts`
34. `features/kasir/services/pembayaranService.ts`
35. `features/kasir/services/penyewaService.ts`
36. `features/kasir/services/availabilityService.ts`
37. `features/kasir/services/pickupService.ts`
38. `features/kasir/services/returnService.ts`
39. `features/kasir/services/auditService.ts`
40. `features/kasir/services/transaksiService.test.ts`
41. `features/kasir/services/pembayaranService.test.ts`
42. `features/kasir/services/penyewaService.test.ts`
43. `features/kasir/services/availabilityService.test.ts`

### Types & Constants (8 files)
44. `features/kasir/types/index.ts`
45. `features/kasir/types/Return.ts`
46. `features/kasir/lib/constants/stepValidationMessages.ts`
47. `features/kasir/lib/constants/workflowConfig.ts`
48. `features/kasir/lib/constants/uiConfig.ts`
49. `features/kasir/lib/constants/index.ts`
50. `features/kasir/lib/typeUtils.ts`
51. `features/kasir/lib/logger.ts`

### Utilities (15 files)
52. `features/kasir/lib/utils/client.ts`
53. `features/kasir/lib/utils/server.ts`
54. `features/kasir/lib/utils/priceCalculator.ts`
55. `features/kasir/lib/utils/codeGenerator.ts`
56. `features/kasir/lib/utils/codeGenerator.test.ts`
57. `features/kasir/lib/utils/statusUtils.ts`
58. `features/kasir/lib/utils/statusUtils.test.ts`
59. `features/kasir/lib/utils/penaltyCalculator.ts`
60. `features/kasir/lib/utils/penaltyCalculator.test.ts`
61. `features/kasir/lib/utils/pickupUtils.ts`
62. `features/kasir/lib/utils/returnFormHelpers.ts`
63. `features/kasir/lib/utils/integrationUtils.ts`
64. `features/kasir/lib/utils/common.ts`
65. `features/kasir/lib/utils/index.ts`

### Validation (3 files)
66. `features/kasir/lib/validation/kasirSchema.ts`
67. `features/kasir/lib/validation/pickupValidation.ts`
68. `features/kasir/lib/validation/pickupValidation.test.ts`
69. `features/kasir/lib/validation/ReturnSchema.ts`

</details>

---

**End of Analysis Report**
