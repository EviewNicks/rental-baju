import { z } from 'zod'

export const productSchema = z.object({
  code: z
    .string()
    .min(1, 'Kode produk wajib diisi')
    .max(4, 'Kode maksimal 4 karakter')
    .regex(/^[A-Z0-9]{4}$/, 'Kode harus 4 digit alfanumerik uppercase'),
  name: z.string().min(1, 'Nama produk wajib diisi').max(100, 'Nama maksimal 100 karakter'),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional(),
  modalAwal: z
    .number()
    .positive('Modal awal harus positif')
    .max(999999999, 'Modal maksimal 999,999,999'),
  hargaSewa: z
    .number()
    .positive('Harga sewa harus positif')
    .max(999999999, 'Harga sewa maksimal 999,999,999'),
  quantity: z.number().int().min(0, 'Jumlah minimal 0').max(9999, 'Jumlah maksimal 9999'),
  categoryId: z.string().uuid('ID kategori tidak valid'),
})

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Nama kategori wajib diisi')
    .max(50, 'Nama kategori maksimal 50 karakter'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Warna harus dalam format hex (#RRGGBB)'),
})

export const updateCategorySchema = categorySchema.partial()

export const updateProductSchema = productSchema.partial()
