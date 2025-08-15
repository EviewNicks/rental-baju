'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MaterialList } from './MaterialList'
import { MaterialForm } from './MaterialForm'
import { DeleteConfirmationDialog } from '../category/DeleteConfirmationDialog'
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

export function MaterialManagement({ className }: MaterialManagementProps) {
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

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        // Reuse existing dialog with material data
        category={selectedMaterial as any} // Type compatibility hack for reusing existing dialog
        loading={deleteMaterialMutation.isPending}
      />
    </>
  )
}