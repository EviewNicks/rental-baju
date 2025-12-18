# Database Real Data Migration Requirements

## Introduction

This specification outlines the requirements for migrating the rental software database from development/test data to production-ready real data. The migration involves cleaning existing data and importing real product data from CSV files, product images, and creating initial kasir (cashier) accounts.

## Glossary

- **Database Migration**: Process of replacing existing database content with real production data
- **CSV Data**: Product and category data stored in comma-separated value files
- **Product Images**: Physical image files for products stored in the file system
- **Kasir**: Cashier users who operate the rental system
- **Import Scripts**: Automated scripts that read data files and populate the database
- **Production Environment**: Live system environment with real business data

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want to clean and migrate the database with real data, so that the system is ready for production use with accurate product information.

#### Acceptance Criteria

1. WHEN the migration process starts, THE system SHALL remove all existing test data from the database
2. WHEN cleaning is complete, THE system SHALL import categories from the prepared JSON files
3. WHEN categories are imported, THE system SHALL import products with their associated images from CSV and image files
4. WHEN product import is complete, THE system SHALL create initial kasir accounts for Ina, Naya, and Tiara
5. WHEN all imports are finished, THE system SHALL validate data integrity and provide a summary report

### Requirement 2

**User Story:** As a business owner, I want the product data to include real images and accurate information, so that the rental system displays correct product details to customers.

#### Acceptance Criteria

1. WHEN importing products, THE system SHALL read product data from CSV files located in `public/CSV/`
2. WHEN processing product images, THE system SHALL upload images from `public/products/` to the configured storage system
3. WHEN a product image is missing, THE system SHALL use a default placeholder image
4. WHEN image upload fails, THE system SHALL log the error and continue with default image
5. WHEN products are imported, THE system SHALL maintain proper relationships between products, categories, and sizes

### Requirement 3

**User Story:** As a system administrator, I want automated scripts to handle the migration process, so that I can execute the migration reliably and consistently.

#### Acceptance Criteria

1. WHEN executing migration scripts, THE system SHALL provide clear progress indicators and logging
2. WHEN running in dry-run mode, THE system SHALL validate data without making database changes
3. WHEN errors occur during import, THE system SHALL log detailed error information and continue processing
4. WHEN migration is complete, THE system SHALL provide a comprehensive summary of imported records
5. WHEN using package.json shortcuts, THE system SHALL execute the correct import sequence

### Requirement 4

**User Story:** As a kasir user, I want my account to be pre-created during migration, so that I can immediately start using the system after deployment.

#### Acceptance Criteria

1. WHEN creating kasir accounts, THE system SHALL create accounts for Ina, Naya, and Tiara
2. WHEN kasir accounts are created, THE system SHALL set them as active by default
3. WHEN kasir creation fails, THE system SHALL log the error and continue with remaining accounts
4. WHEN kasir accounts exist, THE system SHALL skip duplicate creation
5. WHEN kasir import is complete, THE system SHALL verify all three accounts are properly created

### Requirement 5

**User Story:** As a developer, I want the migration process to be safe and reversible, so that I can recover from any issues during the migration.

#### Acceptance Criteria

1. WHEN starting migration, THE system SHALL create a backup of existing data structure
2. WHEN validation fails, THE system SHALL halt the process and provide clear error messages
3. WHEN running multiple times, THE system SHALL handle duplicate data gracefully
4. WHEN errors occur, THE system SHALL provide rollback instructions or automated recovery
5. WHEN migration completes, THE system SHALL verify database integrity and constraints