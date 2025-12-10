# Customer Receipt Feature - Struk Customer

## =� Overview

**Feature Name**: Customer Receipt Printing
**Priority**: High
**Complexity**: Medium
**Estimated Implementation**: 2-3 days

## <� Business Context

### Current State
- Transaksi tersimpan di database tanpa dokumen fisik untuk customer
- Tidak ada bukti pembayaran yang diberikan kepada customer
- Need untuk audit trail dan dokumentasi rental

### Problem Statement
Customer perlu menerima dokumentasi fisik sebagai bukti transaksi untuk:
-  Bukti pembayaran
-  Audit trail
-  Daftar produk yang di-rental
-  Informasi periode rental

## =' Feature Requirements

### Functional Requirements

#### FR1: Trigger Point
- **When**: saat kasir mengklik button struck pada halaman transaction detail 
- **Action**: Otomatis generate dan cetak struk

#### FR2: Receipt Content
```
[HEADER]
- Nama Toko (Maguru Rental)

[TRANSACTION INFO]
- Kode Transaksi (Auto-generated)
- Tanggal & Waktu
- Nama Customer (Penyewa)
- Kasir Name

[ITEM DETAILS]
- Daftar produk yang di-rental
- Quantity
- Harga per item
- Subtotal per item

[SUMMARY]
- Total Harga
- Uang Dibayar
- Status: PAID

[FOOTER]
- Terima Kasih
- "Barang yang sudah disewa tidak dapat dikembalikan"
- Catatan perawatan (jika ada)
```

#### FR3: Printer Integration
- **Type**: Epson TM-T82IIIL Thermal POS Printer
- **Connection**: USB (development) + Ethernet (production)
- **Paper Width**: 58mm (recommended) or 80mm (optional)
- **Format**: Text-based (simple design)
- **Features**: Auto-cutter, ESC/POS support, 203 DPI resolution

#### FR4: Error Handling
- Printer offline/habis kertas
- Printer connection failed
- Retry mechanism (2x attempts)
- Fallback ke PDF preview

### Non-Functional Requirements

#### NFR1: Performance
- Receipt generation < 2 seconds
- Print completion < 10 seconds
- No blocking main transaction flow

#### NFR2: Reliability
- Transaction persists even if print fails
- Audit log untuk print attempts
- Graceful degradation jika printer unavailable

#### NFR3: Usability
- Simple UI feedback untuk print status
- Clear error messages
- Opsi reprint jika gagal

## <� Technical Architecture

### Database Schema Changes
```sql
-- No schema changes needed initially
-- Receipt data can be generated from existing transaksi data
-- Optional: Add print tracking table for audit

CREATE TABLE print_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaksi_id UUID REFERENCES transaksi(id),
  status VARCHAR(20), -- SUCCESS, FAILED, PENDING
  error_message TEXT,
  attempts INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Integration Points

#### 1. Extend POST `/api/kasir/transaksi`
```typescript
// After successful transaction creation
if (shouldPrintReceipt) {
  await receiptService.printReceipt(transaksiId);
}
```

#### 2. New Receipt Service
```typescript
// features/kasir/services/receiptService.ts
class ReceiptService {
  async generateReceiptContent(transaksiId: string): Promise<string>
  async printReceipt(content: string): Promise<PrintResult>
  async printToPDF(content: string): Promise<Buffer> // Simulation mode
}
```

#### 3. Printer Integration
```typescript
// lib/printer/thermalPrinter.ts
class ThermalPrinter {
  async connect(): Promise<boolean>
  async print(content: string): Promise<void>
  async getStatus(): Promise<PrinterStatus>
  async disconnect(): Promise<void>
}
```

### Frontend Integration

#### Transaction Completion Flow
```typescript
// features/kasir/hooks/useTransactionComplete.ts
const completeTransaction = async (transactionData) => {
  // Create transaction
  const transaksi = await createTransaction(transactionData);

  // Print receipt (non-blocking)
  if (transaksi.success) {
    toast.loading('Mencetak struk...');
    try {
      await printReceipt(transaksi.data.id);
      toast.success('Struk berhasil dicetak');
    } catch (error) {
      toast.error('Gagal mencetak struk: ' + error.message);
    }
  }

  return transaksi;
};
```

## >� Testing Strategy

### Development Phase (No Physical Printer)

#### 1. PDF Simulation
- Generate struk sebagai PDF untuk preview
- Simulasi printer status
- Test receipt content formatting

#### 2. Mock Printer Service
```typescript
// __tests__/mocks/thermalPrinter.mock.ts
class MockThermalPrinter {
  async print(content: string): Promise<void> {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Random failure simulation (20%)
    if (Math.random() < 0.2) {
      throw new Error('Printer offline');
    }

    // Save to file for verification
    fs.writeFileSync(`receipt_${Date.now()}.txt`, content);
  }
}
```

#### 3. Integration Tests
```typescript
// __tests__/integration/receipt-printing.test.ts
describe('Receipt Printing', () => {
  test('should generate receipt content correctly', async () => {
    const content = await receiptService.generateReceiptContent(transaksiId);
    expect(content).toContain('MAGURU RENTAL');
    expect(content).toContain(transaksi.kode);
  });

  test('should handle printer failure gracefully', async () => {
    // Mock printer failure
    mockPrinter.print.mockRejectedValue(new Error('Printer offline'));

    const result = await receiptService.printReceipt(transaksiId);
    expect(result.success).toBe(false);
    expect(result.fallback).toBe('PDF');
  });
});
```

### Production Phase (With Physical Printer)

#### 1. Hardware Testing
- Test dengan actual thermal printer
- Different paper sizes (58mm vs 80mm)
- Connection stability

#### 2. End-to-End Testing
```typescript
// __tests__/e2e/receipt-printing.spec.ts (Playwright)
test('complete transaction with receipt printing', async ({ page }) => {
  // Complete transaction
  await page.fill('[data-testid=customer-name]', 'Test Customer');
  await page.click('[data-testid=add-item-btn]');
  // ... complete transaction flow

  // Verify receipt generation
  await page.click('[data-testid=complete-transaction-btn]');

  // Check for success message
  await expect(page.locator('[data-testid=receipt-success]')).toBeVisible();

  // Verify receipt content (if simulation mode)
  if (process.env.USE_MOCK_PRINTER) {
    const receiptContent = await page.evaluate(() =>
      window.mockPrinter.getLastReceipt()
    );
    expect(receiptContent).toContain('MAGURU RENTAL');
  }
});
```

## =� Implementation Plan

### Phase 1: Foundation (Day 1)
1. **Backend Setup**
   - [ ] Create `receiptService.ts`
   - [ ] Create receipt content generator
   - [ ] Add print logging (optional)
   - [ ] Integrate with existing transaction endpoint

2. **Mock Implementation**
   - [ ] Create mock printer service
   - [ ] PDF generation for simulation
   - [ ] Error handling framework

### Phase 2: Integration (Day 2)
1. **Frontend Integration**
   - [ ] Update transaction completion flow
   - [ ] Add print status indicators
   - [ ] Error handling UI
   - [ ] Loading states

2. **Testing Setup**
   - [ ] Unit tests for receipt generation
   - [ ] Integration tests
   - [ ] Mock printer tests

### Phase 3: Production & Refinement (Day 3)
1. **Real Printer Integration**
   - [ ] Install thermal printer drivers
   - [ ] Connect actual printer
   - [ ] Test with different paper sizes
   - [ ] Performance optimization

2. **Final Testing**
   - [ ] End-to-end testing
   - [ ] Error scenario testing
   - [ ] Performance validation

## =' Technology Stack

### Backend Dependencies
```json
{
  "node-thermal-printer": "^4.1.2",
  "jspdf": "^2.5.1", // For PDF simulation
  "@types/node-thermal-printer": "^4.1.1"
}
```

### Configuration
```typescript
// config/printer.ts
export const printerConfig = {
  development: {
    type: 'epson',
    interface: 'printer:Epson TM-T82IIIL', // System printer name
    width: 58,
    characterSet: 'PC852_LATIN2',
    removeSpecialCharacters: false,
    lineCharacter: '=',
    driver: require('printer'), // System printer driver
    options: { timeout: 5000 }
  },
  production: {
    type: 'epson',
    interface: 'tcp://192.168.1.100:9100', // Network printer IP
    width: 58,
    characterSet: 'PC852_LATIN2',
    removeSpecialCharacters: false,
    lineCharacter: '=',
    options: { timeout: 3000 }
  }
};

// Environment variables
PRINTER_MODE=production // mock | development | production
PRINTER_INTERFACE=tcp://192.168.1.100:9100
PRINTER_TYPE=epson
PRINTER_WIDTH=58
PRINTER_TIMEOUT=3000
```

## <� UI/UX Considerations

### Print Status Indicators
```typescript
// Loading States
- "Mencetak struk..." (spinner)
- "Struk berhasil dicetak" (checkmark)
- "Gagal mencetak struk" (error icon)

// Actions
- [Cetak Ulang] button if failed
- [Preview Struk] option for simulation
- [Download PDF] fallback option
```

### Error Messages
- Printer tidak terhubung
- Kertas printer habis
- Gagal mencetak, silakan coba lagi
- Struk gagal dicetak, download PDF?

## = Security & Error Handling

### Security Considerations
- Validate receipt content (prevent injection)
- Secure printer connection
- Audit trail untuk print attempts

### Error Handling Strategy
```typescript
interface PrintResult {
  success: boolean;
  message?: string;
  fallbackOption?: 'PDF' | 'RETRY';
  receiptId?: string;
}

const handlePrintError = (error: Error): PrintResult => {
  if (error.message.includes('offline')) {
    return {
      success: false,
      message: 'Printer tidak terhubung',
      fallbackOption: 'PDF'
    };
  }
  // ... other error types
};
```

## =� Success Metrics

### Technical Metrics
- Receipt generation time < 2s
- Print success rate > 95%
- Zero transaction blocking due to print failures

### Business Metrics
- Customer satisfaction (receipt documentation)
- Reduced dispute cases (physical proof)
- Audit compliance improvement

## = Future Enhancements

### Phase 2 Features (Optional)
- Email/SMS receipt delivery
- Receipt search & reprint
- Custom receipt templates
- Analytics (receipt tracking)
- QR code integration for digital receipts

### Scalability Considerations
- Multiple printer support
- Queue management for high volume
- Cloud printing options
- Mobile receipt options

---

##  Acceptance Criteria

### Definition of Done
- [ ] Receipt automatically generated after transaction
- [ ] Receipt contains all required information
- [ ] Printer integration works with thermal printer
- [ ] Error handling implemented for all failure scenarios
- [ ] Simulation mode works for development
- [ ] All tests pass (unit, integration, e2e)
- [ ] Documentation complete
- [ ] Performance requirements met

### Test Coverage
- Unit tests: >90%
- Integration tests: Critical paths covered
- E2E tests: Happy path and error scenarios
- Manual testing: Real printer validation

---

**Status**: Ready for Implementation
**Next Step**: Research thermal printer libraries and create detailed implementation guide