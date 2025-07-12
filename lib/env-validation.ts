/**
 * Environment Variables Validation
 *
 * Simplified validation yang tidak mengganggu development workflow
 */

import { z } from 'zod'

/**
 * Schema validasi untuk environment variables
 * Optional untuk development, required untuk production
 */
const envSchema = z.object({
  // Application Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_ENV: z.enum(['dev', 'prod']).default('dev'),

  // URLs - optional dengan default values
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),

  // Clerk Authentication - optional untuk development
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default('/sign-in'),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default('/sign-up'),

  // Database - optional untuk development
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),

  // Testing Configuration
  CLERK_TEST_MODE: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  NEXT_PUBLIC_CLERK_FRONTEND_API: z.string().optional(),
})

/**
 * Type untuk validated environment variables
 */
export type ValidatedEnv = z.infer<typeof envSchema>

/**
 * Validasi environment variables - simplified version
 */
export function validateEnv(): ValidatedEnv {
  // Always skip validation if explicitly disabled
  if (process.env.SKIP_ENV_VALIDATION === 'true') {
    console.log('⏭️ Environment validation skipped (SKIP_ENV_VALIDATION=true)')
    return process.env as unknown as ValidatedEnv
  }

  // Skip validation in development and test environments
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'test' ||
    !process.env.NODE_ENV
  ) {
    console.log('⏭️ Environment validation skipped (development/test mode)')
    return process.env as unknown as ValidatedEnv
  }

  // Only validate in production
  if (process.env.NODE_ENV === 'production') {
    try {
      const result = envSchema.parse(process.env)
      console.log('✅ Production environment validation passed')
      return result
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors
          .map((err) => `${err.path.join('.')}: ${err.message}`)
          .join('\n')

        console.error('❌ Production environment validation failed:')
        console.error(errorMessages)
        throw new Error(`Production environment validation failed:\n${errorMessages}`)
      }
      throw error
    }
  }

  // Default fallback
  return process.env as unknown as ValidatedEnv
}

/**
 * Validasi environment variables dengan format yang user-friendly
 */
export function validateEnvSafe(): { success: boolean; data?: ValidatedEnv; error?: string } {
  try {
    const data = validateEnv()
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    }
  }
}

/**
 * Helper untuk mengecek environment saat ini
 */
export function getCurrentEnvironment(): 'development' | 'production' | 'test' {
  const nodeEnv = process.env.NODE_ENV
  if (nodeEnv === 'development' || nodeEnv === 'production' || nodeEnv === 'test') {
    return nodeEnv
  }
  return 'development'
}

/**
 * Helper untuk mengecek apakah environment adalah development
 */
export function isDevelopment(): boolean {
  return getCurrentEnvironment() === 'development'
}

/**
 * Helper untuk mengecek apakah environment adalah production
 */
export function isProduction(): boolean {
  return getCurrentEnvironment() === 'production'
}

/**
 * Log environment configuration - simplified
 */
export function logEnvironmentInfo(): void {
  const env = getCurrentEnvironment()
  console.log(`🌍 Environment: ${env}`)

  if (env === 'production') {
    const hasClerkKeys = !!(
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
    )
    const hasDatabase = !!process.env.DATABASE_URL

    console.log(`   Clerk Keys: ${hasClerkKeys ? '✅' : '❌'}`)
    console.log(`   Database: ${hasDatabase ? '✅' : '❌'}`)
  }
}

/**
 * Validasi environment untuk testing
 */
export function validateTestingEnv(): boolean {
  const hasClerkKeys = !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
  )

  if (!hasClerkKeys) {
    console.error('❌ Missing Clerk keys for testing')
    return false
  }

  console.log('✅ Testing environment validated')
  return true
}
