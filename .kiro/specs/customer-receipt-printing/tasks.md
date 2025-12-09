# Implementation Plan - Customer Receipt PDF Preview

## Overview

This implementation plan breaks down the Customer Receipt PDF Preview feature into discrete, manageable tasks. Each task builds incrementally on previous work, with property-based tests integrated close to implementation to catch errors early.

**Total Estimated Time:** 1 day (8 hours)
**Approach:** Implementation-first, then testing
**Testing:** Unit tests + Integration tests (no E2E for MVP)

---

## Task List

- [-] 1. Setup and Configuration
  - Create store configuration constants
  - Install jsPDF dependency
  - Setup TypeScript types
  - _Requirements: 10.1, 10.2_

- [ ] 1.1 Create store configuration file
  - Create `config/constants.ts`
  - Define STORE_CONFIG with name, address, phone
  - Export as const for type safety
  - _Requirements: 10.1, 10.2_

- [ ] 1.2 Install jsPDF dependency
  - Run `npm install jspdf @types/jspdf`
  - Verify installation in package.json
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 2. Backend Receipt Service Implementation
  - Implement core PDF generation logic
  - Create formatting utilities
  - Handle data extraction
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 2.1 Create ReceiptService class structure
  - Create `features/kasir/services/receiptService.ts`
  - Define class with generateReceiptPDF method
  - Setup jsPDF instance with 58mm width, portrait orientation
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 2.2 Implement currency formatting utility
  - Create formatCurrency method
  - Format: "Rp [space] [number with dots]"
  - Handle edge cases (0, negative, large numbers)
  - _Requirements: 4.1_

- [ ] 2.3 Implement date formatting utility
  - Create formatDate method
  - Format: "DD MMM YYYY HH:mm" (Indonesian)
  - Map month numbers to Indonesian abbreviations
  - Handle timezone conversion to local time
  - _Requirements: 4.2_

- [ ] 2.4 Implement size extraction utility
  - Create extractSize method
  - Parse kondisiAwal pipe-delimited string
  - Extract second segment (SIZE)
  - Handle malformed input gracefully
  - _Requirements: 3.2_

- [ ] 2.5 Implement header section generator
  - Create addHeader method
  - Add store name from STORE_CONFIG
  - Add store address from STORE_CONFIG
  - Add store phone from STORE_CONFIG
  - Add separator line
  - _Requirements: 2.1, 10.2_

- [ ] 2.6 Implement transaction info section generator
  - Create addTransactionInfo method
  - Add "STRUK TRANSAKSI" title
  - Add transaction code (Kode: ...)
  - Add formatted date (Tanggal: ...)
  - Add customer name (Customer: ...)
  - Add kasir name (Kasir: ...)
  - Add separator line
  - _Requirements: 2.2, 6.2, 6.3, 6.4_

- [ ] 2.7 Implement items section generator
  - Create addItems method
  - Add "DETAIL PRODUK" title
  - Add separator line
  - Loop through items array
  - For each item: extract size, format product name with size
  - For each item: format quantity x price x duration
  - For each item: format subtotal
  - Add blank line between items
  - _Requirements: 2.3, 3.1, 3.2, 3.3, 3.4, 6.5_

- [ ] 2.8 Implement summary section generator
  - Create addSummary method
  - Add "RINGKASAN PEMBAYARAN" title
  - Add separator line
  - Add total sewa with formatted currency
  - Add separator line
  - _Requirements: 2.4_

- [ ] 2.9 Implement footer section generator
  - Create addFooter method
  - Add blank line
  - Add "Terima Kasih!" centered
  - Add blank line
  - Add "Barang yang sudah disewa" line
  - Add "tidak dapat dikembalikan" line
  - Add final separator line
  - _Requirements: 2.5_

- [ ] 2.10 Integrate all sections in generateReceiptPDF
  - Call addHeader and track y position
  - Call addTransactionInfo and track y position
  - Call addItems and track y position
  - Call addSummary and track y position
  - Call addFooter and track y position
  - Return PDF as Buffer
  - _Requirements: 1.2, 5.1, 5.2_

- [ ] 3. API Route Implementation
  - Create receipt PDF endpoint
  - Integrate with existing services
  - Handle authentication and errors
  - _Requirements: 1.2, 6.1, 9.1_

- [ ] 3.1 Create API route file
  - Create `app/api/kasir/receipt/[transaksiId]/pdf/route.ts`
  - Define GET handler with RouteParams interface
  - Setup basic structure
  - _Requirements: 1.2_

- [ ] 3.2 Implement authentication check
  - Use requirePermission middleware
  - Check for 'transaksi' read permission
  - Return 401 if unauthorized
  - _Requirements: 9.1_

- [ ] 3.3 Implement transaction data retrieval
  - Initialize TransaksiService with user ID
  - Call getTransaksiByCode with transaksiId
  - Handle transaction not found (404)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 3.4 Implement PDF generation and response
  - Initialize ReceiptService
  - Call generateReceiptPDF with transaction data
  - Create NextResponse with PDF buffer
  - Set Content-Type to "application/pdf"
  - Set Content-Disposition to "inline"
  - _Requirements: 1.2, 5.4_

- [ ] 3.5 Implement error handling
  - Wrap in try-catch block
  - Log errors to console with context (transaksiId, userId, error details)
  - Return 500 with error message on failure
  - Handle specific error types (404, 401, 500)
  - _Requirements: 7.1, 7.2, 7.4_

- [ ] 4. Frontend Hook Implementation
  - Create React hook for receipt printing
  - Manage loading state
  - Handle API calls and errors
  - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [ ] 4.1 Create useReceiptPrint hook file
  - Create `features/kasir/hooks/useReceiptPrint.ts`
  - Define hook function and return interface
  - Setup isPrinting state with useState
  - _Requirements: 1.3, 7.3, 8.2_

- [ ] 4.2 Implement printReceipt function
  - Create async function accepting transactionId
  - Set isPrinting to true at start
  - Fetch PDF from API endpoint
  - Handle response and create blob URL
  - Open PDF in new tab with window.open
  - Set isPrinting to false in finally block
  - _Requirements: 1.2, 8.3_

- [ ] 4.3 Implement success feedback
  - Show success toast "Struk berhasil dibuat"
  - Log success to console
  - _Requirements: 1.4_

- [ ] 4.4 Implement error handling
  - Catch fetch errors
  - Show error toast "Gagal membuat struk. Silakan coba lagi."
  - Log error to console with details
  - Ensure isPrinting resets to false
  - _Requirements: 1.5, 7.2, 7.3, 7.5_

- [ ] 5. Frontend Component Integration
  - Add button to TransactionDetailPage
  - Integrate hook
  - Handle button states
  - _Requirements: 1.1, 1.3, 8.2, 8.4_

- [ ] 5.1 Import dependencies in TransactionDetailPage
  - Import useReceiptPrint hook
  - Import Printer and Loader2 icons from lucide-react
  - _Requirements: 1.1_

- [ ] 5.2 Integrate useReceiptPrint hook
  - Call useReceiptPrint() in component
  - Destructure printReceipt and isPrinting
  - _Requirements: 1.2, 1.3_

- [ ] 5.3 Create handlePrintReceipt function
  - Create handler that calls printReceipt with transaction.transactionCode
  - _Requirements: 1.2_

- [ ] 5.4 Add "Cetak Struk" button to header
  - Position after StatusBadge, before Refresh button
  - Use Button component with variant="outline" size="sm"
  - Add data-testid="print-receipt-button"
  - Set onClick to handlePrintReceipt
  - Set disabled to isPrinting
  - _Requirements: 1.1, 1.3_

- [ ] 5.5 Implement button loading state
  - Show Loader2 icon with spin animation when isPrinting is true
  - Show "Generating..." text when isPrinting is true
  - Show Printer icon and "Cetak Struk" text when isPrinting is false
  - _Requirements: 1.3, 8.2_

- [ ] 6. Unit Tests for ReceiptService
  - Test PDF generation
  - Test formatting utilities
  - Test data extraction
  - _Requirements: All formatting and generation requirements_

- [ ] 6.1 Test generateReceiptPDF returns valid buffer
  - **Property 1: PDF Generation Completeness**
  - **Validates: Requirements 1.2, 5.1, 5.2**
  - Create test with mock transaction data
  - Call generateReceiptPDF
  - Assert buffer is instance of Buffer
  - Assert buffer length > 0

- [ ] 6.2 Test formatCurrency with various amounts
  - **Property 7: Currency Formatting Consistency**
  - **Validates: Requirements 4.1**
  - Test formatCurrency(300000) === "Rp 300.000"
  - Test formatCurrency(1500000) === "Rp 1.500.000"
  - Test formatCurrency(50000) === "Rp 50.000"
  - Test formatCurrency(0) === "Rp 0"

- [ ] 6.3 Test formatDate with ISO strings
  - **Property 8: Date Formatting Consistency**
  - **Validates: Requirements 4.2**
  - Test formatDate with known ISO date
  - Assert format matches "DD MMM YYYY HH:mm"
  - Assert month is Indonesian abbreviation

- [ ] 6.4 Test extractSize from kondisiAwal
  - **Property 5: Size Extraction Accuracy**
  - **Validates: Requirements 3.2**
  - Test extractSize("uuid|M|ADULT|baik") === "M"
  - Test extractSize("uuid|L|ADULT|baik") === "L"
  - Test extractSize("invalid") === ""
  - Test extractSize("") === ""

- [ ] 6.5 Test store config integration
  - **Property 2: Store Information Consistency**
  - **Validates: Requirements 2.1, 10.2**
  - Mock STORE_CONFIG
  - Generate PDF
  - Assert PDF contains store name, address, phone

- [ ] 6.6 Test transaction data preservation
  - **Property 3: Transaction Data Preservation**
  - **Validates: Requirements 2.2, 6.2, 6.3, 6.4**
  - Create mock transaction with known values
  - Generate PDF
  - Assert PDF contains transaction code, customer name, kasir name

- [ ] 6.7 Test item listing completeness
  - **Property 4: Item Listing Completeness**
  - **Validates: Requirements 2.3, 3.3, 6.5**
  - Create transaction with 3 items
  - Generate PDF
  - Assert PDF contains all 3 items with complete details

- [ ] 6.8 Test item order preservation
  - **Property 6: Item Order Preservation**
  - **Validates: Requirements 3.4**
  - Create transaction with items in specific order
  - Generate PDF
  - Assert items appear in same order in PDF

- [ ] 6.9 Test footer content
  - **Property 11: Footer Content Consistency**
  - **Validates: Requirements 2.5**
  - Generate PDF
  - Assert PDF contains "Terima Kasih!"
  - Assert PDF contains disclaimer text

- [ ] 6.10 Test PDF dimensions
  - **Property 9: PDF Dimension Specification**
  - **Validates: Requirements 5.1, 5.2**
  - Generate PDF
  - Assert width === 58mm
  - Assert orientation === portrait

- [ ] 7. Integration Tests for API Route
  - Test API endpoint responses
  - Test authentication
  - Test error scenarios
  - _Requirements: 1.2, 9.1, 7.1, 7.2_

- [ ] 7.1 Test successful PDF generation
  - **Property 12: HTTP Response Headers**
  - **Validates: Requirements 5.4**
  - Mock authenticated request
  - Mock valid transaction
  - Call GET handler
  - Assert status 200
  - Assert Content-Type === "application/pdf"
  - Assert Content-Disposition contains "inline"

- [ ] 7.2 Test authentication enforcement
  - **Property 17: Authentication Enforcement**
  - **Validates: Requirements 9.1**
  - Mock unauthenticated request
  - Call GET handler
  - Assert status 401

- [ ] 7.3 Test transaction not found
  - Mock authenticated request
  - Mock non-existent transaction ID
  - Call GET handler
  - Assert status 404

- [ ] 7.4 Test PDF generation error handling
  - **Property 15: Error Logging**
  - **Validates: Requirements 7.2**
  - Mock authenticated request
  - Mock ReceiptService to throw error
  - Spy on console.error
  - Call GET handler
  - Assert status 500
  - Assert console.error was called with error details

- [ ] 8. Unit Tests for useReceiptPrint Hook
  - Test hook state management
  - Test success and error flows
  - Test loading states
  - _Requirements: 1.3, 1.4, 1.5, 7.3, 8.2_

- [ ] 8.1 Test isPrinting state during generation
  - **Property 13: Loading State Management**
  - **Validates: Requirements 1.3, 7.3, 8.2**
  - Render hook
  - Call printReceipt
  - Assert isPrinting === true during execution
  - Assert isPrinting === false after completion

- [ ] 8.2 Test success toast display
  - Mock successful fetch
  - Mock toast.success
  - Call printReceipt
  - Assert toast.success called with "Struk berhasil dibuat"

- [ ] 8.3 Test error toast display
  - Mock failed fetch
  - Mock toast.error
  - Call printReceipt
  - Assert toast.error called with error message

- [ ] 8.4 Test new tab opening
  - **Property 14: New Tab Navigation**
  - **Validates: Requirements 1.2, 8.3**
  - Mock window.open
  - Mock successful fetch
  - Call printReceipt
  - Assert window.open called with blob URL and '_blank'

- [ ] 8.5 Test error recovery
  - Mock failed fetch
  - Call printReceipt
  - Assert isPrinting resets to false
  - Assert button becomes clickable again

- [ ] 9. Manual Testing and Validation
  - Test complete user flow
  - Validate PDF content
  - Test error scenarios
  - _Requirements: All requirements_

- [ ] 9.1 Test button visibility and positioning
  - Navigate to transaction detail page
  - Verify "Cetak Struk" button appears
  - Verify button is positioned after status badge
  - Verify button styling matches design

- [ ] 9.2 Test PDF generation happy path
  - Click "Cetak Struk" button
  - Verify loading state appears
  - Verify PDF opens in new tab
  - Verify success toast appears
  - Verify button returns to normal state

- [ ] 9.3 Validate PDF content completeness
  - Open generated PDF
  - Verify header contains store info
  - Verify transaction info is correct
  - Verify all items are listed
  - Verify sizes are extracted correctly
  - Verify currency formatting is correct
  - Verify date formatting is correct
  - Verify footer contains thank you message

- [ ] 9.4 Test error handling
  - Test with invalid transaction ID
  - Verify error toast appears
  - Verify button returns to clickable state
  - Test with network disconnected
  - Verify appropriate error message

- [ ] 9.5 Test UI non-blocking behavior
  - **Property 16: UI Non-Blocking**
  - **Validates: Requirements 7.5, 8.4**
  - Click "Cetak Struk" button
  - While PDF is generating, try clicking other buttons
  - Verify other UI elements remain interactive

- [ ] 9.6 Test browser print functionality
  - Open generated PDF in new tab
  - Press Ctrl+P (or Cmd+P on Mac)
  - Verify browser print dialog opens
  - Verify PDF is printable

- [ ] 9.7 Test with various transaction types
  - Test with single item transaction
  - Test with multiple items (same product, different sizes)
  - Test with many items (10+)
  - Test with long product names
  - Test with large amounts (millions)

- [ ] 10. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Implementation Notes

### Task Execution Order
1. **Setup First**: Configuration and dependencies (Tasks 1.x)
2. **Backend Core**: Receipt service implementation (Tasks 2.x)
3. **Backend API**: API route implementation (Tasks 3.x)
4. **Frontend Hook**: React hook implementation (Tasks 4.x)
5. **Frontend UI**: Component integration (Tasks 5.x)
6. **Testing**: Unit and integration tests (Tasks 6.x, 7.x, 8.x)
7. **Validation**: Manual testing (Tasks 9.x)
8. **Checkpoint**: Final verification (Task 10)

### Testing Approach
- **Implementation-first**: Write code before tests
- **Property-based thinking**: Tests validate universal properties
- **Integration close to implementation**: Test soon after implementing
- **Manual validation**: Final check with real user flow

### Time Estimates
- Tasks 1.x: 30 minutes (setup)
- Tasks 2.x: 2 hours (core service)
- Tasks 3.x: 1 hour (API route)
- Tasks 4.x: 45 minutes (hook)
- Tasks 5.x: 45 minutes (UI integration)
- Tasks 6.x: 1.5 hours (unit tests)
- Tasks 7.x: 45 minutes (integration tests)
- Tasks 8.x: 45 minutes (hook tests)
- Tasks 9.x: 30 minutes (manual testing)
- Task 10: 15 minutes (checkpoint)
- **Total**: ~8 hours (1 day)

### Success Criteria
- All unit tests pass
- All integration tests pass
- Manual testing checklist complete
- PDF content matches requirements
- No console errors in production
- Button states work correctly
- Error handling works as expected

---

**Document Version:** 1.0
**Last Updated:** December 9, 2025
**Status:** Ready for Execution
