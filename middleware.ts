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
 * - /owner/* = Owner area (hanya owner)
 * - /producer/* = Producer area (owner & producer)
 * - /kasir/* = Kasir area (owner, producer, kasir)
 */

// Define protected routes using Clerk's createRouteMatcher
const isProtectedRoute = createRouteMatcher([
  '/owner(.*)',
  '/producer(.*)',
  '/dashboard(.*)',
  '/settings(.*)',
  '/profile(.*)',
])

// Define owner-only routes
const isOwnerRoute = createRouteMatcher(['/owner(.*)'])
// Define producer routes (owner & producer)
const isProducerRoute = createRouteMatcher(['/producer(.*)'])
// Define kasir routes (owner, producer, kasir) - menggunakan /dashboard
const isKasirRoute = createRouteMatcher(['/dashboard(.*)'])

export default clerkMiddleware(
  async (auth, req) => {
    if (isProtectedRoute(req)) {
      await auth.protect()
    }

    const { sessionClaims } = await auth()
    const userRole = sessionClaims?.role as string

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
