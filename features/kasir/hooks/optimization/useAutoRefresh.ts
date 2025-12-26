import { useCallback, useEffect, useRef, useState } from 'react'
import type { AutoRefreshOptions } from './types'
import { NetworkCondition, UserActivity } from './types'

/**
 * Auto Refresh hook with network-adaptive intervals and user activity detection
 * 
 * Features:
 * - Network condition detection
 * - User activity monitoring
 * - Tab visibility detection
 * - Adaptive refresh intervals
 */
export function useAutoRefresh(options: AutoRefreshOptions = {}) {
  const {
    interval = 60000, // Default 60 seconds
    pauseOnTyping = true,
    pauseOnInactive = true,
    adaptToNetwork = true,
    maxInterval = 300000, // 5 minutes max
    minInterval = 30000, // 30 seconds min
  } = options

  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [networkCondition, setNetworkCondition] = useState<NetworkCondition>(NetworkCondition.FAST)
  const [userActivity, setUserActivity] = useState<UserActivity>(UserActivity.ACTIVE)
  const [isTabVisible, setIsTabVisible] = useState(true)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef<(() => void) | null>(null)

  // Network condition detection
  useEffect(() => {
    if (!adaptToNetwork || typeof navigator === 'undefined') return

    const updateNetworkCondition = () => {
      if ('connection' in navigator) {
        const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection
        if (connection) {
          const effectiveType = connection.effectiveType
          
          switch (effectiveType) {
            case 'slow-2g':
            case '2g':
              setNetworkCondition(NetworkCondition.SLOW)
              break
            case '3g':
              setNetworkCondition(NetworkCondition.FAST)
              break
            case '4g':
            default:
              setNetworkCondition(NetworkCondition.FAST)
              break
          }
        }
      }

      // Fallback: detect offline status
      if (!navigator.onLine) {
        setNetworkCondition(NetworkCondition.OFFLINE)
      }
    }

    updateNetworkCondition()

    // Listen for network changes
    const handleOnline = () => setNetworkCondition(NetworkCondition.FAST)
    const handleOffline = () => setNetworkCondition(NetworkCondition.OFFLINE)
    const handleConnectionChange = () => updateNetworkCondition()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    if ('connection' in navigator) {
      const connection = (navigator as Navigator & { connection?: { addEventListener?: (event: string, handler: () => void) => void } }).connection
      connection?.addEventListener?.('change', handleConnectionChange)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if ('connection' in navigator) {
        const connection = (navigator as Navigator & { connection?: { removeEventListener?: (event: string, handler: () => void) => void } }).connection
        connection?.removeEventListener?.('change', handleConnectionChange)
      }
    }
  }, [adaptToNetwork])

  // Tab visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden
      setIsTabVisible(visible)
      
      if (pauseOnInactive) {
        if (visible) {
          setUserActivity(UserActivity.ACTIVE)
        } else {
          setUserActivity(UserActivity.AWAY)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [pauseOnInactive])

  // User activity detection (typing, mouse movement, etc.)
  useEffect(() => {
    if (!pauseOnTyping) return

    let activityTimer: NodeJS.Timeout

    const resetActivityTimer = () => {
      clearTimeout(activityTimer)
      setUserActivity(UserActivity.ACTIVE)
      
      activityTimer = setTimeout(() => {
        setUserActivity(UserActivity.IDLE)
      }, 5000) // 5 seconds of inactivity
    }

    const handleUserActivity = () => {
      resetActivityTimer()
    }

    const handleTyping = () => {
      setUserActivity(UserActivity.TYPING)
      clearTimeout(activityTimer)
      
      activityTimer = setTimeout(() => {
        setUserActivity(UserActivity.ACTIVE)
      }, 1000) // 1 second after typing stops
    }

    // Listen for various user activities
    document.addEventListener('mousemove', handleUserActivity)
    document.addEventListener('mousedown', handleUserActivity)
    document.addEventListener('scroll', handleUserActivity)
    document.addEventListener('keydown', handleTyping)
    document.addEventListener('touchstart', handleUserActivity)

    // Initialize timer
    resetActivityTimer()

    return () => {
      clearTimeout(activityTimer)
      document.removeEventListener('mousemove', handleUserActivity)
      document.removeEventListener('mousedown', handleUserActivity)
      document.removeEventListener('scroll', handleUserActivity)
      document.removeEventListener('keydown', handleTyping)
      document.removeEventListener('touchstart', handleUserActivity)
    }
  }, [pauseOnTyping])

  // Calculate adaptive interval based on network and user activity
  const getAdaptiveInterval = useCallback(() => {
    let adaptedInterval = interval

    // Adjust for network conditions
    if (adaptToNetwork) {
      switch (networkCondition) {
        case NetworkCondition.SLOW:
          adaptedInterval = Math.min(adaptedInterval * 2, maxInterval)
          break
        case NetworkCondition.OFFLINE:
          return false // Don't refresh when offline
        case NetworkCondition.FAST:
        default:
          // Use base interval
          break
      }
    }

    // Adjust for user activity
    if (pauseOnTyping && userActivity === UserActivity.TYPING) {
      return false // Pause during typing
    }

    if (pauseOnInactive && userActivity === UserActivity.AWAY) {
      adaptedInterval = Math.min(adaptedInterval * 3, maxInterval) // Slower refresh when away
    }

    if (pauseOnInactive && !isTabVisible) {
      return false // Pause when tab is not visible
    }

    // Ensure interval is within bounds
    return Math.max(Math.min(adaptedInterval, maxInterval), minInterval)
  }, [
    interval,
    networkCondition,
    userActivity,
    isTabVisible,
    adaptToNetwork,
    pauseOnTyping,
    pauseOnInactive,
    maxInterval,
    minInterval
  ])

  // Start auto-refresh
  const start = useCallback((callback: () => void, customInterval?: number) => {
    callbackRef.current = callback
    setIsActive(true)
    setIsPaused(false)

    const refreshInterval = customInterval || getAdaptiveInterval()
    
    if (refreshInterval === false) {
      setIsPaused(true)
      return
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      const currentInterval = getAdaptiveInterval()
      
      if (currentInterval === false) {
        setIsPaused(true)
        return
      }

      // Restart with new interval if it changed significantly
      if (Math.abs(currentInterval - (customInterval || interval)) > 5000) {
        start(callback, currentInterval)
        return
      }

      callback()
    }, refreshInterval)
  }, [getAdaptiveInterval, interval])

  // Stop auto-refresh
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsActive(false)
    setIsPaused(false)
    callbackRef.current = null
  }, [])

  // Pause auto-refresh
  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsPaused(true)
  }, [])

  // Resume auto-refresh
  const resume = useCallback(() => {
    if (callbackRef.current && isActive) {
      start(callbackRef.current)
    }
  }, [isActive, start])

  // Auto-restart when conditions change
  useEffect(() => {
    if (isActive && !isPaused && callbackRef.current) {
      const newInterval = getAdaptiveInterval()
      if (newInterval !== false) {
        start(callbackRef.current, newInterval)
      } else {
        pause()
      }
    }
  }, [networkCondition, userActivity, isTabVisible, isActive, isPaused, getAdaptiveInterval, start, pause])

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
    isActive,
    isPaused,
    networkCondition,
    userActivity,
    isTabVisible,
    currentInterval: getAdaptiveInterval(),
  }
}