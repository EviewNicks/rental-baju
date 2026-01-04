# Payment Method Improvement - Technical Design

## Architecture Overview

### Current Architecture
```
UI Components → Validation Schema → API Routes → Service Layer → Database
     ↓              ↓                 ↓            ↓           ↓
PaymentForm    kasirSchema.ts    route.ts    pembayaranService  Prisma
PaymentModal   (3 methods)      (validation)  (business logic)  (String fields)
```

### New Architecture
```
UI Components → Validation Schema → API Routes → Service Layer → Database
     ↓              ↓                 ↓            ↓           ↓
PaymentForm    kasirSchema.ts    route.ts    pembayaranService  Prisma
PaymentModal   (5 methods)      (validation)  (business logic)  (String fields)
(2-level UI)   (no reference)   (updated)     (unchanged)       (compatible)
```

## Data Model Changes

### Database Schema
**No changes required** - existing String fields support new values:
```prisma
// Existing schema (unchanged)
model Transaksi {
  metodeBayar String @default("tunai")
  // ... other fields
}

model Pembayaran {
  metode String
  // referensi field remains but becomes optional in UI
  // ... other fields
}
```

### Data Mapping Strategy
```typescript
// Legacy data mapping
const legacyMapping = {
  'transfer': 'bca',  // Default existing transfers to BCA
  'kartu': 'qris'     // Map existing card payments to QRIS
}

// Display mapping for receipts
const displayMapping = {
  'tunai': 'Tunai',
  'bca': 'Transfer',
  'bri': 'Transfer',
  'mandiri': 'Transfer', 
  'qris': 'Transfer'
}
```

## Component Design

### 1. PaymentForm Component Updates

#### Current Structure
```typescript
// Current PaymentForm.tsx
interface PaymentFormData {
  jumlah: number
  metode: 'tunai' | 'transfer' | 'kartu'
  referensi?: string  // Required for non-tunai
  catatan?: string
}
```

#### New Structure
```typescript
// New PaymentForm.tsx
interface PaymentFormData {
  jumlah: number
  metode: 'tunai' | 'bca' | 'bri' | 'mandiri' | 'qris'
  catatan?: string
  // referensi field removed completely
}

// New UI state for 2-level selection
interface PaymentUIState {
  primaryMethod: 'tunai' | 'bank'
  bankMethod?: 'bca' | 'bri' | 'mandiri' | 'qris'
}
```

#### UI Component Structure
```tsx
// New 2-level selection UI
<div className="payment-method-selection">
  {/* Primary Level */}
  <RadioGroup value={primaryMethod} onValueChange={setPrimaryMethod}>
    <RadioGroupItem value="tunai">💵 Tunai</RadioGroupItem>
    <RadioGroupItem value="bank">🏦 Bank/Transfer</RadioGroupItem>
  </RadioGroup>
  
  {/* Secondary Level (conditional) */}
  {primaryMethod === 'bank' && (
    <div className="bank-options">
      <RadioGroup value={bankMethod} onValueChange={setBankMethod}>
        <RadioGroupItem value="bca">🏦 BCA</RadioGroupItem>
        <RadioGroupItem value="bri">🏦 BRI</RadioGroupItem>
        <RadioGroupItem value="mandiri">🏦 Mandiri</RadioGroupItem>
        <RadioGroupItem value="qris">📱 QRIS</RadioGroupItem>
      </RadioGroup>
    </div>
  )}
</div>
```

### 2. PaymentSummaryStep Component Updates

#### Current Implementation
```typescript
// Current payment method selection
<RadioGroup
  value={formData.paymentMethod}
  onValueChange={(value: 'cash' | 'qris' | 'transfer') =>
    onUpdateFormData({ paymentMethod: value })
  }
>
```

#### New Implementation
```typescript
// New 2-level payment method selection
const [primaryMethod, setPrimaryMethod] = useState<'tunai' | 'bank'>('tunai')
const [bankMethod, setBankMethod] = useState<'bca' | 'bri' | 'mandiri' | 'qris'>()

const handleMethodChange = (primary: string, bank?: string) => {
  if (primary === 'tunai') {
    onUpdateFormData({ paymentMethod: 'tunai' })
  } else if (bank) {
    onUpdateFormData({ paymentMethod: bank })
  }
}
```

## Validation Schema Updates

### Current Schema
```typescript
// features/kasir/lib/validation/kasirSchema.ts
export const createPembayaranSchema = z.object({
  transaksiKode: z.string().min(1),
  jumlah: z.number().positive(),
  metode: z.enum(['tunai', 'transfer', 'kartu']),
  referensi: z.string().optional(),
  catatan: z.string().optional()
}).refine((data) => {
  // Reference required for non-tunai
  if ((data.metode === 'transfer' || data.metode === 'kartu') && !data.referensi?.trim()) {
    return false
  }
  return true
}, {
  message: 'Nomor referensi wajib diisi untuk metode transfer dan QRIS/Kartu',
  path: ['referensi'],
})
```

### New Schema
```typescript
// Updated validation schema
export const createPembayaranSchema = z.object({
  transaksiKode: z.string().min(1),
  jumlah: z.number().positive(),
  metode: z.enum(['tunai', 'bca', 'bri', 'mandiri', 'qris']),
  catatan: z.string().optional()
  // referensi field and validation removed
})

// Update transaction schema
export const createTransaksiSchema = z.object({
  // ... other fields
  metodeBayar: z.enum(['tunai', 'bca', 'bri', 'mandiri', 'qris']).default('tunai'),
  // ... other fields
})
```

## Service Layer Updates

### Payment Processing Service
**No changes required** - service uses dynamic field values:
```typescript
// pembayaranService.ts (unchanged)
async createPembayaran(data: CreatePembayaranRequest) {
  // Service already handles dynamic metode values
  const pembayaran = await tx.pembayaran.create({
    data: {
      metode: data.metode, // Works with new enum values
      // ... other fields
    }
  })
}
```

### Receipt Services Updates

#### Thermal Receipt Service (ADD MISSING FUNCTION)
```typescript
// receiptService.ts - ADD new private method (doesn't exist currently)
private formatPaymentMethodDisplay(method: string): string {
  const displayMapping = {
    'tunai': 'Tunai',
    'bca': 'Transfer',
    'bri': 'Transfer',
    'mandiri': 'Transfer',
    'qris': 'Transfer',
    // Legacy backward compatibility
    'transfer': 'Transfer',
    'kartu': 'Transfer'
  }
  return displayMapping[method] || method
}

// ✅ UPDATE existing usage in receipt generation
// Change from: direct usage of data.metodeBayar
// To: this.formatPaymentMethodDisplay(data.metodeBayar)
```

#### Professional Receipt Service (ADD MISSING FUNCTION)
```typescript
// professionalReceiptService.ts - ADD new private method (doesn't exist currently)
private formatPaymentMethodDisplay(method: string): string {
  const displayMapping = {
    'tunai': 'Tunai',
    'bca': 'Transfer',
    'bri': 'Transfer', 
    'mandiri': 'Transfer',
    'qris': 'Transfer',
    // Legacy backward compatibility
    'transfer': 'Transfer',
    'kartu': 'Transfer'
  }
  return displayMapping[method] || method
}

// ✅ UPDATE existing usage in transaction info table
// Change from: data.metodeBayar
// To: this.formatPaymentMethodDisplay(data.metodeBayar)
```

## Configuration Updates

### Payment Methods Configuration (UPDATE EXISTING ARRAY)
```typescript
// features/kasir/lib/constants/workflowConfig.ts
// ✅ UPDATE existing paymentMethods array (don't create new)
export const paymentMethods = [
  { 
    value: 'tunai', 
    label: 'Tunai', 
    icon: '💵',
    category: 'primary'
  },
  { 
    value: 'bca', 
    label: 'BCA', 
    icon: '🏦',
    category: 'bank'
  },
  { 
    value: 'bri', 
    label: 'BRI', 
    icon: '🏦',
    category: 'bank'
  },
  { 
    value: 'mandiri', 
    label: 'Mandiri', 
    icon: '🏦',
    category: 'bank'
  },
  { 
    value: 'qris', 
    label: 'QRIS', 
    icon: '📱',
    category: 'bank'
  }
]

// ❌ DON'T CREATE separate helper functions - use within usePaymentMethods() hook instead
```

### Hook Updates (UPDATE EXISTING FUNCTION)
```typescript
// features/kasir/hooks/usePaymentProcessing.ts
// ✅ UPDATE existing usePaymentMethods() function (don't create new)
export function usePaymentMethods() {
  const paymentMethods = [
    { value: 'tunai', label: 'Tunai', requiresReference: false },
    { value: 'bca', label: 'BCA', requiresReference: false },
    { value: 'bri', label: 'BRI', requiresReference: false },
    { value: 'mandiri', label: 'Mandiri', requiresReference: false },
    { value: 'qris', label: 'QRIS', requiresReference: false },
  ] as const

  // ✅ ADD helper functions within existing hook (avoid separate exports)
  const getPrimaryMethods = () => [
    { value: 'tunai', label: 'Tunai', icon: '💵' },
    { value: 'bank', label: 'Bank/Transfer', icon: '🏦' }
  ]

  const getBankMethods = () => paymentMethods.filter(m => m.value !== 'tunai')

  return { 
    paymentMethods,
    getPrimaryMethods,
    getBankMethods
  }
}
```

## Type System Updates

### Core Types
```typescript
// features/kasir/types.ts
export type PaymentMethod = 'tunai' | 'bca' | 'bri' | 'mandiri' | 'qris' | 'penalty'

// UI-specific types
export type PrimaryPaymentMethod = 'tunai' | 'bank'
export type BankPaymentMethod = 'bca' | 'bri' | 'mandiri' | 'qris'

// Form data types
export interface TransactionFormData {
  // ... other fields
  paymentMethod: PaymentMethod
  // referensi field removed
}
```

### Mapping Functions (UPDATE EXISTING FUNCTIONS)
```typescript
// features/kasir/hooks/useTransactionDetail.ts
// ✅ UPDATE existing mapPaymentMethod() function (don't create new)
function mapPaymentMethod(apiMethod: string): 'cash' | 'transfer' {
  const mapping: Record<string, 'cash' | 'transfer'> = {
    tunai: 'cash',
    bca: 'transfer',
    bri: 'transfer',
    mandiri: 'transfer',
    qris: 'transfer',
    // Legacy backward compatibility
    transfer: 'transfer',
    kartu: 'transfer'
  }
  return mapping[apiMethod] || 'cash'
}

// ✅ UPDATE existing mapToUIPaymentMethod if it exists, or remove if redundant
function mapToUIPaymentMethod(apiMethod: string): 'cash' | 'transfer' {
  return apiMethod === 'tunai' ? 'cash' : 'transfer'
}
```

## Migration Strategy

### Phase 1: Schema and Types (Day 1)
1. Update validation schemas
2. Update type definitions
3. Update configuration files
4. Run type checking and fix errors

### Phase 2: UI Components (Day 1-2)
1. Update PaymentForm component
2. Update PaymentModal component  
3. Update PaymentSummaryStep component
4. Test UI interactions

### Phase 3: Services and Display (Day 2)
1. Update receipt services
2. Update mapping functions
3. Update hooks and utilities
4. Test receipt generation

### Phase 4: Testing and Integration (Day 2-3)
1. Update test files
2. Run integration tests
3. Test backward compatibility
4. Performance testing

## Error Handling

### Validation Errors
```typescript
// Enhanced error messages for new structure
const paymentMethodErrors = {
  required: 'Pilih metode pembayaran',
  invalid_primary: 'Pilih Tunai atau Bank',
  invalid_bank: 'Pilih bank atau QRIS untuk pembayaran non-tunai',
  unknown_method: 'Metode pembayaran tidak dikenali'
}
```

### Backward Compatibility Errors
```typescript
// Handle legacy data gracefully
const handleLegacyPaymentMethod = (method: string): PaymentMethod => {
  try {
    return mapPaymentMethod(method)
  } catch (error) {
    console.warn(`Unknown payment method: ${method}, defaulting to tunai`)
    return 'tunai'
  }
}
```

## Performance Considerations

### UI Performance
- Conditional rendering for bank options (only when needed)
- Memoized payment method configurations
- Optimized re-renders with proper state management

### Data Performance
- No additional database queries required
- Existing indexes remain effective
- No impact on payment processing performance

### Caching Strategy
- Payment method configurations cached in memory
- No changes to existing React Query caching
- Maintain existing cache invalidation patterns

## Security Considerations

### Input Validation
- Strict enum validation prevents invalid payment methods
- Removal of reference field eliminates potential XSS vector
- Existing rate limiting and authentication remain unchanged

### Data Integrity
- Payment method values validated at multiple layers
- Backward compatibility mapping prevents data corruption
- Audit trail maintains payment method history

## Monitoring and Observability

### Metrics to Track
- Payment method selection distribution
- Form completion time improvements
- Error rates during transition period
- User satisfaction with simplified flow

### Logging Enhancements
```typescript
// Enhanced logging for payment method selection
console.log('Payment method selected:', {
  primary: primaryMethod,
  specific: specificMethod,
  transactionId: transactionId,
  timestamp: new Date().toISOString()
})
```