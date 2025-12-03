# Requirements Document - Dana Kasir Management

## Introduction

The Dana Kasir Management feature provides a daily cash flow management system for rental business operations. This system enables cashiers (Kasir) and owners to track daily income from rental transactions and record operational expenses in a simple, transparent manner. The feature integrates with the existing transaction system to automatically display rental income and provides manual entry capabilities for expenses, with historical data access and CSV export functionality.

## Glossary

- **Dana Kasir System**: The cash flow management system that tracks daily income and expenses
- **Kasir**: Cashier role user who processes rental transactions and records expenses
- **Owner**: Administrative role user who has oversight of all cashier operations
- **Pendapatan (Income)**: Revenue generated from rental transactions and penalty payments
- **Pengeluaran (Expense)**: Operational costs recorded by cashiers
- **Transaksi Rental**: Rental transaction records from the existing transaction system
- **Penalty Payment**: Additional charges applied to late returns or damaged items
- **Historical Data**: Past daily records of income and expenses
- **Daily View**: Display of income and expenses for a specific calendar day
- **WITA Timezone**: Waktu Indonesia Tengah (UTC+8) timezone for date calculations
- **CSV Export**: Comma-separated values file format for data export
- **Kategori Pengeluaran**: Fixed expense categories (Operasional, Maintenance, Transport, Lainnya)

## Requirements

### Requirement 1: Daily Income Display

**User Story:** As a Kasir, I want to view all rental income for a specific day, so that I can track daily revenue from rental operations.

#### Acceptance Criteria

1. WHEN a Kasir accesses the Dana Kasir dashboard, THE Dana Kasir System SHALL display all rental transaction income for the current day based on WITA timezone (00:00 - 23:59)
2. WHEN displaying rental income, THE Dana Kasir System SHALL include transaction code, customer name, rental amount, penalty amount (if applicable), transaction status, and the Kasir ID who processed the transaction
3. WHEN a rental transaction includes penalty payments, THE Dana Kasir System SHALL display the penalty amount as a separate line item with clear labeling
4. WHEN calculating daily income totals, THE Dana Kasir System SHALL sum both rental amounts and penalty amounts from all transactions
5. WHEN no rental transactions exist for the selected day, THE Dana Kasir System SHALL display an empty state message indicating no income recorded

### Requirement 2: Expense Recording

**User Story:** As a Kasir, I want to record operational expenses quickly, so that I can maintain accurate records of daily costs.

#### Acceptance Criteria

1. WHEN a Kasir clicks the add expense button, THE Dana Kasir System SHALL display a form with fields for kasir selection (dropdown), amount (Rupiah format), description (free text), and category (dropdown selection)
2. WHEN a Kasir submits an expense entry, THE Dana Kasir System SHALL validate that a kasir is selected, amount is a positive decimal number, and category is one of the predefined values (Operasional, Maintenance, Transport, Lainnya)
3. WHEN an expense is successfully created, THE Dana Kasir System SHALL store the expense with the selected Kasir ID, authenticated user ID (createdBy), timestamp in WITA timezone, and display a success notification
4. WHEN displaying expenses, THE Dana Kasir System SHALL show kasir name, amount, description, category, creation timestamp, and the Kasir who is responsible for the expense
5. WHEN a Kasir edits an existing expense, THE Dana Kasir System SHALL allow modification of kasir selection, amount, description, and category fields only

### Requirement 3: Expense Management

**User Story:** As a Kasir, I want to edit or delete expense records, so that I can correct mistakes or remove invalid entries.

#### Acceptance Criteria

1. WHEN a Kasir selects an expense entry, THE Dana Kasir System SHALL display edit and delete action buttons
2. WHEN a Kasir clicks the edit button, THE Dana Kasir System SHALL populate the form with existing expense data and allow modifications
3. WHEN a Kasir saves edited expense data, THE Dana Kasir System SHALL validate the input and update the expense record with a new updated timestamp
4. WHEN a Kasir clicks the delete button, THE Dana Kasir System SHALL display a confirmation dialog before proceeding
5. WHEN a Kasir confirms deletion, THE Dana Kasir System SHALL perform a soft delete by marking the expense as inactive rather than removing the database record

### Requirement 4: Daily Summary Display

**User Story:** As a Kasir, I want to see a summary of daily income and expenses, so that I can quickly understand the cash flow status.

#### Acceptance Criteria

1. WHEN the Dana Kasir dashboard loads, THE Dana Kasir System SHALL display summary cards showing total income, total expenses, and net balance for the selected day
2. WHEN calculating total income, THE Dana Kasir System SHALL sum all rental amounts and penalty amounts from transactions created on the selected day
3. WHEN calculating total expenses, THE Dana Kasir System SHALL sum all expense amounts recorded on the selected day
4. WHEN calculating net balance, THE Dana Kasir System SHALL subtract total expenses from total income
5. WHEN the net balance is negative, THE Dana Kasir System SHALL display the value in red color to indicate a deficit

### Requirement 5: Historical Data Access

**User Story:** As a Kasir, I want to view income and expense records from previous days, so that I can review past cash flow data.

#### Acceptance Criteria

1. WHEN a Kasir accesses the Dana Kasir dashboard, THE Dana Kasir System SHALL provide date navigation controls to select any past date
2. WHEN a Kasir selects a different date, THE Dana Kasir System SHALL load and display all income and expense records for that specific date
3. WHEN displaying historical data, THE Dana Kasir System SHALL maintain the same layout and information as the current day view
4. WHEN a Kasir navigates between dates, THE Dana Kasir System SHALL preserve the selected date in the URL for bookmarking and sharing
5. WHEN loading historical data, THE Dana Kasir System SHALL complete the data fetch and render within 2 seconds

### Requirement 6: Role-Based Access Control

**User Story:** As a system administrator, I want to ensure proper access control for Dana Kasir features, so that users can only perform authorized actions.

#### Acceptance Criteria

1. WHEN a user with Kasir role accesses the Dana Kasir dashboard, THE Dana Kasir System SHALL allow viewing all income and expense records for any date
2. WHEN a user with Kasir role attempts to create, edit, or delete expenses, THE Dana Kasir System SHALL permit these operations
3. WHEN a user with Owner role accesses the Dana Kasir dashboard, THE Dana Kasir System SHALL allow viewing all income and expense records for any date
4. WHEN a user with Owner role attempts to create, edit, or delete expenses, THE Dana Kasir System SHALL deny these operations and display a read-only view
5. WHEN an unauthenticated user attempts to access Dana Kasir features, THE Dana Kasir System SHALL redirect to the login page

### Requirement 7: Navigation Integration

**User Story:** As a Kasir, I want easy access to the Dana Kasir dashboard from the main interface, so that I can quickly navigate to cash flow management.

#### Acceptance Criteria

1. WHEN a Kasir views the main dashboard, THE Dana Kasir System SHALL display a "Dana Kasir" button in the dashboard interface
2. WHEN a Kasir clicks the Dana Kasir button, THE Dana Kasir System SHALL navigate to the Dana Kasir dashboard page
3. WHEN an Owner views the sidebar navigation, THE Dana Kasir System SHALL display a "Dana Kasir" menu item in the Owner sidebar
4. WHEN an Owner clicks the Dana Kasir menu item, THE Dana Kasir System SHALL navigate to the Dana Kasir dashboard page
5. WHEN navigating to the Dana Kasir dashboard, THE Dana Kasir System SHALL default to displaying the current day's data

### Requirement 8: Data Export

**User Story:** As an Owner, I want to export cash flow data to CSV format, so that I can perform external analysis and reporting.

#### Acceptance Criteria

1. WHEN an Owner views the Dana Kasir dashboard, THE Dana Kasir System SHALL display an export button
2. WHEN an Owner clicks the export button, THE Dana Kasir System SHALL display date range selection options (single day, date range, or current month)
3. WHEN an Owner selects a date range and confirms export, THE Dana Kasir System SHALL generate a CSV file containing all income and expense records for the selected period
4. WHEN generating the CSV file, THE Dana Kasir System SHALL include columns for date, type (income/expense), transaction code (for income), description, category (for expenses), amount, and Kasir ID
5. WHEN the CSV file is ready, THE Dana Kasir System SHALL trigger a browser download with a filename format "dana-kasir-YYYY-MM-DD.csv"

### Requirement 9: Data Validation and Error Handling

**User Story:** As a Kasir, I want clear error messages when I enter invalid data, so that I can correct mistakes quickly.

#### Acceptance Criteria

1. WHEN a Kasir submits an expense form without selecting a kasir, THE Dana Kasir System SHALL display an error message "Kasir harus dipilih"
2. WHEN a Kasir submits an expense form with an empty amount field, THE Dana Kasir System SHALL display an error message "Jumlah harus diisi"
3. WHEN a Kasir submits an expense form with a negative or zero amount, THE Dana Kasir System SHALL display an error message "Jumlah harus lebih besar dari 0"
4. WHEN a Kasir submits an expense form without selecting a category, THE Dana Kasir System SHALL display an error message "Kategori harus dipilih"
5. WHEN a Kasir submits an expense form with a description exceeding 500 characters, THE Dana Kasir System SHALL display an error message "Deskripsi maksimal 500 karakter"
6. WHEN a network error occurs during data submission, THE Dana Kasir System SHALL display a user-friendly error message and provide a retry option

### Requirement 10: Mobile Responsive Design

**User Story:** As a Kasir, I want to access Dana Kasir features on mobile devices, so that I can manage cash flow from anywhere.

#### Acceptance Criteria

1. WHEN a Kasir accesses the Dana Kasir dashboard on a mobile device, THE Dana Kasir System SHALL adapt the layout to fit the screen width
2. WHEN displaying summary cards on mobile, THE Dana Kasir System SHALL stack the cards vertically for optimal readability
3. WHEN displaying income and expense lists on mobile, THE Dana Kasir System SHALL use a card-based layout instead of a table format
4. WHEN a Kasir interacts with form inputs on mobile, THE Dana Kasir System SHALL display appropriate mobile keyboards (numeric for amount, text for description)
5. WHEN a Kasir navigates between dates on mobile, THE Dana Kasir System SHALL provide touch-friendly date picker controls

### Requirement 11: Performance Requirements

**User Story:** As a Kasir, I want the Dana Kasir system to respond quickly, so that I can work efficiently without delays.

#### Acceptance Criteria

1. WHEN a Kasir loads the Dana Kasir dashboard, THE Dana Kasir System SHALL complete initial page render within 2 seconds
2. WHEN a Kasir submits an expense entry, THE Dana Kasir System SHALL process the submission and display confirmation within 1 second
3. WHEN a Kasir switches between dates, THE Dana Kasir System SHALL load and display the new data within 2 seconds
4. WHEN the Dana Kasir System queries the database for daily records, THE query execution SHALL complete within 100 milliseconds
5. WHEN multiple Kasir users access the system simultaneously, THE Dana Kasir System SHALL maintain response times within the specified limits

### Requirement 12: Data Integrity and Audit Trail

**User Story:** As an Owner, I want to ensure all cash flow data is accurately tracked with audit information, so that I can maintain accountability.

#### Acceptance Criteria

1. WHEN an expense is created, THE Dana Kasir System SHALL record both the selected Kasir ID (kasirId) and the authenticated user ID (createdBy) who created the entry
2. WHEN an expense is updated, THE Dana Kasir System SHALL record the updated timestamp while preserving the original creation timestamp and createdBy field
3. WHEN an expense is soft deleted, THE Dana Kasir System SHALL record the deletion timestamp while preserving the audit trail
4. WHEN displaying income records, THE Dana Kasir System SHALL show the Kasir name associated with each rental transaction
5. WHEN querying historical data, THE Dana Kasir System SHALL exclude soft-deleted expense records from calculations and displays

---

**Document Version:** 1.0  
**Created:** 2025-01-29  
**Last Updated:** 2025-01-29  
**Status:** Ready for Design Phase  
**Approved By:** Pending Product Owner Review
