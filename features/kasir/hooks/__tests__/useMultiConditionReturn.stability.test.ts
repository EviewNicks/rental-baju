/**
 * Hook Stability Tests for useMultiConditionReturn
 * 
 * Tests to prevent infinite re-render loops and ensure stable behavior
 * Created to prevent regression of maximum update depth exceeded error
 */

import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useMultiConditionReturn } from '../useMultiConditionReturn'
import type { TransaksiDetail } from '../../types'

// Mock kasirApi and logger
jest.mock('../../api', () => ({
  kasirApi: {
    calculateEnhancedPenalties: jest.fn().mockResolvedValue(null),
    processEnhancedReturn: jest.fn().mockResolvedValue({})
  }
}))

jest.mock('../../services/logger', () => ({
  kasirLogger: {
    stateManagement: { debug: jest.fn() },
    returnProcess: { info: jest.fn(), error: jest.fn() },
    penaltyCalc: { info: jest.fn(), error: jest.fn() },
    performance: { 
      startTimer: jest.fn().mockReturnValue({ end: jest.fn() })
    },
    validation: { warn: jest.fn() }
  }
}))

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn()
  }
}))

// Mock transaction data
const mockTransaction: TransaksiDetail = {
  id: 'txn-1',
  kode: 'TXN-001',
  status: 'active',
  tglSewa: '2025-08-01',
  tglKembali: '2025-08-05',
  items: [
    {
      id: 'item-1',
      produkId: 'prod-1',
      jumlahDiambil: 2,
      statusKembali: 'belum',
      produk: { name: 'Test Item 1' }
    },
    {
      id: 'item-2', 
      produkId: 'prod-2',
      jumlahDiambil: 1,
      statusKembali: 'belum',
      produk: { name: 'Test Item 2' }
    }
  ]
} as TransaksiDetail

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  const TestWrapper = ({ children }: { children: React.ReactNode }) => 
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  
  TestWrapper.displayName = 'TestWrapper'
  return TestWrapper
}

describe('useMultiConditionReturn - Stability Tests', () => {
  let renderCount: number
  
  beforeEach(() => {
    renderCount = 0
    jest.clearAllMocks()
  })

  it('should not cause infinite re-renders when setting transaction', () => {
    const { result } = renderHook(() => {
      renderCount++
      return useMultiConditionReturn()
    }, { wrapper: createWrapper() })

    // Initial render
    expect(renderCount).toBe(1)

    // Set transaction - should not cause infinite loop
    act(() => {
      result.current.setTransaction(mockTransaction)
    })

    // Should have rendered only a few more times (not hundreds/thousands)
    expect(renderCount).toBeLessThan(10)
    expect(result.current.transaction).toBe(mockTransaction)
  })

  it('should not cause infinite re-renders when item conditions change', () => {
    const { result } = renderHook(() => {
      renderCount++
      return useMultiConditionReturn()
    }, { wrapper: createWrapper() })

    // Set up transaction first
    act(() => {
      result.current.setTransaction(mockTransaction)
    })

    const initialRenderCount = renderCount

    // Set item condition - should not cause infinite loop
    act(() => {
      result.current.setItemCondition('item-1', {
        itemId: 'item-1',
        mode: 'single',
        conditions: [{ kondisiAkhir: 'baik', jumlahKembali: 2 }],
        isValid: true,
        totalQuantity: 2,
        remainingQuantity: 0
      })
    })

    // Should have rendered only a few more times after the condition change
    expect(renderCount - initialRenderCount).toBeLessThan(10)
  })

  it('should have stable callback references for key functions', () => {
    const { result, rerender } = renderHook(() => useMultiConditionReturn(), { 
      wrapper: createWrapper() 
    })

    const initialCallbacks = {
      setItemCondition: result.current.setItemCondition,
      setItemMode: result.current.setItemMode,
      validateAllItems: result.current.validateAllItems,
      processEnhancedReturn: result.current.processEnhancedReturn
    }

    // Force re-render
    rerender()

    // Callbacks should be referentially stable (same references)
    expect(result.current.setItemCondition).toBe(initialCallbacks.setItemCondition)
    expect(result.current.setItemMode).toBe(initialCallbacks.setItemMode)
    expect(result.current.validateAllItems).toBe(initialCallbacks.validateAllItems)
    expect(result.current.processEnhancedReturn).toBe(initialCallbacks.processEnhancedReturn)
  })

  it('should validate items without triggering excessive re-renders', () => {
    const { result } = renderHook(() => {
      renderCount++
      return useMultiConditionReturn()
    }, { wrapper: createWrapper() })

    // Set up transaction
    act(() => {
      result.current.setTransaction(mockTransaction)
    })

    const preValidationCount = renderCount

    // Validate all items - should not cause excessive re-renders
    act(() => {
      result.current.validateAllItems()
    })

    expect(renderCount - preValidationCount).toBeLessThan(5)
  })

  it('should handle mode changes without infinite loops', () => {
    const { result } = renderHook(() => {
      renderCount++
      return useMultiConditionReturn()
    }, { wrapper: createWrapper() })

    // Set up transaction
    act(() => {
      result.current.setTransaction(mockTransaction)
    })

    const preChangeCount = renderCount

    // Change item mode - should not cause infinite loop
    act(() => {
      result.current.setItemMode('item-1', 'multi')
    })

    expect(renderCount - preChangeCount).toBeLessThan(5)
  })
})