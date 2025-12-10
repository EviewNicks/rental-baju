# Implementation Plan: Product Break-Even Status Badge

## Overview
This implementation plan breaks down the Product Break-Even Status Badge feature into discrete, manageable coding tasks. Each task builds incrementally on previous steps, ensuring that all components are properly integrated.

---

## Task List

- [x] 1. Extend type definitions and interfaces
  - Add `BreakEvenStatus` interface to `features/manage-product/types/index.ts`
  - Extend `Product` type with optional `breakEvenStatus` field
  - Add TypeScript types for component props
  - _Requirements: 1.1, 1.4, 7.4_

- [x] 2. Implement break-even calculation in ProductHistoryService
  - Add `getBreakEvenStatus(productId: string)` method to ProductHistoryService
  - Implement revenue aggregation query excluding cancelled transactions
  - Include subtotal and penalty amounts in total revenue calculation
  - Calculate progress percentage and profit values
  - Add error handling with fallback response
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.4_

- [ ]* 2.1 Write unit tests for break-even calculation
  - Test break-even achieved scenario (revenue >= modalAwal)
  - Test break-even not achieved scenario (revenue < modalAwal)
  - Test cancelled transaction exclusion
  - Test penalty inclusion in revenue
  - Test zero modalAwal edge case
  - Test null modalAwal edge case
  - _Requirements: 1.1, 1.2, 1.3, 8.2, 8.3_

- [x] 3. Add bulk break-even status method
  - Implement `getBulkBreakEvenStatus(productIds: string[])` in ProductHistoryService
  - Use `groupBy` aggregation for efficient bulk queries
  - Return Map<string, BreakEvenStatus> for O(1) lookup
  - _Requirements: 6.3, 7.3_

- [ ]* 3.1 Write unit tests for bulk break-even calculation
  - Test multiple products with mixed break-even status
  - Test empty product list
  - Test products with no transactions
  - _Requirements: 6.3, 7.3_

- [x] 4. Modify API routes to support break-even data
  - Update GET `/api/products/[id]/route.ts` to accept `includeBreakEven` query parameter
  - Implement role-based access control (Owner, Producer only)
  - Call `getBreakEvenStatus()` when authorized and requested
  - Include `breakEvenStatus` in response payload
  - _Requirements: 5.1, 5.2, 5.3, 7.1, 7.2_

- [x] 4.1 Update GET `/api/products/route.ts` for bulk queries
  - Accept `includeBreakEven` query parameter for product lists
  - Call `getBulkBreakEvenStatus()` for all products
  - Map break-even status to each product in response
  - Implement role-based filtering
  - _Requirements: 5.1, 5.2, 5.3, 7.3_

- [ ]* 4.2 Write integration tests for API routes
  - Test single product endpoint with includeBreakEven=true for Owner role
  - Test single product endpoint with includeBreakEven=true for Producer role
  - Test single product endpoint returns no break-even data for Kasir role
  - Test bulk product endpoint with includeBreakEven=true
  - Test unauthorized access scenarios
  - _Requirements: 5.1, 5.2, 5.3, 7.1, 7.2, 7.3_

- [x] 5. Update API client and hooks
  - Modify `productApi.getProductById()` to accept `includeBreakEven` parameter
  - Modify `productApi.getProducts()` to accept `includeBreakEven` in params
  - Update `useProduct` hook to support `includeBreakEven` option
  - Update `useProducts` hook to support `includeBreakEven` option
  - Configure React Query caching (5min stale time, refetch on focus)
  - _Requirements: 6.1, 6.2, 7.1, 7.3_

- [x] 6. Create BreakEvenBadge component
  - Create `features/manage-product/components/shared/BreakEvenBadge.tsx`
  - Implement badge with soft yellow styling (bg-yellow-100, text-yellow-800, border-yellow-300)
  - Add trophy emoji 🏆 and "Modal Kembali" text
  - Support size variants (sm, md, lg)
  - Implement conditional rendering (only show when isBreakEven is true)
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 6.1 Add tooltip functionality to BreakEvenBadge
  - Integrate Shadcn Tooltip component
  - Display modal awal in formatted currency
  - Display total revenue in formatted currency
  - Calculate and display profit amount when break-even achieved
  - Display profit percentage with one decimal place
  - Show transaction count
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ]* 6.2 Write unit tests for BreakEvenBadge
  - Test badge renders when isBreakEven is true
  - Test badge does not render when isBreakEven is false
  - Test tooltip displays correct financial data
  - Test size variants render correctly
  - Test accessibility (ARIA labels, keyboard navigation)
  - _Requirements: 2.1, 2.2, 2.3, 4.1, 4.2, 4.3_

- [x] 7. Create BreakEvenProgress component
  - Create `features/manage-product/components/product-detail/BreakEvenProgress.tsx`
  - Implement progress bar with gradient fill
  - Display percentage text: "Progress Modal: X%"
  - Display currency breakdown: "Rp X / Rp Y"
  - Cap visual progress at 100% but show actual percentage
  - Handle edge cases (modalAwal = 0, modalAwal = null)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 7.1 Write unit tests for BreakEvenProgress
  - Test progress bar renders with correct percentage
  - Test progress caps at 100% visually when exceeding
  - Test currency formatting displays correctly
  - Test zero modalAwal hides component
  - Test null modalAwal shows "Modal awal tidak tersedia"
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 8. Integrate badge into ProductDetailPage
  - Modify `features/manage-product/components/product-detail/ProductDetailPage.tsx`
  - Update `useProduct` hook call to include `includeBreakEven: true`
  - Add BreakEvenBadge in header section next to product name
  - Add BreakEvenProgress below product name in header
  - Handle loading states with skeleton loaders
  - Implement error handling (graceful degradation)
  - _Requirements: 2.4, 3.1, 6.1, 8.1_

- [x] 9. Integrate badge into ProductListPage
  - Modify `features/manage-product/components/products/ProductTable.tsx`
  - Update products query to include `includeBreakEven: true`
  - Add BreakEvenBadge in status column alongside existing status badge
  - Use compact size variant (size="sm")
  - Enable tooltip on hover
  - _Requirements: 2.5, 6.1_

- [x] 10. Integrate badge into ProductGrid
  - Modify `features/manage-product/components/products/ProductGrid.tsx`
  - Update products query to include `includeBreakEven: true`
  - Position BreakEvenBadge as corner badge (absolute top-2 right-2)
  - Use small size variant with tooltip
  - Ensure badge doesn't interfere with card interactions
  - _Requirements: 2.6, 6.1_

- [x] 11. Implement cache invalidation strategy
  - Add cache invalidation when transactions are completed
  - Add cache invalidation when transactions are cancelled
  - Update React Query mutation callbacks to invalidate product queries
  - Test refetch on window focus behavior
  - _Requirements: 6.2, 6.4_

- [x] 12. Add loading and error states
  - Implement skeleton loader for badge in ProductDetailPage
  - Add fallback UI when break-even data fails to load
  - Ensure page layout remains stable during loading
  - Test network timeout scenarios with retry logic
  - _Requirements: 6.5, 8.1, 8.5_

- [ ]* 12.1 Write integration tests for frontend components
  - Test ProductDetailPage displays badge and progress correctly
  - Test ProductListPage displays badges in table
  - Test ProductGrid displays corner badges
  - Test loading states render skeleton loaders
  - Test error states degrade gracefully
  - Test role-based visibility (Owner sees badge, Kasir doesn't)
  - _Requirements: 2.4, 2.5, 2.6, 5.1, 5.2, 5.3, 8.1_

- [ ] 13. Performance optimization and testing
  - Verify single product query completes within 200ms
  - Verify bulk query completes within 500ms for 50 products
  - Test badge rendering doesn't cause layout shifts
  - Optimize database queries if needed (check query plans)
  - _Requirements: 6.1, 6.3_

- [ ] 14. Accessibility and responsive design
  - Add ARIA labels to badge components
  - Ensure tooltip is keyboard accessible (Tab navigation)
  - Verify color contrast meets WCAG 2.1 AA standards
  - Test badge display on mobile devices
  - Test responsive behavior of progress bar
  - _Requirements: Non-functional (Accessibility)_

- [ ] 15. Final checkpoint - Ensure all tests pass
  - Run all unit tests and verify they pass
  - Run all integration tests and verify they pass
  - Test feature end-to-end in development environment
  - Verify role-based access control works correctly
  - Ask the user if questions arise

---

## Implementation Notes

### Execution Order
Tasks should be executed in numerical order as each builds on the previous:
1. Type definitions first (foundation)
2. Service layer implementation (business logic)
3. API routes (data access)
4. API client and hooks (data fetching)
5. UI components (presentation)
6. Integration into existing pages (wiring)
7. Optimization and testing (quality assurance)

### Testing Strategy
- Unit tests are marked as optional (*) to focus on core functionality first
- Integration tests validate end-to-end behavior
- Manual testing should verify visual appearance and user experience

### Key Integration Points
- ProductHistoryService: Extend with break-even calculation methods
- Product API routes: Add optional query parameter support
- React Query hooks: Configure caching and refetch behavior
- Existing product pages: Minimal modifications to integrate badges

### Performance Targets
- Single product query: < 200ms
- Bulk product query (50 items): < 500ms
- Badge rendering: No layout shifts
- Cache duration: 5 minutes with refetch on focus

---

## Estimated Time
- Backend implementation (Tasks 1-4): 6-8 hours
- Component development (Tasks 5-7): 4-6 hours
- Integration (Tasks 8-10): 3-4 hours
- Optimization and testing (Tasks 11-15): 3-4 hours
- **Total: 16-22 hours**

---

## Success Criteria
- ✅ Break-even badge displays on products that have recovered modal awal
- ✅ Progress bar shows accurate percentage on ProductDetailPage
- ✅ Tooltip displays detailed financial breakdown
- ✅ Only Owner and Producer roles can see break-even information
- ✅ Badge appears in ProductDetailPage header, ProductListPage table, and ProductGrid cards
- ✅ Performance targets met (queries < 200ms single, < 500ms bulk)
- ✅ No layout shifts or visual jank during loading
- ✅ Graceful error handling with fallback UI
- ✅ All tests pass

---

**Document Version**: 1.0  
**Created**: 2025-11-29  
**Status**: Ready for Review
