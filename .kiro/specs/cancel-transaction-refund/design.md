# Design Document

## Overview

Design untuk automatic refund integration pada cancel transaction system. Sistem ini akan mengintegrasikan refund processing secara otomatis menggunakan pattern yang sudah terbukti dari Lost Item Resolution system, dengan fokus pada simplicity dan consistency.

## Architecture

### High-Level Flow
```
Cancel Transaction Request
    ↓
TransaksiService.updateTransaksiStatus()
    ↓
Refund Detection (jumlahBayar > 0)
    ↓
Atomic Database Transaction:
    - Create Refund Payment Record
    - Create Expense Record  
    - Update Activity Log
    ↓
UI Display Enhancement
```

### Integration Points
- **Existing**: `TransaksiService.updateTransaksiStatus()` method
- **Existing**: `pembayaran` table for payment records
- **Existing**: `pengeluaranKasir` table for expense tracking
- **Existing**: `aktivitasTransaksi` table for audit trail
- **New**: Enhanced UI display in `CancelledActivityDisplay` component

## Components and Interfaces

### 1. Enhanced TransaksiService

**Modified Constructor:**
```typescript
export class TransaksiService {
  constructor(
    private prisma: PrismaClient,
    private userId: string,
    private kasirId: string, // ✅ NEW: Required for expense creation
  ) {
    this.codeGenerator = new TransactionCodeGenerator(prisma)
  }
}
```

**Enhanced updateTransaksiStatus Method:**
```typescript
async updateTransaksiStatus(id: string, data: UpdateTransaksiRequest): Promise<Transaksi> {
  // ... existing validation logic

  const updatedTransaksi = await this.prisma.$transaction(async (tx) => {
    // ... existing transaction update logic

    if (data.status === 'cancelled') {
      const refundAmount = existingTransaksi.jumlahBayar.toNumber()
      
      if (refundAmount > 0) {
        // ✅ NEW: Automatic refund processing
        await this.processAutomaticRefund(tx, {
          transaksiId: id,
          transactionCode: existingTransaksi.kode,
          refundAmount,
          customerName: customerInfo.nama,
          cancellationReason: data.catatan || 'Tanpa alasan',
        })
      }
    }
  })
}
```

**New Private Method:**
```typescript
private async processAutomaticRefund(
  tx: PrismaTransaction,
  params: {
    transaksiId: string
    transactionCode: string
    refundAmount: number
    customerName: string
    cancellationReason: string
  }
): Promise<void> {
  // Implementation details in next section
}
```

### 2. Refund Processing Logic

**Atomic Refund Processing:**
```typescript
private async processAutomaticRefund(tx, params) {
  // Step 1: Validate kasir exists
  const kasirExists = await tx.kasir.findUnique({
    where: { id: this.kasirId },
  })
  
  if (!kasirExists) {
    throw new Error('Kasir tidak ditemukan untuk pemrosesan refund')
  }

  // Step 2: Create refund payment record
  await tx.pembayaran.create({
    data: {
      transaksiId: params.transaksiId,
      jumlah: new Decimal(-params.refundAmount),
      metode: 'refund',
      catatan: `Refund pembatalan transaksi: ${params.cancellationReason}`,
      createdBy: this.userId,
    },
  })

  // Step 3: Create expense record
  await tx.pengeluaranKasir.create({
    data: {
      kasirId: this.kasirId,
      harga: new Decimal(params.refundAmount),
      kategori: 'Refund Pembatalan Transaksi',
      deskripsi: `Refund pembatalan transaksi #${params.transactionCode} - ${params.customerName}`,
      createdBy: this.userId,
      isActive: true,
    },
  })

  // Step 4: Update activity log with completion status
  await tx.aktivitasTransaksi.create({
    data: {
      transaksiId: params.transaksiId,
      tipe: 'dibatalkan',
      deskripsi: `Transaksi dibatalkan: ${params.cancellationReason}`,
      data: {
        // ... existing fields
        needsRefund: false, // ✅ CHANGED: Refund processed
        refundProcessed: true,
        refundAmount: params.refundAmount,
        expenseRecordCreated: true,
        refundCategory: 'Refund Pembatalan Transaksi',
      },
      createdBy: this.userId,
    },
  })
}
```

### 3. API Route Enhancement

**Modified API Route:**
```typescript
// app/api/kasir/transaksi/[kode]/route.ts
export async function PUT(request: Request, { params }: { params: { kode: string } }) {
  // ... existing validation logic

  // Parse request body
  const body = await request.json()
  const validatedData = updateTransaksiSchema.parse(body)

  // ✅ NEW: Extract kasirId from request body (manual selection)
  const kasirId = validatedData.kasirId // From frontend kasir selection
  
  if (!kasirId) {
    return NextResponse.json(
      { error: 'Kasir selection is required for refund processing' },
      { status: 400 }
    )
  }

  // ✅ MODIFIED: Pass kasirId from frontend selection
  const transaksiService = new TransaksiService(prisma, user.id, kasirId)
  
  // ... rest of existing logic
}
```

### 4. UI Component Enhancement

**Enhanced CancelModal with Kasir Selection:**
```typescript
const CancelModal: React.FC<CancelModalProps> = ({ isOpen, onClose, transaction }) => {
  const [kasirId, setKasirId] = useState<string>('')
  const [kasirList, setKasirList] = useState<Kasir[]>([])
  const [isLoadingKasir, setIsLoadingKasir] = useState(false)

  // Fetch kasir list when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchKasirList()
    }
  }, [isOpen])

  const fetchKasirList = async () => {
    setIsLoadingKasir(true)
    try {
      const response = await fetch('/api/kasir/kasir?limit=100&isActive=true')
      const result = await response.json()
      const kasirData = result.data?.data || []
      const activeKasirs = kasirData.filter((kasir: Kasir) => kasir.isActive)
      setKasirList(activeKasirs)
    } catch (error) {
      console.error('Error fetching kasir list:', error)
    } finally {
      setIsLoadingKasir(false)
    }
  }

  const handleConfirmCancel = () => {
    // Validate kasir selection
    if (!kasirId) {
      toast.error('Pilih kasir terlebih dahulu')
      return
    }
    
    // Pass kasirId to cancellation request
    cancelTransaction(reason, kasirId)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        {/* ... existing cancellation form */}
        
        {/* ✅ NEW: Kasir Selection */}
        <div className="space-y-2">
          <Label htmlFor="kasir" className="text-sm font-semibold text-gray-900">
            Pilih Kasir <span className="text-red-500">*</span>
          </Label>
          <Select value={kasirId} onValueChange={setKasirId}>
            <SelectTrigger id="kasir" className="w-full">
              <SelectValue placeholder="Pilih kasir untuk expense tracking" />
            </SelectTrigger>
            <SelectContent>
              {kasirList.map((kasir) => (
                <SelectItem key={kasir.id} value={kasir.id}>
                  {kasir.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            Kasir yang dipilih akan digunakan untuk mencatat pengeluaran refund
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Enhanced CancelledActivityDisplay:**
```typescript
const CancelledActivityDisplay: React.FC<CancelledActivityProps> = ({ activity }) => {
  // ... existing component logic

  return (
    <div className="flex items-start gap-4">
      {/* ... existing display logic */}
      
      {/* ✅ ENHANCED: Refund Status Display */}
      {activity.details && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          {/* ... existing cancellation info */}
          
          {/* Refund Status Section */}
          {activity.details.refundProcessed ? (
            <div className="mt-3 pt-3 border-t border-green-300">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-700">Status Refund:</span>
                <span className="text-sm font-bold text-green-700">✅ Selesai</span>
              </div>
              <div className="text-xs text-green-600 mt-1">
                Refund {formatCurrency(activity.details.refundAmount)} telah diproses
              </div>
            </div>
          ) : activity.details.needsRefund ? (
            <div className="mt-3 pt-3 border-t border-orange-300">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-orange-700">Status Refund:</span>
                <span className="text-sm font-bold text-orange-700">⏳ Perlu Diproses</span>
              </div>
              <div className="text-xs text-orange-600 mt-1">
                Customer telah membayar {formatCurrency(Number(activity.details.amountPaid))} dan perlu refund
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
```

## Data Models

### Enhanced Activity Log Data Structure

**New Activity Data Fields:**
```typescript
interface CancelActivityData {
  // Existing fields
  previousStatus: string
  newStatus: 'cancelled'
  reason: string | null
  totalAmount: string
  amountPaid: string
  remainingAmount: string
  itemsCount: number
  stockRestored: boolean
  cancelledAt: string
  
  // ✅ NEW: Refund tracking fields
  needsRefund: boolean // false when refund processed, true when pending
  refundProcessed?: boolean // true when refund completed
  refundAmount?: number // actual refund amount
  expenseRecordCreated?: boolean // true when expense record created
  refundCategory?: string // 'Refund Pembatalan Transaksi'
  refundError?: string // error message if refund failed
}
```

### Expense Record Structure

**Refund Expense Record:**
```typescript
interface RefundExpenseRecord {
  kasirId: string // Processing kasir
  harga: Decimal // Positive refund amount
  kategori: 'Refund Pembatalan Transaksi' // Fixed category
  deskripsi: string // "Refund pembatalan transaksi #[code] - [customer]"
  createdBy: string // User who processed cancellation
  isActive: true // Always active for refunds
}
```

### Payment Record Structure

**Refund Payment Record:**
```typescript
interface RefundPaymentRecord {
  transaksiId: string // Original transaction
  jumlah: Decimal // Negative amount (refund)
  metode: 'refund' // Fixed method
  catatan: string // "Refund pembatalan transaksi: [reason]"
  createdBy: string // User who processed cancellation
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Refund Detection Accuracy
*For any* cancelled transaction with payment amount > 0, the system should automatically trigger refund processing
**Validates: Requirements 1.1**

### Property 2: Atomic Refund Processing
*For any* refund processing operation, either all refund steps (payment record, expense record, activity log) succeed together or all fail together
**Validates: Requirements 6.1, 6.2**

### Property 3: Refund Amount Consistency
*For any* processed refund, the negative payment amount should equal the positive expense amount
**Validates: Requirements 2.3, 3.3**

### Property 4: Activity Log Completeness
*For any* completed refund, the activity log should contain refundProcessed=true, refundAmount, and expenseRecordCreated=true
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 5: Kasir Validation
*For any* refund processing request, the system should validate kasir exists and is active before proceeding
**Validates: Requirements 5.2, 5.3**

### Property 6: Error Recovery
*For any* failed refund processing, the original transaction cancellation should remain successful and needsRefund should stay true
**Validates: Requirements 8.4, 8.5**

### Property 7: Backward Compatibility
*For any* existing cancelled transaction without refund processing, the UI should display appropriate pending status
**Validates: Requirements 9.1, 9.2, 9.4**

## Error Handling

### Refund Processing Errors

**Error Scenarios:**
1. **Kasir Not Found**: Validate kasir exists before processing
2. **Database Transaction Failure**: Rollback all refund changes
3. **Expense Creation Failure**: Rollback payment record
4. **Payment Creation Failure**: Stop processing and log error

**Error Response Strategy:**
```typescript
try {
  await this.processAutomaticRefund(tx, params)
} catch (error) {
  // Log error with full context
  console.error('Automatic refund processing failed', {
    transactionId: params.transaksiId,
    transactionCode: params.transactionCode,
    refundAmount: params.refundAmount,
    kasirId: this.kasirId,
    error: error.message,
    timestamp: new Date().toISOString(),
  })
  
  // Create activity log with error information
  await tx.aktivitasTransaksi.create({
    data: {
      // ... standard cancellation fields
      needsRefund: true, // Keep as pending
      refundProcessed: false,
      refundError: error.message,
    }
  })
  
  // Don't throw - allow cancellation to succeed even if refund fails
}
```

## Testing Strategy

### Unit Testing
- **Refund Detection Logic**: Test automatic refund triggering conditions
- **Atomic Processing**: Test transaction rollback on failures
- **Amount Calculations**: Test refund amount accuracy
- **Kasir Validation**: Test kasir existence and active status checks

### Property-Based Testing
- **Property 1**: Generate random transactions with various payment amounts
- **Property 2**: Test refund processing with simulated failures at different steps
- **Property 3**: Verify refund amount consistency across payment and expense records
- **Property 4**: Test activity log completeness with various refund scenarios
- **Property 5**: Test kasir validation with valid and invalid kasir IDs
- **Property 6**: Test error recovery with various failure scenarios
- **Property 7**: Test UI display with old and new activity log formats

### Integration Testing
- **End-to-End Refund Flow**: Test complete cancel transaction with refund
- **UI Display Testing**: Test refund status display in activity timeline
- **Database Consistency**: Test data consistency across all affected tables
- **Error Handling**: Test graceful degradation when refund fails

### Configuration
- Minimum 100 iterations per property test
- Each test tagged with: **Feature: cancel-transaction-refund, Property {number}: {property_text}**
- Use existing test database setup and transaction isolation

## Implementation Notes

### Key Design Decisions

1. **Reuse Existing Pattern**: Follow Lost Item Resolution refund pattern for consistency
2. **Atomic Processing**: Use database transactions to ensure data consistency
3. **Graceful Degradation**: Allow cancellation to succeed even if refund fails
4. **Backward Compatibility**: Support both old and new activity log formats
5. **Simple Integration**: Minimal changes to existing TransaksiService interface

### Performance Considerations

- **Single Transaction**: All refund operations in one database transaction
- **Minimal Queries**: Reuse existing transaction data where possible
- **Error Logging**: Comprehensive logging without blocking main flow
- **UI Efficiency**: Conditional rendering based on refund status fields

### Security Considerations

- **Kasir Validation**: Verify kasir exists and is active
- **Amount Validation**: Ensure refund amount matches original payment
- **Audit Trail**: Complete logging of all refund operations
- **Transaction Isolation**: Use database transactions for consistency