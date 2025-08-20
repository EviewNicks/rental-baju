import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductDetailCard } from '../ProductDetailCard'

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />
  }
}))

// Mock Badge component
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) => (
    <span className={`badge ${variant} ${className}`}>{children}</span>
  )
}))

// Mock cn utility
jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | null | boolean)[]) => classes.filter(Boolean).join(' ')
}))

// Mock the formatCurrency function
jest.mock('../../../lib/utils/client', () => ({
  formatCurrency: (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`
}))

const mockItem = {
  product: {
    id: 'prod-1',
    name: 'Test Product',
    category: 'Test Category',
    size: 'M',
    color: 'Blue',
    image: '/test-image.jpg',
    description: 'Test product description'
  },
  quantity: 2,
  jumlahDiambil: 2,
  pricePerDay: 50000,
  duration: 3,
  subtotal: 300000
}

const mockItemWithReturnData = {
  ...mockItem,
  statusKembali: 'lengkap' as const,
  totalReturnPenalty: 25000,
  conditionBreakdown: [
    {
      id: 'cb-1',
      kondisiAkhir: 'kotor',
      jumlahKembali: 1,
      penaltyAmount: 15000,
      modalAwalUsed: null
    },
    {
      id: 'cb-2', 
      kondisiAkhir: 'rusak ringan',
      jumlahKembali: 1,
      penaltyAmount: 10000,
      modalAwalUsed: null
    }
  ]
}

describe('ProductDetailCard', () => {
  it('should render product information correctly', () => {
    render(<ProductDetailCard item={mockItem} />)
    
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('Test product description')).toBeInTheDocument()
    expect(screen.getByText('Test Category')).toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument()
    expect(screen.getByText('Blue')).toBeInTheDocument()
    expect(screen.getByText('2x')).toBeInTheDocument()
    expect(screen.getByText('Rp 50.000')).toBeInTheDocument()
    expect(screen.getByText('3 hari')).toBeInTheDocument()
    expect(screen.getByText('Rp 300.000')).toBeInTheDocument()
  })

  it('should not display return information when no return data exists', () => {
    render(<ProductDetailCard item={mockItem} />)
    
    expect(screen.queryByText('Status Pengembalian')).not.toBeInTheDocument()
    expect(screen.queryByText('Detail Kondisi Pengembalian')).not.toBeInTheDocument()
    expect(screen.queryByText('Informasi Denda Pengembalian')).not.toBeInTheDocument()
  })

  it('should display return status badge when return data exists', () => {
    render(<ProductDetailCard item={mockItemWithReturnData} />)
    
    expect(screen.getByText('Status Pengembalian')).toBeInTheDocument()
    expect(screen.getByText('Dikembalikan Lengkap')).toBeInTheDocument()
  })

  it('should show condition breakdown for multi-condition returns', () => {
    render(<ProductDetailCard item={mockItemWithReturnData} />)
    
    expect(screen.getByText('Detail Kondisi Pengembalian')).toBeInTheDocument()
    expect(screen.getByText('Multi-Kondisi')).toBeInTheDocument()
    expect(screen.getByText('Kotor')).toBeInTheDocument()
    expect(screen.getByText('1 item')).toBeInTheDocument()
    expect(screen.getByText('Rusak Ringan')).toBeInTheDocument()
    expect(screen.getAllByText('1 item')).toHaveLength(2)
  })

  it('should display penalty information correctly', () => {
    render(<ProductDetailCard item={mockItemWithReturnData} />)
    
    expect(screen.getByText('Informasi Denda Pengembalian')).toBeInTheDocument()
    expect(screen.getByText('Total Denda:')).toBeInTheDocument()
    expect(screen.getByText('Rp 25.000')).toBeInTheDocument()
    expect(screen.getByText('Denda kotor:')).toBeInTheDocument()
    expect(screen.getByText('Rp 15.000')).toBeInTheDocument()
    expect(screen.getByText('Denda rusak ringan:')).toBeInTheDocument()
    expect(screen.getByText('Rp 10.000')).toBeInTheDocument()
  })

  it('should handle single condition return correctly', () => {
    const singleConditionItem = {
      ...mockItem,
      statusKembali: 'lengkap' as const,
      totalReturnPenalty: 10000,
      conditionBreakdown: [
        {
          id: 'cb-1',
          kondisiAkhir: 'baik',
          jumlahKembali: 2,
          penaltyAmount: 0,
          modalAwalUsed: null
        }
      ]
    }
    
    render(<ProductDetailCard item={singleConditionItem} />)
    
    expect(screen.getByText('Detail Kondisi Pengembalian')).toBeInTheDocument()
    expect(screen.queryByText('Multi-Kondisi')).not.toBeInTheDocument()
    expect(screen.getByText('Baik')).toBeInTheDocument()
    expect(screen.getByText('2 items')).toBeInTheDocument()
  })

  it('should show mobile toggle button on small screens', () => {
    // Mock window.innerWidth for mobile view
    global.innerWidth = 375
    global.dispatchEvent(new Event('resize'))
    
    render(<ProductDetailCard item={mockItemWithReturnData} />)
    
    const toggleButton = screen.getByText('Sembunyikan Detail')
    expect(toggleButton).toBeInTheDocument()
    expect(toggleButton).toHaveClass('sm:hidden')
  })

  it('should toggle return details visibility on mobile', () => {
    render(<ProductDetailCard item={mockItemWithReturnData} />)
    
    const toggleButton = screen.getByRole('button', { 
      name: /hide return details|show return details/i 
    })
    
    // Initially expanded
    expect(screen.getByText('Sembunyikan Detail')).toBeInTheDocument()
    
    // Click to collapse
    fireEvent.click(toggleButton)
    expect(screen.getByText('Tampilkan Detail')).toBeInTheDocument()
    
    // Click to expand again
    fireEvent.click(toggleButton)
    expect(screen.getByText('Sembunyikan Detail')).toBeInTheDocument()
  })

  it('should handle missing return data gracefully', () => {
    const itemWithPartialReturnData = {
      ...mockItem,
      statusKembali: 'sebagian' as const,
      totalReturnPenalty: 0,
      conditionBreakdown: undefined
    }
    
    render(<ProductDetailCard item={itemWithPartialReturnData} />)
    
    expect(screen.getByText('Dikembalikan Sebagian')).toBeInTheDocument()
    expect(screen.queryByText('Detail Kondisi Pengembalian')).not.toBeInTheDocument()
    expect(screen.queryByText('Informasi Denda Pengembalian')).not.toBeInTheDocument()
  })

  it('should handle zero penalty amounts correctly', () => {
    const noPenaltyItem = {
      ...mockItem,
      statusKembali: 'lengkap' as const,
      totalReturnPenalty: 0,
      conditionBreakdown: [
        {
          id: 'cb-1',
          kondisiAkhir: 'baik',
          jumlahKembali: 2,
          penaltyAmount: 0,
          modalAwalUsed: null
        }
      ]
    }
    
    render(<ProductDetailCard item={noPenaltyItem} />)
    
    expect(screen.getByText('Detail Kondisi Pengembalian')).toBeInTheDocument()
    expect(screen.queryByText('Informasi Denda Pengembalian')).not.toBeInTheDocument()
    expect(screen.queryByText('Total Denda:')).not.toBeInTheDocument()
  })

  it('should display pickup status when available', () => {
    const pickupInfo = {
      jumlahDiambil: 2,
      remainingQuantity: 0
    }
    
    render(<ProductDetailCard item={mockItem} pickupInfo={pickupInfo} />)
    
    expect(screen.getByText('Status Pengambilan')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument() // jumlahDiambil
    expect(screen.getByText('2')).toBeInTheDocument() // total quantity
    expect(screen.getByText('✓ Semua item sudah diambil')).toBeInTheDocument()
  })

  it('should render condition labels correctly', () => {
    const itemWithVariousConditions = {
      ...mockItem,
      statusKembali: 'lengkap' as const,
      totalReturnPenalty: 50000,
      conditionBreakdown: [
        {
          id: 'cb-1',
          kondisiAkhir: 'baik',
          jumlahKembali: 1,
          penaltyAmount: 0
        },
        {
          id: 'cb-2',
          kondisiAkhir: 'kotor',
          jumlahKembali: 1,
          penaltyAmount: 10000
        },
        {
          id: 'cb-3',
          kondisiAkhir: 'rusak berat',
          jumlahKembali: 1,
          penaltyAmount: 25000
        },
        {
          id: 'cb-4',
          kondisiAkhir: 'hilang',
          jumlahKembali: 1,
          penaltyAmount: 15000
        }
      ]
    }
    
    render(<ProductDetailCard item={itemWithVariousConditions} />)
    
    expect(screen.getByText('Baik')).toBeInTheDocument()
    expect(screen.getByText('Kotor')).toBeInTheDocument()
    expect(screen.getByText('Rusak Berat')).toBeInTheDocument()
    expect(screen.getByText('Hilang')).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    render(<ProductDetailCard item={mockItemWithReturnData} />)
    
    const toggleButton = screen.getByRole('button')
    expect(toggleButton).toHaveAttribute('aria-expanded')
    expect(toggleButton).toHaveAttribute('aria-label')
  })
})

describe('ReturnStatusBadge', () => {
  it('should render different status variants correctly', () => {
    const testCases = [
      { status: 'lengkap' as const, expectedText: 'Dikembalikan Lengkap' },
      { status: 'sebagian' as const, expectedText: 'Dikembalikan Sebagian' },
      { status: 'belum' as const, expectedText: 'Belum Dikembalikan' }
    ]

    testCases.forEach(({ status, expectedText }) => {
      const { unmount } = render(
        <ProductDetailCard 
          item={{ ...mockItem, statusKembali: status }} 
        />
      )
      
      expect(screen.getByText(expectedText)).toBeInTheDocument()
      unmount()
    })
  })
})