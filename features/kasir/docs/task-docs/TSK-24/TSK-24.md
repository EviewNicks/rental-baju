# TSK-23 Return System - Architecture Troubleshoot Report

**Date**: 7 Agustus 2025  
**Report Type**: Design Architecture Evaluation & Improvement Recommendations  
**Scope**: Multi-Condition Item Return Handling  
**Status**: =4 **CRITICAL DESIGN GAP IDENTIFIED**

---

## =� Executive Summary

**CRITICAL ISSUE DISCOVERED**: Current return system **cannot handle multiple conditions for items with quantity > 1**. This creates a significant business logic gap where real-world scenarios cannot be properly processed.

**Business Impact**: **HIGH** - Blocks accurate penalty calculation and inventory management for partial condition scenarios.

**Example Blocking Scenario**:

- Item: "Gaun Pesta" (quantity: 3, diambil: 3)
- Actual return: 1 hilang, 2 kondisi baik
- **Current system limitation**: Must choose between "All lost (penalty all)" OR "All good (no penalty)"
- **Required**: Split handling - 1 lost (penalty) + 2 good (no penalty)

---

## =� Architecture Gap Analysis

### =

**Problem 1: Single Condition per TransactionItem**

**Current Design Limitation** (`ItemConditionForm.tsx:132-147`):

```typescript
// PROBLEM: Forces entire quantity to one condition
if (isLostItem) {
  newConditions[itemId].jumlahKembali = 0 // ALL items = lost
} else if (localConditions[itemId]?.jumlahKembali === 0) {
  newConditions[itemId].jumlahKembali = item.jumlahDiambil // ALL items = returned
}
```

**Business Logic Gap**:

- L **Current**: 1 TransactionItem = 1 Condition = All Quantity
-  **Required**: 1 TransactionItem = Multiple Conditions = Split Quantity

**Real-World Example**:

```yaml
Transaction_Item: "Kemeja Batik" (quantity: 5)
Actual_Return_Scenario:
  - 2_items: "Hilang/tidak dikembalikan" (penalty: modalAwal each)
  - 2_items: "Baik - tidak ada kerusakan" (no penalty)
  - 1_item: "Cukup - ada noda ringan" (penalty: 5K)

Current_System_Cannot:
  - Split the 5 items into different conditions
  - Calculate mixed penalties accurately
  - Track partial returns with different states
```

### =

**Problem 2: Database Schema Design Constraint**

**Current Schema Limitation**:

```sql
-- CURRENT: Single condition per transaction item
TransaksiItem {
  id: String,
  kondisiAkhir: String,      -- L One condition for all quantity
  jumlahKembali: Number,     -- L One quantity for entire item
  statusKembali: String      -- L Single status (lengkap/belum)
}
```

**Schema Issues**:

1. **Atomic Condition**: `kondisiAkhir` cannot represent multiple conditions
2. **Atomic Quantity**: `jumlahKembali` cannot split quantities
3. **Binary Status**: `statusKembali` cannot represent partial returns
4. **Missing Granularity**: No individual item tracking within quantity

**Required Schema Enhancement**:

```sql
-- PROPOSED: Multiple condition support
TransaksiItemReturn {
  id: String,
  transaksiItemId: String,   -- Links to original transaction item
  kondisiAkhir: String,      -- Condition for this specific batch
  jumlahKembali: Number,     -- Quantity for this specific condition
  penalty: Decimal,          -- Calculated penalty for this batch
  createdAt: DateTime
}

-- ENHANCED: Original item with tracking
TransaksiItem {
  id: String,
  jumlahKembaliTotal: Number, --  Total returned across all conditions
  statusKembali: String,      --  "partial" | "lengkap" | "belum"
  returns: TransaksiItemReturn[] --  Multiple return entries
}
```

### =

**Problem 3: UI/UX Design Limitation**

**Current Form Design** (`ItemConditionForm.tsx`):

```typescript
// LIMITATION: Single condition dropdown per item
<Select
  value={condition?.kondisiAkhir || ''}
  onValueChange={(value) => handleConditionChange(item.id, 'kondisiAkhir', value)}
>
  {CONDITION_OPTIONS.map((option) => (
    <SelectItem key={option} value={option}>
      {option}
    </SelectItem>
  ))}
</Select>

// LIMITATION: Single quantity input per item
<Input
  type="number"
  value={condition?.jumlahKembali ?? item.jumlahDiambil}
  onChange={(e) => handleConditionChange(item.id, 'jumlahKembali', parseInt(e.target.value))}
/>
```

**UX Problems**:

1. **No Multi-Condition Interface**: Cannot input different conditions for same item
2. **Quantity Constraint**: Cannot split quantities across conditions
3. **User Confusion**: Forces unnatural business decisions
4. **Penalty Inaccuracy**: Cannot calculate mixed penalties correctly

---

## =� Improvement Recommendations

### <� **Recommendation 1: Multi-Condition Architecture (HIGH PRIORITY)**

**Enhanced Component Design**:

```typescript
// PROPOSED: Multi-condition interface
interface ItemConditionSplit {
  kondisiAkhir: string
  jumlahKembali: number
  penalty?: number
}

interface MultiConditionForm {
  [itemId: string]: ItemConditionSplit[] // Multiple conditions per item
}
```

**Implementation Pattern**:

```typescript
// Enhanced ItemConditionForm with condition splits
const ItemConditionForm = () => {
  const [conditionSplits, setConditionSplits] = useState<MultiConditionForm>({})

  // Allow multiple condition entries per item
  const addConditionSplit = (itemId: string) => {
    const newSplit: ItemConditionSplit = {
      kondisiAkhir: '',
      jumlahKembali: 0,
      penalty: 0,
    }

    setConditionSplits((prev) => ({
      ...prev,
      [itemId]: [...(prev[itemId] || []), newSplit],
    }))
  }

  // Validate total quantities match
  const validateTotalQuantity = (itemId: string): boolean => {
    const item = returnableItems.find((i) => i.id === itemId)
    const totalReturned =
      conditionSplits[itemId]?.reduce((sum, split) => sum + split.jumlahKembali, 0) || 0

    return totalReturned <= item?.jumlahDiambil
  }
}
```

**UI/UX Enhancement**:

```typescript
// Multi-condition interface design
<Card>
  <h4>Kemeja Batik (Diambil: 5 item)</h4>

  {/* Condition Split 1 */}
  <div className="condition-split">
    <Select placeholder="Kondisi">
      <SelectItem value="Baik - tidak ada kerusakan">Baik</SelectItem>
      <SelectItem value="Hilang/tidak dikembalikan">Hilang</SelectItem>
    </Select>
    <Input type="number" placeholder="Jumlah" max={5} />
    <Button variant="ghost" size="sm">Hapus Split</Button>
  </div>

  {/* Add Split Button */}
  <Button onClick={() => addConditionSplit(itemId)}>
    + Tambah Kondisi Lain
  </Button>

  {/* Quantity Validation */}
  <p className="text-sm">
    Total: {totalReturned}/5 item - Sisa: {5 - totalReturned} item
  </p>
</Card>
```

### <� **Recommendation 2: Database Schema Migration (MEDIUM PRIORITY)**

**Migration Strategy**:

**Phase A: Non-Breaking Enhancement**

```sql
-- Add new table without breaking existing functionality
CREATE TABLE TransaksiItemReturn (
  id UUID PRIMARY KEY,
  transaksiItemId UUID REFERENCES TransaksiItem(id),
  kondisiAkhir TEXT NOT NULL,
  jumlahKembali INTEGER NOT NULL CHECK (jumlahKembali > 0),
  penalty DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  createdBy UUID
);

-- Add tracking fields to existing table
ALTER TABLE TransaksiItem
ADD COLUMN jumlahKembaliTotal INTEGER DEFAULT 0,
ADD COLUMN hasMultipleConditions BOOLEAN DEFAULT FALSE;

-- Create index for performance
CREATE INDEX idx_transaksi_item_return_item_id ON TransaksiItemReturn(transaksiItemId);
```

**Phase B: Backward Compatibility**

```typescript
// Service layer adaptation
export class EnhancedReturnService extends ReturnService {
  // Support both single and multi-condition returns
  async processReturnEnhanced(
    transaksiId: string,
    request: EnhancedReturnRequest,
  ): Promise<ReturnResult> {
    return await this.prisma.$transaction(async (tx) => {
      for (const itemReturn of request.items) {
        if (itemReturn.conditionSplits && itemReturn.conditionSplits.length > 1) {
          // Multi-condition processing
          await this.processMultiConditionReturn(tx, itemReturn)
        } else {
          // Legacy single condition processing
          await this.processSingleConditionReturn(tx, itemReturn)
        }
      }
    })
  }

  private async processMultiConditionReturn(tx: PrismaTransaction, itemReturn: EnhancedItemReturn) {
    let totalPenalty = 0
    let totalReturned = 0

    for (const split of itemReturn.conditionSplits) {
      // Create individual return record
      await tx.transaksiItemReturn.create({
        data: {
          transaksiItemId: itemReturn.itemId,
          kondisiAkhir: split.kondisiAkhir,
          jumlahKembali: split.jumlahKembali,
          penalty: split.calculatedPenalty,
          createdBy: this.userId,
        },
      })

      totalPenalty += split.calculatedPenalty
      totalReturned += split.jumlahKembali
    }

    // Update main transaction item
    await tx.transaksiItem.update({
      where: { id: itemReturn.itemId },
      data: {
        jumlahKembaliTotal: { increment: totalReturned },
        hasMultipleConditions: true,
        statusKembali: totalReturned === itemReturn.originalQuantity ? 'lengkap' : 'partial',
      },
    })

    return { totalPenalty, totalReturned }
  }
}
```

### <� **Recommendation 3: Enhanced Penalty Calculation (MEDIUM PRIORITY)**

**Multi-Condition Penalty Logic**:

```typescript
// Enhanced penalty calculator
export class MultiConditionPenaltyCalculator extends PenaltyCalculator {
  static calculateMultiConditionPenalty(
    expectedDate: Date,
    actualDate: Date,
    conditionSplits: ItemConditionSplit[],
    modalAwal?: number,
  ): MultiConditionPenaltyResult {
    let totalPenalty = 0
    const penaltyBreakdown: ConditionPenaltyBreakdown[] = []

    const lateDays = this.calculateLateDays(expectedDate, actualDate)
    const lateRatePerDay = 5000

    for (const split of conditionSplits) {
      const latePenalty = lateDays * lateRatePerDay * split.jumlahKembali
      const conditionPenalty = this.calculateConditionPenalty(
        split.kondisiAkhir,
        split.jumlahKembali,
        modalAwal,
      )

      const splitTotal = latePenalty + conditionPenalty
      totalPenalty += splitTotal

      penaltyBreakdown.push({
        kondisiAkhir: split.kondisiAkhir,
        jumlahKembali: split.jumlahKembali,
        latePenalty,
        conditionPenalty,
        totalPenalty: splitTotal,
      })
    }

    return {
      totalPenalty,
      lateDays,
      breakdown: penaltyBreakdown,
    }
  }
}
```

### <� **Recommendation 4: API Enhancement (LOW PRIORITY)**

**Enhanced Request/Response Format**:

```typescript
// Enhanced request schema
interface EnhancedReturnRequest {
  items: EnhancedItemReturn[]
  catatan?: string
  tglKembali?: string
}

interface EnhancedItemReturn {
  itemId: string
  conditionSplits: ItemConditionSplit[]
  // Backward compatibility
  kondisiAkhir?: string
  jumlahKembali?: number
}

// Enhanced response format
interface EnhancedReturnResponse {
  success: boolean
  data: {
    transaksiId: string
    totalPenalty: number
    processedItems: EnhancedProcessedItem[]
    penaltyBreakdown: {
      totalLateDays: number
      multiConditionSummary: {
        totalConditionSplits: number
        normalItems: number
        damagedItems: number
        lostItems: number
        mixedConditionItems: number
      }
    }
  }
  message: string
}
```

---

## =� Implementation Priority Matrix

| **Component**              | **Priority** | **Effort** | **Impact**   | **Timeline** |
| -------------------------- | ------------ | ---------- | ------------ | ------------ |
| **Multi-Condition UI**     | =4 HIGH      | 3-4 days   | **CRITICAL** | Phase 2.5    |
| **Enhanced Backend Logic** | =4 HIGH      | 2-3 days   | **CRITICAL** | Phase 2.5    |
| **Database Migration**     | =� MEDIUM    | 2 days     | HIGH         | Phase 3      |
| **API Enhancement**        | =� LOW       | 1 day      | MEDIUM       | Phase 3      |

---

## =� Business Impact Analysis

### <� **Current System Limitations Impact**

**Accuracy Issues**:

- L **Penalty Calculation**: Forced to choose all-or-nothing penalty scenarios
- L **Inventory Tracking**: Cannot track partial condition returns accurately
- L **Financial Reporting**: Inaccurate penalty revenue calculations
- L **Customer Experience**: Unfair penalty assessments

**Operational Issues**:

- � **Manual Workarounds**: Kasir may need to create multiple transactions
- � **Data Inconsistency**: Forced simplification creates incorrect records
- � **Audit Problems**: Cannot trace actual item conditions accurately

### <� **Enhanced System Benefits**

**Business Benefits**:

-  **Accurate Penalties**: Fair calculation based on actual item conditions
-  **Better Inventory Management**: Precise tracking of item conditions
-  **Improved Customer Experience**: Transparent and fair penalty assessment
-  **Enhanced Reporting**: Detailed condition-based analytics

**Technical Benefits**:

-  **Data Accuracy**: True representation of business reality
-  **Scalability**: Supports complex rental scenarios
-  **Maintainability**: Clear separation of concerns
-  **Audit Trail**: Complete tracking of all return decisions

---

## =� Immediate Action Items

### =� **Phase 2.5: Multi-Condition MVP (Next Sprint)**

**Week 1: UI Enhancement**

1.  **Design Review**: Finalize multi-condition interface design
2.  **Component Development**: Build condition split interface
3.  **Validation Logic**: Implement quantity split validation
4.  **Integration Testing**: Connect with existing backend

**Week 2: Backend Enhancement**

1.  **Service Layer**: Enhance return processing logic
2.  **Penalty Calculator**: Add multi-condition support
3.  **API Compatibility**: Maintain backward compatibility
4.  **Testing**: Comprehensive test coverage

### =� **Success Metrics**

**Technical Metrics**:

- **Flexibility**: Support 1-5 condition splits per item
- **Performance**: <300ms response time for multi-condition processing
- **Accuracy**: 100% penalty calculation accuracy for mixed conditions
- **Compatibility**: 100% backward compatibility with existing transactions

**Business Metrics**:

- **Penalty Accuracy**: More precise penalty calculations
- **Process Efficiency**: No workarounds needed for mixed conditions
- **Customer Satisfaction**: Fair and transparent penalty assessment
- **Operational Clarity**: Clear audit trail for all return decisions

---

## =

**Root Cause Summary**

**Primary Issue**: **Architecture Design Assumption**

- Original design assumed 1 item = 1 condition = 1 penalty scenario
- Real business requires 1 item = multiple conditions = mixed penalties

**Secondary Issues**: **Implementation Constraints**

- Database schema enforces single condition per transaction item
- UI/UX design doesn't support condition splitting
- Penalty calculator lacks multi-condition logic

**Tertiary Issues**: **Business Process Gap**

- No clear process for handling partial condition scenarios
- Manual workarounds create data inconsistencies
- Customer experience suffers from forced simplifications

---

##  **Conclusion & Next Steps**

**Current Status**: =4 **CRITICAL DESIGN GAP** - Multi-condition support missing

**Required Action**: **Immediate architecture enhancement** to support real-world business scenarios

**Implementation Path**:

1. **Phase 2.5**: Multi-condition UI and backend logic (**HIGH PRIORITY**)
2. **Phase 3**: Database schema migration and API enhancement
3. **Phase 4**: Advanced reporting and analytics integration

**Success Criteria**: System can handle real-world scenario of 1 item with multiple conditions and calculate accurate mixed penalties.

---

**Report Prepared By**: Claude Code SuperClaude Framework  
**Review Status**: Ready for Technical Review  
**Next Review Date**: Post Phase 2.5 Implementation

---

_This troubleshooting report identifies critical gaps in the current TSK-23 return system design and provides comprehensive recommendations for supporting multi-condition item returns, ensuring the system can handle real-world rental business scenarios accurately and efficiently._
