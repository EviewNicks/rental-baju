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
  // PDF configuration constants for professional layout (LANDSCAPE)
  private readonly PDF_WIDTH_MM = 200  // 20cm width (HVS paper format - landscape)
  private readonly PDF_HEIGHT_MM = 140 // 14cm height (HVS paper format - landscape)
  private readonly MARGIN = 10
  private readonly HEADER_HEIGHT = 40
  private readonly TABLE_ROW_HEIGHT = 8
  private readonly FONT_SIZE = 9
  private readonly HEADER_FONT_SIZE = 12
  private readonly TITLE_FONT_SIZE = 14

  // Table column configuration for professional layout - FULL WIDTH
  private readonly TABLE_COLUMNS: TableColumn[] = [
    { header: 'No', width: 12, align: 'center' },      // Reduced width since only numbers
    { header: 'Kategori', width: 28, align: 'left' },   // Increased width
    { header: 'Nama Barang', width: 60, align: 'left' }, // Increased width
    { header: 'Size', width: 18, align: 'center' },     // Increased width
    { header: 'Qty', width: 12, align: 'center' },      // Increased width
    { header: '@Harga', width: 20, align: 'right' },    // Increased width
    { header: 'Total Harga', width: 25, align: 'right' } // Increased width
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
        orientation: 'landscape',
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
      y = this.addItemsTable(doc, transactionData.items, transactionData.kode, y - 5) // Reduced spacing before table (was +2, now -5 to bring table closer)
      // Horizontal alignment: Signature (left) and Financial Summary (right) on same level
      // Store the Y position after table for both sections to use the same starting point
      const afterTableY = y // Add consistent spacing after table for both sections
      const signatureY = this.addSignatureSection(doc, afterTableY)
      const financialY = this.addFinancialSummary(doc, transactionData, afterTableY)
      // Use the maximum Y position from both sections
      y = Math.max(signatureY, financialY)
      // Remaining sections
      y = this.addKeteranganSection(doc, y - 5)

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
    const currentY = y + 2 // Reduced padding from top margin (was +5, now +2)

    // Try to load and add logo in top-left corner
    try {
      const logoBase64 = await this.loadLogo()
      if (logoBase64) {
        const logoWidth = 20 // Logo width
        const logoHeight = 12 // Logo height
        doc.addImage(logoBase64, 'JPEG', this.MARGIN, currentY, logoWidth, logoHeight)
      }
    } catch (error) {
      console.warn('Failed to add logo to professional receipt:', error)
      // Continue without logo
    }

    // Store information (positioned right next to logo, vertically centered with logo)
    const storeInfoX = this.MARGIN + 25 // Position next to logo
    const logoMiddleY = currentY + 6 // Middle of logo (12mm height / 2 = 6mm)
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(this.TITLE_FONT_SIZE)
    
    // Store name "ERLIMA MODE" prominently - centered vertically with logo
    doc.text(STORE_CONFIG.name, storeInfoX, logoMiddleY - 2)
    
    // Store address and phone (normal font, smaller) - positioned below store name
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(this.FONT_SIZE - 1) // Slightly smaller font
    doc.text(STORE_CONFIG.address, storeInfoX, logoMiddleY + 3)
    doc.text(STORE_CONFIG.phone, storeInfoX, logoMiddleY + 7)

    return currentY + 15 // Reduced return spacing (was +18, now +15)
  }

  /**
   * Add transaction information section (right side header) - TABLE FORMAT without borders
   * @param doc - jsPDF document instance
   * @param data - Transaction data
   * @param y - Current Y position
   * @returns New Y position after transaction info
   */
  private addTransactionInfoSection(doc: jsPDF, data: TransactionDetail, y: number): number {
    // JUSTIFY BETWEEN: Position at far right to create space-between effect with left header
    const rightX = this.PDF_WIDTH_MM - this.MARGIN - 5 // Almost at right margin for justify-between effect
    let currentY = y - 13 // Align with header top (reduced from -15 to -13)

    // Set font for transaction info
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(this.HEADER_FONT_SIZE)

    // Document type "PENAWARAN PENJUALAN" (top-right, right-aligned for better justify effect)
    doc.text('PENAWARAN PENJUALAN', rightX, currentY, { align: 'right' })
    currentY += 8

    // Create invisible table for transaction details
    const tableData = [
      ['Nomor:', data.kode],
      ['Tanggal:', this.formatDate(data.createdAt.toString())],
      ['Pembayaran:', data.metodeBayar],
      ['Kepada Yth:', data.penyewa.nama]
    ]

    // Table configuration for transaction info (invisible borders)
    const labelWidth = 25 // Width for labels (Nomor:, Tanggal:, etc.)
    const valueWidth = 45 // Width for values
    const rowHeight = 4 // Height for each row
    const tableStartX = rightX - labelWidth - valueWidth // Start position for table

    // Set normal font for table content
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(this.FONT_SIZE)

    // Draw table rows without borders
    for (let i = 0; i < tableData.length; i++) {
      const row = tableData[i]
      const rowY = currentY + (i * rowHeight)
      
      // Label column (left-aligned within its cell)
      doc.text(row[0], tableStartX, rowY, { align: 'left' })
      
      // Value column (left-aligned within its cell, positioned after label column)
      doc.text(row[1], tableStartX + labelWidth, rowY, { align: 'left' })
    }

    // Update Y position after table
    currentY += (tableData.length * rowHeight) + 2 // Add small spacing after table

    return Math.max(currentY, y + 8) // Reduced minimum height (was +10, now +8)
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
    const currentY = y + 5 // Reduced spacing before table (was +10, now +5)

    // Prepare table data
    const tableData: string[][] = []
    
    // Process each item with increment number
    for (let index = 0; index < items.length; index++) {
      const item = items[index]
      
      // Extract category name (handle null/undefined category)
      const categoryName = item.produk.category?.name || 'N/A'
      
      // Extract size from kondisiAwal
      const size = this.extractSize(item.kondisiAwal || '')
      
      // Format currency amounts (without Rp prefix for professional format)
      const unitPrice = this.formatCurrency(item.hargaSewa)
      const totalPrice = this.formatCurrency(item.subtotal)
      
      // Create table row with increment number (1, 2, 3, ...)
      const row = [
        (index + 1).toString(),    // No (increment number: 1, 2, 3, ...)
        categoryName,              // Kategori
        item.produk.name,          // Nama Barang
        size || '-',               // Size (show dash if empty)
        item.jumlah.toString(),    // Qty
        unitPrice,                 // @Harga
        totalPrice                 // Total Harga
      ]
      
      tableData.push(row)
    }

    // Create the bordered table with full width
    const endY = this.createBorderedTable(doc, this.TABLE_COLUMNS, tableData, startX, currentY)
    
    return endY + 5 // Add spacing after table
  }

  /**
   * Add financial summary section (right side, aligned with signature)
   * @param doc - jsPDF document instance
   * @param data - Transaction data
   * @param y - Current Y position
   * @returns New Y position after financial summary
   */
  private addFinancialSummary(doc: jsPDF, data: TransactionDetail, y: number): number {
    const rightX = this.PDF_WIDTH_MM - this.MARGIN - 50 // Position from right side
    let currentY = y // Use the same Y position as signature section for horizontal alignment

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

    // Display financial breakdown with justify-between layout
    const summaryWidth = 45 // Width of the financial summary section (same as separator line)
    const leftLabelX = rightX // Left position for labels
    const rightValueX = rightX + summaryWidth // Right position for values (aligned with separator end)

    // Sub Total
    doc.text('Sub Total:', leftLabelX, currentY, { align: 'left' })
    doc.text(this.formatCurrency(subtotal), rightValueX, currentY, { align: 'right' })
    currentY += 5

    // Diskon (only show if there's a discount)
    if (discountAmount > 0) {
      doc.text('Diskon:', leftLabelX, currentY, { align: 'left' })
      doc.text(`-${this.formatCurrency(discountAmount)}`, rightValueX, currentY, { align: 'right' })
      currentY += 5
    }

    // Biaya Lain-lain (always 0 for now, reserved for future use)
    doc.text('Biaya Lain-lain:', leftLabelX, currentY, { align: 'left' })
    doc.text(this.formatCurrency(0), rightValueX, currentY, { align: 'right' })
    currentY += 3

    // Add separator line
    doc.setLineWidth(0.3)
    doc.line(rightX, currentY + 1, rightX + summaryWidth, currentY + 1)
    currentY += 6

    // Total (bold)
    doc.setFont('helvetica', 'bold')
    doc.text('Total:', leftLabelX, currentY, { align: 'left' })
    doc.text(this.formatCurrency(totalAmount), rightValueX, currentY, { align: 'right' })
    currentY += 8

    // Payment information section (similar to receiptService.ts)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(this.FONT_SIZE)

    // DP/Jumlah Bayar
    const jumlahBayarAmount = typeof data.jumlahBayar === 'number' ? data.jumlahBayar : (data.jumlahBayar?.toNumber() || 0)
    doc.text('DP/Jumlah Bayar:', leftLabelX, currentY, { align: 'left' })
    doc.text(this.formatCurrency(jumlahBayarAmount), rightValueX, currentY, { align: 'right' })
    currentY += 5

    // Sisa Bayar
    const sisaBayarAmount = typeof data.sisaBayar === 'number' ? data.sisaBayar : (data.sisaBayar?.toNumber() || 0)
    doc.text('Sisa Bayar:', leftLabelX, currentY, { align: 'left' })
    doc.text(this.formatCurrency(sisaBayarAmount), rightValueX, currentY, { align: 'right' })
    currentY += 8

    return currentY // Return the final Y position
  }

  /**
   * Add keterangan section (left side footer)
   * @param doc - jsPDF document instance
   * @param y - Current Y position
   * @returns New Y position after keterangan section
   */
  private addKeteranganSection(doc: jsPDF, y: number): number {
    let currentY = y + 10 // Add spacing before keterangan
    const leftX = this.MARGIN

    // Set font for keterangan
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(this.FONT_SIZE)
    
    // Keterangan title
    doc.text('Keterangan:', leftX, currentY)
    
    // Disclaimer text (normal font)
    doc.setFont('helvetica', 'normal')
    currentY += 5
    
    const disclaimerText = 'Barang yg sudah dibeli tidak dapat ditukar atau dikembalikan'
    doc.text(disclaimerText, leftX, currentY)
    
    return currentY + 5 // Return position after keterangan
  }

  /**
   * Add signature section (left side, aligned with financial summary)
   * @param doc - jsPDF document instance
   * @param y - Current Y position
   * @returns New Y position after signature section
   */
  private addSignatureSection(doc: jsPDF, y: number): number {
    const leftX = this.MARGIN
    let currentY = y // Use the same Y position as financial summary for horizontal alignment

    // Set font for signature
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(this.FONT_SIZE)
    
    // "Bagian Penjualan," label
    doc.text('Bagian Penjualan,', leftX, currentY)
    
    // Date line
    currentY += 20
    doc.text('Nama. _______________', leftX, currentY)
    
    // Signature line (underline for name)
    currentY += 10
    
    return currentY // Return position after signature
  }

  /**
   * Add bottom note (centered at bottom)
   * @param doc - jsPDF document instance
   * @param y - Current Y position
   * @returns New Y position after bottom note
   */
  private addBottomNote(doc: jsPDF, y: number): number {
    let currentY = y + 10 // Add spacing before bottom note
    
    // Final note (centered at bottom)
    const noteText = 'Harga dan stok di atas dapat berubah sewaktu-waktu tanpa pemberitahuan'
    const centerX = this.PDF_WIDTH_MM / 2
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(this.FONT_SIZE - 1) // Slightly smaller font
    doc.text(noteText, centerX, currentY, { align: 'center' })
    
    return currentY + 5
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