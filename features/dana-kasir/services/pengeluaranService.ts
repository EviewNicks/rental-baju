// Dana Kasir Management - PengeluaranService
// Service layer for expense CRUD operations

import { PrismaClient, Prisma } from '@prisma/client'
import { CreatePengeluaranRequest, UpdatePengeluaranRequest, PengeluaranKasir } from '../types'
import { createPengeluaranSchema, updatePengeluaranSchema } from '../validation'
import { getWITADayRange } from '../utils/timezone'

// Owner kasir ID constant
const OWNER_KASIR_ID = 'owner-system'

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
    private kasirId: string,
  ) {}

  /**
   * Create a new expense record
   *
   * Validates input, sets audit fields, and saves to database
   *
   * @param data - Expense data (kasirId, harga, kategori, deskripsi)
   * @returns Created expense record with kasir relation
   * @throws Error if validation fails, kasir not found, or database error occurs
   */
  async create(data: CreatePengeluaranRequest): Promise<PengeluaranKasir> {
    // Validate input using Zod schema
    const validationResult = createPengeluaranSchema.safeParse(data)

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }))
      throw new Error(`Validation failed: ${JSON.stringify(errors)}`)
    }

    const validatedData = validationResult.data

    // Validate kasirId exists in Kasir table (including Owner)
    const kasirExists = await this.prisma.kasir.findUnique({
      where: { id: validatedData.kasirId },
    })

    if (!kasirExists) {
      throw new Error('Kasir tidak ditemukan')
    }

    // Create expense with audit fields
    // Use kasirId from request data (supports both regular kasir and Owner)
    const expense = await this.prisma.pengeluaranKasir.create({
      data: {
        kasirId: validatedData.kasirId, // From request data
        harga: new Prisma.Decimal(validatedData.harga),
        kategori: validatedData.kategori,
        deskripsi: validatedData.deskripsi,
        createdBy: this.userId, // Clerk userId (who created it)
        isActive: true,
      },
      include: {
        kasir: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
    })

    // Transform Prisma result to application type
    return this.transformPrismaResult(expense)
  }

  /**
   * Update an existing expense record
   *
   * Only allows updating: kasirId, harga, kategori, deskripsi
   * Preserves: createdAt, createdBy, id
   * Updates: updatedAt automatically
   *
   * @param id - Expense ID to update
   * @param data - Partial expense data to update
   * @returns Updated expense record
   * @throws Error if expense not found, validation fails, or not authorized
   */
  async update(id: string, data: UpdatePengeluaranRequest): Promise<PengeluaranKasir> {
    // Validate input using Zod schema
    const validationResult = updatePengeluaranSchema.safeParse(data)

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }))
      throw new Error(`Validation failed: ${JSON.stringify(errors)}`)
    }

    const validatedData = validationResult.data

    // Check if expense exists and is active
    const existing = await this.prisma.pengeluaranKasir.findFirst({
      where: {
        id,
        isActive: true,
      },
    })

    if (!existing) {
      throw new Error('Expense not found or has been deleted')
    }

    // Authorization handled at API route level - kasir role can edit any expense

    // Validate kasirId if provided (including Owner)
    if (validatedData.kasirId) {
      const kasirExists = await this.prisma.kasir.findUnique({
        where: { id: validatedData.kasirId },
      })

      if (!kasirExists) {
        throw new Error('Kasir tidak ditemukan')
      }
    }

    // Prepare update data (only allowed fields)
    const updateData: Prisma.PengeluaranKasirUpdateInput = {}

    // Allow kasirId update (supports both regular kasir and Owner)
    if (validatedData.kasirId !== undefined) {
      updateData.kasir = {
        connect: { id: validatedData.kasirId },
      }
    }

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
            nama: true,
          },
        },
      },
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
        isActive: true,
      },
    })

    if (!existing) {
      throw new Error('Expense not found or already deleted')
    }

    // Authorization handled at API route level - kasir role can delete any expense

    // Soft delete by setting isActive to false
    await this.prisma.pengeluaranKasir.update({
      where: { id },
      data: {
        isActive: false,
        // updatedAt is automatically set by Prisma
      },
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
          lte: end,
        },
      },
      include: {
        kasir: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return expenses.map((expense) => this.transformPrismaResult(expense))
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
        isActive: true,
      },
      include: {
        kasir: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
    })

    if (!expense) {
      return null
    }

    return this.transformPrismaResult(expense)
  }

  /**
   * Get list of active kasir for dropdown
   *
   * Returns all active kasir with id and nama only, excluding Owner
   * Used for kasir selection dropdown in expense form
   *
   * @returns Array of active kasir with id and nama (excluding Owner)
   */
  async getActiveKasirList(): Promise<Array<{ id: string; nama: string }>> {
    const kasirList = await this.prisma.kasir.findMany({
      where: {
        isActive: true,
        id: {
          not: OWNER_KASIR_ID, // Exclude Owner from dropdown
        },
      },
      select: {
        id: true,
        nama: true,
      },
      orderBy: {
        nama: 'asc',
      },
    })

    return kasirList
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
    }>,
  ): PengeluaranKasir {
    return {
      id: expense.id,
      kasirId: expense.kasirId,
      harga: expense.harga.toNumber(),
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
      kategori: expense.kategori as any, // Type assertion for kategori
      deskripsi: expense.deskripsi || undefined,
      isActive: expense.isActive,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      createdBy: expense.createdBy,
      kasir: expense.kasir,
    }
  }
}
