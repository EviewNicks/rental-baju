# Requirements Document - Customer Receipt PDF Preview

## Introduction

This document specifies the requirements for the Customer Receipt PDF Preview feature (MVP Phase 1) for the Erlima Mode Rental system. The feature enables cashiers to generate and preview transaction receipts in PDF format before proceeding to thermal printer integration in Phase 2.

The system shall provide a simple, manual receipt generation mechanism accessible from the transaction detail page, producing a standardized PDF receipt that opens in a new browser tab for preview and optional printing.

## Glossary

- **Receipt System**: The software component responsible for generating PDF receipts from transaction data
- **Transaction Detail Page**: The web page displaying complete information about a specific rental transaction
- **PDF Receipt**: A portable document format file containing formatted transaction information mimicking thermal printer output
- **Kasir**: The cashier user role who processes transactions and generates receipts
- **Struk**: Indonesian term for receipt/invoice document
- **Store Config**: Hardcoded configuration containing business information (name, address, phone)
- **Transaction API**: The existing REST API endpoint that provides transaction details

## Requirements

### Requirement 1: Manual Receipt Generation

**User Story:** As a kasir, I want to manually generate a receipt PDF from the transaction detail page, so that I can provide documentation to customers and validate the receipt format.

#### Acceptance Criteria

1. WHEN a kasir views a transaction detail page, THE Receipt System SHALL display a "Cetak Struk" button in the page header next to the status badge
2. WHEN a kasir clicks the "Cetak Struk" button, THE Receipt System SHALL generate a PDF receipt and open it in a new browser tab
3. WHEN the PDF is being generated, THE Receipt System SHALL display a loading indicator on the button with text "Generating..."
4. WHEN the PDF generation completes successfully, THE Receipt System SHALL show a success toast message "Struk berhasil dibuat"
5. WHEN the PDF generation fails, THE Receipt System SHALL show an error toast message "Gagal membuat struk. Silakan coba lagi."

### Requirement 2: Receipt Content Structure

**User Story:** As a kasir, I want the receipt to contain all essential transaction information in a clear format, so that customers have complete documentation of their rental.

#### Acceptance Criteria

1. WHEN generating a receipt, THE Receipt System SHALL include a header section containing the company logo from "public/logo.jpg", store name "ERLIMA MODE", address "Jalan Abdullah Dg Sirua No 136D, Kota Makassar", and phone "+62 821-9699-9962"
2. WHEN generating a receipt, THE Receipt System SHALL include a transaction info section containing the transaction code, transaction date, pickup date, return date, customer name, and kasir name in Indonesian format
3. WHEN generating a receipt, THE Receipt System SHALL include a product details section listing each rented item with product name, size, quantity, price per unit, duration, and subtotal
4. WHEN generating a receipt, THE Receipt System SHALL include a payment summary section showing the total amount, down payment/amount paid, and remaining balance
5. WHEN generating a receipt, THE Receipt System SHALL include a footer section with "Terima Kasih!" and the disclaimer "Barang yang sudah disewa tidak dapat dikembalikan"

### Requirement 3: Product Item Display

**User Story:** As a kasir, I want each product item to show complete details including size information, so that customers can verify exactly which items they rented.

#### Acceptance Criteria

1. WHEN a transaction contains multiple items of the same product with different sizes, THE Receipt System SHALL display them as separate line items
2. WHEN displaying a product item, THE Receipt System SHALL extract and show the size from the kondisiAwal field in format "Product Name (Size)"
3. WHEN displaying a product item, THE Receipt System SHALL show the quantity, price per unit, rental duration in days, and calculated subtotal
4. WHEN displaying product items, THE Receipt System SHALL maintain the order as provided by the transaction API

### Requirement 4: Data Formatting

**User Story:** As a kasir, I want all data on the receipt to be formatted consistently and clearly, so that customers can easily read and understand the information.

#### Acceptance Criteria

1. WHEN formatting currency values, THE Receipt System SHALL use Indonesian format with "Rp" prefix, space separator, and dot as thousand separator (e.g., "Rp 300.000")
2. WHEN formatting dates, THE Receipt System SHALL use Indonesian format with day, abbreviated month name, year, and 24-hour time (e.g., "01 Des 2024 12:19")
3. WHEN formatting the receipt layout, THE Receipt System SHALL use monospace font for proper text alignment
4. WHEN formatting section separators, THE Receipt System SHALL use equal sign characters (=) spanning the full width

### Requirement 5: PDF Technical Specifications

**User Story:** As a kasir, I want the PDF to simulate thermal printer output dimensions, so that we can validate the format before implementing actual thermal printing.

#### Acceptance Criteria

1. WHEN generating a PDF, THE Receipt System SHALL create a document with 80mm width to match thermal paper dimensions
2. WHEN generating a PDF, THE Receipt System SHALL use portrait orientation with dynamic height based on content
3. WHEN generating a PDF, THE Receipt System SHALL use courier (monospace) font for consistent character spacing
4. WHEN generating a PDF, THE Receipt System SHALL set the content-disposition header to "inline" so the PDF opens in browser rather than downloading

### Requirement 6: Data Source Integration

**User Story:** As a kasir, I want the receipt to automatically pull transaction data from the existing system, so that I don't need to manually enter information.

#### Acceptance Criteria

1. WHEN generating a receipt, THE Receipt System SHALL retrieve transaction data from the existing GET /api/kasir/transaksi/[kode] endpoint
2. WHEN the transaction API returns data, THE Receipt System SHALL extract the transaction code from data.kode field
3. WHEN the transaction API returns data, THE Receipt System SHALL extract customer name from data.penyewa.nama field
4. WHEN the transaction API returns data, THE Receipt System SHALL extract kasir name from data.kasir.nama field
5. WHEN the transaction API returns data, THE Receipt System SHALL extract transaction date from data.createdAt, pickup date from data.tglMulai, and return date from data.tglSelesai fields
6. WHEN the transaction API returns data, THE Receipt System SHALL extract payment information from data.totalHarga, data.jumlahBayar, and data.sisaBayar fields
7. WHEN the transaction API returns data, THE Receipt System SHALL iterate through data.items array to extract all product information

### Requirement 7: Error Handling and User Feedback

**User Story:** As a kasir, I want clear feedback when something goes wrong, so that I know what action to take.

#### Acceptance Criteria

1. WHEN the transaction is not found, THE Receipt System SHALL display an error toast "Transaksi tidak ditemukan"
2. WHEN the PDF generation fails due to a system error, THE Receipt System SHALL log the error to console with full error details
3. WHEN the PDF generation fails, THE Receipt System SHALL reset the button state to allow retry
4. WHEN the API request fails due to network issues, THE Receipt System SHALL display an error toast with retry suggestion
5. WHEN any error occurs, THE Receipt System SHALL NOT block the user interface or prevent other actions

### Requirement 8: Performance and User Experience

**User Story:** As a kasir, I want the receipt generation to be fast and not disrupt my workflow, so that I can efficiently serve customers.

#### Acceptance Criteria

1. WHEN generating a PDF, THE Receipt System SHALL complete the generation within 2 seconds for typical transactions
2. WHEN the button is clicked, THE Receipt System SHALL immediately show loading state to provide instant feedback
3. WHEN the PDF is ready, THE Receipt System SHALL open it in a new tab without closing or navigating away from the transaction detail page
4. WHEN generating a PDF, THE Receipt System SHALL NOT block other UI interactions on the page
5. WHEN the PDF opens in a new tab, THE Receipt System SHALL allow the kasir to print using browser print functionality (Ctrl+P)

### Requirement 9: Authentication and Authorization

**User Story:** As a system administrator, I want only authorized users to generate receipts, so that we maintain security and audit trails.

#### Acceptance Criteria

1. WHEN a user attempts to generate a receipt, THE Receipt System SHALL verify the user has 'transaksi' read permission
2. WHEN an unauthorized user attempts to access the receipt API, THE Receipt System SHALL return a 401 Unauthorized response
3. WHEN generating a receipt, THE Receipt System SHALL use the existing authentication middleware without additional configuration
4. WHEN logging receipt generation, THE Receipt System SHALL include the user ID in console logs for audit purposes

### Requirement 10: Configuration Management

**User Story:** As a developer, I want store information to be easily configurable, so that we can update business details without code changes in the future.

#### Acceptance Criteria

1. WHEN the system initializes, THE Receipt System SHALL load store configuration from a centralized constants file
2. WHEN accessing store information, THE Receipt System SHALL use the STORE_CONFIG constant containing name, address, and phone
3. WHEN the store configuration is updated, THE Receipt System SHALL reflect changes in all subsequently generated receipts
4. WHEN the configuration file is missing required fields, THE Receipt System SHALL use empty strings rather than throwing errors

---

## Non-Functional Requirements

### Performance
- PDF generation SHALL complete within 2 seconds for transactions with up to 20 line items
- The system SHALL handle concurrent receipt generation requests without performance degradation

### Usability
- The "Cetak Struk" button SHALL be clearly visible and positioned consistently with other action buttons
- Loading states SHALL provide immediate visual feedback within 100ms of user action
- Error messages SHALL be written in Indonesian language matching the application's locale

### Maintainability
- The receipt generation logic SHALL be encapsulated in a dedicated service class
- The PDF formatting code SHALL be modular to allow easy extension for thermal printer integration
- The code SHALL follow existing project conventions and TypeScript best practices

### Reliability
- Receipt generation failures SHALL NOT affect transaction data integrity
- The system SHALL gracefully handle malformed transaction data without crashing
- Console logging SHALL provide sufficient information for debugging production issues

---

## Out of Scope (Phase 2)

The following features are explicitly excluded from this MVP phase:
- Automatic receipt printing upon transaction creation
- Thermal printer hardware integration
- Database logging of print attempts
- Email or SMS receipt delivery
- QR code generation
- Custom receipt templates
- Receipt history or reprint functionality from list view

---

## Assumptions

1. The existing transaction API endpoint provides all necessary data fields
2. Users have modern browsers supporting PDF preview (Chrome, Firefox, Edge, Safari)
3. The jsPDF library is compatible with the project's build system
4. Store information (name, address, phone) will remain static during MVP phase
5. All transactions will have at least one product item
6. The kondisiAwal field format remains consistent (contains size information)

---

## Dependencies

- Existing GET /api/kasir/transaksi/[kode] API endpoint
- Existing authentication and authorization middleware
- jsPDF library (version 2.5.1 or compatible)
- React toast notification system
- Existing transaction detail page component

---

**Document Version:** 1.0
**Last Updated:** December 9, 2025
**Status:** Approved for Implementation
