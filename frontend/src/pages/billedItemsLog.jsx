import { useState, useMemo, useEffect } from 'react'
import {
  ListFilter,
  Search,
  Package,
  TrendingUp,
  Hash,
  DollarSign,
  X,
  ChevronUp,
  ChevronDown,
  AlertCircle,
} from 'lucide-react'
import { getStoredCustomerInvoices } from '../utils/invoiceStorage'
import { getStoredCustomers } from '../utils/customerStorage'

/**
 * BilledItemsLog
 * Shows every individual line-item that has ever been sold across all invoices.
 * Data is read from localStorage (invoiceStorage) and updates reactively.
 */
export default function BilledItemsLog() {
  const [invoices, setInvoices] = useState(getStoredCustomerInvoices)
  const [customers, setCustomers] = useState(getStoredCustomers)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState('date')
  const [sortDir, setSortDir] = useState('desc')

  // Live-sync when invoices are updated elsewhere
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

  // Flatten all invoice line-items into a single list
  const allLineItems = useMemo(() => {
    const rows = []
    invoices.forEach((inv) => {
      const cust = customers.find((c) => c.id === inv.customerId)
      if (Array.isArray(inv.items)) {
        inv.items.forEach((item) => {
          rows.push({
            billNo: inv.billNo,
            date: inv.date,
            time: inv.time,
            customerName: cust ? cust.name : 'Walk-in Customer',
            paymentMethod: inv.paymentMethod,
            itemName: item.name,
            sku: item.sku,
            qty: item.qty,
            unitPrice: item.price,
            lineTotal: item.total,
          })
        })
      }
    })
    return rows
  }, [invoices, customers])

  // Search filter
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return allLineItems
    return allLineItems.filter(
      (row) =>
        row.itemName.toLowerCase().includes(q) ||
        row.sku.toLowerCase().includes(q) ||
        row.billNo.toLowerCase().includes(q) ||
        row.customerName.toLowerCase().includes(q)
    )
  }, [allLineItems, searchQuery])

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

  // Aggregate stats
  const stats = useMemo(() => {
    const totalQty = allLineItems.reduce((acc, r) => acc + r.qty, 0)
    const totalRevenue = allLineItems.reduce((acc, r) => acc + r.lineTotal, 0)
    const uniqueItems = new Set(allLineItems.map((r) => r.sku)).size
    const topItem = allLineItems.reduce((acc, r) => {
      acc[r.itemName] = (acc[r.itemName] || 0) + r.qty
      return acc
    }, {})
    const topItemName = Object.entries(topItem).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
    return { totalQty, totalRevenue, uniqueItems, topItemName }
  }, [allLineItems])

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

  const paymentBadgeStyle = (method) => {
    switch (method) {
      case 'CARD': return 'border-white/40 text-white/80'
      case 'UPI': return 'border-white/40 text-white/80'
      case 'CASH': return 'border-white/30 text-white/70'
      default: return 'border-white/20 text-white/60'
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6 lg:p-8 flex flex-col font-sans select-none">
      {/* Page Header */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ListFilter className="h-6 w-6 text-white" />
            Billed Items Log
          </h1>
          <p className="text-xs text-white/70 mt-1">
            Every individual line-item sold across all invoices — searchable and sortable
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50 border border-white/20 rounded-lg px-2.5 py-1.5 font-mono">
            {sorted.length} entries
          </span>
        </div>
      </header>

      {/* Aggregate Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3.5 rounded-xl border border-white/20 bg-black">
          <div className="flex items-center gap-2 mb-1">
            <Hash className="h-3.5 w-3.5 text-white/60" />
            <span className="text-[11px] text-white/60 uppercase tracking-wider">Total Units Sold</span>
          </div>
          <span className="text-xl font-bold text-white font-mono">{stats.totalQty.toLocaleString()}</span>
        </div>

        <div className="p-3.5 rounded-xl border border-white/20 bg-black">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-3.5 w-3.5 text-white/60" />
            <span className="text-[11px] text-white/60 uppercase tracking-wider">Total Line Revenue</span>
          </div>
          <span className="text-xl font-bold text-white font-mono">
            ${stats.totalRevenue.toFixed(2)}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-white/20 bg-black">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-3.5 w-3.5 text-white/60" />
            <span className="text-[11px] text-white/60 uppercase tracking-wider">Unique SKUs Sold</span>
          </div>
          <span className="text-xl font-bold text-white font-mono">{stats.uniqueItems}</span>
        </div>

        <div className="p-3.5 rounded-xl border border-white/20 bg-black">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-white/60" />
            <span className="text-[11px] text-white/60 uppercase tracking-wider">Best-Selling Item</span>
          </div>
          <span className="text-sm font-semibold text-white truncate block" title={stats.topItemName}>
            {stats.topItemName}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
        <input
          type="text"
          placeholder="Search by item name, SKU, bill number or customer..."
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

      {/* Items Table */}
      <div className="rounded-2xl border border-white/20 bg-black overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/20 bg-white/[0.04] text-white/70">
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-white transition-colors"
                    onClick={() => toggleSort('itemName')}
                  >
                    Item Name <SortIcon field="itemName" />
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-white transition-colors"
                    onClick={() => toggleSort('sku')}
                  >
                    SKU <SortIcon field="sku" />
                  </button>
                </th>
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
                    Date <SortIcon field="date" />
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-white transition-colors ml-auto"
                    onClick={() => toggleSort('qty')}
                  >
                    Qty <SortIcon field="qty" />
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-white transition-colors ml-auto"
                    onClick={() => toggleSort('unitPrice')}
                  >
                    Unit Price <SortIcon field="unitPrice" />
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-white transition-colors ml-auto"
                    onClick={() => toggleSort('lineTotal')}
                  >
                    Line Total <SortIcon field="lineTotal" />
                  </button>
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">
                  Payment
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {sorted.map((row, idx) => (
                <tr
                  key={`${row.billNo}-${row.sku}-${idx}`}
                  className="hover:bg-white/[0.03] transition-colors group"
                >
                  <td className="py-3.5 px-4 font-medium text-white">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg border border-white/20 bg-black flex items-center justify-center shrink-0">
                        <Package className="h-3.5 w-3.5 text-white/70" />
                      </div>
                      <span className="truncate max-w-[180px]">{row.itemName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-white/70">{row.sku}</td>
                  <td className="py-3.5 px-4 font-mono text-white/80 text-[11px]">{row.billNo}</td>
                  <td className="py-3.5 px-4 text-white/80 truncate max-w-[140px]">{row.customerName}</td>
                  <td className="py-3.5 px-4 text-white/70 whitespace-nowrap">
                    <div>{row.date}</div>
                    {row.time && (
                      <div className="text-[10px] text-white/50">{row.time}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-white">
                    {row.qty}x
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-white/80">
                    ${row.unitPrice.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                    ${row.lineTotal.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`px-2 py-0.5 rounded border text-[10px] uppercase font-medium ${paymentBadgeStyle(row.paymentMethod)}`}
                    >
                      {row.paymentMethod}
                    </span>
                  </td>
                </tr>
              ))}

              {sorted.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-20 text-center text-white/60">
                    <AlertCircle className="h-8 w-8 mx-auto mb-3 text-white/30" />
                    <p className="text-sm font-medium">No billed items found</p>
                    <p className="text-xs text-white/40 mt-1">
                      {searchQuery
                        ? 'Try a different search term'
                        : 'Complete a transaction in Billing Terminal to see entries here'}
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
              Showing {sorted.length} of {allLineItems.length} line-item records
            </span>
            <span className="text-xs font-mono font-semibold text-white">
              Filtered Total:{' '}
              <span className="text-white">
                ${sorted.reduce((acc, r) => acc + r.lineTotal, 0).toFixed(2)}
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export { BilledItemsLog }
