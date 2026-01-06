# Pengeluaran System Flow Analysis

## Overview
Sistem pengeluaran (expense management) dalam Dana Kasir module yang mengelola pencatatan dan pengelolaan pengeluaran kasir dengan fitur CRUD lengkap, validasi, dan audit trail.

## System Architecture

### Core Components
1. **PengeluaranService** - Service layer untuk operasi database
2. **PengeluaranForm** - UI component untuk form input/edit
3. **Validation Schema** - Zod schema untuk validasi data
4. **Types & Interfaces** - Type definitions untuk type safety

## Flow Diagrams

### 1. Create Pengeluaran Flow

```
User Action → Form Validation → Service Layer → Database → Response
     ↓              ↓              ↓            ↓         ↓
[Click Add] → [Zod Validate] → [Create Method] → [Prisma] → [Success/Error]
     ↓              ↓              ↓            ↓         ↓
[Fill Form] → [Client Side] → [Audit Fields] → [Insert] → [Toast Message]
     ↓              ↓              ↓            ↓         ↓
[Submit] → [Error Display] → [Transform] → [Include Kasir] → [Close Modal]
```

#### Detailed Create Flow:

**Frontend (PengeluaranForm.tsx):**
1. User clicks "Tambah Pengeluaran" button
2. Modal opens with empty form
3. System fetches kasir list from `/api/kasir/kasir?limit=100&isActive=true`
4. User fills form fields:
   - **kasirId**: Selected from dropdown (required)
   - **harga**: Amount with Rupiah formatting (required)
   - **kategori**: Category from predefined list (required)
   - **deskripsi**: Optional description (max 500 chars)
5. Real-time validation on field changes
6. Form submission triggers client-side Zod validation
7. If valid, calls `useCreatePengeluaran` hook
8. Shows loading state with spinner
9. On success: toast message + modal close + data refresh
10. On error: display error message

**Backend (PengeluaranService.ts):**
1. Receives `CreatePengeluaranRequest` data
2. Validates using `createPengeluaranSchema`
3. Checks if kasirId exists in Kasir table
4. Creates record with audit fields:
   - `kasirId`: From request data
   - `harga`: Converted to Prisma.Decimal
   - `kategori`: Expense category
   - `deskripsi`: Optional description
   - `createdBy`: Current user ID (Clerk)
   - `isActive`: Set to true
5. Includes kasir relation in response
6. Transforms Prisma result to application type
7. Returns created expense with kasir info

### 2. Update Pengeluaran Flow

```
User Action → Load Data → Form Validation → Service Layer → Database → Response
     ↓           ↓           ↓              ↓            ↓         ↓
[Click Edit] → [Populate] → [Zod Validate] → [Update Method] → [Prisma] → [Success/Error]
     ↓           ↓           ↓              ↓            ↓         ↓
[Modal Open] → [Form Fields] → [Client Side] → [Authorization] → [Update] → [Toast Message]
     ↓           ↓           ↓              ↓            ↓         ↓
[Edit Form] → [Validation] → [Error Display] → [Transform] → [Include Kasir] → [Close Modal]
```

#### Detailed Update Flow:

**Frontend (PengeluaranForm.tsx):**
1. User clicks edit button on expense item
2. Modal opens with `initialData` populated
3. Form fields pre-filled with existing values:
   - `kasirId`: Current kasir selection
   - `harga`: Formatted amount
   - `kategori`: Current category
   - `deskripsi`: Current description
4. User modifies desired fields
5. Real-time validation on changes
6. Form submission triggers client-side validation
7. Calls `useUpdatePengeluaran` hook with expense ID
8. Shows loading state
9. On success: toast + modal close + refresh
10. On error: display error message

**Backend (PengeluaranService.ts):**
1. Receives expense ID and `UpdatePengeluaranRequest`
2. Validates using `updatePengeluaranSchema`
3. Checks if expense exists and is active
4. **Authorization check**: Verifies user owns the expense
5. If kasirId provided, validates kasir exists
6. Prepares update data (only allowed fields):
   - `kasirId`: Optional kasir change
   - `harga`: Optional amount change
   - `kategori`: Optional category change
   - `deskripsi`: Optional description change
7. Updates record (updatedAt auto-set by Prisma)
8. Includes kasir relation in response
9. Transforms and returns updated expense

## System Features

### 1. Data Validation
- **Client-side**: Zod schemas for immediate feedback
- **Server-side**: Same schemas for security
- **Field validation**:
  - kasirId: Required, must exist in Kasir table
  - harga: Required, positive number, converted to Decimal
  - kategori: Required, must be from predefined list
  - deskripsi: Optional, max 500 characters

### 2. Security & Authorization
- **Ownership validation**: Users can only edit/delete their own expenses
- **Soft delete**: Preserves audit trail
- **Input sanitization**: Zod validation prevents injection
- **Type safety**: TypeScript throughout the stack

### 3. User Experience
- **Real-time validation**: Immediate error feedback
- **Loading states**: Visual feedback during operations
- **Error handling**: User-friendly error messages
- **Mobile-friendly**: Responsive design
- **Accessibility**: ARIA labels and proper form structure

### 4. Audit Trail
- **createdBy**: Tracks who created the expense
- **createdAt**: Automatic timestamp
- **updatedAt**: Automatic update timestamp
- **isActive**: Soft delete flag
- **Immutable fields**: ID, createdAt, createdBy preserved

## API Endpoints Integration

### Kasir List Endpoint
```
GET /api/kasir/kasir?limit=100&isActive=true
```
- Used to populate kasir dropdown
- Returns simplified list: `{id, nama}`
- Filtered for active kasir only
- Ordered by nama ascending

### Expense CRUD Operations
- **Create**: POST to expense endpoint
- **Update**: PUT/PATCH to expense endpoint
- **Delete**: Soft delete via service
- **Read**: GET operations with date filtering

## Error Handling Strategy

### Client-Side Errors
1. **Validation errors**: Field-level error display
2. **Network errors**: Toast notifications
3. **Loading states**: Prevent multiple submissions
4. **Form state**: Preserve user input on errors

### Server-Side Errors
1. **Validation failures**: Detailed error messages
2. **Authorization errors**: Clear access denied messages
3. **Database errors**: Generic error messages (security)
4. **Not found errors**: Specific resource not found messages

## Performance Considerations

### Frontend Optimizations
- **Lazy loading**: Modal content loaded on demand
- **Debounced validation**: Reduce validation calls
- **Memoized components**: Prevent unnecessary re-renders
- **Optimistic updates**: Immediate UI feedback

### Backend Optimizations
- **Database indexes**: On frequently queried fields
- **Selective includes**: Only fetch needed relations
- **Pagination**: Limit large result sets
- **Connection pooling**: Efficient database connections

## Data Flow Summary

### Create Flow
```
Form Input → Validation → API Call → Service → Database → Response → UI Update
```

### Update Flow
```
Load Data → Form Input → Validation → API Call → Service → Authorization → Database → Response → UI Update
```

### Key Characteristics
- **Atomic operations**: Each expense operation is isolated
- **Consistent validation**: Same rules client and server
- **Audit compliance**: Full tracking of changes
- **User-centric**: Operations scoped to user's kasir
- **Resilient**: Graceful error handling throughout

## Integration Points

### With Kasir System
- Validates kasir existence
- Fetches active kasir list
- Links expenses to specific kasir

### With Authentication
- Uses Clerk user ID for audit trail
- Enforces ownership-based access control

### With UI Components
- Integrates with shadcn/ui components
- Uses consistent design patterns
- Follows accessibility guidelines

This flow ensures data integrity, user security, and optimal user experience while maintaining clean separation of concerns between frontend and backend layers.