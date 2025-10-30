/**
 * useProductFormStrategy Hook - Strategy Pattern Implementation
 * Centralizes strategy initialization and management for dynamic form rendering
 */

import { useState, useCallback } from 'react'
import type { ClientCategory } from '../types'
import type { CategoryFormStrategy, CategoryFormData } from '../lib/strategies/CategoryFormStrategy'
import type { CreateProductSizeRequest } from '../types'
import { FormStrategyFactory } from '../lib/strategies/StrategyFactory'

export interface UseProductFormStrategyProps {
  categories: ClientCategory[]
  product?: any // ClientProduct
}

export function useProductFormStrategy({ categories, product }: UseProductFormStrategyProps) {
  // Strategy state
  const [currentStrategy, setCurrentStrategy] = useState<CategoryFormStrategy | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<ClientCategory | null>(null)
  const [strategyLoading, setStrategyLoading] = useState<boolean>(false)
  const [strategyError, setStrategyError] = useState<Error | null>(null)

  // Initialize strategy when category changes
  const initializeStrategy = useCallback(
    async (categoryId: string) => {
      const category = categories.find((cat) => cat.id === categoryId)
      if (!category) {
        return
      }

      // Set loading state
      setStrategyLoading(true)
      setStrategyError(null)

      try {
        // Initialize strategy
        const strategy = FormStrategyFactory.createWithContext(category.type, {
          categoryId: category.id,
          categoryName: category.name,
          isEditMode: !!product,
          existingData: product?.sizes || [],
        })

        setCurrentStrategy(strategy)
        setSelectedCategory(category)

        return strategy
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error))
        setStrategyError(errorObj)
        throw errorObj
      } finally {
        setStrategyLoading(false)
      }
    },
    [categories, product],
  )

  // Transform form data to product sizes
  const transformFormDataToSizes = useCallback(
    (categoryFormData: CategoryFormData): CreateProductSizeRequest[] => {
      if (!currentStrategy) {
        return []
      }

      try {
        return currentStrategy.transformToProductSizes(categoryFormData)
      } catch (error) {
        console.error('Failed to transform form data to sizes:', error)
        return []
      }
    },
    [currentStrategy],
  )

  // Get default form data for strategy
  const getStrategyDefaultValues = useCallback((): CategoryFormData => {
    if (!currentStrategy) {
      return { categoryId: '' }
    }

    return currentStrategy.getDefaultValues()
  }, [currentStrategy])

  // Calculate total quantity from form data
  const calculateTotalQuantity = useCallback(
    (categoryFormData: CategoryFormData): number => {
      if (!currentStrategy) {
        return 0
      }

      try {
        const sizes = currentStrategy.transformToProductSizes(categoryFormData)
        return sizes.reduce((sum, size) => sum + size.quantity, 0)
      } catch (error) {
        console.error('Failed to calculate total quantity:', error)
        return 0
      }
    },
    [currentStrategy],
  )

  return {
    // Strategy state
    currentStrategy,
    selectedCategory,
    strategyLoading,
    strategyError,

    // Strategy actions
    initializeStrategy,
    transformFormDataToSizes,
    getStrategyDefaultValues,
    calculateTotalQuantity,

    // Computed states
    hasStrategy: !!currentStrategy,
    isStrategyReady: !strategyLoading && !strategyError && !!currentStrategy,
  }
}