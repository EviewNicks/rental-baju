import { Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '../../lib/utils'
import Image from 'next/image'

interface ProductDetailCardProps {
  item: {
    product: {
      id: string
      name: string
      category: string
      size: string
      color: string
      image: string
      description?: string
    }
    quantity: number
    pricePerDay: number
    duration: number
    subtotal: number
  }
}

export function ProductDetailCard({ item }: ProductDetailCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6">
      <div className="flex items-start gap-4">
        <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={item.product.image || '/products/image.png'}
            alt={item.product.name}
            width={200}
            height={200}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{item.product.name}</h3>
            {item.product.description && (
              <p className="text-sm text-gray-600">{item.product.description}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              <Tag className="h-3 w-3 mr-1" />
              {item.product.category}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {item.product.size}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {item.product.color}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Jumlah</div>
              <div className="font-semibold text-gray-900">{item.quantity}x</div>
            </div>
            <div>
              <div className="text-gray-600">Harga/Hari</div>
              <div className="font-semibold text-gray-900">{formatCurrency(item.pricePerDay)}</div>
            </div>
            <div>
              <div className="text-gray-600">Durasi</div>
              <div className="font-semibold text-gray-900">{item.duration} hari</div>
            </div>
            <div>
              <div className="text-gray-600">Subtotal</div>
              <div className="font-semibold text-gray-900">{formatCurrency(item.subtotal)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
