/**
 * CategoryService - Business Logic Layer
 * Handles CRUD operations, validation, and business rules for categories
 */

import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import {
  categorySchema,
  updateCategorySchema,
  categoryQuerySchema,
  categoryParamsSchema,
} from '../lib/validation/productSchema'
import { NotFoundError, ConflictError } from '../lib/errors/AppError'
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  ProductStatus,
} from '../types'

export class CategoryService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly userId: string,
  ) {}

  /**
   * Create a new category
   */
  async createCategory(request: CreateCategoryRequest): Promise<Category> {
    // Validate input
    const validatedData = categorySchema.parse(request)

    // Check if category name already exists (case-insensitive)
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: 'insensitive',
        },
      },
    })

    if (existingCategory) {
      throw new ConflictError(`Nama kategori "${validatedData.name}" sudah digunakan`)
    }

    // Create category
    const category = await this.prisma.category.create({
      data: {
        name: validatedData.name,
        color: validatedData.color,
        createdBy: this.userId,
      },
    })

    return this.convertPrismaCategoryToCategory(category)
  }

  /**
   * Update an existing category
   */
  async updateCategory(id: string, request: UpdateCategoryRequest): Promise<Category> {
    // Validate input
    const { id: validatedId } = categoryParamsSchema.parse({ id })
    const validatedData = updateCategorySchema.parse(request)

    // Check if category exists
    const existingCategory = await this.prisma.category.findUnique({
      where: { id: validatedId },
    })

    if (!existingCategory) {
      throw new NotFoundError('Kategori tidak ditemukan')
    }

    // Check for name conflicts if name is being updated
    if (validatedData.name) {
      const conflictingCategory = await this.prisma.category.findFirst({
        where: {
          name: {
            equals: validatedData.name,
            mode: 'insensitive',
          },
          id: { not: validatedId },
        },
      })

      if (conflictingCategory) {
        throw new ConflictError(`Nama kategori "${validatedData.name}" sudah digunakan`)
      }
    }

    // Update category
    const updatedCategory = await this.prisma.category.update({
      where: { id: validatedId },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
    })

    return this.convertPrismaCategoryToCategory(updatedCategory)
  }

  /**
   * Get categories with optional product inclusion and search
   */
  async getCategories(query: Record<string, unknown> = {}): Promise<Category[]> {
    // Validate and parse query parameters
    const validatedQuery = categoryQuerySchema.parse(query)
    const { search, includeProducts } = validatedQuery

    // Build where clause
    const where: Record<string, unknown> = {}

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      }
    }

    // Get categories
    const categories = await this.prisma.category.findMany({
      where,
      include: {
        products: includeProducts,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return categories.map((category: Record<string, unknown>) =>
      this.convertPrismaCategoryToCategory(category),
    )
  }

  /**
   * Get a single category by ID
   */
  async getCategoryById(id: string): Promise<Category> {
    // Validate input
    const { id: validatedId } = categoryParamsSchema.parse({ id })

    const category = await this.prisma.category.findUnique({
      where: { id: validatedId },
      include: {
        products: true,
      },
    })

    if (!category) {
      throw new NotFoundError('Kategori tidak ditemukan')
    }

    return this.convertPrismaCategoryToCategory(category)
  }

  /**
   * Delete a category (hard delete with dependency check)
   */
  async deleteCategory(id: string): Promise<boolean> {
    // Validate input
    const { id: validatedId } = categoryParamsSchema.parse({ id })

    // Check if category exists and get active products
    const categoryWithProducts = await this.prisma.category.findUnique({
      where: { id: validatedId },
      include: {
        products: {
          where: { isActive: true },
        },
      },
    })

    if (!categoryWithProducts) {
      throw new NotFoundError('Kategori tidak ditemukan')
    }

    // Check if category has active products
    if (categoryWithProducts.products.length > 0) {
      throw new ConflictError(
        `Kategori tidak dapat dihapus karena masih memiliki ${categoryWithProducts.products.length} produk aktif`,
      )
    }

    // Delete category
    await this.prisma.category.delete({
      where: { id: validatedId },
    })

    return true
  }

  /**
   * Convert Prisma category result to application Category type
   */
  private convertPrismaCategoryToCategory(prismaCategory: Record<string, unknown>): Category {
    return {
      id: prismaCategory.id as string,
      name: prismaCategory.name as string,
      color: prismaCategory.color as string,
      products: prismaCategory.products
        ? (prismaCategory.products as Record<string, unknown>[]).map(
            (product: Record<string, unknown>) => ({
              id: product.id as string,
              code: product.code as string,
              name: product.name as string,
              description: product.description as string,
              categoryId: product.categoryId as string,
              category: {} as Category, // Avoid circular reference
              modalAwal: new Decimal(product.modalAwal as number),
              hargaSewa: new Decimal(product.hargaSewa as number),
              quantity: product.quantity as number,
              status: product.status as ProductStatus,
              imageUrl: product.imageUrl as string | undefined,
              totalPendapatan: new Decimal(product.totalPendapatan as number),
              isActive: product.isActive as boolean,
              createdAt: product.createdAt as Date,
              updatedAt: product.updatedAt as Date,
              createdBy: product.createdBy as string,
            }),
          )
        : [],
      createdAt: prismaCategory.createdAt as Date,
      updatedAt: prismaCategory.updatedAt as Date,
      createdBy: prismaCategory.createdBy as string,
    }
  }
}
