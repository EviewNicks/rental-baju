'use client'

import {
  Hash,
  Package,
  Tag,
  DollarSign,
  CreditCard,
  FileText,
  Palette,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FormField } from '@/features/manage-product/components/form-product/FormField'
import { FormSection } from '@/features/manage-product/components/form-product/FormSection'
import { ImageUpload } from '@/features/manage-product/components/products/ImageUpload'
import { MaterialSelector } from '@/features/manage-product/components/material/MaterialSelector'
import { AdvancedSizeManagementSection } from './size-management/AdvancedSizeManagementSection'
import { useColors } from '@/features/manage-product/hooks/useCategories'
import type {
  ClientCategory,
  ClientColor,
} from '@/features/manage-product/types'
import type {
  AdvancedProduct,
  CreateAdvancedProductSizeRequest,
  AdvancedAggregatedSizeView,
} from '@/features/manage-product/types/advanced'
import { logger } from '@/services/logger'
import { useEffect } from 'react'

// Component-specific logger for advanced product form
const formLogger = logger.child('AdvancedProductForm')

/**
 * Advanced Product Form Data Structure
 *
 * Clean interface that ONLY supports advanced size management.
 * No legacy fields or hybrid support.
 */
interface AdvancedProductFormData {
  code: string
  name: string
  categoryId: string
  colorId?: string
  materialId?: string
  materialQuantity?: number
  modalAwal: number
  currentPrice: number
  description: string
  imageUrl: string | null
  image?: File | null

  // REQUIRED: Advanced size management only
  sizes: CreateAdvancedProductSizeRequest[]
}

interface AdvancedProductFormProps {
  formData: AdvancedProductFormData
  errors: { [key: string]: string | null }
  touched: { [key: string]: boolean }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onInputChange: (name: string, value: any) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onBlur: (name: string, value: any) => void
  formatCurrency: (value: string) => string
  categories: ClientCategory[]

  // Optional product data for edit mode
  product?: AdvancedProduct

  // Advanced size management handlers
  onSizesChange: (sizes: CreateAdvancedProductSizeRequest[]) => void
  onAggregatedSizesChange?: (sizes: AdvancedAggregatedSizeView[]) => void
}

/**
 * Advanced Product Form Component
 *
 * Clean, advanced-only product form that enforces:
 * - REQUIRED sizes array (minimum 1 size)
 * - No legacy size field support
 * - Enhanced validation and business logic
 * - Integration with advanced service layer
 */
export function AdvancedProductForm({
  formData,
  errors,
  touched,
  onInputChange,
  onBlur,
  formatCurrency,
  categories,
  product,
  onSizesChange,
  onAggregatedSizesChange,
}: AdvancedProductFormProps) {
  const productId = product?.id

  // Fetch colors data for form dropdown
  const {
    data: colors = [],
    isLoading: isLoadingColors,
    error: colorsError,
  } = useColors()

  // Log component mount and initialization
  useEffect(() => {
    formLogger.info('AdvancedProductForm mounted', {
      mode: product ? 'edit' : 'create',
      productId,
      sizesCount: formData.sizes.length,
    })

    // Validation on mount
    if (formData.sizes.length === 0) {
      formLogger.warn('Form mounted with no sizes - invalid state')
    }
  }, [productId, formData.sizes.length])

  // Calculate total quantity from sizes
  const totalQuantity = formData.sizes.reduce((sum, size) => sum + size.quantity, 0)

  // Check for size validation errors
  const hasRequiredSizeError = errors?.sizes || (touched?.sizes && formData.sizes.length === 0)
  const sizesErrorMessage = errors?.sizes || (formData.sizes.length === 0 ? 'Minimal 1 ukuran harus ditambahkan' : null)

  return (
    <div className="space-y-6">
      {/* Required Size Validation Alert */}
      {hasRequiredSizeError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {sizesErrorMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Basic Product Information */}
      <FormSection title="Informasi Produk" icon={Package}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Kode Produk"
            name="code"
            type="text"
            value={formData.code}
            onChange={onInputChange}
            onBlur={onBlur}
            error={errors?.code}
            touched={touched?.code}
            placeholder="Contoh: A001"
            maxLength={4}
            icon={Hash}
            required
            description="4 karakter alfanumerik uppercase"
          />

          <FormField
            label="Nama Produk"
            name="name"
            type="text"
            value={formData.name}
            onChange={onInputChange}
            onBlur={onBlur}
            error={errors?.name}
            touched={touched?.name}
            placeholder="Nama produk"
            maxLength={100}
            icon={Tag}
            required
          />
        </div>

        <FormField
          label="Deskripsi"
          name="description"
          type="textarea"
          value={formData.description}
          onChange={onInputChange}
          onBlur={onBlur}
          error={errors?.description}
          touched={touched?.description}
          placeholder="Deskripsi produk (opsional)"
          maxLength={500}
          icon={FileText}
          rows={3}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Kategori"
            name="categoryId"
            type="select"
            value={formData.categoryId}
            onChange={onInputChange}
            onBlur={onBlur}
            error={errors?.categoryId}
            touched={touched?.categoryId}
            placeholder="Pilih kategori"
            icon={Box}
            required
            options={categories.map(category => ({
              value: category.id,
              label: category.name,
            }))}
          />

          <FormField
            label="Warna"
            name="colorId"
            type="select"
            value={formData.colorId || ''}
            onChange={onInputChange}
            onBlur={onBlur}
            error={errors?.colorId}
            touched={touched?.colorId}
            placeholder="Pilih warna (opsional)"
            icon={Palette}
            loading={isLoadingColors}
            options={colors.map((color: ClientColor) => ({
              value: color.id,
              label: color.name,
            }))}
          />
        </div>
      </FormSection>

      {/* Financial Information */}
      <FormSection title="Informasi Keuangan" icon={DollarSign}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Modal Awal"
            name="modalAwal"
            type="currency"
            value={formData.modalAwal}
            onChange={onInputChange}
            onBlur={onBlur}
            error={errors?.modalAwal}
            touched={touched?.modalAwal}
            placeholder="Modal awal"
            formatCurrency={formatCurrency}
            icon={CreditCard}
            required
          />

          <FormField
            label="Harga Sewa"
            name="currentPrice"
            type="currency"
            value={formData.currentPrice}
            onChange={onInputChange}
            onBlur={onBlur}
            error={errors?.currentPrice}
            touched={touched?.currentPrice}
            placeholder="Harga sewa per hari"
            formatCurrency={formatCurrency}
            icon={DollarSign}
            required
          />
        </div>
      </FormSection>

      {/* Advanced Size Management - REQUIRED */}
      <FormSection
        title="Manajemen Ukuran"
        icon={Package}
        required
        description="Setiap produk HARUS memiliki minimal 1 ukuran. Tidak ada dukungan untuk ukuran tunggal."
      >
        <AdvancedSizeManagementSection
          productId={productId}
          sizes={formData.sizes}
          onSizesChange={onSizesChange}
          onAggregatedSizesChange={onAggregatedSizesChange}
          errors={errors}
          touched={touched}
          required={true}
        />

        {/* Size Summary Display */}
        {formData.sizes.length > 0 && (
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Ukuran:</span>
                <span className="font-medium">{formData.sizes.length} ukuran</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground">Total Kuantitas:</span>
                <span className="font-medium">{totalQuantity} pcs</span>
              </div>
            </CardContent>
          </Card>
        )}
      </FormSection>

      {/* Material Management (Optional) */}
      <FormSection title="Manajemen Material" icon={Package} optional>
        <MaterialSelector
          materialId={formData.materialId}
          materialQuantity={formData.materialQuantity}
          onMaterialChange={(materialId) => onInputChange('materialId', materialId)}
          onQuantityChange={(quantity) => onInputChange('materialQuantity', quantity)}
          errors={{
            materialId: errors?.materialId,
            materialQuantity: errors?.materialQuantity,
          }}
          touched={{
            materialId: touched?.materialId,
            materialQuantity: touched?.materialQuantity,
          }}
        />
      </FormSection>

      {/* Image Upload */}
      <FormSection title="Gambar Produk" icon={Package} optional>
        <ImageUpload
          currentImageUrl={formData.imageUrl}
          onImageChange={(file) => onInputChange('image', file)}
          onImageUrlChange={(url) => onInputChange('imageUrl', url)}
          error={errors?.image}
          touched={touched?.image}
        />
      </FormSection>

      {/* Debug Information (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <h4 className="text-sm font-medium mb-2">Debug Info (Development)</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Mode: Advanced-Only</div>
              <div>Sizes Count: {formData.sizes.length}</div>
              <div>Total Quantity: {totalQuantity}</div>
              <div>Product ID: {productId || 'New Product'}</div>
              <div>Has Validation Errors: {Object.keys(errors || {}).length > 0 ? 'Yes' : 'No'}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export type { AdvancedProductFormData, AdvancedProductFormProps }