import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Feature } from './Feature'

describe('Features Component', () => {
  test('renders section title and description', () => {
    render(<Feature />)

    expect(screen.getByText('Kenapa Pilih')).toBeInTheDocument()
    expect(screen.getByText('Maguru?')).toBeInTheDocument()
    expect(
      screen.getByText(/Platform pembelajaran online terlengkap dengan fitur-fitur canggih/i),
    ).toBeInTheDocument()
  })

  test('renders all feature cards with correct titles', () => {
    render(<Feature />)

    // Check feature titles
    const featureTitles = [
      'Learning Path Terarah',
      'Sertifikat Resmi',
      'Mentor Support 24/7',
      'Project-Based Learning',
      'Community Learning',
      'Lifetime Access',
    ]

    featureTitles.forEach((title) => {
      expect(screen.getByText(title)).toBeInTheDocument()
    })
  })

  test('renders feature descriptions correctly', () => {
    render(<Feature />)

    // Check some feature descriptions
    expect(
      screen.getByText(
        'Kurikulum terstruktur yang dirancang khusus untuk mengoptimalkan proses pembelajaran Anda.',
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Dapatkan sertifikat yang diakui industri setelah menyelesaikan course dengan nilai memuaskan.',
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Akses langsung ke mentor expert untuk konsultasi dan bantuan kapan saja Anda butuhkan.',
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Belajar sambil praktik dengan project nyata yang bisa langsung ditambahkan ke portfolio.',
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Bergabung dengan komunitas learner aktif untuk sharing knowledge dan networking.',
      ),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Akses selamanya ke semua materi course yang sudah Anda beli, termasuk update terbaru.',
      ),
    ).toBeInTheDocument()
  })
})
