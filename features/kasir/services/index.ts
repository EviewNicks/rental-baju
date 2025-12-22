/**
 * Kasir Services Index - Enhanced with Availability Product View
 * Centralized exports for all kasir services including new availability features
 */

// Existing service exports
export { TransaksiService } from './transaksiService'
export { PickupService, createPickupService } from './pickupService'
export { InventoryService, createInventoryService, inventoryService } from './inventoryService'
export { AvailabilityService, createAvailabilityService } from './availabilityService'

// New Availability Product View services - Task 1
export { 
  TransactionHistoryService, 
  createTransactionHistoryService 
} from './ItemHistoryService'

export { 
  EnhancedAvailabilityService, 
  createEnhancedAvailabilityService 
} from './SizeAvailabilityService'

// Convenience factory functions for creating service instances
import { PrismaClient } from '@prisma/client'
import { TransactionHistoryService } from './ItemHistoryService'
import { EnhancedAvailabilityService } from './SizeAvailabilityService'

/**
 * Create all availability-related services with shared Prisma instance
 * Useful for ensuring consistent database connections across services
 */
export const createAvailabilityServices = (prisma: PrismaClient) => {
  return {
    transactionHistoryService: new TransactionHistoryService(prisma),
    enhancedAvailabilityService: new EnhancedAvailabilityService(prisma)
  }
}

/**
 * Service configuration for availability product view
 */
export const AVAILABILITY_CONFIG = {
  CACHE_TTL_MINUTES: 5,
  DEFAULT_HISTORY_LIMIT: 50,
  DEFAULT_STATUSES: ['active', 'diambil'] as const, // REVISED: Only active and diambil
  DATE_PROXIMITY_SORT: true
} as const