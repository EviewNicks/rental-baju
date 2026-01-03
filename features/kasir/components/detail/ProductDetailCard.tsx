import { Tag, Palette, Shirt, CheckCircle, Package, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '../../lib/utils/client'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import {
  parseKondisiAwal,
  formatSizeWithAge,
  extractSizeInfo,
} from '../../lib/utils/kondisiAwalParser'
import { 
  calculateReturnProgress, 
  type TransaksiItemWithReturns 
} from '../../lib/utils/partialReturnHelpers'
import { ReturnProgressIndicator } from '../ui/return-progress-indicator'
// TASK 23: Remove unused SarungPairingIndicator import (now using separate cards)

interface ProductDetailCardProps {
  item: {
    product: {
      id: string
      name: string
      category: string
      size: string
      color: string
      image: string
      description?: string
    }
    quantity: number
    jumlahDiambil?: number
    pricePerDay: number
    duration: number
    subtotal: number
    // Return system data
    statusKembali?: 'lengkap' | 'sebagian' | 'belum'
    totalReturnPenalty?: number
    conditionBreakdown?: Array<{
      id: string
      kondisiAkhir: string
      jumlahKembali: number
      penaltyAmount: number
      modalAwalUsed?: number | null
      createdAt?: string
      createdBy?: string
    }>
    // RPK-51: kondisiAwal field for AgeSizes parsing
    kondisiAwal?: string
    // TASK 19: Add linkedSarung data for pairing display (DEPRECATED - use separate cards)
    linkedSarung?: {
      productId: string
      productSizeId: string
      quantity: number
      product?: {
        id: string
        code: string
        name: string
        category: string
        imageUrl?: string // ✅ TASK 24: Add imageUrl field
      }
      selectedSize?: {
        id: string
        size: string
        ageCategory: string
      }
    }
    // TASK 23: Sarung gratis identification
    isSarungGratis?: boolean
    pairedWithJas?: string
    pairedWithJasId?: string
  }
  // Optional explicit pickup information - if not provided, will calculate from item.jumlahDiambil
  pickupInfo?: {
    jumlahDiambil: number // How many items have been picked up
    remainingQuantity: number // How many items are left to pick up
  }
}

export function ProductDetailCard({ item, pickupInfo }: ProductDetailCardProps) {
  // Parse size information from kondisiAwal (RPK-51 AgeSizes system)
  const sizeInfo = extractSizeInfo(item)
  const parsedKondisiAwal = parseKondisiAwal(item.kondisiAwal)

  // 🆕 ENHANCEMENT: Calculate base price from adjusted price
  const durationMultiplier = item.duration === 7 ? 1.5 : 1.0
  const basePricePerDay = Math.round(item.pricePerDay / durationMultiplier)
  const adjustedPricePerDay = item.pricePerDay // This is already adjusted

  // Calculate pickup status - use explicit pickupInfo or derive from item data
  const actualJumlahDiambil = pickupInfo?.jumlahDiambil ?? item.jumlahDiambil ?? 0
  const actualRemainingQuantity =
    pickupInfo?.remainingQuantity ?? item.quantity - actualJumlahDiambil
  // Show pickup status when there's pickup activity OR when items are available for pickup
  // BUT hide if return is complete (statusKembali === 'lengkap')
  // FIXED: Properly check return status to prevent showing pickup info for completed returns
  const hasPickupData =
    (actualJumlahDiambil > 0 || (actualRemainingQuantity > 0 && item.quantity > 0)) &&
    // Hide pickup status when item is fully returned
    item.statusKembali !== 'lengkap'

  // Return data detection - simplified logic focusing on actual return status
  // Display return section when item has been returned (lengkap or sebagian) with condition data
  const hasReturnData = Boolean(
    item.statusKembali && item.statusKembali !== 'belum' && item.conditionBreakdown?.length,
  )

  // Enhanced penalty detection with stricter validation
  const hasPenalty = Boolean(
    item.totalReturnPenalty &&
      typeof item.totalReturnPenalty === 'number' &&
      item.totalReturnPenalty > 0 &&
      !isNaN(item.totalReturnPenalty),
  )

  // ✅ TASK 7: Calculate return progress for this item (Requirements: 4.1, 4.5)
  const returnProgress = calculateReturnProgress({
    id: item.product.id,
    jumlahDiambil: actualJumlahDiambil,
    conditionBreakdown: item.conditionBreakdown,
  } as TransaksiItemWithReturns)

  // ✅ TASK 7: Show return progress when items have been picked up (Requirements: 4.2, 4.3)
  const shouldShowReturnProgress = actualJumlahDiambil > 0

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 shadow-lg shadow-gray-900/5 transition-all duration-200">
      <div className="flex items-start gap-4">
        <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
          <Image
            src={
              item.product.image?.startsWith('/') || item.product.image?.startsWith('http')
                ? item.product.image || '/products/image.png'
                : `/${item.product.image || 'products/image.png'}`
            }
            alt={`${item.product.name}${item.product.category ? ` - ${item.product.category}` : ''}${item.product.color ? ` dalam warna ${item.product.color}` : ''}`}
            width={200}
            height={200}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 leading-tight">
              {item.product.name}
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* TASK 23: Enhanced category badge for sarung gratis */}
            {item.isSarungGratis ? (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs font-medium border-green-200 bg-green-50 text-green-700 hover:bg-green-100',
                  'transition-colors duration-200',
                )}
                aria-label={`Sarung gratis dari: ${item.pairedWithJas}`}
              >
                <Tag className="h-3 w-3 mr-1.5" aria-hidden="true" />
                Sarung Gratis
              </Badge>
            ) : item.product.category && (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs font-medium border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
                  'transition-colors duration-200',
                )}
                aria-label={`Kategori: ${item.product.category}`}
              >
                <Tag className="h-3 w-3 mr-1.5" aria-hidden="true" />
                {item.product.category}
              </Badge>
            )}

            {/* Size Badge - Use parsed size info from kondisiAwal (RPK-51) */}
            {sizeInfo.hasSizeInfo && (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs font-medium border-green-200 bg-green-50 text-green-700 hover:bg-green-100',
                  'transition-colors duration-200',
                )}
                aria-label={`Ukuran: ${formatSizeWithAge(sizeInfo.size, sizeInfo.ageCategory)}`}
              >
                <Shirt className="h-3 w-3 mr-1.5" aria-hidden="true" />
                {formatSizeWithAge(sizeInfo.size, sizeInfo.ageCategory)}
              </Badge>
            )}

            {/* Age Category Badge - Show separately if available */}
            {!parsedKondisiAwal.isLegacyFormat && sizeInfo.ageCategory !== 'Tidak diketahui' && (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs font-medium border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100',
                  'transition-colors duration-200',
                )}
                aria-label={`Kategori Usia: ${sizeInfo.ageCategory}`}
              >
                <Users className="h-3 w-3 mr-1.5" aria-hidden="true" />
                {sizeInfo.ageCategory}
              </Badge>
            )}

            {item.product.color && (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs font-medium border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100',
                  'transition-colors duration-200',
                )}
                aria-label={`Warna: ${item.product.color}`}
              >
                <Palette className="h-3 w-3 mr-1.5" aria-hidden="true" />
                {item.product.color}
              </Badge>
            )}

            {!item.product.category && !sizeInfo.hasSizeInfo && !item.product.color && (
              <Badge
                variant="outline"
                className="text-xs text-gray-500 border-gray-200 bg-gray-50"
                aria-label="Informasi produk tidak tersedia"
              >
                <Package className="h-3 w-3 mr-1.5" aria-hidden="true" />
                Info tidak tersedia
              </Badge>
            )}
          </div>

          {/* ✅ TASK 7: Return Progress Section (Requirements: 4.1, 4.2, 4.3, 4.5) */}
          {shouldShowReturnProgress && (
            <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">Progress Pengembalian</span>
                <span className="text-xs text-blue-700">
                  {returnProgress.status === 'complete' ? 'Selesai' : 
                   returnProgress.status === 'partial' ? 'Sebagian' : 'Belum Dimulai'}
                </span>
              </div>
              
              <ReturnProgressIndicator
                progress={returnProgress}
                size="sm"
                showPercentage={true}
                data-testid={`return-progress-${item.product.id}`}
              />
              
              {returnProgress.status === 'partial' && (
                <div className="mt-2 text-xs text-blue-600">
                  Sisa {returnProgress.total - returnProgress.returned} item belum dikembalikan
                </div>
              )}
            </div>
          )}

          {/* Return Status Section - Enhanced with penalty breakdown */}
          {hasReturnData && (
            <div className="p-3 rounded-lg border bg-green-50 border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Status Pengembalian</span>
                </div>
                <div className="text-sm text-green-700">
                  <span className="font-semibold">
                    {item.statusKembali === 'lengkap'
                      ? 'Dikembalikan Lengkap'
                      : item.statusKembali === 'sebagian'
                        ? 'Dikembalikan Sebagian'
                        : 'Dikembalikan'}
                  </span>
                </div>
              </div>
              
              {/* Enhanced penalty display with breakdown */}
              {hasPenalty && (
                <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-orange-800">Total Denda</span>
                    <span className="text-sm font-bold text-orange-700">
                      {formatCurrency(item.totalReturnPenalty!)}
                    </span>
                  </div>
                  
                  {/* Condition breakdown detail - FIXED: Use modalAwalUsed as the actual penalty */}
                  {item.conditionBreakdown && item.conditionBreakdown.length > 0 && (
                    <div className="pt-2 border-t border-orange-200 space-y-1.5">
                      <div className="text-xs font-medium text-orange-800 mb-1">
                        Rincian per Kondisi:
                      </div>
                      {item.conditionBreakdown.map((condition, idx) => {
                        // FIXED: modalAwalUsed is the actual manual price (penalty amount)
                        const actualPenalty = condition.modalAwalUsed || condition.penaltyAmount
                        
                        return (
                          <div key={condition.id || idx} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-orange-700">
                                {condition.kondisiAkhir}
                              </span>
                              <span className="text-orange-600">
                                ({condition.jumlahKembali}x)
                              </span>
                            </div>
                            <span className="font-medium text-orange-700">
                              {formatCurrency(actualPenalty)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Pickup Status Display - Only show if no return data or return not complete */}
          {hasPickupData && !hasReturnData && (
            <div
              className={`p-3 rounded-lg border ${
                actualRemainingQuantity === 0
                  ? 'bg-green-50 border-green-200'
                  : actualJumlahDiambil > 0
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className={`h-4 w-4 ${
                      actualRemainingQuantity === 0
                        ? 'text-green-600'
                        : actualJumlahDiambil > 0
                          ? 'text-blue-600'
                          : 'text-yellow-600'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      actualRemainingQuantity === 0
                        ? 'text-green-900'
                        : actualJumlahDiambil > 0
                          ? 'text-blue-900'
                          : 'text-yellow-900'
                    }`}
                  >
                    Status Pengambilan
                  </span>
                </div>
                <div
                  className={`text-sm ${
                    actualRemainingQuantity === 0
                      ? 'text-green-700'
                      : actualJumlahDiambil > 0
                        ? 'text-blue-700'
                        : 'text-yellow-700'
                  }`}
                >
                  <span className="font-semibold">{actualJumlahDiambil}</span>
                  <span className="mx-1">/</span>
                  <span>{item.quantity}</span>
                  <span className="ml-1">diambil</span>
                </div>
              </div>
              {actualRemainingQuantity > 0 && (
                <div
                  className={`mt-2 text-xs ${
                    actualJumlahDiambil > 0 ? 'text-blue-600' : 'text-yellow-600'
                  }`}
                >
                  Sisa {actualRemainingQuantity} item belum diambil
                </div>
              )}
              {actualRemainingQuantity === 0 && actualJumlahDiambil > 0 && (
                <div className="mt-2 text-xs text-green-600 font-medium">
                  ✓ Semua item sudah diambil
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50/80 rounded-lg border border-gray-100">
            <div className="text-center md:text-left">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Jumlah
              </div>
              <div
                className="text-lg font-bold text-gray-900"
                aria-label={`Jumlah: ${item.quantity} pieces`}
              >
                {item.quantity}x
              </div>
            </div>
            <div className="text-center md:text-left">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Harga/{item.duration} Hari
              </div>
              {/* TASK 23: Enhanced pricing display for sarung gratis */}
              {item.isSarungGratis ? (
                <div className="space-y-1">
                  <div
                    className="text-lg font-bold text-green-600"
                    aria-label={`Sarung gratis dari ${item.pairedWithJas}`}
                  >
                    GRATIS
                  </div>
                </div>
              ) : item.linkedSarung ? (
                <div className="space-y-1">
                  <div
                    className="text-lg font-bold text-gray-900"
                    aria-label={`Harga jas per ${item.duration} hari: ${formatCurrency(adjustedPricePerDay)}`}
                  >
                    {formatCurrency(adjustedPricePerDay)}
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    + Sarung GRATIS
                  </div>
                </div>
              ) : (
                <div
                  className="text-lg font-bold text-gray-900"
                  aria-label={`Harga per ${item.duration} hari: ${formatCurrency(adjustedPricePerDay)}`}
                >
                  {formatCurrency(adjustedPricePerDay)}
                </div>
              )}
              {/* Show base price if different from adjusted price */}
              {durationMultiplier !== 1.0 && !item.isSarungGratis && (
                <div className="text-xs text-gray-500 mt-1">
                  Base: {formatCurrency(basePricePerDay)}
                </div>
              )}
            </div>
            <div className="text-center md:text-left">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Durasi
              </div>
              <div
                className="text-lg font-bold text-gray-900"
                aria-label={`Durasi sewa: ${item.duration} hari`}
              >
                {item.duration} hari
              </div>
            </div>
            <div className="text-center md:text-left">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Subtotal
              </div>
              <div
                className={`text-lg font-bold ${item.isSarungGratis ? 'text-green-600' : 'text-yellow-600'}`}
                aria-label={`Subtotal: ${formatCurrency(item.subtotal)}`}
              >
                {item.isSarungGratis ? 'GRATIS' : formatCurrency(item.subtotal)}
              </div>
              {/* TASK 19: Show pairing benefit in subtotal (deprecated - using separate cards) */}
              {item.linkedSarung && (
                <div className="text-xs text-green-600 mt-1">
                  (Sarung {item.linkedSarung.quantity}x gratis)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
