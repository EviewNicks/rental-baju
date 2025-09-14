'use client'

import React, { useState } from 'react'
import { Search, AlertTriangle, CheckCircle, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useDebounce } from '@/features/manage-product/hooks/useDebounce'
import { kasirApi } from '../../api'
import type { TransaksiResponse, TransaksiItemResponse } from '../../types'

interface TransactionLookupProps {
  onTransactionSelect: (transaction: TransaksiResponse) => void
}

export function TransactionLookup({ onTransactionSelect }: TransactionLookupProps) {
  const [searchCode, setSearchCode] = useState('')
  const [transaction, setTransaction] = useState<TransaksiResponse | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounce search input for better UX
  const debouncedSearchCode = useDebounce(searchCode, 300)

  const handleSearch = async (code: string) => {
    if (!code.trim()) {
      setTransaction(null)
      setError(null)
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      console.info('🔍 Searching transaction for return', {
        searchCode: code,
        action: 'return_lookup',
      })

      const result = await kasirApi.transaksi.getByKode(code)

      console.info('✅ Transaction found for return', {
        transactionCode: result.kode,
        status: result.status,
        hasItems: result.items && result.items.length > 0,
        action: 'return_lookup',
      })

      setTransaction(result)
      setError(null)
    } catch (err) {
      console.error('❌ Transaction search failed', {
        searchCode: code,
        error: err instanceof Error ? err.message : 'Unknown error',
        action: 'return_lookup',
      })

      setTransaction(null)
      setError(err instanceof Error ? err.message : 'Gagal mencari transaksi')
    } finally {
      setIsSearching(false)
    }
  }

  // Auto search when debounced code changes
  React.useEffect(() => {
    handleSearch(debouncedSearchCode)
  }, [debouncedSearchCode])

  // FIXED: Allow returns for both 'active' and 'terlambat' status
  const canReturn = (transaction: TransaksiResponse) => {
    return (
      (transaction.status === 'active' || transaction.status === 'terlambat') &&
      transaction.items?.some((item: TransaksiItemResponse) => item.jumlahDiambil > 0)
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'terlambat':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'selesai':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'terlambat':
        return 'bg-red-100 text-red-800'
      case 'selesai':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif'
      case 'terlambat':
        return 'Terlambat'
      case 'selesai':
        return 'Selesai'
      default:
        return status
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date))
  }

  const handleContinue = () => {
    if (transaction && canReturn(transaction)) {
      console.info('📦 Starting return process', {
        transactionCode: transaction.kode,
        status: transaction.status,
        itemsCount: transaction.items?.length || 0,
        action: 'return_process_start',
      })
      onTransactionSelect(transaction)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="search-code" className="block text-sm font-medium text-gray-700 mb-2">
              Kode Transaksi
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search-code"
                type="text"
                placeholder="Masukkan kode transaksi (contoh: TXN-20250127-001)"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className="pl-10"
                disabled={isSearching}
              />
            </div>
          </div>

          {isSearching && (
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
              Mencari transaksi...
            </div>
          )}

          {error && !isSearching && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </Card>

      {/* Transaction Details */}
      {transaction && !isSearching && (
        <Card className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Detail Transaksi</h3>
              <div className="flex items-center gap-2">
                {getStatusIcon(transaction.status)}
                <Badge className={getStatusColor(transaction.status)}>
                  {getStatusLabel(transaction.status)}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Transaction Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Informasi Transaksi</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-gray-600">Kode:</span>{' '}
                    <span className="font-medium">{transaction.kode}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total:</span>{' '}
                    <span className="font-medium">{formatCurrency(transaction.totalHarga)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Dibayar:</span>{' '}
                    <span className="font-medium">{formatCurrency(transaction.jumlahBayar)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Sisa:</span>{' '}
                    <span className="font-medium">{formatCurrency(transaction.sisaBayar)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Informasi Penyewa</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-gray-600">Nama:</span>{' '}
                    <span className="font-medium">{transaction.penyewa.nama}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Telepon:</span>{' '}
                    <span className="font-medium">{transaction.penyewa.telepon}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Alamat:</span>{' '}
                    <span className="font-medium">{transaction.penyewa.alamat}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Date Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-gray-600">Tanggal Mulai:</span>
                <div className="font-medium">{formatDate(transaction.tglMulai)}</div>
              </div>
              {transaction.tglSelesai && (
                <div>
                  <span className="text-sm text-gray-600">Tanggal Selesai:</span>
                  <div className="font-medium">{formatDate(transaction.tglSelesai)}</div>
                </div>
              )}
              {transaction.tglKembali && (
                <div>
                  <span className="text-sm text-gray-600">Tanggal Kembali:</span>
                  <div className="font-medium">{formatDate(transaction.tglKembali)}</div>
                </div>
              )}
            </div>

            {/* Items Summary */}
            {transaction.items && transaction.items.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Ringkasan Barang</h4>
                <div className="text-sm">
                  <span className="text-gray-600">Total barang:</span>{' '}
                  <span className="font-medium">
                    {transaction.items.reduce((sum, item) => sum + item.jumlah, 0)} item
                  </span>
                  <br />
                  <span className="text-gray-600">Sudah diambil:</span>{' '}
                  <span className="font-medium">
                    {transaction.items.reduce((sum, item) => sum + (item.jumlahDiambil || 0), 0)}{' '}
                    item
                  </span>
                </div>
              </div>
            )}

            {/* Action Alert */}
            <Separator />
            
            {canReturn(transaction) ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Transaksi ini dapat diproses untuk pengembalian. Terdapat{' '}
                  {transaction.items?.filter((item) => item.jumlahDiambil > 0).length || 0}{' '}
                  barang yang belum dikembalikan.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Transaksi ini tidak dapat diproses untuk pengembalian.
                  {/* FIXED: Updated message to include 'terlambat' status */}
                  {transaction.status !== 'active' && transaction.status !== 'terlambat' && ' Status transaksi bukan active atau terlambat.'}
                  {!transaction.items?.some((item) => item.jumlahDiambil > 0) &&
                    ' Tidak ada barang yang sudah diambil.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Continue Button */}
            {canReturn(transaction) && (
              <div className="flex justify-end">
                <Button onClick={handleContinue} className="bg-green-600 hover:bg-green-700">
                  Lanjutkan Pengembalian
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Search Help */}
      {!transaction && !error && !isSearching && (
        <Card className="p-4 bg-blue-50">
          <div className="flex items-start gap-3">
            <Search className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Tips Pencarian</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Pastikan kode transaksi lengkap (contoh: TXN-20250127-001)</li>
                {/* FIXED: Updated help text to include 'terlambat' status */}
                <li>• Hanya transaksi dengan status "active" atau "terlambat" yang dapat dikembalikan</li>
                <li>• Pastikan ada barang yang sudah diambil untuk dikembalikan</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}