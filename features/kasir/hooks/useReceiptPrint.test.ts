/**
 * Unit Tests for useReceiptPrint Hook
 * Testing receipt PDF generation hook functionality
 * 
 * Coverage:
 * - Loading state management
 * - Success flow with toast notification
 * - Error handling with toast notification
 * - New tab opening
 * - Error recovery
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useReceiptPrint } from './useReceiptPrint'
import { toast } from 'sonner'

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock window.open
const mockWindowOpen = jest.fn()
Object.defineProperty(window, 'open', {
  writable: true,
  value: mockWindowOpen,
})

// Mock URL.createObjectURL
const mockCreateObjectURL = jest.fn()
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: mockCreateObjectURL,
})

// Mock fetch
global.fetch = jest.fn()

describe('useReceiptPrint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockWindowOpen.mockClear()
    mockCreateObjectURL.mockClear()
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('Initial State', () => {
    it('should initialize with isPrinting false', () => {
      const { result } = renderHook(() => useReceiptPrint())

      expect(result.current.isPrinting).toBe(false)
      expect(result.current.printReceipt).toBeInstanceOf(Function)
    })
  })

  describe('printReceipt - Success Flow', () => {
    /**
     * Property 13: Loading State Management
     * Validates: Requirements 1.3, 7.3, 8.2
     */
    it('should set isPrinting to true during generation', async () => {
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' })
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      })
      mockCreateObjectURL.mockReturnValue('blob:mock-url')

      const { result } = renderHook(() => useReceiptPrint())

      // Start the async operation
      act(() => {
        result.current.printReceipt('TXN-123')
      })

      // Check that isPrinting is true immediately
      expect(result.current.isPrinting).toBe(true)

      // Wait for completion
      await waitFor(() => {
        expect(result.current.isPrinting).toBe(false)
      })
    })

    it('should reset isPrinting to false after success', async () => {
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' })
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      })
      mockCreateObjectURL.mockReturnValue('blob:mock-url')

      const { result } = renderHook(() => useReceiptPrint())

      await act(async () => {
        await result.current.printReceipt('TXN-123')
      })

      expect(result.current.isPrinting).toBe(false)
    })

    /**
     * Property 14: New Tab Navigation
     * Validates: Requirements 1.2, 8.3
     */
    it('should open PDF in new tab', async () => {
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' })
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      })
      mockCreateObjectURL.mockReturnValue('blob:mock-url')

      const { result } = renderHook(() => useReceiptPrint())

      await act(async () => {
        await result.current.printReceipt('TXN-123')
      })

      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob)
      expect(mockWindowOpen).toHaveBeenCalledWith('blob:mock-url', '_blank')
    })

    it('should show success toast', async () => {
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' })
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      })
      mockCreateObjectURL.mockReturnValue('blob:mock-url')

      const { result } = renderHook(() => useReceiptPrint())

      await act(async () => {
        await result.current.printReceipt('TXN-123')
      })

      expect(toast.success).toHaveBeenCalledWith('Struk berhasil dibuat')
    })

    it('should call API with correct endpoint', async () => {
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' })
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      })
      mockCreateObjectURL.mockReturnValue('blob:mock-url')

      const { result } = renderHook(() => useReceiptPrint())

      await act(async () => {
        await result.current.printReceipt('TXN-20251201-002')
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/kasir/receipt/TXN-20251201-002/pdf')
    })
  })

  describe('printReceipt - Error Handling', () => {
    it('should show error toast on network failure', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useReceiptPrint())

      await act(async () => {
        await result.current.printReceipt('TXN-123')
      })

      expect(toast.error).toHaveBeenCalledWith('Gagal membuat struk. Silakan coba lagi.')
    })

    it('should show error toast on 404 response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      const { result } = renderHook(() => useReceiptPrint())

      await act(async () => {
        await result.current.printReceipt('TXN-INVALID')
      })

      expect(toast.error).toHaveBeenCalledWith('Transaksi tidak ditemukan')
    })

    it('should show error toast on 401 response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      })

      const { result } = renderHook(() => useReceiptPrint())

      await act(async () => {
        await result.current.printReceipt('TXN-123')
      })

      expect(toast.error).toHaveBeenCalledWith('Anda tidak memiliki akses untuk mencetak struk')
    })

    it('should show error toast on 500 response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      const { result } = renderHook(() => useReceiptPrint())

      await act(async () => {
        await result.current.printReceipt('TXN-123')
      })

      expect(toast.error).toHaveBeenCalledWith('Gagal membuat struk. Silakan coba lagi.')
    })

    /**
     * Error Recovery Test
     * Validates: Requirements 7.3
     */
    it('should reset isPrinting to false after error', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useReceiptPrint())

      await act(async () => {
        await result.current.printReceipt('TXN-123')
      })

      expect(result.current.isPrinting).toBe(false)
    })

    it('should log error to console', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useReceiptPrint())

      await act(async () => {
        await result.current.printReceipt('TXN-123')
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Receipt generation error:',
        expect.objectContaining({
          transactionId: 'TXN-123',
          error: 'Network error',
        })
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('printReceipt - Edge Cases', () => {
    it('should handle empty transaction ID gracefully', async () => {
      const { result } = renderHook(() => useReceiptPrint())

      await act(async () => {
        await result.current.printReceipt('')
      })

      expect(global.fetch).not.toHaveBeenCalled()
      expect(result.current.isPrinting).toBe(false)
    })

    it('should handle blob creation failure', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: () => Promise.reject(new Error('Blob creation failed')),
      })

      const { result } = renderHook(() => useReceiptPrint())

      await act(async () => {
        await result.current.printReceipt('TXN-123')
      })

      expect(toast.error).toHaveBeenCalledWith('Gagal membuat struk. Silakan coba lagi.')
      expect(result.current.isPrinting).toBe(false)
    })

    it('should handle URL.createObjectURL failure', async () => {
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' })
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      })
      mockCreateObjectURL.mockImplementation(() => {
        throw new Error('URL creation failed')
      })

      const { result } = renderHook(() => useReceiptPrint())

      await act(async () => {
        await result.current.printReceipt('TXN-123')
      })

      expect(toast.error).toHaveBeenCalledWith('Gagal membuat struk. Silakan coba lagi.')
      expect(result.current.isPrinting).toBe(false)
    })
  })

  describe('Multiple Calls', () => {
    it('should handle multiple sequential calls', async () => {
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' })
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      })
      mockCreateObjectURL.mockReturnValue('blob:mock-url')

      const { result } = renderHook(() => useReceiptPrint())

      // First call
      await act(async () => {
        await result.current.printReceipt('TXN-001')
      })

      expect(result.current.isPrinting).toBe(false)
      expect(toast.success).toHaveBeenCalledTimes(1)

      // Second call
      await act(async () => {
        await result.current.printReceipt('TXN-002')
      })

      expect(result.current.isPrinting).toBe(false)
      expect(toast.success).toHaveBeenCalledTimes(2)
    })
  })

  describe('Console Logging', () => {
    it('should log success to console', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' })
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      })
      mockCreateObjectURL.mockReturnValue('blob:mock-url')

      const { result } = renderHook(() => useReceiptPrint())

      await act(async () => {
        await result.current.printReceipt('TXN-123')
      })

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Receipt PDF generated successfully:',
        expect.objectContaining({
          transactionId: 'TXN-123',
        })
      )

      consoleLogSpy.mockRestore()
    })
  })
})
