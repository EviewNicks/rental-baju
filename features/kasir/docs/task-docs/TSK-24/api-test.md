# TSK-24 API Testing Guide - Multi-Condition Return System

## Overview
Comprehensive API testing guide for the enhanced multi-condition return system implemented in TSK-24. This system enables processing returns where individual items can be split across multiple conditions (e.g., partial damage, partial loss).

**API Endpoint**: `PUT /api/kasir/transaksi/{kode}/pengembalian`

## Testing Environment Setup

### Prerequisites
1. **Authentication**: Valid Clerk Bearer token with kasir/owner permissions
2. **Test Data**: Active transaction with DISEWAIKAN status
3. **Postman Environment**: Variables configured for baseUrl and clerkToken

### Environment Variables
```json
{
  "baseUrl": "http://localhost:3000",
  "clerkToken": "your-clerk-bearer-token",
  "testTransaksiKode": "TXN-20250808-001",
  "testItemId1": "uuid-of-first-item",
  "testItemId2": "uuid-of-second-item"
}
```

## Test Scenarios

### 1. Single-Condition Return (Backward Compatibility)
**Purpose**: Verify existing functionality still works unchanged
**Processing Mode**: `single-condition`

#### Test Case 1.1: Simple Good Condition Return
```json
{
  "items": [
    {
      "itemId": "{{testItemId1}}",
      "kondisiAkhir": "Baik - dikembalikan tepat waktu",
      "jumlahKembali": 2
    }
  ],
  "catatan": "Pengembalian normal, kondisi baik",
  "tglKembali": "2025-08-08T10:00:00.000Z"
}
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "transaksiId": "uuid",
    "totalPenalty": 0,
    "processedItems": [
      {
        "itemId": "uuid",
        "productName": "Product Name",
        "quantityReturned": 2,
        "kondisiAkhir": "Baik - dikembalikan tepat waktu",
        "penalty": 0
      }
    ],
    "processingMode": "single-condition"
  },
  "message": "Pengembalian berhasil diproses untuk transaksi TXN-20250808-001. Total penalty: Rp 0"
}
```

#### Test Case 1.2: Late Return with Penalty
```json
{
  "items": [
    {
      "itemId": "{{testItemId1}}",
      "kondisiAkhir": "Baik - dikembalikan terlambat",
      "jumlahKembali": 1
    }
  ],
  "catatan": "Terlambat 3 hari",
  "tglKembali": "2025-07-30T10:00:00.000Z"
}
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "transaksiId": "uuid",
    "totalPenalty": 30000,
    "processedItems": [...],
    "processingMode": "single-condition",
    "penaltySummary": {
      "totalLateDays": 9,
      "summary": "Late return penalty calculated"
    }
  }
}
```

#### Test Case 1.3: Lost Item with Modal Awal
```json
{
  "items": [
    {
      "itemId": "{{testItemId1}}",
      "kondisiAkhir": "Hilang/tidak dikembalikan",
      "jumlahKembali": 0
    }
  ],
  "catatan": "Item hilang, penalty modal awal"
}
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "transaksiId": "uuid",
    "totalPenalty": 150000,
    "processedItems": [...],
    "processingMode": "single-condition"
  }
}
```

### 2. Multi-Condition Return (New Feature)
**Purpose**: Test new granular condition tracking
**Processing Mode**: `multi-condition`

#### Test Case 2.1: Mixed Conditions - Good + Damaged
```json
{
  "items": [
    {
      "itemId": "{{testItemId1}}",
      "conditions": [
        {
          "kondisiAkhir": "Baik - dikembalikan tepat waktu",
          "jumlahKembali": 2
        },
        {
          "kondisiAkhir": "Rusak ringan - bisa diperbaiki",
          "jumlahKembali": 1,
          "modalAwal": 50000
        }
      ]
    }
  ],
  "catatan": "Sebagian baik, sebagian rusak ringan"
}
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "transaksiId": "uuid",
    "totalPenalty": 25000,
    "processedItems": [
      {
        "itemId": "uuid",
        "productName": "Product Name",
        "isMultiCondition": true,
        "conditionBreakdown": [
          {
            "kondisiAkhir": "Baik - dikembalikan tepat waktu",
            "jumlahKembali": 2,
            "penalty": 0
          },
          {
            "kondisiAkhir": "Rusak ringan - bisa diperbaiki",
            "jumlahKembali": 1,
            "penalty": 25000
          }
        ],
        "totalPenalty": 25000
      }
    ],
    "processingMode": "multi-condition",
    "multiConditionSummary": {
      "totalItems": 1,
      "conditionsProcessed": 2,
      "totalQuantityReturned": 3
    }
  }
}
```

#### Test Case 2.2: Complex Scenario - Good + Damaged + Lost
```json
{
  "items": [
    {
      "itemId": "{{testItemId1}}",
      "conditions": [
        {
          "kondisiAkhir": "Baik - dikembalikan tepat waktu",
          "jumlahKembali": 1
        },
        {
          "kondisiAkhir": "Rusak berat - tidak bisa diperbaiki",
          "jumlahKembali": 1,
          "modalAwal": 150000
        },
        {
          "kondisiAkhir": "Hilang/tidak dikembalikan",
          "jumlahKembali": 0,
          "modalAwal": 150000
        }
      ]
    }
  ],
  "catatan": "Kondisi campuran: 1 baik, 1 rusak berat, 1 hilang"
}
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "totalPenalty": 300000,
    "processedItems": [...],
    "processingMode": "multi-condition",
    "multiConditionSummary": {
      "totalItems": 1,
      "conditionsProcessed": 3,
      "totalQuantityReturned": 2,
      "totalQuantityLost": 1
    }
  }
}
```

#### Test Case 2.3: Late Multi-Condition Return
```json
{
  "items": [
    {
      "itemId": "{{testItemId1}}",
      "conditions": [
        {
          "kondisiAkhir": "Baik - dikembalikan terlambat",
          "jumlahKembali": 2
        },
        {
          "kondisiAkhir": "Rusak ringan - bisa diperbaiki",
          "jumlahKembali": 1,
          "modalAwal": 50000
        }
      ]
    }
  ],
  "catatan": "Terlambat dengan kondisi campuran",
  "tglKembali": "2025-07-30T10:00:00.000Z"
}
```

### 3. Error Scenarios

#### Test Case 3.1: Validation Error - Invalid Condition Format
```json
{
  "items": [
    {
      "itemId": "{{testItemId1}}",
      "conditions": [
        {
          "kondisiAkhir": "Hilang/tidak dikembalikan",
          "jumlahKembali": 1
        }
      ]
    }
  ]
}
```

**Expected Response**: HTTP 400
```json
{
  "success": false,
  "error": {
    "message": "Validasi barang hilang gagal. Periksa kondisi dan jumlah kembali.",
    "code": "LOST_ITEM_VALIDATION_ERROR",
    "details": [
      {
        "field": "items.0.conditions.0.jumlahKembali",
        "message": "Multi-condition validation failed for condition 1: Hilang/tidak dikembalikan",
        "suggestions": [
          "Untuk barang hilang dalam multi-condition, set jumlahKembali = 0",
          "Pisahkan barang hilang dan barang yang dikembalikan ke kondisi terpisah"
        ]
      }
    ]
  }
}
```

#### Test Case 3.2: Business Rule Error - Quantity Mismatch
```json
{
  "items": [
    {
      "itemId": "{{testItemId1}}",
      "conditions": [
        {
          "kondisiAkhir": "Baik - dikembalikan tepat waktu",
          "jumlahKembali": 10
        }
      ]
    }
  ]
}
```

**Expected Response**: HTTP 400
```json
{
  "success": false,
  "error": {
    "message": "Data pengembalian tidak valid",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "items.0.conditions.0.jumlahKembali",
        "message": "Total jumlah kembali (10) melebihi jumlah yang disewa (3)"
      }
    ]
  }
}
```

#### Test Case 3.3: Transaction Not Found
```json
PUT /api/kasir/transaksi/TXN-NONEXISTENT/pengembalian
```

**Expected Response**: HTTP 404
```json
{
  "success": false,
  "error": {
    "message": "Transaksi tidak ditemukan",
    "code": "NOT_FOUND"
  }
}
```

#### Test Case 3.4: Already Returned Transaction
```json
{
  "items": [
    {
      "itemId": "{{testItemId1}}",
      "kondisiAkhir": "Baik - dikembalikan tepat waktu",
      "jumlahKembali": 1
    }
  ]
}
```

**Expected Response**: HTTP 409
```json
{
  "success": false,
  "error": {
    "message": "Transaksi sudah dikembalikan sebelumnya",
    "code": "ALREADY_RETURNED",
    "currentStatus": "DIKEMBALIKAN",
    "originalReturnDate": "2025-08-07T10:00:00.000Z"
  }
}
```

### 4. Mixed Mode Processing
**Purpose**: Test automatic detection and intelligent routing

#### Test Case 4.1: Mixed Single and Multi-Condition Items
```json
{
  "items": [
    {
      "itemId": "{{testItemId1}}",
      "kondisiAkhir": "Baik - dikembalikan tepat waktu",
      "jumlahKembali": 1
    },
    {
      "itemId": "{{testItemId2}}",
      "conditions": [
        {
          "kondisiAkhir": "Baik - dikembalikan tepat waktu",
          "jumlahKembali": 2
        },
        {
          "kondisiAkhir": "Rusak ringan - bisa diperbaiki",
          "jumlahKembali": 1,
          "modalAwal": 50000
        }
      ]
    }
  ]
}
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "processingMode": "mixed-mode",
    "processedItems": [
      {
        "itemId": "uuid1",
        "isMultiCondition": false,
        "kondisiAkhir": "Baik - dikembalikan tepat waktu",
        "quantityReturned": 1
      },
      {
        "itemId": "uuid2",
        "isMultiCondition": true,
        "conditionBreakdown": [...]
      }
    ]
  }
}
```

### 5. Performance and Edge Cases

#### Test Case 5.1: Large Multi-Condition Request
```json
{
  "items": [
    {
      "itemId": "{{testItemId1}}",
      "conditions": [
        {"kondisiAkhir": "Baik - dikembalikan tepat waktu", "jumlahKembali": 20},
        {"kondisiAkhir": "Rusak ringan - bisa diperbaiki", "jumlahKembali": 15, "modalAwal": 50000},
        {"kondisiAkhir": "Rusak sedang - perlu perbaikan", "jumlahKembali": 10, "modalAwal": 75000},
        {"kondisiAkhir": "Rusak berat - tidak bisa diperbaiki", "jumlahKembali": 8, "modalAwal": 150000},
        {"kondisiAkhir": "Hilang/tidak dikembalikan", "jumlahKembali": 0, "modalAwal": 150000}
      ]
    }
  ]
}
```

**Performance Requirements**:
- Response time < 300ms
- Memory usage < 50MB
- Successful atomic transaction processing

#### Test Case 5.2: Empty Conditions Array
```json
{
  "items": [
    {
      "itemId": "{{testItemId1}}",
      "conditions": []
    }
  ]
}
```

**Expected Response**: HTTP 400 with validation error

#### Test Case 5.3: Detailed Response Request
```http
PUT /api/kasir/transaksi/{{testTransaksiKode}}/pengembalian?includeDetails=true
```

**Expected Response Enhancement**:
```json
{
  "success": true,
  "data": {
    "multiConditionBreakdown": {
      "itemDetails": [...],
      "penaltyCalculation": [...],
      "summaryMetrics": [...]
    }
  }
}
```

## Test Execution Steps

### Step 1: Environment Setup
1. Start development server: `yarn app`
2. Set up test database with sample transactions
3. Configure Postman environment variables
4. Obtain valid Clerk authentication token

### Step 2: Create Test Transaction
```bash
# Use existing transaction creation API or database seeding
# Ensure transaction has status DISEWAIKAN and multiple items
```

### Step 3: Execute Test Suite
1. **Backward Compatibility Tests**: Run cases 1.1-1.3
2. **Multi-Condition Tests**: Run cases 2.1-2.3  
3. **Error Handling Tests**: Run cases 3.1-3.4
4. **Mixed Mode Tests**: Run case 4.1
5. **Performance Tests**: Run cases 5.1-5.3

### Step 4: Verification Checklist
- [ ] All single-condition requests process correctly
- [ ] Multi-condition requests detect mode automatically
- [ ] Validation errors provide helpful suggestions
- [ ] Business rules enforced consistently
- [ ] Response times under 300ms
- [ ] Database transactions are atomic
- [ ] Audit trail captured completely

### Step 5: Data Verification
```sql
-- Verify TransaksiItemReturn records created
SELECT * FROM "TransaksiItemReturn" WHERE "transaksiItemId" IN (...);

-- Verify TransaksiItem multi-condition summary updated  
SELECT 
  "id",
  "isMultiCondition", 
  "multiConditionSummary",
  "totalReturnPenalty"
FROM "TransaksiItem" WHERE "transaksiId" = '...';

-- Verify main transaction status updated
SELECT "status", "tglKembali", "totalPenalty" 
FROM "Transaksi" WHERE "kode" = 'TXN-...';
```

## Troubleshooting Guide

### Common Issues

1. **Authentication Errors (401)**
   - Verify Clerk token is valid and not expired
   - Ensure user has kasir/owner role permissions
   - Check middleware configuration

2. **Validation Errors (400)**
   - Verify request format matches expected schema
   - Check quantity constraints vs item availability
   - Validate lost item rules (jumlahKembali = 0)

3. **Transaction Not Found (404)**
   - Verify transaction code format (TXN-YYYYMMDD-NNN)
   - Ensure transaction exists and belongs to authenticated user
   - Check transaction status is DISEWAIKAN

4. **Already Returned (409)**
   - Check if transaction was previously processed
   - Use different test transaction or reset test data
   - Verify idempotent handling works correctly

5. **Performance Issues**
   - Monitor response times with large datasets
   - Check database query performance
   - Verify proper indexing on new tables

### Debug Tips

1. **Enable Detailed Logging**
   ```bash
   # Set log level to debug in environment
   LOG_LEVEL=debug yarn app
   ```

2. **Monitor Database Performance**
   ```sql
   -- Check query execution time
   EXPLAIN ANALYZE SELECT * FROM "TransaksiItemReturn";
   ```

3. **Test Atomic Transactions**
   - Introduce deliberate failures mid-process
   - Verify rollback behavior
   - Check data consistency

4. **Validate Response Structure**
   - Use JSON schema validation
   - Verify all expected fields present
   - Check data type consistency

## Success Criteria

### Functional Requirements
- [ ]  Backward compatibility maintained (100% existing functionality)
- [ ]  Multi-condition processing works correctly
- [ ]  Automatic mode detection functions properly
- [ ]  Validation provides helpful error messages
- [ ]  Business rules enforced consistently

### Performance Requirements  
- [ ]  Response time < 300ms for typical requests
- [ ]  Memory usage < 50MB per request
- [ ]  Database transactions atomic and consistent
- [ ]  No performance regression vs single-condition

### Quality Requirements
- [ ]  All error scenarios handled gracefully
- [ ]  Comprehensive audit trail maintained
- [ ]  Data integrity preserved across operations
- [ ]  Security validations working properly

This comprehensive testing guide ensures the TSK-24 multi-condition return system works correctly across all scenarios while maintaining backward compatibility and system reliability.