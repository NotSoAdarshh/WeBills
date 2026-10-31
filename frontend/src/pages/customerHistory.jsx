import { useState, useEffect, useMemo } from 'react'
import {
  UserCheck,
  Search,
  FileDown,
  Printer,
  Ban,
  Receipt,
  Phone,
  Mail,
  FileBadge,
  Calendar,
  CheckCircle2,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertCircle,
  X,
  CreditCard,
  Banknote,
  QrCode,
} from 'lucide-react'
import { getStoredCustomers } from '../utils/customerStorage'
import { getStoredCustomerInvoices, saveStoredCustomerInvoices } from '../utils/invoiceStorage'

export default function CustomerHistory({ selectedCustomerIdProp }) {
  const [customers, setCustomers] = useState(getStoredCustomers)
  const [invoices, setInvoices] = useState(getStoredCustomerInvoices)
  const [internalSelectedCustomerId, setInternalSelectedCustomerId] = useState(null)
  const [searchFilter, setSearchFilter] = useState('')
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState(null)
  const [notification, setNotification] = useState(null)

  const selectedCustomerId =
    internalSelectedCustomerId || selectedCustomerIdProp || 'c2'

  useEffect(() => {
    const handleSync = () => {
      setCustomers(getStoredCustomers())
      setInvoices(getStoredCustomerInvoices())
    }
    window.addEventListener('webills_customers_updated', handleSync)
    window.addEventListener('webills_invoices_updated', handleSync)
    window.addEventListener('storage', handleSync)
    return () => {
      window.removeEventListener('webills_customers_updated', handleSync)
      window.removeEventListener('webills_invoices_updated', handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [])

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || customers[0] || {
      id: 'c2',
      name: 'Sarah Jenkins',
      phone: '+1 (555) 234-5678',
      email: 'sarah.j@example.com',
      taxId: 'TX-99821',
      totalSpent: 1420.5,
      totalVisits: 18,
      createdAt: '2026-03-12',
    }
  }, [customers, selectedCustomerId])

  // Invoices issued ONLY to the selected customer
  const customerInvoices = useMemo(() => {
    return invoices.filter((inv) => inv.customerId === selectedCustomer.id)
  }, [invoices, selectedCustomer.id])

  // Search filtered customer invoices
  const filteredCustomerInvoices = useMemo(() => {
    if (!searchFilter.trim()) return customerInvoices
    const query = searchFilter.toLowerCase().trim()
    return customerInvoices.filter(
      (inv) =>
        inv.billNo.toLowerCase().includes(query) ||
        inv.status.toLowerCase().includes(query) ||
        inv.paymentMethod.toLowerCase().includes(query) ||
        inv.date.includes(query)
    )
  }, [customerInvoices, searchFilter])

  // Quick Metrics Calculations
  const lifetimeSpent = useMemo(() => {
    return customerInvoices
      .filter((inv) => inv.status !== 'CANCELLED')
      .reduce((acc, inv) => acc + (inv.grandTotal || 0), 0)
  }, [customerInvoices])

  const billsCount = customerInvoices.length
  const averageOrderValue = billsCount > 0 ? lifetimeSpent / billsCount : 0

  // Action Triggers
  const handleDownloadPdf = (bill) => {
    showNotification(`Downloading PDF invoice replica for ${bill.billNo}`)
  }

  const handleReprintReceipt = (bill) => {
    showNotification(`Reprint signal sent to thermal printer for ${bill.billNo}`)
  }

  const handleCancelBill = (billNo) => {
    if (window.confirm(`Issue refund / cancel bill ${billNo}? This cannot be undone.`)) {
      const updated = invoices.map((inv) =>
        inv.billNo === billNo ? { ...inv, status: 'CANCELLED' } : inv
      )
      setInvoices(updated)
      saveStoredCustomerInvoices(updated)
      showNotification(`Bill ${billNo} has been marked as CANCELLED`)
      if (selectedInvoiceForModal?.billNo === billNo) {
        setSelectedInvoiceForModal((prev) => ({ ...prev, status: 'CANCELLED' }))
      }
    }
  }

  const showNotification = (msg) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3000)
  }

  return (
    <div className="w-full flex flex-col font-sans select-none">
      {/* Page Header Bar */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <UserCheck className="h-6 w-6 text-white" />
            Customer Billing History
          </h1>
          <p className="text-xs text-white/70 mt-1">
            View, audit, reprint, and download invoices issued exclusively to selected customer profile
          </p>
        </div>

        {/* Customer Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-white/60 font-medium">Select Profile:</label>
          <select
            value={selectedCustomerId}
            onChange={(e) => setInternalSelectedCustomerId(e.target.value)}
            className="h-10 px-3 rounded-xl bg-black border border-white/20 text-white text-xs focus:outline-none focus:border-white cursor-pointer"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id} className="bg-black text-white">
                {c.name} {c.phone !== 'N/A' ? `(${c.phone})` : ''}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="mb-4 p-3 rounded-xl border border-white/30 bg-black flex items-center gap-2 text-xs text-white shadow-xl animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* TOP PROFILE SUMMARY BANNER */}
      <div className="rounded-2xl border border-white/20 bg-black p-5 md:p-6 mb-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Customer Bio */}
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl border border-white/30 bg-white/[0.06] flex items-center justify-center font-bold text-lg text-white shrink-0">
              {selectedCustomer.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {selectedCustomer.name}
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-white/20 bg-white/[0.04] text-white/80">
                  {selectedCustomer.id}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-white/70">
                {selectedCustomer.phone !== 'N/A' && (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="h-3.5 w-3.5 text-white/50" />
                    {selectedCustomer.phone}
                  </span>
                )}
                {selectedCustomer.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-white/50" />
                    {selectedCustomer.email}
                  </span>
                )}
                {selectedCustomer.taxId !== 'N/A' && (
                  <span className="flex items-center gap-1 font-mono">
                    <FileBadge className="h-3.5 w-3.5 text-white/50" />
                    Tax: {selectedCustomer.taxId}
                  </span>
                )}
                {selectedCustomer.createdAt && (
                  <span className="flex items-center gap-1 text-[11px] text-white/50">
                    <Calendar className="h-3.5 w-3.5 text-white/40" />
                    Member since: {selectedCustomer.createdAt}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metric Cards */}
          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="p-3.5 rounded-xl border border-white/20 bg-black min-w-[120px]">
              <div className="flex items-center gap-1.5 text-white/60 mb-1">
                <DollarSign className="h-3.5 w-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">Lifetime Spent</span>
              </div>
              <span className="text-lg font-bold font-mono text-white">
                ${lifetimeSpent.toFixed(2)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-white/20 bg-black min-w-[110px]">
              <div className="flex items-center gap-1.5 text-white/60 mb-1">
                <ShoppingBag className="h-3.5 w-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">Total Bills</span>
              </div>
              <span className="text-lg font-bold font-mono text-white">
                {billsCount}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-white/20 bg-black min-w-[120px]">
              <div className="flex items-center gap-1.5 text-white/60 mb-1">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">Avg Order Value</span>
              </div>
              <span className="text-lg font-bold font-mono text-white">
                ${averageOrderValue.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER SEARCH BAR */}
      <div className="mb-4 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
        <input
          type="text"
          placeholder="Filter invoices by bill number, status (PAID/CANCELLED), payment mode, or date..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-black border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:border-white transition-colors"
        />
        {searchFilter && (
          <button
            type="button"
            onClick={() => setSearchFilter('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* BOTTOM INVOICES TABLE */}
      <div className="rounded-2xl border border-white/20 bg-black overflow-hidden flex-1 flex flex-col shadow-2xl">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/20 bg-white/[0.04] text-white/70">
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Bill Number</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Date & Time</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Items</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Payment Mode</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Grand Total</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-center">Status</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredCustomerInvoices.map((bill) => (
                <tr key={bill.billNo} className="hover:bg-white/[0.03] transition-colors group">
                  <td className="py-3.5 px-4 font-mono font-semibold text-white">
                    <button
                      type="button"
                      onClick={() => setSelectedInvoiceForModal(bill)}
                      className="hover:underline flex items-center gap-1.5 text-left"
                    >
                      <Receipt className="h-3.5 w-3.5 text-white/60" />
                      {bill.billNo}
                    </button>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="text-white block font-mono">{bill.date}</span>
                    <span className="text-[10px] text-white/50">{bill.time}</span>
                  </td>

                  <td className="py-3.5 px-4 text-white/80 font-mono">
                    {bill.itemsCount} units
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-white/80">
                      {bill.paymentMethod === 'CARD' && <CreditCard className="h-3 w-3 text-white/50" />}
                      {bill.paymentMethod === 'CASH' && <Banknote className="h-3 w-3 text-white/50" />}
                      {bill.paymentMethod === 'UPI' && <QrCode className="h-3 w-3 text-white/50" />}
                      {bill.paymentMethod}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-bold text-white text-sm">
                    ${bill.grandTotal.toFixed(2)}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        bill.status === 'PAID'
                          ? 'border border-white bg-white text-black'
                          : 'border border-white/30 text-white/60 line-through'
                      }`}
                    >
                      {bill.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Download PDF Trigger */}
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(bill)}
                        title="Download PDF"
                        className="h-8 w-8 rounded-lg border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                      </button>

                      {/* Reprint Thermal Receipt */}
                      <button
                        type="button"
                        onClick={() => handleReprintReceipt(bill)}
                        title="Reprint Receipt"
                        className="h-8 w-8 rounded-lg border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </button>

                      {/* Cancel Bill / Issue Refund */}
                      {bill.status !== 'CANCELLED' && (
                        <button
                          type="button"
                          onClick={() => handleCancelBill(bill.billNo)}
                          title="Issue Refund / Cancel Bill"
                          className="h-8 w-8 rounded-lg border border-white/20 flex items-center justify-center text-white/60 hover:border-white hover:text-white transition-colors"
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCustomerInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-white/60">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-white/40" />
                    <p className="text-sm font-medium">No invoices found for this customer</p>
                    <p className="text-xs text-white/50 mt-1">Try another search filter or select another profile</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Inspection Modal */}
      {selectedInvoiceForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-black p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/20">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-white" />
                <h3 className="text-base font-bold text-white font-mono">
                  {selectedInvoiceForModal.billNo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoiceForModal(null)}
                className="text-white/60 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3 text-xs">
              <div className="flex justify-between py-1 border-b border-white/10">
                <span className="text-white/60">Customer:</span>
                <span className="font-semibold text-white">{selectedCustomer.name}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-white/10 font-mono">
                <span className="text-white/60">Date & Time:</span>
                <span className="text-white">
                  {selectedInvoiceForModal.date} at {selectedInvoiceForModal.time}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-white/10 font-mono">
                <span className="text-white/60">Cashier:</span>
                <span className="text-white">{selectedInvoiceForModal.cashier}</span>
              </div>

              {/* Items Breakdown */}
              <div className="mt-2">
                <span className="text-[10px] uppercase font-bold text-white/60 tracking-wider block mb-2">
                  Purchased Items ({selectedInvoiceForModal.itemsCount} total)
                </span>
                <div className="rounded-xl border border-white/20 bg-white/[0.02] p-2.5 divide-y divide-white/10 font-mono">
                  {selectedInvoiceForModal.items.map((it, i) => (
                    <div key={i} className="py-1.5 flex justify-between items-center text-[11px]">
                      <div>
                        <span className="text-white block font-sans font-medium">{it.name}</span>
                        <span className="text-white/50 text-[10px]">{it.sku}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-white font-semibold">
                          {it.qty}x ${it.price.toFixed(2)}
                        </span>
                        <span className="block text-white/70 font-bold">${it.total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="mt-2 flex flex-col gap-1.5 pt-2 border-t border-white/20 font-mono">
                <div className="flex justify-between text-white/70">
                  <span>Subtotal:</span>
                  <span>${selectedInvoiceForModal.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Tax:</span>
                  <span>+${selectedInvoiceForModal.tax.toFixed(2)}</span>
                </div>
                {selectedInvoiceForModal.discount > 0 && (
                  <div className="flex justify-between text-white/70">
                    <span>Discount:</span>
                    <span>-${selectedInvoiceForModal.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-white/10">
                  <span>Grand Total:</span>
                  <span>${selectedInvoiceForModal.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/20">
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadPdf(selectedInvoiceForModal)
                    setSelectedInvoiceForModal(null)
                  }}
                  className="h-10 rounded-xl bg-white text-black font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-white/90"
                >
                  <FileDown className="h-4 w-4" />
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleReprintReceipt(selectedInvoiceForModal)
                    setSelectedInvoiceForModal(null)
                  }}
                  className="h-10 rounded-xl border border-white/30 text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-white/10"
                >
                  <Printer className="h-4 w-4" />
                  Reprint
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export { CustomerHistory }
