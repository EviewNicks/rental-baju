/**
 * PenaltyBadge Component - Return Penalty Integration
 * Displays penalty information with visual distinction and detailed breakdown
 * Requirements 4.4, 4.6: Visual indicator and breakdown display
 */

'use client'

import React, { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { formatCurrency } from '@/features/kasir/lib/utils/client'

interface PenaltyBadgeProps {
  penalty: {
    total: number
    late: number
    condition: number
    breakdown: Array<{
      kondisiAkhir: string
      jumlahKembali: number
      penaltyAmount: number
    }>
  }
  compact?: boolean
  'data-testid'?: string
}

export function PenaltyBadge({
  penalty,
  compact = false,
  'data-testid': dataTestId,
}: PenaltyBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Get condition label in Indonesian
  const getConditionLabel = (kondisi: string): string => {
    const labels: Record<string, string> = {
      kotor: 'Kotor',
      rusak: 'Rusak',
      hilang: 'Hilang',
      baik: 'Baik',
    }
    return labels[kondisi.toLowerCase()] || kondisi
  }

  // Get condition color
  const getConditionColor = (kondisi: string): string => {
    const colors: Record<string, string> = {
      kotor: 'text-yellow-700 bg-yellow-50',
      rusak: 'text-orange-700 bg-orange-50',
      hilang: 'text-red-700 bg-red-50',
      baik: 'text-green-700 bg-green-50',
    }
    return colors[kondisi.toLowerCase()] || 'text-gray-700 bg-gray-50'
  }

  if (compact) {
    // Compact view: Just show total with icon
    return (
      <div
        data-testid={dataTestId}
        className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-md text-xs font-medium"
        title={`Total Denda: ${formatCurrency(penalty.total)}`}
      >
        <AlertTriangle className="w-3 h-3" />
        <span>{formatCurrency(penalty.total)}</span>
      </div>
    )
  }

  // Full view with expandable breakdown
  return (
    <div data-testid={dataTestId} className="space-y-2">
      {/* Penalty Summary */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <div className="text-left">
            <div className="text-sm font-medium text-red-900">Denda Pengembalian</div>
            <div className="text-xs text-red-700">
              {formatCurrency(penalty.total)}
            </div>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-red-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-red-600" />
        )}
      </button>

      {/* Expanded Breakdown */}
      {isExpanded && (
        <div className="pl-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
          {/* Late Penalty */}
          {penalty.late > 0 && (
            <div className="flex justify-between items-center text-xs p-2 bg-orange-50 rounded">
              <span className="text-orange-700 font-medium">Denda Keterlambatan:</span>
              <span className="text-orange-900 font-semibold">
                {formatCurrency(penalty.late)}
              </span>
            </div>
          )}

          {/* Condition Penalty */}
          {penalty.condition > 0 && (
            <div className="flex justify-between items-center text-xs p-2 bg-yellow-50 rounded">
              <span className="text-yellow-700 font-medium">Denda Kondisi:</span>
              <span className="text-yellow-900 font-semibold">
                {formatCurrency(penalty.condition)}
              </span>
            </div>
          )}

          {/* Detailed Breakdown by Condition */}
          {penalty.breakdown.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="text-xs font-medium text-gray-700 mb-1">Detail per Kondisi:</div>
              {penalty.breakdown.map((item, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center text-xs p-2 rounded ${getConditionColor(item.kondisiAkhir)}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{getConditionLabel(item.kondisiAkhir)}</span>
                    <span className="text-gray-600">({item.jumlahKembali} item)</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(item.penaltyAmount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
