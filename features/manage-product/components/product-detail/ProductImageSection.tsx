'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Maximize2, X, Eye, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { getValidImageUrl } from '../../lib/utils/imageValidate'

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
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleImageLoad = () => {
    setImageLoaded(true)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageLoaded(true)
    setImageError(true)
  }

  return (
    <>
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-2 hover:border-yellow-200">
        <CardContent className="p-0">
          <div className={`space-y-4 ${className}`}>
            <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
              {/* Loading State */}
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full"></div>
                </div>
              )}

              {/* Image */}
              <Image
                src={getValidImageUrl(imageUrl)}
                alt={productName}
                width={400}
                height={300}
                className={`
                  w-full h-full object-cover cursor-pointer transition-all duration-500
                  group-hover:scale-110 
                  ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                  ${imageError ? 'object-center' : ''}
                `}
                onClick={() => setIsZoomed(true)}
                onLoad={handleImageLoad}
                onError={handleImageError}
                priority
              />

              {/* Overlay Effects */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Hover Actions */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                <Button
                  onClick={() => setIsZoomed(true)}
                  className="
                    bg-white/95 hover:bg-yellow-400 text-gray-900 hover:text-black 
                    backdrop-blur-sm shadow-xl transform scale-95 hover:scale-100 
                    transition-all duration-200 font-semibold
                  "
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Lihat Detail
                  <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {/* Corner Zoom Indicator */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-yellow-400 text-black p-2 rounded-full shadow-lg">
                  <Maximize2 className="w-4 h-4" />
                </div>
              </div>

              {/* Image Quality Badge */}
              {imageLoaded && !imageError && (
                <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                    HD Quality
                  </div>
                </div>
              )}
            </div>

            {/* Image Info Bar */}
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Gambar Produk
                </span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-md">
                  Klik untuk memperbesar
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Image Zoom Modal */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="max-w-5xl p-0 bg-black/95 border-0 overflow-hidden">
          <DialogTitle className="sr-only">Zoom gambar produk {productName}</DialogTitle>
          <DialogDescription className="sr-only">
            Gambar produk {productName} dalam tampilan yang diperbesar. Tekan Escape atau klik tombol tutup untuk menutup tampilan ini.
          </DialogDescription>
          <div className="relative">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              className="
                absolute top-4 right-4 z-20 text-white hover:text-yellow-400 
                hover:bg-white/10 backdrop-blur-sm transition-all duration-200
              "
              onClick={() => setIsZoomed(false)}
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Product Name Overlay */}
            <div className="absolute top-4 left-4 z-20">
              <h3 className="text-white font-semibold text-lg bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
                {productName}
              </h3>
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-4 right-4 z-20">
              <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
                <Maximize2 className="w-4 h-4 text-white" />
                <span className="text-white text-sm">ESC untuk tutup</span>
              </div>
            </div>

            {/* Enhanced Image */}
            <div className="relative bg-black/50">
              <Image
                src={getValidImageUrl(imageUrl)}
                alt={productName}
                width={1200}
                height={800}
                className="w-full h-auto max-h-[90vh] object-contain"
                priority
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
