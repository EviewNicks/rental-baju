# Requirements Document

## Introduction

Sistem Cost Item Management menggantikan sistem Material yang terbatas dengan solusi yang lebih fleksibel untuk mengelola berbagai jenis biaya produksi. Sistem ini memungkinkan pengelolaan material, transportasi, penjahit, catering, dan biaya lainnya dalam satu interface yang unified.

## Glossary

- **Cost_Item**: Item biaya produksi yang dapat berupa material, transportasi, penjahit, catering, atau biaya lainnya
- **Product_Cost**: Relasi antara produk dan cost item dengan jumlah biaya yang digunakan
- **Modal_Awal**: Total biaya produksi yang dihitung otomatis dari sum semua product costs
- **System**: Aplikasi rental software
- **User**: Pengguna yang mengelola produk dan biaya

## Requirements

### Requirement 1: Cost Item Management

**User Story:** As a user, I want to manage cost items, so that I can track various types of production costs.

#### Acceptance Criteria

1. THE System SHALL provide CRUD operations for cost items
2. WHEN a user creates a cost item, THE System SHALL require only a name field
3. WHEN a user searches cost items, THE System SHALL support case-insensitive name search
4. WHEN displaying cost items, THE System SHALL show pagination with configurable page size
5. WHEN a user deletes a cost item, THE System SHALL prevent deletion if it's used in any product

### Requirement 2: Product Cost Integration

**User Story:** As a user, I want to assign multiple cost items to a product, so that I can calculate accurate production costs.

#### Acceptance Criteria

1. WHEN a user adds cost items to a product, THE System SHALL allow multiple cost items per product
2. WHEN a user inputs cost amount, THE System SHALL accept decimal values for precise costing
3. WHEN cost items are modified, THE System SHALL recalculate modal awal automatically
4. THE System SHALL calculate modal awal as the sum of all product cost amounts
5. WHEN a user removes a cost item from a product, THE System SHALL update modal awal immediately

### Requirement 3: Material System Migration

**User Story:** As a system administrator, I want to migrate from Material system to Cost Item system, so that existing data is preserved.

#### Acceptance Criteria

1. THE System SHALL provide migration from Material model to CostItem model
2. WHEN migrating materials, THE System SHALL preserve material names as cost item names
3. WHEN migration is complete, THE System SHALL remove Material model and related code
4. THE System SHALL ensure no dead functions or duplicate code remains after migration
5. THE System SHALL maintain data integrity during migration process

### Requirement 4: API and Service Layer

**User Story:** As a developer, I want clean API endpoints for cost items, so that the frontend can interact with the system efficiently.

#### Acceptance Criteria

1. THE System SHALL provide RESTful API endpoints for cost item operations
2. WHEN handling API requests, THE System SHALL validate input data using schemas
3. WHEN errors occur, THE System SHALL return appropriate HTTP status codes and error messages
4. THE System SHALL implement proper error handling for business logic violations
5. THE System SHALL use consistent response formats across all endpoints

### Requirement 5: User Interface Components

**User Story:** As a user, I want intuitive UI components for managing cost items, so that I can efficiently manage production costs.

#### Acceptance Criteria

1. THE System SHALL provide a cost item selector component for product forms
2. WHEN selecting cost items, THE System SHALL show available cost items in a searchable dropdown
3. WHEN inputting amounts, THE System SHALL format currency values appropriately
4. THE System SHALL display real-time modal awal calculation as costs are modified
5. THE System SHALL provide add/remove functionality for multiple cost items per product

### Requirement 6: Data Validation and Business Rules

**User Story:** As a system administrator, I want proper validation rules, so that data integrity is maintained.

#### Acceptance Criteria

1. WHEN creating cost items, THE System SHALL validate that names are unique
2. WHEN inputting cost amounts, THE System SHALL validate that amounts are positive numbers
3. WHEN deleting cost items, THE System SHALL check for usage in products before allowing deletion
4. THE System SHALL prevent creation of cost items with empty or whitespace-only names
5. THE System SHALL enforce maximum length limits for cost item names

### Requirement 7: Performance and Code Quality

**User Story:** As a developer, I want maintainable and performant code, so that the system is reliable and easy to extend.

#### Acceptance Criteria

1. THE System SHALL pass TypeScript type checking without errors
2. THE System SHALL pass linting rules without warnings
3. THE System SHALL implement efficient database queries with proper indexing
4. THE System SHALL follow consistent code patterns and naming conventions
5. THE System SHALL include proper error logging and debugging information