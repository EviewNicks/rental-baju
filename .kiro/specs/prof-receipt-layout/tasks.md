# Implementation Plan - Professional Receipt Layout

## Overview

This implementation plan breaks down the Professional Receipt Layout feature into discrete, manageable tasks. Each task builds incrementally on previous work, focusing on creating a comprehensive table-based receipt system with professional branding and enhanced financial breakdown.

**Total Estimated Time:** 2 days (16 hours)
**Approach:** Implementation-first, then testing
**Testing:** Unit tests + Integration tests + Manual validation
**Key Challenge:** Table generation with borders and professional layout

---

## Task List

- [x] 1. Setup and Enhanced Configuration
  - Update store configuration for professional layout
  - Install additional dependencies if needed
  - Setup enhanced TypeScript types
  - _Requirements: 13.1, 13.2_

- [x] 1.1 Update store configuration for professional layout
  - Update `config/constants.ts` with ERLIMA MODE branding
  - Ensure logo path "/logo.jpg" is configured
  - Add any additional configuration needed for professional layout
  - _Requirements: 2.2, 2.3, 2.4, 13.2_

- [x] 1.2 Verify jsPDF table capabilities
  - Test jsPDF table generation capabilities
  - Verify border drawing functionality
  - Test image embedding for logo
  - _Requirements: 7.5, 2.1_

- [x] 2. Backend Professional Receipt Service Implementation
  - Create new service for professional receipt generation
  - Implement table generation with borders
  - Handle logo integration and professional layout
  - _Requirements: 1.2, 4.1, 7.1, 7.2_

- [x] 2.1 Create ProfessionalReceiptService class structure
  - Create `features/kasir/services/professionalReceiptService.ts`
  - Define class with generateProfessionalReceiptPDF method
  - Setup jsPDF instance with 140x200mm dimensions (14x20cm)
  - Configure professional layout constants
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 2.2 Implement table generation utilities
  - Create createBorderedTable method for table generation
  - Implement drawTableBorders method for border rendering
  - Create TableColumn interface and configuration
  - Handle dynamic table sizing and positioning
  - _Requirements: 4.1, 7.5_

- [x] 2.3 Implement enhanced currency formatting
  - Create formatCurrency method for professional format
  - Format without "Rp" prefix, use dot separators (e.g., "2.250.000")
  - Handle edge cases and large numbers
  - _Requirements: 5.5_

- [x] 2.4 Implement enhanced date formatting
  - Create formatDate method for Indonesian format
  - Format: "DD MMM YYYY" (e.g., "15 Des 2025")
  - Map month numbers to Indonesian abbreviations
  - _Requirements: 3.3_

- [x] 2.5 Implement size extraction utility (reuse from existing)
  - Create extractSize method or reuse from existing service
  - Parse kondisiAwal pipe-delimited string
  - Extract second segment (SIZE) for separate column
  - Handle malformed input gracefully
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 2.6 Implement discount calculation logic
  - Create calculateDiscount method
  - Handle percentage and fixed discount types
  - Calculate discount amount based on subtotal
  - _Requirements: 5.2_

- [x] 2.7 Implement professional header section generator
  - Create addProfessionalHeader method
  - Load and position company logo in top-left
  - Add store name "ERLIMA MODE" prominently
  - Add store address and phone information
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2.8 Implement transaction info section generator
  - Create addTransactionInfoSection method
  - Add "PENAWARAN PENJUALAN" document type (top-right)
  - Add transaction number (Nomor: data.kode)
  - Add transaction date (Tanggal: formatted date)
  - Add payment method (Pembayaran: data.metodeBayar)
  - Add customer name (Kepada Yth: data.penyewa.nama)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2.9 Implement items table generator
  - Create addItemsTable method
  - Generate table with 7 columns: No, Kategori, Nama Barang, Size, Qty, @Harga, Total Harga
  - Use transaction code for "No" field
  - Extract category from item.produk.category
  - Display product name from item.produk.name
  - Extract and display size in separate column
  - Display quantity, price, and subtotal with proper formatting
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [x] 2.10 Implement financial summary section generator
  - Create addFinancialSummary method
  - Calculate and display "Sub Total" (sum of all subtotals)
  - Calculate and display "Diskon" (based on discountType and discountValue)
  - Display "Biaya Lain-lain" as 0 (reserved for future use)
  - Display "Total" from data.totalHarga
  - Format all amounts with currency formatting
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 2.11 Implement professional footer section generator
  - Create addProfessionalFooter method
  - Add "Keterangan" section on left side
  - Add disclaimer text "Barang yg sudah dibeli tidak dapat ditukar atau dikembalikan"
  - Add signature section on right side with "Bagian Penjualan," label
  - Add signature line "Tgl. ___________"
  - Add note "Harga dan stok di atas dapat berubah sewaktu-waktu tanpa pemberitahuan"
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 2.12 Integrate all sections in generateProfessionalReceiptPDF
  - Call addProfessionalHeader and track y position
  - Call addTransactionInfoSection and track y position
  - Call addItemsTable and track y position
  - Call addFinancialSummary and track y position
  - Call addProfessionalFooter and track y position
  - Return PDF as Buffer
  - _Requirements: 1.2, 7.1, 7.2_

- [x] 3. API Route Implementation
  - Create professional receipt PDF endpoint
  - Integrate with existing services
  - Handle authentication and errors
  - _Requirements: 1.2, 12.1_

- [x] 3.1 Create professional receipt API route file
  - update `app\api\kasir\receipt\[transaksiId]\pdf\route.ts`
  - Define GET handler with RouteParams interface
  - Setup basic structure for professional receipt generation
  - _Requirements: 1.2_

- [x] 3.2 Implement authentication check
  - Use requirePermission middleware
  - Check for 'transaksi' read permission
  - Return 401 if unauthorized
  - _Requirements: 12.1_

- [x] 3.3 Implement transaction data retrieval
  - Initialize TransaksiService with user ID
  - Call getTransaksiByCode with transaksiId
  - Handle transaction not found (404)
  - _Requirements: 8.1_

- [x] 3.4 Implement professional PDF generation and response
  - Initialize ProfessionalReceiptService
  - Call generateProfessionalReceiptPDF with transaction data
  - Create NextResponse with PDF buffer
  - Set Content-Type to "application/pdf"
  - Set Content-Disposition to "inline" with professional filename
  - _Requirements: 1.2_

- [x] 3.5 Implement enhanced error handling
  - Wrap in try-catch block
  - Log errors to console with context (transaksiId, userId, error details)
  - Return 500 with error message on failure
  - Handle table generation errors gracefully
  - _Requirements: 10.2, 10.3, 12.4_

- [ ] 4. Frontend Hook Implementation
  - Create React hook for professional receipt printing
  - Manage loading state
  - Handle API calls and errors
  - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [ ] 4.1 Create useProfessionalReceiptPrint hook file
  - Create `features/kasir/hooks/useProfessionalReceiptPrint.ts`
  - Define hook function and return interface
  - Setup isPrinting state with useState
  - _Requirements: 1.3, 11.2_

- [ ] 4.2 Implement printProfessionalReceipt function
  - Create async function accepting transactionId
  - Set isPrinting to true at start
  - Fetch PDF from professional API endpoint
  - Handle response and create blob URL
  - Open PDF in new tab with window.open
  - Set isPrinting to false in finally block
  - _Requirements: 1.2, 11.3_

- [ ] 4.3 Implement success feedback
  - Show success toast "Struk profesional berhasil dibuat"
  - Log success to console
  - _Requirements: 1.4_

- [ ] 4.4 Implement error handling
  - Catch fetch errors
  - Show error toast "Gagal membuat struk. Silakan coba lagi."
  - Log error to console with details
  - Ensure isPrinting resets to false
  - _Requirements: 1.5, 10.3, 10.4, 10.5_

- [ ] 5. Frontend Component Integration
  - Add professional receipt button to TransactionDetailPage
  - Integrate hook
  - Handle button states
  - _Requirements: 1.1, 1.3, 11.2, 11.4_

- [ ] 5.1 Import dependencies in TransactionDetailPage
  - Import useProfessionalReceiptPrint hook
  - Import appropriate icons from lucide-react
  - _Requirements: 1.1_

- [ ] 5.2 Integrate useProfessionalReceiptPrint hook
  - Call useProfessionalReceiptPrint() in component
  - Destructure printProfessionalReceipt and isPrinting
  - _Requirements: 1.2, 1.3_

- [ ] 5.3 Create handlePrintProfessionalReceipt function
  - Create handler that calls printProfessionalReceipt with transaction.transactionCode
  - _Requirements: 1.2_

- [ ] 5.4 Add "Cetak Struk Profesional" button to header
  - Position appropriately in page header
  - Use Button component with variant="outline" size="sm"
  - Add data-testid="print-professional-receipt-button"
  - Set onClick to handlePrintProfessionalReceipt
  - Set disabled to isPrinting
  - _Requirements: 1.1, 1.3_

- [ ] 5.5 Implement button loading state
  - Show loading icon with spin animation when isPrinting is true
  - Show "Generating..." text when isPrinting is true
  - Show appropriate icon and "Cetak Struk Profesional" text when isPrinting is false
  - _Requirements: 1.3, 11.2_

- [ ] 6. Unit Tests for ProfessionalReceiptService
  - Test PDF generation
  - Test table generation utilities
  - Test formatting utilities
  - Test calculation logic
  - _Requirements: All formatting and generation requirements_

- [ ] 6.1 Test generateProfessionalReceiptPDF returns valid buffer
  - **Property 1: Professional PDF Generation Completeness**
  - **Validates: Requirements 1.2, 7.1, 7.2**
  - Create test with mock transaction data
  - Call generateProfessionalReceiptPDF
  - Assert buffer is instance of Buffer
  - Assert buffer length > 0

- [ ] 6.2 Test createBorderedTable functionality
  - **Property 4: Table Structure Consistency**
  - **Validates: Requirements 4.1, 7.5**
  - Test table creation with specified columns
  - Verify table dimensions and positioning
  - Test border rendering

- [ ] 6.3 Test calculateDiscount with various scenarios
  - **Property 9: Financial Calculation Accuracy**
  - **Validates: Requirements 5.1, 5.2**
  - Test percentage discount calculation
  - Test fixed discount calculation
  - Test edge cases (0%, 100%, negative values)

- [ ] 6.4 Test formatCurrency for professional format
  - **Property 8: Currency Formatting Consistency**
  - **Validates: Requirements 5.5**
  - Test formatCurrency(2250000) === "2.250.000"
  - Test formatCurrency(1000000) === "1.000.000"
  - Test formatCurrency(0) === "0"
  - Verify no "Rp" prefix

- [ ] 6.5 Test formatDate for Indonesian format
  - Test formatDate with known ISO date
  - Assert format matches "DD MMM YYYY"
  - Assert month is Indonesian abbreviation

- [ ] 6.6 Test extractSize from kondisiAwal
  - **Property 6: Size Extraction Accuracy**
  - **Validates: Requirements 9.1, 9.2, 9.3**
  - Test extractSize("uuid|L|ADULT|baik") === "L"
  - Test extractSize("uuid|UNIVERSAL|ADULT|baik") === "UNIVERSAL"
  - Test malformed input handling

- [ ] 6.7 Test store config integration
  - **Property 2: Store Information Consistency**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 13.2**
  - Mock STORE_CONFIG
  - Generate PDF
  - Assert PDF contains store name, address, phone, logo

- [ ] 6.8 Test transaction data preservation
  - **Property 3: Transaction Metadata Preservation**
  - **Validates: Requirements 3.2, 3.3, 3.4, 3.5**
  - Create mock transaction with known values
  - Generate PDF
  - Assert PDF contains transaction code, date, payment method, customer name

- [ ] 6.9 Test item data completeness
  - **Property 5: Item Data Completeness**
  - **Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8**
  - Create transaction with multiple items
  - Generate PDF
  - Assert all items appear in table with correct data

- [ ] 6.10 Test financial summary calculations
  - **Property 10: Fixed Values Consistency**
  - **Validates: Requirements 5.3, 5.4**
  - Test subtotal calculation
  - Test discount calculation
  - Verify "Biaya Lain-lain" is always 0
  - Verify total matches data.totalHarga

- [ ] 6.11 Test footer content consistency
  - **Property 12: Footer Content Consistency**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**
  - Generate PDF
  - Assert footer contains keterangan section
  - Assert footer contains signature area
  - Assert footer contains required text

- [ ] 6.12 Test PDF dimensions and layout
  - **Property 13: PDF Dimension Specification**
  - **Validates: Requirements 7.1, 7.2, 7.3**
  - Generate PDF
  - Assert width === 140mm
  - Assert height === 200mm
  - Assert orientation === portrait

- [ ] 7. Integration Tests for API Route
  - Test API endpoint responses
  - Test authentication
  - Test error scenarios
  - _Requirements: 1.2, 12.1, 10.2_

- [ ] 7.1 Test successful professional PDF generation
  - Mock authenticated request
  - Mock valid transaction
  - Call GET handler
  - Assert status 200
  - Assert Content-Type === "application/pdf"
  - Assert Content-Disposition contains "professional-receipt"

- [ ] 7.2 Test authentication enforcement
  - **Property 21: Authentication Enforcement**
  - **Validates: Requirements 12.1**
  - Mock unauthenticated request
  - Call GET handler
  - Assert status 401

- [ ] 7.3 Test transaction not found
  - Mock authenticated request
  - Mock non-existent transaction ID
  - Call GET handler
  - Assert status 404

- [ ] 7.4 Test PDF generation error handling
  - **Property 22: Error Logging Completeness**
  - **Validates: Requirements 10.2, 12.4**
  - Mock authenticated request
  - Mock ProfessionalReceiptService to throw error
  - Spy on console.error
  - Call GET handler
  - Assert status 500
  - Assert console.error was called with error details

- [ ] 8. Unit Tests for useProfessionalReceiptPrint Hook
  - Test hook state management
  - Test success and error flows
  - Test loading states
  - _Requirements: 1.3, 1.4, 1.5, 11.2_

- [ ] 8.1 Test isPrinting state during generation
  - **Property 16: Loading State Management**
  - **Validates: Requirements 1.3, 11.2**
  - Render hook
  - Call printProfessionalReceipt
  - Assert isPrinting === true during execution
  - Assert isPrinting === false after completion

- [ ] 8.2 Test success toast display
  - **Property 17: Success Feedback Consistency**
  - **Validates: Requirements 1.4**
  - Mock successful fetch
  - Mock toast.success
  - Call printProfessionalReceipt
  - Assert toast.success called with "Struk profesional berhasil dibuat"

- [ ] 8.3 Test error toast display
  - **Property 18: Error Feedback Consistency**
  - **Validates: Requirements 1.5, 10.3**
  - Mock failed fetch
  - Mock toast.error
  - Call printProfessionalReceipt
  - Assert toast.error called with error message

- [ ] 8.4 Test new tab opening
  - **Property 19: New Tab Navigation**
  - **Validates: Requirements 11.3**
  - Mock window.open
  - Mock successful fetch
  - Call printProfessionalReceipt
  - Assert window.open called with blob URL and '_blank'

- [ ] 8.5 Test error recovery
  - Mock failed fetch
  - Call printProfessionalReceipt
  - Assert isPrinting resets to false
  - Assert button becomes clickable again

- [ ] 9. Manual Testing and Validation
  - Test complete user flow
  - Validate professional PDF content
  - Test error scenarios
  - Test table layout and formatting
  - _Requirements: All requirements_

- [ ] 9.1 Test button visibility and positioning
  - Navigate to transaction detail page
  - Verify "Cetak Struk Profesional" button appears
  - Verify button is positioned correctly in header
  - Verify button styling matches design

- [ ] 9.2 Test professional PDF generation happy path
  - Click "Cetak Struk Profesional" button
  - Verify loading state appears
  - Verify PDF opens in new tab
  - Verify success toast appears
  - Verify button returns to normal state

- [ ] 9.3 Validate professional PDF content completeness
  - Open generated PDF
  - Verify header contains logo and store info
  - Verify transaction info section (top-right)
  - Verify table has 7 columns with borders
  - Verify all items are listed with correct data
  - Verify sizes are extracted and displayed in separate column
  - Verify financial summary calculations are correct
  - Verify footer contains keterangan and signature areas

- [ ] 9.4 Test table layout and formatting
  - Verify table borders are properly rendered
  - Verify column alignment (center, left, right)
  - Verify currency formatting (no Rp prefix, dot separators)
  - Verify date formatting (Indonesian format)
  - Verify text wrapping in table cells

- [ ] 9.5 Test with various transaction scenarios
  - Test with single item transaction
  - Test with multiple items (different categories and sizes)
  - Test with discount transactions (percentage and fixed)
  - Test with long product names
  - Test with large amounts (millions)
  - Test with transactions having many items (10+)

- [ ] 9.6 Test error handling scenarios
  - Test with invalid transaction ID
  - Verify error toast appears
  - Verify button returns to clickable state
  - Test with network disconnected
  - Verify appropriate error message

- [ ] 9.7 Test UI non-blocking behavior
  - **Property 20: UI Non-Blocking Behavior**
  - **Validates: Requirements 11.4, 10.5**
  - Click "Cetak Struk Profesional" button
  - While PDF is generating, try clicking other buttons
  - Verify other UI elements remain interactive

- [ ] 9.8 Test browser print functionality
  - Open generated professional PDF in new tab
  - Press Ctrl+P (or Cmd+P on Mac)
  - Verify browser print dialog opens
  - Verify PDF prints correctly on standard paper

- [ ] 9.9 Test PDF dimensions and layout
  - Verify PDF dimensions are 14x20cm (140x200mm)
  - Verify portrait orientation
  - Verify appropriate margins
  - Verify professional appearance

- [ ] 10. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Implementation Notes

### Task Execution Order
1. **Setup and Configuration**: Enhanced store config and dependencies (Tasks 1.x)
2. **Backend Service**: Professional receipt service implementation (Tasks 2.x)
3. **Backend API**: Professional receipt API route (Tasks 3.x)
4. **Frontend Hook**: React hook for professional receipt (Tasks 4.x)
5. **Frontend UI**: Component integration (Tasks 5.x)
6. **Testing**: Unit and integration tests (Tasks 6.x, 7.x, 8.x)
7. **Validation**: Manual testing and validation (Tasks 9.x)
8. **Checkpoint**: Final verification (Task 10)

### Key Technical Challenges
1. **Table Generation**: Creating bordered tables with jsPDF
2. **Layout Management**: Professional layout with proper spacing
3. **Logo Integration**: Loading and positioning company logo
4. **Financial Calculations**: Accurate discount and total calculations
5. **Data Extraction**: Handling complex transaction data structure

### Testing Approach
- **Implementation-first**: Write code before tests
- **Property-based validation**: Tests validate universal properties
- **Table-specific testing**: Focus on table generation and layout
- **Manual validation**: Comprehensive visual and functional testing

### Time Estimates
- Tasks 1.x: 1 hour (setup and configuration)
- Tasks 2.x: 6 hours (professional receipt service - complex table generation)
- Tasks 3.x: 1 hour (API route)
- Tasks 4.x: 1 hour (hook)
- Tasks 5.x: 1 hour (UI integration)
- Tasks 6.x: 3 hours (unit tests - comprehensive)
- Tasks 7.x: 1 hour (integration tests)
- Tasks 8.x: 1 hour (hook tests)
- Tasks 9.x: 1 hour (manual testing)
- Task 10: 15 minutes (checkpoint)
- **Total**: ~16 hours (2 days)

### Success Criteria
- All unit tests pass
- All integration tests pass
- Manual testing checklist complete
- Professional PDF layout matches requirements
- Table generation works correctly with borders
- Financial calculations are accurate
- Logo integration works properly
- No console errors in production
- Button states work correctly
- Error handling works as expected

### Dependencies on Existing Spec
This implementation builds upon the existing `customer-receipt-printing` spec:
- **Reuses**: Authentication, basic PDF generation, transaction data retrieval
- **Enhances**: Layout (table vs. simple text), dimensions (14x20cm vs. 80mm), branding
- **Adds**: Table generation, discount calculations, professional footer

---

**Document Version:** 1.0
**Last Updated:** December 22, 2025
**Status:** Ready for Execution