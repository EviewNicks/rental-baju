/**
 * Server-Only Kasir Utils
 * Server-side utilities that depend on Node.js modules or Prisma
 * 
 * ⚠️ DO NOT import this in client components - use ./client.ts instead
 * ✅ Safe to import in API routes, server components, and server-side services
 */

// Price calculation utilities (uses Prisma Decimal - server-only)
export { 
  PriceCalculator,
  type TransactionItem,
  type PriceCalculationResult,
  // New enhanced types for transaction enhancements
  type EnhancedTransactionItem,
  type EnhancedPriceCalculationResult,
  type PriceCalculationParams
} from './priceCalculator'

// Date calculation utilities for transaction enhancements
export { DateCalculator } from './dateCalculator'

// Re-export client-safe utilities for convenience in server context
export { cn, formatCurrency, formatDate, getDaysOverdue } from './common'
export { TransactionCodeGenerator } from './codeGenerator'
export { 
  calculateTransactionPickupStatus,
  isPickupAvailable 
} from './pickupUtils'