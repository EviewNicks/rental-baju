# Return Penalty Integration & Activity Logging Enhancement

## Spec Overview

This specification addresses critical gaps in the return service system related to activity logging, penalty payment tracking, and penalty visibility across the application.

## Problem Statement

### Current Issues

1. **Activity Logging Duplication** (docs/error.md)
   - Creates 3 separate activities per return
   - Duplicate information across activities
   - No detailed breakdown per item/condition
   - Inconsistent data structure

2. **Penalty Payment Isolation** (docs/evaluation.md)
   - Penalties not integrated with dana kasir
   - No payment record for penalties
   - Dana summary doesn't include penalty income
   - No audit trail for penalty charges

3. **Penalty Visibility Gap**
   - Product history doesn't show penalty information
   - No breakdown by condition
   - Missing penalty analytics

## Solution Summary

### 1. Unified Activity Logging
- **Before**: 3 activities (dikembalikan, penalty_added, status_changed)
- **After**: 1 comprehensive activity with full breakdown
- **Benefit**: -66% database writes, better data structure

### 2. Penalty Payment Integration
- **Before**: Penalty stored only in TransaksiItem.totalReturnPenalty
- **After**: Pembayaran record with metode='penalty' + breakdown
- **Benefit**: Proper financial tracking, audit trail, dana kasir integration

### 3. Enhanced Penalty Visibility
- **Before**: No penalty info in product history or dana kasir
- **After**: Penalty displayed everywhere with detailed breakdown
- **Benefit**: Better transparency, analytics, reporting

## Key Design Decisions

1. **Single Comprehensive Activity**
   ```json
   {
     "tipe": "dikembalikan",
     "data": {
       "summary": { totalPenalty, latePenalty, conditionPenalty, ... },
       "items": [{ itemId, productName, sizeInfo, conditions: [...] }],
       "metadata": { processingMode, processingTime, statusChange }
     }
   }
   ```

2. **Penalty as Payment Record**
   ```typescript
   await prisma.pembayaran.create({
     data: {
       metode: 'penalty',
       jumlah: totalPenalty,
       penaltyBreakdown: { latePenalty, conditionPenalty, itemPenalties }
     }
   })
   ```

3. **Backward Compatible**
   - No data migration required
   - Old records work with new code
   - Graceful degradation for missing data

## Implementation Phases

### Phase 1: Core Service Layer (Week 1)
- Database migration (add penaltyBreakdown to Pembayaran)
- Unified activity logging
- Penalty payment creation
- 6 property tests

### Phase 2: Dana Kasir Integration (Week 2)
- Dana summary includes penalties
- Income list with penalty entries
- Dashboard UI updates
- 4 property tests

### Phase 3: Product History Enhancement (Week 2)
- API includes penalty data
- UI displays penalty info
- 3 property tests

### Phase 4: Testing & Optimization (Week 3)
- Backward compatibility
- Performance optimization
- Error handling
- 8 property tests

## Testing Strategy

### Property-Based Testing
- **Framework**: fast-check
- **Coverage**: 21 properties (optional for MVP)
- **Iterations**: 100 per property
- **Tag Format**: `// Feature: return-penalty-integration, Property N: Description`

### Key Properties
1. Single Activity Creation (Req 1.1)
2. Activity Data Completeness (Req 1.2)
3. Penalty Payment Creation (Req 2.1)
4. Transaction Atomicity (Req 2.6, 2.7)
5. Dana Summary Includes Penalties (Req 3.1)
6. Product History Penalty Inclusion (Req 4.1, 4.2)

## Files Structure

```
.kiro/specs/return-penalty-integration/
├── README.md           # This file
├── requirements.md     # 10 requirements, 70 acceptance criteria
├── design.md          # Architecture, interfaces, 28 properties
└── tasks.md           # 17 tasks, 41 subtasks, 4 phases
```

## Success Criteria

### Functional
- ✅ Single activity per return with full breakdown
- ✅ Penalty payment record created for all penalties
- ✅ Dana kasir shows penalty income
- ✅ Product history displays penalty info

### Performance
- ✅ Activity creation < 100ms
- ✅ Return processing increase < 10%
- ✅ Dana summary query < 500ms

### Quality
- ✅ All 28 correctness properties pass
- ✅ 100% backward compatibility
- ✅ Zero data migration required

## Getting Started

### For Developers

1. **Read Requirements**: Start with `requirements.md` to understand the problem
2. **Review Design**: Read `design.md` for architecture and interfaces
3. **Follow Tasks**: Execute tasks in `tasks.md` sequentially
4. **Run Tests**: Ensure all tests pass at each checkpoint

### For Reviewers

1. **Verify Requirements**: Check all acceptance criteria are testable
2. **Review Design**: Validate architecture decisions
3. **Assess Tasks**: Ensure tasks cover all requirements
4. **Check Properties**: Verify property tests validate requirements

## Related Documents

- **Analysis**: `docs/analyze.md` - Detailed problem analysis
- **Error Example**: `docs/error.md` - Current activity duplication
- **Evaluation**: `docs/evaluation.md` - Dana kasir missing penalties
- **Current Implementation**: 
  - `features/kasir/services/returnService.ts`
  - `features/dana-kasir/services/danaSummaryService.ts`
  - `features/manage-product/components/product-detail/ProductHistoryCard.tsx`

## Questions or Issues?

If you have questions about this spec:
1. Check the requirements document for detailed acceptance criteria
2. Review the design document for implementation details
3. Look at the analysis document for problem context
4. Ask the team for clarification

## Status

- **Created**: 2024-12-04
- **Status**: Ready for Implementation
- **Priority**: High
- **Estimated Effort**: 3 weeks
- **Dependencies**: None
