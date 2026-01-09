'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { CostItem } from '../../types/costItem'

interface CostItemModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  costItem?: CostItem | null // null for create, CostItem for edit
}

export function CostItemModal({ open, onClose, onSuccess, costItem }: CostItemModalProps) {
  const [name, setName] = useState(costItem?.name || '')
  const [isLoading, setIsLoading] = useState(false)
  const isEdit = !!costItem

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Nama cost item tidak boleh kosong')
      return
    }

    setIsLoading(true)

    try {
      const url = isEdit ? `/api/cost-items/${costItem.id}` : '/api/cost-items'
      const method = isEdit ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Gagal menyimpan cost item')
      }

      toast.success(
        isEdit ? 'Cost item berhasil diperbarui' : 'Cost item berhasil ditambahkan'
      )
      
      onSuccess()
      onClose()
      setName('')
    } catch (error) {
      console.error('Error saving cost item:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan cost item')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
      setName('')
    }
  }

  // Reset form when modal opens with different cost item
  React.useEffect(() => {
    if (open) {
      setName(costItem?.name || '')
    }
  }, [open, costItem])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Cost Item' : 'Tambah Cost Item'}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Ubah nama cost item. Klik simpan untuk menyimpan perubahan.'
              : 'Masukkan nama cost item baru. Cost item dapat berupa material, transport, penjahit, atau biaya lainnya.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nama
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Kain Katun Premium"
                className="col-span-3"
                disabled={isLoading}
                autoFocus
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? 'Menyimpan...' : (isEdit ? 'Simpan' : 'Tambah')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}