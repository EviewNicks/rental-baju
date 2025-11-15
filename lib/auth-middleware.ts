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
 * Owner-only authorization middleware
 * For highest-level operations requiring owner privileges
 */
export async function requireOwnerAccess() {
  return requireAuthAndRole(['owner'])
}

/**
 * Producer-level authorization middleware
 * For operations requiring producer or higher privileges (owner/producer)
 */
export async function requireProducerAccess() {
  return requireAuthAndRole(['owner', 'producer'])
}

/**
 * Enhanced kasir authorization middleware
 * For kasir operations accessible by kasir, producer, admin, or owner roles
 */
export async function requireKasirAccessEnhanced() {
  return requireAuthAndRole(['owner', 'producer', 'admin', 'kasir'])
}

/**
 * Enhanced role validation with permissions
 */
export interface Permission {
  resource: string
  action: 'create' | 'read' | 'update' | 'delete'
}

export interface RolePermissions {
  owner: Permission[]
  producer: Permission[]
  admin: Permission[]
  kasir: Permission[]
  user: Permission[]
}

/**
 * Role hierarchy mapping - defines which roles inherit from others
 * Higher roles inherit permissions from lower roles in the hierarchy
 */
export const ROLE_HIERARCHY: Record<string, string[]> = {
  owner: ['owner', 'producer', 'admin', 'kasir'], // Owner has all permissions
  producer: ['producer', 'admin', 'kasir'], // Producer has admin + kasir permissions
  admin: ['admin', 'kasir'], // Admin has kasir permissions (legacy)
  kasir: ['kasir'], // Kasir has only kasir permissions
  user: ['user'], // User has limited permissions
}

export const KASIR_PERMISSIONS: RolePermissions = {
  owner: [
    // Owner has full access to all resources and actions
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
    { resource: 'pembayaran', action: 'update' },
    { resource: 'pembayaran', action: 'delete' },
    { resource: 'produk', action: 'create' },
    { resource: 'produk', action: 'read' },
    { resource: 'produk', action: 'update' },
    { resource: 'produk', action: 'delete' },
    { resource: 'kasir', action: 'create' },
    { resource: 'kasir', action: 'read' },
    { resource: 'kasir', action: 'update' },
    { resource: 'kasir', action: 'delete' },
    { resource: 'audit', action: 'read' },
    { resource: 'dashboard', action: 'read' },
    { resource: 'reports', action: 'read' },
  ],
  producer: [
    // Producer has product management + kasir operational access
    { resource: 'penyewa', action: 'create' },
    { resource: 'penyewa', action: 'read' },
    { resource: 'penyewa', action: 'update' },
    { resource: 'transaksi', action: 'create' },
    { resource: 'transaksi', action: 'read' },
    { resource: 'transaksi', action: 'update' },
    { resource: 'pembayaran', action: 'create' },
    { resource: 'pembayaran', action: 'read' },
    { resource: 'produk', action: 'create' },
    { resource: 'produk', action: 'read' },
    { resource: 'produk', action: 'update' },
    { resource: 'produk', action: 'delete' },
    { resource: 'kasir', action: 'read' },
    { resource: 'dashboard', action: 'read' },
  ],
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
    { resource: 'kasir', action: 'create' },
    { resource: 'kasir', action: 'read' },
    { resource: 'kasir', action: 'update' },
    { resource: 'audit', action: 'read' },
  ],
  kasir: [
    // Kasir has operational access (limited read for selection workflow)
    { resource: 'penyewa', action: 'create' },
    { resource: 'penyewa', action: 'read' },
    { resource: 'penyewa', action: 'update' },
    { resource: 'transaksi', action: 'create' },
    { resource: 'transaksi', action: 'read' },
    { resource: 'transaksi', action: 'update' },
    { resource: 'pembayaran', action: 'create' },
    { resource: 'pembayaran', action: 'read' },
    { resource: 'kasir', action: 'read' }, // For selection workflow
    { resource: 'produk', action: 'read' },
  ],
  user: [
    // Regular users have limited access (not applicable for kasir endpoints)
    { resource: 'penyewa', action: 'read' },
  ],
}

/**
 * Check if user has specific permission using role hierarchy
 */
export function hasPermission(
  userRole: string,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete',
): boolean {
  // Get all roles this user inherits from (including their own role)
  const inheritedRoles = ROLE_HIERARCHY[userRole] || []

  // Check if any of the inherited roles has the required permission
  for (const role of inheritedRoles) {
    const rolePermissions = KASIR_PERMISSIONS[role as keyof RolePermissions] || []
    if (rolePermissions.some((p) => p.resource === resource && p.action === action)) {
      return true
    }
  }

  return false // Fail-safe default: no permission found
}

/**
 * Utility functions for role validation
 */
export function getRoleHierarchy(userRole: string): string[] {
  return ROLE_HIERARCHY[userRole] || []
}

export function hasRoleAccess(userRole: string, requiredRole: string): boolean {
  const inheritedRoles = getRoleHierarchy(userRole)
  return inheritedRoles.includes(requiredRole)
}

export function isOwnerRole(userRole: string): boolean {
  return userRole === 'owner'
}

export function isProducerRole(userRole: string): boolean {
  return userRole === 'producer' || isOwnerRole(userRole)
}

export function isKasirRole(userRole: string): boolean {
  return userRole === 'kasir' || isProducerRole(userRole) || isOwnerRole(userRole)
}

/**
 * Permission-based authorization middleware
 */
export async function requirePermission(
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete',
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
          code: 'INSUFFICIENT_PERMISSIONS',
        },
        { status: 403 },
      ),
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
  windowMs: number = 60000,
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
      resetTime: record.resetTime,
    }
  }

  record.count++
  return {
    allowed: true,
    remainingRequests: maxRequests - record.count,
    resetTime: record.resetTime,
  }
}

/**
 * Rate limiting middleware
 */
export async function withRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000,
) {
  const rateLimit = checkRateLimit(identifier, maxRequests, windowMs)

  if (!rateLimit.allowed) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          },
        },
      ),
    }
  }

  return {
    rateLimitHeaders: {
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': rateLimit.remainingRequests.toString(),
      'X-RateLimit-Reset': rateLimit.resetTime.toString(),
    },
  }
}
