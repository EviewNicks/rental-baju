'use client'

import React, { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface KasirStatusToggleProps {
  kasirId: string
  kasirName: string
  isActive: boolean
  onToggleComplete?: () => void
  disabled?: boolean
}

export function KasirStatusToggle({
  kasirId,
  kasirName,
  isActive,
  onToggleComplete,
  disabled = false
}: KasirStatusToggleProps) {
  const [isToggling, setIsToggling] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<boolean | null>(null)

  const handleToggleRequest = (newStatus: boolean) => {
    // Always show confirmation for status changes
    setPendingStatus(newStatus)
    setConfirmDialogOpen(true)
  }

  const performToggle = async (status: boolean) => {
    setIsToggling(true)

    try {
      const response = await fetch(`/api/kasir/kasir/${kasirId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: status }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Gagal memperbarui status kasir')
      }

      const actionText = status ? 'diaktifkan' : 'dinonaktifkan'
      toast.success(`Kasir "${kasirName}" berhasil ${actionText}`)

      onToggleComplete?.()
    } catch (error) {
      console.error('Toggle kasir status error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan'
      toast.error(errorMessage)
    } finally {
      setIsToggling(false)
      setConfirmDialogOpen(false)
      setPendingStatus(null)
    }
  }

  const confirmToggle = () => {
    if (pendingStatus !== null) {
      performToggle(pendingStatus)
    }
  }

  const cancelToggle = () => {
    setConfirmDialogOpen(false)
    setPendingStatus(null)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Switch
          checked={isActive}
          onCheckedChange={handleToggleRequest}
          disabled={disabled || isToggling}
          aria-label={`Toggle status kasir ${kasirName}`}
          id={`kasir-status-${kasirId}`}
        />
        <label
          htmlFor={`kasir-status-${kasirId}`}
          className="text-sm font-medium text-gray-700 cursor-pointer"
        >
          {isActive ? 'Aktif' : 'Tidak Aktif'}
        </label>
        {isToggling && (
          <Loader2
            className="h-4 w-4 animate-spin text-blue-500"
            aria-label="Loading"
          />
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pendingStatus === false ? (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              ) : null}
              Konfirmasi Ubah Status Kasir
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                Apakah Anda yakin ingin mengubah status kasir &quot;{kasirName}&quot;
                menjadi <span className="font-semibold">
                  {pendingStatus ? 'Aktif' : 'Tidak Aktif'}
                </span>?
              </p>
              {pendingStatus === false && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Perhatian:</strong> Kasir yang tidak aktif tidak dapat membuat
                    atau mengelola transaksi baru. Pastikan tidak ada transaksi yang sedang
                    diproses oleh kasir ini.
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelToggle}
              disabled={isToggling}
            >
              Batal
            </Button>
            <Button
              variant={pendingStatus === false ? 'destructive' : 'default'}
              onClick={confirmToggle}
              disabled={isToggling}
            >
              {isToggling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  Ya, {pendingStatus ? 'Aktifkan' : 'Nonaktifkan'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}