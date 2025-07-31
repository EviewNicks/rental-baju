'use client'

import type React from 'react'
import { Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface BaseFieldProps {
  name: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  helpText?: string
  error?: string | null
  touched?: boolean
  required?: boolean
  'data-testid'?: string
}

interface TextFieldProps extends BaseFieldProps {
  type: 'text' | 'number'
  value: string | number
  onChange: (value: string | number) => void
  onBlur: (value: string | number) => void
  placeholder?: string
  maxLength?: number
  min?: number
  max?: number
  prefix?: string
}

interface TextareaFieldProps extends BaseFieldProps {
  type: 'textarea'
  value: string
  onChange: (value: string) => void
  onBlur: (value: string) => void
  placeholder?: string
  maxLength?: number
  rows?: number
}

interface SelectFieldProps extends BaseFieldProps {
  type: 'select'
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string; color?: string; disabled?: boolean }>
  placeholder?: string
  disabled?: boolean
}

type FormFieldProps = TextFieldProps | TextareaFieldProps | SelectFieldProps

export function FormField(props: FormFieldProps) {
  const { name, label, icon: Icon, helpText, error, touched, required } = props
  const testId = props['data-testid']

  const hasError = error && touched
  const hasSuccess = !error && touched && props.value

  const fieldClassName = cn(hasError && 'border-red-500', hasSuccess && 'border-green-500')

  return (
    <div className="space-y-2" data-testid={testId}>
      <Label htmlFor={name} className="flex items-center gap-2" data-testid={testId ? `${testId}-label` : undefined}>
        {Icon && <Icon className="w-4 h-4" />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>

      {props.type === 'text' && (
        <div className="relative">
          {props.prefix && (
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              {props.prefix}
            </span>
          )}
          <Input
            id={name}
            type="text"
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            onBlur={(e) => props.onBlur(e.target.value)}
            placeholder={props.placeholder}
            maxLength={props.maxLength}
            className={cn(fieldClassName, props.prefix && 'pl-10')}
            data-testid={testId ? `${testId}-input` : undefined}
          />
        </div>
      )}

      {props.type === 'number' && (
        <div className="relative">
          {props.prefix && (
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              {props.prefix}
            </span>
          )}
          <Input
            id={name}
            type="number"
            value={props.value}
            onChange={(e) => props.onChange(Number(e.target.value))}
            onBlur={(e) => props.onBlur(Number(e.target.value))}
            placeholder={props.placeholder}
            min={props.min}
            max={props.max}
            className={cn(fieldClassName, props.prefix && 'pl-10')}
            data-testid={testId ? `${testId}-input` : undefined}
          />
        </div>
      )}

      {props.type === 'textarea' && (
        <Textarea
          id={name}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          onBlur={(e) => props.onBlur(e.target.value)}
          placeholder={props.placeholder}
          maxLength={props.maxLength}
          rows={props.rows}
          className={fieldClassName}
          data-testid={testId ? `${testId}-input` : undefined}
        />
      )}

      {props.type === 'select' && (
        <Select value={props.value || undefined} onValueChange={props.onChange} disabled={props.disabled}>
          <SelectTrigger className={fieldClassName} data-testid={testId ? `${testId}-trigger` : undefined}>
            <SelectValue placeholder={props.placeholder} />
          </SelectTrigger>
          <SelectContent data-testid={testId ? `${testId}-content` : undefined}>
            {props.options.map((option) => (
              <SelectItem key={option.value} value={option.value} disabled={option.disabled} data-testid={testId ? `${testId}-option-${option.value}` : undefined}>
                <div className="flex items-center gap-2">
                  {option.color && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Validation Messages */}
      {hasError && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <X className="w-3 h-3" />
          {error}
        </p>
      )}

      {hasSuccess && props.type !== 'select' && (
        <p className="text-sm text-green-500 flex items-center gap-1">
          <Check className="w-3 h-3" />
          Valid
        </p>
      )}

      {/* Help Text */}
      {helpText && (
        <p className="text-xs text-gray-500">
          {helpText}
          {props.type === 'textarea' && props.maxLength && (
            <span className="ml-2">
              ({typeof props.value === 'string' ? props.value.length : 0}/{props.maxLength})
            </span>
          )}
        </p>
      )}
    </div>
  )
}
