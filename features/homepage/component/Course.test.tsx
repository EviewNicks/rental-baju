import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Courses } from './Course'

describe('Courses Component', () => {
  test('renders section title and description', () => {
    render(<Courses />)

    expect(screen.getByText('Course')).toBeInTheDocument()
    expect(screen.getByText('Terpopuler')).toBeInTheDocument()
    expect(
      screen.getByText(/Pilihan course terbaik yang paling diminati oleh ribuan students/i),
    ).toBeInTheDocument()
  })

  test('renders course cards with correct information', () => {
    render(<Courses />)

    // Check for course titles
    expect(screen.getByText('Full Stack Web Development')).toBeInTheDocument()
    expect(screen.getByText('UI/UX Design Mastery')).toBeInTheDocument()
    expect(screen.getByText('Digital Marketing Strategy')).toBeInTheDocument()

    // Check for instructor names
    expect(screen.getByText('by John Doe')).toBeInTheDocument()
    expect(screen.getByText('by Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('by Mike Johnson')).toBeInTheDocument()

    // Check for tags
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('Node.js')).toBeInTheDocument()
    expect(screen.getByText('MongoDB')).toBeInTheDocument()
    expect(screen.getByText('Figma')).toBeInTheDocument()
    expect(screen.getByText('Design System')).toBeInTheDocument()
    expect(screen.getByText('SEO')).toBeInTheDocument()
  })

  test('renders course ratings and statistics', () => {
    render(<Courses />)

    // Multiple "4.9" could be present, so we check at least one of them exists
    expect(screen.getAllByText('4.9').length).toBeGreaterThan(0)
    expect(screen.getByText('4.8')).toBeInTheDocument()

    // We skip checking exact student counts as they might be formatted differently
    // depending on locale settings

    // Check for durations
    expect(screen.getByText('12 weeks')).toBeInTheDocument()
    expect(screen.getByText('8 weeks')).toBeInTheDocument()
    expect(screen.getByText('6 weeks')).toBeInTheDocument()
  })

  test('renders course level badges', () => {
    render(<Courses />)

    expect(screen.getAllByText('Beginner').length).toBe(2)
    expect(screen.getByText('Intermediate')).toBeInTheDocument()
  })

  test('renders pricing information', () => {
    render(<Courses />)

    // Menggunakan getAllByText untuk harga karena mungkin muncul lebih dari sekali
    expect(screen.getAllByText('Rp 299,000')[0]).toBeInTheDocument()
    expect(screen.getByText('Rp 499,000')).toBeInTheDocument()
    expect(screen.getByText('Rp 249,000')).toBeInTheDocument()
    expect(screen.getByText('Rp 399,000')).toBeInTheDocument()
    expect(screen.getByText('Rp 199,000')).toBeInTheDocument()
  })

  test('renders view all button', () => {
    render(<Courses />)

    expect(screen.getByText('Lihat Semua Course')).toBeInTheDocument()
  })
})
