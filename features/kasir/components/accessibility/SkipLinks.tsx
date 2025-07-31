import { useCallback } from 'react'
import { useAccessibility } from '../../hooks/useAccessibility'

interface SkipLinksProps {
  links?: Array<{
    href: string
    label: string
  }>
}

const defaultLinks = [
  { href: '#main-content', label: 'Langsung ke konten utama' },
  { href: '#transaction-table', label: 'Langsung ke tabel transaksi' },
  { href: '#transaction-filters', label: 'Langsung ke filter' },
  { href: '#customer-info', label: 'Langsung ke informasi pelanggan' },
]

/**
 * Skip navigation links for keyboard users
 * Appears when focused, allows jumping to main content areas
 */
export function SkipLinks({ links = defaultLinks }: SkipLinksProps) {
  const { announce, focusElement } = useAccessibility()

  const handleSkipClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, label: string) => {
    e.preventDefault()
    const target = e.currentTarget.getAttribute('href')
    
    if (target) {
      const element = document.querySelector(target) as HTMLElement
      if (element) {
        focusElement(element)
        announce(`Menavigasi ke ${label}`, 'polite')
      }
    }
  }, [announce, focusElement])

  return (
    <nav 
      aria-label="Skip navigation links"
      className="skip-links"
    >
      <ul className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-4 focus-within:left-4 focus-within:z-50 focus-within:bg-white focus-within:border focus-within:border-gray-300 focus-within:rounded-md focus-within:shadow-lg focus-within:p-2 focus-within:space-y-1">
        {links.map((link, index) => (
          <li key={index}>
            <a
              href={link.href}
              onClick={(e) => handleSkipClick(e, link.label)}
              className="block px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}