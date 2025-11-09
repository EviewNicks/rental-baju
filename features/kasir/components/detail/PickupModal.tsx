'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, Package, AlertCircle, Minus, Plus, Loader2 } from 'lucide-react'
import {
  usePickupProcess,
  usePickupValidation,
  getPickupErrorMessage,
} from '../../hooks/usePickupProcess'
import type { PickupItemRequest } from '../../hooks/usePickupProcess'
import type { TransactionDetail } from '../../types'

interface PickupModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: TransactionDetail
}

interface PickupItemState extends PickupItemRequest {
  productName: string
  totalQuantity: number
  alreadyPickedUp: number
  remainingQuantity: number
  maxPickup: number
}

// Helper functions for error handling
function getErrorType(error: unknown): 'recoverable' | 'fatal' | 'permission' {
  const errorMessage = error instanceof Error ? error.message : String(error)

  if (
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('conflict') ||
    errorMessage.includes('Database sedang sibuk')
  ) {
    return 'recoverable'
  }

  if (
    errorMessage.includes('izin') ||
    errorMessage.includes('permission') ||
    errorMessage.includes('unauthorized')
  ) {
    return 'permission'
  }

  return 'fatal'
}

function getErrorHelpTip(error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorType = getErrorType(error)

  switch (errorType) {
    case 'recoverable':
      if (errorMessage.includes('connection') || errorMessage.includes('Database')) {
        return 'Pastikan koneksi internet stabil dan coba lagi dalam beberapa saat.'
      }
      if (errorMessage.includes('conflict')) {
        return 'Refresh halaman untuk mendapatkan data terbaru sebelum mencoba lagi.'
      }
      return 'Masalah ini sementara, silakan coba lagi.'

    case 'permission':
      return 'Hubungi administrator jika Anda认为自己应该 memiliki akses.'

    case 'fatal':
    default:
      return 'Jika masalah berlanjut, hubungi tim IT dengan mencatat kode transaksi dan waktu kejadian.'
  }
}

export function PickupModal({ isOpen, onClose, transaction }: PickupModalProps) {
  const [pickupItems, setPickupItems] = useState<PickupItemState[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [pickupNote, setPickupNote] = useState('')
  const [isSyncingCache, setIsSyncingCache] = useState(false)

  const {
    mutate: processPickup,
    isPending,
    error,
    isSuccess,
    data,
    reset,
  } = usePickupProcess(transaction.transactionCode)

  const { validatePickupItems } = usePickupValidation()

  // Define close handler before using it in useEffect
  const handleClose = useCallback(() => {
    // Don't close if still syncing cache
    if (isSyncingCache) {
      return
    }

    setShowSuccess(false)
    setShowConfirmation(false)
    setPickupItems([])
    setPickupNote('') // Reset note when modal closes (RPK-48)
    setIsSyncingCache(false)
    reset()
    onClose()
  }, [isSyncingCache, reset, onClose])

  const handleCloseAfterSync = useCallback(() => {
    // Small delay for visual confirmation
    setTimeout(() => {
      handleClose()
    }, 500)
  }, [handleClose])

  // Monitor cache synchronization state
  useEffect(() => {
    if (isSuccess && isSyncingCache) {
      // Cache synchronization is in progress after successful API call
      console.log('📡 PickupModal: Cache synchronization in progress')

      // Set a timeout to handle potential cache sync issues
      const timeout = setTimeout(() => {
        if (isSyncingCache) {
          console.warn('⚠️ PickupModal: Cache sync timeout, forcing modal close')
          setIsSyncingCache(false)
        }
      }, 10000) // 10 second timeout

      return () => clearTimeout(timeout)
    }
  }, [isSuccess, isSyncingCache])

  // Handle successful pickup with cache sync completion
  useEffect(() => {
    if (isSuccess && !isPending && isSyncingCache) {
      // API call successful, wait a bit for cache sync then close
      const syncTimer = setTimeout(() => {
        setIsSyncingCache(false)
        setShowSuccess(true)

        // Auto close after showing success
        setTimeout(() => {
          handleCloseAfterSync()
        }, 1500)
      }, 500) // Give time for cache sync to complete

      return () => clearTimeout(syncTimer)
    }
  }, [isSuccess, isPending, isSyncingCache, handleCloseAfterSync])

  // Initialize pickup items from transaction data
  useEffect(() => {
    let isEffectActive = true // Prevent state updates if component unmounts

    if (isOpen && transaction.products && isEffectActive) {
      // Transform transaction products to pickup items using real TransaksiItem IDs
      const items: PickupItemState[] = transaction.products.map((product) => {
        const totalQuantity = product.quantity
        // Use actual pickup data from API response
        const alreadyPickedUp = product.jumlahDiambil || 0
        const remainingQuantity = totalQuantity - alreadyPickedUp

        return {
          id: product.id, // Use actual TransaksiItem.id for pickup operations
          jumlahDiambil: 0,
          productName: product.product.name,
          totalQuantity,
          alreadyPickedUp,
          remainingQuantity,
          maxPickup: remainingQuantity,
        }
      })

      if (isEffectActive) {
        setPickupItems(items)
      }
    }

    // Cleanup function for React Strict Mode
    return () => {
      isEffectActive = false
    }
  }, [isOpen, transaction])

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    setPickupItems((items) =>
      items.map((item) =>
        item.id === itemId
          ? { ...item, jumlahDiambil: Math.max(0, Math.min(newQuantity, item.maxPickup)) }
          : item,
      ),
    )
  }

  const incrementQuantity = (itemId: string) => {
    const item = pickupItems.find((i) => i.id === itemId)
    if (item && item.jumlahDiambil < item.maxPickup) {
      handleQuantityChange(itemId, item.jumlahDiambil + 1)
    }
  }

  const decrementQuantity = (itemId: string) => {
    const item = pickupItems.find((i) => i.id === itemId)
    if (item && item.jumlahDiambil > 0) {
      handleQuantityChange(itemId, item.jumlahDiambil - 1)
    }
  }

  const handleSelectAll = () => {
    setPickupItems((items) => items.map((item) => ({ ...item, jumlahDiambil: item.maxPickup })))
  }

  const handleClearAll = () => {
    setPickupItems((items) => items.map((item) => ({ ...item, jumlahDiambil: 0 })))
  }

  const getSelectedItems = () => {
    return pickupItems.filter((item) => item.jumlahDiambil > 0)
  }

  const getTotalSelectedQuantity = () => {
    return pickupItems.reduce((total, item) => total + item.jumlahDiambil, 0)
  }

  const validateAndProceed = () => {
    const selectedItems = getSelectedItems()

    // Mock transaction items for validation - this should come from API
    const mockTransactionItems = pickupItems.map((item) => ({
      id: item.id,
      jumlah: item.totalQuantity,
      jumlahDiambil: item.alreadyPickedUp,
      produk: { name: item.productName },
    }))

    const validation = validatePickupItems(selectedItems, mockTransactionItems)

    if (!validation.valid) {
      // Show validation errors (could use toast or alert)
      console.error('Validation errors:', validation.errors)
      return
    }

    setShowConfirmation(true)
  }

  const handleConfirmPickup = () => {
    const selectedItems = getSelectedItems()

    setIsSyncingCache(true)

    processPickup({
      items: selectedItems.map((item) => ({
        id: item.id,
        jumlahDiambil: item.jumlahDiambil,
      })),
      catatan: pickupNote.trim() || undefined, // Include note if not empty (RPK-48)
    })
  }

  // Loading overlay component
  const LoadingOverlay = () => (
    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
      <div className="flex flex-col items-center space-y-3">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm text-gray-600 font-medium">Memperbarui data...</p>
        <p className="text-xs text-gray-500">Mohon tunggu sebentar</p>
      </div>
    </div>
  )

  // Success state
  if (showSuccess || (isSuccess && data)) {
    return (
      <Dialog open={isOpen} onOpenChange={isSyncingCache ? undefined : handleClose}>
        <DialogContent className="sm:max-w-md">
          {/* Loading overlay during cache synchronization */}
          {isSyncingCache && <LoadingOverlay />}

          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pickup Berhasil!</h3>
            <p className="text-sm text-gray-600 mb-4">
              {data?.message || `Berhasil memproses pickup ${getTotalSelectedQuantity()} item`}
            </p>

            {/* Cache sync status indicator */}
            {isSyncingCache && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-center space-x-2 text-blue-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">Menyinkronkan data...</span>
                </div>
              </div>
            )}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaksi:</span>
                  <span className="font-medium">{transaction.transactionCode}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600">Total Item:</span>
                  <span className="font-medium">{getTotalSelectedQuantity()} item</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600">Waktu:</span>
                  <span className="font-medium">{new Date().toLocaleString('id-ID')}</span>
                </div>
                {pickupNote.trim() && (
                  <div className="mt-2 pt-2 border-t border-green-300">
                    <div className="text-sm text-gray-600 mb-1">Catatan:</div>
                    <div className="text-sm font-medium text-gray-800 bg-green-25 p-2 rounded">
                      {pickupNote.trim()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Close button with disabled state during sync */}
            <div className="mt-6">
              <Button
                onClick={handleClose}
                disabled={isSyncingCache}
                className="w-full"
                variant={isSyncingCache ? 'outline' : 'default'}
              >
                {isSyncingCache ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menyinkronkan Data...</span>
                  </div>
                ) : (
                  'Tutup'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Confirmation state
  if (showConfirmation) {
    const selectedItems = getSelectedItems()

    return (
      <Dialog open={isOpen} onOpenChange={() => setShowConfirmation(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              Konfirmasi Pickup
            </DialogTitle>
            <DialogDescription>Pastikan data pickup sudah benar sebelum diproses</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-orange-900 mb-3">Detail Pickup</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-orange-700">Transaksi:</span>
                  <span className="font-medium">{transaction.transactionCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-700">Total Item:</span>
                  <span className="font-medium">{getTotalSelectedQuantity()} item</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <h5 className="font-medium text-gray-900">Item yang akan diambil:</h5>
              {selectedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded"
                >
                  <span className="text-sm">{item.productName}</span>
                  <span className="text-sm font-medium">{item.jumlahDiambil} pcs</span>
                </div>
              ))}
            </div>

            {/* Pickup Note Input - RPK-48 */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="pickup-note" className="text-sm font-medium text-gray-900">
                Catatan Pickup (opsional)
              </Label>
              <Textarea
                id="pickup-note"
                placeholder="Tambahkan catatan pickup jika diperlukan..."
                value={pickupNote}
                onChange={(e) => setPickupNote(e.target.value)}
                maxLength={1000}
                rows={3}
                className="resize-none"
              />
              <div className="text-xs text-gray-500 text-right">
                {pickupNote.length}/1000 karakter
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmation(false)}
                className="flex-1"
              >
                Kembali
              </Button>
              <Button
                onClick={handleConfirmPickup}
                disabled={isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isPending ? 'Memproses...' : 'Konfirmasi Pickup'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Main pickup selection state
  return (
    <Dialog open={isOpen} onOpenChange={isPending || isSyncingCache ? undefined : handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        {/* Loading overlay during processing */}
        {(isPending || isSyncingCache) && <LoadingOverlay />}

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Proses Pengambilan Item
          </DialogTitle>
          <DialogDescription>
            Transaksi: <span className="font-medium">{transaction.transactionCode}</span> • Pilih
            item dan jumlah yang akan diambil pelanggan
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-blue-900">Ringkasan Pickup</h4>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleClearAll}>
                  Clear All
                </Button>
                <Button size="sm" variant="outline" onClick={handleSelectAll}>
                  Select All
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Total Item:</span>
                <span className="font-medium">{pickupItems.length} produk</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Dipilih:</span>
                <span className="font-medium">{getTotalSelectedQuantity()} pcs</span>
              </div>
            </div>
          </div>

          {/* Enhanced Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold text-red-900 mb-2">Terjadi Kesalahan</div>
                  <div className="text-sm text-red-800 mb-3">{getPickupErrorMessage(error)}</div>

                  {/* Error-specific actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => reset()}
                      className="text-red-700 border-red-300 hover:bg-red-100"
                    >
                      <Package className="h-3 w-3 mr-1" />
                      Coba Lagi
                    </Button>

                    {getErrorType(error) === 'recoverable' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.reload()}
                        className="text-orange-700 border-orange-300 hover:bg-orange-100"
                      >
                        Refresh Halaman
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowConfirmation(false)}
                      className="text-gray-600 hover:bg-gray-100"
                    >
                      Batal
                    </Button>
                  </div>

                  <div className="mt-3 text-xs text-red-600">
                    <strong>Tip:</strong> {getErrorHelpTip(error)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Item Selection List */}
          <div className="space-y-3 mb-6">
            <h5 className="font-medium text-gray-900">Pilih Item untuk Pickup</h5>
            {pickupItems.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h6 className="font-medium text-gray-900">{item.productName}</h6>
                    <div className="text-sm text-gray-600 mt-1">
                      Total: {item.totalQuantity} pcs • Sudah diambil: {item.alreadyPickedUp} pcs •
                      Sisa: {item.remainingQuantity} pcs
                    </div>
                  </div>
                </div>

                {item.remainingQuantity > 0 ? (
                  <div className="flex items-center gap-3">
                    <Label htmlFor={`quantity-${item.id}`} className="text-sm font-medium">
                      Jumlah pickup:
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => decrementQuantity(item.id)}
                        disabled={item.jumlahDiambil <= 0}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        id={`quantity-${item.id}`}
                        type="number"
                        min={0}
                        max={item.maxPickup}
                        value={item.jumlahDiambil}
                        onChange={(e) =>
                          handleQuantityChange(item.id, parseInt(e.target.value) || 0)
                        }
                        className="w-20 text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => incrementQuantity(item.id)}
                        disabled={item.jumlahDiambil >= item.maxPickup}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="text-sm text-gray-500">dari {item.maxPickup} tersedia</span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">Semua item sudah diambil</div>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} disabled={isPending} className="flex-1">
              Batal
            </Button>
            <Button
              onClick={validateAndProceed}
              disabled={getTotalSelectedQuantity() === 0 || isPending}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Memproses...</span>
                </div>
              ) : (
                `Pickup ${getTotalSelectedQuantity()} Item`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
