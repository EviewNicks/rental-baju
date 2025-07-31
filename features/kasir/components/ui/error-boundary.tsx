'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
}

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent 
          error={this.state.error!} 
          resetError={this.resetError} 
        />
      )
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-red-200/50 p-8 text-center max-w-md mx-auto shadow-lg">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Terjadi Kesalahan
        </h3>
        <p className="text-gray-600 mb-4">
          Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi atau hubungi tim support jika masalah berlanjut.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 mb-2">
              Detail Error (Development)
            </summary>
            <pre className="text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
              {error.message}
              {error.stack && '\n\n' + error.stack}
            </pre>
          </details>
        )}
        <div className="flex gap-2 justify-center">
          <Button
            onClick={resetError}
            className="bg-red-600 hover:bg-red-700 text-white"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Coba Lagi
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
          >
            Muat Ulang Halaman
          </Button>
        </div>
      </div>
    </div>
  )
}

// Hook for handling async errors in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const handleError = React.useCallback((error: Error) => {
    console.error('Async error:', error)
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { handleError, resetError }
}

// Specialized error fallback for API errors
export function ApiErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isNetworkError = error.message.includes('fetch') || error.message.includes('Koneksi')
  const isServerError = error.message.includes('server') || error.message.includes('Server')

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-red-200/50 p-6 text-center">
      <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
      <h3 className="font-semibold text-gray-900 mb-2">
        {isNetworkError ? 'Masalah Koneksi' : 
         isServerError ? 'Masalah Server' : 
         'Terjadi Kesalahan'}
      </h3>
      <p className="text-gray-600 text-sm mb-4">
        {isNetworkError ? 'Periksa koneksi internet Anda dan coba lagi.' :
         isServerError ? 'Server sedang mengalami masalah. Coba lagi dalam beberapa saat.' :
         error.message || 'Terjadi kesalahan yang tidak terduga.'}
      </p>
      <div className="flex gap-2 justify-center">
        <Button
          onClick={resetError}
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Coba Lagi
        </Button>
        {isNetworkError && (
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
          >
            Muat Ulang
          </Button>
        )}
      </div>
    </div>
  )
}

export default ErrorBoundary