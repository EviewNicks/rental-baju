// Dana Kasir Management - PengeluaranService
// Service layer for expense CRUD operations

import { PrismaClient, Prisma } from '@prisma/client'
import { 
  CreatePengeluaranRequest, 
  UpdatePengeluaranRequest,
  PengeluaranKasir 
} from '../types'
import { 
  createPengeluaranSchema, 
  updatePengeluaranSchema 
} from '../validation'
import { getWITADayRange } from '../utils/timezone'

/**
 * PengeluaranService - Handles all expense-related operations
 * 
 * Responsibilities:
 * - Create new expenses with validation
 * - Update existing expenses (only allowed fields)
 * - Soft delete expenses (preserve audit trail)
 * - Query expenses by date and ID
 * - Maintain audit trail (createdBy, updatedAt)
 */
export class PengeluaranService {
  constructor(
    private prisma: PrismaClient,
    private userId: string,
    private kasirId: string
  ) {}

  /**
   * Create a new expense record
   * 
   * Validates input, sets audit fields, and saves to database
   * 
   * @param data - Expense data (harga, kategori, deskripsi)
   * @returns Created expense record with kasir relation
   * @throws Error if validation fails or database error occurs
   */
  async create(data: CreatePengeluaranRequest): Promise<PengeluaranKasir> {
    // Validate input using Zod schema
    const validationResult = createPengeluaranSchema.safeParse(data)
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
      throw new Error(`Validation failed: ${JSON.stringify(errors)}`)
    }

    const validatedData = validationResult.data

    // Create expense with audit fields
    const expense = await this.prisma.pengeluaranKasir.create({
      data: {
        kasirId: this.kasirId,
        harga: new Prisma.Decimal(validatedData.harga),
        kategori: validatedData.kategori,
        deskripsi: validatedData.deskripsi,
        createdBy: this.userId,
        isActive: true
      },
      include: {
        kasir: {
          select: {
            id: true,
            nama: true
          }
        }
      }
    })

    // Transform Prisma result to application type
    return this.transformPrismaResult(expense)
  }

  /**
   * Update an existing expense record
   * 
   * Only allows updating: harga, kategori, deskripsi
   * Preserves: kasirId, createdAt, createdBy, id
   * Updates: updatedAt automatically
   * 
   * @param id - Expense ID to update
   * @param data - Partial expense data to update
   * @returns Updated expense record
   * @throws Error if expense not found, validation fails, or not authorized
   */
  async update(
    id: string, 
    data: UpdatePengeluaranRequest
  ): Promise<PengeluaranKasir> {
    // Validate input using Zod schema
    const validationResult = updatePengeluaranSchema.safeParse(data)
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
      throw new Error(`Validation failed: ${JSON.stringify(errors)}`)
    }

    const validatedData = validationResult.data

    // Check if expense exists and is active
    const existing = await this.prisma.pengeluaranKasir.findFirst({
      where: {
        id,
        isActive: true
      }
    })

    if (!existing) {
      throw new Error('Expense not found or has been deleted')
    }

    // Check if user owns this expense (kasirId must match)
    if (existing.kasirId !== this.kasirId) {
      throw new Error('Not authorized to update this expense')
    }

    // Prepare update data (only allowed fields)
    const updateData: Prisma.PengeluaranKasirUpdateInput = {}
    
    if (validatedData.harga !== undefined) {
      updateData.harga = new Prisma.Decimal(validatedData.harga)
    }
    
    if (validatedData.kategori !== undefined) {
      updateData.kategori = validatedData.kategori
    }
    
    if (validatedData.deskripsi !== undefined) {
      updateData.deskripsi = validatedData.deskripsi
    }

    // Update expense (updatedAt is automatically set by Prisma)
    const updated = await this.prisma.pengeluaranKasir.update({
      where: { id },
      data: updateData,
      include: {
        kasir: {
          select: {
            id: true,
            nama: true
          }
        }
      }
    })

    return this.transformPrismaResult(updated)
  }

  /**
   * Soft delete an expense record
   * 
   * Sets isActive to false instead of removing from database
   * Preserves audit trail for accountability
   * 
   * @param id - Expense ID to delete
   * @throws Error if expense not found or not authorized
   */
  async softDelete(id: string): Promise<void> {
    // Check if expense exists and is active
    const existing = await this.prisma.pengeluaranKasir.findFirst({
      where: {
        id,
        isActive: true
      }
    })

    if (!existing) {
      throw new Error('Expense not found or already deleted')
    }

    // Check if user owns this expense
    if (existing.kasirId !== this.kasirId) {
      throw new Error('Not authorized to delete this expense')
    }

    // Soft delete by setting isActive to false
    await this.prisma.pengeluaranKasir.update({
      where: { id },
      data: {
        isActive: false
        // updatedAt is automatically set by Prisma
      }
    })
  }

  /**
   * Get all active expenses for a specific date
   * 
   * Filters by date range (00:00 - 23:59 WITA timezone)
   * Only returns active expenses (isActive = true)
   * Ordered by createdAt DESC (newest first)
   * 
   * @param date - Date to query expenses for
   * @returns Array of expenses for the specified date
   */
  async getByDate(date: Date): Promise<PengeluaranKasir[]> {
    // Get date range in WITA timezone
    const { start, end } = getWITADayRange(date)

    const expenses = await this.prisma.pengeluaranKasir.findMany({
      where: {
        isActive: true,
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        kasir: {
          select: {
            id: true,
            nama: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return expenses.map(expense => this.transformPrismaResult(expense))
  }

  /**
   * Get a single expense by ID
   * 
   * Only returns active expenses (isActive = true)
   * 
   * @param id - Expense ID to retrieve
   * @returns Expense record or null if not found
   */
  async getById(id: string): Promise<PengeluaranKasir | null> {
    const expense = await this.prisma.pengeluaranKasir.findFirst({
      where: {
        id,
        isActive: true
      },
      include: {
        kasir: {
          select: {
            id: true,
            nama: true
          }
        }
      }
    })

    if (!expense) {
      return null
    }

    return this.transformPrismaResult(expense)
  }

  /**
   * Transform Prisma result to application type
   * 
   * Converts Prisma Decimal to number for easier handling in application
   * 
   * @param expense - Prisma expense result
   * @returns Transformed expense with number type for harga
   */
  private transformPrismaResult(
    expense: Prisma.PengeluaranKasirGetPayload<{
      include: { kasir: { select: { id: true; nama: true } } }
    }>
  ): PengeluaranKasir {
    return {
      id: expense.id,
      kasirId: expense.kasirId,
      harga: expense.harga.toNumber(),
      kategori: expense.kategori as any, // Type assertion for kategori
      deskripsi: expense.deskripsi || undefined,
      isActive: expense.isActive,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      createdBy: expense.createdBy,
      kasir: expense.kasir
    }
  }
}
