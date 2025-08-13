import { Tag, Package, Palette, Shirt, CheckCircle, Clock, AlertCircle, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '../../lib/utils/client'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import React, { useState } from 'react'

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
  }
  // Optional explicit pickup information - if not provided, will calculate from item.jumlahDiambil
  pickupInfo?: {
    jumlahDiambil: number // How many items have been picked up
    remainingQuantity: number // How many items are left to pick up
  }
}

// Return Status Badge Component
interface ReturnStatusBadgeProps {
  status: 'lengkap' | 'sebagian' | 'belum'
  hasReturnData: boolean
}

const ReturnStatusBadge: React.FC<ReturnStatusBadgeProps> = ({ status, hasReturnData }) => {
  if (!hasReturnData) return null

  const statusConfig = {
    lengkap: {
      variant: 'default' as const,
      text: 'Dikembalikan Lengkap',
      icon: CheckCircle,
      color: 'text-green-700',
      bgColor: 'bg-green-50 border-green-200'
    },
    sebagian: {
      variant: 'secondary' as const,
      text: 'Dikembalikan Sebagian',
      icon: Clock,
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50 border-yellow-200'
    },
    belum: {
      variant: 'outline' as const,
      text: 'Belum Dikembalikan',
      icon: AlertCircle,
      color: 'text-gray-700',
      bgColor: 'bg-gray-50 border-gray-200'
    }
  }

  const config = statusConfig[status] || statusConfig.belum
  const IconComponent = config.icon

  return (
    <div className={cn('border rounded-lg p-3 mb-4', config.bgColor)}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <IconComponent className={cn('h-4 w-4', config.color)} />
          <span className={cn('text-sm font-medium', config.color)}>
            Status Pengembalian
          </span>
        </div>
        <Badge variant={config.variant} className="self-start sm:self-center">{config.text}</Badge>
      </div>
    </div>
  )
}

// Condition Breakdown Component
interface ConditionBreakdownProps {
  conditionBreakdown?: Array<{
    id: string
    kondisiAkhir: string
    jumlahKembali: number
    penaltyAmount: number
    modalAwalUsed?: number | null
  }>
  isMultiCondition: boolean
}

const ConditionBreakdown: React.FC<ConditionBreakdownProps> = ({ 
  conditionBreakdown, 
  isMultiCondition 
}) => {
  if (!conditionBreakdown?.length) return null

  const conditionLabels: Record<string, { text: string; color: string; severity: 'low' | 'medium' | 'high' }> = {
    baik: { text: 'Baik', color: 'text-green-600', severity: 'low' },
    kotor: { text: 'Kotor', color: 'text-yellow-600', severity: 'medium' },
    'rusak ringan': { text: 'Rusak Ringan', color: 'text-orange-600', severity: 'medium' },
    'rusak berat': { text: 'Rusak Berat', color: 'text-red-600', severity: 'high' },
    hilang: { text: 'Hilang', color: 'text-red-800', severity: 'high' }
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">
            Detail Kondisi Pengembalian
          </span>
        </div>
        {isMultiCondition && (
          <Badge variant="outline" className="text-xs self-start sm:self-center">Multi-Kondisi</Badge>
        )}
      </div>
      
      <div className="space-y-2">
        {conditionBreakdown.map((condition, idx) => {
          const conditionConfig = conditionLabels[condition.kondisiAkhir.toLowerCase()] || {
            text: condition.kondisiAkhir,
            color: 'text-gray-600',
            severity: 'low' as const
          }
          
          return (
            <div key={condition.id || idx} 
                 className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 py-2 px-3 bg-white rounded-md border">
              <div className="flex items-center gap-3">
                <div className={cn('w-2 h-2 rounded-full bg-current', conditionConfig.color)} />
                <span className={cn('text-sm font-medium', conditionConfig.color)}>
                  {conditionConfig.text}
                </span>
                <span className="text-xs text-gray-500">
                  {condition.jumlahKembali} item{condition.jumlahKembali > 1 ? 's' : ''}
                </span>
              </div>
              
              {condition.penaltyAmount > 0 && (
                <div className="text-right sm:text-right">
                  <span className="text-sm font-medium text-red-600">
                    {formatCurrency(condition.penaltyAmount)}
                  </span>
                  <div className="text-xs text-gray-500">denda</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Penalty Information Component
interface PenaltyInfoProps {
  totalReturnPenalty: number
  conditionBreakdown?: Array<{
    kondisiAkhir: string
    penaltyAmount: number
    modalAwalUsed?: number | null
  }>
}

const PenaltyInfo: React.FC<PenaltyInfoProps> = ({ 
  totalReturnPenalty, 
  conditionBreakdown 
}) => {
  if (totalReturnPenalty <= 0) return null

  const penaltyConditions = conditionBreakdown?.filter(c => c.penaltyAmount > 0) || []
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <span className="text-sm font-medium text-red-900">
          Informasi Denda Pengembalian
        </span>
      </div>
      
      {penaltyConditions.length > 0 && (
        <div className="space-y-2 mb-3">
          {penaltyConditions.map((condition, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-sm">
              <span className="text-red-700">
                Denda {condition.kondisiAkhir.toLowerCase()}:
              </span>
              <span className="font-medium text-red-800">
                {formatCurrency(condition.penaltyAmount)}
              </span>
            </div>
          ))}
        </div>
      )}
      
      <div className="pt-3 border-t border-red-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
          <span className="text-sm font-medium text-red-900">
            Total Denda:
          </span>
          <span className="text-lg font-bold text-red-800">
            {formatCurrency(totalReturnPenalty)}
          </span>
        </div>
      </div>
    </div>
  )
}

// Return Data Loading Skeleton
const ReturnDataSkeleton: React.FC = () => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 animate-pulse">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-4 h-4 bg-gray-300 rounded"></div>
      <div className="w-32 h-4 bg-gray-300 rounded"></div>
      <div className="w-20 h-6 bg-gray-300 rounded"></div>
    </div>
    <div className="space-y-2">
      <div className="w-full h-3 bg-gray-300 rounded"></div>
      <div className="w-3/4 h-3 bg-gray-300 rounded"></div>
    </div>
  </div>
)

// Return Data Error Boundary
interface ReturnDataErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ReturnDataErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ReturnDataErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ReturnDataErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('Return data display error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              Return data display error
            </span>
          </div>
          <p className="text-xs text-yellow-700 mt-2">
            Unable to display return information. Please refresh to try again.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}

// Safe Return Component Wrapper
interface SafeReturnWrapperProps {
  children: React.ReactNode
  isLoading?: boolean
  hasError?: boolean
}

const SafeReturnWrapper: React.FC<SafeReturnWrapperProps> = ({ 
  children, 
  isLoading = false, 
  hasError = false 
}) => {
  if (isLoading) {
    return <ReturnDataSkeleton />
  }
  
  if (hasError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="text-sm font-medium text-red-800">
            Failed to load return data
          </span>
        </div>
      </div>
    )
  }
  
  return (
    <ReturnDataErrorBoundary>
      {children}
    </ReturnDataErrorBoundary>
  )
}

// Mobile Optimized Return Information
interface MobileOptimizedReturnInfoProps {
  item: {
    statusKembali?: 'lengkap' | 'sebagian' | 'belum'
    totalReturnPenalty?: number
    conditionBreakdown?: Array<{
      id: string
      kondisiAkhir: string
      jumlahKembali: number
      penaltyAmount: number
      modalAwalUsed?: number | null
    }>
  }
  isMultiCondition: boolean
  hasReturnData: boolean
}

const MobileOptimizedReturnInfo: React.FC<MobileOptimizedReturnInfoProps> = ({ item, isMultiCondition, hasReturnData }) => {
  const [isExpanded, setIsExpanded] = useState(true) // Default expanded on desktop, will be controlled on mobile
  
  return (
    <SafeReturnWrapper>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <ReturnStatusBadge 
              status={item.statusKembali as 'lengkap' | 'sebagian' | 'belum'} 
              hasReturnData={hasReturnData}
            />
            {/* Mobile toggle button */}
            {((item.conditionBreakdown && item.conditionBreakdown.length > 0) || (item.totalReturnPenalty && item.totalReturnPenalty > 0)) && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="sm:hidden text-sm text-blue-600 hover:text-blue-800 transition-colors self-start px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                aria-expanded={isExpanded}
                aria-label={isExpanded ? 'Hide return details' : 'Show return details'}
              >
                {isExpanded ? 'Sembunyikan Detail' : 'Tampilkan Detail'}
              </button>
            )}
          </div>
          
          {/* Collapsible content on mobile, always visible on desktop */}
          <div className={cn(
            'space-y-4 transition-all duration-300 ease-in-out',
            isExpanded ? 'block opacity-100' : 'hidden opacity-0',
            'sm:block sm:opacity-100' // Always visible on desktop
          )}>
            <ConditionBreakdown
              conditionBreakdown={item.conditionBreakdown}
              isMultiCondition={isMultiCondition}
            />
            
            <PenaltyInfo
              totalReturnPenalty={item.totalReturnPenalty || 0}
              conditionBreakdown={item.conditionBreakdown}
            />
          </div>
        </div>
      </div>
    </SafeReturnWrapper>
  )
}

export function ProductDetailCard({ item, pickupInfo }: ProductDetailCardProps) {
  // Calculate pickup status - use explicit pickupInfo or derive from item data
  const actualJumlahDiambil = pickupInfo?.jumlahDiambil ?? item.jumlahDiambil ?? 0
  const actualRemainingQuantity =
    pickupInfo?.remainingQuantity ?? item.quantity - actualJumlahDiambil
  // Show pickup status when there's pickup activity OR when items are available for pickup
  const hasPickupData =
    actualJumlahDiambil > 0 || (actualRemainingQuantity > 0 && item.quantity > 0)

  // Return data detection
  const hasReturnData = Boolean(
    item.conditionBreakdown?.length || 
    item.totalReturnPenalty || 
    item.statusKembali
  )
  
  const isMultiCondition = Boolean(
    item.conditionBreakdown && item.conditionBreakdown.length > 1
  )

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
            {item.product.description && (
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                {item.product.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {item.product.category && (
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
            {item.product.size && (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs font-medium border-green-200 bg-green-50 text-green-700 hover:bg-green-100',
                  'transition-colors duration-200',
                )}
                aria-label={`Ukuran: ${item.product.size}`}
              >
                <Shirt className="h-3 w-3 mr-1.5" aria-hidden="true" />
                {item.product.size}
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
            {!item.product.category && !item.product.size && !item.product.color && (
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

          {/* Pickup Status Display */}
          {hasPickupData && (
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

          {/* Return Status Section */}
          {hasReturnData && (
            <MobileOptimizedReturnInfo
              item={item}
              isMultiCondition={isMultiCondition}
              hasReturnData={hasReturnData}
            />
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
                Harga/Hari
              </div>
              <div
                className="text-lg font-bold text-gray-900"
                aria-label={`Harga per hari: ${formatCurrency(item.pricePerDay)}`}
              >
                {formatCurrency(item.pricePerDay)}
              </div>
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
                className="text-lg font-bold text-yellow-600"
                aria-label={`Subtotal: ${formatCurrency(item.subtotal)}`}
              >
                {formatCurrency(item.subtotal)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
