# Kasir Hooks

Custom React hooks untuk fitur kasir.

## useReceiptPrint

Hook untuk handle receipt PDF generation dan preview.

### Usage

```tsx
import { useReceiptPrint } from '@/features/kasir/hooks/useReceiptPrint'

function TransactionDetailPage() {
  const { printReceipt, isPrinting } = useReceiptPrint()

  return (
    <Button 
      onClick={() => printReceipt('TXN-20251201-002')} 
      disabled={isPrinting}
    >
      {isPrinting ? 'Generating...' : 'Cetak Struk'}
    </Button>
  )
}
```

### Features

- ✅ Loading state management (`isPrinting`)
- ✅ API call to `/api/kasir/receipt/[transaksiId]/pdf`
- ✅ Opens PDF in new browser tab
- ✅ Success toast notification
- ✅ Error handling with user-friendly messages
- ✅ Console logging for debugging
- ✅ Automatic state reset on completion/error

### Error Handling

| Status Code | User Message | Action |
|------------|--------------|--------|
| 404 | "Transaksi tidak ditemukan" | Show toast, reset state |
| 401 | "Anda tidak memiliki akses untuk mencetak struk" | Show toast, reset state |
| Network Error | "Gagal membuat struk. Silakan coba lagi." | Show toast, reset state |

### Testing

```bash
# Manual testing steps:
1. Navigate to transaction detail page
2. Click "Cetak Struk" button
3. Verify loading state appears
4. Verify PDF opens in new tab
5. Verify success toast appears
6. Verify button returns to normal state

# Error scenarios:
1. Test with invalid transaction ID
2. Test with network disconnected
3. Test with unauthorized user
```

## useTransactionDetail

Hook untuk fetch dan manage transaction detail data.

(Existing hook - see implementation for details)

## useTransactions

Hook untuk fetch dan manage transaction list data.

(Existing hook - see implementation for details)
