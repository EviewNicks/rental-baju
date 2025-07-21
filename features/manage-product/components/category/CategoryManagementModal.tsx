'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CategoryList } from './CategoryList'
import { CategoryForm } from './CategoryForm'
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/features/manage-product/hooks/useCategories'
import { showSuccess, showError } from '@/lib/notifications'
import type {
  ClientCategory,
  CategoryFormData,
  CategoryModalMode,
} from '@/features/manage-product/types'

interface CategoryManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CategoryManagementModal({ isOpen, onClose }: CategoryManagementModalProps) {
  const [mode, setMode] = useState<CategoryModalMode>('view')
  const [selectedCategory, setSelectedCategory] = useState<ClientCategory | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // API hooks
  const { data: categoriesData, isLoading: loading } = useCategories({ includeProducts: true })
  const createCategoryMutation = useCreateCategory()
  const updateCategoryMutation = useUpdateCategory()
  const deleteCategoryMutation = useDeleteCategory()

  const categories = categoriesData?.categories || []

  const handleAddCategory = () => {
    setSelectedCategory(null)
    setMode('add')
  }

  const handleEditCategory = (category: ClientCategory) => {
    setSelectedCategory(category)
    setMode('edit')
  }

  const handleDeleteCategory = (category: ClientCategory) => {
    setSelectedCategory(category)
    setDeleteDialogOpen(true)
  }

  const handleFormSubmit = async (formData: CategoryFormData) => {
    try {
      if (mode === 'add') {
        await createCategoryMutation.mutateAsync({
          name: formData.name,
          color: formData.color,
        })
        showSuccess('Kategori berhasil ditambahkan', `Kategori ${formData.name} telah dibuat`)
      } else if (mode === 'edit' && selectedCategory) {
        await updateCategoryMutation.mutateAsync({
          id: selectedCategory.id,
          data: {
            name: formData.name,
            color: formData.color,
          },
        })
        showSuccess(
          'Kategori berhasil diperbarui',
          `Perubahan pada kategori ${formData.name} telah disimpan`,
        )
      }

      setMode('view')
      setSelectedCategory(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan kategori'
      showError('Gagal menyimpan kategori', errorMessage)
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

    try {
      await deleteCategoryMutation.mutateAsync(selectedCategory.id)
      showSuccess('Kategori berhasil dihapus', `Kategori ${selectedCategory.name} telah dihapus`)
      setDeleteDialogOpen(false)
      setSelectedCategory(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus kategori'
      showError('Gagal menghapus kategori', errorMessage)
      console.error('Error deleting category:', error)
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
                    disabled={
                      loading ||
                      createCategoryMutation.isPending ||
                      updateCategoryMutation.isPending
                    }
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
        loading={deleteCategoryMutation.isPending}
      />
    </>
  )
}
