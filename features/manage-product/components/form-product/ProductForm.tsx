'use client'
import { Hash, Package, Tag, Box, DollarSign, CreditCard, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { FormField } from '@/features/manage-product/components/form-product/FormField'
import { FormSection } from '@/features/manage-product/components/form-product/FormSection'
import { DynamicFormField } from '@/features/manage-product/components/form-product/DynamicFormField'
import { ImageUpload } from '@/features/manage-product/components/products/ImageUpload'
import { CostItemSelector } from '@/features/manage-product/components/cost-items/CostItemSelector'

import { SizeManagementPlaceholder } from '@/features/manage-product/components/form-product/SizeManagementPlaceholder'
import type { CategoryFormData as CategoryFormData } from '@/features/manage-product/lib/strategies/CategoryFormStrategy'
import type {
  ClientCategory,
  ClientProduct,
  AggregatedSizeView,
  SimplifiedSizeEntry,
  CreateProductSizeRequest,
} from '@/features/manage-product/types'
import type { ProductCostFormData } from '@/features/manage-product/types/costItem'
import { useEffect, useCallback, useRef } from 'react'
import { useProductFormStrategy } from '../../hooks/useProductFormStrategy'
import { useUserRole } from '@/features/auth'

interface ProductFormData {
  code: string
  name: string
  categoryId: string
  // Remove material fields - replaced with cost items
  // materialId?: string
  // materialQuantity?: number
  selectedCosts: ProductCostFormData[] // New: multiple cost items
  quantity: number
  modalAwal: number // Auto-calculated from selectedCosts
  currentPrice: number
  description: string
  imageUrl: string | null
  image?: File | null

  // Simplified Size Management (required for all products)
  hasSizes: boolean
  simplifiedSizes?: SimplifiedSizeEntry[]
  aggregatedSizes?: AggregatedSizeView[] // Keep for backward compatibility during transition

  // Dynamic Form Strategy Integration
  categoryFormData?: CategoryFormData // Form data specific to category strategy
}

interface ProductFormProps {
  formData: ProductFormData
  errors: { [key: string]: string | null }
  touched: { [key: string]: boolean }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onInputChange: (name: string, value: any) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onBlur: (name: string, value: any) => void
  formatCurrency: (value: string) => string
  categories: ClientCategory[]

  // Optional product data for size mode detection (edit mode)
  product?: ClientProduct

  // Size management handlers (legacy - kept for backward compatibility)
  onHasSizesChange?: (hasSizes: boolean) => void
  onAggregatedSizesChange?: (sizes: AggregatedSizeView[]) => void
  onSimplifiedSizesChange?: (sizes: SimplifiedSizeEntry[]) => void

  // Dynamic Form Strategy handlers (required for state management)
  onCategoryFormDataChange: (data: CategoryFormData) => void
  onStrategySizesChange?: (sizes: CreateProductSizeRequest[]) => void

  // External category form data (single source of truth from parent)
  categoryFormData: CategoryFormData

  // Cost item handlers (new)
  onCostsChange: (costs: ProductCostFormData[]) => void
  onModalAwalChange: (amount: number) => void
}

export function ProductForm({
  formData,
  errors,
  touched,
  onInputChange,
  onBlur,
  formatCurrency,
  categories,
  product,
  onCategoryFormDataChange,
  onStrategySizesChange,
  categoryFormData: externalCategoryFormData, // External state from parent
  // Cost item handlers
  onCostsChange,
  onModalAwalChange,
}: ProductFormProps) {
  // Get user role from Clerk session
  const { isProducer } = useUserRole()

  // Use ProductFormStrategy hook for centralized strategy management
  const {
    currentStrategy,
    selectedCategory,
    strategyLoading,
    strategyError,
    initializeStrategy,
    transformFormDataToSizes,
    calculateTotalQuantity,
  } = useProductFormStrategy({
    categories,
    product,
  })

  // Use external categoryFormData as single source of truth
  const categoryFormData = externalCategoryFormData

  // Note: Aggregated sizes hook removed as it's not used in current implementation
  // Can be re-enabled if needed for advanced size management features

  // ============== DYNAMIC FORM STRATEGY LOGIC ==============

  // Prevent infinite re-initialization
  const initializingRef = useRef<boolean>(false)

  // Handle category change
  const handleCategoryChange = useCallback(
    (categoryId: string) => {
      // Update form data via parent handler
      onInputChange('categoryId', categoryId)

      // Initialize new strategy only if not already initializing
      if (!initializingRef.current) {
        initializingRef.current = true
        initializeStrategy(categoryId).finally(() => {
          // Reset flag after initialization completes
          setTimeout(() => {
            initializingRef.current = false
          }, 100)
        })
      }
    },
    [onInputChange, initializeStrategy],
  )

  // Track transformation to prevent infinite loops
  const transformingRef = useRef<boolean>(false)

  // Handle strategy form data changes
  const handleCategoryFormDataChange = useCallback(
    (fieldName: string, value: unknown) => {
      // Skip transformation if already in progress
      if (transformingRef.current) {
        return
      }

      let updatedData = {
        ...categoryFormData,
        [fieldName]: value,
      }

      // Special handling for size selection changes
      if (fieldName === 'sizes' && Array.isArray(value)) {
        const selectedSizes = value as string[]
        const previousSizes = Array.isArray(categoryFormData.sizes) ? categoryFormData.sizes : []

        // Clear quantity values for unchecked sizes
        const uncheckedSizes = previousSizes.filter((size) => !selectedSizes.includes(size))
        uncheckedSizes.forEach((uncheckedSize) => {
          const quantityKey = `quantity_${uncheckedSize}`
          updatedData = {
            ...updatedData,
            [quantityKey]: 0,
          }
        })
      }

      // Notify parent component (required since we don't have internal state)
      if (onCategoryFormDataChange) {
        onCategoryFormDataChange(updatedData)
      }

      // Transform to ProductSize and notify using hook methods
      if (currentStrategy && fieldName !== 'categoryId') {
        transformingRef.current = true
        try {
          const transformedSizes = transformFormDataToSizes(updatedData)
          if (onStrategySizesChange) {
            onStrategySizesChange(transformedSizes)
          }

          // Update total quantity using hook method
          const totalQuantity = calculateTotalQuantity(updatedData)
          onInputChange('quantity', totalQuantity)
        } catch (error) {
          console.error('Failed to transform form data:', error)
        } finally {
          // Reset transformation flag after completion
          setTimeout(() => {
            transformingRef.current = false
          }, 200) // FIXED: Increase timeout to prevent race conditions
        }
      }
    },
    [
      categoryFormData,
      currentStrategy,
      transformFormDataToSizes,
      calculateTotalQuantity,
      onCategoryFormDataChange,
      onStrategySizesChange,
      onInputChange,
    ],
  )

  // Initialize strategy on component mount and when category changes (with prevention)
  useEffect(() => {
    if (formData.categoryId && !initializingRef.current && categories.length > 0) {
      initializeStrategy(formData.categoryId)
    }
  }, [formData.categoryId, categories.length, initializeStrategy])

  // Sync form data with strategy in edit mode (with prevention)
  useEffect(() => {
    if (product && currentStrategy && categoryFormData.categoryId && !transformingRef.current) {
      // In edit mode, ensure strategy sizes are synchronized with form data
      transformingRef.current = true
      try {
        const transformedSizes = currentStrategy.transformToProductSizes(categoryFormData)
        if (onStrategySizesChange) {
          onStrategySizesChange(transformedSizes)
        }
      } catch (error) {
        console.error('Failed to sync form data with strategy:', error)
      } finally {
        setTimeout(() => {
          transformingRef.current = false
        }, 200) // FIXED: Increase timeout to prevent race conditions
      }
    }
  }, [product, currentStrategy, categoryFormData, onStrategySizesChange])

  // Transform categories for select options
  // Defensive: categories fallback ke array kosong jika undefined/null
  const categoryOptions = (categories ?? []).map((category) => ({
    value: category.id,
    label: category.name,
    color: category.color,
  }))

  return (
    <Card className="shadow-md" data-testid="product-form-container">
      <CardContent className="p-6 md:p-8">
        <div className="space-y-8" data-testid="product-form">
          {/* Informasi Dasar */}
          <FormSection title="Informasi Dasar" data-testid="basic-info-section">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                type="text"
                name="code"
                label="Kode Produk"
                icon={Hash}
                value={formData.code}
                onChange={(value) =>
                  onInputChange('code', typeof value === 'string' ? value.toUpperCase() : value)
                }
                onBlur={(value) => onBlur('code', value)}
                placeholder="PRD1"
                maxLength={5}
                error={errors.code}
                touched={touched.code}
                required
                helpText="Masukkan 4-5 digit kode alfanumerik uppercase (contoh: PRD1, DRESS, JKT25)"
                data-testid="product-code-field"
              />

              <FormField
                type="text"
                name="name"
                label="Nama Produk"
                icon={Package}
                value={formData.name}
                onChange={(value) => onInputChange('name', value)}
                onBlur={(value) => onBlur('name', value)}
                placeholder="Dress Pesta Merah"
                maxLength={100}
                error={errors.name}
                touched={touched.name}
                required
                helpText="Masukkan nama produk yang jelas dan deskriptif"
                data-testid="product-name-field"
              />

              <FormField
                type="select"
                name="categoryId"
                label="Kategori"
                icon={Tag}
                value={formData.categoryId}
                onChange={handleCategoryChange}
                options={categoryOptions}
                placeholder="Pilih kategori"
                error={errors.categoryId}
                touched={touched.categoryId}
                required
                helpText="Pilih kategori yang sesuai dengan produk"
                data-testid="product-category-field"
              />

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Box className="w-4 h-4" />
                  Jumlah Stok (Auto-calculated)
                  <span className="text-red-500">*</span>
                </label>
                <input
                  aria-label="quantity"
                  type="number"
                  value={formData.quantity}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                  disabled
                  readOnly
                  data-testid="product-quantity-field"
                />
                <p className="text-xs text-gray-500">
                  Jumlah stok dihitung otomatis dari total ukuran produk
                </p>
                {errors.quantity && touched.quantity && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span>×</span>
                    {errors.quantity}
                  </p>
                )}
              </div>
            </div>
          </FormSection>

          {/* Cost Item Selection  - Hidden for Producer Role */}
          {!isProducer && (
            <FormSection title="Item Biaya" data-testid="cost-items-section">
              <CostItemSelector
                selectedCosts={formData.selectedCosts}
                onCostsChange={onCostsChange}
                onModalAwalChange={onModalAwalChange}
              />
            </FormSection>
          )}

          {/* Dynamic Strategy-Based Form Fields */}
          {currentStrategy && selectedCategory && (
            <>
              {currentStrategy.getFormFields().map((section, sectionIndex: number) => (
                <FormSection
                  key={sectionIndex}
                  title={section.title}
                  description={section.description}
                  data-testid={`strategy-section-${sectionIndex}`}
                >
                  {/* Enhanced Size Error Display for Rental State Conflicts */}
                  {section.title === 'Ukuran & Stok' && errors.sizes && touched.sizes && (
                    <div className="mb-4">
                      {errors.sizes.includes('Konflik rental:') ? (
                        // Show enhanced rental state warning for rental conflicts
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <div className="w-5 h-5 text-yellow-400">⚠️</div>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-yellow-800">
                                Masalah Rental State Terdeteksi
                              </h3>
                              <div className="mt-2 text-sm text-yellow-700">
                                <p>{errors.sizes}</p>
                                <div className="mt-3 text-xs">
                                  <strong>
                                    💡 Lihat detail lengkap di bagian error di atas halaman.
                                  </strong>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Show standard error for other size-related issues
                        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <div className="w-5 h-5 text-red-400">⚠️</div>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-red-800">
                                Masalah dengan Ukuran Produk
                              </h3>
                              <div className="mt-2 text-sm text-red-700">
                                <p>{errors.sizes}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-6">
                    {section.fields.map((field, fieldIndex: number) => (
                      <DynamicFormField
                        key={fieldIndex}
                        field={field}
                        value={
                          categoryFormData[field.name as keyof CategoryFormData] ||
                          field.defaultValue ||
                          ''
                        }
                        onChange={(value) => handleCategoryFormDataChange(field.name, value)}
                        onBlur={(value) => onBlur(field.name, value)}
                        error={errors[field.name]}
                        touched={touched[field.name]}
                        formDescription={currentStrategy.getFormDescription()}
                        formData={categoryFormData}
                      />
                    ))}
                  </div>
                </FormSection>
              ))}
            </>
          )}

          {/* Size Management Section - Enhanced UX Flow (Only for non-strategy states) */}
          {!currentStrategy && !selectedCategory && (
            <>
              {!formData.categoryId ? (
                // Show placeholder when no category selected
                <SizeManagementPlaceholder data-testid="size-management-placeholder" />
              ) : strategyLoading ? (
                // Show loading state during strategy initialization
                <FormSection title="Ukuran & Stok" data-testid="size-management-loading">
                  <div className="text-center py-8 px-4">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="text-sm text-gray-500">
                        Memuat opsi ukuran untuk kategori ini...
                      </p>
                    </div>
                  </div>
                </FormSection>
              ) : strategyError ? (
                // Show error state if strategy initialization failed
                <FormSection title="Ukuran & Stok" data-testid="size-management-error">
                  <div className="text-center py-8 px-4">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <Tag className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-red-900">
                          Gagal Memuat Opsi Ukuran
                        </h3>
                        <p className="text-xs text-red-500">{strategyError.message}</p>
                        <button
                          type="button"
                          onClick={() =>
                            formData.categoryId && initializeStrategy(formData.categoryId)
                          }
                          className="text-xs text-blue-600 hover:text-blue-500 underline"
                        >
                          Coba Lagi
                        </button>
                      </div>
                    </div>
                  </div>
                </FormSection>
              ) : (
                // Force strategy initialization for all categories
                <FormSection title="Ukuran & Stok" data-testid="size-management-section">
                  <div className="text-center py-8 px-4">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Tag className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-blue-900">
                          Memuat Strategi Kategori
                        </h3>
                        <p className="text-xs text-blue-600">
                          Sistem sedang memuat konfigurasi ukuran untuk kategori ini...
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            formData.categoryId && initializeStrategy(formData.categoryId)
                          }
                          className="text-xs text-blue-600 hover:text-blue-500 underline"
                        >
                          Coba Lagi
                        </button>
                      </div>
                    </div>
                  </div>
                </FormSection>
              )}
            </>
          )}

          {/* Informasi Harga */}
          <FormSection title="Informasi Harga" data-testid="price-info-section">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Modal Awal - Hidden for Producer Role */}
              {!isProducer && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <DollarSign className="w-4 h-4" />
                    Modal Awal
                  </label>
                  <input
                    aria-label="modalAwal"
                    type="text"
                    value={formatCurrency(formData.modalAwal.toString())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                    disabled
                    readOnly
                    data-testid="product-modal-field"
                  />
                  <p className="text-xs text-gray-500">
                    {formData.modalAwal === 0
                      ? 'Mode Producer: Tambahkan item biaya untuk menghitung modal awal secara otomatis'
                      : 'Modal awal dihitung otomatis dari total item biaya yang dipilih'}
                  </p>
                  {errors.modalAwal && touched.modalAwal && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span>×</span>
                      {errors.modalAwal}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <FormField
                  type="text"
                  name="currentPrice"
                  label="Harga Sewa (Rp)"
                  icon={CreditCard}
                  value={formatCurrency(formData.currentPrice.toString())}
                  onChange={(value) => {
                    const numValue =
                      typeof value === 'string' ? value.replace(/\D/g, '') : value.toString()
                    onInputChange('currentPrice', Number(numValue))
                  }}
                  onBlur={(value) => {
                    const numValue =
                      typeof value === 'string' ? value.replace(/\D/g, '') : value.toString()
                    onBlur('currentPrice', Number(numValue))
                  }}
                  placeholder="150,000"
                  prefix="Rp"
                  error={errors.currentPrice}
                  touched={touched.currentPrice}
                  required
                  helpText="Harga sewa per sekali pakai"
                  data-testid="product-price-field"
                />
              </div>
            </div>
          </FormSection>

          {/* Deskripsi */}
          <FormField
            type="textarea"
            name="description"
            label="Deskripsi Produk"
            icon={FileText}
            value={formData.description}
            onChange={(value) => onInputChange('description', value)}
            onBlur={(value) => onBlur('description', value)}
            placeholder="Deskripsi detail produk, bahan, ukuran, dan informasi tambahan..."
            rows={4}
            maxLength={500}
            error={errors.description}
            touched={touched.description}
            helpText="Deskripsi opsional untuk detail produk"
            data-testid="product-description-field"
          />

          {/* Image Upload */}
          <ImageUpload
            value={formData.imageUrl || undefined}
            onChange={(value) => onInputChange('imageUrl', value)}
            onFileChange={(file) => onInputChange('image', file)}
            data-testid="product-image-upload"
          />
        </div>
      </CardContent>
    </Card>
  )
}
