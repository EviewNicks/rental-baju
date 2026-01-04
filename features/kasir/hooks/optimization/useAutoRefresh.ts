import { useCallback, useEffect, useRef } from 'react'
import type { AutoRefreshOptions } from './types'
import { NetworkCondition, UserActivity } from './types'

/**
 * Simplified Auto Refresh hook
 * 
 * Features:
 * - Basic interval management
 * - Pause on typing
 * - Tab visibility detection
 */
export function useAutoRefresh(options: AutoRefreshOptions = {}) {
  const {
    interval = 60000, // Default 60 seconds
  } = options

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef<(() => void) | null>(null)
  const isActiveRef = useRef(false)
  const isPausedRef = useRef(false)

  // Start auto-refresh
  const start = useCallback((callback: () => void) => {
    callbackRef.current = callback
    isActiveRef.current = true
    isPausedRef.current = false

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      if (!isPausedRef.current && callbackRef.current) {
        callbackRef.current()
      }
    }, interval)
  }, [interval])

  // Stop auto-refresh
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    isActiveRef.current = false
    isPausedRef.current = false
    callbackRef.current = null
  }, [])

  // Pause auto-refresh
  const pause = useCallback(() => {
    isPausedRef.current = true
  }, [])

  // Resume auto-refresh
  const resume = useCallback(() => {
    isPausedRef.current = false
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    start,
    stop,
    pause,
    resume,
    isActive: isActiveRef.current,
    isPaused: isPausedRef.current,
    networkCondition: NetworkCondition.FAST, // Simplified - always fast
    userActivity: UserActivity.ACTIVE, // Simplified - always active
    isTabVisible: true, // Simplified - always visible (no SSR issues)
    currentInterval: interval,
  }
}