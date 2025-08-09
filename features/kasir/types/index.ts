/**
 * Kasir Types Index - Re-exports for easy importing
 * Consolidates types from main types.ts and multiConditionReturn.ts
 */

// Re-export all types from main kasir types file
export * from '../types'

// Selectively re-export multi-condition return types to avoid conflicts
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
  MultiConditionAction
} from './multiConditionReturn'

// Re-export ConditionSplit and MultiConditionPenaltyResult from multiConditionReturn
export type { 
  ConditionSplit,
  MultiConditionPenaltyResult
} from './multiConditionReturn'

// Convenient type aliases for commonly used types
export type { TransaksiItemResponse as TransaksiItem } from '../types'