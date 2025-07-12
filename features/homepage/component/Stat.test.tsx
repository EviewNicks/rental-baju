import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Stats } from './Stat'

describe('Stats Component', () => {
  test('renders all statistics values correctly', () => {
    render(<Stats />)

    // Check statistic values
    expect(screen.getByText('50,000+')).toBeInTheDocument()
    expect(screen.getByText('500+')).toBeInTheDocument()
    expect(screen.getByText('95%')).toBeInTheDocument()
    expect(screen.getByText('24/7')).toBeInTheDocument()
  })

  test('renders all statistic labels correctly', () => {
    render(<Stats />)

    // Check statistic labels
    expect(screen.getByText('Active Students')).toBeInTheDocument()
    expect(screen.getByText('Expert Courses')).toBeInTheDocument()
    expect(screen.getByText('Success Rate')).toBeInTheDocument()
    expect(screen.getByText('Learning Support')).toBeInTheDocument()
  })

  test('renders inside a glass panel', () => {
    render(<Stats />)

    // Check if the container has glass-panel class
    const glassPanel = document.querySelector('.glass-panel')
    expect(glassPanel).toBeInTheDocument()
  })
})
