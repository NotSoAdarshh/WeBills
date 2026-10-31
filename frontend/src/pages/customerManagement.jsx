import { useState, useEffect, useMemo } from 'react'
import {
  Users,
  UserPlus,
  Search,
  Receipt,
  History,
  X,
  Phone,
  Mail,
  MapPin,
  FileBadge,
  CheckCircle2,
  Trash2,
  Edit2,
  AlertCircle,
} from 'lucide-react'
import {
  getStoredCustomers,
  saveStoredCustomers,
  createCustomerId,
  getCurrentDateStr,
} from '../utils/customerStorage'

export default function CustomerManagement({ onSelectCustomerForBilling, onNavigateToHistory }) {
  const [customers, setCustomers] = useState(getStoredCustomers)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [notification, setNotification] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    billingAddress: '',
    shippingAddress: '',
    taxId: '',
    notes: '',
  })

  // Synchronize customers across events & browser storage
  useEffect(() => {
    const handleSync = () => {
      setCustomers(getStoredCustomers())
    }
    window.addEventListener('webills_customers_updated', handleSync)
    window.addEventListener('storage', handleSync)
    return () => {
      window.removeEventListener('webills_customers_updated', handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [])

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return customers
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        (c.phone && c.phone.toLowerCase().includes(query)) ||
        (c.email && c.email.toLowerCase().includes(query)) ||
        (c.taxId && c.taxId.toLowerCase().includes(query))
    )
  }, [customers, searchQuery])

  const openAddModal = () => {
    setEditingCustomer(null)
    setFormData({
      name: '',
      phone: '',
      email: '',
      billingAddress: '',
      shippingAddress: '',
      taxId: '',
      notes: '',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (cust) => {
    setEditingCustomer(cust)
    setFormData({
      name: cust.name,
      phone: cust.phone === 'N/A' ? '' : cust.phone,
      email: cust.email || '',
      billingAddress: cust.address || '',
      shippingAddress: cust.shippingAddress || cust.address || '',
      taxId: cust.taxId === 'N/A' ? '' : cust.taxId,
      notes: cust.notes || '',
    })
    setIsModalOpen(true)
  }

  const handleDeleteCustomer = (id) => {
    if (id === 'c1') {
      alert('Walk-in Customer profile cannot be deleted as it is the default billing target.')
      return
    }
    const target = customers.find((c) => c.id === id)
    if (window.confirm(`Permanently remove customer profile "${target?.name}"?`)) {
      const updated = customers.filter((c) => c.id !== id)
      setCustomers(updated)
      saveStoredCustomers(updated)
      showNotification(`Customer "${target?.name}" permanently removed`)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const name = formData.name.trim()
    if (!name) return

    let updated
    if (editingCustomer) {
      updated = customers.map((c) =>
        c.id === editingCustomer.id
          ? {
              ...c,
              name,
              phone: formData.phone.trim() || 'N/A',
              email: formData.email.trim() || 'N/A',
              address: formData.billingAddress.trim() || 'N/A',
              shippingAddress: formData.shippingAddress.trim() || 'N/A',
              taxId: formData.taxId.trim() || 'N/A',
              notes: formData.notes.trim() || '',
            }
          : c
      )
      showNotification(`Customer "${name}" updated successfully`)
    } else {
      const newCustomer = {
        id: createCustomerId(),
        name,
        phone: formData.phone.trim() || 'N/A',
        email: formData.email.trim() || 'N/A',
        address: formData.billingAddress.trim() || 'N/A',
        shippingAddress: formData.shippingAddress.trim() || 'N/A',
        taxId: formData.taxId.trim() || 'N/A',
        notes: formData.notes.trim() || '',
        totalSpent: 0,
        totalVisits: 0,
        createdAt: getCurrentDateStr(),
      }
      updated = [newCustomer, ...customers]
      showNotification(`New customer "${name}" permanently saved in database`)
    }

    setCustomers(updated)
    saveStoredCustomers(updated)
    setIsModalOpen(false)
  }

  const showNotification = (msg) => {
    setNotification(msg)
    setTimeout(() => {
      setNotification(null)
    }, 3500)
  }

  return (
    <div className="w-full flex flex-col font-sans select-none">
      {/* Header Bar */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="h-6 w-6 text-white" />
            Customer Profiles
          </h1>
          <p className="text-xs text-white/70 mt-1">
            Manage permanent customer records, contact details, tax numbers, and invoices
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="h-10 px-4 rounded-xl bg-white text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-white/90 transition-colors shadow-lg shadow-white/10"
        >
          <UserPlus className="h-4 w-4" />
          + Add New Customer
        </button>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="mb-4 p-3 rounded-xl border border-white/30 bg-black flex items-center gap-2 text-xs text-white shadow-xl animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3.5 rounded-xl border border-white/20 bg-black">
          <span className="text-[11px] text-white/60 block uppercase tracking-wider">
            Total Customers
          </span>
          <span className="text-xl font-bold text-white font-mono">{customers.length}</span>
        </div>
        <div className="p-3.5 rounded-xl border border-white/20 bg-black">
          <span className="text-[11px] text-white/60 block uppercase tracking-wider">
            Active Accounts
          </span>
          <span className="text-xl font-bold text-white font-mono">
            {customers.filter((c) => c.totalVisits > 0).length}
          </span>
        </div>
        <div className="p-3.5 rounded-xl border border-white/20 bg-black">
          <span className="text-[11px] text-white/60 block uppercase tracking-wider">
            Lifetime Sales
          </span>
          <span className="text-xl font-bold text-white font-mono">
            ${customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0).toFixed(2)}
          </span>
        </div>
        <div className="p-3.5 rounded-xl border border-white/20 bg-black">
          <span className="text-[11px] text-white/60 block uppercase tracking-wider">
            Tax Registered
          </span>
          <span className="text-xl font-bold text-white font-mono">
            {customers.filter((c) => c.taxId && c.taxId !== 'N/A').length}
          </span>
        </div>
      </div>

      {/* Search Input Filter */}
      <div className="mb-6 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
        <input
          type="text"
          placeholder="Search by customer name, phone number, email, or Tax ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-black border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:border-white transition-colors"
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

      {/* Dark Themed Customers Data Table */}
      <div className="rounded-2xl border border-white/20 bg-black overflow-hidden flex-1 flex flex-col shadow-2xl">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/20 bg-white/[0.04] text-white/70">
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">
                  Customer
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">
                  Contact Info
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">
                  Tax ID / GST
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">
                  Total Spent
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">
                  Visits
                </th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-white/[0.03] transition-colors group">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full border border-white/20 bg-white/[0.06] flex items-center justify-center font-bold text-xs text-white shrink-0">
                        {cust.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-white block truncate max-w-[180px] sm:max-w-xs">
                          {cust.name}
                        </span>
                        {cust.address && cust.address !== 'N/A' && (
                          <span className="text-[11px] text-white/60 truncate flex items-center gap-1 mt-0.5 max-w-[200px]">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {cust.address}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-1 text-white/80">
                      {cust.phone !== 'N/A' ? (
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Phone className="h-3 w-3 text-white/50 shrink-0" />
                          {cust.phone}
                        </span>
                      ) : (
                        <span className="text-white/40 text-[11px]">No phone</span>
                      )}
                      {cust.email && cust.email !== 'N/A' && (
                        <span className="flex items-center gap-1 text-[11px] text-white/60 truncate max-w-[180px]">
                          <Mail className="h-3 w-3 text-white/50 shrink-0" />
                          {cust.email}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-white/80">
                    {cust.taxId !== 'N/A' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-white/20 bg-white/[0.03] text-[11px]">
                        <FileBadge className="h-3 w-3 text-white/60" />
                        {cust.taxId}
                      </span>
                    ) : (
                      <span className="text-white/40">—</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-white">
                    ${(cust.totalSpent || 0).toFixed(2)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono text-white/80">
                    {cust.totalVisits || 0}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* New Bill quick action */}
                      <button
                        type="button"
                        onClick={() => onSelectCustomerForBilling && onSelectCustomerForBilling(cust.id)}
                        title="Create New Bill for Customer"
                        className="h-8 px-2.5 rounded-lg bg-white text-black font-semibold text-[11px] flex items-center gap-1 hover:bg-white/90 transition-colors"
                      >
                        <Receipt className="h-3.5 w-3.5" />
                        <span className="hidden xl:inline">New Bill</span>
                      </button>

                      {/* View History quick action */}
                      <button
                        type="button"
                        onClick={() => onNavigateToHistory && onNavigateToHistory(cust.id)}
                        title="View Billing History"
                        className="h-8 px-2.5 rounded-lg border border-white/20 text-white/80 hover:bg-white/10 hover:text-white text-[11px] flex items-center gap-1 transition-colors"
                      >
                        <History className="h-3.5 w-3.5" />
                        <span className="hidden xl:inline">History</span>
                      </button>

                      {/* Edit Profile */}
                      <button
                        type="button"
                        onClick={() => openEditModal(cust)}
                        title="Edit Customer Details"
                        className="h-8 w-8 rounded-lg border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      {/* Delete Customer */}
                      {cust.id !== 'c1' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomer(cust.id)}
                          title="Delete Customer Profile"
                          className="h-8 w-8 rounded-lg border border-white/20 flex items-center justify-center text-white/60 hover:border-white hover:text-white transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-white/60">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-white/40" />
                    <p className="text-sm font-medium">No customer profiles found</p>
                    <p className="text-xs text-white/50 mt-1">Try another search or add a new customer</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Create / Edit Permanent Profile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/20 bg-black p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/20">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-white" />
                {editingCustomer ? 'Edit Customer Profile' : 'Add Permanent Customer'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/60 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3.5 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="text-xs text-white/70 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe / Acme Corp"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-black border border-white/20 text-white text-sm focus:outline-none focus:border-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/70 block mb-1">Mobile / Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-black border border-white/20 text-white text-sm font-mono focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/70 block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-black border border-white/20 text-white text-sm focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-white/70 block mb-1">Billing Address</label>
                <input
                  type="text"
                  placeholder="Street, City, State, ZIP code"
                  value={formData.billingAddress}
                  onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-black border border-white/20 text-white text-sm focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs text-white/70 block mb-1">Shipping Address (Optional)</label>
                <input
                  type="text"
                  placeholder="Leave empty if same as billing"
                  value={formData.shippingAddress}
                  onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-black border border-white/20 text-white text-sm focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs text-white/70 block mb-1">Tax ID / GST Number</label>
                <input
                  type="text"
                  placeholder="e.g. GST-90210 / TX-44109"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-black border border-white/20 text-white text-sm font-mono focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs text-white/70 block mb-1">Notes / Preferences</label>
                <textarea
                  rows={2}
                  placeholder="Customer preferences, loyalty notes, delivery instructions..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-black border border-white/20 text-white text-xs focus:outline-none focus:border-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/20 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-9 px-4 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-xl bg-white text-black font-semibold text-xs hover:bg-white/90"
                >
                  {editingCustomer ? 'Save Changes' : 'Save Permanent Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
export { CustomerManagement }
