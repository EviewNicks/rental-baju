'use client'
import {
  Hash,
  Package,
  Tag,
  Box,
  DollarSign,
  CreditCard,
  FileText,
  Ruler,
  Palette,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { FormField } from '@/features/manage-product/components/form-product/FormField'
import { FormSection } from '@/features/manage-product/components/form-product/FormSection'
import { ImageUpload } from '@/features/manage-product/components/products/ImageUpload'
import { MaterialSelector } from '@/features/manage-product/components/material/MaterialSelector'
import { useColors } from '@/features/manage-product/hooks/useCategories'
import type { ClientCategory, ClientColor } from '@/features/manage-product/types'

interface ProductFormData {
  code: string
  name: string
  categoryId: string
  size?: string
  colorId?: string
  materialId?: string
  materialQuantity?: number
  quantity: number
  modalAwal: number
  currentPrice: number
  description: string
  imageUrl: string | null
  image?: File | null
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
}

export function ProductForm({
  formData,
  errors,
  touched,
  onInputChange,
  onBlur,
  formatCurrency,
  categories,
}: ProductFormProps) {
  // Fetch colors data
  const {
    data: colorsData,
    isLoading: isLoadingColors,
    error: colorsError,
  } = useColors({ isActive: true })
  const colors = colorsData?.colors || []

  // Transform categories for select options
  // Defensive: categories fallback ke array kosong jika undefined/null
  const categoryOptions = (categories ?? []).map((category) => ({
    value: category.id,
    label: category.name,
    color: category.color,
  }))

  // Size options with preset values
  const sizeOptions = [
    { value: 'XS', label: 'XS (Extra Small)' },
    { value: 'S', label: 'S (Small)' },
    { value: 'M', label: 'M (Medium)' },
    { value: 'L', label: 'L (Large)' },
    { value: 'XL', label: 'XL (Extra Large)' },
    { value: 'XXL', label: 'XXL (Double Extra Large)' },
  ]

  // Transform colors for select options
  const colorOptions = colors.map((color: ClientColor) => ({
    value: color.id,
    label: color.name,
    color: color.hexCode,
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
                maxLength={4}
                error={errors.code}
                touched={touched.code}
                required
                helpText="Masukkan 4 digit kode alfanumerik (contoh: PRD1, DRES2)"
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
                onChange={(value) => onInputChange('categoryId', value)}
                options={categoryOptions}
                placeholder="Pilih kategori"
                error={errors.categoryId}
                touched={touched.categoryId}
                required
                helpText="Pilih kategori yang sesuai dengan produk"
                data-testid="product-category-field"
              />

              <FormField
                type="number"
                name="quantity"
                label="Jumlah Stok"
                icon={Box}
                value={formData.quantity}
                onChange={(value) => onInputChange('quantity', value)}
                onBlur={(value) => onBlur('quantity', value)}
                placeholder="1"
                min={0}
                max={9999}
                error={errors.quantity}
                touched={touched.quantity}
                required
                helpText="Masukkan jumlah stok yang tersedia"
                data-testid="product-quantity-field"
              />

              <FormField
                type="select"
                name="size"
                label="Ukuran"
                icon={Ruler}
                value={formData.size || ''}
                onChange={(value) => onInputChange('size', value)}
                options={sizeOptions}
                placeholder="Pilih ukuran (opsional)"
                error={errors.size}
                touched={touched.size}
                helpText="Pilih ukuran produk jika berlaku"
                data-testid="product-size-field"
              />

              <FormField
                type="select"
                name="colorId"
                label="Warna"
                icon={Palette}
                value={formData.colorId || ''}
                onChange={(value) => onInputChange('colorId', value)}
                options={colorOptions}
                placeholder={
                  isLoadingColors
                    ? 'Memuat warna...'
                    : colorsError
                      ? 'Error memuat warna'
                      : 'Pilih warna (opsional)'
                }
                error={errors.colorId}
                touched={touched.colorId}
                disabled={isLoadingColors || !!colorsError}
                helpText={
                  colorsError ? 'Gagal memuat data warna' : 'Pilih warna produk jika berlaku'
                }
                data-testid="product-color-field"
              />
            </div>
          </FormSection>

          {/* Material Selection (Optional) */}
          <FormSection title="Material (Opsional)" data-testid="material-section">
            <MaterialSelector
              selectedMaterialId={formData.materialId}
              materialQuantity={formData.materialQuantity}
              onMaterialChange={(materialId) => onInputChange('materialId', materialId)}
              onQuantityChange={(quantity) => onInputChange('materialQuantity', quantity)}
            />
          </FormSection>

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
