/**
 * Unified Return Type Definitions - TSK-24 Phase 1
 * Single-mode removal implementation with unified multi-condition architecture
 * Replaces dual-mode types with simplified, consistent interfaces
 */

import { TransaksiWithDetails } from '../services/transaksiService'

// =============================================================================
// UNIFIED RETURN TYPES (NEW ARCHITECTURE)
// =============================================================================

/**
 * Single condition within unified structure - all returns use this format
 */
export interface UnifiedCondition {
  kondisiAkhir: string
  jumlahKembali: number
  modalAwal?: number // Optional override for penalty calculation
  penaltyAmount?: number // Calculated penalty for this condition (output only)
}

/**
 * Unified return item - treats all items as multi-condition (even single conditions)
 */
export interface UnifiedReturnItem {
  itemId: string
  conditions: UnifiedCondition[] // Always array, minimum 1 condition
}

/**
 * Unified return request - single interface for all return scenarios
 */
export interface UnifiedReturnRequest {
  items: UnifiedReturnItem[]
  catatan?: string
  tglKembali?: string // ISO 8601 format
}

/**
 * Unified return processing result - consistent response for all scenarios
 */
export interface UnifiedReturnProcessingResult {
  success: boolean
  transactionId: string
  returnedAt: Date
  penalty: number
  processedItems: UnifiedProcessedItem[]
  processingMode: 'unified' // Always unified in new architecture
  details?: UnifiedErrorDetails
}

/**
 * Processed item result in unified architecture
 */
export interface UnifiedProcessedItem {
  itemId: string
  penalty: number
  kondisiAkhir: string // Summary condition or 'multi-condition'
  statusKembali: 'lengkap'
  conditionBreakdown?: UnifiedConditionBreakdown[]
}

/**
 * Condition breakdown for processed items
 */
export interface UnifiedConditionBreakdown {
  kondisiAkhir: string
  jumlahKembali: number
  penaltyAmount: number
}

/**
 * Unified error details for consistent error handling
 */
export interface UnifiedErrorDetails {
  statusCode: 'ALREADY_RETURNED' | 'INVALID_STATUS' | 'VALIDATION_ERROR'
  message: string
  currentStatus: string
  originalReturnDate?: Date | null
  processingTime: number
  validationErrors?: UnifiedValidationError[]
}

/**
 * Unified validation error structure
 */
export interface UnifiedValidationError {
  field: string
  message: string
  code: string
  suggestions?: string[]
}

// =============================================================================
// LEGACY COMPATIBILITY TYPES (FOR MIGRATION PERIOD)
// =============================================================================

/**
 * @deprecated Use UnifiedCondition instead - legacy single condition format
 */
export interface LegacyReturnItemRequest {
  itemId: string
  kondisiAkhir: string
  jumlahKembali: number
}

/**
 * @deprecated Use UnifiedReturnRequest instead - legacy return request format
 */
export interface LegacyReturnRequest {
  items: LegacyReturnItemRequest[]
  catatan?: string
  tglKembali?: string
}

/**
 * @deprecated Use UnifiedReturnProcessingResult instead - legacy enhanced result
 */
export interface LegacyEnhancedReturnProcessingResult {
  success: boolean
  transactionId: string
  returnedAt: Date
  penalty: number
  processedItems: Array<{
    itemId: string
    penalty: number
    kondisiAkhir: string
    statusKembali: 'lengkap'
    conditionBreakdown?: Array<{
      kondisiAkhir: string
      jumlahKembali: number
      penaltyAmount: number
    }>
  }>
  processingMode: 'single-condition' | 'multi-condition' | 'mixed' // Deprecated modes
  multiConditionSummary?: Record<string, unknown> // Deprecated complex summary
  details?: {
    statusCode: string
    message: string
    currentStatus: string
    processingTime: number
  }
}

// =============================================================================
// TRANSACTION CONTEXT TYPES (SHARED)
// =============================================================================

/**
 * Transaction status for return processing
 */
export type ExtendedTransactionStatus = 'active' | 'dikembalikan' | 'terlambat' | 'cancelled'

/**
 * Transaction item for return validation
 */
export interface TransactionItemForReturn {
  id: string
  jumlahDiambil: number
  statusKembali: string
  produk: {
    name: string
    modalAwal?: number
  }
}

/**
 * Transaction validation result
 */
export interface UnifiedReturnEligibilityResult {
  isEligible: boolean
  reason?: string
  transaction?: {
    id: string
    status: ExtendedTransactionStatus
    items: TransactionItemForReturn[]
  }
}

// =============================================================================
// UNIFIED VALIDATION TYPES
// =============================================================================

/**
 * Unified validation result
 */
export interface UnifiedValidationResult {
  isValid: boolean
  errors: UnifiedValidationError[]
  processedItemCount: number
  totalConditionCount: number
}

/**
 * Unified business rule validation
 */
export interface UnifiedBusinessRuleValidation {
  isValid: boolean
  errors: UnifiedValidationError[]
  warnings?: string[]
}

// =============================================================================
// UTILITY TYPES FOR CONVERSION
// =============================================================================

/**
 * Format detection result
 */
export interface FormatDetectionResult {
  isLegacy: boolean
  isUnified: boolean
  detectedFormat: 'legacy' | 'unified' | 'unknown'
  confidence: number
}

/**
 * Migration metadata for tracking and analytics
 */
export interface UnifiedMigrationMetadata {
  originalFormat: 'legacy' | 'unified'
  convertedFormat: 'unified'
  migrationPhase: number
  processingTimestamp: string
  unifiedArchitecture: boolean
  legacyCompatible: boolean
}

// =============================================================================
// SERVICE INTERFACE TYPES
// =============================================================================

/**
 * Unified return service interface
 */
export interface IUnifiedReturnService {
  processUnifiedReturn(
    transaksiId: string,
    request: UnifiedReturnRequest
  ): Promise<UnifiedReturnProcessingResult>
  
  processLegacyReturn(
    transaksiId: string,
    legacyRequest: LegacyReturnRequest
  ): Promise<UnifiedReturnProcessingResult>
  
  validateUnifiedReturn(
    transaksiId: string,
    request: UnifiedReturnRequest
  ): Promise<UnifiedValidationResult>
  
  getReturnTransactionByCode(transactionCode: string): Promise<TransaksiWithDetails>
}

// =============================================================================
// API TYPES
// =============================================================================

/**
 * Unified API response data
 */
export interface UnifiedApiResponseData {
  transaksiId: string
  totalPenalty: number
  processedItems: UnifiedProcessedItem[]
  processingMode: 'unified'
  format: 'legacy' | 'unified'
  totalConditions: number
  conditionBreakdown?: Array<{
    itemId: string
    penalty: number
    conditions: UnifiedConditionBreakdown[]
  }>
  processingMetadata?: UnifiedMigrationMetadata
}

/**
 * Unified API error response
 */
export interface UnifiedApiErrorResponse {
  success: false
  error: {
    message: string
    code: string
    details: UnifiedValidationError[]
    hints: string[]
    architecture: 'unified'
    migrationPhase: number
  }
}

// =============================================================================
// END OF FILE - Types are exported via interface declarations above
// =============================================================================