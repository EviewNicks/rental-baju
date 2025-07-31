/**
 * Tests for usePickupProcess hook - TSK-22
 * Following TDD approach and established testing patterns
 */

import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode } from 'react'
import { usePickupProcess, usePickupValidation } from './usePickupProcess'

// Mock fetch globally
global.fetch = jest.fn()

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

// Create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  const TestWrapper = ({ children }: { children: ReactNode }) => 
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  
  TestWrapper.displayName = 'TestWrapper'
  return TestWrapper
}

describe('usePickupProcess', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('should handle successful pickup', async () => {
    const mockResponse = {
      success: true,
      message: 'Pickup berhasil diproses',
      data: {
        transaction: { id: 'test', kode: 'TRX001' }
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    const wrapper = createWrapper()
    const { result } = renderHook(() => usePickupProcess('TRX001'), { wrapper })

    // Trigger the mutation
    result.current.mutate({
      items: [{ id: 'item1', jumlahDiambil: 2 }]
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/kasir/transaksi/TRX001/ambil',
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ id: 'item1', jumlahDiambil: 2 }]
        })
      })
    )
  })

  it('should handle failed pickup', async () => {
    const mockError = {
      success: false,
      message: 'Pickup gagal',
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid pickup data'
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => mockError,
    } as Response)

    const wrapper = createWrapper()
    const { result } = renderHook(() => usePickupProcess('TRX001'), { wrapper })

    // Trigger the mutation
    result.current.mutate({
      items: [{ id: 'item1', jumlahDiambil: 2 }]
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('Invalid pickup data')
  })
})

describe('usePickupValidation', () => {
  it('should validate pickup items correctly', () => {
    const { validatePickupItems } = usePickupValidation()

    const pickupItems = [
      { id: 'item1', jumlahDiambil: 2 }
    ]

    const transactionItems = [
      {
        id: 'item1',
        jumlah: 5,
        jumlahDiambil: 1,
        produk: { name: 'Product 1' }
      }
    ]

    const result = validatePickupItems(pickupItems, transactionItems)

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject excessive pickup quantities', () => {
    const { validatePickupItems } = usePickupValidation()

    const pickupItems = [
      { id: 'item1', jumlahDiambil: 5 } // Trying to pick up 5, but only 4 remaining
    ]

    const transactionItems = [
      {
        id: 'item1',
        jumlah: 5,
        jumlahDiambil: 1, // Already picked up 1, so remaining = 4
        produk: { name: 'Product 1' }
      }
    ]

    const result = validatePickupItems(pickupItems, transactionItems)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain(
      'Jumlah pickup untuk Product 1 (5) melebihi sisa yang belum diambil (4)'
    )
  })

  it('should reject zero quantities', () => {
    const { validatePickupItems } = usePickupValidation()

    const pickupItems = [
      { id: 'item1', jumlahDiambil: 0 }
    ]

    const transactionItems = [
      {
        id: 'item1',
        jumlah: 5,
        jumlahDiambil: 0,
        produk: { name: 'Product 1' }
      }
    ]

    const result = validatePickupItems(pickupItems, transactionItems)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain(
      'Jumlah pickup untuk Product 1 harus lebih dari 0'
    )
  })

  it('should require at least one item for pickup', () => {
    const { validatePickupItems } = usePickupValidation()

    const result = validatePickupItems([], [])

    expect(result.valid).toBe(false)
    expect(result.errors).toContain(
      'Minimal satu item harus dipilih untuk pickup'
    )
  })
})