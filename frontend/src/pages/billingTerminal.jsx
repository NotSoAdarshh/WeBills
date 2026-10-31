import { useState, useMemo, useEffect } from 'react'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  FileDown,
  UserPlus,
  X,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  Package,
} from 'lucide-react'
import { getStoredProducts, saveStoredProducts } from '../utils/productStorage'
import { generateInvoicePDF } from '../pdfGenerator'

// Pre-registered customers
const initialCustomers = [
  { id: 'c1', name: 'Walk-in Customer', phone: 'N/A', taxId: 'N/A', points: 0 },
  { id: 'c2', name: 'Sarah Jenkins', phone: '+1 (555) 234-5678', taxId: 'TX-99821', points: 340 },
  { id: 'c3', name: 'David Miller', phone: '+1 (555) 876-5432', taxId: 'TX-44109', points: 120 },
  { id: 'c4', name: 'Elena Rostova', phone: '+1 (555) 349-2104', taxId: 'TX-67290', points: 580 },
]

export default function BillingTerminal() {
  const [products, setProducts] = useState(getStoredProducts)
  const [customers, setCustomers] = useState(initialCustomers)
  const [selectedCustomerId, setSelectedCustomerId] = useState('c1')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Dynamically sync products if updated elsewhere or added by user
  useEffect(() => {
    const handleProductsChange = () => {
      setProducts(getStoredProducts())
    }
    window.addEventListener('webills_products_updated', handleProductsChange)
    window.addEventListener('storage', handleProductsChange)
    return () => {
      window.removeEventListener('webills_products_updated', handleProductsChange)
      window.removeEventListener('storage', handleProductsChange)
    }
  }, [])

  // Dynamic categories computed from the user's current items
  const categories = useMemo(() => {
    const unique = new Set(products.map((p) => p.category).filter(Boolean))
    return ['All', ...Array.from(unique)]
  }, [products])

  // Cart State
  const [cart, setCart] = useState([])
  const [discountPercent, setDiscountPercent] = useState(0)
  const [taxPercent, setTaxPercent] = useState(8.5) // default 8.5%
  const [paymentMethod, setPaymentMethod] = useState('CASH') // CASH, CARD, UPI
  const [cashTendered, setCashTendered] = useState('')

  // Quick Add Customer Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [newCustomerTaxId, setNewCustomerTaxId] = useState('')

  // Success Notification / Modal
  const [successMessage, setSuccessMessage] = useState(null)

  // Filtered Products
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

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || customers[0]
  }, [customers, selectedCustomerId])

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0)
  }, [cart])

  const discountAmount = useMemo(() => {
    return (subtotal * (Number(discountPercent) || 0)) / 100
  }, [subtotal, discountPercent])

  const taxableAmount = Math.max(0, subtotal - discountAmount)
  const taxAmount = (taxableAmount * (Number(taxPercent) || 0)) / 100
  const grandTotal = taxableAmount + taxAmount

  const changeDue = useMemo(() => {
    const tendered = parseFloat(cashTendered)
    if (isNaN(tendered) || tendered < grandTotal) return 0
    return tendered - grandTotal
  }, [cashTendered, grandTotal])

  // Cart Handlers
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) return prevCart
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prevCart, { ...product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId, delta) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.id === productId) {
            const nextQty = item.quantity + delta
            return nextQty > 0 ? { ...item, quantity: Math.min(nextQty, item.stock) } : null
          }
          return item
        })
        .filter(Boolean)
    })
  }

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId))
  }

  const clearCart = () => {
    setCart([])
    setCashTendered('')
  }

  // Quick Customer Creation
  const handleCreateCustomer = (e) => {
    e.preventDefault()
    if (!newCustomerName.trim()) return

    const newCust = {
      id: `c_${Date.now()}`,
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim() || 'N/A',
      taxId: newCustomerTaxId.trim() || 'N/A',
      points: 0,
    }

    setCustomers((prev) => [...prev, newCust])
    setSelectedCustomerId(newCust.id)
    setNewCustomerName('')
    setNewCustomerPhone('')
    setNewCustomerTaxId('')
    setIsCustomerModalOpen(false)
  }

  // Finalize Transaction Triggers
  const handlePrintReceipt = () => {
    if (cart.length === 0) return
    const billNo = `BILL-${Math.floor(100000 + Math.random() * 900000)}`
    const invoiceDate = new Date().toISOString()

    // Prepare invoice data from cart
    const invoiceData = {
      invoiceNumber: billNo,
      date: invoiceDate,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone !== 'N/A' ? selectedCustomer.phone : undefined,
      customerTaxId: selectedCustomer.taxId !== 'N/A' ? selectedCustomer.taxId : undefined,
      paymentStatus: 'PAID IN FULL',
      paymentMode: `Mode: ${paymentMethod}`,
      items: cart.map((item) => ({
        item: item.name,
        sku: item.sku,
        qty: item.quantity,
        price: item.price,
        discount: '0%',
        tax: `${taxPercent}%`,
        total: item.price * item.quantity,
        customVal: '—',
      })),
      subtotal: subtotal,
      tax: taxAmount,
      grandTotal: grandTotal,
    }

    // Deduct stock permanently
    const currentProducts = getStoredProducts()
    const updatedProducts = currentProducts.map((p) => {
      const purchased = cart.find((item) => item.id === p.id)
      return purchased ? { ...p, stock: Math.max(0, p.stock - purchased.quantity) } : p
    })
    saveStoredProducts(updatedProducts)
    setProducts(updatedProducts)

    try {
      // Generate and download PDF using the template
      generateInvoicePDF(invoiceData, {
        download: true,
        filename: `invoice-${billNo}.pdf`,
      })

      setSuccessMessage({
        type: 'PDF Invoice Generated & Printed',
        billNo,
        total: grandTotal.toFixed(2),
        customer: selectedCustomer.name,
        itemsCount: cart.reduce((acc, i) => acc + i.quantity, 0),
      })
    } catch (error) {
      console.error('Print Receipt Error:', error)
      setSuccessMessage({
        type: 'Error generating PDF',
        billNo,
        total: grandTotal.toFixed(2),
        customer: selectedCustomer.name,
        itemsCount: cart.reduce((acc, i) => acc + i.quantity, 0),
      })
    }
    clearCart()
  }

  const handleExportPDF = () => {
    if (cart.length === 0) return
    const billNo = `BILL-${Math.floor(100000 + Math.random() * 900000)}`
    const invoiceDate = new Date().toISOString()

    // Prepare invoice data from cart
    const invoiceData = {
      invoiceNumber: billNo,
      date: invoiceDate,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone !== 'N/A' ? selectedCustomer.phone : undefined,
      customerTaxId: selectedCustomer.taxId !== 'N/A' ? selectedCustomer.taxId : undefined,
      paymentStatus: 'PAID IN FULL',
      paymentMode: `Mode: ${paymentMethod}`,
      items: cart.map((item) => ({
        item: item.name,
        sku: item.sku,
        qty: item.quantity,
        price: item.price,
        discount: '0%',
        tax: `${taxPercent}%`,
        total: item.price * item.quantity,
        customVal: '—',
      })),
      subtotal: subtotal,
      tax: taxAmount,
      grandTotal: grandTotal,
    }

    // Deduct stock permanently
    const currentProducts = getStoredProducts()
    const updatedProducts = currentProducts.map((p) => {
      const purchased = cart.find((item) => item.id === p.id)
      return purchased ? { ...p, stock: Math.max(0, p.stock - purchased.quantity) } : p
    })
    saveStoredProducts(updatedProducts)
    setProducts(updatedProducts)

    try {
      // Generate and download PDF using the template
      generateInvoicePDF(invoiceData, {
        download: true,
        filename: `invoice-${billNo}.pdf`,
      })

      setSuccessMessage({
        type: 'PDF Invoice Generated & Downloaded',
        billNo,
        total: grandTotal.toFixed(2),
        customer: selectedCustomer.name,
        itemsCount: cart.reduce((acc, i) => acc + i.quantity, 0),
      })
    } catch (error) {
      console.error('Export PDF Error:', error)
      setSuccessMessage({
        type: 'Error generating PDF',
        billNo,
        total: grandTotal.toFixed(2),
        customer: selectedCustomer.name,
        itemsCount: cart.reduce((acc, i) => acc + i.quantity, 0),
      })
    }
    clearCart()
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6 lg:p-8 flex flex-col font-sans select-none">
      {/* Top Header */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Billing Terminal
            <span className="text-xs px-2 py-0.5 rounded-full border border-white/30 text-white/80 font-normal">
              Register #01
            </span>
          </h1>
          <p className="text-xs text-white/70 mt-1">
            Fast checkout, product scanning, and invoice printing
          </p>
        </div>

        {/* Customer Selector & Quick-Add */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="text-[11px] text-white/60 font-medium uppercase tracking-wider mb-1">
              Select Customer
            </span>
            <div className="flex items-center gap-2">
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="h-10 px-3 rounded-xl bg-black border border-white/20 text-white text-sm focus:outline-none focus:border-white transition-colors cursor-pointer"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id} className="bg-black text-white">
                    {c.name} {c.phone !== 'N/A' ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(true)}
                title="Add Customer On-the-Fly"
                className="h-10 px-3 rounded-xl border border-white/20 bg-black hover:bg-white/10 text-white flex items-center gap-1.5 text-xs font-medium transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Split Layout: 65% Catalog / 35% Checkout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
        {/* LEFT PANEL: Catalog & Search (65% width => lg:col-span-8) */}
        <section className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
            <input
              type="text"
              placeholder="Search product by name, SKU or barcode..."
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

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`h-8 px-3.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                  selectedCategory === cat
                    ? 'bg-white text-black border-white font-semibold'
                    : 'bg-black text-white/80 border-white/20 hover:border-white/50 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredProducts.map((prod) => {
              const inCartItem = cart.find((i) => i.id === prod.id)
              const isOutOfStock = prod.stock <= 0

              return (
                <div
                  key={prod.id}
                  onClick={() => !isOutOfStock && addToCart(prod)}
                  className={`group relative flex flex-col justify-between p-3.5 rounded-xl border border-white/20 bg-black transition-all cursor-pointer select-none ${
                    isOutOfStock
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:border-white hover:bg-white/[0.04] active:scale-[0.98]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border border-white/20 text-white/70">
                        {prod.sku}
                      </span>
                      {inCartItem && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-black">
                          {inCartItem.quantity}x
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug">
                      {prod.name}
                    </h3>
                  </div>

                  <div className="mt-4 pt-2 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-white/60 block">Price</span>
                      <span className="text-base font-bold text-white">
                        ${prod.price.toFixed(2)}
                      </span>
                    </div>
                    <span className="text-[11px] text-white/60">
                      {isOutOfStock ? 'Out of stock' : `${prod.stock} in stock`}
                    </span>
                  </div>
                </div>
              )
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-16 text-center border border-dashed border-white/20 rounded-2xl">
                <Package className="h-10 w-10 text-white/40 mx-auto mb-2" />
                <p className="text-sm text-white/70 font-medium">No products found</p>
                <p className="text-xs text-white/50 mt-1">Try another search term or filter category</p>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT PANEL: Cart & Checkout (35% width => lg:col-span-4) */}
        <section className="lg:col-span-5 xl:col-span-4 rounded-2xl border border-white/20 bg-black p-4 md:p-5 flex flex-col justify-between">
          <div>
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/20">
              <div>
                <h2 className="text-base font-bold text-white">Current Cart</h2>
                <span className="text-xs text-white/70">
                  {cart.reduce((a, b) => a + b.quantity, 0)} items in ticket
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-white/70 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear
                </button>
              )}
            </div>

            {/* Selected Customer Card Preview */}
            <div className="my-3 p-2.5 rounded-xl border border-white/20 bg-white/[0.02] flex items-center justify-between text-xs">
              <div>
                <span className="text-white/60 block text-[10px] uppercase tracking-wider">
                  Customer
                </span>
                <span className="font-semibold text-white">{selectedCustomer.name}</span>
                {selectedCustomer.phone !== 'N/A' && (
                  <span className="text-white/60 block text-[11px]">{selectedCustomer.phone}</span>
                )}
              </div>
              <div className="text-right">
                <span className="text-white/60 block text-[10px] uppercase tracking-wider">
                  Tax ID / Points
                </span>
                <span className="text-white font-mono">{selectedCustomer.taxId}</span>
                <span className="text-white/70 block text-[10px]">
                  {selectedCustomer.points} pts
                </span>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="max-h-[260px] overflow-y-auto divide-y divide-white/10 pr-1 my-2">
              {cart.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-white truncate">{item.name}</h4>
                    <span className="text-[11px] text-white/60 font-mono">
                      ${item.price.toFixed(2)} each
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="h-6 w-6 rounded border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-semibold text-white">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="h-6 w-6 rounded border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="text-right min-w-[55px]">
                    <span className="text-xs font-bold text-white block">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="text-[10px] text-white/50 hover:text-white"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="py-10 text-center">
                  <p className="text-xs text-white/60">Cart is empty</p>
                  <p className="text-[11px] text-white/40 mt-0.5">Click any product to add</p>
                </div>
              )}
            </div>
          </div>

          {/* Cart Pricing Summary Engine */}
          <div className="pt-3 border-t border-white/20 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>Subtotal</span>
              <span className="font-mono text-white">${subtotal.toFixed(2)}</span>
            </div>

            {/* Discount Adjustment */}
            <div className="flex items-center justify-between text-xs text-white/70">
              <span className="flex items-center gap-1">Discount (%)</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                  className="w-12 h-6 px-1.5 text-right rounded border border-white/20 bg-black text-white text-xs focus:outline-none focus:border-white"
                />
                <span className="font-mono text-white">-${discountAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Tax Adjustment */}
            <div className="flex items-center justify-between text-xs text-white/70">
              <span className="flex items-center gap-1">Tax / GST (%)</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(Math.max(0, Number(e.target.value) || 0))}
                  className="w-12 h-6 px-1.5 text-right rounded border border-white/20 bg-black text-white text-xs focus:outline-none focus:border-white"
                />
                <span className="font-mono text-white">+${taxAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Grand Total */}
            <div className="flex items-center justify-between pt-2 border-t border-white/20 text-sm font-bold text-white">
              <span>Grand Total</span>
              <span className="text-xl font-mono">${grandTotal.toFixed(2)}</span>
            </div>

            {/* Payment Mode Selector */}
            <div className="mt-2">
              <span className="text-[11px] text-white/60 font-medium uppercase tracking-wider block mb-1.5">
                Payment Method
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'CASH', label: 'Cash', icon: Banknote },
                  { id: 'CARD', label: 'Card', icon: CreditCard },
                  { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                ].map((mode) => {
                  const ModeIcon = mode.icon
                  const isSelected = paymentMethod === mode.id
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setPaymentMethod(mode.id)}
                      className={`h-9 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                        isSelected
                          ? 'bg-white text-black border-white font-semibold'
                          : 'bg-black text-white/80 border-white/20 hover:border-white/50'
                      }`}
                    >
                      <ModeIcon className="h-3.5 w-3.5" />
                      {mode.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Cash Tendered & Change calculator (for Cash method) */}
            {paymentMethod === 'CASH' && (
              <div className="mt-1 p-2 rounded-lg border border-white/20 bg-white/[0.02] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-white/70">
                  <span>Tendered:</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-20 h-7 px-2 text-right rounded border border-white/20 bg-black text-white text-xs focus:outline-none focus:border-white"
                  />
                </div>
                <div className="text-right text-xs">
                  <span className="text-white/60 block text-[10px]">Change Due</span>
                  <span className="font-mono font-bold text-white">
                    ${changeDue.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Action Execution Triggers */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                type="button"
                onClick={handlePrintReceipt}
                disabled={cart.length === 0}
                className="h-11 rounded-xl bg-white text-black hover:bg-white/90 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              >
                <Printer className="h-4 w-4" />
                Create & Print
              </button>

              <button
                type="button"
                onClick={handleExportPDF}
                disabled={cart.length === 0}
                className="h-11 rounded-xl border border-white/30 bg-black text-white hover:bg-white/10 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FileDown className="h-4 w-4" />
                Export PDF
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Modal: Add Customer On-the-Fly */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-black p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/20">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-white" />
                Add Customer On-the-Fly
              </h3>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-white/60 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="mt-4 flex flex-col gap-3.5">
              <div>
                <label className="text-xs text-white/70 block mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-black border border-white/20 text-white text-sm focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs text-white/70 block mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-black border border-white/20 text-white text-sm focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs text-white/70 block mb-1">Tax ID / GST Number</label>
                <input
                  type="text"
                  placeholder="e.g. GST-90210"
                  value={newCustomerTaxId}
                  onChange={(e) => setNewCustomerTaxId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-black border border-white/20 text-white text-sm focus:outline-none focus:border-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/20 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="h-9 px-4 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-xl bg-white text-black font-semibold text-xs hover:bg-white/90"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Notification Modal */}
      {successMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-black p-6 shadow-2xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-black mb-3">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Transaction Completed!</h3>
            <p className="text-xs text-white/70 mb-4">{successMessage.type}</p>

            <div className="p-3 rounded-xl border border-white/20 bg-white/[0.02] text-xs text-left mb-5 flex flex-col gap-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-white/60">Bill Number:</span>
                <span className="text-white">{successMessage.billNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Customer:</span>
                <span className="text-white">{successMessage.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Total Items:</span>
                <span className="text-white">{successMessage.itemsCount}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-white/10">
                <span className="text-white">Amount Paid:</span>
                <span className="text-white">${successMessage.total}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="w-full h-10 rounded-xl bg-white text-black font-semibold text-xs hover:bg-white/90 transition-colors"
            >
              Start Next Sale
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
export { BillingTerminal }
