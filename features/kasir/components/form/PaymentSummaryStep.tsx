'use client'

import { useEffect, useState, useCallback } from 'react'
import type { TransactionFormData } from '../../types'
import { DateCalculator } from '../../lib/utils/dateCalculator'
import { PaymentBreakdownSection, DiscountSection, PaymentMethodSection, OrderSummarySection, RentalDurationSection, NotesSection } from './PaymentSummary'

interface PaymentSummaryStepProps {
  formData: TransactionFormData
  onUpdateFormData: (updates: Partial<TransactionFormData>) => void
  onSubmit: () => Promise<boolean>
  onPrev: () => void
  isSubmitting: boolean
}

export function PaymentSummaryStep({
  formData,
  onUpdateFormData,
  onSubmit,
  onPrev,
  isSubmitting,
}: PaymentSummaryStepProps) {
  // ✅ FIX: Add local submission state to prevent multiple API calls
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false)

  // Use calculated total instead of passed totalAmount
  const finalTotal = 0 // Will be calculated in child components

  // Handle duration change with automatic return date calculation
  const handleDurationChange = useCallback(
    (newDuration: 4 | 7) => {
      const returnDate = DateCalculator.calculateReturnDate(formData.pickupDate, newDuration)
      
      onUpdateFormData({
        duration: newDuration,
        returnDate: returnDate,
      })
    },
    [formData.pickupDate, onUpdateFormData],
  )

  useEffect(() => {
    // Auto-calculate return date based on pickup date and selected duration
    if (formData.pickupDate && formData.duration) {
      const returnDate = DateCalculator.calculateReturnDate(formData.pickupDate, formData.duration)
      
      if (returnDate !== formData.returnDate) {
        onUpdateFormData({
          returnDate: returnDate,
        })
      }
    }
  }, [formData.pickupDate, formData.duration, formData.returnDate, onUpdateFormData])

  // Auto-calculate payment status when payment amount or total changes
  useEffect(() => {
    if (formData.paymentAmount > 0) {
      // finalTotal will be calculated in PaymentMethodSection
      // This effect is kept for backward compatibility
      const paymentStatus = formData.paymentAmount >= (finalTotal || 0) ? 'paid' : 'unpaid'
      if (formData.paymentStatus !== paymentStatus) {
        onUpdateFormData({ paymentStatus })
      }
    }
  }, [formData.paymentAmount, finalTotal, formData.paymentStatus, onUpdateFormData])

  const handleSubmit = useCallback(async (): Promise<boolean> => {
    // ✅ FIX: Enhanced multiple submission prevention with double guard
    if (isSubmitting || isSubmittingLocal) {
      console.warn('[PaymentSummaryStep] Submission blocked - already in progress', {
        isSubmitting,
        isSubmittingLocal,
        timestamp: new Date().toISOString(),
      })
      return false
    }

    // ✅ FIX: Set local submission lock immediately
    setIsSubmittingLocal(true)

    try {
      // Client-side validation before submit
      if (formData.discountType && (!formData.discountValue || formData.discountValue === 0)) {
        // Auto-reset discount if type is selected but value is empty/zero
        onUpdateFormData({
          discountType: null,
          discountValue: null,
        })
        // Wait for next render cycle, then submit
        await new Promise(resolve => setTimeout(resolve, 0))
        const success = await onSubmit()
        return success
      }

      const success = await onSubmit()
      return success
    } catch (error) {
      console.error('[PaymentSummaryStep] Submission error:', error)
      return false
    } finally {
      // ✅ FIX: Always release local submission lock
      setIsSubmittingLocal(false)
    }
  }, [isSubmitting, isSubmittingLocal, formData.discountType, formData.discountValue, onUpdateFormData, onSubmit])

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="payment-summary-layout">
      {/* Order Summary */}
      <OrderSummarySection 
        customer={formData.customer || null}
        products={formData.products}
        duration={formData.duration || 4}
        discountType={formData.discountType}
        discountValue={formData.discountValue}
      />

      {/* Rental Duration & Dates */}
      <RentalDurationSection 
        duration={formData.duration || 4}
        pickupDate={formData.pickupDate}
        returnDate={formData.returnDate}
        onDurationChange={handleDurationChange}
        onPickupDateChange={(date) => onUpdateFormData({ pickupDate: date })}
      />

      {/* Discount Section */}
      <DiscountSection 
        formData={formData}
        onUpdateFormData={onUpdateFormData}
      />

      {/* Payment Method Section */}
      <PaymentMethodSection 
        formData={formData}
        onUpdateFormData={onUpdateFormData}
      />

      {/* Notes */}
      <NotesSection 
        notes={formData.notes || ''}
        onNotesChange={(notes) => onUpdateFormData({ notes })}
      />

      {/* Total Breakdown & Submit */}
      <PaymentBreakdownSection 
        formData={formData}
        onPrev={onPrev}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting || isSubmittingLocal}
      />
    </div>
  )
}
