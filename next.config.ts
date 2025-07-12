/** @type {import('next').NextConfig} */

// Skip validation untuk testing dan CI environment
const isTestEnvironment = process.env.NODE_ENV === 'test' || typeof jest !== 'undefined'
const isCIEnvironment = process.env.CI === 'true'

if (!isTestEnvironment && !isCIEnvironment) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { validateEnvSafe } = require('./lib/env-validation.ts')
    const validation = validateEnvSafe()
    if (!validation.success) {
      console.error('❌ Environment validation failed:')
      console.error(validation.error)
      process.exit(1)
    }
  } catch (error) {
    console.warn(
      '⚠️ Environment validation skipped:',
      error instanceof Error ? error.message : 'Unknown error',
    )
  }
} else {
  console.log('ℹ️ Environment validation skipped for CI/Test environment')
}

const nextConfig = {
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'another-domain.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.dribbble.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Modern image optimization
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Development optimizations
  reactStrictMode: true,
  // swcMinify removed - now default in Next.js 15+

  // Compiler configuration
  compiler: {
    // Remove console logs in production
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,

    // Styled components support (if needed)
    styledComponents: true,
  },

  // Experimental features - hanya yang stabil untuk CI
  experimental: {
    // Performance optimizations yang sudah stabil
    optimizePackageImports: ['@radix-ui/react-slot', 'lucide-react', 'clsx', 'tailwind-merge'],

    // Memory usage optimization - skip di CI untuk stabilitas
    ...(!isCIEnvironment && {
      memoryBasedWorkersCount: true,
    }),
  },

  // Security headers
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
      ],
    },
  ],

  // Redirect configuration
  redirects: async () => [
    {
      source: '/home',
      destination: '/',
      permanent: true,
    },
  ],

  // Output configuration
  output: 'standalone',

  // TypeScript configuration - strict untuk semua environment
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration - strict untuk semua environment
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Performance logging - hanya di development
  ...(process.env.NODE_ENV === 'development' &&
    !isCIEnvironment && {
      logging: {
        fetches: {
          fullUrl: true,
        },
      },
    }),
}

module.exports = nextConfig
