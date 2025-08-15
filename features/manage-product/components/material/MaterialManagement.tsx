'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MaterialList } from './MaterialList'
import { MaterialForm } from './MaterialForm'
import { MaterialDeleteConfirmationDialog } from './MaterialDeleteConfirmationDialog'
import { ManageProductErrorBoundary } from '../shared/ManageProductErrorBoundary'
import {
  useMaterials,
  useCreateMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
} from '@/features/manage-product/hooks/useMaterials'
import { showSuccess, showError } from '@/lib/notifications'
import type { Material, MaterialFormData } from '@/features/manage-product/types/material'

type MaterialModalMode = 'view' | 'add' | 'edit'

interface MaterialManagementProps {
  className?: string
}

function MaterialManagementContent({ className }: MaterialManagementProps) {
  const [mode, setMode] = useState<MaterialModalMode>('view')
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // API hooks - following exact useCategories pattern
  const { data: materialsData, isLoading: loading } = useMaterials({ limit: 50 })
  const createMaterialMutation = useCreateMaterial()
  const updateMaterialMutation = useUpdateMaterial()
  const deleteMaterialMutation = useDeleteMaterial()

  const materials = materialsData?.materials || []

  const handleAddMaterial = () => {
    setSelectedMaterial(null)
    setMode('add')
  }

  const handleEditMaterial = (material: Material) => {
    setSelectedMaterial(material)
    setMode('edit')
  }

  const handleDeleteMaterial = (material: Material) => {
    setSelectedMaterial(material)
    setDeleteDialogOpen(true)
  }

  const handleFormSubmit = async (formData: MaterialFormData) => {
    try {
      if (mode === 'add') {
        await createMaterialMutation.mutateAsync({
          name: formData.name,
          pricePerUnit: typeof formData.pricePerUnit === 'string' 
            ? parseFloat(formData.pricePerUnit) 
            : formData.pricePerUnit,
          unit: formData.unit,
        })
        showSuccess('Material berhasil ditambahkan', `Material ${formData.name} telah dibuat`)
      } else if (mode === 'edit' && selectedMaterial) {
        await updateMaterialMutation.mutateAsync({
          id: selectedMaterial.id,
          data: {
            name: formData.name,
            pricePerUnit: typeof formData.pricePerUnit === 'string' 
              ? parseFloat(formData.pricePerUnit) 
              : formData.pricePerUnit,
            unit: formData.unit,
          },
        })
        showSuccess(
          'Material berhasil diperbarui',
          `Perubahan pada material ${formData.name} telah disimpan`,
        )
      }

      setMode('view')
      setSelectedMaterial(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan material'
      showError('Gagal menyimpan material', errorMessage)
      console.error('Error saving material:', error)
      throw error
    }
  }

  const handleFormCancel = () => {
    setMode('view')
    setSelectedMaterial(null)
  }

  const handleConfirmDelete = async () => {
    if (!selectedMaterial) return

    try {
      await deleteMaterialMutation.mutateAsync(selectedMaterial.id)
      showSuccess('Material berhasil dihapus', `Material ${selectedMaterial.name} telah dihapus`)
      setDeleteDialogOpen(false)
      setSelectedMaterial(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus material'
      showError('Gagal menghapus material', errorMessage)
      console.error('Error deleting material:', error)
    }
  }

  return (
    <>
      <div className={`space-y-6 w-full ${className}`}>
        {mode === 'view' ? (
          <>
            <MaterialList
              materials={materials}
              onEdit={handleEditMaterial}
              onDelete={handleDeleteMaterial}
              loading={loading}
            />

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button
                onClick={handleAddMaterial}
                className="bg-yellow-400 hover:bg-yellow-500 text-black"
                disabled={
                  loading || createMaterialMutation.isPending || updateMaterialMutation.isPending
                }
              >
                Tambah Material
              </Button>
            </div>
          </>
        ) : (
          <MaterialForm
            mode={mode}
            material={selectedMaterial}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            existingMaterials={materials}
          />
        )}
      </div>

      <MaterialDeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        material={selectedMaterial}
        loading={deleteMaterialMutation.isPending}
      />
    </>
  )
}

export function MaterialManagement(props: MaterialManagementProps) {
  return (
    <ManageProductErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Terjadi Kesalahan</h3>
          <p className="text-gray-600 mb-4">
            Maaf, terjadi kesalahan saat memuat halaman manajemen material. 
            Silakan refresh halaman atau hubungi administrator jika masalah berlanjut.
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-yellow-400 hover:bg-yellow-500 text-black"
          >
            Refresh Halaman
          </Button>
        </div>
      }
    >
      <MaterialManagementContent {...props} />
    </ManageProductErrorBoundary>
  )
}