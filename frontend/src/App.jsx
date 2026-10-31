import { useState } from 'react'
import Sidebar from './components/sidebar'
import BillingTerminal from './pages/billingTerminal'
import ItemManagement from './pages/itemManagement'
import CustomerManagement from './pages/customerManagement'
import CustomerHistory from './pages/customerHistory'
import PdfCustomiser from './pages/pdfCustomiser'

function App() {
  const [activeTab, setActiveTab] = useState('billing')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [selectedCustomerIdForHistory, setSelectedCustomerIdForHistory] = useState(null)

  const handleNavigateToCustomerHistory = (customerId) => {
    setSelectedCustomerIdForHistory(customerId)
    setActiveTab('customer-history')
  }

  const handleSelectCustomerForBilling = () => {
    setActiveTab('billing')
  }

  return (
    <div className="min-h-screen bg-black text-white flex overflow-x-hidden">
      {/* Floating Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isCollapsed={isCollapsed}
        onToggleCollapse={setIsCollapsed}
      />

      {/* Responsive Main Content Layout adjusting dynamically to Collapsed vs Open Sidebar */}
      <main
        className={`flex-1 min-w-0 transition-all duration-300 ease-in-out p-4 md:p-6 lg:p-8 ${
          isCollapsed
            ? 'pl-[96px] md:pl-[104px]'
            : 'pl-[96px] md:pl-[292px]'
        }`}
      >
        <div className="w-full max-w-[1600px] mx-auto">
          {activeTab === 'billing' && <BillingTerminal />}
          {activeTab === 'inventory' && <ItemManagement />}
          {activeTab === 'customers' && (
            <CustomerManagement
              onSelectCustomerForBilling={handleSelectCustomerForBilling}
              onNavigateToHistory={handleNavigateToCustomerHistory}
            />
          )}
          {activeTab === 'customer-history' && (
            <CustomerHistory selectedCustomerIdProp={selectedCustomerIdForHistory} />
          )}
          {activeTab === 'pdf-customizer' && <PdfCustomiser />}
          {activeTab !== 'billing' &&
            activeTab !== 'inventory' &&
            activeTab !== 'customers' &&
            activeTab !== 'customer-history' &&
            activeTab !== 'pdf-customizer' && (
              <div className="p-8 text-center border border-white/20 rounded-2xl bg-black my-8">
                <h2 className="text-xl font-bold text-white mb-2 capitalize">
                  {activeTab.replace('-', ' ')}
                </h2>
                <p className="text-sm text-white/60">Module view coming up next.</p>
              </div>
            )}
        </div>
      </main>
    </div>
  )
}

export default App
