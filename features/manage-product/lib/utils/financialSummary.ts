/**
 * Financial Summary Computation Utilities - RPK-46 Component Architecture Refactoring
 * 
 * Extracted from ProductHistoryCard renderSummary() function to achieve better separation of concerns.
 * Follows "Computed Financial Data Pattern (Option B)" for clean component architecture.
 */

import type { ProductHistoryItem } from '../../types/productHistory'

/**
 * Financial summary interface for computed data
 */
export interface FinancialSummary {
  totalRevenue: number
  totalTransactions: number
  averageRentalDuration: number
  isLoading: boolean
  hasData: boolean
}

/**
 * Formatted financial metrics for display
 */
export interface FormattedFinancialMetrics {
  totalRevenueFormatted: string
  totalTransactionsFormatted: string
  averageDurationFormatted: string
}

/**
 * Compute financial summary from product history data
 * Extracted from ProductHistoryCard.renderSummary() for better separation of concerns
 */
export function computeFinancialSummary(
  historyData?: ProductHistoryItem[],
  isLoading = false
): FinancialSummary {
  // Handle loading state
  if (isLoading && !historyData) {
    return {
      totalRevenue: 0,
      totalTransactions: 0,
      averageRentalDuration: 0,
      isLoading: true,
      hasData: false,
    }
  }

  // Handle empty data
  if (!historyData?.length) {
    return {
      totalRevenue: 0,
      totalTransactions: 0,
      averageRentalDuration: 0,
      isLoading: false,
      hasData: false,
    }
  }

  // Calculate financial metrics (extracted from ProductHistoryCard lines 63-67)
  const totalRevenue = historyData.reduce((sum: number, item: ProductHistoryItem) => sum + item.totalRevenue, 0)
  const totalTransactions = historyData.length
  const avgDuration = Math.round(
    historyData.reduce((sum: number, item: ProductHistoryItem) => sum + item.duration, 0) / totalTransactions
  )

  return {
    totalRevenue,
    totalTransactions,
    averageRentalDuration: avgDuration,
    isLoading: false,
    hasData: true,
  }
}

/**
 * Format financial metrics for display
 * Handles currency formatting and pluralization
 */
export function formatFinancialMetrics(
  summary: FinancialSummary,
  formatCurrency: (amount: number) => string
): FormattedFinancialMetrics {
  return {
    totalRevenueFormatted: formatCurrency(summary.totalRevenue),
    totalTransactionsFormatted: `${summary.totalTransactions} kali`,
    averageDurationFormatted: `${summary.averageRentalDuration} hari`,
  }
}

/**
 * Check if financial data is available for display
 */
export function hasFinancialData(summary: FinancialSummary): boolean {
  return summary.hasData && summary.totalTransactions > 0
}

/**
 * Get loading state for financial summary
 */
export function isFinancialDataLoading(summary: FinancialSummary): boolean {
  return summary.isLoading
}