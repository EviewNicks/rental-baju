/**
 * API Route: Kasir Dashboard Summary - RPK-26
 * 
 * GET /api/kasir/dashboard - Get dashboard summary data
 * 
 * Authentication: Clerk (admin/kasir roles only)
 * Provides comprehensive overview for kasir operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TransaksiService } from '@/features/kasir/services/transaksiService'
import { PenyewaService } from '@/features/kasir/services/penyewaService'
import { PembayaranService } from '@/features/kasir/services/pembayaranService'
import { createAvailabilityService } from '@/features/kasir/services/availabilityService'
import { requirePermission, withRateLimit } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await withRateLimit(`dashboard-${clientIP}`, 20, 60000)
    if (rateLimitResult.error) {
      return rateLimitResult.error
    }

    // Authentication and permission check
    const authResult = await requirePermission('transaksi', 'read')
    if (authResult.error) {
      return authResult.error
    }
    const { user } = authResult

    // Parse query parameters for date range
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined

    // Initialize services
    const transaksiService = new TransaksiService(prisma, user.id)
    const penyewaService = new PenyewaService(prisma, user.id, user.role)
    const pembayaranService = new PembayaranService(prisma, user.id, user.role)
    const availabilityService = createAvailabilityService(prisma)

    // Get all dashboard data in parallel
    const [
      transaksiStats,
      penyewaStats,
      paymentStats,
      availabilitySummary,
      lowStockProducts
    ] = await Promise.all([
      transaksiService.getTransaksiStats(),
      penyewaService.getPenyewaStats(),
      pembayaranService.getPaymentStats(startDate, endDate),
      availabilityService.getAvailabilitySummary(),
      availabilityService.getLowStockProducts(2)
    ])

    // Calculate totals and percentages
    const totalActiveTransactions = transaksiStats.totalActive
    const totalCompletedTransactions = transaksiStats.totalSelesai
    const totalOverdueTransactions = transaksiStats.totalTerlambat
    const totalCancelledTransactions = transaksiStats.totalCancelled
    const totalTransactions = totalActiveTransactions + totalCompletedTransactions + 
                             totalOverdueTransactions + totalCancelledTransactions

    // Revenue calculations
    const totalRevenue = Number(paymentStats.totalAmount)
    const averageTransactionValue = Number(paymentStats.averagePaymentAmount)

    // Format response data
    const dashboardData = {
      // Transaction Overview
      transactions: {
        total: totalTransactions,
        active: totalActiveTransactions,
        completed: totalCompletedTransactions,
        overdue: totalOverdueTransactions,
        cancelled: totalCancelledTransactions,
        completionRate: totalTransactions > 0 ? 
          Math.round((totalCompletedTransactions / totalTransactions) * 100) : 0,
        overdueRate: totalTransactions > 0 ? 
          Math.round((totalOverdueTransactions / totalTransactions) * 100) : 0
      },

      // Customer Overview
      customers: {
        total: penyewaStats.totalPenyewa,
        newThisMonth: penyewaStats.newThisMonth,
        withActiveRentals: penyewaStats.activeTransactions,
        growthRate: penyewaStats.totalPenyewa > 0 ? 
          Math.round((penyewaStats.newThisMonth / penyewaStats.totalPenyewa) * 100) : 0
      },

      // Payment Overview
      payments: {
        totalRevenue,
        totalPayments: paymentStats.totalPayments,
        averageTransactionValue,
        paymentMethods: Object.entries(paymentStats.paymentsByMethod).map(([method, data]) => ({
          method,
          count: data.count,
          amount: Number(data.amount),
          percentage: paymentStats.totalPayments > 0 ? 
            Math.round((data.count / paymentStats.totalPayments) * 100) : 0
        }))
      },

      // Inventory Overview
      inventory: {
        totalProducts: availabilitySummary.totalProducts,
        fullyAvailable: availabilitySummary.fullyAvailable,
        partiallyAvailable: availabilitySummary.partiallyAvailable,
        outOfStock: availabilitySummary.outOfStock,
        totalRented: availabilitySummary.totalRented,
        availabilityRate: availabilitySummary.totalProducts > 0 ? 
          Math.round((availabilitySummary.fullyAvailable / availabilitySummary.totalProducts) * 100) : 0,
        utilizationRate: availabilitySummary.totalProducts > 0 ? 
          Math.round((availabilitySummary.totalRented / availabilitySummary.totalProducts) * 100) : 0
      },

      // Alerts & Warnings
      alerts: {
        lowStockProducts: lowStockProducts.map(product => ({
          id: product.productId,
          name: product.productName,
          code: product.productCode,
          category: product.categoryName,
          totalStock: product.totalStock,
          availableQuantity: product.availableQuantity,
          urgency: product.availableQuantity === 0 ? 'critical' : 
                   product.availableQuantity === 1 ? 'high' : 'medium'
        })),
        overdueTransactions: totalOverdueTransactions,
        needsAttention: totalOverdueTransactions + lowStockProducts.length
      },

      // Performance Metrics
      performance: {
        averageRentalDuration: 0, // TODO: Calculate from completed transactions
        customerRetentionRate: 0, // TODO: Calculate repeat customers
        inventoryTurnover: 0, // TODO: Calculate inventory turnover
        profitMargin: 0 // TODO: Calculate based on costs vs revenue
      },

      // Meta information
      lastUpdated: new Date().toISOString(),
      dateRange: {
        start: startDate?.toISOString() || null,
        end: endDate?.toISOString() || null
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: dashboardData,
        message: 'Dashboard data berhasil diambil'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('GET /api/kasir/dashboard error:', error)

    // Handle date validation errors
    if (error instanceof Error && error.message.includes('Invalid date')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Format tanggal tidak valid',
            code: 'VALIDATION_ERROR'
          }
        },
        { status: 400 }
      )
    }

    // Handle database connection errors
    if (error && typeof error === 'object' && 'message' in error && 
        typeof error.message === 'string' && error.message.includes('connection pool')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Database connection timeout. Please try again.',
            code: 'CONNECTION_ERROR'
          }
        },
        { status: 503 }
      )
    }

    // Generic server error
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR'
        }
      },
      { status: 500 }
    )
  }
}