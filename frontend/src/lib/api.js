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

export default api;
