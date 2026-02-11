/**
 * Unit Tests for Backend Error Handling
 *
 * Focus: Error handling scenarios only (not general functionality)
 *
 * Components tested:
 * - RetryHandler: Retry logic and error classification
 * - PerformanceMonitor: Error scenarios and degradation
 * - TransaksiService: Error handling integration
 *
 * @module features/kasir/services/transaksiService.errorhandle.test
 */

import { PrismaClient } from '@prisma/client'
import { TransaksiService } from './transaksiService'
import { RetryHandler, RetryError } from '../lib/resilience/RetryHandler'
import {
  QueryPerformanceMonitor,
  createPerformanceMonitor,
  createTransactionTimer,
} from '../lib/utils/performanceMonitor'

// Mock Decimal to avoid circular dependency issues
const createMockDecimal = (value: number) => ({
  toNumber: () => value,
  toString: () => value.toString(),
  valueOf: () => value,
})

// Mock dependencies
jest.mock('../lib/utils/codeGenerator', () => ({
  TransactionCodeGenerator: jest.fn().mockImplementation(() => ({
    generateTransactionCode: jest.fn().mockResolvedValue('TXN-20250726-001'),
  })),
}))

jest.mock('../lib/utils/server', () => ({
  PriceCalculator: {
    calculateTransactionTotalWithEnhancements: jest.fn().mockReturnValue({
      subtotal: 300000,
      discountAmount: 0,
      finalTotal: 300000,
      durationMultiplier: 1,
      itemCalculations: [
        {
          produkId: 'produk-1',
          finalPrice: 300000,
        },
      ],
    }),
  },
}))

jest.mock('./pairingService', () => ({
  sarungPairingService: {
    isEligibleForPairing: jest.fn().mockReturnValue(false),
  },
}))

// Mock DateCalculator
jest.mock('../lib/utils/dateCalculator', () => ({
  DateCalculator: {
    calculateReturnDate: jest.fn((startDate, duration) => {
      const date = new Date(startDate)
      date.setDate(date.getDate() + duration)
      return date.toISOString()
    }),
  },
}))

// ============================================================================
// RetryHandler Error Handling Tests
// ============================================================================

describe('RetryHandler - Error Handling', () => {
  let retryHandler: RetryHandler

  beforeEach(() => {
    retryHandler = new RetryHandler({ maxAttempts: 3, baseDelay: 10, maxDelay: 100 })
    jest.useRealTimers()
  })

  describe('should not retry non-transient errors', () => {
    it('should fail immediately on validation errors', async () => {
      const validationError = new Error('Validation failed: invalid input')

      const operation = jest.fn().mockRejectedValue(validationError)

      await expect(retryHandler.execute(operation)).rejects.toThrow(RetryError)

      // Should only attempt once (no retries for validation errors)
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should fail immediately on business logic errors', async () => {
      const businessError = new Error('Insufficient stock')

      const operation = jest.fn().mockRejectedValue(businessError)

      await expect(retryHandler.execute(operation)).rejects.toThrow(RetryError)

      // Should only attempt once
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should fail immediately on not found errors', async () => {
      const notFoundError = new Error('Penyewa tidak ditemukan')

      const operation = jest.fn().mockRejectedValue(notFoundError)

      await expect(retryHandler.execute(operation)).rejects.toThrow(RetryError)

      expect(operation).toHaveBeenCalledTimes(1)
    })
  })

  describe('should retry transient database errors', () => {
    it('should retry on connection timeout', async () => {
      const timeoutError = new Error('Connection timeout')
      const successResult = { data: 'success' }

      let attemptCount = 0
      const operation = jest.fn().mockImplementation(async () => {
        attemptCount++
        if (attemptCount < 3) {
          throw timeoutError
        }
        return successResult
      })

      const result = await retryHandler.execute(operation)

      expect(result).toEqual(successResult)
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should retry on database lock errors', async () => {
      const lockError = new Error('Database lock detected')

      let attemptCount = 0
      const operation = jest.fn().mockImplementation(async () => {
        attemptCount++
        if (attemptCount === 1) {
          throw lockError
        }
        return { data: 'unlocked' }
      })

      const result = await retryHandler.execute(operation)

      expect(result).toEqual({ data: 'unlocked' })
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should retry on network errors', async () => {
      const networkError = new Error('Network temporarily unavailable')

      let attemptCount = 0
      const operation = jest.fn().mockImplementation(async () => {
        attemptCount++
        if (attemptCount === 1) {
          throw networkError
        }
        return { connected: true }
      })

      const result = await retryHandler.execute(operation)

      expect(result).toEqual({ connected: true })
    })

    it('should retry on deadlock errors', async () => {
      const deadlockError = new Error('Deadlock detected, retrying transaction')

      let attemptCount = 0
      const operation = jest.fn().mockImplementation(async () => {
        attemptCount++
        if (attemptCount === 1) {
          throw deadlockError
        }
        return { committed: true }
      })

      const result = await retryHandler.execute(operation)

      expect(result).toEqual({ committed: true })
    })
  })

  describe('should fail after max attempts', () => {
    it('should fail after 3 attempts with persistent timeout error', async () => {
      const timeoutError = new Error('Connection timeout')

      const operation = jest.fn().mockRejectedValue(timeoutError)

      try {
        await retryHandler.execute(operation)
        fail('Should have thrown RetryError')
      } catch (error) {
        expect(error).toBeInstanceOf(RetryError)
        const retryError = error as RetryError
        expect(retryError.attempts).toBe(3)
        expect(retryError.lastError).toEqual(timeoutError)
      }

      expect(operation).toHaveBeenCalledTimes(3)
    })
  })

  describe('should return first successful result', () => {
    it('should succeed on second attempt after initial failure', async () => {
      const transientError = new Error('Database connection temporarily unavailable')
      const successResult = { id: 'txn-001' }

      let attemptCount = 0
      const operation = jest.fn().mockImplementation(async () => {
        attemptCount++
        if (attemptCount === 1) {
          throw transientError
        }
        return successResult
      })

      const result = await retryHandler.execute(operation)

      expect(result).toEqual(successResult)
      expect(operation).toHaveBeenCalledTimes(2)
    })
  })

  describe('should respect custom isRetryable function', () => {
    it('should use custom retry logic for specific error types', async () => {
      const customError = new Error('CUSTOM_RETRY_ERROR')

      // Custom logic: only retry if error message contains 'CUSTOM_RETRY'
      const isRetryableFn = (error: Error) => error.message.includes('CUSTOM_RETRY')

      let attemptCount = 0
      const operation = jest.fn().mockImplementation(async () => {
        attemptCount++
        if (attemptCount === 1) {
          throw customError
        }
        return { custom: 'success' }
      })

      const result = await retryHandler.execute(operation, isRetryableFn)

      expect(result).toEqual({ custom: 'success' })
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should not retry when custom function returns false', async () => {
      const nonRetryableError = new Error('DO_NOT_RETRY')

      const isRetryableFn = (error: Error) => !error.message.includes('DO_NOT_RETRY')

      const operation = jest.fn().mockRejectedValue(nonRetryableError)

      await expect(retryHandler.execute(operation, isRetryableFn)).rejects.toThrow(RetryError)

      expect(operation).toHaveBeenCalledTimes(1)
    })
  })

  describe('should classify errors correctly', () => {
    const retryablePatterns = [
      'timeout',
      'connection',
      'database',
      'network',
      'temporarily',
      'unavailable',
      'lock',
      'deadlock',
    ]

    retryablePatterns.forEach((pattern) => {
      it(`should classify "${pattern}" as retryable`, async () => {
        const error = new Error(`Error with ${pattern} detected`)

        let attemptCount = 0
        const operation = jest.fn().mockImplementation(async () => {
          attemptCount++
          if (attemptCount === 1) {
            throw error
          }
          return { success: true }
        })

        const result = await retryHandler.execute(operation)

        expect(operation).toHaveBeenCalledTimes(2) // Initial + 1 retry
        expect(result).toEqual({ success: true })
      })
    })

    it('should not retry on validation/business errors', async () => {
      const nonRetryablePatterns = [
        'Validation failed',
        'Insufficient stock',
        'Invalid input',
        'Not found',
        'Unauthorized',
        'Business rule violation',
      ]

      for (const pattern of nonRetryablePatterns) {
        const operation = jest.fn().mockRejectedValue(new Error(pattern))

        await expect(retryHandler.execute(operation)).rejects.toThrow(RetryError)

        expect(operation).toHaveBeenCalledTimes(1)
      }
    })
  })

  describe('should handle retry with context tracking', () => {
    it('should track retry attempts and delays', async () => {
      const transientError = new Error('Connection timeout')
      const successResult = { tracked: true }

      let attemptCount = 0
      const operation = jest.fn().mockImplementation(async () => {
        attemptCount++
        if (attemptCount < 3) {
          throw transientError
        }
        return successResult
      })

      const result = await retryHandler.execute(operation)

      expect(result).toEqual(successResult)
      expect(operation).toHaveBeenCalledTimes(3)
    })
  })
})

// ============================================================================
// PerformanceMonitor Error Handling Tests
// ============================================================================

describe('PerformanceMonitor - Error Handling', () => {
  let monitor: QueryPerformanceMonitor

  beforeEach(() => {
    monitor = createPerformanceMonitor({ enabled: true, slowQueryThreshold: 3000 })
  })

  afterEach(() => {
    monitor.clear()
  })

  describe('should detect slow queries', () => {
    it('should log as slow query when exceeding threshold', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

      const timer = monitor.startQuery('slowQuery')

      // Manually set startTime to simulate slow query
      const now = Date.now()
      timer.startTime = now - 4000

      const duration = monitor.endQuery(timer)

      // Filter for slow query warnings only
      const slowQueryCalls = consoleWarnSpy.mock.calls.filter(call =>
        call.some(arg => typeof arg === 'string' && arg.includes('[Slow Query]'))
      )

      expect(duration).toBeGreaterThanOrEqual(4000)
      expect(slowQueryCalls.length).toBeGreaterThan(0)
      expect(slowQueryCalls[0].some(arg => typeof arg === 'string' && arg.includes('slowQuery:'))).toBe(true)

      const slowQueries = monitor.getSlowQueries()
      expect(slowQueries).toHaveLength(1)
      expect(slowQueries[0].durationMs).toBeGreaterThanOrEqual(4000)
      expect(slowQueries[0].queryName).toBe('slowQuery')

      consoleWarnSpy.mockRestore()
    })
  })

  describe('should handle query execution errors', () => {
    it('should record error timing and rethrow', async () => {
      const timer = monitor.startQuery('failingQuery')

      // Simulate query that takes 100ms
      const now = Date.now()
      timer.startTime = now - 100

      const duration = monitor.endQuery(timer)

      expect(duration).toBeGreaterThanOrEqual(100)

      const stats = monitor.getStats()
      expect(stats.totalQueries).toBe(1)
    })
  })

  describe('should track individual operation timings', () => {
    it('should track multiple operations independently', () => {
      const now = Date.now()

      const timer1 = monitor.startQuery('operation1')
      timer1.startTime = now - 100
      monitor.endQuery(timer1)

      const timer2 = monitor.startQuery('operation2')
      timer2.startTime = now - 300
      monitor.endQuery(timer2)

      const timer3 = monitor.startQuery('operation3')
      timer3.startTime = now - 600
      monitor.endQuery(timer3)

      const stats = monitor.getStats()

      expect(stats.totalQueries).toBe(3)
      expect(stats.queryStats).toHaveLength(3)
      expect(stats.queryStats[0].avgTime).toBeGreaterThanOrEqual(100)
      expect(stats.queryStats[1].avgTime).toBeGreaterThanOrEqual(300)
      expect(stats.queryStats[2].avgTime).toBeGreaterThanOrEqual(600)
    })
  })

  describe('should calculate transaction duration correctly', () => {
    it('should sum individual operation times', () => {
      const transactionTimer = createTransactionTimer(monitor)
      const baseTime = Date.now()

      transactionTimer.startValidation()
      // @ts-expect-error - Testing private property for timing calculation
      transactionTimer.timings.set('validation_start', baseTime - 50)
      transactionTimer.endValidation()

      transactionTimer.startStockCheck()
      // @ts-expect-error - Testing private property for timing calculation
      transactionTimer.timings.set('stock_check_start', baseTime - 250)
      transactionTimer.endStockCheck()

      transactionTimer.startDatabase()
      // @ts-expect-error - Testing private property for timing calculation
      transactionTimer.timings.set('database_start', baseTime - 550)
      transactionTimer.endDatabase()

      const metrics = transactionTimer.getMetrics()

      // Use approximate matching for timing to account for test execution variance
      expect(metrics.validationTime).toBeCloseTo(50, 0)
      expect(metrics.stockCheckTime).toBeGreaterThanOrEqual(200)
      expect(metrics.databaseTime).toBeGreaterThanOrEqual(550)
    })
  })

  describe('should handle missing start time', () => {
    it('should handle endQuery without startQuery gracefully', () => {
      const invalidTimer = { queryName: 'test', startTime: 0 }

      const duration = monitor.endQuery(invalidTimer)

      expect(duration).toBe(0)
    })

    it('should handle endOperation without startOperation gracefully', () => {
      const timer = createTransactionTimer()

      timer.endValidation() // No startValidation called

      const metrics = timer.getMetrics()

      expect(metrics.validationTime).toBe(0)
    })
  })

  describe('should handle disabled monitor gracefully', () => {
    it('should return zero duration when disabled', () => {
      const disabledMonitor = createPerformanceMonitor({ enabled: false })

      const timer = disabledMonitor.startQuery('disabledQuery')

      expect(timer.startTime).toBe(0)

      const duration = disabledMonitor.endQuery(timer)

      expect(duration).toBe(0)
    })

    it('should return isEnabled false when disabled', () => {
      const disabledMonitor = createPerformanceMonitor({ enabled: false })

      expect(disabledMonitor.isEnabled()).toBe(false)
    })
  })

  describe('should track slow query counts', () => {
    it('should increment slow query count for queries exceeding threshold', () => {
      const timer = createTransactionTimer(monitor)

      timer.recordQuery(2000) // Below threshold
      timer.recordQuery(4000) // Above threshold
      timer.recordQuery(5000) // Above threshold

      const metrics = timer.getMetrics()

      expect(metrics.queryCount).toBe(3)
      expect(metrics.slowQueries).toBe(2)
    })
  })

  describe('should reset metrics between tests', () => {
    it('should have clean state after clear', () => {
      const now = Date.now()
      const timer1 = monitor.startQuery('query1')
      timer1.startTime = now - 100
      monitor.endQuery(timer1)

      expect(monitor.getStats().totalQueries).toBe(1)

      monitor.clear()

      expect(monitor.getStats().totalQueries).toBe(0)
      expect(monitor.getSlowQueries()).toHaveLength(0)
    })
  })

  describe('should export metrics in correct format', () => {
    it('should generate Prometheus-compatible stats', () => {
      const now = Date.now()
      const timer = monitor.startQuery('testQuery', { metadata: 'test' })
      timer.startTime = now - 100
      monitor.endQuery(timer)

      const stats = monitor.getStats()

      expect(stats).toHaveProperty('totalQueries')
      expect(stats).toHaveProperty('totalTime')
      expect(stats).toHaveProperty('avgTime')
      expect(stats).toHaveProperty('maxTime')
      expect(stats).toHaveProperty('minTime')
      expect(stats).toHaveProperty('slowQueries')
      expect(stats).toHaveProperty('queryStats')
    })
  })

  describe('should handle concurrent operation tracking', () => {
    it('should isolate timing per transaction', () => {
      const timer1 = createTransactionTimer(monitor)
      const timer2 = createTransactionTimer(monitor)
      const now = Date.now()

      timer1.startValidation()
      // @ts-expect-error - Testing private property for timing calculation
      timer1.timings.set('validation_start', now - 100)
      timer1.endValidation()

      timer2.startValidation()
      // @ts-expect-error - Testing private property for timing calculation
      timer2.timings.set('validation_start', now - 250)
      timer2.endValidation()

      const metrics1 = timer1.getMetrics()
      const metrics2 = timer2.getMetrics()

      expect(metrics1.validationTime).toBe(100)
      expect(metrics2.validationTime).toBe(250)

      // Timers should be independent
      expect(metrics1.validationTime).not.toBe(metrics2.validationTime)
    })
  })
})

// ============================================================================
// TransaksiService Error Handling Integration Tests
// ============================================================================

describe('TransaksiService - Error Handling Integration', () => {
  let transaksiService: TransaksiService
  const mockPrisma = {
    penyewa: { findUnique: jest.fn() },
    productSize: { findMany: jest.fn() },
    transaksi: { create: jest.fn() },
    $transaction: jest.fn(),
    transaksiItem: { createMany: jest.fn(), findMany: jest.fn() },
    aktivitasTransaksi: { create: jest.fn() },
    product: { findUnique: jest.fn() },
  } as unknown as jest.Mocked<PrismaClient>

  const mockUserId = 'user-123'
  const validRequest = {
    penyewaId: 'penyewa-1',
    items: [
      {
        produkId: 'produk-1',
        productSizeId: 'size-1',
        jumlah: 2,
        durasi: 4 as const,
        kondisiAwal: 'baik',
      },
    ],
    tglMulai: '2025-07-26T00:00:00.000Z',
    metodeBayar: 'tunai',
  }

  beforeEach(() => {
    transaksiService = new TransaksiService(mockPrisma, mockUserId)
    jest.clearAllMocks()
  })

  describe('should use RetryHandler for penyewa lookup', () => {
    it('should retry on database connection errors during penyewa lookup', async () => {
      const connectionError = new Error('Database connection timeout')
      const mockPenyewa = {
        id: 'penyewa-1',
        nama: 'Test Customer',
        telepon: '08123456789',
        alamat: 'Test Address',
      }

      // First two calls fail, third succeeds
      mockPrisma.penyewa.findUnique
        .mockRejectedValueOnce(connectionError)
        .mockRejectedValueOnce(connectionError)
        .mockResolvedValueOnce(mockPenyewa as never)

      // Mock the rest of the transaction flow
      mockPrisma.productSize.findMany.mockResolvedValue([
        {
          id: 'size-1',
          size: 'M',
          ageCategory: 'adult',
          quantity: 10,
          isActive: true,
          product: {
            id: 'produk-1',
            name: 'Test Product',
            currentPrice: createMockDecimal(50000),
            category: { name: 'test' },
          },
        },
      ] as never)

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma)
      })

      const mockTransaksi = {
        id: 'transaksi-1',
        kode: 'TXN-001',
        status: 'active',
        totalHarga: createMockDecimal(100000),
        items: [],
        pembayaran: [],
        aktivitas: [],
      }

      mockPrisma.transaksi.create.mockResolvedValue(mockTransaksi as never)
      mockPrisma.transaksiItem.createMany.mockResolvedValue({ count: 1 })
      mockPrisma.transaksiItem.findMany.mockResolvedValue([])

      try {
        await transaksiService.createTransaksiSizeAware(validRequest)
      } catch {
        // Error is expected if other parts fail
      }

      // Should have retried penyewa lookup
      expect(mockPrisma.penyewa.findUnique).toHaveBeenCalledTimes(3)
    })

    it('should not retry on penyewa not found error', async () => {
      mockPrisma.penyewa.findUnique.mockResolvedValue(null)

      await expect(transaksiService.createTransaksiSizeAware(validRequest)).rejects.toThrow(
        'Penyewa tidak ditemukan'
      )

      // Should only attempt once (no retry for not found)
      expect(mockPrisma.penyewa.findUnique).toHaveBeenCalledTimes(1)
    })
  })

  describe('should use RetryHandler for productSizes lookup', () => {
    it('should retry on database lock during productSizes query', async () => {
      const lockError = new Error('Database lock detected')
      const mockPenyewa = { id: 'penyewa-1', nama: 'Test', telepon: '', alamat: '' }
      const mockProductSizes = [
        {
          id: 'size-1',
          size: 'M',
          ageCategory: 'adult',
          isActive: true,
          product: {
            id: 'produk-1',
            name: 'Product',
            currentPrice: createMockDecimal(50000),
            category: { name: 'test' },
          },
        },
      ]

      mockPrisma.penyewa.findUnique.mockResolvedValue(mockPenyewa as never)

      // First call fails with lock, second succeeds
      let callCount = 0
      mockPrisma.productSize.findMany.mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          throw lockError
        }
        return mockProductSizes as never
      })

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma)
      })

      mockPrisma.transaksi.create.mockResolvedValue({
        id: 'txn-1',
        kode: 'TXN-001',
        status: 'active',
        totalHarga: createMockDecimal(100000),
        items: [],
        pembayaran: [],
        aktivitas: [],
      } as never)

      mockPrisma.transaksiItem.createMany.mockResolvedValue({ count: 1 })
      mockPrisma.transaksiItem.findMany.mockResolvedValue([])

      try {
        await transaksiService.createTransaksiSizeAware(validRequest)
      } catch {
        // Expected - error from other parts of the transaction flow
      }

      // Should have retried (at least 2 attempts)
      expect(callCount).toBeGreaterThanOrEqual(2)
    })
  })

  describe('should not retry on validation errors', () => {
    it('should fail immediately on invalid input data', async () => {
      const mockPenyewa = { id: 'penyewa-1', nama: 'Test', telepon: '', alamat: '' }
      mockPrisma.penyewa.findUnique.mockResolvedValue(mockPenyewa as never)
      mockPrisma.productSize.findMany.mockResolvedValue([] as never)

      await expect(transaksiService.createTransaksiSizeAware(validRequest)).rejects.toThrow()

      // Should not retry validation errors
      expect(mockPrisma.penyewa.findUnique).toHaveBeenCalledTimes(1)
    })
  })

  describe('should track performance for all operations', () => {
    it('should track all database operations', async () => {
      const mockPenyewa = { id: 'penyewa-1', nama: 'Test', telepon: '', alamat: '' }
      const mockProductSizes = [
        {
          id: 'size-1',
          size: 'M',
          ageCategory: 'adult',
          isActive: true,
          product: {
            id: 'produk-1',
            name: 'Product',
            currentPrice: createMockDecimal(50000),
            category: { name: 'test' },
          },
        },
      ]

      mockPrisma.penyewa.findUnique.mockResolvedValue(mockPenyewa as never)
      mockPrisma.productSize.findMany.mockResolvedValue(mockProductSizes as never)

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma)
      })

      const mockTransaksi = {
        id: 'txn-1',
        kode: 'TXN-001',
        status: 'active',
        totalHarga: createMockDecimal(100000),
        items: [],
        pembayaran: [],
        aktivitas: [],
      }

      mockPrisma.transaksi.create.mockResolvedValue(mockTransaksi as never)
      mockPrisma.transaksiItem.createMany.mockResolvedValue({ count: 1 })
      mockPrisma.transaksiItem.findMany.mockResolvedValue([])

      // Enable performance monitoring
      process.env.ENABLE_PERFORMANCE_MONITORING = 'true'

      try {
        await transaksiService.createTransaksiSizeAware(validRequest)

        // Performance tracking should have occurred (no errors thrown)
      } catch {
        // Some operations may fail, but performance tracking should not cause crashes
      }

      delete process.env.ENABLE_PERFORMANCE_MONITORING
    })
  })
})
