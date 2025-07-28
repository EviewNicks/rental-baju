'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { TransactionFormData } from '../types/transaction-form'
import { logger } from '@/lib/client-logger'

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
      logger.warn('SessionStorage not available, skipping save', { key }, 'SafeStorage')
      return false
    }

    try {
      const payload = {
        version: STORAGE_VERSION,
        timestamp: Date.now(),
        data
      }
      sessionStorage.setItem(key, JSON.stringify(payload))
      logger.debug('Data saved to sessionStorage', { key, dataKeys: Object.keys(data) }, 'SafeStorage')
      return true
    } catch (error) {
      logger.error('Failed to save to sessionStorage', { key, error: error instanceof Error ? error.message : 'Unknown error' }, 'SafeStorage')
      return false
    }
  }

  static load<T>(key: string): T | null {
    if (!this.isAvailable()) {
      logger.warn('SessionStorage not available, skipping load', { key }, 'SafeStorage')
      return null
    }

    try {
      const stored = sessionStorage.getItem(key)
      if (!stored) {
        logger.debug('No data found in sessionStorage', { key }, 'SafeStorage')
        return null
      }

      const payload = JSON.parse(stored)
      
      // Version check for future compatibility
      if (payload.version !== STORAGE_VERSION) {
        logger.warn('Storage version mismatch, clearing old data', { 
          key, 
          storedVersion: payload.version, 
          currentVersion: STORAGE_VERSION 
        }, 'SafeStorage')
        this.remove(key)
        return null
      }

      // Age check (clear data older than 24 hours)
      const age = Date.now() - payload.timestamp
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours
      if (age > maxAge) {
        logger.info('Stored data expired, clearing', { key, age: Math.round(age / 1000 / 60) + ' minutes' }, 'SafeStorage')
        this.remove(key)
        return null
      }

      logger.debug('Data loaded from sessionStorage', { key, age: Math.round(age / 1000) + 's' }, 'SafeStorage')
      return payload.data
    } catch (error) {
      logger.error('Failed to load from sessionStorage', { key, error: error instanceof Error ? error.message : 'Unknown error' }, 'SafeStorage')
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
      logger.debug('Data removed from sessionStorage', { key }, 'SafeStorage')
      return true
    } catch (error) {
      logger.error('Failed to remove from sessionStorage', { key, error: error instanceof Error ? error.message : 'Unknown error' }, 'SafeStorage')
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

    // Validate required fields exist
    const requiredFields = ['products', 'pickupDate', 'returnDate', 'paymentMethod', 'paymentAmount', 'paymentStatus']
    for (const field of requiredFields) {
      if (!(field in data)) {
        logger.warn('Missing required field in stored data', { field }, 'validateFormData')
        return null
      }
    }

    // Validate products array
    if (!Array.isArray(data.products)) {
      logger.warn('Products field is not an array', { productsType: typeof data.products }, 'validateFormData')
      return null
    }

    // Validate product structure
    for (const product of data.products) {
      if (!product.product?.id || !product.quantity || product.quantity <= 0) {
        logger.warn('Invalid product structure in stored data', { product }, 'validateFormData')
        return null
      }
    }

    // Validate customer data if present
    if (data.customer && (!data.customer.id || !data.customer.nama)) {
      logger.warn('Invalid customer structure in stored data', { customer: data.customer }, 'validateFormData')
      return null
    }

    // Validate dates format
    if (data.pickupDate && !/^\d{4}-\d{2}-\d{2}$/.test(data.pickupDate)) {
      logger.warn('Invalid pickup date format', { pickupDate: data.pickupDate }, 'validateFormData')
      return null
    }

    if (data.returnDate && !/^\d{4}-\d{2}-\d{2}$/.test(data.returnDate)) {
      logger.warn('Invalid return date format', { returnDate: data.returnDate }, 'validateFormData')
      return null
    }

    logger.info('Form data validation passed', { 
      productsCount: data.products.length,
      hasCustomer: !!data.customer,
      hasDates: !!(data.pickupDate && data.returnDate)
    }, 'validateFormData')

    return data as TransactionFormData
  } catch (error) {
    logger.error('Error validating form data', { error: error instanceof Error ? error.message : 'Unknown error' }, 'validateFormData')
    return null
  }
}

// Hook for transaction form persistence
export function useTransactionFormPersistence() {
  const debounceTimerRef = useRef<NodeJS.Timeout>()
  const lastSavedRef = useRef<string>('')

  // Load persisted form data
  const loadFormData = useCallback((): TransactionFormData | null => {
    logger.info('🔄 Loading persisted form data...', {}, 'useTransactionFormPersistence')
    
    const storedData = SafeStorage.load<TransactionFormData>(STORAGE_KEY)
    if (!storedData) {
      logger.info('💭 No persisted data found', {}, 'useTransactionFormPersistence')
      return null
    }

    const validatedData = validateFormData(storedData)
    if (!validatedData) {
      logger.warn('⚠️ Stored data failed validation, clearing', {}, 'useTransactionFormPersistence')
      SafeStorage.remove(STORAGE_KEY)
      return null
    }

    logger.info('✅ Form data restored successfully', {
      productsCount: validatedData.products.length,
      hasCustomer: !!validatedData.customer,
      currentStep: validatedData.currentStep || 1
    }, 'useTransactionFormPersistence')

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
      returnDate: formData.returnDate || ''
    }

    // Debounce saving to avoid excessive storage operations
    debounceTimerRef.current = setTimeout(() => {
      const dataString = JSON.stringify(dataToSave)
      
      // Only save if data has changed
      if (dataString !== lastSavedRef.current) {
        const success = SafeStorage.save(STORAGE_KEY, dataToSave)
        if (success) {
          lastSavedRef.current = dataString
          logger.debug('💾 Form data auto-saved', {
            productsCount: dataToSave.products.length,
            currentStep: dataToSave.currentStep,
            hasCustomer: !!dataToSave.customer
          }, 'useTransactionFormPersistence')
        }
      }
    }, 1000) // 1 second debounce
  }, [])

  // Clear persisted data
  const clearFormData = useCallback((reason: 'back-button' | 'form-reset' | 'successful-submission' = 'form-reset') => {
    logger.info('🗑️ Clearing persisted form data', { reason }, 'useTransactionFormPersistence')
    
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
    clearFormData
  }
}

// Utility function to check if there's persisted data (for components to show restoration messages)
export function hasPersistedData(): boolean {
  const data = SafeStorage.load(STORAGE_KEY)
  return data !== null && validateFormData(data) !== null
}