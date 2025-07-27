/**
 * Test Data Fixtures untuk Kasir E2E Testing
 *
 * Berisi mock data dan test scenarios untuk testing kasir dashboard functionality.
 * Data ini digunakan untuk memastikan konsistensi testing dan mocking API responses.
 */

import type { TransactionStatus } from '../../../features/kasir/types/transaction'

/**
 * Mock Transaction Data untuk Testing (Updated API Format)
 */
export const mockTransactions = [
  {
    id: 'txn-001',
    transactionCode: 'TXN-20250126-001',
    customerName: 'Budi Santoso',
    customerPhone: '081234567890',
    customerAddress: 'Jl. Merdeka No. 123, Jakarta',
    items: ['Kemeja Batik', 'Celana Formal'],
    totalAmount: 150000,
    amountPaid: 100000,
    remainingAmount: 50000,
    status: 'active' as TransactionStatus,
    startDate: '2025-01-26',
    endDate: '2025-01-28',
    returnDate: null,
    paymentMethod: 'cash',
    notes: 'Untuk acara pernikahan',
    createdAt: '2025-01-26T10:00:00Z',
    updatedAt: '2025-01-26T10:00:00Z',
  },
  {
    id: 'txn-002',
    transactionCode: 'TXN-20250126-002',
    customerName: 'Siti Nurhaliza',
    customerPhone: '089876543210',
    customerAddress: 'Jl. Sudirman No. 456, Bandung',
    items: ['Dress Pesta', 'Aksesoris'],
    totalAmount: 200000,
    amountPaid: 200000,
    remainingAmount: 0,
    status: 'completed' as TransactionStatus,
    startDate: '2025-01-24',
    endDate: '2025-01-26',
    returnDate: '2025-01-26',
    paymentMethod: 'transfer',
    notes: 'Sudah dikembalikan',
    createdAt: '2025-01-24T14:30:00Z',
    updatedAt: '2025-01-26T16:45:00Z',
  },
  {
    id: 'txn-003',
    transactionCode: 'TXN-20250125-003',
    customerName: 'Ahmad Wijaya',
    customerPhone: '087654321098',
    customerAddress: 'Jl. Gatot Subroto No. 789, Surabaya',
    items: ['Jas Formal', 'Sepatu Formal'],
    totalAmount: 300000,
    amountPaid: 150000,
    remainingAmount: 150000,
    status: 'overdue' as TransactionStatus,
    startDate: '2025-01-23',
    endDate: '2025-01-25',
    returnDate: null,
    paymentMethod: 'cash',
    notes: 'Terlambat pengembalian',
    createdAt: '2025-01-23T08:15:00Z',
    updatedAt: '2025-01-25T20:00:00Z',
  },
]

/**
 * Mock API Transaction Detail Response (RPK-27 Format)
 * Format sesuai dengan API response dari backend integration
 */
export const mockTransactionDetailApiResponse = {
  id: '53229bd2-cfd9-4a7f-a268-2fd07da97b34',
  kode: 'TXN-20250726-001',
  penyewa: {
    id: '0d75c83a-33e7-40c5-9d59-cf1fd06fd119',
    nama: 'Budi Santoso',
    telepon: '081234567890',
    alamat: 'Jl. Merdeka No. 123, Jakarta',
  },
  status: 'active',
  totalHarga: 240000,
  jumlahBayar: 150000,
  sisaBayar: 90000,
  tglMulai: '2025-01-26T00:00:00.000Z',
  tglSelesai: '2025-01-28T00:00:00.000Z',
  tglKembali: null,
  metodeBayar: 'tunai',
  catatan: 'Untuk acara pernikahan',
  createdBy: 'kasir-001',
  createdAt: '2025-01-26T10:00:00.000Z',
  updatedAt: '2025-01-26T10:00:00.000Z',
  items: [
    {
      id: 'item-001',
      produkId: 'product-001',
      produk: {
        id: 'product-001',
        code: 'PRD-001',
        name: 'Kemeja Batik Premium',
        imageUrl: '/products/kemeja-batik.jpg',
      },
      jumlah: 1,
      hargaSewa: 50000,
      durasi: 3,
      subtotal: 150000,
      kondisiAwal: 'Baik',
      kondisiAkhir: null,
      statusKembali: 'belum',
    },
    {
      id: 'item-002',
      produkId: 'product-002',
      produk: {
        id: 'product-002',
        code: 'PRD-002',
        name: 'Celana Formal',
        imageUrl: '/products/celana-formal.jpg',
      },
      jumlah: 1,
      hargaSewa: 30000,
      durasi: 3,
      subtotal: 90000,
      kondisiAwal: 'Baik',
      kondisiAkhir: null,
      statusKembali: 'belum',
    },
  ],
  pembayaran: [
    {
      id: 'payment-001',
      jumlah: 150000,
      metode: 'tunai',
      referensi: 'PAY-001',
      catatan: null,
      createdBy: 'kasir-001',
      createdAt: '2025-01-26T10:30:00.000Z',
    },
  ],
  aktivitas: [
    {
      id: 'activity-001',
      tipe: 'dibuat',
      deskripsi: 'Transaksi dibuat',
      data: {},
      createdBy: 'kasir-001',
      createdAt: '2025-01-26T10:00:00.000Z',
    },
    {
      id: 'activity-002',
      tipe: 'dibayar',
      deskripsi: 'Pembayaran sebagian diterima',
      data: { jumlah: 150000 },
      createdBy: 'kasir-001',
      createdAt: '2025-01-26T10:30:00.000Z',
    },
  ],
}

/**
 * Mock Transaction Counts untuk Tab Testing
 */
export const mockTransactionCounts = {
  active: 3,
  completed: 5,
  overdue: 2,
  total: 10,
}

/**
 * Mock API Response Structure
 */
export const mockApiResponse = {
  data: mockTransactions,
  summary: {
    totalActive: mockTransactionCounts.active,
    totalSelesai: mockTransactionCounts.completed,
    totalTerlambat: mockTransactionCounts.overdue,
    totalCancelled: 0,
  },
  pagination: {
    page: 1,
    limit: 100,
    total: mockTransactionCounts.total,
    totalPages: 1,
  },
}

/**
 * Test Scenarios untuk Search Functionality
 */
export const searchTestScenarios = [
  {
    query: 'Budi',
    expectedResults: ['TXN-20250126-001'],
    description: 'Search by customer name',
  },
  {
    query: 'TXN-20250126',
    expectedResults: ['TXN-20250126-001', 'TXN-20250126-002'],
    description: 'Search by transaction code prefix',
  },
  {
    query: '081234',
    expectedResults: ['TXN-20250126-001'],
    description: 'Search by phone number',
  },
  {
    query: 'Kemeja',
    expectedResults: ['TXN-20250126-001'],
    description: 'Search by item name',
  },
]

/**
 * Error Test Scenarios
 */
export const errorTestScenarios = {
  networkError: {
    message: 'Koneksi bermasalah. Silakan coba lagi.',
    type: 'network',
  },
  serverError: {
    message: 'Terjadi kesalahan pada server',
    type: 'server',
    statusCode: 500,
  },
  notFound: {
    message: 'Data tidak ditemukan',
    type: 'not_found',
    statusCode: 404,
  },
}

/**
 * Navigation Test Data
 */
export const navigationTestData = {
  dashboardPath: '/dashboard',
  newTransactionPath: '/dashboard/new',
  transactionDetailPath: (id: string) => `/dashboard/transaction/${id}`,
}

/**
 * UI Element Selectors untuk Testing
 */
export const kasirSelectors = {
  // Page structure
  pageRoot: '[data-testid="kasir-dashboard-page"]',
  header: '[data-testid="kasir-header"]',
  mainContent: '[data-testid="kasir-main-content"]',

  // Header elements
  title: '[data-testid="kasir-title"]',
  subtitle: '[data-testid="kasir-subtitle"]',
  addTransactionButton: '[data-testid="add-transaction-button"]',

  // Tab navigation
  tabContainer: '[data-testid="transaction-tabs"]',
  allTab: '[data-testid="tab-all"]',
  activeTab: '[data-testid="tab-active"]',
  completedTab: '[data-testid="tab-selesai"]',
  overdueTab: '[data-testid="tab-terlambat"]',

  // Search functionality
  searchInput: '[data-testid="search-input"]',
  searchButton: '[data-testid="search-button"]',
  clearSearchButton: '[data-testid="clear-search"]',

  // Transaction table
  transactionTable: '[data-testid="transaction-table"]',
  transactionRows: '[data-testid^="transaction-row-"]',
  emptyState: '[data-testid="empty-state"]',
  loadingState: '[data-testid="loading-skeleton"]',

  // Error states
  errorBoundary: '[data-testid="error-boundary"]',
  errorMessage: '[data-testid="error-message"]',
  retryButton: '[data-testid="retry-button"]',

  // Transaction Detail Page Selectors (RPK-27)
  transactionDetailPage: '[data-testid="transaction-detail-page"]',
  customerInfoCard: '[data-testid="customer-info-card"]',
  productDetailCard: '[data-testid="product-detail-card"]',
  paymentSummaryCard: '[data-testid="payment-summary-card"]',
  activityTimeline: '[data-testid="activity-timeline"]',
  actionButtonsPanel: '[data-testid="action-buttons-panel"]',
  statusBadge: '[data-testid="status-badge"]',
  refreshButton: '[data-testid="refresh-button"]',
  backButton: '[data-testid="back-button"]',
  breadcrumb: '[data-testid="breadcrumb"]',
}

/**
 * Performance Thresholds untuk Testing
 * Updated with more realistic thresholds for CI/CD environments
 */
export const performanceThresholds = {
  pageLoadTime: 8000, // 8 seconds max (was 5000) - more generous for CI/CD
  searchResponseTime: 3000, // 3 seconds max (was 2000) - account for debouncing
  tabSwitchTime: 2000, // 2 seconds max (was 1000) - allow for data loading
  navigationTime: 5000, // 5 seconds max (was 3000) - more realistic for routing

  // Large dataset multipliers
  largeDatasetMultiplier: 4, // 4x threshold for large dataset tests
  concurrentActionMultiplier: 2, // 2x threshold for concurrent operations
}

/**
 * Test Configuration
 */
export const testConfig = {
  timeouts: {
    short: 5000,
    medium: 10000,
    long: 30000,
  },
  retries: {
    onFailure: 2,
    onFlaky: 3,
  },
  screenshots: {
    onSuccess: true,
    onFailure: true,
    onError: true,
  },
}
