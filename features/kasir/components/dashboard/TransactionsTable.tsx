import type { Transaction } from '../../types/transaction'
import { StatusBadge } from '../ui/status-badge'
import { formatCurrency, formatDate, getDaysOverdue } from '../../lib/utils'
import { Clock, Phone, Package, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'

interface TransactionTableProps {
  transactions: Transaction[]
  isLoading?: boolean
}

export function TransactionTable({ transactions, isLoading }: TransactionTableProps) {
  if (isLoading) {
    return <TransactionTableSkeleton />
  }

  if (transactions.length === 0) {
    return (
      <div
        className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-8 text-center"
        data-testid="empty-state"
      >
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Tidak ada transaksi ditemukan</p>
      </div>
    )
  }

  return (
    <div
      className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden shadow-lg shadow-gray-900/5"
      data-testid="transaction-table"
    >
      <Table>
        <TableHeader className="bg-gold-100">
          <TableRow>
            <TableHead className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Kode & Pelanggan
            </TableHead>
            <TableHead className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Item
            </TableHead>
            <TableHead className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Tanggal
            </TableHead>
            <TableHead className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Total
            </TableHead>
            <TableHead className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Status
            </TableHead>
            <TableHead className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Aksi
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-200/50">
          {transactions.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const isOverdue = transaction.status === 'terlambat'
  const daysOverdue = isOverdue && transaction.endDate ? getDaysOverdue(transaction.endDate) : 0

  return (
    <TableRow
      className="hover:bg-gold-50 transition-colors duration-150 bg-"
      data-testid={`transaction-row-${transaction.id}`}
    >
      <TableCell className="px-4 py-3">
        <div className="space-y-1">
          <div className="font-medium text-gray-900 text-sm">{transaction.transactionCode}</div>
          <div className="text-gray-600 text-sm">{transaction.customerName}</div>
          <div className="flex items-center gap-1 text-gray-500 text-xs">
            <Phone className="h-3 w-3" />
            {transaction.customerPhone}
          </div>
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="space-y-1">
          {transaction.items.slice(0, 2).map((item, index) => (
            <div
              key={index}
              className={`text-sm ${
                item.includes('item(s)') || item === 'Tidak ada item'
                  ? 'text-gray-500 italic'
                  : 'text-gray-700'
              }`}
            >
              {item}
            </div>
          ))}
          {transaction.items.length > 2 && (
            <div className="text-xs text-gray-500">
              +{transaction.items.length - 2} item lainnya
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="space-y-1">
          <div className="text-sm text-gray-700">Sewa: {formatDate(transaction.startDate)}</div>
          <div className="text-sm text-gray-700">
            Kembali: {transaction.endDate ? formatDate(transaction.endDate) : 'Belum ditentukan'}
          </div>
          {isOverdue && daysOverdue > 0 && (
            <div className="flex items-center gap-1 text-red-600 text-xs">
              <Clock className="h-3 w-3" />
              Terlambat {daysOverdue} hari
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="space-y-1">
          <div className="font-semibold text-gray-900 text-sm">
            {formatCurrency(transaction.totalAmount)}
          </div>
          {transaction.amountPaid < transaction.totalAmount && (
            <div className="text-xs text-orange-600">
              Dibayar: {formatCurrency(transaction.amountPaid)}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <StatusBadge status={transaction.status} />
      </TableCell>
      <TableCell className="px-4 py-3 text-center">
        <Link href={`/dashboard/transaction/${transaction.transactionCode}`}>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Eye className="h-4 w-4" />
            <span className="sr-only">Lihat Detail</span>
          </Button>
        </Link>
      </TableCell>
    </TableRow>
  )
}

function TransactionTableSkeleton() {
  return (
    <div
      className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden"
      data-testid="loading-skeleton"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Kode & Pelanggan
            </TableHead>
            <TableHead className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Item
            </TableHead>
            <TableHead className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Tanggal
            </TableHead>
            <TableHead className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Total
            </TableHead>
            <TableHead className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Status
            </TableHead>
            <TableHead className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Aksi
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-200/50">
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell className="px-4 py-3">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                </div>
              </TableCell>
              <TableCell className="px-4 py-3">
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-4/5"></div>
                </div>
              </TableCell>
              <TableCell className="px-4 py-3">
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </TableCell>
              <TableCell className="px-4 py-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
              </TableCell>
              <TableCell className="px-4 py-3">
                <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16"></div>
              </TableCell>
              <TableCell className="px-4 py-3 text-center">
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse mx-auto"></div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
