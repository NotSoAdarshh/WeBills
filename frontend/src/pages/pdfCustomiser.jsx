import { useState, useEffect } from 'react'
import {
  Palette,
  Upload,
  QrCode,
  FileText,
  Building,
  RotateCcw,
  Save,
  CheckCircle2,
} from 'lucide-react'
import {
  defaultTemplateConfig,
  getStoredTemplateConfig,
  saveStoredTemplateConfig,
} from '../utils/pdfTemplateStorage'

// Preset Accent Colors
const colorPresets = [
  { name: 'Pure White', value: '#FFFFFF' },
  { name: 'Electric Blue', value: '#3B82F6' },
  { name: 'Emerald Mint', value: '#10B981' },
  { name: 'Amber Gold', value: '#F59E0B' },
  { name: 'Violet Purple', value: '#8B5CF6' },
  { name: 'Crimson Red', value: '#EF4444' },
]

export default function PdfCustomiser() {
  const [config, setConfig] = useState(getStoredTemplateConfig)
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    const handleSync = () => {
      setConfig(getStoredTemplateConfig())
    }
    window.addEventListener('webills_pdf_template_updated', handleSync)
    return () => {
      window.removeEventListener('webills_pdf_template_updated', handleSync)
    }
  }, [])

  const handleChange = (field, value) => {
    setConfig((prev) => {
      const next = { ...prev, [field]: value }
      saveStoredTemplateConfig(next)
      return next
    })
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB limit.')
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        handleChange('logoDataUrl', reader.result)
        showNotification('Store logo updated')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLogo = () => {
    handleChange('logoDataUrl', '')
    showNotification('Store logo removed')
  }

  const handleResetDefaults = () => {
    if (window.confirm('Reset all template settings to system defaults?')) {
      setConfig(defaultTemplateConfig)
      saveStoredTemplateConfig(defaultTemplateConfig)
      showNotification('Template reset to default settings')
    }
  }

  const showNotification = (msg) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3000)
  }

  return (
    <div className="w-full flex flex-col font-sans select-none">
      {/* Page Header */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Palette className="h-6 w-6 text-white" />
            Bill PDF Customizer
          </h1>
          <p className="text-xs text-white/70 mt-1">
            Design invoice layout, store branding, accent colors, and toggles with live real-time preview
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="h-10 px-3.5 rounded-xl border border-white/20 bg-black hover:bg-white/10 text-white/80 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={() => showNotification('Template configuration saved')}
            className="h-10 px-4 rounded-xl bg-white text-black font-semibold text-xs flex items-center gap-1.5 hover:bg-white/90 transition-colors shadow-lg shadow-white/10"
          >
            <Save className="h-4 w-4" />
            Saved Automatically
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="mb-4 p-3 rounded-xl border border-white/30 bg-black flex items-center gap-2 text-xs text-white shadow-xl animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Split Screen Layout: 50% Configurator Form / 50% Live Sticky Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT CONFIGURATION PANEL (50% => col-span-6) */}
        <section className="lg:col-span-6 flex flex-col gap-6">
          {/* Section 1: Store Profile & Branding */}
          <div className="rounded-2xl border border-white/20 bg-black p-5 flex flex-col gap-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2 pb-2 border-b border-white/10">
              <Building className="h-4 w-4 text-white" />
              Store Profile & Branding
            </h2>

            {/* Logo Uploader */}
            <div>
              <label className="text-xs text-white/70 block mb-1.5">Store Logo (PNG / JPEG)</label>
              <div className="flex items-center gap-3">
                {config.logoDataUrl ? (
                  <div className="relative h-14 w-24 rounded-lg border border-white/20 bg-white/5 p-1 flex items-center justify-center overflow-hidden">
                    <img
                      src={config.logoDataUrl}
                      alt="Logo preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-14 w-24 rounded-lg border border-dashed border-white/30 bg-white/[0.02] flex flex-col items-center justify-center text-[10px] text-white/50">
                    <Building className="h-4 w-4 mb-0.5" />
                    No Logo
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="h-8 px-3 rounded-lg border border-white/20 bg-black hover:bg-white/10 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors w-fit">
                    <Upload className="h-3.5 w-3.5" />
                    Upload Logo
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  {config.logoDataUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="text-[11px] text-white/60 hover:text-white text-left underline underline-offset-2"
                    >
                      Remove Logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Store Name & Contact */}
            <div>
              <label className="text-xs text-white/70 block mb-1">Company / Store Name *</label>
              <input
                type="text"
                value={config.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-black border border-white/20 text-white text-xs focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="text-xs text-white/70 block mb-1">Store Address</label>
              <input
                type="text"
                value={config.companyAddress}
                onChange={(e) => handleChange('companyAddress', e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-black border border-white/20 text-white text-xs focus:outline-none focus:border-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/70 block mb-1">Contact Details</label>
                <input
                  type="text"
                  value={config.companyContact}
                  onChange={(e) => handleChange('companyContact', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-black border border-white/20 text-white text-xs focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs text-white/70 block mb-1">GST / Tax Number</label>
                <input
                  type="text"
                  value={config.gstNumber}
                  onChange={(e) => handleChange('gstNumber', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-black border border-white/20 text-white text-xs font-mono focus:outline-none focus:border-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Accent Color Picker */}
          <div className="rounded-2xl border border-white/20 bg-black p-5 flex flex-col gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2 pb-2 border-b border-white/10">
              <Palette className="h-4 w-4 text-white" />
              Theme & Accent Color
            </h2>

            <p className="text-xs text-white/60">
              Choose the primary highlight color for table headers, borders, and total badges on the generated PDF invoice.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {colorPresets.map((preset) => {
                const isSelected = config.accentColor.toLowerCase() === preset.value.toLowerCase()
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleChange('accentColor', preset.value)}
                    className={`h-9 px-3 rounded-xl border flex items-center gap-2 text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-white bg-white/10 text-white ring-1 ring-white'
                        : 'border-white/20 bg-black text-white/70 hover:border-white/50 hover:text-white'
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: preset.value }}
                    />
                    {preset.name}
                  </button>
                )
              })}

              {/* Custom Hex Color Picker */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-white/60">Custom:</span>
                <input
                  type="color"
                  value={config.accentColor}
                  onChange={(e) => handleChange('accentColor', e.target.value)}
                  className="h-8 w-10 cursor-pointer rounded border border-white/20 bg-black p-0.5"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Dynamic Section Toggles */}
          <div className="rounded-2xl border border-white/20 bg-black p-5 flex flex-col gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white pb-2 border-b border-white/10">
              Invoice Section Toggles
            </h2>

            <div className="divide-y divide-white/10">
              {[
                { key: 'showCustomerPhone', label: 'Show Customer Phone & Tax ID', desc: 'Display customer contact and registration meta' },
                { key: 'showTaxBreakdown', label: 'Show Tax / GST Breakdown', desc: 'Itemize taxable values and subtotal calculations' },
                { key: 'showTerms', label: 'Show Terms & Conditions', desc: 'Include return policies and store agreements on invoice footer' },
                { key: 'showSignature', label: 'Show Cashier Signature Line', desc: 'Authorized representative signature field' },
                { key: 'showQrCode', label: 'Show Payment QR Code', desc: 'Print UPI / digital instant payment verification QR code' },
              ].map((toggle) => (
                <div key={toggle.key} className="py-2.5 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-medium text-white block">{toggle.label}</span>
                    <span className="text-[11px] text-white/50">{toggle.desc}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleChange(toggle.key, !config[toggle.key])}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      config[toggle.key] ? 'bg-white' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                        config[toggle.key] ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Custom Notes & Policy Text */}
          <div className="rounded-2xl border border-white/20 bg-black p-5 flex flex-col gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white pb-2 border-b border-white/10">
              Custom Footer & Notes
            </h2>

            <div>
              <label className="text-xs text-white/70 block mb-1">Terms & Conditions</label>
              <textarea
                rows={3}
                value={config.termsAndConditions}
                onChange={(e) => handleChange('termsAndConditions', e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black border border-white/20 text-white text-xs focus:outline-none focus:border-white resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-white/70 block mb-1">Footer Greeting / Thank You Note</label>
              <input
                type="text"
                value={config.footerNote}
                onChange={(e) => handleChange('footerNote', e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-black border border-white/20 text-white text-xs focus:outline-none focus:border-white"
              />
            </div>
          </div>
        </section>

        {/* RIGHT PREVIEW PANEL (50% => col-span-6, Sticky live rendered replica) */}
        <section className="lg:col-span-6 sticky top-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs uppercase font-semibold tracking-wider text-white/70 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-white" />
              Live Interactive PDF Invoice Preview
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full border border-white/20 bg-white/[0.04] text-white/80">
              A4 Format Standard
            </span>
          </div>

          {/* Invoice Document Canvas Container */}
          <div
            className="rounded-2xl border border-white/30 bg-[#0C0C0C] text-white p-6 md:p-8 shadow-2xl transition-all duration-200"
            style={{
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)',
            }}
          >
            {/* Invoice Header */}
            <div
              className="pb-4 mb-4 flex items-start justify-between gap-4 border-b-2"
              style={{ borderColor: config.accentColor }}
            >
              <div className="flex items-center gap-3">
                {config.logoDataUrl ? (
                  <img
                    src={config.logoDataUrl}
                    alt="Store Logo"
                    className="h-12 w-12 object-contain rounded-lg border border-white/20"
                  />
                ) : (
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center font-bold text-base shadow-md"
                    style={{
                      backgroundColor: config.accentColor,
                      color: config.accentColor === '#FFFFFF' ? '#000000' : '#FFFFFF',
                    }}
                  >
                    WB
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {config.companyName || 'Store Name'}
                  </h3>
                  <p className="text-[11px] text-white/70 mt-0.5 max-w-[280px]">
                    {config.companyAddress}
                  </p>
                  <p className="text-[10px] text-white/50">{config.companyContact}</p>
                </div>
              </div>

              <div className="text-right">
                <span
                  className="text-lg font-black tracking-wider uppercase block"
                  style={{ color: config.accentColor }}
                >
                  INVOICE
                </span>
                <span className="text-xs font-mono text-white/80 block mt-0.5">
                  #INV-2026-0891
                </span>
                <span className="text-[10px] text-white/50 block">Date: 2026-10-31</span>
                {config.gstNumber && (
                  <span className="text-[10px] font-mono text-white/70 block mt-1">
                    Tax ID: {config.gstNumber}
                  </span>
                )}
              </div>
            </div>

            {/* Bill To & Meta Section */}
            <div className="grid grid-cols-2 gap-4 pb-4 mb-4 border-b border-white/10 text-xs">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">
                  Billed To
                </span>
                <span className="font-bold text-white block">Sarah Jenkins</span>
                {config.showCustomerPhone && (
                  <>
                    <span className="text-white/70 block text-[11px]">+1 (555) 234-5678</span>
                    <span className="text-white/50 block text-[10px] font-mono">Tax: TX-99821</span>
                  </>
                )}
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">
                  Payment Status
                </span>
                <span
                  className="inline-block px-2 py-0.5 rounded text-[11px] font-bold"
                  style={{
                    backgroundColor: config.accentColor,
                    color: config.accentColor === '#FFFFFF' ? '#000000' : '#FFFFFF',
                  }}
                >
                  PAID IN FULL
                </span>
                <span className="text-white/60 block text-[10px] mt-1">Mode: CASH / CARD</span>
              </div>
            </div>

            {/* Line Items Sample Table */}
            <div className="mb-4 overflow-hidden rounded-xl border border-white/20">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr
                    className="border-b"
                    style={{
                      backgroundColor: config.accentColor,
                      color: config.accentColor === '#FFFFFF' ? '#000000' : '#FFFFFF',
                    }}
                  >
                    <th className="py-2 px-3 font-bold text-[10px] uppercase">Item</th>
                    <th className="py-2 px-3 font-bold text-[10px] uppercase text-center">Qty</th>
                    <th className="py-2 px-3 font-bold text-[10px] uppercase text-right">Unit Price</th>
                    <th className="py-2 px-3 font-bold text-[10px] uppercase text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-black/40">
                  <tr>
                    <td className="py-2 px-3 text-white">
                      <span className="font-medium block">Premium Coffee Beans</span>
                      <span className="text-[10px] text-white/50 font-mono">BEV-001</span>
                    </td>
                    <td className="py-2 px-3 text-center text-white font-mono">2</td>
                    <td className="py-2 px-3 text-right text-white font-mono">$18.50</td>
                    <td className="py-2 px-3 text-right font-bold text-white font-mono">$37.00</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-white">
                      <span className="font-medium block">Artisan Sourdough Loaf</span>
                      <span className="text-[10px] text-white/50 font-mono">BAK-001</span>
                    </td>
                    <td className="py-2 px-3 text-center text-white font-mono">1</td>
                    <td className="py-2 px-3 text-right text-white font-mono">$6.20</td>
                    <td className="py-2 px-3 text-right font-bold text-white font-mono">$6.20</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Subtotal & Calculations */}
            <div className="flex flex-col items-end gap-1 mb-5 text-xs text-white/80">
              <div className="flex justify-between w-48">
                <span>Subtotal:</span>
                <span className="font-mono text-white">$43.20</span>
              </div>
              {config.showTaxBreakdown && (
                <div className="flex justify-between w-48 text-[11px] text-white/60">
                  <span>Tax / GST (8.5%):</span>
                  <span className="font-mono text-white">+$3.67</span>
                </div>
              )}
              <div
                className="flex justify-between w-48 pt-2 mt-1 border-t-2 text-sm font-bold text-white"
                style={{ borderColor: config.accentColor }}
              >
                <span>Grand Total:</span>
                <span className="font-mono text-base font-black text-white">$46.87</span>
              </div>
            </div>

            {/* Bottom Section: QR Code, Terms & Signature */}
            <div className="pt-4 border-t border-white/20 flex flex-col gap-4 text-xs">
              <div className="flex items-start justify-between gap-4">
                {/* Terms and conditions */}
                {config.showTerms && (
                  <div className="flex-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-white/60 block mb-1">
                      Terms & Conditions
                    </span>
                    <p className="text-[10px] text-white/60 whitespace-pre-line leading-relaxed">
                      {config.termsAndConditions}
                    </p>
                  </div>
                )}

                {/* QR Code */}
                {config.showQrCode && (
                  <div className="flex flex-col items-center shrink-0 p-2 rounded-lg border border-white/20 bg-white/[0.04]">
                    <QrCode className="h-12 w-12 text-white" />
                    <span className="text-[9px] text-white/60 mt-1 uppercase font-mono">
                      Scan To Verify
                    </span>
                  </div>
                )}
              </div>

              {/* Signature Line */}
              {config.showSignature && (
                <div className="pt-6 flex justify-end">
                  <div className="text-center w-40">
                    <div
                      className="border-b pb-1 mb-1"
                      style={{ borderColor: config.accentColor }}
                    />
                    <span className="text-[10px] uppercase text-white/60 tracking-wider">
                      Authorized Signature
                    </span>
                  </div>
                </div>
              )}

              {/* Footer Note */}
              {config.footerNote && (
                <p className="text-center text-[10px] text-white/50 pt-2 border-t border-white/10 font-medium">
                  {config.footerNote}
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
export { PdfCustomiser }
