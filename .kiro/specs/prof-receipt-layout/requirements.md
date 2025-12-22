# Requirements Document - Professional Receipt Layout

## Introduction

This document specifies the requirements for the Professional Receipt Layout feature for the Erlima Mode Rental system. This feature replaces the existing simple thermal receipt format with a professional, table-based layout suitable for HVS paper (14x20cm format), providing enhanced branding and comprehensive transaction documentation.

The system shall generate PDF receipts with a structured table layout, professional header with logo, and detailed transaction breakdown including discount information and proper footer sections.

## Glossary

- **Professional Receipt**: A formatted PDF document with table layout, logo, and comprehensive transaction details
- **Receipt System**: The software component responsible for generating professional PDF receipts from transaction data
- **Transaction Detail Page**: The web page displaying complete information about a specific rental transaction
- **Kasir**: The cashier user role who processes transactions and generates receipts
- **Struk**: Indonesian term for receipt/invoice document
- **HVS Paper**: Standard office paper format, used here in 14x20cm size
- **Table Layout**: Structured format with bordered columns for organized data presentation

## Requirements

### Requirement 1: Professional Receipt Generation

**User Story:** As a kasir, I want to generate a professional receipt with table layout from the transaction detail page, so that I can provide customers with comprehensive, branded documentation.

#### Acceptance Criteria

1. WHEN a kasir views a transaction detail page, THE Receipt System SHALL display a "Cetak Struk Profesional" button in the page header
2. WHEN a kasir clicks the "Cetak Struk Profesional" button, THE Receipt System SHALL generate a professional PDF receipt and open it in a new browser tab
3. WHEN the PDF is being generated, THE Receipt System SHALL display a loading indicator on the button with text "Generating..."
4. WHEN the PDF generation completes successfully, THE Receipt System SHALL show a success toast message "Struk profesional berhasil dibuat"
5. WHEN the PDF generation fails, THE Receipt System SHALL show an error toast message "Gagal membuat struk. Silakan coba lagi."

### Requirement 2: Professional Header Section

**User Story:** As a kasir, I want the receipt to have a professional header with company branding, so that customers receive properly branded documentation.

#### Acceptance Criteria

1. WHEN generating a receipt, THE Receipt System SHALL include the company logo from "public/logo.jpg" positioned in the top-left corner
2. WHEN generating a receipt, THE Receipt System SHALL include store name "ERLIMA MODE" prominently displayed in the header
3. WHEN generating a receipt, THE Receipt System SHALL include store address "Jalan Abdullah Dg Sirua No 136D, Kota Makassar" in the header
4. WHEN generating a receipt, THE Receipt System SHALL include store phone "+62 821-9699-9962" in the header
5. WHEN generating a receipt, THE Receipt System SHALL include a document title section with transaction number, date, and payment method

### Requirement 3: Transaction Information Section

**User Story:** As a kasir, I want the receipt to display comprehensive transaction metadata, so that customers have complete reference information.

#### Acceptance Criteria

1. WHEN generating a receipt, THE Receipt System SHALL display "PENAWARAN PENJUALAN" as the document type in the top-right section
2. WHEN generating a receipt, THE Receipt System SHALL display the transaction code from data.kode as "Nomor"
3. WHEN generating a receipt, THE Receipt System SHALL display the transaction date from data.createdAt as "Tanggal" in Indonesian format
4. WHEN generating a receipt, THE Receipt System SHALL display the payment method from data.metodeBayar as "Pembayaran"
5. WHEN generating a receipt, THE Receipt System SHALL display customer name from data.penyewa.nama as "Kepada Yth"

### Requirement 4: Professional Table Layout

**User Story:** As a kasir, I want the receipt to display items in a professional table format, so that customers can easily read and verify their rental details.

#### Acceptance Criteria

1. WHEN generating a receipt, THE Receipt System SHALL create a bordered table with columns: No, Kategori, Nama Barang, Size, Qty, @Harga, Total Harga
2. WHEN displaying items, THE Receipt System SHALL use the transaction code as the "No" field for all items
3. WHEN displaying items, THE Receipt System SHALL extract category from item.produk.category for the "Kategori" column
4. WHEN displaying items, THE Receipt System SHALL display product name from item.produk.name in the "Nama Barang" column
5. WHEN displaying items, THE Receipt System SHALL extract and display size from kondisiAwal field in a separate "Size" column
6. WHEN displaying items, THE Receipt System SHALL display quantity from item.jumlah in the "Qty" column
7. WHEN displaying items, THE Receipt System SHALL display price per unit from item.hargaSewa in the "@Harga" column with currency formatting
8. WHEN displaying items, THE Receipt System SHALL display subtotal from item.subtotal in the "Total Harga" column with currency formatting

### Requirement 5: Financial Summary Section

**User Story:** As a kasir, I want the receipt to show a detailed financial breakdown, so that customers understand all charges and discounts applied.

#### Acceptance Criteria

1. WHEN generating a receipt, THE Receipt System SHALL display "Sub Total" with the sum of all item subtotals
2. WHEN generating a receipt, THE Receipt System SHALL display "Diskon" with the discount amount calculated from discountType and discountValue
3. WHEN generating a receipt, THE Receipt System SHALL display "Biaya Lain-lain" with value 0 (reserved for future use)
4. WHEN generating a receipt, THE Receipt System SHALL display "Total" with the final amount from data.totalHarga
5. WHEN displaying financial amounts, THE Receipt System SHALL use Indonesian currency format with "Rp" prefix and dot separators

### Requirement 6: Professional Footer Section

**User Story:** As a kasir, I want the receipt to have a professional footer with terms and signature area, so that the document appears complete and official.

#### Acceptance Criteria

1. WHEN generating a receipt, THE Receipt System SHALL include a "Keterangan" section on the left side of the footer
2. WHEN generating a receipt, THE Receipt System SHALL include the disclaimer text "Barang yg sudah dibeli tidak dapat ditukar atau dikembalikan" in the keterangan section
3. WHEN generating a receipt, THE Receipt System SHALL include a signature section on the right side with "Bagian Penjualan," label
4. WHEN generating a receipt, THE Receipt System SHALL include a signature line with "Tgl. ___________" for date entry
5. WHEN generating a receipt, THE Receipt System SHALL include a note "Harga dan stok di atas dapat berubah sewaktu-waktu tanpa pemberitahuan"

### Requirement 7: PDF Technical Specifications

**User Story:** As a kasir, I want the PDF to be properly formatted for standard office paper, so that it can be printed on common printers.

#### Acceptance Criteria

1. WHEN generating a PDF, THE Receipt System SHALL create a document with 140x200mm dimensions (14x20cm HVS paper format)
2. WHEN generating a PDF, THE Receipt System SHALL use portrait orientation
3. WHEN generating a PDF, THE Receipt System SHALL use appropriate margins for professional appearance
4. WHEN generating a PDF, THE Receipt System SHALL use clear, readable fonts suitable for business documents
5. WHEN generating a PDF, THE Receipt System SHALL implement table borders and proper spacing for professional layout

### Requirement 8: Data Source Integration

**User Story:** As a kasir, I want the receipt to automatically pull all transaction data from the existing system, so that I don't need to manually enter information.

#### Acceptance Criteria

1. WHEN generating a receipt, THE Receipt System SHALL retrieve transaction data from the existing GET /api/kasir/transaksi/[kode] endpoint
2. WHEN the transaction API returns data, THE Receipt System SHALL extract discount information from data.discountType and data.discountValue
3. WHEN the transaction API returns data, THE Receipt System SHALL calculate discount amount based on subtotal and discount percentage
4. WHEN the transaction API returns data, THE Receipt System SHALL extract category information from each item.produk.category
5. WHEN the transaction API returns data, THE Receipt System SHALL extract size information from each item.kondisiAwal field
6. WHEN the transaction API returns data, THE Receipt System SHALL use all existing transaction fields (kode, penyewa.nama, metodeBayar, etc.)
7. WHEN the transaction API returns data, THE Receipt System SHALL iterate through data.items array to populate the table rows

### Requirement 9: Size Extraction and Display

**User Story:** As a kasir, I want the receipt to clearly show the size of each rented item, so that customers can verify they received the correct sizes.

#### Acceptance Criteria

1. WHEN extracting size information, THE Receipt System SHALL parse the kondisiAwal field in format "uuid|SIZE|TYPE|condition"
2. WHEN extracting size information, THE Receipt System SHALL use the second pipe-delimited segment as the size value
3. WHEN displaying size information, THE Receipt System SHALL show the size in a dedicated table column
4. WHEN the kondisiAwal field is malformed or missing, THE Receipt System SHALL display an empty size field
5. WHEN multiple items have the same product but different sizes, THE Receipt System SHALL display them as separate table rows

### Requirement 10: Error Handling and User Feedback

**User Story:** As a kasir, I want clear feedback when something goes wrong, so that I know what action to take.

#### Acceptance Criteria

1. WHEN the transaction is not found, THE Receipt System SHALL display an error toast "Transaksi tidak ditemukan"
2. WHEN the PDF generation fails due to a system error, THE Receipt System SHALL log the error to console with full error details
3. WHEN the PDF generation fails, THE Receipt System SHALL reset the button state to allow retry
4. WHEN the API request fails due to network issues, THE Receipt System SHALL display an error toast with retry suggestion
5. WHEN any error occurs, THE Receipt System SHALL NOT block the user interface or prevent other actions

### Requirement 11: Performance and User Experience

**User Story:** As a kasir, I want the professional receipt generation to be fast and not disrupt my workflow, so that I can efficiently serve customers.

#### Acceptance Criteria

1. WHEN generating a PDF, THE Receipt System SHALL complete the generation within 3 seconds for typical transactions
2. WHEN the button is clicked, THE Receipt System SHALL immediately show loading state to provide instant feedback
3. WHEN the PDF is ready, THE Receipt System SHALL open it in a new tab without closing or navigating away from the transaction detail page
4. WHEN generating a PDF, THE Receipt System SHALL NOT block other UI interactions on the page
5. WHEN the PDF opens in a new tab, THE Receipt System SHALL allow the kasir to print using browser print functionality (Ctrl+P)

### Requirement 12: Authentication and Authorization

**User Story:** As a system administrator, I want only authorized users to generate professional receipts, so that we maintain security and audit trails.

#### Acceptance Criteria

1. WHEN a user attempts to generate a receipt, THE Receipt System SHALL verify the user has 'transaksi' read permission
2. WHEN an unauthorized user attempts to access the receipt API, THE Receipt System SHALL return a 401 Unauthorized response
3. WHEN generating a receipt, THE Receipt System SHALL use the existing authentication middleware without additional configuration
4. WHEN logging receipt generation, THE Receipt System SHALL include the user ID in console logs for audit purposes

### Requirement 13: Configuration Management

**User Story:** As a developer, I want store information to be easily configurable, so that we can update business details without code changes in the future.

#### Acceptance Criteria

1. WHEN the system initializes, THE Receipt System SHALL load store configuration from a centralized constants file
2. WHEN accessing store information, THE Receipt System SHALL use the STORE_CONFIG constant containing name, address, and phone
3. WHEN the store configuration is updated, THE Receipt System SHALL reflect changes in all subsequently generated receipts
4. WHEN the configuration file is missing required fields, THE Receipt System SHALL use empty strings rather than throwing errors

---

## Non-Functional Requirements

### Performance
- PDF generation SHALL complete within 3 seconds for transactions with up to 20 line items
- The system SHALL handle concurrent receipt generation requests without performance degradation
- Table rendering SHALL be optimized for complex layouts without significant delay

### Usability
- The "Cetak Struk Profesional" button SHALL be clearly visible and positioned consistently with other action buttons
- Loading states SHALL provide immediate visual feedback within 100ms of user action
- Error messages SHALL be written in Indonesian language matching the application's locale
- The professional layout SHALL be easily readable and printable on standard office printers

### Maintainability
- The receipt generation logic SHALL be encapsulated in a dedicated service class
- The table layout code SHALL be modular to allow easy customization of columns and formatting
- The code SHALL follow existing project conventions and TypeScript best practices
- The professional layout SHALL be easily extensible for future enhancements

### Reliability
- Receipt generation failures SHALL NOT affect transaction data integrity
- The system SHALL gracefully handle malformed transaction data without crashing
- Console logging SHALL provide sufficient information for debugging production issues
- Table layout SHALL handle varying content lengths without breaking the format

---

## Data Mapping Reference

### Transaction API Fields Used
```typescript
// From docs/debug/api-transaksi-detail.md
data.kode                    → No (transaction code)
data.createdAt              → Tanggal (transaction date)
data.metodeBayar            → Pembayaran (payment method)
data.penyewa.nama           → Kepada Yth (customer name)
data.discountType           → Discount calculation
data.discountValue          → Discount calculation
data.totalHarga             → Total amount

// For each item in data.items:
item.produk.category        → Kategori
item.produk.name           → Nama Barang
item.kondisiAwal           → Size (extracted from pipe-delimited format)
item.jumlah                → Qty
item.hargaSewa             → @Harga
item.subtotal              → Total Harga
```

### Size Extraction Format
```
kondisiAwal format: "uuid|SIZE|TYPE|condition"
Example: "ee142fcf-e849-4214-a0a0-194c413b7754|L|ADULT|baik"
Extracted size: "L"
```

---

## Relationship to Existing Spec

This specification builds upon and replaces the existing `customer-receipt-printing` spec located at `.kiro/specs/customer-receipt-printing/`. Key differences:

### Enhancements Over Previous Spec:
- **Layout**: Table-based professional format vs. simple text layout
- **Dimensions**: 14x20cm HVS paper vs. 80mm thermal paper
- **Structure**: Bordered table with dedicated columns vs. simple line items
- **Branding**: Enhanced header with logo positioning vs. basic header
- **Footer**: Professional signature area vs. simple thank you message
- **Data**: Additional fields (category, separate size column, discount breakdown)

### Shared Components:
- Authentication and authorization mechanisms
- Basic transaction data retrieval
- PDF generation infrastructure
- Error handling patterns
- User interface integration points

---

## Out of Scope

The following features are explicitly excluded from this specification:
- Thermal printer integration (remains in separate spec)
- Email or SMS receipt delivery
- QR code generation
- Custom receipt templates beyond the professional layout
- Database logging of print attempts
- Receipt history or reprint functionality from list view
- Bank account information display

---

## Assumptions

1. The existing transaction API endpoint provides all necessary data fields
2. Users have modern browsers supporting PDF preview (Chrome, Firefox, Edge, Safari)
3. The jsPDF library supports table creation and border rendering
4. Store information (name, address, phone) will remain static during implementation
5. All transactions will have at least one product item
6. The kondisiAwal field format remains consistent (contains size information)
7. Standard office printers can handle 14x20cm paper format

---

## Dependencies

- Existing GET /api/kasir/transaksi/[kode] API endpoint
- Existing authentication and authorization middleware
- jsPDF library (version 2.5.1 or compatible) with table support
- React toast notification system
- Existing transaction detail page component
- Company logo file at public/logo.jpg

---

**Document Version:** 1.0  
**Last Updated:** December 22, 2025  
**Status:** Ready for Review