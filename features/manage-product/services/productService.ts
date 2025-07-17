import { PrismaClient, Prisma, ProductStatus } from '@prisma/client'
import { productSchema, updateProductSchema } from '../lib/validation/productSchema'
import { CreateProductRequest, UpdateProductRequest } from '../types'
import { logger } from '../../../services/logger'

export const ERROR_MESSAGES = {
  DATABASE_CONNECTION: 'Gagal mengambil daftar produk',
  UNIQUE_CONSTRAINT: 'Kode produk sudah digunakan',
  CATEGORY_NOT_FOUND: 'Kategori tidak ditemukan',
  VALIDATION_FAILED: 'Validasi produk gagal',
}

export class ProductService {
  private prisma: PrismaClient
  private log = logger.child('ProductService')

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Mendapatkan daftar produk dengan pagination dan filter
   *
   * @param params - Parameter untuk filtering dan pagination produk
   * @param params.page - Halaman yang diminta
   * @param params.limit - Jumlah produk per halaman
   * @param params.search - Pencarian berdasarkan nama atau kode produk
   * @param params.categoryId - Filter berdasarkan ID kategori
   * @param params.status - Filter berdasarkan status produk
   * @param params.isActive - Filter berdasarkan status aktif produk
   *
   * @returns Objek berisi daftar produk dan informasi pagination
   * @throws {Error} Jika gagal mengambil daftar produk dari database
   */
  async getProducts(params: {
    page: number
    limit: number
    search?: string
    categoryId?: string
    status?: ProductStatus
    isActive?: boolean
  }) {
    try {
      const where: Prisma.ProductWhereInput = {
        ...(params.search && {
          OR: [
            { name: { contains: params.search, mode: 'insensitive' } },
            { code: { contains: params.search, mode: 'insensitive' } },
          ],
        }),
        ...(params.categoryId && { categoryId: params.categoryId }),
        ...(params.status && { status: params.status }),
        ...(params.isActive !== undefined && { isActive: params.isActive }),
      }

      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          take: params.limit,
          skip: (params.page - 1) * params.limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.product.count({ where }),
      ])

      return {
        products,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages: Math.ceil(total / params.limit),
        },
      }
    } catch (error) {
      this.log.error('getProducts', 'Gagal mengambil daftar produk', { error })
      throw new Error(ERROR_MESSAGES.DATABASE_CONNECTION)
    }
  }

  /**
   * Mendapatkan detail produk berdasarkan ID
   *
   * @param id - ID unik produk yang dicari
   * @returns Objek produk dengan detail kategori
   * @throws {Error} Jika produk tidak ditemukan atau gagal mengambil data
   */
  async getProductById(id: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: { category: true },
      })

      if (!product) {
        this.log.warn('getProductById', `Product not found with id: ${id}`)
        throw new Error('Produk tidak ditemukan')
      }

      return product
    } catch (error) {
      this.log.error('getProductById', 'Failed to retrieve product', { error })
      throw error
    }
  }

  /**
   * Membuat produk baru dengan validasi dan logika bisnis
   *
   * @param data - Data produk yang akan dibuat
   * @param createdBy - ID pengguna yang membuat produk
   * @returns Produk yang berhasil dibuat
   * @throws {Error} Jika validasi gagal, kategori tidak ditemukan, atau kode produk sudah digunakan
   */
  async createProduct(data: CreateProductRequest, createdBy: string) {
    try {
      // Cek kategori terlebih dahulu
      const category = await this.prisma.category.findUnique({
        where: { id: data.categoryId },
      })

      if (!category) {
        this.log.warn('createProduct', `Kategori tidak ditemukan: ${data.categoryId}`)
        throw new Error(ERROR_MESSAGES.CATEGORY_NOT_FOUND)
      }

      // Cek kode unik sebelum validasi skema
      const exists = await this.prisma.product.findUnique({
        where: { code: data.code },
      })

      if (exists) {
        this.log.warn('createProduct', `Kode produk sudah digunakan: ${data.code}`)
        throw new Error(ERROR_MESSAGES.UNIQUE_CONSTRAINT)
      }

      // Validasi skema input
      const parsed = productSchema.safeParse(data)
      if (!parsed.success) {
        this.log.warn('createProduct', 'Validasi produk gagal', {
          errors: parsed.error.errors,
        })
        throw new Error(ERROR_MESSAGES.VALIDATION_FAILED)
      }

      // Buat produk
      const product = await this.prisma.product.create({
        data: {
          ...data,
          createdBy,
          status: ProductStatus.AVAILABLE,
          isActive: true,
        },
      })

      return product
    } catch (error) {
      // Tangani error transaksi atau validasi
      if (error instanceof Error) {
        this.log.error('createProduct', 'Gagal membuat produk', { error })
        throw error
      }

      // Jika error tidak dikenali
      this.log.error('createProduct', 'Kesalahan tidak diketahui', { error })
      throw new Error('Gagal membuat produk')
    }
  }

  /**
   * Memperbarui detail produk yang sudah ada
   *
   * @param id - ID produk yang akan diperbarui
   * @param data - Data produk yang akan diupdate
   * @returns Produk yang berhasil diperbarui
   * @throws {Error} Jika validasi gagal, produk tidak ditemukan, atau kode produk sudah digunakan
   */
  async updateProduct(id: string, data: UpdateProductRequest) {
    try {
      const parsed = updateProductSchema.safeParse(data)
      if (!parsed.success) {
        this.log.warn('updateProduct', 'Validation failed', { errors: parsed.error.errors })
        throw new Error(ERROR_MESSAGES.VALIDATION_FAILED)
      }

      const product = await this.prisma.product.findUnique({ where: { id } })
      if (!product) {
        this.log.warn('updateProduct', `Product not found: ${id}`)
        throw new Error('Produk tidak ditemukan')
      }

      if (parsed.data.code) {
        const exists = await this.prisma.product.findUnique({
          where: { code: parsed.data.code },
        })
        if (exists && exists.id !== id) {
          this.log.warn('updateProduct', `Product code already exists: ${parsed.data.code}`)
          throw new Error(ERROR_MESSAGES.UNIQUE_CONSTRAINT)
        }
      }

      if (parsed.data.categoryId) {
        const category = await this.prisma.category.findUnique({
          where: { id: parsed.data.categoryId },
        })
        if (!category) {
          this.log.warn('updateProduct', `Category not found: ${parsed.data.categoryId}`)
          throw new Error(ERROR_MESSAGES.CATEGORY_NOT_FOUND)
        }
      }

      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          ...parsed.data,
          updatedAt: new Date(),
        },
        include: { category: true },
      })

      return updatedProduct
    } catch (error) {
      this.log.error('updateProduct', 'Failed to update product', { error })
      throw error
    }
  }

  /**
   * Menghapus produk secara soft delete
   *
   * @param id - ID produk yang akan dihapus
   * @returns Boolean yang menandakan keberhasilan operasi
   * @throws {Error} Jika produk tidak ditemukan
   */
  async deleteProduct(id: string) {
    try {
      const product = await this.prisma.product.findUnique({ where: { id } })
      if (!product) {
        this.log.warn('deleteProduct', `Product not found: ${id}`)
        throw new Error('Produk tidak ditemukan')
      }

      await this.prisma.product.update({
        where: { id },
        data: {
          isActive: false,
          status: 'MAINTENANCE',
          updatedAt: new Date(),
        },
      })

      return true
    } catch (error) {
      this.log.error('deleteProduct', 'Failed to delete product', { error })
      throw error
    }
  }

  /**
   * Memvalidasi keunikan kode produk
   *
   * @param code - Kode produk yang akan divalidasi
   * @param excludeId - ID produk yang dikecualikan dari pengecekan (opsional, untuk update)
   * @returns Boolean yang menandakan apakah kode produk unik
   * @throws {Error} Jika gagal memvalidasi kode produk
   */
  async validateProductCode(code: string, excludeId?: string) {
    try {
      const exists = await this.prisma.product.findUnique({ where: { code } })

      if (!exists) return true
      if (excludeId && exists.id === excludeId) return true

      return false
    } catch (error) {
      this.log.error('validateProductCode', 'Failed to validate product code', { error })
      throw new Error('Gagal memvalidasi kode produk')
    }
  }

  /**
   * Memperbarui status produk
   *
   * @param id - ID produk yang akan diperbarui statusnya
   * @param status - Status baru untuk produk
   * @returns Produk dengan status yang diperbarui
   * @throws {Error} Jika produk tidak ditemukan
   */
  async updateProductStatus(id: string, status: ProductStatus) {
    try {
      const product = await this.prisma.product.findUnique({ where: { id } })
      if (!product) {
        this.log.warn('updateProductStatus', `Product not found: ${id}`)
        throw new Error('Produk tidak ditemukan')
      }

      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date(),
        },
        include: { category: true },
      })

      return updatedProduct
    } catch (error) {
      this.log.error('updateProductStatus', 'Failed to update product status', { error })
      throw error
    }
  }

  /**
   * Memperbarui total pendapatan produk
   *
   * @param id - ID produk yang akan diperbarui total pendapatannya
   * @param amount - Jumlah pendapatan baru
   * @returns Produk dengan total pendapatan yang diperbarui
   * @throws {Error} Jika produk tidak ditemukan
   */
  async updateTotalPendapatan(id: string, amount: number) {
    try {
      const product = await this.prisma.product.findUnique({ where: { id } })
      if (!product) {
        this.log.warn('updateTotalPendapatan', `Product not found: ${id}`)
        throw new Error('Produk tidak ditemukan')
      }

      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          totalPendapatan: amount,
          updatedAt: new Date(),
        },
        include: { category: true },
      })

      return updatedProduct
    } catch (error) {
      this.log.error('updateTotalPendapatan', 'Failed to update total pendapatan', { error })
      throw error
    }
  }
}
