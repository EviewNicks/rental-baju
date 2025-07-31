'use client'

import { useState, useEffect } from 'react'
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
import { CheckCircle, Package, AlertCircle, Minus, Plus } from 'lucide-react'
import { usePickupProcess, usePickupValidation, getPickupErrorMessage } from '../../hooks/usePickupProcess'
import type { PickupItemRequest } from '../../hooks/usePickupProcess'
import type { TransactionDetail } from '../../types/transaction-detail'

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

export function PickupModal({ isOpen, onClose, transaction }: PickupModalProps) {
  const [pickupItems, setPickupItems] = useState<PickupItemState[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const { mutate: processPickup, isPending, error, isSuccess, data, reset } = 
    usePickupProcess(transaction.transactionCode)
  
  const { validatePickupItems } = usePickupValidation()

  // Initialize pickup items from transaction data
  useEffect(() => {
    if (isOpen && transaction.products) {
      // Transform transaction products to pickup items using real TransaksiItem IDs
      const items: PickupItemState[] = transaction.products.map((product) => {
        const totalQuantity = product.quantity
        // For now, assuming no items picked up yet - this will be replaced with actual API data
        const alreadyPickedUp = 0 
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
      
      setPickupItems(items)
    }
  }, [isOpen, transaction])

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    setPickupItems(items => 
      items.map(item => 
        item.id === itemId 
          ? { ...item, jumlahDiambil: Math.max(0, Math.min(newQuantity, item.maxPickup)) }
          : item
      )
    )
  }

  const incrementQuantity = (itemId: string) => {
    const item = pickupItems.find(i => i.id === itemId)
    if (item && item.jumlahDiambil < item.maxPickup) {
      handleQuantityChange(itemId, item.jumlahDiambil + 1)
    }
  }

  const decrementQuantity = (itemId: string) => {
    const item = pickupItems.find(i => i.id === itemId)
    if (item && item.jumlahDiambil > 0) {
      handleQuantityChange(itemId, item.jumlahDiambil - 1)
    }
  }

  const handleSelectAll = () => {
    setPickupItems(items => 
      items.map(item => ({ ...item, jumlahDiambil: item.maxPickup }))
    )
  }

  const handleClearAll = () => {
    setPickupItems(items => 
      items.map(item => ({ ...item, jumlahDiambil: 0 }))
    )
  }

  const getSelectedItems = () => {
    return pickupItems.filter(item => item.jumlahDiambil > 0)
  }

  const getTotalSelectedQuantity = () => {
    return pickupItems.reduce((total, item) => total + item.jumlahDiambil, 0)
  }

  const validateAndProceed = () => {
    const selectedItems = getSelectedItems()
    
    // Mock transaction items for validation - this should come from API
    const mockTransactionItems = pickupItems.map(item => ({
      id: item.id,
      jumlah: item.totalQuantity,
      jumlahDiambil: item.alreadyPickedUp,
      produk: { name: item.productName }
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
    processPickup({
      items: selectedItems.map(item => ({
        id: item.id,
        jumlahDiambil: item.jumlahDiambil
      }))
    })
  }

  const handleClose = () => {
    setShowSuccess(false)
    setShowConfirmation(false)
    setPickupItems([])
    reset()
    onClose()
  }

  // Success state
  if (showSuccess || (isSuccess && data)) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Pickup Berhasil!
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {data?.message || `Berhasil memproses pickup ${getTotalSelectedQuantity()} item`}
            </p>
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
                  <span className="font-medium">
                    {new Date().toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
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
            <DialogDescription>
              Pastikan data pickup sudah benar sebelum diproses
            </DialogDescription>
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
                <div key={item.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                  <span className="text-sm">{item.productName}</span>
                  <span className="text-sm font-medium">{item.jumlahDiambil} pcs</span>
                </div>
              ))}
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Proses Pengambilan Item
          </DialogTitle>
          <DialogDescription>
            Transaksi: <span className="font-medium">{transaction.transactionCode}</span> • 
            Pilih item dan jumlah yang akan diambil pelanggan
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

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">
                {getPickupErrorMessage(error)}
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
                      Total: {item.totalQuantity} pcs • 
                      Sudah diambil: {item.alreadyPickedUp} pcs • 
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
                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
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
                    <span className="text-sm text-gray-500">
                      dari {item.maxPickup} tersedia
                    </span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    Semua item sudah diambil
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              onClick={validateAndProceed}
              disabled={getTotalSelectedQuantity() === 0 || isPending}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isPending ? 'Memproses...' : `Pickup ${getTotalSelectedQuantity()} Item`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}