# Requirements Document

## Introduction

This feature migrates the kasir (cashier) information source from Clerk API to the database Kasir table for transaction detail pages. Currently, the system fetches kasir information from Clerk's user management API, which creates unnecessary external API dependencies and inconsistent data representation. This migration will improve performance, reduce external dependencies, and provide consistent kasir information across the application.

## Glossary

- **Kasir**: A cashier user who processes rental transactions in the system
- **Transaksi**: A rental transaction record containing customer, product, and payment information
- **Clerk API**: External authentication and user management service currently used for kasir information
- **Database Kasir Table**: Internal database table storing kasir information with fields: id, nama, isActive, createdAt, updatedAt, createdBy
- **Transaction Detail API**: API endpoint `/api/kasir/transaksi/[kode]` that returns full transaction information
- **KasirInfoCard**: Frontend component that displays kasir information on transaction detail pages
- **enrichTransactionWithKasirInfo**: Function in API route that adds kasir information to transaction response

## Requirements

### Requirement 1

**User Story:** As a kasir user, I want to see accurate cashier information on transaction detail pages, so that I can verify who processed each transaction.

#### Acceptance Criteria

1. WHEN the system retrieves transaction details THEN the system SHALL fetch kasir information from the database Kasir table using the kasirId foreign key
2. WHEN a transaction has an assigned kasir THEN the system SHALL return kasir data including id, nama, isActive, createdAt, and updatedAt fields
3. WHEN a transaction has no assigned kasir THEN the system SHALL return null for the kasir field without causing errors
4. WHEN the database query for kasir information fails THEN the system SHALL log the error and return null for kasir field with graceful degradation
5. WHEN the API response includes kasir information THEN the system SHALL format the response to match the KasirInfo interface specification

### Requirement 2

**User Story:** As a system administrator, I want the application to use internal database for kasir information, so that we reduce external API dependencies and improve performance.

#### Acceptance Criteria

1. WHEN the Transaction Detail API processes a request THEN the system SHALL NOT call Clerk API for kasir information
2. WHEN the system fetches transaction data THEN the system SHALL include kasir relation in the Prisma query using the include clause
3. WHEN the database returns kasir data THEN the system SHALL transform it to match the frontend KasirInfo interface without additional API calls
4. WHEN measuring API response time THEN the system SHALL complete transaction detail requests at least 200ms faster than the previous Clerk-based implementation
5. WHEN the system encounters a database connection error THEN the system SHALL return appropriate error response without attempting Clerk API fallback

### Requirement 3

**User Story:** As a developer, I want consistent kasir data structure across the application, so that frontend components can reliably display kasir information.

#### Acceptance Criteria

1. WHEN the API returns kasir information THEN the system SHALL use the KasirInfo interface structure with fields: id, nama, isActive, createdAt, updatedAt
2. WHEN the frontend receives kasir data THEN the system SHALL NOT require data transformation or mapping for display in KasirInfoCard component
3. WHEN comparing API response format with TypeScript interfaces THEN the system SHALL maintain 100% type compatibility between backend response and frontend types
4. WHEN the system processes legacy transactions with Clerk user IDs THEN the system SHALL handle the migration gracefully by returning null for kasir field if no matching Kasir record exists
5. WHEN the API documentation is updated THEN the system SHALL reflect the new kasir data structure in all API response examples

### Requirement 4

**User Story:** As a quality assurance engineer, I want comprehensive error handling for kasir information retrieval, so that the system remains stable when kasir data is missing or invalid.

#### Acceptance Criteria

1. WHEN a transaction references a non-existent kasirId THEN the system SHALL return null for kasir field and log a warning without throwing an error
2. WHEN the Prisma include query for kasir fails THEN the system SHALL catch the error and return the transaction data with kasir set to null
3. WHEN the system encounters a database constraint violation related to kasir THEN the system SHALL return a 500 error with descriptive message
4. WHEN the frontend receives null kasir data THEN the KasirInfoCard component SHALL display "Tidak Ada Data" message without breaking the UI
5. WHEN error logs are reviewed THEN the system SHALL include transaction code, kasirId, and error details for debugging purposes

### Requirement 5

**User Story:** As a system architect, I want to remove the enrichTransactionWithKasirInfo function that calls Clerk API, so that the codebase is cleaner and more maintainable.

#### Acceptance Criteria

1. WHEN the API route code is refactored THEN the system SHALL remove the enrichTransactionWithKasirInfo function completely
2. WHEN the API route processes GET requests THEN the system SHALL NOT import or use clerkClient from @clerk/nextjs/server for kasir information
3. WHEN the formatTransactionResponse utility is called THEN the system SHALL include kasir data directly from the Prisma query result
4. WHEN code review is performed THEN the system SHALL have zero references to Clerk API for kasir information retrieval in transaction-related code
5. WHEN the refactored code is deployed THEN the system SHALL maintain backward compatibility with existing frontend components expecting KasirInfo structure
