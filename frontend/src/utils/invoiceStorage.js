const INVOICES_STORAGE_KEY = 'webills_customer_invoices_database'

export const defaultCustomerInvoices = [
  // Sarah Jenkins (c2)
  {
    billNo: 'INV-2026-0891',
    customerId: 'c2',
    date: '2026-10-31',
    time: '10:45 AM',
    itemsCount: 3,
    items: [
      { name: 'Premium Coffee Beans', sku: 'BEV-001', qty: 2, price: 18.5, total: 37.0 },
      { name: 'Artisan Sourdough Loaf', sku: 'BAK-001', qty: 1, price: 6.2, total: 6.2 },
    ],
    subtotal: 43.2,
    tax: 3.67,
    discount: 0,
    grandTotal: 46.87,
    paymentMethod: 'CARD',
    cashier: 'Adarsh Deshmukh',
    status: 'PAID',
  },
  {
    billNo: 'INV-2026-0742',
    customerId: 'c2',
    date: '2026-10-24',
    time: '04:15 PM',
    itemsCount: 5,
    items: [
      { name: 'Extra Virgin Olive Oil', sku: 'GRO-001', qty: 2, price: 14.99, total: 29.98 },
      { name: 'Dark Chocolate 85%', sku: 'SNK-001', qty: 3, price: 5.25, total: 15.75 },
    ],
    subtotal: 45.73,
    tax: 3.89,
    discount: 5.0,
    grandTotal: 44.62,
    paymentMethod: 'UPI',
    cashier: 'Adarsh Deshmukh',
    status: 'PAID',
  },
  {
    billNo: 'INV-2026-0610',
    customerId: 'c2',
    date: '2026-10-15',
    time: '11:20 AM',
    itemsCount: 1,
    items: [
      { name: 'Wireless Barcode Scanner', sku: 'ELE-001', qty: 1, price: 49.0, total: 49.0 },
    ],
    subtotal: 49.0,
    tax: 4.17,
    discount: 0,
    grandTotal: 53.17,
    paymentMethod: 'CASH',
    cashier: 'Adarsh Deshmukh',
    status: 'PAID',
  },

  // Elena Rostova (c4)
  {
    billNo: 'INV-2026-0850',
    customerId: 'c4',
    date: '2026-10-29',
    time: '02:30 PM',
    itemsCount: 8,
    items: [
      { name: 'Organic Almond Milk', sku: 'BEV-002', qty: 4, price: 4.75, total: 19.0 },
      { name: 'Croissant Butter Fresh', sku: 'BAK-002', qty: 4, price: 3.5, total: 14.0 },
    ],
    subtotal: 33.0,
    tax: 2.81,
    discount: 0,
    grandTotal: 35.81,
    paymentMethod: 'CARD',
    cashier: 'Adarsh Deshmukh',
    status: 'PAID',
  },
  {
    billNo: 'INV-2026-0711',
    customerId: 'c4',
    date: '2026-10-18',
    time: '09:05 AM',
    itemsCount: 12,
    items: [
      { name: 'Premium Coffee Beans', sku: 'BEV-001', qty: 6, price: 18.5, total: 111.0 },
    ],
    subtotal: 111.0,
    tax: 9.44,
    discount: 10.0,
    grandTotal: 110.44,
    paymentMethod: 'UPI',
    cashier: 'Adarsh Deshmukh',
    status: 'PAID',
  },

  // David Miller (c3)
  {
    billNo: 'INV-2026-0795',
    customerId: 'c3',
    date: '2026-10-22',
    time: '01:10 PM',
    itemsCount: 4,
    items: [
      { name: 'Receipt Thermal Paper Roll (5pk)', sku: 'ACC-001', qty: 3, price: 12.0, total: 36.0 },
      { name: 'Himalayan Pink Salt 500g', sku: 'GRO-002', qty: 1, price: 3.8, total: 3.8 },
    ],
    subtotal: 39.8,
    tax: 3.38,
    discount: 0,
    grandTotal: 43.18,
    paymentMethod: 'CASH',
    cashier: 'Adarsh Deshmukh',
    status: 'PAID',
  },
]

export const getStoredCustomerInvoices = () => {
  try {
    const data = localStorage.getItem(INVOICES_STORAGE_KEY)
    if (!data) {
      localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(defaultCustomerInvoices))
      return defaultCustomerInvoices
    }
    const parsed = JSON.parse(data)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultCustomerInvoices
  } catch {
    return defaultCustomerInvoices
  }
}

export const saveStoredCustomerInvoices = (invoices) => {
  try {
    localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices))
    window.dispatchEvent(new Event('webills_invoices_updated'))
  } catch (err) {
    console.error('Failed to save customer invoices to storage', err)
  }
}
