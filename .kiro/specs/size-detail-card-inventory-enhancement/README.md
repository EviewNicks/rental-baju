# Size Detail Card Inventory Enhancement

## 📋 Spec Overview

**Status**: ✅ Ready for Implementation  
**Priority**: High  
**Complexity**: Medium  
**Estimated Effort**: 4-6 hours

## 🎯 Problem

SizeDetailCard pada ProductDetailPage tidak menampilkan informasi inventory yang lengkap dan akurat. Component hanya menampilkan total `quantity` tanpa membedakan antara stok yang sedang disewa (`rentedQuantity`) dan stok yang tersedia (`availableQuantity`).

**Example:**
- ProductSize: Dewasa XL
- originalQuantity: 6 pcs
- rentedQuantity: 2 pcs
- availableQuantity: 4 pcs

**Current Display**: "6 pcs" ❌  
**Expected Display**: "4 dari 6 pcs tersedia (2 sedang disewa)" ✅

## 🔍 Root Cause

1. **API Response** (✅ CORRECT): Sudah menyediakan `sizeDetails` dan `inventoryStatus`
2. **Hook Transformation** (❌ PROBLEM): Tidak menggunakan `sizeDetails` dari API
3. **Component Interface** (❌ PROBLEM): Hanya support legacy `quantity` field
4. **Display Logic** (❌ PROBLEM): Tidak menampilkan breakdown inventory

## 📁 Documentation

| Document | Description |
|----------|-------------|
| [SUMMARY.md](./SUMMARY.md) | Quick overview dan implementation checklist |
| [analysis.md](./analysis.md) | Detailed problem analysis dan root cause |
| [requirements.md](./requirements.md) | Complete requirements dengan acceptance criteria |
| [DIAGRAMS.md](./DIAGRAMS.md) | Visual diagrams dan mockups |

## 🚀 Quick Start

### 1. Review Documents (15 mins)
```bash
# Read summary first
cat .kiro/specs/size-detail-card-inventory-enhancement/SUMMARY.md

# Then review analysis
cat .kiro/specs/size-detail-card-inventory-enhancement/analysis.md

# Check visual diagrams
cat .kiro/specs/size-detail-card-inventory-enhancement/DIAGRAMS.md
```

### 2. Understand Current State (10 mins)
- API already provides correct data (`sizeDetails`, `inventoryStatus`)
- Hook ignores `sizeDetails` and only uses legacy `sizes` array
- Component only displays `quantity` without breakdown

### 3. Implementation Plan (4-6 hours)

#### Phase 1: Hook Enhancement (1 hour)
**File**: `features/homepage/hooks/usePublicProducts.ts`

```typescript
// Add sizeDetails mapping
enhancedSizes: data.sizeDetails?.map(detail => ({
  id: detail.id,
  size: detail.size,
  ageCategory: detail.ageCategory,
  originalQuantity: detail.originalQuantity,
  rentedQuantity: detail.rentedQuantity,
  availableQuantity: detail.availableQuantity,
  utilizationRate: detail.utilizationRate,
  isAvailable: detail.isAvailable,
  quantity: detail.originalQuantity // Backward compatibility
})) || data.sizes,

// Add inventoryStatus
inventoryStatus: data.inventoryStatus
```

#### Phase 2: Component Interface (30 mins)
**File**: `features/homepage/components/SizeDetailCard.tsx`

```typescript
interface EnhancedSizeItem {
  size: string
  ageCategory: string
  quantity: number // Legacy support
  originalQuantity?: number
  rentedQuantity?: number
  availableQuantity?: number
  utilizationRate?: number
  isAvailable?: boolean
}

interface SizeDetailCardProps {
  sizes: EnhancedSizeItem[]
  inventoryStatus?: {
    totalOriginal: number
    totalAvailable: number
    totalRented: number
    utilizationRate: number
    isHealthy: boolean
  }
  // ... other props
}
```

#### Phase 3: Display Logic (2 hours)
**File**: `features/homepage/components/SizeDetailCard.tsx`

```typescript
// Enhanced display with breakdown
const displayQuantity = size.availableQuantity ?? size.quantity
const originalQty = size.originalQuantity ?? size.quantity
const rentedQty = size.rentedQuantity ?? 0
const utilization = size.utilizationRate ?? 0

return (
  <div className="space-y-2">
    {/* Availability Info */}
    <div className="flex justify-between items-center">
      <span className="font-medium">
        {displayQuantity} dari {originalQty} pcs tersedia
      </span>
      <Badge variant={displayQuantity > 0 ? "success" : "destructive"}>
        {displayQuantity > 0 ? "Tersedia" : "Habis"}
      </Badge>
    </div>
    
    {/* Rented Info */}
    {rentedQty > 0 && (
      <div className="text-sm text-orange-600">
        {rentedQty} sedang disewa
      </div>
    )}
    
    {/* Utilization Progress */}
    <Progress value={utilization} className="h-2" />
    <div className="text-xs text-gray-500">
      {utilization.toFixed(0)}% utilization
    </div>
  </div>
)
```

#### Phase 4: Integration (30 mins)
**File**: `features/homepage/components/ProductDetailPage.tsx`

```typescript
<SizeDetailCard
  sizes={product.enhancedSizes} // Use enhanced sizes
  inventoryStatus={product.inventoryStatus} // Pass inventory status
  title="Detail Ketersediaan Ukuran"
  showStats={true}
  showProgress={true}
  context="public"
/>
```

#### Phase 5: Testing (1 hour)
- Test with full stock (available = original)
- Test with partial stock (0 < available < original)
- Test with out of stock (available = 0)
- Test with legacy data (only quantity field)
- Validate responsive layout
- Check accessibility compliance

## 📊 Expected Outcome

### Before
```
┌─────────────────────────────────────┐
│ Dewasa - Size XL          [✓]      │
│                         6 pcs      │
└─────────────────────────────────────┘
```

### After
```
┌─────────────────────────────────────┐
│ Dewasa - Size XL          [⚠️]      │
│ 4 dari 6 pcs tersedia              │
│ 2 sedang disewa                    │
│ [████░░░░░░] 33% utilization       │
└─────────────────────────────────────┘
```

## ✅ Success Criteria

### Functional
- [x] Display originalQuantity, rentedQuantity, availableQuantity
- [x] Show utilization rate as percentage and progress bar
- [x] Visual differentiation for availability status
- [x] Backward compatibility with legacy data

### Performance
- [x] Component renders within 100ms
- [x] Smooth animations and transitions
- [x] Optimized re-renders with memoization

### Accessibility
- [x] WCAG 2.1 AA compliance
- [x] Screen reader support
- [x] Keyboard navigation
- [x] Proper ARIA attributes

### User Experience
- [x] 90%+ users can identify availability within 3 seconds
- [x] Clear visual hierarchy
- [x] Intuitive color coding
- [x] Responsive on all devices

## 🔗 Related Specs

- [Transaction Inventory Flow Analysis](../transaction-inventory-flow-analysis/analysis.md)
- [Product Transaction History Integration](../product-transaction-history-integration/requirements.md)

## 📝 Files to Modify

1. **features/homepage/hooks/usePublicProducts.ts**
   - Add `sizeDetails` mapping
   - Include `inventoryStatus`
   - Add backward compatibility

2. **features/homepage/components/SizeDetailCard.tsx**
   - Extend interface with enhanced fields
   - Implement enhanced display logic
   - Add progress bars and indicators
   - Add responsive styling

3. **features/homepage/components/ProductDetailPage.tsx**
   - Update to use `enhancedSizes`
   - Pass `inventoryStatus` prop
   - Test integration

## 🧪 Testing Checklist

### Unit Tests
- [ ] Hook transformation with sizeDetails
- [ ] Hook transformation with legacy data
- [ ] Component rendering with enhanced fields
- [ ] Component rendering with legacy fields
- [ ] Statistics calculation
- [ ] Utilization rate calculation

### Integration Tests
- [ ] API → Hook → Component data flow
- [ ] Backward compatibility with legacy data
- [ ] Responsive layout on different screen sizes
- [ ] Accessibility compliance

### Manual Tests
- [ ] Visual inspection on mobile
- [ ] Visual inspection on tablet
- [ ] Visual inspection on desktop
- [ ] Screen reader testing
- [ ] Keyboard navigation testing

## 🚨 Common Pitfalls

1. **Don't forget backward compatibility**
   - Always provide fallback for missing enhanced fields
   - Use `??` operator for safe defaults

2. **Don't break existing functionality**
   - Keep legacy `quantity` field in interface
   - Ensure component works with both old and new data

3. **Don't ignore performance**
   - Use `React.useMemo` for statistics calculation
   - Use `React.memo` for individual size items

4. **Don't skip accessibility**
   - Add proper ARIA labels
   - Ensure keyboard navigation works
   - Test with screen reader

## 💡 Tips

1. **Start with hook transformation**
   - This is the foundation for everything else
   - Test thoroughly before moving to component

2. **Use TypeScript strictly**
   - Define proper interfaces
   - Use optional chaining and nullish coalescing
   - Avoid `any` types

3. **Test with real data**
   - Use the example from `docs/error.md`
   - Test all edge cases (full, partial, empty stock)

4. **Follow existing patterns**
   - Look at how other components handle similar data
   - Maintain consistency with design system

## 📞 Support

If you encounter issues during implementation:

1. Review the [analysis.md](./analysis.md) for detailed problem breakdown
2. Check [DIAGRAMS.md](./DIAGRAMS.md) for visual reference
3. Refer to [requirements.md](./requirements.md) for acceptance criteria
4. Look at existing inventory components for patterns

## 🎉 Benefits

After implementation:

1. **Better User Experience**
   - Clear availability information
   - Visual utilization indicators
   - Better decision making

2. **Reduced Customer Service Load**
   - Fewer questions about availability
   - Less manual confirmation needed

3. **Improved Trust**
   - Accurate information builds confidence
   - Transparent inventory status

4. **Better Business Insights**
   - Utilization rate visibility
   - Inventory health monitoring
   - Data-driven decisions

## 📅 Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| Phase 1 | 1 hour | Hook enhancement |
| Phase 2 | 30 mins | Component interface |
| Phase 3 | 2 hours | Display logic |
| Phase 4 | 30 mins | Integration |
| Phase 5 | 1 hour | Testing |
| **Total** | **4-6 hours** | Complete implementation |

## 🏁 Getting Started

Ready to implement? Follow these steps:

1. ✅ Read [SUMMARY.md](./SUMMARY.md) for quick overview
2. ✅ Review [analysis.md](./analysis.md) for detailed understanding
3. ✅ Check [DIAGRAMS.md](./DIAGRAMS.md) for visual reference
4. ✅ Start with Phase 1 (Hook Enhancement)
5. ✅ Test each phase before moving to next
6. ✅ Complete all phases and testing
7. ✅ Deploy and monitor

Good luck! 🚀
