import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import CustomCard from './CustomCard'

describe('CustomCard Component', () => {
  test('renders with title and children', () => {
    render(
      <CustomCard title="Test Title">
        <p>Test content</p>
      </CustomCard>,
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  test('does not render action button when no onAction provided', () => {
    render(
      <CustomCard title="Test Title">
        <p>Test content</p>
      </CustomCard>,
    )

    expect(screen.queryByText('Action')).not.toBeInTheDocument()
  })

  test('renders action button with default label when onAction provided', () => {
    const mockAction = jest.fn()

    render(
      <CustomCard title="Test Title" onAction={mockAction}>
        <p>Test content</p>
      </CustomCard>,
    )

    expect(screen.getByText('Action')).toBeInTheDocument()
  })

  test('renders action button with custom label when provided', () => {
    const mockAction = jest.fn()

    render(
      <CustomCard title="Test Title" onAction={mockAction} actionLabel="Custom Action">
        <p>Test content</p>
      </CustomCard>,
    )

    expect(screen.getByText('Custom Action')).toBeInTheDocument()
  })

  test('calls onAction when action button is clicked', () => {
    const mockAction = jest.fn()

    render(
      <CustomCard title="Test Title" onAction={mockAction} actionLabel="Click Me">
        <p>Test content</p>
      </CustomCard>,
    )

    const button = screen.getByText('Click Me')
    fireEvent.click(button)

    expect(mockAction).toHaveBeenCalledTimes(1)
  })
})
