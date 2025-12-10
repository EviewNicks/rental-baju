/**
 * Strategy Factory
 *
 * Factory untuk membuat CategoryFormStrategy berdasarkan category type.
 * Menyediakan fallback strategy dan error handling.
 */

import type {
  CategoryFormStrategy,
  CategoryType,
  StrategyRegistry,
  StrategyFactoryConfig,
  CategoryFormData
} from './CategoryFormStrategy'
import {
  InvalidCategoryTypeError,
  StrategyError
} from './CategoryFormStrategy'
import { AccessoriesAgeBasedStrategy } from './AccessoriesAgeBasedStrategy'
import { AccessoriesUniversalStrategy } from './AccessoriesUniversalStrategy'
import { ClothingStrategy } from './ClothingStrategy'
import { UniversalFallbackStrategy } from './UniversalFallbackStrategy'

/**
 * Default strategy registry
 */
const DEFAULT_STRATEGIES: StrategyRegistry = {
  'accessories_age_based': AccessoriesAgeBasedStrategy,
  'accessories_universal': AccessoriesUniversalStrategy,
  'clothing': ClothingStrategy,
}

/**
 * Factory untuk Category Form Strategy
 */
export class FormStrategyFactory {
  private static config: StrategyFactoryConfig = {
    defaultStrategy: 'universal_fallback', // Use universal fallback as default
    customStrategies: DEFAULT_STRATEGIES,
    enableFallback: true
  }

  /**
   * Create strategy instance berdasarkan category type
   */
  static create(categoryType: CategoryType, context?: {
    categoryId?: string
    categoryName?: string
    isEditMode?: boolean
    existingData?: unknown[]
  }): CategoryFormStrategy {
    try {
      // Validate category type
      if (!this.isValidCategoryType(categoryType)) {
        if (this.config.enableFallback) {
          console.warn(`Unknown category type "${categoryType}", falling back to default strategy`)
          return this.createDefaultStrategy(context)
        } else {
          throw new InvalidCategoryTypeError(categoryType)
        }
      }

      // Get strategy class dari registry
      const StrategyClass = this.getStrategyClass(categoryType)

      if (!StrategyClass) {
        if (this.config.enableFallback) {
          console.warn(`No strategy found for category type "${categoryType}", falling back to default`)
          return this.createDefaultStrategy(context)
        } else {
          throw new Error(`No strategy registered for category type: ${categoryType}`)
        }
      }

      // Create dan return strategy instance
      return new StrategyClass()

    } catch (error) {
      if (error instanceof StrategyError) {
        throw error
      }

      // Wrap unexpected errors
      throw new StrategyError(
        `Failed to create strategy for category type "${categoryType}": ${error instanceof Error ? error.message : 'Unknown error'}`,
        categoryType,
        undefined,
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Create strategy dengan context information
   */
  static createWithContext(
    categoryType: CategoryType,
    context: {
      categoryId?: string
      categoryName?: string
      isEditMode?: boolean
      existingData?: unknown[]
    }
  ): CategoryFormStrategy {
    // Use fallback strategy for unknown category types
    let actualCategoryType = categoryType
    if (!this.isValidCategoryType(categoryType)) {
      console.warn(`Unknown category type "${categoryType}", using universal fallback`)
      actualCategoryType = 'universal_fallback'
    }

    const strategy = this.create(actualCategoryType, context)

    // Log context information untuk debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`StrategyFactory: Created ${strategy.type} strategy for category "${context.categoryName || categoryType}" (${context.categoryId})`)

      if (context.isEditMode && context.existingData) {
        console.log(`StrategyFactory: Edit mode with ${context.existingData.length} existing size entries`)
      }
    }

    return strategy
  }

  /**
   * Get default strategy
   */
  static createDefaultStrategy(context?: {
    categoryId?: string
    categoryName?: string
    isEditMode?: boolean
    existingData?: unknown[]
  }): CategoryFormStrategy {
    const defaultType = this.config.defaultStrategy || 'universal_fallback'
    const StrategyClass = this.getStrategyClass(defaultType)

    if (!StrategyClass) {
      throw new Error(`Default strategy "${defaultType}" not found in registry`)
    }


    return new StrategyClass()
  }

  /**
   * Get all available strategy types
   */
  static getAvailableStrategies(): CategoryType[] {
    return Object.keys(this.config.customStrategies || DEFAULT_STRATEGIES) as CategoryType[]
  }

  /**
   * Register custom strategy
   */
  static registerStrategy(categoryType: CategoryType, StrategyClass: new () => CategoryFormStrategy): void {
    if (!this.config.customStrategies) {
      this.config.customStrategies = { ...DEFAULT_STRATEGIES }
    }

    this.config.customStrategies[categoryType] = StrategyClass
  }

  /**
   * Unregister custom strategy
   */
  static unregisterStrategy(categoryType: CategoryType): boolean {
    if (!this.config.customStrategies) {
      return false
    }

    if (this.config.customStrategies[categoryType]) {
      delete this.config.customStrategies[categoryType]
      return true
    }

    return false
  }

  /**
   * Configure factory settings
   */
  static configure(config: Partial<StrategyFactoryConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      customStrategies: {
        ...DEFAULT_STRATEGIES,
        ...this.config.customStrategies,
        ...config.customStrategies
      }
    }
  }

  /**
   * Get current factory configuration
   */
  static getConfiguration(): StrategyFactoryConfig {
    return { ...this.config }
  }

  /**
   * Reset factory ke default configuration
   */
  static reset(): void {
    this.config = {
      defaultStrategy: 'clothing',
      customStrategies: DEFAULT_STRATEGIES,
      enableFallback: true
    }
  }

  /**
   * Validate category type
   */
  private static isValidCategoryType(categoryType: string): categoryType is CategoryType {
    const validTypes: CategoryType[] = ['clothing', 'accessories_age_based', 'accessories_universal', 'universal_fallback']
    return validTypes.includes(categoryType as CategoryType)
  }

  /**
   * Get strategy class dari registry
   */
  private static getStrategyClass(categoryType: CategoryType): (new () => CategoryFormStrategy) | undefined {
    const registry = this.config.customStrategies || DEFAULT_STRATEGIES
    return registry[categoryType]
  }

  /**
   * Create strategy dari existing ProductSize data (untuk edit mode)
   */
  static createFromExistingData(
    categoryType: CategoryType,
    existingData: unknown[]
  ): CategoryFormStrategy {
    const strategy = this.create(categoryType)

    // Strategy bisa menggunakan existing data untuk initialization
    if ('transformFromProductSizes' in strategy && typeof strategy.transformFromProductSizes === 'function') {
      try {
        const formData = (strategy as CategoryFormStrategy & { transformFromProductSizes?: (sizes: unknown[]) => CategoryFormData }).transformFromProductSizes?.(existingData)
        console.log(`Loaded existing data for ${categoryType}:`, formData)
      } catch (error) {
        console.warn(`Failed to load existing data for ${categoryType}:`, error)
      }
    }

    return strategy
  }

  /**
   * Factory method untuk async strategy creation (untuk future extensibility)
   */
  static async createAsync(categoryType: CategoryType): Promise<CategoryFormStrategy> {
    // Currently synchronous, but designed untuk future async loading
    return this.create(categoryType)
  }

  /**
   * Batch strategy creation untuk multiple categories
   */
  static createBatch(categoryTypes: CategoryType[]): Record<CategoryType, CategoryFormStrategy> {
    const strategies: Record<string, CategoryFormStrategy> = {}

    categoryTypes.forEach(categoryType => {
      try {
        strategies[categoryType] = this.create(categoryType)
      } catch (error) {
        console.error(`Failed to create strategy for ${categoryType}:`, error)
        // Use fallback strategy if available
        strategies[categoryType] = this.createDefaultStrategy()
      }
    })

    return strategies as Record<CategoryType, CategoryFormStrategy>
  }
}

/**
 * Convenience function untuk strategy creation
 */
export function createCategoryFormStrategy(categoryType: CategoryType): CategoryFormStrategy {
  return FormStrategyFactory.create(categoryType)
}

/**
 * Convenience function untuk strategy creation dengan context
 */
export function createCategoryFormStrategyWithContext(
  categoryType: CategoryType,
  context: {
    categoryId?: string
    categoryName?: string
    isEditMode?: boolean
    existingData?: unknown[]
  }
): CategoryFormStrategy {
  return FormStrategyFactory.createWithContext(categoryType, context)
}