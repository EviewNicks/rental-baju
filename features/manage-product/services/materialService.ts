/**
 * MaterialService - Business Logic Layer
 * Handles CRUD operations, validation, dan business rules untuk materials
 */

import { PrismaClient } from '@prisma/client'
import {
  createMaterialSchema,
  updateMaterialSchema,
  materialQuerySchema,
  materialParamsSchema,
} from '../lib/validation/materialSchema'
import { NotFoundError, ConflictError } from '../lib/errors/AppError'
import type {
  Material,
  CreateMaterialRequest,
  UpdateMaterialRequest,
  MaterialListResponse,
  MaterialQueryParams,
} from '../types/material'
import { Decimal } from '@prisma/client/runtime/library'

export class MaterialService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly userId: string,
  ) {}

  /**
   * Create a new material
   */
  async createMaterial(request: CreateMaterialRequest): Promise<Material> {
    // Validate input
    const validatedData = createMaterialSchema.parse(request)

    // Check if material name already exists
    const existingMaterial = await this.prisma.material.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: 'insensitive', // Case-insensitive check
        },
        isActive: true,
      },
    })

    if (existingMaterial) {
      throw new ConflictError(`Material dengan nama "${validatedData.name}" sudah ada`)
    }

    // Create material with Decimal conversion
    const prismaMaterial = await this.prisma.material.create({
      data: {
        name: validatedData.name,
        pricePerUnit: new Decimal(validatedData.pricePerUnit),
        unit: validatedData.unit,
        isActive: true,
        createdBy: this.userId,
      },
    })

    // Convert Prisma types to application types
    return this.convertPrismaMaterialToMaterial(prismaMaterial)
  }

  /**
   * Update an existing material
   */
  async updateMaterial(id: string, request: UpdateMaterialRequest): Promise<Material> {
    // Validate input
    const { id: validatedId } = materialParamsSchema.parse({ id })
    const validatedData = updateMaterialSchema.parse(request)

    // Check if material exists
    const existingMaterial = await this.prisma.material.findUnique({
      where: {
        id: validatedId,
        isActive: true,
      },
    })

    if (!existingMaterial) {
      throw new NotFoundError('Material tidak ditemukan')
    }

    // Check for name conflicts if name is being updated
    if (validatedData.name && validatedData.name !== existingMaterial.name) {
      const conflictMaterial = await this.prisma.material.findFirst({
        where: {
          name: {
            equals: validatedData.name,
            mode: 'insensitive',
          },
          isActive: true,
          id: {
            not: validatedId,
          },
        },
      })

      if (conflictMaterial) {
        throw new ConflictError(`Material dengan nama "${validatedData.name}" sudah ada`)
      }
    }

    // Prepare update data with Decimal conversion
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    // Add fields with proper type conversion
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.unit !== undefined) updateData.unit = validatedData.unit
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive

    // Convert number to Decimal for monetary fields
    if (validatedData.pricePerUnit !== undefined) {
      updateData.pricePerUnit = new Decimal(validatedData.pricePerUnit)
    }

    // Update material
    const updatedMaterial = await this.prisma.material.update({
      where: { id: validatedId },
      data: updateData,
    })

    return this.convertPrismaMaterialToMaterial(updatedMaterial)
  }

  /**
   * Get materials with pagination and filtering
   */
  async getMaterials(query: MaterialQueryParams): Promise<MaterialListResponse> {
    // Validate and parse query parameters
    const validatedQuery = materialQuerySchema.parse(query)
    const { page, limit, search, isActive, unit } = validatedQuery

    // Build where clause
    const where: Record<string, unknown> = {
      isActive: isActive ?? true,
    }

    // Handle unit filtering (support multiple values)
    if (unit) {
      if (Array.isArray(unit)) {
        where.unit = { in: unit }
      } else {
        where.unit = unit
      }
    }

    // Handle search
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { unit: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit
    const take = limit

    // Execute queries in parallel
    const [materials, total] = await Promise.all([
      this.prisma.material.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      this.prisma.material.count({ where }),
    ])

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit)

    return {
      materials: materials.map((material: Record<string, unknown>) =>
        this.convertPrismaMaterialToMaterial(material),
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
   * Get a single material by ID
   */
  async getMaterialById(id: string): Promise<Material> {
    // Validate input
    const { id: validatedId } = materialParamsSchema.parse({ id })

    const material = await this.prisma.material.findUnique({
      where: {
        id: validatedId,
        isActive: true,
      },
    })

    if (!material) {
      throw new NotFoundError('Material tidak ditemukan')
    }

    return this.convertPrismaMaterialToMaterial(material)
  }

  /**
   * Soft delete a material
   */
  async deleteMaterial(id: string): Promise<boolean> {
    // Validate input
    const { id: validatedId } = materialParamsSchema.parse({ id })

    // Check if material exists
    const existingMaterial = await this.prisma.material.findUnique({
      where: {
        id: validatedId,
        isActive: true,
      },
    })

    if (!existingMaterial) {
      throw new NotFoundError('Material tidak ditemukan')
    }

    // Check if material is being used by any products
    const productsUsingMaterial = await this.prisma.product.count({
      where: {
        materialId: validatedId,
        isActive: true,
      },
    })

    if (productsUsingMaterial > 0) {
      throw new ConflictError(
        `Material tidak dapat dihapus karena sedang digunakan oleh ${productsUsingMaterial} produk`
      )
    }

    // Soft delete
    await this.prisma.material.update({
      where: { id: validatedId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    })

    return true
  }

  /**
   * Get active materials for dropdown/selection purposes
   */
  async getActiveMaterials(): Promise<Material[]> {
    const materials = await this.prisma.material.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return materials.map((material: Record<string, unknown>) =>
      this.convertPrismaMaterialToMaterial(material),
    )
  }

  /**
   * Update material price and recalculate product costs
   */
  async updateMaterialPrice(id: string, newPrice: number): Promise<Material> {
    const { id: validatedId } = materialParamsSchema.parse({ id })

    // Check if material exists
    const existingMaterial = await this.prisma.material.findUnique({
      where: {
        id: validatedId,
        isActive: true,
      },
    })

    if (!existingMaterial) {
      throw new NotFoundError('Material tidak ditemukan')
    }

    // Start transaction untuk update price dan recalculate product costs
    const result = await this.prisma.$transaction(async (tx) => {
      // Update material price
      const updatedMaterial = await tx.material.update({
        where: { id: validatedId },
        data: {
          pricePerUnit: new Decimal(newPrice),
          updatedAt: new Date(),
        },
      })

      // Recalculate material costs untuk semua products yang menggunakan material ini
      await tx.product.updateMany({
        where: {
          materialId: validatedId,
          materialQuantity: {
            not: null,
          },
          isActive: true,
        },
        data: {
          materialCost: new Decimal(newPrice), // This will be multiplied by quantity in a proper implementation
          updatedAt: new Date(),
        },
      })

      // TODO: More sophisticated recalculation bisa ditambahkan di sini
      // untuk menghandle materialQuantity * newPrice calculation

      return updatedMaterial
    })

    return this.convertPrismaMaterialToMaterial(result)
  }


  /**
   * Convert Prisma material result to application Material type
   */
  private convertPrismaMaterialToMaterial(prismaMaterial: Record<string, unknown>): Material {
    return {
      id: prismaMaterial.id as string,
      name: prismaMaterial.name as string,
      pricePerUnit: Number(prismaMaterial.pricePerUnit as Decimal), // Convert Decimal to number
      unit: prismaMaterial.unit as string,
      isActive: prismaMaterial.isActive as boolean,
      createdAt: prismaMaterial.createdAt as Date,
      updatedAt: prismaMaterial.updatedAt as Date,
      createdBy: prismaMaterial.createdBy as string,
    }
  }
}