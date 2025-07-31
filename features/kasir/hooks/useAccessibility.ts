import { useCallback, useRef, useEffect } from 'react'

interface UseAccessibilityReturn {
  /**
   * Announce message to screen readers via live region
   */
  announce: (message: string, priority?: 'polite' | 'assertive') => void
  
  /**
   * Focus management for keyboard navigation
   */
  focusElement: (selector: string | HTMLElement) => void
  
  /**
   * Create trap focus within container
   */
  trapFocus: (container: HTMLElement) => () => void
  
  /**
   * Format currency for screen readers
   */
  formatCurrencyForSR: (amount: number) => string
  
  /**
   * Format date for screen readers
   */
  formatDateForSR: (date: string) => string
  
  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion: boolean
}

/**
 * Custom hook for accessibility utilities in kasir components
 * Provides centralized ARIA management and screen reader support
 */
export function useAccessibility(): UseAccessibilityReturn {
  const liveRegionRef = useRef<HTMLDivElement | null>(null)
  const prefersReducedMotion = useRef(false)

  // Initialize live region & check motion preference
  useEffect(() => {
    // Create live region if not exists
    if (!liveRegionRef.current) {
      const liveRegion = document.createElement('div')
      liveRegion.setAttribute('aria-live', 'polite')
      liveRegion.setAttribute('aria-atomic', 'true')
      liveRegion.className = 'sr-only'
      liveRegion.id = 'kasir-live-region'
      document.body.appendChild(liveRegion)
      liveRegionRef.current = liveRegion
    }

    // Check motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.current = mediaQuery.matches
    
    const handleChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion.current = e.matches
    }
    
    mediaQuery.addEventListener('change', handleChange)
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
      if (liveRegionRef.current) {
        document.body.removeChild(liveRegionRef.current)
        liveRegionRef.current = null
      }
    }
  }, [])

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!liveRegionRef.current) return
    
    liveRegionRef.current.setAttribute('aria-live', priority)
    liveRegionRef.current.textContent = message
    
    // Clear after announcement to allow repeat messages
    setTimeout(() => {
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = ''
      }
    }, 1000)
  }, [])

  const focusElement = useCallback((selector: string | HTMLElement) => {
    const element = typeof selector === 'string' 
      ? document.querySelector(selector) as HTMLElement
      : selector
      
    if (element && element.focus) {
      element.focus()
      // Announce focus change for screen readers
      const ariaLabel = element.getAttribute('aria-label') || element.textContent
      if (ariaLabel) {
        announce(`Fokus berpindah ke ${ariaLabel}`, 'polite')
      }
    }
  }, [announce])

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Find close button or first focusable element
        const closeButton = container.querySelector('[aria-label*="tutup"], [aria-label*="close"]') as HTMLElement
        if (closeButton) {
          closeButton.click()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    container.addEventListener('keydown', handleEscapeKey)
    
    // Focus first element
    if (firstElement) {
      firstElement.focus()
    }

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey)
      container.removeEventListener('keydown', handleEscapeKey)
    }
  }, [])

  const formatCurrencyForSR = useCallback((amount: number): string => {
    const formatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
    
    // Convert to more readable format for screen readers
    const readable = formatted
      .replace('Rp', 'Rupiah')
      .replace(/(\d)\.(\d{3})/g, '$1 ribu $2')
      .replace(/(\d)\.(\d{3})\.(\d{3})/g, '$1 juta $3')
    
    return readable
  }, [])

  const formatDateForSR = useCallback((date: string): string => {
    try {
      const dateObj = new Date(date)
      return dateObj.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return date
    }
  }, [])

  return {
    announce,
    focusElement,
    trapFocus,
    formatCurrencyForSR,
    formatDateForSR,
    prefersReducedMotion: prefersReducedMotion.current,
  }
}

/**
 * Screen reader only CSS class for visually hidden content
 * Use this for content that should only be announced to screen readers
 */
export const srOnlyClass = 'sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0'