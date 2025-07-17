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
