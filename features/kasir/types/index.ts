/**
 * Kasir Types Index - TSK-24 Phase 1 Unified Architecture
 * Consolidates types from unified return system and legacy compatibility
 */

// Re-export all types from main kasir types file
export * from '../types'

// TSK-24 Phase 1: Export unified return types (primary)
export * from './Return'

// Legacy compatibility exports (deprecated)
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