/**
 * Transaction Logger - Debugging Utility for Transaction Data Flow
 *
 * Purpose: Log transaction data in JSON format before API submission
 * Usage: Development environment only for debugging data transformation
 */

import type { CreateTransaksiRequest, ProductSelection, CreateTransaksiItemSizeAware } from '../../types'

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
      hasManualAdjustments: data.products?.some((p: ProductSelection) => p.manualPriceAdjustment?.isManuallyAdjusted) || false,
      hasLinkedSarung: data.products?.some((p: ProductSelection) => p.linkedSarung) || false,
      discountApplied: !!(data.discountType && data.discountValue),
    })
  }

  /**
   * Log API payload perspective (backend-ready format from useTransactionForm)
   */
  static logApiPayload(payload: CreateTransaksiRequest): void {
    if (!this.config.enabled || !['api-payload', 'both'].includes(this.config.logLevel)) {
      return
    }

    // Analyze payload for enhanced metadata
    const itemsWithManualAdjustment = payload.items.filter(item => 
      'manualPriceAdjustment' in item && item.manualPriceAdjustment?.isManuallyAdjusted
    ).length

    const itemsWithLinkedSarung = payload.items.filter(item => 
      'linkedSarung' in item && item.linkedSarung
    ).length

    this.prettyPrintJson(payload, '🚀 TRANSACTION API PAYLOAD', {
      description: 'Final API request payload that will be sent to POST /api/kasir/transaksi',
      timestamp: new Date().toISOString(),
      source: 'useTransactionForm.submitTransaction',
      endpoint: 'POST /api/kasir/transaksi',
      format: payload.items.some((item) => 'productSizeId' in item) ? 'size-aware' : 'legacy',
      enhancedFeatures: {
        manualPriceAdjustments: itemsWithManualAdjustment,
        jasSarungPairings: itemsWithLinkedSarung,
        discountApplied: !!(payload.discountType && payload.discountValue),
        discountType: payload.discountType || null,
        discountValue: payload.discountValue || null,
      },
      validation: {
        schemaVersion: 'v2.0-with-manual-adjustments',
        zodValidationPassed: true,
        fieldsPreserved: ['manualPriceAdjustment', 'linkedSarung', 'discountType', 'discountValue'],
      }
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
        if (key === 'enhancedFeatures' && typeof value === 'object' && value !== null) {
          console.log(`%c${key}:`, 'color: #059669; font-weight: bold;')
          Object.entries(value as Record<string, unknown>).forEach(([subKey, subValue]) => {
            console.log(`  %c${subKey}:`, 'color: #7C3AED; font-weight: normal;', subValue)
          })
        } else if (key === 'validation' && typeof value === 'object' && value !== null) {
          console.log(`%c${key}:`, 'color: #059669; font-weight: bold;')
          Object.entries(value as Record<string, unknown>).forEach(([subKey, subValue]) => {
            console.log(`  %c${subKey}:`, 'color: #DC2626; font-weight: normal;', subValue)
          })
        } else {
          console.log(`%c${key}:`, 'color: #059669; font-weight: bold;', value)
        }
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
          // ✅ NEW: Enhanced item analysis
          hasManualAdjustment: !!(item.manualPriceAdjustment?.isManuallyAdjusted),
          adjustmentAmount: item.manualPriceAdjustment?.adjustmentAmount || 0,
          finalPrice: item.manualPriceAdjustment?.isManuallyAdjusted 
            ? (item.manualPriceAdjustment.originalPrice + item.manualPriceAdjustment.adjustmentAmount)
            : (item.hargaSewa || item.product?.pricePerDay),
          hasLinkedSarung: !!(item.linkedSarung),
          linkedSarungId: item.linkedSarung?.productId || null,
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
        
        // ✅ NEW: Enhanced pricing analysis
        const manualAdjustmentCount = data.items.filter((item: CreateTransaksiItemSizeAware) => 
          item.manualPriceAdjustment?.isManuallyAdjusted
        ).length
        
        const linkedSarungCount = data.items.filter((item: CreateTransaksiItemSizeAware) => 
          item.linkedSarung
        ).length
        
        if (manualAdjustmentCount > 0) {
          console.log('%cManual Adjustments:', 'color: #DC2626; font-weight: bold;', `${manualAdjustmentCount} items`)
        }
        
        if (linkedSarungCount > 0) {
          console.log('%cJas-Sarung Pairings:', 'color: #7C3AED; font-weight: bold;', `${linkedSarungCount} pairs`)
        }
        
        if (data.discountType && data.discountValue) {
          console.log('%cDiscount Applied:', 'color: #059669; font-weight: bold;', 
            `${data.discountValue}${data.discountType === 'percent' ? '%' : ' IDR'} (${data.discountType})`
          )
        }
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
