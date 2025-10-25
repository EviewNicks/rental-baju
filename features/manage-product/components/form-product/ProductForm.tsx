'use client'
import { Hash, Package, Tag, Box, DollarSign, CreditCard, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { FormField } from '@/features/manage-product/components/form-product/FormField'
import { FormSection } from '@/features/manage-product/components/form-product/FormSection'
import { DynamicFormField } from '@/features/manage-product/components/form-product/DynamicFormField'
import { ImageUpload } from '@/features/manage-product/components/products/ImageUpload'
import { MaterialSelector } from '@/features/manage-product/components/material/MaterialSelector'
import { InlineSizeManagement } from '@/features/manage-product/components/form-product/InlineSizeManagement'
import { useAggregatedSizes } from '@/features/manage-product/hooks/useAggregatedSizes'
import { getProductSizeMode } from '@/features/manage-product/lib/utils/sizeManagementUtils'
import { FormStrategyFactory } from '@/features/manage-product/lib/strategies/StrategyFactory'
import type { CategoryFormStrategy, CategoryFormData as CategoryFormData } from '@/features/manage-product/lib/strategies/CategoryFormStrategy'
import type {
  ClientCategory,
  ClientProduct,
  AggregatedSizeView,
  SimplifiedSizeEntry,
  CreateProductSizeRequest,
} from '@/features/manage-product/types'
import { logger } from '@/services/logger'
import { useEffect, useState, useCallback } from 'react'

// Component-specific logger for product form
const formLogger = logger.child('ProductForm')

interface ProductFormData {
  code: string
  name: string
  categoryId: string
  materialId?: string
  materialQuantity?: number
  quantity: number
  modalAwal: number
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

  // Size management handlers
  onHasSizesChange?: (hasSizes: boolean) => void
  onAggregatedSizesChange?: (sizes: AggregatedSizeView[]) => void
  onSimplifiedSizesChange?: (sizes: SimplifiedSizeEntry[]) => void

  // Dynamic Form Strategy handlers
  onCategoryFormDataChange?: (data: CategoryFormData) => void
  onStrategySizesChange?: (sizes: CreateProductSizeRequest[]) => void
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
  onSimplifiedSizesChange,
  onCategoryFormDataChange,
  onStrategySizesChange,
}: ProductFormProps) {
  // Size mode detection and state management
  const sizeMode = product ? getProductSizeMode(product) : 'none'
  const productId = product?.id

  // Dynamic Form Strategy state
  const [currentStrategy, setCurrentStrategy] = useState<CategoryFormStrategy | null>(null)
  const [categoryFormData, setCategoryFormData] = useState<CategoryFormData>({ categoryId: '' })
  const [selectedCategory, setSelectedCategory] = useState<ClientCategory | null>(null)

  // Fetch aggregated sizes for existing products with advanced sizing
  const {
    data: aggregatedSizes,
    isLoading: isLoadingAggregatedSizes,
    error: aggregatedSizesError,
  } = useAggregatedSizes(productId, {
    enabled: !!productId && sizeMode === 'advanced',
    includeBreakdown: true,
  })

  // Log component mount and form data initialization
  useEffect(() => {
    formLogger.debug('componentMount', 'ProductForm component mounted', {
      hasFormData: !!formData,
      categoriesCount: categories.length,
      hasMaterial: !!formData.materialId,
      materialQuantity: formData.materialQuantity,
      formDataKeys: Object.keys(formData),
      sizeMode,
      productId,
      hasAggregatedSizes: aggregatedSizes.length > 0,
    })
  }, [formData, categories.length, sizeMode, productId, aggregatedSizes.length])

  // Log size mode detection and data loading
  useEffect(() => {
    if (product) {
      formLogger.info('sizeMode', 'Size mode detected for product', {
        productId: product.id,
        sizeMode,
        hasLegacySize: false, // Legacy size field no longer exists
        hasAdvancedSizes: product.sizes?.length > 0,
        aggregatedSizesCount: aggregatedSizes.length,
      })
    }
  }, [product, sizeMode, aggregatedSizes.length])

  // Log aggregated sizes loading state
  useEffect(() => {
    if (sizeMode === 'advanced') {
      if (isLoadingAggregatedSizes) {
        formLogger.debug('aggregatedSizesLoading', 'Loading aggregated sizes for product form')
      } else if (aggregatedSizesError) {
        formLogger.error(
          'aggregatedSizesLoadError',
          'Failed to load aggregated sizes',
          aggregatedSizesError,
        )
      } else if (aggregatedSizes.length > 0) {
        formLogger.info('aggregatedSizesLoaded', 'Aggregated sizes loaded successfully', {
          sizesCount: aggregatedSizes.length,
          totalQuantity: aggregatedSizes.reduce((sum, size) => sum + size.totalQuantity, 0),
        })
      }
    }
  }, [sizeMode, isLoadingAggregatedSizes, aggregatedSizesError, aggregatedSizes])

  
  // Log material integration state changes
  useEffect(() => {
    if (formData.materialId) {
      formLogger.info('materialIntegration', 'Material selected in product form', {
        materialId: formData.materialId,
        materialQuantity: formData.materialQuantity,
        hasBothMaterialAndQuantity: !!(formData.materialId && formData.materialQuantity),
      })
    }
  }, [formData.materialId, formData.materialQuantity])

  // ============== DYNAMIC FORM STRATEGY LOGIC ==============

  // Initialize strategy when category changes
  const initializeStrategy = useCallback((categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    if (!category) {
      formLogger.warn('strategy', 'Category not found for strategy initialization', { categoryId })
      return
    }

    try {
      const strategy = FormStrategyFactory.createWithContext(category.type, {
        categoryId: category.id,
        categoryName: category.name,
        isEditMode: !!product,
        existingData: product?.sizes || []
      })

      setCurrentStrategy(strategy)
      setSelectedCategory(category)

      // Initialize form data for strategy
      const defaultStrategyData = strategy.getDefaultValues()
      const initialCategoryData: CategoryFormData = {
        ...defaultStrategyData
      }
      // Override categoryId if provided
      if (categoryId) {
        initialCategoryData.categoryId = categoryId
      }

      // Load existing data if in edit mode
      if (product && product.sizes && product.sizes.length > 0) {
        const existingData = (strategy as CategoryFormStrategy & { transformFromProductSizes?: (sizes: unknown[]) => CategoryFormData }).transformFromProductSizes?.(product.sizes) || initialCategoryData
        setCategoryFormData(existingData)

        // Notify parent component
        if (onCategoryFormDataChange) {
          onCategoryFormDataChange(existingData)
        }

        // Transform and notify about sizes
        const transformedSizes = strategy.transformToProductSizes(existingData)
        if (onStrategySizesChange) {
          onStrategySizesChange(transformedSizes)
        }
      } else {
        setCategoryFormData(initialCategoryData)

        if (onCategoryFormDataChange) {
          onCategoryFormDataChange(initialCategoryData)
        }
      }

      formLogger.info('strategy', 'Strategy initialized successfully', {
        categoryType: category.type,
        categoryName: category.name,
        strategy: strategy.type
      })

    } catch (error) {
      formLogger.error('strategy', 'Failed to initialize strategy', error instanceof Error ? error : new Error(String(error)))
    }
  }, [categories, product, onCategoryFormDataChange, onStrategySizesChange])

  // Handle category change
  const handleCategoryChange = useCallback((categoryId: string) => {
    // Update form data via parent handler
    onInputChange('categoryId', categoryId)

    // Initialize new strategy
    initializeStrategy(categoryId)
  }, [onInputChange, initializeStrategy])

  // Handle strategy form data changes
  const handleCategoryFormDataChange = useCallback((fieldName: string, value: unknown) => {
    const updatedData = {
      ...categoryFormData,
      [fieldName]: value
    }

    setCategoryFormData(updatedData)

    // Notify parent component
    if (onCategoryFormDataChange) {
      onCategoryFormDataChange(updatedData)
    }

    // Transform to ProductSize and notify
    if (currentStrategy) {
      try {
        const transformedSizes = currentStrategy.transformToProductSizes(updatedData)
        if (onStrategySizesChange) {
          onStrategySizesChange(transformedSizes)
        }

        // Update total quantity
        const totalQuantity = (currentStrategy as CategoryFormStrategy & { calculateTotalQuantity?: (data: CategoryFormData) => number }).calculateTotalQuantity?.(updatedData) || 0
        onInputChange('quantity', totalQuantity)

      } catch (error) {
        formLogger.error('strategy', 'Failed to transform form data', error instanceof Error ? error : new Error(String(error)))
      }
    }
  }, [categoryFormData, currentStrategy, onCategoryFormDataChange, onStrategySizesChange, onInputChange])

  // Initialize strategy on component mount and when category changes
  useEffect(() => {
    if (formData.categoryId) {
      initializeStrategy(formData.categoryId)
    }
  }, [formData.categoryId, initializeStrategy])

  // Log form validation errors for debugging
  useEffect(() => {
    const errorKeys = Object.keys(errors).filter((key) => errors[key])
    if (errorKeys.length > 0) {
      formLogger.warn('formValidationErrors', 'Form validation errors detected', {
        errorFields: errorKeys,
        errorCount: errorKeys.length,
        hasMaterialErrors: errorKeys.some((key) => key.includes('material')),
        formSection: {
          basicInfo: errorKeys.some((key) =>
            ['code', 'name', 'categoryId', 'quantity'].includes(key),
          ),
          material: errorKeys.some((key) => ['materialId', 'materialQuantity'].includes(key)),
          price: errorKeys.some((key) => ['modalAwal', 'currentPrice'].includes(key)),
        },
      })
    }
  }, [errors, formData.aggregatedSizes])

  // Legacy size change function no longer needed - sizes are handled through advanced sizing system

  // Handle material integration changes with logging
  const handleMaterialChange = (materialId: string | undefined) => {
    formLogger.info('handleMaterialChange', 'User changed material in product form', {
      previousMaterialId: formData.materialId,
      newMaterialId: materialId,
      hasQuantity: !!formData.materialQuantity,
      willClearQuantity: !materialId && !!formData.materialQuantity,
    })

    onInputChange('materialId', materialId)

    // Clear quantity if material is deselected
    if (!materialId && formData.materialQuantity) {
      formLogger.debug(
        'handleMaterialChange',
        'Clearing material quantity due to material deselection',
      )
      onInputChange('materialQuantity', undefined)
    }
  }

  const handleMaterialQuantityChange = (quantity: number | undefined) => {
    formLogger.info(
      'handleMaterialQuantityChange',
      'User changed material quantity in product form',
      {
        materialId: formData.materialId,
        previousQuantity: formData.materialQuantity,
        newQuantity: quantity,
        hasValidMaterial: !!formData.materialId,
      },
    )

    if (!formData.materialId && quantity) {
      formLogger.warn(
        'handleMaterialQuantityChange',
        'Quantity provided without material selection',
        {
          quantity,
          materialId: formData.materialId,
        },
      )
    }

    onInputChange('materialQuantity', quantity)
  }

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
                placeholder="PRD001"
                maxLength={10}
                error={errors.code}
                touched={touched.code}
                required
                helpText="Masukkan 3-10 digit kode alfanumerik (contoh: PRD001, DRESS001, JKT2025)"
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

          {/* Material Selection (Optional) */}
          <FormSection title="Material (Opsional)" data-testid="material-section">
            <MaterialSelector
              selectedMaterialId={formData.materialId}
              materialQuantity={formData.materialQuantity}
              onMaterialChange={handleMaterialChange}
              onQuantityChange={handleMaterialQuantityChange}
            />
          </FormSection>

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
                  <div className="space-y-6">
                    {section.fields.map((field, fieldIndex: number) => (
                      <DynamicFormField
                        key={fieldIndex}
                        field={field}
                        value={categoryFormData[field.name as keyof CategoryFormData] || field.defaultValue || ''}
                        onChange={(value) => handleCategoryFormDataChange(field.name, value)}
                        onBlur={(value) => onBlur(field.name, value)}
                        error={errors[field.name]}
                        touched={touched[field.name]}
                        formDescription={currentStrategy.getFormDescription()}
                      />
                    ))}
                  </div>
                </FormSection>
              ))}
            </>
          )}

          {/* Fallback to InlineSizeManagement for backward compatibility */}
          {!currentStrategy && (
            <FormSection title="Ukuran & Stok" data-testid="size-management-section">
              <InlineSizeManagement
                sizes={formData.simplifiedSizes || []}
                onSizesChange={(sizes) => {
                  if (onSimplifiedSizesChange) {
                    onSimplifiedSizesChange(sizes)
                  } else {
                    onInputChange('simplifiedSizes', sizes)
                  }
                }}
                errors={errors.sizes || undefined}
              />
            </FormSection>
          )}

          {/* Informasi Harga */}
          <FormSection title="Informasi Harga" data-testid="price-info-section">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <FormField
                  type="text"
                  name="modalAwal"
                  label="Modal Awal (Rp)"
                  icon={DollarSign}
                  value={formatCurrency(formData.modalAwal.toString())}
                  onChange={(value) => {
                    const numValue =
                      typeof value === 'string' ? value.replace(/\D/g, '') : value.toString()
                    onInputChange('modalAwal', Number(numValue))
                  }}
                  onBlur={(value) => {
                    const numValue =
                      typeof value === 'string' ? value.replace(/\D/g, '') : value.toString()
                    onBlur('modalAwal', Number(numValue))
                  }}
                  placeholder="800,000"
                  prefix="Rp"
                  error={errors.modalAwal}
                  touched={touched.modalAwal}
                  required
                  helpText="Biaya pembuatan/pembelian produk"
                  data-testid="product-modal-field"
                />
              </div>

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
