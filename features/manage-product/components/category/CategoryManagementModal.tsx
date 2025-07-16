'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CategoryList } from './CategoryList'
import { CategoryForm } from './CategoryForm'
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog'
import { mockCategories } from '@/features/manage-product/data/mock-categories'
import { generateCategoryColors } from '@/features/manage-product/lib/utils/color'
import type { Category, CategoryFormData, CategoryModalMode } from '@/features/manage-product/types'

interface CategoryManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CategoryManagementModal({ isOpen, onClose }: CategoryManagementModalProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<CategoryModalMode>('view')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Load categories on modal open
  useEffect(() => {
    if (isOpen) {
      loadCategories()
    }
  }, [isOpen])

  const loadCategories = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setCategories(mockCategories)
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = () => {
    setSelectedCategory(null)
    setMode('add')
  }

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category)
    setMode('edit')
  }

  const handleDeleteCategory = (category: Category) => {
    setSelectedCategory(category)
    setDeleteDialogOpen(true)
  }

  const handleFormSubmit = async (formData: CategoryFormData) => {
    try {
      const colors = generateCategoryColors(formData.color)

      if (mode === 'add') {
        // Simulate API call for adding category
        await new Promise((resolve) => setTimeout(resolve, 1500))

        const newCategory: Category = {
          id: Date.now().toString(),
          name: formData.name,
          ...colors,
          product_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        setCategories((prev) => [...prev, newCategory])
      } else if (mode === 'edit' && selectedCategory) {
        // Simulate API call for updating category
        await new Promise((resolve) => setTimeout(resolve, 1500))

        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === selectedCategory.id
              ? {
                  ...cat,
                  name: formData.name,
                  ...colors,
                  updated_at: new Date().toISOString(),
                }
              : cat,
          ),
        )
      }

      setMode('view')
      setSelectedCategory(null)
    } catch (error) {
      console.error('Error saving category:', error)
      throw error
    }
  }

  const handleFormCancel = () => {
    setMode('view')
    setSelectedCategory(null)
  }

  const handleConfirmDelete = async () => {
    if (!selectedCategory) return

    setDeleteLoading(true)
    try {
      // Simulate API call for deleting category
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setCategories((prev) => prev.filter((cat) => cat.id !== selectedCategory.id))
      setDeleteDialogOpen(false)
      setSelectedCategory(null)
    } catch (error) {
      console.error('Error deleting category:', error)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleModalClose = () => {
    if (mode !== 'view') {
      setMode('view')
      setSelectedCategory(null)
    } else {
      onClose()
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Kelola Kategori</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Atur kategori produk untuk organisasi inventaris yang lebih baik
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {mode === 'view' ? (
              <>
                <CategoryList
                  categories={categories}
                  onEdit={handleEditCategory}
                  onDelete={handleDeleteCategory}
                  loading={loading}
                />

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <Button
                    onClick={handleAddCategory}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black"
                    disabled={loading}
                  >
                    Tambah Kategori
                  </Button>
                </div>
              </>
            ) : (
              <CategoryForm
                mode={mode}
                category={selectedCategory}
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
                existingCategories={categories}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        category={selectedCategory}
        loading={deleteLoading}
      />
    </>
  )
}
