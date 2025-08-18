/**
 * Kasir Types Index - TSK-24 Phase 1 Unified Architecture
 * Consolidates types from unified return system and legacy compatibility
 */

// Re-export all types from main kasir types file
export * from '../types'

// TSK-24 Phase 1: Export unified return types (primary)
export * from './Return'

// Legacy compatibility exports (deprecated)
// TODO: Re-enable when multiConditionReturn.ts is available in frontend phase
/*
export type {
  EnhancedItemCondition,
  ConditionValidationResult,
  MultiConditionFormValidation,
  MultiConditionPenaltyBreakdown,
  PenaltySummary,
  EnhancedReturnRequest as MultiConditionEnhancedReturnRequest,
  ProcessingMode as MultiConditionProcessingMode,
  ReturnProcessingResult as MultiConditionReturnProcessingResult,
  ModeToggleProps,
  MultiConditionFormProps,
  ConditionSplitCardProps,
  EnhancedPenaltyDisplayProps,
  ConditionOption,
  PENALTY_RATES,
  DAILY_LATE_RATE,
  VALIDATION_CONSTRAINTS,
  ConditionMetadata,
  MultiConditionState,
  MultiConditionAction,
  ConditionSplit,
  MultiConditionPenaltyResult
} from './multiConditionReturn'
*/

// Convenient type aliases for commonly used types
export type { TransaksiItemResponse as TransaksiItem } from '../types'

// TSK-24 Phase 1: Primary type aliases for unified architecture
export type {
  UnifiedReturnRequest as ReturnRequest,
  UnifiedReturnProcessingResult as ReturnProcessingResult,
  UnifiedCondition as Condition,
  UnifiedReturnItem as ReturnItem,
  UnifiedValidationError as ValidationError
} from './Return'

// RPK-44: Return activity logging types
export interface ReturnActivityData {
  conditions: Array<{
    itemId: string
    kondisiAkhir: string
    jumlahKembali: number  
    penaltyAmount: number
    produkName: string
  }>
  totalPenalty: number
  itemsAffected: string[]  // Array of product names
  processingMode: 'unified'
  totalConditions: number
  timestamp: string  // ISO 8601 format
}

export interface PenaltyActivityData {
  totalPenalty: number
  penaltyBreakdown: Array<{
    itemId: string
    produkName: string
    penaltyAmount: number
    conditions: Array<{
      kondisiAkhir: string
      penaltyAmount: number
    }>
  }>
  calculationMethod: 'condition-based' | 'modal_awal' | 'late_fee'
  timestamp: string  // ISO 8601 format
}

// Enhanced ActivityAction type including new return activities
export type ActivityAction = 'created' | 'paid' | 'picked_up' | 'returned' | 'overdue' | 'reminder_sent' | 'penalty_added' | 'return_completed'
