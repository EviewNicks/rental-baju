/**
 * Condition Evaluator Utility
 *
 * Utility class untuk mengevaluasi field conditions dalam form strategies.
 * Support berbagai operator untuk conditional field rendering.
 */

import type { FieldCondition } from './CategoryFormStrategy'
import type { CategoryFormData } from './CategoryFormStrategy'

export class ConditionEvaluator {
  /**
   * Evaluate field condition terhadap form data
   */
  static evaluateCondition(
    condition: FieldCondition,
    formData: CategoryFormData
  ): boolean {
    const { field, operator, value } = condition
    const fieldValue = formData[field]

    switch (operator) {
      case 'includes':
        return this.evaluateIncludes(fieldValue, value)

      case 'excludes':
        return !this.evaluateIncludes(fieldValue, value)

      case 'equals':
        return this.evaluateEquals(fieldValue, value)

      case 'not_equals':
        return !this.evaluateEquals(fieldValue, value)

      default:
        console.warn(`Unknown condition operator: ${operator}`)
        return true
    }
  }

  /**
   * Evaluate includes operator (untuk arrays)
   */
  private static evaluateIncludes(
    fieldValue: unknown,
    expectedValue: unknown
  ): boolean {
    if (Array.isArray(fieldValue)) {
      return fieldValue.includes(expectedValue)
    }

    if (typeof fieldValue === 'string' && typeof expectedValue === 'string') {
      return fieldValue.includes(expectedValue)
    }

    return fieldValue === expectedValue
  }

  /**
   * Evaluate equals operator
   */
  private static evaluateEquals(
    fieldValue: unknown,
    expectedValue: unknown
  ): boolean {
    if (Array.isArray(fieldValue) && Array.isArray(expectedValue)) {
      // Compare arrays by content
      if (fieldValue.length !== expectedValue.length) {
        return false
      }
      return fieldValue.every((val, index) => val === expectedValue[index])
    }

    return fieldValue === expectedValue
  }

  /**
   * Check if field should be visible based on condition
   */
  static isFieldVisible(
    condition: FieldCondition | undefined,
    formData: CategoryFormData
  ): boolean {
    if (!condition) {
      return true // No condition means always visible
    }

    return this.evaluateCondition(condition, formData)
  }

  /**
   * Get visible fields dari array of field configs
   */
  static getVisibleFields<T extends { condition?: FieldCondition }>(
    fields: T[],
    formData: CategoryFormData
  ): T[] {
    return fields.filter(field =>
      this.isFieldVisible(field.condition, formData)
    )
  }
}