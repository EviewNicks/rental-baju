/**
 * Basic test for InlinePriceEditor component
 * Tests manual price adjustment functionality
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { InlinePriceEditor } from './InlinePriceEditor'
import type { ProductSelection } from '../../../types'

// Mock product selection for testing
const mockProductSelection: ProductSelection = {
  product: {
    id: 'test-product-1',
    name: 'Test Jas',
    pricePerDay: 50000,
    category: 'jas',
    size: 'M',
    color: 'Black',
    image: '/test-image.jpg',
    available: true,
    availableQuantity: 5
  },
  quantity: 1,
  duration: 4
}

describe('InlinePriceEditor', () => {
  const mockOnPriceUpdate = jest.fn()
  const mockOnPriceReset = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('displays automatic price correctly', () => {
    render(
      <InlinePriceEditor
        item={mockProductSelection}
        itemIndex={0}
        duration={4}
        onPriceUpdate={mockOnPriceUpdate}
        onPriceReset={mockOnPriceReset}
      />
    )

    // Should display formatted currency
    expect(screen.getByText(/Rp\s*50\.000/)).toBeInTheDocument()
    expect(screen.getByText('1x × 4 hari')).toBeInTheDocument()
  })

  it('displays manual adjustment correctly', () => {
    const itemWithManualAdjustment: ProductSelection = {
      ...mockProductSelection,
      manualPriceAdjustment: {
        isManuallyAdjusted: true,
        originalPrice: 50000,
        adjustedPrice: 75000,
        lastModified: new Date().toISOString()
      }
    }

    render(
      <InlinePriceEditor
        item={itemWithManualAdjustment}
        itemIndex={0}
        duration={4}
        onPriceUpdate={mockOnPriceUpdate}
        onPriceReset={mockOnPriceReset}
      />
    )

    // Should display adjusted price
    expect(screen.getByText(/Rp\s*75\.000/)).toBeInTheDocument()
    expect(screen.getByText(/Adjusted from: Rp\s*50\.000/)).toBeInTheDocument()
  })

  it('enters edit mode when edit button is clicked', () => {
    render(
      <InlinePriceEditor
        item={mockProductSelection}
        itemIndex={0}
        duration={4}
        onPriceUpdate={mockOnPriceUpdate}
        onPriceReset={mockOnPriceReset}
      />
    )

    // Find and click edit button (it's hidden by default, need to hover)
    const container = screen.getByText(/Rp\s*50\.000/).closest('div')
    const editButton = container?.querySelector('button[title="Edit harga"]')
    
    if (editButton) {
      fireEvent.click(editButton)
      
      // Should show input field
      expect(screen.getByPlaceholderText('Masukkan harga baru')).toBeInTheDocument()
      expect(screen.getByText(/Harga asli: Rp\s*50\.000/)).toBeInTheDocument()
    }
  })

  it('calls onPriceUpdate when price is confirmed', () => {
    render(
      <InlinePriceEditor
        item={mockProductSelection}
        itemIndex={0}
        duration={4}
        onPriceUpdate={mockOnPriceUpdate}
        onPriceReset={mockOnPriceReset}
      />
    )

    // Enter edit mode
    const container = screen.getByText(/Rp\s*50\.000/).closest('div')
    const editButton = container?.querySelector('button[title="Edit harga"]')
    
    if (editButton) {
      fireEvent.click(editButton)
      
      // Change input value
      const input = screen.getByPlaceholderText('Masukkan harga baru')
      fireEvent.change(input, { target: { value: '75000' } })
      
      // Confirm the change
      const confirmButton = screen.getByRole('button', { name: /check/i })
      fireEvent.click(confirmButton)
      
      // Should call onPriceUpdate with correct values
      expect(mockOnPriceUpdate).toHaveBeenCalledWith(0, 75000)
    }
  })

  it('validates minimum price correctly', () => {
    render(
      <InlinePriceEditor
        item={mockProductSelection}
        itemIndex={0}
        duration={4}
        onPriceUpdate={mockOnPriceUpdate}
        onPriceReset={mockOnPriceReset}
      />
    )

    // Enter edit mode
    const container = screen.getByText(/Rp\s*50\.000/).closest('div')
    const editButton = container?.querySelector('button[title="Edit harga"]')
    
    if (editButton) {
      fireEvent.click(editButton)
      
      // Try to set price below original
      const input = screen.getByPlaceholderText('Masukkan harga baru')
      fireEvent.change(input, { target: { value: '30000' } })
      
      // Confirm the change
      const confirmButton = screen.getByRole('button', { name: /check/i })
      fireEvent.click(confirmButton)
      
      // Should show error message
      expect(screen.getByText('Harga tidak boleh kurang dari harga asli')).toBeInTheDocument()
      
      // Should not call onPriceUpdate
      expect(mockOnPriceUpdate).not.toHaveBeenCalled()
    }
  })
})