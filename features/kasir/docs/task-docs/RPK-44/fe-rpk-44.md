# FE-RPK-44: Frontend Enhancement for Return System Display

**Parent Task**: RPK-44 - Enhance Transaction Detail UI for Return System Display  
**Phase**: A (ProductDetailCard) + B (ActivityTimeline)  
**Type**: Frontend Development  
**Priority**: <¯ **HIGH** - Phase A Ready, Phase B Blocked

## <¯ **Task Overview**

**Objective**: Enhance transaction detail UI components to display comprehensive return system information, making return data accessible and user-friendly for kasir operators.

**Context**: Backend return system (TSK-24) provides complete return data structure. Phase A can proceed with available data, Phase B requires backend API fixes from be-rpk-44.md.

**Status**: 
- **Phase A** (ProductDetailCard):  **READY TO START** - Data Available
- **Phase B** (ActivityTimeline): =« **BLOCKED** - Waiting for be-rpk-44.md completion

---

## =Ë **Implementation Phases**

### **Phase A: ProductDetailCard Enhancement**  **Ready to Proceed**

#### **Available Data Structure**
From API analysis (`features/kasir/docs/analyze.md`), the following return data is available:

```typescript
interface ReturnData {
  totalReturnPenalty: number           // Total penalty amount
  conditionBreakdown: Array<{
    id: string
    kondisiAkhir: string              // "kotor", "rusak ringan", etc.
    jumlahKembali: number             // Quantity returned in this condition
    penaltyAmount: number             // Penalty for this condition
    modalAwalUsed: number | null      // Original price used for calculation
    createdAt: string
    createdBy: string
  }>
  statusKembali: string               // "lengkap", "sebagian", "belum"
  kondisiAkhir: string                // Overall final condition
}
```

#### **UI Components to Implement**

##### **1. Return Status Badge** ñ **2-3 hours**

```typescript
// File: features/kasir/components/detail/ProductDetailCard.tsx
interface ReturnStatusBadgeProps {
  status: 'lengkap' | 'sebagian' | 'belum'
  hasReturnData: boolean
}

const ReturnStatusBadge: React.FC<ReturnStatusBadgeProps> = ({ status, hasReturnData }) => {
  if (!hasReturnData) return null

  const statusConfig = {
    lengkap: {
      variant: 'success' as const,
      text: 'Dikembalikan Lengkap',
      icon: CheckCircle,
      color: 'text-green-700',
      bgColor: 'bg-green-50 border-green-200'
    },
    sebagian: {
      variant: 'warning' as const,
      text: 'Dikembalikan Sebagian',
      icon: Clock,
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50 border-yellow-200'
    },
    belum: {
      variant: 'secondary' as const,
      text: 'Belum Dikembalikan',
      icon: AlertCircle,
      color: 'text-gray-700',
      bgColor: 'bg-gray-50 border-gray-200'
    }
  }

  const config = statusConfig[status] || statusConfig.belum
  const IconComponent = config.icon

  return (
    <div className={`${config.bgColor} border rounded-lg p-3 mb-4`}>
      <div className="flex items-center gap-2">
        <IconComponent className={`h-4 w-4 ${config.color}`} />
        <span className={`text-sm font-medium ${config.color}`}>
          Status Pengembalian
        </span>
        <Badge variant={config.variant}>{config.text}</Badge>
      </div>
    </div>
  )
}
```

##### **2. Condition Breakdown Display** ñ **3-4 hours**

```typescript
// Multi-condition return visualization
interface ConditionBreakdownProps {
  conditionBreakdown?: Array<{
    id: string
    kondisiAkhir: string
    jumlahKembali: number
    penaltyAmount: number
    modalAwalUsed: number | null
  }>
  isMultiCondition: boolean
}

const ConditionBreakdown: React.FC<ConditionBreakdownProps> = ({ 
  conditionBreakdown, 
  isMultiCondition 
}) => {
  if (!conditionBreakdown?.length) return null

  const conditionLabels: Record<string, { text: string; color: string; severity: 'low' | 'medium' | 'high' }> = {
    baik: { text: 'Baik', color: 'text-green-600', severity: 'low' },
    kotor: { text: 'Kotor', color: 'text-yellow-600', severity: 'medium' },
    'rusak ringan': { text: 'Rusak Ringan', color: 'text-orange-600', severity: 'medium' },
    'rusak berat': { text: 'Rusak Berat', color: 'text-red-600', severity: 'high' },
    hilang: { text: 'Hilang', color: 'text-red-800', severity: 'high' }
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Package className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-900">
          Detail Kondisi Pengembalian
        </span>
        {isMultiCondition && (
          <Badge variant="outline" className="text-xs">Multi-Kondisi</Badge>
        )}
      </div>
      
      <div className="space-y-2">
        {conditionBreakdown.map((condition, idx) => {
          const conditionConfig = conditionLabels[condition.kondisiAkhir.toLowerCase()] || {
            text: condition.kondisiAkhir,
            color: 'text-gray-600',
            severity: 'low' as const
          }
          
          return (
            <div key={condition.id || idx} 
                 className="flex items-center justify-between py-2 px-3 bg-white rounded-md border">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full bg-current ${conditionConfig.color}`} />
                <span className={`text-sm font-medium ${conditionConfig.color}`}>
                  {conditionConfig.text}
                </span>
                <span className="text-xs text-gray-500">
                  {condition.jumlahKembali} item{condition.jumlahKembali > 1 ? 's' : ''}
                </span>
              </div>
              
              {condition.penaltyAmount > 0 && (
                <div className="text-right">
                  <span className="text-sm font-medium text-red-600">
                    {formatCurrency(condition.penaltyAmount)}
                  </span>
                  <div className="text-xs text-gray-500">denda</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

##### **3. Penalty Information Display** ñ **2 hours**

```typescript
// Penalty summary and breakdown
interface PenaltyInfoProps {
  totalReturnPenalty: number
  conditionBreakdown?: Array<{
    kondisiAkhir: string
    penaltyAmount: number
    modalAwalUsed: number | null
  }>
}

const PenaltyInfo: React.FC<PenaltyInfoProps> = ({ 
  totalReturnPenalty, 
  conditionBreakdown 
}) => {
  if (totalReturnPenalty <= 0) return null

  const penaltyConditions = conditionBreakdown?.filter(c => c.penaltyAmount > 0) || []
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <span className="text-sm font-medium text-red-900">
          Informasi Denda Pengembalian
        </span>
      </div>
      
      {penaltyConditions.length > 0 && (
        <div className="space-y-2 mb-3">
          {penaltyConditions.map((condition, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-red-700">
                Denda {condition.kondisiAkhir.toLowerCase()}:
              </span>
              <span className="font-medium text-red-800">
                {formatCurrency(condition.penaltyAmount)}
              </span>
            </div>
          ))}
        </div>
      )}
      
      <div className="pt-3 border-t border-red-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-red-900">
            Total Denda:
          </span>
          <span className="text-lg font-bold text-red-800">
            {formatCurrency(totalReturnPenalty)}
          </span>
        </div>
      </div>
    </div>
  )
}
```

#### **Integration into ProductDetailCard** ñ **1-2 hours**

```typescript
// Updated ProductDetailCard component
const ProductDetailCard: React.FC<ProductDetailCardProps> = ({ item }) => {
  // Existing props and logic...
  
  // Return data detection
  const hasReturnData = Boolean(
    item.conditionBreakdown?.length || 
    item.totalReturnPenalty || 
    item.statusKembali
  )
  
  const isMultiCondition = Boolean(
    item.conditionBreakdown && item.conditionBreakdown.length > 1
  )

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Existing product information */}
      
      {/* Return Status Section - NEW */}
      {hasReturnData && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <ReturnStatusBadge 
            status={item.statusKembali as 'lengkap' | 'sebagian' | 'belum'} 
            hasReturnData={hasReturnData}
          />
          
          <ConditionBreakdown
            conditionBreakdown={item.conditionBreakdown}
            isMultiCondition={isMultiCondition}
          />
          
          <PenaltyInfo
            totalReturnPenalty={item.totalReturnPenalty || 0}
            conditionBreakdown={item.conditionBreakdown}
          />
        </div>
      )}
    </div>
  )
}
```

---

### **Phase B: ActivityTimeline Enhancement** =« **BLOCKED - Requires be-rpk-44.md**

#### **Prerequisites from Backend (be-rpk-44.md)**
- Return activity creation (`dikembalikan` activity type)
- Penalty activity logging (`penalty_added` activity type)  
- Activity type mapping updates in `useTransactionDetail.ts`

#### **Implementation Plan (Post-Backend Fixes)**

##### **1. Activity Type Mapping Update** ñ **30 minutes**

```typescript
// File: features/kasir/hooks/useTransactionDetail.ts
// Update mapActivityTypeToAction function (lines 282-296)

function mapActivityTypeToAction(
  activityType: string,
): 'created' | 'paid' | 'picked_up' | 'returned' | 'overdue' | 'reminder_sent' | 'penalty_added' | 'return_completed' {
  const mapping: Record<string, ActivityAction> = {
    dibuat: 'created',
    dibayar: 'paid', 
    diambil: 'picked_up',
    dikembalikan: 'returned',          // <• NEW - Return activity
    penalty_added: 'penalty_added',    // <• NEW - Penalty activity
    penalty_diterapkan: 'penalty_added', // <• NEW - Penalty alias
    pengembalian_selesai: 'return_completed', // <• NEW - Return completion
    terlambat: 'overdue',
    dibatalkan: 'penalty_added'
  }

  return mapping[activityType] || 'created'
}

// Update TypeScript type definition
type ActivityAction = 'created' | 'paid' | 'picked_up' | 'returned' | 'overdue' | 
                     'reminder_sent' | 'penalty_added' | 'return_completed'
```

##### **2. ActivityTimeline Return Event Display** ñ **4-5 hours**

```typescript
// File: features/kasir/components/detail/ActivityTimeline.tsx
// Enhanced timeline entry for return events

const ActivityTimelineEntry: React.FC<ActivityEntryProps> = ({ activity }) => {
  // Existing activity display logic...
  
  // Return activity display
  if (activity.action === 'returned') {
    return (
      <div className="relative pb-6">
        <div className="flex items-start space-x-3">
          <div className="relative">
            <Package className="h-5 w-5 text-blue-600" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">
                Item Dikembalikan
              </h3>
              <span className="text-xs text-gray-500">
                {formatDateTime(activity.timestamp)}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mt-1">
              {activity.description}
            </p>
            
            {/* Return Details Expansion */}
            {activity.details && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-blue-900 mb-2">
                  Detail Pengembalian
                </div>
                
                {activity.details.conditions?.map((condition: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm text-blue-800 mb-1">
                    <span>{condition.kondisiAkhir}: {condition.jumlahKembali} item</span>
                    {condition.penaltyAmount > 0 && (
                      <span className="font-medium text-red-600">
                        Denda: {formatCurrency(condition.penaltyAmount)}
                      </span>
                    )}
                  </div>
                ))}
                
                {activity.details.totalPenalty > 0 && (
                  <div className="mt-2 pt-2 border-t border-blue-300">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Total Denda:</span>
                      <span className="text-red-600">
                        {formatCurrency(activity.details.totalPenalty)}
                      </span>
                    </div>
                  </div>
                )}
                
                {activity.details.itemsAffected && (
                  <div className="mt-2 text-xs text-blue-700">
                    Item: {activity.details.itemsAffected.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Penalty activity display
  if (activity.action === 'penalty_added') {
    return (
      <div className="relative pb-6">
        <div className="flex items-start space-x-3">
          <div className="relative">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">
                Denda Diterapkan
              </h3>
              <span className="text-xs text-gray-500">
                {formatDateTime(activity.timestamp)}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mt-1">
              {activity.description}
            </p>
            
            {/* Penalty Details */}
            {activity.details && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="text-sm font-medium text-red-900 mb-2">
                  Rincian Denda
                </div>
                
                {activity.details.penaltyBreakdown?.map((penalty: any, idx: number) => (
                  <div key={idx} className="mb-3 last:mb-0">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-red-800">
                        {penalty.produkName}
                      </span>
                      <span className="font-bold text-red-800">
                        {formatCurrency(penalty.penaltyAmount)}
                      </span>
                    </div>
                    
                    {penalty.conditions?.map((condition: any, condIdx: number) => (
                      <div key={condIdx} className="ml-4 mt-1 text-xs text-red-700 flex justify-between">
                        <span>{condition.kondisiAkhir}</span>
                        <span>{formatCurrency(condition.penaltyAmount)}</span>
                      </div>
                    ))}
                  </div>
                ))}
                
                <div className="mt-3 pt-3 border-t border-red-300">
                  <div className="flex justify-between text-sm font-bold text-red-900">
                    <span>Total Denda:</span>
                    <span>{formatCurrency(activity.details.totalPenalty)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Existing activity types...
  return null // or existing activity display
}
```

---

## =' **Files to Modify**

### **Phase A Files** (Ready to Proceed)
1. **`features/kasir/components/detail/ProductDetailCard.tsx`** 
   - Add return status indicators
   - Implement condition breakdown display
   - Show penalty information

### **Phase B Files** (Blocked until Backend Complete)
2. **`features/kasir/components/detail/ActivityTimeline.tsx`**
   - Enhance return event display
   - Add penalty activity visualization
   
3. **`features/kasir/hooks/useTransactionDetail.ts`**
   - Update activity type mapping
   - Add new activity action types

### **Supporting Files**
4. **`features/kasir/types/index.ts`**
   - Update TypeScript types for return data
   - Add ActivityAction type extensions

5. **`features/kasir/lib/utils/client.ts`** 
   - Add return-specific utility functions
   - Formatting helpers for return display

---

##  **Testing Strategy**

### **Phase A Testing** ñ **3-4 hours**

#### **Unit Tests**
```typescript
// features/kasir/components/detail/__tests__/ProductDetailCard.test.tsx
describe('ProductDetailCard Return Display', () => {
  it('should display return status badge when return data exists', () => {
    // Test return status display
  })

  it('should show condition breakdown for multi-condition returns', () => {
    // Test condition breakdown display  
  })

  it('should display penalty information correctly', () => {
    // Test penalty information display
  })

  it('should handle missing return data gracefully', () => {
    // Test fallback behavior
  })
})
```

#### **Integration Tests**
```typescript
// Test ProductDetailCard with actual API data
// Verify return data transformation and display
// Test responsive design across device sizes
```

### **Phase B Testing** ñ **2-3 hours** (Post-Backend)

#### **Timeline Tests**
```typescript
// features/kasir/components/detail/__tests__/ActivityTimeline.test.tsx
describe('ActivityTimeline Return Events', () => {
  it('should display return activities correctly', () => {
    // Test return activity display
  })

  it('should show penalty activities with details', () => {
    // Test penalty activity display
  })

  it('should handle activity type mapping correctly', () => {
    // Test activity type mapping
  })
})
```

---

## <¯ **Success Criteria**

### **Phase A Success Criteria**
-  Return status clearly visible in ProductDetailCard
-  Multi-condition returns properly displayed with breakdown
-  Penalty information accessible and understandable
-  Responsive design across device sizes
-  Graceful handling of missing return data
-  Type-safe implementation with proper TypeScript types

### **Phase B Success Criteria** (Post-Backend)
-  ActivityTimeline shows complete return process history
-  Return events display multi-condition details
-  Penalty activities show calculation breakdown
-  Activity type mapping handles all return events
-  UI updates reflect return activities accurately

### **Technical Requirements**
-  Performance: <100ms render time for return information
-  Accessibility: WCAG 2.1 AA compliance maintained  
-  Error handling for missing or incomplete return data
-  Comprehensive test coverage (>90% for new code)

---

## =Ê **Implementation Timeline**

### **Phase A: ProductDetailCard Enhancement** (Can Start Immediately)
| Task | Duration | Dependencies |
|------|----------|--------------|
| Return Status Badge | 2-3 hours | None |
| Condition Breakdown Display | 3-4 hours | None |
| Penalty Information Display | 2 hours | None |
| Integration into ProductDetailCard | 1-2 hours | Above components |
| Unit Testing | 3-4 hours | Implementation complete |
| **Phase A Total** | **11-15 hours** | **None**  |

### **Phase B: ActivityTimeline Enhancement** (Blocked)
| Task | Duration | Dependencies |
|------|----------|--------------|
| Activity Type Mapping Update | 30 min | be-rpk-44.md complete  |
| Return Event Display Implementation | 4-5 hours | Backend activity creation  |
| Integration Testing | 2-3 hours | Implementation complete |
| **Phase B Total** | **7-8.5 hours** | **be-rpk-44.md completion** =« |

### **Overall Frontend Total**: **18-23.5 hours**

---

## =¨ **Critical Dependencies**

### **Phase A (Independent)**
-  **No blockers** - Return data available in API responses
-  **Can start immediately** - ProductDetailCard can display existing data

### **Phase B (Blocked)**  
- =« **MUST wait for be-rpk-44.md completion**
- =« **Requires return activity creation** in backend
- =« **Needs penalty activity logging** implementation

---

## = **Integration Points**

### **Data Flow**
1. **API Response** ’ `useTransactionDetail` hook
2. **Hook transformation** ’ UI-ready data structure  
3. **Components** ’ Display return information
4. **Real-time updates** ’ After return processing

### **Type Safety**
```typescript
// Enhanced types for return system
interface TransactionItem {
  // Existing properties...
  
  // Return system additions
  statusKembali?: string
  totalReturnPenalty?: number
  conditionBreakdown?: Array<{
    id: string
    kondisiAkhir: string
    jumlahKembali: number
    penaltyAmount: number
    modalAwalUsed: number | null
  }>
  isMultiCondition?: boolean
}

interface ActivityDetail {
  // Existing properties...
  
  // Return activity additions
  conditions?: Array<{
    kondisiAkhir: string
    jumlahKembali: number
    penaltyAmount: number
  }>
  totalPenalty?: number
  itemsAffected?: string[]
  penaltyBreakdown?: Array<{
    itemId: string
    produkName: string
    penaltyAmount: number
    conditions: Array<{
      kondisiAkhir: string
      penaltyAmount: number
    }>
  }>
}
```

---

## =¡ **Implementation Notes**

### **Phase A Approach**
- **Progressive Enhancement**: Add return features without breaking existing functionality
- **Data-Driven**: Leverage existing API responses and data structures  
- **Component-First**: Enhance existing components without architectural changes
- **Type-Safe**: Maintain strict TypeScript compliance throughout

### **Phase B Coordination**
- **Backend Dependency**: Coordinate with be-rpk-44.md implementation
- **API Contract**: Ensure activity data structure matches frontend expectations
- **Testing Integration**: Plan integration testing after backend completion

### **Performance Considerations**
- **Conditional Rendering**: Only render return components when data exists
- **Memoization**: Use React.memo for return display components
- **Lazy Loading**: Consider lazy loading for complex return breakdowns

---

## =Ë **Definition of Done**

### **Phase A Complete When:**
- [ ] Return status badge displays correctly for all status types
- [ ] Multi-condition returns show detailed breakdown
- [ ] Penalty information is clearly visible and understandable
- [ ] Unit tests pass with >90% coverage
- [ ] Code review completed and approved
- [ ] Manual testing with actual return data verified
- [ ] Responsive design works across all device sizes
- [ ] Accessibility requirements met (WCAG 2.1 AA)

### **Phase B Complete When:**
- [ ] ActivityTimeline displays return events correctly
- [ ] Penalty activities show detailed breakdown
- [ ] Activity type mapping handles all return events
- [ ] Integration tests pass with backend activity data
- [ ] Performance requirements met (<100ms render)
- [ ] End-to-end testing with complete return flow verified

---

**Created**: 2025-08-12  
**Assignee**: Frontend Developer  
**Estimated Completion**: 
- **Phase A**: 2-3 working days  
- **Phase B**: 1-2 working days (after backend completion)
**Status**: 
- **Phase A**:  Ready to Start
- **Phase B**: =« Blocked (Dependencies: be-rpk-44.md)