import { User, Phone, Mail, MapPin, CreditCard, Calendar, FileText, Receipt } from 'lucide-react'
import Image from 'next/image'
import type { Customer } from '../../types/customer'
import { formatDate } from '../../lib/utils'

interface CustomerInfoCardProps {
  customer: Customer
  'data-testid'?: string
}

export function CustomerInfoCard({ customer, 'data-testid': dataTestId }: CustomerInfoCardProps) {
  return (
    <div
      data-testid={dataTestId}
      className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6"
      role="region"
      aria-labelledby="customer-info-heading"
    >
      <h2 id="customer-info-heading" className="text-lg font-semibold text-gray-900 mb-4">Informasi Penyewa</h2>

      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
          {customer.foto ? (
            <Image 
              src={customer.foto} 
              alt={`Foto ${customer.name}`}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="h-8 w-8 text-gray-900" aria-hidden="true" />
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{customer.name}</h3>
            <p className="text-sm text-gray-600">
              {customer.recentTransactions?.length || customer.totalTransactions || 0} transaksi sebelumnya
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-gray-600">
              <Phone className="h-4 w-4" aria-hidden="true" />
              <a 
                href={`tel:${customer.phone}`}
                className="hover:text-blue-600 transition-colors"
                aria-label={`Telepon ${customer.name}: ${customer.phone}`}
              >
                {customer.phone}
              </a>
            </div>

            {customer.email && (
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="h-4 w-4" aria-hidden="true" />
                <a 
                  href={`mailto:${customer.email}`}
                  className="hover:text-blue-600 transition-colors"
                  aria-label={`Email ${customer.name}: ${customer.email}`}
                >
                  {customer.email}
                </a>
              </div>
            )}

            {customer.identityNumber && (
              <div className="flex items-center gap-3 text-gray-600">
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                <span aria-label={`Nomor identitas: ${customer.identityNumber}`}>
                  {customer.identityNumber}
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <time 
                dateTime={customer.createdAt}
                aria-label={`Tanggal bergabung: ${formatDate(customer.createdAt)}`}
              >
                Bergabung {formatDate(customer.createdAt)}
              </time>
            </div>
          </div>

          <div className="flex items-start gap-3 text-gray-600">
            <MapPin className="h-4 w-4 mt-0.5" aria-hidden="true" />
            <address className="not-italic">
              {customer.address}
            </address>
          </div>

          {customer.catatan && (
            <div className="flex items-start gap-3 text-gray-600">
              <FileText className="h-4 w-4 mt-0.5" aria-hidden="true" />
              <div>
                <span className="text-sm font-medium text-gray-700">Catatan:</span>
                <p className="text-sm mt-1">{customer.catatan}</p>
              </div>
            </div>
          )}

          {customer.recentTransactions && customer.recentTransactions.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Receipt className="h-4 w-4 text-gray-600" aria-hidden="true" />
                <h3 className="text-sm font-medium text-gray-700">Transaksi Terakhir</h3>
              </div>
              <div className="space-y-2">
                {customer.recentTransactions.slice(0, 3).map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-medium text-gray-900">{transaction.kode}</span>
                      <span className="mx-2 text-gray-400">•</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        transaction.status === 'active' 
                          ? 'bg-blue-100 text-blue-800' 
                          : transaction.status === 'selesai'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        Rp {transaction.totalHarga.toLocaleString('id-ID')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(transaction.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
                {customer.recentTransactions.length > 3 && (
                  <div className="text-xs text-gray-500 text-center pt-2">
                    +{customer.recentTransactions.length - 3} transaksi lainnya
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
