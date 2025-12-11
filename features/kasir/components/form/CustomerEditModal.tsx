'use client'

import { useState, useEffect } from 'react'
import { X, User, Phone, Mail, MapPin, CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Customer } from '../../types'
import { useUpdatePenyewa } from '../../hooks/usePenyewa'

interface CustomerEditModalProps {
  isOpen: boolean
  customer: Customer | null
  onClose: () => void
  onCustomerUpdated: (customer: Customer) => void
  disableNameField?: boolean
}

interface FormData {
  nama: string
  telepon: string
  alamat: string
  email: string
  nik: string
}

interface FormErrors {
  nama?: string
  telepon?: string
  alamat?: string
  email?: string
  nik?: string
}

export function CustomerEditModal({
  isOpen,
  customer,
  onClose,
  onCustomerUpdated,
  disableNameField = true,
}: CustomerEditModalProps) {
  const [formData, setFormData] = useState<FormData>({
    nama: '',
    telepon: '',
    alamat: '',
    email: '',
    nik: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)

  const updatePenyewaMutation = useUpdatePenyewa()

  // Pre-fill form when customer changes
  useEffect(() => {
    if (customer && isOpen) {
      setFormData({
        nama: customer.name || '',
        telepon: customer.phone || '',
        alamat: customer.address || '',
        email: customer.email || '',
        nik: customer.identityNumber || '', // This handles undefined -> empty string correctly
      })
      setErrors({})
    }
  }, [customer, isOpen])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        nama: '',
        telepon: '',
        alamat: '',
        email: '',
        nik: '',
      })
      setErrors({})
      setIsSubmitting(false)
      setShowSuccess(false)
      setGeneralError(null)
    }
  }, [isOpen])

  // Auto-hide success message
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showSuccess])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Required fields validation
    if (!formData.nama.trim()) {
      newErrors.nama = 'Nama wajib diisi'
    } else if (formData.nama.trim().length < 2) {
      newErrors.nama = 'Nama minimal 2 karakter'
    } else if (formData.nama.trim().length > 100) {
      newErrors.nama = 'Nama maksimal 100 karakter'
    } else if (!/^[a-zA-Z\s.,'-]+$/.test(formData.nama.trim())) {
      newErrors.nama = 'Nama hanya boleh mengandung huruf dan tanda baca'
    }

    if (!formData.telepon.trim()) {
      newErrors.telepon = 'Nomor telepon wajib diisi'
    } else {
      // Enhanced phone number format validation (Indonesian format)
      const cleanPhone = formData.telepon.replace(/[\s-]/g, '')
      const indonesianPhoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,11}$/
      
      if (!indonesianPhoneRegex.test(cleanPhone)) {
        newErrors.telepon = 'Format nomor telepon tidak valid (contoh: 08123456789)'
      }
    }

    if (!formData.alamat.trim()) {
      newErrors.alamat = 'Alamat wajib diisi'
    } else if (formData.alamat.trim().length < 10) {
      newErrors.alamat = 'Alamat minimal 10 karakter'
    } else if (formData.alamat.trim().length > 500) {
      newErrors.alamat = 'Alamat maksimal 500 karakter'
    }

    // Optional fields validation with enhanced rules
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Format email tidak valid'
      } else if (formData.email.trim().length > 254) {
        newErrors.email = 'Email maksimal 254 karakter'
      }
    }

    if (formData.nik && formData.nik.trim()) {
      // Enhanced NIK validation - must be exactly 16 digits
      const nikRegex = /^\d{16}$/
      if (!nikRegex.test(formData.nik.trim())) {
        newErrors.nik = 'NIK harus 16 digit angka'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateField = (field: keyof FormData, value: string): string | undefined => {
    switch (field) {
      case 'nama':
        if (!value.trim()) return 'Nama wajib diisi'
        if (value.trim().length < 2) return 'Nama minimal 2 karakter'
        if (value.trim().length > 100) return 'Nama maksimal 100 karakter'
        if (!/^[a-zA-Z\s.,'-]+$/.test(value.trim())) return 'Nama hanya boleh mengandung huruf dan tanda baca'
        break
      
      case 'telepon':
        if (!value.trim()) return 'Nomor telepon wajib diisi'
        const cleanPhone = value.replace(/[\s-]/g, '')
        const indonesianPhoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,11}$/
        if (!indonesianPhoneRegex.test(cleanPhone)) return 'Format nomor telepon tidak valid (contoh: 08123456789)'
        break
      
      case 'alamat':
        if (!value.trim()) return 'Alamat wajib diisi'
        if (value.trim().length < 10) return 'Alamat minimal 10 karakter'
        if (value.trim().length > 500) return 'Alamat maksimal 500 karakter'
        break
      
      case 'email':
        if (value && value.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value.trim())) return 'Format email tidak valid'
          if (value.trim().length > 254) return 'Email maksimal 254 karakter'
        }
        break
      
      case 'nik':
        if (value && value.trim()) {
          const nikRegex = /^\d{16}$/
          if (!nikRegex.test(value.trim())) return 'NIK harus 16 digit angka'
        }
        break
    }
    return undefined
  }

  const formatInput = (field: keyof FormData, value: string): string => {
    switch (field) {
      case 'telepon':
        // Remove non-numeric characters except + at the beginning
        let cleaned = value.replace(/[^\d+]/g, '')
        // Ensure + only appears at the beginning
        if (cleaned.includes('+') && !cleaned.startsWith('+')) {
          cleaned = cleaned.replace(/\+/g, '')
        }
        // Limit length to reasonable phone number length
        return cleaned.substring(0, 20)
      
      case 'nik':
        // Only allow digits for NIK
        return value.replace(/\D/g, '').substring(0, 16)
      
      case 'nama':
        // Remove potentially harmful characters but keep valid name characters
        return value.replace(/[<>'"&]/g, '').substring(0, 100)
      
      case 'alamat':
        // Basic sanitization for address
        return value.replace(/[<>'"&]/g, '').substring(0, 500)
      
      case 'email':
        // Basic email sanitization
        return value.toLowerCase().replace(/[<>'"&\s]/g, '').substring(0, 254)
      
      default:
        return value
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    // Format input before setting
    const formattedValue = formatInput(field, value)
    setFormData(prev => ({ ...prev, [field]: formattedValue }))
    
    // Real-time validation for better UX
    const fieldError = validateField(field, formattedValue)
    setErrors(prev => ({ ...prev, [field]: fieldError }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!customer || !validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Clear previous errors
      setErrors({})
      setGeneralError(null)

      const updateData = {
        telepon: formData.telepon.trim(),
        alamat: formData.alamat.trim(),
        // For optional fields, explicitly send empty string to clear them
        email: formData.email.trim() || '',
        nik: formData.nik.trim() || '',
      }

      // Only include nama if not disabled
      if (!disableNameField) {
        Object.assign(updateData, { nama: formData.nama.trim() })
      }

      const updatedPenyewa = await updatePenyewaMutation.mutateAsync({
        id: customer.id,
        data: updateData,
      })

      // Transform updated penyewa to Customer interface
      const updatedCustomer: Customer = {
        id: updatedPenyewa.id,
        name: updatedPenyewa.nama,
        phone: updatedPenyewa.telepon,
        email: updatedPenyewa.email || undefined,
        address: updatedPenyewa.alamat,
        identityNumber: updatedPenyewa.nik || undefined,
        createdAt: updatedPenyewa.createdAt,
        totalTransactions: customer.totalTransactions,
        recentTransactions: customer.recentTransactions,
      }

      // Show success message
      setShowSuccess(true)
      
      // Notify parent component
      onCustomerUpdated(updatedCustomer)
      
      // Close modal after short delay to show success message
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error: any) {
      console.error('Error updating customer:', error)
      
      // Handle specific API errors
      if (error.message?.includes('telepon sudah terdaftar')) {
        setErrors({ telepon: 'Nomor telepon sudah digunakan oleh penyewa lain' })
      } else if (error.message?.includes('tidak ditemukan')) {
        setGeneralError('Data penyewa tidak ditemukan. Silakan refresh halaman dan coba lagi.')
      } else if (error.message?.includes('connection') || error.message?.includes('network')) {
        setGeneralError('Koneksi bermasalah. Periksa koneksi internet Anda dan coba lagi.')
      } else if (error.message?.includes('timeout')) {
        setGeneralError('Permintaan timeout. Silakan coba lagi dalam beberapa saat.')
      } else if (error.response?.status === 403) {
        setGeneralError('Anda tidak memiliki izin untuk mengubah data penyewa.')
      } else if (error.response?.status === 422) {
        setGeneralError('Data yang dikirim tidak valid. Periksa kembali form Anda.')
      } else if (error.response?.status >= 500) {
        setGeneralError('Terjadi kesalahan server. Silakan coba lagi dalam beberapa saat.')
      } else {
        // Generic error with actionable message
        setGeneralError(
          error.message || 
          'Terjadi kesalahan saat memperbarui data penyewa. Silakan periksa koneksi internet dan coba lagi.'
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    onClose()
  }

  if (!customer) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-md"
        data-testid="customer-edit-modal"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Data Penyewa
          </DialogTitle>
        </DialogHeader>

        {/* Success Notification */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Data berhasil diperbarui!
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Perubahan telah disimpan dan akan segera terlihat di sistem.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* General Error Notification */}
        {generalError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Gagal memperbarui data
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {generalError}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="nama" className="text-sm font-medium">
              Nama Lengkap *
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="nama"
                type="text"
                value={formData.nama}
                onChange={(e) => handleInputChange('nama', e.target.value)}
                disabled={disableNameField || isSubmitting}
                className={`pl-10 ${disableNameField ? 'bg-gray-50 cursor-not-allowed' : ''} ${
                  isSubmitting ? 'opacity-50' : ''
                } ${
                  errors.nama 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : formData.nama && !errors.nama 
                      ? 'border-green-500 focus:border-green-500 focus:ring-green-500' 
                      : ''
                }`}
                placeholder="Masukkan nama lengkap"
                data-testid="customer-edit-nama-input"
                aria-invalid={!!errors.nama}
                aria-describedby={errors.nama ? 'nama-error' : undefined}
              />
            </div>
            {errors.nama && (
              <p id="nama-error" className="text-sm text-red-600" data-testid="nama-error">
                {errors.nama}
              </p>
            )}
            {disableNameField && (
              <p className="text-xs text-gray-500">
                Nama tidak dapat diubah untuk menjaga integritas data transaksi
              </p>
            )}
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <Label htmlFor="telepon" className="text-sm font-medium">
              Nomor Telepon *
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="telepon"
                type="tel"
                value={formData.telepon}
                onChange={(e) => handleInputChange('telepon', e.target.value)}
                disabled={isSubmitting}
                className={`pl-10 ${isSubmitting ? 'opacity-50' : ''} ${
                  errors.telepon 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : formData.telepon && !errors.telepon 
                      ? 'border-green-500 focus:border-green-500 focus:ring-green-500' 
                      : ''
                }`}
                placeholder="Contoh: 08123456789"
                data-testid="customer-edit-telepon-input"
                aria-invalid={!!errors.telepon}
                aria-describedby={errors.telepon ? 'telepon-error' : undefined}
              />
            </div>
            {errors.telepon && (
              <p id="telepon-error" className="text-sm text-red-600" data-testid="telepon-error">
                {errors.telepon}
              </p>
            )}
          </div>

          {/* Address Field */}
          <div className="space-y-2">
            <Label htmlFor="alamat" className="text-sm font-medium">
              Alamat *
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
              <textarea
                id="alamat"
                value={formData.alamat}
                onChange={(e) => handleInputChange('alamat', e.target.value)}
                disabled={isSubmitting}
                className={`w-full pl-10 pr-3 py-2 border rounded-md resize-none min-h-[80px] ${
                  isSubmitting ? 'opacity-50' : ''
                } ${
                  errors.alamat 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : formData.alamat && !errors.alamat 
                      ? 'border-green-500 focus:border-green-500 focus:ring-green-500' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                } focus:outline-none focus:ring-2 focus:border-transparent`}
                placeholder="Masukkan alamat lengkap"
                data-testid="customer-edit-alamat-input"
                aria-invalid={!!errors.alamat}
                aria-describedby={errors.alamat ? 'alamat-error' : undefined}
              />
            </div>
            {errors.alamat && (
              <p id="alamat-error" className="text-sm text-red-600" data-testid="alamat-error">
                {errors.alamat}
              </p>
            )}
            <div className="text-xs text-gray-500 text-right">
              {formData.alamat.length}/500 karakter
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email (Opsional)
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={isSubmitting}
                className={`pl-10 ${isSubmitting ? 'opacity-50' : ''} ${
                  errors.email 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : formData.email && !errors.email 
                      ? 'border-green-500 focus:border-green-500 focus:ring-green-500' 
                      : ''
                }`}
                placeholder="contoh@email.com"
                data-testid="customer-edit-email-input"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
            </div>
            {errors.email && (
              <p id="email-error" className="text-sm text-red-600" data-testid="email-error">
                {errors.email}
              </p>
            )}
          </div>

          {/* NIK Field */}
          <div className="space-y-2">
            <Label htmlFor="nik" className="text-sm font-medium">
              NIK (Opsional)
            </Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="nik"
                type="text"
                value={formData.nik}
                onChange={(e) => handleInputChange('nik', e.target.value)}
                disabled={isSubmitting}
                className={`pl-10 ${isSubmitting ? 'opacity-50' : ''} ${
                  errors.nik 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : formData.nik && !errors.nik 
                      ? 'border-green-500 focus:border-green-500 focus:ring-green-500' 
                      : ''
                }`}
                placeholder="16 digit NIK"
                maxLength={16}
                data-testid="customer-edit-nik-input"
                aria-invalid={!!errors.nik}
                aria-describedby={errors.nik ? 'nik-error' : undefined}
              />
            </div>
            {errors.nik && (
              <p id="nik-error" className="text-sm text-red-600" data-testid="nik-error">
                {errors.nik}
              </p>
            )}
            {formData.nik && (
              <div className="text-xs text-gray-500 text-right">
                {formData.nik.length}/16 digit
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1"
              data-testid="customer-edit-cancel-button"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900"
              data-testid="customer-edit-submit-button"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Perubahan'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}