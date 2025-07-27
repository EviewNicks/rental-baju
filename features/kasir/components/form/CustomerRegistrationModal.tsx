'use client'

import type React from 'react'

import { useState } from 'react'
import { X, User, Phone, Mail, MapPin, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Customer, CustomerFormData } from '../../types/customer'
import { useCreatePenyewa } from '../../hooks/usePenyewa'
import type { CreatePenyewaRequest } from '../../types/api'
// import { toast } from '@/hooks/use-toast' // TODO: Add toast implementation

interface CustomerRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onCustomerRegistered: (customer: Customer) => void
}

export function CustomerRegistrationModal({
  isOpen,
  onClose,
  onCustomerRegistered,
}: CustomerRegistrationModalProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    identityNumber: '',
  })
  const [errors, setErrors] = useState<Partial<CustomerFormData>>({})
  
  // Real API integration
  const { 
    mutate: createPenyewa, 
    isPending: isSubmitting
  } = useCreatePenyewa()

  const validateForm = (): boolean => {
    const newErrors: Partial<CustomerFormData> = {}

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Nama minimal 2 karakter'
    }

    if (!formData.phone || !/^08\d{8,11}$/.test(formData.phone)) {
      newErrors.phone = 'Nomor telepon tidak valid (contoh: 081234567890)'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid'
    }

    if (!formData.address || formData.address.length < 10) {
      newErrors.address = 'Alamat minimal 10 karakter'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    // Transform form data to API format
    const createRequest: CreatePenyewaRequest = {
      nama: formData.name,
      telepon: formData.phone,
      alamat: formData.address,
      email: formData.email || undefined,
      nik: formData.identityNumber || undefined,
    }

    createPenyewa(createRequest, {
      onSuccess: (createdPenyewa) => {
        // Transform API response to Customer interface
        const newCustomer: Customer = {
          id: createdPenyewa.id,
          name: createdPenyewa.nama,
          phone: createdPenyewa.telepon,
          email: createdPenyewa.email || '',
          address: createdPenyewa.alamat,
          totalTransactions: 0,
          createdAt: createdPenyewa.createdAt,
        }

        // Show success message
        console.log('Penyewa berhasil ditambahkan:', createdPenyewa.nama)

        onCustomerRegistered(newCustomer)

        // Reset form
        setFormData({
          name: '',
          phone: '',
          email: '',
          address: '',
          identityNumber: '',
        })
        setErrors({})
      },
      onError: (error) => {
        console.error('Failed to register customer:', error)
        
        // Show error message
        console.error('Gagal menambahkan penyewa:', error.message || 'Terjadi kesalahan saat menyimpan data penyewa')
      },
    })
  }

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-gray-900" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Tambah Penyewa Baru</h2>
              <p className="text-sm text-gray-600">Isi data penyewa untuk transaksi rental</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="md:col-span-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Nama Lengkap *
              </Label>
              <div className="mt-1 relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`pl-10 ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Nomor Telepon *
              </Label>
              <div className="mt-1 relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`pl-10 ${errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  placeholder="081234567890"
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email (Opsional)
              </Label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`pl-10 ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  placeholder="email@example.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* Identity Number */}
            <div className="md:col-span-2">
              <Label htmlFor="identityNumber" className="text-sm font-medium text-gray-700">
                Nomor KTP (Opsional)
              </Label>
              <div className="mt-1 relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="identityNumber"
                  type="text"
                  value={formData.identityNumber}
                  onChange={(e) => handleInputChange('identityNumber', e.target.value)}
                  className="pl-10"
                  placeholder="3171234567890001"
                />
              </div>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                Alamat Lengkap *
              </Label>
              <div className="mt-1 relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={`pl-10 min-h-[80px] ${errors.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  placeholder="Masukkan alamat lengkap dengan RT/RW, Kelurahan, Kecamatan, Kota"
                />
              </div>
              {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Penyewa'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
