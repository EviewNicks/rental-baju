'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { TransactionFormData } from '../types/transaction-form'

const STORAGE_KEY = 'transaction-form-draft'
const STORAGE_VERSION = '1.0'

// Safe storage operations with error handling
class SafeStorage {
  private static isAvailable(): boolean {
    try {
      const test = '__storage_test__'
      sessionStorage.setItem(test, test)
      sessionStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  static save(key: string, data: unknown): boolean {
    if (!this.isAvailable()) {
      return false
    }

    try {
      const payload = {
        version: STORAGE_VERSION,
        timestamp: Date.now(),
        data,
      }
      sessionStorage.setItem(key, JSON.stringify(payload))
      return true
    } catch {
      return false
    }
  }

  static load<T>(key: string): T | null {
    try {
      const stored = sessionStorage.getItem(key)
      if (!stored) {
        return null
      }

      const payload = JSON.parse(stored)

      // Version check for future compatibility
      if (payload.version !== STORAGE_VERSION) {
        this.remove(key)
        return null
      }

      // Age check (clear data older than 24 hours)
      const age = Date.now() - payload.timestamp
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours
      if (age > maxAge) {
        this.remove(key)
        return null
      }

      return payload.data
    } catch {
      this.remove(key) // Clear corrupted data
      return null
    }
  }

  static remove(key: string): boolean {
    if (!this.isAvailable()) {
      return false
    }

    try {
      sessionStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  }
}

// Validation function for loaded data
function validateFormData(data: unknown): TransactionFormData | null {
  try {
    // Basic structure validation
    if (!data || typeof data !== 'object') {
      return null
    }

    // Cast to record type for property access
    const typedData = data as Record<string, unknown>

    // Validate required fields exist
    const requiredFields = [
      'products',
      'pickupDate',
      'returnDate',
      'paymentMethod',
      'paymentAmount',
      'paymentStatus',
    ]
    for (const field of requiredFields) {
      if (!(field in typedData)) {
        return null
      }
    }

    // Validate products array
    if (!Array.isArray(typedData.products)) {
      return null
    }

    // Validate product structure
    for (const product of typedData.products) {
      if (!product.product?.id || !product.quantity || product.quantity <= 0) {
        return null
      }
    }

    // Validate customer data if present
    const customer = typedData.customer as { id?: string; nama?: string; name?: string } | undefined
    if (customer && (!customer.id || (!customer.nama && !customer.name))) {
      return null
    }

    // Validate dates format
    const pickupDate = typedData.pickupDate as string
    if (pickupDate && !/^\d{4}-\d{2}-\d{2}$/.test(pickupDate)) {
      return null
    }

    const returnDate = typedData.returnDate as string
    if (returnDate && !/^\d{4}-\d{2}-\d{2}$/.test(returnDate)) {
      return null
    }

    return data as TransactionFormData
  } catch {
    return null
  }
}

// Hook for transaction form persistence
export function useTransactionFormPersistence() {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedRef = useRef<string>('')

  // Load persisted form data
  const loadFormData = useCallback((): TransactionFormData | null => {
    const storedData = SafeStorage.load<TransactionFormData>(STORAGE_KEY)
    if (!storedData) {
      return null
    }

    const validatedData = validateFormData(storedData)
    if (!validatedData) {
      SafeStorage.remove(STORAGE_KEY)
      return null
    }

    return validatedData
  }, [])

  // Save form data with debouncing
  const saveFormData = useCallback((formData: TransactionFormData, currentStep: number) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Create serializable version of form data
    const dataToSave = {
      ...formData,
      currentStep,
      // Ensure dates are strings
      pickupDate: formData.pickupDate || '',
      returnDate: formData.returnDate || '',
    }

    // Debounce saving to avoid excessive storage operations
    debounceTimerRef.current = setTimeout(() => {
      const dataString = JSON.stringify(dataToSave)

      // Only save if data has changed
      if (dataString !== lastSavedRef.current) {
        const success = SafeStorage.save(STORAGE_KEY, dataToSave)
        if (success) {
          lastSavedRef.current = dataString
        }
      }
    }, 1000) // 1 second debounce
  }, [])

  // Clear persisted data
  const clearFormData = useCallback(() => {
    SafeStorage.remove(STORAGE_KEY)
    lastSavedRef.current = ''

    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return {
    loadFormData,
    saveFormData,
    clearFormData,
  }
}

// Utility function to check if there's persisted data (for components to show restoration messages)
export function hasPersistedData(): boolean {
  const data = SafeStorage.load(STORAGE_KEY)
  return data !== null && validateFormData(data) !== null
}
