'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@/components/ui/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { KasirForm } from './KasirForm'
import { kasirApi } from '../../api'
import type { CreateKasirRequest, UpdateKasirRequest } from '../../types'


interface KasirFormPageProps {
  mode: 'add' | 'edit'
  breadcrumbItems: Array<{ label: string; href?: string; current?: boolean }>
  title: string
  subtitle: string
  kasirId?: string
}

export function KasirFormPage({
  mode,
  breadcrumbItems,
  title,
  subtitle,
  kasirId,
}: KasirFormPageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const loadKasirData = useCallback(async () => {
    try {
      setIsLoading(true)
      await kasirApi.kasir.getById(kasirId!)
    } finally {
      setIsLoading(false)
    }
  }, [kasirId])

  // Load kasir data for edit mode
  useEffect(() => {
    if (mode === 'edit' && kasirId) {
      loadKasirData()
    }
  }, [mode, kasirId, loadKasirData])

  const handleSubmit = async (formData: CreateKasirRequest | UpdateKasirRequest) => {
    try {
      setIsSubmitting(true)
      setErrors({})

      if (mode === 'add') {
        await kasirApi.kasir.create(formData as CreateKasirRequest)
        toast.success('Kasir berhasil ditambahkan')
      } else {
        if (!kasirId) {
          throw new Error('Kasir ID diperlukan untuk mode edit')
        }
        await kasirApi.kasir.update(kasirId, formData as UpdateKasirRequest)
        toast.success('Kasir berhasil diperbarui')
      }

      router.push('/owner/manage-kasir')
    } catch (error: unknown) {
      // Handle validation errors
      if (error && typeof error === 'object' && 'code' in error && error.code === 'VALIDATION_ERROR' && 'details' in error) {
        const fieldErrors: Record<string, string> = {}
        const details = error.details as Record<string, string>
        if (details.nama) fieldErrors.nama = details.nama
        setErrors(fieldErrors)
      } else {
        const errorMessage = error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Terjadi kesalahan'
        toast.error(errorMessage)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
            <div className="h-4 w-64 bg-gray-200 rounded mb-8" />
            <Card>
              <CardHeader>
                <div className="h-6 w-32 bg-gray-200 rounded" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-10 bg-gray-200 rounded" />
                <div className="h-10 bg-gray-200 rounded" />
                <div className="h-10 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid={`kasir-form-page-${mode}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="flex items-center gap-2"
              data-testid="back-button"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Button>
          </div>

          <Breadcrumb className="mb-4" data-testid="breadcrumb">
            <BreadcrumbList>
              {breadcrumbItems.map((item) => (
                <BreadcrumbItem key={item.label}>
                  {item.href ? (
                    <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                  ) : (
                    item.label
                  )}
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          <div data-testid="page-title-section">
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
              {title}
            </h1>
            <p className="text-gray-600 mt-1" data-testid="page-subtitle">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="kasir-form-content">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Kasir</CardTitle>
          </CardHeader>
          <CardContent>
            <KasirForm
              errors={errors}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-8" data-testid="form-actions">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            data-testid="cancel-button"
          >
            <X className="w-4 h-4 mr-2" />
            Batal
          </Button>
          <Button
            type="button"
            onClick={() => {
              const form = document.querySelector('[data-testid="kasir-form"]') as HTMLFormElement
              form?.requestSubmit()
            }}
            disabled={isSubmitting}
            className="bg-yellow-400 hover:bg-yellow-500 text-black"
            data-testid="submit-button"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-black border-t-transparent" />
                {mode === 'add' ? 'Menyimpan...' : 'Mengupdate...'}
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                {mode === 'add' ? 'Tambah Kasir' : 'Update Kasir'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}