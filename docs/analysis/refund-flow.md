# Lost Item Resolution Modal - Deposit Kept Flow Analysis

## Overview
Analisis sistem flow untuk fitur **Lost Item Resolution Modal** khususnya pada opsi **"Deposit Kept"** (Ganti dengan Dana Jaminan) yang terdapat pada lines 263-276 di `LostItemResolutionModal.tsx`.

## UI Component Analysis

### Deposit Kept Option (Lines 263-276)
```tsx
{/* Option 2: Deposit Kept */}
<div className="flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-orange-300 transition-colors">
  <RadioGroupItem value="deposit_kept" id="deposit_kept" className="mt-1" />
  <Label htmlFor="deposit_kept" className="flex-1 cursor-pointer">
    <div className="space-y-1">
      <p className="font-medium text-gray-900">Ganti dengan Dana Jaminan</p>
      <p className="text-sm text-gray-600">
        Dana jaminan digunakan untuk membeli pengganti. Barang ditandai sebagai
        hilang permanen.
      </p>
    </div>
  </Label>
</div>
```

**UI Features:**
- Radio button selection dengan value `"deposit_kept"`
- Visual feedback dengan hover effect (border-orange-300)
- Clear labeling dan description untuk user understanding
- Integrated dalam RadioGroup component untuk single selection

## Complete System Flow

### 1. Frontend Flow (LostItemResolutionModal.tsx)

#### State Management
```typescript
const [resolutionType, setResolutionType] = useState<ResolutionType>('customer_replaced')
const [kasirId, setKasirId] = useState<string>('')
const [notes, setNotes] = useState('')
```

#### Form Submission Process
1. **Validation Phase**
   - Check if lost items exist
   - Validate kasir selection (required)
   - Set loading state

2. **API Call Phase**
   ```typescript
   const response = await fetch(
     `/api/kasir/transaksi/${transactionCode}/resolve-lost-item`,
     {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         returnRecordId: item.returnRecordId,
         resolutionType, // "deposit_kept"
         kasirId,
         notes: notes.trim() || undefined,
       }),
     },
   )
   ```

3. **Success Handling**
   - Show success toast: "Barang hilang berhasil diselesaikan. Dana jaminan ditahan."
   - Reset form state
   - Close modal
   - Trigger parent component refresh

### 2. Backend API Flow (resolve-lost-item/route.ts)

#### Request Processing
1. **Parameter Detection**: UUID vs transaction code
2. **Rate Limiting**: 20 requests per minute per IP
3. **Authentication**: Require 'transaksi' update permission
4. **Validation**: Zod schema validation
   ```typescript
   const resolveLostItemSchema = z.object({
     returnRecordId: z.string().min(1),
     resolutionType: z.enum(['customer_replaced', 'deposit_kept']),
     kasirId: z.string().min(1),
     notes: z.string().optional(),
   })
   ```

#### Service Layer Call
```typescript
const result = await returnService.resolveLostItem({
  transaksiId: transaction.id,
  returnRecordId,
  resolutionType, // "deposit_kept"
  kasirId,
  notes,
})
```

### 3. Business Logic Flow (returnService.ts)

#### Deposit Kept Processing (`resolutionType === 'deposit_kept'`)

**Phase 1: Validation (Outside Transaction)**
- Fetch return record with product details
- Validate condition is 'HILANG'
- Validate not already resolved
- Extract productSizeId from kondisiAwal
- Validate product size exists and has rented quantity

**Phase 2: Atomic Database Transaction**
```typescript
if (request.resolutionType === 'deposit_kept') {
  // Update stock: mark as lost
  await tx.productSize.update({
    where: { id: sizeId },
    data: {
      rentedQuantity: { decrement: 1 },
      lostQuantity: { increment: 1 },
    },
  })

  // Update resolution status
  await tx.transaksiItemReturn.update({
    where: { id: request.returnRecordId },
    data: {
      resolutionStatus: 'resolved_lost',
      resolutionDate: new Date(),
      resolutionNotes: request.notes,
    },
  })
}
```

## Key Differences: Deposit Kept vs Customer Replaced

| Aspect | Deposit Kept | Customer Replaced |
|--------|--------------|-------------------|
| **Refund** | No refund (deposit retained) | Full deposit refund |
| **Stock Update** | `rentedQuantity--`, `lostQuantity++` | `rentedQuantity--`, `availableQuantity++` |
| **Expense Record** | No expense created | Expense record created for kasir |
| **Resolution Status** | `resolved_lost` | `resolved_replaced` |
| **Business Impact** | Permanent loss, deposit covers cost | Stock restored, expense tracked |

## Database Schema Impact

### Tables Modified
1. **productSize**
   - `rentedQuantity`: Decremented by 1
   - `lostQuantity`: Incremented by 1

2. **transaksiItemReturn**
   - `resolutionStatus`: Set to 'resolved_lost'
   - `resolutionDate`: Current timestamp
   - `resolutionNotes`: Optional user notes

### Tables NOT Modified (vs Customer Replaced)
- **pembayaran**: No refund payment created
- **pengeluaranKasir**: No expense record created

## Error Handling

### Frontend Error Scenarios
- No lost items to resolve
- Kasir not selected
- API request failures
- Network timeouts

### Backend Error Scenarios
- Return record not found
- Item not in HILANG condition
- Already resolved items
- Product size validation failures
- Database transaction failures

## Security & Validation

### Authentication
- Requires 'transaksi' update permission
- User context maintained throughout flow

### Rate Limiting
- 20 requests per minute per IP address
- Prevents abuse of resolution endpoint

### Data Validation
- Zod schema validation on all inputs
- Business rule validation (HILANG condition)
- Stock quantity validation

## Logging & Monitoring

### Key Log Points
```typescript
kasirLogger.returnProcess.info('resolveLostItem', 'Deposit retention processed', {
  returnRecordId: request.returnRecordId,
  sizeId,
})
```

### Correlation ID
- Unique request tracking: `resolve-lost-${kode}-${timestamp}-${random}`
- Full request lifecycle logging
- Error context preservation

## Business Rules Summary

**Deposit Kept Option:**
1. Customer does not get refund
2. Item is permanently marked as lost
3. Stock is adjusted to reflect permanent loss
4. No expense tracking required (deposit covers loss)
5. Resolution is final and cannot be reversed

This flow represents a business decision where the rental company accepts the deposit as compensation for the lost item, treating it as a permanent inventory loss rather than a recoverable situation.