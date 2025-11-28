/**
 * SizeDisplay Component
 * Displays product size information (size and age category)
 * Part of product history activity timeline integration
 */

'use client'

import React from 'react'
import { Ruler } from 'lucide-react'
import type { SizeInfo } from '../../types/productHistory'

interface SizeDisplayProps {
  sizeInfo: SizeInfo
  compact?: boolean
  'data-testid'?: string
}

/**
 * Get color classes for age category
 */
function getAgeCategoryColor(ageCategory: string): string {
  const colorMap: Record<string, string> = {
    ADULT: 'text-blue-700 bg-blue-50 border-blue-200',
    CHILD: 'text-pink-700 bg-pink-50 border-pink-200',
    UNIVERSAL: 'text-purple-700 bg-purple-50 border-purple-200',
  }

  return colorMap[ageCategory] || 'text-gray-700 bg-gray-50 border-gray-200'
}

export function SizeDisplay({ sizeInfo, compact = false, 'data-testid': dataTestId }: SizeDisplayProps) {
  // Don't render if no size info
  if (!sizeInfo) {
    return null
  }

  const colorClasses = getAgeCategoryColor(sizeInfo.ageCategory)

  if (compact) {
    // Compact mode: Just icon and display text
    return (
      <div
        data-testid={dataTestId}
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${colorClasses}`}
      >
        <Ruler className="h-3 w-3" />
        <span>{sizeInfo.displayText}</span>
      </div>
    )
  }

  // Full mode: Icon and display text with more spacing
  return (
    <div
      data-testid={dataTestId}
      className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs font-medium ${colorClasses}`}
    >
      <Ruler className="h-3.5 w-3.5" />
      <span>{sizeInfo.displayText}</span>
    </div>
  )
}
