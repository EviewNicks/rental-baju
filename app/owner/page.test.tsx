/**
 * Admin Dashboard Page Tests
 *
 * Test untuk memastikan admin dashboard berfungsi dengan benar
 * dengan proper role checking dan admin-specific features.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdminDashboardPage from './page'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>
  }
})

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Shield: () => <div data-testid="shield-icon">Shield</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  Database: () => <div data-testid="database-icon">Database</div>,
  BarChart3: () => <div data-testid="barchart3-icon">BarChart3</div>,
  AlertTriangle: () => <div data-testid="alert-triangle-icon">AlertTriangle</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
}))

describe('AdminDashboardPage', () => {
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
      isAdmin: false,
    })
    mockUseRoleGuard.mockReturnValue({
      canAccessAdmin: () => false,
    })
    mockUseRoleLoadingState.mockReturnValue({
      shouldShowLoader: true,
    })

    render(<AdminDashboardPage />)

    // Should show loading animation
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('should render access denied for non-admin users', () => {
    mockUseUser.mockReturnValue({
      user: { firstName: 'John' },
      isLoaded: true,
    })
    mockUseUserRole.mockReturnValue({
      role: 'user',
      isAdmin: false,
    })
    mockUseRoleGuard.mockReturnValue({
      canAccessAdmin: () => false,
    })
    mockUseRoleLoadingState.mockReturnValue({
      shouldShowLoader: false,
    })

    render(<AdminDashboardPage />)

    expect(screen.getByText('Akses Ditolak')).toBeInTheDocument()
    expect(screen.getByText('Anda tidak memiliki izin administrator.')).toBeInTheDocument()
  })

  it('should render admin dashboard for admin users', () => {
    mockUseUser.mockReturnValue({
      user: { firstName: 'Admin' },
      isLoaded: true,
    })
    mockUseUserRole.mockReturnValue({
      role: 'admin',
      isAdmin: true,
    })
    mockUseRoleGuard.mockReturnValue({
      canAccessAdmin: () => true,
    })
    mockUseRoleLoadingState.mockReturnValue({
      shouldShowLoader: false,
    })

    render(<AdminDashboardPage />)

    expect(screen.getByText('Admin Control Panel')).toBeInTheDocument()
    expect(screen.getByText(/Selamat datang, Admin!/)).toBeInTheDocument()
  })

  it('should display admin stats correctly', () => {
    mockUseUser.mockReturnValue({
      user: { firstName: 'Admin' },
      isLoaded: true,
    })
    mockUseUserRole.mockReturnValue({
      role: 'admin',
      isAdmin: true,
    })
    mockUseRoleGuard.mockReturnValue({
      canAccessAdmin: () => true,
    })
    mockUseRoleLoadingState.mockReturnValue({
      shouldShowLoader: false,
    })

    render(<AdminDashboardPage />)

    // Check for stats display with correct locale formatting
    expect(screen.getByText('Total Users')).toBeInTheDocument()
    // toLocaleString() in test environment uses '.' not ',' as thousand separator
    expect(screen.getByText('2.486')).toBeInTheDocument()
    expect(screen.getByText('Total Courses')).toBeInTheDocument()
    expect(screen.getByText('142')).toBeInTheDocument()
    expect(screen.getByText('Active Creators')).toBeInTheDocument()
    expect(screen.getByText('28')).toBeInTheDocument()
    expect(screen.getByText('System Health')).toBeInTheDocument()
    expect(screen.getByText('98%')).toBeInTheDocument()
  })

  it('should display system alerts', () => {
    mockUseUser.mockReturnValue({
      user: { firstName: 'Admin' },
      isLoaded: true,
    })
    mockUseUserRole.mockReturnValue({
      role: 'admin',
      isAdmin: true,
    })
    mockUseRoleGuard.mockReturnValue({
      canAccessAdmin: () => true,
    })
    mockUseRoleLoadingState.mockReturnValue({
      shouldShowLoader: false,
    })

    render(<AdminDashboardPage />)

    expect(screen.getByText('System Alerts')).toBeInTheDocument()
    expect(screen.getByText('High Storage Usage')).toBeInTheDocument()
    expect(screen.getByText('Pending Reviews')).toBeInTheDocument()
  })

  it('should display recent activities', () => {
    mockUseUser.mockReturnValue({
      user: { firstName: 'Admin' },
      isLoaded: true,
    })
    mockUseUserRole.mockReturnValue({
      role: 'admin',
      isAdmin: true,
    })
    mockUseRoleGuard.mockReturnValue({
      canAccessAdmin: () => true,
    })
    mockUseRoleLoadingState.mockReturnValue({
      shouldShowLoader: false,
    })

    render(<AdminDashboardPage />)

    expect(screen.getByText('Recent Activities')).toBeInTheDocument()
    expect(screen.getByText('15 pengguna baru mendaftar')).toBeInTheDocument()
  })

  it('should display admin management actions', () => {
    mockUseUser.mockReturnValue({
      user: { firstName: 'Admin' },
      isLoaded: true,
    })
    mockUseUserRole.mockReturnValue({
      role: 'admin',
      isAdmin: true,
    })
    mockUseRoleGuard.mockReturnValue({
      canAccessAdmin: () => true,
    })
    mockUseRoleLoadingState.mockReturnValue({
      shouldShowLoader: false,
    })

    render(<AdminDashboardPage />)

    expect(screen.getByText('User Management')).toBeInTheDocument()
    expect(screen.getByText('Content Management')).toBeInTheDocument()
    expect(screen.getByText('System Settings')).toBeInTheDocument()
    expect(screen.getByText('Manage Users')).toBeInTheDocument()
  })
})
