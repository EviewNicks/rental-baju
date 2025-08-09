/**
 * Multi-Condition Return Type Definitions
 * TSK-24 Phase-2: Enhanced types for multi-condition item return system
 */

// ==========================================
// CORE MULTI-CONDITION TYPES
// ==========================================

/**
 * Single condition for an item (existing format)
 */
export interface SingleItemCondition {
  kondisiAkhir: string
  jumlahKembali: number
}

/**
 * Multi-condition split for an item (enhanced format)
 */
export interface ConditionSplit {
  kondisiAkhir: string
  jumlahKembali: number
  modalAwal?: number // For lost items
  penaltyAmount?: number // Calculated penalty for this condition
}

/**
 * Union type for item conditions (backward compatible)
 */
export type ItemCondition = SingleItemCondition | ConditionSplit[]

/**
 * Enhanced item condition with metadata
 */
export interface EnhancedItemCondition {
  itemId: string
  mode: 'single' | 'multi'
  conditions: ConditionSplit[]
  isValid: boolean
  totalQuantity: number
  remainingQuantity: number
  validationError?: string
}

// ==========================================
// VALIDATION TYPES
// ==========================================

/**
 * Validation result for condition splits
 */
export interface ConditionValidationResult {
  isValid: boolean
  remaining: number
  totalReturned: number
  maxAllowed: number
  error?: string
  warnings?: string[]
}

/**
 * Form validation state
 */
export interface MultiConditionFormValidation {
  itemValidations: Record<string, ConditionValidationResult>
  isFormValid: boolean
  canProceed: boolean
  errors: string[]
  warnings: string[]
}

// ==========================================
// PENALTY CALCULATION TYPES
// ==========================================

/**
 * Enhanced penalty calculation for multi-condition items
 */
export interface MultiConditionPenaltyResult {
  totalPenalty: number
  lateDays: number
  breakdown: MultiConditionPenaltyBreakdown[]
  summary: PenaltySummary
  calculationMetadata: {
    processingMode: 'single' | 'multi' | 'mixed'
    itemsProcessed: number
    conditionSplits: number
    calculatedAt: string
  }
}

/**
 * Penalty breakdown per condition split
 */
export interface MultiConditionPenaltyBreakdown {
  itemId: string
  itemName: string
  splitIndex?: number // For multi-condition items
  kondisiAkhir: string
  jumlahKembali: number
  isLostItem: boolean
  
  // Penalty components
  latePenalty: number
  conditionPenalty: number
  modalAwalUsed?: number
  totalItemPenalty: number
  
  // Calculation details
  calculationMethod: 'late_fee' | 'modal_awal' | 'damage_fee' | 'none'
  description: string
  rateApplied?: number
}

/**
 * Summary statistics for penalty calculation
 */
export interface PenaltySummary {
  totalItems: number
  totalConditions: number
  onTimeItems: number
  lateItems: number
  damagedItems: number
  lostItems: number
  
  // Multi-condition specific
  singleConditionItems: number
  multiConditionItems: number
  averageConditionsPerItem: number
}

// ==========================================
// API INTEGRATION TYPES
// ==========================================

/**
 * Enhanced return request (backward compatible)
 */
export interface EnhancedReturnRequest {
  items: Array<{
    itemId: string
    
    // Single condition (existing format)
    kondisiAkhir?: string
    jumlahKembali?: number
    
    // Multi-condition (enhanced format)
    conditions?: Array<{
      kondisiAkhir: string
      jumlahKembali: number
      modalAwal?: number
    }>
  }>
  catatan?: string
  tglKembali?: string
}

/**
 * Processing mode detection
 */
export type ProcessingMode = 'single-condition' | 'multi-condition' | 'mixed'

/**
 * Return processing result
 */
export interface ReturnProcessingResult {
  success: boolean
  processingMode: ProcessingMode
  transactionId: string
  itemsProcessed: number
  conditionSplitsProcessed: number
  totalPenalty: number
  message: string
  errors?: string[]
  warnings?: string[]
}

// ==========================================
// UI COMPONENT TYPES
// ==========================================

/**
 * Mode toggle component props
 */
export interface ModeToggleProps {
  mode: 'single' | 'multi'
  onModeChange: (mode: 'single' | 'multi') => void
  disabled?: boolean
  itemQuantity: number
  showLabels?: boolean
}

/**
 * Multi-condition form props
 */
export interface MultiConditionFormProps {
  itemId: string
  itemName: string
  maxQuantity: number
  initialConditions?: ConditionSplit[]
  onConditionsChange: (conditions: ConditionSplit[]) => void
  onValidationChange?: (validation: ConditionValidationResult) => void
  disabled?: boolean
  isLoading?: boolean
}

/**
 * Condition split card props
 */
export interface ConditionSplitCardProps {
  condition: ConditionSplit
  index: number
  maxQuantity: number
  availableQuantity: number
  onConditionChange: (condition: ConditionSplit) => void
  onRemove: () => void
  showRemoveButton?: boolean
  disabled?: boolean
}

/**
 * Enhanced penalty display props
 */
export interface EnhancedPenaltyDisplayProps {
  transaction: any // TransaksiDetail from main types
  itemConditions: Record<string, ItemCondition>
  onPenaltyCalculated?: (calculation: MultiConditionPenaltyResult) => void
  showBreakdown?: boolean
  compactView?: boolean
}

// ==========================================
// CONSTANTS
// ==========================================

/**
 * Standard condition options (from Phase-1)
 */
export const CONDITION_OPTIONS = [
  'Baik - tidak ada kerusakan',
  'Baik - sedikit kotor/kusut', 
  'Cukup - ada noda ringan',
  'Cukup - ada kerusakan kecil',
  'Buruk - ada noda berat',
  'Buruk - ada kerusakan besar',
  'Hilang/tidak dikembalikan',
] as const

export type ConditionOption = typeof CONDITION_OPTIONS[number]

/**
 * Penalty rates (from business logic)
 */
export const PENALTY_RATES = {
  DAILY_LATE_RATE: 5000,
  CONDITION_PENALTIES: {
    baik: 0,
    cukup: 5000,
    buruk: 20000,
    hilang: 150000, // Default, overridden by modalAwal
  },
} as const

/**
 * Validation constraints
 */
export const VALIDATION_CONSTRAINTS = {
  MAX_CONDITIONS_PER_ITEM: 10,
  MIN_QUANTITY_PER_CONDITION: 1,
  MAX_QUANTITY_PER_CONDITION: 999,
  MAX_CONDITION_TEXT_LENGTH: 500,
} as const

// ==========================================
// UTILITY TYPES
// ==========================================

/**
 * Helper type for condition detection
 */
export interface ConditionMetadata {
  isLostItem: boolean
  isDamaged: boolean
  penaltyCategory: 'none' | 'late' | 'damage' | 'lost'
  calculatedPenalty: number
}

/**
 * State management types
 */
export interface MultiConditionState {
  itemConditions: Record<string, EnhancedItemCondition>
  validation: MultiConditionFormValidation
  penaltyCalculation: MultiConditionPenaltyResult | null
  processingMode: ProcessingMode
  isCalculating: boolean
  errors: string[]
}

export type MultiConditionAction = 
  | { type: 'SET_ITEM_CONDITION'; payload: { itemId: string; condition: EnhancedItemCondition } }
  | { type: 'SET_VALIDATION'; payload: MultiConditionFormValidation }
  | { type: 'SET_PENALTY_CALCULATION'; payload: MultiConditionPenaltyResult }
  | { type: 'SET_PROCESSING_MODE'; payload: ProcessingMode }
  | { type: 'SET_CALCULATING'; payload: boolean }
  | { type: 'ADD_ERROR'; payload: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'RESET_STATE' }