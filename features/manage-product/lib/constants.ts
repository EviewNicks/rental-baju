export const CATEGORIES = ['Semua', 'Dress', 'Kemeja', 'Jas', 'Celana', 'Aksesoris'] as const
export const STATUSES = ['Semua', 'Tersedia', 'Disewa', 'Maintenance', 'Habis'] as const

export const STATUS_COLORS = {
  Tersedia: 'bg-green-100 text-green-800 border-green-200',
  Disewa: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Maintenance: 'bg-red-100 text-red-800 border-red-200',
  Habis: 'bg-gray-100 text-gray-800 border-gray-200',
} as const

export const CATEGORY_COLORS = {
  Dress: 'bg-pink-100 text-pink-800 border-pink-200',
  Kemeja: 'bg-blue-100 text-blue-800 border-blue-200',
  Jas: 'bg-purple-100 text-purple-800 border-purple-200',
  Celana: 'bg-amber-100 text-amber-800 border-amber-200',
  Aksesoris: 'bg-yellow-100 text-yellow-800 border-yellow-200',
} as const
