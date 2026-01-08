# Material Management System Flow Analysis

## Overview
Analisis komprehensif sistem manajemen material yang terdiri dari service layer (MaterialService), form component (MaterialForm), dan list component (MaterialList). Sistem ini menggunakan arsitektur layered dengan separation of concerns yang jelas.

## Architecture Components

### 1. MaterialService (Business Logic Layer)
**File**: `features/manage-product/services/materialService.ts`

#### Core Responsibilities
- **CRUD Operations**: Create, Read, Update, Delete materials
- **Business Logic**: Validation, conflict checking, price calculations
- **Data Transformation**: Prisma to Application type conversion
- **Transaction Management**: Database transactions for complex operations

#### Key Methods Analysis

##### Create Material Flow
```typescript
async createMaterial(request: CreateMaterialRequest): Promise<Material>
```
**Flow Steps**:
1. **Input Validation** - Uses Zod schema validation
2. **Duplicate Check** - Case-insensitive name uniqueness
3. **Database Creation** - Prisma create with Decimal conversion
4. **Type Conversion** - Convert Prisma types to application types

**Business Rules**:
- Material names must be unique (case-insensitive)
- Price stored as Decimal for precision
- Automatic createdBy tracking

##### Update Material Flow
```typescript
async updateMaterial(id: string, request: UpdateMaterialRequest): Promise<Material>
```
**Flow Steps**:
1. **Input Validation** - ID and data validation
2. **Existence Check** - Verify material exists
3. **Conflict Prevention** - Check name uniqueness if name changed
4. **Selective Update** - Only update provided fields
5. **Type Conversion** - Handle Decimal conversion for prices

**Business Rules**:
- Only update fields that are provided
- Maintain name uniqueness across updates
- Automatic updatedAt timestamp

##### Get Materials with Pagination
```typescript
async getMaterials(query: MaterialQueryParams): Promise<MaterialListResponse>
```
**Flow Steps**:
1. **Query Validation** - Parse and validate query parameters
2. **Filter Building** - Dynamic where clause construction
3. **Search Implementation** - Name and unit search with case-insensitive matching
4. **Parallel Execution** - Simultaneous data and count queries
5. **Pagination Calculation** - Metadata generation

**Features**:
- **Search**: Name and unit fields
- **Filtering**: Unit-based filtering (single or multiple)
- **Pagination**: Page-based with metadata
- **Sorting**: Created date descending

##### Delete Material Flow
```typescript
async deleteMaterial(id: string): Promise<boolean>
```
**Flow Steps**:
1. **Validation** - ID validation
2. **Existence Check** - Verify material exists
3. **Usage Check** - Prevent deletion if used by products
4. **Hard Delete** - Direct database deletion

**Business Rules**:
- Cannot delete materials used by products
- Hard delete approach (ultra-simplified)
- Referential integrity protection

##### Special Operations

###### Update Material Price with Product Recalculation
```typescript
async updateMaterialPrice(id: string, newPrice: number): Promise<Material>
```
**Transaction Flow**:
1. **Material Price Update** - Update material price
2. **Product Cost Recalculation** - Update all products using this material
3. **Atomic Operation** - Uses Prisma transaction

**Business Impact**:
- Cascading price updates to products
- Maintains cost consistency across system
- Transaction ensures data integrity

### 2. MaterialForm Component (UI Layer)
**File**: `features/manage-product/components/material/MaterialForm.tsx`

#### Core Responsibilities
- **Form State Management** - React state for form data and errors
- **Input Validation** - Client-side validation with error display
- **Currency Formatting** - Indonesian Rupiah formatting
- **User Experience** - Loading states, error handling, logging

#### Form Flow Analysis

##### Initialization Flow
```typescript
useEffect(() => {
  // Form initialization logic
}, [mode, material, existingMaterials.length])
```
**Modes**:
- **Add Mode**: Empty form with default values
- **Edit Mode**: Pre-populated with existing material data

**Default Values**:
- Unit: 'meter' (fabric-focused default)
- Price: Empty string
- Name: Empty string

##### Validation Flow
```typescript
const validateForm = (): boolean
```
**Validation Rules**:
1. **Name Validation**:
   - Required field
   - Minimum 2 characters
   - Uniqueness check against existing materials
   - Case-insensitive duplicate detection

2. **Price Validation**:
   - Required field
   - Must be positive number
   - Handles string to number conversion

3. **Unit Validation**:
   - Required selection
   - Must be from predefined units

**Error Handling**:
- Field-specific error messages
- Visual error indicators (red borders)
- Comprehensive logging for debugging

##### Currency Formatting System
```typescript
const formatCurrency = (value: string) => {
  // Indonesian format with thousand separators
}

const parseCurrency = (formattedValue: string): number => {
  // Convert formatted string back to number
}
```
**Features**:
- **Input Formatting**: Automatic thousand separators with dots
- **Integer Only**: No decimal support (simplified)
- **Real-time Formatting**: As user types
- **Parsing**: Clean conversion for submission

##### Submission Flow
```typescript
const handleSubmit = async (e: React.FormEvent)
```
**Flow Steps**:
1. **Prevent Default** - Stop form default submission
2. **Validation** - Client-side validation
3. **Loading State** - Set submitting state
4. **Data Preparation** - Format data for submission
5. **Parent Callback** - Call onSubmit prop
6. **Error Handling** - Catch and log errors
7. **State Reset** - Clear loading state

**Logging Integration**:
- Performance timing
- User interaction tracking
- Error logging with context
- Form validation metrics

#### UI/UX Features
- **Responsive Design**: Grid layout adapts to screen size
- **Accessibility**: Proper labels and ARIA attributes
- **Visual Feedback**: Loading states, error indicators
- **Navigation**: Back button and cancel options

### 3. MaterialList Component (Display Layer)
**File**: `features/manage-product/components/material/MaterialList.tsx`

#### Core Responsibilities
- **Data Display** - Material list with formatting
- **Search Functionality** - Real-time search with debouncing
- **User Actions** - Edit and delete operations
- **Loading States** - Skeleton loading and empty states

#### Search and Filter Flow

##### Debounced Search Implementation
```typescript
const debouncedSearchTerm = useDebounce(searchTerm, 300)
```
**Benefits**:
- **Performance**: Reduces unnecessary filtering
- **User Experience**: Smooth typing experience
- **Resource Optimization**: Prevents excessive re-renders

##### Filtering Logic
```typescript
const filteredMaterials = (() => {
  const safeMaterials = Array.isArray(materials) ? materials : []
  return safeMaterials.filter(material =>
    material?.name?.toLowerCase()?.includes(debouncedSearchTerm.toLowerCase()) || false
  )
})()
```
**Features**:
- **Defensive Programming**: Null/undefined safety
- **Case-insensitive**: Lowercase comparison
- **Real-time**: Updates as user types (debounced)

#### Display Features

##### Material Card Layout
```typescript
<div className="flex items-center justify-between p-4 bg-white rounded-lg border">
  {/* Material Info */}
  {/* Action Buttons */}
</div>
```
**Components**:
- **Icon**: Package icon with colored background
- **Name**: Material name as primary text
- **Price**: Formatted Indonesian Rupiah
- **Unit**: Badge display for unit type
- **Actions**: Edit and delete buttons

##### Price Formatting
```typescript
Rp {material.pricePerUnit.toLocaleString('id-ID')} per {material.unit}
```
**Features**:
- **Localization**: Indonesian number formatting
- **Currency**: Rupiah symbol
- **Unit Display**: Clear unit indication

#### State Management

##### Loading States
- **Skeleton Loading**: Animated placeholders during data fetch
- **Empty States**: Different messages for no data vs no search results
- **Error Handling**: Graceful degradation

##### User Interactions
```typescript
const handleEdit = (material: Material) => {
  onEdit(material)
}

const handleDelete = (material: Material) => {
  onDelete(material)
}
```
**Pattern**:
- **Callback Props**: Parent component handles actual operations
- **Event Delegation**: Clean separation of concerns
- **Type Safety**: Full TypeScript support

## Data Flow Architecture

### 1. Create Material Flow
```
User Input (MaterialForm) 
  → Form Validation 
  → Currency Parsing 
  → Parent Component 
  → API Call 
  → MaterialService.createMaterial() 
  → Schema Validation 
  → Duplicate Check 
  → Database Insert 
  → Type Conversion 
  → Response
```

### 2. Update Material Flow
```
User Selection (MaterialList) 
  → Edit Button Click 
  → Parent Component 
  → MaterialForm (Edit Mode) 
  → Form Pre-population 
  → User Changes 
  → Validation 
  → MaterialService.updateMaterial() 
  → Existence Check 
  → Conflict Check 
  → Database Update 
  → Response
```

### 3. Delete Material Flow
```
User Selection (MaterialList) 
  → Delete Button Click 
  → Parent Component 
  → Confirmation (if implemented) 
  → MaterialService.deleteMaterial() 
  → Existence Check 
  → Usage Check 
  → Database Delete 
  → Response
```

### 4. Search Flow
```
User Input (MaterialList Search) 
  → State Update 
  → Debounce (300ms) 
  → Filter Function 
  → Re-render List 
  → Display Results
```

## Technical Implementation Details

### Type Safety
- **Full TypeScript**: End-to-end type safety
- **Zod Validation**: Runtime type checking
- **Interface Definitions**: Clear contracts between layers

### Error Handling
- **Custom Errors**: NotFoundError, ConflictError
- **Validation Errors**: Field-specific error messages
- **Logging**: Comprehensive error logging with context

### Performance Optimizations
- **Debounced Search**: Prevents excessive filtering
- **Parallel Queries**: Simultaneous data and count queries
- **Selective Updates**: Only update changed fields
- **Memoization**: React optimization patterns

### Data Consistency
- **Decimal Precision**: Accurate monetary calculations
- **Transaction Support**: Atomic operations for complex updates
- **Referential Integrity**: Prevents orphaned references

## Business Rules Summary

### Material Creation
- Names must be unique (case-insensitive)
- Price must be positive
- Unit must be from predefined list
- Automatic audit trail (createdBy, timestamps)

### Material Updates
- Maintain name uniqueness
- Selective field updates
- Automatic timestamp updates
- Type conversion handling

### Material Deletion
- Cannot delete if used by products
- Hard delete approach
- Referential integrity checks

### Search and Display
- Case-insensitive search
- Real-time filtering with debouncing
- Indonesian currency formatting
- Responsive design patterns

## Integration Points

### Database Layer
- **Prisma ORM**: Type-safe database operations
- **Decimal Fields**: Precise monetary calculations
- **Transactions**: Complex operation support

### Validation Layer
- **Zod Schemas**: Runtime validation
- **Client-side Validation**: Immediate feedback
- **Server-side Validation**: Security and consistency

### Logging System
- **Structured Logging**: Consistent log format
- **Performance Metrics**: Operation timing
- **User Analytics**: Interaction tracking
- **Error Tracking**: Comprehensive error context

## Recommendations for Enhancement

### 1. Soft Delete Implementation
- Add `isActive` field to materials
- Implement soft delete for better data retention
- Add restore functionality

### 2. Advanced Search
- Add unit filtering in UI
- Implement price range filtering
- Add sorting options

### 3. Bulk Operations
- Bulk material import
- Bulk price updates
- Bulk delete with confirmation

### 4. Audit Trail Enhancement
- Track all changes with details
- Add change history view
- Implement user activity logging

### 5. Performance Improvements
- Add pagination to MaterialList
- Implement virtual scrolling for large lists
- Add caching layer for frequently accessed data

This analysis provides a comprehensive understanding of the material management system's architecture, data flow, and implementation details, serving as documentation for current functionality and guidance for future enhancements.