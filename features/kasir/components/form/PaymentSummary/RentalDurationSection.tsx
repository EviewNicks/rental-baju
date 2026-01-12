'use client'

import { Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { DateCalculator } from '../../../lib/utils/dateCalculator'

interface RentalDurationSectionProps {
  duration: number
  pickupDate: string
  returnDate: string
  onDurationChange: (duration: 4 | 7) => void
  onPickupDateChange: (date: string) => void
}

export function RentalDurationSection({
  duration,
  pickupDate,
  returnDate,
  onDurationChange,
  onPickupDateChange,
}: RentalDurationSectionProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 space-y-6">
      <div className="flex items-center gap-2 text-xl font-bold text-gray-900">
        <Calendar className="h-6 w-6" />
        Tanggal & Durasi Sewa
      </div>

      {/* Duration Selector */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-gray-700">
          Pilih Paket Durasi Sewa
        </Label>
        <RadioGroup
          value={duration?.toString() || '4'}
          onValueChange={(value) => onDurationChange(Number(value) as 4 | 7)}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          data-testid="duration-selector"
        >
          <div className="flex items-center space-x-3 border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <RadioGroupItem value="4" id="duration-4" data-testid="duration-4-radio" />
            <Label htmlFor="duration-4" className="flex-1 cursor-pointer">
              <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-900">Paket 4 Hari</div>
                  <div className="text-sm text-gray-600">Harga normal untuk area lokal</div>
                
              </div>
            </Label>
          </div>
          
          <div className="flex items-center space-x-3 border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <RadioGroupItem value="7" id="duration-7" data-testid="duration-7-radio" />
            <Label htmlFor="duration-7" className="flex-1 cursor-pointer justify-between">
              <div className="flex items-center justify-between"> 
                  <div className="font-medium text-gray-900">Paket 7 Hari</div>
                  <div className="text-sm text-gray-600">+50% untuk luar kota</div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pickup Date */}
        <div>
          <Label htmlFor="pickupDate" className="text-sm font-medium text-gray-700">
            Tanggal Ambil
          </Label>
          <Input
            id="pickupDate"
            type="date"
            value={pickupDate}
            onChange={(e) => onPickupDateChange(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="mt-2"
            required
            data-testid="pickup-date-input"
          />
        </div>

        {/* Return Date */}
        <div>
          <Label htmlFor="returnDate" className="text-sm font-medium text-gray-700">
            Tanggal Kembali
          </Label>
          <Input
            id="returnDate"
            type="date"
            value={returnDate}
            readOnly
            className="mt-2 bg-gray-50"
            data-testid="return-date-input"
          />
          {returnDate && (
            <div className="text-xs text-gray-600 mt-1">
              {DateCalculator.formatDateForDisplay(returnDate)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}