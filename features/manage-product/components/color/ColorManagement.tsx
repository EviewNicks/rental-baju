'use client'

import { useState, useEffect } from 'react'
import { ColorList } from './ColorList'
import { ColorForm } from './ColorForm'
import { DeleteConfirmationDialog } from '../category/DeleteConfirmationDialog'
import { mockColors } from '../../data/mock-colors'
import type { Color, ColorFormData, ColorModalMode } from '../../types/color'
import { Button } from '@/components/ui/button'

interface ColorManagementProps {
  className?: string
}

export function ColorManagement({ className }: ColorManagementProps) {
  const [colors, setColors] = useState<Color[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<ColorModalMode>('view')
  const [selectedColor, setSelectedColor] = useState<Color | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Load colors
  useEffect(() => {
    loadColors()
  }, [])

  const loadColors = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setColors(mockColors)
    } catch (error) {
      console.error('Error loading colors:', error)
    } finally {
      setLoading(false)
    }
  }

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
        // Simulate API call for adding color
        await new Promise((resolve) => setTimeout(resolve, 1500))

        const newColor: Color = {
          id: Date.now().toString(),
          name: formData.name,
          hex_value: formData.hex_value,
          product_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        setColors((prev) => [...prev, newColor])
      } else if (mode === 'edit' && selectedColor) {
        // Simulate API call for updating color
        await new Promise((resolve) => setTimeout(resolve, 1500))

        setColors((prev) =>
          prev.map((color) =>
            color.id === selectedColor.id
              ? {
                  ...color,
                  name: formData.name,
                  hex_value: formData.hex_value,
                  updated_at: new Date().toISOString(),
                }
              : color,
          ),
        )
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

    setDeleteLoading(true)
    try {
      // Simulate API call for deleting color
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setColors((prev) => prev.filter((color) => color.id !== selectedColor.id))
      setDeleteDialogOpen(false)
      setSelectedColor(null)
    } catch (error) {
      console.error('Error deleting color:', error)
    } finally {
      setDeleteLoading(false)
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
              loading={loading}
            />

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button
                onClick={handleAddColor}
                className="bg-yellow-400 hover:bg-yellow-500 text-black"
                disabled={loading}
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
        loading={deleteLoading}
      />
    </>
  )
}
