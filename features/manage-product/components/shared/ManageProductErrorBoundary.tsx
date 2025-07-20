'use client'

import React, { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ManageProductErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

export class ManageProductErrorBoundary extends Component<
  ManageProductErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ManageProductErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('ManageProductErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo,
    })

    // Here you could send error to monitoring service
    // Example: Sentry, LogRocket, or custom error tracking
    if (typeof window !== 'undefined') {
      // Only log in browser environment
      console.group('🚨 Product Management Error Details')
      console.error('Error:', error.message)
      console.error('Stack:', error.stack)
      console.error('Component Stack:', errorInfo.componentStack)
      console.groupEnd()
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
    
    // Call optional reset callback
    this.props.onReset?.()
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/producer'
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error fallback UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Terjadi Kesalahan Sistem
                </h1>
                <p className="text-gray-600 mb-6">
                  Maaf, terjadi kesalahan yang tidak terduga pada sistem manajemen produk. 
                  Tim teknis telah diberitahu dan sedang menangani masalah ini.
                </p>
              </div>

              {/* Error Details (only show in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                  <h3 className="text-sm font-semibold text-red-800 mb-2">
                    Error Details (Development Only):
                  </h3>
                  <p className="text-xs text-red-700 font-mono mb-2">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="text-xs text-red-600">
                      <summary className="cursor-pointer hover:text-red-800">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap text-xs">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleReset}
                  className="flex items-center gap-2"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4" />
                  Coba Lagi
                </Button>
                
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Muat Ulang Halaman
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Kembali ke Dashboard
                </Button>
              </div>

              {/* Additional Help */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Jika masalah terus berlanjut, silakan hubungi tim dukungan teknis atau 
                  coba akses halaman lain terlebih dahulu.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    // No error, render children normally
    return this.props.children
  }
}

// Hook version for functional components that need error boundary functionality
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    console.error('Captured error:', error)
    setError(error)
  }, [])

  // Throw error to be caught by error boundary
  if (error) {
    throw error
  }

  return { captureError, resetError }
}

// Higher-order component version
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <ManageProductErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ManageProductErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}