'use client'

import React from 'react'
import { AlertCircle, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { KasirApiError } from '../../api'

interface TransactionErrorModalProps {
  isOpen: boolean
  onClose: () => void
  error: KasirApiError | null
}

/**
 * Transaction Error Modal
 *
 * Displays detailed error information when transaction creation fails.
 * Shows error message, error code, and additional details if available.
 */
export function TransactionErrorModal({ isOpen, onClose, error }: TransactionErrorModalProps) {
  if (!error) return null

  // ✅ NEW: Determine error severity from category
  const category = error.category || 'CRITICAL'
  const isCritical = category === 'CRITICAL'
  const isWarning = category === 'WARNING'

  // Parse error details to extract useful information
  const parseErrorDetails = () => {
    if (!error.details) return null

    // Check if details contain conflicting transactions
    if (typeof error.details === 'object') {
      return error.details
    }

    return null
  }

  const details = parseErrorDetails()

  // Extract conflicting transaction codes from error message
  const extractConflictingTransactions = (message: string): string[] => {
    const match = message.match(/Konflik dengan transaksi:\s*([^;]+)/g)
    if (!match) return []

    const codes = new Set<string>()
    match.forEach((m) => {
      const txnCodes = m.replace('Konflik dengan transaksi:', '').trim()
      txnCodes.split(',').forEach((code) => {
        const trimmed = code.trim()
        if (trimmed) codes.add(trimmed)
      })
    })

    return Array.from(codes)
  }

  const conflictingTransactions = extractConflictingTransactions(error.message)

  // Split error message by semicolon to show multiple product errors
  const errorMessages = error.message
    .split(';')
    .map((msg) => msg.trim())
    .filter(Boolean)

  // ✅ NEW: Get suggested actions from backend or use defaults
  const suggestedActions =
    error.actions && error.actions.length > 0
      ? error.actions
      : [
          'Pilih tanggal rental yang berbeda',
          'Kurangi jumlah produk yang dipesan',
          'Pilih ukuran produk yang lain',
          'Periksa ketersediaan produk di dashboard',
        ]

  // ✅ NEW: Color scheme based on category
  const colorScheme = {
    icon: isCritical ? 'bg-red-100' : isWarning ? 'bg-yellow-100' : 'bg-blue-100',
    iconColor: isCritical ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-blue-600',
    title: isCritical ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-blue-600',
    alert: isCritical
      ? 'border-red-200 bg-red-50'
      : isWarning
        ? 'border-yellow-200 bg-yellow-50'
        : 'border-blue-200 bg-blue-50',
    alertText: isCritical ? 'text-red-800' : isWarning ? 'text-yellow-800' : 'text-blue-800',
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`rounded-full ${colorScheme.icon} p-2`}>
              <AlertCircle className={`h-6 w-6 ${colorScheme.iconColor}`} />
            </div>
            <div>
              <DialogTitle className={`text-xl font-bold ${colorScheme.title}`}>
                {isCritical
                  ? 'Transaksi Gagal Dibuat'
                  : isWarning
                    ? 'Peringatan Transaksi'
                    : 'Informasi Transaksi'}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-1">
                {isCritical
                  ? 'Terjadi kesalahan saat memproses transaksi'
                  : isWarning
                    ? 'Transaksi memerlukan perhatian Anda'
                    : 'Informasi tentang pemrosesan transaksi'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error Messages */}
          <div className="space-y-3">
            {errorMessages.map((msg, index) => (
              <Alert
                key={index}
                variant={isCritical ? 'destructive' : 'default'}
                className={colorScheme.alert}
              >
                <AlertDescription className={`text-sm ${colorScheme.alertText}`}>
                  <div className="font-medium mb-1">
                    {isCritical ? '❌' : isWarning ? '⚠️' : 'ℹ️'}{' '}
                    {index === 0
                      ? isCritical
                        ? 'Error:'
                        : isWarning
                          ? 'Peringatan:'
                          : 'Info:'
                      : `${isCritical ? 'Error' : isWarning ? 'Peringatan' : 'Info'} ${index + 1}:`}
                  </div>
                  <div className="whitespace-pre-wrap">{msg}</div>
                </AlertDescription>
              </Alert>
            ))}
          </div>

          {/* Conflicting Transactions */}
          {conflictingTransactions.length > 0 && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <div className="font-semibold text-orange-800 mb-2 text-sm">
                📋 Transaksi yang Konflik:
              </div>
              <div className="flex flex-wrap gap-2">
                {conflictingTransactions.map((code, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1 text-sm font-medium text-orange-700 border border-orange-300"
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Details */}
          {details && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="font-semibold text-blue-800 mb-2 text-sm">ℹ️ Detail Tambahan:</div>
              <pre className="text-xs text-blue-700 whitespace-pre-wrap overflow-auto max-h-40">
                {JSON.stringify(details, null, 2)}
              </pre>
            </div>
          )}

          {/* Validation Errors */}
          {error.validationErrors && error.validationErrors.length > 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="font-semibold text-yellow-800 mb-2 text-sm">⚠️ Validasi Error:</div>
              <ul className="space-y-1">
                {error.validationErrors.map((err, index) => (
                  <li key={index} className="text-sm text-yellow-700">
                    • <span className="font-medium">{err.field}:</span> {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Helpful Actions - Use backend actions if available */}
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
            <div className="font-semibold text-indigo-800 mb-2 text-sm">💡 Saran Tindakan:</div>
            <ul className="space-y-1 text-sm text-indigo-700">
              {suggestedActions.map((action, index) => (
                <li key={index}>• {action}</li>
              ))}
            </ul>
          </div>

          {/* Category Badge - Show error severity */}
          {error.category && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Tingkat Kesalahan:</span>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                  isCritical
                    ? 'bg-red-100 text-red-700'
                    : isWarning
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-blue-100 text-blue-700'
                }`}
              >
                {category}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full sm:w-auto" variant="default">
            <X className="h-4 w-4 mr-2" />
            Tutup & Perbaiki Transaksi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
