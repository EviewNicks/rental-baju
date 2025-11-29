# Implementation Plan - Size Detail Card Inventory Enhancement

## Overview

Task plan untuk mengimplementasikan enhanced inventory display pada SizeDetailCard. Dibagi menjadi 2 phase utama: **Backend Verification** dan **Frontend Implementation**.

**Total Estimated Time**: 4-6 hours  
**Priority**: High  
**Complexity**: Medium

## Phase 1: Backend Verification & API Validation

### Objective
Memastikan API endpoint sudah menyediakan data yang benar dan lengkap untuk enhanced inventory display.

**Estimated Time**: 30 minutes  
**Status**: ✅ Expected to be complete (API already provides correct data)

---

- [ ] 1. Verify API Response Structure
  - Validate `/api/public/products/[id]` endpoint response
  - Confirm `sizeDetails` array is present in response
  - Confirm `inventoryStatus` object is present in response
  - Test with real product data from database
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 1.1 Test API with sample product
  - Use product ID from `docs/error.md` example
  - Verify response includes all enhanced fields
  - Check data accuracy (originalQuantity, rentedQuantity, availableQuantity)
  - Validate utilizationRate calculation
  - _Requirements: 2.1, 2.2_

- [ ] 1.2 Validate data consistency
  - Verify equation: originalQuantity = rentedQuantity + availableQuantity
  - Check utilizationRate = (rentedQuantity / originalQuantity) * 100
  - Ensure isAvailable = availableQuantity > 0
  - Test with multiple products
  - _Requirements: 2.3_

- [ ] 1.3 Document API response format
  - Update API documentation if needed
  - Add TypeScript interfaces for response
  - Document any edge cases found
  - _Requirements: 2.4_

---

## Phase 2: Frontend Implementation

### Objective
Update hook transformation dan component untuk menggunakan enhanced inventory data dari API.

**Estimated Time**: 3.5-5.5 hours

---

### 2.1 Hook Transformation Enhancement

**File**: `features/homepage/hooks/usePublicProducts.ts`  
**Estimated Time**: 1 hour

- [ ] 2. Update useTransformedProductDetail Hook
  - Map `sizeDetails` from API to `enhancedSizes`
  - Include `inventoryStatus` in transformed data
  - Add backward compatibility for legacy data
  - Update `availabilityInfo` to use enhanced fields
  - _Requirements: 2.1, 2.2, 2.3, 6.1, 6.2_

- [ ] 2.1 Implement sizeDetails mapping
  - Map all enhanced fields (originalQuantity, rentedQuantity, availableQuantity)
  - Include utilizationRate and isAvailable
  - Add fallback to legacy `sizes` array if `sizeDetails` not available
  - Ensure backward compatibility with quantity field
  - _Requirements: 2.1, 6.1, 6.2, 6.3_

- [ ] 2.2 Add inventoryStatus to transformed data
  - Include totalOriginal, totalAvailable, totalRented
  - Include utilizationRate and isHealthy
  - Handle case when inventoryStatus is undefined
  - _Requirements: 2.2, 6.4_

- [ ] 2.3 Update availabilityInfo calculation
  - Use inventoryStatus.totalAvailable if available
  - Fallback to calculating from sizes array
  - Add totalAvailable and totalRented fields
  - Ensure isInStock uses correct data source
  - _Requirements: 2.3, 6.5_


---

### 2.2 Component Interface Extension

**File**: `features/homepage/components/SizeDetailCard.tsx`  
**Estimated Time**: 30 minutes

- [ ] 3. Extend Component Interfaces
  - Update `SizeItem` interface to `EnhancedSizeItem`
  - Add optional enhanced fields to interface
  - Add `inventoryStatus` prop to `SizeDetailCardProps`
  - Maintain backward compatibility with existing props
  - _Requirements: 1.1, 6.1, 6.2_

- [ ] 3.1 Define EnhancedSizeItem interface
  - Add originalQuantity, rentedQuantity, availableQuantity as optional
  - Add utilizationRate and isAvailable as optional
  - Keep quantity field for backward compatibility
  - Add proper TypeScript types and JSDoc comments
  - _Requirements: 1.1, 6.1_

- [ ] 3.2 Add InventoryStatus interface
  - Define totalOriginal, totalAvailable, totalRented
  - Define utilizationRate and isHealthy
  - Make it optional in props for backward compatibility
  - _Requirements: 1.1, 6.2_

- [ ] 3.3 Update SizeDetailCardProps
  - Change sizes type to EnhancedSizeItem[]
  - Add optional inventoryStatus prop
  - Ensure all existing props remain compatible
  - _Requirements: 1.1, 6.1, 6.2_

---

### 2.3 Statistics Calculation Enhancement

**File**: `features/homepage/components/SizeDetailCard.tsx`  
**Estimated Time**: 45 minutes

- [ ] 4. Enhance Statistics Calculation
  - Update stats calculation to use enhanced fields
  - Add totalAvailable and totalRented to statistics
  - Update byCategory breakdown with enhanced fields
  - Optimize with React.useMemo for performance
  - _Requirements: 1.1, 1.2, 7.1, 7.2_

- [ ] 4.1 Update totalQuantity calculation
  - Use originalQuantity with fallback to quantity
  - Calculate totalAvailable from availableQuantity
  - Calculate totalRented from rentedQuantity
  - Handle undefined/null values safely
  - _Requirements: 1.1, 6.3_

- [ ] 4.2 Update availableSizes filter
  - Filter based on availableQuantity > 0
  - Fallback to quantity > 0 for legacy data
  - Update count to reflect actual available sizes
  - _Requirements: 1.1, 6.3_

- [ ] 4.3 Enhance byCategory breakdown
  - Add available and rented fields to category stats
  - Calculate per-category utilization
  - Update percentage calculations
  - _Requirements: 1.1, 1.5_

- [ ] 4.4 Add performance optimization
  - Wrap calculation in React.useMemo
  - Add proper dependency array
  - Test re-render performance
  - _Requirements: 7.1, 7.2_

---

### 2.4 Enhanced Display Implementation

**File**: `features/homepage/components/SizeDetailCard.tsx`  
**Estimated Time**: 2 hours

- [ ] 5. Implement Enhanced Display Logic
  - Update statistics summary to show 4 columns
  - Implement availability breakdown per size
  - Add rented quantity indicator
  - Add utilization progress bar
  - Add color-coded status badges
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4_

- [ ] 5.1 Update statistics summary section
  - Add 4th column for total rented items
  - Update labels and styling
  - Add overall inventory status message
  - Show "X dari Y pcs tersedia (Z sedang disewa)"
  - _Requirements: 1.1, 1.2_

- [ ] 5.2 Implement size item availability breakdown
  - Display "X dari Y pcs tersedia" format
  - Show originalQuantity and availableQuantity
  - Add fallback for legacy data
  - _Requirements: 1.1, 1.4_

- [ ] 5.3 Add rented quantity indicator
  - Show "X sedang disewa" when rentedQuantity > 0
  - Use orange color for rented indicator
  - Only display if rentedQuantity > 0
  - _Requirements: 1.2_

- [ ] 5.4 Implement utilization progress bar
  - Add Progress component with utilizationRate
  - Color-code based on utilization (green < 50%, yellow 50-80%, red > 80%)
  - Show percentage label below progress bar
  - Only show if showProgress prop is true
  - _Requirements: 1.5, 3.4_

- [ ] 5.5 Add color-coded status badges
  - Green badge for fully available (availableQuantity = originalQuantity)
  - Yellow/Orange badge for partially available (0 < available < original)
  - Red badge for out of stock (availableQuantity = 0)
  - Add appropriate icons (CheckCircle, AlertCircle, XCircle)
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 5.6 Apply responsive styling
  - Ensure layout works on mobile (< 640px)
  - Optimize for tablet (640px - 1024px)
  - Full layout on desktop (> 1024px)
  - Test touch targets on mobile
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5.7 Add accessibility attributes
  - Add aria-label for progress bars
  - Add aria-valuenow, aria-valuemin, aria-valuemax
  - Add role attributes for badges
  - Add aria-disabled for out of stock items
  - Add aria-hidden for decorative icons
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

---

### 2.5 Page Integration

**File**: `features/homepage/components/ProductDetailPage.tsx`  
**Estimated Time**: 15 minutes

- [ ] 6. Update ProductDetailPage Integration
  - Pass `enhancedSizes` instead of `sizes` to SizeDetailCard
  - Pass `inventoryStatus` prop to SizeDetailCard
  - Verify all props are correctly passed
  - Test integration with real data
  - _Requirements: 1.1, 2.1, 2.2_

- [ ] 6.1 Update SizeDetailCard props
  - Change from `product.sizes` to `product.enhancedSizes`
  - Add `inventoryStatus={product.inventoryStatus}`
  - Ensure other props remain unchanged
  - _Requirements: 1.1, 2.1, 2.2_

- [ ] 6.2 Test integration
  - Verify data flows correctly from hook to component
  - Check that enhanced display renders properly
  - Test with different product data scenarios
  - _Requirements: 1.1, 2.1, 2.2_

---

### 2.6 Testing & Validation

**Estimated Time**: 1 hour

- [ ] 7. Unit Testing
  - Write tests for hook transformation
  - Write tests for component rendering
  - Write tests for statistics calculation
  - Write tests for backward compatibility
  - _Requirements: All requirements_

- [ ] 7.1 Test hook transformation
  - Test sizeDetails mapping to enhancedSizes
  - Test fallback to legacy sizes
  - Test inventoryStatus inclusion
  - Test availabilityInfo calculation
  - _Requirements: 2.1, 2.2, 2.3, 6.1, 6.2, 6.3_

- [ ] 7.2 Test component rendering
  - Test with enhanced data
  - Test with legacy data
  - Test with mixed data
  - Test empty state
  - _Requirements: 1.1, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 7.3 Test statistics calculation
  - Test totalQuantity, totalAvailable, totalRented
  - Test byCategory breakdown
  - Test utilization rate calculation
  - Test edge cases (zero, negative, undefined)
  - _Requirements: 1.1, 1.2, 1.5_

- [ ] 7.4 Test backward compatibility
  - Test with data that only has quantity field
  - Test with partial enhanced fields
  - Test fallback logic
  - Ensure no breaking changes
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

---

- [ ] 8. Integration Testing
  - Test full data flow from API to UI
  - Test with real product data
  - Test error handling
  - Test loading states
  - _Requirements: All requirements_

- [ ] 8.1 Test API to UI data flow
  - Fetch product detail from API
  - Verify hook transformation
  - Verify component rendering
  - Check data accuracy in UI
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 8.2 Test with various product scenarios
  - Full stock (available = original)
  - Partial stock (0 < available < original)
  - Out of stock (available = 0)
  - Multiple sizes with different statuses
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3_

- [ ] 8.3 Test error handling
  - API error response
  - Missing sizeDetails
  - Missing inventoryStatus
  - Invalid data types
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

---

- [ ] 9. Manual Testing & QA
  - Visual inspection on different devices
  - Accessibility testing
  - Performance testing
  - User acceptance testing
  - _Requirements: All requirements_

- [ ] 9.1 Visual inspection
  - Test on mobile device (< 640px)
  - Test on tablet (640px - 1024px)
  - Test on desktop (> 1024px)
  - Verify colors, spacing, alignment
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 9.2 Accessibility testing
  - Test with screen reader (NVDA/JAWS)
  - Test keyboard navigation
  - Verify ARIA attributes
  - Check color contrast ratios
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 9.3 Performance testing
  - Measure component render time
  - Test with large datasets (20+ sizes)
  - Check for unnecessary re-renders
  - Verify memoization works
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 9.4 User acceptance testing
  - Verify users can understand availability within 3 seconds
  - Check visual clarity of status indicators
  - Validate color coding is intuitive
  - Gather feedback on usability
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4_

---

## Phase 3: Deployment & Monitoring

### Objective
Deploy changes to production and monitor for issues.

**Estimated Time**: 30 minutes

---

- [ ] 10. Deployment
  - Deploy to staging environment
  - Run smoke tests
  - Deploy to production
  - Monitor for errors
  - _Requirements: All requirements_

- [ ] 10.1 Staging deployment
  - Deploy code to staging
  - Run automated tests
  - Perform manual smoke tests
  - Verify no regressions
  - _Requirements: All requirements_

- [ ] 10.2 Production deployment
  - Deploy to production
  - Monitor error logs
  - Check performance metrics
  - Verify user experience
  - _Requirements: All requirements_

- [ ] 10.3 Post-deployment monitoring
  - Monitor API response times
  - Check component render times
  - Track error rates
  - Monitor user engagement metrics
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

---

## Summary

### Phase Breakdown

| Phase | Tasks | Estimated Time | Priority |
|-------|-------|----------------|----------|
| **Phase 1: Backend Verification** | 1-1.3 | 30 mins | High |
| **Phase 2: Frontend Implementation** | 2-9.4 | 3.5-5.5 hours | High |
| **Phase 3: Deployment** | 10-10.3 | 30 mins | High |
| **Total** | 10 main tasks, 40+ subtasks | **4.5-6.5 hours** | High |

### Key Milestones

1. ✅ **Backend Verified** - API provides correct data
2. ✅ **Hook Enhanced** - Data transformation complete
3. ✅ **Component Updated** - Enhanced display implemented
4. ✅ **Tests Passing** - All tests green
5. ✅ **Deployed** - Live in production

### Success Criteria

- [x] Display originalQuantity, rentedQuantity, availableQuantity for each size
- [x] Show utilization rate as percentage and progress bar
- [x] Visual differentiation for availability status (green/yellow/red)
- [x] Backward compatibility with legacy data
- [x] Component renders within 100ms
- [x] WCAG 2.1 AA compliance
- [x] Responsive on all screen sizes
- [x] Zero breaking changes

### Notes

- **Backend is already complete** - API provides all necessary data
- **Focus on frontend** - Main work is in hook and component
- **Backward compatibility is critical** - Must work with legacy data
- **Performance matters** - Use memoization and optimization
- **Accessibility is required** - Must meet WCAG 2.1 AA standards

### Dependencies

- React Query for data fetching
- shadcn/ui components (Badge, Progress, Card)
- Tailwind CSS for styling
- TypeScript for type safety
- Jest/React Testing Library for testing

### Risk Mitigation

1. **Breaking Changes**: Extensive backward compatibility testing
2. **Performance**: Memoization and optimization from start
3. **Accessibility**: Built-in from design phase
4. **Data Inconsistency**: Fallback logic for all fields

---

## Getting Started

Ready to start? Follow these steps:

1. ✅ Review requirements and design documents
2. ✅ Start with Phase 1 (Backend Verification)
3. ✅ Move to Phase 2 (Frontend Implementation)
4. ✅ Complete Phase 3 (Deployment)
5. ✅ Monitor and iterate

**Estimated Total Time**: 4.5-6.5 hours  
**Recommended Approach**: Complete one phase at a time, test thoroughly before moving to next phase.

Good luck! 🚀
