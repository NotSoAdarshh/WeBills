import { useState, useEffect, useMemo } from 'react'
import {
  PackagePlus,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Package,
  Layers,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { getStoredProducts, saveStoredProducts } from '../utils/productStorage'

const categories = ['Beverages', 'Bakery', 'Groceries', 'Snacks', 'Electronics', 'Accessories', 'General']

export default function ItemManagement() {
  const [products, setProducts] = useState(getStoredProducts)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'General',
    price: '',
    stock: '',
  })
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    const handleUpdate = () => {
      setProducts(getStoredProducts())
    }
    window.addEventListener('webills_products_updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('webills_products_updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchesCategory = selectedCategory === 'All' || prod.category === selectedCategory
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !query ||
        prod.name.toLowerCase().includes(query) ||
        prod.sku.toLowerCase().includes(query) ||
        prod.category.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [products, selectedCategory, searchQuery])

  const openAddModal = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'General',
      price: '',
      stock: '10',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category || 'General',
      price: product.price.toString(),
      stock: product.stock.toString(),
    })
    setIsModalOpen(true)
  }

  const handleDelete = (productId) => {
    const target = products.find((p) => p.id === productId)
    if (window.confirm(`Are you sure you want to delete "${target?.name}"?`)) {
      const updated = products.filter((p) => p.id !== productId)
      setProducts(updated)
      saveStoredProducts(updated)
      showNotification(`Item "${target?.name}" deleted successfully`)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const name = formData.name.trim()
    const sku = formData.sku.trim() || `SKU-${Date.now().toString().slice(-4)}`
    const category = formData.category || 'General'
    const price = Math.max(0, parseFloat(formData.price) || 0)
    const stock = Math.max(0, parseInt(formData.stock, 10) || 0)

    if (!name) return

    let updated
    if (editingProduct) {
      updated = products.map((p) =>
        p.id === editingProduct.id
          ? { ...p, name, sku, category, price, stock }
          : p
      )
      showNotification(`Item "${name}" updated successfully`)
    } else {
      const newItem = {
        id: `prod_${Date.now()}`,
        name,
        sku,
        category,
        price,
        stock,
      }
      updated = [newItem, ...products]
      showNotification(`New item "${name}" permanently saved and available for billing`)
    }

    setProducts(updated)
    saveStoredProducts(updated)
    setIsModalOpen(false)
  }

  const showNotification = (msg) => {
    setNotification(msg)
    setTimeout(() => {
      setNotification(null)
    }, 3500)
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6 lg:p-8 flex flex-col font-sans select-none">
      {/* Top Header */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <PackagePlus className="h-6 w-6 text-white" />
            Items & Inventory Management
          </h1>
          <p className="text-xs text-white/70 mt-1">
            Permanently add, edit, and manage items that can be directly billed on the terminal
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="h-10 px-4 rounded-xl bg-white text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-white/90 transition-colors shadow-lg shadow-white/10"
        >
          <Plus className="h-4 w-4" />
          Add Permanent Item
        </button>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="mb-4 p-3 rounded-xl border border-white/30 bg-black flex items-center gap-2 text-xs text-white shadow-xl animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Stats Quick Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3.5 rounded-xl border border-white/20 bg-black">
          <span className="text-[11px] text-white/60 block uppercase tracking-wider">Total Items</span>
          <span className="text-xl font-bold text-white font-mono">{products.length}</span>
        </div>
        <div className="p-3.5 rounded-xl border border-white/20 bg-black">
          <span className="text-[11px] text-white/60 block uppercase tracking-wider">Categories</span>
          <span className="text-xl font-bold text-white font-mono">
            {new Set(products.map((p) => p.category)).size}
          </span>
        </div>
        <div className="p-3.5 rounded-xl border border-white/20 bg-black">
          <span className="text-[11px] text-white/60 block uppercase tracking-wider">Total Stock Count</span>
          <span className="text-xl font-bold text-white font-mono">
            {products.reduce((acc, p) => acc + (p.stock || 0), 0)}
          </span>
        </div>
        <div className="p-3.5 rounded-xl border border-white/20 bg-black">
          <span className="text-[11px] text-white/60 block uppercase tracking-wider">Low Stock (&lt;10)</span>
          <span className="text-xl font-bold text-white font-mono">
            {products.filter((p) => (p.stock || 0) < 10).length}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
          <input
            type="text"
            placeholder="Search items by name, SKU or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-black border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:border-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['All', ...categories].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`h-9 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                selectedCategory === cat
                  ? 'bg-white text-black border-white font-semibold'
                  : 'bg-black text-white/80 border-white/20 hover:border-white/50 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items Table */}
      <div className="rounded-2xl border border-white/20 bg-black overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/20 bg-white/[0.04] text-white/70">
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Item Name</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">SKU</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Category</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Price</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Stock</th>
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredProducts.map((prod) => (
                <tr
                  key={prod.id}
                  className="hover:bg-white/[0.03] transition-colors group"
                >
                  <td className="py-3.5 px-4 font-medium text-white flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg border border-white/20 bg-black flex items-center justify-center shrink-0">
                      <Package className="h-4 w-4 text-white" />
                    </div>
                    <span className="truncate max-w-[220px] sm:max-w-xs">{prod.name}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-white/80">{prod.sku}</td>
                  <td className="py-3.5 px-4 text-white/80">
                    <span className="px-2 py-0.5 rounded border border-white/20 text-[10px] uppercase font-medium">
                      {prod.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-white">
                    ${prod.price.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        prod.stock <= 5
                          ? 'border border-white text-white'
                          : 'text-white/80'
                      }`}
                    >
                      {prod.stock} units
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(prod)}
                        title="Edit Item"
                        className="h-8 w-8 rounded-lg border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(prod.id)}
                        title="Delete Item"
                        className="h-8 w-8 rounded-lg border border-white/20 flex items-center justify-center text-white/60 hover:border-white hover:text-white transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-white/60">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-white/40" />
                    <p className="text-sm font-medium">No items found</p>
                    <p className="text-xs text-white/50 mt-1">Try another search or add a new permanent item</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-black p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/20">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-white" />
                {editingProduct ? 'Edit Permanent Item' : 'Add New Permanent Item'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/60 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3.5">
              <div>
                <label className="text-xs text-white/70 block mb-1">Item / Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Colombian Roast Dark Blend"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-black border border-white/20 text-white text-sm focus:outline-none focus:border-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/70 block mb-1">SKU / Code</label>
                  <input
                    type="text"
                    placeholder="e.g. BEV-009"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-black border border-white/20 text-white text-sm font-mono focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/70 block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-black border border-white/20 text-white text-sm focus:outline-none focus:border-white cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c} className="bg-black text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/70 block mb-1">Unit Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-black border border-white/20 text-white text-sm font-mono focus:outline-none focus:border-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/70 block mb-1">Initial Stock Count *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-black border border-white/20 text-white text-sm font-mono focus:outline-none focus:border-white"
                  />
                </div>
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
                  {editingProduct ? 'Save Changes' : 'Save Permanent Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
export { ItemManagement }
