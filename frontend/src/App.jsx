import { useState } from 'react'
import Sidebar from './components/sidebar'
import BillingTerminal from './pages/billingTerminal'
import ItemManagement from './pages/itemManagement'
import CustomerManagement from './pages/customerManagement'
import CustomerHistory from './pages/customerHistory'
import PdfCustomiser from './pages/pdfCustomiser'
import BilledItemsLog from './pages/billedItemsLog'
import MasterBillingLogs from './pages/masterBillingLogs'

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
      {/* Sidebar geometry: left-4 (16px) + width + 16px gap
           Collapsed : 16 + 72  + 16 = 104px
           Expanded  : 16 + 260 + 16 = 292px
           pl-[292px] has NO breakpoint prefix — sidebar is always 260px wide when expanded */}
      <main
        className={`flex-1 min-w-0 transition-all duration-300 ease-in-out pt-4 pr-4 pb-4 md:pt-6 md:pr-6 md:pb-6 lg:pt-8 lg:pr-8 lg:pb-8 ${
          isCollapsed
            ? 'pl-[104px]'
            : 'pl-[292px]'
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
          {activeTab === 'billed-items' && <BilledItemsLog />}
          {activeTab === 'billing-logs' && <MasterBillingLogs />}
          {activeTab === 'pdf-customizer' && <PdfCustomiser />}
        </div>
      </main>
    </div>
  )
}

export default App
