'use client'

import React, { useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UnifiedConditionForm } from './UnifiedConditionForm'
import { EnhancedPenaltyDisplay } from './EnhancedPenaltyDisplay'
import { ReturnConfirmation } from './ReturnConfirmation'
import { useMultiConditionReturn } from '../../hooks/useMultiConditionReturn'
import { kasirApi } from '../../api'
import type { TransaksiDetail } from '../../types'
import { kasirLogger } from '../../lib/logger'

interface ReturnProcessPageProps {
  onClose?: () => void
  initialTransactionId?: string
  kode?: string
}

export function ReturnProcessPage({ onClose, initialTransactionId, kode }: ReturnProcessPageProps) {
  const router = useRouter()

  // Use kode if provided, otherwise use initialTransactionId
  const transactionId = kode || initialTransactionId

  // Default close handler - navigate back to transaction detail
  const defaultClose = useCallback(() => {
    if (transactionId) {
      router.push(`/dashboard/transaction/${transactionId}`)
    } else {
      router.back()
    }
  }, [router, transactionId])

  const handleClose = onClose || defaultClose
  const {
    currentStep,
    transaction,
    itemConditions,
    penaltyCalculation,
    isProcessing,
    error,
    setCurrentStep,
    setTransaction,
    setItemCondition,
    processEnhancedReturn,
    resetProcess,
    canProceedToNext: canProceedToNextStep,
  } = useMultiConditionReturn()

  // Auto-load transaction if transactionId provided (simplified workflow)
  const { data: loadedTransaction, isLoading: isLoadingTransaction } = useQuery({
    queryKey: ['transaction-detail', transactionId],
    queryFn: () => kasirApi.getTransactionByCode(transactionId!),
    enabled: !!transactionId && !transaction,
    retry: 1,
  })

  // Set loaded transaction automatically (with type validation)
  useEffect(() => {
    if (loadedTransaction && !transaction) {
      kasirLogger.returnProcess.info(
        'transaction loading',
        'Transaction loaded for return process',
        {
          transactionId: loadedTransaction.kode,
          itemCount: loadedTransaction.items?.length || 0,
          hasItems: !!loadedTransaction.items,
          transactionStatus: loadedTransaction.status,
        },
      )

      // Ensure transaction has required items array for return processing
      if (loadedTransaction.items) {
        setTransaction(loadedTransaction as TransaksiDetail) // Safe cast - items verified
      } else {
        kasirLogger.returnProcess.error(
          'transaction loading',
          'Loaded transaction missing items array for return processing',
          {
            transactionId: loadedTransaction.kode,
          },
        )
      }
    }
  }, [loadedTransaction, transaction, setTransaction])

  // Step configuration with icons - Simplified 3-step workflow
  const steps = [
    {
      id: 1,
      title: 'Kondisi Barang',
      description: 'Catat kondisi setiap barang',
      icon: Clock,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      id: 2,
      title: 'Hitung Penalty',
      description: 'Review penalty dan denda',
      icon: AlertCircle,
      color: 'bg-orange-100 text-orange-800 border-orange-200',
    },
    {
      id: 3,
      title: 'Konfirmasi',
      description: 'Konfirmasi pengembalian',
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800 border-green-200',
    },
  ]

  const currentStepConfig = steps.find((step) => step.id === currentStep)
  const progressPercentage = (currentStep / steps.length) * 100

  const handleBack = () => {
    kasirLogger.returnProcess.debug('handleBack', 'User navigating back in return process', {
      currentStep,
      transactionId: transaction?.kode,
      canGoBack: currentStep > 1,
      willClose: currentStep === 1 && !!onClose,
    })

    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      handleClose()
    }
  }

  const handleNext = () => {
    kasirLogger.returnProcess.debug('handleNext', 'User navigating forward in return process', {
      currentStep,
      nextStep: currentStep + 1,
      maxStep: steps.length,
      transactionId: transaction?.kode,
      canProceed: canProceedToNextStep(currentStep),
      isLastStep: currentStep >= steps.length,
    })

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const canProceedToNext = () => {
    return canProceedToNextStep(currentStep)
  }

  const handleProcessComplete = () => {
    resetProcess()
    handleClose()
  }

  // Stable handler for item condition changes - Fix Rules of Hooks
  const handleItemConditionChange = useCallback(
    // eslint-disable-next-line
    (itemId: string, condition: any) => {
      setItemCondition(itemId, condition)
    },
    [setItemCondition],
  )

  return (
    <div className="min-h-screen bg-neutral-100 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header Section with Enhanced Visual Hierarchy */}
        <div className="mb-8">
          {/* Navigation & Title */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="self-start flex items-center gap-2 hover:bg-gold-50 hover:text-gold-700 transition-colors duration-200 rounded-full px-4"
            >
              <ArrowLeft className="h-4 w-4" />
              {currentStep === 1 ? 'Kembali' : 'Sebelumnya'}
            </Button>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {currentStepConfig?.icon && (
                  <div className={`p-2 rounded-lg ${currentStepConfig.color}`}>
                    <currentStepConfig.icon className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
                    Proses Pengembalian Baju
                  </h1>
                  <p className="text-neutral-600 text-sm md:text-base">
                    {currentStepConfig?.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Transaction Info Badge */}
            {transaction && (
              <Badge variant="outline" className="border-gold-200 text-gold-800 bg-gold-50">
                {transaction.kode}
              </Badge>
            )}
          </div>

          {/* Enhanced Progress Section */}
          <Card className="shadow-md border-0 bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6">
              {/* Progress Stats */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-gold-500 text-black font-medium">
                    Langkah {currentStep}
                  </Badge>
                  <span className="text-sm text-neutral-600">dari {steps.length}</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gold-600">
                    {Math.round(progressPercentage)}%
                  </div>
                  <div className="text-xs text-neutral-500">selesai</div>
                </div>
              </div>

              {/* Progress Bar with Gold Accent */}
              <div className="mb-6">
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className="h-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-300 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Enhanced Step Indicator */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {steps.map((step, index) => {
                  const isCompleted = step.id < currentStep
                  const isCurrent = step.id === currentStep

                  return (
                    <div
                      key={step.id}
                      className={`relative flex flex-col items-center p-3 rounded-lg transition-all duration-200 ${
                        isCompleted
                          ? 'bg-green-50 border border-green-200'
                          : isCurrent
                            ? 'bg-gold-50 border border-gold-200 shadow-sm'
                            : 'bg-neutral-50 border border-neutral-200'
                      }`}
                    >
                      {/* Step Circle */}
                      <div
                        className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold mb-2 transition-all duration-200
                        ${
                          isCompleted
                            ? 'bg-green-500 text-white shadow-lg'
                            : isCurrent
                              ? 'bg-gold-500 text-black shadow-lg scale-110'
                              : 'bg-neutral-200 text-neutral-500'
                        }
                      `}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <step.icon className="h-5 w-5" />
                        )}
                      </div>

                      {/* Step Info */}
                      <div className="text-center">
                        <div
                          className={`text-xs font-medium mb-1 ${
                            isCompleted || isCurrent ? 'text-neutral-900' : 'text-neutral-500'
                          }`}
                        >
                          {step.title}
                        </div>
                        <div className="text-xs text-neutral-500 leading-tight">
                          {step.description}
                        </div>
                      </div>

                      {/* Connection Line */}
                      {index < steps.length - 1 && (
                        <div
                          className={`
                          hidden md:block absolute top-5 left-full w-full h-0.5 -translate-y-0.5 transition-colors duration-200
                          ${isCompleted ? 'bg-green-300' : 'bg-neutral-200'}
                        `}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Display with Better Styling */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50 shadow-sm">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong className="font-medium">Terjadi Kesalahan:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Enhanced Step Content */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mb-8">
          <CardHeader className="border-b border-neutral-100 bg-neutral-50/50">
            <CardTitle className="flex items-center gap-3 text-xl">
              {currentStepConfig?.icon && (
                <div className={`p-2 rounded-lg ${currentStepConfig.color}`}>
                  <currentStepConfig.icon className="h-5 w-5" />
                </div>
              )}
              {currentStepConfig?.title}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 md:p-8">
            {isLoadingTransaction && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span>Memuat data transaksi...</span>
                </div>
              </div>
            )}

            {!isLoadingTransaction && !transaction && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Data transaksi tidak ditemukan atau belum dimuat. Pastikan transaksi valid dan
                  dapat dikembalikan.
                </AlertDescription>
              </Alert>
            )}

            {currentStep === 1 && transaction && (
              <div className="space-y-6">
                {transaction.items
                  ?.filter((item) => item.jumlahDiambil > 0 && item.statusKembali !== 'lengkap')
                  .map((item) => (
                    <UnifiedConditionForm
                      key={item.id}
                      item={item}
                      value={itemConditions[item.id] || null}
                      onChange={(condition) => handleItemConditionChange(item.id, condition)}
                      disabled={isProcessing}
                      isLoading={isProcessing}
                    />
                  ))}
              </div>
            )}

            {currentStep === 2 && transaction && (
              <EnhancedPenaltyDisplay
                transaction={transaction}
                itemConditions={itemConditions}
                penaltyCalculation={penaltyCalculation}
                onPenaltyCalculated={(calculation) => {
                  // Handle penalty calculation result
                  console.log('Penalty calculated:', calculation)
                }}
                isCalculating={isProcessing}
              />
            )}

            {currentStep === 3 && transaction && (
              <ReturnConfirmation
                transaction={transaction}
                itemConditions={itemConditions}
                penaltyCalculation={penaltyCalculation}
                onProcess={processEnhancedReturn}
                onComplete={handleProcessComplete}
                onBack={handleBack}
                isLoading={isProcessing}
              />
            )}
          </CardContent>
        </Card>

        {/* Enhanced Navigation with Gold Accents */}
        {currentStep < 3 && (
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isProcessing}
              className="order-2 sm:order-1 hover:bg-neutral-50 border-neutral-300 rounded-lg px-6 py-2.5"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {currentStep === 1 ? 'Batal' : 'Kembali'}
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceedToNext() || isProcessing}
              className="order-1 sm:order-2 bg-gold-500 hover:bg-gold-400 text-black font-semibold rounded-lg px-6 py-2.5 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              {currentStep === 1
                ? 'Lanjut ke Perhitungan Penalty'
                : currentStep === 2
                  ? 'Lanjut ke Konfirmasi'
                  : 'Selesai'}
              {!isProcessing && <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />}
            </Button>
          </div>
        )}

        {/* Loading State Overlay */}
        {isProcessing && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="animate-spin h-5 w-5 border-2 border-gold-500 border-t-transparent rounded-full" />
                <span className="text-neutral-700">Memproses...</span>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
