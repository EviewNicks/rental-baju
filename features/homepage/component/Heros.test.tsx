import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Hero } from './Heros'

describe('Hero Component', () => {
  test('renders headline and main call-to-action', () => {
    render(<Hero />)

    // Check for headline content
    expect(screen.getByText(/Belajar Skill/i)).toBeInTheDocument()
    expect(screen.getByText(/Digital/i)).toBeInTheDocument()
    expect(screen.getByText(/Bersama Expert/i)).toBeInTheDocument()

    // Check for description
    expect(
      screen.getByText(/Tingkatkan karir Anda dengan ribuan course berkualitas tinggi/i),
    ).toBeInTheDocument()

    // Check for call-to-action buttons
    expect(screen.getByText('Mulai Belajar Gratis')).toBeInTheDocument()
    expect(screen.getByText('Lihat Demo')).toBeInTheDocument()
  })

  test('renders social proof elements', () => {
    render(<Hero />)

    // Check for social proof statistics
    expect(screen.getByText('50K+')).toBeInTheDocument()
    expect(screen.getByText('Students')).toBeInTheDocument()
    expect(screen.getByText('500+')).toBeInTheDocument()
    expect(screen.getByText('Courses')).toBeInTheDocument()
    expect(screen.getByText('4.9')).toBeInTheDocument()
    expect(screen.getByText('Rating')).toBeInTheDocument()
  })

  test('renders interactive learning section', () => {
    render(<Hero />)

    expect(screen.getByText('Interactive Learning')).toBeInTheDocument()
    expect(screen.getByText('Belajar dengan metode interaktif dan praktis')).toBeInTheDocument()
  })

  test('renders floating information cards', () => {
    render(<Hero />)

    expect(screen.getByText('Course Completed')).toBeInTheDocument()
    expect(screen.getByText('1.2K+ Students')).toBeInTheDocument()
  })
})
