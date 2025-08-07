'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'

interface ReturnErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

interface ReturnErrorBoundaryProps {
  children: React.ReactNode
  onReset?: () => void
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
}

export class ReturnErrorBoundary extends React.Component<
  ReturnErrorBoundaryProps,
  ReturnErrorBoundaryState
> {
  constructor(props: ReturnErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ReturnErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Return process error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
    
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent 
            error={this.state.error!} 
            reset={this.handleReset} 
          />
        )
      }

      return (
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-2xl mx-auto">
            <Card className="p-8">
              <div className="text-center space-y-6">
                {/* Error Icon */}
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>

                {/* Error Title */}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Terjadi Kesalahan
                  </h1>
                  <p className="text-gray-600">
                    Maaf, terjadi kesalahan saat memproses pengembalian. 
                    Silakan coba lagi atau hubungi administrator.
                  </p>
                </div>

                {/* Error Details (Development Only) */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="text-left">
                        <div className="font-medium mb-2">Detail Error:</div>
                        <div className="text-sm font-mono bg-red-50 p-2 rounded border overflow-auto">
                          {this.state.error.message}
                        </div>
                        {this.state.errorInfo && (
                          <details className="mt-2">
                            <summary className="cursor-pointer font-medium">
                              Stack Trace
                            </summary>
                            <pre className="text-xs bg-red-50 p-2 rounded border overflow-auto mt-1">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </details>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={this.handleReset}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Coba Lagi
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/dashboard'}
                    className="flex items-center gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Dashboard
                  </Button>
                </div>

                {/* Help Text */}
                <div className="text-sm text-gray-500 border-t pt-4">
                  <p>
                    Jika masalah terus berlanjut, silakan:
                  </p>
                  <ul className="mt-2 space-y-1 text-left max-w-md mx-auto">
                    <li>• Refresh halaman browser</li>
                    <li>• Periksa koneksi internet</li>
                    <li>• Coba lagi beberapa saat</li>
                    <li>• Hubungi administrator sistem</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional component wrapper for easier usage
export function withReturnErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    onReset?: () => void
    fallback?: React.ComponentType<{ error: Error; reset: () => void }>
  }
) {
  return function WrappedComponent(props: P) {
    return (
      <ReturnErrorBoundary 
        onReset={options?.onReset}
        fallback={options?.fallback}
      >
        <Component {...props} />
      </ReturnErrorBoundary>
    )
  }
}

// Default error fallback component
export function DefaultReturnErrorFallback({ 
  error, 
  reset 
}: { 
  error: Error
  reset: () => void 
}) {
  return (
    <div className="p-6 text-center">
      <div className="mb-4">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-gray-900">
          Proses Pengembalian Bermasalah
        </h3>
        <p className="text-gray-600 mt-1">
          {error.message || 'Terjadi kesalahan tidak terduga'}
        </p>
      </div>
      
      <div className="flex gap-2 justify-center">
        <Button onClick={reset} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Coba Lagi
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.history.back()}
        >
          Kembali
        </Button>
      </div>
    </div>
  )
}