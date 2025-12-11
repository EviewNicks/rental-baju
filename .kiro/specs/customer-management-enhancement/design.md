# Design Document

## Overview

This design enhances the existing customer (penyewa) management system by adding comprehensive edit functionality, proper pagination support, and improved data display. The enhancement builds upon the existing API infrastructure while adding new UI components and improving user experience for managing large customer datasets.

## Architecture

The enhancement follows the existing kasir feature architecture:

```
UI Components (React)
├── CustomerBiodataStep (Enhanced)
├── CustomerInfoCard (Enhanced)  
├── CustomerEditModal (New)
└── PaginationControls (New)

Hooks Layer (React Query)
├── usePenyewaList (Enhanced)
├── useUpdatePenyewa (New)
└── usePenyewaSearch (Enhanced)

API Layer (Existing)
├── GET /api/kasir/penyewa
├── PUT /api/kasir/penyewa/[id]
└── GET /api/kasir/penyewa/[id]

Service Layer (Existing)
└── PenyewaService
```

## Components and Interfaces

### 1. CustomerEditModal (New Component)

A reusable modal component for editing customer information:

```typescript
interface CustomerEditModalProps {
  isOpen: boolean
  customer: Customer | null
  onClose: () => void
  onCustomerUpdated: (customer: Customer) => void
  disableNameField?: boolean
}
```

**Key Features:**
- Pre-fills form with existing customer data
- Disables name field when `disableNameField` is true
- Validates phone number uniqueness
- Handles form submission and error states
- Uses existing validation schemas

### 2. PaginationControls (New Component)

Pagination component for customer lists:

```typescript
interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
  showPageInfo?: boolean
}
```

**Key Features:**
- Previous/Next navigation buttons
- Page number display (e.g., "Page 1 of 5")
- Disabled states during loading
- Responsive design for mobile

### 3. Enhanced CustomerBiodataStep

**New Features:**
- Edit button for each customer in the list
- Pagination controls when > 20 customers
- Enhanced customer display with more fields
- Edit modal integration

**Updated Interface:**
```typescript
interface CustomerBiodataStepProps {
  selectedCustomer?: Customer
  onSelectCustomer: (customer: Customer) => void
  onNext: () => void
  onPrev: () => void
  canProceed: boolean
  // New props
  enableEdit?: boolean
  pageSize?: number
}
```

### 4. Enhanced CustomerInfoCard

**New Features:**
- Display all customer fields (name, phone, email, address, NIK)
- Conditional field rendering (hide empty email/NIK)
- Edit button with modal integration
- Improved layout and styling

**Updated Interface:**
```typescript
interface CustomerInfoCardProps {
  customer: Customer
  'data-testid'?: string
  // New props
  enableEdit?: boolean
  onCustomerUpdated?: (customer: Customer) => void
}
```

## Data Models

### Enhanced Customer Interface

Based on the Prisma schema, the Customer interface is updated to match database fields:

```typescript
interface Customer {
  id: string
  name: string        // maps to 'nama'
  phone: string       // maps to 'telepon'
  email?: string      // optional field
  address: string     // maps to 'alamat'
  identityNumber?: string // maps to 'nik'
  createdAt: string
  totalTransactions?: number
  recentTransactions?: RecentTransaction[]
  // Removed: foto, catatan (as requested)
}
```

### Pagination Interface

```typescript
interface PaginationState {
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After reviewing all properties identified in the prework, I found several redundant properties that can be consolidated:

**Redundancies Identified:**
- Properties 1.2, 4.3 both test name field disabled state → Combined into Property 2
- Properties 1.5, 5.4 both test phone uniqueness validation → Combined into Property 8  
- Properties 3.4, 4.2 both test edit button opening modal → Combined into Property 5
- Properties 3.5, 4.4 both test UI refresh after update → Combined into Property 6
- Properties 5.1, 5.2, 5.3, 5.5 all test validation → Combined into Property 9

**Property 1: Edit Modal Opens with Correct Data**
*For any* customer in the customer list, clicking the edit button should open a modal pre-filled with that customer's current data
**Validates: Requirements 1.1**

**Property 2: Name Field Disabled in Edit Mode**
*For any* customer edit modal, the name field should be disabled to prevent accidental identity changes
**Validates: Requirements 1.2, 4.3**

**Property 3: Edit Form Submission Updates Data**
*For any* valid customer data changes, submitting the edit form should save the changes and refresh the customer list
**Validates: Requirements 1.3**

**Property 4: Cancel Operation Preserves Original Data**
*For any* edit operation, clicking cancel should close the modal without saving any changes made
**Validates: Requirements 1.4**

**Property 5: Edit Button Opens Modal**
*For any* customer info card or customer list item, clicking the edit button should open the customer edit modal
**Validates: Requirements 3.4, 4.1, 4.2**

**Property 6: UI Refreshes After Update**
*For any* successful customer data update, the displayed customer information should immediately reflect the changes
**Validates: Requirements 3.5, 4.4**

**Property 7: Pagination Controls Appear When Needed**
*For any* customer list with more than 20 items, pagination controls should be displayed
**Validates: Requirements 2.1**

**Property 8: Phone Number Uniqueness Validation**
*For any* customer update with a phone number that already exists for a different customer, the system should prevent the update and display an error
**Validates: Requirements 1.5, 5.4**

**Property 9: Form Validation Displays Field-Specific Errors**
*For any* invalid customer data submission, the system should display specific error messages for each invalid field
**Validates: Requirements 5.1, 5.2, 5.3, 5.5**

**Property 10: Pagination Navigation Works Correctly**
*For any* paginated customer list, clicking next/previous buttons should load the correct page of customers
**Validates: Requirements 2.2, 2.3**

**Property 11: Pagination Information Display**
*For any* paginated customer list, the system should display current page number and total pages
**Validates: Requirements 2.4**

**Property 12: Search Results Pagination**
*For any* search query with more than 20 results, the search results should be paginated with the same 20-item limit
**Validates: Requirements 2.5**

**Property 13: Complete Customer Information Display**
*For any* customer info card, all available customer fields (name, phone, email, address, NIK) should be displayed
**Validates: Requirements 3.1**

**Property 14: Conditional Field Display**
*For any* customer with missing optional fields (email, NIK), those fields should be hidden from the display
**Validates: Requirements 3.2, 3.3**

**Property 15: Error Handling for Failed Operations**
*For any* failed edit operation, the system should display an appropriate error message to the user
**Validates: Requirements 4.5**

## Error Handling

### Validation Errors
- Phone number format validation
- Email format validation (when provided)
- NIK format validation (when provided)
- Phone number uniqueness validation

### API Errors
- Network connectivity issues
- Server errors (500)
- Not found errors (404)
- Conflict errors (409) for duplicate phone numbers

### User Experience Errors
- Loading states during API calls
- Optimistic updates with rollback on failure
- Clear error messages with actionable guidance

## Testing Strategy

### Unit Testing
- Component rendering with various customer data states
- Form validation logic
- Pagination calculations
- Error state handling
- Modal open/close behavior

### Property-Based Testing
Using **fast-check** library for JavaScript/TypeScript property-based testing:

- **Property 1**: Generate random customer data, verify edit modal opens with correct pre-filled data
- **Property 2**: For any edit modal, verify name field has disabled attribute
- **Property 3**: Generate valid customer updates, verify data persistence and UI refresh
- **Property 4**: Test cancel operation preserves original state across various data changes
- **Property 5**: Verify edit buttons consistently open modals across different contexts
- **Property 6**: Test UI refresh behavior with various customer data updates
- **Property 7**: Generate customer lists of various sizes, verify pagination appears when needed
- **Property 8**: Test phone uniqueness validation with various phone number formats
- **Property 9**: Generate invalid customer data, verify field-specific error messages
- **Property 10**: Test pagination navigation with various page sizes and data sets
- **Property 11**: Verify pagination information accuracy across different data scenarios
- **Property 12**: Test search result pagination with various query results
- **Property 13**: Generate customers with various field combinations, verify complete display
- **Property 14**: Test conditional field hiding with customers missing optional data
- **Property 15**: Simulate various API failures, verify appropriate error messages

Each property-based test will run a minimum of 100 iterations to ensure comprehensive coverage across different input combinations.

### Integration Testing
- Full edit workflow from button click to data persistence
- Pagination with real API responses
- Search integration with pagination
- Error recovery scenarios