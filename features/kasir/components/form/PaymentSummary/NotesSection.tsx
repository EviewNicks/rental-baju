'use client'

import { FileText } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

interface NotesSectionProps {
  notes: string
  onNotesChange: (notes: string) => void
}

export function NotesSection({
  notes,
  onNotesChange,
}: NotesSectionProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 space-y-4">
      <div className="flex items-center gap-2 text-xl font-bold text-gray-900">
        <FileText className="h-6 w-6" />
        Catatan (Opsional)
      </div>
      <Textarea
        value={notes || ''}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Tambahkan catatan untuk transaksi ini..."
        className="min-h-[100px]"
        data-testid="transaction-notes-textarea"
      />
    </div>
  )
}