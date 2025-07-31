import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString: string): string {
  if (!dateString) {
    return 'Tanggal tidak tersedia'
  }
  
  const date = new Date(dateString)
  
  if (isNaN(date.getTime())) {
    return 'Tanggal tidak valid'
  }
  
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function getDaysOverdue(returnDate: string): number {
  const today = new Date()
  const returnDateObj = new Date(returnDate)
  const diffTime = today.getTime() - returnDateObj.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}
