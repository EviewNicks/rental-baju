/**
 * Receipt Service
 * Handles PDF receipt generation for transactions
 */

import { jsPDF } from 'jspdf'
import { STORE_CONFIG } from '@/config/constants'

/**
 * Transaction detail interface for receipt generation
 */
interface TransactionDetail {
  kode: string
  createdAt: string
  penyewa: { nama: string }
  kasir: { nama: string }
  items: TransactionItem[]
  totalHarga: number
}

/**
 * Transaction item interface
 */
interface TransactionItem {
  produk: { name: string }
  kondisiAwal: string // Format: "uuid|SIZE|TYPE|condition"
  jumlah: number
  hargaSewa: number
  durasi: number
  subtotal: number
}

/**
 * Receipt Service Class
 * Generates PDF receipts for rental transactions
 */
export class ReceiptService {
  // PDF configuration constants
  private readonly PDF_WIDTH_MM = 58 // 58mm thermal paper width
  private readonly FONT_SIZE = 8
  private readonly LINE_HEIGHT = 4
  private readonly MARGIN = 2
  private readonly SEPARATOR_CHAR = '='

  /**
   * Generate PDF receipt from transaction data
   * @param transactionData - Complete transaction details
   * @returns PDF as Buffer
   */
  async generateReceiptPDF(transactionData: TransactionDetail): Promise<Buffer> {
    // Create jsPDF instance with 58mm width, portrait orientation
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [this.PDF_WIDTH_MM, 297], // Width 58mm, height will be dynamic
    })

    // Set font to courier (monospace) for consistent spacing
    doc.setFont('courier')
    doc.setFontSize(this.FONT_SIZE)

    let y = this.MARGIN

    // Add all sections
    y = this.addHeader(doc, y)
    y = this.addTransactionInfo(doc, transactionData, y)
    y = this.addItems(doc, transactionData.items, y)
    y = this.addSummary(doc, transactionData, y)
    y = this.addFooter(doc, y)

    // Convert PDF to buffer
    const pdfOutput = doc.output('arraybuffer')
    return Buffer.from(pdfOutput)
  }

  /**
   * Add header section with store information
   */
  private addHeader(doc: jsPDF, y: number): number {
    const centerX = this.PDF_WIDTH_MM / 2

    // Store name (centered, bold)
    doc.setFontSize(10)
    doc.text(STORE_CONFIG.name, centerX, y, { align: 'center' })
    y += this.LINE_HEIGHT + 1

    // Store address (centered)
    doc.setFontSize(this.FONT_SIZE)
    doc.text(STORE_CONFIG.address, centerX, y, { align: 'center' })
    y += this.LINE_HEIGHT

    // Store phone (centered)
    doc.text(STORE_CONFIG.phone, centerX, y, { align: 'center' })
    y += this.LINE_HEIGHT

    // Separator
    y = this.addSeparator(doc, y)

    return y
  }

  /**
   * Add transaction information section
   */
  private addTransactionInfo(
    doc: jsPDF,
    data: TransactionDetail,
    y: number
  ): number {
    const centerX = this.PDF_WIDTH_MM / 2

    // Title
    y += this.LINE_HEIGHT
    doc.text('STRUK TRANSAKSI', centerX, y, { align: 'center' })
    y += this.LINE_HEIGHT + 1

    // Transaction code
    doc.text(`Kode    : ${data.kode}`, this.MARGIN, y)
    y += this.LINE_HEIGHT

    // Date
    const formattedDate = this.formatDate(data.createdAt)
    doc.text(`Tanggal : ${formattedDate}`, this.MARGIN, y)
    y += this.LINE_HEIGHT

    // Customer name
    doc.text(`Customer: ${data.penyewa.nama}`, this.MARGIN, y)
    y += this.LINE_HEIGHT

    // Kasir name
    doc.text(`Kasir   : ${data.kasir.nama}`, this.MARGIN, y)
    y += this.LINE_HEIGHT

    // Separator
    y = this.addSeparator(doc, y)

    return y
  }

  /**
   * Add product items section
   */
  private addItems(doc: jsPDF, items: TransactionItem[], y: number): number {
    const centerX = this.PDF_WIDTH_MM / 2

    // Title
    y += this.LINE_HEIGHT
    doc.text('DETAIL PRODUK', centerX, y, { align: 'center' })
    y += this.LINE_HEIGHT

    // Separator
    y = this.addSeparator(doc, y)

    // Loop through items
    for (const item of items) {
      y += this.LINE_HEIGHT

      // Extract size and format product name
      const size = this.extractSize(item.kondisiAwal)
      const productName = size
        ? `${item.produk.name} (${size})`
        : item.produk.name

      // Product name
      doc.text(productName, this.MARGIN, y)
      y += this.LINE_HEIGHT

      // Quantity x Price x Duration
      const priceFormatted = this.formatCurrency(item.hargaSewa)
      doc.text(
        `${item.jumlah} x ${priceFormatted} x ${item.durasi} hari`,
        this.MARGIN,
        y
      )
      y += this.LINE_HEIGHT

      // Subtotal
      const subtotalFormatted = this.formatCurrency(item.subtotal)
      doc.text(`Subtotal: ${subtotalFormatted}`, this.MARGIN, y)
      y += this.LINE_HEIGHT

      // Blank line between items
      y += this.LINE_HEIGHT / 2
    }

    return y
  }

  /**
   * Add payment summary section
   */
  private addSummary(doc: jsPDF, data: TransactionDetail, y: number): number {
    const centerX = this.PDF_WIDTH_MM / 2

    // Separator
    y = this.addSeparator(doc, y)

    // Title
    y += this.LINE_HEIGHT
    doc.text('RINGKASAN PEMBAYARAN', centerX, y, { align: 'center' })
    y += this.LINE_HEIGHT

    // Separator
    y = this.addSeparator(doc, y)

    // Total
    y += this.LINE_HEIGHT
    const totalFormatted = this.formatCurrency(data.totalHarga)
    doc.text(`Total Sewa: ${totalFormatted}`, this.MARGIN, y)
    y += this.LINE_HEIGHT

    // Separator
    y = this.addSeparator(doc, y)

    return y
  }

  /**
   * Add footer section
   */
  private addFooter(doc: jsPDF, y: number): number {
    const centerX = this.PDF_WIDTH_MM / 2

    // Blank line
    y += this.LINE_HEIGHT + 2

    // Thank you message (centered)
    doc.text('Terima Kasih!', centerX, y, { align: 'center' })
    y += this.LINE_HEIGHT + 1

    // Disclaimer (centered, smaller font)
    doc.setFontSize(this.FONT_SIZE - 1)
    doc.text('Barang yang sudah disewa', centerX, y, { align: 'center' })
    y += this.LINE_HEIGHT
    doc.text('tidak dapat dikembalikan', centerX, y, { align: 'center' })
    y += this.LINE_HEIGHT

    // Reset font size
    doc.setFontSize(this.FONT_SIZE)

    // Final separator
    y = this.addSeparator(doc, y)

    return y
  }

  /**
   * Format currency to Indonesian format
   * @param amount - Numeric amount
   * @returns Formatted string (e.g., "Rp 300.000")
   */
  private formatCurrency(amount: number): string {
    // Handle edge cases
    if (amount === 0) return 'Rp 0'
    if (!amount || isNaN(amount)) return 'Rp 0'

    // Format with dot as thousand separator
    const formatted = Math.abs(amount)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.')

    return `Rp ${formatted}`
  }

  /**
   * Format date to Indonesian format
   * @param dateString - ISO date string
   * @returns Formatted string (e.g., "01 Des 2024 12:19")
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
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')

    return `${day} ${month} ${year} ${hours}:${minutes}`
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
   * Add separator line
   */
  private addSeparator(doc: jsPDF, y: number): number {
    y += this.LINE_HEIGHT / 2
    const separatorWidth = this.PDF_WIDTH_MM - this.MARGIN * 2
    const separatorCount = Math.floor(separatorWidth / 1.5) // Approximate character width

    const separator = this.SEPARATOR_CHAR.repeat(separatorCount)
    doc.text(separator, this.MARGIN, y)
    y += this.LINE_HEIGHT / 2

    return y
  }
}
