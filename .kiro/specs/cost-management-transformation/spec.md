# Cost Management Transformation Spec

## Overview
Transform the existing Material Management system into a comprehensive Cost Management system that handles various types of production costs including materials, transportation, tailoring, catering, and other expenses.

## Goals
- Expand from material-only to multi-category cost management
- Simplify data structure by removing unit complexity
- Maintain backward compatibility with existing material data
- Provide flexible cost tracking for product creation

## Current State Analysis
- **Existing System**: Material-focused with name, unit, pricePerUnit
- **Database**: Material table with unit field and complex pricing
- **UI**: MaterialForm, MaterialList, MaterialSelector components
- **Service**: MaterialService with unit-based calculations

## Target State
- **New System**: Category-based cost management with simplified pricing
- **Database**: CostItem table with category enum and basePrice
- **UI**: CostItemForm, CostItemList, CostSelector components  
- **Service**: CostItemService with category-based operations

## Implementation Strategy
1. **Database Migration**: Transform Material → CostItem schema
2. **Service Layer**: Update MaterialService → CostItemService
3. **Type Definitions**: Create new cost management types
4. **UI Components**: Transform existing components
5. **Integration**: Update ProductForm integration
6. **Testing**: Ensure type-check and lint compliance

## Success Criteria
- All existing material data migrated to MATERIAL category
- New cost categories (TRANSPORT, TAILOR, CATERING, OTHER) functional
- ProductForm integration working with multi-cost selection
- Type-check and lint passing
- No breaking changes to existing product functionality

## Technical Requirements
- Maintain Decimal precision for monetary values
- Preserve audit trail (createdBy, timestamps)
- Keep referential integrity checks
- Support search and filtering by category
- Backward compatible API responses

## Non-Goals
- Complex unit calculations per category
- Advanced cost analytics or reporting
- Multi-currency support
- Cost approval workflows