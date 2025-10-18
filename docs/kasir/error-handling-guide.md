# Error Handling Guide - Sistem Pickup Transaksi

## Overview

Dokumen ini menjelaskan patterns dan best practices untuk error handling dalam sistem pickup transaksi rental software.

## Problem Statement

Sebelum implementasi perbaikan:
- Generic error messages tanpa detail informasi
- Tidak ada logging yang memadai untuk debugging
- User experience buruk dengan error yang tidak jelas
- Sulit untuk mendiagnosis root cause issues

## Solution Implementation

### 1. Enhanced Error Handling di Service Layer

**File**: `features/kasir/services/pickupService.ts`

**Improvements:**
- Proper error catching dengan parameter
- Comprehensive error context logging
- Specific error classification
- User-friendly error messages

```typescript
// ❌ BEFORE
} catch {
  throw new Error('Gagal memproses pickup')
}

// ✅ AFTER
} catch (error) {
  const errorContext = {
    transactionId,
    items: items.map(item => ({
      id: item.id,
      jumlahDiambil: item.jumlahDiambil
    })),
    userId: this.userId,
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : { message: 'Unknown error', type: typeof error }
  }

  console.error('Pickup processing failed:', errorContext)

  // Specific error handling untuk berbagai scenarios
  let errorMessage = 'Gagal memproses pickup'
  if (error.message.includes('connection')) {
    errorMessage = 'Database connection error. Silakan coba lagi beberapa saat.'
  }
  // ... more error handling

  throw new Error(errorMessage)
}
```

### 2. API Layer Enhancement

**File**: `app/api/kasir/transaksi/[kode]/ambil/route.ts`

**Improvements:**
- Request correlation ID untuk tracking
- Enhanced error logging dengan context
- Structured success logging
- Consistent error response format

```typescript
// Generate correlation ID
const correlationId = `pickup-${kode}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Log request start
console.log(`[${correlationId}] Pickup request started:`, {
  transactionCode: kode,
  clientIP: request.headers.get('x-forwarded-for') || 'unknown',
  userAgent: request.headers.get('user-agent') || 'unknown',
  timestamp: new Date().toISOString()
})

// Enhanced error logging
console.error(`[${correlationId}] Pickup processing failed:`, {
  transactionCode: kode,
  error: error instanceof Error ? {
    message: error.message,
    stack: error.stack,
    name: error.name
  } : { message: 'Unknown error', type: typeof error },
  timestamp: new Date().toISOString(),
  clientIP: request.headers.get('x-forwarded-for') || 'unknown'
})
```

### 3. Frontend Error Display Enhancement

**File**: `features/kasir/components/detail/PickupModal.tsx`

**Improvements:**
- Enhanced error UI dengan actions
- Error classification (recoverable/fatal/permission)
- Contextual help tips
- Retry mechanisms

```typescript
// Error classification function
function getErrorType(error: unknown): 'recoverable' | 'fatal' | 'permission' {
  const errorMessage = error instanceof Error ? error.message : String(error)

  if (errorMessage.includes('connection') || errorMessage.includes('timeout')) {
    return 'recoverable'
  }
  // ... more classification logic
}

// Enhanced error display with actions
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
    {/* Error message */}
    <div className="text-sm text-red-800 mb-3">
      {getPickupErrorMessage(error)}
    </div>

    {/* Error-specific actions */}
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => reset()}>Coba Lagi</Button>
      {getErrorType(error) === 'recoverable' && (
        <Button onClick={() => window.location.reload()}>Refresh Halaman</Button>
      )}
    </div>

    {/* Help tips */}
    <div className="mt-3 text-xs text-red-600">
      <strong>Tip:</strong> {getErrorHelpTip(error)}
    </div>
  </div>
)}
```

### 4. Error Message Processing

**File**: `features/kasir/hooks/usePickupProcess.ts`

**Improvements:**
- Specific error message extraction
- User-friendly message transformation
- Error code handling

```typescript
function extractSpecificErrorMessage(message: string): string | null {
  if (message.includes('Database connection error')) {
    return 'Database sedang sibuk. Silakan coba lagi beberapa saat.'
  }
  if (message.includes('Data conflict detected')) {
    return 'Item mungkin telah diambil oleh proses lain. Silakan refresh dan coba lagi.'
  }
  // ... more specific handling
  return null
}
```

## Error Categories & Handling

### 1. Database Errors
- **Connection Issues**: Retry dengan exponential backoff
- **Constraint Violations**: Data conflict resolution
- **Transaction Failures**: Rollback dan user notification

### 2. Validation Errors
- **Input Validation**: Clear field-specific errors
- **Business Logic**: Rule violation explanations
- **Permission Issues**: Access denied guidance

### 3. System Errors
- **Timeout**: Request retry mechanism
- **Resource Limit**: Rate limiting response
- **Service Unavailable**: Graceful degradation

## Logging Strategy

### Structured Logging Format
```json
{
  "correlationId": "pickup-TXN123-1691234567890-abc123",
  "transactionCode": "TXN-20251018-002",
  "error": {
    "message": "Database connection timeout",
    "stack": "...",
    "name": "TimeoutError"
  },
  "context": {
    "userId": "user_123",
    "items": [
      {"id": "item_1", "jumlahDiambil": 2}
    ],
    "timestamp": "2025-10-18T10:30:00.000Z",
    "processingTime": 1250
  }
}
```

### Log Levels
- **ERROR**: System failures dan exceptions
- **WARN**: Recoverable errors dan retries
- **INFO**: Request tracking dan success metrics
- **DEBUG**: Detailed execution tracing

## Monitoring & Alerting

### Key Metrics
- Error rate by endpoint
- Processing time distribution
- Database connection health
- User interaction with error states

### Alert Triggers
- High error rate (>5%)
- Database connection failures
- Processing time anomalies
- Specific error patterns

## Best Practices

### 1. Error Message Principles
- Be specific dan actionable
- Provide clear next steps
- Avoid technical jargon for users
- Include context for debugging

### 2. Logging Principles
- Log errors with full context
- Use structured format
- Include correlation IDs
- Protect sensitive information

### 3. User Experience Principles
- Provide clear error feedback
- Offer recovery options when possible
- Maintain app state during errors
- Guide users to resolution

## Testing Strategy

### 1. Error Scenario Testing
- Database connection failures
- Invalid input data
- Permission violations
- Concurrent access conflicts

### 2. UI Testing
- Error state rendering
- Action button functionality
- Help tip display
- Retry mechanism behavior

### 3. Integration Testing
- End-to-end error flows
- API error propagation
- Frontend error handling
- Logging verification

## Future Enhancements

### 1. Advanced Features
- Error rate limiting
- Automatic retry policies
- Error analytics dashboard
- User feedback collection

### 2. Monitoring Improvements
- Real-time error tracking
- Performance impact analysis
- User behavior correlation
- Automated alert escalation

## Troubleshooting

### Common Issues & Solutions

1. **Generic "Gagal memproses pickup" error**
   - Check service layer error handling
   - Verify logging configuration
   - Review error message processing

2. **Missing error context in logs**
   - Verify correlation ID generation
   - Check logging format consistency
   - Validate error object structure

3. **Poor user error experience**
   - Review error classification logic
   - Update help tip content
   - Test action button functionality

## Conclusion

Enhanced error handling system memberikan:
- ✅ Better debugging capabilities dengan comprehensive logging
- ✅ Improved user experience dengan clear error messages
- ✅ Faster issue resolution dengan structured error information
- ✅ Better monitoring dan observability
- ✅ Reduced support tickets dengan self-service error resolution

---

*Last Updated: 2025-10-18*
*Author: Claude Code Implementation Team*