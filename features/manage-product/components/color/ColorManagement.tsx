'use client'

import { useState } from 'react'
import { ColorList } from './ColorList'
import { ColorForm } from './ColorForm'
import { DeleteConfirmationDialog } from '../category/DeleteConfirmationDialog'
import { useColors, useCreateColor, useUpdateColor, useDeleteColor } from '../../hooks/useCategories'
import type { Color, ColorFormData, ColorModalMode } from '../../types/color'
import { Button } from '@/components/ui/button'

interface ColorManagementProps {
  className?: string
}

export function ColorManagement({ className }: ColorManagementProps) {
  // Use simplified hooks instead of manual state management
  const { data: colorsData, isLoading } = useColors({ isActive: true })
  const colors = colorsData?.colors || []

  // Mutations
  const createColorMutation = useCreateColor()
  const updateColorMutation = useUpdateColor()
  const deleteColorMutation = useDeleteColor()

  // Local UI state
  const [mode, setMode] = useState<ColorModalMode>('view')
  const [selectedColor, setSelectedColor] = useState<Color | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleAddColor = () => {
    setSelectedColor(null)
    setMode('add')
  }

  const handleEditColor = (color: Color) => {
    setSelectedColor(color)
    setMode('edit')
  }

  const handleDeleteColor = (color: Color) => {
    setSelectedColor(color)
    setDeleteDialogOpen(true)
  }

  const handleFormSubmit = async (formData: ColorFormData) => {
    try {
      if (mode === 'add') {
        await createColorMutation.mutateAsync({
          name: formData.name,
          hexCode: formData.hexCode,
        })
      } else if (mode === 'edit' && selectedColor) {
        await updateColorMutation.mutateAsync({
          id: selectedColor.id,
          data: {
            name: formData.name,
            hexCode: formData.hexCode,
          }
        })
      }

      setMode('view')
      setSelectedColor(null)
    } catch (error) {
      console.error('Error saving color:', error)
      throw error
    }
  }

  const handleFormCancel = () => {
    setMode('view')
    setSelectedColor(null)
  }

  const handleConfirmDelete = async () => {
    if (!selectedColor) return

    try {
      await deleteColorMutation.mutateAsync(selectedColor.id)
      setDeleteDialogOpen(false)
      setSelectedColor(null)
    } catch (error) {
      console.error('Error deleting color:', error)
    }
  }

  return (
    <>
      <div className={`space-y-6 w-full ${className}`}>
        {mode === 'view' ? (
          <>
            <ColorList
              colors={colors}
              onEdit={handleEditColor}
              onDelete={handleDeleteColor}
              loading={isLoading}
            />

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button
                onClick={handleAddColor}
                className="bg-yellow-400 hover:bg-yellow-500 text-black"
                disabled={isLoading}
              >
                Tambah Warna
              </Button>
            </div>
          </>
        ) : (
          <ColorForm
            mode={mode}
            color={selectedColor}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            existingColors={colors}
          />
        )}
      </div>

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        category={selectedColor as any} // Reusing the same dialog component
        loading={deleteColorMutation.isPending}
      />
    </>
  )
}
