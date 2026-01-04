# Design Document: Pickup-Pairing Integration

## Overview

This design addresses the critical compatibility issues between the jas-sarung pairing system and the pickup system that are causing database errors and item lookup failures. The solution focuses on creating a robust integration layer that handles data format differences, stock management conflicts, and item filtering inconsistencies while maintaining backward compatibility with existing transactions.

The core challenge is that the pairing system stores `kondisiAwal` as JSON format with `linkedSarung` data, while the pickup system expects pipe-separated format (`"productSizeId|size|ageCategory|condition"`). This mismatch causes `productSizeId` extraction to fail, leading to database update errors during pickup operations.

## Architecture

### System Integration Overview

```
Pairing System (JSON Format)
    ↓
Integration Layer (Format Adapter)
    ↓
Pickup System (Pipe Format)
```

The integration layer acts as an adapter that:
1. Detects data format (JSON vs pipe-separated)
2. Extracts required data using appropriate parsing logic
3. Handles stock management based on item pairing status
4. Provides consistent error handling and logging

### Component Architecture

```
PickupService (Enhanced)
├── KondisiAwalParser (NEW)
│   ├── detectFormat()
│   ├── parseJSON()
│   ├── parsePipeFormat()
│   └── extractProductSizeId()
├── PairingAwareStockManager (NEW)
│   ├── processStockForPickup()
│   ├── deductJasStock()
│   ├── deductLinkedSarungStock()
│   └── logStockOperation()
├── PairingDisplayFormatter (NEW)
│   ├── formatItemDisplayName()
│   ├── extractPairingInfo()
│   └── generatePickupDescription()
├── Enhanced Error Handling
│   ├── PairingErrorClassifier
│   └── ContextualErrorMessages
└── Audit Logger (Enhanced)
    ├── logPairingContext()
    └── logDataFormatDetection()
```

## Components and Interfaces

### Enhanced KondisiAwalParser (REFACTOR EXISTING)

**Purpose**: Enhance existing `parseKondisiAwal()` utility to support JSON format with linkedSarung data.

**REFACTOR APPROACH**: Instead of creating new class, we enhance the existing utility at `features/kasir/lib/utils/kondisiAwalParser.ts`

```typescript
// Enhanced interface extending existing ParsedKondisiAwal
export interface EnhancedKondisiAwalData extends ParsedKondisiAwal {
  linkedSarung?: {
    productId: string
    productSizeId: string
    quantity: number
    product?: {
      name: string
      code: string
    }
  }
}

// Enhanced parseKondisiAwal function (EXTENDS EXISTING)
export function parseKondisiAwalEnhanced(kondisiAwal?: string | null): EnhancedKondisiAwalData {
  // Default return for empty/null values
  if (!kondisiAwal) {
    return {
      isLegacyFormat: true,
    }
  }

  // Try JSON format first (pairing system)
  try {
    const jsonData = JSON.parse(kondisiAwal)
    if (jsonData.productSizeId) {
      return {
        productSizeId: jsonData.productSizeId,
        size: jsonData.size || undefined,
        ageCategory: jsonData.ageCategory || undefined,
        condition: jsonData.condition || undefined,
        linkedSarung: jsonData.linkedSarung,
        isLegacyFormat: false,
      }
    }
  } catch (error) {
    // Not JSON, continue to pipe format
  }

  // Fallback to existing pipe-separated format logic
  const parts = kondisiAwal.split('|')
  if (parts.length >= 4 && isValidUUID(parts[0])) {
    return {
      productSizeId: parts[0],
      size: parts[1] || undefined,
      ageCategory: (parts[2] as 'ADULT' | 'CHILD' | 'TODDLER') || undefined,
      condition: parts.slice(3).join('|') || undefined,
      isLegacyFormat: false,
    }
  }

  // Legacy format: plain text condition
  return {
    condition: kondisiAwal,
    isLegacyFormat: true,
  }
}

// Utility function for pickup service
export function extractProductSizeIdEnhanced(kondisiAwal: string | null): string | null {
  const parsed = parseKondisiAwalEnhanced(kondisiAwal)
  return parsed?.productSizeId || null
}
```

### PairingAwareStockManager

**Purpose**: Handle stock management with awareness of pairing relationships, deducting stock for both jas and linked sarung items.

```typescript
class PairingAwareStockManager {
  constructor(
    private inventoryService: InventoryService,
    private logger: Logger
  ) {}
  
  async processStockForPickup(
    transactionItem: TransactionItem,
    pickupQuantity: number
  ): Promise<void> {
    const kondisiData = KondisiAwalParser.parse(transactionItem.kondisiAwal)
    
    if (!kondisiData?.productSizeId) {
      this.logger.warn('Could not extract productSizeId from kondisiAwal', {
        itemId: transactionItem.id,
        kondisiAwal: transactionItem.kondisiAwal,
        reason: 'parsing_failed'
      })
      return // Skip stock deduction but continue pickup
    }
    
    // Process stock deduction for the main item (jas)
    try {
      await this.inventoryService.updateStockOnCreate(
        kondisiData.productSizeId,
        pickupQuantity
      )
      
      this.logger.info('Stock deducted for main item', {
        itemId: transactionItem.id,
        productSizeId: kondisiData.productSizeId,
        quantity: pickupQuantity
      })
    } catch (error) {
      this.logger.error('Main item stock deduction failed', {
        itemId: transactionItem.id,
        productSizeId: kondisiData.productSizeId,
        quantity: pickupQuantity,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Don't throw error - continue pickup process
      // Stock inconsistency is better than failed pickup
    }
    
    // If this item has linkedSarung, also deduct stock for the sarung
    if (kondisiData.linkedSarung?.productSizeId) {
      try {
        await this.inventoryService.updateStockOnCreate(
          kondisiData.linkedSarung.productSizeId,
          pickupQuantity // Use same quantity (1:1 ratio)
        )
        
        this.logger.info('Stock deducted for linked sarung', {
          itemId: transactionItem.id,
          jasProductSizeId: kondisiData.productSizeId,
          sarungProductSizeId: kondisiData.linkedSarung.productSizeId,
          quantity: pickupQuantity
        })
      } catch (error) {
        this.logger.error('Linked sarung stock deduction failed', {
          itemId: transactionItem.id,
          sarungProductSizeId: kondisiData.linkedSarung.productSizeId,
          quantity: pickupQuantity,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Don't throw error - continue pickup process
        // Stock inconsistency is better than failed pickup
      }
    }
  }
}
```
```

### PairingDisplayFormatter

**Purpose**: Format item display names and descriptions to show pairing information clearly in pickup UI.

```typescript
interface PairingDisplayInfo {
  displayName: string
  isPaired: boolean
  pairingDescription?: string
  linkedSarungName?: string
}

class PairingDisplayFormatter {
  static formatItemDisplayName(
    jasName: string,
    kondisiAwal: string | null
  ): PairingDisplayInfo {
    const kondisiData = KondisiAwalParser.parse(kondisiAwal)
    
    if (!kondisiData?.linkedSarung) {
      return {
        displayName: jasName,
        isPaired: false
      }
    }
    
    // For paired items, show "Jas Name + Sarung Name" format
    const sarungName = kondisiData.linkedSarung.product?.name || 'Sarung'
    const displayName = `${jasName} + ${sarungName}`
    
    return {
      displayName,
      isPaired: true,
      pairingDescription: `Paket jas dengan sarung gratis`,
      linkedSarungName: sarungName
    }
  }
  
  static generatePickupDescription(
    items: Array<{
      jasName: string
      kondisiAwal: string | null
      quantity: number
    }>
  ): string {
    const descriptions = items.map(item => {
      const displayInfo = this.formatItemDisplayName(item.jasName, item.kondisiAwal)
      const quantityText = item.quantity > 1 ? ` (${item.quantity} unit)` : ''
      return `${displayInfo.displayName}${quantityText}`
    })
    
    return descriptions.join(', ')
  }
}
```

### Enhanced PickupService Integration

**Modified processPickup method with UI display support**:

```typescript
async processPickup(
  transactionId: string,
  items: PickupItemRequest[],
  catatan?: string,
): Promise<PickupProcessResult> {
  try {
    // ... existing validation logic ...

    const resultTransactionId = await this.prisma.$transaction(
      async (tx) => {
        // ... existing transaction item fetching ...
        
        // ✅ CRITICAL: Transaction Context Handling for Dual Stock Deduction
        // The InventoryService receives the transaction context (tx) which is a 
        // PrismaTransactionClient, not the full PrismaClient. This means:
        // 1. tx does NOT have the $transaction method (nested transactions not allowed)
        // 2. All database operations must use the tx context directly
        // 3. For dual deduction (jas + sarung), we use sequential updates instead of nested transactions
        
        const txInventoryService = createInventoryService(tx as any) // Type assertion for transaction context
        
        for (const pickupItem of items) {
          // ... existing pickup quantity update logic ...
          
          // Enhanced stock processing with pairing awareness and transaction context
          const transactionItem = allTransactionItems.find(ti => ti.id === pickupItem.id)
          if (transactionItem) {
            await txInventoryService.processStockForPickup(
              transactionItem.kondisiAwal,
              pickupItem.jumlahDiambil,
              pickupItem.id,
              console // Use console as logger
            )
          }
        }
        
        // Enhanced activity log with pairing display information
        const itemsDescription = PairingDisplayFormatter.generatePickupDescription(
          items.map(item => {
            const transactionItem = allTransactionItems.find(ti => ti.id === item.id)
            return {
              jasName: transactionItem?.produk?.name || 'Unknown Product',
              kondisiAwal: transactionItem?.kondisiAwal || null,
              quantity: item.jumlahDiambil
            }
          })
        )
        
        // ... rest of existing logic ...
      },
      { timeout: 8000 }
    )
    
    // ... existing response logic ...
  } catch (error) {
    // Enhanced error handling with pairing context
    const errorContext = this.createPairingErrorContext(error, transactionId, items)
    console.error('Pickup processing failed with pairing context:', errorContext)
    
    throw new Error(this.generateContextualErrorMessage(error))
  }
}
```

private createPairingErrorContext(
  error: unknown,
  transactionId: string,
  items: PickupItemRequest[]
): object {
  return {
    transactionId,
    items: items.map(item => ({ id: item.id, quantity: item.jumlahDiambil })),
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : { message: 'Unknown error', type: typeof error },
    pairingContext: {
      hasPairingData: true,
      formatSupport: ['JSON', 'pipe-separated'],
      stockManagement: 'pairing-aware'
    }
  }
}

private generateContextualErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Pairing-specific error messages
    if (error.message.includes('No record was found for an update')) {
      return 'Terjadi konflik data inventory. Item mungkin sudah diproses atau data pairing tidak konsisten. Silakan refresh halaman dan coba lagi.'
    }
    
    if (error.message.includes('Item transaksi tidak ditemukan')) {
      return 'Item tidak dapat ditemukan. Mungkin item ini adalah bagian dari pairing jas-sarung. Silakan refresh halaman dan pilih item yang tersedia.'
    }
    
    // ... other error handling ...
  }
  
  return 'Gagal memproses pickup. Silakan coba lagi atau hubungi administrator.'
}
```

## Transaction Context Handling

### Critical Issue: Nested Transaction Problem

The core issue causing the `this.prisma.$transaction is not a function` error was related to nested transaction handling:

**Problem**: 
- `PickupService.processPickup()` runs inside a `$transaction()` context
- `InventoryService.updateStockOnCreate()` was attempting to create another `$transaction()` for dual deduction
- Transaction contexts (`tx`) don't have the `$transaction` method - only the main PrismaClient does

**Solution**:
- Use sequential updates within the existing transaction context instead of nested transactions
- Pass the transaction context (`tx`) to `InventoryService` via `createInventoryService(tx)`
- Perform dual deduction (jas + sarung) using sequential `update()` calls within the same transaction

### Transaction Context Flow

```
PickupService.processPickup()
├── this.prisma.$transaction(async (tx) => {
│   ├── createInventoryService(tx) // Pass transaction context
│   ├── txInventoryService.processStockForPickup()
│   │   └── updateStockOnCreate() // Uses tx context, NOT this.prisma.$transaction
│   │       ├── tx.productSize.update() // Jas stock deduction
│   │       └── tx.productSize.update() // Sarung stock deduction (sequential)
│   └── tx.aktivitasTransaksi.create() // Activity logging
└── })
```

### Key Implementation Details

1. **Transaction Context Passing**: `createInventoryService(tx as any)` passes the transaction context
2. **Sequential Updates**: Dual deduction uses two sequential `update()` calls instead of nested `$transaction()`
3. **Error Handling**: Errors in stock deduction are logged but don't fail the entire pickup process
4. **Audit Trail**: Additional logging points track transaction context validation and dual deduction process

### Audit Trail Enhancements

Two additional audit trail points were added to debug transaction context issues:

1. **Transaction Context Validation**: Logs transaction context type and dual deduction status
2. **Dual Deduction Process Tracking**: Logs the sequential update process for paired items

```typescript
// Audit point 1: Transaction context validation
console.info('🔧 Stock deduction initiated', {
  sizeId,
  linkedSarungSizeId,
  quantity,
  isDualDeduction: !!linkedSarungSizeId,
  transactionContext: this.prisma.constructor.name,
  timestamp: new Date().toISOString()
})

// Audit point 2: Dual deduction process tracking
console.info('🔄 Executing dual stock deduction', {
  jasProductSizeId: sizeId,
  sarungProductSizeId: linkedSarungSizeId,
  quantity,
  step: 'sequential_updates',
  timestamp: new Date().toISOString()
})
```

## Data Models

### Enhanced kondisiAwal Format Support

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

### Stock Management Decision Matrix

| Item Type | Has linkedSarung | Action |
|-----------|------------------|--------|
| Jas | Yes | Deduct stock for jas AND linked sarung (1:1 ratio) |
| Jas | No | Deduct stock normally |
| Sarung (standalone) | No | Deduct stock normally |
| Other items | No | Deduct stock normally |

**Note**: Paired sarung items are not displayed separately in pickup UI - they are handled automatically when their paired jas is picked up.

## Error Handling

### Error Classification

1. **Data Format Errors**
   - Invalid JSON in kondisiAwal
   - Missing required fields
   - Malformed pipe format

2. **Stock Management Errors**
   - ProductSizeId not found in database
   - Insufficient stock for deduction
   - Database connection issues

3. **Item Filtering Errors**
   - Attempting to pickup filtered items
   - Inconsistent item availability
   - Frontend-backend mismatch

4. **Pairing Logic Errors**
   - Corrupted linkedSarung data
   - Inconsistent pairing relationships
   - Missing pairing context

### Error Recovery Strategies

```typescript
class PairingErrorHandler {
  static handleDataFormatError(error: Error, kondisiAwal: string): void {
    console.warn('kondisiAwal parsing failed, using fallback', {
      originalData: kondisiAwal,
      error: error.message,
      fallbackAction: 'skip_stock_deduction'
    })
    // Continue without stock deduction
  }
  
  static handleStockError(error: Error, context: StockContext): void {
    console.error('Stock operation failed, continuing pickup', {
      productSizeId: context.productSizeId,
      quantity: context.quantity,
      error: error.message,
      action: 'continue_without_stock_update'
    })
    // Log for audit but don't fail pickup
  }
  
  static handleItemFilteringError(error: Error, itemId: string): never {
    console.error('Item filtering error detected', {
      itemId,
      error: error.message,
      action: 'fail_pickup'
    })
    throw new Error('Item tidak dapat diproses karena konflik pairing. Silakan refresh halaman.')
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

After reviewing all properties identified in the prework, no redundant properties were found. Each property provides unique validation value for different aspects of the pickup-pairing integration.

### Converting EARS to Properties

Property 1: Format compatibility parsing
*For any* kondisiAwal string in either JSON or pipe-separated format, the KondisiAwalParser should successfully extract productSizeId or return null gracefully
**Validates: Requirements 1.1, 1.2, 1.3**

Property 2: Graceful parsing failure handling
*For any* invalid or malformed kondisiAwal data, the system should log a warning and continue pickup processing without stock deduction
**Validates: Requirements 1.4, 5.1, 5.4**

Property 3: Dual stock management for pairings
*For any* jas item with linkedSarung data, stock deduction should occur for BOTH the jas item AND the linked sarung item using 1:1 ratio
**Validates: Requirements 2.1, 2.2**

Property 4: Backward compatibility stock management
*For any* regular (non-paired) item, stock deduction should work exactly as it did before pairing system implementation
**Validates: Requirements 2.3, 9.1**

Property 5: Item filtering consistency
*For any* transaction with paired items, the pickup UI should show only items that can actually be picked up (jas items but not paired sarung items)
**Validates: Requirements 3.1, 3.2**

Property 6: Contextual error messaging
*For any* pickup error related to pairing data, the error message should specifically mention pairing context and provide actionable recovery steps
**Validates: Requirements 4.1, 4.4**

Property 7: Pickup availability calculation
*For any* transaction, pickup availability should be calculated based only on items that can actually be picked up, excluding paired sarung items
**Validates: Requirements 6.1, 6.2**

Property 8: Comprehensive audit logging
*For any* pickup operation involving pairing data, the system should log data format detection, stock operation decisions, and pairing context
**Validates: Requirements 7.1, 7.2**

Property 9: Performance maintenance
*For any* pickup operation on transactions with up to 10 items, the processing time should remain within 2 seconds despite additional pairing logic
**Validates: Requirements 8.1, 8.5**

Property 10: Dual format support
*For any* transaction, whether it contains old pipe-format or new JSON-format kondisiAwal data, the pickup processing should work correctly
**Validates: Requirements 9.1, 9.2**

## Error Handling

### Comprehensive Error Recovery

The integration layer implements a multi-level error recovery strategy:

1. **Parse-level Recovery**: If JSON parsing fails, fall back to pipe format
2. **Extraction-level Recovery**: If productSizeId extraction fails, log and continue without stock deduction
3. **Stock-level Recovery**: If stock deduction fails, log error but complete pickup
4. **System-level Recovery**: Provide clear error messages with pairing context

### Error Context Enhancement

```typescript
interface PairingErrorContext {
  transactionId: string
  itemId: string
  kondisiAwal: string | null
  detectedFormat: 'json' | 'pipe' | 'unknown'
  pairingData?: {
    hasLinkedSarung: boolean
    linkedSarungId?: string
  }
  stockOperation: {
    attempted: boolean
    successful: boolean
    skipped: boolean
    reason?: string
  }
}
```

## Testing Strategy

### Unit Testing

**KondisiAwalParser Tests:**
- Test JSON format parsing with various structures
- Test pipe format parsing with different field counts
- Test invalid data handling and fallback behavior
- Test productSizeId extraction from both formats

**PairingAwareStockManager Tests:**
- Test stock deduction for jas items with pairing
- Test stock skipping for paired sarung items
- Test normal stock deduction for regular items
- Test error handling and logging

**Enhanced PickupService Tests:**
- Test complete pickup flow with pairing data
- Test error recovery and contextual messages
- Test performance with various transaction sizes
- Test backward compatibility with old data

### Integration Testing

**End-to-End Pickup Flow:**
- Create transaction with jas-sarung pairing
- Attempt pickup of jas item
- Verify stock deduction only for jas
- Verify pickup completion and status update
- Verify activity logging includes pairing context

**Error Scenario Testing:**
- Test with corrupted kondisiAwal data
- Test with missing productSizeId in database
- Test with network failures during stock operations
- Verify graceful degradation in all cases

### Property-Based Testing

Using **fast-check** library for TypeScript with minimum 100 iterations per property test:

**Data Generators:**
```typescript
// Generate valid JSON kondisiAwal
const jsonKondisiAwalArb = fc.record({
  productSizeId: fc.uuid(),
  size: fc.constantFrom('S', 'M', 'L', 'XL'),
  ageCategory: fc.constantFrom('ADULT', 'CHILD'),
  condition: fc.constantFrom('baik', 'rusak'),
  linkedSarung: fc.option(fc.record({
    productId: fc.uuid(),
    productSizeId: fc.uuid(),
    quantity: fc.integer({ min: 1, max: 5 })
  }))
})

// Generate valid pipe kondisiAwal
const pipeKondisiAwalArb = fc.tuple(
  fc.uuid(),
  fc.constantFrom('S', 'M', 'L', 'XL'),
  fc.constantFrom('ADULT', 'CHILD'),
  fc.constantFrom('baik', 'rusak')
).map(([id, size, age, condition]) => `${id}|${size}|${age}|${condition}`)
```

**Property Test Examples:**
```typescript
// Feature: pickup-pairing-integration, Property 1: Format compatibility parsing
test('kondisiAwal parsing handles both formats', () => {
  fc.assert(fc.property(
    fc.oneof(jsonKondisiAwalArb, pipeKondisiAwalArb),
    (kondisiAwal) => {
      const result = KondisiAwalParser.parse(JSON.stringify(kondisiAwal))
      expect(result).toBeTruthy()
      expect(result?.productSizeId).toBeTruthy()
    }
  ), { numRuns: 100 })
})

// Feature: pickup-pairing-integration, Property 3: Pairing-aware stock management
test('stock deduction only for jas in pairing', () => {
  fc.assert(fc.property(
    jasWithSarungPairingArb,
    async (pairingData) => {
      const stockManager = new PairingAwareStockManager(mockInventoryService, mockLogger)
      await stockManager.processStockForPickup(pairingData.jasItem, 1)
      
      // Verify jas stock was deducted
      expect(mockInventoryService.updateStockOnCreate).toHaveBeenCalledWith(
        pairingData.jasItem.productSizeId, 1
      )
      
      // Verify sarung stock was not deducted
      expect(mockInventoryService.updateStockOnCreate).not.toHaveBeenCalledWith(
        pairingData.sarungItem.productSizeId, expect.any(Number)
      )
    }
  ), { numRuns: 100 })
})
```

## Performance Considerations

### Optimization Strategies

1. **Lazy Parsing**: Parse kondisiAwal only when needed for stock operations
2. **Caching**: Cache parsed kondisiAwal data within request scope
3. **Batch Operations**: Group stock operations where possible
4. **Early Returns**: Skip unnecessary processing for paired sarung items

### Performance Metrics

- **Parsing Overhead**: < 1ms per kondisiAwal field
- **Stock Operation Time**: < 100ms per item
- **Total Pickup Time**: < 2s for 10 items
- **Memory Usage**: < 10MB additional for pairing logic

### Monitoring Points

```typescript
interface PerformanceMetrics {
  parseTime: number
  stockOperationTime: number
  totalPickupTime: number
  itemsProcessed: number
  errorsEncountered: number
  formatDistribution: {
    json: number
    pipe: number
    invalid: number
  }
}
```

## Implementation Strategy

### Phase 1: Core Integration Layer
1. Implement KondisiAwalParser with dual format support
2. Create PairingAwareStockManager for intelligent stock handling
3. Add comprehensive error handling and logging
4. Update PickupService to use new integration components

### Phase 2: Error Handling Enhancement
1. Implement contextual error messages
2. Add error classification and recovery strategies
3. Enhance audit logging with pairing context
4. Create error monitoring and alerting

### Phase 3: Performance Optimization
1. Add performance monitoring and metrics
2. Implement caching for parsed data
3. Optimize database queries for pairing data
4. Add performance regression testing

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
- **Pickup Endpoints**: No changes to request/response format
- **Error Responses**: Enhanced with pairing context but backward compatible
- **Activity Logs**: Additional fields but existing structure preserved

### Performance Impact
- **Minimal Overhead**: < 5% performance impact for non-paired items
- **Graceful Degradation**: Fallback to original behavior on errors
- **Memory Efficient**: Minimal additional memory usage

## Security Considerations

### Input Validation
- **JSON Parsing**: Safe parsing with error handling
- **Data Sanitization**: Validate extracted productSizeId format
- **Injection Prevention**: Parameterized database queries only

### Error Information Disclosure
- **User-Facing Errors**: Generic messages without system details
- **Audit Logs**: Detailed information for administrators only
- **Debug Information**: Available only in development environment

## Monitoring and Observability

### Key Metrics
- **Format Distribution**: Track JSON vs pipe format usage
- **Error Rates**: Monitor parsing and stock operation failures
- **Performance**: Track pickup completion times
- **Compatibility**: Monitor backward compatibility issues

### Alerting Thresholds
- **Error Rate**: > 5% parsing failures
- **Performance**: > 3s average pickup time
- **Stock Inconsistency**: Any stock operation failures
- **Data Corruption**: Invalid kondisiAwal format detection

### Dashboard Metrics
```typescript
interface IntegrationMetrics {
  dailyPickups: {
    total: number
    withPairing: number
    withoutPairing: number
  }
  formatUsage: {
    jsonFormat: number
    pipeFormat: number
    invalidFormat: number
  }
  errorRates: {
    parsingErrors: number
    stockErrors: number
    systemErrors: number
  }
  performance: {
    averagePickupTime: number
    p95PickupTime: number
    slowestPickups: Array<{
      transactionId: string
      duration: number
      itemCount: number
    }>
  }
}
```

This comprehensive design ensures robust integration between the pairing and pickup systems while maintaining performance, reliability, and backward compatibility.