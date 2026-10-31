import { useState } from 'react'
import {
    ShoppingBag,
    PackagePlus,
    Users,
    UserCheck,
    ListFilter,
    FileText,
    Palette,
    ChevronLeft,
    ChevronRight,
    ReceiptText,
} from 'lucide-react'

const navItems = [
    {
        id: 'billing',
        label: 'Billing Terminal',
        icon: ShoppingBag,
    },
    {
        id: 'inventory',
        label: 'Items & Inventory',
        icon: PackagePlus,
    },
    {
        id: 'customers',
        label: 'Customers',
        icon: Users,
    },
    {
        id: 'customer-history',
        label: 'Customer History',
        icon: UserCheck,
    },
    {
        id: 'billed-items',
        label: 'Billed Items Log',
        icon: ListFilter,
    },
    {
        id: 'billing-logs',
        label: 'Master Billing Logs',
        icon: FileText,
    },
    {
        id: 'pdf-customizer',
        label: 'PDF Customizer',
        icon: Palette,
    },
]

export default function Sidebar({
    activeTab = 'billing',
    onSelectTab,
    isCollapsed: controlledCollapsed,
    onToggleCollapse,
}) {
    const [internalCollapsed, setInternalCollapsed] = useState(false)
    const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed

    const handleToggle = () => {
        if (onToggleCollapse) {
            onToggleCollapse(!isCollapsed)
        } else {
            setInternalCollapsed(!isCollapsed)
        }
    }

    return (
        <aside
            className={`fixed top-4 left-4 bottom-4 z-40 flex flex-col justify-between rounded-2xl border border-white/20 bg-black p-3.5 transition-all duration-300 ease-in-out select-none ${
                isCollapsed ? 'w-[72px]' : 'w-[260px]'
            }`}
            aria-label="Sidebar navigation"
        >
            {/* Top Branding Header */}
            <div>
                <div
                    className={`flex items-center gap-3 px-2 py-2.5 mb-5 rounded-xl border border-transparent ${
                        isCollapsed ? 'justify-center px-0' : ''
                    }`}
                >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-black">
                        <ReceiptText className="h-5 w-5" />
                    </div>

                    {!isCollapsed && (
                        <div className="flex flex-col min-w-0 overflow-hidden leading-tight animate-in fade-in duration-200">
                            <span className="truncate text-base font-bold tracking-tight text-white">
                                WeBills
                            </span>
                            <span className="truncate text-xs font-normal text-white/70">
                                POS & Invoicing
                            </span>
                        </div>
                    )}
                </div>

                {/* Navigation Items List */}
                <nav className="flex flex-col gap-1.5" role="menu">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = activeTab === item.id

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => onSelectTab && onSelectTab(item.id)}
                                title={isCollapsed ? item.label : undefined}
                                className={`group relative flex items-center rounded-xl font-medium transition-all duration-200 outline-none ${
                                    isCollapsed
                                        ? 'h-11 w-11 justify-center mx-auto'
                                        : 'h-11 w-full gap-3 px-3'
                                } ${
                                    isActive
                                        ? 'bg-white text-black font-semibold'
                                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                                }`}
                                role="menuitem"
                            >
                                <Icon
                                    className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                                        isActive ? 'text-black' : 'text-white/80 group-hover:text-white'
                                    }`}
                                />

                                {!isCollapsed && (
                                    <span className="truncate text-sm tracking-normal">
                                        {item.label}
                                    </span>
                                )}

                                {/* Collapsed Hover Tooltip */}
                                {isCollapsed && (
                                    <span className="pointer-events-none absolute left-full ml-3.5 hidden whitespace-nowrap rounded-lg border border-white/20 bg-black px-2.5 py-1.5 text-xs font-medium text-white shadow-2xl group-hover:block z-50">
                                        {item.label}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </nav>
            </div>

            {/* Bottom Section: User Profile & Collapse/Expand Button */}
            <div className="pt-3 border-t border-white/20 flex flex-col gap-2">
                {/* User Avatar & Name */}
                <div
                    className={`flex items-center rounded-xl p-1.5 transition-colors ${
                        isCollapsed ? 'justify-center' : 'gap-3'
                    }`}
                    title={isCollapsed ? 'Adarsh Deshmukh' : undefined}
                >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black font-semibold text-xs border border-white/40 shadow-sm">
                        AD
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col min-w-0 overflow-hidden leading-tight animate-in fade-in duration-200">
                            <span className="truncate text-sm font-medium text-white">
                                Adarsh Deshmukh
                            </span>
                            <span className="truncate text-xs text-white/70">
                                Cashier / Admin
                            </span>
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={handleToggle}
                    title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    className={`flex h-10 items-center rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200 outline-none ${
                        isCollapsed ? 'w-10 justify-center mx-auto' : 'w-full gap-3 px-3'
                    }`}
                    aria-expanded={!isCollapsed}
                >
                    {isCollapsed ? (
                        <ChevronRight className="h-5 w-5 shrink-0" />
                    ) : (
                        <>
                            <ChevronLeft className="h-5 w-5 shrink-0" />
                            <span className="truncate text-xs font-medium uppercase tracking-wider text-white/70">
                                Collapse
                            </span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    )
}
export { Sidebar }
