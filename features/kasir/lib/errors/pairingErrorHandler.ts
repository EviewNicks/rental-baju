/**
 * PairingErrorHandler - Task 4: Contextual Error Handling
 * 
 * Provides error classification and recovery strategies for pickup-pairing integration
 * Generates contextual error messages with pairing information and actionable recovery steps
 */

export interface PairingErrorContext {
  transactionId: string
  itemId?: string
  kondisiAwal?: string | null
  detectedFormat?: 'json' | 'pipe' | 'unknown'
  timestamp?: string
  error?: {
    message: string
    stack?: string
    name: string
    type?: ErrorType
  } | {
    message: string
    type: string
  }
  pairingContext?: {
    hasPairingData: boolean
    formatSupport: string[]
    stockManagement: string
    itemsCount?: number
    totalQuantity?: number
  }
  pairingData?: {
    hasLinkedSarung: boolean
    linkedSarungId?: string
  }
  stockOperation?: {
    attempted: boolean
    successful: boolean
    skipped: boolean
    reason?: string
  }
}

export enum ErrorType {
  DATA_FORMAT_ERROR = 'DATA_FORMAT_ERROR',
  STOCK_MANAGEMENT_ERROR = 'STOCK_MANAGEMENT_ERROR',
  ITEM_FILTERING_ERROR = 'ITEM_FILTERING_ERROR',
  PAIRING_LOGIC_ERROR = 'PAIRING_LOGIC_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

export class PairingErrorHandler {
  /**
   * Classify error type based on error message and context
   */
  static classifyError(error: Error, context?: PairingErrorContext): ErrorType {
    const message = error.message.toLowerCase()
    
    // ✅ TASK 6: Strategic logging point 4 - Error classification with pairing context
    const errorType = this.determineErrorType(message)
    console.warn('🔍 Error classified for pairing context', {
      errorType,
      originalMessage: error.message,
      hasContext: !!context,
      contextTransactionId: context?.transactionId,
      timestamp: new Date().toISOString()
    })
    
    return errorType
  }

  /**
   * Internal method to determine error type (extracted to avoid logging duplication)
   */
  private static determineErrorType(message: string): ErrorType {
    if (message.includes('json') || message.includes('parsing') || message.includes('format')) {
      return ErrorType.DATA_FORMAT_ERROR
    }
    
    if (message.includes('stock') || message.includes('inventory') || message.includes('quantity')) {
      return ErrorType.STOCK_MANAGEMENT_ERROR
    }
    
    if (message.includes('filter') || message.includes('availability') || message.includes('pickup')) {
      return ErrorType.ITEM_FILTERING_ERROR
    }
    
    if (message.includes('pairing') || message.includes('linkedsarung') || message.includes('sarung')) {
      return ErrorType.PAIRING_LOGIC_ERROR
    }
    
    if (message.includes('database') || message.includes('connection') || message.includes('timeout')) {
      return ErrorType.DATABASE_ERROR
    }
    
    return ErrorType.VALIDATION_ERROR
  }

  /**
   * Generate contextual error message with pairing information
   */
  static generateContextualErrorMessage(error: unknown, context?: PairingErrorContext): string {
    if (!(error instanceof Error)) {
      return 'Terjadi kesalahan sistem yang tidak diketahui. Silakan coba lagi atau hubungi administrator.'
    }

    const errorType = this.classifyError(error, context)
    const message = error.message.toLowerCase()

    switch (errorType) {
      case ErrorType.DATA_FORMAT_ERROR:
        return 'Terjadi masalah dengan format data pairing. Sistem akan melanjutkan proses tanpa update stok. Silakan periksa data pairing atau hubungi administrator.'

      case ErrorType.STOCK_MANAGEMENT_ERROR:
        if (message.includes('no record was found for an update')) {
          return 'Terjadi konflik data inventory. Item mungkin sudah diproses atau data pairing tidak konsisten. Silakan refresh halaman dan coba lagi.'
        }
        if (message.includes('insufficient') || message.includes('not enough')) {
          return 'Stok tidak mencukupi untuk item yang dipilih. Mungkin item ini adalah bagian dari pairing jas-sarung yang memerlukan stok ganda. Silakan periksa ketersediaan stok.'
        }
        return 'Terjadi masalah dengan pengelolaan stok. Pickup akan dilanjutkan tanpa update stok. Silakan periksa stok secara manual.'

      case ErrorType.ITEM_FILTERING_ERROR:
        return 'Item tidak dapat ditemukan atau sudah tidak tersedia. Mungkin item ini adalah bagian dari pairing jas-sarung. Silakan refresh halaman dan pilih item yang tersedia.'

      case ErrorType.PAIRING_LOGIC_ERROR:
        return 'Terjadi masalah dengan data pairing jas-sarung. Silakan periksa konfigurasi pairing atau hubungi administrator untuk bantuan.'

      case ErrorType.DATABASE_ERROR:
        if (message.includes('timeout') || message.includes('connection')) {
          return 'Koneksi database bermasalah. Silakan tunggu beberapa saat dan coba lagi.'
        }
        if (message.includes('transaction') || message.includes('rollback')) {
          return 'Operasi pickup memakan waktu terlalu lama. Silakan coba lagi dengan jumlah item yang lebih sedikit.'
        }
        return 'Terjadi masalah database. Silakan coba lagi atau hubungi administrator.'

      case ErrorType.VALIDATION_ERROR:
      default:
        if (message.includes('item transaksi tidak ditemukan')) {
          return 'Item tidak dapat ditemukan. Mungkin item ini adalah bagian dari pairing jas-sarung. Silakan refresh halaman dan pilih item yang tersedia.'
        }
        if (message.includes('permission') || message.includes('unauthorized') || message.includes('denied')) {
          return 'Anda tidak memiliki izin untuk melakukan pickup pada transaksi ini. Silakan hubungi administrator atau periksa hak akses Anda.'
        }
        return `Gagal memproses pickup: ${error.message}. Silakan coba lagi atau hubungi administrator.`
    }
  }

  /**
   * Create comprehensive error context for debugging and audit
   */
  static createPairingErrorContext(
    error: unknown,
    transactionId: string,
    items: Array<{ id: string; jumlahDiambil: number }>,
    additionalContext?: Partial<PairingErrorContext>
  ): PairingErrorContext {
    return {
      transactionId,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
        type: this.classifyError(error)
      } : { 
        message: 'Unknown error', 
        type: typeof error 
      },
      pairingContext: {
        hasPairingData: true,
        formatSupport: ['JSON', 'pipe-separated'],
        stockManagement: 'pairing-aware',
        itemsCount: items.length,
        totalQuantity: items.reduce((sum, item) => sum + item.jumlahDiambil, 0)
      },
      ...additionalContext
    }
  }

  /**
   * Log error with pairing context for monitoring and debugging
   */
  static logErrorWithContext(
    error: unknown,
    context: PairingErrorContext,
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    logger?: { error: (msg: string, context?: any) => void }
  ): void {
    const errorInfo = {
      ...context,
      errorType: error instanceof Error ? this.classifyError(error, context) : 'UNKNOWN',
      timestamp: new Date().toISOString()
    }

    if (logger) {
      logger.error('Pickup processing failed with pairing context', errorInfo)
    } else {
      console.error('Pickup processing failed with pairing context:', errorInfo)
    }
  }

  /**
   * Determine if error should cause pickup failure or allow graceful degradation
   */
  static shouldFailPickup(error: Error, context?: PairingErrorContext): boolean {
    const errorType = this.classifyError(error, context)
    
    // These errors should cause pickup failure
    const criticalErrors = [
      ErrorType.ITEM_FILTERING_ERROR,
      ErrorType.VALIDATION_ERROR
    ]
    
    // These errors allow graceful degradation
    const nonCriticalErrors = [
      ErrorType.DATA_FORMAT_ERROR,
      ErrorType.STOCK_MANAGEMENT_ERROR,
      ErrorType.PAIRING_LOGIC_ERROR
    ]
    
    if (criticalErrors.includes(errorType)) {
      return true
    }
    
    if (nonCriticalErrors.includes(errorType)) {
      return false
    }
    
    // Database errors depend on specific type
    if (errorType === ErrorType.DATABASE_ERROR) {
      const message = error.message.toLowerCase()
      // Connection issues should fail pickup
      if (message.includes('connection') || message.includes('timeout')) {
        return true
      }
      // Other database issues allow retry
      return false
    }
    
    // Default to failure for unknown errors
    return true
  }
}