# Task: Role-Based Expense Visibility & Permission System

## Overview
Implementasi sistem role-based untuk visibility dan permission pengeluaran pada Dana Kasir dengan 2 role utama: Kasir dan Owner. Sistem ini memisahkan akses berdasarkan kasirId tanpa mengubah database schema.

## 🎯 Tujuan Utama
Memisahkan visibility dan permission pengeluaran antara Kasir dan Owner menggunakan kasirId sebagai role identifier.

## 🔧 Konsep Teknis
- **Owner** = special kasir account dengan `kasirId: "owner-system"`
- **Filtering**: berdasarkan kasirId (bukan createdBy)
- **Permissions**: kombinasi kasirId + createdBy

## 👥 Role Behavior

### Kasir User:
- ✅ **Lihat**: pengeluaran dengan `kasirId != "owner-system"`
- ✅ **Edit/Delete**: hanya pengeluaran sendiri (`createdBy` match)
- ❌ **Tidak bisa lihat**: pengeluaran Owner

### Owner User:
- ✅ **Lihat**: semua pengeluaran (termasuk `kasirId = "owner-system"`)
- ✅ **Filter**: dropdown "Semua/Kasir/Owner"
- ✅ **Edit/Delete**: hanya pengeluaran Owner sendiri
- ✅ **Create**: otomatis pakai `kasirId = "owner-system"`

## Implementation Plan

### 1. API Backend Changes
- [x] Modify `/api/kasir/dana-summary` route untuk role-based filtering
- [x] Update DanaSummaryService dengan visibility logic
- [x] Implement permission checks untuk edit/delete operations
- [x] Add role detection dari user session

### 2. Frontend Dashboard Changes
- [x] Update DanaKasirDashboard dengan role-based state management
- [x] Modify ExpenseList untuk conditional visibility
- [x] Update kasir filter logic untuk Owner role
- [x] Implement permission-based UI controls

### 3. Service Layer Updates
- [x] Update pengeluaranService dengan role-based queries
- [x] Implement visibility filters berdasarkan user role
- [x] Add permission validation untuk CRUD operations
- [x] Update kasir list filtering logic

### 4. UI/UX Enhancements
- [x] Add role indicators di UI components
- [x] Update filter dropdown behavior untuk Owner
- [x] Implement conditional rendering untuk action buttons
- [x] Add contextual messages untuk empty states

### 5. Testing & Validation
- [ ] Test Kasir user visibility (tidak lihat Owner expenses)
- [ ] Test Owner user visibility (lihat semua expenses)
- [ ] Test permission controls (edit/delete restrictions)
- [ ] Test filter functionality untuk Owner role
- [ ] Validate summary calculations dengan filtered data

## Technical Implementation Details

### Role Detection Logic
```typescript
// Detect user role from kasirId
const isOwnerRole = userKasirId === 'owner-system'
const isKasirRole = userKasirId !== 'owner-system'
```

### Visibility Filters
```typescript
// Kasir User: Hide Owner expenses
const kasirVisibilityFilter = {
  kasirId: { not: 'owner-system' }
}

// Owner User: Show all (with optional filter)
const ownerVisibilityFilter = selectedKasirId 
  ? { kasirId: selectedKasirId }
  : {} // Show all
```

### Permission Checks
```typescript
// Edit/Delete permission logic
const canModifyExpense = (expense, currentUserId, userRole) => {
  const isOwner = expense.createdBy === currentUserId
  const isCorrectRole = userRole === 'owner' 
    ? expense.kasirId === 'owner-system'
    : expense.kasirId !== 'owner-system'
  
  return isOwner && isCorrectRole
}
```

## Files to Modify

### Backend Files:
1. `app/api/kasir/dana-summary/route.ts` - Add role-based filtering
2. `features/dana-kasir/services/danaSummaryService.ts` - Update visibility logic
3. `features/dana-kasir/services/pengeluaranService.ts` - Add permission checks

### Frontend Files:
1. `features/dana-kasir/components/DanaKasirDashboard.tsx` - Role state management
2. `features/dana-kasir/components/ExpenseList.tsx` - Conditional rendering
3. `features/dana-kasir/hooks/useDanaSummary.ts` - Role-aware data fetching

## Expected Behavior

### For Kasir Role:
- Dashboard shows only kasir expenses (tidak ada Owner expenses)
- Kasir filter dropdown shows kasir lain (exclude Owner)
- Edit/delete hanya expense sendiri
- Summary calculation exclude Owner expenses

### For Owner Role:
- Dashboard shows semua expenses (Owner + semua Kasir)
- Kasir filter dropdown: "Semua/Owner/Kasir X"
- Edit/delete hanya Owner expenses sendiri
- Summary calculation include semua (sesuai filter)

## Implementation Priority

### Phase 1: Core Visibility (High Priority)
- [ ] API route role detection
- [ ] Basic visibility filtering
- [ ] Dashboard role-based rendering

### Phase 2: Permission System (Medium Priority)
- [ ] Edit/delete permission checks
- [ ] UI action button controls
- [ ] Error handling untuk unauthorized actions

### Phase 3: UX Enhancements (Low Priority)
- [ ] Role indicators
- [ ] Contextual empty states
- [ ] Filter behavior optimization

## ✅ Implementation Summary

### **Phase 1: Core Visibility (COMPLETED)**

#### **Backend Implementation:**
1. **API Route Enhancement** (`app/api/kasir/dana-summary/route.ts`)
   - Added role detection from Clerk authentication
   - Implemented user kasirId mapping (Owner = 'owner-system', Kasir = from database)
   - Added role-based filtering logic

2. **Service Layer Updates** (`features/dana-kasir/services/danaSummaryService.ts`)
   - Added `getDailyDataWithRoleFilter()` method
   - Implemented role-based visibility filters:
     - Kasir: `kasirId != "owner-system"` (exclude Owner expenses)
     - Owner: No restrictions (see all expenses)
   - Added separate methods for summary, income, and expense filtering

#### **Frontend Implementation:**
1. **Hook Updates** (`features/dana-kasir/hooks/useDanaSummary.ts`)
   - Simplified API calls (role detection server-side)
   - Updated error handling for new error codes

2. **Dashboard Component** (`features/dana-kasir/components/DanaKasirDashboard.tsx`)
   - Added `useAuth` for currentUserId
   - Pass role and userId to child components
   - Updated comments for role-based behavior

3. **ExpenseList Component** (`features/dana-kasir/components/ExpenseList.tsx`)
   - Implemented granular permission checks:
     - Kasir: Edit/delete own expenses (exclude Owner expenses)
     - Owner: Edit/delete own Owner expenses only
   - Added role-based empty state messages
   - Enhanced UI with contextual help text

4. **Filter Components** (`features/dana-kasir/components/KasirFilter.tsx`)
   - Role-based filter options:
     - Kasir: Only see other kasir (no Owner option)
     - Owner: See all including Owner (Owner listed first)
   - Updated dropdown labels based on role

5. **DateNavigation Component** (`features/dana-kasir/components/DateNavigation.tsx`)
   - Pass userRole to KasirFilter
   - Maintain existing functionality

### **Key Features Implemented:**

#### **🔒 Role-Based Visibility:**
- **Kasir Users**: Only see expenses from other kasir (kasirId != "owner-system")
- **Owner Users**: See all expenses with optional kasir filter

#### **🛡️ Permission System:**
- **Edit/Delete Logic**: Users can only modify expenses they created within their role scope
- **Kasir**: Can edit/delete own kasir expenses (not Owner expenses)
- **Owner**: Can edit/delete own Owner expenses only

#### **🎨 UI/UX Enhancements:**
- **Role Indicators**: Visual badges for Owner vs Kasir expenses
- **Contextual Messages**: Different empty states based on role and filter
- **Smart Filtering**: Owner option hidden from Kasir users
- **Permission-based Actions**: Edit/delete buttons only show when allowed

#### **⚡ Performance Optimizations:**
- **Server-side Filtering**: Role detection and filtering at database level
- **Conditional Queries**: Efficient WHERE clauses based on role
- **Separate Cache Keys**: React Query caching per kasir filter

### **🎯 Expected Behavior:**

#### **For Kasir Role:**
✅ Dashboard shows only kasir expenses (no Owner expenses)  
✅ Kasir filter dropdown excludes Owner option  
✅ Edit/delete only own expenses  
✅ Summary calculation excludes Owner expenses  
✅ Contextual empty state messages  

#### **For Owner Role:**
✅ Dashboard shows all expenses (Owner + all Kasir)  
✅ Kasir filter dropdown includes "Owner" option (listed first)  
✅ Edit/delete only own Owner expenses  
✅ Summary calculation includes all (based on selected filter)  
✅ "Semua" instead of "Semua Kasir" in filter dropdown  

### **🔧 Technical Architecture:**

```typescript
// Role Detection Flow
User Login → Clerk Auth → Role from publicMetadata → KasirId Mapping
                                    ↓
                    Owner → 'owner-system'
                    Kasir → Database lookup via getKasirFromUser()

// Visibility Filter Flow  
API Request → Role Detection → Build WHERE Clause → Database Query
                                    ↓
            Kasir: { kasirId: { not: 'owner-system' } }
            Owner: { /* optional kasirId filter */ }

// Permission Check Flow
Action Request → Check createdBy + Role Scope → Allow/Deny
                                    ↓
        Kasir: createdBy === userId && kasirId !== 'owner-system'
        Owner: createdBy === userId && kasirId === 'owner-system'
```

### **🚀 Ready for Testing**

The role-based expense visibility and permission system is now fully implemented and ready for comprehensive testing. All core functionality has been completed according to the requirements.