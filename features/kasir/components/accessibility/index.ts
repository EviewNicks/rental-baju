/**
 * Accessibility Components for Kasir Feature
 * 
 * Provides WCAG 2.1 AA compliant components and utilities
 * for improved screen reader support and keyboard navigation
 */

export { SkipLinks } from './SkipLinks'
export { ScreenReaderAnnouncer, useScreenReaderAnnouncer } from './ScreenReaderAnnouncer'
export { FocusManager, useFocusManager } from './FocusManager'
export {
  AccessibleTable,
  AccessibleTableHeader,
  AccessibleTableBody,
  AccessibleTableRow,
  AccessibleTableHead,
  AccessibleTableCell,
} from './AccessibleTable'

// Re-export accessibility hook
export { useAccessibility, srOnlyClass } from '../../hooks/useAccessibility'