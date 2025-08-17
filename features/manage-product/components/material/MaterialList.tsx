'use client'

import { Edit, Trash2, Package, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/features/manage-product/hooks/useDebounce'
import type { Material } from '@/features/manage-product/types/material'
import { logger } from '@/services/logger'

// Component-specific logger for material list
const listLogger = logger.child('MaterialList')

interface MaterialListProps {
  materials: Material[]
  onEdit: (material: Material) => void
  onDelete: (material: Material) => void
  loading?: boolean
}

export function MaterialList({ materials, onEdit, onDelete, loading }: MaterialListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  
  // Debounce search term to improve performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Log component mount and data changes
  useEffect(() => {
    const safeMaterialsLength = Array.isArray(materials) ? materials.length : 0
    listLogger.debug('componentMount', 'MaterialList component mounted', {
      materialsCount: safeMaterialsLength,
      loading
    })
  }, [materials, loading])

  useEffect(() => {
    const safeMaterials = Array.isArray(materials) ? materials : []
    if (safeMaterials.length > 0) {
      listLogger.info('materialsLoaded', 'Materials data loaded successfully', {
        materialsCount: safeMaterials.length,
        materialNames: safeMaterials.slice(0, 5).map(m => m?.name || 'Unknown') // Log first 5 for debugging
      })
    }
  }, [materials])

  // Filter materials by debounced search term with performance logging
  const filteredMaterials = (() => {
    const timer = logger.startTimer('MaterialList', 'filterMaterials', 'material_filtering')
    
    // Defensive programming: handle undefined/null materials array
    const safeMaterials = Array.isArray(materials) ? materials : []
    
    const filtered = safeMaterials.filter(material =>
      material?.name?.toLowerCase()?.includes(debouncedSearchTerm.toLowerCase()) || false
    )
    
    const duration = timer.end()
    
    // Log search performance and results
    if (debouncedSearchTerm) {
      listLogger.info('filterMaterials', 'Search filtering completed', {
        searchTerm: debouncedSearchTerm,
        totalMaterials: safeMaterials.length,
        filteredCount: filtered.length,
        duration: `${duration}ms`,
        filterEfficiency: safeMaterials.length > 0 ? `${((filtered.length / safeMaterials.length) * 100).toFixed(1)}%` : '0%'
      })
    }
    
    return filtered
  })()

  // Handle search term changes with logging
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    
    if (value.length === 0) {
      listLogger.debug('handleSearchChange', 'Search cleared', {
        previousLength: searchTerm.length
      })
    } else if (value.length === 1) {
      const safeMaterialsLength = Array.isArray(materials) ? materials.length : 0
      listLogger.debug('handleSearchChange', 'User started searching', {
        materialsCount: safeMaterialsLength
      })
    }
  }

  // Handle user interactions with logging
  const handleEdit = (material: Material) => {
    listLogger.info('handleEdit', 'User initiated material edit', {
      materialId: material.id,
      materialName: material.name,
      fromSearch: debouncedSearchTerm.length > 0,
      searchTerm: debouncedSearchTerm || null
    })
    onEdit(material)
  }

  const handleDelete = (material: Material) => {
    listLogger.info('handleDelete', 'User initiated material deletion', {
      materialId: material.id,
      materialName: material.name,
      fromSearch: debouncedSearchTerm.length > 0,
      searchTerm: debouncedSearchTerm || null
    })
    onDelete(material)
  }

  if (loading) {
    listLogger.debug('renderSkeleton', 'Rendering loading skeleton state')
    return <MaterialListSkeleton />
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Material Tersedia</h3>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Cari material..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredMaterials.length === 0 ? (
        (() => {
          const safeMaterialsLength = Array.isArray(materials) ? materials.length : 0
          listLogger.info('renderEmptyState', 'Rendering empty state', {
            hasSearch: debouncedSearchTerm.length > 0,
            searchTerm: debouncedSearchTerm,
            totalMaterials: safeMaterialsLength,
            isFiltered: debouncedSearchTerm.length > 0
          })
          return <EmptyState hasSearch={debouncedSearchTerm.length > 0} />
        })()
      ) : (
        <div className="space-y-3">
          {filteredMaterials.map((material) => (
            <div
              key={material.id}
              className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-lg hover:border-yellow-200 transition-all duration-200"
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{material.name}</h4>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-gray-600">
                      Rp {material.pricePerUnit.toLocaleString('id-ID')} per {material.unit}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {material.unit}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(material)}
                  className="hover:bg-blue-50 hover:border-blue-200"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(material)}
                  className="hover:bg-red-50 hover:border-red-200 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MaterialListSkeleton() {
  return (
    <div className="space-y-4 w-full">
      <h3 className="text-lg font-semibold text-gray-900">Material Tersedia</h3>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyState({ hasSearch = false }: { hasSearch?: boolean }) {
  return (
    <div className="text-center py-12">
      <Package className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">
        {hasSearch ? 'Tidak ada material yang ditemukan' : 'Belum ada material'}
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        {hasSearch 
          ? 'Coba ubah kata kunci pencarian Anda'
          : 'Mulai dengan menambahkan material pertama Anda'
        }
      </p>
    </div>
  )
}