import { User, Phone, Mail, MapPin, CreditCard, Calendar } from 'lucide-react'
import type { Customer } from '../../types/customer'
import { formatDate } from '../../lib/utils'

interface CustomerInfoCardProps {
  customer: Customer
}

export function CustomerInfoCard({ customer }: CustomerInfoCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Penyewa</h2>

      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="h-8 w-8 text-gray-900" />
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{customer.name}</h3>
            <p className="text-sm text-gray-600">
              {customer.totalTransactions} transaksi sebelumnya
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-gray-600">
              <Phone className="h-4 w-4" />
              <span>{customer.phone}</span>
            </div>

            {customer.email && (
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{customer.email}</span>
              </div>
            )}

            {customer.identityNumber && (
              <div className="flex items-center gap-3 text-gray-600">
                <CreditCard className="h-4 w-4" />
                <span>{customer.identityNumber}</span>
              </div>
            )}

            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Bergabung {formatDate(customer.createdAt)}</span>
            </div>
          </div>

          <div className="flex items-start gap-3 text-gray-600">
            <MapPin className="h-4 w-4 mt-0.5" />
            <span>{customer.address}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
