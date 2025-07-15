'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { ImageIcon, X, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface ImageUploadProps {
  value?: string
  onChange: (value: string | null) => void
  className?: string
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          setPreview(result)
          onChange(result)
        }
        reader.readAsDataURL(file)
      }
    },
    [onChange],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  })

  const removeImage = () => {
    setPreview(null)
    onChange(null)
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Gambar Produk</label>
        <p className="text-xs text-gray-500">
          Upload gambar produk (JPG, PNG, WebP). Maksimal 5MB.
        </p>
      </div>

      {preview ? (
        <div className="relative">
          <div className="w-48 h-48 mx-auto rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={preview || '/placeholder.svg'}
              alt="Preview"
              width={192}
              height={192}
              className="w-full h-full object-cover"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={removeImage}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors max-w-96 mx-auto',
            isDragActive
              ? 'border-yellow-400 bg-yellow-50'
              : 'border-gray-300 hover:border-gray-400',
          )}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              {isDragActive ? (
                <Upload className="w-8 h-8 text-yellow-500" />
              ) : (
                <ImageIcon className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isDragActive
                  ? 'Lepaskan gambar di sini'
                  : 'Drag & drop gambar di sini atau klik untuk memilih'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Format: JPG, PNG, WebP • Maksimal: 5MB</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
