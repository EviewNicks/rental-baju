'use client'

import type React from 'react'

import { CardHeader, CardTitle } from '@/components/ui/card'

interface FormSectionProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function FormSection({ title, children, className }: FormSectionProps) {
  return (
    <div className={className}>
      <CardHeader className="px-0 pb-4">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      {children}
    </div>
  )
}
