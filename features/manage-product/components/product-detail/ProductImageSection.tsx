'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Maximize2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface ProductImageSectionProps {
  imageUrl?: string
  productName: string
  className?: string
}

export function ProductImageSection({
  imageUrl,
  productName,
  className,
}: ProductImageSectionProps) {
  const [isZoomed, setIsZoomed] = useState(false)

  return (
    <>
      <div className={`space-y-4 ${className}`}>
        <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden relative group">
          <Image
            // src={imageUrl || '/products/image.png'}
            src={'/products/image.png'}
            alt={productName}
            width={400}
            height={300}
            className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
            onClick={() => setIsZoomed(true)}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          <Button
            variant="outline"
            size="sm"
            className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm"
            onClick={() => setIsZoomed(true)}
          >
            <Maximize2 className="w-4 h-4 mr-2" />
            Lihat Gambar Besar
          </Button>
        </div>
      </div>

      {/* Image Zoom Modal */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="max-w-4xl p-0 bg-black/90 border-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={() => setIsZoomed(false)}
            >
              <X className="w-4 h-4" />
            </Button>
            <Image
              src={imageUrl || '/placeholder.svg?height=600&width=800'}
              alt={productName}
              width={800}
              height={600}
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
