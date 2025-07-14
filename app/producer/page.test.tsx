/**
 * Creator Dashboard Page Tests
 *
 * Test untuk memastikan creator dashboard berfungsi dengan benar
 * dengan proper role checking dan creator-specific features.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import CreatorDashboardPage from './page'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>
  }
})

describe('CreatorDashboardPage', () => {
  // Gunakan mock hooks yang sudah di-setup di jest.setup.js
  const mockUseUser = jest.requireMock('@clerk/nextjs').useUser
  const mockUseUserRole = jest.requireMock('@/features/auth').useUserRole
  const mockUseRoleGuard = jest.requireMock('@/features/auth').useRoleGuard
  const mockUseRoleLoadingState = jest.requireMock('@/features/auth').useRoleLoadingState

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render loading state when user is not loaded', () => {
    mockUseUser.mockReturnValue({
      user: null,
      isLoaded: false,
    })
    mockUseUserRole.mockReturnValue({
      role: null,
      isCreator: false,
    })
    mockUseRoleGuard.mockReturnValue({
      canAccessCreator: () => false,
    })
    mockUseRoleLoadingState.mockReturnValue({
      shouldShowLoader: true,
    })

    render(<CreatorDashboardPage />)

    // Should show loading animation
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('should render access denied for non-creator users', () => {
    mockUseUser.mockReturnValue({
      user: { firstName: 'John' },
      isLoaded: true,
    })
    mockUseUserRole.mockReturnValue({
      role: 'user',
      isCreator: false,
    })
    mockUseRoleGuard.mockReturnValue({
      canAccessCreator: () => false,
    })
    mockUseRoleLoadingState.mockReturnValue({
      shouldShowLoader: false,
    })

    render(<CreatorDashboardPage />)

    expect(screen.getByText('Akses Ditolak')).toBeInTheDocument()
    expect(
      screen.getByText('Anda tidak memiliki izin sebagai content creator.'),
    ).toBeInTheDocument()
  })

  it('should render creator dashboard for creator users', () => {
    mockUseUser.mockReturnValue({
      user: { firstName: 'Creator' },
      isLoaded: true,
    })
    mockUseUserRole.mockReturnValue({
      role: 'creator',
      isCreator: true,
    })
    mockUseRoleGuard.mockReturnValue({
      canAccessCreator: () => true,
    })
    mockUseRoleLoadingState.mockReturnValue({
      shouldShowLoader: false,
    })

    render(<CreatorDashboardPage />)

    expect(screen.getByText('Creator Studio')).toBeInTheDocument()
    expect(screen.getByText(/Selamat berkarya, Creator!/)).toBeInTheDocument()
  })

  it('should display creator stats correctly', () => {
    mockUseUser.mockReturnValue({
      user: { firstName: 'Creator' },
      isLoaded: true,
    })
    mockUseUserRole.mockReturnValue({
      role: 'creator',
      isCreator: true,
    })
    mockUseRoleGuard.mockReturnValue({
      canAccessCreator: () => true,
    })
    mockUseRoleLoadingState.mockReturnValue({
      shouldShowLoader: false,
    })

    render(<CreatorDashboardPage />)

    // Check for stats display
    expect(screen.getByText('Total Kursus')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('Total Siswa')).toBeInTheDocument()
    expect(screen.getByText('1.247')).toBeInTheDocument()
    expect(screen.getByText('Pendapatan Bulan Ini')).toBeInTheDocument()
    expect(screen.getByText('Rp 4.2M')).toBeInTheDocument()
  })

  it('should display quick actions section', () => {
    mockUseUser.mockReturnValue({
      user: { firstName: 'Creator' },
      isLoaded: true,
    })
    mockUseUserRole.mockReturnValue({
      role: 'creator',
      isCreator: true,
    })
    mockUseRoleGuard.mockReturnValue({
      canAccessCreator: () => true,
    })
    mockUseRoleLoadingState.mockReturnValue({
      shouldShowLoader: false,
    })

    render(<CreatorDashboardPage />)

    expect(screen.getByText('Aksi Cepat')).toBeInTheDocument()
    expect(screen.getByText('Buat Kursus Baru')).toBeInTheDocument()
    expect(screen.getByText('Upload Video')).toBeInTheDocument()
    expect(screen.getByText('Tulis Artikel')).toBeInTheDocument()
    expect(screen.getByText('Lihat Analytics')).toBeInTheDocument()
  })

  it('should display recent courses section', () => {
    mockUseUser.mockReturnValue({
      user: { firstName: 'Creator' },
      isLoaded: true,
    })
    mockUseUserRole.mockReturnValue({
      role: 'creator',
      isCreator: true,
    })
    mockUseRoleGuard.mockReturnValue({
      canAccessCreator: () => true,
    })
    mockUseRoleLoadingState.mockReturnValue({
      shouldShowLoader: false,
    })

    render(<CreatorDashboardPage />)

    expect(screen.getByText('Kursus Terbaru')).toBeInTheDocument()
    expect(screen.getByText('Advanced React Patterns')).toBeInTheDocument()
    expect(screen.getByText('TypeScript for Beginners')).toBeInTheDocument()
    expect(screen.getByText('Node.js API Development')).toBeInTheDocument()
  })

  it('should display pending tasks section', () => {
    mockUseUser.mockReturnValue({
      user: { firstName: 'Creator' },
      isLoaded: true,
    })
    mockUseUserRole.mockReturnValue({
      role: 'creator',
      isCreator: true,
    })
    mockUseRoleGuard.mockReturnValue({
      canAccessCreator: () => true,
    })
    mockUseRoleLoadingState.mockReturnValue({
      shouldShowLoader: false,
    })

    render(<CreatorDashboardPage />)

    expect(screen.getByText('Tugas Pending')).toBeInTheDocument()
    expect(screen.getByText(/Review course feedback/)).toBeInTheDocument()
    expect(screen.getByText(/Complete TypeScript course outline/)).toBeInTheDocument()
    expect(screen.getByText(/Record introduction video/)).toBeInTheDocument()
  })

  it('should display creator workspace tools', () => {
    mockUseUser.mockReturnValue({
      user: { firstName: 'Creator' },
      isLoaded: true,
    })
    mockUseUserRole.mockReturnValue({
      role: 'creator',
      isCreator: true,
    })
    mockUseRoleGuard.mockReturnValue({
      canAccessCreator: () => true,
    })
    mockUseRoleLoadingState.mockReturnValue({
      shouldShowLoader: false,
    })

    render(<CreatorDashboardPage />)

    // Check for action buttons that actually exist
    expect(screen.getByText('Buat Kursus Baru')).toBeInTheDocument()
    expect(screen.getByText('Upload Video')).toBeInTheDocument()
    expect(screen.getByText('Tulis Artikel')).toBeInTheDocument()
    expect(screen.getByText('Lihat Analytics')).toBeInTheDocument()
  })

  it('should allow admin to access creator dashboard', () => {
    mockUseUser.mockReturnValue({
      user: { firstName: 'Admin' },
      isLoaded: true,
    })
    mockUseUserRole.mockReturnValue({
      role: 'admin',
      isCreator: false, // Admin is not creator but should have access
    })
    mockUseRoleGuard.mockReturnValue({
      canAccessCreator: () => true, // Admin can access creator areas
    })
    mockUseRoleLoadingState.mockReturnValue({
      shouldShowLoader: false,
    })

    render(<CreatorDashboardPage />)

    expect(screen.getByText('Creator Studio')).toBeInTheDocument()
    expect(screen.getByText(/Selamat berkarya, Admin!/)).toBeInTheDocument()
  })
})
