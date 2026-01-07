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
 * Get kasir information from authenticated user with fallback strategies
 * 
 * Strategy 1: Find kasir by createdBy (current approach)
 * Strategy 2: Find kasir by userId as kasirId (temporary mapping)
 * Strategy 3: Use default kasir for the user role
 * 
 * @param prisma - Prisma client instance
 * @param userId - Authenticated user ID
 * @returns Kasir info or null if not found
 */
export async function getKasirFromUser(
  prisma: PrismaClient,
  userId: string
): Promise<KasirInfo | null> {
  const startTime = Date.now()
  
  
  try {
    
    let kasir = await prisma.kasir.findFirst({
      where: {
        createdBy: userId,
        isActive: true,
      },
      select: {
        id: true,
        nama: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (kasir) {
      return kasir
    }

    
    kasir = await prisma.kasir.findUnique({
      where: {
        id: userId,
        isActive: true,
      },
      select: {
        id: true,
        nama: true,
      },
    })

    if (kasir) {
        return kasir
    }

    
    kasir = await prisma.kasir.findFirst({
      where: {
        isActive: true,
        id: { not: 'owner-system' }, // Exclude owner
      },
      select: {
        id: true,
        nama: true,
      },
      orderBy: {
        createdAt: 'asc', // Get oldest (most stable) kasir
      },
    })

    if (kasir) {
      return kasir
    }

    // No kasir found with any strategy
    const duration = Date.now() - startTime
    
    // Debug: Show all kasir in database
    const allKasir = await prisma.kasir.findMany({
      select: { id: true, nama: true, createdBy: true, isActive: true },
      take: 10
    })

    return null
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('💥 [KASIR-HELPER] Database error during kasir lookup:', {
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`
    })
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