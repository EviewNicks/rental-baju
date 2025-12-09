# Design Document - Customer Receipt PDF Preview

## Overview

The Customer Receipt PDF Preview feature provides a manual receipt generation mechanism for the Maguru Rental system. The design follows a clean service-oriented architecture with clear separation between presentation (React components), business logic (Receipt Service), and data access (Transaction API).

The system generates PDF receipts that simulate 58mm thermal paper output, allowing validation of receipt format before Phase 2 thermal printer integration. The design prioritizes simplicity, maintainability, and extensibility.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  TransactionDetailPage Component                       │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  "Cetak Struk" Button                            │ │ │
│  │  │  - Loading State                                 │ │ │
│  │  │  - Click Handler                                 │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                      ↓                                  │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  useReceiptPrint Hook                            │ │ │
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
│  │  GET /api/kasir/receipt/[transaksiId]/pdf             │ │
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
│  │  ReceiptService                                        │ │
│  │  - generateReceiptPDF()                                │ │
│  │  - formatHeader()                                      │ │
│  │  - formatTransactionInfo()                             │ │
│  │  - formatItems()                                       │ │
│  │  - formatSummary()                                     │ │
│  │  - formatFooter()                                      │ │
│  │  - formatCurrency()                                    │ │
│  │  - formatDate()                                        │ │
│  │  - extractSize()                                       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   External Dependencies                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  jsPDF Library                                         │ │
│  │  - PDF Document Creation                               │ │
│  │  - Text Rendering                                      │ │
│  │  - Font Management                                     │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  STORE_CONFIG (constants.ts)                           │ │
│  │  - Store Name                                          │ │
│  │  - Store Address                                       │ │
│  │  - Store Phone                                         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User Click "Cetak Struk"
        ↓
useReceiptPrint.printReceipt(transactionId)
        ↓
setState(isPrinting: true)
        ↓
fetch('/api/kasir/receipt/[id]/pdf')
        ↓
API: requirePermission('transaksi', 'read')
        ↓
API: TransaksiService.getTransaksiByCode(id)
        ↓
API: ReceiptService.generateReceiptPDF(transaction)
        ↓
ReceiptService: Create jsPDF instance
        ↓
ReceiptService: addHeader() → Store info from STORE_CONFIG
        ↓
ReceiptService: addTransactionInfo() → Transaction metadata
        ↓
ReceiptService: addItems() → Loop through items, extract size, format
        ↓
ReceiptService: addSummary() → Total amount
        ↓
ReceiptService: addFooter() → Thank you message
        ↓
ReceiptService: Return PDF Buffer
        ↓
API: Return Response with PDF buffer + headers
        ↓
Hook: Create blob URL from response
        ↓
Hook: window.open(url, '_blank')
        ↓
Hook: toast.success('Struk berhasil dibuat')
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
// - Import useReceiptPrint hook
// - Add "Cetak Struk" button in header
// - Handle button click with printReceipt function
```

#### useReceiptPrint Hook (New)
```typescript
// features/kasir/hooks/useReceiptPrint.ts

interface UseReceiptPrintReturn {
  printReceipt: (transactionId: string) => Promise<void>
  isPrinting: boolean
}

export function useReceiptPrint(): UseReceiptPrintReturn {
  const [isPrinting, setIsPrinting] = useState(false)

  const printReceipt = async (transactionId: string) => {
    // Implementation
  }

  return { printReceipt, isPrinting }
}
```

### 2. Backend Services

#### ReceiptService (New)
```typescript
// features/kasir/services/receiptService.ts

import { jsPDF } from 'jspdf'
import { STORE_CONFIG } from '@/config/constants'

interface TransactionDetail {
  kode: string
  createdAt: string
  penyewa: { nama: string }
  kasir: { nama: string }
  items: TransactionItem[]
  totalHarga: number
}

interface TransactionItem {
  produk: { name: string }
  kondisiAwal: string  // Format: "uuid|SIZE|TYPE|condition"
  jumlah: number
  hargaSewa: number
  durasi: number
  subtotal: number
}

export class ReceiptService {
  /**
   * Generate PDF receipt from transaction data
   * @param transactionData - Complete transaction details
   * @returns PDF as Buffer
   */
  async generateReceiptPDF(transactionData: TransactionDetail): Promise<Buffer>

  /**
   * Add header section with store information
   */
  private addHeader(doc: jsPDF, y: number): number

  /**
   * Add transaction information section
   */
  private addTransactionInfo(doc: jsPDF, data: TransactionDetail, y: number): number

  /**
   * Add product items section
   */
  private addItems(doc: jsPDF, items: TransactionItem[], y: number): number

  /**
   * Add payment summary section
   */
  private addSummary(doc: jsPDF, data: TransactionDetail, y: number): number

  /**
   * Add footer section
   */
  private addFooter(doc: jsPDF, y: number): number

  /**
   * Format currency to Indonesian format
   * @param amount - Numeric amount
   * @returns Formatted string (e.g., "Rp 300.000")
   */
  private formatCurrency(amount: number): string

  /**
   * Format date to Indonesian format
   * @param dateString - ISO date string
   * @returns Formatted string (e.g., "01 Des 2024 12:19")
   */
  private formatDate(dateString: string): string

  /**
   * Extract size from kondisiAwal field
   * @param kondisiAwal - Format: "uuid|SIZE|TYPE|condition"
   * @returns Size string (e.g., "M", "L")
   */
  private extractSize(kondisiAwal: string): string

  /**
   * Add separator line
   */
  private addSeparator(doc: jsPDF, y: number): number
}
```

### 3. API Routes

#### Receipt PDF Endpoint (New)
```typescript
// app/api/kasir/receipt/[transaksiId]/pdf/route.ts

interface RouteParams {
  params: Promise<{
    transaksiId: string
  }>
}

/**
 * GET /api/kasir/receipt/[transaksiId]/pdf
 * Generate and return PDF receipt for a transaction
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

#### Store Configuration (New)
```typescript
// config/constants.ts

export const STORE_CONFIG = {
  name: 'MAGURU RENTAL',
  address: 'Jl. Contoh No. 123, Jakarta 12345',
  phone: '(021) 123-4567',
  email: 'info@magururental.com', // Optional, not used in MVP
} as const

export type StoreConfig = typeof STORE_CONFIG
```

## Data Models

### Receipt Data Structure

The receipt generation uses existing transaction data structure from the API. No new database models are required.

```typescript
// Existing structure from GET /api/kasir/transaksi/[kode]
interface APITransactionResponse {
  success: boolean
  data: {
    id: string
    kode: string                    // Transaction code
    penyewa: {
      id: string
      nama: string                  // Customer name
      telepon: string
      alamat: string
    }
    kasir: {
      id: string
      nama: string                  // Kasir name
      isActive: boolean
      createdAt: string
      updatedAt: string
    }
    status: string
    totalHarga: number              // Total rental amount
    jumlahBayar: number
    sisaBayar: number
    tglMulai: string
    tglSelesai: string
    tglKembali: string | null
    metodeBayar: string
    catatan: string | null
    createdBy: string
    createdAt: string               // Transaction date
    updatedAt: string
    items: Array<{
      id: string
      produk: {
        id: string
        code: string
        name: string                // Product name
        modalAwal: number
        imageUrl: string
        size: string | null
        category: string
      }
      jumlah: number                // Quantity
      jumlahDiambil: number
      hargaSewa: number             // Price per unit
      durasi: number                // Rental duration in days
      subtotal: number              // Item subtotal
      kondisiAwal: string           // Format: "uuid|SIZE|TYPE|condition"
      kondisiAkhir: string
      statusKembali: string
    }>
    pembayaran: Array<any>
    aktivitas: Array<any>
  }
  message: string
}
```

### Size Extraction Logic

The `kondisiAwal` field contains size information in pipe-delimited format:
```
Format: "uuid|SIZE|TYPE|condition"
Example: "906e61bb-17b6-46e2-afd1-d7c301138ada|M|ADULT|baik"
```

Extraction logic:
```typescript
private extractSize(kondisiAwal: string): string {
  const parts = kondisiAwal.split('|')
  return parts.length >= 2 ? parts[1] : ''
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: PDF Generation Completeness
*For any* valid transaction, generating a receipt PDF should produce a non-empty buffer that can be opened as a valid PDF document.
**Validates: Requirements 1.2, 5.1, 5.2**

### Property 2: Store Information Consistency
*For any* generated receipt, the header section should contain exactly the store name "MAGURU RENTAL", address "Jl. Contoh No. 123, Jakarta 12345", and phone "(021) 123-4567" from STORE_CONFIG.
**Validates: Requirements 2.1, 10.2**

### Property 3: Transaction Data Preservation
*For any* transaction, all transaction metadata (code, date, customer name, kasir name) from the API response should appear in the generated PDF without modification.
**Validates: Requirements 2.2, 6.2, 6.3, 6.4**

### Property 4: Item Listing Completeness
*For any* transaction with N items, the generated PDF should contain exactly N product line items with all required fields (name, size, quantity, price, duration, subtotal).
**Validates: Requirements 2.3, 3.3, 6.5**

### Property 5: Size Extraction Accuracy
*For any* product item with kondisiAwal in format "uuid|SIZE|TYPE|condition", the extracted size should equal the second pipe-delimited segment.
**Validates: Requirements 3.2**

### Property 6: Item Order Preservation
*For any* transaction, the order of items in the generated PDF should match the order of items in the API response array.
**Validates: Requirements 3.4**

### Property 7: Currency Formatting Consistency
*For any* numeric amount, the formatted currency string should match the pattern "Rp [space] [number with dots as thousand separators]" (e.g., "Rp 300.000").
**Validates: Requirements 4.1**

### Property 8: Date Formatting Consistency
*For any* ISO date string, the formatted date should match Indonesian format with pattern "DD MMM YYYY HH:mm" where MMM is abbreviated Indonesian month name.
**Validates: Requirements 4.2**

### Property 9: PDF Dimension Specification
*For any* generated PDF, the document width should be exactly 58mm and orientation should be portrait.
**Validates: Requirements 5.1, 5.2**

### Property 10: Font Specification
*For any* generated PDF, the font family should be "courier" (monospace) for all text content.
**Validates: Requirements 4.3, 5.3**

### Property 11: Footer Content Consistency
*For any* generated receipt, the footer section should contain the exact text "Terima Kasih!" and "Barang yang sudah disewa tidak dapat dikembalikan".
**Validates: Requirements 2.5**

### Property 12: HTTP Response Headers
*For any* successful PDF generation API response, the Content-Type header should be "application/pdf" and Content-Disposition should be "inline".
**Validates: Requirements 5.4**

### Property 13: Loading State Management
*For any* receipt generation request, the isPrinting state should be true during generation and false after completion (success or failure).
**Validates: Requirements 1.3, 7.3, 8.2**

### Property 14: New Tab Navigation
*For any* successful PDF generation, the PDF should open in a new browser tab without navigating away from the current transaction detail page.
**Validates: Requirements 1.2, 8.3**

### Property 15: Error Logging
*For any* PDF generation failure, an error message with full error details should be logged to the console.
**Validates: Requirements 7.2**

### Property 16: UI Non-Blocking
*For any* PDF generation request, other UI elements on the page should remain interactive and responsive.
**Validates: Requirements 7.5, 8.4**

### Property 17: Authentication Enforcement
*For any* receipt generation API request, the system should verify the user has 'transaksi' read permission before processing.
**Validates: Requirements 9.1**

### Property 18: Configuration Reactivity
*For any* change to STORE_CONFIG values, all subsequently generated receipts should reflect the new configuration values.
**Validates: Requirements 10.3**

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
// Scenario: jsPDF throws error during generation
// Response: 500 Internal Server Error
// User Feedback: Toast "Gagal membuat struk. Silakan coba lagi."
// Logging: Full error stack trace, transaction ID, user ID
// Recovery: Button returns to clickable state for retry
```

#### 4. Network Errors
```typescript
// Scenario: API request fails due to network issues
// Response: N/A (client-side error)
// User Feedback: Toast "Gagal membuat struk. Silakan coba lagi."
// Logging: Console error with network error details
// Recovery: Button returns to clickable state for retry
```

#### 5. Malformed Data
```typescript
// Scenario: Transaction data missing required fields
// Response: 500 Internal Server Error
// User Feedback: Toast "Gagal membuat struk. Silakan coba lagi."
// Logging: Error with data structure details
// Recovery: Graceful degradation (use empty strings for missing fields)
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
  toast.success('Struk berhasil dibuat')
} catch (error) {
  console.error('Receipt generation error:', error)
  toast.error('Gagal membuat struk. Silakan coba lagi.')
} finally {
  setIsPrinting(false)
}

// Backend API
try {
  const authResult = await requirePermission('transaksi', 'read')
  if (authResult.error) return authResult.error
  
  const transaksi = await transaksiService.getTransaksiByCode(transaksiId)
  const pdfBuffer = await receiptService.generateReceiptPDF(transaksi)
  
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="receipt-${transaksiId}.pdf"`
    }
  })
} catch (error) {
  console.error('Receipt PDF generation error:', {
    transaksiId,
    userId: authResult.user.id,
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined
  })
  
  return NextResponse.json(
    { success: false, error: 'Failed to generate receipt' },
    { status: 500 }
  )
}
```

## Testing Strategy

### Unit Testing

#### ReceiptService Tests
```typescript
describe('ReceiptService', () => {
  describe('generateReceiptPDF', () => {
    it('should generate non-empty PDF buffer for valid transaction', async () => {
      const service = new ReceiptService()
      const buffer = await service.generateReceiptPDF(mockTransaction)
      
      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(0)
    })
  })

  describe('formatCurrency', () => {
    it('should format currency with Rp prefix, space, and dot separators', () => {
      const service = new ReceiptService()
      
      expect(service.formatCurrency(300000)).toBe('Rp 300.000')
      expect(service.formatCurrency(1500000)).toBe('Rp 1.500.000')
      expect(service.formatCurrency(50000)).toBe('Rp 50.000')
    })
  })

  describe('formatDate', () => {
    it('should format date in Indonesian format', () => {
      const service = new ReceiptService()
      const isoDate = '2024-12-01T05:19:15.046Z'
      
      const formatted = service.formatDate(isoDate)
      expect(formatted).toMatch(/\d{2} \w{3} \d{4} \d{2}:\d{2}/)
    })
  })

  describe('extractSize', () => {
    it('should extract size from kondisiAwal pipe-delimited string', () => {
      const service = new ReceiptService()
      
      expect(service.extractSize('uuid|M|ADULT|baik')).toBe('M')
      expect(service.extractSize('uuid|L|ADULT|baik')).toBe('L')
      expect(service.extractSize('uuid|XL|ADULT|baik')).toBe('XL')
    })

    it('should return empty string for malformed kondisiAwal', () => {
      const service = new ReceiptService()
      
      expect(service.extractSize('invalid')).toBe('')
      expect(service.extractSize('')).toBe('')
    })
  })
})
```

#### useReceiptPrint Hook Tests
```typescript
describe('useReceiptPrint', () => {
  it('should set isPrinting to true during generation', async () => {
    const { result } = renderHook(() => useReceiptPrint())
    
    act(() => {
      result.current.printReceipt('TXN-123')
    })
    
    expect(result.current.isPrinting).toBe(true)
  })

  it('should reset isPrinting to false after success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob())
    })
    
    const { result } = renderHook(() => useReceiptPrint())
    
    await act(async () => {
      await result.current.printReceipt('TXN-123')
    })
    
    expect(result.current.isPrinting).toBe(false)
  })

  it('should show error toast on failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
    const toastSpy = jest.spyOn(toast, 'error')
    
    const { result } = renderHook(() => useReceiptPrint())
    
    await act(async () => {
      await result.current.printReceipt('TXN-123')
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

- [ ] Button appears in correct position on transaction detail page
- [ ] Button shows loading state when clicked
- [ ] PDF opens in new tab (not download)
- [ ] PDF contains all required sections (header, transaction info, items, summary, footer)
- [ ] Store information matches STORE_CONFIG
- [ ] Transaction data matches API response
- [ ] Currency formatting is correct (Rp 300.000)
- [ ] Date formatting is correct (01 Des 2024 12:19)
- [ ] Size extraction works for all items
- [ ] Items appear in same order as API
- [ ] Multiple items with same product but different sizes are separate
- [ ] Success toast appears after generation
- [ ] Error toast appears on failure
- [ ] Button returns to clickable state after error
- [ ] Page doesn't navigate away when PDF opens
- [ ] Other UI elements remain interactive during generation
- [ ] Browser print (Ctrl+P) works on generated PDF

## Performance Considerations

### Target Metrics
- PDF generation: < 2 seconds for transactions with up to 20 items
- Button loading state: < 100ms response time
- API response time: < 3 seconds total (including database query)

### Optimization Strategies

1. **Efficient PDF Generation**
   - Use jsPDF's built-in text rendering (no custom canvas operations)
   - Minimize font changes and style switches
   - Calculate layout positions once, reuse for similar elements

2. **Async Operations**
   - PDF generation runs asynchronously without blocking UI
   - Use React's useState for non-blocking state updates
   - Leverage browser's native blob URL creation

3. **Memory Management**
   - Clean up blob URLs after use (URL.revokeObjectURL)
   - Limit PDF buffer size by using efficient text encoding
   - No caching of generated PDFs (generate on-demand)

4. **Network Optimization**
   - Single API call to fetch transaction data
   - PDF generated server-side to reduce client processing
   - Appropriate HTTP headers for browser caching

## Security Considerations

### Authentication and Authorization
- All receipt generation requests require valid authentication
- Users must have 'transaksi' read permission
- Existing middleware handles auth checks (no new security code)

### Data Privacy
- Receipts contain only necessary transaction information
- No sensitive payment details (card numbers, etc.)
- Customer phone and address not included in receipt
- Console logs exclude sensitive data

### Input Validation
- Transaction ID validated by existing TransaksiService
- No user-provided content in PDF (all from database)
- Store config is hardcoded (no injection risk)

### PDF Security
- Generated PDFs are read-only
- No JavaScript or embedded content in PDFs
- Content-Disposition set to "inline" (not executable)

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

### Environment Variables
No new environment variables required for MVP Phase 1.

### Build Configuration
- jsPDF is client-side compatible (works in Next.js)
- No special webpack configuration needed
- TypeScript types included via @types/jspdf

### Monitoring and Logging
- Console logging for all PDF generation attempts
- Error logs include transaction ID and user ID
- Success/failure metrics can be tracked via console logs
- No database logging in MVP (Phase 2 feature)

## Future Enhancements (Phase 2)

### Thermal Printer Integration
- Replace PDF generation with direct thermal printer commands
- Use node-thermal-printer library
- Support USB and network printer connections
- Add printer status monitoring

### Database Logging
- Create print_logs table
- Track all print attempts with status
- Enable reprint functionality
- Generate print analytics

### Advanced Features
- Email/SMS receipt delivery
- QR code for digital receipt access
- Custom receipt templates
- Multi-language support
- Receipt history view

---

**Document Version:** 1.0
**Last Updated:** December 9, 2025
**Status:** Ready for Implementation
