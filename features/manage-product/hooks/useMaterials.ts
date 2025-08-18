/**
 * useMaterials Hook - Material data management for RPK-45
 * Follows exact pattern from useCategories.ts for consistency
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { materialApi } from '../api'
import type { MaterialQueryParams } from '../types/material'
import { logger } from '@/services/logger'

// Component-specific logger for material hooks
const hookLogger = logger.child('useMaterials')

// Simple query keys following useCategories.ts pattern
const queryKeys = {
  materials: {
    all: ['materials'] as const,
    list: (params: MaterialQueryParams | undefined) => ['materials', 'list', params] as const,
    detail: (id: string) => ['materials', 'detail', id] as const,
  }
}

// === MATERIALS ===
export function useMaterials(params?: MaterialQueryParams) {
  return useQuery({
    queryKey: queryKeys.materials.list(params),
    queryFn: async () => {
      const timer = logger.startTimer('useMaterials', 'getMaterials', 'materials_query')
      try {
        hookLogger.debug('getMaterials', 'Starting materials query', { params })
        const result = await materialApi.getMaterials(params)
        const duration = timer.end('Materials query completed successfully')
        
        hookLogger.info('getMaterials', 'Materials fetched successfully', {
          count: result.materials?.length || 0,
          duration: `${duration}ms`,
          hasFilters: !!params?.search
        })
        return result
      } catch (error) {
        timer.end('Materials query failed')
        hookLogger.error('getMaterials', 'Failed to fetch materials', error as Error)
        throw error
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - materials don't change often
  })
}

export function useMaterial(id: string) {
  return useQuery({
    queryKey: queryKeys.materials.detail(id),
    queryFn: () => materialApi.getMaterialById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateMaterial() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { name: string; pricePerUnit: number; unit: string }) => {
      hookLogger.info('createMaterial', 'Starting material creation', { 
        name: data.name,
        unit: data.unit
      })
      try {
        const result = await materialApi.createMaterial(data)
        hookLogger.info('createMaterial', 'Material created successfully', {
          materialId: result.id,
          name: result.name
        })
        return result
      } catch (error) {
        hookLogger.error('createMaterial', 'Failed to create material', error as Error)
        throw error
      }
    },
    onSuccess: (result) => {
      try {
        queryClient.invalidateQueries({ queryKey: queryKeys.materials.all })
        hookLogger.debug('createMaterial', 'Material cache invalidated successfully', {
          materialId: result.id
        })
      } catch (error) {
        hookLogger.warn('createMaterial', 'Cache invalidation failed after material creation', { 
          error: error instanceof Error ? error.message : String(error) 
        })
      }
    },
  })
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { 
      id: string; 
      data: { name?: string; pricePerUnit?: number; unit?: string } 
    }) => {
      hookLogger.info('updateMaterial', 'Starting material update', {
        materialId: id,
        changes: Object.keys(data)
      })
      try {
        const result = await materialApi.updateMaterial(id, data)
        hookLogger.info('updateMaterial', 'Material updated successfully', {
          materialId: id,
          updatedFields: Object.keys(data)
        })
        return result
      } catch (error) {
        hookLogger.error('updateMaterial', 'Failed to update material', error as Error)
        throw error
      }
    },
    onSuccess: (_, { id }) => {
      try {
        queryClient.invalidateQueries({ queryKey: queryKeys.materials.all })
        queryClient.invalidateQueries({ queryKey: queryKeys.materials.detail(id) })
        hookLogger.debug('updateMaterial', 'Material cache invalidated after update', {
          materialId: id
        })
      } catch (error) {
        hookLogger.warn('updateMaterial', 'Cache invalidation failed after material update', { 
          error: error instanceof Error ? error.message : String(error) 
        })
      }
    },
  })
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      hookLogger.info('deleteMaterial', 'Starting material deletion', { materialId: id })
      try {
        const result = await materialApi.deleteMaterial(id)
        hookLogger.info('deleteMaterial', 'Material deleted successfully', { materialId: id })
        return result
      } catch (error) {
        hookLogger.error('deleteMaterial', 'Failed to delete material', error as Error)
        throw error
      }
    },
    onSuccess: (_, id) => {
      try {
        queryClient.invalidateQueries({ queryKey: queryKeys.materials.all })
        hookLogger.debug('deleteMaterial', 'Material cache invalidated after deletion', {
          materialId: id
        })
      } catch (error) {
        hookLogger.warn('deleteMaterial', 'Cache invalidation failed after material deletion', { 
          error: error instanceof Error ? error.message : String(error) 
        })
      }
    },
  })
}