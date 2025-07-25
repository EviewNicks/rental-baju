import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

/**
 * Authentication middleware untuk memverifikasi user session dan role
 *
 * @returns Object dengan user info atau error response
 */
export async function requireAuth() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        error: NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 },
        ),
      }
    }

    // Get user dengan custom claims untuk role
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const role = (user.publicMetadata.role as string) || 'user'

    return {
      user: {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        role: role,
        clerkId: userId,
      },
    }
  } catch (error) {
    console.error('Auth error:', error)
    return {
      error: NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 },
      ),
    }
  }
}

/**
 * Role validation middleware
 *
 * @param allowedRoles - Array role yang diizinkan
 * @param user - User object dari auth
 * @returns Error response atau null jika valid
 */
export function requireRole(allowedRoles: string[], user: { role: string }) {
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      {
        success: false,
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
      },
      { status: 403 },
    )
  }
  return null
}

/**
 * Combined auth and role check middleware
 *
 * @param allowedRoles - Array role yang diizinkan
 * @returns Object dengan user info atau error response
 */
export async function requireAuthAndRole(allowedRoles: string[]) {
  const authResult = await requireAuth()
  if (authResult.error) {
    return authResult
  }

  const roleCheck = requireRole(allowedRoles, authResult.user)
  if (roleCheck) {
    return { error: roleCheck }
  }

  return authResult
}

/**
 * Kasir-specific authorization middleware
 * Ensures user has admin or kasir role for kasir endpoints
 */
export async function requireKasirAccess() {
  return requireAuthAndRole(['admin', 'kasir'])
}

/**
 * Admin-only authorization middleware
 * For sensitive operations that require admin privileges
 */
export async function requireAdminAccess() {
  return requireAuthAndRole(['admin'])
}

/**
 * Enhanced role validation with permissions
 */
export interface Permission {
  resource: string
  action: 'create' | 'read' | 'update' | 'delete'
}

export interface RolePermissions {
  admin: Permission[]
  kasir: Permission[]
  user: Permission[]
}

export const KASIR_PERMISSIONS: RolePermissions = {
  admin: [
    // Admin has full access
    { resource: 'penyewa', action: 'create' },
    { resource: 'penyewa', action: 'read' },
    { resource: 'penyewa', action: 'update' },
    { resource: 'penyewa', action: 'delete' },
    { resource: 'transaksi', action: 'create' },
    { resource: 'transaksi', action: 'read' },
    { resource: 'transaksi', action: 'update' },
    { resource: 'transaksi', action: 'delete' },
    { resource: 'pembayaran', action: 'create' },
    { resource: 'pembayaran', action: 'read' },
    { resource: 'produk', action: 'read' },
    { resource: 'audit', action: 'read' }
  ],
  kasir: [
    // Kasir has operational access
    { resource: 'penyewa', action: 'create' },
    { resource: 'penyewa', action: 'read' },
    { resource: 'penyewa', action: 'update' },
    { resource: 'transaksi', action: 'create' },
    { resource: 'transaksi', action: 'read' },
    { resource: 'transaksi', action: 'update' },
    { resource: 'pembayaran', action: 'create' },
    { resource: 'pembayaran', action: 'read' },
    { resource: 'produk', action: 'read' }
  ],
  user: [
    // Regular users have limited access (not applicable for kasir endpoints)
    { resource: 'penyewa', action: 'read' }
  ]
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
  userRole: string,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete'
): boolean {
  const rolePermissions = KASIR_PERMISSIONS[userRole as keyof RolePermissions] || []
  return rolePermissions.some(p => p.resource === resource && p.action === action)
}

/**
 * Permission-based authorization middleware
 */
export async function requirePermission(
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete'
) {
  const authResult = await requireAuth()
  if (authResult.error) {
    return authResult
  }

  const hasAccess = hasPermission(authResult.user.role, resource, action)
  if (!hasAccess) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: `Access denied. Insufficient permissions for ${action} on ${resource}`,
          code: 'INSUFFICIENT_PERMISSIONS'
        },
        { status: 403 }
      )
    }
  }

  return authResult
}

/**
 * Rate limiting helper (basic implementation)
 * In production, use Redis or dedicated rate limiting service
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remainingRequests: number; resetTime: number } {
  const now = Date.now()
  const key = identifier
  
  let record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + windowMs }
    rateLimitStore.set(key, record)
  }
  
  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remainingRequests: 0,
      resetTime: record.resetTime
    }
  }
  
  record.count++
  return {
    allowed: true,
    remainingRequests: maxRequests - record.count,
    resetTime: record.resetTime
  }
}

/**
 * Rate limiting middleware
 */
export async function withRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
) {
  const rateLimit = checkRateLimit(identifier, maxRequests, windowMs)
  
  if (!rateLimit.allowed) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetTime.toString()
          }
        }
      )
    }
  }
  
  return {
    rateLimitHeaders: {
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': rateLimit.remainingRequests.toString(),
      'X-RateLimit-Reset': rateLimit.resetTime.toString()
    }
  }
}
