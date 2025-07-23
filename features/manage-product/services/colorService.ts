/**
 * ColorService - Business Logic Layer
 * Handles CRUD operations, validation, and business rules for colors
 */

import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import {
  colorSchema,
  updateColorSchema,
  colorQuerySchema,
  colorParamsSchema,
} from '../lib/validation/productSchema'
import { NotFoundError, ConflictError } from '../lib/errors/AppError'
import type { Color, CreateColorRequest, UpdateColorRequest, ProductStatus } from '../types'

export class ColorService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly userId: string,
  ) {}

  /**
   * Create a new color
   */
  async createColor(request: CreateColorRequest): Promise<Color> {
    // Validate input
    const validatedData = colorSchema.parse(request)

    // Check if color name already exists (case-insensitive)
    const existingColor = await this.prisma.color.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: 'insensitive',
        },
        isActive: true, // Only check against active colors
      },
    })

    if (existingColor) {
      throw new ConflictError(`Nama warna "${validatedData.name}" sudah digunakan`)
    }

    // Create color
    const color = await this.prisma.color.create({
      data: {
        name: validatedData.name,
        hexCode: validatedData.hexCode,
        description: validatedData.description,
        isActive: true,
        createdBy: this.userId,
      },
    })

    return this.convertPrismaColorToColor(color)
  }

  /**
   * Update an existing color
   */
  async updateColor(id: string, request: UpdateColorRequest): Promise<Color> {
    // Validate input
    const { id: validatedId } = colorParamsSchema.parse({ id })
    const validatedData = updateColorSchema.parse(request)

    // Check if color exists
    const existingColor = await this.prisma.color.findUnique({
      where: { id: validatedId },
    })

    if (!existingColor) {
      throw new NotFoundError('Warna tidak ditemukan')
    }

    // Check for name conflicts if name is being updated
    if (validatedData.name) {
      const conflictingColor = await this.prisma.color.findFirst({
        where: {
          name: {
            equals: validatedData.name,
            mode: 'insensitive',
          },
          id: { not: validatedId },
          isActive: true, // Only check against active colors
        },
      })

      if (conflictingColor) {
        throw new ConflictError(`Nama warna "${validatedData.name}" sudah digunakan`)
      }
    }

    // Update color
    const updatedColor = await this.prisma.color.update({
      where: { id: validatedId },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
    })

    return this.convertPrismaColorToColor(updatedColor)
  }

  /**
   * Get colors with optional product inclusion and search
   */
  async getColors(query: Record<string, unknown> = {}): Promise<Color[]> {
    // Validate and parse query parameters
    const validatedQuery = colorQuerySchema.parse(query)
    const { search, isActive, includeProducts } = validatedQuery

    // Build where clause
    const where: Record<string, unknown> = {
      isActive: isActive ?? true,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get colors
    const colors = await this.prisma.color.findMany({
      where,
      include: {
        products: includeProducts
          ? {
              where: { isActive: true },
              include: { category: true },
            }
          : false,
      },
      orderBy: [{ name: 'asc' }],
    })

    return colors.map((color) => this.convertPrismaColorToColor(color))
  }

  /**
   * Get a single color by ID
   */
  async getColorById(id: string): Promise<Color> {
    // Validate input
    const { id: validatedId } = colorParamsSchema.parse({ id })

    const color = await this.prisma.color.findUnique({
      where: { id: validatedId },
      include: {
        products: {
          where: { isActive: true },
          include: { category: true },
        },
      },
    })

    if (!color) {
      throw new NotFoundError('Warna tidak ditemukan')
    }

    return this.convertPrismaColorToColor(color)
  }

  /**
   * Soft delete a color (with dependency check)
   */
  async deleteColor(id: string): Promise<boolean> {
    // Validate input
    const { id: validatedId } = colorParamsSchema.parse({ id })

    // Check if color exists and get active products
    const colorWithProducts = await this.prisma.color.findUnique({
      where: { id: validatedId },
      include: {
        products: {
          where: { isActive: true },
        },
      },
    })

    if (!colorWithProducts) {
      throw new NotFoundError('Warna tidak ditemukan')
    }

    // Check if color has active products
    if (colorWithProducts.products.length > 0) {
      throw new ConflictError(
        `Warna tidak dapat dihapus karena masih memiliki ${colorWithProducts.products.length} produk aktif`,
      )
    }

    // Soft delete color
    await this.prisma.color.update({
      where: { id: validatedId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    })

    return true
  }

  /**
   * Convert Prisma color result to application Color type
   */
  private convertPrismaColorToColor(prismaColor: Record<string, unknown>): Color {
    return {
      id: prismaColor.id as string,
      name: prismaColor.name as string,
      hexCode: prismaColor.hexCode as string | undefined,
      description: prismaColor.description as string | undefined,
      isActive: prismaColor.isActive as boolean,
      products: prismaColor.products
        ? (prismaColor.products as Record<string, unknown>[]).map(
            (product: Record<string, unknown>) => ({
              id: product.id as string,
              code: product.code as string,
              name: product.name as string,
              description: product.description as string,
              categoryId: product.categoryId as string,
              size: product.size as string | undefined,
              colorId: product.colorId as string | undefined,
              category: product.category
                ? {
                    id: (product.category as Record<string, unknown>).id as string,
                    name: (product.category as Record<string, unknown>).name as string,
                    color: (product.category as Record<string, unknown>).color as string,
                    products: [], // Avoid circular reference
                    createdAt: (product.category as Record<string, unknown>).createdAt as Date,
                    updatedAt: (product.category as Record<string, unknown>).updatedAt as Date,
                    createdBy: (product.category as Record<string, unknown>).createdBy as string,
                  }
                : // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ({} as any),
              color: undefined, // Avoid circular reference
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
      createdAt: prismaColor.createdAt as Date,
      updatedAt: prismaColor.updatedAt as Date,
      createdBy: prismaColor.createdBy as string,
    }
  }
}
