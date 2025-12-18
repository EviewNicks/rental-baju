import { useState } from 'react'
import { User, Phone, Mail, MapPin, CreditCard, FileText, Receipt, Edit } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { CustomerEditModal } from '../form/CustomerEditModal'
import type { Customer } from '../../types'
import { formatDate } from '../../lib/utils/client'

interface CustomerInfoCardProps {
  customer: Customer
  'data-testid'?: string
  // New props for enhanced functionality
  enableEdit?: boolean
  onCustomerUpdated?: (customer: Customer) => void
}

export function CustomerInfoCard({ 
  customer, 
  'data-testid': dataTestId,
  enableEdit = true,
  onCustomerUpdated
}: CustomerInfoCardProps) {
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentCustomer, setCurrentCustomer] = useState(customer)

  const handleEditCustomer = () => {
    setShowEditModal(true)
  }

  const handleCustomerUpdated = (updatedCustomer: Customer) => {
    setCurrentCustomer(updatedCustomer)
    setShowEditModal(false)
    onCustomerUpdated?.(updatedCustomer)
  }
  return (
    <div
      data-testid={dataTestId}
      className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6"
      role="region"
      aria-labelledby="customer-info-heading"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 id="customer-info-heading" className="text-lg font-semibold text-gray-900">
          Informasi Penyewa
        </h2>
        {enableEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditCustomer}
            className="flex items-center gap-2"
            data-testid="customer-info-edit-button"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        )}
      </div>

      <div className="flex items-start gap-8">
        <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
          {currentCustomer.foto ? (
            <Image
              src={currentCustomer.foto}
              alt={`Foto ${currentCustomer.name}`}
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
            <h3 className="text-xl font-semibold text-gray-900" data-testid="customer-info-name">
              {currentCustomer.name}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-gray-600" data-testid="customer-info-phone">
              <Phone className="h-4 w-4" aria-hidden="true" />
              <a
                href={`tel:${currentCustomer.phone}`}
                className="hover:text-blue-600 transition-colors"
                aria-label={`Telepon ${currentCustomer.name}: ${currentCustomer.phone}`}
              >
                {currentCustomer.phone}
              </a>
            </div>

            {currentCustomer.email && (
              <div className="flex items-center gap-3 text-gray-600" data-testid="customer-info-email">
                <Mail className="h-4 w-4" aria-hidden="true" />
                <a
                  href={`mailto:${currentCustomer.email}`}
                  className="hover:text-blue-600 transition-colors"
                  aria-label={`Email ${currentCustomer.name}: ${currentCustomer.email}`}
                >
                  {currentCustomer.email}
                </a>
              </div>
            )}

            {currentCustomer.identityNumber && (
              <div className="flex items-center gap-3 text-gray-600" data-testid="customer-info-nik">
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                <span aria-label={`NIK: ${currentCustomer.identityNumber}`}>
                  NIK: {currentCustomer.identityNumber}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-start gap-3 text-gray-600" data-testid="customer-info-address">
            <MapPin className="h-4 w-4 mt-0.5" aria-hidden="true" />
            <address className="not-italic">{currentCustomer.address}</address>
          </div>

          {currentCustomer.catatan && (
            <div className="flex items-start gap-3 text-gray-600" data-testid="customer-info-notes">
              <FileText className="h-4 w-4 mt-0.5" aria-hidden="true" />
              <div>
                <span className="text-sm font-medium text-gray-700">Catatan:</span>
                <p className="text-sm mt-1">{currentCustomer.catatan}</p>
              </div>
            </div>
          )}

          {currentCustomer.recentTransactions && currentCustomer.recentTransactions.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Receipt className="h-4 w-4 text-gray-600" aria-hidden="true" />
                <h3 className="text-sm font-medium text-gray-700">Transaksi Terakhir</h3>
              </div>
              <div className="space-y-2">
                {currentCustomer.recentTransactions.slice(0, 3).map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-medium text-gray-900">{transaction.kode}</span>
                      <span className="mx-2 text-gray-400">•</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          transaction.status === 'active'
                            ? 'bg-blue-100 text-blue-800'
                            : transaction.status === 'diambil'
                              ? 'bg-green-100 text-green-800'
                              : transaction.status === 'terlambat'
                                ? 'bg-red-100 text-red-800'
                                : transaction.status === 'selesai'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                        }`}
                      >
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
                {currentCustomer.recentTransactions.length > 3 && (
                  <div className="text-xs text-gray-500 text-center pt-2">
                    +{currentCustomer.recentTransactions.length - 3} transaksi lainnya
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Edit Modal */}
      <CustomerEditModal
        isOpen={showEditModal}
        customer={currentCustomer}
        onClose={() => setShowEditModal(false)}
        onCustomerUpdated={handleCustomerUpdated}
        disableNameField={true}
      />
    </div>
  )
}
