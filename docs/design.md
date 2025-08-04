# Pengembalian Baju System - Simple System Design

## 📋 Executive Summary

Simple, clean system design for the Pengembalian Baju (Clothing Return) System that integrates seamlessly with the existing Kasir feature. This design prioritizes simplicity, maintainability, and consistency with current patterns.

**Design Principles**: Keep It Simple, Reuse Existing Patterns, Zero Breaking Changes

---

## ⚡ Simple System Architecture

### Clean Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE                          │
├─────────────────────────────────────────────────────────────┤
│  [Search] → [Items] → [Penalty] → [Confirm] → [Success]    │
│  TransactionLookup    ItemConditionForm    ReturnConfirmation│
└─────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────┐
│                  BUSINESS LOGIC                            │
├─────────────────────────────────────────────────────────────┤
│  useReturnProcess → ReturnService → PenaltyCalculator      │
│  (Same patterns as existing Kasir components)              │
└─────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE                                  │
├─────────────────────────────────────────────────────────────┤
│  Existing Schema: Transaksi + TransaksiItem + Activity     │
│  No schema changes needed - use existing fields            │
└─────────────────────────────────────────────────────────────┘
```

### Simple User Flow

```
START → [Enter Code] → [Check Valid] → [Record Conditions] → [Calculate Penalty] → [Confirm] → END
  ↓         ↓              ↓               ↓                   ↓              ↓       ↓
Kasir    Search       Validate       Record Item        Show Late        Process    Success
Login    Transaksi    Eligibility    Conditions         Fee Calc         Return     Message
```

---

## 🗄️ Database Design - Zero Changes Required

### Existing Schema Usage

The beauty of this design is that it requires **zero database migrations**:

```sql
-- Transaction Status Update
Transaksi {
  status: 'active' → 'dikembalikan'  -- Simple status change
  tglKembali: DateTime               -- Set return timestamp  
  sisaBayar: Decimal                 -- Add penalty amount
}

-- Item Return Tracking
TransaksiItem {
  kondisiAkhir: String               -- Record item condition
  statusKembali: 'belum' → 'lengkap' -- Mark as returned
}

-- Activity Trail  
AktivitasTransaksi {
  tipe: 'dikembalikan',              -- Activity type
  deskripsi: 'Return processed',     -- Simple description
  data: { penalty, items, notes }    -- Return details as JSON
}
```

### Simple Database Operation

```sql
-- Single atomic transaction for return processing
BEGIN;
  UPDATE Transaksi SET status='dikembalikan', tglKembali=NOW(), sisaBayar=sisaBayar+@penalty;
  UPDATE TransaksiItem SET kondisiAkhir=@condition, statusKembali='lengkap';
  UPDATE Product SET quantity=quantity+@returned_qty;
  INSERT INTO AktivitasTransaksi VALUES (@return_activity);
COMMIT;
```

---

## 🔌 Simple API Design

### Single Endpoint

```
PUT /api/kasir/transaksi/{id}/pengembalian
```

#### Simple Request Format

```typescript
{
  items: [
    {
      itemId: "uuid",
      kondisiAkhir: "Baik - tidak ada kerusakan", 
      jumlahKembali: 1
    }
  ],
  catatan?: "Optional return notes"
}
```

#### Simple Response Format

```typescript
{
  success: boolean,
  data: {
    transaksiId: string,
    totalPenalty: number,
    message: string
  }
}
```

---

## 🧩 Simple Component Design

### Component Structure

```
ReturnProcessPage (Main Container)
├── TransactionLookup (Search form)
├── ItemConditionForm (Item conditions)  
├── PenaltyDisplay (Show calculated penalty)
└── ReturnConfirmation (Final confirmation)
```

### Key Components

#### 1. TransactionLookup - Simple Search

```typescript
const TransactionLookup = () => {
  const [code, setCode] = useState('')
  const { mutate: searchTransaction } = useMutation(
    (code: string) => kasirApi.getTransactionByCode(code)
  )
  
  return (
    <Card>
      <Input 
        placeholder="TXN-20250127-001"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <Button onClick={() => searchTransaction(code)}>
        Cari Transaksi
      </Button>
    </Card>
  )
}
```

#### 2. ItemConditionForm - Record Conditions

```typescript
const ItemConditionForm = ({ items }: { items: TransactionItem[] }) => {
  const [conditions, setConditions] = useState<Record<string, string>>({})
  
  return (
    <Card>
      {items.map(item => (
        <div key={item.id}>
          <Label>{item.product.name}</Label>
          <Textarea
            placeholder="Kondisi barang saat dikembalikan..."
            onChange={(e) => setConditions({
              ...conditions,
              [item.id]: e.target.value
            })}
          />
        </div>
      ))}
    </Card>
  )
}
```

#### 3. PenaltyDisplay - Show Late Fee

```typescript
const PenaltyDisplay = ({ expectedDate, actualDate }: PenaltyProps) => {
  const lateDays = Math.max(0, daysBetween(actualDate, expectedDate))
  const penalty = lateDays * 5000 // IDR 5,000 per day
  
  return (
    <Card>
      <div>Hari Terlambat: {lateDays} hari</div>
      <div>Total Denda: {formatCurrency(penalty)}</div>
    </Card>
  )
}
```

---

## ⚙️ Simple Business Logic

### Penalty Calculator

```typescript
export class PenaltyCalculator {
  static calculatePenalty(expectedDate: Date, actualDate: Date): number {
    const lateDays = Math.max(0, 
      Math.ceil((actualDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24))
    )
    return lateDays * 5000 // IDR 5,000 per day late fee
  }
}
```

### Return Service  

```typescript
export class ReturnService {
  async processReturn(transaksiId: string, request: ReturnRequest): Promise<ReturnResult> {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Calculate penalty
      const transaction = await tx.transaksi.findUnique({ where: { id: transaksiId } })
      const penalty = PenaltyCalculator.calculatePenalty(
        new Date(transaction.tglSelesai), 
        new Date()
      )
      
      // 2. Update transaction
      await tx.transaksi.update({
        where: { id: transaksiId },
        data: {
          status: 'dikembalikan',
          tglKembali: new Date(),
          sisaBayar: { increment: penalty }
        }
      })
      
      // 3. Update items
      for (const item of request.items) {
        await tx.transaksiItem.update({
          where: { id: item.itemId },
          data: {
            kondisiAkhir: item.kondisiAkhir,
            statusKembali: 'lengkap'
          }
        })
      }
      
      // 4. Update product stock
      // 5. Create activity log
      
      return { transaksiId, totalPenalty: penalty }
    })
  }
}
```

---

## 🎯 Simple State Management

### Custom Hook Pattern

```typescript
export const useReturnProcess = () => {
  const [step, setStep] = useState(1)
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [conditions, setConditions] = useState<Record<string, string>>({})
  
  const { mutate: processReturn } = useMutation({
    mutationFn: (data: ReturnRequest) => kasirApi.processReturn(transaction.id, data),
    onSuccess: () => {
      setStep(4) // Success step
      toast.success('Pengembalian berhasil diproses')
    }
  })
  
  return {
    step,
    transaction,
    conditions,
    setStep,
    setTransaction,
    setConditions,
    processReturn
  }
}
```

---

## 🔒 Simple Security

### Basic Validation

```typescript
export const returnRequestSchema = z.object({
  items: z.array(z.object({
    itemId: z.string().uuid(),
    kondisiAkhir: z.string().min(1).max(500),
    jumlahKembali: z.number().positive().int()
  })).min(1),
  catatan: z.string().max(1000).optional()
})
```

### API Protection

```typescript
export async function PUT(request: NextRequest, { params }: RouteParams) {
  // 1. Auth check
  const authResult = await requirePermission('transaksi', 'update')
  if (authResult.error) return authResult.error
  
  // 2. Rate limiting  
  const rateLimitResult = await withRateLimit(`return-${clientIP}`, 10, 60000)
  if (rateLimitResult.error) return rateLimitResult.error
  
  // 3. Input validation
  const validatedData = returnRequestSchema.parse(await request.json())
  
  // 4. Process return
  const result = await returnService.processReturn(params.id, validatedData)
  
  return NextResponse.json({ success: true, data: result })
}
```

---

## 📊 Simple Integration Points

### Existing Component Integration

#### ActionButtonPanel Extension

```typescript
// Add to existing ActionButtonPanel.tsx
case 'return':
  if (transaction.status === 'sudah diambil') {
    // Open return modal/page
    router.push(`/dashboard/transactions/${transaction.id}/return`)
  }
  break
```

#### Transaction Detail Page

```typescript
// Add return option to TransactionDetailPage.tsx
{transaction.status === 'sudah diambil' && (
  <Button onClick={() => handleReturn()}>
    <CheckCircle className="h-4 w-4 mr-2" />
    Proses Pengembalian
  </Button>
)}
```

### Navigation Integration

```typescript
// Add to kasir dashboard navigation
{
  path: '/dashboard/transactions/return',
  label: 'Pengembalian',
  icon: CheckCircle,
  roles: ['owner', 'kasir']
}
```

---

## ✅ Simple Success Metrics

### Technical Targets

| **Metric** | **Target** | **Simple Check** |
|------------|------------|------------------|
| **API Response** | <200ms | Timer in dev tools |
| **UI Response** | <100ms | Click to feedback |
| **Error Rate** | <1% | Error monitoring |
| **Uptime** | >99% | Health checks |

### Business Targets

| **Metric** | **Target** | **Tracking** |
|------------|------------|--------------|
| **Process Time** | <5 minutes | User analytics |
| **Success Rate** | >95% | Transaction logs |
| **User Satisfaction** | >4.5/5 | Feedback forms |

---

## 🚀 Simple Implementation Plan

### Phase 1: Backend (Days 1-2)
1. ✅ Create `returnSchema.ts` validation
2. ✅ Build `PenaltyCalculator` utility  
3. ✅ Extend `TransaksiService` with return methods
4. ✅ Create return API endpoint
5. ✅ Add basic unit tests

### Phase 2: Frontend (Days 3-4)  
1. ✅ Build `ReturnProcessPage` container
2. ✅ Create search, condition, penalty, confirmation components
3. ✅ Add `useReturnProcess` hook
4. ✅ Integrate with existing navigation

### Phase 3: Integration (Day 5)
1. ✅ Connect frontend to backend
2. ✅ Add return button to existing pages  
3. ✅ Test complete workflow
4. ✅ Handle edge cases and errors

### Phase 4: Polish (Days 6-7)
1. ✅ Add comprehensive error handling
2. ✅ Improve UI/UX based on testing
3. ✅ Add E2E tests for full workflow
4. ✅ Performance optimization

---

## 🎉 Simple Deployment

### Feature Flag

```typescript
// Simple feature toggle
export const useReturnFeature = () => {
  return process.env.NEXT_PUBLIC_ENABLE_RETURNS === 'true'
}
```

### Zero-Downtime Rollout

1. **Deploy backend** - New API endpoint (no breaking changes)
2. **Deploy frontend** - New components (feature flagged)  
3. **Enable feature** - Toggle feature flag
4. **Monitor** - Watch for issues, rollback if needed

---

## 📝 Simple Documentation

### For Developers

1. **README Update** - Add return process to project README
2. **API Docs** - OpenAPI spec for return endpoint  
3. **Component Docs** - Storybook stories for new components

### For Users

1. **User Guide** - Step-by-step return process
2. **FAQ** - Common questions and troubleshooting
3. **Training** - Kasir training materials

---

## 🏁 Conclusion

This simple design achieves all TSK-23 requirements while maintaining:

- ✅ **Simplicity** - Easy to understand and maintain
- ✅ **Consistency** - Follows existing patterns exactly  
- ✅ **Zero Breaking Changes** - Uses existing schema and components
- ✅ **Performance** - Meets all technical requirements
- ✅ **Security** - Proper validation and authorization
- ✅ **Maintainability** - Clean, simple code structure

The design is production-ready and can be implemented in 7 days following the planned phases.

---

*Design Document Version: 1.0*  
*Created: 2025-01-27*  
*Status: Ready for Implementation*  
*Complexity: Simple & Clean*