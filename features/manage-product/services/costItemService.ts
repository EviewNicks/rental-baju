/**
 * CostItemService - Business Logic Layer
 * Handles CRUD operations, validation, and business rules for cost items
 */

import { PrismaClient } from '@prisma/client'
import {
  createCostItemSchema,
  updateCostItemSchema,
  costItemParamsSchema,
} from '../lib/validation/costItemSchema'
import { NotFoundError, ConflictError } from '../lib/errors/AppError'
import type {
  CostItem,
  CreateCostItemRequest,
  UpdateCostItemRequest,
  CostItemListResponse,
  CostItemQueryParams,
  CostItemWithUsage,
} from '../types/costItem'

export class CostItemService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly userId: string,
  ) {}

  /**
   * Create a new cost item
   */
  async createCostItem(request: CreateCostItemRequest): Promise<CostItem> {
    // Validate input
    const validatedData = createCostItemSchema.parse(request)

    // Check if cost item name already exists (case-insensitive)
    const existingCostItem = await this.prisma.costItem.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: 'insensitive',
        },
      },
    })

    if (existingCostItem) {
      throw new ConflictError(`Cost item dengan nama "${validatedData.name}" sudah ada`)
    }

    // Create cost item
    const prismaCostItem = await this.prisma.costItem.create({
      data: {
        name: validatedData.name,
        createdBy: this.userId,
      },
    })

    return this.convertPrismaCostItemToCostItem(prismaCostItem)
  }

  /**
   * Update an existing cost item
   */
  async updateCostItem(id: string, request: UpdateCostItemRequest): Promise<CostItem> {
    // Validate input
    const { id: validatedId } = costItemParamsSchema.parse({ id })
    const validatedData = updateCostItemSchema.parse(request)

    // Check if cost item exists
    const existingCostItem = await this.prisma.costItem.findUnique({
      where: {
        id: validatedId,
      },
    })

    if (!existingCostItem) {
      throw new NotFoundError('Cost item tidak ditemukan')
    }

    // Check for name conflicts if name is being updated
    if (validatedData.name && validatedData.name !== existingCostItem.name) {
      const conflictCostItem = await this.prisma.costItem.findFirst({
        where: {
          name: {
            equals: validatedData.name,
            mode: 'insensitive',
          },
          id: {
            not: validatedId,
          },
        },
      })

      if (conflictCostItem) {
        throw new ConflictError(`Cost item dengan nama "${validatedData.name}" sudah ada`)
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name
    }

    // Update cost item
    const updatedCostItem = await this.prisma.costItem.update({
      where: { id: validatedId },
      data: updateData,
    })

    return this.convertPrismaCostItemToCostItem(updatedCostItem)
  }

  /**
   * Get cost items with pagination and filtering
   */
  async getCostItems(query: CostItemQueryParams): Promise<CostItemListResponse> {
    // Query parameters already validated in API handler, provide defaults for safety
    const page = query.page ?? 1
    const limit = query.limit ?? 10
    const search = query.search

    // Build where clause
    const where: Record<string, unknown> = {}

    // Handle search
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit
    const take = limit

    // Execute queries in parallel
    const [costItems, total] = await Promise.all([
      this.prisma.costItem.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      this.prisma.costItem.count({ where }),
    ])

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit)

    return {
      costItems: costItems.map((costItem: Record<string, unknown>) =>
        this.convertPrismaCostItemToCostItem(costItem),
      ),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  }

  /**
   * Get a single cost item by ID
   */
  async getCostItemById(id: string): Promise<CostItem> {
    // Validate input
    const { id: validatedId } = costItemParamsSchema.parse({ id })

    const costItem = await this.prisma.costItem.findUnique({
      where: {
        id: validatedId,
      },
    })

    if (!costItem) {
      throw new NotFoundError('Cost item tidak ditemukan')
    }

    return this.convertPrismaCostItemToCostItem(costItem)
  }

  /**
   * Delete a cost item
   */
  async deleteCostItem(id: string): Promise<boolean> {
    // Validate input
    const { id: validatedId } = costItemParamsSchema.parse({ id })

    // Check if cost item exists
    const existingCostItem = await this.prisma.costItem.findUnique({
      where: {
        id: validatedId,
      },
    })

    if (!existingCostItem) {
      throw new NotFoundError('Cost item tidak ditemukan')
    }

    // Check if cost item is being used by any products
    const productsUsingCostItem = await this.prisma.productCost.count({
      where: {
        costItemId: validatedId,
      },
    })

    if (productsUsingCostItem > 0) {
      throw new ConflictError(
        `Cost item tidak dapat dihapus karena sedang digunakan oleh ${productsUsingCostItem} produk`
      )
    }

    // Delete cost item
    await this.prisma.costItem.delete({
      where: { id: validatedId },
    })

    return true
  }

  /**
   * Get all active cost items for dropdown/selection purposes
   */
  async getActiveCostItems(): Promise<CostItem[]> {
    const costItems = await this.prisma.costItem.findMany({
      orderBy: {
        name: 'asc',
      },
    })

    return costItems.map((costItem: Record<string, unknown>) =>
      this.convertPrismaCostItemToCostItem(costItem),
    )
  }

  /**
   * Get cost item usage statistics
   */
  async getCostItemUsage(id: string): Promise<CostItemWithUsage> {
    // Validate input
    const { id: validatedId } = costItemParamsSchema.parse({ id })

    // Get cost item
    const costItem = await this.getCostItemById(validatedId)

    // Get usage statistics
    const [usageCount, totalValue] = await Promise.all([
      this.prisma.productCost.count({
        where: {
          costItemId: validatedId,
        },
      }),
      this.prisma.productCost.aggregate({
        where: {
          costItemId: validatedId,
        },
        _sum: {
          amount: true,
        },
      }),
    ])

    return {
      ...costItem,
      usageCount,
      totalValue: Number(totalValue._sum.amount || 0),
    }
  }

  /**
   * Convert Prisma cost item result to application CostItem type
   */
  private convertPrismaCostItemToCostItem(prismaCostItem: Record<string, unknown>): CostItem {
    return {
      id: prismaCostItem.id as string,
      name: prismaCostItem.name as string,
      createdAt: prismaCostItem.createdAt as Date,
      updatedAt: prismaCostItem.updatedAt as Date,
      createdBy: prismaCostItem.createdBy as string,
    }
  }
}