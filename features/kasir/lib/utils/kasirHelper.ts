/**
 * Kasir Helper Functions
 * Simple utility functions for kasir lookup and validation
 */

import { PrismaClient } from '@prisma/client'

export interface KasirInfo {
  id: string
  nama: string
}

/**
 * Get kasir information from authenticated user
 * Simple approach: find first active kasir associated with user
 * 
 * @param prisma - Prisma client instance
 * @param userId - Authenticated user ID
 * @returns Kasir info or null if not found
 */
export async function getKasirFromUser(
  prisma: PrismaClient,
  userId: string
): Promise<KasirInfo | null> {
  try {
    // Simple approach: find first active kasir created by this user
    // This assumes kasir records have createdBy field linking to user
    const kasir = await prisma.kasir.findFirst({
      where: {
        createdBy: userId,
        isActive: true,
      },
      select: {
        id: true,
        nama: true,
      },
      orderBy: {
        createdAt: 'desc', // Get most recent if multiple
      },
    })

    return kasir
  } catch (error) {
    console.error('Error fetching kasir from user:', error)
    return null
  }
}

/**
 * Validate kasir exists and is active
 * 
 * @param prisma - Prisma client instance
 * @param kasirId - Kasir ID to validate
 * @returns true if kasir is valid and active
 */
export async function validateKasir(
  prisma: PrismaClient,
  kasirId: string
): Promise<boolean> {
  try {
    const kasir = await prisma.kasir.findUnique({
      where: { id: kasirId },
      select: { isActive: true },
    })

    return kasir?.isActive === true
  } catch (error) {
    console.error('Error validating kasir:', error)
    return false
  }
}