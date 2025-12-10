/**
 * Transaction Logger - Debugging Utility for Transaction Data Flow
 *
 * Purpose: Log transaction data in JSON format before API submission
 * Usage: Development environment only for debugging data transformation
 */

import type { CreateTransaksiRequest } from '../../types'

interface TransactionLogConfig {
  enabled: boolean
  logLevel: 'form-data' | 'api-payload' | 'both'
}

class TransactionLogger {
  private static config: TransactionLogConfig = {
    enabled:
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_DEBUG_TRANSACTION === 'true',
    logLevel: 'both',
  }

  /**
   * Log form data perspective (user-friendly format from TransactionFormPage)
   */
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  static logFormData(data: any): void {
    if (!this.config.enabled || !['form-data', 'both'].includes(this.config.logLevel)) {
      return
    }

    this.prettyPrintJson(data, '📋 TRANSACTION FORM DATA', {
      description: 'Data collected from user input form before API transformation',
      timestamp: new Date().toISOString(),
      source: 'TransactionFormPage.handleSubmitTransaction',
    })
  }

  /**
   * Log API payload perspective (backend-ready format from useTransactionForm)
   */
  static logApiPayload(payload: CreateTransaksiRequest): void {
    if (!this.config.enabled || !['api-payload', 'both'].includes(this.config.logLevel)) {
      return
    }

    this.prettyPrintJson(payload, '🚀 TRANSACTION API PAYLOAD', {
      description: 'Final API request payload that will be sent to POST /api/kasir/transaksi',
      timestamp: new Date().toISOString(),
      source: 'useTransactionForm.submitTransaction',
      endpoint: 'POST /api/kasir/transaksi',
      format: payload.items.some((item) => 'productSizeId' in item) ? 'size-aware' : 'legacy',
    })
  }

  /**
   * Log debug information for kasir flow tracking
   * FIXED: Added separate method for debug logging to avoid type conflicts
   */
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  static logKasirDebug(debugData: Record<string, any>): void {
    if (!this.config.enabled || !['api-payload', 'both'].includes(this.config.logLevel)) {
      return
    }

    this.prettyPrintJson(debugData, '🔍 KASIR FLOW DEBUG', {
      description: 'Kasir validation and assignment tracking for debugging',
      timestamp: new Date().toISOString(),
      source: debugData.source || 'unknown',
      endpoint: 'Kasir Flow Tracking',
      format: 'debug-log',
    })
  }

  /**
   * Pretty print JSON data with consistent formatting
   */
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static prettyPrintJson(data: any, title: string, metadata?: Record<string, any>): void {
    console.group(`%c${title}`, 'color: #3B82F6; font-weight: bold; font-size: 14px;')

    if (metadata) {
      console.groupCollapsed('%c📊 Metadata', 'color: #6B7280; font-weight: bold;')
      Object.entries(metadata).forEach(([key, value]) => {
        console.log(`%c${key}:`, 'color: #059669; font-weight: bold;', value)
      })
      console.groupEnd()
    }

    console.groupCollapsed('%c📄 Data Payload', 'color: #6B7280; font-weight: bold;')
    console.log(
      '%c' + JSON.stringify(data, null, 2),
      'color: #1F2937; font-family: monospace; font-size: 12px;',
    )
    console.groupEnd()

    if (data.items && Array.isArray(data.items)) {
      console.groupCollapsed('%c📦 Items Summary', 'color: #6B7280; font-weight: bold;')
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.items.forEach((item: any, index: number) => {
        const itemSummary = {
          index: index + 1,
          productId: item.produkId || item.product?.id,
          quantity: item.jumlah || item.quantity,
          duration: item.durasi,
          sizeInfo: item.productSizeId ? `Size: ${item.productSizeId}` : 'No size specified',
          price: item.hargaSewa || item.product?.pricePerDay,
        }
        console.log(`%cItem ${index + 1}:`, 'color: #7C3AED; font-weight: bold;', itemSummary)
      })
      console.groupEnd()
    }

    if (data.customer || data.penyewaId) {
      console.groupCollapsed('%c👤 Customer Info', 'color: #6B7280; font-weight: bold;')
      if (data.customer) {
        console.log('%cCustomer:', 'color: #059669; font-weight: bold;', data.customer)
      }
      if (data.penyewaId) {
        console.log('%cCustomer ID:', 'color: #059669; font-weight: bold;', data.penyewaId)
      }
      console.groupEnd()
    }

    if (data.kasirId) {
      console.groupCollapsed('%c💼 Kasir Info', 'color: #6B7280; font-weight: bold;')
      console.log('%cKasir ID:', 'color: #059669; font-weight: bold;', data.kasirId)
      console.groupEnd()
    }

    if (data.totalAmount || data.items) {
      console.groupCollapsed('%c💰 Pricing Summary', 'color: #6B7280; font-weight: bold;')
      if (data.totalAmount) {
        console.log(
          '%cTotal Amount:',
          'color: #059669; font-weight: bold;',
          `Rp ${data.totalAmount.toLocaleString('id-ID')}`,
        )
      }
      if (data.items && Array.isArray(data.items)) {
        const itemCount = data.items.reduce(
          //eslint-disable-next-line @typescript-eslint/no-explicit-any
          (sum: number, item: any) => sum + (item.jumlah || item.quantity || 0),
          0,
        )
        console.log('%cTotal Items:', 'color: #059669; font-weight: bold;', itemCount)
      }
      console.groupEnd()
    }

    console.groupEnd()
    console.log('%c' + '='.repeat(80), 'color: #E5E7EB;')
  }

  /**
   * Update logger configuration (for testing or dynamic control)
   */
  static updateConfig(config: Partial<TransactionLogConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  static getConfig(): TransactionLogConfig {
    return { ...this.config }
  }

  /**
   * Check if logger is enabled
   */
  static isEnabled(): boolean {
    return this.config.enabled
  }
}

export { TransactionLogger, type TransactionLogConfig }
