'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import {
  Tag,
  Search,
  CheckCircle,
  Loader2,
  Sparkles,
  X,
  RotateCcw,
  Shirt,
  Check,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { kasirApi } from '../../../api'
import { useSwapItem } from '../../../hooks/useSwapItem'
import { getSarungCategoryId } from '../../../lib/utils/jasSarungUtils'
import type { TransactionDetail } from '../../../types'
import type { SarungDisplayItem } from '../../../lib/utils/sarungTransformation'

interface AvailableProductItem {
  id: string
  code: string
  name: string
  currentPrice: number
  imageUrl?: string | null
  categoryId?: string
  category?: {
    id: string
    name: string
  }
  sizes: Array<{
    id: string
    size: string
    ageCategory: string
    availableQuantity: number
    originalQuantity: number
  }>
}

interface SwapSarungModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: TransactionDetail
  parentItem: TransactionDetail['products'][0] | null
  currentSarung: SarungDisplayItem | null
}

export function SwapSarungModal({
  isOpen,
  onClose,
  transaction,
  parentItem,
  currentSarung,
}: SwapSarungModalProps) {
  const [sarungProducts, setSarungProducts] = useState<AvailableProductItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAgeCategory, setSelectedAgeCategory] = useState<'ALL' | 'ADULT' | 'CHILD'>('ALL')
  const [selectedSarung, setSelectedSarung] = useState<AvailableProductItem | null>(null)
  const [selectedSize, setSelectedSize] = useState<AvailableProductItem['sizes'][0] | null>(null)
  const [notes, setNotes] = useState('')

  // Load sarung catalog strictly from sarung category when modal opens
  useEffect(() => {
    let isMounted = true
    if (!isOpen) return

    setSelectedSarung(null)
    setSelectedSize(null)
    setSearchQuery('')
    setSelectedAgeCategory('ALL')
    setNotes('')

    const loadSarungProducts = async () => {
      try {
        setIsLoading(true)
        const sarungCategoryId = getSarungCategoryId()

        // Query available products specifically with sarung categoryId
        const response = await kasirApi.produk.getAvailable({
          categoryId: sarungCategoryId,
          available: false,
          limit: 100,
        })

        if (isMounted && response?.data) {
          const allItems = response.data as unknown as AvailableProductItem[]
          // Filter strictly products in sarung category or with sarung in their name
          const sarungs = allItems.filter(
            (p) =>
              p.categoryId === sarungCategoryId ||
              p.category?.id === sarungCategoryId ||
              p.category?.name?.toLowerCase().includes('sarung') ||
              p.name?.toLowerCase().includes('sarung'),
          )
          setSarungProducts(sarungs)
        }
      } catch (err) {
        console.error('Failed to load sarung catalog', err)
        toast.error('Gagal memuat katalog sarung')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadSarungProducts()
    return () => {
      isMounted = false
    }
  }, [isOpen])

  // Filtered sarungs based on search query and age category
  const filteredSarungs = useMemo(() => {
    let result = sarungProducts

    // Text search by name or code
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q),
      )
    }

    // Filter by age category (ADULT / CHILD)
    if (selectedAgeCategory !== 'ALL') {
      result = result.filter((p) =>
        p.sizes?.some(
          (sz) => sz.ageCategory === selectedAgeCategory && sz.availableQuantity > 0,
        ),
      )
    }

    return result
  }, [sarungProducts, searchQuery, selectedAgeCategory])

  const { tukarSarung, isSwappingSarung } = useSwapItem(transaction.transactionCode)

  const isBusy = isSwappingSarung

  const handleClose = () => {
    onClose()
  }

  // Auto-select size if clicking product card with 1 available size
  const handleSelectProduct = (product: AvailableProductItem) => {
    setSelectedSarung(product)
    const availableSizes = product.sizes?.filter((s) => s.availableQuantity > 0) || []
    if (availableSizes.length === 1) {
      setSelectedSize(availableSizes[0])
    } else if (selectedSize && !product.sizes?.some((s) => s.id === selectedSize.id)) {
      setSelectedSize(null)
    }
  }

  const handleSubmit = useCallback(async () => {
    if (!parentItem) {
      toast.error('Data baju pasangan tidak ditemukan')
      return
    }
    if (!selectedSarung || !selectedSize) {
      toast.error('Pilih motif sarung dan ukurannya terlebih dahulu')
      return
    }

    const payload = {
      parentTransaksiItemId: parentItem.id,
      newSarung: {
        produkId: selectedSarung.id,
        productSizeId: selectedSize.id,
        size: selectedSize.size,
        ageCategory: selectedSize.ageCategory,
      },
      catatan: notes.trim() || undefined,
    }

    // 1. ⚡ Instant 0ms modal close
    onClose()

    // 2. 🔔 Tampilkan progress Sonner
    const toastId = toast.loading('Menukar sarung pasangan...')

    // 3. 🚀 Eksekusi mutation async di background
    try {
      await tukarSarung(payload)
      toast.success('Sarung pasangan berhasil ditukar!', { id: toastId })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menukar sarung pasangan'
      toast.error(msg, { id: toastId })
    }
  }, [parentItem, selectedSarung, selectedSize, notes, onClose, tukarSarung])

  // Keyboard shortcut Ctrl+Enter to submit
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!isBusy && selectedSarung && selectedSize) {
          e.preventDefault()
          handleSubmit()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isBusy, selectedSarung, selectedSize, handleSubmit])

  if (!parentItem || !currentSarung) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isBusy && handleClose()}>
      <DialogContent
        showCloseButton={!isBusy}
        onPointerDownOutside={(e) => {
          if (isBusy) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (isBusy) e.preventDefault()
        }}
        className="w-[96vw] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl max-h-[92vh] h-[90vh] md:h-auto md:max-h-[90vh] flex flex-col p-0 gap-0 border-green-200/70 shadow-2xl rounded-2xl bg-white overflow-hidden"
      >
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-500/10 via-green-400/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-green-600 text-white shadow-xs flex items-center justify-center">
                <Tag className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  Tukar Sarung Pasangan (Gratis)
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Pilih motif atau ukuran sarung pengganti untuk setelan ini tanpa biaya tambahan.
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                Sarung Gratis
              </Badge>
              <span className="text-xs font-semibold px-3 py-1 bg-gray-100 text-gray-800 rounded-full border border-gray-200">
                {transaction.transactionCode}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
          {/* Pairing Info Notice Banner */}
          <div className="p-3.5 bg-green-50/80 border border-green-200 rounded-2xl flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-green-600 flex-shrink-0" />
              <div>
                <span className="font-semibold text-green-950">Pasangan Baju Adat:</span>{' '}
                <strong className="text-gray-900">{parentItem.product.name}</strong>{' '}
                <span className="text-gray-500">({parentItem.product.size || 'M'})</span>.
                Sarung ini adalah fasilitas paket gratis, penukaran motif{' '}
                <strong>tidak dikenakan biaya tambahan</strong>.
              </div>
            </div>
            <span className="px-2.5 py-1 bg-green-200 text-green-900 rounded-lg font-bold text-xs flex-shrink-0">
              Biaya: Rp 0
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Sarung Saat Ini */}
            <div className="lg:col-span-4 bg-gray-50/80 border border-gray-200 rounded-2xl p-4 space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                Sarung Saat Ini
              </span>

              <div className="flex gap-3 items-center">
                <div className="w-16 h-16 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0 relative border border-gray-200">
                  <Image
                    src={currentSarung.product.image || '/products/sarung/accesories.png'}
                    alt={currentSarung.product.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-gray-900 text-sm line-clamp-2">
                    {currentSarung.product.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Ukuran: {currentSarung.product.size || 'Standard'}
                  </p>
                  <span className="inline-block mt-1 text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-md">
                    GRATIS
                  </span>
                </div>
              </div>

              {/* Selection preview if any */}
              {selectedSarung && selectedSize && (
                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-green-700 block">
                    Sarung Pengganti Terpilih
                  </span>
                  <div className="p-3 bg-white rounded-xl border border-green-300 space-y-1">
                    <div className="font-bold text-gray-900 text-xs line-clamp-1">
                      {selectedSarung.name}
                    </div>
                    <div className="text-[11px] text-gray-600">
                      Ukuran: <strong className="text-green-800">{selectedSize.size}</strong>{' '}
                      ({selectedSize.ageCategory})
                    </div>
                    <div className="text-[11px] font-semibold text-green-700 pt-0.5">
                      Tarif: GRATIS (Rp 0)
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Pilihan Sarung Katalog */}
            <div className="lg:col-span-8 bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Pilih Sarung Pengganti
                  </span>
                  <Badge variant="outline" className="text-[10px] text-gray-500 font-normal">
                    {filteredSarungs.length} Motif
                  </Badge>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    placeholder="Cari motif / kode sarung..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-7 h-8 text-xs rounded-xl"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      title="Hapus pencarian"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Age Category Filter Tabs (Side-feature: Quick filter Adult vs Child) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedAgeCategory('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedAgeCategory === 'ALL'
                      ? 'bg-green-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Semua Motif
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAgeCategory('ADULT')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedAgeCategory === 'ADULT'
                      ? 'bg-green-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Dewasa (Adult)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAgeCategory('CHILD')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedAgeCategory === 'CHILD'
                      ? 'bg-green-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Anak (Child)
                </button>
              </div>

              {/* Grid of Sarungs */}
              {isLoading ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-green-600" />
                  Memuat katalog sarung...
                </div>
              ) : filteredSarungs.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400 space-y-3">
                  <Shirt className="h-8 w-8 mx-auto text-gray-300" />
                  <p>
                    {searchQuery || selectedAgeCategory !== 'ALL'
                      ? `Tidak ada motif sarung yang cocok dengan filter pencarian.`
                      : 'Belum ada sarung yang tersedia dalam katalog.'}
                  </p>
                  {(searchQuery || selectedAgeCategory !== 'ALL') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('')
                        setSelectedAgeCategory('ALL')
                      }}
                      className="text-xs rounded-xl"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                      Reset Filter Pencarian
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[42vh] overflow-y-auto pr-1">
                  {filteredSarungs.map((item) => {
                    const isSelected = selectedSarung?.id === item.id
                    const isCurrentSarung = currentSarung.product.id === item.id
                    const totalAvailableStock =
                      item.sizes?.reduce((acc, sz) => acc + Math.max(0, sz.availableQuantity), 0) || 0

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectProduct(item)}
                        className={`p-3 rounded-xl border transition-all text-xs flex flex-col justify-between gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'border-green-600 bg-green-50/50 ring-2 ring-green-500/20 shadow-xs'
                            : 'border-gray-200 hover:border-green-300 hover:bg-gray-50/50'
                        }`}
                      >
                        <div className="flex gap-2.5 items-start">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 relative border border-gray-200">
                            <Image
                              src={item.imageUrl || '/products/sarung/accesories.png'}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h5 className="font-bold text-gray-900 line-clamp-1">{item.name}</h5>
                              {isCurrentSarung && (
                                <span className="text-[10px] text-amber-700 font-semibold bg-amber-100 px-1.5 py-0.5 rounded shrink-0">
                                  Sedang Dipakai
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-gray-500 font-mono">[{item.code}]</span>
                              <span className="text-[10px] text-green-700 font-semibold bg-green-100 px-1.5 py-0.5 rounded">
                                GRATIS
                              </span>
                              <span className="text-[10px] text-gray-500">
                                Stok: {totalAvailableStock} pcs
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Size buttons */}
                        <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-gray-100">
                          {item.sizes?.map((sz) => {
                            const isSzSelected = isSelected && selectedSize?.id === sz.id
                            const isOutOfStock = sz.availableQuantity <= 0
                            return (
                              <button
                                key={sz.id}
                                type="button"
                                disabled={isOutOfStock}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedSarung(item)
                                  setSelectedSize(sz)
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 ${
                                  isSzSelected
                                    ? 'bg-green-600 text-white shadow-xs'
                                    : isOutOfStock
                                      ? 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed'
                                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-green-50 hover:border-green-300'
                                }`}
                              >
                                {isSzSelected && <Check className="h-3 w-3" />}
                                <span>{sz.size}</span>
                                <span className="text-[10px] opacity-75">
                                  ({sz.ageCategory === 'ADULT' ? 'Dws' : sz.ageCategory === 'CHILD' ? 'Anak' : sz.ageCategory})
                                </span>
                                <span
                                  className={`text-[10px] ${
                                    isOutOfStock ? 'text-red-500 font-normal' : 'text-green-700 font-bold'
                                  }`}
                                >
                                  [{isOutOfStock ? 'Habis' : sz.availableQuantity}]
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1 pt-2 border-t border-gray-100">
                <label className="block text-xs font-semibold text-gray-700">
                  Catatan Penukaran Sarung (Opsional):
                </label>
                <Textarea
                  placeholder="Contoh: Pelanggan ingin warna sarung lebih senada dengan baju pengantin wanita..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="text-xs rounded-xl resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky -bottom-5 bg-white/95 backdrop-blur-md pt-4 pb-3 px-6 border-t border-gray-200 flex items-center justify-between z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isBusy}
            className="rounded-xl px-5 text-xs"
          >
            Batal
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={isBusy || !selectedSarung || !selectedSize}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-md px-6 h-10 text-xs"
          >
            {isBusy ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menukar Sarung...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Konfirmasi & Tukar Sarung
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
