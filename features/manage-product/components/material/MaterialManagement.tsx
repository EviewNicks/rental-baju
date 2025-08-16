'use client'

import React, { useState } from 'react'
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
import { logger } from '@/services/logger'

// Component-specific logger for material management
const componentLogger = logger.child('MaterialManagement')

type MaterialModalMode = 'view' | 'add' | 'edit'

interface MaterialManagementProps {
  className?: string
}

function MaterialManagementContent({ className }: MaterialManagementProps) {
  const [mode, setMode] = useState<MaterialModalMode>('view')
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // API hooks - following exact useCategories pattern
  const { data: materialsData, isLoading: loading, error } = useMaterials({ limit: 50 })
  const createMaterialMutation = useCreateMaterial()
  const updateMaterialMutation = useUpdateMaterial()
  const deleteMaterialMutation = useDeleteMaterial()

  const materials = materialsData?.materials || []

  // Log component mount and data loading state
  React.useEffect(() => {
    componentLogger.debug('MaterialManagementContent', 'Component mounted', {
      materialsCount: materials.length,
      loading,
      hasError: !!error
    })

    if (error) {
      componentLogger.error('MaterialManagementContent', 'Error loading materials data', error)
    }
  }, [materials.length, loading, error])

  // Log mode changes for user behavior tracking
  React.useEffect(() => {
    componentLogger.debug('MaterialManagementContent', 'Mode changed', {
      newMode: mode,
      selectedMaterialId: selectedMaterial?.id,
      selectedMaterialName: selectedMaterial?.name
    })
  }, [mode, selectedMaterial])

  const handleAddMaterial = () => {
    componentLogger.info('handleAddMaterial', 'User initiated add material workflow', {
      currentMode: mode,
      materialsCount: materials.length
    })
    setSelectedMaterial(null)
    setMode('add')
  }

  const handleEditMaterial = (material: Material) => {
    componentLogger.info('handleEditMaterial', 'User initiated edit material workflow', {
      materialId: material.id,
      materialName: material.name,
      currentMode: mode
    })
    setSelectedMaterial(material)
    setMode('edit')
  }

  const handleDeleteMaterial = (material: Material) => {
    componentLogger.info('handleDeleteMaterial', 'User initiated delete material workflow', {
      materialId: material.id,
      materialName: material.name,
      currentMode: mode
    })
    setSelectedMaterial(material)
    setDeleteDialogOpen(true)
  }

  const handleFormSubmit = async (formData: MaterialFormData) => {
    const timer = logger.startTimer('MaterialManagement', 'handleFormSubmit', 'material_form_submit')
    
    try {
      componentLogger.info('handleFormSubmit', 'Starting material form submission', {
        mode,
        materialName: formData.name,
        materialId: selectedMaterial?.id,
        pricePerUnit: formData.pricePerUnit,
        unit: formData.unit
      })

      if (mode === 'add') {
        const materialData = {
          name: formData.name,
          pricePerUnit: typeof formData.pricePerUnit === 'string' 
            ? parseFloat(formData.pricePerUnit) 
            : formData.pricePerUnit,
          unit: formData.unit,
        }
        
        await createMaterialMutation.mutateAsync(materialData)
        const duration = timer.end('Material creation completed successfully')
        
        componentLogger.info('handleFormSubmit', 'Material created successfully', {
          materialName: formData.name,
          duration: `${duration}ms`,
          operation: 'create'
        })
        
        showSuccess('Material berhasil ditambahkan', `Material ${formData.name} telah dibuat`)
      } else if (mode === 'edit' && selectedMaterial) {
        const updateData = {
          name: formData.name,
          pricePerUnit: typeof formData.pricePerUnit === 'string' 
            ? parseFloat(formData.pricePerUnit) 
            : formData.pricePerUnit,
          unit: formData.unit,
        }
        
        await updateMaterialMutation.mutateAsync({
          id: selectedMaterial.id,
          data: updateData,
        })
        const duration = timer.end('Material update completed successfully')
        
        componentLogger.info('handleFormSubmit', 'Material updated successfully', {
          materialId: selectedMaterial.id,
          materialName: formData.name,
          duration: `${duration}ms`,
          operation: 'update'
        })
        
        showSuccess(
          'Material berhasil diperbarui',
          `Perubahan pada material ${formData.name} telah disimpan`,
        )
      }

      setMode('view')
      setSelectedMaterial(null)
    } catch (error) {
      timer.end('Material form submission failed')
      const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan material'
      
      componentLogger.error('handleFormSubmit', 'Material form submission failed', {
        mode,
        materialName: formData.name,
        materialId: selectedMaterial?.id,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message
        } : error
      })
      
      showError('Gagal menyimpan material', errorMessage)
      throw error
    }
  }

  const handleFormCancel = () => {
    componentLogger.info('handleFormCancel', 'User cancelled material form', {
      mode,
      materialId: selectedMaterial?.id,
      materialName: selectedMaterial?.name
    })
    setMode('view')
    setSelectedMaterial(null)
  }

  const handleConfirmDelete = async () => {
    if (!selectedMaterial) {
      componentLogger.warn('handleConfirmDelete', 'Delete confirmation called without selected material')
      return
    }

    const timer = logger.startTimer('MaterialManagement', 'handleConfirmDelete', 'material_delete')

    try {
      componentLogger.info('handleConfirmDelete', 'Starting material deletion', {
        materialId: selectedMaterial.id,
        materialName: selectedMaterial.name
      })

      await deleteMaterialMutation.mutateAsync(selectedMaterial.id)
      const duration = timer.end('Material deletion completed successfully')
      
      componentLogger.info('handleConfirmDelete', 'Material deleted successfully', {
        materialId: selectedMaterial.id,
        materialName: selectedMaterial.name,
        duration: `${duration}ms`
      })
      
      showSuccess('Material berhasil dihapus', `Material ${selectedMaterial.name} telah dihapus`)
      setDeleteDialogOpen(false)
      setSelectedMaterial(null)
    } catch (error) {
      timer.end('Material deletion failed')
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus material'
      
      componentLogger.error('handleConfirmDelete', 'Material deletion failed', {
        materialId: selectedMaterial.id,
        materialName: selectedMaterial.name,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message
        } : error
      })
      
      showError('Gagal menghapus material', errorMessage)
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