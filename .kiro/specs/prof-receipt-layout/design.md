# Design Document - Professional Receipt Layout

## Overview

The Professional Receipt Layout feature transforms the existing simple thermal receipt into a comprehensive, table-based professional document suitable for standard office printing. The design maintains the existing service-oriented architecture while introducing enhanced PDF generation capabilities with structured table layouts, professional branding, and comprehensive financial breakdowns.

The system generates PDF receipts in 14x20cm format (HVS paper) with bordered tables, company logo integration, and detailed transaction information that provides customers with complete, professional documentation of their rental transactions.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  TransactionDetailPage Component                       │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  "Cetak Struk Profesional" Button               │ │ │
│  │  │  - Loading State                                 │ │ │
│  │  │  - Click Handler                                 │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                      ↓                                  │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  useProfessionalReceiptPrint Hook               │ │ │
│  │  │  - State Management (isPrinting)                 │ │ │
│  │  │  - API Call Logic                                │ │ │
│  │  │  - Toast Notifications                           │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTP GET
┌─────────────────────────────────────────────────────────────┐
│                   Next.js API Layer                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  GET /api/kasir/receipt/[transaksiId]/pdf               │ │
│  │  - Authentication Check                                │ │
│  │  - Parameter Validation                                │ │
│  │  - Error Handling                                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  TransaksiService                                      │ │
│  │  - getTransaksiByCode()                                │ │
│  │  - Data Retrieval                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                              ↓                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ProfessionalReceiptService                            │ │
│  │  - generateProfessionalReceiptPDF()                    │ │
│  │  - addProfessionalHeader()                             │ │
│  │  - addTransactionInfoSection()                         │ │
│  │  - addItemsTable()                                     │ │
│  │  - addFinancialSummary()                               │ │
│  │  - addProfessionalFooter()                             │ │
│  │  - createBorderedTable()                               │ │
│  │  - formatCurrency()                                    │ │
│  │  - formatDate()                                        │ │
│  │  - extractSize()                                       │ │
│  │  - calculateDiscount()                                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   External Dependencies                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  jsPDF Library                                         │ │
│  │  - PDF Document Creation                               │ │
│  │  - Table Generation                                    │ │
│  │  - Border Rendering                                    │ │
│  │  - Image Integration                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  STORE_CONFIG (constants.ts)                           │ │
│  │  - Store Name: ERLIMA MODE                             │ │
│  │  - Store Address                                       │ │
│  │  - Store Phone                                         │ │
│  │  - Logo Path                                           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User Click "Cetak Struk Profesional"
        ↓
useProfessionalReceiptPrint.printReceipt(transactionId)
        ↓
setState(isPrinting: true)
        ↓
fetch('/api/kasir/receipt/[id]/pdf')
        ↓
API: requirePermission('transaksi', 'read')
        ↓
API: TransaksiService.getTransaksiByCode(id)
        ↓
API: ProfessionalReceiptService.generateProfessionalReceiptPDF(transaction)
        ↓
ProfessionalReceiptService: Create jsPDF instance (140x200mm)
        ↓
ProfessionalReceiptService: addProfessionalHeader() → Logo + Store info
        ↓
ProfessionalReceiptService: addTransactionInfoSection() → Transaction metadata
        ↓
ProfessionalReceiptService: addItemsTable() → Bordered table with items
        ↓
ProfessionalReceiptService: addFinancialSummary() → Sub total, discount, total
        ↓
ProfessionalReceiptService: addProfessionalFooter() → Keterangan + signature
        ↓
ProfessionalReceiptService: Return PDF Buffer
        ↓
API: Return Response with PDF buffer + headers
        ↓
Hook: Create blob URL from response
        ↓
Hook: window.open(url, '_blank')
        ↓
Hook: toast.success('Struk profesional berhasil dibuat')
        ↓
Hook: setState(isPrinting: false)
```

## Components and Interfaces

### 1. Frontend Components

#### TransactionDetailPage Component (Modified)
```typescript
// features/kasir/components/detail/TransactionDetailPage.tsx

interface TransactionDetailPageProps {
  transactionId: string
}

// Add to existing component:
// - Import useProfessionalReceiptPrint hook
// - Add "Cetak Struk Profesional" button in header
// - Handle button click with printProfessionalReceipt function
```

#### useProfessionalReceiptPrint Hook (New)
```typescript
// features/kasir/hooks/useProfessionalReceiptPrint.ts

interface UseProfessionalReceiptPrintReturn {
  printProfessionalReceipt: (transactionId: string) => Promise<void>
  isPrinting: boolean
}

export function useProfessionalReceiptPrint(): UseProfessionalReceiptPrintReturn {
  const [isPrinting, setIsPrinting] = useState(false)

  const printProfessionalReceipt = async (transactionId: string) => {
    // Implementation
  }

  return { printProfessionalReceipt, isPrinting }
}
```

### 2. Backend Services

#### ProfessionalReceiptService (New)
```typescript
// features/kasir/services/professionalReceiptService.ts

import { jsPDF } from 'jspdf'
import { STORE_CONFIG } from '@/config/constants'

interface TransactionDetail {
  kode: string
  createdAt: string
  tglMulai: string
  tglSelesai: string
  penyewa: { nama: string }
  kasir: { nama: string }
  metodeBayar: string
  discountType: string
  discountValue: number
  totalHarga: number
  jumlahBayar: number
  sisaBayar: number
  items: TransactionItem[]
}

interface TransactionItem {
  produk: { 
    name: string
    category: string
  }
  kondisiAwal: string  // Format: "uuid|SIZE|TYPE|condition"
  jumlah: number
  hargaSewa: number
  durasi: number
  subtotal: number
}

interface TableColumn {
  header: string
  width: number
  align: 'left' | 'center' | 'right'
}

export class ProfessionalReceiptService {
  // PDF configuration constants for professional layout
  private readonly PDF_WIDTH_MM = 140  // 14cm width
  private readonly PDF_HEIGHT_MM = 200 // 20cm height
  private readonly MARGIN = 10
  private readonly HEADER_HEIGHT = 40
  private readonly TABLE_ROW_HEIGHT = 8
  private readonly FONT_SIZE = 9
  private readonly HEADER_FONT_SIZE = 12
  private readonly TITLE_FONT_SIZE = 14

  /**
   * Generate professional PDF receipt from transaction data
   * @param transactionData - Complete transaction details
   * @returns PDF as Buffer
   */
  async generateProfessionalReceiptPDF(transactionData: TransactionDetail): Promise<Buffer>

  /**
   * Add professional header with logo and store information
   */
  private async addProfessionalHeader(doc: jsPDF, transactionData: TransactionDetail): Promise<number>

  /**
   * Add transaction information section (right side header)
   */
  private addTransactionInfoSection(doc: jsPDF, data: TransactionDetail, y: number): number

  /**
   * Add items table with borders and proper formatting
   */
  private addItemsTable(doc: jsPDF, items: TransactionItem[], transactionCode: string, y: number): number

  /**
   * Add financial summary section (Sub Total, Diskon, Biaya Lain-lain, Total)
   */
  private addFinancialSummary(doc: jsPDF, data: TransactionDetail, y: number): number

  /**
   * Add professional footer with keterangan and signature area
   */
  private addProfessionalFooter(doc: jsPDF, y: number): number

  /**
   * Create bordered table with specified columns and data
   */
  private createBorderedTable(
    doc: jsPDF, 
    columns: TableColumn[], 
    data: string[][], 
    startX: number, 
    startY: number
  ): number

  /**
   * Calculate discount amount based on type and value
   */
  private calculateDiscount(subtotal: number, discountType: string, discountValue: number): number

  /**
   * Format currency to Indonesian format
   * @param amount - Numeric amount
   * @returns Formatted string (e.g., "Rp 2.250.000")
   */
  private formatCurrency(amount: number): string

  /**
   * Format date to Indonesian format
   * @param dateString - ISO date string
   * @returns Formatted string (e.g., "15 Des 2025")
   */
  private formatDate(dateString: string): string

  /**
   * Extract size from kondisiAwal field
   * @param kondisiAwal - Format: "uuid|SIZE|TYPE|condition"
   * @returns Size string (e.g., "M", "L")
   */
  private extractSize(kondisiAwal: string): string

  /**
   * Load and encode logo for PDF
   */
  private async loadLogo(): Promise<string | null>

  /**
   * Draw table borders and grid lines
   */
  private drawTableBorders(
    doc: jsPDF, 
    startX: number, 
    startY: number, 
    columns: TableColumn[], 
    rowCount: number
  ): void
}
```

### 3. API Routes

#### Professional Receipt PDF Endpoint (New)
```typescript
// app/api/kasir/receipt/[transaksiId]/pdf/route.ts

interface RouteParams {
  params: Promise<{
    transaksiId: string
  }>
}

/**
 * GET /api/kasir/receipt/[transaksiId]/pdf
 * Generate and return professional PDF receipt for a transaction
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing transaksiId
 * @returns PDF file as Response with appropriate headers
 * 
 * @throws 401 - Unauthorized if user lacks permission
 * @throws 404 - Not Found if transaction doesn't exist
 * @throws 500 - Internal Server Error if PDF generation fails
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse>
```

### 4. Configuration

#### Store Configuration (Updated)
```typescript
// config/constants.ts

export const STORE_CONFIG = {
  name: 'ERLIMA MODE',
  address: 'Jalan Abdullah Dg Sirua No 136D, Kota Makassar',
  phone: '+62 821-9699-9962',
  logo: '/logo.jpg', // Logo path for PDF generation
  email: 'info@erlimamode.com', // Optional
} as const

export type StoreConfig = typeof STORE_CONFIG
```

## Data Models

### Professional Receipt Data Structure

The professional receipt uses the same transaction data structure but with enhanced processing for table layout and financial calculations.

```typescript
// Enhanced structure for professional receipt
interface ProfessionalReceiptData {
  // Header Information
  header: {
    logo: string | null
    storeName: string
    storeAddress: string
    storePhone: string
  }
  
  // Transaction Information (Top Right)
  transactionInfo: {
    documentType: 'PENAWARAN PENJUALAN'
    nomor: string           // Transaction code
    tanggal: string         // Formatted date
    pembayaran: string      // Payment method
    kepadaYth: string       // Customer name
  }
  
  // Table Data
  tableItems: Array<{
    no: string              // Transaction code (same for all items)
    kategori: string        // Product category
    namaBarang: string      // Product name
    size: string            // Extracted size
    qty: number             // Quantity
    harga: number           // Price per unit
    totalHarga: number      // Subtotal
  }>
  
  // Financial Summary
  financialSummary: {
    subTotal: number        // Sum of all subtotals
    diskon: number          // Calculated discount amount
    biayaLainLain: number   // Always 0 for now
    total: number           // Final total
  }
  
  // Footer Information
  footer: {
    keterangan: string      // Disclaimer text
    signatureArea: {
      bagianPenjualan: string
      tanggalLine: string
    }
    note: string            // Price change notice
  }
}
```

### Table Column Configuration

```typescript
const TABLE_COLUMNS: TableColumn[] = [
  { header: 'No', width: 15, align: 'center' },
  { header: 'Kategori', width: 25, align: 'left' },
  { header: 'Nama Barang', width: 40, align: 'left' },
  { header: 'Size', width: 15, align: 'center' },
  { header: 'Qty', width: 10, align: 'center' },
  { header: '@Harga', width: 20, align: 'right' },
  { header: 'Total Harga', width: 25, align: 'right' }
]
```

### Discount Calculation Logic

```typescript
private calculateDiscount(subtotal: number, discountType: string, discountValue: number): number {
  if (discountType === 'percent') {
    return Math.round(subtotal * (discountValue / 100))
  } else if (discountType === 'fixed') {
    return discountValue
  }
  return 0
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Professional PDF Generation Completeness
*For any* valid transaction, generating a professional receipt PDF should produce a non-empty buffer that can be opened as a valid PDF document with table layout.
**Validates: Requirements 1.2, 7.1, 7.2**

### Property 2: Store Information Consistency
*For any* generated professional receipt, the header section should contain exactly the store name "ERLIMA MODE", address, phone, and logo from STORE_CONFIG positioned correctly.
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 13.2**

### Property 3: Transaction Metadata Preservation
*For any* transaction, all transaction metadata (code, date, payment method, customer name) from the API response should appear in the generated PDF without modification.
**Validates: Requirements 3.2, 3.3, 3.4, 3.5**

### Property 4: Table Structure Consistency
*For any* generated receipt, the items table should have exactly 7 columns (No, Kategori, Nama Barang, Size, Qty, @Harga, Total Harga) with proper borders and formatting.
**Validates: Requirements 4.1, 7.5**

### Property 5: Item Data Completeness
*For any* transaction with N items, the generated PDF table should contain exactly N rows with all required fields populated from the transaction data.
**Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8**

### Property 6: Size Extraction Accuracy
*For any* product item with kondisiAwal in format "uuid|SIZE|TYPE|condition", the extracted size should equal the second pipe-delimited segment and appear in the Size column.
**Validates: Requirements 9.1, 9.2, 9.3**

### Property 7: Size Error Handling
*For any* malformed or missing kondisiAwal field, the size column should display empty without causing system errors.
**Validates: Requirements 9.4**

### Property 8: Currency Formatting Consistency
*For any* numeric amount in the receipt, the formatted currency string should use Indonesian format with "Rp" prefix and dot separators (e.g., "Rp 2.250.000").
**Validates: Requirements 5.5**

### Property 9: Financial Calculation Accuracy
*For any* transaction, the Sub Total should equal the sum of all item subtotals, and the discount should be calculated correctly based on discountType and discountValue.
**Validates: Requirements 5.1, 5.2**

### Property 10: Fixed Values Consistency
*For any* generated receipt, "Biaya Lain-lain" should always display 0, and "Total" should match data.totalHarga.
**Validates: Requirements 5.3, 5.4**

### Property 11: Document Type Consistency
*For any* generated receipt, the document type should display "PENAWARAN PENJUALAN" in the top-right section.
**Validates: Requirements 3.1**

### Property 12: Footer Content Consistency
*For any* generated receipt, the footer should contain the keterangan section, disclaimer text, signature area, and price change notice.
**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

### Property 13: PDF Dimension Specification
*For any* generated PDF, the document dimensions should be exactly 140x200mm with portrait orientation and appropriate margins.
**Validates: Requirements 7.1, 7.2, 7.3**

### Property 14: Font and Layout Consistency
*For any* generated PDF, the fonts should be clear and readable, suitable for business documents.
**Validates: Requirements 7.4**

### Property 15: Item Separation Logic
*For any* transaction with multiple items of the same product but different sizes, each item should appear as a separate table row.
**Validates: Requirements 9.5**

### Property 16: Loading State Management
*For any* receipt generation request, the isPrinting state should be true during generation and false after completion (success or failure).
**Validates: Requirements 1.3, 11.2**

### Property 17: Success Feedback Consistency
*For any* successful PDF generation, the system should show the success toast "Struk profesional berhasil dibuat".
**Validates: Requirements 1.4**

### Property 18: Error Feedback Consistency
*For any* failed PDF generation, the system should show the error toast "Gagal membuat struk. Silakan coba lagi." and reset button state.
**Validates: Requirements 1.5, 10.3**

### Property 19: New Tab Navigation
*For any* successful PDF generation, the PDF should open in a new browser tab without navigating away from the current page.
**Validates: Requirements 11.3**

### Property 20: UI Non-Blocking Behavior
*For any* PDF generation request, other UI elements on the page should remain interactive and responsive.
**Validates: Requirements 11.4, 10.5**

### Property 21: Authentication Enforcement
*For any* receipt generation API request, the system should verify the user has 'transaksi' read permission before processing.
**Validates: Requirements 12.1**

### Property 22: Error Logging Completeness
*For any* PDF generation failure, an error message with full error details should be logged to the console including user ID.
**Validates: Requirements 10.2, 12.4**

### Property 23: Configuration Reactivity
*For any* change to STORE_CONFIG values, all subsequently generated receipts should reflect the new configuration values.
**Validates: Requirements 13.1, 13.3**

### Property 24: Configuration Error Handling
*For any* missing required fields in configuration, the system should use empty strings rather than throwing errors.
**Validates: Requirements 13.4**

## Error Handling

### Error Categories and Responses

#### 1. Authentication Errors
```typescript
// Scenario: User not authenticated or lacks permission
// Response: 401 Unauthorized
// User Feedback: Redirect to login (handled by middleware)
// Logging: Auth failure with user context
```

#### 2. Transaction Not Found
```typescript
// Scenario: Invalid transaction ID or transaction doesn't exist
// Response: 404 Not Found
// User Feedback: Toast "Transaksi tidak ditemukan"
// Logging: Transaction ID and user ID
```

#### 3. PDF Generation Failure
```typescript
// Scenario: jsPDF throws error during table generation
// Response: 500 Internal Server Error
// User Feedback: Toast "Gagal membuat struk. Silakan coba lagi."
// Logging: Full error stack trace, transaction ID, user ID
// Recovery: Button returns to clickable state for retry
```

#### 4. Table Layout Errors
```typescript
// Scenario: Table rendering fails due to data issues
// Response: 500 Internal Server Error
// User Feedback: Toast "Gagal membuat struk. Silakan coba lagi."
// Logging: Table data and layout error details
// Recovery: Graceful degradation with simplified layout
```

#### 5. Logo Loading Failure
```typescript
// Scenario: Company logo cannot be loaded
// Response: Continue without logo
// User Feedback: No user notification (graceful degradation)
// Logging: Warning about logo loading failure
// Recovery: Generate receipt without logo
```

### Error Handling Strategy

```typescript
// Frontend Hook
try {
  setIsPrinting(true)
  const response = await fetch(`/api/kasir/receipt/${transactionId}/pdf`)
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  toast.success('Struk profesional berhasil dibuat')
} catch (error) {
  console.error('Professional receipt generation error:', error)
  toast.error('Gagal membuat struk. Silakan coba lagi.')
} finally {
  setIsPrinting(false)
}

// Backend API
try {
  const authResult = await requirePermission('transaksi', 'read')
  if (authResult.error) return authResult.error
  
  const transaksi = await transaksiService.getTransaksiByCode(transaksiId)
  const pdfBuffer = await professionalReceiptService.generateProfessionalReceiptPDF(transaksi)
  
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="professional-receipt-${transaksiId}.pdf"`
    }
  })
} catch (error) {
  console.error('Professional receipt PDF generation error:', {
    transaksiId,
    userId: authResult.user.id,
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined
  })
  
  return NextResponse.json(
    { success: false, error: 'Failed to generate professional receipt' },
    { status: 500 }
  )
}
```

## Testing Strategy

### Unit Testing

#### ProfessionalReceiptService Tests
```typescript
describe('ProfessionalReceiptService', () => {
  describe('generateProfessionalReceiptPDF', () => {
    it('should generate non-empty PDF buffer for valid transaction', async () => {
      const service = new ProfessionalReceiptService()
      const buffer = await service.generateProfessionalReceiptPDF(mockTransaction)
      
      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
    })
  })

  describe('createBorderedTable', () => {
    it('should create table with correct number of columns and rows', () => {
      const service = new ProfessionalReceiptService()
      const mockDoc = new jsPDF()
      
      const columns = [
        { header: 'No', width: 15, align: 'center' },
        { header: 'Item', width: 30, align: 'left' }
      ]
      const data = [['1', 'Test Item'], ['2', 'Another Item']]
      
      const endY = service.createBorderedTable(mockDoc, columns, data, 10, 10)
      expect(endY).toBeGreaterThan(10)
    })
  })

  describe('calculateDiscount', () => {
    it('should calculate percentage discount correctly', () => {
      const service = new ProfessionalReceiptService()
      
      expect(service.calculateDiscount(1000, 'percent', 10)).toBe(100)
      expect(service.calculateDiscount(500, 'percent', 20)).toBe(100)
    })

    it('should calculate fixed discount correctly', () => {
      const service = new ProfessionalReceiptService()
      
      expect(service.calculateDiscount(1000, 'fixed', 50)).toBe(50)
      expect(service.calculateDiscount(500, 'fixed', 100)).toBe(100)
    })
  })

  describe('formatCurrency', () => {
    it('should format currency with Rp prefix and dot separators', () => {
      const service = new ProfessionalReceiptService()
      
      expect(service.formatCurrency(2250000)).toBe('Rp 2.250.000')
      expect(service.formatCurrency(1000000)).toBe('Rp 1.000.000')
      expect(service.formatCurrency(115000)).toBe('Rp 115.000')
    })
  })

  describe('extractSize', () => {
    it('should extract size from kondisiAwal pipe-delimited string', () => {
      const service = new ProfessionalReceiptService()
      
      expect(service.extractSize('uuid|L|ADULT|baik')).toBe('L')
      expect(service.extractSize('uuid|UNIVERSAL|ADULT|baik')).toBe('UNIVERSAL')
      expect(service.extractSize('uuid|M|CHILD|baik')).toBe('M')
    })

    it('should return empty string for malformed kondisiAwal', () => {
      const service = new ProfessionalReceiptService()
      
      expect(service.extractSize('invalid')).toBe('')
      expect(service.extractSize('')).toBe('')
      expect(service.extractSize('uuid')).toBe('')
    })
  })
})
```

#### useProfessionalReceiptPrint Hook Tests
```typescript
describe('useProfessionalReceiptPrint', () => {
  it('should set isPrinting to true during generation', async () => {
    const { result } = renderHook(() => useProfessionalReceiptPrint())
    
    act(() => {
      result.current.printProfessionalReceipt('TXN-123')
    })
    
    expect(result.current.isPrinting).toBe(true)
  })

  it('should show success toast on successful generation', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob())
    })
    const toastSpy = jest.spyOn(toast, 'success')
    
    const { result } = renderHook(() => useProfessionalReceiptPrint())
    
    await act(async () => {
      await result.current.printProfessionalReceipt('TXN-123')
    })
    
    expect(toastSpy).toHaveBeenCalledWith('Struk profesional berhasil dibuat')
  })

  it('should show error toast on failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
    const toastSpy = jest.spyOn(toast, 'error')
    
    const { result } = renderHook(() => useProfessionalReceiptPrint())
    
    await act(async () => {
      await result.current.printProfessionalReceipt('TXN-123')
    })
    
    expect(toastSpy).toHaveBeenCalledWith('Gagal membuat struk. Silakan coba lagi.')
  })
})
```

### Integration Testing

#### API Route Tests
```typescript
describe('GET /api/kasir/receipt/[transaksiId]/pdf', () => {
  it('should return PDF with correct headers for valid transaction', async () => {
    const response = await GET(mockRequest, { params: { transaksiId: 'TXN-123' } })
    
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/pdf')
    expect(response.headers.get('content-disposition')).toContain('inline')
    expect(response.headers.get('content-disposition')).toContain('professional-receipt')
  })

  it('should return 404 for non-existent transaction', async () => {
    const response = await GET(mockRequest, { params: { transaksiId: 'INVALID' } })
    
    expect(response.status).toBe(404)
  })

  it('should return 401 for unauthorized user', async () => {
    const response = await GET(mockUnauthorizedRequest, { params: { transaksiId: 'TXN-123' } })
    
    expect(response.status).toBe(401)
  })
})
```

### Manual Testing Checklist

- [ ] Button appears with correct text "Cetak Struk Profesional"
- [ ] Button shows loading state when clicked
- [ ] PDF opens in new tab with professional layout
- [ ] PDF dimensions are 14x20cm (140x200mm)
- [ ] Header contains logo, store name, address, phone
- [ ] Transaction info section displays correctly in top-right
- [ ] Table has 7 columns with proper borders
- [ ] All items display with correct data in each column
- [ ] Size extraction works for all kondisiAwal formats
- [ ] Financial summary calculates correctly
- [ ] Footer contains keterangan and signature areas
- [ ] Currency formatting uses dot separators (with Rp prefix)
- [ ] Date formatting is in Indonesian format
- [ ] Success toast appears after generation
- [ ] Error toast appears on failure
- [ ] Button returns to normal state after completion
- [ ] Other UI elements remain interactive during generation
- [ ] Browser print (Ctrl+P) works on generated PDF

## Performance Considerations

### Target Metrics
- PDF generation: < 3 seconds for transactions with up to 20 items
- Table rendering: < 1 second for complex layouts
- Button loading state: < 100ms response time
- API response time: < 4 seconds total (including table generation)

### Optimization Strategies

1. **Efficient Table Generation**
   - Pre-calculate table dimensions and positions
   - Minimize border drawing operations
   - Use efficient text measurement for column sizing
   - Batch similar drawing operations

2. **Memory Management**
   - Optimize table data structures
   - Clean up temporary objects during generation
   - Limit PDF buffer size through efficient encoding
   - Use streaming for large tables if needed

3. **Layout Optimization**
   - Cache calculated positions for repeated elements
   - Use consistent spacing calculations
   - Minimize font changes and style switches
   - Optimize logo loading and caching

## Security Considerations

### Data Privacy
- Professional receipts contain comprehensive transaction information
- No sensitive payment details (card numbers, etc.)
- Customer contact information limited to name only
- Console logs exclude sensitive financial data

### PDF Security
- Generated PDFs are read-only documents
- No JavaScript or embedded content in PDFs
- Content-Disposition set to "inline" (not executable)
- Table data sanitized to prevent injection

### Input Validation
- Transaction ID validated by existing TransaksiService
- Table data validated before rendering
- Size extraction handles malformed input gracefully
- Financial calculations validated for accuracy

## Deployment Considerations

### Dependencies
```json
{
  "dependencies": {
    "jspdf": "^2.5.1"
  },
  "devDependencies": {
    "@types/jspdf": "^2.3.0"
  }
}
```

### Logo Requirements
- Logo file must be present at `public/logo.jpg`
- Recommended dimensions: 200x150px or similar aspect ratio
- Supported formats: JPEG, PNG
- File size should be optimized for PDF embedding

### Environment Variables
No new environment variables required for professional receipt generation.

### Build Configuration
- jsPDF table generation requires no special configuration
- TypeScript types included via @types/jspdf
- Logo loading uses standard file system access

## Future Enhancements

### Advanced Table Features
- Dynamic column sizing based on content
- Multi-line text support in table cells
- Custom table styling and themes
- Conditional column display

### Enhanced Branding
- Multiple logo support (header, footer, watermark)
- Custom color schemes
- Branded table borders and styling
- Company-specific footer templates

### Data Enhancements
- Additional financial breakdown fields
- Tax calculation integration
- Multi-currency support
- Custom discount types

---

**Document Version:** 1.0
**Last Updated:** December 22, 2025
**Status:** Ready for Implementation