# Hishab Nikash Pro - Product Requirements Document

## Original Problem Statement
Build a real, production-style, multi-company accounting and operations web application named Hishab Nikash Pro for a business group. Replace QuickBooks for daily use in wholesale import, distribution, frozen food, and retail business environment.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI + Recharts
- **Backend**: FastAPI (Python) + Motor (async MongoDB)
- **Database**: MongoDB
- **Auth**: Emergent-managed Google OAuth
- **Design System**: Custom (#0037B0 primary, Manrope + Inter fonts)

## User Personas
- **Owner**: Full dashboard access, all modules, reports, AI assistant
- **Accountant**: Invoicing, AR/AP, expenses, reports
- **Sales**: Sales module, customers, invoicing
- **Warehouse**: Inventory management
- **Viewer**: Read-only access

## Core Requirements
- Multi-company support (4 companies)
- Sales & invoicing with full lifecycle
- Customer management with balance tracking
- Vendor management with payable tracking
- Dashboard with KPIs, charts, aging
- Inventory tracking (Phase 2)
- Financial reports (Phase 2)
- AI Assistant (Phase 3)

## What's Been Implemented (Phase 1 - April 14, 2026)
- [x] Login page with Emergent Google OAuth
- [x] Company selection (4 companies)
- [x] App shell (sidebar + header + company switcher)
- [x] Dashboard with KPIs, sales trend chart, aging, top customers/vendors
- [x] Sales list with filters, search, status badges
- [x] Create Invoice with line items, auto-calculation
- [x] Invoice Detail with payment recording, mark paid, cancel
- [x] Customers list with create modal, search
- [x] Customer Detail with profile, financial summary, invoices
- [x] Vendors list with create modal, search
- [x] Vendor Detail with purchasing summary
- [x] Seed data with realistic wholesale frozen food data
- [x] All backend CRUD APIs with auth protection

## Prioritized Backlog

### P0 (Phase 2 - Next)
- Expenses module (list, create, record payment)
- Inventory module (list, detail, valuation, stock adjustment)
- Accounts Receivable (aging buckets, collection priority)
- Accounts Payable (due bills, payment schedule)
- Reports Hub + P&L, Sales Report, Expense Report

### P1 (Phase 3)
- AI Assistant (GPT-5.2 powered business copilot)
- Settings/Admin (company settings, user roles, tax settings)
- Print templates (Invoice, Packing List, Customer Statement)
- Email service for invoice sending

### P2 (Future)
- Balance Sheet report
- Cash Flow report
- Inventory reports
- Tax reports
- Advanced workflow polish
- Mobile responsive improvements
