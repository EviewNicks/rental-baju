# Requirements Document: Transaction Enhancements

## Introduction

This specification defines enhancements to the transaction system in the Kasir feature, focusing on three key improvements: discount system, flexible rental duration packages, and accurate date calculations. These enhancements will provide more flexibility for cashiers in managing rental transactions while maintaining system integrity and user experience.

## Glossary

- **Transaction**: A rental transaction record containing customer, products, dates, and payment information
- **Discount**: A reduction in the total transaction amount, applied as either percentage or nominal value
- **Duration Package**: A predefined rental period (4 days or 7 days) with associated pricing rules
- **Pickup Date**: The date when customer collects rented items
- **Return Date**: The calculated date when items should be returned
- **Subtotal**: Total amount before discount is applied
- **Final Total**: Total amount after discount is applied

## Requirements

### Requirement 1: Discount System

**User Story:** As a kasir, I want to apply discounts to transactions, so that I can provide promotional pricing or special offers to customers.

#### Acceptance Criteria

1. WHEN a kasir enters a discount value, THE System SHALL validate the discount type (percent or nominal)
2. WHEN a percent discount is applied, THE System SHALL calculate discount as (subtotal × percent / 100)
3. WHEN a nominal discount is applied, THE System SHALL subtract the nominal value from subtotal
4. WHEN discount is applied, THE System SHALL display both subtotal and final total clearly
5. THE System SHALL prevent negative final totals (discount cannot exceed subtotal)
6. WHEN transaction is created, THE System SHALL store discount type and value in database
7. WHEN transaction details are viewed, THE System SHALL display discount information

### Requirement 2: Flexible Duration Packages

**User Story:** As a kasir, I want to select between 4-day and 7-day rental packages, so that I can accommodate both local and out-of-area customers.

#### Acceptance Criteria

1. THE System SHALL provide two duration package options: 4 days and 7 days
2. WHEN 4-day package is selected, THE System SHALL use base product price
3. WHEN 7-day package is selected, THE System SHALL calculate price as (base price × 1.5)
4. THE System SHALL display selected duration package clearly in the form
5. WHEN duration is changed, THE System SHALL recalculate all product prices automatically
6. WHEN duration is changed, THE System SHALL recalculate return date automatically
7. THE System SHALL store selected duration in transaction record

### Requirement 3: Accurate Date Calculation

**User Story:** As a kasir, I want the system to calculate return dates accurately, so that customers know exactly when to return items.

#### Acceptance Criteria

1. WHEN pickup date is selected, THE System SHALL calculate return date as (pickup date + duration - 1)
2. WHEN 4-day package is selected with pickup date 27, THE System SHALL set return date to 30
3. WHEN 7-day package is selected with pickup date 27, THE System SHALL set return date to 2 (next month)
4. THE System SHALL handle month boundaries correctly in date calculations
5. THE System SHALL update return date automatically when pickup date changes
6. THE System SHALL update return date automatically when duration package changes
7. THE System SHALL display both pickup and return dates clearly to the user

### Requirement 4: Price Calculation with Duration and Discount

**User Story:** As a kasir, I want the system to calculate prices correctly with duration multipliers and discounts, so that customers are charged accurately.

#### Acceptance Criteria

1. THE System SHALL calculate item price as (base price × duration multiplier × quantity)
2. THE System SHALL calculate subtotal as sum of all item prices
3. WHEN discount is applied, THE System SHALL calculate final total as (subtotal - discount amount)
4. THE System SHALL display price breakdown showing: items, subtotal, discount, and final total
5. THE System SHALL recalculate all prices when duration package changes
6. THE System SHALL recalculate final total when discount changes
7. THE System SHALL validate that final total is not negative

### Requirement 5: Database Schema Updates

**User Story:** As a system, I need to store discount information, so that transaction records are complete and accurate.

#### Acceptance Criteria

1. THE System SHALL add discountType field to Transaksi table (enum: 'percent' | 'nominal' | null)
2. THE System SHALL add discountValue field to Transaksi table (Decimal, nullable)
3. WHEN transaction is created with discount, THE System SHALL store discount type and value
4. WHEN transaction is retrieved, THE System SHALL include discount information
5. THE System SHALL maintain backward compatibility with existing transactions (null discount values)
6. THE System SHALL use existing TransaksiItem.durasi field for duration information
7. THE System SHALL calculate transaction dates based on selected duration package

### Requirement 6: UI/UX Enhancements

**User Story:** As a kasir, I want a clear and intuitive interface for applying discounts and selecting duration, so that I can process transactions efficiently.

#### Acceptance Criteria

1. THE System SHALL display duration selector using radio buttons before date selection
2. THE System SHALL display discount input section before Notes section
3. WHEN discount type is selected, THE System SHALL show appropriate input field (percent or nominal)
4. THE System SHALL provide visual feedback when discount is applied (show savings)
5. THE System SHALL display price breakdown clearly in payment summary
6. THE System SHALL show duration multiplier effect on product prices
7. THE System SHALL update all calculations in real-time as user makes changes

### Requirement 7: Validation and Error Handling

**User Story:** As a system, I need to validate discount and duration inputs, so that data integrity is maintained.

#### Acceptance Criteria

1. WHEN percent discount is entered, THE System SHALL validate it is between 0 and 100
2. WHEN nominal discount is entered, THE System SHALL validate it does not exceed subtotal
3. THE System SHALL prevent submission if discount causes negative total
4. THE System SHALL validate duration selection is either 4 or 7 days
5. THE System SHALL display clear error messages for invalid inputs
6. THE System SHALL validate all fields before transaction creation
7. THE System SHALL handle edge cases (leap years, month boundaries) in date calculations

### Requirement 8: API and Service Layer Updates

**User Story:** As a system, I need to process discount and duration data through all layers, so that the feature works end-to-end.

#### Acceptance Criteria

1. THE System SHALL update validation schemas to include discount and duration fields
2. THE System SHALL update TransaksiService to handle discount calculations
3. THE System SHALL update API routes to accept and return discount information
4. THE System SHALL update serializers to include discount and duration in responses
5. THE System SHALL update form hooks to manage discount and duration state
6. THE System SHALL update price calculation utilities to handle duration multipliers
7. THE System SHALL maintain backward compatibility with existing API contracts

### Requirement 9: Transaction Detail Display

**User Story:** As a kasir, I want to see discount and duration information in transaction details, so that I can verify transaction accuracy.

#### Acceptance Criteria

1. WHEN viewing transaction details, THE System SHALL display selected duration package
2. WHEN transaction has discount, THE System SHALL display discount type and value
3. THE System SHALL display original subtotal and final total separately
4. THE System SHALL show discount savings amount clearly
5. THE System SHALL display duration-adjusted prices for each item
6. THE System SHALL show pickup and return dates with duration label
7. THE System SHALL format all monetary values consistently

