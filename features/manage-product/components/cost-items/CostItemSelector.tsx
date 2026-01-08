"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { Search, Plus, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { formatRupiah } from '@/features/dana-kasir/utils/currency'
import type { CostItem, ProductCostFormData } from '../../types/costItem'

interface CostItemSelectorProps {
  selectedCosts: ProductCostFormData[]
  onCostsChange: (costs: ProductCostFormData[]) => void
  onModalAwalChange: (amount: number) => void
  className?: string
}

export function CostItemSelector({
  selectedCosts,
  onCostsChange,
  onModalAwalChange,
  className = '',
}: CostItemSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCostItemId, setSelectedCostItemId] = useState<string>('')
  const [availableCostItems, setAvailableCostItems] = useState<CostItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch available cost items
  useEffect(() => {
    const fetchCostItems = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/cost-items?limit=100')
        
        if (!response.ok) {
          throw new Error('Gagal memuat cost items')
        }

        const data = await response.json()
        setAvailableCostItems(data.costItems || [])
      } catch (error) {
        console.error('Error fetching cost items:', error)
        toast.error('Gagal memuat daftar cost items')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCostItems()
  }, [])

  // Filter available cost items based on search and already selected items
  const filteredCostItems = useMemo(() => {
    const selectedIds = new Set(selectedCosts.map(cost => cost.costItemId))
    
    return availableCostItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
      const notSelected = !selectedIds.has(item.id)
      return matchesSearch && notSelected
    })
  }, [availableCostItems, selectedCosts, searchTerm])

  // Calculate modal awal whenever selected costs change
  const modalAwal = useMemo(() => {
    return selectedCosts.reduce((total, cost) => total + (cost.amount || 0), 0)
  }, [selectedCosts])

  // Notify parent of modal awal changes
  useEffect(() => {
    onModalAwalChange(modalAwal)
  }, [modalAwal, onModalAwalChange])

  const handleAddCostItem = () => {
    if (!selectedCostItemId) return

    const costItem = availableCostItems.find(item => item.id === selectedCostItemId)
    if (!costItem) return

    const newCost: ProductCostFormData = {
      costItemId: selectedCostItemId,
      amount: 0,
      notes: '',
    }

    onCostsChange([...selectedCosts, newCost])
    setSelectedCostItemId('')
    setSearchTerm('')
  }

  const handleRemoveCostItem = (costItemId: string) => {
    const updatedCosts = selectedCosts.filter(cost => cost.costItemId !== costItemId)
    onCostsChange(updatedCosts)
  }

  const handleAmountChange = (costItemId: string, amount: number) => {
    const updatedCosts = selectedCosts.map(cost =>
      cost.costItemId === costItemId
        ? { ...cost, amount: Math.max(0, amount) }
        : cost
    )
    onCostsChange(updatedCosts)
  }

  const handleNotesChange = (costItemId: string, notes: string) => {
    const updatedCosts = selectedCosts.map(cost =>
      cost.costItemId === costItemId
        ? { ...cost, notes }
        : cost
    )
    onCostsChange(updatedCosts)
  }

  const getCostItemName = (costItemId: string) => {
    return availableCostItems.find(item => item.id === costItemId)?.name || 'Unknown Cost Item'
  }

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Memuat cost items...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Add Cost Item Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Label className="text-sm font-medium">Tambah Item Biaya</Label>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cari cost item..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select
                value={selectedCostItemId}
                onValueChange={setSelectedCostItemId}
                disabled={filteredCostItems.length === 0}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Pilih cost item" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCostItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                onClick={handleAddCostItem}
                disabled={!selectedCostItemId}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Tambah
              </Button>
            </div>
            
            {filteredCostItems.length === 0 && searchTerm && (
              <p className="text-sm text-gray-500">
                Tidak ada cost item yang cocok dengan pencarian &ldquo;{searchTerm}&rdquo;
              </p>
            )}

            {availableCostItems.length === 0 && (
              <p className="text-sm text-gray-500">
                Belum ada cost item. Silakan buat cost item terlebih dahulu.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Cost Items */}
      {selectedCosts.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Label className="text-sm font-medium">Item Biaya Terpilih</Label>
              
              <div className="space-y-3">
                {selectedCosts.map((cost) => (
                  <div key={cost.costItemId} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {getCostItemName(cost.costItemId)}
                      </div>
                    </div>
                    
                    <div className="w-32">
                      <Input
                        type="number"
                        placeholder="Jumlah"
                        value={cost.amount || ''}
                        onChange={(e) => handleAmountChange(cost.costItemId, parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="text-right"
                      />
                    </div>
                    
                    <div className="w-40">
                      <Input
                        placeholder="Catatan (opsional)"
                        value={cost.notes || ''}
                        onChange={(e) => handleNotesChange(cost.costItemId, e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveCostItem(cost.costItemId)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Awal Display */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium text-blue-900">
              Total Modal Awal
            </Label>
            <div className="text-lg font-bold text-blue-900">
              {formatRupiah(modalAwal)}
            </div>
          </div>
          {selectedCosts.length > 0 && (
            <div className="text-xs text-blue-700 mt-1">
              Dihitung otomatis dari {selectedCosts.length} item biaya
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}