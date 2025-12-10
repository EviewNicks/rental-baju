# Customer Receipt Feature - Struk Customer (MVP Phase 1)

## 📋 Overview

**Feature Name**: Customer Receipt PDF Preview
**Priority**: High
**Complexity**: Low
**Estimated Implementation**: 1 day
**Phase**: MVP Phase 1 - PDF Simulation Only

## 🎯 Business Context

### Current State
- Transaksi tersimpan di database tanpa dokumen untuk customer
- Tidak ada bukti pembayaran yang diberikan kepada customer
- Perlu validasi format struk sebelum implementasi thermal printer

### Problem Statement
Customer perlu menerima dokumentasi sebagai bukti transaksi untuk:
- ✅ Bukti pembayaran
- ✅ Audit trail
- ✅ Daftar produk yang di-rental
- ✅ Informasi periode rental

### MVP Goal
**Validate receipt format dengan PDF simulation sebelum hardware integration (Phase 2)**

---

## 🔧 Feature Requirements

### Functional Requirements

#### FR1: Trigger Point
- **Location**: Transaction Detail Page (`TransactionDetailPage.tsx`)
- **Button Position**: Header, di samping status badge (sebelah kanan)
- **Button Label**: "Cetak Struk" dengan icon Printer
- **Action**: Generate PDF dan buka di tab baru
- **Important**: TIDAK auto-print saat create transaksi

#### FR2: Receipt Content (Simple Version)
```
================================
      MAGURU RENTAL
   Jl. Contoh No. 123
      Jakarta 12345
    Tel: (021) 123-4567
================================

STRUK TRANSAKSI

Kode    : TXN-20251201-002
Tanggal : 01 Des 2024 12:19
Customer: Ardiansyah
Kasir   : Adelia

================================
DETAIL PRODUK
================================

Dress Pesta Merah (M)
  3 x Rp 60.000 x 4 hari
  Subtotal: Rp 180.000

Dress Pesta Merah (L)
  2 x Rp 60.000 x 4 hari
  Subtotal: Rp 120.000

================================
RINGKASAN PEMBAYARAN
================================

Total Sewa: Rp 300.000

================================

Terima Kasih!

Barang yang sudah disewa
tidak dapat dikembalikan

================================
```

#### FR3: Data Source
**Hardcoded (Config):**
- Nama Toko: "MAGURU RENTAL"
- Alamat: "Jl. Contoh No. 123, Jakarta 12345"
- Telepon: "(021) 123-4567"

**From API (`/api/kasir/transaksi/[kode]`):**
- Kode Transaksi (`data.kode`)
- Tanggal Transaksi (`data.createdAt`)
- Customer Name (`data.penyewa.nama`)
- Kasir Name (`data.kasir.nama`)
- Items (`data.items[]`)
  - Product name (`item.produk.name`)
  - Size (dari `kondisiAwal` parsing)
  - Quantity (`item.jumlah`)
  - Price (`item.hargaSewa`)
  - Duration (`item.durasi`)
  - Subtotal (`item.subtotal`)
- Payment Summary
  - Total (`data.totalHarga`)

#### FR4: PDF Generation
- **Library**: jsPDF
- **Paper Size**: 58mm width (thermal paper simulation)
- **Format**: Portrait, text-based
- **Font**: Monospace untuk alignment
- **Output**: Open in new tab (not download)

#### FR5: Error Handling
- Transaction not found → Show error toast
- PDF generation failed → Show error toast with retry option
- Console logging untuk debugging

### Non-Functional Requirements

#### NFR1: Performance
- PDF generation < 2 seconds
- No blocking UI during generation
- Smooth user experience

#### NFR2: Usability
- Clear button label dan icon
- Loading indicator saat generate
- Success/error feedback via toast

#### NFR3: Maintainability
- Clean service layer separation
- Easy to extend untuk thermal printer (Phase 2)
- Reusable receipt content generator

---

## 🏗️ Technical Architecture

### 1. Frontend Components

#### Button Integration (TransactionDetailPage.tsx)
```typescript
// Add button di header, setelah status badge
<div className="flex items-center gap-3">
  <StatusBadge status={transaction.status} />
  
  {/* NEW: Print Receipt Button */}
  <Button
    data-testid="print-receipt-button"
    variant="outline"
    size="sm"
    onClick={handlePrintReceipt}
    disabled={isPrinting}
  >
    {isPrinting ? (
      <>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Generating...
      </>
    ) : (
      <>
        <Printer className="h-4 w-4 mr-2" />
        Cetak Struk
      </>
    )}
  </Button>
  
  <Button variant="outline" size="sm" onClick={refreshTransaction}>
    <RefreshCw className="h-4 w-4 mr-2" />
    Refresh
  </Button>
</div>
```

#### Hook: useReceiptPrint
```typescript
// features/kasir/hooks/useReceiptPrint.ts
export function useReceiptPrint() {
  const [isPrinting, setIsPrinting] = useState(false)

  const printReceipt = async (transactionId: string) => {
    setIsPrinting(true)
    try {
      const response = await fetch(`/api/kasir/receipt/${transactionId}/pdf`)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      
      // Open in new tab
      window.open(url, '_blank')
      
      toast.success('Struk berhasil dibuat')
    } catch (error) {
      toast.error('Gagal membuat struk')
      console.error('Receipt generation error:', error)
    } finally {
      setIsPrinting(false)
    }
  }

  return { printReceipt, isPrinting }
}
```

### 2. Backend Services

#### Receipt Service
```typescript
// features/kasir/services/receiptService.ts
import { jsPDF } from 'jspdf'
import { STORE_CONFIG } from '@/config/constants'

export class ReceiptService {
  async generateReceiptPDF(transactionData: TransactionDetail): Promise<Buffer> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [58, 200] // 58mm width thermal paper
    })

    // Set font
    doc.setFont('courier')
    doc.setFontSize(8)

    let y = 10

    // Header
    y = this.addHeader(doc, y)
    
    // Transaction Info
    y = this.addTransactionInfo(doc, transactionData, y)
    
    // Items
    y = this.addItems(doc, transactionData.items, y)
    
    // Summary
    y = this.addSummary(doc, transactionData, y)
    
    // Footer
    y = this.addFooter(doc, y)

    return Buffer.from(doc.output('arraybuffer'))
  }

  private addHeader(doc: jsPDF, y: number): number {
    doc.setFontSize(10)
    doc.text(STORE_CONFIG.name, 29, y, { align: 'center' })
    y += 5
    
    doc.setFontSize(7)
    doc.text(STORE_CONFIG.address, 29, y, { align: 'center' })
    y += 4
    doc.text(STORE_CONFIG.phone, 29, y, { align: 'center' })
    y += 6
    
    doc.text('='.repeat(32), 3, y)
    y += 5
    
    return y
  }

  // ... other methods
}
```

#### API Route
```typescript
// app/api/kasir/receipt/[transaksiId]/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ReceiptService } from '@/features/kasir/services/receiptService'
import { TransaksiService } from '@/features/kasir/services/transaksiService'
import { requirePermission } from '@/lib/auth-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: { transaksiId: string } }
) {
  try {
    // Auth check
    const authResult = await requirePermission('transaksi', 'read')
    if (authResult.error) return authResult.error

    // Get transaction data
    const transaksiService = new TransaksiService(prisma, authResult.user.id)
    const transaksi = await transaksiService.getTransaksiByCode(params.transaksiId)

    // Generate PDF
    const receiptService = new ReceiptService()
    const pdfBuffer = await receiptService.generateReceiptPDF(transaksi)

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="receipt-${params.transaksiId}.pdf"`
      }
    })
  } catch (error) {
    console.error('Receipt PDF generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate receipt' },
      { status: 500 }
    )
  }
}
```

### 3. Configuration

#### Store Config
```typescript
// config/constants.ts
export const STORE_CONFIG = {
  name: 'MAGURU RENTAL',
  address: 'Jl. Contoh No. 123, Jakarta 12345',
  phone: '(021) 123-4567',
  email: 'info@magururental.com', // optional
} as const
```

#### Environment Variables
```bash
# .env.local
# No printer config needed for MVP Phase 1
# Phase 2 will add:
# PRINTER_MODE=mock
# PRINTER_INTERFACE=usb
```

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// __tests__/services/receiptService.test.ts
describe('ReceiptService', () => {
  test('should generate PDF with correct content', async () => {
    const service = new ReceiptService()
    const pdf = await service.generateReceiptPDF(mockTransaction)
    
    expect(pdf).toBeInstanceOf(Buffer)
    expect(pdf.length).toBeGreaterThan(0)
  })

  test('should format currency correctly', () => {
    const service = new ReceiptService()
    expect(service.formatCurrency(300000)).toBe('Rp  300.000')
  })
})
```

### Integration Tests
```typescript
// __tests__/api/receipt-pdf.test.ts
describe('GET /api/kasir/receipt/[id]/pdf', () => {
  test('should return PDF for valid transaction', async () => {
    const response = await fetch(`/api/kasir/receipt/${validId}/pdf`)
    
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/pdf')
  })

  test('should return 404 for invalid transaction', async () => {
    const response = await fetch(`/api/kasir/receipt/invalid/pdf`)
    expect(response.status).toBe(404)
  })
})
```

### Manual Testing Checklist
- [ ] Button muncul di transaction detail page
- [ ] Click button generate PDF
- [ ] PDF terbuka di tab baru
- [ ] Content PDF sesuai format
- [ ] Currency formatting benar
- [ ] Date formatting benar
- [ ] Loading state muncul
- [ ] Success toast muncul
- [ ] Error handling works

---

## 📦 Implementation Plan

### Day 1: Complete MVP
**Morning (4 hours):**
1. ✅ Create store config constants
2. ✅ Create ReceiptService with PDF generation
3. ✅ Create API route `/api/kasir/receipt/[id]/pdf`
4. ✅ Add jsPDF dependency

**Afternoon (4 hours):**
5. ✅ Create useReceiptPrint hook
6. ✅ Add button to TransactionDetailPage
7. ✅ Test PDF generation
8. ✅ Fix formatting issues

**Total**: 1 day (8 hours)

---

## 🎨 UI/UX Considerations

### Button States
```typescript
// Idle
<Printer className="h-4 w-4 mr-2" />
Cetak Struk

// Loading
<Loader2 className="h-4 w-4 mr-2 animate-spin" />
Generating...

// Disabled (during generation)
disabled={isPrinting}
```

### Toast Messages
- **Success**: "Struk berhasil dibuat"
- **Error**: "Gagal membuat struk. Silakan coba lagi."
- **Not Found**: "Transaksi tidak ditemukan"

---

## ✅ Acceptance Criteria (MVP)

### Definition of Done
- [ ] Button "Cetak Struk" muncul di transaction detail page
- [ ] Click button generate PDF dengan format yang benar
- [ ] PDF terbuka di tab baru (bukan download)
- [ ] Content PDF sesuai dengan data transaksi
- [ ] Store info (nama, alamat, telepon) hardcoded dengan benar
- [ ] Currency dan date formatting benar
- [ ] Loading state dan error handling works
- [ ] Console logging untuk debugging
- [ ] Code clean dan maintainable

### Out of Scope (Phase 2)
- ❌ Thermal printer integration
- ❌ Auto-print saat create transaksi
- ❌ Database print_logs table
- ❌ Email/SMS receipt
- ❌ QR code
- ❌ Custom templates

---

## 🚀 Phase 2 Preview (Future)

Setelah MVP Phase 1 validated, Phase 2 akan include:
1. **Thermal Printer Integration**
   - Epson TM-T82IIIL via USB
   - node-thermal-printer library
   - Real hardware testing

2. **Enhanced Features**
   - Print logs database
   - Reprint functionality
   - Print queue management

3. **Configuration UI**
   - Printer settings page
   - Test print functionality
   - Connection status monitoring

---

**Status**: Ready for Implementation
**Next Step**: Start Day 1 implementation
**Dependencies**: jsPDF library only
