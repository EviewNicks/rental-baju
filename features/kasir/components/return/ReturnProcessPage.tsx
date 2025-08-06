'use client'

import React, { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle, AlertCircle, Clock, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ItemConditionForm } from './ItemConditionForm'
import { PenaltyDisplay } from './PenaltyDisplay'
import { ReturnConfirmation } from './ReturnConfirmation'
import { useReturnProcess } from '../../hooks/useReturnProcess'
import { kasirApi } from '../../api'

interface ReturnProcessPageProps {
  onClose?: () => void
  initialTransactionId?: string
}

export function ReturnProcessPage({ onClose, initialTransactionId }: ReturnProcessPageProps) {
  const {
    currentStep,
    transaction,
    itemConditions,
    penaltyCalculation,
    isProcessing,
    error,
    setCurrentStep,
    setTransaction,
    setItemConditions,
    processReturn,
    resetProcess
  } = useReturnProcess()

  // Auto-load transaction if initialTransactionId provided (simplified workflow)
  const { data: loadedTransaction, isLoading: isLoadingTransaction } = useQuery({
    queryKey: ['transaction-detail', initialTransactionId],
    queryFn: () => kasirApi.getTransactionByCode(initialTransactionId!),
    enabled: !!initialTransactionId && !transaction,
    retry: 1
  })

  // Set loaded transaction automatically (with type validation)
  useEffect(() => {
    if (loadedTransaction && !transaction) {
      // Ensure transaction has required items array for return processing
      if (loadedTransaction.items) {
        setTransaction(loadedTransaction as any) // Safe cast - items verified
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
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    { 
      id: 2, 
      title: 'Hitung Penalty', 
      description: 'Review penalty dan denda',
      icon: AlertCircle,
      color: 'bg-orange-100 text-orange-800 border-orange-200'
    },
    { 
      id: 3, 
      title: 'Konfirmasi', 
      description: 'Konfirmasi pengembalian',
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800 border-green-200'
    }
  ]

  const currentStepConfig = steps.find(step => step.id === currentStep)
  const progressPercentage = (currentStep / steps.length) * 100

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else if (onClose) {
      onClose()
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return !!transaction
      case 2:
        return transaction?.items?.every(item => 
          itemConditions[item.id]?.kondisiAkhir && 
          itemConditions[item.id]?.jumlahKembali !== undefined
        ) || false
      case 3:
        return !!penaltyCalculation
      default:
        return false
    }
  }

  const handleProcessComplete = () => {
    resetProcess()
    if (onClose) {
      onClose()
    }
  }

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
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold mb-2 transition-all duration-200
                        ${isCompleted 
                          ? 'bg-green-500 text-white shadow-lg' 
                          : isCurrent 
                            ? 'bg-gold-500 text-black shadow-lg scale-110' 
                            : 'bg-neutral-200 text-neutral-500'
                        }
                      `}>
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <step.icon className="h-5 w-5" />
                        )}
                      </div>
                      
                      {/* Step Info */}
                      <div className="text-center">
                        <div className={`text-xs font-medium mb-1 ${
                          isCompleted || isCurrent ? 'text-neutral-900' : 'text-neutral-500'
                        }`}>
                          {step.title}
                        </div>
                        <div className="text-xs text-neutral-500 leading-tight">
                          {step.description}
                        </div>
                      </div>

                      {/* Connection Line */}
                      {index < steps.length - 1 && (
                        <div className={`
                          hidden md:block absolute top-5 left-full w-full h-0.5 -translate-y-0.5 transition-colors duration-200
                          ${isCompleted ? 'bg-green-300' : 'bg-neutral-200'}
                        `} />
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
            {/* Loading State */}
            {isLoadingTransaction && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span>Memuat data transaksi...</span>
                </div>
              </div>
            )}

            {/* No Transaction State */}
            {!isLoadingTransaction && !transaction && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Data transaksi tidak ditemukan atau belum dimuat. 
                  Pastikan transaksi valid dan dapat dikembalikan.
                </AlertDescription>
              </Alert>
            )}

            {currentStep === 1 && transaction && (
              <ItemConditionForm
                transaction={transaction}
                itemConditions={itemConditions}
                onConditionsChange={setItemConditions}
                onContinue={handleNext}
                isLoading={isProcessing}
              />
            )}

            {currentStep === 2 && transaction && (
              <PenaltyDisplay
                transaction={transaction}
                itemConditions={itemConditions}
                onPenaltyCalculated={() => {
                  // Penalty calculation will be handled by the component
                }}
                onContinue={handleNext}
              />
            )}

            {currentStep === 3 && transaction && (
              <ReturnConfirmation
                transaction={transaction}
                itemConditions={itemConditions}
                penaltyCalculation={penaltyCalculation}
                onProcess={processReturn}
                onComplete={handleProcessComplete}
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
              {currentStep === 3 ? 'Lanjut ke Konfirmasi' : 'Lanjutkan'}
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