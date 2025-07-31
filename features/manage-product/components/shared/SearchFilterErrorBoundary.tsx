'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface SearchFilterErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface SearchFilterErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  onReset?: () => void
}

export class SearchFilterErrorBoundary extends React.Component<
  SearchFilterErrorBoundaryProps,
  SearchFilterErrorBoundaryState
> {
  constructor(props: SearchFilterErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<SearchFilterErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SearchFilterErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo,
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })

    // Call custom reset handler if provided
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      const { fallback: FallbackComponent } = this.props
      
      // Use custom fallback if provided
      if (FallbackComponent && this.state.error) {
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />
      }

      // Default error UI
      return (
        <Card className="mb-6 border-destructive/20 bg-destructive/5">
          <CardContent className="px-6 py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-destructive mb-1">
                  Error pada Filter Pencarian
                </h3>
                <p className="text-xs text-muted-foreground">
                  Terjadi kesalahan saat memuat komponen filter. Silakan coba muat ulang.
                </p>
              </div>
              <button
                onClick={this.resetError}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-destructive border border-destructive/20 rounded-md hover:bg-destructive/10 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Muat Ulang
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-3 text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Detail Error (Development)
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

// Hook untuk menggunakan error boundary secara programmatic
export function useSearchFilterErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    console.error('Search filter error captured:', error)
    setError(error)
  }, [])

  // Reset error when component unmounts
  React.useEffect(() => {
    return () => setError(null)
  }, [])

  return {
    error,
    resetError,
    captureError,
  }
}

// Functional wrapper for easier usage
interface SearchFilterErrorFallbackProps {
  error: Error
  resetError: () => void
}

export function SearchFilterErrorFallback({ error, resetError }: SearchFilterErrorFallbackProps) {
  return (
    <Card className="mb-6 border-destructive/20 bg-destructive/5">
      <CardContent className="px-6 py-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-destructive mb-1">
              Filter Error
            </h3>
            <p className="text-xs text-muted-foreground">
              {error.message || 'Komponen filter mengalami error'}
            </p>
          </div>
          <button
            onClick={resetError}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-destructive border border-destructive/20 rounded-md hover:bg-destructive/10 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </CardContent>
    </Card>
  )
}