'use client'

import { useState, useCallback } from 'react'

interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  min?: number
  max?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  custom?: (value: any) => string | null
}

interface ValidationRules {
  [key: string]: ValidationRule
}

interface ValidationErrors {
  [key: string]: string | null
}

export function useFormValidation(rules: ValidationRules) {
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({})

  const validateField = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (name: string, value: any): string | null => {
      const rule = rules[name]
      if (!rule) return null

      if (rule.required && (!value || value.toString().trim() === '')) {
        return `${name} wajib diisi`
      }

      if (rule.minLength && value && value.toString().length < rule.minLength) {
        return `${name} minimal ${rule.minLength} karakter`
      }

      if (rule.maxLength && value && value.toString().length > rule.maxLength) {
        return `${name} maksimal ${rule.maxLength} karakter`
      }

      if (rule.pattern && value && !rule.pattern.test(value.toString())) {
        return `Format ${name} tidak valid`
      }

      if (rule.min !== undefined && value && Number(value) < rule.min) {
        return `${name} minimal ${rule.min}`
      }

      if (rule.max !== undefined && value && Number(value) > rule.max) {
        return `${name} maksimal ${rule.max}`
      }

      if (rule.custom && value) {
        return rule.custom(value)
      }

      return null
    },
    [rules],
  )

  const validate = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (formData: { [key: string]: any }) => {
      const newErrors: ValidationErrors = {}
      let isValid = true

      Object.keys(rules).forEach((fieldName) => {
        const error = validateField(fieldName, formData[fieldName])
        newErrors[fieldName] = error
        if (error) isValid = false
      })

      setErrors(newErrors)
      return isValid
    },
    [rules, validateField],
  )

  const validateSingleField = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (name: string, value: any) => {
      const error = validateField(name, value)
      setErrors((prev) => ({ ...prev, [name]: error }))
      setTouched((prev) => ({ ...prev, [name]: true }))
      return !error
    },
    [validateField],
  )

  const clearErrors = useCallback(() => {
    setErrors({})
    setTouched({})
  }, [])

  return {
    errors,
    touched,
    validate,
    validateSingleField,
    clearErrors,
  }
}
