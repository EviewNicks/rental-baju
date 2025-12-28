# Requirements Document

## Introduction

Sistem pairing jas dengan sarung untuk rental pakaian tradisional yang memungkinkan pelanggan menyewa jas dengan sarung gratis sebagai paket lengkap. Fitur ini meningkatkan nilai tambah layanan rental dengan memberikan aksesoris pelengkap tanpa biaya tambahan.

## Glossary

- **Jas_Product**: Produk kategori jas (jas-jaguar, jas-polos, jas-premium, jas-renda)
- **Sarung_Product**: Produk kategori sarung dengan tipe accessories_age_based
- **Pairing_Modal**: Modal untuk memilih sarung yang akan dipasangkan dengan jas
- **Linked_Sarung**: Sarung yang dipasangkan dengan jas dalam satu transaksi
- **Free_Sarung**: Sarung yang tidak dikenakan biaya saat dipasangkan dengan jas
- **Receipt_Service**: Service untuk generate receipt dengan format kolom yang diperluas

## Requirements

### Requirement 1: Jas Product Detection

**User Story:** As a kasir, I want the system to automatically detect jas products, so that I can offer sarung pairing options.

#### Acceptance Criteria

1. WHEN a product with category name containing "jas-" is displayed, THE System SHALL identify it as a Jas_Product
2. WHEN a Jas_Product is selected for cart addition, THE System SHALL trigger the sarung pairing workflow
3. THE System SHALL support all jas categories: jas-jaguar, jas-polos, jas-premium, jas-renda
4. WHEN a non-jas product is selected, THE System SHALL proceed with normal cart addition without pairing options

### Requirement 2: Sarung Selection Modal

**User Story:** As a kasir, I want to select sarung for jas products through a modal interface, so that I can complete the pairing efficiently.

#### Acceptance Criteria

1. WHEN a Jas_Product is added to cart, THE Pairing_Modal SHALL display before cart addition
2. THE Pairing_Modal SHALL display all available sarung products with category "sarung"
3. THE Pairing_Modal SHALL show sarung stock availability and product details
4. THE Pairing_Modal SHALL provide "Tanpa Sarung" option for jas without pairing
5. WHEN sarung stock is zero, THE System SHALL disable that sarung option but keep others available
6. THE Pairing_Modal SHALL allow quantity selection up to the jas quantity being added
7. WHEN user confirms selection, THE System SHALL add both jas and linked sarung to cart
8. THE Pairing_Modal SHALL support quantity distribution for multiple sarung types
9. WHEN multiple jas are selected, THE System SHALL allow user to distribute sarung quantities across different sarung products
10. THE Pairing_Modal SHALL show distribution preview indicating how many jas get sarung vs tanpa sarung
11. WHEN total sarung quantity is less than jas quantity, THE System SHALL automatically assign remaining jas as "tanpa sarung"

### Requirement 3: Free Sarung Pricing

**User Story:** As a kasir, I want sarung to be free when paired with jas, so that customers get added value without extra cost.

#### Acceptance Criteria

1. WHEN a sarung is linked to a jas, THE System SHALL set sarung price to zero in calculations
2. THE System SHALL maintain original sarung inventory reduction for stock management
3. WHEN calculating transaction totals, THE System SHALL exclude linked sarung prices
4. THE System SHALL display sarung as "GRATIS" in cart and payment summary
5. WHEN sarung is rented separately (not linked), THE System SHALL charge normal price

### Requirement 4: Cart Display Enhancement

**User Story:** As a kasir, I want to see jas-sarung pairings clearly in the cart, so that I can verify selections before checkout.

#### Acceptance Criteria

1. WHEN jas with linked sarung is in cart, THE System SHALL display pairing relationship visually
2. THE Cart SHALL show jas name with "+ Sarung [Name]" indicator
3. THE Cart SHALL display sarung as "GRATIS" with original price crossed out
4. WHEN removing jas from cart, THE System SHALL also remove its linked sarung
5. THE Cart SHALL allow separate quantity adjustment for jas and linked sarung

### Requirement 5: Payment Summary Integration

**User Story:** As a kasir, I want payment summary to show jas-sarung pairings clearly, so that customers understand what they're getting.

#### Acceptance Criteria

1. THE Payment_Summary SHALL display jas and linked sarung as separate line items
2. THE Payment_Summary SHALL show sarung price as "GRATIS" with visual indication
3. THE Payment_Summary SHALL exclude sarung prices from subtotal calculation
4. THE Payment_Summary SHALL include pairing indicators (e.g., "→ dengan Sarung")
5. WHEN calculating final total, THE System SHALL only include jas prices, not linked sarung prices

### Requirement 6: Professional Receipt Enhancement

**User Story:** As a business owner, I want receipts to show jas-sarung pairings with proper formatting, so that customers have clear documentation.

#### Acceptance Criteria

1. THE Receipt_Service SHALL add "Kode Sarung" column to receipt table format
2. WHEN printing jas with linked sarung, THE Receipt SHALL show both product codes in respective columns
3. WHEN printing non-jas products, THE Receipt SHALL display "-" in "Kode Sarung" column
4. THE Receipt SHALL maintain existing table structure with additional sarung code column
5. THE Receipt SHALL show sarung quantity matching jas quantity in the pairing

### Requirement 7: Inventory Management Integration

**User Story:** As a inventory manager, I want sarung stock to be properly managed even when given for free, so that inventory remains accurate.

#### Acceptance Criteria

1. WHEN sarung is linked to jas, THE System SHALL reduce sarung inventory by selected quantity
2. THE System SHALL treat linked sarung as regular inventory items for stock tracking
3. WHEN transaction is created, THE System SHALL record both jas and sarung in transaction items
4. THE System SHALL allow separate return processing for jas and linked sarung
5. WHEN sarung is returned, THE System SHALL restore sarung inventory appropriately

### Requirement 8: Data Structure Extension

**User Story:** As a developer, I want minimal schema changes to support jas-sarung pairing, so that existing functionality remains stable.

#### Acceptance Criteria

1. THE System SHALL extend ProductSelection interface to include linkedSarung field
2. THE linkedSarung field SHALL contain productId, productSizeId, and quantity
3. THE System SHALL maintain backward compatibility with existing cart functionality
4. THE System SHALL use existing transaction item structure for both jas and sarung
5. WHEN storing pairing data, THE System SHALL use JSON field or existing flexible structure

### Requirement 9: Error Handling and Validation

**User Story:** As a kasir, I want proper error handling for sarung selection, so that I can resolve issues quickly.

#### Acceptance Criteria

1. WHEN selected sarung becomes unavailable during selection, THE System SHALL show error message and refresh options
2. WHEN sarung quantity exceeds available stock, THE System SHALL prevent selection and show available quantity
3. THE System SHALL validate sarung category before allowing pairing
4. WHEN pairing modal fails to load, THE System SHALL allow jas addition without sarung
5. THE System SHALL provide clear error messages for all pairing-related failures

### Requirement 10: Code Quality and Maintenance

**User Story:** As a developer, I want clean, maintainable code for the pairing feature, so that future modifications are easy.

#### Acceptance Criteria

1. THE System SHALL pass yarn lint checks without warnings for all new code
2. THE System SHALL pass yarn type-check validation for TypeScript compliance
3. THE System SHALL avoid code duplication by reusing existing components where possible
4. THE System SHALL remove any dead code or unused functions introduced during development
5. THE System SHALL follow existing code patterns and architectural decisions