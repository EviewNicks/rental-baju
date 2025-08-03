/**
 * Client-Safe Kasir Utils
 * Browser-compatible utilities that can be safely imported by client components
 * 
 * ⚠️ DO NOT import server-only dependencies (Prisma, Node.js modules) here
 */

// Browser-safe utilities (formatting, basic helpers)
export { cn, formatCurrency, formatDate, getDaysOverdue } from './common'

// Transaction code generation (browser-safe)
export { TransactionCodeGenerator } from './codeGenerator'

// Pickup utilities (browser-safe)
export { 
  calculateTransactionPickupStatus,
  isPickupAvailable 
} from './pickupUtils'