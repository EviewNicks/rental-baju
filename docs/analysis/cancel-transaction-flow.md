# Cancel Transaction Flow Analysis

## Overview
Analisis komprehensif sistem pembatalan transaksi pada aplikasi rental software, mencakup flow dari UI hingga database dan cache management. **Updated**: Sistem telah dioptimasi untuk pickup-based stock management.

## System Architecture

### 1. Component Layer
```
CancelModal (Parent Component)
├── CancelForm (Form Input)
├── useCancelTransaction (Business Logic Hook)
└── kasirApi.transaksi.update (API Client)
```

### 2. Flow Diagram
```
User Action → CancelForm → CancelModal → useCancelTransaction → kasirApi → API Route → TransaksiService → Database
                ↓
            Cache Management ← Query Invalidation ← Success Callback
```

## ✅ UPDATED: Cancel Transaction Behavior

### Current Behavior (Optimized):
1. ✅ **Status transaksi akan diubah menjadi DIBATALKAN**
2. ✅ **Transaksi tidak akan dihitung dalam revenue**
3. ❌ **~~Stock produk akan dikembalikan ke inventory~~** (REMOVED)

### Why Stock Restoration Was Removed:
- **Stock deduction** hanya terjadi saat **pickup**, bukan saat transaction creation
- **Cancel sebelum pickup** = tidak ada stock impact (correct behavior)
- **Cancel setelah pickup** = stock tetap berkurang (business logic yang benar)
- Konsisten dengan pickup-based stock management system

## System Architecture

### 1. Component Layer
```
CancelModal (Parent Component)
├── CancelForm (Form Input)
├── useCancelTransaction (Business Logic Hook)
└── kasirApi.transaksi.update (API Client)
```

### 2. Flow Diagram
```
User Action → CancelForm → CancelModal → useCancelTransaction → kasirApi → API Route → TransaksiService → Database
                ↓
            Cache Management ← Query Invalidation ← Success Callback
```

## Detailed Component Analysis

### CancelForm Component
**File**: `features/kasir/components/detail/CancelForm.tsx`

**Responsibilities**:
- Input validation untuk alasan pembatalan
- Character count validation (10-500 karakter)
- Real-time feedback untuk user
- Form submission handling

**Key Features**:
- **Validation Rules**:
  - Minimum: 10 karakter
  - Maximum: 500 karakter
  - Required field dengan trim validation
- **UI Feedback**:
  - Character counter dengan color coding
  - Error messages dengan AlertCircle icon
  - Loading state saat processing
  - Disabled state untuk semua input saat processing

**Props Interface**:
```typescript
interface CancelFormProps {
  onSubmit: (reason: string) => void
  onCancel: () => void
  isProcessing: boolean
}
```

### CancelModal Component
**File**: `features/kasir/components/detail/CancelModal.tsx`

**Responsibilities**:
- Multi-step modal flow management
- Transaction confirmation display
- Success/error state handling
- Integration dengan useCancelTransaction hook

**Modal Steps**:
1. **Input Step**: Form untuk input alasan pembatalan
2. **Confirm Step**: Konfirmasi dengan detail transaksi
3. **Success Step**: Feedback sukses dengan auto-close
4. **Error Step**: Error handling dengan retry option

**Key Features**:
- **Transaction Info Display**:
  - Kode transaksi
  - Customer name
  - Total amount
  - Amount paid
- **Warning System**:
  - Irreversible action warning
  - Stock return notification
  - Revenue impact notice
- **Auto-close**: Success modal closes after 2 seconds

### useCancelTransaction Hook
**File**: `features/kasir/hooks/useCancelTransaction.ts`

**Responsibilities**:
- Transaction cancellation mutation
- Enhanced cache management
- Error handling dengan retry mechanism
- Query invalidation strategy

**Key Features**:

#### 1. Mutation Function
```typescript
mutationFn: async (reason: string) => {
  return kasirApi.transaksi.update(transactionCode, {
    status: 'cancelled',
    catatan: reason,
  })
}
```

#### 2. Enhanced Cache Management
- **Backend Commit Wait**: 300ms delay untuk memastikan database commit
- **Retry Mechanism**: 3x retry dengan exponential backoff
- **Dual Query Refetch**:
  - Base query: `queryKeys.kasir.transaksi.detail(transactionCode)`
  - Transformed query: `[...queryKeys.kasir.transaksi.detail(transactionCode), 'transformed']`

#### 3. Fallback Strategy
Jika refetch gagal setelah 3x retry:
- Fallback ke query invalidation
- Comprehensive logging untuk debugging
- Graceful degradation

#### 4. Related Query Invalidation
```typescript
// Transaction lists
queryKeys.kasir.transaksi.lists()
// Dashboard stats
queryKeys.kasir.dashboard.stats()
```

## API Layer Analysis

### kasirApi Client
**File**: `features/kasir/api.ts`

**Method**: `kasirApi.transaksi.update(kode, data)`
- Wrapper untuk `KasirApi.updateTransaksi()`
- Consistent error handling
- Type-safe request/response

### API Route
**File**: `app/api/kasir/transaksi/[kode]/route.ts`

**PUT Handler Flow**:
1. **Request Validation**: `updateTransaksiSchema.parse(body)`
2. **Data Check**: Memastikan ada data untuk update
3. **Service Initialization**: `TransaksiService(prisma, user.id)`
4. **Transaction Lookup**: Support UUID dan code lookup
5. **Status Update**: `transaksiService.updateTransaksiStatus()`
6. **Response Formatting**: `formatTransactionResponse()`

### TransaksiService
**File**: `features/kasir/services/transaksiService.ts`

**Method**: `updateTransaksiStatus(id, data)`

**✅ UPDATED Responsibilities**:
- Transaction existence validation
- Status transition validation
- Database update execution
- **Enhanced activity logging** (with pickup status audit trail)
- **NO stock restoration** for cancelled transactions (pickup-based system)

**✅ NEW: Enhanced Cancel Logic**:
```typescript
if (data.status === 'cancelled') {
  // NO stock restoration - stock only deducted during pickup
  // Enhanced audit trail with pickup statistics
  const totalPickedUp = transaksiItems.reduce((sum, item) => sum + (item.jumlahDiambil || 0), 0)
  const hasPickedUpItems = totalPickedUp > 0
  
  // Detailed activity logging for audit trail
  await tx.aktivitasTransaksi.create({
    data: {
      // ... enhanced logging with pickup status
      stockRestorationSkipped: true,
      stockRestorationReason: 'Stock deduction only happens during pickup',
      pickupBasedSystem: true,
    }
  })
}
```

## Database Schema Impact

### Transaction Update
```sql
UPDATE transaksi 
SET 
  status = 'cancelled',
  catatan = '[user_reason]',
  updated_at = NOW()
WHERE id = '[transaction_id]'
```

### ✅ UPDATED: Enhanced Activity Logging
```sql
INSERT INTO aktivitas_transaksi 
(transaksi_id, jenis_aktivitas, deskripsi, data, created_by)
VALUES 
('[transaction_id]', 'dibatalkan', 'Transaksi dibatalkan: [reason]', '{
  "stockRestorationSkipped": true,
  "stockRestorationReason": "Stock deduction only happens during pickup",
  "pickupBasedSystem": true,
  "totalPickedUp": 0,
  "hasPickedUpItems": false,
  "auditTrail": {
    "systemType": "pickup-based-stock-management",
    "stockImpact": "no-stock-impact"
  }
}', '[user_id]')
```

### ❌ REMOVED: Stock Restoration Queries
```sql
-- These queries are NO LONGER executed for cancelled transactions:
-- UPDATE product_size SET quantity = quantity + [restored_amount] WHERE id = '[product_size_id]'
-- UPDATE product_size SET rented_stock = rented_stock - [restored_amount] WHERE id = '[product_size_id]'
```

## Cache Management Strategy

### Query Keys Structure
```typescript
queryKeys.kasir.transaksi = {
  all: () => ['kasir', 'transaksi'],
  lists: () => ['kasir', 'transaksi', 'list'],
  details: () => ['kasir', 'transaksi', 'detail'],
  detail: (kode) => ['kasir', 'transaksi', 'detail', kode]
}
```

### Invalidation Strategy
1. **Primary Queries** (dengan retry):
   - Transaction detail
   - Transformed transaction detail
2. **Secondary Queries** (fire-and-forget):
   - Transaction lists
   - Dashboard stats

### Retry Mechanism
```typescript
// Exponential backoff: 500ms, 1000ms, 2000ms
const delay = 500 * Math.pow(2, retryCount - 1)
```

## Error Handling

### Client-Side Errors
1. **Validation Errors**: Form validation dengan immediate feedback
2. **Network Errors**: Retry mechanism dengan exponential backoff
3. **API Errors**: Error modal dengan retry option
4. **Cache Errors**: Fallback ke invalidation

### Server-Side Errors
1. **Validation Errors**: Schema validation dengan Zod
2. **Business Logic Errors**: Status transition validation
3. **Database Errors**: Transaction rollback
4. **Authentication Errors**: User validation

## Performance Considerations

### Optimizations
1. **Optimistic Updates**: Tidak digunakan untuk cancel (safety first)
2. **Selective Refetch**: Hanya refetch query yang diperlukan
3. **Batch Invalidation**: Multiple queries dalam satu operasi
4. **Exponential Backoff**: Mengurangi server load saat retry

### Potential Issues
1. **Cache Inconsistency**: Mitigated dengan retry mechanism
2. **Race Conditions**: Handled dengan query cancellation
3. **Memory Leaks**: Auto-cleanup dengan component unmount

## Security Considerations

### Input Validation
- **Client-Side**: Character limits dan required validation
- **Server-Side**: Zod schema validation
- **Database**: SQL injection prevention dengan Prisma

### Authorization
- **User Authentication**: Required untuk API access
- **Transaction Ownership**: Validated dalam service layer
- **Audit Trail**: Activity logging untuk compliance

## Testing Strategy

### Unit Tests
- CancelForm validation logic
- useCancelTransaction hook behavior
- API route handlers
- TransaksiService methods

### Integration Tests
- End-to-end cancel flow
- Cache invalidation behavior
- Error handling scenarios
- Database transaction integrity

### Performance Tests
- Cache management efficiency
- Retry mechanism behavior
- Concurrent cancellation handling

## Monitoring & Logging

### Client-Side Logging
```typescript
console.error('Cache refetch attempt failed', {
  transactionCode,
  error: error.message,
  retryCount
})
```

### Server-Side Logging
```typescript
console.error('Cancel transaction API call failed', {
  transactionCode,
  error: error.message,
  errorName: error.name
})
```

## ✅ UPDATED: Recommendations

### ✅ Completed Improvements
1. **Removed Stock Restoration**: Cancel transactions no longer restore stock (pickup-based system)
2. **Enhanced Audit Trail**: Detailed logging with pickup status and stock impact analysis
3. **Updated UI Messages**: Removed misleading "stock dikembalikan" messages
4. **Consistent Business Logic**: Aligned with pickup-based stock management

### Immediate Improvements
1. **Add Loading States**: Better UX feedback during processing
2. **Enhanced Error Messages**: More specific error handling
3. **Add Confirmation Timeout**: Auto-cancel confirmation modal

### Long-term Enhancements
1. **Audit Trail Cleanup**: Remove temporary detailed logging after system is stable
2. **Bulk Cancellation**: Support multiple transaction cancellation
3. **Cancellation Reasons**: Predefined reason categories
4. **Notification System**: Email/SMS notification untuk cancellation

### Performance Optimizations
1. **Query Deduplication**: Prevent duplicate API calls
2. **Background Sync**: Offline-first cancellation support
3. **Cache Warming**: Preload related data
4. **Lazy Loading**: Load modal components on demand

## ✅ UPDATED: Conclusion

Sistem cancel transaction telah dioptimasi dengan:
- ✅ **Pickup-based stock management** consistency
- ✅ **NO stock restoration** untuk cancelled transactions (correct behavior)
- ✅ **Enhanced audit trail** dengan pickup status tracking
- ✅ **Updated UI messages** yang akurat
- ✅ Comprehensive error handling
- ✅ Robust cache management
- ✅ Multi-step user confirmation
- ✅ Proper validation layers

**Key Improvement**: Sistem sekarang konsisten dengan pickup-based stock management, dimana stock hanya dikurangi saat pickup dan tidak perlu di-restore saat cancel. Ini menghindari double stock dan inventory inconsistency.