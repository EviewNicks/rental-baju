/**
 * Kasir Utils - Central Export Hub
 * 
 * ⚠️ IMPORTANT: Import Guidelines
 * 
 * For CLIENT COMPONENTS (browser):
 *   import { ... } from './client'
 *   - Browser-safe utilities only
 *   - No Prisma or Node.js dependencies
 * 
 * For SERVER COMPONENTS/API ROUTES:
 *   import { ... } from './server' 
 *   - Full server utilities including PriceCalculator
 *   - Includes Prisma Decimal and Node.js modules
 * 
 * This file maintains backward compatibility but is NOT recommended 
 * for new code. Use specific client/server imports instead.
 */

// Common utilities (formatting, basic helpers)
export { cn, formatCurrency, formatDate, getDaysOverdue } from './common'

// Transaction code generation
export { TransactionCodeGenerator } from './codeGenerator'

// Price calculation utilities (SERVER ONLY - causes bundling issues in client)
export { 
  PriceCalculator,
  type TransactionItem,
  type PriceCalculationResult 
} from './priceCalculator'

// Pickup utilities
export { 
  calculateTransactionPickupStatus,
  isPickupAvailable 
} from './pickupUtils'