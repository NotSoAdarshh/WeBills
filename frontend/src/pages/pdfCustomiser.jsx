import { useState, useEffect } from 'react'
import {
  Upload,
  QrCode,
  FileText,
  Building,
  RotateCcw,
  Save,
  CheckCircle2,
  Columns,
  Eye,
  EyeOff,
  Edit3,
} from 'lucide-react'
import {
  defaultTemplateConfig,
  defaultInvoiceColumns,
  getStoredTemplateConfig,
  saveStoredTemplateConfig,
} from '../utils/pdfTemplateStorage'

export default function PdfCustomiser() {
  const [config, setConfig] = useState(getStoredTemplateConfig)
  const [notification, setNotification] = useState(null)
  const [editingColumnId, setEditingColumnId] = useState(null)

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

  // Column management handlers
  const handleToggleColumn = (colId) => {
    const updatedColumns = (config.columns || defaultInvoiceColumns).map((col) => {
      if (col.id === colId && !col.locked) {
        return { ...col, enabled: !col.enabled }
      }
      return col
    })
    handleChange('columns', updatedColumns)
  }

  const handleUpdateColumnLabel = (colId, newLabel) => {
    const updatedColumns = (config.columns || defaultInvoiceColumns).map((col) => {
      if (col.id === colId) {
        return { ...col, label: newLabel }
      }
      return col
    })
    handleChange('columns', updatedColumns)
  }

  const handleUpdateColumnAlign = (colId, align) => {
    const updatedColumns = (config.columns || defaultInvoiceColumns).map((col) => {
      if (col.id === colId) {
        return { ...col, align }
      }
      return col
    })
    handleChange('columns', updatedColumns)
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

  const activeColumns = (config.columns || defaultInvoiceColumns).filter((c) => c.enabled)

  // Mock invoice line items for previewing
  const mockItems = [
    {
      item: 'Premium Coffee Beans',
      sku: 'BEV-001',
      qty: 2,
      price: 18.5,
      discount: '0%',
      tax: '8.5%',
      total: 37.0,
    },
    {
      item: 'Artisan Sourdough Loaf',
      sku: 'BAK-001',
      qty: 1,
      price: 6.2,
      discount: '$1.00',
      tax: '8.5%',
      total: 5.2,
    },
    {
      item: 'Organic Almond Milk',
      sku: 'BEV-002',
      qty: 2,
      price: 4.75,
      discount: '0%',
      tax: '8.5%',
      total: 9.5,
    },
  ]

  return (
    <div className="w-full flex flex-col font-sans select-none">
      {/* Page Header */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-white" />
            Bill PDF Customizer
          </h1>
          <p className="text-xs text-white/70 mt-1">
            Configure store metadata, columns, and layout with high-contrast monochrome PDF preview
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
            Auto-Saved
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

          {/* Section 2: Invoice Columns Configuration (Type & Count) */}
          <div className="rounded-2xl border border-white/20 bg-black p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Columns className="h-4 w-4 text-white" />
                Invoice Columns & Table Layout
              </h2>
              <span className="text-xs text-white/60 font-mono">
                {activeColumns.length} Active Columns
              </span>
            </div>

            <p className="text-xs text-white/60">
              Toggle which columns appear on the printed bill, rename column header titles, and choose alignment.
            </p>

            <div className="divide-y divide-white/10">
              {(config.columns || defaultInvoiceColumns).map((col) => {
                const isEditing = editingColumnId === col.id

                return (
                  <div key={col.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Toggle Visibility */}
                      <button
                        type="button"
                        disabled={col.locked}
                        onClick={() => handleToggleColumn(col.id)}
                        title={col.locked ? 'Required column' : col.enabled ? 'Hide column' : 'Show column'}
                        className={`h-7 w-7 rounded-lg border flex items-center justify-center transition-colors ${
                          col.locked
                            ? 'border-white/20 bg-white/10 text-white opacity-60 cursor-not-allowed'
                            : col.enabled
                            ? 'border-white bg-white text-black'
                            : 'border-white/20 bg-black text-white/40 hover:text-white hover:border-white/50'
                        }`}
                      >
                        {col.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>

                      {/* Column Title Label */}
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={col.label}
                              onChange={(e) => handleUpdateColumnLabel(col.id, e.target.value)}
                              className="h-7 px-2 rounded-lg bg-black border border-white text-white text-xs focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => setEditingColumnId(null)}
                              className="h-7 px-2 rounded-lg bg-white text-black text-[11px] font-semibold"
                            >
                              Done
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-xs font-medium truncate ${
                                col.enabled ? 'text-white' : 'text-white/40 line-through'
                              }`}
                            >
                              {col.label}
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingColumnId(col.id)}
                              className="text-white/40 hover:text-white"
                              title="Rename column"
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        <span className="text-[10px] text-white/40 font-mono block">
                          type: {col.id} {col.locked ? '(locked)' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Column Text Alignment Selector */}
                    <div className="flex items-center gap-1">
                      {['left', 'center', 'right'].map((alignOpt) => (
                        <button
                          key={alignOpt}
                          type="button"
                          onClick={() => handleUpdateColumnAlign(col.id, alignOpt)}
                          className={`h-6 px-2 rounded text-[10px] uppercase font-mono transition-colors ${
                            col.align === alignOpt
                              ? 'bg-white text-black font-bold'
                              : 'border border-white/20 text-white/60 hover:text-white'
                          }`}
                        >
                          {alignOpt[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
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

        {/* RIGHT PREVIEW PANEL (50% => col-span-6, Pure White Background with Pure Black Text & Elements) */}
        <section className="lg:col-span-6 sticky top-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs uppercase font-semibold tracking-wider text-white/70 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-white" />
              Live Printable PDF Invoice Replica
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full border border-white/20 bg-white/[0.04] text-white/80">
              Monochrome • White Paper
            </span>
          </div>

          {/* Invoice Document Canvas: Solid White Background, Pure Black Elements & Typography */}
          <div
            className="rounded-2xl border border-black bg-white text-black p-6 md:p-8 shadow-2xl transition-all duration-200"
            style={{
              boxShadow: '0 20px 40px -15px rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Invoice Header */}
            <div className="pb-4 mb-4 flex items-start justify-between gap-4 border-b-2 border-black">
              <div className="flex items-center gap-3">
                {config.logoDataUrl ? (
                  <img
                    src={config.logoDataUrl}
                    alt="Store Logo"
                    className="h-12 w-12 object-contain rounded-lg border border-black"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-black text-white flex items-center justify-center font-bold text-base shadow-sm">
                    WB
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-black tracking-tight">
                    {config.companyName || 'Store Name'}
                  </h3>
                  <p className="text-[11px] text-neutral-700 mt-0.5 max-w-[280px]">
                    {config.companyAddress}
                  </p>
                  <p className="text-[10px] text-neutral-600">{config.companyContact}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xl font-black tracking-wider uppercase block text-black">
                  INVOICE
                </span>
                <span className="text-xs font-mono text-neutral-800 block mt-0.5 font-bold">
                  #INV-2026-0891
                </span>
                <span className="text-[10px] text-neutral-600 block">Date: 2026-10-31</span>
                {config.gstNumber && (
                  <span className="text-[10px] font-mono text-black font-semibold block mt-1">
                    GST/Tax ID: {config.gstNumber}
                  </span>
                )}
              </div>
            </div>

            {/* Bill To & Meta Section */}
            <div className="grid grid-cols-2 gap-4 pb-4 mb-4 border-b border-black/20 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block mb-1">
                  Billed To
                </span>
                <span className="font-bold text-black block">Sarah Jenkins</span>
                {config.showCustomerPhone && (
                  <>
                    <span className="text-neutral-700 block text-[11px]">+1 (555) 234-5678</span>
                    <span className="text-neutral-600 block text-[10px] font-mono">Tax: TX-99821</span>
                  </>
                )}
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 block mb-1">
                  Payment Status
                </span>
                <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-black bg-black text-white">
                  PAID IN FULL
                </span>
                <span className="text-neutral-700 block text-[10px] mt-1 font-medium">Mode: CASH / CARD</span>
              </div>
            </div>

            {/* Dynamic Line Items Table (Customizable Columns & Headers) */}
            <div className="mb-4 overflow-hidden rounded-lg border border-black">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-black text-white border-b border-black">
                    {activeColumns.map((col) => (
                      <th
                        key={col.id}
                        className={`py-2 px-3 font-bold text-[10px] uppercase tracking-wider ${
                          col.align === 'center'
                            ? 'text-center'
                            : col.align === 'right'
                            ? 'text-right'
                            : 'text-left'
                        }`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/20 bg-white">
                  {mockItems.map((row, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50">
                      {activeColumns.map((col) => {
                        const alignClass =
                          col.align === 'center'
                            ? 'text-center'
                            : col.align === 'right'
                            ? 'text-right'
                            : 'text-left'

                        if (col.id === 'item') {
                          return (
                            <td key={col.id} className={`py-2 px-3 text-black ${alignClass}`}>
                              <span className="font-semibold block">{row.item}</span>
                            </td>
                          )
                        }

                        if (col.id === 'sku') {
                          return (
                            <td key={col.id} className={`py-2 px-3 text-neutral-700 font-mono text-[11px] ${alignClass}`}>
                              {row.sku}
                            </td>
                          )
                        }

                        if (col.id === 'qty') {
                          return (
                            <td key={col.id} className={`py-2 px-3 text-black font-mono font-medium ${alignClass}`}>
                              {row.qty}
                            </td>
                          )
                        }

                        if (col.id === 'price') {
                          return (
                            <td key={col.id} className={`py-2 px-3 text-black font-mono ${alignClass}`}>
                              ${row.price.toFixed(2)}
                            </td>
                          )
                        }

                        if (col.id === 'discount') {
                          return (
                            <td key={col.id} className={`py-2 px-3 text-neutral-700 font-mono ${alignClass}`}>
                              {row.discount}
                            </td>
                          )
                        }

                        if (col.id === 'tax') {
                          return (
                            <td key={col.id} className={`py-2 px-3 text-neutral-700 font-mono ${alignClass}`}>
                              {row.tax}
                            </td>
                          )
                        }

                        if (col.id === 'total') {
                          return (
                            <td key={col.id} className={`py-2 px-3 text-black font-bold font-mono ${alignClass}`}>
                              ${row.total.toFixed(2)}
                            </td>
                          )
                        }

                        return <td key={col.id} className={`py-2 px-3 ${alignClass}`}>—</td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Subtotal & Calculations */}
            <div className="flex flex-col items-end gap-1 mb-5 text-xs text-neutral-800">
              <div className="flex justify-between w-48">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold text-black">$51.70</span>
              </div>
              {config.showTaxBreakdown && (
                <div className="flex justify-between w-48 text-[11px] text-neutral-600">
                  <span>Tax / GST (8.5%):</span>
                  <span className="font-mono text-black">+$4.39</span>
                </div>
              )}
              <div className="flex justify-between w-48 pt-2 mt-1 border-t-2 border-black text-sm font-bold text-black">
                <span>Grand Total:</span>
                <span className="font-mono text-base font-black text-black">$56.09</span>
              </div>
            </div>

            {/* Bottom Section: QR Code, Terms & Signature */}
            <div className="pt-4 border-t border-black/20 flex flex-col gap-4 text-xs">
              <div className="flex items-start justify-between gap-4">
                {/* Terms and conditions */}
                {config.showTerms && (
                  <div className="flex-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-600 block mb-1">
                      Terms & Conditions
                    </span>
                    <p className="text-[10px] text-neutral-700 whitespace-pre-line leading-relaxed">
                      {config.termsAndConditions}
                    </p>
                  </div>
                )}

                {/* QR Code */}
                {config.showQrCode && (
                  <div className="flex flex-col items-center shrink-0 p-2 rounded-lg border border-black bg-neutral-100">
                    <QrCode className="h-12 w-12 text-black" />
                    <span className="text-[9px] text-neutral-700 mt-1 uppercase font-mono font-bold">
                      Scan To Verify
                    </span>
                  </div>
                )}
              </div>

              {/* Signature Line */}
              {config.showSignature && (
                <div className="pt-6 flex justify-end">
                  <div className="text-center w-40">
                    <div className="border-b-2 border-black pb-1 mb-1" />
                    <span className="text-[10px] uppercase text-black font-bold tracking-wider">
                      Authorized Signature
                    </span>
                  </div>
                </div>
              )}

              {/* Footer Note */}
              {config.footerNote && (
                <p className="text-center text-[10px] text-neutral-600 pt-2 border-t border-black/20 font-medium">
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
