'use client'

import type React from 'react'

import { CardHeader, CardTitle } from '@/components/ui/card'

interface FormSectionProps {
  title: string
  children: React.ReactNode
  className?: string
  description?: string
}

export function FormSection({ title, children, className, description }: FormSectionProps) {
  return (
    <div className={className}>
      <CardHeader className="px-0 pb-4">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </CardHeader>
      {children}
    </div>
  )
}
