"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, Plus, X, Loader2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
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
  const [availableCostItems, setAvailableCostItems] = useState<CostItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

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

  // Debounced search with loading indicator
  const debouncedSearch = useCallback(
    (term: string) => {
      if (term.trim()) {
        setIsSearching(true)
        setShowSearchResults(true)
        
        // Simulate search delay for better UX
        setTimeout(() => {
          setIsSearching(false)
        }, 300)
      } else {
        setShowSearchResults(false)
        setIsSearching(false)
      }
    },
    []
  )

  // Handle search input change
  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedSearch(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, debouncedSearch])

  // Filter available cost items based on search and already selected items
  const filteredCostItems = useMemo(() => {
    if (!searchTerm.trim()) return []
    
    const selectedIds = new Set(selectedCosts.map(cost => cost.costItemId))
    
    return availableCostItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
      const notSelected = !selectedIds.has(item.id)
      return matchesSearch && notSelected
    })
  }, [availableCostItems, selectedCosts, searchTerm])

  // Check if search term matches any existing item exactly
  const hasExactMatch = useMemo(() => {
    return availableCostItems.some(item => 
      item.name.toLowerCase() === searchTerm.toLowerCase().trim()
    )
  }, [availableCostItems, searchTerm])

  // Calculate modal awal whenever selected costs change
  const modalAwal = useMemo(() => {
    return selectedCosts.reduce((total, cost) => total + (cost.amount || 0), 0)
  }, [selectedCosts])

  // Notify parent of modal awal changes - FIXED: Use ref to prevent infinite loop
  const modalAwalRef = React.useRef(modalAwal)
  const onModalAwalChangeRef = React.useRef(onModalAwalChange)
  
  // Update ref when callback changes
  React.useEffect(() => {
    onModalAwalChangeRef.current = onModalAwalChange
  }, [onModalAwalChange])
  
  useEffect(() => {
    if (modalAwalRef.current !== modalAwal) {
      modalAwalRef.current = modalAwal
      onModalAwalChangeRef.current(modalAwal)
    }
  }, [modalAwal])

  // Handle adding existing cost item
  const handleAddExistingCostItem = (costItem: CostItem) => {
    const newCost: ProductCostFormData = {
      costItemId: costItem.id,
      amount: 0,
      notes: '', // Keep for backend compatibility but won't show in UI
    }

    onCostsChange([...selectedCosts, newCost])
    setSearchTerm('')
    setShowSearchResults(false)
    toast.success(`${costItem.name} ditambahkan ke daftar biaya`)
  }

  // Handle creating new cost item
  const handleCreateNewCostItem = async () => {
    if (!searchTerm.trim() || hasExactMatch || isCreating) return

    try {
      setIsCreating(true)
      
      const response = await fetch('/api/cost-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: searchTerm.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Gagal membuat cost item')
      }

      const newCostItem = await response.json()
      
      // Add to available items
      setAvailableCostItems(prev => [...prev, newCostItem])
      
      // Add to selected costs
      const newCost: ProductCostFormData = {
        costItemId: newCostItem.id,
        amount: 0,
        notes: '', // Keep for backend compatibility but won't show in UI
      }
      
      onCostsChange([...selectedCosts, newCost])
      setSearchTerm('')
      setShowSearchResults(false)
      
      toast.success(`Cost item "${newCostItem.name}" berhasil dibuat dan ditambahkan`)
    } catch (error) {
      console.error('Error creating cost item:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal membuat cost item')
    } finally {
      setIsCreating(false)
    }
  }

  const handleRemoveCostItem = (costItemId: string) => {
    const updatedCosts = selectedCosts.filter(cost => cost.costItemId !== costItemId)
    onCostsChange(updatedCosts)
  }

  // Format currency helper function
  const formatCurrency = (value: string): string => {
    // Remove all non-digits
    const numbers = value.replace(/\D/g, '')
    if (!numbers) return ''
    
    // Format with thousand separators
    const formatted = new Intl.NumberFormat('id-ID').format(parseInt(numbers))
    return `Rp${formatted}`
  }

  // Parse currency back to number
  const parseCurrency = (value: string): number => {
    const numbers = value.replace(/\D/g, '')
    return numbers ? parseInt(numbers) : 0
  }

  const handleAmountChange = (costItemId: string, formattedValue: string) => {
    const numericValue = parseCurrency(formattedValue)
    const updatedCosts = selectedCosts.map(cost =>
      cost.costItemId === costItemId
        ? { ...cost, amount: Math.max(0, numericValue) }
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
      {/* Smart Search Section */}
      <Card className='py-4'>
        <CardContent>
          <div className="space-y-4">
            <Label className="text-sm font-medium">Tambah Biaya</Label>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Ketik nama cost item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                onFocus={() => searchTerm.trim() && setShowSearchResults(true)}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
              )}
            </div>

            {/* Search Results */}
            {showSearchResults && searchTerm.trim() && (
              <div className="border rounded-lg bg-white shadow-sm max-h-60 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                    Mencari cost items...
                  </div>
                ) : (
                  <>
                    {/* Existing Items */}
                    {filteredCostItems.length > 0 && (
                      <div className="p-2">
                        <div className="text-xs font-medium text-gray-500 mb-2 px-2">
                          Ditemukan {filteredCostItems.length} item
                        </div>
                        {filteredCostItems.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleAddExistingCostItem(item)}
                            className="w-full text-left p-3 hover:bg-gray-50 rounded-md transition-colors flex items-center gap-3"
                          >
                            <Package className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium text-sm">{item.name}</div>
                              <div className="text-xs text-gray-500">
                                Klik untuk menambahkan
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Create New Option */}
                    {!hasExactMatch && searchTerm.trim() && (
                      <div className="border-t p-2">
                        <button
                          onClick={handleCreateNewCostItem}
                          disabled={isCreating}
                          className="w-full text-left p-3 hover:bg-blue-50 rounded-md transition-colors flex items-center gap-3 text-blue-600"
                        >
                          {isCreating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          <div>
                            <div className="font-medium text-sm">
                              {isCreating ? 'Membuat...' : `+ Buat "${searchTerm.trim()}"`}
                            </div>
                            <div className="text-xs text-blue-500">
                              Cost item baru akan dibuat dan ditambahkan
                            </div>
                          </div>
                        </button>
                      </div>
                    )}

                    {/* No Results */}
                    {filteredCostItems.length === 0 && hasExactMatch && (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Item sudah ada dalam daftar atau sudah dipilih
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Helper Text */}
            {!showSearchResults && (
              <p className="text-xs text-gray-500">
                Ketik untuk mencari cost item yang ada atau buat yang baru
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Cost Items */}
      {selectedCosts.length > 0 && (
        <Card className='py-4'>
          <CardContent >
            <div className="space-y-4">
              <Label className="text-sm font-medium">Biaya Terpilih</Label>
              
              <div className="space-y-3">
                {selectedCosts.map((cost) => (
                  <div key={cost.costItemId} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {getCostItemName(cost.costItemId)}
                      </div>
                    </div>
                    
                    <div className="w-40">
                      <Input
                        type="text"
                        placeholder="Rp0"
                        value={cost.amount ? formatCurrency(cost.amount.toString()) : ''}
                        onChange={(e) => handleAmountChange(cost.costItemId, e.target.value)}
                        className="text-right font-medium"
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
      <Card className={`py-4 ${modalAwal === 0 ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Label className={`text-sm font-medium ${modalAwal === 0 ? 'text-blue-900' : 'text-green-900'}`}>
                Total Modal Awal
              </Label>
            </div>
            <div className={`text-lg font-bold ${modalAwal === 0 ? 'text-blue-900' : 'text-green-900'}`}>
              {formatRupiah(modalAwal)}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}