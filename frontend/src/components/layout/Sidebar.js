import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import {
  House, ShoppingCart, Users, Truck, Receipt, Package,
  CurrencyDollar, Wallet, ChartBar, Robot, Gear,
  Plus, Headset, SignOut, CaretLeft, CaretRight, Tag
} from '@phosphor-icons/react';
import { useState } from 'react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: House },
  { path: '/sales', label: 'Sales', icon: ShoppingCart },
  { path: '/estimates', label: 'Estimates', icon: Receipt },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/vendors', label: 'Vendors', icon: Truck },
  { path: '/products', label: 'Products', icon: Tag },
  { path: '/expenses', label: 'Expenses', icon: Receipt },
  { path: '/bills', label: 'Bills', icon: Wallet },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/receive-stock', label: 'Receive Stock', icon: Package },
  { path: '/receivables', label: 'Accounts Receivable', icon: CurrencyDollar },
  { path: '/payables', label: 'Accounts Payable', icon: Wallet },
  { path: '/chart-of-accounts', label: 'Chart of Accounts', icon: ChartBar },
  { path: '/journal-entries', label: 'Journal Entries', icon: Receipt },
  { path: '/general-ledger', label: 'General Ledger', icon: ChartBar },
  { path: '/trial-balance', label: 'Trial Balance', icon: ChartBar },
  { path: '/reports', label: 'Reports', icon: ChartBar },
  { path: '/ai-assistant', label: 'AI Assistant', icon: Robot },
  { path: '/settings', label: 'Settings', icon: Gear },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const { clearCompany } = useCompany();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    clearCompany();
    await logout();
  };

  return (
    <aside
      data-testid="app-sidebar"
      className={`fixed inset-y-0 left-0 z-50 flex flex-col justify-between transition-all duration-200 ${collapsed ? 'w-[68px]' : 'w-64'}`}
      style={{ background: '#F2F4F6' }}
    >
      {/* Logo area */}
      <div>
        <div className="flex items-center justify-between h-16 px-4" style={{ borderBottom: '1px solid #E6E8EA' }}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #0037B0, #1D4ED8)' }}>
                HN
              </div>
              <span className="font-semibold text-sm" style={{ fontFamily: 'Manrope, sans-serif', color: '#191C1E' }}>
                Hishab Nikash
              </span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm mx-auto" style={{ background: 'linear-gradient(135deg, #0037B0, #1D4ED8)' }}>
              HN
            </div>
          )}
          <button
            data-testid="sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-[#E6E8EA] transition-colors"
            style={{ color: '#434655' }}
          >
            {collapsed ? <CaretRight size={16} /> : <CaretLeft size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-0.5 px-2 py-3">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
            return (
              <NavLink
                key={path}
                to={path}
                data-testid={`nav-${path.replace('/', '')}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${collapsed ? 'justify-center' : ''}`}
                style={{
                  background: isActive ? '#FFFFFF' : 'transparent',
                  color: isActive ? '#0037B0' : '#434655',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                }}
                title={collapsed ? label : undefined}
              >
                <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom actions */}
      <div className="px-2 pb-4 flex flex-col gap-1">
        <NavLink
          to="/sales/new"
          data-testid="nav-new-transaction"
          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-white transition-all ${collapsed ? 'justify-center' : ''}`}
          style={{ background: 'linear-gradient(135deg, #0037B0, #1D4ED8)' }}
        >
          <Plus size={18} weight="bold" />
          {!collapsed && <span>New Transaction</span>}
        </NavLink>
        <button
          data-testid="nav-support"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[#E6E8EA] ${collapsed ? 'justify-center' : ''}`}
          style={{ color: '#434655' }}
        >
          <Headset size={18} />
          {!collapsed && <span>Support</span>}
        </button>
        <button
          data-testid="nav-logout"
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[#E6E8EA] ${collapsed ? 'justify-center' : ''}`}
          style={{ color: '#BA1A1A' }}
        >
          <SignOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
        {!collapsed && (
          <div className="mt-2 px-3 text-[10px] text-center" style={{ color: '#434655', opacity: 0.6 }}>
            Hishab Nikash Pro — Powered by iAlam
          </div>
        )}
      </div>
    </aside>
  );
}
