import { useEffect, useRef, useCallback } from 'react'

interface FocusManagerProps {
  children: React.ReactNode
  active?: boolean
  restoreFocus?: boolean
  initialFocus?: string | HTMLElement
}

/**
 * Focus management component for modals and complex interfaces
 * Handles focus trapping and restoration
 */
export function FocusManager({ 
  children, 
  active = true, 
  restoreFocus = true,
  initialFocus 
}: FocusManagerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Store the previously focused element
  useEffect(() => {
    if (active) {
      previousActiveElement.current = document.activeElement as HTMLElement
    }
  }, [active])

  // Focus trapping logic
  useEffect(() => {
    if (!active || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Focus initial element
    if (initialFocus) {
      const element = typeof initialFocus === 'string' 
        ? container.querySelector(initialFocus) as HTMLElement
        : initialFocus
      if (element && element.focus) {
        element.focus()
      }
    } else if (firstElement) {
      firstElement.focus()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }

      if (e.key === 'Escape') {
        // Find close button or trigger focus restoration
        const closeButton = container.querySelector('[data-close], [aria-label*="tutup"], [aria-label*="close"]') as HTMLElement
        if (closeButton && closeButton.click) {
          closeButton.click()
        } else if (restoreFocus && previousActiveElement.current) {
          previousActiveElement.current.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      
      // Restore focus when component unmounts
      if (restoreFocus && previousActiveElement.current && previousActiveElement.current.focus) {
        setTimeout(() => {
          previousActiveElement.current?.focus()
        }, 0)
      }
    }
  }, [active, initialFocus, restoreFocus])

  if (!active) {
    return <>{children}</>
  }

  return (
    <div ref={containerRef} role="region" aria-label="Focus managed area">
      {children}
    </div>
  )
}

/**
 * Hook for programmatic focus management
 */
export function useFocusManager() {
  const focusElement = useCallback((selector: string | HTMLElement, options?: { preventScroll?: boolean }) => {
    const element = typeof selector === 'string' 
      ? document.querySelector(selector) as HTMLElement
      : selector

    if (element && element.focus) {
      element.focus(options)
      return true
    }
    return false
  }, [])

  const focusFirst = useCallback((container: HTMLElement | string) => {
    const containerElement = typeof container === 'string'
      ? document.querySelector(container) as HTMLElement
      : container

    if (!containerElement) return false

    const focusable = containerElement.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement

    if (focusable) {
      focusable.focus()
      return true
    }
    return false
  }, [])

  const focusLast = useCallback((container: HTMLElement | string) => {
    const containerElement = typeof container === 'string'
      ? document.querySelector(container) as HTMLElement
      : container

    if (!containerElement) return false

    const focusableElements = containerElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    const lastElement = focusableElements[focusableElements.length - 1]
    if (lastElement) {
      lastElement.focus()
      return true
    }
    return false
  }, [])

  return {
    focusElement,
    focusFirst,
    focusLast,
  }
}