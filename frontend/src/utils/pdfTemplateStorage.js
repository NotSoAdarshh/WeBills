const PDF_TEMPLATE_STORAGE_KEY = 'webills_pdf_template_config'

export const defaultTemplateConfig = {
  companyName: 'WeBills Retail & Cafe',
  companyAddress: '450 Innovation Parkway, Suite 100, Silicon Valley, CA 94025',
  companyContact: '+1 (800) 555-0199 | billing@webills.local',
  gstNumber: 'GST-US-89210-A',
  accentColor: '#3B82F6', // Electric Blue or customized
  showCustomerPhone: true,
  showTaxBreakdown: true,
  showTerms: true,
  showSignature: true,
  showQrCode: true,
  termsAndConditions:
    '1. Goods once sold can be returned within 7 days in original condition.\n2. Invoices are computer generated and valid without physical seal.',
  footerNote: 'Thank you for your business! Please visit us again.',
  logoDataUrl: '',
}

export const getStoredTemplateConfig = () => {
  try {
    const data = localStorage.getItem(PDF_TEMPLATE_STORAGE_KEY)
    if (!data) return defaultTemplateConfig
    const parsed = JSON.parse(data)
    return { ...defaultTemplateConfig, ...parsed }
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
