import { PrismaClient } from '@prisma/client'
import { categorySchema, updateCategorySchema } from '../lib/validation/productSchema'
import { CreateCategoryRequest, UpdateCategoryRequest } from '../types'
import { logger } from '../../../services/logger'

export const ERROR_MESSAGES = {
  DATABASE_CONNECTION: 'Gagal mengambil daftar kategori',
  UNIQUE_CONSTRAINT: 'Nama kategori sudah digunakan',
  CATEGORY_IN_USE: 'Kategori masih digunakan oleh produk aktif',
  VALIDATION_FAILED: 'Validasi kategori gagal',
}

export class CategoryService {
  private prisma: PrismaClient
  private log = logger.child('CategoryService')

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Mendapatkan daftar semua kategori produk
   *
   * @returns Daftar kategori beserta produk yang terkait
   * @throws {Error} Jika gagal mengambil daftar kategori dari database
   */
  async getCategories() {
    try {
      const categories = await this.prisma.category.findMany({
        include: { products: true },
        orderBy: { createdAt: 'desc' },
      })

      return categories
    } catch (error) {
      this.log.error('getCategories', 'Gagal mengambil daftar kategori', { error })
      throw new Error(ERROR_MESSAGES.DATABASE_CONNECTION)
    }
  }

  /**
   * Mendapatkan detail kategori berdasarkan ID
   *
   * @param id - ID unik kategori yang dicari
   * @returns Objek kategori dengan daftar produk terkait, atau null jika tidak ditemukan
   * @throws {Error} Jika gagal mengambil detail kategori
   */
  async getCategoryById(id: string) {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id },
        include: { products: true },
      })

      if (!category) {
        this.log.warn('getCategoryById', `Kategori tidak ditemukan: ${id}`)
        return null
      }

      return category
    } catch (error) {
      this.log.error('getCategoryById', 'Gagal mengambil detail kategori', { error })
      throw new Error('Gagal mengambil detail kategori')
    }
  }

  /**
   * Membuat kategori baru dengan validasi
   *
   * @param data - Data kategori yang akan dibuat
   * @param createdBy - ID pengguna yang membuat kategori
   * @returns Kategori yang berhasil dibuat
   * @throws {Error} Jika validasi gagal atau nama kategori sudah digunakan
   */
  async createCategory(data: CreateCategoryRequest, createdBy: string) {
    // Validasi skema input
    const parsed = categorySchema.safeParse(data)
    if (!parsed.success) {
      this.log.warn('createCategory', 'Validasi kategori gagal', {
        errors: parsed.error.errors,
      })
      throw new Error(ERROR_MESSAGES.VALIDATION_FAILED)
    }

    // Cek keunikan nama kategori
    const exists = await this.prisma.category.findUnique({
      where: { name: data.name },
    })

    if (exists) {
      this.log.warn('createCategory', `Nama kategori sudah digunakan: ${data.name}`)
      throw new Error(ERROR_MESSAGES.UNIQUE_CONSTRAINT)
    }

    try {
      const category = await this.prisma.category.create({
        data: {
          ...data,
          createdBy,
        },
      })

      return category
    } catch (error) {
      this.log.error('createCategory', 'Gagal membuat kategori', { error })
      throw error
    }
  }

  /**
   * Memperbarui detail kategori yang sudah ada
   *
   * @param id - ID kategori yang akan diperbarui
   * @param data - Data kategori yang akan diupdate
   * @returns Kategori yang berhasil diperbarui
   * @throws {Error} Jika validasi gagal, kategori tidak ditemukan, atau nama kategori sudah digunakan
   */
  async updateCategory(id: string, data: UpdateCategoryRequest) {
    // Validasi skema input
    const parsed = updateCategorySchema.safeParse(data)
    if (!parsed.success) {
      this.log.warn('updateCategory', 'Validasi kategori gagal', {
        errors: parsed.error.errors,
      })
      throw new Error(ERROR_MESSAGES.VALIDATION_FAILED)
    }

    // Cek keberadaan kategori
    const exists = await this.prisma.category.findUnique({ where: { id } })
    if (!exists) {
      this.log.warn('updateCategory', `Kategori tidak ditemukan: ${id}`)
      throw new Error('Kategori tidak ditemukan')
    }

    // Cek keunikan nama kategori
    const nameExists = await this.prisma.category.findUnique({
      where: { name: data.name },
    })

    if (nameExists && nameExists.id !== id) {
      this.log.warn('updateCategory', `Nama kategori sudah digunakan: ${data.name}`)
      throw new Error(ERROR_MESSAGES.UNIQUE_CONSTRAINT)
    }

    try {
      const category = await this.prisma.category.update({
        where: { id },
        data,
      })

      return category
    } catch (error) {
      this.log.error('updateCategory', 'Gagal memperbarui kategori', { error })
      throw error
    }
  }

  /**
   * Menghapus kategori dari database
   *
   * @param id - ID kategori yang akan dihapus
   * @returns Boolean yang menandakan keberhasilan operasi
   * @throws {Error} Jika kategori masih digunakan oleh produk aktif atau gagal menghapus
   */
  async deleteCategory(id: string) {
    // Cek apakah kategori masih digunakan
    const count = await this.prisma.product.count({
      where: {
        categoryId: id,
        isActive: true,
      },
    })

    if (count > 0) {
      this.log.warn('deleteCategory', `Kategori masih digunakan: ${id}`)
      throw new Error(ERROR_MESSAGES.CATEGORY_IN_USE)
    }

    try {
      await this.prisma.category.delete({ where: { id } })
      return true
    } catch (error) {
      this.log.error('deleteCategory', 'Gagal menghapus kategori', { error })
      throw error
    }
  }

  /**
   * Memvalidasi keunikan nama kategori
   *
   * @param name - Nama kategori yang akan divalidasi
   * @param excludeId - ID kategori yang dikecualikan dari pengecekan (opsional, untuk update)
   * @returns Boolean yang menandakan apakah nama kategori unik
   * @throws {Error} Jika gagal memvalidasi nama kategori
   */
  async validateCategoryName(name: string, excludeId?: string) {
    try {
      const exists = await this.prisma.category.findUnique({ where: { name } })

      if (!exists) return true
      if (excludeId && exists.id === excludeId) return true

      return false
    } catch (error) {
      this.log.error('validateCategoryName', 'Gagal memvalidasi nama kategori', { error })
      throw new Error('Gagal memvalidasi nama kategori')
    }
  }

  /**
   * Memeriksa apakah kategori sedang digunakan oleh produk aktif
   *
   * @param id - ID kategori yang akan dicek
   * @returns Boolean yang menandakan apakah kategori sedang digunakan
   * @throws {Error} Jika gagal memeriksa penggunaan kategori
   */
  async isCategoryInUse(id: string) {
    try {
      const count = await this.prisma.product.count({
        where: {
          categoryId: id,
          isActive: true,
        },
      })

      return count > 0
    } catch (error) {
      this.log.error('isCategoryInUse', 'Gagal memeriksa penggunaan kategori', { error })
      throw new Error('Gagal memeriksa penggunaan kategori')
    }
  }
}
