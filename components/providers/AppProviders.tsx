'use client'

/**
 * Combined App Providers
 * Includes all necessary providers for the application
 */

import { QueryProvider } from './QueryProvider'

interface AppProvidersProps {
  children: React.ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return <QueryProvider>{children}</QueryProvider>
}
