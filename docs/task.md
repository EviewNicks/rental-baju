# Product History Activity Component - Task Plan

**Project Code:** RPK-46-HISTORY-PRODUCER  
**Feature:** Producer Role - Product History Activity Timeline  
**Priority:** Medium  
**Estimated Duration:** 3-5 working days  
**Status:** Planning Complete - Ready for Implementation  

---

## 📋 Executive Summary

**Objective:** Replace `SystemInfoCard.tsx` with a simple Product History Activity timeline component that displays rental history, customer information, and revenue totals for individual products.

> **⚡ Keep It Simple Principle**: This component focuses on basic timeline display and revenue tracking only. No advanced analytics or complex dashboards.

**Business Value:**
- Simple rental history timeline for Producer dashboard
- Clear revenue tracking per transaction (including penalties)  
- Basic customer information display for rental context
- Clean replacement for existing system info display

---

## 🎯 Requirements Analysis

### **Functional Requirements**

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-01 | Display all transactions using specific product | HIGH | ✅ Defined |
| FR-02 | Show chronological timeline (newest first) | HIGH | ✅ Defined |
| FR-03 | Calculate revenue per transaction including penalties | HIGH | ✅ Defined |
| FR-04 | Display complete rental history since product creation | MEDIUM | ✅ Defined |
| FR-05 | Implement basic pagination for performance | MEDIUM | ✅ Defined |
| FR-06 | Maintain simple, clean UI design | HIGH | ✅ Defined |

### **Non-Functional Requirements**

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| NFR-01 | Performance | Page load < 2 seconds with 100+ history items |
| NFR-02 | Responsive Design | Works on mobile, tablet, desktop viewports |
| NFR-03 | Data Accuracy | 100% accurate revenue calculations with audit trail |
| NFR-04 | Code Quality | TypeScript strict mode, 0 linting errors |
| NFR-05 | Maintainability | Follows existing codebase patterns and conventions |

---

## 🎨 Visual Guide & UI Layout

### **Timeline Entry Format**
```
[Date] | [Transaction Code] | [Customer Name (Masked)] | [Revenue Total]
```

**Example Display:**
```
📅 15 Nov 2024  •  TRX-001  •  John D. (081****567)  •  Rp 150,000
📅 10 Nov 2024  •  TRX-002  •  Sarah M. (082****123)  •  Rp 200,000 (+25,000 penalty)
📅 05 Nov 2024  •  TRX-003  •  Ahmad F. (083****789)  •  Rp 180,000
```

### **Simple Layout Structure**
```
┌─────────────────────────────────────────┐
│           Product History               │
├─────────────────────────────────────────┤
│ 📅 Recent Transactions                  │
│ ├─ TRX-001 | John D. | Rp 150,000      │
│ ├─ TRX-002 | Sarah M.| Rp 225,000      │
│ └─ TRX-003 | Ahmad F.| Rp 180,000      │
│                                         │
│ [<< Previous] [Page 1/3] [Next >>]     │
└─────────────────────────────────────────┘
```

### **Key UI Principles**
- **Minimal Design**: Clean timeline without complex cards
- **Essential Info Only**: Date, customer, transaction code, revenue
- **Simple Navigation**: Basic pagination controls
- **Privacy Compliant**: Masked phone numbers for Producer role

---

## 🏗️ Technical Architecture

### **System Context**
```
[Producer Dashboard] → [Product Detail] → [ProductHistoryActivity] → [API] → [Database]
```

### **Data Flow Architecture**
```typescript
// Data Chain
Product → TransaksiItem → Transaksi → Penyewa
                     ↓
              TransaksiItemReturn (penalties)
                     ↓  
                  Pembayaran (payments)
```

### **Simplified Component Hierarchy**
```
ProductHistoryCard/              # Main replacement for SystemInfoCard
├── HistoryTimeline             # Simple timeline display
├── TimelineItem                # Individual entry (date, customer, revenue)
├── PaginationControls          # Basic prev/next buttons
└── EmptyState                  # "No rental history" message
```

> **Simplified Approach**: No complex sub-components like separate RevenuDisplay or CustomerInfo panels. All data integrated into simple TimelineItem.

---

## 📊 Data Model Specifications

### **Core Interfaces**

```typescript
// ⚡ SIMPLIFIED DATA MODEL - Essential Fields Only
interface ProductHistoryItem {
  // Core Identity
  id: string
  transactionCode: string
  
  // Timeline Information
  transactionDate: Date       // Rental transaction date
  rentalStart: Date
  rentalEnd: Date | null
  
  // Customer Data (Privacy-Compliant)
  customerName: string
  customerContact: string     // Masked: "081****567"
  
  // Financial Data (Simple Revenue Display)
  baseRevenue: number         // TransaksiItem.subtotal
  penaltyAmount: number       // Total penalties (if any)
  totalRevenue: number        // baseRevenue + penaltyAmount
  
  // Basic Meta
  status: string              // Transaction status
  itemQuantity: number        // Number of items rented
}

// ⚡ SIMPLIFIED RESPONSE - No Complex Analytics
interface ProductHistoryResponse {
  data: ProductHistoryItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  // ❌ REMOVED: Complex summary analytics
}

interface HistoryQueryParams {
  productId: string
  page?: number
  limit?: number              // Default: 10 per page
  // ❌ REMOVED: Complex sorting options
}
```

---

## 🔧 Implementation Roadmap

### **Phase 1: Backend API Development** ⏱️ Day 1-2

#### **Task 1.1: API Endpoint Creation** ✅ COMPLETED
- **File:** `app/api/products/[id]/history/route.ts`
- **Responsibility:** Handle GET requests with pagination and sorting
- **Dependencies:** Prisma client, existing auth middleware

#### **Task 1.2: Service Layer Implementation** ✅ COMPLETED  
- **File:** `features/manage-product/services/productHistoryService.ts`
- **Responsibility:** Business logic for data aggregation and transformation
- **Key Functions:**
  - `getProductHistory(productId, params)` - Main data fetcher
  - `calculateRevenueBreakdown(transactionItems)` - Revenue calculation
  - `maskCustomerData(customerInfo, role)` - Privacy compliance

#### **Task 1.3: Database Query Optimization**
- **Focus:** Efficient joins and indexing strategy
- **Prisma Queries:** Complex JOIN operations across multiple tables
- **Performance:** Query execution < 500ms for 1000+ records

### **Phase 2: Frontend Type System** ⏱️ Day 1

#### **Task 2.1: Type Definitions** ✅ COMPLETED
- **File:** `features/manage-product/types/productHistory.ts`
- **Includes:** All interfaces, enums, API response types
- **Validation:** TypeScript strict mode compliance

### **Phase 3: Component Development** ⏱️ Day 2-3

#### **Task 3.1: Main Component Creation** ✅ COMPLETED
- **File:** `features/manage-product/components/product-detail/ProductHistoryCard.tsx`
- **Pattern:** Follow `ActivityTimeline.tsx` UI structure
- **Features:** Timeline display, revenue calculation, customer info masking

#### **Task 3.2: React Query Hook** 🔄 IN PROGRESS
- **File:** `features/manage-product/hooks/useProductHistory.ts`
- **Responsibility:** Data fetching, caching, pagination state management
- **Integration:** React Query with automatic retry and error handling

#### **Task 3.3: Simple Sub-Components** ⚡ SIMPLIFIED
- **TimelineItem.tsx** - Single timeline entry with all data integrated
- **PaginationControls.tsx** - Basic prev/next navigation only
- ❌ **REMOVED**: Separate RevenuDisplay, CustomerInfo components (keep it simple)

### **Phase 4: Integration & Testing** ⏱️ Day 4

#### **Task 4.1: Component Integration** ⏳ PENDING
- **Target:** Replace `SystemInfoCard` in product detail page
- **File:** Update import and usage in product detail container
- **Testing:** Verify proper prop passing and data flow

#### **Task 4.2: End-to-End Testing** ⏳ PENDING
- **Scope:** Complete data flow validation
- **Test Cases:** API response, component rendering, pagination
- **Performance:** Verify load times and smooth user experience

---

## 🧪 Simplified Testing Strategy ⚡ BASIC APPROACH

### **Essential Testing Only**

| Test Level | Focus | Validation Method |
|---|---|---|
| **Basic Unit Tests** | Core component renders | Simple render testing |
| **Manual Testing** | User flows | Browser validation |
| **API Validation** | Data retrieval | Postman/manual API calls |

### **Core Test Scenarios** ⚡ SIMPLIFIED

#### **Must-Have Validation**
- ✅ Component renders without crashing
- ✅ Displays transaction data correctly
- ✅ Pagination works (prev/next buttons)
- ✅ Customer phone numbers are masked
- ✅ Revenue totals calculate properly
- ✅ Empty state shows when no data

#### **Manual User Testing**
- Producer can view product rental history
- Timeline shows in chronological order
- Revenue includes penalty amounts
- Pagination navigates correctly

---

## 📁 File Structure & Organization

### **New Files Created**
```
📂 app/api/products/[id]/history/
├── 📄 route.ts                           ✅ API endpoint

📂 features/manage-product/
├── 📂 components/product-detail/
│   ├── 📄 ProductHistoryCard.tsx         ✅ Main component  
│   └── 📄 SystemInfoCard.tsx             🔄 TO BE REPLACED
├── 📂 hooks/
│   └── 📄 useProductHistory.ts           🔄 IN PROGRESS
├── 📂 services/
│   └── 📄 productHistoryService.ts       ✅ Business logic
└── 📂 types/
    └── 📄 productHistory.ts              ✅ Type definitions
```

### **Modified Files**
```
📂 features/manage-product/
├── 📄 api.ts                             🔄 Add history endpoint
└── 📂 components/product-detail/
    └── 📄 [container-component].tsx      ⏳ Update imports
```

---

## 🎯 Success Criteria & Acceptance Tests

### **Definition of Done**

| Criteria | Validation Method | Status |
|---|---|---|
| **Functional Completeness** | All FR requirements implemented | 🔄 In Progress |
| **UI/UX Quality** | Matches ActivityTimeline.tsx pattern | 🔄 In Progress |
| **Performance Standards** | Page load < 2 seconds | ⏳ Pending Test |
| **Data Accuracy** | Revenue calculations validated | ⏳ Pending Test |
| **Code Quality** | Zero TypeScript/ESLint errors | ⏳ Pending Test |
| **Browser Compatibility** | Works on Chrome, Firefox, Safari | ⏳ Pending Test |

### **Acceptance Test Cases**

#### **Primary User Journey**
1. **Given:** Producer accesses product detail page
2. **When:** Product has rental history  
3. **Then:** Timeline displays all transactions chronologically
4. **And:** Revenue totals are accurate and prominently displayed
5. **And:** Customer information is properly masked for privacy

#### **Edge Cases**
- **No History:** Shows appropriate empty state message
- **Large Dataset:** Pagination works smoothly without performance issues  
- **Revenue Accuracy:** Complex penalty calculations are correct
- **Privacy Compliance:** Customer data masking follows Producer role permissions

---

## 📈 Performance & Optimization Notes

### **Database Optimization**
- Utilize existing indexes: `[produkId]`, `[transaksiId]`, `[createdAt]`
- Single query with complex JOINs instead of multiple API calls
- Implement pagination at database level for memory efficiency

### **Frontend Optimization**  
- React Query caching reduces redundant API calls
- Component memoization for stable render performance
- Lazy loading for large datasets (if needed in future)

### **Bundle Size Impact**
- Reuse existing components and utilities
- Minimal new dependencies (leverage existing React Query)
- Estimated bundle increase: < 15KB gzipped

---

---

# 📋 APPENDIX: Future Enhancements (Phase 2 ONLY)

> ⚠️ **IMPORTANT**: These features are NOT part of current implementation. Only implement after core timeline functionality is complete and validated.

## 🔄 Future Enhancement Opportunities

### **Phase 2 Features (Future Sprint)**
> **DO NOT IMPLEMENT NOW** - These are for future consideration only

- **Advanced Filtering:** Date range, customer search, transaction status
- **Export Functionality:** CSV/PDF export for business reporting  
- **Revenue Analytics:** Charts and trend analysis
- **Search Integration:** Customer name and transaction code search
- **Real-time Updates:** Live updates when transactions change

### **Phase 3 Technical Improvements** 
> **Advanced Features** - Only after Phase 2 completion

- **Caching Strategy:** Redis caching for frequently accessed histories
- **Infinite Scroll:** Replace basic pagination 
- **Data Visualization:** Revenue trend charts and analytics dashboard
- **Bulk Operations:** Multi-product analysis capabilities

### **Scope Creep Prevention**
- ❌ **Do not implement analytics during core development**
- ❌ **Do not add search functionality in MVP**
- ❌ **Do not create complex revenue dashboards**
- ✅ **Focus on simple timeline display only**

---

## 📚 References & Dependencies

### **Technical References**
- **UI Pattern:** `features/kasir/components/detail/ActivityTimeline.tsx`
- **Database Schema:** `prisma/schema.prisma` (TransaksiItem, Transaksi, Penyewa)
- **API Patterns:** Existing product management API endpoints
- **Type Patterns:** `features/manage-product/types/index.ts`

### **External Dependencies**
- **No New Dependencies Required** - leverages existing tech stack
- **React Query:** Already in use for data fetching
- **TailwindCSS:** Existing styling system  
- **Lucide React:** Icon library already implemented

---

## ✅ Implementation Status Summary

| Phase | Progress | Completion Date | Notes |
|---|---|---|---|
| **Planning** | ✅ 100% | 2025-01-03 | Requirements analysis complete |
| **API Development** | ✅ 100% | - | Endpoint and service layer ready |  
| **Type System** | ✅ 100% | - | All interfaces defined |
| **Component Creation** | ✅ 90% | - | Main component built, hook in progress |
| **Integration** | ⏳ 0% | - | Awaiting component completion |
| **Testing & QA** | ⏳ 0% | - | Ready for test execution |

**Overall Progress:** 60% Complete ⚡ REALISTIC  
**Ready for:** Final hook implementation and integration phase  
**Estimated Completion:** 2-3 additional working days (allowing integration complexity)

---

*This task plan serves as the comprehensive specification and implementation guide for the Product History Activity component. All technical requirements, architectural decisions, and quality standards are documented for consistent execution and future maintenance.*