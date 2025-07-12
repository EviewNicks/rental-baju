import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Footer } from './Footers'

describe('Footer Component', () => {
  test('renders brand info', () => {
    render(<Footer />)

    // Check if the brand name is rendered
    expect(screen.getByText('Maguru')).toBeInTheDocument()

    // Check if the description is rendered
    expect(
      screen.getByText(
        'Platform pembelajaran online terdepan di Indonesia. Wujudkan impian karir Anda bersama mentor expert.',
      ),
    ).toBeInTheDocument()
  })

  test('renders contact information', () => {
    render(<Footer />)

    expect(screen.getByText('hello@maguru.id')).toBeInTheDocument()
    expect(screen.getByText('+62 21 1234 5678')).toBeInTheDocument()
    expect(screen.getByText('Jakarta, Indonesia')).toBeInTheDocument()
  })

  test('renders course links section', () => {
    render(<Footer />)

    expect(screen.getByText('Courses')).toBeInTheDocument()
    expect(screen.getByText('Web Development')).toBeInTheDocument()
    expect(screen.getByText('Mobile Development')).toBeInTheDocument()
    expect(screen.getByText('UI/UX Design')).toBeInTheDocument()
    expect(screen.getByText('Digital Marketing')).toBeInTheDocument()
    expect(screen.getByText('Data Science')).toBeInTheDocument()
  })

  test('renders company links section', () => {
    render(<Footer />)

    expect(screen.getByText('Company')).toBeInTheDocument()
    expect(screen.getByText('About Us')).toBeInTheDocument()
    expect(screen.getByText('Our Team')).toBeInTheDocument()
    expect(screen.getByText('Careers')).toBeInTheDocument()
    expect(screen.getByText('Press')).toBeInTheDocument()
    expect(screen.getByText('Blog')).toBeInTheDocument()
  })

  test('renders support links section', () => {
    render(<Footer />)

    expect(screen.getByText('Support')).toBeInTheDocument()
    expect(screen.getByText('Help Center')).toBeInTheDocument()
    expect(screen.getByText('Community')).toBeInTheDocument()
    expect(screen.getByText('Contact Us')).toBeInTheDocument()
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
    expect(screen.getByText('Terms of Service')).toBeInTheDocument()
  })

  test('renders copyright and social links', () => {
    render(<Footer />)

    expect(screen.getByText('© 2024 Maguru. All rights reserved.')).toBeInTheDocument()
    expect(screen.getByText('Facebook')).toBeInTheDocument()
    expect(screen.getByText('Twitter')).toBeInTheDocument()
    expect(screen.getByText('Instagram')).toBeInTheDocument()
    expect(screen.getByText('LinkedIn')).toBeInTheDocument()
  })
})
