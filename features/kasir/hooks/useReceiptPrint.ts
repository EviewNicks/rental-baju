import { useState } from 'react'
import { toast } from 'sonner'

interface UseReceiptPrintReturn {
  printReceipt: (transactionId: string) => Promise<void>
  isPrinting: boolean
}

/**
 * Custom hook for handling receipt PDF generation and preview
 * 
 * Features:
 * - Manages loading state during PDF generation
 * - Fetches PDF from API endpoint
 * - Opens PDF in new browser tab
 * - Provides user feedback via toast notifications
 * - Handles errors gracefully
 * 
 * @returns {UseReceiptPrintReturn} Hook interface with printReceipt function and isPrinting state
 * 
 * @example
 * ```tsx
 * const { printReceipt, isPrinting } = useReceiptPrint()
 * 
 * <Button onClick={() => printReceipt('TXN-123')} disabled={isPrinting}>
 *   {isPrinting ? 'Generating...' : 'Cetak Struk'}
 * </Button>
 * ```
 */
export function useReceiptPrint(): UseReceiptPrintReturn {
  const [isPrinting, setIsPrinting] = useState(false)

  const printReceipt = async (transactionId: string) => {
    // Validation
    if (!transactionId) {
      toast.error('ID transaksi tidak valid')
      return
    }

    try {
      setIsPrinting(true)

      // Fetch PDF from API
      const response = await fetch(`/api/kasir/receipt/${transactionId}/pdf`)

      // Handle HTTP errors
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Transaksi tidak ditemukan')
          return
        }
        if (response.status === 401) {
          toast.error('Anda tidak memiliki akses untuk mencetak struk')
          return
        }
        throw new Error(`HTTP ${response.status}`)
      }

      // Convert response to blob
      const blob = await response.blob()

      // Create blob URL
      const url = URL.createObjectURL(blob)

      // Open PDF in new tab
      window.open(url, '_blank')

      // Show success message
      toast.success('Struk berhasil dibuat')

      // Log success for debugging
      console.log('Receipt PDF generated successfully:', {
        transactionId,
        blobSize: blob.size,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      // Log error details
      console.error('Receipt generation error:', {
        transactionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      })

      // Show user-friendly error message
      toast.error('Gagal membuat struk. Silakan coba lagi.')
    } finally {
      // Always reset loading state
      setIsPrinting(false)
    }
  }

  return {
    printReceipt,
    isPrinting,
  }
}
