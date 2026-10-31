import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  getStoredTemplateConfig,
  defaultInvoiceColumns,
  defaultSectionOrder,
  defaultSectionElements,
  defaultTemplateConfig,
} from '../utils/pdfTemplateStorage'

/**
 * Generates a PDF invoice based on the configured template and provided invoice data
 * @param {Object} invoiceData - The invoice data to populate the PDF
 * @param {Object} options - Additional options
 * @param {boolean} options.download - Whether to auto-download the PDF (default: true)
 * @param {string} options.filename - Custom filename (default: invoice-{number}.pdf)
 * @returns {jsPDF} The generated PDF document
 */
// Module-level helper functions (need access to doc, so they accept doc as first param)
const addText = (doc, text, x, y, options = {}) => {
  const {
    fontSize = 8,
    fontStyle = 'normal',
    color = [0, 0, 0],
    align = 'left',
    maxWidth,
  } = options

  doc.setFontSize(fontSize)
  doc.setFont('helvetica', fontStyle)
  doc.setTextColor(...color)

  if (maxWidth) {
    const lines = doc.splitTextToSize(text, maxWidth)
    doc.text(lines, x, y, { align })
    return y + lines.length * (fontSize * 0.35)
  }

  doc.text(text, x, y, { align })
  return y + fontSize * 0.35
}

const addLine = (doc, x1, y1, x2, y2, color = [0, 0, 0], width = 0.5) => {
  doc.setDrawColor(...color)
  doc.setLineWidth(width)
  doc.line(x1, y1, x2, y2)
}

const addRect = (doc, x, y, w, h, color = [0, 0, 0], fill = false) => {
  doc.setDrawColor(...color)
  doc.setLineWidth(0.3)
  if (fill) {
    doc.setFillColor(...color)
    doc.rect(x, y, w, h, 'FD')
  } else {
    doc.rect(x, y, w, h, 'S')
  }
}

export const generateInvoicePDF = (invoiceData, options = {}) => {
  const {
    download = true,
    filename = `invoice-${invoiceData.invoiceNumber || Date.now()}.pdf`,
  } = options

  try {
    // Get the stored template configuration
    const config = getStoredTemplateConfig()
    const activeColumns = (config.columns || defaultInvoiceColumns).filter((c) => c.enabled)
    const sectionOrder = config.sectionOrder || defaultSectionOrder
    const sectionElements = config.sectionElements || defaultSectionElements

    // Create new PDF document (A4 size)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    // Set default font
    doc.setFont('helvetica')

    // Page dimensions
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - margin * 2
    let yPos = margin

    // Render each section based on sectionOrder
  sectionOrder.forEach((sectionKey) => {
    const elements = sectionElements[sectionKey] || []

    switch (sectionKey) {
      case 'header':
        yPos = renderHeader(doc, config, invoiceData, margin, contentWidth, yPos, elements, pageWidth)
        break
      case 'billTo':
        yPos = renderBillTo(doc, config, invoiceData, margin, contentWidth, yPos, elements, pageWidth)
        break
      case 'itemsTable':
        yPos = renderItemsTable(doc, config, invoiceData, margin, contentWidth, yPos, activeColumns)
        break
      case 'totals':
        yPos = renderTotals(doc, config, invoiceData, margin, contentWidth, yPos, elements)
        break
      case 'footer':
        yPos = renderFooter(doc, config, invoiceData, margin, contentWidth, yPos, elements, pageWidth, pageHeight)
        break
    }

    // Add small gap between sections
    yPos += 3

    // Check if we need a new page
    if (yPos > pageHeight - 30) {
      doc.addPage()
      yPos = margin
    }
  })

  // Download or return the PDF
  if (download) {
    doc.save(filename)
  }

  return doc
  } catch (error) {
  console.error('PDF Generation Error:', error)
  // Return a minimal PDF with error message
  const errorDoc = new jsPDF()
  errorDoc.setFont('helvetica')
  errorDoc.setFontSize(12)
  errorDoc.text('Error generating PDF invoice', 20, 20)
  errorDoc.text(error.message || 'Unknown error', 20, 30)
  if (download) {
    errorDoc.save(filename)
  }
  return errorDoc
}

}

/**
 * Render Header Section
 */
const renderHeader = (doc, config, invoiceData, margin, contentWidth, yPos, elements, pageWidth) => {
  const leftX = margin
  const rightX = pageWidth - margin
  let currentY = yPos

  // Split elements into left group (logo, company info) and right group (invoice title, number, date, GST)
  const leftElements = elements.filter((k) => ['logo', 'companyName', 'companyAddress', 'companyContact'].includes(k))
  const rightElements = elements.filter((k) => ['invoiceTitle', 'invoiceNumber', 'invoiceDate', 'gstNumber'].includes(k))

  // Render left group elements
  leftElements.forEach((elementKey) => {
    switch (elementKey) {
      case 'logo':
        if (config.logoDataUrl) {
          try {
            doc.addImage(config.logoDataUrl, 'PNG', leftX, currentY, 20, 20)
            currentY += 22
          } catch (e) {
            // Fallback if image fails
            doc.setFillColor(0, 0, 0)
            doc.rect(leftX, currentY, 20, 20, 'F')
            doc.setTextColor(255, 255, 255)
            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            doc.text('WB', leftX + 10, currentY + 14, { align: 'center' })
            currentY += 22
          }
        } else {
          // Default logo placeholder
          doc.setFillColor(0, 0, 0)
          doc.rect(leftX, currentY, 20, 20, 'F')
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          doc.text('WB', leftX + 10, currentY + 14, { align: 'center' })
          currentY += 22
        }
        break

      case 'companyName':
        currentY = addText(doc, config.companyName || 'Store Name', leftX + 25, currentY, {
          fontSize: 11,
          fontStyle: 'bold',
        })
        break

      case 'companyAddress':
        currentY = addText(doc, config.companyAddress, leftX + 25, currentY, {
          fontSize: 7,
          color: [80, 80, 80],
          maxWidth: contentWidth - 30,
        })
        break

      case 'companyContact':
        currentY = addText(doc, config.companyContact, leftX + 25, currentY, {
          fontSize: 6.5,
          color: [100, 100, 100],
        })
        break
    }
  })

  // Render right group elements
  let rightY = yPos
  rightElements.forEach((elementKey) => {
    switch (elementKey) {
      case 'invoiceTitle':
        rightY = addText(doc, 'INVOICE', rightX, rightY, {
          fontSize: 14,
          fontStyle: 'bold',
          align: 'right',
        })
        break

      case 'invoiceNumber':
        rightY = addText(doc, `#${invoiceData.invoiceNumber || 'INV-2026-0891'}`, rightX, rightY, {
          fontSize: 7,
          fontStyle: 'bold',
          color: [60, 60, 60],
          align: 'right',
        })
        break

      case 'invoiceDate':
        const dateStr = invoiceData.date ? new Date(invoiceData.date).toLocaleDateString() : new Date().toLocaleDateString()
        rightY = addText(doc, `Date: ${dateStr}`, rightX, rightY, {
          fontSize: 6,
          color: [100, 100, 100],
          align: 'right',
        })
        break

      case 'gstNumber':
        if (config.gstNumber) {
          rightY = addText(doc, `GST/Tax ID: ${config.gstNumber}`, rightX, rightY, {
            fontSize: 6,
            fontStyle: 'bold',
            align: 'right',
          })
        }
        break
    }
  })

  // Draw bottom border
  const maxY = Math.max(currentY, rightY)
  addLine(doc, margin, maxY + 2, pageWidth - margin, maxY + 2, [0, 0, 0], 0.8)

  return maxY + 5
}

/**
 * Render Bill To Section
 */
const renderBillTo = (doc, config, invoiceData, margin, contentWidth, yPos, elements, pageWidth) => {
  let currentY = yPos
  const leftColX = margin
  const rightColX = margin + contentWidth / 2 + 5
  const colWidth = contentWidth / 2 - 10

  // Left column: Billed To
  const leftElements = elements.filter((k) => ['billedToLabel', 'billedToName', 'customerPhone', 'customerTaxId'].includes(k))
  let leftY = currentY

  leftElements.forEach((elementKey) => {
    switch (elementKey) {
      case 'billedToLabel':
        leftY = addText(doc, 'BILLED TO', leftColX, leftY, {
          fontSize: 6,
          fontStyle: 'bold',
          color: [100, 100, 100],
        })
        break

      case 'billedToName':
        leftY = addText(doc, invoiceData.customerName || 'Sarah Jenkins', leftColX, leftY, {
          fontSize: 9,
          fontStyle: 'bold',
        })
        break

      case 'customerPhone':
        if (config.showCustomerPhone) {
          leftY = addText(doc, invoiceData.customerPhone || '+1 (555) 234-5678', leftColX, leftY, {
            fontSize: 7,
            color: [80, 80, 80],
          })
        }
        break

      case 'customerTaxId':
        if (config.showCustomerPhone) {
          leftY = addText(doc, invoiceData.customerTaxId || 'Tax: TX-99821', leftColX, leftY, {
            fontSize: 6,
            color: [100, 100, 100],
          })
        }
        break
    }
  })

  // Right column: Payment Status
  const rightElements = elements.filter((k) => ['paymentStatusLabel', 'paymentStatus', 'paymentMode'].includes(k))
  let rightY = currentY

  rightElements.forEach((elementKey) => {
    switch (elementKey) {
      case 'paymentStatusLabel':
        rightY = addText(doc, 'PAYMENT STATUS', rightColX, rightY, {
          fontSize: 6,
          fontStyle: 'bold',
          color: [100, 100, 100],
          align: 'right',
        })
        break

      case 'paymentStatus':
        const status = invoiceData.paymentStatus || 'PAID IN FULL'
        // Draw status badge
        doc.setFillColor(0, 0, 0)
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        const textWidth = doc.getTextWidth(status) + 4
        doc.roundedRect(rightColX - textWidth, rightY - 3, textWidth, 6, 1, 1, 'F')
        doc.text(status, rightColX - 2, rightY + 1, { align: 'right' })
        doc.setTextColor(0, 0, 0)
        rightY += 8
        break

      case 'paymentMode':
        rightY = addText(doc, invoiceData.paymentMode || 'Mode: CASH / CARD', rightColX, rightY, {
          fontSize: 6,
          color: [80, 80, 80],
          align: 'right',
        })
        break
    }
  })

  // Draw bottom border
  const maxY = Math.max(leftY, rightY)
  addLine(doc, margin, maxY + 1, pageWidth - margin, maxY + 1, [0, 0, 0], 0.3)

  return maxY + 3
}

/**
 * Render Items Table Section
 */
const renderItemsTable = (doc, config, invoiceData, margin, contentWidth, yPos, activeColumns) => {
  let currentY = yPos

  // Table header note
  currentY = addText(doc, 'Drag column headers horizontally to reorder', margin, currentY, {
    fontSize: 5,
    color: [120, 120, 120],
    fontStyle: 'italic',
  })
  currentY += 2

  // Prepare table data
  const items = invoiceData.items || [
    { item: 'Premium Coffee Beans', sku: 'BEV-001', qty: 2, price: 18.5, discount: '0%', tax: '8.5%', total: 37.0, customVal: 'Sample A' },
    { item: 'Artisan Sourdough Loaf', sku: 'BAK-001', qty: 1, price: 6.2, discount: '$1.00', tax: '8.5%', total: 5.2, customVal: 'Sample B' },
    { item: 'Organic Almond Milk', sku: 'BEV-002', qty: 2, price: 4.75, discount: '0%', tax: '8.5%', total: 9.5, customVal: 'Sample C' },
  ]

  const head = activeColumns.map((col) => col.label)
  const body = items.map((row) =>
    activeColumns.map((col) => {
      switch (col.id) {
        case 'item':
          return row.item
        case 'sku':
          return row.sku
        case 'qty':
          return row.qty.toString()
        case 'price':
          return `$${row.price.toFixed(2)}`
        case 'discount':
          return row.discount
        case 'tax':
          return row.tax
        case 'total':
          return `$${row.total.toFixed(2)}`
        default:
          return row.customVal || '—'
      }
    })
  )

  // Column styles based on alignment
  const columnStyles = {}
  activeColumns.forEach((col, index) => {
    columnStyles[index] = {
      halign: col.align === 'center' ? 'center' : col.align === 'right' ? 'right' : 'left',
      fontStyle: col.id === 'total' ? 'bold' : 'normal',
    }
  })

  // Use autoTable for the items table
  autoTable(doc, {
    startY: currentY,
    head: [head],
    body: body,
    margin: { left: margin, right: margin },
    theme: 'plain',
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontSize: 6,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 6,
      textColor: [0, 0, 0],
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: columnStyles,
    tableWidth: 'auto',
    didDrawPage: (data) => {
      currentY = data.cursor.y
    },
  })

  return currentY + 3
}

/**
 * Render Totals Section
 */
const renderTotals = (doc, config, invoiceData, margin, contentWidth, yPos, elements) => {
  let currentY = yPos
  const totalsX = margin + contentWidth - 60 // Right aligned

  elements.forEach((elementKey) => {
    switch (elementKey) {
      case 'subtotal':
        currentY = addText(doc, 'Subtotal:', totalsX, currentY, { fontSize: 7, align: 'left' })
        currentY = addText(doc, `$${(invoiceData.subtotal || 51.70).toFixed(2)}`, totalsX + 55, currentY - 3.5, {
          fontSize: 7,
          fontStyle: 'bold',
          align: 'right',
        })
        break

      case 'taxBreakdown':
        if (config.showTaxBreakdown) {
          currentY = addText(doc, 'Tax / GST (8.5%):', totalsX, currentY, { fontSize: 6.5, color: [80, 80, 80], align: 'left' })
          currentY = addText(doc, `+$${(invoiceData.tax || 4.39).toFixed(2)}`, totalsX + 55, currentY - 3.5, {
            fontSize: 6.5,
            align: 'right',
          })
        }
        break

      case 'grandTotal':
        // Draw line
        addLine(doc, totalsX, currentY, totalsX + 60, currentY, [0, 0, 0], 0.5)
        currentY += 2
        currentY = addText(doc, 'Grand Total:', totalsX, currentY, { fontSize: 8, fontStyle: 'bold', align: 'left' })
        currentY = addText(doc, `$${(invoiceData.grandTotal || 56.09).toFixed(2)}`, totalsX + 55, currentY - 4, {
          fontSize: 9,
          fontStyle: 'bold',
          align: 'right',
        })
        break
    }
  })

  return currentY + 3
}

/**
 * Render Footer Section
 */
const renderFooter = (doc, config, invoiceData, margin, contentWidth, yPos, elements, pageWidth, pageHeight) => {
  let currentY = yPos

  // Add top border
  addLine(doc, margin, currentY, pageWidth - margin, currentY, [0, 0, 0], 0.3)
  currentY += 4

  const leftColX = margin
  const rightColX = margin + contentWidth / 2 + 5

  // Terms and QR Code (side by side)
  const topElements = elements.filter((k) => ['terms', 'qrCode'].includes(k))

  if (topElements.includes('terms') && config.showTerms) {
    currentY = addText(doc, 'TERMS & CONDITIONS', leftColX, currentY, {
      fontSize: 6,
      fontStyle: 'bold',
      color: [100, 100, 100],
    })
    currentY = addText(doc, config.termsAndConditions, leftColX, currentY, {
      fontSize: 6,
      color: [80, 80, 80],
      maxWidth: contentWidth / 2 - 15,
    })
  }

  if (topElements.includes('qrCode') && config.showQrCode) {
    let qrY = yPos + 4
    const qrSize = 25

    if (config.qrCodeDataUrl) {
      try {
        doc.addImage(config.qrCodeDataUrl, 'PNG', rightColX, qrY, qrSize, qrSize)
      } catch (e) {
        // Fallback - draw a placeholder
        doc.setDrawColor(0, 0, 0)
        doc.setLineWidth(0.5)
        doc.rect(rightColX, qrY, qrSize, qrSize)
        doc.setFontSize(4)
        doc.text('QR', rightColX + qrSize / 2, qrY + qrSize / 2 + 1.5, { align: 'center' })
      }
    } else {
      // Default QR code placeholder
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.5)
      doc.rect(rightColX, qrY, qrSize, qrSize)
      doc.setFontSize(4)
      doc.text('QR', rightColX + qrSize / 2, qrY + qrSize / 2 + 1.5, { align: 'center' })
    }

    if (config.showQrCodeText) {
      qrY = addText(doc, 'Scan to Pay with UPI', rightColX + qrSize / 2, qrY + qrSize + 2, {
        fontSize: 5,
        fontStyle: 'bold',
        align: 'center',
        color: [80, 80, 80],
      })
    } else if (!config.qrCodeDataUrl) {
      qrY = addText(doc, 'Scan To Verify', rightColX + qrSize / 2, qrY + qrSize + 2, {
        fontSize: 5,
        fontStyle: 'bold',
        align: 'center',
        color: [80, 80, 80],
      })
    }
    // Note: QR code is positioned absolutely, so we don't update currentY from it
  }

  // Signature
  if (elements.includes('signature') && config.showSignature) {
    const sigY = currentY + 15
    addLine(doc, rightColX + 20, sigY, rightColX + 80, sigY, [0, 0, 0], 0.5)
    addText(doc, 'Authorized Signature', rightColX + 50, sigY + 3, {
      fontSize: 6,
      fontStyle: 'bold',
      align: 'center',
    })
    currentY = sigY + 5
  }

  // Footer Note
  if (elements.includes('footerNote') && config.footerNote) {
    currentY += 5
    addLine(doc, margin, currentY, pageWidth - margin, currentY, [0, 0, 0], 0.3)
    currentY += 3
    currentY = addText(doc, config.footerNote, pageWidth / 2, currentY, {
      fontSize: 6,
      fontStyle: 'bold',
      color: [100, 100, 100],
      align: 'center',
    })
  }

  return currentY
}

// Re-export for convenience
export { getStoredTemplateConfig } from '../utils/pdfTemplateStorage'