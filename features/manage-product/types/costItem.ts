/**
 * Cost Item Types - Simplified Cost Management
 * Menggantikan Material dengan sistem yang lebih fleksibel
 */

// ============== CORE COST ITEM TYPES ==============

/**
 * CostItem - Item biaya produksi (Material, Transport, Penjahit, dll)
 * Ultra-simplified: hanya nama dan audit fields
 */
export interface CostItem {
  id: string
  name: string           // "Kain Katun Premium", "Transport Jakarta", "Penjahit Budi"
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

/**
 * ProductCost - Biaya yang digunakan dalam produk tertentu
 * User input: pilih cost item + input jumlah biaya
 */
export interface ProductCost {
  id: string
  productId: string
  costItemId: string
  costItem?: CostItem    // Optional populated cost item data
  amount: number         // Jumlah biaya yang digunakan (user input langsung)
  notes?: string         // Catatan opsional
  createdAt: Date
  updatedAt: Date
}

// ============== REQUEST/RESPONSE TYPES ==============

/**
 * Request untuk membuat cost item baru
 * Ultra-simplified: hanya nama
 */
export interface CreateCostItemRequest {
  name: string
}

/**
 * Request untuk update cost item
 */
export interface UpdateCostItemRequest {
  name?: string
}

/**
 * Query parameters untuk list cost items
 */
export interface CostItemQueryParams {
  page?: number
  limit?: number
  search?: string        // Search by name only
}

/**
 * Response untuk list cost items dengan pagination
 */
export interface CostItemListResponse {
  costItems: CostItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * Request untuk membuat product cost baru
 */
export interface CreateProductCostRequest {
  costItemId: string
  amount: number         // Langsung input jumlah biaya
  notes?: string
}

/**
 * Request untuk update product cost
 */
export interface UpdateProductCostRequest {
  amount?: number
  notes?: string
}

// ============== FORM DATA TYPES ==============

/**
 * Form data untuk cost item form
 * Ultra-simplified: hanya nama
 */
export interface CostItemFormData {
  name: string
}

/**
 * Form data untuk product cost selection
 * User langsung input jumlah biaya
 */
export interface ProductCostFormData {
  costItemId: string
  amount: number         // Langsung input jumlah biaya
  notes?: string
}

// ============== BACKWARD COMPATIBILITY ==============

/**
 * Material interface - untuk backward compatibility
 * @deprecated Use CostItem instead
 */
export interface Material {
  id: string
  name: string
  pricePerUnit: number
  unit: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

/**
 * Converter dari Material ke CostItem
 * Hanya ambil nama, hilangkan price dan unit
 */
export function materialToCostItem(material: Material): CostItem {
  return {
    id: material.id,
    name: material.name,
    createdAt: material.createdAt,
    updatedAt: material.updatedAt,
    createdBy: material.createdBy,
  }
}

/**
 * Converter dari CostItem ke Material (untuk backward compatibility)
 * Set default values untuk field yang hilang
 */
export function costItemToMaterial(costItem: CostItem): Material {
  return {
    id: costItem.id,
    name: costItem.name,
    pricePerUnit: 0, // Default value
    unit: 'unit', // Default unit
    createdAt: costItem.createdAt,
    updatedAt: costItem.updatedAt,
    createdBy: costItem.createdBy,
  }
}

// ============== UTILITY TYPES ==============

/**
 * Cost item dengan usage count dalam products
 */
export interface CostItemWithUsage extends CostItem {
  usageCount: number
  totalValue: number     // Total amount used across all products
}

/**
 * Product dengan total production cost
 */
export interface ProductWithCosts {
  productId: string
  productName: string
  costs: ProductCost[]
  totalProductionCost: number
}

/**
 * Product interface for ProductCostService
 * Simplified version focusing on cost-related fields
 */
export interface Product {
  id: string
  code: string
  name: string
  description: string | null
  modalAwal: number
  imageUrl: string | null
  categoryId: string
  status: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  size: string | null
  currentPrice: number
}