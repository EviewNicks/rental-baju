import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CTA } from './Cts'

describe('CTA Component', () => {
  test('renders headline and sub-headline', () => {
    render(<CTA />)

    expect(screen.getByText(/Siap Mulai/i)).toBeInTheDocument()
    expect(screen.getByText(/Perjalanan/i)).toBeInTheDocument()
    expect(screen.getByText(/Belajar\?/i)).toBeInTheDocument()

    expect(
      screen.getByText(/Bergabunglah dengan 50,000\+ students yang telah mempercayai Maguru/i),
    ).toBeInTheDocument()
  })

  test('renders call-to-action buttons', () => {
    render(<CTA />)

    expect(screen.getByText('Daftar Gratis Sekarang')).toBeInTheDocument()
    expect(screen.getByText('Konsultasi Gratis')).toBeInTheDocument()
  })

  test('renders trust indicators', () => {
    render(<CTA />)

    expect(screen.getByText('Gratis Trial 7 Hari')).toBeInTheDocument()
    expect(screen.getByText('Garansi 30 Hari')).toBeInTheDocument()
    expect(screen.getByText('Sertifikat Resmi')).toBeInTheDocument()
  })

  test('renders with glass panel styling', () => {
    render(<CTA />)

    // Check if container has glass-panel class
    const glassPanel = document.querySelector('.glass-panel')
    expect(glassPanel).toBeInTheDocument()
  })
})
