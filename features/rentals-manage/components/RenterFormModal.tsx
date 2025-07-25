'use client'

import type React from 'react'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import type { Renter } from '@/features/rentals-manage/types'

interface RenterFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (renter: Partial<Renter>) => Promise<void>
  renter?: Renter | null
  isLoading: boolean
}

interface FormData {
  name: string
  phone: string
  address: string
  identity_number: string
}

interface FormErrors {
  name?: string
  phone?: string
  address?: string
  identity_number?: string
}

export function RenterFormModal({
  isOpen,
  onClose,
  onSave,
  renter,
  isLoading,
}: RenterFormModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    address: '',
    identity_number: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (renter) {
      setFormData({
        name: renter.name,
        phone: renter.phone,
        address: renter.address,
        identity_number: renter.identity_number || '',
      })
    } else {
      setFormData({
        name: '',
        phone: '',
        address: '',
        identity_number: '',
      })
    }
    setErrors({})
  }, [renter, isOpen])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nama wajib diisi'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nama minimal 2 karakter'
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Nama maksimal 100 karakter'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Nomor telepon wajib diisi'
    } else if (!/^08\d{8,11}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Format nomor telepon tidak valid (contoh: 08123456789)'
    }

    if (formData.address.trim().length > 500) {
      newErrors.address = 'Alamat maksimal 500 karakter'
    }

    if (formData.identity_number.trim() && !/^\d{16}$/.test(formData.identity_number.trim())) {
      newErrors.identity_number = 'Nomor identitas harus 16 digit'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    await onSave({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      identity_number: formData.identity_number.trim() || undefined,
    })
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-900">
            {renter ? 'Edit Penyewa' : 'Tambah Penyewa Baru'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isLoading}
            className="text-neutral-400 hover:text-neutral-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-neutral-900">
              Nama Lengkap *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Masukkan nama lengkap"
              className={`border-neutral-200 focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 rounded-lg ${
                errors.name ? 'border-red-500' : ''
              }`}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-neutral-900">
              Nomor Telepon *
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="08123456789"
              className={`border-neutral-200 focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 rounded-lg ${
                errors.phone ? 'border-red-500' : ''
              }`}
            />
            {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium text-neutral-900">
              Alamat
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Masukkan alamat lengkap"
              rows={3}
              className={`border-neutral-200 focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 rounded-lg ${
                errors.address ? 'border-red-500' : ''
              }`}
            />
            {errors.address && <p className="text-sm text-red-600">{errors.address}</p>}
          </div>

          {/* Identity Number */}
          <div className="space-y-2">
            <Label htmlFor="identity_number" className="text-sm font-medium text-neutral-900">
              Nomor Identitas (KTP)
            </Label>
            <Input
              id="identity_number"
              type="text"
              value={formData.identity_number}
              onChange={(e) => handleInputChange('identity_number', e.target.value)}
              placeholder="1234567890123456"
              maxLength={16}
              className={`border-neutral-200 focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 rounded-lg ${
                errors.identity_number ? 'border-red-500' : ''
              }`}
            />
            {errors.identity_number && (
              <p className="text-sm text-red-600">{errors.identity_number}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="border-neutral-200 hover:border-neutral-300 text-neutral-700 rounded-lg"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-lime-500 hover:bg-lime-600 text-black rounded-lg font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
