const STORAGE_KEY = 'webills_inventory_products'

export const defaultProducts = [
  { id: 'p1', name: 'Premium Coffee Beans', sku: 'BEV-001', category: 'Beverages', price: 18.5, stock: 45 },
  { id: 'p2', name: 'Organic Almond Milk', sku: 'BEV-002', category: 'Beverages', price: 4.75, stock: 28 },
  { id: 'p3', name: 'Artisan Sourdough Loaf', sku: 'BAK-001', category: 'Bakery', price: 6.2, stock: 15 },
  { id: 'p4', name: 'Croissant Butter Fresh', sku: 'BAK-002', category: 'Bakery', price: 3.5, stock: 32 },
  { id: 'p5', name: 'Extra Virgin Olive Oil', sku: 'GRO-001', category: 'Groceries', price: 14.99, stock: 20 },
  { id: 'p6', name: 'Dark Chocolate 85%', sku: 'SNK-001', category: 'Snacks', price: 5.25, stock: 60 },
  { id: 'p7', name: 'Organic Green Tea (50 bags)', sku: 'BEV-003', category: 'Beverages', price: 9.9, stock: 35 },
  { id: 'p8', name: 'Himalayan Pink Salt 500g', sku: 'GRO-002', category: 'Groceries', price: 3.8, stock: 50 },
  { id: 'p9', name: 'Wireless Barcode Scanner', sku: 'ELE-001', category: 'Electronics', price: 49.0, stock: 8 },
  { id: 'p10', name: 'Receipt Thermal Paper Roll (5pk)', sku: 'ACC-001', category: 'Accessories', price: 12.0, stock: 40 },
]

export const getStoredProducts = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProducts))
      return defaultProducts
    }
    const parsed = JSON.parse(data)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultProducts
  } catch {
    return defaultProducts
  }
}

export const saveStoredProducts = (products) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
    // Trigger storage event for same-tab reactivity
    window.dispatchEvent(new Event('webills_products_updated'))
  } catch (err) {
    console.error('Failed to save products to localStorage', err)
  }
}
