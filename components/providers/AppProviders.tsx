'use client'

/**
 * Combined App Providers
 * Includes all necessary providers for the application
 */

import { QueryProvider } from './QueryProvider'
import { ToastContainer } from '@/components/ui/toast'

interface AppProvidersProps {
  children: React.ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      {children}
      {/* Toast Container - Always rendered to show notifications */}
      <ToastContainer />
    </QueryProvider>
  )
}