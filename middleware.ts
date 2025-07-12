import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

/**
 * Enhanced Clerk Middleware dengan Role-Based Authorization
 *
 * Middleware ini menggunakan Clerk's recommended approach dengan auth.protect()
 * untuk mengatasi session timing issues dan mengikuti best practices.
 *
 * Role diambil dari custom session claim "role" yang dikonfigurasi di Clerk Dashboard.
 *
 * Referensi:
 * - https://clerk.com/docs/references/nextjs/clerk-middleware
 * - https://clerk.com/docs/guides/basic-rbac
 * - https://clerk.com/docs/backend-requests/jwt-templates
 *
 * App Structure:
 * - /dashboard = User area (default)
 * - /admin/* = Admin area
 * - /creator/* = Creator area
 */

// Define protected routes using Clerk's createRouteMatcher
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)',
  '/creator(.*)',
  '/settings(.*)',
  '/profile(.*)',
])

// Define admin-only routes for role-based protection
const isAdminRoute = createRouteMatcher(['/admin(.*)'])

// Define creator routes (accessible by creator and admin)
const isCreatorRoute = createRouteMatcher(['/creator(.*)'])

export default clerkMiddleware(
  async (auth, req) => {
    // Protect routes that require authentication using Clerk's auth.protect()
    if (isProtectedRoute(req)) {
      await auth.protect()
    }

    // Additional role-based protection for admin routes
    if (isAdminRoute(req)) {
      const { sessionClaims } = await auth()

      // Access role directly from custom session claims
      // Based on Clerk Dashboard config: "role": "{{user.public_metadata.role || 'user'}}"
      const userRole = sessionClaims?.role as string

      if (userRole !== 'admin') {
        // Redirect non-admin users to unauthorized page
        const url = new URL('/unauthorized', req.url)
        return Response.redirect(url)
      }
    }

    // Additional role-based protection for creator routes
    if (isCreatorRoute(req)) {
      const { sessionClaims } = await auth()

      // Access role directly from custom session claims
      const userRole = sessionClaims?.role as string

      // Allow admin and creator roles
      if (userRole !== 'admin' && userRole !== 'creator') {
        const url = new URL('/unauthorized', req.url)
        return Response.redirect(url)
      }
    }
  },
  {
    // ✅ FIX: Include test environment untuk debug
    debug: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',

    // Fix clock skew issue - allow 30 seconds difference
    clockSkewInMs: 30000,

    // Ensure proper sign-in/sign-up URLs are set
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
