"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import type { CostItem } from '../../types/costItem'

const costItemFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Nama cost item tidak boleh kosong')
    .max(255, 'Nama cost item maksimal 255 karakter')
    .trim()
    .refine((val) => val.length > 0, {
      message: 'Nama cost item tidak boleh hanya berisi spasi',
    }),
})

type CostItemFormData = z.infer<typeof costItemFormSchema>

interface CostItemFormProps {
  costItemId?: string
}

// Loading skeleton component
function CostItemFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="flex items-center gap-3 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-16" />
      </div>
    </div>
  )
}

export function CostItemForm({ costItemId }: CostItemFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(!!costItemId)

  const form = useForm<CostItemFormData>({
    resolver: zodResolver(costItemFormSchema),
    defaultValues: {
      name: '',
    },
  })

  const isEditing = !!costItemId

  // Load existing cost item data for editing
  useEffect(() => {
    if (!costItemId) return

    const loadCostItem = async () => {
      try {
        setIsLoadingData(true)
        const response = await fetch(`/api/cost-items/${costItemId}`)
        
        if (!response.ok) {
          throw new Error('Gagal memuat data cost item')
        }

        const costItem: CostItem = await response.json()
        form.reset({
          name: costItem.name,
        })
      } catch (error) {
        console.error('Error loading cost item:', error)
        toast.error('Gagal memuat data cost item')
        router.push('/cost-items')
      } finally {
        setIsLoadingData(false)
      }
    }

    loadCostItem()
  }, [costItemId, form, router])

  const onSubmit = async (data: CostItemFormData) => {
    try {
      setIsLoading(true)

      const url = isEditing ? `/api/cost-items/${costItemId}` : '/api/cost-items'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Gagal menyimpan cost item')
      }

      toast.success(`Cost item berhasil ${isEditing ? 'diperbarui' : 'dibuat'}`)

      router.push('/cost-items')
    } catch (error) {
      console.error('Error saving cost item:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan cost item')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return <CostItemFormSkeleton />
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Cost Item *</Label>
        <Input
          id="name"
          placeholder="Contoh: Kain Katun Premium, Transport Jakarta, Penjahit Budi"
          {...form.register('name')}
          disabled={isLoading}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="flex items-center gap-3 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {isEditing ? 'Memperbarui...' : 'Menyimpan...'}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {isEditing ? 'Perbarui' : 'Simpan'}
            </div>
          )}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/cost-items')}
          disabled={isLoading}
        >
          Batal
        </Button>
      </div>
    </form>
  )
}