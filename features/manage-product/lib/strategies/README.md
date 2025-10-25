# Dynamic Form Strategy Pattern

## Overview

Strategy pattern implementation untuk dynamic form rendering berdasarkan kategori tipe. Setiap kategori memiliki form fields yang berbeda sesuai kebutuhan bisnis.

## Architecture

```
CategoryFormStrategy (Interface)
├── AccessoriesAgeBasedStrategy (Sarung, Songket)
├── AccessoriesUniversalStrategy (Anting, Gelang, Kalung)
└── ClothingStrategy (Baju, Celana)
```

## Files Structure

```
lib/strategies/
├── CategoryFormStrategy.ts         # Interface dan types
├── AccessoriesAgeBasedStrategy.ts  # Dewasa/Anak fields
├── AccessoriesUniversalStrategy.ts # Single quantity field
├── ClothingStrategy.ts             # Size checkboxes (S/M/L/XL)
├── StrategyFactory.ts              # Factory pattern implementation
├── StrategyIntegration.ts          # Service integration utilities
└── README.md                       # Documentation
```

## Usage Example

### 1. Initialize Strategy
```typescript
import { FormStrategyFactory } from './StrategyFactory'

const strategy = FormStrategyFactory.create('accessories_age_based')
```

### 2. Get Form Fields
```typescript
const formFields = strategy.getFormFields()
// Returns: FormSectionConfig[] untuk UI rendering
```

### 3. Transform Form Data
```typescript
const formData = { jumlahDewasa: 10, jumlahAnak: 5 }
const sizes = strategy.transformToProductSizes(formData)
// Returns: CreateProductSizeRequest[] untuk API
```

### 4. Validate Data
```typescript
const schema = strategy.getValidationSchema()
const result = schema.safeParse(formData)
```

## Strategy Details

### AccessoriesAgeBasedStrategy
- **Purpose**: Aksesoris dengan pembagian umur (Dewasa/Anak)
- **Products**: Sarung, Songket
- **Fields**:
  - `jumlahDewasa` (number, required)
  - `jumlahAnak` (number, required)
- **Output**: 2 ProductSize entries (ADULT + CHILD)

### AccessoriesUniversalStrategy
- **Purpose**: Aksesoris universal tanpa pembagian umur
- **Products**: Anting, Gelang, Kalung
- **Fields**:
  - `jumlahTotal` (number, required, min 1)
- **Output**: 1 ProductSize entry (UNIVERSAL)

### ClothingStrategy
- **Purpose**: Pakaian standar dengan ukuran S/M/L/XL
- **Products**: Baju, Celana, Gaun
- **Fields**:
  - `sizes` (checkbox-group, required)
  - `quantity_XS`, `quantity_S`, `quantity_M`, `quantity_L`, `quantity_XL`, `quantity_XXL` (numbers)
- **Output**: Multiple ProductSize entries (ADULT + size combinations)

## Integration with ProductForm

### Component Usage
```typescript
// In ProductForm.tsx
import { FormStrategyFactory } from '../lib/strategies/StrategyFactory'

const handleCategoryChange = (categoryId: string) => {
  const category = categories.find(cat => cat.id === categoryId)
  const strategy = FormStrategyFactory.create(category.type)
  setCurrentStrategy(strategy)
}

// Render dynamic fields
{currentStrategy?.getFormFields().map((section, index) => (
  <FormSection key={index} title={section.title}>
    {section.fields.map((field, fieldIndex) => (
      <DynamicFormField
        key={fieldIndex}
        field={field}
        value={categoryFormData[field.name]}
        onChange={(value) => handleCategoryFormDataChange(field.name, value)}
      />
    ))}
  </FormSection>
))}
```

### Data Flow
1. User selects category → Strategy Factory creates appropriate strategy
2. Strategy generates form fields → DynamicFormField renders UI
3. User inputs data → Strategy transforms to ProductSize format
4. Data sent to existing API → ProductService handles with existing validation

## Service Integration

### Compatibility
The strategy pattern is fully compatible dengan existing services:

- **CategoryService**: Returns category dengan `type` field (Phase 1 ✅)
- **ProductService**: Category-aware validation dan processing (Phase 2 ✅)
- **API Endpoints**: No changes required - uses existing CreateProductSizeRequest format

### Validation Integration
```typescript
import { StrategyIntegration } from './StrategyIntegration'

// Validate strategy data dengan service rules
const validation = StrategyIntegration.validateWithService(
  strategy,
  formData,
  categoryType
)

// Create product request untuk service
const { productData, sizes } = StrategyIntegration.createProductRequestFromStrategy(
  baseData,
  strategy,
  categoryFormData
)
```

## Error Handling

### Custom Errors
- `StrategyError`: Base error untuk strategy issues
- `InvalidCategoryTypeError`: Unknown category type
- Factory provides fallback to default strategy when configured

### Validation Errors
Each strategy provides:
- Form-level validation (required fields, data types)
- Business logic validation (category-specific rules)
- Service integration validation (compatibility checks)

## Testing

### Unit Tests
```typescript
// Test strategy creation
const strategy = FormStrategyFactory.create('accessories_age_based')
expect(strategy.type).toBe('accessories_age_based')

// Test form fields
const fields = strategy.getFormFields()
expect(fields).toHaveLength(1)
expect(fields[0].fields).toHaveLength(2)

// Test data transformation
const formData = { jumlahDewasa: 10, jumlahAnak: 5 }
const sizes = strategy.transformToProductSizes(formData)
expect(sizes).toHaveLength(2)
```

### Integration Tests
```typescript
// Test form integration
const mockCategory = { id: '1', type: 'accessories_age_based' }
const strategy = FormStrategyFactory.create(mockCategory.type)
const formData = strategy.getDefaultValues()

// Test service compatibility
const validation = StrategyIntegration.validateWithService(
  strategy,
  formData,
  mockCategory.type
)
expect(validation.isValid).toBe(true)
```

## Future Enhancements

### Extensibility
- Add new strategies untuk category types baru
- Custom field types dan validation patterns
- Plugin system untuk dynamic strategy loading

### Performance
- Strategy caching untuk frequently used categories
- Lazy loading untuk complex strategies
- Optimized re-rendering untuk large forms

### Advanced Features
- Conditional field visibility
- Dynamic field dependencies
- Multi-step form wizards
- Real-time validation feedback