# Requirements Document

## Introduction

Role-based Expense Management adalah fitur yang memungkinkan sistem Dana Kasir untuk mengelola pengeluaran berdasarkan role user (Kasir dan Owner) dengan visibility dan permission yang berbeda. Fitur ini memungkinkan Owner untuk menambah pengeluaran yang hanya dapat dilihat oleh Owner, sementara Kasir hanya dapat melihat dan mengelola pengeluaran Kasir saja.

## Glossary

- **System**: Dana Kasir expense management system
- **Kasir_User**: User dengan role 'kasir' di Clerk metadata
- **Owner_User**: User dengan role 'owner' di Clerk metadata
- **Kasir_Expense**: Pengeluaran dengan kasirId != "owner-system" (dibuat oleh regular kasir)
- **Owner_Expense**: Pengeluaran dengan kasirId = "owner-system" (dibuat oleh Owner_User)
- **Owner_Kasir_Account**: Special kasir account dengan id "owner-system" dan nama "Owner"
- **Role_Filter**: Filter dropdown untuk memilih role (Kasir/Owner) di ExpenseList
- **Expense_Form**: Form untuk menambah/edit pengeluaran
- **Summary_Calculation**: Perhitungan totalExpense dan netBalance berdasarkan role

## Requirements

### Requirement 1: Role-based Expense Creation

**User Story:** As a Kasir or Owner, I want to create expenses, so that I can track operational costs based on my role.

#### Acceptance Criteria

1. WHEN a Kasir_User creates an expense, THE System SHALL store it with kasirId from selected kasir and createdBy field containing the user's Clerk ID
2. WHEN an Owner_User creates an expense, THE System SHALL store it with kasirId = "owner-system" and createdBy field containing the user's Clerk ID
3. WHEN creating an expense, THE System SHALL use the same Expense_Form for both roles
4. WHEN displaying the expense form, THE System SHALL show a simple visual indicator of the current user's role
5. THE System SHALL allow both roles to use all existing expense categories (Operasional, Maintenance, Transport, Refund Dana Jaminan, Lainnya)
6. WHEN an Owner_User creates an expense, THE System SHALL automatically select the Owner_Kasir_Account ("owner-system") as the kasir

### Requirement 2: Role-based Expense Visibility

**User Story:** As a user, I want to see expenses based on my role permissions, so that I can view appropriate financial data.

#### Acceptance Criteria

1. WHEN a Kasir_User views the expense list, THE System SHALL display only expenses where kasirId != "owner-system"
2. WHEN an Owner_User views the expense list, THE System SHALL display all expenses including those with kasirId = "owner-system"
3. WHEN no expenses exist for the current user's role, THE System SHALL show appropriate empty state message
4. THE System SHALL maintain existing kasir filter functionality for income data (unchanged)
5. WHEN a Kasir_User applies kasir filter, THE System SHALL filter only within visible Kasir_Expense items (kasirId != "owner-system")

### Requirement 3: Role-based Expense Permissions

**User Story:** As a user, I want to manage expenses based on my role permissions, so that I can maintain appropriate access control.

#### Acceptance Criteria

1. WHEN a Kasir_User attempts to edit an expense, THE System SHALL allow editing only if kasirId != "owner-system" AND createdBy matches the user's Clerk ID
2. WHEN a Kasir_User attempts to delete an expense, THE System SHALL allow deletion only if kasirId != "owner-system" AND createdBy matches the user's Clerk ID
3. WHEN an Owner_User attempts to edit an expense, THE System SHALL allow editing only if kasirId = "owner-system" AND createdBy matches the user's Clerk ID
4. WHEN an Owner_User attempts to delete an expense, THE System SHALL allow deletion only if kasirId = "owner-system" AND createdBy matches the user's Clerk ID
5. THE System SHALL hide edit/delete buttons for expenses that the current user cannot modify

### Requirement 4: Expense Role Filtering

**User Story:** As an Owner, I want to filter expenses by role, so that I can analyze spending patterns by different user types.

#### Acceptance Criteria

1. WHEN an Owner_User views the expense list, THE System SHALL display a Role_Filter dropdown
2. WHEN a Kasir_User views the expense list, THE System SHALL NOT display the Role_Filter dropdown
3. WHEN Owner_User selects "Semua" in Role_Filter, THE System SHALL display all expenses (both kasirId = "owner-system" and kasirId != "owner-system")
4. WHEN Owner_User selects "Kasir" in Role_Filter, THE System SHALL display only expenses where kasirId != "owner-system"
5. WHEN Owner_User selects "Owner" in Role_Filter, THE System SHALL display only expenses where kasirId = "owner-system"
6. THE Role_Filter SHALL be positioned next to the "Tambah" button in the ExpenseList header
7. THE Role_Filter SHALL persist selection when changing dates but reset when changing kasir filter

### Requirement 5: Role-based Summary Calculations

**User Story:** As a user, I want to see financial summaries based on my role visibility, so that I can understand the financial impact relevant to my access level.

#### Acceptance Criteria

1. WHEN a Kasir_User views the summary, THE Summary_Calculation SHALL include only expenses where kasirId != "owner-system" in totalExpense
2. WHEN an Owner_User views the summary, THE Summary_Calculation SHALL include all expenses (including kasirId = "owner-system") in totalExpense
3. WHEN calculating netBalance for Kasir_User, THE System SHALL use formula: totalIncome - (expenses where kasirId != "owner-system")
4. WHEN calculating netBalance for Owner_User, THE System SHALL use formula: totalIncome - (all expenses)
5. THE System SHALL maintain existing income calculation logic (unchanged for both roles)

### Requirement 6: API Role Detection and Filtering

**User Story:** As a system, I want to detect user roles and filter data accordingly, so that I can enforce role-based access control at the API level.

#### Acceptance Criteria

1. WHEN processing API requests, THE System SHALL extract user role from Clerk user metadata
2. WHEN a Kasir_User requests expense data, THE System SHALL return only expenses where kasirId != "owner-system"
3. WHEN an Owner_User requests expense data, THE System SHALL return all expenses regardless of kasirId
4. WHEN API receives userRole parameter, THE System SHALL validate it against the authenticated user's actual role
5. THE System SHALL use existing kasirId field to determine expense visibility and createdBy field for ownership without requiring database schema changes
6. THE System SHALL recognize Owner_Kasir_Account ("owner-system") as a special kasir account for Owner expenses

### Requirement 7: Enhanced ExpenseList UI

**User Story:** As a user, I want an improved expense list interface, so that I can easily manage and filter expenses based on my role.

#### Acceptance Criteria

1. WHEN Owner_User views ExpenseList, THE System SHALL display Role_Filter dropdown between expense count and "Tambah" button
2. WHEN Role_Filter is active, THE System SHALL show visual indicator of current filter selection
3. WHEN expenses are filtered by role, THE System SHALL update the expense count display accordingly
4. THE System SHALL maintain existing expense list functionality (categories, amounts, descriptions, timestamps)
5. THE System SHALL show appropriate loading states during role filter changes

### Requirement 8: Backward Compatibility

**User Story:** As a system administrator, I want the new role-based system to work with existing data, so that current operations are not disrupted.

#### Acceptance Criteria

1. WHEN processing existing expenses without clear role attribution, THE System SHALL handle them gracefully by treating kasirId != "owner-system" as Kasir_Expense
2. THE System SHALL maintain all existing API endpoints and response formats
3. THE System SHALL preserve existing kasir filter functionality for income data
4. WHEN migrating to role-based system, THE System SHALL not require changes to existing PengeluaranKasir database schema
5. THE System SHALL use Clerk user metadata for role detection and existing kasirId field for expense categorization
6. THE System SHALL ensure Owner_Kasir_Account ("owner-system") exists in the kasir table for Owner expense creation