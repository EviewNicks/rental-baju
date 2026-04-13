/**
 * Dynamic Form Field Component
 *
 * Component untuk render form fields secara dinamis berdasarkan konfigurasi strategy.
 * Support number, select, checkbox-group, dan text field types.
 */

'use client'

import { Check, Plus, Minus } from 'lucide-react'
import type { FormFieldConfig } from '../../lib/strategies/CategoryFormStrategy'
import type { CategoryFormData } from '../../lib/strategies/CategoryFormStrategy'
import { ConditionEvaluator } from '../../lib/strategies/ConditionEvaluator'

interface DynamicFormFieldProps {
  field: FormFieldConfig
  value: unknown
  onChange: (value: unknown) => void
  onBlur: (value: unknown) => void
  error?: string | null
  touched?: boolean
  formDescription?: string
  formData?: CategoryFormData // Complete form data for condition evaluation
}

export function DynamicFormField({
  field,
  value,
  onChange,
  onBlur,
  error,
  touched,
  formData,
}: DynamicFormFieldProps) {
  // Check if field should be visible based on condition
  const isVisible = formData ? ConditionEvaluator.isFieldVisible(field.condition, formData) : true

  // Don't render if field is not visible
  if (!isVisible) {
    return null
  }

  // Normalize value for non-number fields
  const localValue = value
  const handleChange = onChange
  const handleBlur = onBlur

  // Render field berdasarkan type
  const renderField = () => {
    switch (field.type) {
      case 'number': {
        // Derive display value directly from props — no local state to avoid stale "04" issue
        const numericValue = typeof value === 'number' ? value : (Number(value) || 0)
        return (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={numericValue === 0 ? '' : String(numericValue)}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '')
                const num = raw === '' ? 0 : Number(raw)
                const clamped = field.max !== undefined ? Math.min(field.max, num) : num
                onChange(clamped)
              }}
              onBlur={(e) => {
                const raw = e.target.value.replace(/\D/g, '')
                const num = raw === '' ? 0 : Number(raw)
                const clamped = field.max !== undefined ? Math.min(field.max, num) : num
                onBlur(clamped)
              }}
              placeholder={field.placeholder || '0'}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                error && touched ? 'border-red-500' : 'border-gray-300'
              }`}
              data-testid={`field-${field.name}`}
            />
            {field.helpText && <p className="text-xs text-gray-500">{field.helpText}</p>}
            {error && touched && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <span>×</span>
                {error}
              </p>
            )}
          </div>
        )
      }

      case 'select':
        return (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <select
              title="select"
              value={
                typeof localValue === 'string' || typeof localValue === 'number' ? localValue : ''
              }
              onChange={(e) => handleChange(e.target.value)}
              onBlur={(e) => handleBlur(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                error && touched ? 'border-red-500' : 'border-gray-300'
              }`}
              data-testid={`field-${field.name}`}
            >
              <option value="">Pilih {field.label}</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {field.helpText && <p className="text-xs text-gray-500">{field.helpText}</p>}
            {error && touched && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <span>×</span>
                {error}
              </p>
            )}
          </div>
        )

      case 'checkbox-group':
        return (
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>

            {field.helpText && <p className="text-xs text-gray-500 mb-2">{field.helpText}</p>}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {field.options?.map((option) => {
                const isChecked = Array.isArray(localValue) && localValue.includes(option.value)

                return (
                  <div
                    key={option.value}
                    className={`relative flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                      isChecked
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      const currentValues = Array.isArray(localValue) ? localValue : []
                      if (isChecked) {
                        handleChange(currentValues.filter((v: string) => v !== option.value))
                      } else {
                        handleChange([...currentValues, option.value])
                      }
                    }}
                    data-testid={`checkbox-${field.name}-${option.value}`}
                  >
                    <div
                      className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                        isChecked ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm font-medium">{option.label}</span>
                  </div>
                )
              })}
            </div>

            {error && touched && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <span>×</span>
                {error}
              </p>
            )}
          </div>
        )

      case 'text':
        return (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={
                typeof localValue === 'string' || typeof localValue === 'number' ? localValue : ''
              }
              onChange={(e) => handleChange(e.target.value)}
              onBlur={(e) => handleBlur(e.target.value)}
              placeholder={field.placeholder}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                error && touched ? 'border-red-500' : 'border-gray-300'
              }`}
              data-testid={`field-${field.name}`}
            />
            {field.helpText && <p className="text-xs text-gray-500">{field.helpText}</p>}
            {error && touched && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <span>×</span>
                {error}
              </p>
            )}
          </div>
        )

      default:
        return <div className="text-red-500 text-sm">Unknown field type: {field.type}</div>
    }
  }

  return (
    <div className="dynamic-form-field" data-testid={`dynamic-field-${field.name}`}>
      {renderField()}
    </div>
  )
}

/**
 * Helper component untuk quantity controls dengan + dan - buttons
 */
interface QuantityControlProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label: string
  helpText?: string
  error?: string | null
  touched?: boolean
}

export function QuantityControl({
  value,
  onChange,
  min = 0,
  max = 9999,
  label,
  helpText,
  error,
  touched,
}: QuantityControlProps) {
  const increment = () => {
    const newValue = Math.min(max, value + 1)
    onChange(newValue)
  }

  const decrement = () => {
    const newValue = Math.max(min, value - 1)
    onChange(newValue)
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">{label}</label>

      <div className="flex items-center space-x-2">
        <button
          title="decrement"
          type="button"
          onClick={decrement}
          disabled={value <= min}
          className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid={`decrement-${label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <Minus className="w-4 h-4" />
        </button>

        <input
          title="number"
          type="number"
          value={value}
          onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || 0)))}
          min={min}
          max={max}
          className={`w-20 px-3 py-2 text-center border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            error && touched ? 'border-red-500' : 'border-gray-300'
          }`}
          data-testid={`quantity-${label.toLowerCase().replace(/\s+/g, '-')}`}
        />

        <button
          title="increment"
          type="button"
          onClick={increment}
          disabled={value >= max}
          className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid={`increment-${label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {helpText && <p className="text-xs text-gray-500">{helpText}</p>}

      {error && touched && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <span>×</span>
          {error}
        </p>
      )}
    </div>
  )
}
