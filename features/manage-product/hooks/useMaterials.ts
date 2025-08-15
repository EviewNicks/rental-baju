/**
 * useMaterials Hook - Material data management for RPK-45
 * Follows exact pattern from useCategories.ts for consistency
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { materialApi } from '../api'
import type { MaterialQueryParams } from '../types/material'

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
    queryFn: () => materialApi.getMaterials(params),
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
    mutationFn: materialApi.createMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.all })
    },
  })
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { 
      id: string; 
      data: { name?: string; pricePerUnit?: number; unit?: string } 
    }) => materialApi.updateMaterial(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.detail(id) })
    },
  })
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: materialApi.deleteMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.materials.all })
    },
  })
}