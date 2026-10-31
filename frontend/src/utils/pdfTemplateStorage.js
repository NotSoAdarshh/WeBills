const PDF_TEMPLATE_STORAGE_KEY = 'webills_pdf_template_config'

export const defaultInvoiceColumns = [
  { id: 'item', label: 'Item Description', align: 'left', enabled: true, locked: true },
  { id: 'sku', label: 'SKU / Code', align: 'left', enabled: true, locked: false },
  { id: 'qty', label: 'Qty', align: 'center', enabled: true, locked: false },
  { id: 'price', label: 'Unit Price', align: 'right', enabled: true, locked: false },
  { id: 'discount', label: 'Discount', align: 'right', enabled: false, locked: false },
  { id: 'tax', label: 'Tax Rate', align: 'right', enabled: false, locked: false },
  { id: 'total', label: 'Total Amount', align: 'right', enabled: true, locked: true },
]

export const defaultSectionOrder = [
  'header',
  'billTo',
  'itemsTable',
  'totals',
  'footer',
]

// Default element order within each section for drag-and-drop
export const defaultSectionElements = {
  header: [
    'logo',
    'companyName',
    'companyAddress',
    'companyContact',
    'invoiceTitle',
    'invoiceNumber',
    'invoiceDate',
    'gstNumber',
  ],
  billTo: [
    'billedToLabel',
    'billedToName',
    'customerPhone',
    'customerTaxId',
    'paymentStatusLabel',
    'paymentStatus',
    'paymentMode',
  ],
  itemsTable: [
    // Column order is handled separately via columns config
  ],
  totals: [
    'subtotal',
    'taxBreakdown',
    'grandTotal',
  ],
  footer: [
    'terms',
    'qrCode',
    'signature',
    'footerNote',
  ],
}

export const defaultTemplateConfig = {
  companyName: 'WeBills Retail & Cafe',
  companyAddress: '450 Innovation Parkway, Suite 100, Silicon Valley, CA 94025',
  companyContact: '+1 (800) 555-0199 | billing@webills.local',
  gstNumber: 'GST-US-89210-A',
  showCustomerPhone: true,
  showTaxBreakdown: true,
  showTerms: true,
  showSignature: true,
  showQrCode: true,
  showQrCodeText: true,
  columns: defaultInvoiceColumns,
  sectionOrder: defaultSectionOrder,
  termsAndConditions:
    '1. Goods once sold can be returned within 7 days in original condition.\n2. Invoices are computer generated and valid without physical seal.',
  footerNote: 'Thank you for your business! Please visit us again.',
  logoDataUrl: '',
  qrCodeDataUrl: '',
}

export const getStoredTemplateConfig = () => {
  try {
    const data = localStorage.getItem(PDF_TEMPLATE_STORAGE_KEY)
    if (!data) return defaultTemplateConfig
    const parsed = JSON.parse(data)
    return {
      ...defaultTemplateConfig,
      ...parsed,
      columns: Array.isArray(parsed.columns) && parsed.columns.length > 0 ? parsed.columns : defaultInvoiceColumns,
      sectionOrder: Array.isArray(parsed.sectionOrder) && parsed.sectionOrder.length > 0 ? parsed.sectionOrder : defaultSectionOrder,
      sectionElements: parsed.sectionElements ? { ...defaultSectionElements, ...parsed.sectionElements } : defaultSectionElements,
    }
  } catch {
    return defaultTemplateConfig
  }
}

export const saveStoredTemplateConfig = (config) => {
  try {
    localStorage.setItem(PDF_TEMPLATE_STORAGE_KEY, JSON.stringify(config))
    window.dispatchEvent(new Event('webills_pdf_template_updated'))
  } catch (err) {
    console.error('Failed to save PDF template config', err)
  }
}
