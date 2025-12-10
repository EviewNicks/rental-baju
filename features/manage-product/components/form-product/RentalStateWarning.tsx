'use client'

import { AlertTriangle, Clock, XCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RentalStateDetails {
  ageCategory: string
  size: string
  requestedQuantity: number
  minimumRequired: number
  currentRented: number
  currentLost: number
}

interface RentalStateWarningProps {
  details: RentalStateDetails
  onClose?: () => void
  showTransactionLink?: boolean
}

export function RentalStateWarning({ 
  details, 
  onClose, 
  showTransactionLink = true 
}: RentalStateWarningProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Konflik dengan Item yang Sedang Dirental
          </h3>
          
          <div className="mt-3 space-y-3">
            {/* Size Details */}
            <div className="bg-white rounded-md p-3 border border-red-100">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Ukuran:</span>
                  <div className="text-gray-900">{details.ageCategory} - {details.size}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Quantity Diminta:</span>
                  <div className="text-red-600 font-medium">{details.requestedQuantity}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Minimum Diperlukan:</span>
                  <div className="text-green-600 font-medium">{details.minimumRequired}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Selisih:</span>
                  <div className="text-red-600 font-medium">
                    -{details.minimumRequired - details.requestedQuantity}
                  </div>
                </div>
              </div>
            </div>

            {/* Rental Status Breakdown */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Status Item Saat Ini:</h4>
              <div className="space-y-1">
                {details.currentRented > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                    <span className="text-orange-700">
                      <strong>{details.currentRented} item</strong> sedang dirental oleh customer
                    </span>
                  </div>
                )}
                {details.currentLost > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <XCircle className="w-3 h-3 text-red-500" />
                    <span className="text-red-700">
                      <strong>{details.currentLost} item</strong> dilaporkan hilang
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Solutions */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                💡 Solusi yang Dapat Dilakukan:
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>
                    <strong>Tunggu pengembalian:</strong> Tunggu hingga customer mengembalikan item yang sedang dirental
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>
                    <strong>Tingkatkan quantity:</strong> Ubah quantity minimal menjadi {details.minimumRequired} atau lebih
                  </span>
                </li>
                {details.currentLost > 0 && (
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>
                      <strong>Resolusi item hilang:</strong> Selesaikan kasus item hilang terlebih dahulu
                    </span>
                  </li>
                )}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              {showTransactionLink && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={() => {
                    // Navigate to transaction page
                    window.open('/kasir/transaksi', '_blank')
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Lihat Status Rental
                </Button>
              )}
              
              {onClose && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Tutup
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to extract rental state details from error
export function extractRentalStateDetails(error: unknown): RentalStateDetails | null {
  try {
    // Handle structured error from API
    const errorData = (error as Error & { 
      cause?: { 
        response?: { 
          error?: { 
            code: string
            details?: RentalStateDetails 
          } 
        } 
      } 
    })?.cause?.response?.error

    if (errorData?.code === 'QUANTITY_VALIDATION_ERROR' && errorData.details) {
      return errorData.details
    }

    return null
  } catch {
    return null
  }
}