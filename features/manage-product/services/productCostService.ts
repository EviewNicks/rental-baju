/**
 * ProductCostService - Business Logic Layer
 * Handles product cost management and modal awal calculation
 */

import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import {
  createProductCostSchema,
  updateProductCostSchema,
  productCostParamsSchema,
  costItemParamsSchema,
} from '../lib/validation/costItemSchema'
import { NotFoundError, ConflictError } from '../lib/errors/AppError'
import type {
  ProductCost,
  CreateProductCostRequest,
  UpdateProductCostRequest,
  Product,
} from '../types/costItem'

export class ProductCostService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly userId: string,
  ) {}

  /**
   * Add a cost item to a product
   */
  async addProductCost(productId: string, request: CreateProductCostRequest): Promise<ProductCost> {
    // Validate input
    const { id: validatedProductId } = costItemParamsSchema.parse({ id: productId })
    const validatedData = createProductCostSchema.parse(request)

    // Check if product exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { id: validatedProductId },
    })

    if (!existingProduct) {
      throw new NotFoundError('Produk tidak ditemukan')
    }

    // Check if cost item exists
    const existingCostItem = await this.prisma.costItem.findUnique({
      where: { id: validatedData.costItemId },
    })

    if (!existingCostItem) {
      throw new NotFoundError('Cost item tidak ditemukan')
    }

    // Check if this cost item is already assigned to this product
    const existingProductCost = await this.prisma.productCost.findUnique({
      where: {
        productId_costItemId: {
          productId: validatedProductId,
          costItemId: validatedData.costItemId,
        },
      },
    })

    if (existingProductCost) {
      throw new ConflictError('Cost item sudah ditambahkan ke produk ini')
    }

    // Create product cost
    const prismaProductCost = await this.prisma.productCost.create({
      data: {
        productId: validatedProductId,
        costItemId: validatedData.costItemId,
        amount: new Decimal(validatedData.amount),
        notes: validatedData.notes,
      },
      include: {
        costItem: true,
      },
    })

    // Recalculate modal awal
    await this.recalculateModalAwal(validatedProductId)

    return this.convertPrismaProductCostToProductCost(prismaProductCost)
  }

  /**
   * Update a product cost
   */
  async updateProductCost(id: string, request: UpdateProductCostRequest): Promise<ProductCost> {
    // Validate input
    const { id: validatedId } = productCostParamsSchema.parse({ id })
    const validatedData = updateProductCostSchema.parse(request)

    // Check if product cost exists
    const existingProductCost = await this.prisma.productCost.findUnique({
      where: { id: validatedId },
      include: { costItem: true },
    })

    if (!existingProductCost) {
      throw new NotFoundError('Product cost tidak ditemukan')
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (validatedData.amount !== undefined) {
      updateData.amount = new Decimal(validatedData.amount)
    }

    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes
    }

    // Update product cost
    const updatedProductCost = await this.prisma.productCost.update({
      where: { id: validatedId },
      data: updateData,
      include: {
        costItem: true,
      },
    })

    // Recalculate modal awal
    await this.recalculateModalAwal(existingProductCost.productId)

    return this.convertPrismaProductCostToProductCost(updatedProductCost)
  }

  /**
   * Remove a product cost
   */
  async removeProductCost(id: string): Promise<boolean> {
    // Validate input
    const { id: validatedId } = productCostParamsSchema.parse({ id })

    // Check if product cost exists
    const existingProductCost = await this.prisma.productCost.findUnique({
      where: { id: validatedId },
    })

    if (!existingProductCost) {
      throw new NotFoundError('Product cost tidak ditemukan')
    }

    // Delete product cost
    await this.prisma.productCost.delete({
      where: { id: validatedId },
    })

    // Recalculate modal awal
    await this.recalculateModalAwal(existingProductCost.productId)

    return true
  }

  /**
   * Get all product costs for a product
   */
  async getProductCosts(productId: string): Promise<ProductCost[]> {
    // Validate input
    const { id: validatedProductId } = costItemParamsSchema.parse({ id: productId })

    // Check if product exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { id: validatedProductId },
    })

    if (!existingProduct) {
      throw new NotFoundError('Produk tidak ditemukan')
    }

    const productCosts = await this.prisma.productCost.findMany({
      where: {
        productId: validatedProductId,
      },
      include: {
        costItem: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return productCosts.map((productCost: Record<string, unknown>) =>
      this.convertPrismaProductCostToProductCost(productCost),
    )
  }

  /**
   * Calculate modal awal for a product
   */
  async calculateModalAwal(productId: string): Promise<number> {
    // Validate input
    const { id: validatedProductId } = costItemParamsSchema.parse({ id: productId })

    const result = await this.prisma.productCost.aggregate({
      where: {
        productId: validatedProductId,
      },
      _sum: {
        amount: true,
      },
    })

    return Number(result._sum.amount || 0)
  }

  /**
   * Recalculate and update modal awal for a product
   */
  async recalculateModalAwal(productId: string): Promise<Product> {
    // Calculate new modal awal
    const newModalAwal = await this.calculateModalAwal(productId)

    // Update product with new modal awal
    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: {
        modalAwal: new Decimal(newModalAwal),
        updatedAt: new Date(),
      },
    })

    return this.convertPrismaProductToProduct(updatedProduct)
  }

  /**
   * Add multiple cost items to a product (bulk operation)
   */
  async addProductCosts(productId: string, costs: Array<{ costItemId: string; amount: number; notes?: string }>): Promise<ProductCost[]> {
    const results: ProductCost[] = []
    
    for (const cost of costs) {
      const result = await this.addProductCost(productId, cost)
      results.push(result)
    }
    
    return results
  }

  /**
   * Replace all product costs with new ones
   */
  async replaceProductCosts(productId: string, costs: Array<{ costItemId: string; amount: number; notes?: string }>): Promise<ProductCost[]> {
    // Remove all existing costs
    await this.removeAllProductCosts(productId)
    
    // Add new costs
    if (costs.length > 0) {
      return this.addProductCosts(productId, costs)
    }
    
    return []
  }

  /**
   * Remove all product costs for a product
   */
  async removeAllProductCosts(productId: string): Promise<boolean> {
    // Validate input
    const { id: validatedProductId } = costItemParamsSchema.parse({ id: productId })

    // Remove all product costs
    await this.prisma.productCost.deleteMany({
      where: { productId: validatedProductId },
    })

    return true
  }

  /**
   * Get product with total production cost
   */
  async getProductWithCosts(productId: string): Promise<{
    product: Product
    costs: ProductCost[]
    totalProductionCost: number
  }> {
    // Validate input
    const { id: validatedProductId } = costItemParamsSchema.parse({ id: productId })

    // Get product
    const product = await this.prisma.product.findUnique({
      where: { id: validatedProductId },
    })

    if (!product) {
      throw new NotFoundError('Produk tidak ditemukan')
    }

    // Get costs and calculate total
    const [costs, totalProductionCost] = await Promise.all([
      this.getProductCosts(validatedProductId),
      this.calculateModalAwal(validatedProductId),
    ])

    return {
      product: this.convertPrismaProductToProduct(product),
      costs,
      totalProductionCost,
    }
  }

  /**
   * Convert Prisma product cost result to application ProductCost type
   */
  private convertPrismaProductCostToProductCost(
    prismaProductCost: Record<string, unknown>,
  ): ProductCost {
    const costItem = prismaProductCost.costItem as Record<string, unknown> | undefined

    return {
      id: prismaProductCost.id as string,
      productId: prismaProductCost.productId as string,
      costItemId: prismaProductCost.costItemId as string,
      amount: Number(prismaProductCost.amount as Decimal),
      notes: prismaProductCost.notes as string | undefined,
      createdAt: prismaProductCost.createdAt as Date,
      updatedAt: prismaProductCost.updatedAt as Date,
      costItem: costItem
        ? {
            id: costItem.id as string,
            name: costItem.name as string,
            createdAt: costItem.createdAt as Date,
            updatedAt: costItem.updatedAt as Date,
            createdBy: costItem.createdBy as string,
          }
        : undefined,
    }
  }

  /**
   * Convert Prisma product result to application Product type
   */
  private convertPrismaProductToProduct(prismaProduct: Record<string, unknown>): Product {
    return {
      id: prismaProduct.id as string,
      code: prismaProduct.code as string,
      name: prismaProduct.name as string,
      description: prismaProduct.description as string | null,
      modalAwal: Number(prismaProduct.modalAwal as Decimal),
      imageUrl: prismaProduct.imageUrl as string | null,
      categoryId: prismaProduct.categoryId as string,
      status: prismaProduct.status as string,
      isActive: prismaProduct.isActive as boolean,
      createdAt: prismaProduct.createdAt as Date,
      updatedAt: prismaProduct.updatedAt as Date,
      createdBy: prismaProduct.createdBy as string,
      size: prismaProduct.size as string | null,
      currentPrice: Number(prismaProduct.currentPrice as Decimal),
    }
  }
}