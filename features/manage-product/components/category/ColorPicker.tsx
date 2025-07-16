'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  className?: string
}

const presetColors = [
  { color: '#FFD700', name: 'Gold' },
  { color: '#EC4899', name: 'Pink' },
  { color: '#3B82F6', name: 'Blue' },
  { color: '#8B5CF6', name: 'Purple' },
  { color: '#10B981', name: 'Green' },
  { color: '#F59E0B', name: 'Orange' },
  { color: '#EF4444', name: 'Red' },
  { color: '#6B7280', name: 'Gray' },
  { color: '#84CC16', name: 'Lime' },
  { color: '#F97316', name: 'Amber' },
]

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(value)

  const handlePresetClick = (color: string) => {
    onChange(color)
    setCustomColor(color)
  }

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color)
    onChange(color)
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3 block">Pilih Warna Preset</Label>
        <div className="grid grid-cols-5 gap-2">
          {presetColors.map((preset) => (
            <button
              key={preset.color}
              type="button"
              className={cn(
                'w-10 h-10 rounded-full border-2 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2',
                value === preset.color ? 'border-gray-800 shadow-lg' : 'border-gray-200',
              )}
              style={{ backgroundColor: preset.color }}
              onClick={() => handlePresetClick(preset.color)}
              title={preset.name}
            >
              {value === preset.color && <Check className="w-4 h-4 text-white mx-auto" />}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="custom-color" className="text-sm font-medium text-gray-700 mb-2 block">
          Atau Pilih Warna Kustom
        </Label>
        <div className="flex items-center space-x-3">
          <input
            id="custom-color"
            type="color"
            value={customColor}
            onChange={(e) => handleCustomColorChange(e.target.value)}
            className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
          />
          <Input
            type="text"
            value={customColor}
            onChange={(e) => handleCustomColorChange(e.target.value)}
            placeholder="#000000"
            className="flex-1 font-mono"
            pattern="^#[0-9A-Fa-f]{6}$"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Format: #RRGGBB (contoh: #FFD700)</p>
      </div>
    </div>
  )
}
