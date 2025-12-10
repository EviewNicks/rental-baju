'use client'

import { useState, useEffect } from 'react'
import {
  User,
  Check,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Store,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { useKasirManagement } from '../../hooks/useKasirManagement'
import type { KasirInfo, KasirSelectionData } from '../../types'

interface CashierSelectionStepProps {
  selectedKasir: KasirSelectionData
  onSelectKasir: (kasirSelection: KasirSelectionData) => void
  onNext: () => void
  onPrev: () => void
  canProceed: boolean
}

export function CashierSelectionStep({
  selectedKasir,
  onSelectKasir,
  onNext,
  onPrev,
  canProceed,
}: CashierSelectionStepProps) {
  const [isInitialized, setIsInitialized] = useState(false)

  // Fetch available kasirs
  const {
    availableKasirs,
    isLoadingAvailable,
    availableError
  } = useKasirManagement()

  // Auto-assignment effect - select first available kasir as default
  useEffect(() => {
    if (!isInitialized && availableKasirs.length > 0 && !selectedKasir.kasirId) {
      setIsInitialized(true)

      // Select first available kasir as default
      const firstAvailableKasir = availableKasirs[0]
      if (firstAvailableKasir) {
        onSelectKasir({
          kasirId: firstAvailableKasir.id,
          kasirInfo: firstAvailableKasir,
          isAutoAssigned: true,
          assignmentReason: 'Default: Kasir pertama yang tersedia'
        })
      }
    }
  }, [availableKasirs, isInitialized, onSelectKasir, selectedKasir.kasirId])

  const handleSelectKasir = (kasir: KasirInfo) => {
    onSelectKasir({
      kasirId: kasir.id,
      kasirInfo: kasir,
      isAutoAssigned: false,
      assignmentReason: undefined
    })
  }

  const handleNext = () => {
    if (selectedKasir.kasirId && canProceed) {
      onNext()
    }
  }

  const isKasirSelected = !!selectedKasir.kasirId
  const isLoading = isLoadingAvailable
  const error = availableError

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="cashier-selection-layout">
      {/* Header */}
      <div
        className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 space-y-4"
        data-testid="cashier-selection-header"
      >
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Store className="h-5 w-5" />
          Pilih Kasir
        </div>

        {selectedKasir.isAutoAssigned && selectedKasir.assignmentReason && (
          <Alert className="bg-blue-50 border-blue-200" data-testid="auto-assignment-notice">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              {selectedKasir.assignmentReason}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Kasir Selection */}
      <div
        className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6"
        data-testid="cashier-selection-section"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12" data-testid="loading-kasirs">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Memuat daftar kasir...</span>
          </div>
        ) : error ? (
          <Alert variant="destructive" data-testid="kasir-load-error">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Gagal memuat daftar kasir. Silakan refresh halaman atau coba lagi nanti.
            </AlertDescription>
          </Alert>
        ) : availableKasirs.length === 0 ? (
          <div className="text-center py-12" data-testid="no-kasirs-available">
            <Store className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Tidak ada kasir yang tersedia saat ini</p>
            <p className="text-sm text-gray-400 mt-2">
              Silakan tambahkan kasir terlebih dahulu atau hubungi administrator
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableKasirs.map((kasir) => (
                <Card
                  key={kasir.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedKasir.kasirId === kasir.id
                      ? 'ring-2 ring-blue-500 bg-blue-50/50'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => handleSelectKasir(kasir)}
                  data-testid={`kasir-card-${kasir.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {kasir.nama}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={kasir.isActive ? 'default' : 'secondary'}
                              className={`text-xs ${
                                kasir.isActive
                                  ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                              data-testid={`kasir-status-${kasir.id}`}
                            >
                              {kasir.isActive ? 'Aktif' : 'Non-aktif'}
                            </Badge>
                            {!kasir.isActive && (
                              <span className="text-xs text-orange-600" data-testid={`kasir-inactive-warning-${kasir.id}`}>
                                Tidak dapat dipilih
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {selectedKasir.kasirId === kasir.id && (
                        <div className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedKasir.kasirInfo && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200" data-testid="selected-kasir-summary">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
                  <Check className="h-4 w-4" />
                  Kasir Terpilih
                </div>
                <div className="mt-2 text-blue-800">
                  <strong>{selectedKasir.kasirInfo.nama}</strong>
                  {selectedKasir.kasirInfo.isActive && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      Aktif
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4" data-testid="cashier-selection-navigation">
        <Button
          variant="outline"
          onClick={onPrev}
          className="flex items-center gap-2"
          data-testid="kasir-prev-button"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>

        <Button
          onClick={handleNext}
          disabled={!isKasirSelected || !canProceed}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          data-testid="kasir-next-button"
        >
          Lanjut ke Pembayaran
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}