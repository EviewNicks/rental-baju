# Requirements Document

## Introduction

This feature enhances the existing customer (penyewa) management system by adding edit functionality, proper pagination, and improved data display. The enhancement focuses on improving user experience when managing large numbers of customers and providing complete customer information visibility.

## Glossary

- **Penyewa**: Customer who rents products from the system
- **CustomerBiodataStep**: Component used in transaction flow for customer selection
- **CustomerInfoCard**: Component displaying customer information in transaction details
- **Pagination**: System to divide large datasets into manageable pages
- **Modal**: Overlay dialog for user interactions

## Requirements

### Requirement 1

**User Story:** As a kasir, I want to edit existing customer information during transaction creation, so that I can update outdated customer data without leaving the transaction flow.

#### Acceptance Criteria

1. WHEN a kasir clicks edit button on a customer in the list THEN the system SHALL open an edit modal with current customer data
2. WHEN editing customer data THEN the system SHALL disable the name field to prevent accidental changes to customer identity
3. WHEN kasir submits valid updated customer data THEN the system SHALL save changes and refresh the customer list
4. WHEN kasir cancels the edit operation THEN the system SHALL close the modal without saving changes
5. WHEN updating customer phone number THEN the system SHALL validate uniqueness and show error if phone already exists

### Requirement 2

**User Story:** As a kasir, I want to navigate through customer pages efficiently, so that I can find specific customers when there are many registered customers.

#### Acceptance Criteria

1. WHEN the customer list contains more than 20 customers THEN the system SHALL display pagination controls
2. WHEN kasir clicks next page button THEN the system SHALL load the next 20 customers
3. WHEN kasir clicks previous page button THEN the system SHALL load the previous 20 customers
4. WHEN displaying pagination THEN the system SHALL show current page number and total pages
5. WHEN search is active THEN the system SHALL paginate search results with the same 20-item limit

### Requirement 3

**User Story:** As a kasir, I want to see complete customer information in transaction details, so that I can verify customer identity and contact information.

#### Acceptance Criteria

1. WHEN viewing customer info card THEN the system SHALL display customer name, phone, email, address, and NIK
2. WHEN customer has no email THEN the system SHALL hide the email field
3. WHEN customer has no NIK THEN the system SHALL hide the NIK field
4. WHEN kasir clicks edit button on customer info card THEN the system SHALL open edit modal
5. WHEN customer data is updated THEN the system SHALL refresh the customer info card display

### Requirement 4

**User Story:** As a kasir, I want to edit customer information from the transaction detail page, so that I can correct customer data while viewing transaction history.

#### Acceptance Criteria

1. WHEN viewing customer info card THEN the system SHALL display an edit button
2. WHEN kasir clicks edit button THEN the system SHALL open customer edit modal
3. WHEN editing from transaction detail THEN the system SHALL disable name field to maintain transaction integrity
4. WHEN customer data is successfully updated THEN the system SHALL update the displayed customer information
5. WHEN edit operation fails THEN the system SHALL display appropriate error message

### Requirement 5

**User Story:** As a system administrator, I want customer data validation during updates, so that data integrity is maintained across the system.

#### Acceptance Criteria

1. WHEN updating customer phone number THEN the system SHALL validate phone number format
2. WHEN updating customer email THEN the system SHALL validate email format if provided
3. WHEN updating customer NIK THEN the system SHALL validate NIK format if provided
4. WHEN phone number already exists for different customer THEN the system SHALL prevent update and show error
5. WHEN validation fails THEN the system SHALL display specific field error messages