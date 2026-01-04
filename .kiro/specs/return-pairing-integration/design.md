# Design Document: Return-Pairing Integration

## Overview

This design addresses the critical compatibility issues between the jas-sarung pairing system and the return system that are causing database errors and item lookup failures. The solution focuses on creating a robust integration layer that handles data format differences, dual stock restoration conflicts, penalty calculation adjustments, and return validation inconsistencies while maintaining backward compatibility with existing transactions.

The core challenge is that the pairing system stores `kondisiAwal` as JSON format with `linkedSarung` data, while the return system expects pipe-separated format (`"productSizeId|size|ageCategory|condition"`). This mismatch causes `productSizeId` extraction to fail, leading to database update errors during return operations. Additionally, the return system needs to handle dual stock restoration (both jas and sarung), ensure penalty calculation only applies to jas items, and implement auto-selection UI behavior for paired items.

## Architecture

### System Integration Overview

```
Pairing System (JSON Format)
    ↓
Integration Layer (Format Adapter + Auto-Selection)
    ↓
Return System (Enhanced with Dual Stock Restoration)
```

The integration layer acts as an adapter that:
1. Detects data format (JSON vs pipe-separated)
2. Extracts required data using appropriate parsing logic
3. Handles dual stock restoration based on item pairing status
4. Implements auto-selection behavior for paired items in UI
5. Ensures penalty calculation only applies to jas items
6. Provides consistent error handling and logging

### Component Architecture

```
ReturnService (Enhanced)
├── KondisiAwalParser (REUSE from pickup)
│   ├── parseKondisiAwalEnhanced()
│   ├── detectFormat()
│   └── extractProductSizeId()
├── PairingAwareStockManager (NEW for Return)
│   ├── processStockForReturn()
│   ├── restoreJasStock()
│   ├── restoreLinkedSarungStock()
│   └── logStockOperation()
├── PairingReturnValidator (NEW)
│   ├── validatePairedReturn()
│   ├── ensurePairedItemsTogether()
│   └── validateQuantityRatio()
├── PairingPenaltyCalculator (NEW)
│   ├── calculatePairingPenalty()
│   ├── applyJasOnlyPenalty()
│   └── skipSarungPenalty()
├── AutoSelectionManager (NEW)
│   ├── autoSelectLinkedSarung()
│   ├── preventSarungDeselection()
│   └── syncPairedSelection()
├── Enhanced Error Handling
│   ├── PairingReturnErrorClassifier
│   └── ContextualErrorMessages
└── Audit Logger (Enhanced)
    ├── logPairingReturnContext()
    └── logDualStockRestoration()
```

## Components and Interfaces

### Enhanced KondisiAwalParser (REUSE from pickup-pairing-integration)

**Purpose**: Reuse the existing enhanced parser from pickup-pairing integration that already supports JSON format with linkedSarung data.

```typescript
// Reuse existing enhanced interface from pickup integration
import { parseKondisiAwalEnhanced, EnhancedKondisiAwalData } from '../lib/utils/kondisiAwalParser'

// The parser already supports:
// - JSON format with linkedSarung data
// - Pipe-separated format fallback
// - Error handling and logging
// - Backward compatibility
```

### PairingAwareStockManager for Returns

**Purpose**: Handle stock restoration with awareness of pairing relationships, restoring stock for both jas and linked sarung items.

```typescript
class PairingAwareStockManager {
  constructor(
    private inventoryService: InventoryService,
    private logger: Logger
  ) {}
  
  async processStockForReturn(
    kondisiAwal: string | null,
    quantity: number,
    itemId: string,
    logger?: Logger
  ): Promise<void> {
    // Import here to avoid circular dependency
    const { parseKondisiAwalEnhanced } = await import('../lib/utils/kondisiAwalParser')
    
    const kondisiData = parseKondisiAwalEnhanced(kondisiAwal)
    
    if (!kondisiData?.productSizeId) {
      logger?.warn('Could not extract productSizeId from kondisiAwal', {
        itemId,
        kondisiAwal,
        reason: 'parsing_failed'
      })
      return // Skip stock restoration but continue return
    }
    
    try {
      // Check if this item has linkedSarung for dual restoration
      const linkedSarungSizeId = kondisiData.linkedSarung?.productSizeId
      
      if (linkedSarungSizeId) {
        // Dual restoration for jas-sarung pairing
        await this.inventoryService.updateStockOnReturn(kondisiData.productSizeId, quantity, linkedSarungSizeId)
        
        logger?.info('Dual stock restoration completed for jas-sarung pairing', {
          itemId,
          jasProductSizeId: kondisiData.productSizeId,
          sarungProductSizeId: linkedSarungSizeId,
          quantity
        })
      } else {
        // Single restoration for regular items
        await this.inventoryService.updateStockOnReturn(kondisiData.productSizeId, quantity)
        
        logger?.info('Stock restoration completed for regular item', {
          itemId,
          productSizeId: kondisiData.productSizeId,
          quantity
        })
      }
    } catch (error) {
      logger?.error('Stock restoration failed', {
        itemId,
        productSizeId: kondisiData.productSizeId,
        linkedSarungSizeId: kondisiData.linkedSarung?.productSizeId,
        quantity,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Don't throw error - continue return process
      // Stock inconsistency is better than failed return
    }
  }
}
```

### Enhanced InventoryService with Return Support

**Modified updateStockOnReturn method to support dual restoration**:

```typescript
// Add to InventoryService class
async updateStockOnReturn(sizeId: string, quantity: number, linkedSarungSizeId?: string): Promise<void> {
  if (quantity <= 0) {
    throw new Error('Quantity must be greater than 0')
  }

  try {
    // If no linked sarung, use existing single restoration logic
    if (!linkedSarungSizeId) {
      await this.prisma.productSize.update({
        where: { id: sizeId },
        data: {
          rentedQuantity: { decrement: quantity },
          availableQuantity: { increment: quantity },
        },
      })
      return
    }

    // Dual restoration for jas-sarung pairing (atomic transaction)
    await this.prisma.$transaction([
      // Restore stock for main item (jas)
      this.prisma.productSize.update({
        where: { id: sizeId },
        data: {
          rentedQuantity: { decrement: quantity },
          availableQuantity: { increment: quantity },
        },
      }),
      // Restore stock for linked sarung (1:1 ratio)
      this.prisma.productSize.update({
        where: { id: linkedSarungSizeId },
        data: {
          rentedQuantity: { decrement: quantity },
          availableQuantity: { increment: quantity },
        },
      }),
    ])
  } catch (error) {
    throw new Error(
      `Failed to update stock on return: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}
```

### PairingReturnValidator

**Purpose**: Validate that paired items are returned together and maintain proper ratios.

```typescript
interface PairingReturnValidation {
  isValid: boolean
  errors: string[]
  pairingInfo?: {
    jasItemId: string
    sarungItemId: string
    requiredTogether: boolean
  }
}

class PairingReturnValidator {
  static validatePairedReturn(
    returnItems: Array<{
      itemId: string
      kondisiAwal: string | null
      quantity: number
    }>,
    transactionItems: Array<{
      id: string
      kondisiAwal: string | null
    }>
  ): PairingReturnValidation {
    const errors: string[] = []
    const pairingMap = new Map<string, string>() // jasItemId -> sarungItemId
    
    // Build pairing map from transaction items
    for (const item of transactionItems) {
      const kondisiData = parseKondisiAwalEnhanced(item.kondisiAwal)
      if (kondisiData?.linkedSarung?.productSizeId) {
        // This is a jas with linked sarung
        pairingMap.set(item.id, kondisiData.linkedSarung.productSizeId)
      }
    }
    
    // Validate that paired items are returned together
    for (const returnItem of returnItems) {
      const linkedSarungId = pairingMap.get(returnItem.itemId)
      
      if (linkedSarungId) {
        // This is a jas item with pairing - check if sarung is also being returned
        const sarungReturn = returnItems.find(ri => {
          const transactionItem = transactionItems.find(ti => ti.id === ri.itemId)
          if (!transactionItem) return false
          
          const kondisiData = parseKondisiAwalEnhanced(transactionItem.kondisiAwal)
          return kondisiData?.productSizeId === linkedSarungId
        })
        
        if (!sarungReturn) {
          errors.push(`Jas item ${returnItem.itemId} must be returned together with its paired sarung`)
        } else if (sarungReturn.quantity !== returnItem.quantity) {
          errors.push(`Paired items must have equal quantities: jas=${returnItem.quantity}, sarung=${sarungReturn.quantity}`)
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      pairingInfo: pairingMap.size > 0 ? {
        jasItemId: Array.from(pairingMap.keys())[0],
        sarungItemId: Array.from(pairingMap.values())[0],
        requiredTogether: true
      } : undefined
    }
  }
}
```

### PairingPenaltyCalculator

**Purpose**: Ensure penalty calculation only applies to jas items in pairings, with sarung items having zero penalty.

```typescript
interface PairingPenaltyResult {
  jasItemId: string
  jasPenalty: number
  sarungItemId?: string
  sarungPenalty: number // Always 0 for paired sarung
  totalPenalty: number
  pairingApplied: boolean
}

class PairingPenaltyCalculator {
  static calculatePairingPenalty(
    jasItem: {
      itemId: string
      kondisiAwal: string | null
      modalAwal: number
      kondisiAkhir: string
      quantity: number
    },
    penaltyRate: number = 0.1 // 10% default penalty rate
  ): PairingPenaltyResult {
    const kondisiData = parseKondisiAwalEnhanced(jasItem.kondisiAwal)
    
    if (!kondisiData?.linkedSarung) {
      // Not a paired item, calculate normal penalty
      const penalty = jasItem.modalAwal * penaltyRate * jasItem.quantity
      return {
        jasItemId: jasItem.itemId,
        jasPenalty: penalty,
        sarungPenalty: 0,
        totalPenalty: penalty,
        pairingApplied: false
      }
    }
    
    // Paired item - penalty only for jas, sarung is free
    const jasPenalty = jasItem.modalAwal * penaltyRate * jasItem.quantity
    
    return {
      jasItemId: jasItem.itemId,
      jasPenalty,
      sarungItemId: kondisiData.linkedSarung.productSizeId,
      sarungPenalty: 0, // Sarung is always free in pairing
      totalPenalty: jasPenalty, // Only jas penalty counts
      pairingApplied: true
    }
  }
}
```

### AutoSelectionManager

**Purpose**: Handle automatic selection behavior for paired items in the return UI.

```typescript
interface AutoSelectionState {
  selectedItems: Set<string>
  pairedItems: Map<string, string> // jasItemId -> sarungItemId
  disabledItems: Set<string> // Items that cannot be manually toggled
}

class AutoSelectionManager {
  private state: AutoSelectionState
  
  constructor(transactionItems: Array<{ id: string; kondisiAwal: string | null }>) {
    this.state = {
      selectedItems: new Set(),
      pairedItems: new Map(),
      disabledItems: new Set()
    }
    
    // Build pairing map
    this.buildPairingMap(transactionItems)
  }
  
  private buildPairingMap(transactionItems: Array<{ id: string; kondisiAwal: string | null }>) {
    for (const item of transactionItems) {
      const kondisiData = parseKondisiAwalEnhanced(item.kondisiAwal)
      if (kondisiData?.linkedSarung?.productSizeId) {
        // Find the sarung item in transaction
        const sarungItem = transactionItems.find(ti => {
          const sarungKondisi = parseKondisiAwalEnhanced(ti.kondisiAwal)
          return sarungKondisi?.productSizeId === kondisiData.linkedSarung?.productSizeId
        })
        
        if (sarungItem) {
          this.state.pairedItems.set(item.id, sarungItem.id)
          // Sarung items are not directly selectable
          this.state.disabledItems.add(sarungItem.id)
        }
      }
    }
  }
  
  selectItem(itemId: string): AutoSelectionState {
    this.state.selectedItems.add(itemId)
    
    // If this is a jas with paired sarung, auto-select the sarung
    const pairedSarungId = this.state.pairedItems.get(itemId)
    if (pairedSarungId) {
      this.state.selectedItems.add(pairedSarungId)
    }
    
    return { ...this.state }
  }
  
  deselectItem(itemId: string): AutoSelectionState {
    this.state.selectedItems.delete(itemId)
    
    // If this is a jas with paired sarung, auto-deselect the sarung
    const pairedSarungId = this.state.pairedItems.get(itemId)
    if (pairedSarungId) {
      this.state.selectedItems.delete(pairedSarungId)
    }
    
    return { ...this.state }
  }
  
  isItemDisabled(itemId: string): boolean {
    return this.state.disabledItems.has(itemId)
  }
  
  getSelectedItems(): string[] {
    return Array.from(this.state.selectedItems)
  }
}
```

### Enhanced ReturnService Integration

**Modified processUnifiedReturn method with pairing awareness**:

```typescript
async processUnifiedReturn(
  transaksiId: string,
  request: UnifiedReturnRequest,
): Promise<UnifiedReturnProcessingResult> {
  // ... existing validation logic ...

  // NEW: Validate pairing requirements
  const pairingValidation = PairingReturnValidator.validatePairedReturn(
    request.items.map(item => ({
      itemId: item.itemId,
      kondisiAwal: transactionItems.find(ti => ti.id === item.itemId)?.kondisiAwal || null,
      quantity: item.conditions.reduce((sum, c) => sum + c.jumlahKembali, 0)
    })),
    transactionItems
  )
  
  if (!pairingValidation.isValid) {
    throw new Error(`Pairing validation failed: ${pairingValidation.errors.join(', ')}`)
  }

  const result = await this.prisma.$transaction(async (tx) => {
    // ... existing return record creation ...
    
    // ENHANCED: Stock restoration with pairing awareness
    const txInventoryService = createInventoryService(tx as any)
    const stockManager = new PairingAwareStockManager(txInventoryService, console)
    
    for (const item of request.items) {
      const transactionItem = transactionItems.find(ti => ti.id === item.itemId)
      if (transactionItem) {
        const totalQuantity = item.conditions.reduce((sum, c) => sum + c.jumlahKembali, 0)
        
        await stockManager.processStockForReturn(
          transactionItem.kondisiAwal,
          totalQuantity,
          item.itemId,
          console
        )
      }
    }
    
    // ... rest of existing logic ...
  })

  return result
}
```

## Data Models

### Enhanced kondisiAwal Format Support (Reuse from pickup)

**JSON Format (Pairing System)**:
```json
{
  "productSizeId": "uuid-here",
  "size": "M",
  "ageCategory": "ADULT",
  "condition": "baik",
  "linkedSarung": {
    "productId": "sarung-uuid",
    "productSizeId": "sarung-size-uuid",
    "quantity": 1
  }
}
```

**Pipe Format (Legacy System)**:
```
"uuid-here|M|ADULT|baik"
```

### Stock Management Decision Matrix for Returns

| Item Type | Has linkedSarung | Action |
|-----------|------------------|--------|
| Jas | Yes | Restore stock for jas AND linked sarung (1:1 ratio) |
| Jas | No | Restore stock normally |
| Sarung (standalone) | No | Restore stock normally |
| Other items | No | Restore stock normally |

**Note**: Paired sarung items are not displayed separately in return UI - they are handled automatically when their paired jas is returned.

### Penalty Calculation Decision Matrix

| Item Type | Has linkedSarung | Penalty Calculation |
|-----------|------------------|-------------------|
| Jas | Yes | Apply penalty to jas only, sarung penalty = 0 |
| Jas | No | Apply normal penalty calculation |
| Sarung (standalone) | No | Apply normal penalty calculation |
| Other items | No | Apply normal penalty calculation |

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

After reviewing all properties identified in the prework, I identified several areas where properties can be combined for better coverage:

**Property Reflection:**
- Properties 1.1, 1.3, and 11.1 all test format compatibility and can be combined into one comprehensive property
- Properties 2.1 and 2.2 both test dual stock restoration and can be combined
- Properties 5.1 and 5.2 both test penalty calculation for pairings and can be combined
- Properties 6.1, 6.2, and 6.4 all test pairing validation and can be combined
- Properties 3.1, 3.2, and 3.3 all test auto-selection behavior and can be combined

### Converting EARS to Properties

Property 1: Format compatibility and backward compatibility
*For any* kondisiAwal string in either JSON format (with or without linkedSarung) or pipe-separated format, the enhanced parser should successfully extract productSizeId or return null gracefully, maintaining backward compatibility with existing transactions
**Validates: Requirements 1.1, 1.3, 1.5, 11.1, 11.2**

Property 2: Graceful parsing failure handling
*For any* invalid or malformed kondisiAwal data, the system should log a warning and continue return processing without stock restoration
**Validates: Requirements 1.4, 8.1, 8.3**

Property 3: Dual stock restoration for pairings
*For any* jas item with linkedSarung data, stock restoration should occur for BOTH the jas item AND the linked sarung item using 1:1 ratio, while regular items continue to work normally
**Validates: Requirements 2.1, 2.2, 2.3**

Property 4: Auto-selection behavior for paired items
*For any* jas item with linkedSarung, selecting the jas should automatically select the sarung, deselecting the jas should deselect the sarung, and the sarung should not be manually deselectable while jas is selected
**Validates: Requirements 3.1, 3.2, 3.3**

Property 5: Pairing display format consistency
*For any* jas item with linkedSarung data, the display format should follow "Jas Name (Category Size) + Sarung Name (Category Size)" pattern and include pairing information in all relevant contexts
**Validates: Requirements 4.1, 4.2, 4.3, 4.5**

Property 6: Paired sarung filtering
*For any* transaction with paired items, sarung items that are part of pairings should be filtered out from direct selection in return UI
**Validates: Requirements 4.4**

Property 7: Penalty calculation for pairings
*For any* jas-sarung pairing, penalty calculation should apply only to the jas item using its modalAwal, while the sarung penalty should always be zero, and non-paired items should use existing penalty logic
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

Property 8: Pairing validation requirements
*For any* return request involving paired items, the system should require both jas and sarung to be returned together with equal quantities, and prevent return of sarung without corresponding jas
**Validates: Requirements 6.1, 6.2, 6.4**

Property 9: Partial return pairing atomicity
*For any* partial return involving paired items, the pairing should be treated as a single atomic unit that cannot be split
**Validates: Requirements 6.3**

Property 10: Pairing validation error messages
*For any* validation failure involving paired items, the error message should clearly explain pairing requirements and be distinguishable from general return errors
**Validates: Requirements 6.5, 7.1, 7.2, 7.3, 7.4**

Property 11: System resilience with pairing data
*For any* return operation, stock management failures or data inconsistencies should not prevent the return from completing, and should generate appropriate audit logs
**Validates: Requirements 2.5, 8.2, 8.4, 8.5**

Property 12: Fallback behavior for invalid data
*For any* return operation with invalid JSON or malformed pairing data, the system should fall back to safe behavior and continue processing
**Validates: Requirements 8.1, 8.2, 11.4**

Property 13: Comprehensive audit logging for pairings
*For any* return operation involving pairing data, all relevant pairing context, stock changes, and parsing decisions should be included in activity logs
**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

## Error Handling

### Comprehensive Error Recovery

The integration layer implements a multi-level error recovery strategy:

1. **Parse-level Recovery**: If JSON parsing fails, fall back to pipe format
2. **Extraction-level Recovery**: If productSizeId extraction fails, log and continue without stock restoration
3. **Stock-level Recovery**: If stock restoration fails, log error but complete return
4. **Validation-level Recovery**: Provide clear error messages for pairing validation failures
5. **System-level Recovery**: Provide clear error messages with pairing context

### Error Context Enhancement

```typescript
interface PairingReturnErrorContext {
  transactionId: string
  itemId: string
  kondisiAwal: string | null
  detectedFormat: 'json' | 'pipe' | 'unknown'
  pairingData?: {
    hasLinkedSarung: boolean
    linkedSarungId?: string
    autoSelectionApplied: boolean
  }
  stockOperation: {
    attempted: boolean
    successful: boolean
    skipped: boolean
    reason?: string
  }
  penaltyCalculation: {
    jasOnlyPenalty: boolean
    sarungPenaltySkipped: boolean
  }
}
```

## Testing Strategy

### Unit Testing

**Enhanced KondisiAwalParser Tests (Reuse from pickup):**
- Reuse existing tests from pickup-pairing integration
- Add return-specific test cases for edge cases

**PairingAwareStockManager Tests:**
- Test stock restoration for jas items with pairing
- Test stock restoration for regular items
- Test error handling and logging for restoration failures

**PairingReturnValidator Tests:**
- Test validation of paired items returned together
- Test quantity ratio validation (1:1)
- Test error messages for validation failures

**PairingPenaltyCalculator Tests:**
- Test penalty calculation for jas-only in pairings
- Test zero penalty for sarung in pairings
- Test normal penalty calculation for non-paired items

**AutoSelectionManager Tests:**
- Test auto-selection of sarung when jas is selected
- Test auto-deselection of sarung when jas is deselected
- Test prevention of manual sarung deselection

### Integration Testing

**End-to-End Return Flow:**
- Create transaction with jas-sarung pairing
- Attempt return of jas item
- Verify auto-selection of sarung
- Verify dual stock restoration
- Verify penalty calculation (jas only)
- Verify activity logging includes pairing context

**Error Scenario Testing:**
- Test with corrupted kondisiAwal data
- Test with missing productSizeId in database
- Test with network failures during stock operations
- Test validation failures for incomplete pairings
- Verify graceful degradation in all cases

### Property-Based Testing

Using **fast-check** library for TypeScript with minimum 100 iterations per property test:

**Data Generators:**
```typescript
// Reuse generators from pickup-pairing integration
import { jsonKondisiAwalArb, pipeKondisiAwalArb } from '../pickup-pairing-integration/generators'

// Additional generators for return-specific scenarios
const returnRequestArb = fc.record({
  items: fc.array(fc.record({
    itemId: fc.uuid(),
    conditions: fc.array(fc.record({
      kondisiAkhir: fc.constantFrom('baik', 'rusak', 'hilang'),
      jumlahKembali: fc.integer({ min: 1, max: 5 }),
      modalAwal: fc.integer({ min: 50000, max: 500000 })
    }), { minLength: 1, maxLength: 3 })
  }), { minLength: 1, maxLength: 5 }),
  catatan: fc.option(fc.string())
})
```

**Property Test Examples:**
```typescript
// Feature: return-pairing-integration, Property 1: Format compatibility and backward compatibility
test('kondisiAwal parsing handles both formats for returns', () => {
  fc.assert(fc.property(
    fc.oneof(jsonKondisiAwalArb, pipeKondisiAwalArb),
    (kondisiAwal) => {
      const result = parseKondisiAwalEnhanced(JSON.stringify(kondisiAwal))
      expect(result).toBeTruthy()
      // Should extract productSizeId or handle gracefully
      expect(result?.productSizeId || result?.isLegacyFormat).toBeTruthy()
    }
  ), { numRuns: 100 })
})

// Feature: return-pairing-integration, Property 3: Dual stock restoration for pairings
test('stock restoration for paired items', () => {
  fc.assert(fc.property(
    jasWithSarungPairingArb,
    async (pairingData) => {
      const stockManager = new PairingAwareStockManager(mockInventoryService, mockLogger)
      await stockManager.processStockForReturn(
        JSON.stringify(pairingData.kondisiAwal), 
        1, 
        pairingData.jasItemId
      )
      
      // Verify both jas and sarung stock was restored
      expect(mockInventoryService.updateStockOnReturn).toHaveBeenCalledWith(
        pairingData.jasProductSizeId, 1, pairingData.sarungProductSizeId
      )
    }
  ), { numRuns: 100 })
})

// Feature: return-pairing-integration, Property 7: Penalty calculation for pairings
test('penalty calculation applies only to jas in pairing', () => {
  fc.assert(fc.property(
    jasWithSarungPairingArb,
    (pairingData) => {
      const result = PairingPenaltyCalculator.calculatePairingPenalty({
        itemId: pairingData.jasItemId,
        kondisiAwal: JSON.stringify(pairingData.kondisiAwal),
        modalAwal: pairingData.jasModalAwal,
        kondisiAkhir: 'rusak',
        quantity: 1
      })
      
      // Verify penalty only applies to jas
      expect(result.jasPenalty).toBeGreaterThan(0)
      expect(result.sarungPenalty).toBe(0)
      expect(result.pairingApplied).toBe(true)
    }
  ), { numRuns: 100 })
})
```

## Performance Considerations

### Optimization Strategies

1. **Reuse Existing Parser**: Leverage the enhanced kondisiAwal parser from pickup integration
2. **Lazy Parsing**: Parse kondisiAwal only when needed for stock operations
3. **Caching**: Cache parsed kondisiAwal data within request scope
4. **Batch Operations**: Group stock operations where possible
5. **Early Returns**: Skip unnecessary processing for non-paired items

### Performance Metrics

- **Parsing Overhead**: < 1ms per kondisiAwal field (reuse existing optimizations)
- **Stock Operation Time**: < 150ms per paired item (dual restoration)
- **Total Return Time**: < 3s for 10 paired items
- **Memory Usage**: < 15MB additional for pairing logic
- **Auto-Selection Response**: < 50ms for UI updates

### Monitoring Points

```typescript
interface ReturnPairingMetrics extends PickupPairingMetrics {
  returnOperations: {
    total: number
    withPairing: number
    withoutPairing: number
  }
  stockRestorations: {
    single: number
    dual: number
    failed: number
  }
  penaltyCalculations: {
    jasOnly: number
    regular: number
    sarungSkipped: number
  }
  autoSelections: {
    triggered: number
    successful: number
    failed: number
  }
}
```

## Implementation Strategy

### Phase 1: Core Integration Layer (Reuse from pickup)
1. Reuse enhanced KondisiAwalParser from pickup integration
2. Create PairingAwareStockManager for return operations
3. Add comprehensive error handling and logging
4. Update ReturnService to use new integration components

### Phase 2: Return-Specific Enhancements
1. Implement PairingReturnValidator for validation logic
2. Create PairingPenaltyCalculator for jas-only penalty calculation
3. Add AutoSelectionManager for UI behavior
4. Enhance error messages with pairing context

### Phase 3: UI Integration
1. Update return form components to use AutoSelectionManager
2. Implement pairing display formatting
3. Add visual indicators for paired items
4. Update return confirmation to show pairing information

### Phase 4: Testing and Validation
1. Implement comprehensive unit tests
2. Add property-based testing for all correctness properties
3. Create integration tests for end-to-end scenarios
4. Validate backward compatibility with existing data

## Backward Compatibility

### Data Format Support
- **Existing Transactions**: Continue to work with pipe format
- **New Transactions**: Support JSON format with pairing data
- **Mixed Environments**: Handle both formats simultaneously
- **Migration Path**: No forced migration required

### API Compatibility
- **Return Endpoints**: No changes to request/response format
- **Error Responses**: Enhanced with pairing context but backward compatible
- **Activity Logs**: Additional fields but existing structure preserved

### Performance Impact
- **Minimal Overhead**: < 5% performance impact for non-paired items
- **Graceful Degradation**: Fallback to original behavior on errors
- **Memory Efficient**: Minimal additional memory usage

## Security Considerations

### Input Validation
- **JSON Parsing**: Safe parsing with error handling (reuse from pickup)
- **Data Sanitization**: Validate extracted productSizeId format
- **Injection Prevention**: Parameterized database queries only

### Error Information Disclosure
- **User-Facing Errors**: Generic messages without system details
- **Audit Logs**: Detailed information for administrators only
- **Debug Information**: Available only in development environment

## Monitoring and Observability

### Key Metrics (Extend pickup metrics)
- **Format Distribution**: Track JSON vs pipe format usage in returns
- **Error Rates**: Monitor parsing and stock operation failures
- **Performance**: Track return completion times
- **Pairing Usage**: Monitor auto-selection and dual restoration rates

### Alerting Thresholds
- **Error Rate**: > 5% parsing failures
- **Performance**: > 4s average return time (higher than pickup due to dual operations)
- **Stock Inconsistency**: Any stock restoration failures
- **Validation Failures**: > 10% pairing validation failures

This comprehensive design ensures robust integration between the pairing and return systems while maintaining performance, reliability, and backward compatibility, with specific focus on auto-selection behavior, dual stock restoration, and jas-only penalty calculation. 