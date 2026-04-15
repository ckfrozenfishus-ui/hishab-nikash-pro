import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

// Auth
export const exchangeSession = (session_id) => api.post('/auth/session', { session_id });
export const getMe = () => api.get('/auth/me');
export const logout = () => api.post('/auth/logout');

// Companies
export const getCompanies = () => api.get('/companies');
export const getCompany = (id) => api.get(`/companies/${id}`);

// Customers
export const getCustomers = (companyId) => api.get(`/companies/${companyId}/customers`);
export const createCustomer = (companyId, data) => api.post(`/companies/${companyId}/customers`, data);
export const getCustomer = (companyId, customerId) => api.get(`/companies/${companyId}/customers/${customerId}`);
export const updateCustomer = (companyId, customerId, data) => api.put(`/companies/${companyId}/customers/${customerId}`, data);

// Vendors
export const getVendors = (companyId) => api.get(`/companies/${companyId}/vendors`);
export const createVendor = (companyId, data) => api.post(`/companies/${companyId}/vendors`, data);
export const getVendor = (companyId, vendorId) => api.get(`/companies/${companyId}/vendors/${vendorId}`);
export const updateVendor = (companyId, vendorId, data) => api.put(`/companies/${companyId}/vendors/${vendorId}`, data);

// Invoices
export const getInvoices = (companyId, status) => {
  const params = status ? `?status=${status}` : '';
  return api.get(`/companies/${companyId}/invoices${params}`);
};
export const createInvoice = (companyId, data) => api.post(`/companies/${companyId}/invoices`, data);
export const getInvoice = (companyId, invoiceId) => api.get(`/companies/${companyId}/invoices/${invoiceId}`);
export const updateInvoice = (companyId, invoiceId, data) => api.put(`/companies/${companyId}/invoices/${invoiceId}`, data);
export const recordPayment = (companyId, invoiceId, data) => api.post(`/companies/${companyId}/invoices/${invoiceId}/payments`, data);

// Dashboard
export const getDashboard = (companyId) => api.get(`/companies/${companyId}/dashboard`);

// Seed
export const seedData = (companyId) => api.post(`/seed/${companyId}`);

// Expenses
export const getExpenses = (companyId, category) => {
  const params = category ? `?category=${category}` : '';
  return api.get(`/companies/${companyId}/expenses${params}`);
};
export const createExpense = (companyId, data) => api.post(`/companies/${companyId}/expenses`, data);
export const getExpense = (companyId, expenseId) => api.get(`/companies/${companyId}/expenses/${expenseId}`);

// Inventory
export const getInventory = (companyId, category) => {
  const params = category ? `?category=${category}` : '';
  return api.get(`/companies/${companyId}/inventory${params}`);
};
export const createInventoryItem = (companyId, data) => api.post(`/companies/${companyId}/inventory`, data);
export const getInventoryItem = (companyId, itemId) => api.get(`/companies/${companyId}/inventory/${itemId}`);
export const adjustStock = (companyId, itemId, data) => api.post(`/companies/${companyId}/inventory/${itemId}/adjust`, data);
export const getInventoryValuation = (companyId) => api.get(`/companies/${companyId}/inventory-valuation`);

// Accounts
export const getReceivables = (companyId) => api.get(`/companies/${companyId}/receivables`);
export const getPayables = (companyId) => api.get(`/companies/${companyId}/payables`);

// Products
export const getProducts = (companyId, category) => {
  const params = category ? `?category=${category}` : '';
  return api.get(`/companies/${companyId}/products${params}`);
};
export const createProduct = (companyId, data) => api.post(`/companies/${companyId}/products`, data);
export const getProduct = (companyId, productId) => api.get(`/companies/${companyId}/products/${productId}`);
export const updateProduct = (companyId, productId, data) => api.put(`/companies/${companyId}/products/${productId}`, data);
export const deleteProduct = (companyId, productId) => api.delete(`/companies/${companyId}/products/${productId}`);

// Alerts
export const sendLowStockAlert = (companyId) => api.post(`/companies/${companyId}/low-stock-alert`);
export const sendEmail = (data) => api.post('/send-email', data);
export const runDailyLowStockCheck = () => api.post('/scheduled/daily-low-stock-check');

// AI
export const aiChat = (data) => api.post('/ai/chat', data);
export const aiExtractInvoice = (formData) => api.post('/ai/extract-invoice', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getAiSessions = () => api.get('/ai/sessions');
export const getAiSessionMessages = (sessionId) => api.get(`/ai/sessions/${sessionId}`);

// Settings
export const getSettings = (companyId) => api.get(`/settings/${companyId}`);
export const updateSettings = (companyId, data) => api.put(`/settings/${companyId}`, data);
export const getTeamMembers = () => api.get('/team-members');
export const getPendingRegistrations = () => api.get('/pending-registrations');
export const approveMember = (requestId, data) => api.post(`/team-members/${requestId}/approve`, data);
export const rejectMember = (requestId) => api.post(`/team-members/${requestId}/reject`);
export const updateMemberRole = (memberId, data) => api.put(`/team-members/${memberId}/role`, data);

// CSV Import
export const importCustomersCSV = (companyId, formData) => api.post(`/companies/${companyId}/import/customers`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const importVendorsCSV = (companyId, formData) => api.post(`/companies/${companyId}/import/vendors`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const importProductsCSV = (companyId, formData) => api.post(`/companies/${companyId}/import/products`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// Reports
export const getProfitLoss = (companyId, startDate, endDate) => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return api.get(`/companies/${companyId}/reports/profit-loss${qs}`);
};
export const getSalesReport = (companyId, startDate, endDate) => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return api.get(`/companies/${companyId}/reports/sales${qs}`);
};
export const getExpenseReport = (companyId, startDate, endDate) => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return api.get(`/companies/${companyId}/reports/expenses${qs}`);
};

export default api;
