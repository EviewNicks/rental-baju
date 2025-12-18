'use client'

/**
 * PengeluaranForm Component
 * 
 * Modal form for creating and editing expenses
 * 
 * Features:
 * - Modal dialog with form
 * - Amount input with Rupiah formatting
 * - Category dropdown with fixed options
 * - Description textarea
 * - Client-side validation using Zod
 * - Create and edit modes
 * - Loading states
 * - Error handling
 * - Mobile-friendly inputs
 * 
 * Requirements: 2.1, 2.2, 2.3, 3.2, 3.3, 9.1, 9.2, 9.3, 9.4, 10.4
 */

import { useState, useEffect } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createPengeluaranSchema, updatePengeluaranSchema } from '../validation'
import { useCreatePengeluaran } from '../hooks/useCreatePengeluaran'
import { useUpdatePengeluaran } from '../hooks/useUpdatePengeluaran'
import { PengeluaranKasir, EXPENSE_CATEGORIES, ExpenseCategory } from '../types'
import { formatRupiah } from '../utils/currency'

interface PengeluaranFormProps {
  isOpen: boolean
  onClose: () => void
  initialData?: PengeluaranKasir | null
  onSuccess?: () => void
}

interface FormData {
  kasirId: string  // NEW: Selected kasir from dropdown
  harga: number
  kategori: ExpenseCategory | ''
  deskripsi: string
}

interface FormErrors {
  kasirId?: string  // NEW
  harga?: string
  kategori?: string
  deskripsi?: string
}

// NEW: Kasir list item type
interface KasirListItem {
  id: string
  nama: string
}

export function PengeluaranForm({ 
  isOpen, 
  onClose, 
  initialData, 
  onSuccess 
}: PengeluaranFormProps) {
  const isEditMode = !!initialData
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    kasirId: '',  // NEW
    harga: 0,
    kategori: '',
    deskripsi: ''
  })
  
  const [amountInput, setAmountInput] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  
  // NEW: Kasir list state
  const [kasirList, setKasirList] = useState<KasirListItem[]>([])
  const [isLoadingKasir, setIsLoadingKasir] = useState(false)
  
  // Mutations
  const createMutation = useCreatePengeluaran()
  const updateMutation = useUpdatePengeluaran()
  
  const isLoading = createMutation.isPending || updateMutation.isPending

  // NEW: Fetch kasir list when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchKasirList()
    }
  }, [isOpen])

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Edit mode - populate form
        setFormData({
          kasirId: initialData.kasirId,  // NEW
          harga: initialData.harga,
          kategori: initialData.kategori,
          deskripsi: initialData.deskripsi || '',
        })
        setAmountInput(formatRupiah(initialData.harga))
      } else {
        // Create mode - reset form
        setFormData({
          kasirId: '',  // NEW
          harga: 0,
          kategori: '',
          deskripsi: ''
        })
        setAmountInput('')
      }
      setErrors({})
    }
  }, [isOpen, initialData])

  // NEW: Fetch kasir list from API
  const fetchKasirList = async () => {
    setIsLoadingKasir(true)
    try {
      // Use existing /api/kasir/kasir endpoint with appropriate params
      // limit=100 to get all active kasir (reasonable limit for dropdown)
      // isActive=true to filter only active kasir
      const response = await fetch('/api/kasir/kasir?limit=100&isActive=true')
      if (!response.ok) {
        throw new Error('Failed to fetch kasir list')
      }
      const result = await response.json()
      if (result.success && result.data?.data) {
        // Extract id and nama only for dropdown
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        const simplifiedList = result.data.data.map((kasir:any) => ({
          id: kasir.id,
          nama: kasir.nama
        }))
        setKasirList(simplifiedList)
      }
    } catch (error) {
      console.error('Error fetching kasir list:', error)
      toast.error('Gagal memuat daftar kasir')
    } finally {
      setIsLoadingKasir(false)
    }
  }

  // Handle amount input formatting
  const handleAmountChange = (value: string) => {
    // Remove all non-digit characters
    const numericValue = value.replace(/[^0-9]/g, '')
    
    if (numericValue === '') {
      setAmountInput('')
      setFormData(prev => ({ ...prev, harga: 0 }))
      return
    }

    const numberValue = parseInt(numericValue, 10)
    setAmountInput(formatRupiah(numberValue))
    setFormData(prev => ({ ...prev, harga: numberValue }))
    
    // Clear error when user types
    if (errors.harga) {
      setErrors(prev => ({ ...prev, harga: undefined }))
    }
  }

  // NEW: Handle kasir change
  const handleKasirChange = (value: string) => {
    setFormData(prev => ({ ...prev, kasirId: value }))
    
    // Clear error when user selects
    if (errors.kasirId) {
      setErrors(prev => ({ ...prev, kasirId: undefined }))
    }
  }

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, kategori: value as ExpenseCategory }))
    
    // Clear error when user selects
    if (errors.kategori) {
      setErrors(prev => ({ ...prev, kategori: undefined }))
    }
  }

  // Handle description change
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, deskripsi: value }))
    
    // Clear error when user types
    if (errors.deskripsi) {
      setErrors(prev => ({ ...prev, deskripsi: undefined }))
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const schema = isEditMode ? updatePengeluaranSchema : createPengeluaranSchema
    const result = schema.safeParse(formData)
    
    if (!result.success) {
      const newErrors: FormErrors = {}
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FormErrors
        newErrors[field] = issue.message
      })
      setErrors(newErrors)
      return false
    }
    
    setErrors({})
    return true
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!validateForm()) {
      toast.error('Mohon perbaiki kesalahan pada form')
      return
    }
    
    try {
      if (isEditMode && initialData) {
        // Update existing expense
        await updateMutation.mutateAsync({
          id: initialData.id,
          data: {
            kasirId: formData.kasirId,  // NEW: Include kasirId
            harga: formData.harga,
            kategori: formData.kategori as ExpenseCategory,
            deskripsi: formData.deskripsi || undefined,
          },
        })
        toast.success('Pengeluaran berhasil diperbarui')
      } else {
        // Create new expense
        await createMutation.mutateAsync({
          kasirId: formData.kasirId,  // NEW: Include kasirId
          harga: formData.harga,
          kategori: formData.kategori as ExpenseCategory,
          deskripsi: formData.deskripsi || undefined,
        })
        toast.success('Pengeluaran berhasil ditambahkan')
      }
      
      onSuccess?.()
      handleClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan'
      toast.error(errorMessage)
    }
  }

  // Handle close
  const handleClose = () => {
    if (isLoading) return // Prevent closing while loading
    setFormData({ kasirId: '', harga: 0, kategori: '', deskripsi: '' })  // NEW: Reset kasirId
    setAmountInput('')
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {isEditMode ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={isLoading}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* NEW: Kasir Selection Field */}
          <div className="space-y-2">
            <Label htmlFor="kasirId">
              Kasir <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.kasirId}
              onValueChange={handleKasirChange}
              disabled={isLoading || isLoadingKasir}
            >
              <SelectTrigger 
                id="kasirId"
                className="w-full"
                aria-invalid={!!errors.kasirId}
              >
                <SelectValue placeholder={isLoadingKasir ? "Memuat..." : "Pilih kasir"} />
              </SelectTrigger>
              <SelectContent>
                {kasirList.map((kasir) => (
                  <SelectItem key={kasir.id} value={kasir.id}>
                    {kasir.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.kasirId && (
              <p className="text-sm text-red-600">{errors.kasirId}</p>
            )}
          </div>

          {/* Amount Field */}
          <div className="space-y-2">
            <Label htmlFor="harga">
              Jumlah <span className="text-red-500">*</span>
            </Label>
            <Input
              id="harga"
              type="text"
              inputMode="numeric"
              placeholder="Rp 0"
              value={amountInput}
              onChange={(e) => handleAmountChange(e.target.value)}
              disabled={isLoading}
              className="text-right"
              aria-invalid={!!errors.harga}
            />
            {errors.harga && (
              <p className="text-sm text-red-600">{errors.harga}</p>
            )}
          </div>

          {/* Category Field */}
          <div className="space-y-2">
            <Label htmlFor="kategori">
              Kategori <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.kategori}
              onValueChange={handleCategoryChange}
              disabled={isLoading}
            >
              <SelectTrigger 
                id="kategori"
                className="w-full"
                aria-invalid={!!errors.kategori}
              >
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.kategori && (
              <p className="text-sm text-red-600">{errors.kategori}</p>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="deskripsi">Deskripsi</Label>
            <Textarea
              id="deskripsi"
              placeholder="Deskripsi pengeluaran (opsional)"
              className="resize-none min-h-[80px]"
              maxLength={500}
              value={formData.deskripsi}
              onChange={handleDescriptionChange}
              disabled={isLoading}
              aria-invalid={!!errors.deskripsi}
            />
            {errors.deskripsi && (
              <p className="text-sm text-red-600">{errors.deskripsi}</p>
            )}
            {formData.deskripsi && (
              <p className="text-xs text-gray-500">
                {formData.deskripsi.length}/500 karakter
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 space-y-2 space-y-reverse sm:space-y-0 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.kasirId || !formData.harga || !formData.kategori}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? 'Memperbarui...' : 'Menyimpan...'}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditMode ? 'Perbarui' : 'Simpan'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
