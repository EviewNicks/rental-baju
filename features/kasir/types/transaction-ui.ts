/**
 * UI-specific types for transaction components
 * Separated from business logic types for better organization
 */

export interface TransactionSuccessProps {
  transactionCode?: string
  message?: string
  redirectDelay?: number
}

export interface TransactionFormState {
  showSuccess: boolean
  errorMessage: string | null
  isDataRestored: boolean
}

export interface StepIndicatorProps {
  currentStep: number
  canProceed: boolean
  onStepClick: (step: number) => void
}

export interface TransactionNotification {
  type: 'error' | 'warning' | 'info' | 'success'
  title: string
  message: string
  helpText?: string
  dismissible?: boolean
  autoHide?: boolean
  duration?: number
}

/**
 * Props for the main transaction form page
 */
export interface TransactionFormPageProps {
  // Future: Could accept initial data or configuration
  initialStep?: number
  onTransactionComplete?: (transactionId: string) => void
}