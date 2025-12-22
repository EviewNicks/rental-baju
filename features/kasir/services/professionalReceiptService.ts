/**
 * Professional Receipt Service
 * Handles professional PDF receipt generation with table layout for transactions
 * Generates 14x20cm (140x200mm) professional receipts with bordered tables
 */

import { jsPDF } from 'jspdf'
import { STORE_CONFIG } from '@/config/constants'
import type { TransaksiWithDetails } from './transaksiService'
import { Decimal } from '@prisma/client/runtime/library'
import fs from 'fs'
import path from 'path'

/**
 * Transaction Detail interface for professional receipt
 * Uses the existing TransaksiWithDetails without overriding discount fields
 */
type TransactionDetail = TransaksiWithDetails

/**
 * Table Column configuration interface
 */
interface TableColumn {
  header: string
  width: number
  align: 'left' | 'center' | 'right'
}

/**
 * Professional Receipt Service Class
 * Generates professional PDF receipts with table layout, logo, and comprehensive transaction details
 */
export class ProfessionalReceiptService {
  // PDF configuration constants for professional layout
  private readonly PDF_WIDTH_MM = 140  // 14cm width (HVS paper format)
  private readonly PDF_HEIGHT_MM = 200 // 20cm height (HVS paper format)
  private readonly MARGIN = 10
  private readonly HEADER_HEIGHT = 40
  private readonly TABLE_ROW_HEIGHT = 8
  private readonly FONT_SIZE = 9
  private readonly HEADER_FONT_SIZE = 12
  private readonly TITLE_FONT_SIZE = 14

  // Table column configuration for professional layout
  private readonly TABLE_COLUMNS: TableColumn[] = [
    { header: 'No', width: 15, align: 'center' },
    { header: 'Kategori', width: 25, align: 'left' },
    { header: 'Nama Barang', width: 40, align: 'left' },
    { header: 'Size', width: 15, align: 'center' },
    { header: 'Qty', width: 10, align: 'center' },
    { header: '@Harga', width: 20, align: 'right' },
    { header: 'Total Harga', width: 25, align: 'right' }
  ]

  /**
   * Generate professional PDF receipt from transaction data
   * @param transactionData - Complete transaction details
   * @returns PDF as Buffer
   */
  async generateProfessionalReceiptPDF(transactionData: TransactionDetail): Promise<Buffer> {
    try {
      // Validate input data
      if (!transactionData) {
        throw new Error('Transaction data is required')
      }
      if (!transactionData.items || transactionData.items.length === 0) {
        throw new Error('Transaction must have at least one item')
      }

      // Create jsPDF instance with 140x200mm dimensions (14x20cm HVS paper)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [this.PDF_WIDTH_MM, this.PDF_HEIGHT_MM],
      })

      // Set default font and size for professional appearance
      doc.setFont('helvetica')
      doc.setFontSize(this.FONT_SIZE)

      let y = this.MARGIN

      // Add all sections with error handling and position tracking
      y = await this.addProfessionalHeader(doc, transactionData, y)
      y = this.addTransactionInfoSection(doc, transactionData, y)
      y = this.addItemsTable(doc, transactionData.items, transactionData.kode, y)
      y = this.addFinancialSummary(doc, transactionData, y)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      y = this.addProfessionalFooter(doc, y)

      // Convert PDF to buffer
      const pdfOutput = doc.output('arraybuffer')
      const buffer = Buffer.from(pdfOutput)

      // Log success with buffer size
      console.log('Professional PDF generated successfully:', {
        transactionCode: transactionData.kode,
        bufferSize: buffer.length,
        itemCount: transactionData.items.length,
        dimensions: `${this.PDF_WIDTH_MM}x${this.PDF_HEIGHT_MM}mm`,
      })

      return buffer
    } catch (error) {
      console.error('Professional PDF generation failed:', {
        transactionCode: transactionData?.kode,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      })
      throw error
    }
  }

  /**
   * Add professional header with logo and store information
   * @param doc - jsPDF document instance
   * @param transactionData - Transaction data for header context
   * @param y - Current Y position
   * @returns New Y position after header
   */
  private async addProfessionalHeader(doc: jsPDF, transactionData: TransactionDetail, y: number): Promise<number> {
    const currentY = y

    // Try to load and add logo in top-left corner
    try {
      const logoBase64 = await this.loadLogo()
      if (logoBase64) {
        const logoWidth = 25 // 25mm width
        const logoHeight = 15 // 15mm height
        doc.addImage(logoBase64, 'JPEG', this.MARGIN, currentY, logoWidth, logoHeight)
      }
    } catch (error) {
      console.warn('Failed to add logo to professional receipt:', error)
      // Continue without logo
    }

    // Store information (left side, below logo)
    const storeInfoY = currentY + 18 // Position below logo
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(this.TITLE_FONT_SIZE)
    
    // Store name "ERLIMA MODE" prominently
    doc.text(STORE_CONFIG.name, this.MARGIN, storeInfoY)
    
    // Store address and phone (normal font)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(this.FONT_SIZE)
    doc.text(STORE_CONFIG.address, this.MARGIN, storeInfoY + 5)
    doc.text(STORE_CONFIG.phone, this.MARGIN, storeInfoY + 10)

    return storeInfoY + 15 // Return Y position after header
  }

  /**
   * Add transaction information section (right side header)
   * @param doc - jsPDF document instance
   * @param data - Transaction data
   * @param y - Current Y position
   * @returns New Y position after transaction info
   */
  private addTransactionInfoSection(doc: jsPDF, data: TransactionDetail, y: number): number {
    const rightX = this.PDF_WIDTH_MM - this.MARGIN - 60 // Position from right side
    let currentY = y

    // Set font for transaction info
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(this.HEADER_FONT_SIZE)

    // Document type "PENAWARAN PENJUALAN" (top-right)
    doc.text('PENAWARAN PENJUALAN', rightX, currentY, { align: 'left' })
    currentY += 8

    // Set normal font for details
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(this.FONT_SIZE)

    // Transaction number (Nomor: data.kode)
    doc.text(`Nomor: ${data.kode}`, rightX, currentY)
    currentY += 5

    // Transaction date (Tanggal: formatted date)
    const formattedDate = this.formatDate(data.createdAt.toString())
    doc.text(`Tanggal: ${formattedDate}`, rightX, currentY)
    currentY += 5

    // Payment method (Pembayaran: data.metodeBayar)
    doc.text(`Pembayaran: ${data.metodeBayar}`, rightX, currentY)
    currentY += 5

    // Customer name (Kepada Yth: data.penyewa.nama)
    doc.text(`Kepada Yth: ${data.penyewa.nama}`, rightX, currentY)
    currentY += 8

    return Math.max(currentY, y + 35) // Ensure minimum height for section
  }

  /**
   * Add items table with borders and proper formatting
   * @param doc - jsPDF document instance
   * @param items - Transaction items
   * @param transactionCode - Transaction code for "No" column
   * @param y - Current Y position
   * @returns New Y position after table
   */
  private addItemsTable(doc: jsPDF, items: TransaksiWithDetails['items'], transactionCode: string, y: number): number {
    const startX = this.MARGIN
    const currentY = y + 10 // Add some spacing before table

    // Prepare table data
    const tableData: string[][] = []
    
    // Process each item
    for (const item of items) {
      // Extract category name (handle null/undefined category)
      const categoryName = item.produk.category?.name || 'N/A'
      
      // Extract size from kondisiAwal
      const size = this.extractSize(item.kondisiAwal || '')
      
      // Format currency amounts (without Rp prefix for professional format)
      const unitPrice = this.formatCurrency(item.hargaSewa)
      const totalPrice = this.formatCurrency(item.subtotal)
      
      // Create table row
      const row = [
        transactionCode,           // No (transaction code for all items)
        categoryName,              // Kategori
        item.produk.name,          // Nama Barang
        size || '-',               // Size (show dash if empty)
        item.jumlah.toString(),    // Qty
        unitPrice,                 // @Harga
        totalPrice                 // Total Harga
      ]
      
      tableData.push(row)
    }

    // Create the bordered table
    const endY = this.createBorderedTable(doc, this.TABLE_COLUMNS, tableData, startX, currentY)
    
    return endY + 5 // Add spacing after table
  }

  /**
   * Add financial summary section (Sub Total, Diskon, Biaya Lain-lain, Total)
   * @param doc - jsPDF document instance
   * @param data - Transaction data
   * @param y - Current Y position
   * @returns New Y position after financial summary
   */
  private addFinancialSummary(doc: jsPDF, data: TransactionDetail, y: number): number {
    const rightX = this.PDF_WIDTH_MM - this.MARGIN - 50 // Position from right side
    let currentY = y + 10 // Add spacing before summary

    // Set font for financial summary
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(this.FONT_SIZE)

    // Calculate subtotal (sum of all item subtotals)
    const subtotal = data.items.reduce((sum, item) => {
      const itemSubtotal = typeof item.subtotal === 'number' ? item.subtotal : item.subtotal.toNumber()
      return sum + itemSubtotal
    }, 0)

    // Calculate discount amount
    const discountAmount = this.calculateDiscount(
      subtotal,
      data.discountType || '',
      typeof data.discountValue === 'number' ? data.discountValue : (data.discountValue?.toNumber() || 0)
    )

    // Get total from transaction data
    const totalAmount = typeof data.totalHarga === 'number' ? data.totalHarga : data.totalHarga.toNumber()

    // Display financial breakdown
    // Sub Total
    doc.text('Sub Total:', rightX, currentY, { align: 'left' })
    doc.text(this.formatCurrency(subtotal), rightX + 35, currentY, { align: 'right' })
    currentY += 5

    // Diskon (only show if there's a discount)
    if (discountAmount > 0) {
      doc.text('Diskon:', rightX, currentY, { align: 'left' })
      doc.text(`-${this.formatCurrency(discountAmount)}`, rightX + 35, currentY, { align: 'right' })
      currentY += 5
    }

    // Biaya Lain-lain (always 0 for now, reserved for future use)
    doc.text('Biaya Lain-lain:', rightX, currentY, { align: 'left' })
    doc.text(this.formatCurrency(0), rightX + 35, currentY, { align: 'right' })
    currentY += 5

    // Add separator line
    doc.setLineWidth(0.3)
    doc.line(rightX, currentY + 1, rightX + 45, currentY + 1)
    currentY += 4

    // Total (bold)
    doc.setFont('helvetica', 'bold')
    doc.text('Total:', rightX, currentY, { align: 'left' })
    doc.text(this.formatCurrency(totalAmount), rightX + 35, currentY, { align: 'right' })
    currentY += 8

    return currentY
  }

  /**
   * Add professional footer with keterangan and signature area
   * @param doc - jsPDF document instance
   * @param y - Current Y position
   * @returns New Y position after footer
   */
  private addProfessionalFooter(doc: jsPDF, y: number): number {
    let currentY = y + 15 // Add spacing before footer
    const leftX = this.MARGIN
    const rightX = this.PDF_WIDTH_MM - this.MARGIN - 50

    // Set font for footer
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(this.FONT_SIZE)

    // Left side - Keterangan section
    doc.setFont('helvetica', 'bold')
    doc.text('Keterangan:', leftX, currentY)
    
    doc.setFont('helvetica', 'normal')
    currentY += 5
    
    // Disclaimer text
    const disclaimerText = 'Barang yg sudah dibeli tidak dapat ditukar atau dikembalikan'
    doc.text(disclaimerText, leftX, currentY)
    
    // Right side - Signature section
    doc.setFont('helvetica', 'normal')
    doc.text('Bagian Penjualan,', rightX, currentY - 5)
    
    // Signature line with date
    currentY += 15
    doc.text('Tgl. ___________', rightX, currentY)
    
    // Add signature line (underline for name)
    currentY += 10
    doc.line(rightX, currentY, rightX + 40, currentY)
    
    // Move to bottom for final note
    currentY += 10
    
    // Final note (centered at bottom)
    const noteText = 'Harga dan stok di atas dapat berubah sewaktu-waktu tanpa pemberitahuan'
    const centerX = this.PDF_WIDTH_MM / 2
    doc.setFontSize(this.FONT_SIZE - 1) // Slightly smaller font
    doc.text(noteText, centerX, currentY, { align: 'center' })
    
    currentY += 5
    
    return currentY
  }

  /**
   * Create bordered table with specified columns and data
   * @param doc - jsPDF document instance
   * @param columns - Table column configuration
   * @param data - Table data (2D array)
   * @param startX - Starting X position
   * @param startY - Starting Y position
   * @returns New Y position after table
   */
  private createBorderedTable(
    doc: jsPDF, 
    columns: TableColumn[], 
    data: string[][], 
    startX: number, 
    startY: number
  ): number {
    const headerHeight = this.TABLE_ROW_HEIGHT + 2
    const rowHeight = this.TABLE_ROW_HEIGHT
    let currentY = startY

    // Set font for table
    doc.setFontSize(this.FONT_SIZE)
    doc.setFont('helvetica', 'normal')

    // Draw table header
    let currentX = startX
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i]
      
      // Set bold font for header
      doc.setFont('helvetica', 'bold')
      
      // Calculate text position based on alignment
      let textX = currentX
      if (column.align === 'center') {
        textX = currentX + column.width / 2
      } else if (column.align === 'right') {
        textX = currentX + column.width - 2
      } else {
        textX = currentX + 2 // left align with padding
      }

      // Draw header text
      doc.text(column.header, textX, currentY + headerHeight - 2, { align: column.align })
      
      currentX += column.width
    }

    currentY += headerHeight

    // Draw table data rows
    doc.setFont('helvetica', 'normal')
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex]
      currentX = startX

      for (let colIndex = 0; colIndex < columns.length && colIndex < row.length; colIndex++) {
        const column = columns[colIndex]
        const cellData = row[colIndex] || ''

        // Calculate text position based on alignment
        let textX = currentX
        if (column.align === 'center') {
          textX = currentX + column.width / 2
        } else if (column.align === 'right') {
          textX = currentX + column.width - 2
        } else {
          textX = currentX + 2 // left align with padding
        }

        // Handle text wrapping for long content
        const maxWidth = column.width - 4 // Account for padding
        const lines = doc.splitTextToSize(cellData, maxWidth)
        
        if (Array.isArray(lines) && lines.length > 1) {
          // Multi-line text
          for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            doc.text(lines[lineIndex], textX, currentY + rowHeight - 2 + (lineIndex * 3), { align: column.align })
          }
        } else {
          // Single line text
          doc.text(cellData, textX, currentY + rowHeight - 2, { align: column.align })
        }

        currentX += column.width
      }

      currentY += rowHeight
    }

    // Draw table borders
    this.drawTableBorders(doc, startX, startY, columns, data.length + 1) // +1 for header

    return currentY + 5 // Add some spacing after table
  }

  /**
   * Draw table borders and grid lines
   * @param doc - jsPDF document instance
   * @param startX - Starting X position
   * @param startY - Starting Y position
   * @param columns - Table column configuration
   * @param rowCount - Number of rows (including header)
   */
  private drawTableBorders(
    doc: jsPDF, 
    startX: number, 
    startY: number, 
    columns: TableColumn[], 
    rowCount: number
  ): void {
    const headerHeight = this.TABLE_ROW_HEIGHT + 2
    const rowHeight = this.TABLE_ROW_HEIGHT
    const totalWidth = columns.reduce((sum, col) => sum + col.width, 0)
    const totalHeight = headerHeight + (rowCount - 1) * rowHeight

    // Set line width for borders
    doc.setLineWidth(0.5)

    // Draw outer border
    doc.rect(startX, startY, totalWidth, totalHeight)

    // Draw horizontal lines (between rows)
    for (let i = 1; i < rowCount; i++) {
      const y = startY + headerHeight + (i - 1) * rowHeight
      doc.line(startX, y, startX + totalWidth, y)
    }

    // Draw header separator line (thicker)
    doc.setLineWidth(0.8)
    doc.line(startX, startY + headerHeight, startX + totalWidth, startY + headerHeight)
    doc.setLineWidth(0.5)

    // Draw vertical lines (between columns)
    let currentX = startX
    for (let i = 0; i < columns.length - 1; i++) {
      currentX += columns[i].width
      doc.line(currentX, startY, currentX, startY + totalHeight)
    }
  }

  /**
   * Calculate discount amount based on type and value
   * @param subtotal - Subtotal amount
   * @param discountType - Type of discount ('percent' or 'nominal')
   * @param discountValue - Discount value
   * @returns Calculated discount amount
   */
  private calculateDiscount(subtotal: number, discountType: string, discountValue: number): number {
    if (!discountType || !discountValue) return 0

    if (discountType === 'percent') {
      return Math.round(subtotal * (discountValue / 100))
    } else if (discountType === 'nominal') {
      return discountValue
    }
    
    return 0
  }

  /**
   * Format currency to professional Indonesian format (without Rp prefix)
   * @param amount - Numeric amount or Decimal
   * @returns Formatted string (e.g., "2.250.000")
   */
  private formatCurrency(amount: number | Decimal): string {
    // Convert Decimal to number if needed
    const numericAmount =
      typeof amount === 'number'
        ? amount
        : amount instanceof Decimal
          ? amount.toNumber()
          : Number(amount)

    // Handle edge cases
    if (numericAmount === 0) return '0'
    if (!numericAmount || isNaN(numericAmount)) return '0'

    // Format with dot as thousand separator (no Rp prefix for professional format)
    const formatted = Math.abs(numericAmount)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.')

    return formatted
  }

  /**
   * Format date to Indonesian format
   * @param dateString - ISO date string
   * @returns Formatted string (e.g., "15 Des 2025")
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString)

    // Indonesian month abbreviations
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ]

    const day = date.getDate().toString().padStart(2, '0')
    const month = monthNames[date.getMonth()]
    const year = date.getFullYear()

    return `${day} ${month} ${year}`
  }

  /**
   * Extract size from kondisiAwal field
   * @param kondisiAwal - Format: "uuid|SIZE|TYPE|condition"
   * @returns Size string (e.g., "M", "L")
   */
  private extractSize(kondisiAwal: string): string {
    if (!kondisiAwal) return ''

    const parts = kondisiAwal.split('|')
    return parts.length >= 2 ? parts[1] : ''
  }

  /**
   * Load and encode logo for PDF
   * @returns Base64 encoded logo or null if loading fails
   */
  private async loadLogo(): Promise<string | null> {
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.jpg')
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath)
        return `data:image/jpeg;base64,${logoBuffer.toString('base64')}`
      }
      return null
    } catch (error) {
      console.warn('Failed to load logo for professional receipt:', error)
      return null
    }
  }
}