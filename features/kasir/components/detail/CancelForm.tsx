'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle } from 'lucide-react'

interface CancelFormProps {
  onSubmit: (reason: string) => void
  onCancel: () => void
  isProcessing: boolean
}

const MIN_LENGTH = 10
const MAX_LENGTH = 500

export function CancelForm({ onSubmit, onCancel, isProcessing }: CancelFormProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (reason.trim().length < MIN_LENGTH) {
      setError(`Alasan pembatalan minimal ${MIN_LENGTH} karakter`)
      return
    }

    if (reason.trim().length > MAX_LENGTH) {
      setError(`Alasan pembatalan maksimal ${MAX_LENGTH} karakter`)
      return
    }

    setError(null)
    onSubmit(reason.trim())
  }

  const characterCount = reason.length
  const isValid = characterCount >= MIN_LENGTH && characterCount <= MAX_LENGTH
  const characterCountColor =
    characterCount < MIN_LENGTH ? 'text-red-600' :
    characterCount > MAX_LENGTH ? 'text-red-600' :
    'text-gray-600'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="cancel-reason" className="block text-sm font-medium text-gray-700 mb-2">
          Alasan Pembatalan <span className="text-red-500">*</span>
        </label>
        <Textarea
          id="cancel-reason"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value)
            setError(null)
          }}
          placeholder="Contoh: Customer membatalkan pesanan karena perubahan jadwal acara..."
          className="min-h-[100px] resize-none"
          disabled={isProcessing}
          maxLength={MAX_LENGTH}
        />
        <div className="flex justify-between items-center mt-2">
          <span className={`text-xs ${characterCountColor}`}>
            {characterCount}/{MAX_LENGTH} karakter
            {characterCount < MIN_LENGTH && ` (minimal ${MIN_LENGTH})`}
          </span>
          {isValid && <span className="text-xs text-green-600">✓ Valid</span>}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={!isValid || isProcessing}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
        >
          {isProcessing ? 'Memproses...' : 'Lanjutkan'}
        </Button>
      </div>
    </form>
  )
}
