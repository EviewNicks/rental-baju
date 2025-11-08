import { User, Crown, Mail } from 'lucide-react'
import Image from 'next/image'
import type { KasirInfo } from '../../types/index'

interface KasirInfoCardProps {
  kasir: KasirInfo | null
  'data-testid'?: string
}

export function KasirInfoCard({ kasir, 'data-testid': dataTestId }: KasirInfoCardProps) {
  // Handle case when kasir info is not available
  if (!kasir) {
    return (
      <div
        data-testid={dataTestId}
        className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6"
        role="region"
        aria-labelledby="kasir-info-heading"
      >
        <h2 id="kasir-info-heading" className="text-lg font-semibold text-gray-900 mb-4">
          Informasi Kasir
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="h-8 w-8 text-gray-400" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900">Tidak Ada Data</h3>
            <p className="text-sm text-gray-600">Informasi kasir tidak tersedia</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      data-testid={dataTestId}
      className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6"
      role="region"
      aria-labelledby="kasir-info-heading"
    >
      <h2 id="kasir-info-heading" className="text-lg font-semibold text-gray-900 mb-4">
        Informasi Kasir
      </h2>

      <div className="flex items-start gap-4">
        <div className="relative">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
            {kasir.avatar ? (
              <Image
                src={kasir.avatar}
                alt={`Foto ${kasir.name}`}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-blue-600" aria-hidden="true" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <Crown className="h-3 w-3 text-white" />
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{kasir.name}</h3>
          </div>

          <div className="flex items-center gap-3 text-gray-600">
            <Mail className="h-4 w-4" aria-hidden="true" />
            <a
              href={`mailto:${kasir.email}`}
              className="hover:text-blue-600 transition-colors"
              aria-label={`Email kasir: ${kasir.email}`}
            >
              {kasir.email}
            </a>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              Kasir
            </div>
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Active
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}