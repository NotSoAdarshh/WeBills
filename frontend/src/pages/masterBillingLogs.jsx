import { useState, useMemo, useEffect } from 'react'
import {
  FileText,
  Search,
  Receipt,
  DollarSign,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronUp,
  X,
  CreditCard,
  Banknote,
  QrCode,
  AlertCircle,
  CheckCircle2,
  Eye,
} from 'lucide-react'
import { getStoredCustomerInvoices } from '../utils/invoiceStorage'
import { getStoredCustomers } from '../utils/customerStorage'

/**
 * MasterBillingLogs
 * A comprehensive view of every transaction (invoice) ever recorded in the system.
 * Shows per-bill summaries with expandable detail views.
 */
export default function MasterBillingLogs() {
  const [invoices, setInvoices] = useState(getStoredCustomerInvoices)
  const [customers, setCustomers] = useState(getStoredCustomers)
  const [searchQuery, setSearchQuery] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('ALL')
  const [sortField, setSortField] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [expandedBill, setExpandedBill] = useState(null)

  // Live-sync
  useEffect(() => {
    const handleSync = () => {
      setInvoices(getStoredCustomerInvoices())
      setCustomers(getStoredCustomers())
    }
    window.addEventListener('webills_invoices_updated', handleSync)
    window.addEventListener('webills_customers_updated', handleSync)
    window.addEventListener('storage', handleSync)
    return () => {
      window.removeEventListener('webills_invoices_updated', handleSync)
      window.removeEventListener('webills_customers_updated', handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [])

  // Enrich invoices with customer names
  const enrichedInvoices = useMemo(() => {
    return invoices.map((inv) => {
      const cust = customers.find((c) => c.id === inv.customerId)
      return {
        ...inv,
        customerName: cust ? cust.name : 'Walk-in Customer',
      }
    })
  }, [invoices, customers])

  // Aggregate stats
  const stats = useMemo(() => {
    const totalRevenue = invoices.reduce((acc, inv) => acc + inv.grandTotal, 0)
    const totalBills = invoices.length
    const avgBill = totalBills > 0 ? totalRevenue / totalBills : 0
    const totalItems = invoices.reduce((acc, inv) => acc + (inv.itemsCount || 0), 0)
    const methodCounts = invoices.reduce((acc, inv) => {
      acc[inv.paymentMethod] = (acc[inv.paymentMethod] || 0) + 1
      return acc
    }, {})
    return { totalRevenue, totalBills, avgBill, totalItems, methodCounts }
  }, [invoices])

  // Filter
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return enrichedInvoices.filter((inv) => {
      const matchesSearch =
        !q ||
        inv.billNo.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        (inv.cashier || '').toLowerCase().includes(q)
      const matchesPayment = paymentFilter === 'ALL' || inv.paymentMethod === paymentFilter
      return matchesSearch && matchesPayment
    })
  }, [enrichedInvoices, searchQuery, paymentFilter])

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortField, sortDir])

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp className="h-3 w-3 opacity-20" />
    return sortDir === 'asc' ? (
      <ChevronUp className="h-3 w-3 text-white" />
    ) : (
      <ChevronDown className="h-3 w-3 text-white" />
    )
  }

  const PaymentIcon = ({ method }) => {
    switch (method) {
      case 'CARD': return <CreditCard className="h-3.5 w-3.5" />
      case 'UPI': return <QrCode className="h-3.5 w-3.5" />
      default: return <Banknote className="h-3.5 w-3.5" />
    }
  }

  const paymentBadgeClass = (method) => {
    switch (method) {
      case 'CARD': return 'border-white/40 text-white'
      case 'UPI': return 'border-white/40 text-white'
      case 'CASH': return 'border-white/30 text-white/80'
      default: return 'border-white/20 text-white/60'
    }
  }

  const paymentFilters = ['ALL', 'CASH', 'CARD', 'UPI']

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6 lg:p-8 flex flex-col font-sans select-none">
      {/* Page Header */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-white" />
            Master Billing Logs
          </h1>
          <p className="text-xs text-white/70 mt-1">
            Complete historical record of every transaction processed through the terminal
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50 border border-white/20 rounded-lg px-2.5 py-1.5 font-mono">
            {sorted.length} bills
          </span>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3.5 rounded-xl border border-white/20 bg-black">
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="h-3.5 w-3.5 text-white/60" />
            <span className="text-[11px] text-white/60 uppercase tracking-wider">Total Bills</span>
          </div>
          <span className="text-xl font-bold text-white font-mono">{stats.totalBills}</span>
        </div>

        <div className="p-3.5 rounded-xl border border-white/20 bg-black">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-3.5 w-3.5 text-white/60" />
            <span className="text-[11px] text-white/60 uppercase tracking-wider">Total Revenue</span>
          </div>
          <span className="text-xl font-bold text-white font-mono">
            ${stats.totalRevenue.toFixed(2)}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-white/20 bg-black">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-white/60" />
            <span className="text-[11px] text-white/60 uppercase tracking-wider">Avg. Bill Value</span>
          </div>
          <span className="text-xl font-bold text-white font-mono">
            ${stats.avgBill.toFixed(2)}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-white/20 bg-black">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-3.5 w-3.5 text-white/60" />
            <span className="text-[11px] text-white/60 uppercase tracking-wider">Total Items Sold</span>
          </div>
          <span className="text-xl font-bold text-white font-mono">{stats.totalItems}</span>
        </div>
      </div>

      {/* Search + Payment Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
          <input
            type="text"
            placeholder="Search by bill number, customer name or cashier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-10 rounded-xl bg-black border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:border-white transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {paymentFilters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setPaymentFilter(f)}
              className={`h-11 px-3.5 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap ${
                paymentFilter === f
                  ? 'bg-white text-black border-white font-semibold'
                  : 'bg-black text-white/80 border-white/20 hover:border-white/50 hover:text-white'
              }`}
            >
              {f === 'ALL' ? 'All Methods' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Billing Table */}
      <div className="rounded-2xl border border-white/20 bg-black overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/20 bg-white/[0.04] text-white/70">
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-white transition-colors"
                    onClick={() => toggleSort('billNo')}
                  >
                    Bill No. <SortIcon field="billNo" />
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-white transition-colors"
                    onClick={() => toggleSort('customerName')}
                  >
                    Customer <SortIcon field="customerName" />
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-white transition-colors"
                    onClick={() => toggleSort('date')}
                  >
                    Date & Time <SortIcon field="date" />
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-white transition-colors ml-auto"
                    onClick={() => toggleSort('itemsCount')}
                  >
                    Items <SortIcon field="itemsCount" />
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-white transition-colors ml-auto"
                    onClick={() => toggleSort('subtotal')}
                  >
                    Subtotal <SortIcon field="subtotal" />
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-white transition-colors ml-auto"
                    onClick={() => toggleSort('discount')}
                  >
                    Discount <SortIcon field="discount" />
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-white transition-colors ml-auto"
                    onClick={() => toggleSort('tax')}
                  >
                    Tax <SortIcon field="tax" />
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-white transition-colors ml-auto"
                    onClick={() => toggleSort('grandTotal')}
                  >
                    Grand Total <SortIcon field="grandTotal" />
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-center">
                  Payment
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-center">
                  Status
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-center">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {sorted.map((inv) => {
                const isExpanded = expandedBill === inv.billNo
                return (
                  <>
                    <tr
                      key={inv.billNo}
                      className={`transition-colors group ${isExpanded ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'}`}
                    >
                      <td className="py-3.5 px-4 font-mono text-white font-semibold text-[11px]">
                        {inv.billNo}
                      </td>
                      <td className="py-3.5 px-4 text-white/90 truncate max-w-[150px]">
                        {inv.customerName}
                      </td>
                      <td className="py-3.5 px-4 text-white/70 whitespace-nowrap">
                        <div>{inv.date}</div>
                        {inv.time && (
                          <div className="text-[10px] text-white/50">{inv.time}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-white/80">
                        {inv.itemsCount}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-white/80">
                        ${(inv.subtotal || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-white/70">
                        {inv.discount > 0 ? `-$${(inv.discount || 0).toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-white/70">
                        +${(inv.tax || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                        ${inv.grandTotal.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] uppercase font-medium ${paymentBadgeClass(inv.paymentMethod)}`}
                        >
                          <PaymentIcon method={inv.paymentMethod} />
                          {inv.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-white/20 text-[10px] uppercase font-medium text-white/70">
                          <CheckCircle2 className="h-3 w-3 text-white" />
                          {inv.status || 'PAID'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setExpandedBill(isExpanded ? null : inv.billNo)}
                          title={isExpanded ? 'Collapse' : 'View line items'}
                          className="h-7 w-7 rounded-lg border border-white/20 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-colors mx-auto"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Line-Items Panel */}
                    {isExpanded && Array.isArray(inv.items) && inv.items.length > 0 && (
                      <tr key={`${inv.billNo}-expanded`}>
                        <td colSpan={11} className="px-6 pb-4 pt-0 bg-white/[0.03]">
                          <div className="border border-white/10 rounded-xl overflow-hidden mt-1">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-white/[0.04] text-white/60 border-b border-white/10">
                                  <th className="py-2.5 px-3 text-left font-medium uppercase tracking-wider text-[10px]">Item</th>
                                  <th className="py-2.5 px-3 text-left font-medium uppercase tracking-wider text-[10px]">SKU</th>
                                  <th className="py-2.5 px-3 text-right font-medium uppercase tracking-wider text-[10px]">Qty</th>
                                  <th className="py-2.5 px-3 text-right font-medium uppercase tracking-wider text-[10px]">Unit Price</th>
                                  <th className="py-2.5 px-3 text-right font-medium uppercase tracking-wider text-[10px]">Line Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/10">
                                {inv.items.map((item, i) => (
                                  <tr key={i} className="hover:bg-white/[0.02]">
                                    <td className="py-2.5 px-3 text-white/90 font-medium">{item.name}</td>
                                    <td className="py-2.5 px-3 font-mono text-white/60">{item.sku}</td>
                                    <td className="py-2.5 px-3 text-right text-white/80 font-mono">{item.qty}x</td>
                                    <td className="py-2.5 px-3 text-right font-mono text-white/80">${item.price.toFixed(2)}</td>
                                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-white">${item.total.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Invoice Summary Footer */}
                          <div className="mt-2 flex items-center justify-between text-[11px] text-white/50 px-1">
                            <span>
                              Cashier: <span className="text-white/70">{inv.cashier || 'Adarsh Deshmukh'}</span>
                            </span>
                            <span className="font-mono">
                              Grand Total:{' '}
                              <span className="text-white font-semibold">${inv.grandTotal.toFixed(2)}</span>
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}

              {sorted.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-20 text-center text-white/60">
                    <AlertCircle className="h-8 w-8 mx-auto mb-3 text-white/30" />
                    <p className="text-sm font-medium">No billing records found</p>
                    <p className="text-xs text-white/40 mt-1">
                      {searchQuery || paymentFilter !== 'ALL'
                        ? 'Try clearing your search or payment filter'
                        : 'Complete a transaction in Billing Terminal to see records here'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        {sorted.length > 0 && (
          <div className="border-t border-white/20 px-4 py-3 flex items-center justify-between bg-white/[0.02]">
            <span className="text-xs text-white/50">
              Showing {sorted.length} of {invoices.length} transactions
            </span>
            <span className="text-xs font-mono font-semibold text-white">
              Filtered Revenue:{' '}
              <span className="text-white">
                ${sorted.reduce((acc, inv) => acc + inv.grandTotal, 0).toFixed(2)}
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export { MasterBillingLogs }
