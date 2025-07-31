import { formatDate } from './utils'

describe('formatDate', () => {
  it('should format valid date string correctly', () => {
    const result = formatDate('2024-01-15T10:30:00Z')
    expect(result).toMatch(/\d{2} \w+ \d{4}/) // Should match format like "15 Jan 2024"
  })

  it('should handle null/undefined dateString gracefully', () => {
    expect(formatDate('')).toBe('Tanggal tidak tersedia')
    expect(formatDate(null as string)).toBe('Tanggal tidak tersedia')
    expect(formatDate(undefined as string)).toBe('Tanggal tidak tersedia')
  })

  it('should handle invalid date string gracefully', () => {
    expect(formatDate('invalid-date')).toBe('Tanggal tidak valid')
    expect(formatDate('not-a-date-at-all')).toBe('Tanggal tidak valid')
    expect(formatDate('2024-13-45')).toBe('Tanggal tidak valid') // Invalid month/day
  })

  it('should handle edge case dates', () => {
    expect(formatDate('2024-02-29T00:00:00Z')).toMatch(/\d{2} \w+ \d{4}/) // Leap year
    expect(formatDate('1970-01-01T00:00:00Z')).toMatch(/\d{2} \w+ \d{4}/) // Unix epoch
  })
})