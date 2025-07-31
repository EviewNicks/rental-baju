/**
 * React Query Configuration
 * Centralized configuration for TanStack Query
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query'

const queryConfig: DefaultOptions = {
  queries: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors except 408, 429
      if (error && typeof error === 'object' && 'status' in error) {
        const status = error.status as number
        if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
          return false
        }
      }
      return failureCount < 3
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  },
  mutations: {
    retry: (failureCount, error) => {
      // Don't retry mutations on client errors
      if (error && typeof error === 'object' && 'status' in error) {
        const status = error.status as number
        if (status >= 400 && status < 500) {
          return false
        }
      }
      return failureCount < 2
    },
  },
}

export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: queryConfig,
  })
}

// Query keys factory for consistent key management
export const queryKeys = {
  // Product related queries
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.products.lists(), params] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
  },
  // Category related queries
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.categories.lists(), params] as const,
    details: () => [...queryKeys.categories.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.categories.details(), id] as const,
  },
  // Kasir related queries
  kasir: {
    all: ['kasir'] as const,
    // Dashboard queries
    dashboard: {
      all: () => [...queryKeys.kasir.all, 'dashboard'] as const,
      stats: () => [...queryKeys.kasir.dashboard.all(), 'stats'] as const,
    },
    // Penyewa (Customer) queries
    penyewa: {
      all: () => [...queryKeys.kasir.all, 'penyewa'] as const,
      lists: () => [...queryKeys.kasir.penyewa.all(), 'list'] as const,
      list: (params: Record<string, unknown>) => [...queryKeys.kasir.penyewa.lists(), params] as const,
      details: () => [...queryKeys.kasir.penyewa.all(), 'detail'] as const,
      detail: (id: string) => [...queryKeys.kasir.penyewa.details(), id] as const,
      search: (query: string) => [...queryKeys.kasir.penyewa.lists(), 'search', query] as const,
    },
    // Transaksi (Transaction) queries
    transaksi: {
      all: () => [...queryKeys.kasir.all, 'transaksi'] as const,
      lists: () => [...queryKeys.kasir.transaksi.all(), 'list'] as const,
      list: (params: Record<string, unknown>) => [...queryKeys.kasir.transaksi.lists(), params] as const,
      details: () => [...queryKeys.kasir.transaksi.all(), 'detail'] as const,
      detail: (kode: string) => [...queryKeys.kasir.transaksi.details(), kode] as const,
      byStatus: (status: string) => [...queryKeys.kasir.transaksi.lists(), 'status', status] as const,
      search: (query: string) => [...queryKeys.kasir.transaksi.lists(), 'search', query] as const,
    },
    // Produk (Product) queries for kasir
    produk: {
      all: () => [...queryKeys.kasir.all, 'produk'] as const,
      available: () => [...queryKeys.kasir.produk.all(), 'available'] as const,
      availableList: (params: Record<string, unknown>) => [...queryKeys.kasir.produk.available(), params] as const,
      search: (query: string) => [...queryKeys.kasir.produk.available(), 'search', query] as const,
      byCategory: (categoryId: string) => [...queryKeys.kasir.produk.available(), 'category', categoryId] as const,
    },
    // Pembayaran (Payment) queries
    pembayaran: {
      all: () => [...queryKeys.kasir.all, 'pembayaran'] as const,
      byTransaksi: (transaksiId: string) => [...queryKeys.kasir.pembayaran.all(), 'transaksi', transaksiId] as const,
      detail: (id: string) => [...queryKeys.kasir.pembayaran.all(), 'detail', id] as const,
    },
  },
} as const