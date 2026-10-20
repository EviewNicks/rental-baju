'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import {
  ArrowRight,
  Shirt,
  Search,
  Check,
  X,
  Loader2,
  PackageX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatCurrency } from '../../../lib/utils/client'
import { extractSizeInfo, extractProductSizeIdEnhanced } from '../../../lib/utils/kondisiAwalParser'
import { kasirApi } from '../../../api'
import type { TransactionDetail } from '../../../types'
import type { SelectedNewItemData } from './SwapItemModal'

interface SwapItemSelectionStepProps {
  transaction: TransactionDetail
  selectedItem: TransactionDetail['products'][0] | null
  onSelectItem: (item: TransactionDetail['products'][0]) => void
  replacement: SelectedNewItemData | null
  onSelectReplacement: (replacement: SelectedNewItemData | null) => void
  onNext: () => void
  onCancel: () => void
}

interface AvailableProductItem {
  id: string
  code: string
  name: string
  currentPrice: number
  imageUrl?: string | null
  category: {
    id: string
    name: string
    color?: string
    type?: string
  }
  sizes: Array<{
    id: string
    size: string
    ageCategory: string
    availableQuantity: number
    originalQuantity: number
  }>
}

function ProductCardSkeleton() {
  return (
    <div className="p-3.5 rounded-2xl border border-gray-100 bg-white shadow-2xs animate-pulse space-y-3">
      <div className="flex gap-3 items-start">
        <div className="w-16 h-20 rounded-xl bg-gray-200 shrink-0" />
        <div className="flex-1 min-w-0 space-y-2 py-0.5">
          <div className="h-4 bg-gray-200 rounded w-4/5" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
      </div>
      <div className="flex gap-1.5 pt-2 border-t border-gray-100">
        <div className="h-6 bg-gray-100 rounded-lg w-12" />
        <div className="h-6 bg-gray-100 rounded-lg w-12" />
        <div className="h-6 bg-gray-100 rounded-lg w-12" />
      </div>
    </div>
  )
}

export function SwapItemSelectionStep({
  selectedItem,
  replacement,
  onSelectReplacement,
  onNext,
  onCancel,
}: SwapItemSelectionStepProps) {
  // Tab within swap: 'same_model' (Ganti Ukuran Saja) vs 'different_model' (Ganti Model Lain)
  const [activeTab, setActiveTab] = useState<'same_model' | 'different_model'>('different_model')

  // Current product info from catalog (with its sizes & category details)
  const [currentProduct, setCurrentProduct] = useState<AvailableProductItem | null>(null)
  const [isLoadingCurrent, setIsLoadingCurrent] = useState(false)
  const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null)
  const [targetCategoryName, setTargetCategoryName] = useState<string | null>(null)

  // Products in the same category for "Ganti Model Lain"
  const [categoryProducts, setCategoryProducts] = useState<AvailableProductItem[]>([])
  const [isLoadingCategoryProducts, setIsLoadingCategoryProducts] = useState(false)

  // Instant client-side search input state
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch current product details to get exact category ID, category name, and all available sizes
  useEffect(() => {
    let isMounted = true
    if (!selectedItem) return

    // Reset search when selected item changes
    setSearchQuery('')

    const fetchCurrentProductInfo = async () => {
      try {
        setIsLoadingCurrent(true)
        const response = await kasirApi.produk.getAvailable({
          search: selectedItem.product.code || selectedItem.product.name,
          available: false,
          limit: 10,
        })
        if (isMounted && response?.data) {
          const items = response.data as unknown as AvailableProductItem[]
          const found =
            items.find((p) => p.id === selectedItem.product.id) ||
            items.find((p) => p.code === selectedItem.product.code) ||
            items[0]

          if (found) {
            setCurrentProduct(found)
            if (found.category?.id) {
              setTargetCategoryId(found.category.id)
            }
            if (found.category?.name) {
              setTargetCategoryName(found.category.name)
            }
          }
        }
      } catch (err) {
        console.error('Failed to load current product info', err)
      } finally {
        if (isMounted) setIsLoadingCurrent(false)
      }
    }

    fetchCurrentProductInfo()
    return () => {
      isMounted = false
    }
  }, [selectedItem])

  // Fetch products in the SAME CATEGORY when switching to "Ganti Model Lain" (Tab 2)
  useEffect(() => {
    let isMounted = true
    if (!targetCategoryId) return

    const fetchCategoryCatalogue = async () => {
      try {
        setIsLoadingCategoryProducts(true)
        const response = await kasirApi.produk.getAvailable({
          categoryId: targetCategoryId,
          available: false,
          limit: 100, // Fetch all models in category for instant responsive browsing
        })
        if (isMounted && response?.data) {
          setCategoryProducts(response.data as unknown as AvailableProductItem[])
        }
      } catch (err) {
        console.error('Failed to load category products', err)
      } finally {
        if (isMounted) setIsLoadingCategoryProducts(false)
      }
    }

    fetchCategoryCatalogue()
    return () => {
      isMounted = false
    }
  }, [targetCategoryId])

  // Category display name
  const categoryDisplayName =
    targetCategoryName ||
    currentProduct?.category?.name ||
    selectedItem?.product?.category ||
    'Pakaian'

  // Extract size and productSizeId of currently selected item
  const currentSizeInfo = selectedItem ? extractSizeInfo(selectedItem) : null
  const currentProductSizeId = selectedItem
    ? extractProductSizeIdEnhanced(selectedItem.kondisiAwal ?? null)
    : null

  // Filter products for "Ganti Model Lain": strictly same category, excluding current product, with instant search
  const filteredCategoryProducts = useMemo(() => {
    return categoryProducts.filter((product) => {
      // 1. Never show the product currently being replaced
      if (product.id === selectedItem?.product.id) return false

      // 2. Strict category check: must belong to the exact same category
      if (targetCategoryId && product.category?.id && product.category.id !== targetCategoryId) {
        return false
      }

      // 3. Client-side instant filter for instantaneous typing feedback
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = product.name.toLowerCase().includes(q)
        const matchCode = product.code?.toLowerCase().includes(q)
        return matchName || matchCode
      }

      return true
    })
  }, [categoryProducts, selectedItem, targetCategoryId, searchQuery])

  // Can proceed condition:
  // - If same product: cannot select the same size currently held
  // - If different product: can proceed with any chosen size
  const isSameProduct = replacement?.product.id === selectedItem?.product.id
  const isSameSize =
    replacement?.size.id === currentProductSizeId ||
    (currentSizeInfo?.size && replacement?.size.size.toUpperCase() === currentSizeInfo.size.toUpperCase())
  const canProceed = replacement !== null && (!isSameProduct || !isSameSize)

  return (
    <div className="space-y-6">
      {/* Main 2-Column Comparison Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Baju Saat Ini (Col 4) */}
        <div className="lg:col-span-4 bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Baju Saat Ini
              </span>
            </div>
            <Badge variant="outline" className="bg-blue-50/80 text-blue-700 border-blue-200/80 text-[11px] font-semibold px-2 py-0.5">
              Belum Diambil
            </Badge>
          </div>

          {selectedItem ? (
            <div className="space-y-4">
              {/* Product Showcase Image */}
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 border border-gray-200/90 shadow-2xs group">
                {selectedItem.product.image ? (
                  <Image
                    src={selectedItem.product.image}
                    alt={selectedItem.product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                    <Shirt className="h-10 w-10 text-gray-300 stroke-[1.5]" />
                    <span className="text-[11px] text-gray-400 mt-1 font-medium">Foto Produk</span>
                  </div>
                )}
              </div>

              {/* Product Title & Info */}
              <div className="space-y-2.5">
                <div>
                  <h4 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">
                    {selectedItem.product.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {selectedItem.product.code && (
                      <span className="font-mono text-[10px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 font-semibold">
                        {selectedItem.product.code}
                      </span>
                    )}
                    <span className="text-[11px] text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-medium capitalize">
                      {categoryDisplayName}
                    </span>
                  </div>
                </div>

                {/* Specs Box */}
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-gray-50/90 rounded-xl border border-gray-100 text-xs">
                  <div>
                    <span className="text-gray-400 text-[11px] block">Ukuran Tersewa:</span>
                    <span className="font-bold text-gray-900 text-sm">
                      {currentSizeInfo?.size || 'Standard'}
                    </span>
                    {currentSizeInfo?.ageCategory && (
                      <span className="text-[10px] text-gray-500 block">
                        {currentSizeInfo.ageCategory}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-400 text-[11px] block">Durasi Sewa:</span>
                    <span className="font-bold text-gray-900 text-sm">
                      {selectedItem.duration} Hari
                    </span>
                    <span className="text-[10px] text-gray-500 block">
                      {selectedItem.quantity} pcs
                    </span>
                  </div>
                </div>

                {/* Subtotal Box */}
                <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl border border-amber-200/60">
                  <span className="text-xs font-semibold text-amber-950">Subtotal Sewa:</span>
                  <span className="text-base font-extrabold text-amber-800">
                    {formatCurrency(selectedItem.subtotal || selectedItem.pricePerDay * selectedItem.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic py-8 text-center">
              Item tidak ditemukan
            </p>
          )}
        </div>

        {/* Center Transfer Arrow - Desktop (Col 1) */}
        <div className="hidden lg:flex lg:col-span-1 flex-col items-center justify-center pt-28">
          <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <ArrowRight className="h-5 w-5" />
          </div>
        </div>

        {/* Center Transfer Arrow - Mobile */}
        <div className="lg:hidden flex justify-center py-1">
          <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-2xs">
            <ArrowRight className="h-4 w-4 rotate-90" />
          </div>
        </div>

        {/* Right Column: Pilihan Pengganti (Col 7) */}
        <div className="lg:col-span-7 bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
          {/* Top Header: Directly Segmented Control Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-xl text-xs font-semibold flex-1 max-w-sm">
              <button
                type="button"
                onClick={() => setActiveTab('different_model')}
                className={cn(
                  'py-2 px-3 rounded-lg transition-all text-center',
                  activeTab === 'different_model'
                    ? 'bg-white text-amber-900 shadow-2xs font-bold'
                    : 'text-gray-500 hover:text-gray-800',
                )}
              >
                Ganti Model Lain
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('same_model')}
                className={cn(
                  'py-2 px-3 rounded-lg transition-all text-center',
                  activeTab === 'same_model'
                    ? 'bg-white text-gray-900 shadow-2xs font-bold'
                    : 'text-gray-500 hover:text-gray-800',
                )}
              >
                Ganti Ukuran Saja
              </button>
            </div>

            {replacement && (
              <Badge className="bg-amber-500 text-white border-amber-600 text-xs font-bold py-1.5 px-3 flex items-center gap-1.5 shrink-0 max-w-[220px] truncate shadow-2xs">
                <Check className="h-3.5 w-3.5 text-white shrink-0 stroke-[3]" />
                <span className="truncate">
                  {replacement.product.name} ({replacement.size.size})
                </span>
              </Badge>
            )}
          </div>

          {/* Content Tab 1: Ganti Model Lain (2-Column Grid Layout) */}
          {activeTab === 'different_model' && (
            <div className="space-y-3 pt-1">
              {/* Clean Search Bar (Without perpetual spinner!) */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Cari nama atau kode model baju..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-9 h-10 text-xs sm:text-sm rounded-xl border-gray-200 focus-visible:ring-amber-500 bg-gray-50/50 hover:bg-white focus:bg-white transition-all shadow-2xs"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    title="Hapus pencarian"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>

              {/* Product List Container: Responsive 2-Column Grid */}
              <div className="max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
                {isLoadingCategoryProducts && categoryProducts.length === 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-1">
                    <ProductCardSkeleton />
                    <ProductCardSkeleton />
                    <ProductCardSkeleton />
                    <ProductCardSkeleton />
                  </div>
                ) : filteredCategoryProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredCategoryProducts.map((prod) => {
                      const priceDiff = prod.currentPrice - (selectedItem?.pricePerDay || 0)
                      const isSelectedProduct = replacement?.product.id === prod.id

                      return (
                        <div
                          key={prod.id}
                          className={cn(
                            'p-3.5 rounded-2xl border transition-all duration-200 bg-white flex flex-col justify-between gap-3',
                            isSelectedProduct
                              ? 'border-amber-400 bg-amber-50/25 ring-2 ring-amber-500/20 shadow-xs'
                              : 'border-gray-200/90 hover:border-amber-300 hover:shadow-2xs',
                          )}
                        >
                          {/* Card Header: Thumbnail + Name + Code + Category + Price */}
                          <div className="flex gap-3 items-start">
                            <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 shadow-2xs">
                              {prod.imageUrl ? (
                                <Image
                                  src={prod.imageUrl}
                                  alt={prod.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                                  <Shirt className="h-6 w-6 stroke-[1.5]" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h5
                                className="font-bold text-gray-900 text-xs sm:text-sm leading-snug line-clamp-1"
                                title={prod.name}
                              >
                                {prod.name}
                              </h5>

                              {/* Code & Category Tag inside the card */}
                              <div className="flex flex-wrap items-center gap-1 mt-1">
                                <span className="font-mono text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded border border-gray-200/60 font-semibold">
                                  {prod.code}
                                </span>
                                <span className="text-[10px] text-amber-800 font-medium capitalize bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60">
                                  {prod.category?.name || categoryDisplayName}
                                </span>
                              </div>

                              {/* Base Price & Price Difference Badge */}
                              <div className="flex items-center justify-between gap-1 mt-2">
                                <span className="text-[11px] text-gray-600 font-semibold">
                                  {formatCurrency(prod.currentPrice)}
                                </span>

                                {priceDiff === 0 ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-gray-50 text-gray-600 border-gray-200 text-[10px] font-semibold px-1.5 py-0"
                                  >
                                    Harga Sama
                                  </Badge>
                                ) : priceDiff > 0 ? (
                                  <Badge className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-1.5 py-0">
                                    +{formatCurrency(priceDiff)}
                                  </Badge>
                                ) : (
                                  <Badge className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-1.5 py-0">
                                    -{formatCurrency(Math.abs(priceDiff))}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Card Footer: Size Selection Pills */}
                          <div className="pt-2 border-t border-gray-100">
                            <div className="flex flex-wrap gap-1.5">
                              {prod.sizes && prod.sizes.length > 0 ? (
                                prod.sizes.map((sz) => {
                                  const isSzSelected =
                                    isSelectedProduct && replacement?.size.id === sz.id
                                  const sizeStock = sz.originalQuantity ?? sz.availableQuantity ?? 0
                                  const isOutOfStock = sizeStock <= 0

                                  return (
                                    <button
                                      key={sz.id}
                                      type="button"
                                      disabled={isOutOfStock}
                                      onClick={() => {
                                        onSelectReplacement({
                                          product: {
                                            id: prod.id,
                                            name: prod.name,
                                            code: prod.code,
                                            category: prod.category?.name || categoryDisplayName,
                                            image: prod.imageUrl || undefined,
                                            pricePerDay: prod.currentPrice,
                                          },
                                          size: {
                                            id: sz.id,
                                            size: sz.size,
                                            ageCategory: sz.ageCategory,
                                            availableQuantity: sizeStock,
                                          },
                                        })
                                      }}
                                      className={cn(
                                        'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1',
                                        isSzSelected
                                          ? 'bg-amber-500 text-white shadow-xs font-bold scale-[1.02]'
                                          : isOutOfStock
                                            ? 'bg-gray-100 text-gray-400 border border-gray-200/60 opacity-40 cursor-not-allowed line-through'
                                            : 'bg-gray-50 border border-gray-200 text-gray-700 hover:border-amber-400 hover:bg-amber-50/50 hover:text-amber-900 shadow-2xs',
                                      )}
                                    >
                                      <span>{sz.size}</span>
                                      {isSzSelected ? (
                                        <Check className="h-3 w-3 stroke-[3]" />
                                      ) : isOutOfStock ? (
                                        <span className="text-[9px] font-normal">(Habis)</span>
                                      ) : (
                                        <span className="text-[9px] opacity-75 font-normal">
                                          ({sizeStock})
                                        </span>
                                      )}
                                    </button>
                                  )
                                })
                              ) : (
                                <span className="text-[11px] text-gray-400 italic">
                                  Belum ada ukuran
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-3 shadow-2xs">
                      <PackageX className="h-6 w-6" />
                    </div>
                    <h5 className="font-semibold text-gray-800 text-sm">
                      Tidak ada model ditemukan
                    </h5>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs">
                      {searchQuery
                        ? `Tidak ada model di kategori "${categoryDisplayName}" yang cocok dengan kata kunci "${searchQuery}".`
                        : `Belum ada model lain dalam kategori "${categoryDisplayName}".`}
                    </p>
                    {searchQuery && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchQuery('')}
                        className="mt-3 text-xs h-8 rounded-lg"
                      >
                        Reset Pencarian
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content Tab 2: Ganti Ukuran Saja (Same Model) */}
          {activeTab === 'same_model' && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl text-xs text-gray-700">
                <div className="flex items-center gap-2">
                  <Shirt className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>
                    Pilih ukuran pengganti untuk{' '}
                    <strong className="text-gray-900">{selectedItem?.product.name}</strong>:
                  </span>
                </div>
                <span className="text-[11px] text-amber-800 font-medium capitalize bg-amber-100/70 px-2 py-0.5 rounded-md">
                  {categoryDisplayName}
                </span>
              </div>

              {isLoadingCurrent ? (
                <div className="py-12 flex flex-col items-center justify-center text-center text-sm text-gray-400 gap-2">
                  <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
                  <span>Memuat ketersediaan ukuran...</span>
                </div>
              ) : currentProduct?.sizes && currentProduct.sizes.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {currentProduct.sizes.map((sz) => {
                    const isCurrent =
                      sz.id === currentProductSizeId ||
                      (currentSizeInfo?.size && sz.size.toUpperCase() === currentSizeInfo.size.toUpperCase())
                    const isSelected = replacement?.size.id === sz.id
                    const sizeStock = sz.originalQuantity ?? sz.availableQuantity ?? 0
                    const isOutOfStock = sizeStock <= 0

                    return (
                      <button
                        key={sz.id}
                        type="button"
                        disabled={isCurrent || isOutOfStock}
                        onClick={() => {
                          if (currentProduct) {
                            onSelectReplacement({
                              product: {
                                id: currentProduct.id,
                                name: currentProduct.name,
                                code: currentProduct.code,
                                category: currentProduct.category?.name || categoryDisplayName,
                                image: currentProduct.imageUrl || undefined,
                                pricePerDay: currentProduct.currentPrice,
                              },
                              size: {
                                id: sz.id,
                                size: sz.size,
                                ageCategory: sz.ageCategory,
                                availableQuantity: sizeStock,
                              },
                            })
                          }
                        }}
                        className={cn(
                          'p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-28',
                          isSelected
                            ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/30 shadow-2xs'
                            : isCurrent
                              ? 'border-gray-200 bg-gray-100/80 opacity-60 cursor-not-allowed'
                              : isOutOfStock
                                ? 'border-red-100 bg-red-50/30 opacity-50 cursor-not-allowed'
                                : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/30 hover:shadow-2xs bg-white',
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-black text-gray-900">{sz.size}</span>
                          {isSelected && <Check className="h-4 w-4 text-amber-600 stroke-[3]" />}
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-200/80 px-1.5 py-0.5 rounded">
                              Saat Ini
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-gray-500">{sz.ageCategory}</div>

                        <div>
                          {isOutOfStock ? (
                            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                              Stok Habis
                            </span>
                          ) : sizeStock === 1 ? (
                            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              Sisa 1
                            </span>
                          ) : (
                            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Tersedia ({sizeStock})
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-gray-500 bg-gray-50 rounded-xl">
                  Tidak ada data ukuran lain yang tersedia untuk model ini.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Footer Navigation */}
      <div className="sticky -bottom-5 mt-6 bg-white/95 backdrop-blur-md pt-4 pb-2 -mx-6 px-6 border-t border-gray-200 flex items-center justify-between z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <Button variant="outline" onClick={onCancel} className="rounded-xl px-5">
          Batal
        </Button>

        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl shadow-md px-6 h-10 disabled:opacity-50"
        >
          Lanjut ke Konfirmasi
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
