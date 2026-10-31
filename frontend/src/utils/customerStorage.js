const CUSTOMERS_STORAGE_KEY = 'webills_customers_database'

export const defaultCustomers = [
  {
    id: 'c1',
    name: 'Walk-in Customer',
    phone: 'N/A',
    email: 'walkin@store.local',
    address: 'Store Front Counter',
    taxId: 'N/A',
    totalSpent: 0,
    totalVisits: 1,
    notes: 'Default walk-in account',
    createdAt: '2026-01-01',
  },
  {
    id: 'c2',
    name: 'Sarah Jenkins',
    phone: '+1 (555) 234-5678',
    email: 'sarah.j@example.com',
    address: '742 Evergreen Terrace, Springfield',
    taxId: 'TX-99821',
    totalSpent: 1420.5,
    totalVisits: 18,
    notes: 'VIP customer, prefers paperless receipts',
    createdAt: '2026-03-12',
  },
  {
    id: 'c3',
    name: 'David Miller',
    phone: '+1 (555) 876-5432',
    email: 'david.miller@corporate.org',
    address: '100 Market St, Suite 400, San Francisco',
    taxId: 'TX-44109',
    totalSpent: 850.0,
    totalVisits: 8,
    notes: 'Requires tax breakdown on all invoices',
    createdAt: '2026-05-19',
  },
  {
    id: 'c4',
    name: 'Elena Rostova',
    phone: '+1 (555) 349-2104',
    email: 'elena.rostova@designworks.io',
    address: '55 Ocean Ave, Brooklyn, NY',
    taxId: 'TX-67290',
    totalSpent: 2340.25,
    totalVisits: 26,
    notes: 'Frequent coffee and bakery bulk orders',
    createdAt: '2026-02-04',
  },
]

export const getStoredCustomers = () => {
  try {
    const data = localStorage.getItem(CUSTOMERS_STORAGE_KEY)
    if (!data) {
      localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(defaultCustomers))
      return defaultCustomers
    }
    const parsed = JSON.parse(data)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultCustomers
  } catch {
    return defaultCustomers
  }
}

export const saveStoredCustomers = (customers) => {
  try {
    localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers))
    window.dispatchEvent(new Event('webills_customers_updated'))
  } catch (err) {
    console.error('Failed to save customers to database storage', err)
  }
}

let customerIdCounter = 100
export function createCustomerId() {
  customerIdCounter += 1
  return `cust_${customerIdCounter}_${Date.now()}`
}

export function getCurrentDateStr() {
  return new Date().toISOString().split('T')[0]
}
