import { useParams, useNavigate } from 'react-router-dom';
import { useCompany } from '../contexts/CompanyContext';
import { useEffect, useState } from 'react';
import { getInvoice } from '../lib/api';
import { Printer, ArrowLeft } from '@phosphor-icons/react';
import AppShell from '../components/layout/AppShell';

const COMPANY_INFO = {
  ckfrozen: { name: 'C.K FROZEN FISH & FOOD INC', address: '168-56 Douglas Ave, Jamaica, NY-11433', phone: '718-297-2578', fax: '718-297-2842', email: 'CKFFFUSA@OUTLOOK.COM', website: 'CKFROZENFISHUS.COM' },
  haor: { name: 'HAOR HERITAGE INC.', address: '168-56 Douglas Ave, Jamaica, NY-11433', phone: '718-297-2578', fax: '718-297-2842', email: 'info@haorheritage.com', website: 'haorheritage.com' },
  deshi: { name: 'DESHI DISTRIBUTORS LLC', address: '168-56 Douglas Ave, Jamaica, NY-11433', phone: '718-297-2578', fax: '718-297-2842', email: 'info@deshidist.com', website: 'deshidist.com' },
  ckcanada: { name: 'CK FROZEN FISH & FOOD CANADA INC.', address: 'Toronto, ON, Canada', phone: '416-555-0100', fax: '416-555-0101', email: 'info@ckcanada.com', website: 'ckcanada.com' },
};

export default function InvoicePrint() {
  const { invoiceId } = useParams();
  const { selectedCompany } = useCompany();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedCompany || !invoiceId) return;
    getInvoice(selectedCompany.company_id, invoiceId)
      .then(res => setInvoice(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCompany, invoiceId]);

  const handlePrint = () => window.print();

  if (loading) return <AppShell><div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#0037B0', borderTopColor: 'transparent' }} /></div></AppShell>;
  if (!invoice) return <AppShell><div className="text-center py-12" style={{ color: '#434655' }}>Invoice not found</div></AppShell>;

  const info = COMPANY_INFO[selectedCompany?.company_id] || COMPANY_INFO.ckfrozen;

  return (
    <AppShell>
      <div data-testid="invoice-print-page">
        {/* Actions bar - hidden on print */}
        <div className="flex items-center justify-between mb-6 no-print">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(`/sales/${invoiceId}`)} className="p-2 rounded-lg hover:bg-white transition-colors" style={{ color: '#434655' }}><ArrowLeft size={20} /></button>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: '#191C1E' }}>Print Invoice</h1>
          </div>
          <button data-testid="print-btn" onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #0037B0, #1D4ED8)' }}>
            <Printer size={16} /> Print
          </button>
        </div>

        {/* Invoice template - A4 layout */}
        <div id="invoice-print-area" className="mx-auto" style={{ width: '210mm', minHeight: '297mm', background: '#FFFFFF', padding: '12mm 15mm', fontFamily: 'Inter, Arial, sans-serif', fontSize: '11px', color: '#191C1E', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>

          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            {/* Left - Company Info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'linear-gradient(135deg, #0037B0, #1D4ED8)', color: 'white', fontWeight: 'bold', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>CK</div>
                <div>
                  <h1 style={{ margin: 0, fontFamily: 'Manrope, sans-serif', fontSize: '16px', fontWeight: 800, letterSpacing: '0.5px', color: '#191C1E' }}>{info.name}</h1>
                </div>
              </div>
              <div style={{ fontSize: '10px', color: '#434655', lineHeight: '1.6', paddingLeft: '54px' }}>
                <div>{info.address}</div>
                <div>PH: {info.phone}, FAX: {info.fax}</div>
                <div>EMAIL: {info.email}</div>
                <div>WEBSITE: {info.website}</div>
              </div>
            </div>

            {/* Right - Invoice Meta */}
            <div style={{ textAlign: 'right' }}>
              <table style={{ borderCollapse: 'collapse', marginLeft: 'auto' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 12px', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#434655', borderBottom: '1px solid #E6E8EA' }}>Date</td>
                    <td style={{ padding: '4px 12px', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#434655', borderBottom: '1px solid #E6E8EA' }}>Invoice #</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 12px', fontWeight: 600, fontSize: '12px', color: '#191C1E' }}>{invoice.invoice_date}</td>
                    <td style={{ padding: '6px 12px', fontWeight: 600, fontSize: '12px', color: '#191C1E' }}>{invoice.invoice_number}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: '8px' }}>
                <table style={{ borderCollapse: 'collapse', marginLeft: 'auto' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '3px 12px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#434655' }}>Delivered by:</td>
                      <td style={{ padding: '3px 12px', fontSize: '10px', color: '#191C1E' }}></td>
                    </tr>
                    <tr>
                      <td style={{ padding: '3px 12px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', color: '#FFFFFF', background: '#0037B0', letterSpacing: '0.5px' }}>Sales Rep</td>
                      <td style={{ padding: '3px 12px', fontSize: '11px', fontWeight: 600, color: '#191C1E' }}>{invoice.sales_rep || ''}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* BILLING ADDRESS */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ border: '1px solid #C4C5D7', borderRadius: '6px', padding: '10px 14px', maxWidth: '280px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#434655', marginBottom: '6px', borderBottom: '1px solid #E6E8EA', paddingBottom: '4px' }}>
                Shipping & Billing Address
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#191C1E', lineHeight: '1.5' }}>
                {invoice.customer_name || 'Customer Name'}
              </div>
            </div>
          </div>

          {/* ITEMS TABLE */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ borderTop: '2px solid #191C1E', borderBottom: '2px solid #191C1E' }}>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#191C1E', width: '50px' }}>QTY</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#191C1E', width: '160px' }}>Items</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#191C1E' }}>Description</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#191C1E', width: '90px' }}>Unit Price</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#191C1E', width: '100px' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #E6E8EA' }}>
                  <td style={{ padding: '7px 10px', textAlign: 'center', fontSize: '11px', color: '#191C1E' }}>{item.quantity}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#191C1E', textTransform: 'uppercase' }}>{item.product}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'left', fontSize: '10px', color: '#434655' }}>{item.description}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', fontSize: '11px', fontFamily: 'Manrope, monospace', color: '#191C1E' }}>{(item.rate || 0).toFixed(3)}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', fontSize: '11px', fontFamily: 'Manrope, monospace', fontWeight: 600, color: '#191C1E' }}>{(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
              {/* Empty rows to fill space */}
              {Array.from({ length: Math.max(0, 12 - (invoice.items || []).length) }).map((_, i) => (
                <tr key={`empty-${i}`} style={{ borderBottom: '1px solid #F2F4F6' }}>
                  <td style={{ padding: '7px 10px', height: '24px' }}>&nbsp;</td>
                  <td style={{ padding: '7px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '7px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '7px 10px' }}>&nbsp;</td>
                  <td style={{ padding: '7px 10px' }}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* FOOTER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
            {/* Left - Terms */}
            <div style={{ maxWidth: '320px' }}>
              <div style={{ border: '1px solid #C4C5D7', borderRadius: '6px', padding: '10px', marginBottom: '12px', fontSize: '10px', lineHeight: '1.6', color: '#434655' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '11px', color: '#191C1E' }}>We Accept all Major Credit Cards</p>
                <p style={{ margin: 0, fontStyle: 'italic', fontSize: '9px' }}>There will be 3% transaction fee</p>
              </div>
              <div style={{ fontSize: '9px', lineHeight: '1.6', color: '#434655' }}>
                <p style={{ margin: '0 0 2px' }}>* IN EVERY RETURN CHECKS, THERE WILL BE A $30.00 FEE</p>
                <p style={{ margin: '0 0 2px' }}>* NO CLAIMS WILL BE ACCEPTED AFTER 48 HOURS OF DELIVERY</p>
                <p style={{ margin: '0 0 2px' }}>* NO RETURN ACCEPTED FOR OPEN BOX & CUT FISHES</p>
                <p style={{ margin: 0 }}>* ALL PAYMENTS MUST BE PAID WITHIN 14 DAYS AFTER DELIVERY</p>
              </div>
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: 800, color: '#BA1A1A', margin: 0 }}>THANK YOU FOR YOUR BUSINESS</p>
              </div>
            </div>

            {/* Right - Totals */}
            <div style={{ minWidth: '240px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '2px solid #191C1E' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, fontSize: '13px', fontFamily: 'Manrope, sans-serif', color: '#191C1E' }}>TOTAL</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, fontSize: '14px', fontFamily: 'Manrope, monospace', color: '#191C1E' }}>
                      ${(invoice.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E6E8EA' }}>
                    <td style={{ padding: '6px 12px', fontSize: '11px', color: '#434655' }}>Payments/Credits</td>
                    <td style={{ padding: '6px 12px', textAlign: 'right', fontSize: '11px', fontFamily: 'Manrope, monospace', color: '#191C1E' }}>
                      ${(invoice.amount_paid || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '2px solid #191C1E' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: '#191C1E' }}>Balance Due</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, fontSize: '14px', fontFamily: 'Manrope, monospace', color: '#BA1A1A' }}>
                      ${(invoice.balance_due || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '24px', borderTop: '1px solid #C4C5D7' }}>
                <p style={{ fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#434655', margin: 0 }}>Customer Signature</p>
              </div>
            </div>
          </div>
        </div>

        {/* Print-specific styles */}
        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; margin: 0; padding: 0; }
            #invoice-print-area { box-shadow: none !important; margin: 0 !important; width: 100% !important; padding: 8mm 12mm !important; }
            aside, header, nav { display: none !important; }
            main { margin: 0 !important; padding: 0 !important; }
            .ml-64 { margin-left: 0 !important; }
          }
        `}</style>
      </div>
    </AppShell>
  );
}
