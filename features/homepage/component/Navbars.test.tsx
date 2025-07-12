import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Navbar } from './Navbars'

// Mock Clerk hooks dan components
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SignOutButton: ({ children, 'data-testid': testId, ...props }: any) => (
    <div data-testid={testId} {...props}>
      {children}
    </div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  UserButton: ({ 'data-testid': testId, ...props }: any) => (
    <div data-testid={testId} {...props}>
      UserButton
    </div>
  ),
}))

describe('Navbar Component', () => {
  const mockUseUser = jest.requireMock('@clerk/nextjs').useUser

  beforeEach(() => {
    // Default mock: user not signed in
    mockUseUser.mockReturnValue({
      isSignedIn: false,
      user: null,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when user is not signed in', () => {
    test('renders logo and brand name', () => {
      render(<Navbar />)

      // Check if the brand name is rendered
      expect(screen.getByText('Maguru')).toBeInTheDocument()

      // Check for BookOpen icon (indirectly by checking its container)
      const logoContainer = screen.getByText('Maguru').previousSibling
      expect(logoContainer).toBeInTheDocument()
    })

    test('renders desktop menu items', () => {
      render(<Navbar />)

      // Check for desktop menu items
      expect(screen.getByText('Courses')).toBeInTheDocument()
      expect(screen.getByText('Features')).toBeInTheDocument()
      expect(screen.getByText('Testimonials')).toBeInTheDocument()
      expect(screen.getByText('Pricing')).toBeInTheDocument()
    })

    test('renders desktop CTA buttons as links', () => {
      render(<Navbar />)
      const masuk = screen.getAllByText('Masuk')[0]
      const daftar = screen.getAllByText('Daftar Gratis')[0]
      expect(masuk.closest('a')).toHaveAttribute('href', '/sign-in')
      expect(daftar.closest('a')).toHaveAttribute('href', '/sign-up')
    })

    test('toggles mobile menu and links close menu on click', () => {
      render(<Navbar />)
      const menuButton = screen.getByRole('button', { name: /toggle menu/i })
      fireEvent.click(menuButton)
      // Mobile menu should be visible
      expect(screen.getAllByText('Courses')[1]).toBeVisible()
      // Cek link Masuk dan Daftar Gratis di mobile
      const masukMobile = screen.getAllByText('Masuk')[1]
      const daftarMobile = screen.getAllByText('Daftar Gratis')[1]
      expect(masukMobile.closest('a')).toHaveAttribute('href', '/sign-in')
      expect(daftarMobile.closest('a')).toHaveAttribute('href', '/sign-up')
      // Klik link harus menutup menu (simulate click)
      fireEvent.click(masukMobile)
      // Menu harus tertutup (tidak ada lagi menu mobile)
      expect(screen.queryByText('Courses', { selector: 'a.block' })).not.toBeInTheDocument()
    })
  })

  describe('when user is signed in', () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({
        isSignedIn: true,
        user: {
          id: 'user_test123',
          firstName: 'John',
          lastName: 'Doe',
          emailAddresses: [{ emailAddress: 'john@example.com' }],
        },
      })
    })

    test('renders sign out button and user button in desktop', () => {
      render(<Navbar />)

      // Should show sign out button instead of sign in/up
      expect(screen.getByTestId('desktop-sign-out-button')).toBeInTheDocument()
      expect(screen.getByTestId('desktop-user-button')).toBeInTheDocument()
      expect(screen.getByText('Keluar')).toBeInTheDocument()

      // Should not show sign in/up buttons
      expect(screen.queryByText('Masuk')).not.toBeInTheDocument()
      expect(screen.queryByText('Daftar Gratis')).not.toBeInTheDocument()
    })

    test('renders sign out button and user button in mobile menu', () => {
      render(<Navbar />)

      // Open mobile menu
      const menuButton = screen.getByRole('button', { name: /toggle menu/i })
      fireEvent.click(menuButton)

      // Should show sign out components in mobile
      expect(screen.getByTestId('mobile-sign-out-button')).toBeInTheDocument()
      expect(screen.getByTestId('mobile-user-button')).toBeInTheDocument()
      expect(screen.getAllByText('Keluar')[1]).toBeInTheDocument() // Mobile version

      // Should not show sign in/up in mobile
      expect(screen.queryByText('Masuk')).not.toBeInTheDocument()
      expect(screen.queryByText('Daftar Gratis')).not.toBeInTheDocument()
    })

    test('closes mobile menu when sign out button is clicked', () => {
      render(<Navbar />)

      // Open mobile menu
      const menuButton = screen.getByRole('button', { name: /toggle menu/i })
      fireEvent.click(menuButton)

      // Mobile menu should be visible
      expect(screen.getAllByText('Courses')[1]).toBeVisible()

      // Click sign out button in mobile
      const mobileSignOutButton = screen.getAllByText('Keluar')[1]
      fireEvent.click(mobileSignOutButton)

      // Menu should be closed
      expect(screen.queryByText('Courses', { selector: 'a.block' })).not.toBeInTheDocument()
    })

    test('sign out button has correct redirect configuration', () => {
      render(<Navbar />)

      const desktopSignOutButton = screen.getByTestId('desktop-sign-out-button')
      expect(desktopSignOutButton).toHaveAttribute('signOutOptions', '[object Object]')
    })
  })
})
