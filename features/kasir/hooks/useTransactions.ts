'use client'

import { useState, useMemo } from 'react'
import type { TransactionFilters } from '../types/transaction'
import { mockTransactions } from '../lib/mock-data'

export function useTransactions() {
  const [filters, setFilters] = useState<TransactionFilters>({})
  const [isLoading] = useState(false)

  const filteredTransactions = useMemo(() => {
    let filtered = mockTransactions

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter((transaction) => transaction.status === filters.status)
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        (transaction) =>
          transaction.customerName.toLowerCase().includes(searchLower) ||
          transaction.transactionCode.toLowerCase().includes(searchLower) ||
          transaction.items.some((item) => item.toLowerCase().includes(searchLower)),
      )
    }

    return filtered
  }, [filters])

  const updateFilters = (newFilters: Partial<TransactionFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const getTransactionCounts = () => {
    return {
      active: mockTransactions.filter((t) => t.status === 'active').length,
      completed: mockTransactions.filter((t) => t.status === 'completed').length,
      overdue: mockTransactions.filter((t) => t.status === 'overdue').length,
      total: mockTransactions.length,
    }
  }

  return {
    transactions: filteredTransactions,
    filters,
    updateFilters,
    isLoading,
    counts: getTransactionCounts(),
  }
}
