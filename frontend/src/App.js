import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CompanyProvider } from './contexts/CompanyContext';
import AuthCallback from './components/auth/AuthCallback';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import CompanySelection from './pages/CompanySelection';
import Dashboard from './pages/Dashboard';
import SalesList from './pages/SalesList';
import CreateInvoice from './pages/CreateInvoice';
import InvoiceDetail from './pages/InvoiceDetail';
import CustomersList from './pages/CustomersList';
import CustomerDetail from './pages/CustomerDetail';
import VendorsList from './pages/VendorsList';
import VendorDetail from './pages/VendorDetail';
import './App.css';

function AppRouter() {
  const location = useLocation();

  // CRITICAL: Check URL fragment for session_id synchronously during render
  // This prevents race conditions by processing new session_id FIRST
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/select-company" element={
        <ProtectedRoute requireCompany={false}><CompanySelection /></ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/sales" element={
        <ProtectedRoute><SalesList /></ProtectedRoute>
      } />
      <Route path="/sales/new" element={
        <ProtectedRoute><CreateInvoice /></ProtectedRoute>
      } />
      <Route path="/sales/:invoiceId" element={
        <ProtectedRoute><InvoiceDetail /></ProtectedRoute>
      } />
      <Route path="/customers" element={
        <ProtectedRoute><CustomersList /></ProtectedRoute>
      } />
      <Route path="/customers/:customerId" element={
        <ProtectedRoute><CustomerDetail /></ProtectedRoute>
      } />
      <Route path="/vendors" element={
        <ProtectedRoute><VendorsList /></ProtectedRoute>
      } />
      <Route path="/vendors/:vendorId" element={
        <ProtectedRoute><VendorDetail /></ProtectedRoute>
      } />
      {/* Placeholder routes for Phase 2/3 */}
      <Route path="/expenses" element={<ProtectedRoute><PlaceholderPage title="Expenses" desc="Expense tracking and management — Coming in Phase 2" /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><PlaceholderPage title="Inventory" desc="Inventory management for wholesale distribution — Coming in Phase 2" /></ProtectedRoute>} />
      <Route path="/receivables" element={<ProtectedRoute><PlaceholderPage title="Accounts Receivable" desc="Customer balance tracking and aging — Coming in Phase 2" /></ProtectedRoute>} />
      <Route path="/payables" element={<ProtectedRoute><PlaceholderPage title="Accounts Payable" desc="Vendor payment tracking and scheduling — Coming in Phase 2" /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><PlaceholderPage title="Reports" desc="Financial reports and analytics — Coming in Phase 2" /></ProtectedRoute>} />
      <Route path="/ai-assistant" element={<ProtectedRoute><PlaceholderPage title="AI Assistant" desc="Business intelligence copilot powered by GPT — Coming in Phase 3" /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><PlaceholderPage title="Settings" desc="Company settings, user roles, and configuration — Coming in Phase 3" /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function PlaceholderPage({ title, desc }) {
  const AppShell = require('./components/layout/AppShell').default;
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: '#F2F4F6' }}>
          <div className="w-8 h-8 rounded-lg" style={{ background: 'linear-gradient(135deg, #0037B0, #1D4ED8)', opacity: 0.3 }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Manrope, sans-serif', color: '#191C1E' }}>{title}</h2>
        <p className="text-sm text-center max-w-md" style={{ color: '#434655' }}>{desc}</p>
      </div>
    </AppShell>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CompanyProvider>
          <AppRouter />
        </CompanyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
