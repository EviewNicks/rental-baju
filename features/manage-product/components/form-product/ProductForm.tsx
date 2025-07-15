'use client'
import { Hash, Package, Tag, Box, DollarSign, CreditCard, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { FormField } from '@/features/manage-product/components/form-product/FormField'
import { FormSection } from '@/features/manage-product/components/form-product/FormSection'
import { ImageUpload } from '@/features/manage-product/components/products/ImageUpload'

interface ProductFormData {
  code: string
  name: string
  category: string
  quantity: number
  modal_awal: number
  harga_sewa: number
  description: string
  image: string | null
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
}

const categories = [
  { value: 'dress', label: 'Dress', color: '#EC4899' },
  { value: 'kemeja', label: 'Kemeja', color: '#3B82F6' },
  { value: 'jas', label: 'Jas', color: '#8B5CF6' },
  { value: 'celana', label: 'Celana', color: '#A16207' },
  { value: 'aksesoris', label: 'Aksesoris', color: '#FFD700' },
]

export function ProductForm({
  formData,
  errors,
  touched,
  onInputChange,
  onBlur,
  formatCurrency,
}: ProductFormProps) {
  return (
    <Card className="shadow-md">
      <CardContent className="p-6 md:p-8">
        <div className="space-y-8">
          {/* Informasi Dasar */}
          <FormSection title="Informasi Dasar">
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
              />

              <FormField
                type="select"
                name="category"
                label="Kategori"
                icon={Tag}
                value={formData.category}
                onChange={(value) => onInputChange('category', value)}
                options={categories}
                placeholder="Pilih kategori"
                error={errors.category}
                touched={touched.category}
                required
                helpText="Pilih kategori yang sesuai dengan produk"
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
              />
            </div>
          </FormSection>

          {/* Informasi Harga */}
          <FormSection title="Informasi Harga">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <FormField
                  type="text"
                  name="modal_awal"
                  label="Modal Awal (Rp)"
                  icon={DollarSign}
                  value={formatCurrency(formData.modal_awal.toString())}
                  onChange={(value) => {
                    const numValue =
                      typeof value === 'string' ? value.replace(/\D/g, '') : value.toString()
                    onInputChange('modal_awal', Number(numValue))
                  }}
                  onBlur={(value) => {
                    const numValue =
                      typeof value === 'string' ? value.replace(/\D/g, '') : value.toString()
                    onBlur('modal_awal', Number(numValue))
                  }}
                  placeholder="800,000"
                  prefix="Rp"
                  error={errors.modal_awal}
                  touched={touched.modal_awal}
                  required
                  helpText="Biaya pembuatan/pembelian produk"
                />
              </div>

              <div className="space-y-2">
                <FormField
                  type="text"
                  name="harga_sewa"
                  label="Harga Sewa (Rp)"
                  icon={CreditCard}
                  value={formatCurrency(formData.harga_sewa.toString())}
                  onChange={(value) => {
                    const numValue =
                      typeof value === 'string' ? value.replace(/\D/g, '') : value.toString()
                    onInputChange('harga_sewa', Number(numValue))
                  }}
                  onBlur={(value) => {
                    const numValue =
                      typeof value === 'string' ? value.replace(/\D/g, '') : value.toString()
                    onBlur('harga_sewa', Number(numValue))
                  }}
                  placeholder="150,000"
                  prefix="Rp"
                  error={errors.harga_sewa}
                  touched={touched.harga_sewa}
                  required
                  helpText="Harga sewa per sekali pakai"
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
          />

          {/* Image Upload */}
          <ImageUpload
            value={formData.image || '/products/image.png'}
            onChange={(value) => onInputChange('image', value)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
