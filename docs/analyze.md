# Analisis Flow System - PengeluaranForm & PengeluaranService

## Overview
Sistem pengelolaan pengeluaran kasir dengan dukungan role-based access (Kasir & Owner) yang memungkinkan pencatatan, editing, dan penghapusan pengeluaran dengan validasi dan audit trail yang lengkap.

## Architecture Flow

### 1. Component Layer (PengeluaranForm.tsx)

#### State Management
- **Form Data**: kasirId, harga, kategori, deskripsi
- **UI State**: amountInput (formatted), errors, kasirList, loading states
- **Mode Detection**: isEditMode berdasarkan initialData

#### Key Features
- **Role-based UI**: Menampilkan role indicator (Owner/Kasir)
- **Dynamic Kasir Selection**: Fetch kasir list dari API untuk dropdown
- **Currency Formatting**: Real-time Rupiah formatting untuk input amount
- **Client-side Validation**: Menggunakan Zod schema validation
- **Error Handling**: Per-field error display dengan auto-clear

#### Data Flow
```
Modal Open → Fetch Kasir List → Form Reset/Populate → User Input → Validation → Submit → API Call → Success/Error Handling
```

### 2. Service Layer (PengeluaranService.ts)

#### Core Responsibilities
- **CRUD Operations**: Create, Read, Update, Soft Delete
- **Data Validation**: Server-side validation menggunakan Zod
- **Audit Trail**: Tracking createdBy, updatedAt
- **Timezone Handling**: WITA timezone untuk date filtering
- **Relationship Management**: Kasir relation dengan validation

#### Database Operations
- **Create**: Validate kasirId exists → Create with audit fields
- **Update**: Check existence → Validate kasirId → Update allowed fields only
- **Soft Delete**: Set isActive = false (preserve audit trail)
- **Query**: Date-based filtering dengan timezone support

### 3. Integration Points

#### API Endpoints
- **GET /api/kasir/kasir**: Fetch active kasir list untuk dropdown
- **POST/PUT/DELETE**: Expense CRUD operations via hooks

#### Hooks Integration
- **useCreatePengeluaran**: Create mutation dengan optimistic updates
- **useUpdatePengeluaran**: Update mutation dengan error handling

#### Validation Layer
- **Client-side**: Real-time validation dengan Zod schemas
- **Server-side**: Double validation di service layer

## Security & Authorization

### Current Implementation
- **Authentication**: Clerk userId untuk audit trail
- **Authorization**: Role-based access di API route level
- **Data Integrity**: Soft delete untuk audit trail preservation

### Role Permissions
- **Kasir Role**: Can create/edit/delete any expense
- **Owner Role**: Same permissions as Kasir (currently)

## Data Flow Diagram

```
[User Input] → [Client Validation] → [Form Submit] → [Hook Mutation] → [API Route] → [Service Layer] → [Database] → [Response] → [UI Update]
```

## Key Improvements Needed

### 1. Role-based Kasir Selection
**Problem**: Owner harus memilih kasir dari dropdown
**Solution**: Auto-populate kasirId untuk Owner role

### 2. Owner-specific Logic
**Current**: Semua role menggunakan dropdown kasir
**Needed**: Owner role bypass kasir selection, auto-set ke "Owner"

## Technical Considerations

### Performance
- **Kasir List Caching**: Fetch only when modal opens
- **Optimistic Updates**: Immediate UI feedback
- **Lazy Loading**: Modal content loaded on demand

### Error Handling
- **Network Errors**: Toast notifications dengan retry logic
- **Validation Errors**: Per-field error display
- **Server Errors**: Graceful degradation dengan user feedback

### Mobile Responsiveness
- **Input Types**: inputMode="numeric" untuk amount
- **Button Layout**: Responsive flex layout
- **Touch Targets**: Adequate button sizes

## Future Enhancements

1. **Role-based Field Visibility**: Hide kasir selection untuk Owner
2. **Bulk Operations**: Multiple expense creation/editing
3. **Export Functionality**: PDF/Excel export untuk reporting
4. **Advanced Filtering**: Category, date range, kasir filtering
5. **Approval Workflow**: Multi-level approval untuk large expenses