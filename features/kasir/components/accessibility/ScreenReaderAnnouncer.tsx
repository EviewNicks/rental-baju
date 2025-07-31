import { useEffect, useRef } from 'react'

interface ScreenReaderAnnouncerProps {
  message: string
  priority?: 'polite' | 'assertive'
  clearAfter?: number
}

/**
 * Component for announcing messages to screen readers
 * Uses ARIA live regions for dynamic content updates
 */
export function ScreenReaderAnnouncer({ 
  message, 
  priority = 'polite', 
  clearAfter = 3000 
}: ScreenReaderAnnouncerProps) {
  const announcerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!message || !announcerRef.current) return

    // Set the message
    announcerRef.current.textContent = message

    // Clear message after specified time
    const timeoutId = setTimeout(() => {
      if (announcerRef.current) {
        announcerRef.current.textContent = ''
      }
    }, clearAfter)

    return () => clearTimeout(timeoutId)
  }, [message, clearAfter])

  return (
    <div
      ref={announcerRef}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      role="status"
    />
  )
}

/**
 * Hook for managing screen reader announcements
 */
export function useScreenReaderAnnouncer() {
  const announcerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Create global announcer if not exists
    if (!announcerRef.current) {
      const announcer = document.createElement('div')
      announcer.setAttribute('aria-live', 'polite')
      announcer.setAttribute('aria-atomic', 'true')
      announcer.setAttribute('role', 'status')
      announcer.className = 'sr-only'
      announcer.id = 'global-screen-reader-announcer'
      document.body.appendChild(announcer)
      announcerRef.current = announcer
    }

    return () => {
      if (announcerRef.current && document.body.contains(announcerRef.current)) {
        document.body.removeChild(announcerRef.current)
      }
    }
  }, [])

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcerRef.current) return

    announcerRef.current.setAttribute('aria-live', priority)
    announcerRef.current.textContent = message

    // Clear after announcement
    setTimeout(() => {
      if (announcerRef.current) {
        announcerRef.current.textContent = ''
      }
    }, 3000)
  }

  return { announce }
}