import { CreditCard, AlertTriangle, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useEffect } from 'react'
import type { TransactionDetail, Payment, Penalty } from '../../types/transaction-detail'
import { formatCurrency, formatDate } from '../../lib/utils'

interface PaymentSummaryCardProps {
  transaction: TransactionDetail
  payments: Payment[]
  penalties?: Penalty[]
  'data-testid'?: string
}

export function PaymentSummaryCard({
  transaction,
  payments,
  penalties,
  'data-testid': dataTestId,
}: PaymentSummaryCardProps) {
  // 🛡️ Phase 2: Data validation
  const validPayments = Array.isArray(payments) ? payments : []
  const validPenalties = Array.isArray(penalties) ? penalties : []
  const validTransaction = transaction || { totalAmount: 0 }

  // 🛡️ Phase 2: Safe calculations with validation
  const totalPaid = validPayments.reduce((sum, payment) => {
    const amount = Number(payment.amount) || 0
    return sum + amount
  }, 0)

  const totalPenalties = validPenalties.reduce((sum, penalty) => {
    const amount = Number(penalty.amount) || 0
    return sum + amount
  }, 0)

  const transactionAmount = Number(validTransaction.totalAmount) || 0
  const grandTotal = transactionAmount + totalPenalties
  const remainingBalance = grandTotal - totalPaid

  // 🔧 Phase 3: Monitor prop changes and re-rendering
  useEffect(() => {}, [validTransaction.id, validPayments.length, transactionAmount, totalPaid])

  // 🛡️ Phase 3: Loading state and error handling
  if (!validTransaction || typeof validTransaction.totalAmount === 'undefined') {
    return (
      <div
        data-testid={dataTestId}
        className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6"
      >
        <div className="flex items-center gap-2 text-gray-500">
          <CreditCard className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Memuat Pembayaran...</h3>
        </div>
      </div>
    )
  }

  return (
    <div
      data-testid={dataTestId}
      className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 space-y-6"
    >
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">Ringkasan Pembayaran</h3>
      </div>

      {/* Payment Summary */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Sewa:</span>
          <span className="font-medium text-gray-900" data-testid="total-amount">
            {formatCurrency(transactionAmount)}
          </span>
        </div>

        {totalPenalties > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Denda:</span>
            <span className="font-medium text-red-600">{formatCurrency(totalPenalties)}</span>
          </div>
        )}

        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between text-base font-semibold">
            <span className="text-gray-900">Total:</span>
            <span className="text-gray-900">{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Dibayar:</span>
          <span className="font-medium text-green-600" data-testid="total-paid">
            {formatCurrency(totalPaid)}
          </span>
        </div>

        {remainingBalance > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Sisa:</span>
            <span className="font-medium text-red-600" data-testid="remaining-balance">
              {formatCurrency(remainingBalance)}
            </span>
          </div>
        )}
      </div>

      {/* Payment Status */}
      <div className="pt-4 border-t border-gray-200">
        {remainingBalance <= 0 ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Pembayaran Lunas</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Belum Lunas</span>
          </div>
        )}
      </div>

      {/* Payment History */}
      {validPayments.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Riwayat Pembayaran ({validPayments.length})
          </h4>
          <div className="space-y-2" data-testid="payment-history">
            {validPayments.map((payment) => (
              <div key={payment.id} className="flex justify-between items-center text-sm">
                <div>
                  <div className="text-gray-900" data-testid={`payment-amount-${payment.id}`}>
                    {formatCurrency(Number(payment.amount) || 0)}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {formatDate(payment.timestamp)} • {payment.method.toUpperCase()}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs capitalize">
                  {payment.type}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state for payments */}
      {validPayments.length === 0 && transactionAmount > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <div className="text-center text-gray-500 text-sm py-4">
            <AlertTriangle className="h-4 w-4 mx-auto mb-2" />
            Belum ada pembayaran tercatat
          </div>
        </div>
      )}

      {/* Penalties */}
      {penalties && penalties.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Denda</h4>
          <div className="space-y-2">
            {penalties.map((penalty) => (
              <div key={penalty.id} className="flex justify-between items-start text-sm">
                <div className="flex-1">
                  <div className="text-gray-900">{penalty.description}</div>
                  <div className="text-gray-500 text-xs">{formatDate(penalty.createdAt)}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-red-600">{formatCurrency(penalty.amount)}</div>
                  <Badge
                    variant={penalty.status === 'paid' ? 'default' : 'secondary'}
                    className="text-xs capitalize"
                  >
                    {penalty.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
