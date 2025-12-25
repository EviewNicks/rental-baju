import { useState, useEffect, useRef, useCallback } from 'react'
import type { DebounceOptions, UseDebounceReturn } from './types'

/**
 * Enhanced debounce hook with Enter key support and performance optimizations
 * 
 * Features:
 * - Configurable delay (default 300ms for search optimization)
 * - Enter key immediate execution
 * - Loading state management
 * - Automatic cleanup on unmount
 * - Performance monitoring callbacks
 */
export function useDebounce<T>(
  value: T,
  options: DebounceOptions = {}
): UseDebounceReturn<T> {
  const {
    delay = 300, // Default 300ms as per requirements
    immediate = false,
    maxWait,
    onPending,
    onExecute
  } = options

  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const [isPending, setIsPending] = useState(false)
  
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const maxTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const lastCallTimeRef = useRef<number | undefined>(undefined)
  const mountedRef = useRef(true)

  // Update mounted status
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Execute the debounced update
  const executeUpdate = useCallback((newValue: T) => {
    if (!mountedRef.current) return
    
    setDebouncedValue(newValue)
    setIsPending(false)
    onPending?.(false)
    onExecute?.(newValue)
    
    // Clear timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current)
      maxTimeoutRef.current = undefined
    }
  }, [onPending, onExecute])

  // Cancel pending debounce
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current)
      maxTimeoutRef.current = undefined
    }
    
    if (isPending && mountedRef.current) {
      setIsPending(false)
      onPending?.(false)
    }
  }, [isPending, onPending])

  // Flush immediately (execute now)
  const flush = useCallback(() => {
    if (isPending && mountedRef.current) {
      executeUpdate(value)
    }
  }, [isPending, value, executeUpdate])

  // Execute immediately (for Enter key)
  const execute = useCallback(() => {
    if (mountedRef.current) {
      executeUpdate(value)
    }
  }, [value, executeUpdate])

  // Main debounce effect
  useEffect(() => {
    // Handle immediate execution for empty values (clear search)
    if (immediate && (!value || (typeof value === 'string' && value.trim() === ''))) {
      executeUpdate(value)
      return
    }

    // Set pending state
    if (!isPending && mountedRef.current) {
      setIsPending(true)
      onPending?.(true)
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        executeUpdate(value)
      }
    }, delay)

    // Handle maxWait
    if (maxWait) {
      const now = Date.now()
      if (!lastCallTimeRef.current) {
        lastCallTimeRef.current = now
      }

      const timeSinceLastCall = now - lastCallTimeRef.current
      if (timeSinceLastCall >= maxWait) {
        executeUpdate(value)
        lastCallTimeRef.current = now
      } else if (!maxTimeoutRef.current) {
        maxTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            executeUpdate(value)
            lastCallTimeRef.current = Date.now()
          }
        }, maxWait - timeSinceLastCall)
      }
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay, immediate, maxWait, executeUpdate, onPending])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel()
    }
  }, [cancel])

  return {
    debouncedValue,
    isPending,
    cancel,
    flush,
    execute
  }
}

/**
 * Specialized hook for search input with Enter key support
 */
export function useSearchDebounce(
  searchValue: string,
  onSearch: (value: string) => void,
  delay: number = 300
) {
  const { debouncedValue, isPending, execute, cancel } = useDebounce(searchValue, {
    delay,
    immediate: true, // Clear search immediately when empty
    onExecute: (value) => onSearch(value as string),
  })

  // Handle Enter key press
  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      execute() // Execute search immediately on Enter
    }
  }, [execute])

  // Handle search clear
  const handleClear = useCallback(() => {
    cancel()
    onSearch('') // Clear search immediately
  }, [cancel, onSearch])

  return {
    debouncedValue,
    isPending,
    handleKeyPress,
    handleClear,
    execute,
    cancel
  }
}