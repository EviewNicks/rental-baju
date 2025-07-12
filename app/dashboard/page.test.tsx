import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import DashboardPage from './page'

// Mock Clerk hooks
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
}))

// No need to mock Navbar since dashboard page doesn't use it

describe('Dashboard Page', () => {
  // Gunakan mock hooks yang sudah di-setup di jest.setup.js
  const mockUseUser = jest.requireMock('@clerk/nextjs').useUser
  const mockUseUserRole = jest.requireMock('@/features/auth').useUserRole
  const mockUseRoleGuard = jest.requireMock('@/features/auth').useRoleGuard
  const mockUseRoleLoadingState = jest.requireMock('@/features/auth').useRoleLoadingState

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock: user sudah login
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: {
        id: 'user_123',
        firstName: 'John',
        primaryEmailAddress: {
          emailAddress: 'john@example.com',
        },
        createdAt: new Date('2023-01-01'),
      },
    })

    // Default auth mocks
    mockUseUserRole.mockReturnValue({
      role: 'user',
      isLoading: false,
      error: null,
      isAdmin: false,
      isCreator: false,
      isUser: true,
    })

    mockUseRoleGuard.mockReturnValue({
      canAccessAdmin: () => false,
      canAccessCreator: () => false,
      canAccessUser: () => true,
    })

    mockUseRoleLoadingState.mockReturnValue({
      shouldShowLoader: false,
      isLoading: false,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('menampilkan halaman dashboard dengan informasi user', () => {
    // Override default mock untuk test ini
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: {
        id: 'user_123',
        firstName: 'John',
        primaryEmailAddress: {
          emailAddress: 'john@example.com',
        },
        createdAt: new Date('2023-01-01'),
      },
    })

    render(<DashboardPage />)

    // Cek elemen utama dashboard
    expect(screen.getByRole('heading', { name: 'Dashboard Learner' })).toBeInTheDocument()
    expect(screen.getByText('Kursus Diikuti')).toBeInTheDocument()
    expect(screen.getByText('Kursus Selesai')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument() // coursesEnrolled
    expect(screen.getByText('2')).toBeInTheDocument() // coursesCompleted

    // Check welcome messages menggunakan data yang sesuai mock
    expect(screen.getByText(/Selamat datang kembali, John!/)).toBeInTheDocument()
  })

  test('menampilkan loading state ketika user belum loaded', () => {
    // Mock loading state
    mockUseUser.mockReturnValue({
      isLoaded: false,
      user: null,
    })

    render(<DashboardPage />)

    // Loading state should show animated elements
    const loadingElements = document.querySelectorAll('.animate-pulse')
    expect(loadingElements.length).toBeGreaterThan(0)

    // Dashboard content should not be visible during loading
    expect(screen.queryByText('Selamat datang kembali')).not.toBeInTheDocument()
  })

  test('menampilkan fallback name ketika firstName tidak ada', () => {
    // Mock user tanpa firstName
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: {
        id: 'user_123',
        firstName: null,
        primaryEmailAddress: {
          emailAddress: 'john@example.com',
        },
        createdAt: new Date('2023-01-01'),
      },
    })

    render(<DashboardPage />)

    // Should show fallback name (firstName is null, fallback to 'User')
    expect(screen.getByText(/Selamat datang kembali, User!/)).toBeInTheDocument()
  })
})
