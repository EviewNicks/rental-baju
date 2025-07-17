import { PrismaClient, Prisma, ProductStatus } from '@prisma/client'
import { createProductSchema, updateProductSchema } from '../lib/validation/productSchema'
import { CreateProductRequest, UpdateProductRequest } from '../types'
import { logger } from '../../../services/logger'
import { storageUtils } from '@/lib/supabase'

export const ERROR_MESSAGES = {
  DATABASE_CONNECTION: 'Gagal mengambil daftar produk',
  UNIQUE_CONSTRAINT: 'Kode produk sudah digunakan',
  CATEGORY_NOT_FOUND: 'Kategori tidak ditemukan',
  VALIDATION_FAILED: 'Validasi produk gagal',
  FILE_UPLOAD_FAILED: 'Gagal mengupload file',
  FILE_DELETE_FAILED: 'Gagal menghapus file',
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
   * Mendukung file upload untuk image produk
   *
   * @param data - Data produk yang akan dibuat (bisa berisi File untuk image)
   * @param createdBy - ID pengguna yang membuat produk
   * @returns Produk yang berhasil dibuat
   * @throws {Error} Jika validasi gagal, kategori tidak ditemukan, atau kode produk sudah digunakan
   */
  async createProduct(data: CreateProductRequest & { image?: File }, createdBy: string) {
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

      // Validasi skema input dengan support file upload
      const parsed = createProductSchema.safeParse(data)
      if (!parsed.success) {
        this.log.warn('createProduct', 'Validasi produk gagal', {
          errors: parsed.error.errors,
        })
        throw new Error(ERROR_MESSAGES.VALIDATION_FAILED)
      }

      let imageUrl: string | undefined

      // Upload image jika ada
      if (data.image) {
        try {
          this.log.info('createProduct', 'Uploading product image', {
            fileName: data.image.name,
            fileSize: data.image.size,
          })

          imageUrl = await storageUtils.uploadProductImage(data.image)
          this.log.info('createProduct', 'Image uploaded successfully', { imageUrl })
        } catch (uploadError) {
          this.log.error('createProduct', 'Failed to upload image', { uploadError })
          throw new Error(ERROR_MESSAGES.FILE_UPLOAD_FAILED)
        }
      }

      // Buat produk dengan imageUrl jika ada
      // Pisahkan data produk dari file untuk menghindari serialization error
      const productData = {
        code: parsed.data.code,
        name: parsed.data.name,
        description: parsed.data.description,
        modalAwal: parsed.data.modalAwal,
        hargaSewa: parsed.data.hargaSewa,
        quantity: parsed.data.quantity,
        categoryId: parsed.data.categoryId,
        imageUrl,
        createdBy,
        status: ProductStatus.AVAILABLE,
        isActive: true,
      }

      const product = await this.prisma.product.create({
        data: productData,
        include: { category: true },
      })

      this.log.info('createProduct', 'Product created successfully', { productId: product.id })
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
   * Mendukung file upload untuk image produk
   *
   * @param id - ID produk yang akan diperbarui
   * @param data - Data produk yang akan diupdate (bisa berisi File untuk image)
   * @returns Produk yang berhasil diperbarui
   * @throws {Error} Jika validasi gagal, produk tidak ditemukan, atau kode produk sudah digunakan
   */
  async updateProduct(id: string, data: UpdateProductRequest & { image?: File }) {
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

      let imageUrl: string | undefined = product.imageUrl || undefined
      let oldImagePath: string | null = null

      // Handle image upload jika ada file baru
      if (data.image) {
        try {
          this.log.info('updateProduct', 'Uploading new product image', {
            fileName: data.image.name,
            fileSize: data.image.size,
          })

          // Upload image baru
          imageUrl = await storageUtils.uploadProductImage(data.image)
          this.log.info('updateProduct', 'New image uploaded successfully', { imageUrl })

          // Simpan path image lama untuk cleanup
          if (product.imageUrl) {
            oldImagePath = storageUtils.extractFilePathFromUrl(product.imageUrl)
          }
        } catch (uploadError) {
          this.log.error('updateProduct', 'Failed to upload new image', { uploadError })
          throw new Error(ERROR_MESSAGES.FILE_UPLOAD_FAILED)
        }
      }

      // Update produk
      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          ...parsed.data,
          imageUrl,
          updatedAt: new Date(),
        },
        include: { category: true },
      })

      // Cleanup image lama jika berhasil update
      if (oldImagePath) {
        try {
          await storageUtils.deleteProductImage(oldImagePath)
          this.log.info('updateProduct', 'Old image deleted successfully', { oldImagePath })
        } catch (deleteError) {
          this.log.warn('updateProduct', 'Failed to delete old image', {
            deleteError,
            oldImagePath,
          })
          // Tidak throw error karena ini bukan critical operation
        }
      }

      this.log.info('updateProduct', 'Product updated successfully', { productId: id })
      return updatedProduct
    } catch (error) {
      this.log.error('updateProduct', 'Failed to update product', { error })
      throw error
    }
  }

  /**
   * Menghapus produk secara soft delete
   * Juga menghapus image file dari storage jika ada
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

      // Soft delete produk
      await this.prisma.product.update({
        where: { id },
        data: {
          isActive: false,
          status: 'MAINTENANCE',
          updatedAt: new Date(),
        },
      })

      // Cleanup image file jika ada
      if (product.imageUrl) {
        try {
          const imagePath = storageUtils.extractFilePathFromUrl(product.imageUrl)
          if (imagePath) {
            await storageUtils.deleteProductImage(imagePath)
            this.log.info('deleteProduct', 'Product image deleted successfully', { imagePath })
          }
        } catch (deleteError) {
          this.log.warn('deleteProduct', 'Failed to delete product image', { deleteError })
          // Tidak throw error karena ini bukan critical operation
        }
      }

      this.log.info('deleteProduct', 'Product deleted successfully', { productId: id })
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
