/**
 * Integration Tests for Return Flow with New Penalty System
 * Tests the complete flow from UI to database with flat 20k penalty and manual pricing
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMultiConditionReturn } from '../../../features/kasir/hooks/useMultiConditionReturn'
import { UnifiedConditionForm } from '../../../features/kasir/components/return/UnifiedConditionForm'
import { ConditionPricingForm } from '../../../features/kasir/components/return/ConditionPricingForm'
import type { TransaksiDetail, ConditionCategory } from '../../../features/kasir/types'

// Mock API calls
jest.mock('../../../features/kasir/api', () => ({
  kasirApi: {
    calculateEnhancedPenalties: jest.fn(),
    processEnhancedReturn: jest.fn(),
  }
}))

// Test data setup
const mockTransactionDetail: TransaksiDetail = {
  id: 'trans-123',
  kode: 'TR-2025-001',
  penyewa: {
    id: 'penyewa-1',
    name: 'John Doe',
    phone: '081234567890',
    address: 'Jakarta',
    email: 'john@example.com'
  },
  items: [
    {
      id: 'item-1',
      jumlahDiambil: 3,
      statusKembali: 'belum',
      produk: {
        id: 'prod-1',
        name: 'Kebaya Tradisional',
        modalAwal: 150000
      }
    },
    {
      id: 'item-2',
      jumlahDiambil: 2,
      statusKembali: 'belum',
      produk: {
        id: 'prod-2',
        name: 'Baju Adat',
        modalAwal: 200000
      }
    }
  ],
  totalAmount: 500000,
  amountPaid: 500000,
  remainingAmount: 0,
  status: 'active',
  tglMulai: '2025-09-01',
  tglSelesai: '2025-09-10',
  metodeBayar: 'CASH'
}

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('Return Flow Integration', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    jest.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('Hook Integration', () => {
    it('should initialize with correct default values for new penalty system', () => {
      const { result } = renderHook(() => useMultiConditionReturn(), {
        wrapper: TestWrapper
      })

      expect(result.current.currentStep).toBe(1)
      expect(result.current.itemConditions).toEqual({})
      expect(result.current.validation.canProceed).toBe(false)
      expect(result.current.penaltyCalculation).toBeNull()
    })

    it('should set transaction and initialize item conditions with manual pricing fields', async () => {
      const { result } = renderHook(() => useMultiConditionReturn(), {
        wrapper: TestWrapper
      })

      act(() => {
        result.current.setTransaction(mockTransactionDetail)
      })

      await waitFor(() => {
        expect(Object.keys(result.current.itemConditions)).toHaveLength(2)

        const item1Condition = result.current.itemConditions['item-1']
        expect(item1Condition).toBeDefined()
        expect(item1Condition.conditions[0]).toMatchObject({
          kondisiAkhir: '',
          jumlahKembali: 3,
          conditionCategory: 'BAIK',
          useManualPricing: false,
          manualPrice: 0
        })

        const item2Condition = result.current.itemConditions['item-2']
        expect(item2Condition).toBeDefined()
        expect(item2Condition.conditions[0]).toMatchObject({
          kondisiAkhir: '',
          jumlahKembali: 2,
          conditionCategory: 'BAIK',
          useManualPricing: false,
          manualPrice: 0
        })
      })
    })

    it('should validate conditions with manual pricing requirements', async () => {
      const { result } = renderHook(() => useMultiConditionReturn(), {
        wrapper: TestWrapper
      })

      act(() => {
        result.current.setTransaction(mockTransactionDetail)
      })

      await waitFor(() => {
        expect(Object.keys(result.current.itemConditions)).toHaveLength(2)
      })

      // Set valid condition with manual pricing
      act(() => {
        result.current.setItemCondition('item-1', {
          itemId: 'item-1',
          mode: 'single',
          conditions: [{
            kondisiAkhir: 'Kotor dengan noda khusus',
            jumlahKembali: 3,
            conditionCategory: 'KOTOR' as ConditionCategory,
            useManualPricing: true,
            manualPrice: 7500
          }],
          isValid: true,
          totalQuantity: 3,
          remainingQuantity: 0
        })
      })

      // Set condition with missing manual price (should be invalid)
      act(() => {
        result.current.setItemCondition('item-2', {
          itemId: 'item-2',
          mode: 'single',
          conditions: [{
            kondisiAkhir: 'Rusak ringan',
            jumlahKembali: 2,
            conditionCategory: 'RUSAK_RINGAN' as ConditionCategory,
            useManualPricing: true,
            manualPrice: undefined // Invalid - missing manual price
          }],
          isValid: false,
          totalQuantity: 2,
          remainingQuantity: 0
        })
      })

      await waitFor(() => {
        const isValid = result.current.validateAllItems()
        expect(isValid).toBe(false)
        expect(result.current.validation.errors).toContain(
          expect.stringContaining('manual')
        )
      })
    })
  })

  describe('ConditionPricingForm Integration', () => {
    it('should render with all manual pricing controls', () => {
      const mockCondition = {
        kondisiAkhir: '',
        jumlahKembali: 1,
        conditionCategory: 'BAIK' as ConditionCategory,
        useManualPricing: false,
        manualPrice: 0
      }

      render(
        <TestWrapper>
          <ConditionPricingForm
            condition={mockCondition}
            onChange={jest.fn()}
            maxQuantity={5}
            productModalAwal={150000}
          />
        </TestWrapper>
      )

      expect(screen.getByText('Kategori Kondisi')).toBeInTheDocument()
      expect(screen.getByText('Deskripsi Kondisi')).toBeInTheDocument()
      expect(screen.getByText('Jumlah')).toBeInTheDocument()
      expect(screen.getByText('Harga Manual')).toBeInTheDocument()
      expect(screen.getByRole('switch')).toBeInTheDocument()
    })

    it('should enable manual price input when toggle is activated', async () => {
      const user = userEvent.setup()
      const mockOnChange = jest.fn()

      const mockCondition = {
        kondisiAkhir: 'Test condition',
        jumlahKembali: 1,
        conditionCategory: 'KOTOR' as ConditionCategory,
        useManualPricing: false,
        manualPrice: 5000
      }

      render(
        <TestWrapper>
          <ConditionPricingForm
            condition={mockCondition}
            onChange={mockOnChange}
            maxQuantity={5}
            productModalAwal={150000}
          />
        </TestWrapper>
      )

      const manualPricingToggle = screen.getByRole('switch')
      await user.click(manualPricingToggle)

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          useManualPricing: true,
          manualPrice: 5000 // Should set suggested price
        })
      )
    })

    it('should show suggested prices for different condition categories', async () => {
      const user = userEvent.setup()
      const mockOnChange = jest.fn()

      const mockCondition = {
        kondisiAkhir: '',
        jumlahKembali: 1,
        conditionCategory: 'BAIK' as ConditionCategory,
        useManualPricing: false,
        manualPrice: 0
      }

      render(
        <TestWrapper>
          <ConditionPricingForm
            condition={mockCondition}
            onChange={mockOnChange}
            maxQuantity={5}
            productModalAwal={150000}
          />
        </TestWrapper>
      )

      // Open category selector
      const categorySelect = screen.getByRole('combobox')
      await user.click(categorySelect)

      // Check if suggested prices are shown for different categories
      expect(screen.getByText('Tanpa Penalty')).toBeInTheDocument() // BAIK
      expect(screen.getByText('Rp 5.000')).toBeInTheDocument() // KOTOR
      expect(screen.getByText('Rp 15.000')).toBeInTheDocument() // RUSAK_RINGAN
      expect(screen.getByText('Rp 50.000')).toBeInTheDocument() // RUSAK_BERAT
    })
  })

  describe('Complete Return Flow', () => {
    it('should process complete return with mixed pricing types', async () => {
      const { kasirApi } = await import('../../../features/kasir/api')
      const mockCalculateEnhancedPenalties = kasirApi.calculateEnhancedPenalties as jest.MockedFunction<typeof kasirApi.calculateEnhancedPenalties>
      const mockProcessEnhancedReturn = kasirApi.processEnhancedReturn as jest.MockedFunction<typeof kasirApi.processEnhancedReturn>

      // Mock API responses
      mockCalculateEnhancedPenalties.mockResolvedValue({
        totalPenalty: 35000,
        flatLatePenalty: 20000,
        conditionPenalty: 15000,
        breakdown: []
      })

      mockProcessEnhancedReturn.mockResolvedValue({
        success: true,
        processingMode: 'multi-condition',
        transactionId: 'TR-2025-001',
        itemsProcessed: 2,
        conditionSplitsProcessed: 2,
        totalPenalty: 35000,
        message: 'Return processed successfully'
      })

      const { result } = renderHook(() => useMultiConditionReturn(), {
        wrapper: TestWrapper
      })

      // Initialize transaction
      act(() => {
        result.current.setTransaction(mockTransactionDetail)
      })

      await waitFor(() => {
        expect(Object.keys(result.current.itemConditions)).toHaveLength(2)
      })

      // Set item 1 with automatic pricing
      act(() => {
        result.current.setItemCondition('item-1', {
          itemId: 'item-1',
          mode: 'single',
          conditions: [{
            kondisiAkhir: 'Kotor biasa',
            jumlahKembali: 3,
            conditionCategory: 'KOTOR' as ConditionCategory,
            useManualPricing: false,
            manualPrice: 5000
          }],
          isValid: true,
          totalQuantity: 3,
          remainingQuantity: 0
        })
      })

      // Set item 2 with manual pricing
      act(() => {
        result.current.setItemCondition('item-2', {
          itemId: 'item-2',
          mode: 'single',
          conditions: [{
            kondisiAkhir: 'Rusak khusus memerlukan perbaikan mahal',
            jumlahKembali: 2,
            conditionCategory: 'RUSAK_BERAT' as ConditionCategory,
            useManualPricing: true,
            manualPrice: 75000
          }],
          isValid: true,
          totalQuantity: 2,
          remainingQuantity: 0
        })
      })

      // Validate all items
      await waitFor(() => {
        const isValid = result.current.validateAllItems()
        expect(isValid).toBe(true)
      })

      // Calculate penalties
      await act(async () => {
        await result.current.calculatePenalties()
      })

      // Process return
      let returnResult
      await act(async () => {
        returnResult = await result.current.processEnhancedReturn('Test return with mixed pricing')
      })

      expect(returnResult).toMatchObject({
        success: true,
        processingMode: 'multi-condition',
        totalPenalty: 35000,
        itemsProcessed: 2
      })

      // Verify API was called with correct data structure
      expect(mockProcessEnhancedReturn).toHaveBeenCalledWith(
        'TR-2025-001',
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              itemId: 'item-1',
              kondisiAkhir: 'Kotor biasa',
              jumlahKembali: 3,
              conditionCategory: 'KOTOR',
              useManualPricing: false,
              manualPrice: 5000
            }),
            expect.objectContaining({
              itemId: 'item-2',
              kondisiAkhir: 'Rusak khusus memerlukan perbaikan mahal',
              jumlahKembali: 2,
              conditionCategory: 'RUSAK_BERAT',
              useManualPricing: true,
              manualPrice: 75000
            })
          ]),
          catatan: 'Test return with mixed pricing'
        })
      )
    })

    it('should handle multi-condition items with different pricing types', async () => {
      const { result } = renderHook(() => useMultiConditionReturn(), {
        wrapper: TestWrapper
      })

      act(() => {
        result.current.setTransaction(mockTransactionDetail)
      })

      await waitFor(() => {
        expect(Object.keys(result.current.itemConditions)).toHaveLength(2)
      })

      // Set multi-condition item with mixed pricing
      act(() => {
        result.current.setItemCondition('item-1', {
          itemId: 'item-1',
          mode: 'multi',
          conditions: [
            {
              kondisiAkhir: 'Sebagian baik',
              jumlahKembali: 1,
              conditionCategory: 'BAIK' as ConditionCategory,
              useManualPricing: false,
              manualPrice: 0
            },
            {
              kondisiAkhir: 'Sebagian kotor dengan noda khusus',
              jumlahKembali: 1,
              conditionCategory: 'KOTOR' as ConditionCategory,
              useManualPricing: true,
              manualPrice: 8000
            },
            {
              kondisiAkhir: 'Sebagian hilang',
              jumlahKembali: 1,
              conditionCategory: 'HILANG' as ConditionCategory,
              useManualPricing: false,
              manualPrice: 0,
              modalAwal: 150000
            }
          ],
          isValid: true,
          totalQuantity: 3,
          remainingQuantity: 0
        })
      })

      const apiRequest = result.current.convertToApiRequest()

      expect(apiRequest?.items[0]).toMatchObject({
        itemId: 'item-1',
        conditions: [
          expect.objectContaining({
            kondisiAkhir: 'Sebagian baik',
            jumlahKembali: 1,
            conditionCategory: 'BAIK',
            useManualPricing: false
          }),
          expect.objectContaining({
            kondisiAkhir: 'Sebagian kotor dengan noda khusus',
            jumlahKembali: 1,
            conditionCategory: 'KOTOR',
            useManualPricing: true,
            manualPrice: 8000
          }),
          expect.objectContaining({
            kondisiAkhir: 'Sebagian hilang',
            jumlahKembali: 1,
            conditionCategory: 'HILANG',
            useManualPricing: false,
            modalAwal: 150000
          })
        ]
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle validation errors for manual pricing', async () => {
      const { result } = renderHook(() => useMultiConditionReturn(), {
        wrapper: TestWrapper
      })

      act(() => {
        result.current.setTransaction(mockTransactionDetail)
      })

      await waitFor(() => {
        expect(Object.keys(result.current.itemConditions)).toHaveLength(2)
      })

      // Set invalid condition with manual pricing enabled but no price
      act(() => {
        result.current.setItemCondition('item-1', {
          itemId: 'item-1',
          mode: 'single',
          conditions: [{
            kondisiAkhir: 'Valid description',
            jumlahKembali: 3,
            conditionCategory: 'KOTOR' as ConditionCategory,
            useManualPricing: true,
            manualPrice: undefined // Invalid
          }],
          isValid: false,
          totalQuantity: 3,
          remainingQuantity: 0
        })
      })

      await waitFor(() => {
        const isValid = result.current.validateAllItems()
        expect(isValid).toBe(false)
        expect(result.current.validation.errors.length).toBeGreaterThan(0)
        expect(result.current.canProceedToNext(1)).toBe(false)
      })
    })

    it('should handle API errors gracefully during return processing', async () => {
      const { kasirApi } = await import('../../../features/kasir/api')
      const mockProcessEnhancedReturn = kasirApi.processEnhancedReturn as jest.MockedFunction<typeof kasirApi.processEnhancedReturn>

      mockProcessEnhancedReturn.mockRejectedValue(new Error('API Error: Invalid penalty calculation'))

      const { result } = renderHook(() => useMultiConditionReturn(), {
        wrapper: TestWrapper
      })

      act(() => {
        result.current.setTransaction(mockTransactionDetail)
      })

      await waitFor(() => {
        expect(Object.keys(result.current.itemConditions)).toHaveLength(2)
      })

      // Set valid conditions
      act(() => {
        result.current.setItemCondition('item-1', {
          itemId: 'item-1',
          mode: 'single',
          conditions: [{
            kondisiAkhir: 'Valid condition',
            jumlahKembali: 3,
            conditionCategory: 'BAIK' as ConditionCategory,
            useManualPricing: false,
            manualPrice: 0
          }],
          isValid: true,
          totalQuantity: 3,
          remainingQuantity: 0
        })
      })

      await waitFor(() => {
        expect(result.current.validateAllItems()).toBe(true)
      })

      // Attempt to process return (should fail)
      await expect(async () => {
        await act(async () => {
          await result.current.processEnhancedReturn()
        })
      }).rejects.toThrow('API Error: Invalid penalty calculation')

      expect(result.current.error).toContain('API Error')
    })
  })

  describe('Performance', () => {
    it('should handle large transactions efficiently', async () => {
      const largeTransaction: TransaksiDetail = {
        ...mockTransactionDetail,
        items: Array.from({ length: 50 }, (_, index) => ({
          id: `item-${index}`,
          jumlahDiambil: 2,
          statusKembali: 'belum',
          produk: {
            id: `prod-${index}`,
            name: `Product ${index}`,
            modalAwal: 100000 + (index * 10000)
          }
        }))
      }

      const { result } = renderHook(() => useMultiConditionReturn(), {
        wrapper: TestWrapper
      })

      const startTime = Date.now()

      act(() => {
        result.current.setTransaction(largeTransaction)
      })

      await waitFor(() => {
        expect(Object.keys(result.current.itemConditions)).toHaveLength(50)
      })

      const endTime = Date.now()
      const executionTime = endTime - startTime

      expect(executionTime).toBeLessThan(2000) // Should complete within 2 seconds
    })
  })
})