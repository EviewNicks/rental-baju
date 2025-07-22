'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Wifi, Server, Database } from 'lucide-react'

interface ErrorFallbackProps {
  error?: Error | string | null
  onRetry?: () => void
  onReset?: () => void
  type?: 'network' | 'api' | 'database' | 'general'
  title?: string
  description?: string
  showDetails?: boolean
}

export function ErrorFallback({
  error,
  onRetry,
  onReset,
  type = 'general',
  title,
  description,
  showDetails = false,
}: ErrorFallbackProps) {
  const errorMessage = typeof error === 'string' ? error : error?.message || 'Terjadi kesalahan tidak terduga'

  const getErrorConfig = () => {
    switch (type) {
      case 'network':
        return {
          icon: <Wifi className="h-12 w-12 text-orange-500" />,
          title: title || 'Koneksi Bermasalah',
          description: description || 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
          actionText: 'Coba Koneksi Lagi',
        }
      case 'api':
        return {
          icon: <Server className="h-12 w-12 text-red-500" />,
          title: title || 'Server Error',
          description: description || 'Terjadi kesalahan pada server. Tim teknis sedang menangani masalah ini.',
          actionText: 'Coba Lagi',
        }
      case 'database':
        return {
          icon: <Database className="h-12 w-12 text-purple-500" />,
          title: title || 'Database Error',
          description: description || 'Tidak dapat mengakses data. Mohon coba beberapa saat lagi.',
          actionText: 'Muat Ulang Data',
        }
      default:
        return {
          icon: <AlertTriangle className="h-12 w-12 text-yellow-500" />,
          title: title || 'Terjadi Kesalahan',
          description: description || 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi.',
          actionText: 'Coba Lagi',
        }
    }
  }

  const config = getErrorConfig()

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            {config.icon}
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            {config.title}
          </h2>
          
          <p className="text-gray-600 mb-6">
            {config.description}
          </p>

          {/* Error Details */}
          {showDetails && errorMessage && (
            <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-700 font-mono">
                {errorMessage}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onRetry && (
              <Button
                onClick={onRetry}
                className="flex items-center gap-2"
                variant="default"
              >
                <RefreshCw className="h-4 w-4" />
                {config.actionText}
              </Button>
            )}
            
            {onReset && (
              <Button
                onClick={onReset}
                variant="outline"
                className="flex items-center gap-2"
              >
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Specialized error components for different scenarios
export function NetworkErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorFallback
      type="network"
      onRetry={onRetry}
    />
  )
}

export function APIErrorFallback({ error, onRetry }: { error?: Error | string; onRetry?: () => void }) {
  return (
    <ErrorFallback
      type="api"
      error={error}
      onRetry={onRetry}
      showDetails={process.env.NODE_ENV === 'development'}
    />
  )
}

export function DatabaseErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorFallback
      type="database"
      onRetry={onRetry}
    />
  )
}

// Simple inline error for smaller components
export function InlineError({ 
  message, 
  onRetry, 
  compact = false 
}: { 
  message: string
  onRetry?: () => void
  compact?: boolean 
}) {
  if (compact) {
    return (
      <div className="flex items-center justify-center p-4 text-center">
        <div className="text-red-600">
          <AlertTriangle className="h-5 w-5 mx-auto mb-2" />
          <p className="text-sm">{message}</p>
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry} className="mt-2">
              Retry
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="border border-red-200 bg-red-50 rounded-lg p-4 my-4">
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-red-700">{message}</p>
          {onRetry && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onRetry} 
              className="mt-2 border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Coba Lagi
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}