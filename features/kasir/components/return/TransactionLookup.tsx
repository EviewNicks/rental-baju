'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Search, AlertTriangle, CheckCircle, Clock, Package } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { TransaksiDetail, TransaksiResponse, TransaksiItemResponse } from '../../types'
import { kasirApi } from '../../api'

interface TransactionLookupProps {
  onTransactionFound: (transaction: TransaksiDetail) => void
  initialTransactionId?: string
  isLoading?: boolean
}

export function TransactionLookup({
  onTransactionFound,
  initialTransactionId,
  isLoading = false,
}: TransactionLookupProps) {
  const [searchCode, setSearchCode] = useState(initialTransactionId || '')
  const [searchTrigger, setSearchTrigger] = useState<string | null>(null)

  // Query untuk get transaction details
  const {
    data: transaction,
    error,
    isLoading: isSearching,
  } = useQuery({
    queryKey: ['transaction-detail', searchTrigger],
    queryFn: () => kasirApi.getTransactionByCode(searchTrigger!),
    enabled: !!searchTrigger,
    retry: false,
  })

  // Auto-search if initialTransactionId provided
  useEffect(() => {
    if (initialTransactionId && !searchTrigger) {
      setSearchTrigger(initialTransactionId)
    }
  }, [initialTransactionId, searchTrigger])

  // Handle successful transaction fetch
  useEffect(() => {
    if (transaction && !error && transaction.items) {
      // Ensure we have required items array for TransaksiDetail
      const transactionDetail: TransaksiDetail = {
        ...transaction,
        items: transaction.items, // TypeScript now knows items exists
      }
      onTransactionFound(transactionDetail)
    }
  }, [transaction, error, onTransactionFound])

  const handleSearch = () => {
    if (searchCode.trim()) {
      setSearchTrigger(searchCode.trim())
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const canReturn = (transaction: TransaksiResponse) => {
    return (
      transaction.status === 'active' &&
      transaction.items?.some((item: TransaksiItemResponse) => item.jumlahDiambil > 0)
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'selesai':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'terlambat':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'dikembalikan':
        return <Package className="h-4 w-4 text-gray-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-blue-600 bg-blue-50'
      case 'selesai':
        return 'text-green-600 bg-green-50'
      case 'terlambat':
        return 'text-red-600 bg-red-50'
      case 'dikembalikan':
        return 'text-gray-600 bg-gray-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="transaction-code">Kode Transaksi</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="transaction-code"
              type="text"
              placeholder="TXN-20250127-001"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || isSearching}
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              disabled={!searchCode.trim() || isLoading || isSearching}
            >
              <Search className="h-4 w-4 mr-2" />
              {isSearching ? 'Mencari...' : 'Cari'}
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Masukkan kode transaksi (contoh: TXN-20250127-001)
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Transaksi tidak ditemukan atau terjadi kesalahan. Pastikan kode transaksi benar dan coba
            lagi.
          </AlertDescription>
        </Alert>
      )}

      {/* Transaction Details */}
      {transaction && !error && (
        <Card className="p-4">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Detail Transaksi</h3>
                <p className="text-gray-600">{transaction.kode}</p>
              </div>
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transaction.status)}`}
              >
                {getStatusIcon(transaction.status)}
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </div>
            </div>

            {/* Customer Info */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Informasi Penyewa</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Nama:</span>
                  <span className="ml-2 font-medium">{transaction.penyewa.nama}</span>
                </div>
                <div>
                  <span className="text-gray-600">Telepon:</span>
                  <span className="ml-2 font-medium">{transaction.penyewa.telepon}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-600">Alamat:</span>
                  <span className="ml-2">{transaction.penyewa.alamat}</span>
                </div>
              </div>
            </div>

            {/* Items Summary */}
            {transaction.items && transaction.items.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">
                  Barang Disewa ({transaction.items.length} item)
                </h4>
                <div className="space-y-2">
                  {transaction.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded"
                    >
                      <div>
                        <span className="font-medium">{item.produk.name}</span>
                        <span className="text-gray-600 ml-2">x{item.jumlah}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-600">
                          Diambil: {item.jumlahDiambil} / {item.jumlah}
                        </div>
                        <div
                          className={
                            item.statusKembali === 'lengkap' ? 'text-green-600' : 'text-blue-600'
                          }
                        >
                          {item.statusKembali === 'lengkap'
                            ? 'Sudah dikembalikan'
                            : 'Belum dikembalikan'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transaction Info */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Harga:</span>
                  <div className="font-medium">
                    Rp {transaction.totalHarga.toLocaleString('id-ID')}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Sudah Dibayar:</span>
                  <div className="font-medium text-green-600">
                    Rp {transaction.jumlahBayar.toLocaleString('id-ID')}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Sisa Bayar:</span>
                  <div
                    className={`font-medium ${transaction.sisaBayar > 0 ? 'text-red-600' : 'text-green-600'}`}
                  >
                    Rp {transaction.sisaBayar.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
            </div>

            {/* Return Eligibility */}
            <div className="border-t pt-4">
              {canReturn(transaction) ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Transaksi ini dapat diproses untuk pengembalian. Ada{' '}
                    {
                      transaction.items?.filter(
                        (item) => item.jumlahDiambil > 0 && item.statusKembali !== 'lengkap',
                      ).length
                    }{' '}
                    barang yang belum dikembalikan.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Transaksi ini tidak dapat diproses untuk pengembalian.
                    {transaction.status !== 'active' && ' Status transaksi bukan active.'}
                    {!transaction.items?.some((item) => item.jumlahDiambil > 0) &&
                      ' Tidak ada barang yang sudah diambil.'}
                  </AlertDescription>
                </Alert>
              )}
            </div>
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
                <li>• Hanya transaksi dengan status &quot;active&quot; yang dapat dikembalikan</li>
                <li>• Pastikan ada barang yang sudah diambil untuk dikembalikan</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
