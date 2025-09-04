# Project Task Documentation

This document contains task specifications for various development work in the rental management system.

---

# Task 1: Product History Activity Component (RPK-46)

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
  summary: {
    totalRevenue: number
    totalTransactions: number
    averageRentalDuration: number
  }
}
```

*This task plan serves as the comprehensive specification and implementation guide for the Product History Activity component. All technical requirements, architectural decisions, and quality standards are documented for consistent execution and future maintenance.*

---

# Task 2: Image Preview Fix

**Context:** Berdasarkan analysis di docs/analyze.md, telah diidentifikasi bahwa image preview gagal karena Next.js Image component tidak dapat menangani blob URLs dari FileReader.

**Request:** Implementasikan fix untuk local image preview di file features/manage-product/components/products/ImageUpload.tsx menggunakan Option 2 (conditional rendering approach) dari analysis report.

**Spesifikasi Implementation:**
1. Deteksi URL type: Tambahkan logic untuk detect blob/data URLs vs HTTP URLs
2. Conditional rendering: Gunakan <img> tag untuk blob URLs, <Image> component untuk saved images
3. Preserve existing functionality: Pastikan file upload ke Supabase tetap berfungsi
4. Maintain styling: Gunakan className yang sama untuk konsistensi visual

**Code Requirements:**
- Tambahkan variable isPreviewUrl untuk detect blob URLs
- Implement conditional rendering di preview section (lines 68-89)
- Preserve existing error handling dan file validation
- Maintain TypeScript type safety

**Acceptance Criteria:**
- Image preview muncul immediately setelah file selection
- No more blob URL errors di console
- File upload ke Supabase tetap berfungsi normal
- Visual styling tetap konsisten

**Testing Steps:**
1. Select image file → verify preview shows instantly
2. Submit form → verify upload to Supabase works
3. Check browser console → no blob URL errors
4. Test dengan different image formats (JPG, PNG, WebP)

**Expected Changes:** ~10 lines of code modification di ImageUpload.tsx