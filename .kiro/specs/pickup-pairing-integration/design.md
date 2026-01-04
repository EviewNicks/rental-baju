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
│   ├── shouldSkipStockDeduction()
│   ├── processStockForItem()
│   └── logStockOperation()
├── Enhanced Error Handling
│   ├── PairingErrorClassifier
│   └── ContextualErrorMessages
└── Audit Logger (Enhanced)
    ├── logPairingContext()
    └── logDataFormatDetection()
```

## Components and Interfaces

### KondisiAwalParser

**Purpose**: Handle both JSON and pipe-separated formats for kondisiAwal field parsing.

```typescript
interface KondisiAwalData {
  productSizeId: string
  size: string
  ageCategory: string
  condition: string
  linkedSarung?: {
    productId: string
    productSizeId: string
    quantity: number
  }
}

class KondisiAwalParser {
  static parse(kondisiAwal: string | null): KondisiAwalData | null {
    if (!kondisiAwal) return null
    
    // Try JSON format first (pairing system)
    try {
      const jsonData = JSON.parse(kondisiAwal)
      if (jsonData.productSizeId) {
        return {
          productSizeId: jsonData.productSizeId,
          size: jsonData.size || 'UNKNOWN',
          ageCategory: jsonData.ageCategory || 'ADULT',
          condition: jsonData.condition || 'baik',
          linkedSarung: jsonData.linkedSarung
        }
      }
    } catch (error) {
      // Not JSON, continue to pipe format
    }
    
    // Fallback to pipe-separated format (legacy)
    const parts = kondisiAwal.split('|')
    if (parts.length >= 4) {
      return {
        productSizeId: parts[0],
        size: parts[1],
        ageCategory: parts[2],
        condition: parts[3]
      }
    }
    
    return null
  }
  
  static extractProductSizeId(kondisiAwal: string | null): string | null {
    const parsed = this.parse(kondisiAwal)
    return parsed?.productSizeId || null
  }
}
```

### PairingAwareStockManager

**Purpose**: Handle stock management with awareness of pairing relationships.

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
    
    // Check if this is a paired sarung item (should skip stock deduction)
    if (this.isPairedSarungItem(transactionItem, kondisiData)) {
      this.logger.info('Skipping stock deduction for paired sarung item', {
        itemId: transactionItem.id,
        productId: transactionItem.produkId,
        reason: 'paired_sarung'
      })
      return
    }
    
    // Process stock deduction for regular items and jas items
    try {
      await this.inventoryService.updateStockOnCreate(
        kondisiData.productSizeId,
        pickupQuantity
      )
      
      this.logger.info('Stock deducted successfully', {
        itemId: transactionItem.id,
        productSizeId: kondisiData.productSizeId,
        quantity: pickupQuantity
      })
    } catch (error) {
      this.logger.error('Stock deduction failed', {
        itemId: transactionItem.id,
        productSizeId: kondisiData.productSizeId,
        quantity: pickupQuantity,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Don't throw error - continue pickup process
      // Stock inconsistency is better than failed pickup
    }
  }
  
  private isPairedSarungItem(
    transactionItem: TransactionItem,
    kondisiData: KondisiAwalData
  ): boolean {
    // Check if this item has linkedSarung data indicating it's a paired sarung
    // This would be determined by business logic - for now, we'll use a simple check
    return kondisiData.linkedSarung !== undefined && 
           transactionItem.produk?.category === 'sarung'
  }
}
```

### Enhanced PickupService Integration

**Modified processPickup method**:

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
        
        // Enhanced stock management with pairing awareness
        const stockManager = new PairingAwareStockManager(
          createInventoryService(tx as any),
          console // Use console as logger for now
        )
        
        for (const pickupItem of items) {
          // ... existing pickup quantity update logic ...
          
          // Enhanced stock processing with pairing awareness
          const transactionItem = allTransactionItems.find(ti => ti.id === pickupItem.id)
          if (transactionItem) {
            await stockManager.processStockForPickup(
              transactionItem,
              pickupItem.jumlahDiambil
            )
          }
        }
        
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
| Jas | Yes | Deduct stock for jas only |
| Jas | No | Deduct stock normally |
| Sarung (paired) | N/A | Skip stock deduction |
| Sarung (standalone) | No | Deduct stock normally |
| Other items | No | Deduct stock normally |

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

Property 3: Pairing-aware stock management
*For any* jas item with linkedSarung data, stock deduction should occur only for the jas item and not for the linked sarung item
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