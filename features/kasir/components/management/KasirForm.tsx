'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { AlertCircle } from 'lucide-react'
import type { CreateKasirRequest, UpdateKasirRequest } from '../../types'

interface KasirFormData {
  nama: string
  isActive: boolean
}

interface KasirFormProps {
  errors: Record<string, string>
  onSubmit: (data: CreateKasirRequest | UpdateKasirRequest) => void
  isSubmitting: boolean
}

export function KasirForm({
  errors,
  onSubmit,
}: KasirFormProps) {
  const [formData, setFormData] = useState<KasirFormData>({
    nama: '',
    isActive: true,
  })

  const handleInputChange = (name: keyof KasirFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      // Note: In real implementation, we would clear the error
      // setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} data-testid="kasir-form">
      <div className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Informasi Dasar
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nama Kasir */}
            <div>
              <Label htmlFor="nama" className="block text-sm font-medium text-gray-700 mb-1">
                Nama Kasir <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nama"
                name="nama"
                type="text"
                value={formData.nama}
                onChange={(e) => handleInputChange('nama', e.target.value)}
                placeholder="Masukkan nama kasir"
                required
                className={errors.nama ? 'border-red-500' : ''}
                data-testid="kasir-name-input"
              />
              {errors.nama && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.nama}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="isActive" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </Label>
              <div className="flex items-center space-x-3">
                <Switch
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  data-testid="kasir-status-toggle"
                />
                <Label htmlFor="isActive" className="text-sm text-gray-600">
                  {formData.isActive ? 'Aktif' : 'Tidak Aktif'}
                </Label>
              </div>
            </div>
          </div>
        </div>

        
        {/* Form Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Informasi Penting
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Nama kasir wajib diisi dan unik</li>
                <li>• Status aktif menentukan apakah kasir dapat digunakan dalam transaksi</li>
                <li>• Sistem akan otomatis mengatur hak akses untuk kasir baru</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Hidden submit button for form validation */}
        <button type="submit" className="hidden" aria-hidden="true" />
      </div>
    </form>
  )
}