# Requirements Document

## Introduction

Sistem product history saat ini (`/api/products/[id]/history`) menampilkan data transaksi dasar dari `TransaksiItem` tetapi belum menampilkan:
1. **Activity timeline** dari tabel `AktivitasTransaksi` (pembuatan, status changes, pembatalan, pengembalian)
2. **ProductSize information** (size, ageCategory) yang tersimpan dalam field `kondisiAwal` di `TransaksiItem`

Sistem transaksi (`TransaksiService`) sudah mencatat aktivitas lengkap dan menyimpan informasi size dalam format: `"productSizeId|size|ageCategory|condition"`. Integrasi ini akan memperkaya product history dengan activity timeline dan informasi size yang lebih detail.

## Glossary

- **Product History**: Riwayat penyewaan produk yang menampilkan semua transaksi dan aktivitas terkait produk tertentu
- **Transaction Activity**: Aktivitas yang tercatat dalam tabel `AktivitasTransaksi` seperti pembuatan transaksi, perubahan status, pembatalan, dan pengembalian
- **TransaksiService**: Service layer yang mengelola operasi CRUD transaksi dan mencatat aktivitas ke tabel `AktivitasTransaksi`
- **ProductHistoryService**: Service layer yang mengelola query dan transformasi data riwayat produk
- **Activity Timeline**: Urutan kronologis aktivitas transaksi yang ditampilkan dalam product history
- **Role-Based Masking**: Penyembunyian data sensitif pelanggan berdasarkan role pengguna (owner, kasir, producer)
- **Activity Metadata**: Data tambahan yang tersimpan dalam field JSON `data` pada tabel `AktivitasTransaksi`
- **ProductSize Information**: Informasi ukuran produk (size, ageCategory) yang tersimpan dalam format `"productSizeId|size|ageCategory|condition"` di field `kondisiAwal`
- **kondisiAwal**: Field di `TransaksiItem` yang menyimpan informasi size dalam format pipe-separated: `productSizeId|size|ageCategory|condition`

## Requirements

### Requirement 1

**User Story:** As a product manager (producer role), I want to see a comprehensive activity timeline for each product rental, so that I can track the complete lifecycle of product usage without accessing sensitive customer information.

#### Acceptance Criteria

1. WHEN a producer views product history THEN the system SHALL display all transaction activities including creation, pickup, return, and status changes
2. WHEN displaying activity timeline THEN the system SHALL mask customer names and contact information according to producer role permissions
3. WHEN showing activity details THEN the system SHALL include activity type, description, timestamp, and relevant metadata
4. WHEN multiple activities exist for a transaction THEN the system SHALL order them chronologically by creation date
5. WHEN activity metadata contains sensitive information THEN the system SHALL filter out customer-identifiable data for producer role

### Requirement 2

**User Story:** As a kasir, I want to view detailed product rental history with partial customer information, so that I can assist customers and track product usage patterns while respecting privacy boundaries.

#### Acceptance Criteria

1. WHEN a kasir views product history THEN the system SHALL display transaction activities with masked customer data
2. WHEN showing transaction details THEN the system SHALL include kasir assignment information if available
3. WHEN displaying activity timeline THEN the system SHALL show pickup and return activities with quantity details
4. WHEN activity involves payment THEN the system SHALL display payment method and amount without full customer details
5. WHEN transaction is cancelled THEN the system SHALL show cancellation reason and stock restoration status

### Requirement 3

**User Story:** As an owner, I want to access complete product rental history with full customer details and activity metadata, so that I can perform comprehensive business analysis and customer relationship management.

#### Acceptance Criteria

1. WHEN an owner views product history THEN the system SHALL display all activities with unmasked customer information
2. WHEN showing activity metadata THEN the system SHALL include all available details such as item counts, amounts, and system performance metrics
3. WHEN displaying transaction activities THEN the system SHALL show kasir assignments and user actions
4. WHEN activity involves penalties THEN the system SHALL display detailed penalty calculations and conditions
5. WHEN transaction has multiple status changes THEN the system SHALL show complete transition history with reasons

### Requirement 4

**User Story:** As a system administrator, I want the product history query to efficiently join transaction and activity data, so that the system maintains good performance even with large datasets.

#### Acceptance Criteria

1. WHEN querying product history THEN the system SHALL use existing database indexes for optimal performance
2. WHEN fetching activity data THEN the system SHALL minimize database queries through efficient joins
3. WHEN transforming activity metadata THEN the system SHALL parse JSON data only when needed
4. WHEN paginating results THEN the system SHALL apply pagination at the database level before transformation
5. WHEN sorting by activity date THEN the system SHALL leverage indexed timestamp fields

### Requirement 5

**User Story:** As a developer, I want the activity integration to maintain backward compatibility with existing product history API, so that current frontend implementations continue to work without breaking changes.

#### Acceptance Criteria

1. WHEN the API response structure changes THEN the system SHALL maintain existing fields for backward compatibility
2. WHEN adding new activity fields THEN the system SHALL include them as optional extensions to the current schema
3. WHEN activity data is unavailable THEN the system SHALL gracefully degrade to showing basic transaction information
4. WHEN transforming activity types THEN the system SHALL map them to user-friendly display labels
5. WHEN handling legacy transactions without activities THEN the system SHALL generate synthetic activity entries from transaction data

### Requirement 6

**User Story:** As a quality assurance engineer, I want comprehensive activity logging for all transaction operations, so that I can trace system behavior and debug issues effectively.

#### Acceptance Criteria

1. WHEN a transaction is created THEN the system SHALL log activity with transaction code, items count, total amount, and kasir assignment
2. WHEN transaction status changes THEN the system SHALL log activity with previous status, new status, and change reason
3. WHEN transaction is cancelled THEN the system SHALL log activity with cancellation reason, refund status, and stock restoration details
4. WHEN items are picked up THEN the system SHALL log activity with pickup quantities and product size information
5. WHEN items are returned THEN the system SHALL log activity with return conditions, penalties, and stock updates

### Requirement 7

**User Story:** As a product manager, I want to see product size information (size and age category) in the rental history, so that I can track which sizes are most frequently rented and plan inventory accordingly.

#### Acceptance Criteria

1. WHEN displaying transaction items THEN the system SHALL parse size information from the `kondisiAwal` field
2. WHEN `kondisiAwal` contains size data THEN the system SHALL extract productSizeId, size, ageCategory, and condition
3. WHEN size information is available THEN the system SHALL display it in the timeline item (e.g., "Size: M (ADULT)")
4. WHEN `kondisiAwal` format is invalid THEN the system SHALL gracefully handle parsing errors and show "Size: Unknown"
5. WHEN multiple items have different sizes THEN the system SHALL display size information for each item separately

### Requirement 8

**User Story:** As a frontend developer, I want activity data and size information to be display-ready, so that I can render the timeline without additional client-side processing.

#### Acceptance Criteria

1. WHEN returning activity data THEN the system SHALL include human-readable activity type labels in Indonesian
2. WHEN formatting timestamps THEN the system SHALL provide ISO 8601 formatted dates for consistent parsing
3. WHEN including size information THEN the system SHALL provide parsed size and ageCategory as separate fields
4. WHEN showing monetary values THEN the system SHALL format amounts as numbers without Decimal type complexity
5. WHEN displaying activity descriptions THEN the system SHALL provide pre-formatted text ready for UI rendering

### Requirement 9

**User Story:** As a user viewing product history in ProductHistoryCard, I want to see activity timeline and size information in each timeline item, so that I can understand the complete rental lifecycle with size details.

#### Acceptance Criteria

1. WHEN ProductHistoryCard renders timeline items THEN the system SHALL display activity information alongside transaction data
2. WHEN a timeline item shows rental details THEN the system SHALL include size information (e.g., "Size: M (ADULT)")
3. WHEN multiple activities exist for a transaction THEN the system SHALL show the most relevant activity in the timeline item
4. WHEN activity metadata contains important details THEN the system SHALL display them in a user-friendly format
5. WHEN size information is missing or invalid THEN the system SHALL gracefully hide the size display without breaking the UI
