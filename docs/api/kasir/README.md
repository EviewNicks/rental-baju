# Dana Kasir API Testing Guide

Dokumentasi lengkap untuk testing Dana Kasir Management API endpoints menggunakan Postman.

## 📋 Overview

Dana Kasir Management menyediakan API untuk:
- **Expense Management**: CRUD operations untuk pengeluaran kasir
- **Daily Summary**: View income dan expenses untuk tanggal tertentu
- **Role-Based Access**: Kasir (write), Owner (read-only)

## 🚀 Quick Start

### 1. Import Postman Collections

Import kedua file collection ke Postman:
- `pengeluaran.json` - Expense CRUD operations
- `dana-summary.json` - Daily summary endpoint

### 2. Get Authentication Token

1. Login ke aplikasi di browser
2. Buka Developer Tools (F12)
3. Go to Application → Cookies
4. Copy value dari cookie `__session`
5. Paste ke Postman variable `clerk_session_token`

### 3. Set Variables

Update collection variables:
- `base_url`: Default `http://localhost:3000`
- `test_date`: Format `YYYY-MM-DD` (e.g., `2025-01-29`)

## 📡 API Endpoints

### 1. Expense Management (`pengeluaran.json`)

#### GET /api/kasir/pengeluaran
Get list of expenses untuk tanggal tertentu.

**Query Parameters:**
- `date` (optional): Format YYYY-MM-DD. Default: today

**Auth:** Kasir (read), Owner (read)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "kasirId": "kasir-uuid",
      "harga": 50000,
      "kategori": "Operasional",
      "deskripsi": "Beli pulsa",
      "isActive": true,
      "createdAt": "2025-01-29T10:30:00Z",
      "updatedAt": "2025-01-29T10:30:00Z",
      "createdBy": "user-123",
      "kasir": {
        "id": "kasir-uuid",
        "nama": "Budi Santoso"
      }
    }
  ]
}
```

#### POST /api/kasir/pengeluaran
Create new expense record.

**Auth:** Kasir (write only)

**Body:**
```json
{
  "harga": 75000,
  "kategori": "Transport",
  "deskripsi": "Bensin motor untuk antar produk"
}
```

**Validation:**
- `harga`: Positive number, max 999999999.99
- `kategori`: Operasional, Maintenance, Transport, Lainnya
- `deskripsi`: Max 500 characters (optional)

#### PUT /api/kasir/pengeluaran/[id]
Update existing expense.

**Auth:** Kasir (write only, own expenses)

**Body:**
```json
{
  "harga": 80000,
  "kategori": "Transport",
  "deskripsi": "Updated description"
}
```

#### DELETE /api/kasir/pengeluaran/[id]
Soft delete expense (sets isActive=false).

**Auth:** Kasir (write only, own expenses)

**Response:**
```json
{
  "success": true,
  "message": "Expense deleted successfully"
}
```

### 2. Dana Summary (`dana-summary.json`)

#### GET /api/kasir/dana-summary
Get daily summary dengan income dan expense data.

**Query Parameters:**
- `date` (optional): Format YYYY-MM-DD. Default: today

**Auth:** Kasir (read), Owner (read)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalIncome": 500000,
      "totalExpense": 150000,
      "netBalance": 350000,
      "date": "2025-01-29"
    },
    "income": [
      {
        "transaksiKode": "TRX001",
        "customerName": "John Doe",
        "rentalAmount": 450000,
        "penaltyAmount": 50000,
        "status": "completed",
        "kasirId": "kasir-uuid",
        "kasirName": "Budi Santoso",
        "createdAt": "2025-01-29T10:00:00Z"
      }
    ],
    "expenses": [
      {
        "id": "expense-uuid",
        "kasirId": "kasir-uuid",
        "harga": 75000,
        "kategori": "Transport",
        "deskripsi": "Bensin motor",
        "isActive": true,
        "createdAt": "2025-01-29T14:20:00Z",
        "updatedAt": "2025-01-29T14:20:00Z",
        "createdBy": "user-123",
        "kasir": {
          "id": "kasir-uuid",
          "nama": "Budi Santoso"
        }
      }
    ]
  }
}
```

## 🧪 Testing Scenarios

### Scenario 1: Create and View Expense

1. **POST** `/api/kasir/pengeluaran` - Create expense
2. **GET** `/api/kasir/pengeluaran?date=2025-01-29` - Verify expense appears
3. **GET** `/api/kasir/dana-summary?date=2025-01-29` - Verify in summary

### Scenario 2: Update Expense

1. **POST** `/api/kasir/pengeluaran` - Create expense (save ID)
2. **PUT** `/api/kasir/pengeluaran/[id]` - Update expense
3. **GET** `/api/kasir/pengeluaran` - Verify changes

### Scenario 3: Delete Expense

1. **POST** `/api/kasir/pengeluaran` - Create expense (save ID)
2. **DELETE** `/api/kasir/pengeluaran/[id]` - Soft delete
3. **GET** `/api/kasir/pengeluaran` - Verify not in list

### Scenario 4: Validation Errors

1. **POST** with negative amount - Expect 400 error
2. **POST** with invalid category - Expect 400 error
3. **GET** with invalid date format - Expect 400 error

## ⚠️ Common Errors

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "message": "Unauthorized",
    "code": "UNAUTHORIZED"
  }
}
```
**Solution:** Update `clerk_session_token` variable

### 400 Validation Error
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [...]
  }
}
```
**Solution:** Check request body format and values

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "message": "Only Kasir can perform this action",
    "code": "FORBIDDEN"
  }
}
```
**Solution:** Login dengan user yang memiliki role Kasir

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "message": "Expense not found",
    "code": "NOT_FOUND"
  }
}
```
**Solution:** Verify expense ID exists and is active

## 📊 Automated Tests

Kedua collection sudah include automated tests:

### Pengeluaran Tests
- ✅ Response structure validation
- ✅ Success/error response format
- ✅ Performance check (<2s)
- ✅ Auto-capture expense_id

### Dana Summary Tests
- ✅ Response structure validation
- ✅ Summary fields validation
- ✅ Net balance calculation check
- ✅ Performance check (<2s)

## 🔧 Tips

1. **Run in Order**: Execute requests dalam urutan yang logis (Create → Read → Update → Delete)
2. **Check Variables**: Pastikan `expense_id` ter-capture setelah create
3. **Date Format**: Selalu gunakan format YYYY-MM-DD untuk date parameter
4. **Role Testing**: Test dengan user Kasir dan Owner untuk verify access control
5. **Performance**: Monitor response time, target <2s

## 📚 References

- Design Document: `.kiro/specs/dana-kasir-management/design.md`
- Requirements: `.kiro/specs/dana-kasir-management/requirements.md`
- Tasks: `.kiro/specs/dana-kasir-management/tasks.md`
- API Implementation: `app/api/kasir/pengeluaran/`, `app/api/kasir/dana-summary/`
