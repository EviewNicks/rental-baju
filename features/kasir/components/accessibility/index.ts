/**
 * Accessibility Components for Kasir Feature
 * 
 * Provides essential accessibility utilities
 * for keyboard navigation and focus management
 */

export { SkipLinks } from './SkipLinks'
export { FocusManager, useFocusManager } from './FocusManager'

// Re-export accessibility hook
export { useAccessibility, srOnlyClass } from '../../hooks/useAccessibility'