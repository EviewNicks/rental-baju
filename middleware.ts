import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

/**
 * Enhanced Clerk Middleware dengan Role-Based Authorization
 *
 * Middleware ini menggunakan Clerk's recommended approach dengan auth.protect()
 * untuk mengatasi session timing issues dan mengikuti best practices.
 *
 * Role diambil dari custom session claim "role" yang dikonfigurasi di Clerk Dashboard.
 *
 * Fitur baru: Root path (/) redirect ke sign-in untuk unauthenticated users
 * dan role-based dashboard redirect untuk authenticated users.
 *
 * Referensi:
 * - https://clerk.com/docs/references/nextjs/clerk-middleware
 * - https://clerk.com/docs/guides/basic-rbac
 * - https://clerk.com/docs/backend-requests/jwt-templates
 *
 * App Structure:
 * - /owner/* = Owner area (hanya owner)
 * - /producer/* = Producer area (owner & producer)
 * - /dashboard/* = Kasir area (owner, producer, kasir)
 * - / = Redirect ke sign-in atau role dashboard
 */

// Define protected routes using Clerk's createRouteMatcher

// Define public routes (excluding root path for redirect behavior)
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/about(.*)',
  '/contact(.*)',
  '/unauthorized',
])

// Define owner-only routes
const isOwnerRoute = createRouteMatcher(['/owner(.*)'])
// Define producer routes (owner & producer)
const isProducerRoute = createRouteMatcher(['/producer(.*)'])
// Define kasir routes (owner, producer, kasir) - menggunakan /dashboard
const isKasirRoute = createRouteMatcher(['/dashboard(.*)'])

// Helper function untuk robust role extraction dari Clerk session claims
// Menggunakan multiple fallback sources untuk memastikan role terdeteksi dengan benar
//eslint-disable-next-line @typescript-eslint/no-explicit-any
const extractUserRole = (sessionClaims: any) => {
  // Prioritize: metadata.role → sessionClaims.role → publicMetadata.role → fallback
  const role =
    sessionClaims?.metadata?.role ||
    sessionClaims?.role ||
    sessionClaims?.publicMetadata?.role ||
    'user'

  return role
}

// Role dashboard mapping function (sama dengan useRoleNavigation)
const getRoleDashboardUrl = (role: string) => {
  switch (role) {
    case 'owner':
      return '/owner'
    case 'producer':
      return '/producer/manage-product'
    case 'admin':
    case 'kasir':
      return '/dashboard'
    default:
      return '/unauthorized'
  }
}

export default clerkMiddleware(
  async (auth, req) => {
    // Handle root path specifically - ini fitur baru untuk role-based redirect
    if (req.nextUrl.pathname === '/') {
      const { userId, sessionClaims } = await auth()

      if (!userId) {
        // User belum login → redirect ke sign-in dengan return URL
        const signInUrl = new URL('/sign-in', req.url)
        signInUrl.searchParams.set('redirect_url', '/')
        return NextResponse.redirect(signInUrl)
      }

      // User sudah login → redirect ke role dashboard
      const role = extractUserRole(sessionClaims)
      const dashboardUrl = getRoleDashboardUrl(role)
      console.log('🔄 Root Redirect:', { userId, role, dashboardUrl })
      return NextResponse.redirect(new URL(dashboardUrl, req.url))
    }

    // Standard route protection for other paths
    if (isPublicRoute(req)) {
      return NextResponse.next()
    }

    // Protect all other routes
    await auth.protect()

    // Role-based route validation
    const { sessionClaims } = await auth()
    const userRole = extractUserRole(sessionClaims)

    // Owner-only routes
    if (isOwnerRoute(req)) {
      if (userRole !== 'owner') {
        const url = new URL('/unauthorized', req.url)
        return Response.redirect(url)
      }
    }

    // Producer routes (owner & producer)
    if (isProducerRoute(req)) {
      if (userRole !== 'owner' && userRole !== 'producer') {
        const url = new URL('/unauthorized', req.url)
        return Response.redirect(url)
      }
    }

    // Kasir routes (owner, producer, kasir) - menggunakan /dashboard
    if (isKasirRoute(req)) {
      if (userRole !== 'owner' && userRole !== 'producer' && userRole !== 'kasir') {
        const url = new URL('/unauthorized', req.url)
        return Response.redirect(url)
      }
    }

    return NextResponse.next()
  },
  {
    debug: false,
    clockSkewInMs: 30000,
    signInUrl: '/sign-in',
    signUpUrl: '/sign-up',
  },
)

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
