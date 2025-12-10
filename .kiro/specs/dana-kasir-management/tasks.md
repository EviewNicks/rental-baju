# Implementation Plan - Dana Kasir Management

## Overview

This implementation plan breaks down the Dana Kasir Management feature into discrete, manageable tasks. Each task builds incrementally on previous work, following a "Keep It Simple" approach with **MVP-first, no testing overhead**.

**Implementation Strategy:**
- Phase 1: Database & Core Services (Foundation)
- Phase 2: API Layer (Business Logic)
- Phase 3: UI Components (Presentation)
- Phase 4: Integration & Polish (Final touches)

**Timeline Estimate:** 2-3 weeks for MVP (without testing)

**Note:** All testing tasks have been removed to focus on rapid MVP delivery. Testing can be added later if needed.

---

## Phase 1: Database Foundation & Core Services

### - [x] 1. Database Schema Implementation

- [x] 1.1 Create Prisma migration for PengeluaranKasir model
  - Add PengeluaranKasir model to schema.prisma
  - Include all fields: id, kasirId, harga, kategori, deskripsi, isActive, createdAt, updatedAt, createdBy
  - Add relation to Kasir model
  - Add indexes for performance (kasirId + createdAt, isActive, createdAt)
  - _Requirements: 2.3, 12.1, 12.2_

- [x] 1.2 Generate and test migration
  - Run `npx prisma push `
  - migrate prisma kita sednag bermaslaah jadi kedpeannya guankan prisma push saja untuk mengupdate schema prisma 
  - Test rollback capability
  - _Requirements: All database-related requirements_

- [x] 1.3 Update Kasir model with relation
  - Add `pengeluaran PengeluaranKasir[]` relation to Kasir model
  - Regenerate Prisma client
  - _Requirements: 12.1_

### - [x] 2. Type Definitions & Validation Schemas

- [x] 2.1 Create dana-kasir types file
  - Create `features/dana-kasir/types.ts`
  - Define ExpenseCategory type
  - Define PengeluaranKasir interface
  - Define CreatePengeluaranRequest interface (including kasirId) ← **UPDATED**
  - Define UpdatePengeluaranRequest interface (including optional kasirId) ← **UPDATED**
  - Define DanaSummaryResponse interface
  - Define IncomeItem interface
  - Define KasirListItem interface (for dropdown) ← **NEW**
  - _Requirements: 2.2, 2.4, 4.1_

- [x] 2.2 Create Zod validation schemas
  - Create `features/dana-kasir/validation.ts`
  - Implement createPengeluaranSchema with validation rules (including kasirId) ← **UPDATED**
  - Implement updatePengeluaranSchema with validation rules (including optional kasirId) ← **UPDATED**
  - Add error messages in Indonesian
  - Add validation for kasirId (UUID format, required for create) ← **NEW**
  - _Requirements: 2.2, 9.1, 9.2, 9.3, 9.4_



### - [x] 3. PengeluaranService Implementation

- [x] 3.1 Create PengeluaranService class
  - Create `features/dana-kasir/services/pengeluaranService.ts`
  - Implement constructor with Prisma client and userId
  - Add timezone utility for WITA (Asia/Makassar)
  - _Requirements: 2.3, 12.1_

- [x] 3.2 Implement create method
  - Validate input using Zod schema (including kasirId) ← **UPDATED**
  - Set createdBy to current userId (Clerk ID) ← **UPDATED**
  - Use kasirId from request data (not from authenticated user) ← **UPDATED**
  - Validate kasirId exists in Kasir table ← **NEW**
  - Save to database with WITA timestamp
  - Return created record
  - _Requirements: 2.2, 2.3, 12.1_

- [x] 3.3 Implement update method
  - Validate input using Zod schema
  - Check record exists and belongs to user
  - Update only allowed fields (harga, kategori, deskripsi)
  - Preserve createdAt, update updatedAt
  - Return updated record
  - _Requirements: 2.5, 3.3, 12.2_

- [x] 3.4 Implement softDelete method
  - Check record exists
  - Set isActive to false
  - Update updatedAt timestamp
  - Return success confirmation
  - _Requirements: 3.5, 12.3_

- [x] 3.5 Implement getByDate method
  - Filter by date range (00:00 - 23:59 WITA)
  - Filter by isActive = true
  - Order by createdAt DESC
  - Include kasir relation
  - _Requirements: 1.1, 5.2, 12.5_

- [x] 3.6 Implement getById method
  - Query by id
  - Filter by isActive = true
  - Include kasir relation
  - Return null if not found
  - _Requirements: 3.2_



### - [x] 4. DanaSummaryService Implementation

- [x] 4.1 Create DanaSummaryService class
  - Create `features/dana-kasir/services/danaSummaryService.ts`
  - Implement constructor with Prisma client
  - Add date utility functions for WITA timezone
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 4.2 Implement getIncomeList method
  - Query Transaksi table for selected date
  - Filter by createdAt in WITA timezone
  - Include penyewa and kasir relations
  - Calculate rental amount from jumlahBayar
  - Extract penalty amount from flatLatePenalty
  - Return formatted IncomeItem array
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 4.3 Implement getExpenseList method
  - Query PengeluaranKasir for selected date
  - Filter by isActive = true
  - Filter by createdAt in WITA timezone
  - Include kasir relation
  - Order by createdAt DESC
  - _Requirements: 2.4, 5.2, 12.5_

- [x] 4.4 Implement getDailySummary method
  - Call getIncomeList for date
  - Call getExpenseList for date
  - Calculate totalIncome (sum rental + penalty)
  - Calculate totalExpense (sum expense amounts)
  - Calculate netBalance (income - expense)
  - Return DailySummary object
  - _Requirements: 4.1, 4.2, 4.3, 4.4_



## Phase 2: API Layer Implementation

### - [x] 5. Expense CRUD API Endpoints

- [x] 5.1 Create GET /api/kasir/pengeluaran endpoint
  - Create `app/api/kasir/pengeluaran/route.ts`
  - Implement GET handler
  - Authenticate user with Clerk
  - Parse date query parameter (default to today)
  - Call PengeluaranService.getByDate
  - Return formatted response
  - _Requirements: 2.4, 5.2, 6.1_

- [x] 5.2 Create POST /api/kasir/pengeluaran endpoint
  - Implement POST handler in same route file
  - Authenticate user with Clerk
  - Check user has Kasir role
  - Parse and validate request body (including kasirId) ← **UPDATED**
  - Validate kasirId exists in database ← **NEW**
  - Call PengeluaranService.create with kasirId from request body ← **UPDATED**
  - Return created record or validation errors
  - _Requirements: 2.1, 2.2, 2.3, 6.2, 9.1, 9.2, 9.3, 9.4_

- [x] 5.3 Create PUT /api/kasir/pengeluaran/[id] endpoint
  - Create `app/api/kasir/pengeluaran/[id]/route.ts`
  - Implement PUT handler
  - Authenticate user with Clerk
  - Check user has Kasir role
  - Parse and validate request body
  - Call PengeluaranService.update
  - Return updated record or errors
  - _Requirements: 2.5, 3.2, 3.3, 6.2_

- [x] 5.4 Create DELETE /api/kasir/pengeluaran/[id] endpoint
  - Implement DELETE handler in same route file
  - Authenticate user with Clerk
  - Check user has Kasir role
  - Call PengeluaranService.softDelete
  - Return success confirmation
  - _Requirements: 3.4, 3.5, 6.2_



### - [x] 6. Dana Summary API Endpoint

- [x] 6.1 Create GET /api/kasir/dana-summary endpoint
  - Create `app/api/kasir/dana-summary/route.ts`
  - Implement GET handler
  - Authenticate user with Clerk
  - Parse date query parameter (default to today)
  - Call DanaSummaryService.getDailySummary
  - Call DanaSummaryService.getIncomeList
  - Call DanaSummaryService.getExpenseList
  - Return combined response
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.4, 4.1, 4.2, 4.3, 4.4, 6.1, 6.3_



### - [x] 7. CSV Export API Endpoint

- [x] 7.1 Create CSV export service
  - Create `features/dana-kasir/services/csvExportService.ts`
  - Implement generateCSV method
  - Accept startDate and endDate parameters
  - Query income and expense data for date range
  - Format data as CSV with proper columns
  - Return CSV string
  - _Requirements: 8.3, 8.4_

- [x] 7.2 Create GET /api/kasir/dana-export endpoint
  - Create `app/api/kasir/dana-export/route.ts`
  - Implement GET handler
  - Authenticate user with Clerk
  - Check user has Owner role (using requireDanaKasirExport)
  - Parse startDate and endDate query parameters
  - Call csvExportService.generateCSV
  - Set response headers for file download
  - Set filename format "dana-kasir-YYYY-MM-DD.csv"
  - Return CSV file
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 6.4_



### - [x] 8. Authorization Middleware

- [x] 8.1 Create role-based authorization helpers
  - update `lib\auth-middleware.ts`
  - Implement requireKasirWrite function
  - Implement requireOwnerRead function
  - Implement requireAuthenticated function
  - Add error handling for unauthorized access
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 8.2 Apply authorization to API endpoints
  - Add requireKasirWrite to POST, PUT, DELETE endpoints
  - Add requireAuthenticated to GET endpoints
  - Add requireOwnerRead to export endpoint
  - Test authorization enforcement
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 8.3 Use existing /api/kasir/kasir endpoint for dropdown ← **UPDATED**
  - ~~Create `app/api/kasir/list/route.ts`~~ (Not needed - use existing endpoint)
  - Use `/api/kasir/kasir?limit=100&isActive=true` for dropdown
  - Extract id and nama from response
  - Simpler solution - reuse existing endpoint
  - _Requirements: 2.1_



## Phase 3: UI Components Implementation

### - [x] 9. Dana Kasir Dashboard Page

- [x] 9.1 Create dashboard page structure
  - Create `app/(kasir)/dana-kasir/page.tsx`
  - Set up page layout with proper routing
  - Add authentication check
  - Add role-based rendering (Kasir vs Owner)
  - _Requirements: 6.1, 6.3, 7.1, 7.2_

- [x] 9.2 Implement date navigation component
  - Create `features/dana-kasir/components/DateNavigation.tsx`
  - Add date picker for selecting date
  - Add "Today" quick button
  - Add previous/next day navigation
  - Update URL with selected date
  - _Requirements: 5.1, 5.2, 5.4_

- [x] 9.3 Implement summary cards component
  - Create `features/dana-kasir/components/SummaryCards.tsx`
  - Display total income card
  - Display total expense card
  - Display net balance card (red if negative)
  - Format currency in Rupiah
  - Show loading states
  - _Requirements: 4.1, 4.5_

- [x] 9.4 Implement income list component
  - Create `features/dana-kasir/components/IncomeList.tsx`
  - Display transaction code, customer name
  - Display rental amount and penalty amount separately
  - Display transaction status
  - Display kasir name
  - Show empty state when no data
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x] 9.5 Implement expense list component
  - Create `features/dana-kasir/components/ExpenseList.tsx`
  - Display amount, category, description
  - Display kasir name and timestamp
  - Add edit/delete buttons (Kasir only)
  - Show empty state when no data
  - _Requirements: 2.4, 3.1_

- [x] 9.6 Integrate components in dashboard
  - Add DateNavigation at top
  - Add SummaryCards below navigation
  - Add IncomeList and ExpenseList side by side
  - Add "Tambah Pengeluaran" button (Kasir only)
  - Add "Export CSV" button (Owner only)
  - Implement responsive layout for mobile
  - _Requirements: 7.1, 7.2, 8.1, 10.1, 10.2, 10.3_

### - [x] 10. Expense Form Component

- [x] 10.1 Create expense form modal
  - Create `features/dana-kasir/components/PengeluaranForm.tsx`
  - Implement modal dialog with form
  - Add kasir dropdown (fetch from /api/kasir/kasir?limit=100&isActive=true) ← **UPDATED**
  - Add amount input with Rupiah formatting
  - Add category dropdown with fixed options
  - Add description textarea
  - Add submit and cancel buttons
  - _Requirements: 2.1, 3.2_

- [x] 10.2 Implement form validation
  - Add client-side validation using Zod schema
  - Show validation errors inline
  - Disable submit when invalid
  - Show loading state during submission
  - _Requirements: 2.2, 9.1, 9.2, 9.3, 9.4_

- [x] 10.3 Implement form submission
  - Call POST /api/kasir/pengeluaran on submit
  - Handle success with toast notification
  - Handle errors with error display
  - Close modal on success
  - Refresh expense list
  - _Requirements: 2.3, 9.5_

- [x] 10.4 Implement edit mode
  - Pre-populate form with existing data
  - Call PUT /api/kasir/pengeluaran/[id] on submit
  - Handle success and errors
  - _Requirements: 3.2, 3.3_

- [x] 10.5 Add mobile-friendly inputs
  - Use numeric keyboard for amount input
  - Use touch-friendly dropdowns
  - Optimize layout for small screens
  - _Requirements: 10.4_

### - [x] 11. Delete Confirmation Dialog

- [x] 11.1 Create delete confirmation component
  - Create `features/dana-kasir/components/DeleteConfirmation.tsx`
  - Implement confirmation dialog
  - Show expense details in confirmation
  - Add confirm and cancel buttons
  - _Requirements: 3.4_

- [x] 11.2 Implement delete action
  - Call DELETE /api/kasir/pengeluaran/[id] on confirm
  - Handle success with toast notification
  - Handle errors with error display
  - Refresh expense list on success
  - _Requirements: 3.5_

### - [x] 12. CSV Export Dialog

- [x] 12.1 Create export dialog component
  - Create `features/dana-kasir/components/ExportDialog.tsx`
  - Add date range picker
  - Add preset options (today, this week, this month)
  - Add export button
  - Show loading state during export
  - _Requirements: 8.1, 8.2_

- [x] 12.2 Implement export action
  - Call GET /api/kasir/dana-export with date range
  - Trigger file download
  - Handle errors with error display
  - Close dialog on success
  - _Requirements: 8.3, 8.5_

### - [x] 13. Navigation Integration

- [x] 13.1 Add Dana Kasir button to Kasir dashboard
  - Update `features/kasir/components/dashboard/TransactionsDashoard.tsx`
  - Add "Dana Kasir" button in action area (next to Tambah Transaksi)
  - Link to /dana-kasir route
  - Use green color scheme with Wallet icon
  - _Requirements: 7.1, 7.2_

- [x] 13.2 Add Dana Kasir menu to Owner sidebar
  - Update `components/layout/OwnerSidebar.tsx`
  - Add "Dana Kasir" menu item with Wallet icon
  - Link to /dana-kasir route
  - Use green hover color scheme
  - _Requirements: 7.3, 7.4_

## Phase 4: Integration & Polish

### - [x] 14. React Query Integration

- [x] 14.1 Create React Query hooks
  - Create `features/dana-kasir/hooks/useDanaSummary.ts` ✅
  - ~~Create `features/dana-kasir/hooks/usePengeluaran.ts`~~ (Not needed - expenses included in useDanaSummary)
  - Create `features/dana-kasir/hooks/useCreatePengeluaran.ts` ✅
  - Create `features/dana-kasir/hooks/useUpdatePengeluaran.ts` ✅
  - Create `features/dana-kasir/hooks/useDeletePengeluaran.ts` ✅
  - Configure cache settings (5 min stale time) ✅
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 14.2 Integrate hooks in components
  - Use useDanaSummary in dashboard ✅
  - ~~Use usePengeluaran in expense list~~ (Uses useDanaSummary instead)
  - Use mutations in form and delete dialog ✅
  - ~~Implement optimistic updates~~ (Skipped for MVP - cache invalidation sufficient)
  - Handle loading and error states ✅
  - _Requirements: 11.1, 11.2, 11.3_

### - [x] 15. Error Handling & User Feedback

- [x] 15.1 Implement toast notifications
  - Add success toast for create/update/delete ✅
  - Add error toast for failures ✅
  - Add loading toast for long operations ✅ (via loading states)
  - _Requirements: 2.3, 9.5_

- [x] 15.2 Implement error boundaries
  - Add error boundary around dashboard ✅
  - Show user-friendly error messages ✅
  - Provide retry mechanism ✅
  - _Requirements: 9.5_

- [x] 15.3 Implement empty states
  - Add empty state for no income ✅
  - Add empty state for no expenses ✅
  - Add helpful messages and actions ✅
  - _Requirements: 1.5_

### - [ ] 16. Mobile Responsive Design

- [ ] 16.1 Optimize dashboard for mobile
  - Stack summary cards vertically
  - Use card layout for lists
  - Optimize spacing and typography
  - Test on various screen sizes
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 16.2 Optimize forms for mobile
  - Use appropriate input types
  - Optimize touch targets
  - Test keyboard behavior
  - _Requirements: 10.4, 10.5_

### - [ ] 17. Performance Optimization

- [ ] 17.1 Optimize database queries
  - Verify indexes are used
  - Test query performance with large datasets
  - Ensure queries complete < 100ms
  - _Requirements: 11.4_

- [ ] 17.2 Optimize API responses
  - Minimize payload size
  - Use pagination if needed
  - Test response times < 2 seconds
  - _Requirements: 11.1, 11.2, 11.3_

- [ ] 17.3 Optimize client-side performance
  - Implement code splitting
  - Optimize bundle size
  - Test initial load < 2 seconds
  - _Requirements: 11.1_

### - [ ] 18. Documentation & Deployment

- [ ] 18.1 Update API documentation
  - Document all endpoints
  - Add request/response examples
  - Document error codes
  - _Requirements: All API requirements_

- [ ] 18.2 Create user guide
  - Document Kasir workflows
  - Document Owner workflows
  - Add screenshots
  - _Requirements: All user-facing requirements_

- [ ] 18.3 Prepare deployment checklist
  - Database migration steps
  - Environment variable setup
  - Rollback procedure
  - Monitoring setup
  - _Requirements: All deployment requirements_

### - [ ] 19. Manual Testing & Verification

- [ ] 19.1 Test expense creation workflow
  - Login as Kasir
  - Navigate to Dana Kasir dashboard
  - Create new expense with valid data
  - Verify expense appears in list
  - Verify summary cards update
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 19.2 Test expense edit workflow
  - Select existing expense
  - Edit amount, category, or description
  - Save changes
  - Verify changes appear in list
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 19.3 Test expense delete workflow
  - Select existing expense
  - Click delete button
  - Confirm deletion
  - Verify expense removed from list (soft delete)
  - _Requirements: 3.4, 3.5_

- [ ] 19.4 Test Owner read-only access
  - Login as Owner
  - Navigate to Dana Kasir dashboard
  - Verify can view all data
  - Verify cannot create/edit/delete expenses
  - Verify can export CSV
  - _Requirements: 6.3, 6.4, 8.1_

- [ ] 19.5 Test historical data navigation
  - Select different dates using date picker
  - Verify data loads correctly for each date
  - Verify URL updates with selected date
  - Test "Today" quick button
  - _Requirements: 5.1, 5.2, 5.4_

- [ ] 19.6 Test mobile responsiveness
  - Open dashboard on mobile device
  - Verify layout adapts correctly
  - Test form inputs on mobile
  - Test date picker on mobile
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

## Checkpoint: Final Verification

- [ ] 20. Final Checkpoint
  - Verify all core features work
  - Test on different browsers (Chrome, Firefox, Safari)
  - Verify performance is acceptable
  - Review code quality
  - Ask user if questions arise

---

## Notes

**MVP-First Approach:**
- All automated testing tasks have been removed to focus on rapid delivery
- Manual testing is included to verify core functionality works
- Testing can be added later as a separate phase if needed

**Task Dependencies:**
- Phase 2 depends on Phase 1 completion
- Phase 3 depends on Phase 2 completion
- Phase 4 can run in parallel with Phase 3

**Estimated Timeline (MVP without testing):**
- Phase 1: 3-4 days (Database & Services)
- Phase 2: 3-4 days (API Layer)
- Phase 3: 5-7 days (UI Components)
- Phase 4: 2-3 days (Integration & Polish)
- **Total: 13-18 days (2-3 weeks)**

**Priority:**
- Core functionality: HIGH
- Manual verification: MEDIUM
- Documentation: LOW

---

**Document Version:** 1.0  
**Created:** 2025-01-29  
**Last Updated:** 2025-01-29  
**Status:** Ready for Implementation  
**Next Phase:** Begin Phase 1 - Database Foundation
