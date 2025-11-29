# Requirements Document: Product Break-Even Status Badge

## Introduction

This document specifies the requirements for the Product Break-Even Status Badge feature, which provides visual indicators to show whether a rental product has recovered its initial capital investment (modal awal) through accumulated rental revenue. This feature helps business owners and producers quickly identify profitable products and make informed inventory decisions.

The feature displays a "Modal Kembali" (Break-Even) badge on products that have generated revenue equal to or exceeding their initial capital cost, calculated from all completed rental transactions excluding cancelled ones.

---

## Glossary

- **Product**: A rental item in the inventory system with an initial capital cost (modalAwal)
- **Modal Awal**: The initial capital investment cost for acquiring or producing a product
- **Break-Even Status**: The state where total accumulated revenue equals or exceeds the modal awal
- **Total Revenue**: The sum of all rental income (subtotal) and penalties from completed transactions
- **Transaction**: A rental booking record in the system with status tracking
- **Badge**: A visual indicator component displaying the break-even achievement status
- **Progress Bar**: A visual representation showing the percentage of modal awal recovered
- **Owner**: User role with full system access and financial visibility
- **Producer**: User role responsible for product management with financial visibility
- **Kasir**: User role for transaction processing without financial visibility

---

## Requirements

### Requirement 1: Break-Even Status Calculation

**User Story:** As a business owner, I want the system to automatically calculate whether each product has recovered its initial investment, so that I can quickly identify profitable products.

#### Acceptance Criteria

1. WHEN the system calculates break-even status for a product, THE system SHALL sum all rental revenue from non-cancelled transactions for that product
2. WHEN calculating total revenue, THE system SHALL include both base rental amounts (subtotal) and penalty amounts from transaction returns
3. WHEN a transaction has status "cancelled", THE system SHALL exclude that transaction from revenue calculations
4. WHEN total revenue equals or exceeds modal awal, THE system SHALL mark the product as break-even achieved
5. WHEN total revenue is less than modal awal, THE system SHALL calculate the progress percentage as (total revenue / modal awal) × 100

---

### Requirement 2: Break-Even Badge Display

**User Story:** As a producer, I want to see a visual badge on products that have achieved break-even, so that I can quickly identify successful products without detailed analysis.

#### Acceptance Criteria

1. WHEN a product has achieved break-even status, THE system SHALL display a "🏆 Modal Kembali" badge on the product
2. WHEN displaying the badge, THE system SHALL use soft yellow styling (bg-yellow-100, text-yellow-800, border-yellow-300)
3. WHEN a product has not achieved break-even, THE system SHALL NOT display any badge
4. WHEN the badge is displayed in ProductDetailPage header, THE system SHALL position it prominently near the product name
5. WHEN the badge is displayed in ProductListPage table, THE system SHALL show it in a compact format in the status column
6. WHEN the badge is displayed in ProductGrid cards, THE system SHALL position it as a corner badge on the product card

---

### Requirement 3: Progress Bar Display (ProductDetailPage Only)

**User Story:** As a business owner, I want to see detailed progress toward break-even on the product detail page, so that I can understand how close products are to profitability.

#### Acceptance Criteria

1. WHEN viewing a product detail page, THE system SHALL display a progress bar showing break-even progress in the header section
2. WHEN displaying the progress bar, THE system SHALL show the percentage value as (total revenue / modal awal) × 100
3. WHEN displaying progress information, THE system SHALL show formatted currency values for both total revenue and modal awal
4. WHEN the progress exceeds 100%, THE system SHALL cap the visual progress bar at 100% but display the actual percentage value
5. WHEN modal awal is zero or null, THE system SHALL hide the progress bar and display "Modal awal tidak tersedia"

---

### Requirement 4: Badge Tooltip Information

**User Story:** As a producer, I want to see detailed financial breakdown when hovering over the break-even badge, so that I can understand the revenue composition without navigating away.

#### Acceptance Criteria

1. WHEN a user hovers over the break-even badge, THE system SHALL display a tooltip with detailed financial information
2. WHEN displaying the tooltip, THE system SHALL show the modal awal amount in formatted currency
3. WHEN displaying the tooltip, THE system SHALL show the total revenue amount in formatted currency
4. WHEN total revenue exceeds modal awal, THE system SHALL calculate and display profit amount as (total revenue - modal awal)
5. WHEN displaying the tooltip, THE system SHALL show the total number of transactions that contributed to the revenue
6. WHEN displaying profit percentage, THE system SHALL calculate it as ((total revenue / modal awal) × 100) and format with one decimal place

---

### Requirement 5: Role-Based Visibility

**User Story:** As a system administrator, I want break-even status to be visible only to authorized roles, so that financial information is protected according to business policies.

#### Acceptance Criteria

1. WHEN a user with Owner role views products, THE system SHALL display break-even badges and progress information
2. WHEN a user with Producer role views products, THE system SHALL display break-even badges and progress information
3. WHEN a user with Kasir role views products, THE system SHALL hide all break-even badges and progress information
4. WHEN an unauthenticated user views public product listings, THE system SHALL hide all break-even information
5. WHEN role permissions are checked, THE system SHALL use the existing Clerk session claims for role determination

---

### Requirement 6: Data Caching and Performance

**User Story:** As a system user, I want break-even status to load quickly without impacting page performance, so that I can browse products efficiently.

#### Acceptance Criteria

1. WHEN break-even data is fetched, THE system SHALL cache the results for 5 minutes using React Query
2. WHEN the browser window regains focus, THE system SHALL refetch break-even data to ensure freshness
3. WHEN displaying product lists with multiple products, THE system SHALL fetch break-even status for all visible products in a single optimized query
4. WHEN a transaction is completed or cancelled, THE system SHALL invalidate the break-even cache for affected products
5. WHEN break-even data is loading, THE system SHALL display a skeleton loader in place of the badge

---

### Requirement 7: API Integration

**User Story:** As a developer, I want a clean API endpoint for break-even status, so that the feature integrates seamlessly with existing product data flows.

#### Acceptance Criteria

1. WHEN requesting product data with break-even status, THE system SHALL extend the existing GET /api/products/[id] endpoint with an optional includeBreakEven query parameter
2. WHEN includeBreakEven is true, THE system SHALL include breakEvenStatus object in the product response
3. WHEN fetching product lists, THE system SHALL support bulk break-even status retrieval via GET /api/products?includeBreakEven=true
4. WHEN the API returns break-even status, THE system SHALL include modalAwal, totalRevenue, isBreakEven, progressPercentage, and transactionCount fields
5. WHEN a product has no transactions, THE system SHALL return totalRevenue as 0 and isBreakEven as false

---

### Requirement 8: Error Handling and Edge Cases

**User Story:** As a system user, I want the break-even feature to handle errors gracefully, so that product pages remain functional even when revenue data is unavailable.

#### Acceptance Criteria

1. WHEN break-even data fails to load, THE system SHALL hide the badge and progress bar without breaking the page layout
2. WHEN a product has modalAwal set to zero, THE system SHALL treat it as break-even achieved and display the badge
3. WHEN a product has null or undefined modalAwal, THE system SHALL hide break-even indicators
4. WHEN revenue calculation encounters a database error, THE system SHALL log the error and return a fallback response with isBreakEven as false
5. WHEN network request times out, THE system SHALL retry up to 2 times before showing an error state

---

## Non-Functional Requirements

### Performance
- Break-even status calculation SHALL complete within 200ms for single product queries
- Bulk break-even status queries SHALL complete within 500ms for up to 50 products
- Badge rendering SHALL not cause layout shifts or visual jank

### Accessibility
- Badge components SHALL have proper ARIA labels for screen readers
- Tooltip content SHALL be keyboard accessible
- Color contrast SHALL meet WCAG 2.1 AA standards (minimum 4.5:1 ratio)

### Compatibility
- Feature SHALL work on all modern browsers (Chrome, Firefox, Safari, Edge)
- Badge SHALL be responsive and display correctly on mobile devices
- Feature SHALL integrate with existing product list filtering and sorting

### Security
- Break-even data SHALL only be accessible to authenticated users with appropriate roles
- API endpoints SHALL validate user permissions before returning financial data
- Revenue calculations SHALL use server-side logic to prevent client-side manipulation

---

## Out of Scope

The following items are explicitly out of scope for this feature:

1. Historical break-even tracking over time (trend analysis)
2. Break-even predictions or forecasting
3. Comparison of break-even status across product categories
4. Export of break-even reports to CSV/PDF
5. Email notifications when products achieve break-even
6. Break-even status for product bundles or packages
7. Adjustment of modal awal based on maintenance costs
8. Break-even calculations for products with variable pricing

---

## Dependencies

- Existing ProductHistoryService for revenue aggregation
- Clerk authentication system for role-based access control
- React Query for data caching and state management
- Existing Product API endpoints and data models
- TransaksiItem and Transaksi database tables

---

## Assumptions

1. Modal awal is accurately recorded for all products in the system
2. Transaction status values are consistently maintained ("cancelled" vs other statuses)
3. Revenue data (subtotal and penalties) is accurate and up-to-date
4. User roles (Owner, Producer, Kasir) are properly configured in Clerk
5. Existing product list and detail pages can accommodate new badge components

---

**Document Version**: 1.0  
**Created**: 2025-11-29  
**Status**: Draft - Pending Review
